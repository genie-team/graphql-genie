import { ApolloClient } from 'apollo-client';
import { GraphQLSchema, execute, subscribe } from 'graphql';
import { PubSub } from 'graphql-subscriptions';
import gql from 'graphql-tag';
import subscriptionPlugin from '../../subscriptionPlugin/subscriptions';
import { genie, getClient } from '../setupTests';

let client: ApolloClient<any>;
let schema: GraphQLSchema;
beforeAll(async () => {
	await genie.use(subscriptionPlugin(new PubSub()));
	client = await getClient();
	schema = genie.getSchema();
});

beforeEach(() => {
	client.cache['data'].data = {};
});

const testData = {users: [],
posts: [],
addresses: [],
comments: []};

const createUser = gql`
mutation createUser($input: CreateUserMutationInput!) {
	createUser(input: $input) {
		data {
			id
			name
			age
			birthday
			email
		}
		clientMutationId
	}
}
`;

const updatePost = gql`
mutation updatePost($input: UpdatePostMutationInput!) {
	updatePost(input: $input) {
		data {
			title
		}
	}
}
`;

describe('subscriptionsTest', () => {

	test('create - user with posts', async () => {

		const zain = await client.mutate({
			mutation: createUser,
			variables: { input: {data: { name: 'Zain', age: 22, birthday: '1996-01-22', email: 'zain@example.com'}}}
		});
		const steve = await client.mutate({
			mutation: createUser,
			variables: { input: {data: { name: 'Steve', age: 26, birthday: '1992-06-02', email: 'steve@example.com' }}}
		});

		const pete = await client.mutate({
			mutation: createUser,
			variables: { input: {data: { name: 'Pete', age: 30, birthday: '1988-06-02', email: 'pete@example.com' }}}
		});

		testData.users.push(zain.data.createUser.data);
		testData.users.push(steve.data.createUser.data);
		testData.users.push(pete.data.createUser.data);

		const user = await client.mutate({
			mutation: gql`
			mutation {
				createUser(
					input: {
						data: {
							age: 42
							email: "zeus@example.com"
							name: "Zeus"
							writtenSubmissions: {
								posts: {
									create: [{
										title: "Hello World"
										text: "This is my first blog post ever!"
									}, {
										title: "My Second Post"
										text: "My first post was good, but this one is better!"
									}, {
										title: "Solving World Hunger"
										text: "This is a draft..."
									}]
								}
							}
						}
						clientMutationId: "Test"
					}
				) {
					data {
						id
						age
						name
						email
						writtenSubmissions {
							id
							title
						}
					}
					clientMutationId
				}
			}
			`
		});
		testData.users.push(user.data.createUser.data);
		testData.posts = testData.posts.concat(user.data.createUser.data.writtenSubmissions);
		expect(user.data.createUser.clientMutationId).toBe('Test');
		expect(user.data.createUser.data.name).toBe('Zeus');
		expect(user.data.createUser.data.age).toBe(42);
		expect(user.data.createUser.data.email).toBe('zeus@example.com');
		expect(user.data.createUser.data.writtenSubmissions).toHaveLength(3);
		expect(user.data.createUser.data.writtenSubmissions[0].title).toBe('Hello World');
		expect(user.data.createUser.data.writtenSubmissions[1].title).toBe('My Second Post');
		expect(user.data.createUser.data.writtenSubmissions[2].title).toBe('Solving World Hunger');
	});

	test('subscription - create post', async () => {
		const sub: AsyncIterator<any> = <AsyncIterator<any>> await subscribe(schema,
			gql`subscription {
				post (where: {
					mutation_in: [CREATED],
					updatedFields_contains: ["likedBy", "title"],
					node: {exists: {title: true}}}){
					mutation
					node {
						title
					}
					updatedFields
					previousValues {
						title
					}
				}
			}
			`
		);

		const post = await execute(schema, gql`mutation {
			createPost(input: {data:{title:"bam"}}) {
				data {
					id
					title
				}
			}
		}`);

		testData.posts.push(post.data.createPost.data);
		const subNext = await sub.next();
		expect(subNext.value.data.post.mutation).toBe('CREATED');
		expect(subNext.value.data.post.node.title).toBe('bam');
		expect(subNext.value.data.post.previousValues).toBeNull();
		expect(subNext.value.data.post.updatedFields).toBeNull();

	});

	test('subscription - updating liked by', async () => {
		const sub: AsyncIterator<any> = <AsyncIterator<any>> await subscribe(schema,
			gql`subscription {
				post (where: {
					mutation_in: [UPDATED],
					updatedFields_contains: ["likedBy", "title"],
					node: {exists: {title: true}}}){
					mutation
					node {
						title
						likedBy {
							edges {
								node {
									name
								}
							}
						}
					}
					updatedFields
					previousValues {
						title
						likedBy_ids
					}
				}
			}
			`
		);

		const result = await client.mutate({
			mutation: updatePost,
			variables: { input: {
				data: { likedBy: { connect: [{email: testData.users[0].email}]}},
				where: { id: testData.posts[0].id}
			}}
		});
		const subNext = await sub.next();
		expect(subNext.value.data.post.mutation).toBe('UPDATED');
		expect(subNext.value.data.post.node.title).toBe(testData.posts[0].title);
		expect(subNext.value.data.post.node.likedBy.edges[0].node.name).toBe(testData.users[0].name);
		expect(subNext.value.data.post.previousValues.likedBy_ids).toBeNull();
		expect(subNext.value.data.post.updatedFields[0]).toBe('likedBy');

	});

	test('subscription - update AND match which will not fire the first time', async () => {
		const sub: AsyncIterator<any> = <AsyncIterator<any>> await subscribe(schema,
			gql`subscription {
				post(where: {
					AND: [
						{mutation_in: [UPDATED]},
						{updatedFields_contains: ["likedBy", "title"]},
						{node: {
							author: {
								match: {
									email: "${testData.users[3].email}"
								}
							}
						}
						}
					]
				}) {
					mutation
					node {
						title
						author {
							email
						}
						likedBy {
							edges {
								node {
									name
								}
							}
						}
					}
					updatedFields
					previousValues {
						title
						likedBy_ids
					}
				}
			}
			`
		);

		let result = await client.mutate({
			mutation: updatePost,
			variables: { input: {
				data: { likedBy: { connect: [{email: testData.users[1].email}]}},
				where: { id: testData.posts[testData.posts.length - 1].id}
			}}
		});

		result = await client.mutate({
			mutation: updatePost,
			variables: { input: {
				data: { likedBy: { connect: [{email: testData.users[2].email}, {email: testData.users[3].email}]}},
				where: { id: testData.posts[0].id}
			}}
		});

		sub.next().then(subNext => {
			expect(subNext.value.data.post.mutation).toBe('UPDATED');
			expect(subNext.value.data.post.node.title).toBe(testData.posts[0].title);
			expect(subNext.value.data.post.node.author.email).toBe(testData.users[3].email);
			expect(subNext.value.data.post.updatedFields[0]).toBe('likedBy');
		});

	});

	test('subscription - update OR match which will fire both times', async () => {

		await client.mutate({
			mutation: updatePost,
			variables: { input: {
				data: { likedBy: { disconnect: [{email: testData.users[0].email}, {email: testData.users[1].email}, {email: testData.users[2].email}, {email: testData.users[3].email}]}},
				where: { id: testData.posts[0].id}
			}}
		});

		await client.mutate({
			mutation: updatePost,
			variables: { input: {
				data: { likedBy: { disconnect: [{email: testData.users[0].email}, {email: testData.users[1].email}, {email: testData.users[2].email}, {email: testData.users[3].email}]}},
				where: { id: testData.posts[testData.posts.length - 1].id}
			}}
		});

		const sub: AsyncIterator<any> = <AsyncIterator<any>> await subscribe(schema,
			gql`subscription {
				post(where: {
					OR: [
						{mutation_in: [CREATED]},
						{node: {
							author: {
								match: {
									email: "${testData.users[3].email}"
								}
							}
						}
						}
					]
				}) {
					mutation
					node {
						title
						author {
							email
						}
						likedBy {
							edges {
								node {
									name
								}
							}
						}
					}
					updatedFields
					previousValues {
						title
						likedBy_ids
					}
				}
			}
			`
		);

		const post = await execute(schema, gql`mutation {
			createPost(input: {data:{title:"bam"}}) {
				data {
					id
					title
				}
			}
		}`);

		const result = await client.mutate({
			mutation: updatePost,
			variables: { input: {
				data: { likedBy: { connect: [{email: testData.users[2].email}, {email: testData.users[3].email}]}},
				where: { id: testData.posts[0].id}
			}}
		});

		sub.next().then(subNext => {
			expect(subNext.value.data.post.mutation).toBe('CREATED');
			expect(subNext.value.data.post.node.title).toBe('bam');
			expect(subNext.value.data.post.node.author.email).toBeNull();
			expect(subNext.value.data.post.updatedFields[0]).toBeNull();
		});

		sub.next().then(subNext => {
			expect(subNext.value.data.post.mutation).toBe('UPDATED');
			expect(subNext.value.data.post.node.title).toBe(testData.posts[0].title);
			expect(subNext.value.data.post.node.author.email).toBe(testData.users[3].email);
			expect(subNext.value.data.post.updatedFields[0]).toBe('likedBy');
		});

	});
});

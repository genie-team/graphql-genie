import { ApolloClient } from 'apollo-client';
import { GraphQLSchema, execute, subscribe } from 'graphql';
import { PubSub } from 'graphql-subscriptions';
import gql from 'graphql-tag';
import { genie, getClient } from '../setupTests';
import subscriptionPlugin from '../../src/subscriptions';

let client: ApolloClient<any>;
let schema: GraphQLSchema;
beforeAll(() => {
	genie.use(subscriptionPlugin(new PubSub()));
	client = getClient();
	schema = genie.getSchema();
});
beforeEach(() => {
	jest.setTimeout(4000);
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
		const subNextProm = sub.next();
		const post = await execute(schema, gql`mutation {
			createPost(input: {data:{title:"bam"}}) {
				data {
					id
					title
				}
			}
		}`);
		const subNext = await subNextProm;
		testData.posts.push(post.data.createPost.data);
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
		const subNextProm = sub.next();
		await client.mutate({
			mutation: updatePost,
			variables: { input: {
				data: { likedBy: { connect: [{email: testData.users[0].email}]}},
				where: { id: testData.posts[0].id}
			}}
		});
		const subNext = await subNextProm;
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

		await client.mutate({
			mutation: updatePost,
			variables: { input: {
				data: { likedBy: { connect: [{email: testData.users[1].email}]}},
				where: { id: testData.posts[testData.posts.length - 1].id}
			}}
		});
		const subNextProm = sub.next();
		await client.mutate({
			mutation: updatePost,
			variables: { input: {
				data: { likedBy: { connect: [{email: testData.users[2].email}, {email: testData.users[3].email}]}},
				where: { id: testData.posts[0].id}
			}}
		});

		return new Promise((resolve) => {
			subNextProm.then(subNext => {
				expect(subNext.value.data.post.mutation).toBe('UPDATED');
				expect(subNext.value.data.post.node.title).toBe(testData.posts[0].title);
				expect(subNext.value.data.post.node.author.email).toBe(testData.users[3].email);
				expect(subNext.value.data.post.updatedFields[0]).toBe('likedBy');
				resolve();
			}).catch();
		});

	});

	test('subscription - update OR match which will fire both times', async () => {
		try {
			await client.mutate({
				mutation: updatePost,
				variables: { input: {
					data: { likedBy: { disconnect: [{email: testData.users[0].email}, {email: testData.users[1].email}, {email: testData.users[2].email}, {email: testData.users[3].email}]}},
					where: { id: testData.posts[0].id}
				}}
			});
		} catch (e) {
			console.error(e, 'error updating first post');
		}

		try {
			await client.mutate({
				mutation: updatePost,
				variables: { input: {
					data: { likedBy: { disconnect: [{email: testData.users[0].email}, {email: testData.users[1].email}, {email: testData.users[2].email}, {email: testData.users[3].email}]}},
					where: { id: testData.posts[testData.posts.length - 1].id}
				}}
			});
		} catch (e) {
			console.error(e, 'error updating last post');
		}
		let sub: AsyncIterator<any>;
		try {
			sub = <AsyncIterator<any>> await subscribe(schema,
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
		} catch (e) {
			console.error('error subscribing', e);
		}
		let subNextProm = sub.next();

		try {
			await execute(schema, gql`mutation {
				createPost(input: {data:{title:"bam"}}) {
					data {
						id
						title
						author
					}
				}
			}`);
		} catch (e) {
			console.error('error creating post', e);
		}

		await client.mutate({
			mutation: updatePost,
			variables: { input: {
				data: { likedBy: { connect: [{email: testData.users[2].email}, {email: testData.users[3].email}]}},
				where: { id: testData.posts[0].id}
			}}
		});
		return new Promise((resolve) => {
			expect.assertions(8);

			subNextProm.then(subNext => {
				console.log('subNext.done 1:', subNext.done);
				console.log('subNext.value.data.post 1 :', subNext.value.data.post);
				expect(subNext.value.data.post.mutation).toBe('UPDATED');
				expect(subNext.value.data.post.node.title).toBe(testData.posts[0].title);
				expect(subNext.value.data.post.node.author.email).toBe(testData.users[3].email);
				expect(subNext.value.data.post.updatedFields[0]).toBe('likedBy');

				subNextProm = sub.next();
				subNextProm.then(subNext => {
					console.log('subNext.done 2:', subNext.done);

					console.log('subNext.value.data.post 2 :', subNext.value.data.post);
					expect(subNext.value.data.post.mutation).toBe('CREATED');
					expect(subNext.value.data.post.node.title).toBe('bam');
					expect(subNext.value.data.post.node.author).toBeNull();
					expect(subNext.value.data.post.updatedFields).toBeNull();
					resolve();
				}).catch();
			}).catch();
		});
	});
});

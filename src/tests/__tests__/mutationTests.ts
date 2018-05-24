import { ApolloClient } from 'apollo-client';
import gql from 'graphql-tag';
import { getClient } from '../setupTests';
let client: ApolloClient<any>;
beforeAll(async () => {
	client = await getClient();
});

beforeEach(() => {
	client.cache['data'].data = {};
});

const testData = {users: [],
posts: [],
addresses: [],
comments: []};

describe('mutationTests', () => {

	test('create - user with posts', async () => {
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

	test('create - create post connect author', async () => {
		const post = await client.mutate({
			mutation: gql`mutation {
				createPost(
					input: {
						data: {
							title: "Genie is great"
							text: "Look how fast I can create an executable schema"
							author: {
								connect:{
									email: "zeus@example.com"
								}
							}
						}
					}
				) {
					data {
						id
						title
						text
						author {
							email
						}
					}
				}
			}
			`
		});
		testData.posts.push(post.data.createPost.data);
		expect(post.data.createPost.data.title).toBe('Genie is great');
		expect(post.data.createPost.data.text).toBe('Look how fast I can create an executable schema');
		expect(post.data.createPost.data.author.email).toBe('zeus@example.com');
	});

	test('update - create address on user and update age', async () => {
		const user = await client.mutate({
			mutation: gql`mutation {
				updateUser(
					input: {
						data: {
							age: 5000
							address: {
								create: {
									city: "Olympus"
								}
							}
						}
						where: {
							email: "zeus@example.com"
						}
					}
				) {
					data {
						id
						name
						email
						age
						address {
							city
							user {
								name
							}
						}
					}
				}
			}
			`
		});
		expect(user.data.updateUser.data.name).toBe('Zeus');
		expect(user.data.updateUser.data.age).toBe(5000);
		expect(user.data.updateUser.data.email).toBe('zeus@example.com');
		expect(user.data.updateUser.data.address.city).toBe('Olympus');
		expect(user.data.updateUser.data.address.user.name).toBe('Zeus');

	});

	test('update - disconnect address on user', async () => {
		const user = await client.mutate({
			mutation: gql`mutation {
				updateUser(
					input: {
						data: {
							address: {
								disconnect: true
							}
						}
						where: {
							email: "zeus@example.com"
						}
					}
				) {
					data {
						id
						name
						email
						age
						address {
							city
						}
					}
				}
			}
			`
		});
		expect(user.data.updateUser.data.name).toBe('Zeus');
		expect(user.data.updateUser.data.age).toBe(5000);
		expect(user.data.updateUser.data.email).toBe('zeus@example.com');
		expect(user.data.updateUser.data.address).toBeNull();

	});

	test('update - update posts on user with age', async () => {
		const secondPostId = testData.posts[1].id;
		const user = await client.mutate({
			mutation: gql`mutation {
				updateUser(
					input: {
						data: {
							age: 5001
							writtenSubmissions: {
								posts: {
									update: [
										{
											data: {
												title: "My Updated Post"
											}
											where: {
												id: "${secondPostId}"
											}
										}
									]
								}
							}
						}
						where: {
							email: "zeus@example.com"
						}
					}
				) {
					data {
						id
						name
						email
						age
						writtenSubmissions {
							title
						}
					}
				}
			}
			`
		});
		expect(user.data.updateUser.data.name).toBe('Zeus');
		expect(user.data.updateUser.data.age).toBe(5001);
		expect(user.data.updateUser.data.email).toBe('zeus@example.com');
		expect(user.data.updateUser.data.writtenSubmissions[1].title).toBe('My Updated Post');

	});

	test('upsert - create new user', async () => {
		const user = await client.mutate({
			mutation: gql`mutation {
				upsertUser(
					input: {
						create: {
							name: "Corey"
							email: "corey@example.com"
						}
						update: {
							age: 30
						}
						where: {
							email: "corey@example.com"
						}
					}
				) {
					data {
						id
						name
						email
						age
					}
				}
			}
			`
		});
		testData.users.push(user.data.upsertUser.data);
		expect(user.data.upsertUser.data.name).toBe('Corey');
		expect(user.data.upsertUser.data.age).toBeNull();
		expect(user.data.upsertUser.data.email).toBe('corey@example.com');

	});

	test('upsert - update upserted user', async () => {
		const user = await client.mutate({
			mutation: gql`mutation {
				upsertUser(
					input: {
						create: {
							name: "Corey"
							email: "corey@example.com"
						}
						update: {
							age: 30
						}
						where: {
							email: "corey@example.com"
						}
					}
				) {
					data {
						id
						name
						email
						age
					}
				}
			}
			`
		});
		expect(user.data.upsertUser.data.name).toBe('Corey');
		expect(user.data.upsertUser.data.age).toBe(30);
		expect(user.data.upsertUser.data.email).toBe('corey@example.com');
	});

	test('upsert - nested upsert create family member on user', async () => {
		const user = await client.mutate({
			mutation: gql`mutation {
				updateUser(
					input: {
						data: {
							family: {
								upsert: [
									{
										update: {
											age: 4950
										}
										create: {
											name: "Loki"
											email: "loki@example.com"
										}
										where:{
											email: "loki@example.com"
										}
									}
								]
							}
						}
						where: {
							email: "zeus@example.com"
						}
					}
				) {
					data {
						id
						name
						email
						age
						family {
							name
							email
							age
						}
					}
				}
			}
			`
		});
		expect(user.data.updateUser.data.email).toBe('zeus@example.com');
		expect(user.data.updateUser.data.family[0].name).toBe('Loki');
		expect(user.data.updateUser.data.family[0].email).toBe('loki@example.com');
		expect(user.data.updateUser.data.family[0].age).toBeNull();

	});

	test('upsert - nested upsert update family member on user', async () => {
		const user = await client.mutate({
			mutation: gql`mutation {
				updateUser(
					input: {
						data: {
							family: {
								upsert: [
									{
										update: {
											age: 4950
										}
										create: {
											name: "Loki"
											email: "loki@example.com"
										}
										where:{
											email: "loki@example.com"
										}
									}
								]
							}
						}
						where: {
							email: "zeus@example.com"
						}
					}
				) {
					data {
						id
						name
						email
						age
						family {
							name
							email
							age
						}
					}
				}
			}
			`
		});
		expect(user.data.updateUser.data.email).toBe('zeus@example.com');
		expect(user.data.updateUser.data.family[0].name).toBe('Loki');
		expect(user.data.updateUser.data.family[0].email).toBe('loki@example.com');
		expect(user.data.updateUser.data.family[0].age).toBe(4950);
	});

	test('upsert - nested upsert create address member on user', async () => {
		const user = await client.mutate({
			mutation: gql`mutation {
				updateUser(
					input: {
						data: {
							address: {
								upsert: {
									create: {
										city: "New York"
									}
									update: {
										city: "Olympus"
									}
								}
							}
						}
						where: {
							email: "zeus@example.com"
						}
					}
				) {
					data {
						id
						name
						email
						age
						address {
							id
							city
						}
					}
				}
			}
			`
		});
		testData.addresses.push(user.data.updateUser.data.address);
		expect(user.data.updateUser.data.email).toBe('zeus@example.com');
		expect(user.data.updateUser.data.address.city).toBe('New York');
	});

	test('upsert - nested upsert update address member on user', async () => {
		const user = await client.mutate({
			mutation: gql`mutation {
				updateUser(
					input: {
						data: {
							address: {
								upsert: {
									create: {
										city: "New York"
									}
									update: {
										city: "Olympus"
									}
								}
							}
						}
						where: {
							email: "zeus@example.com"
						}
					}
				) {
					data {
						id
						name
						email
						age
						address {
							id
							city
						}
					}
				}
			}
			`
		});
		expect(user.data.updateUser.data.email).toBe('zeus@example.com');
		expect(user.data.updateUser.data.address.city).toBe('Olympus');
	});

	test('update - nested update update address member on user', async () => {
		const user = await client.mutate({
			mutation: gql`mutation {
				updateUser(
					input: {
						data: {
							address: {
								update: {
									city: "Eau Claire"
								}
							}
						}
						where: {
							email: "zeus@example.com"
						}
					}
				) {
					data {
						id
						name
						email
						age
						address {
							id
							city
						}
					}
				}
			}
			`
		});
		expect(user.data.updateUser.data.email).toBe('zeus@example.com');
		expect(user.data.updateUser.data.address.city).toBe('Eau Claire');
	});

	test('delete - delete user', async () => {
		const user = await client.mutate({
			mutation: gql`mutation {
				deleteUser(input: {
					where: {
						email: "corey@example.com"
					}
				}) {
					data {
						id
						name
						email
					}
				}
			}
			`
		});
		expect(user.data.deleteUser.data.email).toBe('corey@example.com');
	});

	test('update - delete address from user', async () => {
		const user = await client.mutate({
			mutation: gql`mutation {
				updateUser(
					input: {
						data: {
							address: {
								delete: true
							}
						}
						where: {
							email: "zeus@example.com"
						}
					}
				) {
					data {
						id
						name
						age
						address {
							id
							city
						}
					}
				}
			}
			`
		});
		expect(user.data.updateUser.data.address).toBeNull();
	});

	test('find - make sure address is deleted', async () => {
		const addresses = gql`
			query addresses($where: JSON) {
				addresses(where: $where) {
					id
				}
			}
			`;
		const result = await client.query({
			query: addresses,
			variables: {where: { match: {id: testData.addresses[0].id}}}
		});
		console.log(result);
		expect(result.data['addresses']).toBeNull();
	});

	test('update - delete post on user', async () => {
		const secondPostId = testData.posts[1].id;
		const user = await client.mutate({
			mutation: gql`mutation {
				updateUser(
					input: {
						data: {
							writtenSubmissions: {
								posts: {
									delete: [{    id: "${secondPostId}"}]
								}
							}
						}
						where: {
							email: "zeus@example.com"
						}
					}
				) {
					data {
						id
						name
						email
						age
						writtenSubmissions {
							title
						}
					}
				}
			}
			`
		});

		expect(user.data.updateUser.data.email).toBe('zeus@example.com');
		expect(user.data.updateUser.data.writtenSubmissions).toHaveLength(3);

	});

	test('find - make sure post is deleted', async () => {
		const posts = gql`
			query posts($where: JSON) {
				posts(where: $where) {
					id
				}
			}
			`;
		const result = await client.query({
			query: posts,
			variables: {where: { match: {id: testData.posts[1].id}}}
		});
		expect(result.data['posts']).toBeNull();
	});

});

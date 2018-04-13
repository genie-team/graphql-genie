import {getClient} from '../setupTests';
import gql from 'graphql-tag';
import { ApolloClient } from 'apollo-client';
let client: ApolloClient<any>;
beforeAll(async () => {
	client = await getClient();
})

const testData = {users: [],
posts: [], 
addresss: []};
describe('genie', () => {

	test('create - simple user', async () => {
		const name = 'Corey J';

		const createUser = gql`
		mutation createUser($name: String!) {
			createUser(name: $name) {
				id
				name
			}
		}
		`;

		const post = await client.mutate({
			mutation: createUser,
			variables: { name: name }
		})
		testData.users.push(post.data.createUser);
		expect(post.data.createUser.name).toBe(name);
	});

	test('create - post under existing user', async () => {
		const title = 'Genie is great';
		const createPost = gql`
			mutation createPost($title: String!, $authorId: ID) {
				createPost(title: $title, authorId: $authorId) {
					id
					title
					author {
						id
						name
					}
				}
			}
			`;
		const result = await client.mutate({
			mutation: createPost,
			variables: { title: title, authorId: testData.users[0].id}
		})
		testData.posts.push(result.data.createPost);
		expect(result.data.createPost.title).toBe(title);
		expect(result.data.createPost.author.id).toBe(testData.users[0].id);
		expect(result.data.createPost.author.name).toBe(testData.users[0].name);
	});

	test('find - make sure user also has post', async () => {
		const user = gql`
			query User($id: ID!) {
				User(id: $id) {
					id
					writtenPosts {
						id
					}
				}
			}
			`;
		const result = await client.query({
			query: user,
			variables: { id: testData.users[0].id}
		})
		console.log(result);
		expect(result.data['User'].writtenPosts[0].id).toBe(testData.posts[0].id);
	});

	test('create - post with new user', async () => {
		const title = 'Genie is more than great';
		const authorName = 'Totally Real Person'
		const createPost = gql`
			mutation createPost($title: String!, $author: UserInput) {
				createPost(title: $title, author: $author) {
					id
					title
					author {
						id
						name
					}
				}
			}
			`;
		const result = await client.mutate({
			mutation: createPost,
			variables: { title: title, author: {
				name: authorName,
			}}
		})
		testData.posts.push(result.data.createPost);
		testData.users.push(result.data.createPost.author);
		expect(result.data.createPost.title).toBe(title);
		expect(result.data.createPost.author.id).toBeDefined();
		expect(result.data.createPost.author.name).toBe(authorName);
	});

	test('find - make sure user also has post', async () => {
		const user = gql`
			query User($id: ID!) {
				User(id: $id) {
					id
					writtenPosts {
						id
					}
				}
			}
			`;
		const result = await client.query({
			query: user,
			variables: { id: testData.users[0].id}
		})
		console.log(result);
		expect(result.data['User'].writtenPosts[0].id).toBe(testData.posts[0].id);
	});

});
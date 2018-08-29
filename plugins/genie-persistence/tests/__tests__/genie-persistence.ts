import { ApolloClient } from 'apollo-client';
import gql from 'graphql-tag';
import { getClient } from '../setupClient';
import { GeniePersitence } from '../../src/genie-persistence';

let client: GeniePersitence;
beforeAll(() => {
	return getClient().then($client => {
		client = $client;
	});
});
beforeEach(() => {
	// client.cache['data'].data = {};
});
const testData = {
	users: [],
	posts: []
};

const postsQ = gql`
query {
	posts (orderBy: {
    created: DESC
   }) {
		title
		text
		author {
			username
		}
	}
}
`;

const usersQ = gql`
query {
	users (orderBy: {
    created: DESC
   }) {
		id
		username
		name
		email
	}
}
`;

const createPost = gql`
mutation createPost($input: CreatePostMutationInput!) {
	createPost(input: $input) {
		data {
			id
			title
			text
			author {
				email
				username
			}
		}
		clientMutationId
	}
}
`;

const createUser = gql`
mutation createUser($input: CreateUserMutationInput!) {
	createUser(input: $input) {
		data {
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

describe('onlineTests', () => {

	test('online - createPost', async () => {
		const title = 'Welcome';
		const text = 'This is the graphql genie persistance example';
		const post = await client.mutate({
			mutation: createPost,
			variables: {
				input: {
					data: {
						title,
						text,
					}
				}
			}
		});
		const postData = post.data.createPost.data;
		testData.posts.push(postData);
		expect(postData.title).toBe(title);
		expect(postData.text).toBe(text);

		const remotePosts = await client.remoteClient.query({query: postsQ, fetchPolicy: 'network-only'});
		expect(remotePosts.data['posts']).toHaveLength(1);
		expect(remotePosts.data['posts'][0].title).toBe(title);
		expect(remotePosts.data['posts'][0].text).toBe(text);

		await client.localQueue.onEmpty();
		await client.localQueue.onIdle();
		const localPosts = await client.localClient.query({query: postsQ, fetchPolicy: 'network-only'});
		expect(localPosts.data['posts']).toHaveLength(1);
		expect(localPosts.data['posts'][0].title).toBe(title);
		expect(localPosts.data['posts'][0].text).toBe(text);
	});

	test('online - createPost with user', async () => {
		const title = 'Advanced';
		const text = 'This is the graphql genie persistance example with nested creating a user as well';
		const post = await client.mutate({
			mutation: createPost,
			variables: {
				input: {
					data: {
						title,
						text,
						author: {
							create: {
								username: 'zeus',
								email: 'zeus@example.com',
								password: 'p$ssw0rd'
							}
						}
					}
				}
			}
		});
		const postData = post.data.createPost.data;
		testData.posts.push(postData);
		expect(postData.title).toBe(title);
		expect(postData.text).toBe(text);
		expect(postData.author.username).toBe('zeus');

		const remotePosts = await client.remoteClient.query({query: postsQ, fetchPolicy: 'network-only'});
		expect(remotePosts.data['posts'][0].title).toBe(title);
		expect(remotePosts.data['posts'][0].text).toBe(text);
		expect(remotePosts.data['posts'][0].author.username).toBe('zeus');

		await client.localQueue.onEmpty();
		await client.localQueue.onIdle();
		const localPosts = await client.localClient.query({query: postsQ, fetchPolicy: 'network-only'});
		expect(localPosts.data['posts'][0].title).toBe(title);
		expect(localPosts.data['posts'][0].text).toBe(text);
		expect(localPosts.data['posts'][0].author.username).toBe('zeus');
	});

	test('online - create User to test query updating local data', async () => {
		const user = await client.mutate({
			mutation: createUser,
			variables: {
				input: {
					data: {
						username: 'loki',
						email: 'loki@example.com',
						password: 'p$ssw0rd'
					}
				}
			}
		});

		await client.localQueue.onEmpty();
		await client.localQueue.onIdle();
		let localUsers = await client.localClient.query({query: usersQ, fetchPolicy: 'network-only'});
		expect(localUsers.data['users'][0].username).toBeNull();
		expect(localUsers.data['users'][0].email).toBe('loki@example.com');

		const remoteUsers = await client.query({query: usersQ, fetchPolicy: 'network-only'});
		expect(remoteUsers.data['users'][0].username).toBe('loki');
		expect(remoteUsers.data['users'][0].email).toBe('loki@example.com');

		await client.localQueue.onEmpty();
		await client.localQueue.onIdle();

		localUsers = await client.localClient.query({query: usersQ, fetchPolicy: 'network-only'});
		expect(localUsers.data['users'][0].username).toBe('loki');
		expect(localUsers.data['users'][0].email).toBe('loki@example.com');

	});
});

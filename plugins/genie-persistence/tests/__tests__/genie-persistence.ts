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
	posts {
		title
		text
		author {
			id
			username
		}
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
		}
		clientMutationId
	}
}
`;

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
		console.log('postData :', postData);
		testData.posts.push(postData);
		expect(postData.title).toBe(title);
		expect(postData.text).toBe(text);

		const localPosts = await client.localClient.query({query: postsQ});
		expect(localPosts).toHaveLength(1);
		expect(localPosts[0].title).toBe(title);
		expect(localPosts[0].text).toBe(text);

		const remotePosts = await client.remoteClient.query({query: postsQ});
		expect(remotePosts.data).toHaveLength(1);
		expect(remotePosts.data[0].title).toBe(title);
		expect(remotePosts.data[0].text).toBe(text);
	});
});

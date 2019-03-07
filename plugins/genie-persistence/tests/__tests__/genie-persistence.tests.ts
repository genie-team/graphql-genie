import { ApolloClient } from 'apollo-client';
import gql from 'graphql-tag';
import { getClient, localForageInstance, throwMergeConflict } from '../setupClient';
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
let online = true;
Object.defineProperty(navigator, 'onLine', {
	get: function() {
		return online;
	},
});
const goOffline = () => {
	online = false;
	window.dispatchEvent(new Event('offline'));
};

const goOnline = () => {
	online = true;
	window.dispatchEvent(new Event('online'));
};

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
		posts {
			title
			text
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

const updateUser = gql`
mutation updateUser($input: UpdateUserMutationInput!) {
	updateUser(input: $input) {
		data {
			email
			username
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
		goOnline();
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
		const postData = post.data['createPost'].data;
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

	test.only('online - createPost with user', async () => {
		goOnline();
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
		const postData = post.data['createPost'].data;
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
		const localUsers = await client.query({query: usersQ, fetchPolicy: 'network-only'});
		expect(localUsers.data['users'][0].username).toBe('zeus');

	});

	test('online - create User to test query updating local data', async () => {
		goOnline();
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
		// this is null because the mutation doesn't return the username
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
describe('offlineTests', () => {
	test('offline - create User to test query updating local data', async () => {
		goOffline();
		const user = await client.mutate({
			mutation: createUser,
			variables: {
				input: {
					data: {
						username: 'thor',
						email: 'thor@example.com',
						password: 'p$ssw0rd'
					}
				}
			}
		});

		const users = await client.query({query: usersQ, fetchPolicy: 'network-only'});
		expect(users.data['users'][0].username).toBe('thor');
		expect(users.data['users'][0].email).toBe('thor@example.com');

		expect(await localForageInstance.length()).toBe(1);
		expect(client.remoteQueue.size).toBe(1);

		goOnline();
		await client.remoteQueue.onEmpty();
		await client.remoteQueue.onIdle();
		const remoteUsers = await client.remoteClient.query({query: usersQ, fetchPolicy: 'network-only'});
		expect(remoteUsers.data['users'][0].username).toBe('thor');
		expect(remoteUsers.data['users'][0].email).toBe('thor@example.com');
		expect(remoteUsers.data['users'][0].id).toBe(users.data['users'][0].id);
	});

	test('offline - update user synchs when online', async () => {
		goOffline();
		const user = await client.mutate({
			mutation: updateUser,
			variables: {
				input: {
					data: {
						username: 'Thor',
						email: 'thorGodOfThunder@example.com'
					},
					where: {
						email: 'thor@example.com'
					}
				}
			}
		});

		const users = await client.query({query: usersQ, fetchPolicy: 'network-only'});
		expect(users.data['users'][0].username).toBe('Thor');
		expect(users.data['users'][0].email).toBe('thorGodOfThunder@example.com');

		expect(await localForageInstance.length()).toBe(1);
		expect(client.remoteQueue.size).toBe(1);

		goOnline();
		await client.remoteQueue.onEmpty();
		await client.remoteQueue.onIdle();
		const remoteUsers = await client.remoteClient.query({query: usersQ, fetchPolicy: 'network-only'});
		expect(remoteUsers.data['users'][0].username).toBe('Thor');
		expect(remoteUsers.data['users'][0].email).toBe('thorGodOfThunder@example.com');
	});

	test('offline - update user throws merge conflict', async () => {
		goOffline();
		let user = await client.mutate({
			mutation: updateUser,
			variables: {
				input: {
					data: {
						email: 'thorIsGreat@example.com'
					},
					where: {
						email: 'thorGodOfThunder@example.com'
					}
				}
			}
		});

		let users = await client.query({query: usersQ, fetchPolicy: 'network-only'});
		expect(users.data['users'][0].email).toBe('thorIsGreat@example.com');

		expect(await localForageInstance.length()).toBe(1);
		expect(client.remoteQueue.size).toBe(1);

		user = await client.remoteClient.mutate({
			mutation: updateUser,
			variables: {
				input: {
					data: {
						email: 'thor1@example.com'
					},
					where: {
						email: 'thorGodOfThunder@example.com'
					}
				}
			}
		});
		users = await client.remoteClient.query({query: usersQ, fetchPolicy: 'network-only'});
		expect(users.data['users'][0].email).toBe('thor1@example.com');
		goOnline();
		await client.remoteQueue.onEmpty();
		await client.remoteQueue.onIdle();
		expect(throwMergeConflict).toBeCalled();
		const remoteUsers = await client.remoteClient.query({query: usersQ, fetchPolicy: 'network-only'});
		expect(remoteUsers.data['users'][0].email).toBe('thor1@example.com');
	});

	test('offline - relation cache', async () => {
		goOffline();
		const username = 'hera';
		const email = 'hera@example.com';
		const title = 'Hera post title';
		const text = 'Hera post text';
		const user = await client.mutate({
			mutation: createUser,
			variables: {
				input: {
					data: {
						username: username,
						email: email,
						password: 'p$ssw0rd',
						posts: {
							create: {
								title,
								text
							}
						}
					}
				}
			}
		});
		await client.localQueue.onEmpty();
		await client.localQueue.onIdle();

		const localUsers = await client.query({query: usersQ});
		expect(localUsers.data['users'][0].username).toBe(username);
		expect(localUsers.data['users'][0].email).toBe(email);
		expect(localUsers.data['users'][0].posts[0].title).toBe(title);
		expect(localUsers.data['users'][0].posts[0].text).toBe(text);
	});

	test.only('offline - createPost with user relation cache', async () => {
		goOffline();
		const title = 'Relation';
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
								username: 'tyr',
								email: 'tyr@example.com',
								password: 'p$ssw0rd'
							}
						}
					}
				}
			}
		});
		const postData = post.data['createPost'].data;
		testData.posts.push(postData);
		expect(postData.title).toBe(title);
		expect(postData.text).toBe(text);
		expect(postData.author.username).toBe('tyr');

		const posts = await client.query({query: postsQ});
		expect(posts.data['posts'][0].title).toBe(title);
		expect(posts.data['posts'][0].text).toBe(text);
		expect(posts.data['posts'][0].author.username).toBe('tyr');

		const postUpdate = await client.mutate({
			mutation: updatePost,
			variables: {
				input: {
					where: {
						id: testData.posts[0].id
					},
					data: {
						author: {
							connect: {
									id: posts.data['posts'][0].author.id
							}
						}
					}
				}
			}
		});
		await client.localQueue.onEmpty();
		await client.localQueue.onIdle();
	});
});

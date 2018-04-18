import {getClient} from '../setupTests';
import gql from 'graphql-tag';
import { ApolloClient } from 'apollo-client';
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


const createUser = gql`
mutation createUser($name: String!, $age: Int, $birthday: Date) {
	createUser(name: $name, age: $age, birthday: $birthday) {
		id
		name
		age
		birthday
	}
}
`;

describe('genie', () => {

	test('create - simple user', async () => {
		const $name = 'Corey J';
		const $age = 30;
		const $birthday = '1988-02-23';


		const user = await client.mutate({
			mutation: createUser,
			variables: { name: $name, age: $age, birthday: $birthday }
		});
		testData.users.push(user.data.createUser);
		expect(user.data.createUser.name).toBe($name);
		expect(user.data.createUser.age).toBe($age);
		expect(user.data.createUser.birthday).toBe($birthday);
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
		});
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
					writtenSubmissions {
						id
					}
				}
			}
			`;
		const result = await client.query({
			query: user,
			variables: { id: testData.users[0].id}
		});

		expect(result.data['User'].writtenSubmissions[0].id).toBe(testData.posts[0].id);
	});

	test('create - post with new user', async () => {
		const title = 'Genie is more than great';
		const authorName = 'Totally Real Person';
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
		});
		testData.posts.push(result.data.createPost);
		testData.users.push(result.data.createPost.author);
		expect(result.data.createPost.title).toBe(title);
		expect(result.data.createPost.author.id).toBeDefined();
		expect(result.data.createPost.author.name).toBe(authorName);
	});

	test('create - simple address', async () => {
		const city = 'Eau Claire';
		const createAddress = gql`
			mutation createAddress($city: String!) {
				createAddress(city: $city) {
					id
					city
				}
			}
			`;
		const result = await client.mutate({
			mutation: createAddress,
			variables: { city: city}
		});
		testData.addresses.push(result.data.createAddress);
		expect(result.data.createAddress.city).toBe(city);
	});

	test('set - set user address', async () => {
		const setUserAddress = gql`
			mutation setUserAddress($addressAddressId: ID!, $userUserId: ID!) {
				setUserAddress(addressAddressId: $addressAddressId, userUserId: $userUserId	) {
					addressAddress {
						id
						city
						user {
							name
						}
					}
					userUser {
						id
						name
						address {
							city
						}
					}
				}
			}
			`;
		const result = await client.mutate({
			mutation: setUserAddress,
			variables: { userUserId: testData.users[0].id, addressAddressId: testData.addresses[0].id}
		});

		expect(result.data.setUserAddress.addressAddress.id).toBe(testData.addresses[0].id);
		expect(result.data.setUserAddress.addressAddress.city).toBe(testData.addresses[0].city);
		expect(result.data.setUserAddress.addressAddress.user.name).toBe(testData.users[0].name);
		expect(result.data.setUserAddress.userUser.id).toBe(testData.users[0].id);
		expect(result.data.setUserAddress.userUser.name).toBe(testData.users[0].name);
		expect(result.data.setUserAddress.userUser.address.city).toBe(testData.addresses[0].city);
	});

	test('find - make sure setting address worked', async () => {
		const user = gql`
			query User($id: ID!) {
				User(id: $id) {
					id
					address {
						id
						city
					}
				}
			}
			`;
		const result = await client.query({
			query: user,
			variables: { id: testData.users[0].id}
		});

		expect(result.data['User'].address.id).toBe(testData.addresses[0].id);
		expect(result.data['User'].address.city).toBe(testData.addresses[0].city);
	});

	test('find - try out some fragments', async () => {
		const fragment = gql`fragment user on User{
			name
			writtenSubmissions {
				id
				title
			}
		}`;
		const user = gql`
			query User($id: ID!) {
				User(id: $id) {
					id
					address {
						id
						city
						user {
							...user
						}
					}
				}
			}
			${fragment}
			`;
		const result = await client.query({
			query: user,
			variables: { id: testData.users[0].id}
		});
		console.log(result.data);
		expect(result.data['User'].address.id).toBe(testData.addresses[0].id);
		expect(result.data['User'].address.city).toBe(testData.addresses[0].city);
		expect(result.data['User'].address.user.writtenSubmissions[0].id).toBe(testData.posts[0].id);

	});


	test('unset - unset user address', async () => {
		const unsetUserAddress = gql`
			mutation unsetUserAddress($addressAddressId: ID!, $userUserId: ID!) {
				unsetUserAddress(addressAddressId: $addressAddressId, userUserId: $userUserId	) {
					addressAddress {
						id
						city
					}
					userUser {
						id
						name
					}
				}
			}
			`;
		const result = await client.mutate({
			mutation: unsetUserAddress,
			variables: { userUserId: testData.users[0].id, addressAddressId: testData.addresses[0].id}
		});

		expect(result.data.unsetUserAddress.addressAddress.id).toBe(testData.addresses[0].id);
		expect(result.data.unsetUserAddress.addressAddress.city).toBe(testData.addresses[0].city);
		expect(result.data.unsetUserAddress.userUser.id).toBe(testData.users[0].id);
		expect(result.data.unsetUserAddress.userUser.name).toBe(testData.users[0].name);
	});

	test('find - make sure unsetting address worked', async () => {
		const user = gql`
			query User($id: ID!) {
				User(id: $id) {
					id
					address {
						id
						city
					}
				}
			}
			`;
		const result = await client.query({
			query: user,
			variables: { id: testData.users[0].id}
		});

		expect(result.data['User'].address).toBeNull();

	});

	test('create - create comment on user', async () => {
		const title = 'Nice post';
		const createComment = gql`
			mutation createComment($title: String!, $authorId: ID) {
				createComment(title: $title, authorId: $authorId) {
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
			mutation: createComment,
			variables: { title: title, authorId: testData.users[0].id}
		});
		testData.comments.push(result.data.createComment);
		expect(result.data.createComment.title).toBe(title);
		expect(result.data.createComment.author.id).toBe(testData.users[0].id);
		expect(result.data.createComment.author.name).toBe(testData.users[0].name);
	});

	test('find - comment is on user with default approval status', async () => {
		const user = gql`
			query User($id: ID!) {
				User(id: $id) {
					name
					writtenSubmissions {
						id
						title
						... on Comment {
							approved
						}
					}
				}
			}
			`;
		const result = await client.query({
			query: user,
			variables: { id: testData.users[0].id}
		});


		expect(result.data['User'].writtenSubmissions).toHaveLength(2);
		expect(result.data['User'].writtenSubmissions[1].title).toBe(testData.comments[0].title);
		expect(result.data['User'].writtenSubmissions[1].approved).toBe(true);


	});

	test('addTo - add comment to post', async () => {
		const addToCommentsOnPost = gql`
			mutation addToCommentsOnPost($commentsCommentId: ID!, $postPostId: ID!) {
				addToCommentsOnPost(commentsCommentId: $commentsCommentId, postPostId: $postPostId) {
					commentsComment {
						id
						title
					}
					postPost {
						id
						title
					}
				}
			}
			`;
		const result = await client.mutate({
			mutation: addToCommentsOnPost,
			variables: { commentsCommentId: testData.comments[0].id, postPostId: testData.posts[0].id}
		});

		expect(result.data.addToCommentsOnPost.commentsComment.id).toBe(testData.comments[0].id);
		expect(result.data.addToCommentsOnPost.commentsComment.title).toBe(testData.comments[0].title);
		expect(result.data.addToCommentsOnPost.postPost.id).toBe(testData.posts[0].id);
		expect(result.data.addToCommentsOnPost.postPost.title).toBe(testData.posts[0].title);
	});

	test('all filter - filter by age', async () => {
		const zain = await client.mutate({
			mutation: createUser,
			variables: { name: 'Zain', age: 22, birthday: '1996-01-22' }
		});
		const steve = await client.mutate({
			mutation: createUser,
			variables: { name: 'Steve', age: 26, birthday: '1992-06-02' }
		});

		testData.users.push(zain.data.createUser);
		testData.users.push(steve.data.createUser);


		const allUsers = gql`
				{
					allUsers(filter:{
						range:{
							age: [23, null]
						}
					}) {
						name
						birthday
						age
					}
				}
		`;

// {
//   allUsers(filter:{
//     range:{
//       name: [ "C", "T" ]
//     }
//   }) {
//     name
//     birthday
//     age
//   }
// }
// {
//   allUsers(filter:{
//     range:{
//       birthday: [ null, "2016" ]
//     }
//   }) {
//     name
//     birthday
//     age
//   }
// }

		const result = await client.query({
			query: allUsers
		});

		expect(result.data['allUsers']).toHaveLength(2);
	});



});

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

describe('genie', () => {

	test('create - simple user', async () => {
		const $name = 'Corey J';
		const $age = 30;
		const $birthday = '1988-02-23';
		const $email = 'coreyj@example.com';


		const user = await client.mutate({
			mutation: createUser,
			variables: { input: {clientMutationId: 'create simple user', data: { name: $name, age: $age, birthday: $birthday, email: $email }}}
		});
		testData.users.push(user.data.createUser.data);
		expect(user.data.createUser.clientMutationId).toBe('create simple user');
		expect(user.data.createUser.data.name).toBe($name);
		expect(user.data.createUser.data.age).toBe($age);
		expect(user.data.createUser.data.birthday).toBe($birthday);
		expect(user.data.createUser.data.email).toBe($email);
	});


	test('create - post on existing user', async () => {
		const $title = 'Genie is great';
		const createPost = gql`
			mutation createPost($input: CreatePostMutationInput!) {
				createPost(input: $input) {
					data {
						id
						title
						author {
							id
							name
							email
						}
					}
				}
			}
			`;
		const result = await client.mutate({
			mutation: createPost,
			variables: { input: {data: { title: $title, author: {connect: {id: testData.users[0].id}}}}}
		});
		testData.posts.push(result.data.createPost.data);
		expect(result.data.createPost.data.title).toBe($title);
		expect(result.data.createPost.data.author.id).toBe(testData.users[0].id);
		expect(result.data.createPost.data.author.name).toBe(testData.users[0].name);
	});


	test('find - make sure user also has post', async () => {
		const users = gql`
			query users($filter: JSON) {
				users(filter: $filter) {
					id
					writtenSubmissions {
						id
					}
				}
			}
			`;

		const result = await client.query({
			query: users,
			variables: {filter: { match: {id: testData.users[0].id}}}
		});
		expect(result.data['users'][0].writtenSubmissions[0].id).toBe(testData.posts[0].id);
	});

	test('create - post with new user', async () => {
		const $title = 'Genie is more than great';
		const $authorName = 'Totally Real Person';
		const $email = 'real@example.com';
		const createPost = gql`
			mutation createPost($input: CreatePostMutationInput!) {
				createPost(input: $input) {
					data {
						id
						title
						author {
							id
							name
							email
						}
					}
				}
			}
			`;

		const result = await client.mutate({
			mutation: createPost,
			variables: { input: {data: { title: $title, author: {create: {name: $authorName, email: $email}}}}}
		});
		testData.posts.push(result.data.createPost.data);
		testData.users.push(result.data.createPost.data.author);
		expect(result.data.createPost.data.title).toBe($title);
		expect(result.data.createPost.data.author.id).toBeDefined();
		expect(result.data.createPost.data.author.name).toBe($authorName);
		expect(result.data.createPost.data.author.email).toBe($email);
	});

	test('create - simple address', async () => {
		const $city = 'Eau Claire';
		const createAddress = gql`
			mutation createAddress($input: CreateAddressMutationInput!) {
				createAddress(input: $input) {
					data {
						id
						city
					}
				}
			}
			`;
		const result = await client.mutate({
			mutation: createAddress,
			variables: {input: { data: {city: $city}}}
		});
		testData.addresses.push(result.data.createAddress.data);
		expect(result.data.createAddress.data.city).toBe($city);
	});

	test('set - set user address', async () => {
		const updateUser = gql`
			mutation updateUser($input: UpdateUserMutationInput!) {
				updateUser(input: $input	) {
					data {
						id
						name
						address {
							id
							city
							user {
								name
							}
						}
					}
				}
			}
			`;
		const result = await client.mutate({
			mutation: updateUser,
			variables: {input : {
				where: {id: testData.users[0].id},
				data: {address: {connect: {id: testData.addresses[0].id}}}
			}}
		});

		expect(result.data.updateUser.data.id).toBe(testData.users[0].id);
		expect(result.data.updateUser.data.name).toBe(testData.users[0].name);
		expect(result.data.updateUser.data.address.id).toBe(testData.addresses[0].id);
		expect(result.data.updateUser.data.address.city).toBe(testData.addresses[0].city);
		expect(result.data.updateUser.data.address.user.name).toBe(testData.users[0].name);
	});

	test('find - make sure setting address worked', async () => {
		const users = gql`
			query users($filter: JSON) {
				users(filter: $filter) {
					id
					address {
						id
						city
					}
				}
			}
			`;
		const result = await client.query({
			query: users,
			variables: {filter: { match: {id: testData.users[0].id}}}
		});
		expect(result.data['users'][0].address.id).toBe(testData.addresses[0].id);
		expect(result.data['users'][0].address.city).toBe(testData.addresses[0].city);
	});

	test('find - try out some fragments', async () => {
		const fragment = gql`fragment user on User{
			name
			writtenSubmissions {
				id
				title
			}
		}`;
		const users = gql`
		query users($filter: JSON) {
			users(filter: $filter) {
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
			query: users,
			variables: {filter: { match: {id: testData.users[0].id}}}
		});
		expect(result.data['users'][0].address.id).toBe(testData.addresses[0].id);
		expect(result.data['users'][0].address.city).toBe(testData.addresses[0].city);
		expect(result.data['users'][0].address.user.writtenSubmissions[0].id).toBe(testData.posts[0].id);

	});


	test('disconnect - disconnect user address', async () => {
		const updateAddress = gql`
			mutation updateAddress($input: UpdateAddressMutationInput!) {
				updateAddress(input: $input	) {
					data {
						id
						city
						user {
							id
						}
					}
				}
			}
			`;
		const result = await client.mutate({
			mutation: updateAddress,
			variables: {input: {
				where: {id: testData.addresses[0].id},
				data: {user: {disconnect: true}}
			}}
		});
		expect(result.data.updateAddress.data.id).toBe(testData.addresses[0].id);
		expect(result.data.updateAddress.data.city).toBe(testData.addresses[0].city);
		expect(result.data.updateAddress.data.user).toBeNull();
	});

	test('find - make sure disconnect address worked', async () => {
		const users = gql`
			query users($filter: JSON) {
				users(filter: $filter) {
					id
					address {
						id
						city
					}
				}
			}
			`;
		const result = await client.query({
			query: users,
			variables: {filter: { match: {id: testData.users[0].id}}}
		});

		expect(result.data['users'][0].address).toBeNull();
	});

	test('create - create comment on user', async () => {
		const $title = 'Nice post';
		const createComment = gql`
			mutation createComment($input: CreateCommentMutationInput!) {
				createComment(input: $input) {
					data {
						id
						title
						approved
						author {
							id
							name
							email
						}
					}
				}
			}
			`;
		const result = await client.mutate({
			mutation: createComment,
			variables: { input: {data: { title: $title, author: {connect: {id: testData.users[0].id}}}}}
		});
		testData.comments.push(result.data.createComment.data);
		expect(result.data.createComment.data.title).toBe($title);
		expect(result.data.createComment.data.approved).toBe(true);
		expect(result.data.createComment.data.author.id).toBe(testData.users[0].id);
		expect(result.data.createComment.data.author.name).toBe(testData.users[0].name);
	});

	test('create - create another comment on user', async () => {
		const $title = 'Bad post';
		const createComment = gql`
			mutation createComment($input: CreateCommentMutationInput!) {
				createComment(input: $input) {
					data {
						id
						title
						approved
						author {
							id
							name
							email
						}
					}
				}
			}
			`;
		const result = await client.mutate({
			mutation: createComment,
			variables: { input: {data: { approved: false, title: $title, author: {connect: {id: testData.users[0].id}}}}}
		});
		testData.comments.push(result.data.createComment.data);
		expect(result.data.createComment.data.title).toBe($title);
		expect(result.data.createComment.data.approved).toBe(false);

		expect(result.data.createComment.data.author.id).toBe(testData.users[0].id);
		expect(result.data.createComment.data.author.name).toBe(testData.users[0].name);
	});

	test('find - comment is on user with default approval status', async () => {
		const users = gql`
		query users($filter: JSON) {
			users(filter: $filter) {
				id
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
			query: users,
			variables: {filter: { match: {id: testData.users[0].id}}}
		});

		expect(result.data['users'][0].writtenSubmissions).toHaveLength(3);
		expect(result.data['users'][0].writtenSubmissions[1].title).toBe(testData.comments[0].title);
		expect(result.data['users'][0].writtenSubmissions[1].approved).toBe(true);


	});

	test('addTo - add comment to post and create a new one', async () => {
		const updatePost = gql`
			mutation updatePost($input: UpdatePostMutationInput!) {
				updatePost(input: $input	) {
					data {
						id
						title
						comments {
							id
							title
							approved
							author {
								name
							}
						}
					}
				}
			}
			`;
		const result = await client.mutate({
			mutation: updatePost,
			variables: {input: {
				where: {id: testData.posts[0].id},
				data: {comments: {
					connect: [
						{id: testData.comments[0].id},
						{id: testData.comments[1].id}
					],
					create: [
						{title: 'best post ever'}
					]
				}}
			}}
		});

		expect(result.data.updatePost.data.comments).toHaveLength(3);
		expect(result.data.updatePost.data.comments[1].id).toBe(testData.comments[0].id);
		expect(result.data.updatePost.data.comments[1].author.name).toBe(testData.users[0].name);
		expect(result.data.updatePost.data.comments[2].id).toBe(testData.comments[1].id);
		expect(result.data.updatePost.data.comments[0].title).toBe('best post ever');
		expect(result.data.updatePost.data.comments[0].author).toBeNull();
		expect(result.data.updatePost.data.comments[0].approved).toBe(true);
	});

	test('all filter - filter by age', async () => {
		const zain = await client.mutate({
			mutation: createUser,
			variables: { input: {data: { name: 'Zain', age: 22, birthday: '1996-01-22', email: 'zain@example.com'}}}
		});
		const steve = await client.mutate({
			mutation: createUser,
			variables: { input: {data: { name: 'Steve', age: 26, birthday: '1992-06-02', email: 'steve@example.com' }}}
		});

		testData.users.push(zain.data.createUser.data);
		testData.users.push(steve.data.createUser.data);


		const users = gql`
				{
					users(filter:{
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
// 	users(filter:{
// 		or: [{
// 			range:{
// 				age: [0, 24]
// 			}
// 		}, {range:{
// 			age: [29, null]
// 		}}]
// 	}) {
// 		name
// 		birthday
// 		age
// 	}
// }

// {
//   users(filter:{
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
//   users(filter:{
//     range:{
//       birthday: [ null, "1994-01-01" ]
//     }
//   }) {
//     name
//     birthday
//     age
//   }
// }

// {
//   users (filter: {
//     exists:{
//       writtenSubmissions: true
//     }
//     writtenSubmissions: {
		// match: {
		//   title: "Genie is great"
		// }
//     }
//   }) {
//     name
//     writtenSubmissions {
//       id
//       title
//     }
//   }
// }

// {

//   postsConnection(first: 1, after: "1ZN8GkZUASdEtHQ") {
//     edges {
//       cursor
//       node {
//         id
//         title
//         author {
//           name
//         }
//       }
//     }
//     pageInfo {
//       hasNextPage
//       hasPreviousPage
//       startCursor
//       endCursor
//     }
//     aggregate {
//       count
//     }
//   }
// }

		const result = await client.query({
			query: users
		});

		expect(result.data['users']).toHaveLength(2);
	});



});

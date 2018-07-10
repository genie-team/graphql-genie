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

const testData = {
	users: [],
	posts: [],
	addresses: [],
	comments: []
};

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

const createPost = gql`
mutation createUser($input: CreatePostMutationInput!) {
	createPost(input: $input) {
		data {
			id
			title
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
			variables: { input: { clientMutationId: 'create simple user', data: { name: $name, age: $age, birthday: $birthday, email: $email } } }
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
			variables: { input: { data: { title: $title, author: { connect: { id: testData.users[0].id } } } } }
		});
		testData.posts.push(result.data.createPost.data);
		expect(result.data.createPost.data.title).toBe($title);
		expect(result.data.createPost.data.author.id).toBe(testData.users[0].id);
		expect(result.data.createPost.data.author.name).toBe(testData.users[0].name);
	});

	test('find - make sure user also has post', async () => {
		const users = gql`
			query users($where: JSON) {
				users(where: $where) {
					id
					writtenSubmissions {
						id
					}
				}
			}
			`;

		const result = await client.query({
			query: users,
			variables: { where: { match: { id: testData.users[0].id } } }
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
			variables: { input: { data: { title: $title, author: { create: { name: $authorName, email: $email } } } } }
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
			variables: { input: { data: { city: $city } } }
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
			variables: {
				input: {
					where: { id: testData.users[0].id },
					data: { address: { connect: { id: testData.addresses[0].id } } }
				}
			}
		});

		expect(result.data.updateUser.data.id).toBe(testData.users[0].id);
		expect(result.data.updateUser.data.name).toBe(testData.users[0].name);
		expect(result.data.updateUser.data.address.id).toBe(testData.addresses[0].id);
		expect(result.data.updateUser.data.address.city).toBe(testData.addresses[0].city);
		expect(result.data.updateUser.data.address.user.name).toBe(testData.users[0].name);
	});

	test('find - make sure setting address worked', async () => {
		const users = gql`
			query users($where: JSON) {
				users(where: $where) {
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
			variables: { where: { match: { id: testData.users[0].id } } }
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
		query users($where: JSON) {
			users(where: $where) {
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
			variables: { where: { match: { id: testData.users[0].id } } }
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
			variables: {
				input: {
					where: { id: testData.addresses[0].id },
					data: { user: { disconnect: true } }
				}
			}
		});
		expect(result.data.updateAddress.data.id).toBe(testData.addresses[0].id);
		expect(result.data.updateAddress.data.city).toBe(testData.addresses[0].city);
		expect(result.data.updateAddress.data.user).toBeNull();
	});

	test('find - make sure disconnect address worked', async () => {
		const users = gql`
			query users($where: JSON) {
				users(where: $where) {
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
			variables: { where: { match: { id: testData.users[0].id } } }
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
			variables: { input: { data: { title: $title, author: { connect: { id: testData.users[0].id } } } } }
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
			variables: { input: { data: { approved: false, title: $title, author: { connect: { id: testData.users[0].id } } } } }
		});
		testData.comments.push(result.data.createComment.data);
		expect(result.data.createComment.data.title).toBe($title);
		expect(result.data.createComment.data.approved).toBe(false);

		expect(result.data.createComment.data.author.id).toBe(testData.users[0].id);
		expect(result.data.createComment.data.author.name).toBe(testData.users[0].name);
	});

	test('find - comment is on user with default approval status', async () => {
		const users = gql`
		query users($where: JSON) {
			users(where: $where) {
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
			variables: { where: { match: { id: testData.users[0].id } } }
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
			variables: {
				input: {
					where: { id: testData.posts[0].id },
					data: {
						comments: {
							connect: [
								{ id: testData.comments[0].id },
								{ id: testData.comments[1].id }
							],
							create: [
								{ title: 'best post ever' }
							]
						}
					}
				}
			}
		});

		expect(result.data.updatePost.data.comments).toHaveLength(3);
		expect(result.data.updatePost.data.comments[1].id).toBe(testData.comments[0].id);
		expect(result.data.updatePost.data.comments[1].author.name).toBe(testData.users[0].name);
		expect(result.data.updatePost.data.comments[2].id).toBe(testData.comments[1].id);
		expect(result.data.updatePost.data.comments[0].title).toBe('best post ever');
		expect(result.data.updatePost.data.comments[0].author).toBeNull();
		expect(result.data.updatePost.data.comments[0].approved).toBe(true);
	});

	test('all where - where by age', async () => {
		const zain = await client.mutate({
			mutation: createUser,
			variables: { input: { data: { name: 'Zain', age: 22, birthday: '1996-01-22', email: 'zain@example.com' } } }
		});
		const steve = await client.mutate({
			mutation: createUser,
			variables: { input: { data: { name: 'Steve', age: 26, birthday: '1992-06-02', email: 'steve@example.com' } } }
		});

		const pete = await client.mutate({
			mutation: createUser,
			variables: { input: { data: { name: 'Pete', age: 30, birthday: '1988-06-02', email: 'pete@example.com' } } }
		});

		testData.users.push(zain.data.createUser.data);
		testData.users.push(steve.data.createUser.data);
		testData.users.push(pete.data.createUser.data);
		const users = gql`
				{
					users(where:{
						range:{
							age: [23, null]
						}
					}, orderBy: {
            email: ASC
          }) {
						name
						birthday
						age
						email
					}
				}
		`;

		const result = await client.query({
			query: users
		});

		expect(result.data['users']).toHaveLength(3);
		expect(result.data['users'][0].email).toBe('coreyj@example.com');
		expect(result.data['users'][1].email).toBe('pete@example.com');
		expect(result.data['users'][2].email).toBe('steve@example.com');

	});

	test('all where - where by age with or', async () => {

		const users = gql`
				{
					users(where:{
						or: [{
							range:{
								age: [0, 24]
							}
						}, {range:{
							age: [29, null]
						}}]
					}, orderBy: {
            email: ASC
          }) {
						name
						birthday
						age
						email
					}
				}
		`;
		const result = await client.query({
			query: users
		});

		expect(result.data['users']).toHaveLength(3);
		expect(result.data['users'][0].email).toBe('coreyj@example.com');
		expect(result.data['users'][1].email).toBe('pete@example.com');
		expect(result.data['users'][2].email).toBe('zain@example.com');
	});

	test('all where - where by name range', async () => {

		const users = gql`
			{
				users(where:{
					range:{
						name: [ "C", "T" ]
					}
				}, orderBy: {
            email: ASC
          }) {
					name
					birthday
					age
					email
				}
			}
		`;
		const result = await client.query({
			query: users
		});
		expect(result.data['users'][0].email).toBe('coreyj@example.com');
		expect(result.data['users'][1].email).toBe('pete@example.com');
		expect(result.data['users'][2].email).toBe('steve@example.com');
		expect(result.data['users']).toHaveLength(3);
	});

	test('all where - where by bday range', async () => {

		const users = gql`
			{
				users(where:{
					range:{
						birthday: [ null, "1990-01-01" ]
					}
				}, orderBy: {
            email: ASC
          }) {
					name
					birthday
					age
					email
				}
			}
		`;
		const result = await client.query({
			query: users
		});

		expect(result.data['users']).toHaveLength(2);
		expect(result.data['users'][0].email).toBe('coreyj@example.com');
		expect(result.data['users'][1].email).toBe('pete@example.com');

	});

	test('all where - nested match', async () => {

		const users = gql`
			{
				users (where: {
					writtenSubmissions: {
					match: {
						title: "${testData.posts[0].title}"
					}
					}
				}) {
					name
					email
					writtenSubmissions {
						id
						title
					}
				}
			}
		`;
		const result = await client.query({
			query: users
		});
		expect(result.data['users']).toHaveLength(1);
		expect(result.data['users'][0].email).toBe('coreyj@example.com');
		expect(result.data['users'][0].writtenSubmissions.length).toBeGreaterThan(1);
		expect(result.data['users'][0].writtenSubmissions).toEqual(expect.arrayContaining([expect.objectContaining({title: testData.posts[0].title})]));

	});

	test('all where - nested match and filter in result', async () => {

		const users = gql`
			{
				users (where: {
					writtenSubmissions: {
					match: {
						title: "${testData.posts[0].title}"
					}
					}
				}) {
					name
					email
					writtenSubmissions (where: {
						match: {
						title: "${testData.posts[0].title}"
						}
					}) {
						id
						title
					}
				}
			}
		`;
		const result = await client.query({
			query: users
		});
		expect(result.data['users']).toHaveLength(1);
		expect(result.data['users'][0].email).toBe('coreyj@example.com');
		expect(result.data['users'][0].writtenSubmissions).toHaveLength(1);
		expect(result.data['users'][0].writtenSubmissions[0].title).toBe(testData.posts[0].title);
	});

	test('all where - post connection', async () => {

		const postsConnection = gql`
		{

		postsConnection(first: 1, orderBy: {title: DESC}, after: "${testData.posts[1].id}") {
			edges {
				cursor
				node {
					id
					title
					author {
						name
					}
				}
			}
			pageInfo {
				hasNextPage
				hasPreviousPage
				startCursor
				endCursor
			}
			aggregate {
				count
			}
		}
		}
		`;
		const result = await client.query({
			query: postsConnection
		});

		expect(result.data['postsConnection'].edges).toHaveLength(1);
		expect(result.data['postsConnection'].edges[0].cursor).toBe(result.data['postsConnection'].edges[0].node.id);
		expect(result.data['postsConnection'].edges[0].node.id).toBe(testData.posts[0].id);
		expect(result.data['postsConnection'].aggregate.count).toBe(2);
		expect(result.data['postsConnection'].pageInfo.hasNextPage).toBe(false);
		expect(result.data['postsConnection'].pageInfo.hasPreviousPage).toBe(true);
		expect(result.data['postsConnection'].pageInfo.startCursor).toBe(testData.posts[0].id);
		expect(result.data['postsConnection'].pageInfo.endCursor).toBe(testData.posts[0].id);
	});

	test('all where - post connection', async () => {

		const usersConnection = gql`
		{

		usersConnection(first: 2, orderBy: {name: ASC}, after: "${testData.users[0].id}") {
			edges {
				cursor
				node {
					id
					name
					email
				}
			}
			pageInfo {
				hasNextPage
				hasPreviousPage
				startCursor
				endCursor
			}
			aggregate {
				count
			}
		}
		}
		`;
		const result = await client.query({
			query: usersConnection
		});
		expect(result.data['usersConnection'].edges).toHaveLength(2);
		expect(result.data['usersConnection'].edges[0].cursor).toBe(result.data['usersConnection'].edges[0].node.id);
		expect(result.data['usersConnection'].aggregate.count).toBe(testData.users.length);
		expect(result.data['usersConnection'].pageInfo.hasNextPage).toBe(true);
		expect(result.data['usersConnection'].pageInfo.hasPreviousPage).toBe(true);
		expect(result.data['usersConnection'].pageInfo.startCursor).toBe(result.data['usersConnection'].edges[0].node.id);
		expect(result.data['usersConnection'].pageInfo.endCursor).toBe(result.data['usersConnection'].edges[1].node.id);
	});

	test('find - multiple ordering', async () => {

		const users = gql`
			{
				users(orderBy: {
					name: ASC
			}){
					name
					writtenSubmissions (orderBy: {title: ASC}) {
						title
					}
				}
			}
		`;
		const result = await client.query({
			query: users
		});

		const names = [];
		const namesSorted = [];
		result.data['users'].forEach(user => {
			names.push(user.name);
			namesSorted.push(user.name);
			if (user.writtenSubmissions) {
				const writtenSubmissions = [];
				const writtenSubmissionsSorted = [];
				user.writtenSubmissions.forEach(submission => {
					writtenSubmissions.push(submission.title);
					writtenSubmissionsSorted.push(submission.title);
				});
				writtenSubmissionsSorted.sort();
				expect(writtenSubmissions).toEqual(writtenSubmissionsSorted);
			}
		});
		namesSorted.sort();
		expect(names).toEqual(namesSorted);

	});

	test('find - nested ordering', async () => {
		await client.mutate({
			mutation: createPost,
			variables: { input: { data: { title: 'A Post', author: { connect: { id: testData.users[0].id } } } } }
		});
		await client.mutate({
			mutation: createPost,
			variables: { input: { data: { title: 'F Post', author: { connect: { id: testData.users[0].id } } } } }
		});
		await client.mutate({
			mutation: createPost,
			variables: { input: { data: { title: 'Z Post', author: { connect: { id: testData.users[0].id } } } } }
		});
		const posts = gql`
			{
				posts(orderBy: {author: {writtenSubmissions: {title: DESC}}}){
					title
					author {
						name
						writtenSubmissions {
							title
						}
					}
				}
			}
		`;
		const result = await client.query({
			query: posts
		});

		result.data['posts'].forEach(user => {
			if (user.author && user.author.writtenSubmissions) {
				const writtenSubmissions = [];
				const writtenSubmissionsSorted = [];
				user.author.writtenSubmissions.forEach(submission => {
					writtenSubmissions.push(submission.title);
					writtenSubmissionsSorted.push(submission.title);
				});
				writtenSubmissionsSorted.sort();
				writtenSubmissionsSorted.reverse();

				expect(writtenSubmissions).toEqual(writtenSubmissionsSorted);
			}
		});

	});

	test('find - and logical operator', async () => {

		const users = gql`
			{
				users(where: {and: [{range: {age: [26, 30]}},{exists: {birthday: true}}]}) {
					name
					age
					birthday
				}
			}
		`;

		const result = await client.query({
			query: users
		});
		expect(result.data['users']).toHaveLength(3);
		result.data['users'].forEach(user => {
			expect(user.birthday).not.toBeNull();
			expect(user.age).toBeLessThanOrEqual(30);
			expect(user.age).toBeGreaterThanOrEqual(26);
		});
	});

	test('find - or logical operator', async () => {

		const users = gql`
			{
				users(where: {or: [{range: {age: [26, 30]}},{exists: {birthday: true}}]}) {
					name
					age
					birthday
				}
			}
		`;
		const result = await client.query({
			query: users
		});
		expect.hasAssertions();
		result.data['users'].forEach(user => {
				if (!user.birthday) {
					expect(user.age).toBeLessThanOrEqual(30);
					expect(user.age).toBeGreaterThanOrEqual(26);
				} else if (user.age < 26 || user.age > 30) {
					expect(user.birthday).not.toBeNull();
				}
		});
	});

	test('find - not logical operator', async () => {

		const users = gql`
			{
				users(where: {not: {range: {age: [20, 26]}}}) {
					name
					age
					birthday
				}
			}
		`;

		const result = await client.query({
			query: users
		});
		expect.hasAssertions();
		result.data['users'].forEach(user => {
			if (user.age) {
				expect(user.age).not.toBe(20);
				expect(user.age).not.toBe(21);
				expect(user.age).not.toBe(22);
				expect(user.age).not.toBe(23);
				expect(user.age).not.toBe(24);
				expect(user.age).not.toBe(25);
				expect(user.age).not.toBe(26);
			}
		});
	});

	test('find - node', async () => {

		const nodeQuery = gql`
			{
				node(id: "${testData.posts[0].id}") {
					id
				}
			}
		`;

		const result = await client.query({
			query: nodeQuery
		});
		expect(result.data['node']['id']).toBe(testData.posts[0].id);
	});
});

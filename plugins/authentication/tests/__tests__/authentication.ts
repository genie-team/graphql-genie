import { GraphQLSchema, graphql, print } from 'graphql';
import gql from 'graphql-tag';
import authenticationPlugin from '../../src/authentication';
import { GraphQLGenie } from 'graphql-genie';
import { isArray, isEmpty } from 'lodash';

let schema: GraphQLSchema;
beforeAll(() => {
	const typeDefs = gql`
		enum Role {
			# Open to all requests
			ANY
			# Must be logged in
			USER
			# User must have created/be the type
			OWNER
			ADMIN
		}
		# Only users can create posts, anybody can read posts, only the person who created the post can update/delete it
		type Post @auth(create: USER, read: ANY, update: OWNER, delete: OWNER) {
			id: ID! @unique
			title: String!
			text: String
			# Set a rule of "SELF" here that we can look for in our authenticate function so users aren't allowed to change it to other users
			author: User! @relation(name: "posts") @auth(create: USER, read: ANY, update: OWNER, delete: OWNER, rules: "SELF")
		}

		# Anyone can create users (aka signup), be able to see user info by default, can only update yourself, and only admins can delete
		type User @auth(create: ANY, read: ANY, update: OWNER, delete: ADMIN) {
			id: ID! @unique
			username: String! @unique
			# only users can see their own email, it's not public
			email: String! @unique @auth(create: ANY, read: OWNER, update: OWNER, delete: ADMIN)
			# only admins can read password
			password: String! @auth(create: ANY, read: ADMIN, update: OWNER, delete: ADMIN)
			posts: [Post] @relation(name: "posts")
			# Only admins can alter roles, will need additional logic in authenticate function so users can only set themself to USER role
			# So we set only:USER in the rules so we can find that later in our authenticate function
			roles: [Role] @default(value: "USER") @auth(create: ANY, read: ADMIN, update: ADMIN, delete: ADMIN, rules: "only:USER")
		}
	`;
	const genie = new GraphQLGenie({
		typeDefs,
		plugins: authenticationPlugin()
	});
	schema = genie.getSchema();
});

const testData = {
	users: [],
	posts: []
};
const getUserIDsOfRequestedData = (records: object[], filterRecords: object[]): Set<string> => {
	const userIDs = new Set<string>();
	records.push(filterRecords);
	try {
		records = isArray(records) ? records : [records];
		records.forEach(record => {
			if (record['__typename'] === 'User') {
				userIDs.add(record['id']);
			} else if (record['__typename'] === 'Post' && record['author']) {
				userIDs.add(record['author']);
			}
		});
	} catch (e) {
		// empty by design
	}

	return userIDs;
};
const context = (currUser?) => {
	currUser = currUser || { id: 1, roles: ['ADMIN'] };
	return {
		authenticate: (method, requiredRoles, records, filterRecords, updates, typeName, fieldName, _isFromFilter) => {
			const requiredRolesForMethod: string[] = requiredRoles[method];
			const rules: string[] = requiredRoles.rules || [];
			const currRoles = !isEmpty(currUser) ? currUser['roles'] : [];
			if (currRoles.includes('ADMIN')) {
				return true;
			}

			records = records || [];
			// implement logic for our custom rules
			records.forEach(record => {
				rules.forEach(rule => {
					// we don't want users to be able to create themselves with any other role than USER
					if (['create', 'update'].includes(method) && rule.includes('only:')) {
						const allowedValue = rule.split(':')[1];
						if (record[fieldName]) {
							if (isArray(record[fieldName])) {
								if (record[fieldName].length > 1 || record[fieldName][0] !== allowedValue) {
									throw new Error(`${fieldName} must be [${allowedValue}]`);
								}
							} else if (record[fieldName] !== allowedValue) {
								throw new Error(`${fieldName} must be ${allowedValue}`);
							}
						}
					} else if (rule === 'SELF') {
						// users shouldn't be able to set posts author other than to themselves
						if (['create', 'update'].includes(method)) {
							if (isEmpty(currUser)) {
								throw new Error(`Must be logged in to set ${fieldName}`);
							} else if (record[fieldName] && record[fieldName] !== currUser['id']) {
								throw new Error(`${fieldName} field must be set to logged in USER`);
							}
						}
					}
				});
			});

			if (requiredRolesForMethod.includes('ANY')) {
				return true;
			}

			// the !isEmpty(record) may result in saying to permission even if it's actually just an empty result
			// but it could be a security flaw that allows people to see what "OWNER" fields don't exist otherwise
			if (requiredRolesForMethod.includes('OWNER') && !isEmpty(currUser) && !isEmpty(records)) {
				const userIds = getUserIDsOfRequestedData(records, filterRecords);
				if (userIds.size === 1 && userIds.values().next().value === currUser.id) {
					return true;
				}
			}

			// check if currRoles has any of the required Roles
			const hasNecessaryRole = requiredRolesForMethod.some((role) => {
				return currRoles.includes(role);
			});
			if (!hasNecessaryRole) {
				if (fieldName) {
					throw new Error(`Not authorized to ${method} ${fieldName} on type ${typeName}`);
				} else {
					throw new Error(`Not authorized to ${method} ${typeName}`);
				}
			}
			return true;
		}
	};
};
const createUser = gql`
mutation createUser($input: CreateUserMutationInput!) {
	createUser(input: $input) {
		data {
			id
			username
			email
			password
			roles
		}
		clientMutationId
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
				id
			}
		}
	}
}
`;
const updatePost = gql`
mutation updatePost($input: UpdatePostMutationInput!) {
	updatePost(input: $input) {
		data {
			id
			title
			text
			author {
				id
			}
		}
	}
}
`;
describe('authTest', () => {
	test('must have auth fn', async () => {

		const result = await graphql({
			schema,
			source: print(createUser),
			variableValues: { input: { data: { username: 'Zain', password: 'pass', email: 'zain@example.com', roles: ['USER'] } } },
		});
		expect(result.errors).not.toBeNull();
		expect(result.errors[0].message).toMatch(/must have an authenticate function/ig);

	});

	test('create - user with posts', async () => {

		const zain = await graphql({
			schema,
			source: print(createUser),
			variableValues: { input: { data: { username: 'Zain', password: 'pass', email: 'zain@example.com', roles: ['USER'] } } },
			contextValue: context()
		});
		const steve = await graphql({
			schema,
			source: print(createUser),
			variableValues: { input: { data: { username: 'Steve', password: 'pass', email: 'steve@example.com', roles: ['USER'] } } },
			contextValue: context()
		});

		const pete = await graphql({
			schema,
			source: print(createUser),
			variableValues: { input: { data: { username: 'Pete', password: 'pass', email: 'pete@example.com', roles: ['USER'] } } },
			contextValue: context()
		});

		testData.users.push(zain.data.createUser.data);
		testData.users.push(steve.data.createUser.data);
		testData.users.push(pete.data.createUser.data);

		const user = await graphql({
			schema,
			contextValue: context(),
			source: print(gql`
			mutation {
				createUser(
					input: {
						data: {
							password: "pass"
							email: "zeus@example.com"
							username: "Zeus"
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
				) {
					data {
						id
						username
						email
						roles
						posts {
							id
							title
							text
						}
					}
				}
			}
			`
		)});

		testData.users.push(user.data.createUser.data);
		testData.posts = testData.posts.concat(user.data.createUser.data.posts);
		expect(user.data.createUser.data.username).toBe('Zeus');
		expect(user.data.createUser.data.email).toBe('zeus@example.com');
		expect(user.data.createUser.data.roles).toEqual(['USER']);
		expect(user.data.createUser.data.posts).toHaveLength(3);
		expect(user.data.createUser.data.posts[0].title).toBe('Hello World');
		expect(user.data.createUser.data.posts[1].title).toBe('My Second Post');
		expect(user.data.createUser.data.posts[2].title).toBe('Solving World Hunger');
	});

	test('make sure you can read own email', async () => {
		const user = testData.users[0];
		const result = await graphql({
			schema,
			contextValue: context(user),
			source: print(gql` query {
					user(id: "${user.id}") {
						id
						username
						email
					}
				}
			`)
		});
		expect(result.errors).toBeUndefined();
		expect(result.data.user.username).toBe(user.username);
		expect(result.data.user.email).toBe(user.email);
	});

	test('make sure you can read others username', async () => {
		const currUser = testData.users[0];
		const findUser = testData.users[1];
		const result = await graphql({
			schema,
			contextValue: context(currUser),
			source: print(gql` query {
					user(id: "${findUser.id}") {
						id
						username
					}
				}
			`)
		});
		expect(result.errors).toBeUndefined();
		expect(result.data.user.username).toBe(findUser.username);
	});

	test('make sure you cant read others email', async () => {
		const currUser = testData.users[0];
		const findUser = testData.users[1];
		const result = await graphql({
			schema,
			contextValue: context(currUser),
			source: print(gql` query {
					user(id: "${findUser.id}") {
						id
						username
						email
					}
				}
			`)
		});
		expect(result.errors).not.toBeUndefined();
		expect(result.errors[0].message).toMatch(/not authorized/ig);
	});

	test('make sure you cant read others email with a fragment', async () => {
		const currUser = testData.users[0];
		const findUser = testData.users[1];
		const result = await graphql({
			schema,
			contextValue: context(currUser),
			source: print(gql` query {
					node(id: "${findUser.id}") {
						id
						...on User {
							username
							email
						}
					}
				}
			`)
		});
		expect(result.errors).not.toBeUndefined();
		expect(result.errors[0].message).toMatch(/not authorized/ig);
	});

	test('make sure you can find yourself by email', async () => {
		const currUser = testData.users[0];
		const result = await graphql({
			schema,
			contextValue: context(currUser),
			source: print(gql` query {
					user(email: "${currUser.email}") {
						id
						username
						email
					}
				}
			`)
		});
		expect(result.errors).toBeUndefined();
		expect(result.data.user.username).toBe(currUser.username);
		expect(result.data.user.email).toBe(currUser.email);
	});

	test('make sure you cant find others email', async () => {
		const currUser = testData.users[0];
		const findUser = testData.users[1];
		let result = await graphql({
			schema,
			contextValue: context(currUser),
			source: print(gql` query {
					user(email: "${findUser.email}") {
						id
						username
					}
				}
			`)
		});
		expect(result.errors).not.toBeUndefined();
		expect(result.errors[0].message).toMatch(/not authorized/ig);

		result = await graphql({
			schema,
			contextValue: context(currUser),
			source: print(gql` query {
					user(email: "any value should say not authorized") {
						id
						username
					}
				}
			`)
		});
		expect(result.errors).not.toBeUndefined();
		expect(result.errors[0].message).toMatch(/not authorized/ig);
	});

	test('make sure you cant create yourself with admin role', async () => {
		const result = await graphql({
			schema,
			contextValue: context({}),
			source: print(createUser),
			variableValues: { input: { data: { username: 'new', password: 'pass', email: 'new@example.com', roles: ['ADMIN'] } } },
		});
		expect(result.errors).not.toBeUndefined();
		expect(result.errors[0].message).toBe('roles must be [USER]');
	});

	test('make sure you need author to make a post', async () => {
		const currUser = testData.users[0];

		const result = await graphql({
			schema,
			contextValue: context(currUser),
			source: print(createPost),
			variableValues: { input: { data: { title: 'bam', text: 'bam' } } },
		});
		expect(result.errors).not.toBeUndefined();
	});

	test('make sure you have to be logged in to create a post', async () => {
		const currUser = testData.users[0];

		const result = await graphql({
			schema,
			contextValue: context({}),
			source: print(createPost),
			variableValues: { input: { data: { title: 'bam', text: 'bam', author: {connect: {id: currUser.id}} } } },
		});
		expect(result.errors).not.toBeUndefined();
		expect(result.errors[0].message).toMatch(/not authorized/gi);

	});

	test('make sure you can create a post', async () => {
		const currUser = testData.users[0];

		const result = await graphql({
			schema,
			contextValue: context(currUser),
			source: print(createPost),
			variableValues: { input: { data: { title: 'bam', text: 'bam', author: {connect: {id: currUser.id}} } } },
		});
		expect(result.errors).toBeUndefined();
		currUser.posts = [result.data.createPost.data];
		expect(result.data.createPost.data.title).toBe('bam');
		expect(result.data.createPost.data.text).toBe('bam');
		expect(result.data.createPost.data.author.id).toBe(currUser.id);
	});

	test('make sure you cant create a post on another user', async () => {
		const currUser = testData.users[0];
		const otherUser = testData.users[1];
		const result = await graphql({
			schema,
			contextValue: context(currUser),
			source: print(createPost),
			variableValues: { input: { data: { title: 'bam', text: 'bam', author: {connect: {id: otherUser.id}} } } },
		});
		expect(result.errors).not.toBeUndefined();
		expect(result.errors[0].message).toMatch(/field must be set to logged in USER/ig);
	});

	test('make sure you can update your post', async () => {
		const currUser = testData.users[0];
		const result = await graphql({
			schema,
			contextValue: context(currUser),
			source: print(updatePost),
			variableValues: { input: {where: {id: currUser.posts[0].id}, data: { title: 'update' } } },
		});
		expect(result.errors).toBeUndefined();
		expect(result.data.updatePost.data.title).toBe('update');
	});

	test('make sure you cant update another users post', async () => {
		const currUser = testData.users[0];
		const result = await graphql({
			schema,
			contextValue: context(currUser),
			source: print(updatePost),
			variableValues: { input: {where: {id: testData.posts[0].id}, data: { title: 'update' } } },
		});
		expect(result.errors).not.toBeUndefined();
		expect(result.errors[0].message).toMatch(/not authorized/ig);
	});

	test('make sure you cant read own password', async () => {
		const user = testData.users[0];
		const result = await graphql({
			schema,
			contextValue: context(user),
			source: print(gql` query {
					user(id: "${user.id}") {
						id
						username
						email
						password
					}
				}
			`)
		});
		expect(result.errors).not.toBeUndefined();
		expect(result.errors[0].message).toMatch(/not authorized/ig);
	});

	test('make sure you can delete own post', async () => {
		const user = testData.users[0];
		const result = await graphql({
			schema,
			contextValue: context(user),
			source: print(gql` mutation {
					deletePost(input: {where: {id: "${user.posts[0].id}"}}) {
						data {
							id
						}
					}
				}
			`)
		});
		expect(result.errors).toBeUndefined();
		expect(result.data.deletePost.data.id).toBe(user.posts[0].id);
	});
});

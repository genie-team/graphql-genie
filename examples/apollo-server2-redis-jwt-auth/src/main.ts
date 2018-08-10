import { FortuneOptions, GraphQLGenie, getRecordFromResolverReturn } from 'graphql-genie';
import subscriptionPlugin from 'graphql-genie-subscriptions';
import { PubSub } from 'graphql-subscriptions';
import { ApolloServer, AuthenticationError, ForbiddenError} from 'apollo-server';
import redisAdapter from 'fortune-redis';
import RedisMock from 'ioredis-mock';
import authPlugin from 'graphql-genie-authentication';
import { mergeSchemas } from 'graphql-tools';
import bcrypt from 'bcryptjs';
import { GraphQLSchema, assertObjectType } from 'graphql';
import { isArray, isEmpty, pick } from 'lodash';
import jwt from 'jsonwebtoken';
const typeDefs = `
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
type Post @model @auth(create: USER, read: ANY, update: OWNER, delete: OWNER) {
  id: ID! @unique
	title: String!
	text: String
	author: User @relation(name: "posts") @auth(rules: "SELF", create: USER, read: ANY, update: OWNER, delete: OWNER)
}

# Anyone can create users (aka signup), be able to see user info by default, can only update yourself, and only admins can delete
type User @model @auth(create: ANY, read: ANY, update: OWNER, delete: ADMIN) {
	id: ID! @unique
	username: String! @unique
	# don't let anyone read email
	email: String! @unique @auth(create: ANY, read: OWNER, update: OWNER, delete: ADMIN)
	# only admins can read password
	password: String! @auth(create: ANY, read: ADMIN, update: OWNER, delete: ADMIN)
  name : String
	posts: [Post] @relation(name: "posts")
	# Only admins can alter roles, will need additional logic in authenticate function so users can only set themself to USER role
	roles: [Role] @default(value: "USER") @auth(create: ANY, read: ADMIN, update: ADMIN, delete: ADMIN, rules: "only:USER")
}

# Notice this isn't part of the model, so queries/mutations won't be created for it.
# We will still add @auth to it though as the importData resolver could alter it otherwise
# Exists so we can store identifiers in all lowercase, but we will use the backend data resolver instead of graphql
type UserIdentifiers @auth {
	id: ID!
	userID: ID
	password: String
	identifiers: [String]
	roles: [Role]
}

`;

interface CurrentUser {
	id?: string;
	roles?: string[];
}

const jwtSecret = '8adaf8ceea87f545e600477c37d9b5b461afe95fb26402646b0b58ecd9a2dbab';
const jwtOptions = {
	expiresIn: '7d'
};
const fortuneOptions: FortuneOptions = {
	adapter: [
		redisAdapter,
		{
			createClientFactory() {
				return new RedisMock();
			}
		}
	]
};
const genie = new GraphQLGenie({
	typeDefs, fortuneOptions, generatorOptions: {
		generateGetAll: true,
		generateCreate: true,
		generateUpdate: true,
		generateDelete: true,
		generateUpsert: true
	}
});

const startServer = async (genie: GraphQLGenie) => {
	const dataResolver = genie.getDataResolver();

	// setup a basic admin user using genie import data function
	// to do so we will use the compute ID function of the data resolver
	// this is necessary because genie has the type encoded in the id
	const adminUserID = dataResolver.computeId('User', 'admin');
	const adminPassword = bcrypt.hashSync('admin', 10);
	// if we base the ID on the user id then we don't have to do a find for updates
	const userIdentifierID = dataResolver.computeId('UserIdentifiers', dataResolver.getOriginalIdFromObjectId(adminUserID));

	await genie.importRawData([
		{
			id: adminUserID,
			username: 'Admin',
			email: 'Admin@example.com',
			password: adminPassword,
			roles: ['ADMIN', 'USER'],
			__typename: 'User'
		},
		{
			id: userIdentifierID,
			userID: adminUserID,
			password: adminPassword,
			roles: ['ADMIN', 'USER'],
			identifiers: ['admin', 'admin@example.com'],
			__typename: 'UserIdentifiers'
		}
	], true);
	// now setup the plugins
	genie.use(subscriptionPlugin(new PubSub()));
	genie.use(authPlugin());

	// now add additional functionality to the schema for login/signup
	const schema = getSchemaWithAuth(genie);

	// add a hook to encrypt passwords when a user is created/updated
	dataResolver.addInputHook('User', (context, record, update) => {
		switch (context.request.method) {
			case 'create':
				if (record.password) {
					record.password = bcrypt.hashSync(record.password, 10);
				}
				return record;
			case 'update':
				if (update.replace.password) {
					update.replace.password = bcrypt.hashSync(update.replace.password, 10);
				}
				return update;
		}
	});

	// add a hook so the UserIdentifiers db stays up to date
	dataResolver.addOutputHook('User', async (context, record) => {
		const method = context.request.method;
		const id = dataResolver.computeId('UserIdentifiers', dataResolver.getOriginalIdFromObjectId(record.id));
		const username = record.username ? record.username.toLowerCase() : null;
		const email = record.email ? record.email.toLowerCase() : null;
		const identifiers = [];
		if (username) {
			identifiers.push(username);
		}
		if (email) {
			identifiers.push(email);
		}

		const meta = {
			context: {
				authenticate: () => true
			}
		};

		switch (method) {
			case 'update':
			case 'create':
				// make the record for UserIdentifiers
				const idRecord = {
					id,
					userID: record.id,
					identifiers,
					password: record.password,
					roles: record.roles
				};
				await dataResolver[method]('UserIdentifiers', idRecord, meta);
				return record;
			case 'delete':
				await dataResolver.delete('UserIdentifiers', [id], meta);
				return record;
		}
	});

	// options for apollo server
	const opts = {
		port: 4000
	};

	// start the server. Must pass in an authenticate function which returns true if the operation is allowed.
	// if the operation is not allowed either return false or throw an error
	const server = new ApolloServer({
		schema,
		context: request => {
			const bearer = parseAuthorizationBearer(request.req || request.connection);
			let currUser: CurrentUser = {};
			if (bearer) {
				currUser = jwt.verify(bearer, jwtSecret);
			}
			return {
				request,
				currUser,
				authenticate: (method, requiredRoles, records, filterRecords, _updates, typeName, fieldName, _isFromFilter) => {
					// throw your own error or just return false if not authorized
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
											throw new ForbiddenError(`${fieldName} must be [${allowedValue}]`);
										}
									} else if (record[fieldName] !== allowedValue) {
										throw new ForbiddenError(`${fieldName} must be ${allowedValue}`);
									}
								}
							} else if (rule === 'SELF') {
								// users shouldn't be able to set posts author other than to themselves
								if (['create', 'update'].includes(method)) {
									if (isEmpty(currUser)) {
										throw new ForbiddenError(`Must be logged in to set ${fieldName}`);
									} else if (record[fieldName] && record[fieldName] !== currUser['id']) {
										throw new ForbiddenError(`${fieldName} field must be set to logged in USER`);
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
							throw new AuthenticationError(`Not authorized to ${method} ${fieldName} on type ${typeName}`);
						} else {
							throw new AuthenticationError(`Not authorized to ${method} ${typeName}`);
						}
					}
					return true;

				}
			};
		}
	});

	server.listen(opts).then(({ url }) => {
		console.log(`🚀 Server ready at ${url}`);
	}).catch();
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

const getSchemaWithAuth = (genie: GraphQLGenie): GraphQLSchema => {

	// make the createUser mutation login the user;
	const schema = genie.getSchema();
	const createUserField = assertObjectType(schema.getType('Mutation')).getFields()['createUser'];
	const createUserResolver = createUserField.resolve;
	createUserField.resolve = async function (record, args, context, info) {
		const createdUser = await createUserResolver.apply(this, [record, args, context, info]);
		if (createdUser) {

			// don't change user if logged
			if (context && context.hasOwnProperty('currUser') && isEmpty(context.currUser)) {
				// the mutate r*esolver will return with other metadata but we just want the actual record
				const userData = getRecordFromResolverReturn(createdUser);
				context.currUser['id'] = userData['id'];
				context.currUser['roles'] = userData['roles'];
			}

		}
		return createdUser;
	};

	// TODO: alter createUser mutation to return JWT, need to add jwt to UserPayload and wrap the resolver

	// create the new queries/mutations and resolvers
	return mergeSchemas({
		schemas: [
			schema,
			`extend type Mutation {
				login(identifier: String!, password: String!): ID
			}
			extend type UserPayload {
				"""
				Provided on signup (createUser mutation)
				"""
				jwt: String
			}`
		],
		resolvers: {
			UserPayload: {
				jwt: {
					fragment: `... on UserPayload { id, roles }`,
					resolve(_record, _args, context, _info) {
						let token;
						if (context && !isEmpty(context.currUser)) {
							token = jwt.sign(
								pick(context.currUser, ['id', 'roles']),
								jwtSecret,
								jwtOptions
							);
						}
						return token;
					}
				}
			},
			Mutation: {
				login: async (_, { identifier, password }) => {

					identifier = identifier.toLowerCase();
					const identifiedUser = await genie.getDataResolver().find('UserIdentifiers', undefined, {
						match: {
							identifiers: identifier
						}
					});
					if (!isEmpty(identifiedUser)) {
						if (bcrypt.compareSync(password, identifiedUser[0].password)) {
							// set HTTP Headers to { "authorization": "Bearer ${accessToken} }
							return jwt.sign(
								{
									id: identifiedUser[0].userID,
									roles: identifiedUser[0].roles
								},
								jwtSecret,
								jwtOptions
							);
						}
						throw new AuthenticationError('Incorrect password.');
					}
					throw new AuthenticationError('No Such User exists.');
				},
			},
		}
	});
};
const parseAuthorizationBearer = params => {
	let authorization = params.headers && params.headers.authorization;
	authorization = authorization ? authorization : params.context && params.context.authorization;
	if (!authorization) return;
	const headerParts = authorization.split(' ');
	if (headerParts[0].toLowerCase() === 'bearer') return headerParts[1];
};
startServer(genie).catch();

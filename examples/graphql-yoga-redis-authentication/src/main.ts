import subscriptionPlugin from 'graphql-genie-subscriptions';
import authPlugin from 'graphql-genie-authentication';
import { PubSub } from 'graphql-subscriptions';
import { GraphQLServer } from 'graphql-yoga';
import redisAdapter from 'fortune-redis';
import RedisMock from 'ioredis-mock';
import { FortuneOptions, GraphQLGenie, getRecordFromResolverReturn } from 'graphql-genie';
import { makeExecutableSchema, mergeSchemas } from 'graphql-tools';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import ms from 'ms';
import { GraphQLSchema, assertObjectType, graphql } from 'graphql';
import { get } from 'lodash';
const typeDefs = `
# ANY is open to all requests, USER means they must be logged in, OWNER the user must have created or be the type
enum Role {
	ANY
	USER
	OWNER
	ADMIN
}

type Post @auth(create: USER, read: ANY, update: OWNER, delete: OWNER) {
  id: ID! @unique
	title: String!
	text: String
  author: User @relation(name: "posts")
}

type User @auth(create: ANY, read: ANY, update: OWNER, delete: ADMIN) {
	id: ID! @unique
	username: String! @unique
	email: String! @unique @auth(create: ANY, read: OWNER, update: OWNER, delete: ADMIN)
	password: String! @auth(create: ANY, read: ADMIN, update: OWNER, delete: ADMIN)
  name : String
	posts: [Post] @relation(name: "posts")
	roles: [Role] @default(value: "USER") @auth(create: ANY, read: ADMIN, update: ADMIN, delete: ADMIN)
}
`;

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
	await genie.init();

	// setup a basic admin user
	await genie.importRawData([
		{
			username: 'admin',
			email: 'admin@example.com',
			password: bcrypt.hashSync('admin', 10),
			roles: ['ADMIN', 'USER'],
			__typename: 'User'
		}
	], true);

	// load all the users so that we don't have to constantly do db calls to check roles, etc
	const users = new Map<String, object>();
	loadUsers(genie, users);

	// now setup the plugins
	await genie.use(subscriptionPlugin(new PubSub()));
	await genie.use(authPlugin());

	// now add additional functionality to the schema for login/signup
	const authSchema = getAuthSchema(genie, users);
	const schema = mergeSchemas({
		schemas: [
			genie.getSchema(),
			authSchema
		],
	});

	// options for graphql yoga
	const opts = {
		port: 4000,
		cors: {
			credentials: true,
			origin: ['http://localhost:8080'] // your frontend url.
		}
	};

	// add a hook to encrypt passwords when a user is created/updated
	genie.getDataResolver().addInputHook('User', (context, record, update) => {
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

	// start the server. Must pass in an authenticate function which returns true if the operation is allowed.
	// if the operation is not allowed either return false or throw an error
	const server = new GraphQLServer({
		schema,
		context: req => ({
			...req,
			authenticate: (method, requiredRoles, record, _updates, typeName, fieldName) => {
				console.log('updates :', _updates);
				// throw your own error or just return false if not authorized
				const requiredRolesForMethod: any[] = requiredRoles[method];
				const currUser = get(req, 'request.session.user');
				const currRoles = currUser ? currUser.roles : [];
				if (currRoles.includes('ADMIN')) {
					return true;
				}

				// specific field constraints

				// we don't want users to be able to create themselves with any other role than USER
				if (method === 'create' && record.roles && (record.roles.length > 1 || record.roles[0] !== 'USER')) {
					throw new Error('Roles must be [USER]');
				}

				// users shouldn't be able to set posts author other than to themselves
				if (currUser && ['create', 'update'].includes(method) && typeName === 'Post') {
					if (!record.author || record.author !== currUser.id ) {
						throw new Error('Author field must be set to logged in USER');
					}
				}

				if (requiredRolesForMethod.includes('ANY')) {
					return true;
				}

				if (requiredRolesForMethod.includes('OWNER') && currUser) {
					if (record.author === currUser.id || record.id === currUser.id) {
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
		})
	});
	// session middleware
	server.express.use(session({
		name: 'qid',
		secret: `insatiable-tacos-in-heaven`,
		resave: true,
		saveUninitialized: true,
		cookie: {
			secure: process.env.NODE_ENV === 'production',
			maxAge: ms('1d'),
		},
	}));

	server.start(opts, () => console.log('Server is running on localhost:4000'));
};

const loadUsers = async (genie: GraphQLGenie, users: Map<String, object>) => {
	const dbUsers = await graphql(genie.getSchema(), `{
		users {
			id
			username
			email
			password
			roles
		}
	}`);

	dbUsers.data.users.forEach(user => {
		users.set(user.id, user);
	});

	// add a hook so the users stay up to date
	genie.getDataResolver().addOutputHook('User', (context, record) => {
		switch (context.request.method) {
			case 'create':
			case 'update':
				users.set(record.id, record);
				return record;
			case 'delete':
				users.delete(record.id);
				return record;
		}
	});
};

const getAuthSchema = (genie: GraphQLGenie, users: Map<String, object>): GraphQLSchema => {

	// make the createUser mutation login the user;

	const createUserField = assertObjectType(genie.getSchema().getType('Mutation')).getFields()['createUser'];
	const createUserResolver = createUserField.resolve;
	createUserField.resolve = async function (record, args, context, info) {
		const createdUser = await createUserResolver.apply(this, [record, args, context, info]);
		if (createdUser) {
			// don't change user if logged in as admin
			if (!context.request.session.user || !context.request.session.user.roles || !context.request.session.user.roles.includes['ADMIN']) {
				// the mutate resolver will return with other metadata but we just want the actual record
				const userData = getRecordFromResolverReturn(createdUser);
				context.request.session.user = {
					...userData
				};
			}
		}
		return createdUser;
	};

	// create the new queries/mutations and resolvers
	return makeExecutableSchema({
		typeDefs: `
			type Query {
				isLogin: Boolean
			}
			type Mutation {
				login(identifier: String!, password: String!): Boolean
			}
		`,
		resolvers: {
			Query: {
				isLogin: (_, __, { request }) => typeof request.session.user !== 'undefined',
			},
			Mutation: {
				login: async (_, { identifier, password }, { request }) => {
					let identifiedUser;
					identifier = identifier.toLowerCase();
					for (const user of users.values()) {
						if (user['email'].toLowerCase() === identifier || user['username'].toLowerCase() === identifier) {
							identifiedUser = user;
							break;
						}
					}
					if (identifiedUser) {
						if (bcrypt.compareSync(password, identifiedUser.password)) {
							request.session.user = {
								...identifiedUser
							};
							return true;
						}
						throw new Error('Incorrect password.');
					}
					throw new Error('No Such User exists.');
				},
			},
		}
	});
};

startServer(genie);

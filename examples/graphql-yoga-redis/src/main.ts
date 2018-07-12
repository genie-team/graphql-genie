import authPlugin from 'graphql-genie-authentication';
import { FortuneOptions, GraphQLGenie } from 'graphql-genie';
import { PubSub } from 'graphql-subscriptions';
import { GraphQLServer } from 'graphql-yoga';
import redisAdapter from 'fortune-redis';
import RedisMock from 'ioredis-mock';
import subscriptionPlugin from 'graphql-genie-subscriptions';
import { makeExecutableSchema, mergeSchemas } from 'graphql-tools';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import ms from 'ms';
import { GraphQLSchema, graphql } from 'graphql';
const typeDefs = `

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
	email: String! @unique
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

	await genie.importRawData([
		{
			username: 'admin',
			email: 'admin@example.com',
			password: bcrypt.hashSync('admin', 10),
			roles: ['ADMIN', 'USER'],
			__typename: 'User'
		}
	], true);

	let schema = genie.getSchema();

	// load all the users so that we don't have to constantly do db calls to check roles, etc
	const users = new Map<String, object>();
	loadUsers(genie, users);

	const authSchema = getAuthSchema(users);

	// now setup the plugins
	await genie.use(subscriptionPlugin(new PubSub()));
	await genie.use(authPlugin());

	schema = mergeSchemas({
		schemas: [
			genie.getSchema(),
			authSchema
		],
	});

	// opts
	const opts = {
		port: 4000,
		cors: {
			credentials: true,
			origin: ['http://localhost:8080'] // your frontend url.
		}
	};

	const server = new GraphQLServer({
		schema,
		context: req => ({
			...req,
			authenticate: (method, requiredRoles, record) => {
				const requiredRolesForMethod: any[] = requiredRoles[method];
				if (requiredRolesForMethod.includes('ANY')) {
					return true;
				}
				try {
					const currUser = req.request['session'].user;
					const currRoles = currUser.roles;
					if (currRoles.includes('ADMIN')) {
						return true;
					}
					// we don't want users to be able to create themselves with any other role than USER
					if (!currRoles.includes('ADMIN') && record.roles && record.roles.length > 1 && record.roles[0] !== 'USER') {
						throw new Error('Roles must be [USER]');
					}
					if (requiredRolesForMethod.includes('OWNER') && record.author === currUser.id) {
						return true;
					}

					// check if currRoles has any of the required Roles
					return requiredRolesForMethod.some((role) => {
						return currRoles.includes(role);
					});
				} catch (e) {
					return false;
				}
	
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
				break;
			case 'delete':
				users.delete(record.id);
		}
	});
};

const getAuthSchema = (users: Map<String, object>): GraphQLSchema => {
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
				login: async (_, { identifier, password }, {request}) => {
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

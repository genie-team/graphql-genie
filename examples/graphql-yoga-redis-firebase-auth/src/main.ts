import subscriptionPlugin from 'graphql-genie-subscriptions';
import authPlugin from 'graphql-genie-authentication';
import { PubSub } from 'graphql-subscriptions';
import { GraphQLServer } from 'graphql-yoga';
import redisAdapter from 'fortune-redis';
import RedisMock from 'ioredis-mock';
import { FortuneOptions, GraphQLGenie } from 'graphql-genie';
import { graphql } from 'graphql';
import config from './config.json';
import admin, { ServiceAccount } from 'firebase-admin';
import express from 'express';
import { get } from 'lodash';
import path from 'path';
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
	displayname: String @unique
	email: String! @unique @auth(create: ANY, read: OWNER, update: OWNER, delete: ADMIN)
  name : String @auth(create: ANY, read: OWNER, update: OWNER, delete: ADMIN)
	posts: [Post] @relation(name: "posts")
	roles: [Role] @default(value: "USER") @auth(create: ADMIN, read: ADMIN, update: ADMIN, delete: ADMIN)
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
	const serviceAccount = <ServiceAccount>config.firebase;
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
		databaseURL: 'https://tabletop-companion-5f73c.firebaseio.com'
	});

	await genie.init();

	// load all the users so that we don't have to constantly do db calls to check roles, etc
	const users = new Map<String, object>();
	loadUsers(genie, users);

	// now setup the plugins
	await genie.use(subscriptionPlugin(new PubSub()));
	await genie.use(authPlugin());

	// options for graphql yoga
	const opts = {
		port: 4000,
		endpoint: '/graphql',
		subscriptions: '/subscriptions',
		playground: '/playground'
	};
	const schema = genie.getSchema();

	// start the server. Must pass in an authenticate function which returns true if the operation is allowed.
	// if the operation is not allowed either return false or throw an error
	const server = new GraphQLServer({
		schema
	});
	server.context = async (req) => {
		// first check the logged in user.
		const bearer = parseAuthorizationBearer(req.request);
		let decodedToken;
		let uid;
		let currUser;
		let currRoles = [];
		let error;
		if (bearer) {
			try {
				decodedToken = await admin.auth().verifyIdToken(bearer);
				uid = decodedToken.uid;
				const dataResolver = genie.getDataResolver();
				const id = dataResolver.computeId('User', uid);

				if (!users.has(id)) {
					// if this is the first user ever created, give them ADMIN
					let roles = ['USER'];
					if (users.size === 0) {
						roles = ['ADMIN'];
					}
					currUser = await dataResolver.create('User', {
						id,
						name: decodedToken.name,
						email: decodedToken.email,
						roles
					}, {
							context: {
								authenticate: () => true
							}
						});
				} else {
					currUser = users.get(id);
				}

				currRoles = currUser.roles;
			} catch (e) {
				console.error(e);
				error = e;
			}
		}

		// set the context with authenticate function
		return {
			...req,
			authenticate: async (method, requiredRoles, record, _updates, typeName, fieldName) => {
				if (error) {
					throw new Error('You probably need to login again to get a new JWT. ' + error.message);
				}
				const requiredRolesForMethod: any[] = requiredRoles[method];
				if (currRoles.includes('ADMIN')) {
					return true;
				}

				// specific field constraints

				// users shouldn't be able to set posts author other than to themselves
				if (currUser && ['create', 'update'].includes(method) && typeName === 'Post') {
					if (!record.author || record.author !== currUser.id) {
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
		};
	};
	const cwd = process.cwd();
	let publicPath: string;
	// assumed cwd is root of this project or graphql-genie, may need to change
	// tslint:disable-next-line:prefer-conditional-expression
	if (cwd.includes('graphql-yoga-redis-firebase-auth')) {
		publicPath = path.join(cwd, 'public/');
	} else {
		publicPath = path.join(cwd, 'examples/graphql-yoga-redis-firebase-auth/public/');
	}
	server.express.use(express.static(publicPath));
	server.start(opts, () => {
		console.log('Server is running on localhost:4000');
	});

};

const loadUsers = async (genie: GraphQLGenie, users: Map<String, object>) => {
	const dataResolver = genie.getDataResolver();
	const dbUsers = await graphql(genie.getSchema(), `{
		users {
			id
			username
			email
			password
			roles
		}
	}`);

	const usersResult = get(dbUsers, 'data.users') || [];
	usersResult.forEach(user => {
		users.set(user.id, user);
	});
	// add a hook so the users stay up to date
	dataResolver.addOutputHook('User', (context, record) => {
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

const parseAuthorizationBearer = req => {
	if (!req.headers.authorization) return;
	const headerParts = req.headers.authorization.split(' ');
	if (headerParts[0].toLowerCase() === 'bearer') return headerParts[1];
};

startServer(genie);

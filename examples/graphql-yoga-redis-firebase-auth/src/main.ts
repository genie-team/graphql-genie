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
	const serviceAccount = <ServiceAccount>config.firebase;
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
		databaseURL: 'https://tabletop-companion-5f73c.firebaseio.com'
	});

	await genie.init();

	// // setup a basic admin user
	// await genie.importRawData([
	// 	{import { genie } from '../../../src/tests/setupTests';

	// 		username: 'admin',
	// 		email: 'admin@example.com',
	// 		password: bcrypt.hashSync('admin', 10),
	// 		roles: ['ADMIN', 'USER'],
	// 		__typename: 'User'
	// 	}
	// ], true);

	// load all the users so that we don't have to constantly do db calls to check roles, etc
	const users = new Map<String, object>();
	loadUsers(genie, users);

	// now setup the plugins
	await genie.use(subscriptionPlugin(new PubSub()));
	await genie.use(authPlugin());

	// options for graphql yoga
	const opts = {
		port: 3000,
		endpoint: '/graphql',
		subscriptions: '/subscriptions',
		playground: '/playground',
		cors: {
			origin: true
		}
	};
	const schema = genie.getSchema();
	// start the server. Must pass in an authenticate function which returns true if the operation is allowed.
	// if the operation is not allowed either return false or throw an error
	const server = new GraphQLServer({
		schema,
		context: req => ({
			...req,
			authenticate: async (_method, _requiredRoles, _record, _updates, _typeName, _fieldName) => {
				const bearer = parseAuthorizationBearer(req.request);
				console.log(req.request.headers);
				console.log(bearer);
				const start = Date.now();
				const decodedToken = await admin.auth().verifyIdToken(bearer);
				console.log('time to verify :', Date.now() - start);
				console.log('decodedToken :', decodedToken);
				return true;
			}
		})
	});
	// assumed cwd is root of graphql-genie, may need to change
	server.express.use(express.static(path.join(process.cwd(), 'examples/graphql-yoga-redis-firebase-auth/public/')));
	server.start(opts, () => {
		console.log('Server is running on localhost:3000');
	});

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
	const usersResult = get(dbUsers, 'data.users') || [];
	usersResult.forEach(user => {
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

const parseAuthorizationBearer = req => {
	if (!req.headers.authorization) return;
	const headerParts = req.headers.authorization.split(' ');
	if (headerParts[0].toLowerCase() === 'bearer') return headerParts[1];
};

startServer(genie);

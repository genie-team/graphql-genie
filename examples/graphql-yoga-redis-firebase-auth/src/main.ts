import subscriptionPlugin from 'graphql-genie-subscriptions';
import authPlugin from 'graphql-genie-authentication';
import { PubSub } from 'graphql-subscriptions';
import { GraphQLServer } from 'graphql-yoga';
import redisAdapter from 'fortune-redis';
import RedisMock from 'ioredis-mock';
import { FortuneOptions, GraphQLGenie } from 'graphql-genie';
import config from './config.json';
import admin, { ServiceAccount } from 'firebase-admin';
import express from 'express';
import { isArray, isEmpty } from 'lodash';
import path from 'path';
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

# Only users can create Todos, anybody can read todos, only the person who created the post can update/delete it
type Todo @model @auth(create: USER, read: ANY, update: OWNER, delete: OWNER) {
  id: ID! @unique
	title: String
	text: String
	author: User @relation(name: "todos") @auth(create: USER, read: ANY, update: OWNER, delete: OWNER)
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
	todos: [Post] @relation(name: "todos")
	# Only admins can alter roles, will need additional logic in authenticate function so users can only set themself to USER role
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

const allowAllMeta = {
	context: {
		authenticate: () => true
	}
};

let hasUser = false;

const startServer = async (genie: GraphQLGenie) => {
	const serviceAccount = <ServiceAccount>config.firebase;
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
		databaseURL: 'https://tabletop-companion-5f73c.firebaseio.com'
	});

	// now setup the plugins
	genie.use(subscriptionPlugin(new PubSub()));
	genie.use(authPlugin());
	const dataResolver = genie.getDataResolver();

	// this will always be empty as we are mocking a db but for example sake
	let allUsers = await dataResolver.find('User');
	if (!allUsers || isEmpty(allUsers)) {
		hasUser = true;
	}
	allUsers = null; // could be large and no longer needed this should help garbage collection

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
		console.log('req :', req);
		const bearer = parseAuthorizationBearer(req.request || req.connection);
		let decodedToken;
		let uid;
		let currUser;
		let currRoles = [];
		let error;
		if (bearer) {
			try {
				decodedToken = await admin.auth().verifyIdToken(bearer);
				uid = decodedToken.uid;
				const id = dataResolver.computeId('User', uid);
				currUser = await dataResolver.getValueByUnique('User', {id}, allowAllMeta);
				if (!currUser || isEmpty(currUser)) {
					// if this is the first user ever created, give them ADMIN
					let roles = ['USER'];
					if (!hasUser) {
						roles = ['ADMIN'];
					}

					// create the user with the data resolver, note the meta argument can have a context which is needed to allow the create
					currUser = await dataResolver.create('User', {
						id,
						name: decodedToken.name,
						email: decodedToken.email,
						roles
					}, allowAllMeta);
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
			authenticate: async (method, requiredRoles, records, _filterRecords, _updates, typeName, fieldName) => {
				if (error) {
					throw new Error('You probably need to login again to get a new JWT. ' + error.message);
				}
				if (isArray(records) && records.length === 1) {
					records = records[0];
				}

				const requiredRolesForMethod: any[] = requiredRoles[method];
				if (currRoles.includes('ADMIN')) {
					return true;
				}

				// specific field constraints

				// users shouldn't be able to set posts author other than to themselves
				if (currUser && ['create', 'update'].includes(method) && typeName === 'Post') {
					if (!records.author || records.author !== currUser.id) {
						throw new Error('Author field must be set to logged in USER');
					}
				}

				if (requiredRolesForMethod.includes('ANY')) {
					return true;
				}

				if (requiredRolesForMethod.includes('OWNER') && currUser && records) {
					if (records.author === currUser.id || records.id === currUser.id) {
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
	}).catch();

};

const parseAuthorizationBearer = params => {
	let authorization = params.headers && params.headers.authorization;
	authorization = authorization ? authorization : params.context && params.context.authorization;
	if (!authorization) return;
	const headerParts = authorization.split(' ');
	if (headerParts[0].toLowerCase() === 'bearer') return headerParts[1];
};

startServer(genie).catch();

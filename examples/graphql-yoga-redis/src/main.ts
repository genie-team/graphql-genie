import { FortuneOptions, GraphQLGenie } from 'graphql-genie';
import subscriptionPlugin from 'graphql-genie-subscriptions';
import { PubSub } from 'graphql-subscriptions';
import { GraphQLServer } from 'graphql-yoga';
import redisAdapter from 'fortune-redis';
import RedisMock from 'ioredis-mock';
import authPlugin from '../../../plugins/authentication/lib/module';

const typeDefs = `

interface Submission {
	id: ID! @unique
	title: String!
	text: String
}

type Post implements Submission @auth {
  id: ID! @unique
	title: String!
	text: String
  author: User @relation(name: "WrittenSubmissions")
	likedBy: [User!] @relation(name: "LikedPosts") @connection
	comments: [Comment] @relation(name: "CommentsOnPost")
	published: Boolean @default(value: "true")
}

type Comment implements Submission {
  id: ID! @unique
	title: String!
	text: String
  author: User @relation(name: "WrittenSubmissions")
	post: Post @relation(name: "CommentsOnPost")
	approved: Boolean @default(value: "true")
}


type User @auth {
	id: ID! @unique
	email: String! @unique
  name : String!
  address: Address
	writtenSubmissions: [Submission] @relation(name: "WrittenSubmissions")
	age: Int
	birthday: Date
	likedPosts: [Post!] @relation(name: "LikedPosts") @connection
	family: [User]
	match: User
	orderBy: String
	starred: [Star]
}

type Address {
  id: ID! @unique
  city: String!
  user: User
}

union Star = Address | User | Comment | Post


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
console.log('GraphQL Genie Started');
const genie = new GraphQLGenie({ typeDefs, fortuneOptions, generatorOptions: {
	generateGetAll: true,
	generateCreate: true,
	generateUpdate: true,
	generateDelete: true,
	generateUpsert: true
}});
const buildClient = async (genie: GraphQLGenie) => {
	await genie.init();
	await genie.use(subscriptionPlugin(new PubSub()));
	await genie.use(authPlugin());
	const schema = genie.getSchema();
	const server = new GraphQLServer({
		schema,
		context: {
			authenticate: (method, requiredRoles, record) => {
				console.log(method, requiredRoles, record);
				return method === 'read';
			}
		}
	});
	server.start(() => console.log('Server is running on localhost:4000'));
};
buildClient(genie);

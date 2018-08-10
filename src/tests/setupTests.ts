import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { SchemaLink } from 'apollo-link-schema';
import { GraphQLGenie } from '../index';

const typeDefs = `

interface Submission {
	id: ID! @unique
	title: String!
	text: String
}

type Post implements Submission {
  id: ID! @unique
	title: String!
	text: String
	tags: [String]
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


type User {
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
process['testSetup'] = {};
const fortuneOptions = { settings: { enforceLinks: true } };

export const genie = new GraphQLGenie({ typeDefs, fortuneOptions});

export const getClient = () => {
	if (!process['testSetup']['client']) {
		const schema = genie.getSchema();
		const introspectionQueryResultData = <any> genie.getFragmentTypes();
		const fragmentMatcher = new IntrospectionFragmentMatcher({
			introspectionQueryResultData
		});
		const client = new ApolloClient({
			link: new SchemaLink({ schema: schema }),
			cache: new InMemoryCache({fragmentMatcher}),
			defaultOptions: {
				query: {fetchPolicy: 'no-cache'},
				watchQuery: {fetchPolicy: 'no-cache'}
			}
		});
		client.initQueryManager();
		process['testSetup']['client'] = client;
	}
	return process['testSetup']['client'];
};

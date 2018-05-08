import { InMemoryCache, IntrospectionFragmentMatcher, IntrospectionResultData } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { SchemaLink } from 'apollo-link-schema';
import GraphQLGenie from '../GraphQLGenie';

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
  author: User @relation(name: "WrittenSubmissions")
	likedBy: [User!] @relation(name: "LikedPosts")
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
	likedPosts: [Post!] @relation(name: "LikedPosts")
	family: [User]
	match: User
}

type Address {
  id: ID! @unique
  city: String!
  user: User
}
`;
process['testSetup'] = {};
const fortuneOptions = { settings: { enforceLinks: true } };

const genie = new GraphQLGenie({ typeDefs, fortuneOptions});

export const getClient = async () => {
	if (!process['testSetup']['client']) {
		const schema = await genie.getSchema();
		const introspectionQueryResultData = <IntrospectionResultData>await genie.getFragmentTypes();
		const fragmentMatcher = new IntrospectionFragmentMatcher({
			introspectionQueryResultData
		});
		const client = new ApolloClient({
			link: new SchemaLink({ schema: schema }),
			cache: new InMemoryCache({fragmentMatcher})
		});
		client.initQueryManager();
		process['testSetup']['client'] = client;
	}
	return process['testSetup']['client'];
};

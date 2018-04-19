import { ApolloClient } from 'apollo-client';
import { InMemoryCache, IntrospectionFragmentMatcher, IntrospectionResultData } from 'apollo-cache-inmemory';
import { SchemaLink } from 'apollo-link-schema';
import GraphQLGenie  from '../GraphQLGenie';

const typeDefs = `

interface Submission {
	id: ID! @isUnique
	title: String!
	text: String
}

type Post implements Submission @model {
  id: ID! @isUnique
	title: String!
	text: String
  author: User @relation(name: "WrittenSubmissions")
	likedBy: [User!]! @relation(name: "LikedPosts")
	comments: [Comment] @relation(name: "CommentsOnPost")
}

type Comment implements Submission @model {
  id: ID! @isUnique
	title: String!
	text: String
  author: User @relation(name: "WrittenSubmissions")
	post: Post @relation(name: "CommentsOnPost")
	approved: Boolean @default(value: "true")
}


type User @model {
  id: ID! @isUnique
  name : String!
  address: Address @relation(name: "UserAddress")
	writtenSubmissions: [Submission] @relation(name: "WrittenSubmissions")
	age: Int
	birthday: Date
	likedPosts: [Post!]! @relation(name: "LikedPosts")
	match: User
}

type Address @model {
  id: ID! @isUnique
  city: String!
  user: User @relation(name: "UserAddress")
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


import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { SchemaLink } from 'apollo-link-schema';
import { GraphQLGenie } from 'graphql-genie';

const typeDefs = `

interface Submission {
	id: ID! @unique
	title: String!
	text: String
	created: DateTime @createdTimestamp
	updated: DateTime @updatedTimestamp
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
	created: DateTime @createdTimestamp
	updated: DateTime @updatedTimestamp
	createdManual: DateTime @createdTimestamp(allowManual: true)
	updatedManual: DateTime @updatedTimestamp(allowManual: true)
}

type Comment implements Submission {
  id: ID! @unique
	title: String!
	text: String
  author: User @relation(name: "WrittenSubmissions")
	post: Post @relation(name: "CommentsOnPost")
	approved: Boolean @default(value: "true")
	created: DateTime @createdTimestamp
	updated: DateTime @updatedTimestamp
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

export const getClient = (overRideGenie?: GraphQLGenie) => {
	let client: ApolloClient<any>;
	if (!process['testSetup']['client'] || overRideGenie) {
		const genieToCreateClient = overRideGenie || genie;
		const schema = genieToCreateClient.getSchema();
		const introspectionQueryResultData = <any> genieToCreateClient.getFragmentTypes();
		const fragmentMatcher = new IntrospectionFragmentMatcher({
			introspectionQueryResultData
		});
		client = new ApolloClient({
			link: new SchemaLink({ schema: schema }),
			cache: new InMemoryCache({fragmentMatcher}),
			defaultOptions: {
				query: {fetchPolicy: 'no-cache'},
				watchQuery: {fetchPolicy: 'no-cache'}
			}
		});
		if (!overRideGenie) {
			process['testSetup']['client'] = client;
		}
	}
	return client;
};

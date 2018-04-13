import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { SchemaLink } from 'apollo-link-schema';
import GraphQLGenie  from '../GraphQLGenie';

const typeDefs = `
"""
Schema metadata for use in displaying the schema
"""
directive @display(
  name: String
) on FIELD_DEFINITION | ENUM_VALUE | OBJECT

directive @relation(
  name: String
) on FIELD_DEFINITION

directive @model on OBJECT

interface Node {
  id: ID! @isUnique
}

type Post @model {
  id: ID! @isUnique
  title: String!
  author: User @relation(name: "WrittenPosts")
  likedBy: [User!]! @relation(name: "LikedPosts")
}

type User @model {
  id: ID! @isUnique
  name : String!
  address: Address @relation(name: "UserAddress")
  writtenPosts: [Post!]! @relation(name: "WrittenPosts")
  likedPosts: [Post!]! @relation(name: "LikedPosts")
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
		const start = Date.now();
		const schema = await genie.getSchema();
		const client = new ApolloClient({
			link: new SchemaLink({ schema: schema }),
			cache: new InMemoryCache(),
			connectToDevTools: true
		});
		client.initQueryManager();
		process['testSetup']['client'] = client;
		console.log('Setup Completed', Date.now() - start);
	}
	return process['testSetup']['client'];
}


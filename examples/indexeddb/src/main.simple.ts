import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { SchemaLink } from 'apollo-link-schema';
import indexedDBAdapter from 'fortune-indexeddb';
import { graphql, subscribe } from 'graphql';
import { FortuneOptions, GraphQLGenie } from '../../../src/index';
import gql from 'graphql-tag';

const typeDefs = gql`

type City {
	id: ID! @unique
	name: String! @unique
	neighborhoods: [String]!
	user: [User]!
	founded: Date
	population: Int
	created: DateTime @createdTimestamp
}

type User {
	id: ID! @unique
	email: String! @unique
  name : String!
}

`;

const fortuneOptions: FortuneOptions = {
	settings: { enforceLinks: true },
	adapter: [ indexedDBAdapter, {
		// Name of the IndexedDB database to use. Defaults to `fortune`.
		name: 'fortune'
	} ]
};
const genie = new GraphQLGenie({ typeDefs, fortuneOptions, generatorOptions: {
	generateGetAll: true,
	generateCreate: true,
	generateUpdate: true,
	generateDelete: true,
	generateUpsert: true
}});
const buildClient = async (genie: GraphQLGenie) => {

	const schema = genie.getSchema();
	const introspectionQueryResultData = <any> genie.getFragmentTypes();
	const fragmentMatcher = new IntrospectionFragmentMatcher({
		introspectionQueryResultData
	});
	const client = new ApolloClient({
		link: new SchemaLink({ schema: schema }),
		cache: new InMemoryCache({fragmentMatcher}),
		connectToDevTools: true
	});
	window['genie'] = genie;
	window['fortune'] = genie.getDataResolver();
	window['store'] = window['fortune'].getStore();
	window['schema'] = schema;
	window['client'] = client;
	window['graphql'] = graphql;
	window['subscribe'] = subscribe;
};

buildClient(genie).catch();

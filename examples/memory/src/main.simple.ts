import { InMemoryCache, IntrospectionFragmentMatcher, IntrospectionResultData } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { SchemaLink } from 'apollo-link-schema';
import { graphql, subscribe } from 'graphql';
import { FortuneOptions, GraphQLGenie } from '../../../src/index';

const typeDefs = `

type Company {
	id: ID!
  name: String
  industry: String
  employees: [Employee!]
}

type Employee {
	id: ID!
  firstName: String
  lastName: String
  address: String
  subordinates: [Employee!]
  company: Company
}


`;

const fortuneOptions: FortuneOptions = {
	settings: { enforceLinks: true }
};
const genie = new GraphQLGenie({ typeDefs, fortuneOptions, generatorOptions: {
	generateGetAll: true,
	generateCreate: true,
	generateUpdate: true,
	generateDelete: true,
	generateUpsert: true
}});
const buildClient = async (genie: GraphQLGenie) => {
	await genie.init();
	const schema = genie.getSchema();
	const introspectionQueryResultData = <IntrospectionResultData>await genie.getFragmentTypes();
	const fragmentMatcher = new IntrospectionFragmentMatcher({
		introspectionQueryResultData
	});
	const client = new ApolloClient({
		link: new SchemaLink({ schema: schema }),
		cache: new InMemoryCache({fragmentMatcher}),
		connectToDevTools: true
	});
	client.initQueryManager();
	window['fortune'] = genie.getDataResolver();
	window['store'] = window['fortune'].getStore();
	window['schema'] = schema;
	window['client'] = client;
	window['graphql'] = graphql;
	window['subscribe'] = subscribe;
};

buildClient(genie).catch();

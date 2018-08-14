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
	client.initQueryManager();
	window['genie'] = genie;
	window['fortune'] = genie.getDataResolver();
	window['store'] = window['fortune'].getStore();
	window['schema'] = schema;
	window['client'] = client;
	window['graphql'] = graphql;
	window['subscribe'] = subscribe;

	let rawData = await genie.getRawData();
	console.log('rawData :', rawData);
	rawData.forEach(element => {
		if (element.name && element.name !== 'test') {
			element.name = 'NY';
		}
	});
	await genie.importRawData(rawData, true);
	console.log('merged');
	rawData = await genie.getRawData();
	console.log('rawData :', rawData);
	// await genie.importRawData([{
	// 	'id': '2d',
	// 	'name': 'test2',
	// 	'address': {
	// 		'id': 'bGExb1dGdlBKc1FZa1RBOkFkZHJlc3M='
	// 	},
	// 	'submissions': [
	// 		{
	// 			'id': 'ZEpQa1dRTlNxN0xyVG4yOkNvbW1lbnQ='
	// 		}
	// 	]
	// }], true, 'User');
	// console.log('imported');
	// console.log(await genie.getRawData());

	// await client.mutate({
	// 	mutation: gql`mutation {
	// 		createUser (input: {
	// 			data: {
	// 				liked: {
	// 					comments: {
	// 						create: {
	// 							text: "bam"
	// 						}
	// 					}
	// 				}
	// 			}
	// 		}) {
	// 			data {
	// 				id
	// 				liked {
	// 					edges {
	// 						node {
	// 							text
	// 						}
	// 					}
	// 				}
	// 			}
	// 		}
	// 	}
	// 	`
	// });
};

buildClient(genie).catch();

import { InMemoryCache, IntrospectionFragmentMatcher, IntrospectionResultData } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { SchemaLink } from 'apollo-link-schema';
import indexedDBAdapter from 'fortune-indexeddb';
import { graphql, subscribe } from 'graphql';
import gql from 'graphql-tag';
import { FortuneOptions, GraphQLGenie } from '../../../src/index';

const typeDefs = `

interface Submission {
	id: ID! @unique
	text: String!
	author: User @relation(name: "SubmissionsByUser")
}

type Story implements Submission {
	id: ID! @unique
	title: String!
	text: String!
	author: User @relation(name: "SubmissionsByUser")
	likedBy: [User!] @connection @relation(name: "LikedSubmissions")
}


type Comment implements Submission {
	id: ID! @unique
	text: String!
	author: User @relation(name: "SubmissionsByUser")
	approved: Boolean @default(value: "true")
}


type User {
	id: ID! @unique
	email: String @unique
	submissions: [Submission!] @relation(name: "SubmissionsByUser")
	address: Address
	liked: [Submission!] @connection @relation(name: "LikedSubmissions")
}

type Address {
	id: ID! @unique
	city: String!
	user: User
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

	await client.mutate({
		mutation: gql`mutation {
			createUser (input: {
				data: {
					liked: {
						comments: {
							create: {
								text: "bam"
							}
						}
					}
				}
			}) {
				data {
					id
					liked {
						edges {
							node {
								text
							}
						}
					}
				}
			}
		}
		`
	});
};

buildClient(genie);

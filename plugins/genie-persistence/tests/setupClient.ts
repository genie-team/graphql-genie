import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { SchemaLink } from 'apollo-link-schema';
import { FortuneOptions, GraphQLGenie } from 'graphql-genie';
import { GeniePersitence } from '../src/genie-persistence';
import localForageAdapter from 'fortune-localforage';
import localForage from 'localforage';

const typeDefs = `

type Post @model {
  id: ID! @unique
	title: String!
	text: String
	isPublic: Boolean
	author: User @relation(name: "posts")
	created: DateTime @createdTimestamp
	updated: DateTime @updatedTimestamp
}

type User @model {
	id: ID! @unique
	username: String @unique
	email: String! @unique
	password: String!
  name : String
	posts: [Post] @relation(name: "posts")
	created: DateTime @createdTimestamp
	updated: DateTime @updatedTimestamp
}
`;

const fortuneOptions: FortuneOptions = {
	adapter: [ localForageAdapter, {
		name: 'fortune'
	} ]
};

export const throwMergeConflict = jest.fn();
let localGenie: GraphQLGenie;
const getLocalGenie = (): GraphQLGenie => {
	if (!localGenie) {
		localGenie = new GraphQLGenie({ typeDefs, fortuneOptions});
	}
	window['genie'] = localGenie;
	window['store'] = localGenie.getDataResolver().getStore();
	return localGenie;
};

const mockFortuneOptions: FortuneOptions = {
	adapter: [ localForageAdapter, {
		name: 'mock'
	} ]
};

let mockGenie: GraphQLGenie;
const getMockGenie = (): GraphQLGenie => {
	if (!mockGenie) {
		mockGenie = new GraphQLGenie({ typeDefs, fortuneOptions: mockFortuneOptions});
	}
	return mockGenie;
};

let localClient;
const getLocalClient = (): ApolloClient<any> => {
	if (!localClient) {
		const genie = getLocalGenie();
		const schema = genie.getSchema();
		const introspectionQueryResultData = <any> genie.getFragmentTypes();
		const fragmentMatcher = new IntrospectionFragmentMatcher({
			introspectionQueryResultData
		});
		localClient = new ApolloClient({
			link: new SchemaLink({ schema: schema }),
			cache: new InMemoryCache({fragmentMatcher}),
			connectToDevTools: false
		});
	}
	return localClient;
};

let remoteClient;
const getRemoteClient = (): ApolloClient<any> => {
	if (!remoteClient) {
		const genie = getMockGenie();
		const schema = genie.getSchema();
		const introspectionQueryResultData = <any> genie.getFragmentTypes();
		const fragmentMatcher = new IntrospectionFragmentMatcher({
			introspectionQueryResultData
		});
		remoteClient = new ApolloClient({
			link: new SchemaLink({ schema: schema }),
			cache: new InMemoryCache({fragmentMatcher}),
			connectToDevTools: false
		});
	}

	return remoteClient;
};

let client: GeniePersitence;
export const localForageInstance = localForage.createInstance({name: 'geniePersist'});
export const getClient = async (): Promise<GeniePersitence> => {
	if (!client) {
		client = new GeniePersitence({
			localClient:  getLocalClient(),
			remoteClient: getRemoteClient(),
			localGenie:  getLocalGenie(),
			localForageInstance,
			throwMergeConflict
		});
		await client.persist();
	}
	return client;
};

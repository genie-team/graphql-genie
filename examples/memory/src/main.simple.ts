import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { SchemaLink } from 'apollo-link-schema';
import { FortuneOptions, GraphQLGenie } from '../../../src/index';
import gql from 'graphql-tag';

const typeDefs = `
scalar Any

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
	bam: Any
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

enum Role {
	# Open to all requests
	ANY
	# Must be logged in
	USER
	# User must have created/be the type
	OWNER
	ADMIN
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
	// window['fortune'] = genie.getDataResolver();
	// window['store'] = window['fortune'].getStore();
	// window['schema'] = schema;
	// window['client'] = client;
	// window['graphql'] = graphql;
	// window['subscribe'] = subscribe;
	const zeus = await client.mutate({
		mutation: gql`
		mutation {
			createUser(
				input: {
					data: {
						age: 42
						birthday: "2000-02-02"
						email: "zeus@example.com"
						name: "Zeus"
						writtenSubmissions: {
							posts: {
								create: [{
									title: "Z Hello World"
									text: "This is my first blog post ever!"
								}, {
									title: "My Second Post"
									text: "My first post was good, but this one is better!"
								}, {
									title: "Solving World Hunger"
									text: "This is a draft..."
								}]
							}
						}
					}
					clientMutationId: "Test"
				}
			) {
				data {
					id
					name
					writtenSubmissions {
						id
						title
					}
				}
				clientMutationId
			}
		}
		`,
		context: {
			authenticate: () => true
		}
	});

	console.log(zeus);
};

buildClient(genie).catch();

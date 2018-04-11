import {GraphQLGenie} from './GraphQLGenie';
import gql from 'graphql-tag';
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { SchemaLink } from 'apollo-link-schema';
import { keyBy, map } from 'lodash';

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



enum  DirectiveLocation {
	#type system
	SCHEMA
	SCALAR
	OBJECT
	FIELD_DEFINITION
	ARGUMENT_DEFINITION
	INTERFACE
	UNION
	ENUM
	ENUM_VALUE
	INPUT_OBJECT
	INPUT_FIELD_DEFINITION
	#executable
	QUERY
	MUTATION
	SUBSCRIPTION
	FIELD
	FRAGMENT_DEFINITION
	FRAGMENT_SPREAD
	INLINE_FRAGMENT
}


interface Node {
  id: ID! @isUnique
}

interface GraphQLType {
	description: String
	schema: GraphQLSchema @relation(name: "TypeOnSchema")
}

type GraphQLInputArgument @model {
	id: ID! @isUnique
	name: String!
	value: GraphQLInputType!
	parent: GraphQLDirectiveAttribute @relation(name: "InputArgument")
}

type GraphQLArgument @model {
	id: ID! @isUnique
	name: String!
  type: GraphQLInputType!
	defaultValue: String
	description: String
	parent: GraphQLArgumentParent @relation(name: "Argument")
}

union GraphQLArgumentParent = GraphQLDirective | GraphQLField

type GraphQLDirective @model {
	id: ID! @isUnique
	name: String!
	description: String
	location: [DirectiveLocation!]!
	args: [GraphQLArgument] @relation(name: "Argument")
	schema: GraphQLSchema @relation(name: "DirectiveOnSchema")
}


type GraphQLDirectiveAttribute @model {
	id: ID! @isUnique
  directive: GraphQLDirective!
	args: [GraphQLInputArgument] @relation(name: "InputArgument")
}


type GraphQLField @model {
	id: ID! @isUnique
	name: String!
  type: GraphQLOutputType
  description: String
	args: [GraphQLArgument] @relation(name: "Argument")
	directives: [GraphQLDirectiveAttribute]
	parent: GraphQLType @relation(name: "FieldOnType")
}

type GraphQLInterfaceType implements GraphQLType @model {
	id: ID! @isUnique
  name: String!
	description: String
	fields: [GraphQLField!]! @relation(name: "FieldOnType")
	directives: [GraphQLDirectiveAttribute]
	schema: GraphQLSchema @relation(name: "TypeOnSchema")
	query: GraphQLSchema @relation(name: "QueryOnSchema")
	mutation: GraphQLSchema @relation(name: "MutationOnSchema")
}

type GraphQLNonNull implements GraphQLType @model {
	id: ID! @isUnique
	description: String
	schema: GraphQLSchema @relation(name: "TypeOnSchema")
	ofType: GraphQLType!
}

type GraphQLList implements GraphQLType @model {
	id: ID! @isUnique
	description: String
	schema: GraphQLSchema @relation(name: "TypeOnSchema")
	ofType: GraphQLType!
}

type GraphQLObjectType implements GraphQLType @model {
	id: ID! @isUnique
	name: String!
	description: String
  interfaces: [GraphQLInterfaceType]
  fields: [GraphQLField!]! @relation(name: "FieldOnType")
	directives: [GraphQLDirectiveAttribute]
	schema: GraphQLSchema @relation(name: "TypeOnSchema")
}

type GraphQLUnionType implements GraphQLType @model {
	id: ID! @isUnique
	name: String!
  description: String
	types:  [GraphQLObjectType]
	schema: GraphQLSchema @relation(name: "TypeOnSchema")
}

type GraphQLEnumType implements GraphQLType @model {
	id: ID! @isUnique
	name: String!
  description: String
	values:  [String]
	schema: GraphQLSchema @relation(name: "TypeOnSchema")
}

type GraphQLScalarType implements GraphQLType @model {
	id: ID! @isUnique
	name: String!
	description: String
	schema: GraphQLSchema @relation(name: "TypeOnSchema")
}

type GraphQLInputObjectType implements GraphQLType @model {
	id: ID! @isUnique
	name: String!
  description: String
	fields: [GraphQLField!]! @relation(name: "FieldOnType")
	schema: GraphQLSchema @relation(name: "TypeOnSchema")
}

union GraphQLInputType = GraphQLScalarType | GraphQLEnumType | GraphQLInputObjectType | GraphQLNonNull | GraphQLList
union GraphQLOutputType = GraphQLScalarType | GraphQLObjectType | GraphQLInterfaceType | GraphQLUnionType | GraphQLEnumType | GraphQLNonNull | GraphQLList


type GraphQLSchema @model @display(name: "Schema Root") {
	id: ID! @isUnique
	_typeMap: [GraphQLType] @display(name: "Schema Types")  @relation(name: "TypeOnSchema")
	_directives: [GraphQLDirective] @display(name: "Directives")  @relation(name: "DirectiveOnSchema")
  _queryType: GraphQLObjectType @display(name: "Query") @relation(name: "QueryOnSchema")
  _mutationType: GraphQLObjectType @display(name: "Mutation") @relation(name: "MutationOnSchema")
	_subscriptionType: GraphQLObjectType @display(name: "Subscription")
}

`;



const genie = new GraphQLGenie({typeDefs});

const buildClient = async (genie: GraphQLGenie) => {
	const schema = await genie.getSchema();
	// const resolverMap = {
		// 	Query: {
		// 		allTestings: (_obj, { _name }, _context) => {
		// 			return state.testings;
		// 		},
		// 	},
		// 	Mutation: {
		// 		addTesting: (_, { name }, _context) => {
		// 			const testing = { name: name };
		// 			state.testings.push(testing);
		// 			return testing;
		// 		},
		// 	},
		// };
		// // for (const [name, resolve] of newQueryResolvers) {
		// // 	resolverMap.Query[name] = resolve;
		// // }
		console.log(schema);
		// const resolversMap = new Map<string, GraphQLFieldResolver<any, any>>();
		// resolversMap.set('args', (
		// 	_root: any,
		// 	_args: { [key: string]: any },
		// 	_context: any,
		// 	_info: GraphQLResolveInfo,
		// ): any => {
		// 	const selections = computeIncludes(_info.operation.selectionSet.selections[0], 'GraphQLDirective');
		// 	console.info('selections');
		// 	console.info(selections);
		// 	console.info(JSON.stringify(selections));
		// 	console.log(_root);
		// 	console.log(_args);
		// 	console.log(_context);
		// 	console.log(_info);
		// });
		// addResolvers('GraphQLDirective', resolversMap);
		const client = new ApolloClient({
			link: new SchemaLink({ schema: schema }),
			cache:  new InMemoryCache(),
			connectToDevTools: true
		});
		client.initQueryManager();
		console.log(client);
		// console.info(await client.mutate({
		// 	mutation: gql`
		// 							mutation addTesting($name: String!) {
		// 								addTesting(name: $name) {
		// 									name
		// 								}
		// 							}
		// 						`,
		// 	variables: {
		// 		name: name
		// 	}
		// }));
		// In every schema
		const createScalarsPromises = [];
		const scalars = [{
			name: 'Boolean',
			description: 'The `Boolean` scalar type represents `true` or `false`.',
		},
		{
			name: 'Int',
			description: 'The `Int` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1. ',
		},
		{
			name: 'String',
			description: 'The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.',
		},
		{
			name: 'Float',
			description: 'The `Float` scalar type represents signed double-precision fractional values as specified by [IEEE 754](http://en.wikipedia.org/wiki/IEEE_floating_point). ',
		},
		{
			name: 'ID',
			description: 'The `ID` scalar type represents a unique identifier, often used to refetch an object or as key for a cache. The ID type appears in a JSON response as a String; however, it is not intended to be human-readable. When expected as an input type, any string (such as `"4"`) or integer (such as `4`) input value will be accepted as an ID.',
		},
		];

		const createGraphQLScalarType = gql`
		mutation createGraphQLScalarType($name: String!, $description: String) {
			createGraphQLScalarType(name: $name, description: $description) {
				id
				name
			}
		}
	`;

		for(const scalar of scalars) {
			createScalarsPromises.push(client.mutate({
				mutation: createGraphQLScalarType,
				variables: {name: scalar.name, description: scalar.description}
			}));
		};

		const scalarTypes = await Promise.all(createScalarsPromises);
		const scalarIdMap = keyBy(map(scalarTypes, 'data.createGraphQLScalarType'), 'name');
		console.log(scalarIdMap);


		const createDirectivesPromises = [];
		const directives = [
			{
				name: 'skip',
				description: 'Directs the executor to skip this field or fragment when the `if` argument is true.',
				location: ['FIELD', 'FRAGMENT_SPREAD', 'INLINE_FRAGMENT'],
				args: [{
					name: 'if',
					description: 'Skipped when true.',
					typeId: scalarIdMap['Boolean'].id
				}]
			},
			{
				name: 'include',
				description: 'Directs the executor to include this field or fragment only when the `if` argument is true.',
				location: ['FIELD', 'FRAGMENT_SPREAD', 'INLINE_FRAGMENT'],
				args: [{
					name: 'if',
					description: '"Included when true.',
					typeId: scalarIdMap['Boolean'].id
				}]
			},
			{
				name: 'deprecated',
				description: 'Marks an element of a GraphQL schema as no longer supported.',
				location: ['FIELD_DEFINITION', 'ENUM_VALUE'],
				args: [{
					name: 'reason',
					description: 'Explains why this element was deprecated, usually also including a suggestion for how to access supported similar data. Formatted in [Markdown](https://daringfireball.net/projects/markdown/).',
					typeId: scalarIdMap['String'].id,
					defaultValue: 'No longer supported'
				}]
			}
		];
		const createGraphQLDirective = gql`
		mutation createGraphQLDirective($name: String!, $description: String, $location: [String], $args: [GraphQLArgumentInput!]) {
			createGraphQLDirective(name: $name, description: $description, location: $location, args: $args) {
				id
			}
		}
	`;
		for(const directive of directives) {
			createDirectivesPromises.push(client.mutate({
				mutation: createGraphQLDirective,
				variables: {name: directive.name, description: directive.description, location: directive.location, args: directive.args}
			}));
		};

		await genie.graphQLFortune.create('GraphQLEnumType', { name: 'test enum', description: 'test' });
		await genie.graphQLFortune.create('GraphQLObjectType', { name: 'test object', description: 'test' });

}

buildClient(genie);
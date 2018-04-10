import GraphQLGenie from './GraphQLGenie';

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

new GraphQLGenie({typeDefs});

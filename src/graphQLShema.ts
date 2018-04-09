
import {SchemaDirectiveVisitor, addResolveFunctionsToSchema, makeExecutableSchema } from 'graphql-tools';
import _ from 'lodash';
import { GraphQLFieldResolver, GraphQLSchema, isListType, isNonNullType } from 'graphql';

const defaultTypeDefs = `
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






class DisplayDirective extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field) {
		this.setDisplay(field);
  }

  public visitEnumValue(value) {
		this.setDisplay(value);
	}

	public visitObject(object) {
		this.setDisplay(object);
	}

	private setDisplay(field: any) {
		field.display = {};
		if (this.args.name) {
			field.display.name = this.args.name;
		}
	}
}

class RelationDirective extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field) {
		this.setRelation(field);
  }

	private setRelation(field) {
		field.relation = {};
		if (this.args.name) {
			field.relation.name = this.args.name;
		}
		let type = field.type;
		while (isListType(type) || isNonNullType(type)) {
			type = type.ofType;
		}
		field.relation.outputType = type.name;
	}
}

let schema;

class ModelDirective extends SchemaDirectiveVisitor {
	public visitObject(object) {
		object._interfaces.push(schema.getTypeMap().Node);
		_.has(schema, '_implementations.Node') ? schema['_implementations'].Node.push(object) : _.set(schema, '_implementations.Node', [object]);
	}
}


export const addTypeDefsToSchema = (typeDefs: string): GraphQLSchema => {
	if (!typeDefs || typeDefs.indexOf('Query') < 0) {
		typeDefs = 'type Query {noop:Int}';
	}
	schema = makeExecutableSchema({
		typeDefs: defaultTypeDefs + typeDefs,
		schemaDirectives: {
			display: DisplayDirective,
			relation: RelationDirective
		}
	});
	SchemaDirectiveVisitor.visitSchemaDirectives(schema, {
		model: ModelDirective
	});
	return schema;
};

export const getSchema = (): GraphQLSchema  => {
	if (!schema) {
		schema = addTypeDefsToSchema('');
	}
	return schema;
};


export const addResolvers = (typeName: string, fieldResolvers: Map<string, GraphQLFieldResolver<any, any>> ): GraphQLSchema  => {
	const resolverMap = {};
	resolverMap[typeName] = {};
	for (const [name, resolve] of fieldResolvers) {
		resolverMap[typeName][name] = resolve;
	}

	addResolveFunctionsToSchema(schema, resolverMap);
	return schema;
};







// {
//   __type(name: "GraphQLInputType") {
//     name
//     description
//     kind
//     possibleTypes {
//       name
//     }
//     fields {
//       name
//       type {
//         name
//         kind
//         ofType {
//           name
//           kind
//           ofType {
//             name
//             kind
//             ofType {
//               name
//               kind
//             }
//           }
//         }
//       }
//     }
//     interfaces {
//       name
//       possibleTypes {
//         name
//       }
//     }
//   }
// }


// {
//   allGraphQLDirectives {
//     id
//     name
//     description
//     args {
//       id
//       type {
//         ... on GraphQLScalarType {
//           id
//         }
//       }
//     }
//   }
// }


import {IResolvers, SchemaDirectiveVisitor, addResolveFunctionsToSchema, makeExecutableSchema } from 'graphql-tools';
import {has, set} from 'lodash';
import { GraphQLFieldResolver, GraphQLSchema, isListType, isNonNullType, isScalarType } from 'graphql';
import GraphQLJSON from 'graphql-type-json';
import {GraphQLDate, GraphQLDateTime, GraphQLTime} from 'graphql-iso-date';
export default class GraphQLSchemaBuilder {
	private schema: GraphQLSchema;
	private typeDefs: string;
	private resolveFunctions: IResolvers<any, any>;
	constructor(typeDefs = '') {
		this.typeDefs = `
		scalar JSON
		scalar Date
		scalar Time
		scalar DateTime
		directive @display(
			name: String
		) on FIELD_DEFINITION | ENUM_VALUE | OBJECT

		directive @relation(
			name: String!
		) on FIELD_DEFINITION

		directive @default(
			value: String!
		) on FIELD_DEFINITION

		directive @model on OBJECT

		interface Node {
			id: ID! @isUnique
		}
		` + typeDefs;
		this.resolveFunctions = {
			JSON: GraphQLJSON,
			Date: GraphQLDate,
			Time: GraphQLTime,
			DateTime: GraphQLDateTime
		};
	}

	public addTypeDefsToSchema = (typeDefs?: string): GraphQLSchema => {
		let newTypeDefs: string;
		if (!typeDefs && this.typeDefs.indexOf('Query') < 0) {
			newTypeDefs = this.typeDefs + 'type Query {noop:Int}';
		} else {
			this.typeDefs += typeDefs;
			newTypeDefs = this.typeDefs;
		}
		this.schema = makeExecutableSchema({
			typeDefs: newTypeDefs,
			resolvers: this.resolveFunctions,
			schemaDirectives: {
				display: DisplayDirective,
				relation: RelationDirective,
				default: DefaultDirective
			}
		});
		SchemaDirectiveVisitor.visitSchemaDirectives(this.schema, {
			model: ModelDirective
		});

		return this.schema;
	}

	public getSchema = (): GraphQLSchema  => {
		if (!this.schema) {
			this.schema = this.addTypeDefsToSchema();
		}
		return this.schema;
	}

	public addResolvers = (typeName: string, fieldResolvers: Map<string, GraphQLFieldResolver<any, any>> ): GraphQLSchema  => {
		const resolverMap = {};
		resolverMap[typeName] = {};
		this.resolveFunctions[typeName] = this.resolveFunctions[typeName] ? this.resolveFunctions[typeName] : {};
		fieldResolvers.forEach((resolve, name) => {
			resolverMap[typeName][name] = resolve;
			this.resolveFunctions[typeName][name] = resolve; // save in case type defs changed
		});

		addResolveFunctionsToSchema(this.schema, resolverMap);
		return this.schema;
	}
}






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


class DefaultDirective extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field) {
		let type = field.type;
		while (isListType(type) || isNonNullType(type)) {
			type = type.ofType;
		}
		if (!isScalarType(type)) {
			throw new Error('Can not set default on non scalar type which was attempted on ' + field.name);
		}
		if (this.args.value) {
			const currType = type.name;
			let value = this.args.value;
			if (currType === 'Int') {
				value = Number.parseInt(value);
			} else if (currType === 'Float') {
				value = Number.parseFloat(value);
			} else if (currType === 'Boolean') {
				value = value.toLowerCase();
				if (value !== 'true' && value !== 'false') {
					throw new Error('Default on field ' + field.name + ' which is of type Boolean must be "true" or "false"');
				}
				value = value === 'true';
			}
			field.defaultValue = value;
		}


  }
}

class ModelDirective extends SchemaDirectiveVisitor {
	public visitObject(object) {
		object._interfaces.push(this.schema.getTypeMap().Node);
		has(this.schema, '_implementations.Node') ? this.schema['_implementations'].Node.push(object) : set(this.schema, '_implementations.Node', [object]);
	}
}













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

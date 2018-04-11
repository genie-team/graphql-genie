
import {SchemaDirectiveVisitor, addResolveFunctionsToSchema, makeExecutableSchema } from 'graphql-tools';
import _ from 'lodash';
import { GraphQLFieldResolver, GraphQLSchema, isListType, isNonNullType } from 'graphql';



export default class GraphQLSchemaBuilder {
	private schema: GraphQLSchema;
	private typeDefs: string;
	
	constructor(typeDefs: string = '') {
		this.typeDefs = typeDefs;
	}

	public addTypeDefsToSchema = (typeDefs?: string): GraphQLSchema => {
		let newTypeDefs: string;
		if (!typeDefs || this.typeDefs.indexOf('Query') < 0) {
			newTypeDefs = this.typeDefs + 'type Query {noop:Int}';
		} else {
			this.typeDefs += typeDefs;
			newTypeDefs = this.typeDefs;
		}
		this.schema = makeExecutableSchema({
			typeDefs: newTypeDefs,
			schemaDirectives: {
				display: DisplayDirective,
				relation: RelationDirective
			}
		});
		SchemaDirectiveVisitor.visitSchemaDirectives(this.schema, {
			model: ModelDirective
		});
		
		return this.schema;
	};

	public getSchema = (): GraphQLSchema  => {
		if (!this.schema) {
			this.schema = this.addTypeDefsToSchema();
		}
		return this.schema;
	};

	public addResolvers = (typeName: string, fieldResolvers: Map<string, GraphQLFieldResolver<any, any>> ): GraphQLSchema  => {
		const resolverMap = {};
		resolverMap[typeName] = {};
		for (const [name, resolve] of fieldResolvers) {
			resolverMap[typeName][name] = resolve;
		}
	
		addResolveFunctionsToSchema(this.schema, resolverMap);
		return this.schema;
	};
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


class ModelDirective extends SchemaDirectiveVisitor {
	public visitObject(object) {
		object._interfaces.push(this.schema.getTypeMap().Node);
		_.has(this.schema, '_implementations.Node') ? this.schema['_implementations'].Node.push(object) : _.set(this.schema, '_implementations.Node', [object]);
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

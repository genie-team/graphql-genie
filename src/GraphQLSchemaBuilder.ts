
import { GraphQLFieldResolver, GraphQLNonNull, GraphQLSchema, GraphQLType, isListType, isNonNullType, isObjectType, isScalarType } from 'graphql';
import { GraphQLDate, GraphQLDateTime, GraphQLTime } from 'graphql-iso-date';
import { IResolvers, SchemaDirectiveVisitor, addResolveFunctionsToSchema, makeExecutableSchema } from 'graphql-tools';
import GraphQLJSON from 'graphql-type-json';
import { has, set } from 'lodash';
import { GenerateConfig } from './GraphQLGenieInterfaces';
import { getReturnType, typeIsList } from './TypeGeneratorUtils';
export default class GraphQLSchemaBuilder {
	private schema: GraphQLSchema;
	private typeDefs: string;
	private config: GenerateConfig;
	private resolveFunctions: IResolvers<any, any>;
	constructor(typeDefs = '', $config: GenerateConfig) {
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

		directive @unique on FIELD_DEFINITION

		interface Node {
			id: ID! @unique
		}
		` + typeDefs;
		this.resolveFunctions = {
			JSON: GraphQLJSON,
			Date: GraphQLDate,
			Time: GraphQLTime,
			DateTime: GraphQLDateTime
		};

		this.config = $config;
	}

	public addTypeDefsToSchema = (typeDefs = ''): GraphQLSchema => {
		if (typeDefs) {
			this.typeDefs += typeDefs;
		}
		if (this.typeDefs.includes('@model') && !this.typeDefs.includes('directive @model')) {
			this.typeDefs = 'directive @model on OBJECT ' + this.typeDefs;
		}

		if (this.typeDefs.includes('@connection') && !this.typeDefs.includes('directive @connection')) {
			this.typeDefs = 'directive @connection on FIELD_DEFINITION' + this.typeDefs;
		}

		if (this.config.generateSubscriptions && !this.typeDefs.includes('MutationType')) {
			this.typeDefs += `
			enum MUTATION_TYPE {
				CREATED
				UPDATED
				DELETED
				CONNECTED
				DISCONNECTED
			}
			`;
		}

		let newTypeDefs = this.typeDefs;
		if (!this.typeDefs.includes('type Query')) {
			newTypeDefs += 'type Query {noop:Int}';
		}

		this.schema = makeExecutableSchema({
			typeDefs: newTypeDefs,
			resolvers: this.resolveFunctions,
			schemaDirectives: {
				display: DisplayDirective,
				relation: RelationDirective,
				default: DefaultDirective,
				unique: UniqueDirective
			},
			resolverValidationOptions: {
				requireResolversForResolveType: false
			}
		});

		if (this.typeDefs.includes('@connection')) {
			if (!this.config.generateConnections) {
				throw new Error('Generate Connections must be true to use connection directive');
			}
			// don't want to attempt this if we didn't create the necessary types yet
			if (this.typeDefs.includes('Connection') && this.typeDefs.includes('Edge') && this.typeDefs.includes('PageInfo')) {
				SchemaDirectiveVisitor.visitSchemaDirectives(this.schema, {
					connection: ConnectionDirective
				});
			}
		}

		const typeMap = this.schema.getTypeMap();

		if (this.typeDefs.includes('@model')) {
			SchemaDirectiveVisitor.visitSchemaDirectives(this.schema, {
				model: ModelDirective
			});
		} else {
			Object.keys(typeMap).forEach(name => {
				const type = typeMap[name];
				if (isObjectType(type) && type.name !== 'PageInfo' && !type.name.includes('__') && !type.name.endsWith('Aggregate') && !type.name.endsWith('Connection') && !type.name.endsWith('Edge') && !type.name.endsWith('Payload') && !(type.name.toLowerCase() === 'query') && !(type.name.toLowerCase() === 'mutation') && !(type.name.toLowerCase() === 'subscription')) {
					type['_interfaces'].push(typeMap.Node);
					has(this.schema, '_implementations.Node') ? this.schema['_implementations'].Node.push(type) : set(this.schema, '_implementations.Node', [type]);
				}
			});
		}

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

		addResolveFunctionsToSchema({
			schema: this.schema,
			resolvers: resolverMap,
			resolverValidationOptions: {
				requireResolversForResolveType: false
			}
		});
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

class UniqueDirective extends SchemaDirectiveVisitor {
	public visitFieldDefinition(field) {
		field.unique = true;
	}
}

class ConnectionDirective extends SchemaDirectiveVisitor {
	public visitFieldDefinition(field) {
		const fieldType = field.type;

		if (typeIsList(fieldType)) {
			const connectionName = getReturnType(fieldType) + 'Connection';
			let connectionType: GraphQLType = this.schema.getType(connectionName);
			if (!connectionType) {
				throw new Error('Connections must be enabled and output type must be part of model');
			}
			if (isNonNullType(fieldType)) {
				connectionType = new GraphQLNonNull(connectionType);
			}
			field.type = connectionType;
		} else {
			throw new Error('Can\'t make connection on non list field');
		}
		console.log('connection directive');
	 console.log(field);
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

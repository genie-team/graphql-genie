
import { DocumentNode, GraphQLFieldResolver, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLType, getNamedType, isInputObjectType, isInputType, isInterfaceType, isListType, isNonNullType, isObjectType, isScalarType, isSpecifiedDirective, isUnionType, print  } from 'graphql';
import { GraphQLDate, GraphQLDateTime, GraphQLTime } from 'graphql-iso-date';
import { IResolvers, SchemaDirectiveVisitor, addResolveFunctionsToSchema, makeExecutableSchema } from 'graphql-tools';
import GraphQLJSON from 'graphql-type-json';
import { camelCase, find, has, isEmpty, set, values } from 'lodash';
import pluralize from 'pluralize';
import { GenerateConfig } from './GraphQLGenieInterfaces';
import { getReturnType, typeIsList } from './GraphQLUtils';
import { getRootMatchFields, queryArgs } from './TypeGeneratorUtilities';

export class GraphQLSchemaBuilder {

	private schema: GraphQLSchema;
	private typeDefs: string;
	private config: GenerateConfig;
	private resolveFunctions: IResolvers<any, any>;
	constructor(typeDefs: string | DocumentNode = '', $config: GenerateConfig) {
		this.typeDefs = `
		scalar JSON
		scalar Date
		scalar Time
		scalar DateTime

		directive @relation(
			name: String!
		) on FIELD_DEFINITION

		directive @default(
			value: String!
		) on FIELD_DEFINITION

		directive @unique on FIELD_DEFINITION

		directive @updatedTimestamp on FIELD_DEFINITION

		directive @createdTimestamp on FIELD_DEFINITION

		"""
		An object with an ID
		"""
		interface Node {
			"""
			The id of the object.
			"""
			id: ID! @unique
		}
		` + (typeof typeDefs === 'string' ? typeDefs : print(typeDefs));
		this.resolveFunctions = {
			JSON: GraphQLJSON,
			Date: GraphQLDate,
			Time: GraphQLTime,
			DateTime: GraphQLDateTime
		};

		this.config = $config;
	}
	public printSchemaWithDirectives = (): string => {
		const str = Object
			.keys(this.schema.getTypeMap())
			.filter(k => !k.match(/^__/))
			.reduce((accum, name) => {
				const type = this.schema.getType(name);
				return !isScalarType(type)
					? accum += `${print(type.astNode)}\n`
					: accum;
			}, '');

		return this.schema
			.getDirectives()
			.reduce((accum, d) => {
				return !isSpecifiedDirective(d)
					? accum += `${print(d.astNode)}\n`
					: accum;
			}, str + `${this.schema.astNode ? print(this.schema.astNode) : ''}\n`);
	}

	public addTypeDefsToSchema = ($typeDefs = ''): GraphQLSchema => {
		if ($typeDefs) {
			this.typeDefs += $typeDefs;
		}
		if (this.typeDefs.includes('@model') && !this.typeDefs.includes('directive @model')) {
			this.typeDefs = '\ndirective @model on OBJECT' + this.typeDefs;
		}

		if (this.typeDefs.includes('@connection') && !this.typeDefs.includes('directive @connection')) {
			this.typeDefs = '\ndirective @connection on FIELD_DEFINITION' + this.typeDefs;
		}

		if ((this.config.generateGetAll || this.config.generateConnections) && !this.typeDefs.includes('enum ORDER_BY_OPTIONS')) {
			this.typeDefs += `
			enum ORDER_BY_OPTIONS {
				ASCENDING
				DESCENDING
				ASC
				DESC
			}
			`;
		}

		if (this.typeDefs.includes('type Query') && (this.config.generateDelete || this.config.generateUpdate) && !this.typeDefs.includes('type BatchPayload')) {
			this.typeDefs += `
				type BatchPayload {
					"""
					The number of nodes that have been affected by the Batch operation.
					"""
					count: Int!
					clientMutationId: String
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
				relation: RelationDirective,
				default: DefaultDirective,
				unique: UniqueDirective,
				createdTimestamp: CreatedTimestampDirective,
				updatedTimestamp: UpdatedTimestampDirective
			},
			resolverValidationOptions: {
				requireResolversForResolveType: false
			}
		});

		const typeMap = this.schema.getTypeMap();

		if (this.typeDefs.includes('@model')) {
			SchemaDirectiveVisitor.visitSchemaDirectives(this.schema, {
				model: ModelDirective
			});
		} else {
			Object.keys(typeMap).forEach(name => {
				const type = typeMap[name];
				if (this.isUserType(type) && isObjectType(type)) {
					type['_interfaces'].push(typeMap.Node);
					if (!type.getFields()['id']) {
						throw new Error('every object type must have an ID if you are not using the model directive');
					}
					has(this.schema, '_implementations.Node') ? this.schema['_implementations'].Node.push(type) : set(this.schema, '_implementations.Node', [type]);
				}
			});
		}

		// add args to type fields
		const queryTypeFields = (<GraphQLObjectType>this.schema.getType('Query')).getFields();
		let visitUnique = false;
		const uniqueDirective = {arguments: [], kind: 'Directive', name: {kind: 'Name', value: 'unique'}};

		Object.keys(typeMap).forEach(name => {
			const type = typeMap[name];
			if (this.isUserType(type)) {
				const fieldMap = (<GraphQLObjectType>type).getFields();
				Object.keys(fieldMap).forEach(fieldName => {
					const graphQLfield = fieldMap[fieldName];
					const returnType = getNamedType(graphQLfield.type);
					if (!isScalarType(returnType)) { // scalars don't have filters
						if (isInterfaceType(returnType) || isUnionType(returnType)) { // can't grab args from existing query type
							const where = this.schema.getType(returnType.name + 'WhereInput');
							if (typeIsList(graphQLfield.type)) {
								const orderBy = this.schema.getType(returnType.name + 'OrderByInput');
								const queryField = queryTypeFields[Object.keys(queryTypeFields)[0]];
								const fullArgs = queryField ? queryField.args : [];
								if (!isEmpty(fullArgs)) {
									const interfaceQueryArgs = fullArgs.filter(({ name }) => {
										return Object.keys(queryArgs).includes(name);
									});
									if (interfaceQueryArgs && !isEmpty(interfaceQueryArgs)) {
										graphQLfield.args.push(...interfaceQueryArgs);
									}
								}
								if (orderBy && isInputType(orderBy)) {
									graphQLfield.args.push({ name: 'orderBy', type: orderBy });
								}
							}
							if (where && isInputObjectType(where)) {
								graphQLfield.args.push({ name: 'where', type: where });
								const matchField = where.getFields()['match'];
								if (matchField && isInputObjectType(matchField.type)) {
									const rootMatchFields = getRootMatchFields(matchField.type);
									if (!isEmpty(rootMatchFields)) {
										graphQLfield.args.push(...values(rootMatchFields));
									}
								}
							}
						} else { // if an object type grab from existing query type
							let queryFieldName = `${camelCase(pluralize(returnType.name))}`;
							if (returnType.name.endsWith('Connection')) {
								queryFieldName = `${camelCase(pluralize(returnType.name.replace('Connection', '')))}Connection`;
							}
							const queryField = queryTypeFields[queryFieldName];
							const fullArgs = queryField ? queryField.args : [];
							if (!isEmpty(fullArgs)) {
								const filterArg = find(fullArgs, ['name', 'where']);
								graphQLfield.args = graphQLfield.args ? graphQLfield.args : [];
								if (typeIsList(graphQLfield.type)) {
									graphQLfield.args = graphQLfield.args.concat(fullArgs);
								} else {
									graphQLfield.args.push(filterArg);
								}
							}
						}
					} else if (fieldName === 'id') { // make sure id field has unique directive
						const directives = <Array<any>>graphQLfield.astNode.directives;
						const hasUnique = directives.findIndex((directive) => {
							return directive.name.value === 'unique';
						}) > -1;
						if (!hasUnique) {
							visitUnique = true;
							directives.push(uniqueDirective);
						}
					}
				});
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

		if (visitUnique) {
			SchemaDirectiveVisitor.visitSchemaDirectives(this.schema, {
				unique: UniqueDirective
			});
		}
		return this.schema;
	}

	public getSchema = (): GraphQLSchema => {
		if (!this.schema) {
			this.schema = this.addTypeDefsToSchema();
		}
		return this.schema;
	}

	public setResolvers = (typeName: string, fieldResolvers: Map<string, GraphQLFieldResolver<any, any>>): GraphQLSchema => {
		const resolverMap = {};
		resolverMap[typeName] = {};
		this.resolveFunctions[typeName] = this.resolveFunctions[typeName] ? this.resolveFunctions[typeName] : {};
		fieldResolvers.forEach((resolveFn, name) => {
			resolverMap[typeName][name] = resolveFn;
			this.resolveFunctions[typeName][name] = resolveFn; // save in case type defs changed
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
	public setIResolvers = (iResolvers: IResolvers): GraphQLSchema => {
		this.resolveFunctions = Object.assign(this.resolveFunctions, iResolvers);
		addResolveFunctionsToSchema({
			schema: this.schema,
			resolvers: iResolvers,
			resolverValidationOptions: {
				requireResolversForResolveType: false
			}
		});
		return this.schema;
	}

	public isUserType(type: GraphQLType): boolean {
		let isUserType = false;
		if (isObjectType(type) && this.isUserTypeByName(type.name)) {
			isUserType = true;
		}
		return isUserType;
	}

	public isUserTypeByName(typeName: string): boolean {
		let isUserType = false;
		if (typeName !== 'PageInfo' && !typeName.includes('__') && !typeName.endsWith('Aggregate') && !typeName.endsWith('Connection') && !typeName.endsWith('Edge') && !typeName.endsWith('Payload') && !typeName.endsWith('PreviousValues') && !(typeName.toLowerCase() === 'query') && !(typeName.toLowerCase() === 'mutation') && !(typeName.toLowerCase() === 'subscription')) {
			isUserType = true;
		}
		return isUserType;
	}
}

// class DisplayDirective extends SchemaDirectiveVisitor {
// 	public visitFieldDefinition(field) {
// 		this.setDisplay(field);
// 	}

// 	public visitEnumValue(value) {
// 		this.setDisplay(value);
// 	}

// 	public visitObject(object) {
// 		this.setDisplay(object);
// 	}

// 	private setDisplay(field: any) {
// 		field.display = {};
// 		if (this.args.name) {
// 			field.display.name = this.args.name;
// 		}
// 	}

// }

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
		const type = getNamedType(<GraphQLType>field.type);

		if (!isInputType(type)) {
			throw new Error('Can not set default on non input (scalar, enum, input) type which was attempted on ' + field.name);
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
		if (!object.getFields()['id']) {
			throw new Error('every model type must have an ID');
		}
		object._interfaces.push(this.schema.getTypeMap().Node);
		has(this.schema, '_implementations.Node') ? this.schema['_implementations'].Node.push(object) : set(this.schema, '_implementations.Node', [object]);
	}
}

class UniqueDirective extends SchemaDirectiveVisitor {
	public visitFieldDefinition(field) {
		field.unique = true;
	}
}

class UpdatedTimestampDirective extends SchemaDirectiveVisitor {
	public visitFieldDefinition(field) {
		const type = field.type;
		if (type.name === 'DateTime') {
			field['updatedTimestamp'] = true;
		}
	}
}
class CreatedTimestampDirective extends SchemaDirectiveVisitor {
	public visitFieldDefinition(field) {
		const type = field.type;
		if (type.name === 'DateTime') {
			field.createdTimestamp = true;
		}
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
	}
}

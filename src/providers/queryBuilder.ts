import gql from 'graphql-tag';
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { SchemaLink } from 'apollo-link-schema';
import pluralize from 'pluralize';
import {
	GraphQLFieldResolver, GraphQLID, GraphQLInputObjectType, GraphQLInputType,
	GraphQLInterfaceType, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLResolveInfo,
	GraphQLSchema, GraphQLString, GraphQLUnionType, IntrospectionObjectType,
	IntrospectionType, graphql, isInputType, isInterfaceType, isListType, isNonNullType, isObjectType, isUnionType
} from 'graphql';
import { printType } from 'graphql';
import _ from 'lodash';
import { addResolvers, addTypeDefsToSchema, getSchema } from '../models/graphQLShema';
import SchemaInfoBuilder from './schemaInfoBuilder';
import FortuneBuilder from './fortuneBuilder';

export default class QueryBuilder {
	config = {
		'generateGetAll': true,
		'generateGetAllMeta': true,
		'generateGetSingle': true,
		'generateCreate': true,
		'generateUpdate': true,
		'generateUpdateOrCreate': true,
		'generateDelete': true,
		'generateAddToRelation': true,
		'generateRemoveFromRelation': true,
		'generateSetRelation': true,
		'generateUnsetRelation': true,
		'generateIntegrationFields': true,
		'generateCustomMutationFields': true,
		'generateCustomQueryFields': true,
		'includeSubscription': true
	};

	private queryRootObjectTypeConfig = {
		name: 'Query',
		fields: {}
	};

	private mutationRootObjectTypeConfig = {
		name: 'Mutation',
		fields: {}
	};

	private newInputObjectTypes: Map<string, GraphQLInputType> = new Map<string, GraphQLInputType>();

	private newInputObjectTypeNames: Map<string, string> = new Map<string, string>();


	private createArgs: Map<string, object> = new Map<string, object>();

	private cache: InMemoryCache;

	private newQueryResolvers: Map<string, GraphQLFieldResolver<any, any>> = new Map<string, GraphQLFieldResolver<any, any>>();

	private newMutationResolvers: Map<string, GraphQLFieldResolver<any, any>> = new Map<string, GraphQLFieldResolver<any, any>>();

	schema: GraphQLSchema;
	schemaInfo: IntrospectionType[];

	private schemaInfoBuilder: SchemaInfoBuilder;

	private graphQLFortune: FortuneBuilder;

	constructor() {
		this.cache = new InMemoryCache();
		this.schema = getSchema();
		this.schemaInfoBuilder = new SchemaInfoBuilder(this.schema);
		this.schemaInfoBuilder.getSchemaInfo().then(schemaInfo => {
			this.schemaInfo = schemaInfo;
			this.buildQueries();
			this.graphQLFortune = new FortuneBuilder(schemaInfo);
		});
	}

	// private mapToObj(map) {
	// 	const obj = Object.create(null);
	// 	for (const [k, v] of map) {
	// 		// We don’t escape the key '__proto__'
	// 		// which can cause problems on older engines
	// 		obj[k] = v;
	// 	}
	// 	return obj;
	// }

	public buildQueries = async () => {
		console.info(this.schema);
		console.info(this.schemaInfo);
		const nodesResult = await graphql(this.schema, `{
			__type(name: "Node") {
				possibleTypes {
					name
				}
			}
		}`);
		const nodeNames = nodesResult.data.__type.possibleTypes;
		nodeNames.forEach(result => {
			this.buildQuery(<IntrospectionObjectType>this.schemaInfo[result.name]);
		});
		let newTypes = '';

		for (const [, inputObjectType] of this.newInputObjectTypes) {
			newTypes += printType(inputObjectType) + '\n';
		}

		const queryRoot = new GraphQLObjectType(this.queryRootObjectTypeConfig);
		const mutationRoot = new GraphQLObjectType(this.mutationRootObjectTypeConfig);
		// console.info(printType(mutationRoot));
		newTypes += printType(queryRoot) + '\n' + printType(mutationRoot);
		this.schema = addTypeDefsToSchema(newTypes);
		addResolvers('Query', this.newQueryResolvers);
		addResolvers('Mutation', this.newMutationResolvers);
		this.getClient();
	}

	private buildQuery = (type: IntrospectionObjectType) => {
		let accum = '';
		accum += this.config.generateGetAll ? this.generateGetAll(type) : '';
		accum += this.config.generateGetSingle ? this.generateGetSingle(type) : '';
		accum += this.config.generateCreate ? this.generateCreate(type) : '';
		return accum;
	}

	private generateCreate = (type: IntrospectionObjectType) => {
		const args = this.generateCreateArgs(type);
		this.mutationRootObjectTypeConfig.fields[`create${type.name}`] = {
			type: type.name,
			args: args
		};

		this.newMutationResolvers.set(`create${type.name}`, (
			_root: any,
			_args: { [key: string]: any },
			_context: any,
			_info: GraphQLResolveInfo,
		): any => {
			console.log(_args);
			return this.graphQLFortune.create(_args._typename, _args);
		});
	}

	private generateGetSingle = (type: IntrospectionObjectType) => {

		this.queryRootObjectTypeConfig.fields[type.name] = {
			type: type.name,
			args: { 'id': { type: new GraphQLNonNull<any>(GraphQLID) } }
		};

		this.newQueryResolvers.set(type.name, (
			_root: any,
			_args: { [key: string]: any },
			_context: any,
			_info: GraphQLResolveInfo,
		): any => {
			return this.graphQLFortune.find(type.name, [_args['id']]);
		});

	}

	private generateGetAll = (type: IntrospectionObjectType) => {
		const fieldName = `all${pluralize(type.name)}`;

		this.queryRootObjectTypeConfig.fields[fieldName] = {
			type: `[${type.name}]`,
		};

		this.newQueryResolvers.set(fieldName, (
			_root: any,
			_args: { [key: string]: any },
			_context: any,
			_info: GraphQLResolveInfo,
		): any => {
			return this.graphQLFortune.find(type.name);
		});
	}
	private generateInputNames = (type: GraphQLObjectType | GraphQLInterfaceType | GraphQLUnionType | GraphQLNonNull<any> | GraphQLList<any>, ): string => {
		if (isListType(type) || isNonNullType(type)) {
			return this.generateInputNames(type.ofType);
		} else {
			this.newInputObjectTypeNames.set(
				type.name,
				type.name + 'Input');
			return this.newInputObjectTypeNames.get(type.name);
		}
	}

	private getInputName = (name: string): string => {
		return name + 'Input';
	}


	private generateFieldsForInput(fieldName: string, inputTypes: GraphQLInputType[], defaultValue?: string): object {
		const fields = {};
		fields[fieldName] = {
			type: inputTypes[0],
			defaultValue: defaultValue
		};
		const idName = isListType(inputTypes[1]) ? fieldName + 'Ids' : fieldName + 'Id';
		fields[idName] = {
			type: inputTypes[1]
		};
		return fields;
	}

	// We don't need a reference to the actual input type for the field to print correctly so just dummy it to prevent ifninite recursion

	private generateInputs = (type: GraphQLObjectType | GraphQLInterfaceType | GraphQLUnionType | GraphQLNonNull<any> | GraphQLList<any>, dummy?: boolean): GraphQLInputType[] => {
		if (isListType(type)) {
			return [new GraphQLList(new GraphQLNonNull(this.generateInputs(type.ofType, dummy)[0])), new GraphQLList(new GraphQLNonNull(this.generateInputs(type.ofType, dummy)[1]))];
		} else if (isNonNullType(type)) {
			return [this.generateInputs(type.ofType, dummy)[0], this.generateInputs(type.ofType, dummy)[1]];
		} else {
			const fields = {};
			const name = this.getInputName(type.name);
			if (!dummy && !this.newInputObjectTypes.has(name)) {
				if (isUnionType(type)) {
					_.each(type.getTypes(), unionType => {
						_.merge(fields, this.generateFieldsForInput(
							this.getInputName(unionType.name),
							this.generateInputs(unionType, true)));

						if (!dummy) {
							this.generateInputs(unionType);
						}
					});
				} else if (isObjectType(type)) {
					_.each(type.getFields(), field => {
						if (field.name !== 'id') {
							_.merge(fields, this.generateFieldsForInput(
								field.name,
								isInputType(field.type) ? [field.type, GraphQLID] : this.generateInputs(field.type, true)));
						}
					});
				} else if (isInterfaceType(type)) {
					_.each(this.schemaInfo[type.name].possibleTypes, (possibleType) => {
						const schemaType = this.schema.getType(possibleType.name);

						_.merge(fields, this.generateFieldsForInput(
							possibleType.name,
							isInputType(schemaType) ? [schemaType, GraphQLID] : this.generateInputs(schemaType, true)));

						if (!isInputType(schemaType) && !dummy) {
							this.generateInputs(schemaType);
						}

					});
				}
				// create _typename input field with default value
				fields['_typename'] = {
					type: GraphQLString,
					defaultValue: type.name
				};
				this.newInputObjectTypes.set(name, new GraphQLInputObjectType({
					name,
					fields
				}));
				// console.info(printType(this.newInputObjectTypes.get(name)));
			} else if (dummy) {
				return [new GraphQLInputObjectType({
					name: name,
					fields: {}
				}), GraphQLID];
			}
			return [this.newInputObjectTypes.get(name), GraphQLID];
		}
	}



	private generateCreateArgs = (type: IntrospectionObjectType): object => {
		if (!this.createArgs.has(type.name)) {
			const args = {};
			const schemaType = <GraphQLObjectType>this.schema.getType(type.name);
			_.each(schemaType.getFields(), field => {
				if (field.name !== 'id') {
					if (isInputType(field.type)) {
						args[field.name] = {
							type: field.type,
							defaultValue: _.get(type.fields.find((introField) => introField.name === field.name), 'metadata.defaultValue')
						};
					} else {
						// console.info('generate input for', field.type);
						_.merge(args, this.generateFieldsForInput(
							field.name,
							this.generateInputs(field.type)));

						// console.info(args.get(field.name));
					}
				}

			});

			// create _typename input field with default value
			args['_typename'] = {
				type: GraphQLString,
				defaultValue: schemaType.name
			};
			this.createArgs.set(type.name, args);
		}

		return this.createArgs.get(type.name);
	}
	// const state = { testings: [] };
	public getClient = async (): Promise<ApolloClient<any>> => {
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
		console.log(this.schema);
		const client = new ApolloClient({
			link: new SchemaLink({ schema: this.schema }),
			cache: this.cache,
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

		_.each(scalars, scalar => {
			createScalarsPromises.push(client.mutate({
				mutation: createGraphQLScalarType,
				variables: {name: scalar.name, description: scalar.description}
			}));
		});

		const scalarTypes = await Promise.all(createScalarsPromises);
		const scalarIdMap = _.keyBy(_.map(scalarTypes, 'data.createGraphQLScalarType'), 'name');
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
					type: {GraphQLScalarTypeInputId: scalarIdMap['Boolean'].id}
				}]
			},
			{
				name: 'include',
				description: 'Directs the executor to include this field or fragment only when the `if` argument is true.',
				location: ['FIELD', 'FRAGMENT_SPREAD', 'INLINE_FRAGMENT'],
				args: [{
					name: 'if',
					description: 'Skipped when true.',
					type: {GraphQLScalarTypeInputId: scalarIdMap['Boolean'].id}
				}]
			},
			{
				name: 'deprecated',
				description: 'Marks an element of a GraphQL schema as no longer supported.',
				location: ['FIELD_DEFINITION', 'ENUM_VALUE'],
				args: [{
					name: 'reason',
					description: 'Explains why this element was deprecated, usually also including a suggestion for how to access supported similar data. Formatted in [Markdown](https://daringfireball.net/projects/markdown/).',
					type: {GraphQLScalarTypeInputId: scalarIdMap['String'].id},
					defaultValue: 'No longer supported'
				}]
			}
		];
		const createGraphQLDirective = gql`
		mutation createGraphQLDirective($name: String!, $description: String, $location: [String], $args: [GraphQLArgumentInput!]) {
			createGraphQLDirective(name: $name, description: $description, location: $location, args: $args) {
				id
				name
			}
		}
	`;
		_.each(directives, directive => {
			createDirectivesPromises.push(client.mutate({
				mutation: createGraphQLDirective,
				variables: {name: directive.name, description: directive.description, location: directive.location, args: directive.args}
			}));
		});

		await this.graphQLFortune.create('GraphQLEnumType', { name: 'test enum', description: 'test', _typename: 'GraphQLEnumType' });
		await this.graphQLFortune.create('GraphQLObjectType', { name: 'test object', description: 'test', _typename: 'GraphQLObjectType' });
		console.info(await client.query({
			query: gql`
									query {
										allGraphQLObjectTypes {
											name
										}
									}
								`

		}));

		return client;
	}


}






// const data = {
// 	networkStatus: {
// 		__typename: 'NetworkStatus',
// 		isConnected: true
// 	},
// 	objects: [
// 		{
// 			__typename: 'Object',
// 			name: 'Article',
// 			field: '0',
// 		},
// 		{
// 			__typename: 'Object',
// 			name: 'Post'
// 		}
// 	]
// };
// cache.writeData({ data });

// cache.writeData({
// 	id: 'ROOT_QUERY.objects.1',
// 	data: {
// 		field: 'hi'
// 	}
// });
// window['gql'] = gql;
// window['cache'] = cache;
// console.info(cache.readQuery({
// 	query: gql`
//   query {
//     objects {
//       name
//     }
//   }
// `}));
// mutation {
//   createGraphQLField(name: "test new field", type:{list:true, type:""}) {
//     id
//     name
//     description
//   }
// }

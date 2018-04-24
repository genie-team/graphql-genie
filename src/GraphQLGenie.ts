
import {
	GraphQLFieldResolver, GraphQLInputType, GraphQLObjectType, GraphQLResolveInfo, GraphQLSchema, IntrospectionObjectType, IntrospectionType, graphql,
} from 'graphql';
import { defaultFieldResolver, isScalarType, printType } from 'graphql';
import { assign, forOwn, isArray, isEmpty} from 'lodash';
import SchemaInfoBuilder from './SchemaInfoBuilder';
import FortuneGraph from './FortuneGraph';
import { GenerateGetAll } from './GenerateGetAll';
import { FortuneOptions, GraphQLGenieOptions, TypeGenerator } from './GraphQLGenieInterfaces';
import { GenerateGetSingle } from './GenerateGetSingle';
import { GenerateCreate } from './GenerateCreate';
import { GenerateUpdate } from './GenerateUpdate';
import { GenerateDelete } from './GenerateDelete';
import GraphQLSchemaBuilder from './GraphQLSchemaBuilder';
import { GenerateRelationMutations } from './GenerateRelationMutations';
import { Relations, computeRelations, getReturnType } from './TypeGeneratorUtils';
import { IntrospectionResultData } from 'apollo-cache-inmemory';


export default class GraphQLGenie {
	private fortuneOptions: FortuneOptions;
	private config = {
		'generateGetAll': true,
		'generateGetAllMeta': true,
		'generateGetSingle': true,
		'generateCreate': true,
		'generateUpdate': true,
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
	private generators: Array<TypeGenerator>;

	private schema: GraphQLSchema;
	private schemaBuilder: GraphQLSchemaBuilder;
	private schemaInfo: IntrospectionType[];
	private schemaInfoBuilder: SchemaInfoBuilder;
	private relations: Relations;
	public graphQLFortune: FortuneGraph;

	private initialized: Promise<boolean>;
	constructor(options: GraphQLGenieOptions) {
		if (!options.fortuneOptions) {
			throw new Error('Fortune Options is required');
		} else {
			this.fortuneOptions = options.fortuneOptions;
		}

		if (options.schemaBuilder) {
			this.schemaBuilder = options.schemaBuilder;
		} else if (options.typeDefs) {
			this.schemaBuilder = new GraphQLSchemaBuilder(options.typeDefs);
		} else {
			throw new Error('Need a schemaBuilder or typeDefs');
		}

		if (options.generatorOptions) {
			this.config = Object.assign(this.config, options.generatorOptions);
		}

		this.schema = this.schemaBuilder.getSchema();
		this.initialized = this.init();
	}



	private init = async () => {
		this.generators = [];
		this.schemaInfoBuilder = new SchemaInfoBuilder(this.schema);
		this.schemaInfo = await this.schemaInfoBuilder.getSchemaInfo();
		this.relations = computeRelations(this.schemaInfo);
		this.graphQLFortune = new FortuneGraph(this.fortuneOptions, this.schemaInfo);
		await this.buildQueries();
		await this.buildResolvers();
		window['graphql'] = graphql;

		window['schema'] = this.schema;

		return true;
	}

	private buildResolvers = async () => {
		forOwn(this.schemaInfo, (type: any, name: string) => {
			const fieldResolvers = new Map<string, GraphQLFieldResolver<any, any>>();

			if (type.kind === 'OBJECT' && name !== 'Query' && name !== 'Mutation' && name !== 'Subscription') {
				forOwn(type.fields, (field) => {
					const graphQLType = this.schema.getType(getReturnType(field.type));
					let resolver;
					if (!isScalarType(graphQLType)) {
						resolver = async (
							root: any,
							_args: { [key: string]: any },
							_context: any,
							_info: GraphQLResolveInfo
						): Promise<any> => {
							const fortuneReturn = root && root.fortuneReturn ? root.fortuneReturn : root;

							if (!fortuneReturn) {return fortuneReturn; }

							const cache = root && root.cache ? root.cache : new Map<string, object>();
							const typeName = getReturnType(field.type);

							let result = [];
							let returnArray = false;
							let fieldValue = fortuneReturn[field.name];
							returnArray = isArray(fieldValue);
							fieldValue = returnArray ? fieldValue : [fieldValue];
							const ids = [];
							fieldValue.forEach(element => {
								if (element) {
									if (cache.has(element)) {
										result.push({fortuneReturn: cache.get(element),
											cache: cache,
											__typename: cache.get(element).__typename
										});
									} else {
										ids.push(element);
									}
								}
							});
							if (!isEmpty(ids)) {
								let findResult = await this.graphQLFortune.find(typeName, ids);
								if (findResult) {
									findResult = isArray(findResult) ? findResult : [findResult];
									findResult.forEach(result => {
										cache.set(result.id, result);
									});

									findResult = findResult.map((result) => {
										return {fortuneReturn: result,
											cache: cache,
											__typename: result.__typename
										};
									});
									result = result.concat(findResult);
								}
							}
							return result.length === 0 ? null : returnArray ? result : result[0];
						};

					} else {
						resolver  = async (
							root: any,
							_args: { [key: string]: any },
							_context: any,
							_info: GraphQLResolveInfo
						): Promise<any> => {
							const fortuneReturn = root && root.fortuneReturn ? root.fortuneReturn : root;
							const result = await defaultFieldResolver.apply(this, [fortuneReturn, _args, _context, _info]);
							return result;
						};

					}
					fieldResolvers.set(field.name, resolver);


				});
				this.schema = this.schemaBuilder.addResolvers(name, fieldResolvers);
			}
		});
	}

	public buildQueries = async () => {

		const nodesResult = await graphql(this.schema, `{
			__type(name: "Node") {
				possibleTypes {
					name
				}
			}
		}`);

		const nodeNames = nodesResult.data.__type.possibleTypes;
		const nodeTypes = [];
		nodeNames.forEach(result => {
			nodeTypes.push(<IntrospectionObjectType>this.schemaInfo[result.name]);
		});
		const currInputObjectTypes = new Map<string, GraphQLInputType>();
		if (this.config.generateGetAll) {
			this.generators.push(new GenerateGetAll(this.graphQLFortune, 'Query', nodeTypes, this.schema));
		}
		if (this.config.generateGetSingle) {
			this.generators.push(new GenerateGetSingle(this.graphQLFortune, 'Query', nodeTypes));
		}
		if (this.config.generateCreate) {
			this.generators.push(new GenerateCreate(this.graphQLFortune, 'Mutation', nodeTypes, currInputObjectTypes, this.schemaInfo, this.schema, this.relations));
		}
		if (this.config.generateUpdate) {
			this.generators.push(new GenerateUpdate(this.graphQLFortune, 'Mutation', nodeTypes, currInputObjectTypes, this.schemaInfo, this.schema));
		}
		if (this.config.generateDelete) {
			this.generators.push(new GenerateDelete(this.graphQLFortune, 'Mutation', nodeTypes));
		}

		const currOutputObjectTypeDefs = new Set<string>();
		if (this.config.generateSetRelation || this.config.generateUnsetRelation || this.config.generateAddToRelation || this.config.generateRemoveFromRelation) {
			this.generators.push(new GenerateRelationMutations(this.graphQLFortune, 'Mutation', this.config, this.relations, currOutputObjectTypeDefs));
		}



		let newTypes = '';
		console.log(currInputObjectTypes);
		currInputObjectTypes.forEach(inputObjectType => {
			newTypes += printType(inputObjectType) + '\n';
		});
		console.log(newTypes);


		currOutputObjectTypeDefs.forEach(newType => {
			newTypes += newType + '\n';
		});

		const fieldsOnObject = new Map<string, {}>();
		const resolvers = new Map<string, Map<string, GraphQLFieldResolver<any, any>>>();

		// merge maps and compute new input types
		this.generators.forEach(generator => {
			generator.getFieldsOnObject().forEach((fields, objectName) => {
				fieldsOnObject.set(objectName, assign({}, fieldsOnObject.get(objectName), fields));
			});

			const generatorResolvers = generator.getResolvers();

			generatorResolvers.forEach((resolver, name) => {
				if (!resolvers.has(name)) {
					resolvers.set(name, new Map<string, GraphQLFieldResolver<any, any>>());
				}
				resolvers.set(name, new Map([...resolvers.get(name), ...resolver]));
			});
		});

		fieldsOnObject.forEach((fields, objName) => {
			newTypes += printType(new GraphQLObjectType({ name: objName, fields: fields })) + '\n';
		});

		this.schema = this.schemaBuilder.addTypeDefsToSchema(newTypes);

		resolvers.forEach((resolverMap, name) => {
			this.schemaBuilder.addResolvers(name, resolverMap);
		});

		this.schema = this.schemaBuilder.getSchema();

	}



	public getSchema = async (): Promise<GraphQLSchema> => {
		await this.initialized;
		return this.schema;
	}

	public getFragmentTypes = async (): Promise<IntrospectionResultData> => {
		await this.initialized;
		const result = await graphql(this.schema, `{
			__schema {
				types {
					kind
					name
					possibleTypes {
						name
					}
				}
			}
		}`);
		// here we're filtering out any type information unrelated to unions or interfaces
		const filteredData = result.data.__schema.types.filter(
			type => type.possibleTypes !== null,
		);
		result.data.__schema.types = filteredData;
		return <IntrospectionResultData>result.data;
	}

}






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

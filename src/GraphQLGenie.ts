
import { GenerateUpdate } from './GenerateUpdate';
import { GraphQLFieldResolver, GraphQLInputObjectType, GraphQLObjectType, GraphQLSchema, IntrospectionObjectType, IntrospectionType, getNamedType, graphql, isObjectType, isScalarType, printType } from 'graphql';
import FortuneGraph from './FortuneGraph';
import { GenerateConnections } from './GenerateConnections';
import { GenerateCreate } from './GenerateCreate';
import { GenerateDelete } from './GenerateDelete';
import { GenerateGetAll } from './GenerateGetAll';
import { assign, forOwn, get, isArray, isEmpty, isObject } from 'lodash';
import { GenerateUpsert } from './GenerateUpsert';
import { DataResolver, FortuneOptions, GenerateConfig, GeniePlugin, GraphQLGenieOptions, TypeGenerator } from './GraphQLGenieInterfaces';
import { GraphQLSchemaBuilder } from './GraphQLSchemaBuilder';
import { getReturnType } from './GraphQLUtils';
import SchemaInfoBuilder from './SchemaInfoBuilder';
import { Relations, computeRelations, getTypeResolver } from './TypeGeneratorUtilities';

export class GraphQLGenie {
	private fortuneOptions: FortuneOptions;
	private config: GenerateConfig = {
		generateGetAll: true,
		generateCreate: true,
		generateUpdate: true,
		generateDelete: true,
		generateUpsert: true,
		generateConnections: true
	};
	private generators: Array<TypeGenerator>;

	private schema: GraphQLSchema;
	private schemaBuilder: GraphQLSchemaBuilder;
	private schemaInfo: IntrospectionType[];
	private schemaInfoBuilder: SchemaInfoBuilder;
	private relations: Relations;
	private graphQLFortune: FortuneGraph;
	private plugins: GeniePlugin[];

	public ready: boolean;
	constructor(options: GraphQLGenieOptions) {
		this.ready = false;
		this.fortuneOptions  = options.fortuneOptions ? options.fortuneOptions : {};
		this.fortuneOptions.settings = this.fortuneOptions.settings ? this.fortuneOptions.settings : {};
		if (!this.fortuneOptions.settings.hasOwnProperty('enforceLinks')) {
			this.fortuneOptions.settings.enforceLinks = true;
		}

		if (options.generatorOptions) {
			this.config = Object.assign(this.config, options.generatorOptions);
		}

		if (options.schemaBuilder) {
			this.schemaBuilder = options.schemaBuilder;
		} else if (options.typeDefs) {
			this.schemaBuilder = new GraphQLSchemaBuilder(options.typeDefs, this.config);
		} else {
			throw new Error('Need a schemaBuilder or typeDefs');
		}

		this.plugins = [];
		this.schema = this.schemaBuilder.getSchema();
		this.validate();
	}

	private validate = () => {
		const typeMap = this.schema.getTypeMap();
		Object.keys(typeMap).forEach(name => {
			const type = typeMap[name];
			if (isObjectType(type) && !type.name.includes('__') && !(type.name.toLowerCase() === 'query') && !(type.name.toLowerCase() === 'mutation') && !(type.name.toLowerCase() === 'subscription')) {
				if (type.name.endsWith('Connection')) {
					throw new Error(`${type.name} is invalid because it ends with Connection which could intefere with necessary generated types and genie logic`);
				} else if (type.name.endsWith('Edge')) {
					throw new Error(`${type.name} is invalid because it ends with Edge which could intefere with necessary generated types and genie logic`);
				} else if (this.config.generateConnections && type.name === 'PageInfo') {
					throw new Error(`${type.name} is invalid. PageInfo type is auto generated for connections`);
				}
			}
		});
	}

	public init = async (): Promise<GraphQLGenie> => {
		this.generators = [];
		this.schemaInfoBuilder = new SchemaInfoBuilder(this.schema);
		this.schemaInfo = await this.schemaInfoBuilder.getSchemaInfo();
		this.relations = computeRelations(this.schemaInfo);
		this.graphQLFortune = new FortuneGraph(this.fortuneOptions, this.schemaInfo);
		await this.buildQueries();
		await this.buildResolvers();

		await Promise.all(this.plugins.map(async (plugin) => {
			const pluginResult = plugin(this);
			if (pluginResult.then) {
				await pluginResult;
			}
		}));

		this.plugins = [];
		this.schema = this.schemaBuilder.getSchema();
		this.ready = true;
		return this;
	}

	private buildResolvers = async () => {
		forOwn(this.schemaInfo, (type: any, name: string) => {
			const fieldResolvers = new Map<string, GraphQLFieldResolver<any, any>>();
			const schemaType = this.schema.getType(type.name);
			if (isObjectType(schemaType) && name !== 'Query' && name !== 'Mutation' && name !== 'Subscription') {
				const fieldMap = schemaType.getFields();

				forOwn(type.fields, (field) => {
					const graphQLfield = fieldMap[field.name];
					const returnConnection = getReturnType(graphQLfield.type).endsWith('Connection');
					fieldResolvers.set(field.name, getTypeResolver(this.graphQLFortune, this.schema, field, returnConnection));
				});
				this.schema = this.schemaBuilder.setResolvers(name, fieldResolvers);
			}
		});
	}

	private buildQueries = async () => {

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
		const currInputObjectTypes = new Map<string, GraphQLInputObjectType>();
		const currOutputObjectTypeDefs = new Set<string>();

		if (this.config.generateGetAll) {
			this.generators.push(new GenerateGetAll(this.graphQLFortune, 'Query', nodeTypes, this.schema, currInputObjectTypes, this.schemaInfo, this.relations));
		}
		if (this.config.generateConnections) {
			this.generators.push(new GenerateConnections(this.graphQLFortune, 'Query', nodeTypes, this.schema, currOutputObjectTypeDefs, currInputObjectTypes, this.schemaInfo, this.relations));
		}
		if (this.config.generateCreate) {
			this.generators.push(new GenerateCreate(this.graphQLFortune, 'Mutation', nodeTypes, this.config, currInputObjectTypes, currOutputObjectTypeDefs, this.schemaInfo, this.schema, this.relations));
		}
		if (this.config.generateUpdate) {
			this.generators.push(new GenerateUpdate(this.graphQLFortune, 'Mutation', nodeTypes, this.config, currInputObjectTypes, currOutputObjectTypeDefs, this.schemaInfo, this.schema, this.relations));
		}
		if (this.config.generateUpsert) {
			this.generators.push(new GenerateUpsert(this.graphQLFortune, 'Mutation', nodeTypes, this.config, currInputObjectTypes, currOutputObjectTypeDefs, this.schemaInfo, this.schema, this.relations));
		}

		if (this.config.generateDelete) {
			this.generators.push(new GenerateDelete(this.graphQLFortune, 'Mutation', nodeTypes, this.config, currInputObjectTypes, currOutputObjectTypeDefs, this.schemaInfo, this.schema, this.relations));
		}

		let newTypes = '';
		currInputObjectTypes.forEach(inputObjectType => {
			// console.log(printType(inputObjectType));
			newTypes += printType(inputObjectType) + '\n';
		});

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
		// console.log(newTypes);

		this.schema = this.schemaBuilder.addTypeDefsToSchema(newTypes);

		resolvers.forEach((resolverMap, name) => {
			this.schemaBuilder.setResolvers(name, resolverMap);
		});

		this.schema = this.schemaBuilder.getSchema();

	}

	public use = async (plugin: GeniePlugin) => {
		if (!this.ready) {
			this.plugins.push(plugin);
		} else {
			const pluginResult = plugin(this);
			if (pluginResult.then) {
				await pluginResult;
			}
			this.schema = this.schemaBuilder.getSchema();
		}
	}

	public getSchema = (): GraphQLSchema => {
		return this.schema;
	}

	public getDataResolver = (): DataResolver => {
		return this.graphQLFortune;
	}

	public getSchemaBuilder = (): GraphQLSchemaBuilder => {
		return this.schemaBuilder;
	}

	public printSchema = (): string => {
		return this.schemaBuilder.printSchemaWithDirectives();
	}

	public importRawData = async (data: any[], merge = false, defaultTypename?: string) => {
		let index = 0;
		const createPromises = [];
		let createData = data;
		const objectsMap = new Map<String, Object>();
		data = data.map(object => {
			const typeName = object['__typename'] || defaultTypename;
			if (!typeName) {
				throw new Error('Every object must have a __typename or defaultTypeName must be provided');
			}
			object.id = object.id || this.graphQLFortune.computeId(typeName);
			return object;
		});
		if (merge) {
			createData = [];
			const findPromises = [];
			data.forEach(object => {
				const typeName = object['__typename'] || defaultTypename;
				findPromises.push(this.graphQLFortune.find(typeName, object['id']));
			});
			const findResults = await Promise.all(findPromises);
			findResults.forEach(result => {
				if (isEmpty(result)) {
					createData.push(data[index]);
				} else {
					objectsMap.set(result.id, result);
				}
				index++;
			});
		}
		createData.forEach(object => {
			const typeName = object['__typename'] || defaultTypename;
			const schemaType = <GraphQLObjectType>this.schema.getType(typeName);
			const fieldMap = schemaType.getFields();
			const objectFields = Object.keys(object);
			const record = {};
			if (merge && object.id) {
				record['id'] = object.id;
			}
			objectFields.forEach(fieldName => {
				const schemaField = fieldMap[fieldName];
				const currVal = object[fieldName];
				let addToRecord = false;
				if (isArray(currVal) && !isEmpty(currVal)) {
					addToRecord = true;
				} else if (currVal !== undefined && currVal !== null) {
					addToRecord = true;
				}
				if (addToRecord && fieldName !== 'id' && schemaField) {
					const schemaFieldType = getNamedType(schemaField.type);
					if (isScalarType(schemaFieldType)) {
						record[fieldName] = currVal;
					}
				}
			});
			createPromises.push(
				new Promise((resolve, reject) => {
					this.graphQLFortune.create(typeName, record).then(createdObj => {
						objectsMap.set(object['id'], createdObj);
						resolve(createdObj);
					}).catch(reason => {
						reject(reason);
					});
				})
			);
		});
		await Promise.all(createPromises);

		index = 0;
		const updatePromies = [];
		data.forEach(object => {
			const typeName = object['__typename'] || defaultTypename;
			const schemaType = <GraphQLObjectType>this.schema.getType(typeName);
			const fieldMap = schemaType.getFields();
			const objectFields = Object.keys(object);
			let update = {};
			const pull = {};
			objectFields.forEach(fieldName => {
				const schemaField = fieldMap[fieldName];
				if (schemaField) {
					const schemaFieldType = getNamedType(schemaField.type);
					if (merge || !isScalarType(schemaFieldType)) {
						let currValue = object[fieldName];
						if (!isEmpty(currValue)) {
							if (!isScalarType(schemaFieldType)) {
								if (isArray(currValue)) {
									if (isObject(currValue[0])) {
										currValue = currValue.map(element => element.id);
									}
									const fieldPush = [];
									const fieldPull = [];
									const existingObj = objectsMap.get(object['id']);
									const existingObjField = existingObj ? existingObj[fieldName] : [];
									currValue.forEach(element => {
										if (!existingObjField.includes(element)) {
											fieldPush.push(element);
										}
									});
									existingObjField.forEach(element => {
										if (!currValue.includes(element)) {
											fieldPull.push(element);
										}
									});
									if (!isEmpty(fieldPush)) {
										update[fieldName] = fieldPush;
									}
									if (!isEmpty(fieldPull)) {
										pull[fieldName] = fieldPull;
									}
								} else {
									if (isObject(currValue)) {
										currValue = currValue.id;
									}
									const existingObj = objectsMap.get(currValue);
									// tslint:disable-next-line:prefer-conditional-expression
									if (existingObj && currValue !== existingObj['id']) {
										update[fieldName] = existingObj['id'];
									} else {
										update[fieldName] = currValue;
									}
								}
							} else {
								update[fieldName] = currValue;
							}

						}
					}
				}
			});
			if (!isEmpty(update)) {
				update['id'] = objectsMap.get(object.id)['id'];
				update = this.graphQLFortune.generateUpdates(typeName, update);
				if (!isEmpty(pull)) {
					update['pull'] = pull;
				}
				console.log(typeName, update);
				updatePromies.push(this.graphQLFortune.update(typeName, update, undefined, { fortuneFormatted: true }));
			}
			index++;
		});
		await Promise.all(updatePromies);
	}

	public getRawData = async (): Promise<any> => {
		let nodes = [];
		const result = await graphql(this.schema, `{
			__schema {
				types {
					name
					kind
				}
			}
		}`);
		const types = get(result, 'data.__schema.types');
		if (types) {
			const userObjects = result.data.__schema.types.filter(
				type => type.kind === 'OBJECT' && this.schemaBuilder.isUserTypeByName(type.name)
			);
			const promises = [];
			userObjects.forEach(object => {
				promises.push(this.graphQLFortune.find(object.name));
			});
			const allData = await Promise.all(promises);
			nodes = [].concat.apply([], allData); // flatten

		}
		return nodes;
	}

	public getFragmentTypes = async (): Promise<any> => {
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
		const types = get(result, 'data.__schema.types');
		if (types) {
			const filteredData = result.data.__schema.types.filter(
				type => type.possibleTypes !== null,
			);
			result.data.__schema.types = filteredData;

		}
		return result.data;
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

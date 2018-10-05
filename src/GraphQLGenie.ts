
import { GenerateUpdate } from './GenerateUpdate';
import { GraphQLFieldResolver, GraphQLInputObjectType, GraphQLObjectType, GraphQLScalarType, GraphQLSchema, IntrospectionObjectType, IntrospectionQuery, IntrospectionType, getNamedType, getNullableType, introspectionFromSchema, isEnumType, isListType, isObjectType, isScalarType, printType } from 'graphql';
import FortuneGraph from './FortuneGraph';
import { GenerateConnections } from './GenerateConnections';
import { GenerateCreate } from './GenerateCreate';
import { GenerateDelete } from './GenerateDelete';
import { GenerateGetAll } from './GenerateGetAll';
import { assign, forOwn, get, isArray, isEmpty, isFunction, isPlainObject, isString, set } from 'lodash';
import { GenerateUpsert } from './GenerateUpsert';
import { DataResolver, FortuneOptions, FortuneRecordTypeDefinitions, GenerateConfig, GenericObject, GeniePlugin, GraphQLGenieOptions, TypeGenerator } from './GraphQLGenieInterfaces';
import { GraphQLSchemaBuilder } from './GraphQLSchemaBuilder';
import { getReturnType } from './GraphQLUtils';
import SchemaInfoBuilder from './SchemaInfoBuilder';
import { Relations, computeRelations, getTypeResolver, meetsConditions } from './TypeGeneratorUtilities';
import { GenerateGetOne } from './GenerateGetOne';
import { GenerateMigrations } from './GenerateMigrations';
import { isNumber } from 'util';

export class GraphQLGenie {
	private fortuneOptions: FortuneOptions;
	private fortuneRecordTypeDefinitions: FortuneRecordTypeDefinitions;
	private config: GenerateConfig = {
		generateGetOne: true,
		generateGetAll: true,
		generateCreate: true,
		generateUpdate: true,
		generateDelete: true,
		generateUpsert: true,
		generateConnections: true,
		generateMigrations: true
	};
	private generators: Array<TypeGenerator>;

	private schema: GraphQLSchema;
	private schemaBuilder: GraphQLSchemaBuilder;
	private schemaInfo: IntrospectionType[];
	private schemaInfoBuilder: SchemaInfoBuilder;
	private relations: Relations;
	private graphQLFortune: FortuneGraph;
	private plugins: GeniePlugin[];

	constructor(options: GraphQLGenieOptions) {
		this.fortuneOptions = options.fortuneOptions ? options.fortuneOptions : {};
		this.fortuneOptions.settings = this.fortuneOptions.settings ? this.fortuneOptions.settings : {};
		if (!this.fortuneOptions.settings.hasOwnProperty('enforceLinks')) {
			this.fortuneOptions.settings.enforceLinks = true;
		}
		this.fortuneRecordTypeDefinitions = options.fortuneRecordTypeDefinitions;

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

		this.plugins = isArray(options.plugins) ? options.plugins : options.plugins ? [options.plugins] : [];
		this.schema = this.schemaBuilder.getSchema();
		this.validate();
		this.init();
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

	private init = () => {
		this.generators = [];
		this.schemaInfoBuilder = new SchemaInfoBuilder(this.schema);
		this.schemaInfo = this.schemaInfoBuilder.getSchemaInfo();
		this.relations = computeRelations(this.schemaInfo);
		this.graphQLFortune = new FortuneGraph(this.fortuneOptions, this.schemaInfo, this.fortuneRecordTypeDefinitions);
		this.buildQueries();
		this.buildResolvers();

		this.plugins.forEach(plugin => {
			const pluginResult = plugin(this);
			if (pluginResult && isFunction(pluginResult.then)) {
				throw new Error('You must use call .useAsync for plugins that are asynchronous');
			}
		});

		this.schema = this.schemaBuilder.getSchema();
	}

	private buildResolvers = () => {
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

	private buildQueries = () => {

		const nodeNames = this.getModelTypes();
		const nodeTypes = [];
		nodeNames.forEach(result => {
			nodeTypes.push(<IntrospectionObjectType>this.schemaInfo[result.name]);
		});
		const currInputObjectTypes = new Map<string, GraphQLInputObjectType>();
		const currOutputObjectTypeDefs = new Set<string>();
		let getAll;
		if (this.config.generateGetAll) {
			getAll = new GenerateGetAll(this.graphQLFortune, 'Query', nodeTypes, this.schema, currInputObjectTypes, this.schemaInfo, this.relations);
			this.generators.push(getAll);
		}
		if (this.config.generateGetOne) {
			this.generators.push(new GenerateGetOne(this.graphQLFortune, 'Query', nodeTypes, this.schema, currInputObjectTypes, this.schemaInfo, this.relations, getAll));
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

		if (this.config.generateMigrations) {
			this.generators.push(new GenerateMigrations(this, currOutputObjectTypeDefs));
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

	public use = (plugin: GeniePlugin): GraphQLGenie => {
		const pluginResult = plugin(this);
		if (pluginResult && isFunction(pluginResult.then)) {
			throw new Error('You must use call .useAsync for plugins that are asynchronous');
		}
		this.schema = this.schemaBuilder.getSchema();
		return this;
	}

	public useAsync = async (plugin: GeniePlugin): Promise<GraphQLGenie> => {
		const pluginResult = plugin(this);
		if (pluginResult && isFunction(pluginResult.then)) {
			await pluginResult;
		}
		this.schema = this.schemaBuilder.getSchema();
		return this;
	}

	public getSchema = (): GraphQLSchema => {
		return this.schemaBuilder.getSchema();
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

	private mapIdsToCreatedIds = (currIDs, objectsMap: Map<String, GenericObject>) => {
		if (currIDs) {
			// tslint:disable-next-line:prefer-conditional-expression
			if (isArray(currIDs)) {
				if (isPlainObject(currIDs[0])) {
					currIDs = currIDs.map(element => element && element.id ? element.id : element);
				}
				currIDs = currIDs.map(currID => objectsMap.has(currID) && objectsMap.get(currID)['id'] ? objectsMap.get(currID)['id'] : currID);
			} else {
				// handle in case it's the full object not just id
				if (isPlainObject(currIDs) && currIDs.id) {
					currIDs = currIDs.id;
				}
				currIDs = objectsMap.has(currIDs) && objectsMap.get(currIDs)['id'] ? objectsMap.get(currIDs)['id'] : currIDs;
			}
		}
		return currIDs;
	}

	public importRawData = async (data: any[], merge = false, defaultTypename?: string, context?, conditions?: { id: string | string[], conditions: GenericObject }[]) => {
		const meta = context ? { context } : undefined;
		conditions = conditions && merge ? conditions : [];
		// altered data
		const alteredData = new Map<String, GenericObject>();
		// there is a condition but nothing with this id even exists
		const missingIds: string[] = [];
		const missingData: GenericObject[] = [];
		// didn't meet the condition
		const unalteredData: GenericObject[] = [];

		const userTypes = this.getUserTypes();

		const conditionsMap = new Map<string, GenericObject[]>();
		conditions.forEach(condition => {
			if (!isEmpty(condition.conditions)) {
				const ids = isArray(condition.id) ? condition.id : [condition.id];
				ids.forEach(id => {
					if (!conditionsMap.has(id)) {
						conditionsMap.set(id, []);
					}
					conditionsMap.get(id).push(condition.conditions);
				});
			}
		});

		const createPromises = [];
		let createData = data;
		const objectsMap = new Map<String, GenericObject>();
		data = data.map((object, index) => {
			if (isEmpty(object)) {
				throw new Error('Data has a null or empty object at index ' + index);
			}
			let typeName = object.__typename;
			let idTypename: string;
			if (!typeName && isString(object.id)) {
				try {
					idTypename = atob(object.id).split(':')[1];
				} catch (e) {
					// empty by design
				}
			}
			typeName = idTypename && !typeName ? idTypename : typeName;
			typeName = typeName ? typeName : defaultTypename;
			if (!typeName) {
				throw new Error('Every object must have a __typename or defaultTypeName must be provided');
			} else if (!userTypes.includes(typeName)) {
				throw new Error(`Bad typename in data, ${typeName} does not exist in schema`);
			}
			object.__typename = typeName;
			object.id = object.id || this.graphQLFortune.computeId(typeName);

			// make sure we parse the values
			const schemaType = <GraphQLObjectType>this.schema.getType(typeName);
			const fieldMap = schemaType.getFields();
			const objectFields = Object.keys(object);
			objectFields.forEach(fieldName => {
				const schemaField = fieldMap[fieldName];
				if (schemaField) {
					const namedType = getNamedType(schemaField.type);
					if (isScalarType(namedType)) {
						let currVal = object[fieldName];
						const scalarType = <GraphQLScalarType>this.schema.getType(namedType.name);
						if (isArray(currVal) && !isEmpty(currVal)) {
							currVal = currVal.map((val) => {
								if (val && isString(val)) {
									val = scalarType.parseValue(val);
								}
								return val;
							});
						} else if (isString(currVal)) {
							currVal = scalarType.parseValue(currVal);
						}
						object[fieldName] = currVal;
					}
				}
			});
			return object;
		});
		if (merge) {
			createData = [];
			const findPromises = [];
			data.forEach(object => {
				const typeName = object.__typename;
				findPromises.push(this.graphQLFortune.find(typeName, object.id));
			});
			const findResults = await Promise.all(findPromises);
			findResults.forEach((result, index) => {
				if (isEmpty(result)) {
					if (conditionsMap.has(data[index].id)) {
						missingIds.push(data[index].id);
						missingData.push(data[index]);
					} else {
						createData.push(data[index]);
					}
				} else {
					objectsMap.set(result.id, result);
				}
			});
		}
		createData.forEach(object => {
			const typeName = object.__typename;
			const schemaType = <GraphQLObjectType>this.schema.getType(typeName);
			const fieldMap = schemaType.getFields();
			const objectFields = Object.keys(object);
			const record: GenericObject = {};
			if (merge && object.id) {
				record.id = object.id;
			}
			objectFields.forEach(fieldName => {
				const schemaField = fieldMap[fieldName];
				const currVal = object[fieldName];
				// only add if truthy and not empty
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
					this.graphQLFortune.create(typeName, record, meta).then(createdObj => {
						objectsMap.set(object.id, createdObj);
						alteredData.set(object.id, createdObj);
						resolve(createdObj);
					}).catch(reason => {
						reject(reason);
					});
				})
			);
		});
		await Promise.all(createPromises);

		const updatePromies = [];

		// do the updates
		await Promise.all(data.map(async (object): Promise<void> => {
			if (missingIds.includes(object.id)) {
				return;
			}
			const typeName = object.__typename;
			const schemaType = <GraphQLObjectType>this.schema.getType(typeName);
			const existingData = objectsMap.get(object.id);
			let objMeetsConditions = true;
			if (conditionsMap.has(object.id)) {
				const allConditions = await Promise.all(conditionsMap.get(object.id).map(async (condition): Promise<boolean> => {
					return await meetsConditions(condition, typeName, schemaType, existingData, this.graphQLFortune, get(context, 'context', context), get(context, 'info'));
				}));
				objMeetsConditions = !allConditions.includes(false);
			}
			if (!objMeetsConditions) {
				unalteredData.push(existingData);
			} else {
				let update: GenericObject = {};
				const objectFields = Object.keys(object);
				const fieldMap = schemaType.getFields();

				objectFields.forEach(fieldName => {
					const schemaField = fieldMap[fieldName];
					if (schemaField) {
						const schemaFieldType = getNamedType(schemaField.type);
						if (merge || (!isScalarType(schemaFieldType) && !isEnumType(schemaFieldType))) {
							let currValue = object[fieldName];
							if (!isEmpty(currValue)) {
								if (!isScalarType(schemaFieldType) && !isEnumType(schemaFieldType)) {
									if (isArray(currValue)) {
										// if it's an array then set

										// use new ids if found
										currValue = this.mapIdsToCreatedIds(currValue, objectsMap);

										update[fieldName] = { set: currValue };
									} else {
										// if not an array we need to handle scalars vs objects with push/pull/set

										// handle in case it's the full object not just id
										if (isPlainObject(currValue) && currValue.id) {
											currValue = currValue.id;
										}
										// if it's not an object than it's just an id so we should set it
										// tslint:disable-next-line:prefer-conditional-expression
										if (!isPlainObject(currValue)) {
											// use the new object id
											update[fieldName] = this.mapIdsToCreatedIds(currValue, objectsMap);
										} else {
											// it's an object so it is push/pull/set
											if (currValue.push) {
												currValue.push = this.mapIdsToCreatedIds(currValue.push, objectsMap);
											}
											if (currValue.pull) {
												currValue.pull = this.mapIdsToCreatedIds(currValue.pull, objectsMap);
											}
											if (currValue.set) {
												currValue.set = this.mapIdsToCreatedIds(currValue.set, objectsMap);
											}
											update[fieldName] = currValue;
										}
									}
								} else if (!isPlainObject(currValue)) {
									currValue = this.mapIdsToCreatedIds(currValue, objectsMap);
									// not an object and a scalar but lets check if it's an array
									update[fieldName] = isArray(currValue) ? { set: currValue } : currValue;
								} else {
									// it's an object so it is push/pull/set
									if (currValue.push) {
										currValue.push = this.mapIdsToCreatedIds(currValue.push, objectsMap);
									}
									if (currValue.pull) {
										currValue.pull = this.mapIdsToCreatedIds(currValue.pull, objectsMap);
									}
									if (currValue.set) {
										currValue.set = this.mapIdsToCreatedIds(currValue.set, objectsMap);
									}
									update[fieldName] = currValue;
								}
							} else {
								update[fieldName] = isListType(getNullableType(schemaField.type)) ? { set: currValue } : currValue;
							}
						}
					}
				});
				if (!isEmpty(update)) {
					update.id = objectsMap.get(object.id).id;
					update = this.graphQLFortune.generateUpdates(update);
					updatePromies.push(
						new Promise((resolve, reject) => {
							this.graphQLFortune.update(typeName, update, meta, { fortuneFormatted: true }).then(updatedObj => {
								alteredData.set(object.id, updatedObj);
								resolve(updatedObj);
							}).catch(reason => {
								reject(reason);
							});
						})
					);
				}
			}
		}));

		await Promise.all(updatePromies);
		return {
			data: [...alteredData.values()],
			unalteredData,
			missingData
		};
	}

	public getUserTypes = (): string[] => {
		const introspection = introspectionFromSchema(this.schema, { descriptions: false });
		const types = introspection.__schema.types;
		const typeNames: string[] = types.filter(
			type => type.kind === 'OBJECT' && this.schemaBuilder.isUserTypeByName(type.name)
		).map(type => type.name);
		return typeNames;
	}

	public getModelTypes = (): IntrospectionType[] => {
		return introspectionFromSchema(this.schema, { descriptions: false }).__schema.types.find(t => t.name === 'Node')['possibleTypes'];
	}

	public getRawData = async (types = [], context?): Promise<any[]> => {
		const meta = context ? { context } : undefined;
		let nodes = [];
		if (isEmpty(types)) {
			types = this.getUserTypes();
		}
		if (types) {
			const promises = [];
			types.forEach(typeName => {
				promises.push(
					new Promise((resolve, reject) => {
						this.graphQLFortune.find(typeName, undefined, undefined, meta).then(fortuneData => {
							// make sure we serialize the values
							const schemaType = <GraphQLObjectType>this.getSchema().getType(typeName);
							const fieldMap = schemaType.getFields();
							if (isEmpty(fortuneData)) {
								resolve(fortuneData);
								return;
							}
							fortuneData = fortuneData.map((record) => {
								const objectFields = Object.keys(record);
								objectFields.forEach(fieldName => {
									const schemaField = fieldMap[fieldName];
									if (schemaField) {
										const namedType = getNamedType(schemaField.type);
										let currVal = record[fieldName];
										if (isScalarType(namedType)) {
											const scalarType = <GraphQLScalarType>this.getSchema().getType(namedType.name);
											if (isArray(currVal)) {
												currVal = currVal.map((val) => {
													if (val && !isString(val) && !isNumber(val)) {
														val = scalarType.serialize(val);
													}
													return val;
												});
											} else if (currVal && !isString(currVal) && !isNumber(currVal)) {
												currVal = scalarType.serialize(currVal);
											}
											record[fieldName] = currVal;
										}
									}
								});
								return record;
							});
							resolve(fortuneData);
						}).catch(reason => { reject(reason); });
					})
				);
			});
			const allData = await Promise.all(promises);
			nodes = [].concat.apply([], allData); // flatten

		}
		return nodes;
	}

	public getFragmentTypes = (): IntrospectionQuery => {
		const introspection = introspectionFromSchema(this.schema, { descriptions: false });
		const types = introspection.__schema.types;

		// here we're filtering out any type information unrelated to unions or interfaces
		if (types) {
			const filteredData = types.filter(type => {
				return type['possibleTypes'] !== null;
			});
			set(introspection, '__schema.types', filteredData);

		}
		return introspection;
	}
	/**
	 * This method does not need to be called manually, it is automatically called upon the first request if it is not connected already.
	 * However, it may be useful if manually reconnect is needed.
	 * The resolved value is the instance itself.
	 * @returns Promise<GraphQLGenie>
	 */
	public connect = async (): Promise<GraphQLGenie> => {
		await this.graphQLFortune.getStore().connect();
		return this;
	}

	/**
	 * Close adapter connection, and reset connection state.
	 * The resolved value is the instance itself.
	 * @returns Promise<GraphQLGenie>
	 */
	public disconnect = async (): Promise<GraphQLGenie> => {
		await this.graphQLFortune.getStore().disconnect();
		return this;
	}
}

import { IntrospectionType } from 'graphql';
import fortune from 'fortune';

import { each, forOwn, get, isArray, isEmpty, isEqual, isString, keys, set } from 'lodash';
import { DataResolver, FortuneOptions } from './GraphQLGenieInterfaces';
import { computeRelations } from './TypeGeneratorUtils';

export default class FortuneBuilder implements DataResolver {
	private fortuneOptions: FortuneOptions;
	private fortuneTypeNames: Map<string, string>;
	private schemaInfo: IntrospectionType[];
	private store;
	constructor(fortuneOptions: FortuneOptions, schemaInfo: IntrospectionType[]) {
		this.fortuneOptions = fortuneOptions;
		this.schemaInfo = schemaInfo;

		this.store = this.buildFortune();
	}

	private deepReplaceIdWithObj = (replaceMap, masterObj) => {
		if (!masterObj) {
			return masterObj;
		}
		if (isString(masterObj) && replaceMap[masterObj]) {
			masterObj = replaceMap[masterObj];
		}
		if (masterObj && typeof masterObj === 'object') {
			for (const key in masterObj) {
				if (key !== 'id') {
					masterObj[key] = this.deepReplaceIdWithObj(replaceMap, masterObj[key]);
				}
			}
		}

		return masterObj;
	}

	private handleIncludes = (records: object, includes: object): object => {
		// handle includes, make them part of the returned data for default resolvers to handle
		if (records && includes) {
			records = JSON.parse(JSON.stringify(records));
			const includeIdMap = {};
			for (const includeType in includes) {
				const includeArr = includes[includeType];
				includeArr.forEach(include => {
					includeIdMap[include.id] = include;
				});

			}
			this.deepReplaceIdWithObj(includeIdMap, records);
		}
		return records;
	}

	public create = async (graphQLTypeName: string, records, include?, meta?) => {
		const fortuneType = this.getFortuneTypeName(graphQLTypeName);
		records['__typename'] = graphQLTypeName;
		let results = await this.store.create(fortuneType, records, include, meta);
		results = this.handleIncludes(results.payload.records, results.payload.include);

		return isArray(records) ? results : results[0];
	}

	public find = async (graphQLTypeName: string, ids?: [string], options?, include?, meta?) => {
		const fortuneType = this.getFortuneTypeName(graphQLTypeName);
		options = options ? options : {};
		set(options, 'match.__typename', graphQLTypeName);
		const results = await this.store.find(fortuneType, ids, options, include, meta);
		let graphReturn = results.payload.records;


		graphReturn = this.handleIncludes(graphReturn, results.payload.include);

		if (graphReturn) {
			// if one id sent in we just want to return the value not an array
			graphReturn = ids && ids.length === 1 ? graphReturn[0] : graphReturn;
		}
		if (!graphReturn) {
			throw new Error('Nothing Found');
		}
		return graphReturn;

	}

	private generateUpdates = (record, options: object = {}) => {
		const updates = {id: record['id'], replace: {}, push: {}, pull: {}};

		for (const argName in record) {
			const arg = record[argName];
			if (argName !== 'id') {
				if (isArray(arg)) {
					if (options['pull']) {
						updates.pull[argName] = arg;
					} else {
						updates.push[argName] = arg;
					}

				} else {
					updates.replace[argName] = arg;
				}
			}
		}
		return updates;
	}

	public update = async (graphQLTypeName: string, records, meta?, options?: object) => {

		const updates = isArray(records) ? records.map(value => this.generateUpdates(value, options)) : this.generateUpdates(records, options);
		const fortuneType = this.getFortuneTypeName(graphQLTypeName);
		const results = await this.store.update(fortuneType, updates, meta);
		return isArray(records) ? results.payload.records : results.payload.records[0];
	}

	public delete = async (graphQLTypeName: string, ids?: [string], meta?) => {
		const fortuneType = this.getFortuneTypeName(graphQLTypeName);
		await this.store.delete(fortuneType, ids, meta);
		return true;
	}

	public getLink = (graphQLTypeName: string, field: string): string => {
		const fortuneType = this.getFortuneTypeName(graphQLTypeName);
		return get(this.store, `recordTypes.${fortuneType}.${field}.link`);
	}

	public getStore = () => {
		if (!this.store) {
			this.store = this.buildFortune();
		}
		return this.store;
	}

	private computeFortuneTypeNames = (): Map<string, string> => {
		this.fortuneTypeNames = new Map<string, string>();
		each(keys(this.schemaInfo), (typeName) => {
			if (typeName !== 'Node' && !this.fortuneTypeNames.has(typeName)) {
				const type = this.schemaInfo[typeName];
				if (!isEmpty(type.possibleTypes)) {
					const possibleTypes = [type.name];
					each(type.possibleTypes, possibleType => {
						if (possibleTypes.indexOf(possibleType.name) < 0) {
							possibleTypes.push(possibleType.name);
						}
						possibleType = this.schemaInfo[possibleType.name];
						each(possibleType.interfaces, currInterface => {
							if (currInterface.name !== 'Node' && currInterface.name !== typeName) {
								if (possibleTypes.indexOf(currInterface.name) < 0) {
									possibleTypes.push(currInterface.name);
								}
							}
						});
						each(possibleType.unions, currUnion => {
							if (currUnion.name !== typeName) {
								if (possibleTypes.indexOf(currUnion.name) < 0) {
									possibleTypes.push(currUnion.name);
								}
							}
						});
					});
					possibleTypes.sort();
					const fortuneTypeName = possibleTypes.join('_');
					each(possibleTypes, currTypeName => {
						this.fortuneTypeNames.set(currTypeName, fortuneTypeName);
					});
				}
			}

		});

		return this.fortuneTypeNames;
	}

	public getFortuneTypeName = (name: string): string => {
		return this.fortuneTypeNames.has(name) ? this.fortuneTypeNames.get(name) : name;
	}

	private buildFortune = () => {
		this.computeFortuneTypeNames();
		const relations = computeRelations(this.schemaInfo, this.getFortuneTypeName);
		const fortuneConfig = {};
		forOwn(this.schemaInfo, (type: any, name: string) => {
			if (type.kind === 'OBJECT' && name !== 'Query' && name !== 'Mutation' && name !== 'Subscription') {
				const fields = {};
				forOwn(type.fields, (field) => {
					if (field.name !== 'id') {
						let currType = field.type;
						let isArray = false;
						while (currType.kind === 'NON_NULL' || currType.kind === 'LIST') {
							if (currType.kind === 'LIST') {
								isArray = true;
							}
							currType = currType.ofType;
						}
						currType = currType.kind === 'ENUM' ? 'String' : currType.name;
						if (currType === 'ID' || currType === 'String') {
							currType = String;
						} else if (currType === 'Int' || currType === 'Float') {
							currType = Number;
						} else if (currType === 'Boolean') {
							currType = Boolean;
						}
						let inverse: string;
						if (isString(currType)) {
							currType = this.getFortuneTypeName(currType);
							const relation = get(field, 'metadata.relation');
							if (!isEmpty(relation) && relation.name) {
								inverse = relations.getInverse(name, currType, field.name);
							}
						}
						currType = isArray ? Array(currType) : currType;
						if (inverse) {
							currType = [currType, inverse];
						}

						fields[field.name] = currType;
					}
					fields['__typename'] = String;
				});
				const fortuneName = this.getFortuneTypeName(name);
				const fortuneConfigForName = fortuneConfig[fortuneName] ? fortuneConfig[fortuneName] : {};
				each(keys(fields), (fieldName) => {
					const currType = fortuneConfigForName[fieldName];
					const newType = fields[fieldName];
					if (!currType) {
						fortuneConfigForName[fieldName] = newType;
					} else {
						let badSchema = typeof newType !== typeof currType;
						badSchema = badSchema ? badSchema : !isEqual(fortuneConfigForName[fieldName], fields[fieldName]);

						if (badSchema) {
							console.error('Bad schema. Types that share unions/interfaces have fields of the same name but different types. This is not allowed\n',
								'fortune type', fortuneName, '\n',
								'field name', fieldName, '\n',
								'currType', fortuneConfigForName[fieldName], '\n',
								'newType', fields[fieldName]);
						}

					}
				});
				fortuneConfig[fortuneName] = fortuneConfigForName;
			}

		});
		const store = fortune(fortuneConfig, this.fortuneOptions);
		window['store'] = store;
		return store;
	}



}


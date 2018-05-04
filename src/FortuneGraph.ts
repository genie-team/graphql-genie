import { IntrospectionType } from 'graphql';
import fortune from 'fortune';

import { each, forOwn, get, isArray, isEmpty, isEqual, isString, keys, set } from 'lodash';
import { DataResolver, FortuneOptions } from './GraphQLGenieInterfaces';
import { computeRelations } from './TypeGeneratorUtils';

export default class FortuneGraph implements DataResolver {
	private fortuneOptions: FortuneOptions;
	private fortuneTypeNames: Map<string, string>;
	private uniqueIndexes: Map<string, string[]>;
	private schemaInfo: IntrospectionType[];
	private store;
	constructor(fortuneOptions: FortuneOptions, schemaInfo: IntrospectionType[]) {
		this.fortuneOptions = fortuneOptions;
		this.schemaInfo = schemaInfo;
		this.uniqueIndexes = new Map<string, string[]>();
		this.store = this.buildFortune();
	}

	public getValueByUnique = async (returnTypeName: string, args): Promise<Object> => {
		let currValue;
		// tslint:disable-next-line:prefer-conditional-expression
		if (args.id) {
			currValue = await this.find(returnTypeName, [args.id]);
		} else {
			currValue = await this.find(returnTypeName, undefined, { match: args });
		}
	
		return isArray(currValue) ? currValue[0] : currValue;
	};

	private ensureNoDuplicates = async (fortuneTypeName: string, records: Object): Promise<boolean> => {
		let canAdd = true;
		if (records && this.uniqueIndexes.has(fortuneTypeName)) {			
			await Promise.all(this.uniqueIndexes.get(fortuneTypeName).map(async (fieldName) => {
				if (canAdd && records.hasOwnProperty(fieldName)) {					
					const record = await this.getValueByUnique(fortuneTypeName, {[fieldName]: records[fieldName]});
					if (record) {
						canAdd = false;
					}
				}
			}));
		}
		return canAdd;
	}

	public create = async (graphQLTypeName: string, records, include?, meta?) => {
		const fortuneType = this.getFortuneTypeName(graphQLTypeName);
		const canAdd = await this.ensureNoDuplicates(fortuneType, records);
		if (canAdd) {
			records['__typename'] = graphQLTypeName;
			let results = await this.store.create(fortuneType, records, include, meta);
			results = results.payload.records;
			return isArray(records) ? results : results[0];
		} else {
			throw new Error('can not create record with duplicate on unique field on type ' + graphQLTypeName + ' ' + JSON.stringify(records));
		}
		
	}

	public find = async (graphQLTypeName: string, ids?: string[], options?, include?, meta?) => {
		const fortuneType = this.getFortuneTypeName(graphQLTypeName);
		options = options ? options : {};
		if (!ids || ids.length < 1) {
			set(options, 'match.__typename', graphQLTypeName);
		}
		const results = await this.store.find(fortuneType, ids, options, include, meta);

		let graphReturn = results.payload.records;


		if (graphReturn) {
			// if one id sent in we just want to return the value not an array
			graphReturn = ids && ids.length === 1 ? graphReturn[0] : graphReturn;
		}
		if (!graphReturn) {
			console.log('Nothing Found ' + graphQLTypeName + ' ' + JSON.stringify(ids));
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
		const canAdd = await this.ensureNoDuplicates(fortuneType, updates['replace']);

		if (canAdd) {
			let results = await this.store.update(fortuneType, updates, meta);
			results = results.payload.records;
			return isArray(records) ? results : results[0];
		} else {
			throw new Error('can not create record with duplicate on unique field on type ' + graphQLTypeName + ' ' + JSON.stringify(records));
		}
	}

	public delete = async (graphQLTypeName: string, ids?: string[], meta?) => {
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
						if (get(field, 'metadata.unique') === true) {
							if (isArray) {
								console.error('Unique may not work on list types', name, field.name);
							}
							if (!this.uniqueIndexes.has(name)) {
								this.uniqueIndexes.set(name, []);
							}
							this.uniqueIndexes.get(name).push(field.name);
						}
						currType = currType.kind === 'ENUM' ? 'String' : currType.name;
						if (currType === 'ID' || currType === 'String') {
							currType = String;
						} else if (currType === 'Int' || currType === 'Float') {
							currType = Number;
						} else if (currType === 'Boolean') {
							currType = Boolean;
						} else if (currType === 'JSON') {
							currType = Object;
						} else if (currType === 'Date' || currType === 'Time' || currType === 'DateTime') {
							currType = Date;
						}
						let inverse: string;
						if (isString(currType)) {
							currType = this.getFortuneTypeName(currType);
							inverse = relations.getInverseWithoutName(currType, field.name);
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


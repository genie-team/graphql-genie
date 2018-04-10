import { IntrospectionType } from 'graphql';
import fortune from 'fortune';

import _ from 'lodash';

export default class FortuneBuilder {
	private fortuneTypeNames: Map<string, string>;
	private schemaInfo: IntrospectionType[];
	private store;
	public bambuffer: Buffer;
	constructor(schemaInfo: IntrospectionType[]) {
		this.schemaInfo = schemaInfo;
		this.store = this.buildFortune();
	}

	private deepReplaceIdWithObj = (replaceMap, masterObj) => {
		if (!masterObj) {
			return masterObj;
		}
		if (_.isString(masterObj) && replaceMap[masterObj]) {
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

	public create = async (graphQLTypeName: string, records, include?, meta?) => {
		const fortuneType = this.getFortuneTypeName(graphQLTypeName);
		records['__graphtype'] = graphQLTypeName;
		const results = await this.store.create(fortuneType, records, include, meta);
		return _.isArray(records) ? results.payload.records : results.payload.records[0];
	}

	public find = async (graphQLTypeName: string, ids?: [string], options?, include?, meta?) => {
		const fortuneType = this.getFortuneTypeName(graphQLTypeName);
		options = options ? options : {};
		_.set(options, 'match.__graphtype', graphQLTypeName);
		const results = await this.store.find(fortuneType, ids, options, include, meta);
		let graphReturn;

		// handle includes, make them part of the returned data for default resolvers to handle
		if (results.payload.records && results.payload.include) {
			const includeIdMap = {};
			for (const includeType in results.payload.include) {
				const includeArr = results.payload.include[includeType];
				for (const include of includeArr) {
					includeIdMap[include.id] = include;
				}
			}
			this.deepReplaceIdWithObj(includeIdMap, results.payload.records);
		}

		if (results.payload.records) {
			// if one id sent in we just want to return the value not an array
			graphReturn = ids && ids.length === 1 ? results.payload.records[0] : results.payload.records;
		}
		if (!graphReturn) {
			throw new Error('Nothing Found');
		}
		return graphReturn;

	}

	public update = async (graphQLTypeName: string, updates, include?, meta?) => {
		const fortuneType = this.getFortuneTypeName(graphQLTypeName);
		const results = await this.store.update(fortuneType, updates, include, meta);
		return results.payload.records;

	}

	public delete = async (graphQLTypeName: string, ids?: [string], include?, meta?) => {
		const fortuneType = this.getFortuneTypeName(graphQLTypeName);
		const results = await this.store.delete(fortuneType, ids, include, meta);
		return results.payload.records;
	}

	public getLink = (graphQLTypeName: string, field: string): string => {
		const fortuneType = this.getFortuneTypeName(graphQLTypeName);
		return _.get(this.store, `recordTypes.${fortuneType}.${field}.link`);
	}

	public getStore = () => {
		if (!this.store) {
			this.store = this.buildFortune();
		}
		return this.store;
	}

	private computeFortuneTypeNames = (): Map<string, string> => {
		this.fortuneTypeNames = new Map<string, string>();
		_.each(_.keys(this.schemaInfo), (typeName) => {
			if (typeName !== 'Node' && !this.fortuneTypeNames.has(typeName)) {
				const type = this.schemaInfo[typeName];
				if (!_.isEmpty(type.possibleTypes)) {
					const possibleTypes = [type.name];
					_.each(type.possibleTypes, possibleType => {
						if (possibleTypes.indexOf(possibleType.name) < 0) {
							possibleTypes.push(possibleType.name);
						}
						possibleType = this.schemaInfo[possibleType.name];
						_.each(possibleType.interfaces, currInterface => {
							if (currInterface.name !== 'Node' && currInterface.name !== typeName) {
								if (possibleTypes.indexOf(currInterface.name) < 0) {
									possibleTypes.push(currInterface.name);
								}
							}
						});
						_.each(possibleType.unions, currUnion => {
							if (currUnion.name !== typeName) {
								if (possibleTypes.indexOf(currUnion.name) < 0) {
									possibleTypes.push(currUnion.name);
								}
							}
						});
					});
					possibleTypes.sort();
					const fortuneTypeName = possibleTypes.join('_');
					_.each(possibleTypes, currTypeName => {
						this.fortuneTypeNames.set(currTypeName, fortuneTypeName);
					});
				}
			}

		});

		return this.fortuneTypeNames;
	}

	private getFortuneTypeName = (name: string): string => {
		return this.fortuneTypeNames.has(name) ? this.fortuneTypeNames.get(name) : name;
	}

	private computeRelations = (): Map<string, Map<string, string>> => {
		const relations = new Map<string, Map<string, string>>();
		_.each(_.keys(this.schemaInfo), (typeName) => {
			const type = this.schemaInfo[typeName];
			_.each(type.fields, field => {
				const relation = _.get(field, 'metadata.relation');
				if (relation) {
					let relationMap = relations.get(relation.name);
					relationMap = relationMap ? relationMap : new Map<string, string>();
					const fortuneName = this.getFortuneTypeName(typeName);
					if (relationMap.has(fortuneName) && relationMap.get(fortuneName) !== field.name) {
						console.error('Bad schema, relation could apply to multiple fields\n',
							'relation name', relation.name, '\n',
							'fortune name', fortuneName, '\n',
							'curr field', relationMap.get(fortuneName), '\n',
							'other field', field.name);

					}
					relationMap.set(fortuneName, field.name);
					relations.set(relation.name, relationMap);
				}
			});
		});
		console.log(relations);
		return relations;
	}

	private buildFortune = () => {
		this.computeFortuneTypeNames();
		const relations = this.computeRelations();
		const fortuneConfig = {};
		_.forOwn(this.schemaInfo, (type: any, name: string) => {
			if (type.kind === 'OBJECT' && name !== 'Query' && name !== 'Mutation' && name !== 'Subscription') {
				const fields = {};
				_.forOwn(type.fields, (field) => {
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
						if (_.isString(currType)) {
							currType = this.getFortuneTypeName(currType);
							const relation = _.get(field, 'metadata.relation');
							if (!_.isEmpty(relation) && relation.name) {
								if (relations.has(relation.name)) {
									if (relations.get(relation.name).has(currType)) {
										inverse = relations.get(relation.name).get(currType);
									}
								}
							}
						}
						currType = isArray ? Array(currType) : currType;
						if (inverse) {
							currType = [currType, inverse];
						}

						fields[field.name] = currType;
					}
					fields['__graphtype'] = String;
				});
				const fortuneName = this.getFortuneTypeName(name);
				const fortuneConfigForName = fortuneConfig[fortuneName] ? fortuneConfig[fortuneName] : {};
				_.each(_.keys(fields), (fieldName) => {
					const currType = fortuneConfigForName[fieldName];
					const newType = fields[fieldName];
					if (!currType) {
						fortuneConfigForName[fieldName] = newType;
					} else {
						let badSchema = typeof newType !== typeof currType;
						badSchema = badSchema ? badSchema : !_.isEqual(fortuneConfigForName[fieldName], fields[fieldName]);

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
		console.info(fortuneConfig);
		const store = fortune(fortuneConfig, { settings: { enforceLinks: true } });
		console.info(store);
		window['store'] = store;
		return store;
	}



}


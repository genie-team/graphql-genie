import { GraphQLError, GraphQLInputType, GraphQLNamedType, GraphQLObjectType, GraphQLOutputType, GraphQLResolveInfo, GraphQLScalarType, GraphQLSchema, GraphQLType, IntrospectionObjectType, IntrospectionType, defaultFieldResolver, isInterfaceType, isListType, isNonNullType, isObjectType, isScalarType } from 'graphql';
import { difference, each, eq, get, isArray, isEmpty, isObject, keys, map, mapValues, pick, set, union } from 'lodash';
import pluralize from 'pluralize';
import { Connection, DataResolver } from './GraphQLGenieInterfaces';
export class Relation {
	public type0: string;
	public field0: string;
	public field0isList: boolean;
	public type1: string;
	public field1: string;
	public field1isList: boolean;

	constructor($type: string, $field: string, $field0isList: boolean) {
		this.type0 = $type;
		this.field0 = $field;
		this.field0isList = $field0isList;
	}

	setRelative(relation: Relation) {
		this.type1 = relation.type0;
		this.field1 = relation.field0;
		this.field1isList = relation.field0isList;
	}

	isValidRelative(relation: Relation) {
		if (!this.type1) {
			return true;
		} else {
			return this.isSameRelative(relation);
		}
	}

	isSameRelative(relation: Relation): boolean {
		return this.type0 === relation.type0 && this.field0 === relation.field0 && this.field0isList === relation.field0isList;
	}

	getInverse(type: string, field: string): string {
		const inverse = this.getInverseTuple(type, field);
		return inverse ? inverse[1] : null;
	}

	getInverseTuple(type: string, field: string): [string, string] {
		let inverse = null;
		if (this.type0 === type && this.field0 === field) {
			inverse = [this.type1, this.field1];
		} else if (this.type1 === type && this.field1 === field) {
			inverse = [this.type0, this.field0];
		}
		return inverse;
	}
}

export class Relations {

	public relations: Map<string, Relation>;
	constructor() {
		this.relations = new Map<string, Relation>();
	}

	public getRelation(name: string): Relation {
		let relations = null;
		if (this.relations.has(name)) {
			relations = this.relations.get(name);
		}
		return relations;
	}

	public getInverseWithoutName(type: string, field: string): string {
		let inverse: string = null;
		const iter = this.relations.values();
		let relation = iter.next().value;
		while (!inverse && relation) {
			inverse = relation.getInverse(type, field);
			relation = iter.next().value;
		}
		return inverse;
	}

	public getInverse(name: string, type: string, field: string): string {
		let inverse = null;
		if (this.relations.has(name)) {
			const relation = this.relations.get(name);
			inverse = relation.getInverse(type, field);
		}
		return inverse;
	}

	public setRelation(name: string, type: string, field: string, fieldIsList: boolean) {
		const newRelation = new Relation(type, field, fieldIsList);
		if (!this.relations.has(name)) {
			this.relations.set(name, newRelation);
		} else {
			const relation = this.relations.get(name);
			if (relation.isValidRelative(newRelation)) {
				if (!relation.isSameRelative(newRelation)) {
					relation.setRelative(newRelation);
				}
			} else {
				this.throwError(name, type, field, relation.field0);
			}
		}
	}

	public setSelfRelation(name: string, type: string, field: string, fieldIsList: boolean) {
		const newRelation = new Relation(type, field, fieldIsList);
		newRelation.setRelative(newRelation);
		this.relations.set(name, newRelation);
	}

	private throwError(name: string, type: string, primaryField: string, relatedField: string) {
		console.error('Bad schema, relation could apply to multiple fields\n',
			'relation name', name, '\n',
			'fortune name', type, '\n',
			'curr field', primaryField, '\n',
			'other field', relatedField);
	}

}

const computeNumFieldsOfType = (type: IntrospectionObjectType, checkFieldTypeName: string): number => {
	let resultNum = 0;
	each(type.fields, field => {
		if (checkFieldTypeName === getReturnType(field.type)) {
			resultNum++;
		}
	});
	return resultNum;
};

const getNumFieldsOfType = (cache: Map<string, Map<string, number>>, type: IntrospectionObjectType, checkFieldTypeName: string): number => {
	let numFields = 0;
	const typeName = getReturnType(type);

	if (cache.has(typeName) && cache.get(typeName).has(checkFieldTypeName)) {
		numFields = cache.get(typeName).get(checkFieldTypeName);
	} else {
		numFields = computeNumFieldsOfType(type, checkFieldTypeName);
		if (!cache.has(typeName)) {
			cache.set(typeName, new Map<string, number>());
		}
		cache.get(typeName).set(checkFieldTypeName, numFields);
	}
	return numFields;
};

export const computeRelations = (schemaInfo: IntrospectionType[], typeNameResolver: (name: string) => string = (name: string) => name): Relations => {
	const numFieldsOfTypeCache = new Map<string, Map<string, number>>();
	const relations = new Relations();
	each(keys(schemaInfo), (typeName) => {
		const type = <IntrospectionObjectType>schemaInfo[typeName];
		each(type.fields, field => {
			const relation = get(field, 'metadata.relation');
			const fieldTypeName = getReturnType(field.type);
			const reslovedTypeName = typeNameResolver(fieldTypeName);
			if (typeName === fieldTypeName) {
				relations.setSelfRelation(`${field.name}On${typeName}`, reslovedTypeName, field.name, typeIsList(field.type));
			} else if (relation) {
				relations.setRelation(relation.name, reslovedTypeName, field.name, typeIsList(field.type));
			} else {
				const fieldTypeInfo = schemaInfo[fieldTypeName];
				if (type && fieldTypeInfo) {
					const numFields = getNumFieldsOfType(numFieldsOfTypeCache, type, fieldTypeName);
					const reverseNumFields = getNumFieldsOfType(numFieldsOfTypeCache, fieldTypeInfo, typeName);
					if (numFields === 1 && reverseNumFields === 1) {
						const possibleTypes = [typeName, fieldTypeName];
						possibleTypes.sort();
						relations.setRelation(possibleTypes.join('_'), reslovedTypeName, field.name, typeIsList(field.type));
					}
				}
			}

		});
	});
	return relations;
};

export const generateFieldsForInput = (fieldName: string, inputTypes: GraphQLInputType[], defaultValue?: string): object => {
	const fields = {};
	fields[fieldName] = {
		type: inputTypes[0],
		defaultValue: defaultValue
	};
	if (inputTypes[1] && !isScalarType(getReturnGraphQLType(inputTypes[0]))) {
		const idName = isListType(inputTypes[1]) ? fieldName + 'Ids' : fieldName + 'Id';
		fields[idName] = {
			type: inputTypes[1]
		};
	}
	return fields;
};

export const stripNonNull = (type: GraphQLOutputType): GraphQLOutputType => {
	if (isNonNullType(type)) {
		return type.ofType;
	} else {
		return type;
	}
};

export const typeIsList = (type) => {
	let isList = false;
	if (type.name && type.name.endsWith('Connection')) {
		isList = true;
	}
	while (!isList && (isListType(type) || isNonNullType(type) || type.kind === 'NON_NULL' || type.kind === 'LIST')) {
		if (isListType(type) || type.kind === 'LIST') {
			isList = true;
			break;
		}
		type = type.ofType;
	}
	return isList;
};

export const getReturnType = (type): string => {
	if (isListType(type) || isNonNullType(type) || type.kind === 'NON_NULL' || type.kind === 'LIST') {
		return getReturnType(type.ofType);
	} else {
		return type.name;
	}
};

export const getReturnGraphQLType = (type: GraphQLType): GraphQLNamedType => {
	if (isListType(type) || isNonNullType(type)) {
		return getReturnGraphQLType(type.ofType);
	} else {
		return type;
	}
};

export enum Mutation {
	Create,
	Update,
	Delete,
	Upsert
}

const clean = (obj): any => {
	const returnObj = {};
	for (const propName in obj) {
		if (obj[propName] !== null && obj[propName] !== undefined) {
			// tslint:disable-next-line:prefer-conditional-expression
			if (isObject(obj[propName]) && !isEmpty(obj[propName])) {
				returnObj[propName] = obj[propName];
			} else {
				returnObj[propName] = obj[propName];
			}
		}
	}
	return returnObj;
};

const setupArgs = (results: any[], args: any[]) => {
	// setup the arguments to use the new types
	results.forEach((types: any[]) => {
		types = types ? types : [];
		types.forEach(type => {
			if (type && type.key && type.id && type.index > -1) {
				const key = type.key;
				const id = type.id;
				const arg = args[type.index];
				if (isArray(arg[key])) {
					if (isArray(id)) {
						arg[key] = union(id, arg[key]);
					} else if (!arg[key].includes(id)) {
						arg[key].push(id);
					}
				} else {
					arg[key] = id;
				}
			}
		});
	});
	return args;
};

const resolveArgs = async (args: Array<any>, returnType: GraphQLOutputType, mutation: Mutation, dataResolver: DataResolver, currRecord: any, _args: { [key: string]: any }, _context: any, _info: GraphQLResolveInfo): Promise<Array<any>> => {
	const promises: Array<Promise<any>> = [];

	args.forEach((currArg, index) => {
		for (const argName in currArg) {
			let argReturnType: GraphQLOutputType;
			if ((isObjectType(returnType) || isInterfaceType(returnType)) && returnType.getFields()[argName]) {
				argReturnType = returnType.getFields()[argName].type;
			}
			let argReturnRootType = <GraphQLOutputType>getReturnGraphQLType(argReturnType);
			if (!isScalarType(argReturnRootType)) {
				const arg = currArg[argName];
				if (isObject(arg) && argReturnType) {
					currArg[argName] = typeIsList(argReturnType) ? [] : undefined;

					if (isInterfaceType(argReturnRootType)) {
						for (const argKey in arg) {
							const argTypeName = capFirst(pluralize.singular(argKey));
							argReturnRootType = <GraphQLOutputType>_info.schema.getType(argTypeName);
							promises.push(mutateResolver(mutation, dataResolver)(currRecord, arg[argKey], _context, _info, index, argName, argReturnRootType));
						}
					} else {
						promises.push(mutateResolver(mutation, dataResolver)(currRecord, arg, _context, _info, index, argName, argReturnRootType));
					}

				}
			}
		}
	});

	const results = await Promise.all(promises);
	args = setupArgs(results, args);

	return args;

};

const mutateResolver = (mutation: Mutation, dataResolver: DataResolver) => {
	return async (currRecord: any, _args: { [key: string]: any }, _context: any, _info: GraphQLResolveInfo, index?: number, key?: string, returnType?: GraphQLOutputType) => {
		// iterate over all the non-id arguments and recursively create new types
		const recursed = returnType ? true : false;
		if (!returnType) {
			returnType = (<GraphQLObjectType>_info.returnType).getFields().data.type;
			returnType = <GraphQLOutputType>getReturnGraphQLType(returnType);
		}
		const returnTypeName = getReturnType(returnType);
		const clientMutationId = _args.input && _args.input.clientMutationId ? _args.input.clientMutationId : '';

		let createArgs = _args.create ? _args.create : mutation === Mutation.Create && get(_args, 'input.data') ? get(_args, 'input.data') : [];
		createArgs = createArgs && !isArray(createArgs) ? [createArgs] : createArgs;

		let updateArgs = _args.update ? _args.update : mutation === Mutation.Update && get(_args, 'input.data') ? get(_args, 'input.data') : [];
		updateArgs = updateArgs && !isArray(updateArgs) ? [updateArgs] : updateArgs;

		let upsertArgs = _args.upsert ? _args.upsert : mutation === Mutation.Upsert && get(_args, 'input') ? get(_args, 'input') : [];
		upsertArgs = upsertArgs && !isArray(upsertArgs) ? [upsertArgs] : upsertArgs;

		let deleteArgs = _args.delete ? _args.delete : mutation === Mutation.Delete && _args.input.where ? _args.input.where : [];
		deleteArgs = deleteArgs && !isArray(deleteArgs) ? [deleteArgs] : deleteArgs;

		let connectArgs = _args.connect ? _args.connect : [];
		connectArgs = connectArgs && !isArray(connectArgs) ? [connectArgs] : connectArgs;

		let disconnectArgs = _args.disconnect ? _args.disconnect : [];
		disconnectArgs = disconnectArgs && !isArray(disconnectArgs) ? [disconnectArgs] : disconnectArgs;

		const whereArgs = _args.where ? _args.where : _args.input && _args.input.where ? _args.input.where : null;

		// lets make sure we are able to add this (prevent duplicates on unique fields, etc)

		const canAddResults = await Promise.all([dataResolver.canAdd(returnTypeName, createArgs),
		dataResolver.canAdd(returnTypeName, updateArgs)]);
		const cannotAdd = canAddResults.includes(false);
		if (cannotAdd) {
			throw new Error('can not create record with duplicate on unique field on type ' + returnTypeName + ' ' + JSON.stringify(createArgs) + ' ' + JSON.stringify(updateArgs));
		}

		const dataResolverPromises: Array<Promise<any>> = [];

		if (!isEmpty(updateArgs)) {
			if (whereArgs) {
				// we have a where so use that to get the record to update
				// pass true to where args if currRecord is already the one we want
				if (whereArgs !== true) {
					const returnTypeName = getReturnType(returnType);
					currRecord = await dataResolver.getValueByUnique(returnTypeName, whereArgs);
					if (!currRecord || isEmpty(currRecord)) {
						throw new Error(`${returnTypeName} does not exist with where args ${JSON.stringify(whereArgs)}`);
					}
				}

			} else if (updateArgs[0].data && updateArgs[0].where) {
				// this is a nested update an a list type so we need to individually do updates
				updateArgs.forEach((currArg) => {
					dataResolverPromises.push(
						new Promise((resolve) => {
							mutateResolver(mutation, dataResolver)(currRecord, { update: currArg.data, where: currArg.where }, _context, _info, index, key, returnType).then((result) => {
								if (recursed) {
									resolve();
								} else {
									resolve(result[0]);
								}
							});
						})
					);
				});
				updateArgs = [];
			} else if (key && currRecord) {
				// this is a nested input on a single field so we already know the where
				const recordToUpdate = await dataResolver.getValueByUnique(returnTypeName, { id: currRecord[key] });
				if (recordToUpdate) {
					currRecord = recordToUpdate;
				} else {
					// trying to update an empty field
					updateArgs = [];
				}
			}
		}

		if (!isEmpty(upsertArgs)) {
			await Promise.all(upsertArgs.map(async (currArg) => {
				const whereArg = currArg.where;
				let upsertRecord = currRecord;
				if (whereArg) {
					// this is a root upsert or nested upsert with a where field
					upsertRecord = await dataResolver.getValueByUnique(returnTypeName, whereArg);
				} else if (upsertRecord && key) {
					// this is a nested upsert on a single field so we already have the where
					upsertRecord = upsertRecord[key] ? await dataResolver.getValueByUnique(returnTypeName, { id: upsertRecord[key] }) : null;
				}

				let newArgs: object = { create: currArg.create };
				if (upsertRecord && !isEmpty(upsertRecord)) {
					// pass true to where args if currRecord will already be the one we want
					newArgs = { where: true, update: currArg.update };
				}
				dataResolverPromises.push(
					new Promise((resolve) => {
						mutateResolver(mutation, dataResolver)(upsertRecord, newArgs, _context, _info, index, key, returnType).then((result) => {
							if (result[0]) {
								resolve(result[0]);
							} else {
								resolve();
							}
						});
					})
				);
			}));
		}

		[createArgs, updateArgs] = await Promise.all([
			resolveArgs(createArgs, returnType, Mutation.Create, dataResolver, currRecord, _args, _context, _info),
			resolveArgs(updateArgs, returnType, Mutation.Update, dataResolver, currRecord, _args, _context, _info)
		]);

		// could be creating more than 1 type
		createArgs.forEach((createArg) => {
			createArg = createArg.hasOwnProperty ? createArg : Object.assign({}, createArg);
			createArg = clean(createArg);
			if (createArg && !isEmpty(createArg)) {
				dataResolverPromises.push(new Promise((resolve) => {
					dataResolver.create(returnTypeName, createArg).then(data => {
						const id = isArray(data) ? map(data, 'id') : data.id;
						resolve({ index, key, id, data });
					});
				}));
			}
		});

		// now updates
		updateArgs.forEach((updateArg) => {
			updateArg = updateArg.hasOwnProperty ? updateArg : Object.assign({}, updateArg);
			// only do updates on new values
			for (const updateArgKey in updateArg) {
				const currArg = updateArg[updateArgKey];
				const currRecordArg = currRecord[updateArgKey];
				if (eq(currRecordArg, currArg)) {
					delete currRecord[updateArgKey];
				} else if (isArray(currArg) && isArray(currRecordArg)) {
					updateArg[updateArgKey] = difference(currArg, currRecordArg);
				}
			}
			const cleanArg = clean(updateArg);
			if (cleanArg && !isEmpty(cleanArg)) {
				dataResolverPromises.push(new Promise((resolve) => {
					cleanArg.id = currRecord.id;
					dataResolver.update(returnTypeName, cleanArg).then(data => {
						const id = isArray(data) ? map(data, 'id') : data.id;
						resolve({ index, key, id, data });
					});
				}));
			} else if (currRecord) {
				currRecord = Object.assign(currRecord, updateArg);
			}
		});

		// now add the connect types
		connectArgs.forEach(connectArg => {
			dataResolverPromises.push(new Promise((resolve, reject) => {
				dataResolver.getValueByUnique(returnTypeName, connectArg).then(data => {
					if (data && data['id']) {
						resolve({ index, key, id: data['id'], data });
					} else {
						reject(new Error('tried to connect using unique value that does not exist ' + JSON.stringify(connectArg)));
					}
				});
			}));
		});

		// disconnect
		const disconnectPromises: Array<Promise<any>> = [];
		disconnectArgs.forEach(disconnectArg => {
			if (disconnectArg === true) {
				dataResolverPromises.push(new Promise((resolve) => {
					dataResolver.update(currRecord.__typename, { id: currRecord.id, [key]: null }).then(data => {
						resolve({ index, key, id: null, data });
					});
				}));
			} else {
				disconnectPromises.push(new Promise((resolve, reject) => {
					dataResolver.getValueByUnique(returnTypeName, disconnectArg).then(data => {
						if (data && data['id']) {
							resolve(data['id']);
						} else {
							reject();
						}
					});
				}));
			}
		});

		const disconnectIds = await Promise.all(disconnectPromises);
		if (!isEmpty(disconnectIds)) {
			dataResolverPromises.push(new Promise((resolve) => {
				dataResolver.update(currRecord.__typename, { id: currRecord.id, [key]: disconnectIds }, null, { pull: true }).then(data => {
					resolve({ index, key, id: data[key], data });
				});
			}));
		}

		// delete

		const deletePromises: Array<Promise<any>> = [];
		deleteArgs.forEach(deleteArg => {
			if (deleteArg === true) {
				dataResolverPromises.push(new Promise((resolve) => {
					dataResolver.delete(dataResolver.getLink(currRecord.__typename, key), [currRecord[key]]).then(data => {
						resolve({ index, key, id: null, data });
					});
				}));
			} else if (whereArgs && !currRecord) {
				dataResolverPromises.push(new Promise((resolve) => {
					dataResolver.getValueByUnique(returnTypeName, whereArgs).then(whereData => {
						currRecord = whereData;
						if (!currRecord || isEmpty(currRecord)) {
							throw new GraphQLError(`${returnTypeName} does not exist with where args ${JSON.stringify(whereArgs)}`);
						}
						dataResolver.delete(currRecord.__typename, [currRecord.id]).then(() => {
							resolve({ index, key, id: null, currRecord });
						});
					});
				}));
			} else {
				deletePromises.push(new Promise((resolve, reject) => {
					dataResolver.getValueByUnique(dataResolver.getLink(currRecord.__typename, key), deleteArg).then(data => {
						if (data && data['id']) {
							resolve(data['id']);
						} else {
							reject();
						}
					});
				}));
			}
		});

		const deleteIds = await Promise.all(deletePromises);
		if (!isEmpty(deleteIds)) {
			dataResolverPromises.push(new Promise((resolve) => {
				dataResolver.delete(dataResolver.getLink(currRecord.__typename, key), deleteIds).then(data => {
					resolve({ index, key, id: data[key], data });
				});
			}));
		}

		const dataResult = await Promise.all(dataResolverPromises);

		// if everything was an id no need to create anything new

		// if key this is recursed else it's the final value
		if (recursed) {
			return dataResult;
		} else {
			let data = get(dataResult, '[0].data');
			if (!data && mutation === Mutation.Delete) {
				data = currRecord;
			} else if (!data) {
				// if everything was already done on the object (updates, deletions and disconnects) it should be the currRecord but with changes
				data = currRecord;
			}

			return {
				data,
				clientMutationId
			};
		}
	};
};

export const createResolver = (dataResolver: DataResolver) => {
	return mutateResolver(Mutation.Create, dataResolver);
};

export const updateResolver = (dataResolver: DataResolver) => {
	return mutateResolver(Mutation.Update, dataResolver);
};

export const upsertResolver = (dataResolver: DataResolver) => {
	return mutateResolver(Mutation.Upsert, dataResolver);
};

export const deleteResolver = (dataResolver: DataResolver) => {
	return mutateResolver(Mutation.Delete, dataResolver);
};

export const getTypeResolver = (dataResolver: DataResolver, schema: GraphQLSchema, field: any, returnConnection = false) => {
	const schemaType = schema.getType(getReturnType(field.type));

	let resolver;
	if (!isScalarType(schemaType)) {
		resolver = async (
			root: any,
			_args: { [key: string]: any },
			_context: any,
			_info: GraphQLResolveInfo
		): Promise<any> => {
			const fortuneReturn = root && root.fortuneReturn ? root.fortuneReturn : root;

			if (!fortuneReturn) { return fortuneReturn; }

			const cache = root && root.cache ? root.cache : new Map<string, object>();
			const typeName = getReturnType(field.type);
			let result: any = [];
			let returnArray = false;
			let fieldValue = fortuneReturn[field.name];
			returnArray = isArray(fieldValue);
			fieldValue = returnArray ? fieldValue : [fieldValue];

			// actual value is filled from cache not just ids
			if (isObject(fieldValue[0])) {
				result = fieldValue;
			}
			const ids = [];

			let options = {};
			_args = moveArgsIntoFilter(_args);

			let filter = null;
			if (_args && _args.filter) {
				filter = _args.filter;
				options = parseFilter(_args.filter, schemaType);
			}
			set(options, 'orderBy', _args.orderBy);
			set(options, 'offset', _args.skip);
			let connection: Connection;
			options = clean(options);
			// I guess use the args here instead of args as a result of cache
			if (!isEmpty(options)) {
				result = [];
			}
			if (isEmpty(result)) {
				fieldValue.forEach(id => {
					if (id) {
						if (cache.has(id)) {
							result.push(cache.get(id));
						} else {
							ids.push(id);
						}
					}
				});
			}
			let findOptions = {};
			let applyOptionsWithCombinedResult = false;
			if (!isEmpty(result) && !isEmpty(options)) {
				applyOptionsWithCombinedResult = true;
			} else {
				findOptions = options;
			}
			if (!isEmpty(ids)) {
				let findResult = await dataResolver.find(typeName, ids, findOptions);
				if (findResult) {
					findResult = isArray(findResult) ? findResult : [findResult];

					findResult.forEach(result => {
						cache.set(result.id, result);
					});

					result = result.concat(findResult);
				}
			}

			if (applyOptionsWithCombinedResult) {
				result = dataResolver.applyOptions(typeName, result, options);
			}

			if ((_args.orderBy || filter) && (isObjectType(schemaType) || isInterfaceType(schemaType))) {
				const pullIds = await filterNested(filter, _args.orderBy, schemaType, fortuneReturn, cache, dataResolver);
				result = result.filter(entry => !pullIds.has(entry.id));
			}

			// use cached data on subfields in order to support nested orderBy/filter
			result.forEach(resultElement => {
				for (const resultElementField in resultElement) {
					if (cache.has(`${resultElement.id}.${resultElementField}`)) {
						resultElement[resultElementField] = cache.get(`${resultElement.id}.${resultElementField}`);
					}
				}
			});

			connection = dataResolver.getConnection(result, _args.before, _args.after, _args.first, _args.last);
			result = connection.edges;

			result = result.map((entry) => {
				return {
					fortuneReturn: entry,
					cache: cache,
					__typename: entry.__typename
				};
			});

			result = result.length === 0 ? null : returnArray ? result : result[0];
			if (returnConnection) {
				result = {
					edges: result,
					pageInfo: connection.pageInfo,
					aggregate: connection.aggregate
				};
			}

			return result;
		};

	} else {
		resolver = async (
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
	return resolver;
};

export const getAllResolver = (dataResolver: DataResolver, schema: GraphQLSchema, type: IntrospectionObjectType, returnConnection = false) => {
	return async (_root: any, _args: { [key: string]: any }, _context: any, _info: GraphQLResolveInfo) => {

		let options = {};
		let filter = null;
		_args = moveArgsIntoFilter(_args);

		const schemaType: GraphQLNamedType = schema.getType(type.name);
		if (_args && _args.filter) {
			filter = _args.filter;
			options = parseFilter(_args.filter, schemaType);
		}

		set(options, 'orderBy', _args.orderBy);
		set(options, 'offset', _args.skip);
		let connection: Connection;
		let result: any;
		let fortuneReturn = await dataResolver.find(type.name, null, options);
		if (fortuneReturn && !isEmpty(fortuneReturn)) {
			fortuneReturn = isArray(fortuneReturn) ? fortuneReturn : [fortuneReturn];
			connection = dataResolver.getConnection(fortuneReturn, _args.before, _args.after, _args.first, _args.last);
			fortuneReturn = connection.edges;

			const cache = new Map<string, object>();
			fortuneReturn.forEach(result => {
				if (result && result.id) {
					cache.set(result.id, result);
				}
			});
			if ((_args.orderBy || filter)  && (isObjectType(schemaType) || isInterfaceType(schemaType))) {
				const pullIds = await filterNested(filter, _args.orderBy, schemaType, fortuneReturn, cache, dataResolver);
				fortuneReturn = pullIds.size > 0  ? fortuneReturn.filter(result => !pullIds.has(result ? result.id : '')) : fortuneReturn;
			}
			result = fortuneReturn.map((result) => {
				if (!result) { return result; }
				return {
					fortuneReturn: result,
					cache: cache,
					filter,
					__typename: result.__typename
				};
			});
		}

		if (returnConnection) {
			result = {
				edges: result,
				pageInfo: connection.pageInfo,
				aggregate: connection.aggregate
			};
		}

		return result;
	};
};
const parseScalars = (filter: object, fieldMap: Map<string, GraphQLScalarType>) => {
	if (!filter || !isObject(filter) || isArray(filter)) {
		return filter;
	}
	return mapValues(filter, (val, key) => {

		if (isArray(val)) {
			return val.map((val) => {
				if (isObject(val)) {
					return parseScalars(val, fieldMap);
				} else {
					return val && fieldMap.has(key) ? fieldMap.get(key).parseValue(val) : val;
				}
			});
		} else if (isObject(val)) {
			if (key === 'range' || key === 'match') {
				return parseScalars(val, fieldMap);
			} else {
				return val;
			}
		} else {
			return val && fieldMap.has(key) ? fieldMap.get(key).parseValue(val) : val;
		}
	});
};

export const queryArgs: Object = {
	'first': { type: 'Int' },
	'last': { type: 'Int' },
	'skip': { type: 'Int' },
	'before': { type: 'String' },
	'after': { type: 'String' }
};

export const fortuneFilters = ['not', 'or', 'and', 'range', 'match', 'exists'];

const genieFindArgs = ['filter', 'orderBy', 'local', 'last', 'skip', 'before', 'after'];

export const moveArgsIntoFilter = (args: object): object => {
	if (!args) {
		return args;
	}
	Object.keys(args).forEach((argKey) => {
		if (!genieFindArgs.includes(argKey)) {
			set(args, 'filter.match.' + argKey, args[argKey]);
			delete args[argKey];
		}
	});
	return args;
};

export const parseFilter = (filter: object, type: GraphQLNamedType) => {

	if (!isObjectType(type) && !isInterfaceType(type)) {
		return filter;
	}
	if (!filter || !isObject(filter) || isArray(filter)) {
		return filter;
	}
	const fieldMap = new Map<string, GraphQLScalarType>();
	each(type.getFields(), field => {
		if (!fortuneFilters.includes(field.name) && filter[field.name]) {
			if (filter['and']) {
				filter['and'].push({ exists: { [field.name]: true } });
			} else {
				set(filter, `exists.${field.name}`, true);
			}
		}
		const fieldOutputType = getReturnGraphQLType(field.type);
		if (isScalarType(fieldOutputType)) {
			fieldMap.set(field.name, fieldOutputType);
		}
	});

	const scalarsParsed = parseScalars(pick(filter, fortuneFilters), fieldMap);
	return Object.assign(filter, scalarsParsed);

};

export const filterNested = async (filter: object, orderBy: object, type: GraphQLNamedType, fortuneReturn: any[], cache: Map<string, object>, dataResolver: DataResolver): Promise<Set<string>> => {
	// if they have nested filters on types we need to get that data now so we can filter at this root query
	const pullIds = new Set<string>();
	if ((orderBy || filter)  && (isObjectType(type) || isInterfaceType(type))) {
		await Promise.all(map(type.getFields(), async (field) => {
			const currFilter = filter && filter[field.name] ? filter[field.name] : filter && filter[`f_${field.name}`] ? filter[`f_${field.name}`] : null;
			const currOrderBy = orderBy && orderBy[field.name] ? orderBy[field.name] : orderBy && orderBy[`f_${field.name}`] ? orderBy[`f_${field.name}`] : null;
			const childType = getReturnGraphQLType(field.type);

			if (!isScalarType(childType) && (currFilter || currOrderBy)) {

				const options = currFilter ? parseFilter(currFilter, childType) : {};
				await Promise.all(fortuneReturn.map(async (result) => {
					const childIds = result[field.name];
					if (childIds && !isEmpty(childIds)) {
						if (currOrderBy) {
							options.orderBy = currOrderBy;
						}
						let childReturn = await dataResolver.find(childType.name, childIds, options);
						if (isArray(childReturn)) {
							const recursePullIds = await filterNested(currFilter, currOrderBy, childType, childReturn, cache, dataResolver);
							childReturn = childReturn ? childReturn.filter(result => !recursePullIds.has(result.id)) : childReturn;
						}
						if (childReturn && !isEmpty(childReturn)) {
							if (cache) {
								if (childReturn.id) {
									cache.set(childReturn.id, childReturn);
								} else {
									cache.set(`${result.id}.${field.name}`, childReturn);
								}
							}
						} else {
							pullIds.add(result.id);
						}
					}
				}));
			}
		}));
	}
	return pullIds;
};

export const getPayloadTypeName = (typeName: string): string => {
	return `${typeName}Payload`;
};

export const getPayloadTypeDef = (typeName: string): string => {
	return `
		type ${getPayloadTypeName(typeName)} {
			data: ${typeName}!
			clientMutationId: String
		}`;
};

export const capFirst = (val: string) => {
	return val ? val.charAt(0).toUpperCase() + val.slice(1) : '';
};

export const lowerFirst = (val: string) => {
	return val ? val.charAt(0).toLowerCase() + val.slice(1) : '';
};

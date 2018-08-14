import { GraphQLArgument, GraphQLInputObjectType, GraphQLList, GraphQLNamedType, GraphQLObjectType, GraphQLOutputType, GraphQLResolveInfo, GraphQLSchema, GraphQLType, IntrospectionObjectType, IntrospectionType, defaultFieldResolver, getNamedType, isEnumType, isInterfaceType, isObjectType, isScalarType, isUnionType } from 'graphql';
import { difference, each, eq, find, get, isArray, isEmpty, isObject, keys, map, set, union } from 'lodash';
import pluralize from 'pluralize';
import { Connection, DataResolver } from './GraphQLGenieInterfaces';
import { FindByUniqueError, getReturnType, typeIsList } from './GraphQLUtils';
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
			return this.isSameRelation(relation) || this.isCurrentRelation(relation);
		}
	}

	isSameRelation(relation: Relation): boolean {
		return this.type0 === relation.type0 && this.field0 === relation.field0 && this.field0isList === relation.field0isList;
	}

	isCurrentRelation(relation: Relation): boolean {
		return this.type1 === relation.type0 && this.field1 === relation.field0 && this.field1isList === relation.field0isList;
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
				if (!relation.isSameRelation(newRelation)) {
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
		throw new Error(`Bad schema, relation could apply to multiple fields
			relation name: ${name}
			fortune name: ${type}
			curr field: ${primaryField}
			other field: ${relatedField}`);
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

export enum Mutation {
	Create,
	Update,
	Delete,
	Upsert
}

export const clean = (obj): any => {
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
			let argReturnRootType: GraphQLOutputType;
			if ((isObjectType(returnType) || isInterfaceType(returnType)) && returnType.getFields()[argName]) {
				argReturnType = returnType.getFields()[argName].type;
				argReturnRootType = <GraphQLOutputType>getNamedType(argReturnType);
				if (argReturnRootType['name'].endsWith('Connection')) {
					argReturnRootType = <GraphQLOutputType>_info.schema.getType(argReturnRootType['name'].replace(/Connection$/g, ''));
					argReturnType = new GraphQLList(argReturnRootType);
				}
			}
			if (argReturnRootType && !isScalarType(argReturnRootType) && !isEnumType(argReturnRootType)) {
				const arg = currArg[argName];
				if (isObject(arg) && argReturnType) {
					currArg[argName] = typeIsList(argReturnType) ? [] : undefined;

					if (isInterfaceType(argReturnRootType) || isUnionType(argReturnRootType)) {
						for (const argKey in arg) {
							const argTypeName = pluralize.singular(argKey).toLowerCase();
							argReturnRootType = <GraphQLOutputType> find(_info.schema.getTypeMap(), type => {
								return type.name.toLowerCase() === argTypeName;
							});
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
		await dataResolver.beginTransaction();
		// iterate over all the non-id arguments and recursively create new types
		const recursed = returnType ? true : false;
		if (!returnType) {
			returnType = (<GraphQLObjectType>_info.returnType).getFields().data.type;
			returnType = <GraphQLObjectType>getNamedType(returnType);
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
		const conditionsArgs = _args.conditions ? _args.conditions : _args.input && _args.input.conditions ? _args.input.conditions : null;
		// lets make sure we are able to add this (prevent duplicates on unique fields, etc)

		const canAddResults = await Promise.all([dataResolver.canAdd(returnTypeName, createArgs, {context: _context, info: _info}),
		dataResolver.canAdd(returnTypeName, updateArgs, {context: _context, info: _info})]);
		const cannotAdd = canAddResults.includes(false);
		if (cannotAdd) {
			throw new Error('Can not create record with duplicate on unique field on type ' + returnTypeName + ' ' + JSON.stringify(createArgs) + ' ' + JSON.stringify(updateArgs));
		}

		const dataResolverPromises: Array<Promise<any>> = [];

		if (!isEmpty(updateArgs)) {
			if (whereArgs) {
				// we have a where so use that to get the record to update
				// pass true to where args if currRecord is already the one we want
				if (whereArgs !== true) {
					const returnTypeName = getReturnType(returnType);
					currRecord = await dataResolver.getValueByUnique(returnTypeName, whereArgs, {context: _context, info: _info});
					if (!currRecord || isEmpty(currRecord)) {
						throw new FindByUniqueError(`${returnTypeName} does not exist with where args ${JSON.stringify(whereArgs)}`, 'update', {arg: whereArgs, typename: returnTypeName});
					}
				}

			} else if (updateArgs[0].data && updateArgs[0].where) {
				// this is a nested update an a list type so we need to individually do updates
				updateArgs.forEach((currArg) => {
					dataResolverPromises.push(
						new Promise((resolve, reject) => {
							mutateResolver(mutation, dataResolver)(currRecord, { update: currArg.data, where: currArg.where }, _context, _info, index, key, returnType).then((result) => {
								if (recursed) {
									resolve();
								} else {
									resolve(result[0]);
								}
							}).catch(reason => {
								reject(reason);
							});
						})
					);
				});
				updateArgs = [];
			} else if (key && currRecord) {
				// this is a nested input on a single field so we already know the where
				const recordToUpdate = await dataResolver.getValueByUnique(returnTypeName, { id: currRecord[key] }, {context: _context, info: _info});
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
					upsertRecord = await dataResolver.getValueByUnique(returnTypeName, whereArg, {context: _context, info: _info});
				} else if (upsertRecord && key) {
					// this is a nested upsert on a single field so we already have the where
					upsertRecord = upsertRecord[key] ? await dataResolver.getValueByUnique(returnTypeName, { id: upsertRecord[key] }, {context: _context, info: _info}) : null;
				}

				let newArgs: object = { create: currArg.create };
				if (upsertRecord && !isEmpty(upsertRecord)) {
					// pass true to where args if currRecord will already be the one we want
					newArgs = { where: true, update: currArg.update };
				}
				dataResolverPromises.push(
					new Promise((resolve, reject) => {
						mutateResolver(mutation, dataResolver)(upsertRecord, newArgs, _context, _info, index, key, returnType).then((result) => {
							if (result[0]) {
								resolve(result[0]);
							} else {
								resolve();
							}
						}).catch(reason => {
							reject(reason);
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
				dataResolverPromises.push(new Promise((resolve, reject) => {
					dataResolver.create(returnTypeName, createArg, {context: _context, info: _info}).then(data => {
						const id = isArray(data) ? map(data, 'id') : data.id;
						resolve({ index, key, id, data });
					}).catch(reason => {
						reject(reason);
					});
				}));
			}
		});

		// now updates
		updateArgs.forEach((updateArg) => {
			// make sure it is prototype correctly to prevent error
			updateArg = updateArg.hasOwnProperty ? updateArg : Object.assign({}, updateArg);
			// only do updates on new values
			for (const updateArgKey in updateArg) {
				const currArg = updateArg[updateArgKey];
				const currRecordArg = currRecord[updateArgKey];

				if (eq(currRecordArg, currArg)) {
					delete currRecord[updateArgKey];
				} else if (isArray(currArg) && isArray(currRecordArg)) {
					// for relations we can't have duplicates, only relations will be arrays
					updateArg[updateArgKey] = difference(currArg, currRecordArg);
				}
			}
			const cleanArg = clean(updateArg);
			if (cleanArg && !isEmpty(cleanArg)) {
				dataResolverPromises.push(new Promise((resolve, reject) => {
					cleanArg.id = currRecord.id;
					const meta = {context: _context, info: _info};

					meetsConditions(conditionsArgs, returnTypeName, returnType, currRecord, dataResolver, _context, _info).then(meetsConditionsResult => {
						if (!meetsConditionsResult) {
							resolve({ index, key, id: [], unalteredData: currRecord});
						} else {
							dataResolver.update(returnTypeName, cleanArg, meta).then(data => {
								const id = isArray(data) ? map(data, 'id') : data.id;
								resolve({ index, key, id, data });
							}).catch(reason => {
								reject(reason);
							});
						}
					}).catch(reason => {
						reject(reason);
					});
				}));
			} else if (currRecord) {
				currRecord = Object.assign(currRecord, updateArg);
			}
		});

		// now add the connect types
		connectArgs.forEach(connectArg => {
			dataResolverPromises.push(new Promise((resolve, reject) => {
				dataResolver.getValueByUnique(returnTypeName, connectArg, {context: _context, info: _info}).then(data => {
					if (data && data['id']) {
						resolve({ index, key, id: data['id'], data });
					} else {
						reject(new FindByUniqueError(`connect: ${returnTypeName} does not exist with where args ${JSON.stringify(connectArg)}`, 'disconnect', {arg: connectArg, typename: returnTypeName}));
					}
				}).catch(reason => {
					reject(reason);
				});
			}));
		});

		// disconnect
		const disconnectPromises: Array<Promise<any>> = [];
		disconnectArgs.forEach(disconnectArg => {
			if (disconnectArg === true) {
				dataResolverPromises.push(new Promise((resolve, reject) => {
					dataResolver.update(currRecord.__typename, { id: currRecord.id, [key]: null }, {context: _context, info: _info}).then(data => {
						resolve({ index, key, id: null, data });
					}).catch(reason => {
						reject(reason);
					});
				}));
			} else {
				disconnectPromises.push(new Promise((resolve, reject) => {
					dataResolver.getValueByUnique(returnTypeName, disconnectArg, {context: _context, info: _info}).then(data => {
						if (data && data['id']) {
							resolve(data['id']);
						} else {
							reject(new FindByUniqueError(`disconnect: ${returnTypeName} does not exist with where args ${JSON.stringify(disconnectArg)}`, 'disconnect', {arg: disconnectArg, typename: returnTypeName}));
						}
					}).catch(reason => {
						reject(reason);
					});
				}));
			}
		});

		const disconnectIds = await Promise.all(disconnectPromises);
		if (!isEmpty(disconnectIds)) {
			dataResolverPromises.push(new Promise((resolve, reject) => {
				dataResolver.update(currRecord.__typename, { id: currRecord.id, [key]: disconnectIds }, {context: _context, info: _info}, { pull: true }).then(data => {
					resolve({ index, key, id: data[key], data });
				}).catch(reason => {
					reject(reason);
				});
			}));
		}

		// delete

		const deletePromises: Array<Promise<any>> = [];
		deleteArgs.forEach(deleteArg => {
			if (deleteArg === true) {
				dataResolverPromises.push(new Promise((resolve, reject) => {
					dataResolver.delete(dataResolver.getLink(currRecord.__typename, key), [currRecord[key]], {context: _context, info: _info}).then(data => {
						resolve({ index, key, id: null, data });
					}).catch(reason => {
						reject(reason);
					});
				}));
			} else if (whereArgs && !currRecord) {
				dataResolverPromises.push(new Promise((resolve, reject) => {
					dataResolver.getValueByUnique(returnTypeName, whereArgs, {context: _context, info: _info}).then(whereData => {
						currRecord = whereData;
						if (!currRecord || isEmpty(currRecord)) {
							throw new FindByUniqueError(`${returnTypeName} does not exist with where args ${JSON.stringify(whereArgs)}`, 'delete', {arg: whereArgs, typename: returnTypeName});
						}
						dataResolver.delete(currRecord.__typename, [currRecord.id], {context: _context, info: _info}).then(() => {
							resolve({ index, key, id: null, data: currRecord });
						}).catch(reason => {
							reject(reason);
						});
					}).catch(reason => {
						reject(reason);
					});
				}));
			} else {
				deletePromises.push(new Promise((resolve, reject) => {
					const deleteTypeName = dataResolver.getLink(currRecord.__typename, key);
					dataResolver.getValueByUnique(deleteTypeName, deleteArg, {context: _context, info: _info}).then(data => {
						if (data && data['id']) {
							resolve(data['id']);
						} else {
							reject(new FindByUniqueError(`${deleteTypeName} does not exist with where args ${JSON.stringify(deleteArg)}`, 'delete', {arg: deleteArg, typename: deleteTypeName}));
						}
					}).catch(reason => {
						reject(reason);
					});
				}));
			}
		});

		const deleteIds = await Promise.all(deletePromises);
		if (!isEmpty(deleteIds)) {
			dataResolverPromises.push(new Promise((resolve, reject) => {
				dataResolver.delete(dataResolver.getLink(currRecord.__typename, key), deleteIds, {context: _context, info: _info}).then(data => {
					resolve({ index, key, id: data[key], data });
				}).catch(reason => {
					reject(reason);
				});
			}));
		}

		const dataResult = await Promise.all(dataResolverPromises);

		// if key this is recursed else it's the final value
		if (recursed) {
			return dataResult;
		} else {
			await dataResolver.endTransaction();
			let data = get(dataResult, '[0].data');
			const unalteredData = get(dataResult, '[0].unalteredData', null);
			if (!unalteredData && !data && mutation === Mutation.Delete) {
				data = currRecord;
			} else if (!unalteredData && !data) {
				// if everything was already done on the object (updates, deletions and disconnects) it should be the currRecord but with changes
				data = currRecord;
			}

			return {
				data,
				clientMutationId,
				unalteredData
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
	if (!isScalarType(schemaType) && !isEnumType(schemaType)) {
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
			_args = moveArgsIntoWhere(_args);

			let where = null;
			if (_args && _args.where) {
				where = _args.where;
				options = parseFilter(where, schemaType);
			}
			if (_args.orderBy) {
				set(options, 'orderBy', _args.orderBy);
			}
			if (_args.skip) {
				set(options, 'offset', _args.skip);
			}
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
				let findResult = await dataResolver.find(typeName, ids, findOptions, {context: _context, info: _info});
				if (findResult) {
					findResult = isArray(findResult) ? findResult : [findResult];
					// remove null values
					findResult = findResult.filter(function(n) { return !!n; });
					findResult.forEach(result => {
						cache.set(result.id, result);
					});

					result = result.concat(findResult);
				}
			}

			if (applyOptionsWithCombinedResult) {
				result = dataResolver.applyOptions(typeName, result, options);
			}

			if ((_args.orderBy || where) && (isObjectType(schemaType) || isInterfaceType(schemaType))) {
				const pullIds = await filterNested(where, _args.orderBy, schemaType, fortuneReturn, cache, dataResolver, _context, _info);
				result = result.filter(entry => !pullIds.has(entry.id));
			}

			// use cached data on subfields in order to support nested orderBy/where
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

			result = !returnArray && result.length === 0 ? null : returnArray ? result : result[0];
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
		let where = null;
		_args = moveArgsIntoWhere(_args);

		const schemaType: GraphQLNamedType = schema.getType(type.name);
		if (_args && _args.where) {
			where = _args.where;
			options = parseFilter(_args.where, schemaType);
		}

		if (_args.orderBy) {
			set(options, 'orderBy', _args.orderBy);
		}
		if (_args.skip) {
			set(options, 'offset', _args.skip);
		}
		let connection: Connection;
		let result: any = [];
		let fortuneReturn = await dataResolver.find(type.name, null, options, {context: _context, info: _info});
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
			if ((_args.orderBy || where)  && (isObjectType(schemaType) || isInterfaceType(schemaType))) {
				const pullIds = await filterNested(where, _args.orderBy, schemaType, fortuneReturn, cache, dataResolver, _context, _info);
				fortuneReturn = pullIds.size > 0  ? fortuneReturn.filter(result => !pullIds.has(result ? result.id : '')) : fortuneReturn;
			}
			result = fortuneReturn.map((result) => {
				if (!result) { return result; }
				return {
					fortuneReturn: result,
					cache: cache,
					where,
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

export const queryArgs: Object = {
	'first': { type: 'Int', description: 'Slice result from the start' },
	'last': { type: 'Int', description: 'Slice result from the end' },
	'skip': { type: 'Int', description: 'Skip results' },
	'before': { type: 'String', description: 'Cursor returned by previous connection queries for pagination' },
	'after': { type: 'String', description: 'Cursor returned by previous connection queries for pagination' },
};

export const fortuneFilters = ['not', 'or', 'and', 'range', 'match', 'exists'];

const genieFindArgs = ['first', 'where', 'orderBy', 'local', 'last', 'skip', 'before', 'after'];

export const getRootMatchFields = (matchInput: GraphQLInputObjectType): { [key: string]: GraphQLArgument } => {
	const matchFields = matchInput.getFields();
	const args = {};
	Object.keys(matchFields).forEach(key => {
		let newKey = key;
		if (genieFindArgs.includes(key)) {
			newKey = `f_${key}`;
		}
		args[newKey] = matchFields[key];
		args[newKey].name = newKey;
		args[newKey].description = `${key} matches at least one of argument`;
	});
	return args;
};

export const moveArgsIntoWhere = (args: object): object => {
	if (!args) {
		return args;
	}
	Object.keys(args).forEach((argKey) => {
		if (!genieFindArgs.includes(argKey)) {
			set(args, 'where.match.' + argKey, args[argKey]);
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
	each(type.getFields(), field => {
		if (!fortuneFilters.includes(field.name) && filter[field.name]) {
			if (filter['and']) {
				filter['and'].push({ exists: { [field.name]: true } });
			} else {
				set(filter, `exists.${field.name}`, true);
			}
		}
	});

	return filter;

};

export const filterNested = async (filter: object, orderBy: object, type: GraphQLNamedType, fortuneReturn: any[], cache: Map<string, object>, dataResolver: DataResolver, _context, _info): Promise<Set<string>> => {
	// if they have nested filters on types we need to get that data now so we can filter at this root query
	const pullIds = new Set<string>();
	if (!cache) {
		cache = new Map<string, object>();
	}
	if ((orderBy || filter)  && (isObjectType(type) || isInterfaceType(type))) {
		await Promise.all(map(type.getFields(), async (field) => {
			const currFilter = filter && filter[field.name] ? filter[field.name] : filter && filter[`f_${field.name}`] ? filter[`f_${field.name}`] : null;
			const currOrderBy = orderBy && orderBy[field.name] ? orderBy[field.name] : orderBy && orderBy[`f_${field.name}`] ? orderBy[`f_${field.name}`] : null;
			const childType = getNamedType(field.type);

			if (!isScalarType(childType) && !isEnumType(childType) && (currFilter || currOrderBy)) {

				const options = currFilter ? parseFilter(currFilter, childType) : {};
				await Promise.all(fortuneReturn.map(async (result) => {
					if (!result) { return result; }
					const childIds = result[field.name];
					if (childIds && !isEmpty(childIds)) {
						if (currOrderBy) {
							options['orderBy'] = currOrderBy;
						}
						let childReturn = await dataResolver.find(childType.name, childIds, options, {context: _context, info: _info});
						if (isArray(childReturn) && !isEmpty(childReturn)) {
							const recursePullIds = await filterNested(currFilter, currOrderBy, childType, childReturn, cache, dataResolver, _context, _info);
							childReturn = childReturn ? childReturn.filter(result => {
								if (!result) { return result; } return !recursePullIds.has(result.id);
							}) : childReturn;
						} else if (childReturn && (currOrderBy || currFilter)) {
							const recursePullIds = await filterNested(currFilter, currOrderBy, childType, [childReturn], cache, dataResolver, _context, _info);
							childReturn = childReturn ? [childReturn].filter(result => {
								if (!result) { return result; } return !recursePullIds.has(result.id);
							}) : childReturn;
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
			data: ${typeName}
			clientMutationId: String
			#In the case of a update or delete and you had conditions, if the conditions did not match the existing object will be returned here. data will be null
			unalteredData: ${typeName}
		}`;
};

export const capFirst = (val: string) => {
	return val ? val.charAt(0).toUpperCase() + val.slice(1) : '';
};

export const isConnectionType = (type: GraphQLType): boolean => {
	let isConnection = false;
	if (isObjectType(type) && type.name.endsWith('Connection')) {
		isConnection = true;
		// could add more logic to not have to ban fields ending with Connection
	}
	return isConnection;
};
	// resolvers may have meta info that's not wanted
export const getRecordFromResolverReturn = (record)  => {
	record = record && record.fortuneReturn ? record.fortuneReturn : record;
	record = record && record.edges ? record.edges : record;
	record = record && record.node ? record.node : record;
	record = record && record.fortuneReturn ? record.fortuneReturn : record;
	record = record && record.data ? record.data : record;
	return record;
};

export const meetsConditions = async (conditionsArgs, returnTypeName, returnType, currRecord, dataResolver, _context, _info) => {
	let meetsConditions = true;
	if (conditionsArgs) {
		const conditionsOptions = parseFilter(conditionsArgs, <GraphQLNamedType> returnType);
		let dataAfterConditions = dataResolver.applyOptions(returnTypeName, currRecord, conditionsOptions);
		if (!isEmpty(dataAfterConditions)) {
			if (conditionsArgs && (isObjectType(returnType) || isInterfaceType(returnType))) {
				const pullIds = await filterNested(conditionsArgs, null, returnType, currRecord, null, dataResolver, _context, _info);
				dataAfterConditions = dataAfterConditions.filter(entry => !pullIds.has(entry.id));
			}
		}
		if (isEmpty(dataAfterConditions)) {
			meetsConditions = false;
		}
	}

	return meetsConditions;
};

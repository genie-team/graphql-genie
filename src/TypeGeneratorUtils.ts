import {
	GraphQLInputType, GraphQLNamedType, GraphQLObjectType,
	GraphQLOutputType, GraphQLResolveInfo, GraphQLScalarType,
	GraphQLType, IntrospectionType,
	isInterfaceType, isListType, isNonNullType, isObjectType, isScalarType
} from 'graphql';
import { DataResolver } from './GraphQLGenieInterfaces';
import { each, get, isArray, isEmpty, isObject, keys, map, mapValues, pick, set } from 'lodash';
import pluralize from 'pluralize';
export class Relation {
	public type0: string;
	public field0: string;
	public field0isArray: boolean;
	public type1: string;
	public field1: string;
	public field1isArray: boolean;


	constructor($type: string, $field: string, $field0isArray: boolean) {
		this.type0 = $type;
		this.field0 = $field;
		this.field0isArray = $field0isArray;
	}

	setRelative(relation: Relation) {
		this.type1 = relation.type0;
		this.field1 = relation.field0;
		this.field1isArray = relation.field0isArray;
	}

	isValidRelative(relation: Relation) {
		if (!this.type1) {
			return true;
		} else {
			return this.isSameRelative(relation);
		}
	}

	isSameRelative(relation: Relation): boolean {
		return this.type0 === relation.type0 && this.field0 === relation.field0 && this.field0isArray === relation.field0isArray;
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

	public setRelation(name: string, type: string, field: string, fieldIsArray: boolean) {
		const newRelation = new Relation(type, field, fieldIsArray);
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

	private throwError(name: string, type: string, primaryField: string, relatedField: string) {
		console.error('Bad schema, relation could apply to multiple fields\n',
			'relation name', name, '\n',
			'fortune name', type, '\n',
			'curr field', primaryField, '\n',
			'other field', relatedField);
	}


}

export const computeRelations = (schemaInfo: IntrospectionType[], typeNameResolver: (name: string) => string = (name: string) => name): Relations => {
	const relations = new Relations();
	each(keys(schemaInfo), (typeName) => {
		const type = schemaInfo[typeName];
		each(type.fields, field => {
			const relation = get(field, 'metadata.relation');
			if (relation) {
				const reslovedTypeName = typeNameResolver(getReturnType(field.type));

				relations.setRelation(relation.name, reslovedTypeName, field.name, fieldIsArray(field.type));
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

export const fieldIsArray = (fieldInfo) => {
	let isArray = false;
	while (isListType(fieldInfo) || isNonNullType(fieldInfo) || fieldInfo.kind === 'NON_NULL' || fieldInfo.kind === 'LIST') {
		if (isListType(fieldInfo) || fieldInfo.kind === 'LIST') {
			isArray = true;
			break;
		}
		fieldInfo = fieldInfo.ofType;
	}
	return isArray;
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

const clean = (obj) => {
	for (const propName in obj) {
		if (obj[propName] === null || obj[propName] === undefined || (isArray(obj[propName]) && obj[propName].length < 1)) {
			delete obj[propName];
		}
	}
};

const getValueByUnique = async (dataResolver: DataResolver, returnTypeName: string, args) => {
	let currValue;
	// tslint:disable-next-line:prefer-conditional-expression
	if (args.id) {
		currValue = await dataResolver.find(returnTypeName, [args.id]);
	} else {
		currValue = await dataResolver.find(returnTypeName, undefined, { match: args });
	}

	return isArray(currValue) ? currValue[0] : currValue;
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
							arg[key] = arg[key].concat(id);
						} else {
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
					currArg[argName] = fieldIsArray(argReturnType) ? [] : undefined;

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
		const recursed = key ? true : false;
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

		let upsertArgs = _args.upsert ? _args.upsert : mutation === Mutation.Upsert && get(_args, 'input.data') ? get(_args, 'input.data') : [];
		upsertArgs = upsertArgs && !isArray(upsertArgs) ? [upsertArgs] : upsertArgs;

		let deleteArgs = _args.delete ? _args.delete : mutation === Mutation.Delete && _args.input ? _args.input : [];
		deleteArgs = deleteArgs && !isArray(deleteArgs) ? [deleteArgs] : deleteArgs;

		let connectArgs = _args.connect ? _args.connect : [];
		connectArgs = connectArgs && !isArray(connectArgs) ? [connectArgs] : connectArgs;

		let disconnectArgs = _args.disconnect ? _args.disconnect : [];
		disconnectArgs = disconnectArgs && !isArray(disconnectArgs) ? [disconnectArgs] : disconnectArgs;

		const whereArgs = _args.where ? _args.where : _args.input && _args.input.where ? _args.input.where : null;

		if ((mutation === Mutation.Update) && !isEmpty(updateArgs)) {
			if (whereArgs) {
				const returnTypeName = getReturnType(returnType);
				currRecord = await getValueByUnique(dataResolver, returnTypeName, whereArgs);
				if (!currRecord || isEmpty(currRecord)) {
					throw new Error(`${returnTypeName} does not exist with where args ${JSON.stringify(whereArgs)}`);
				}
			} else {
				const updatePromises: Array<Promise<any>> = [];
				updateArgs.forEach((currArg) => {
					updatePromises.push(mutateResolver(mutation, dataResolver)(currRecord, {update: currArg.update, where: currArg.where}, _context, _info, index, key, returnType));
				});
				const updateResults = await Promise.all(updatePromises);
				updateArgs = setupArgs(updateResults, updateArgs);
			}
		}


		[createArgs, updateArgs] = await Promise.all([
			resolveArgs(createArgs, returnType, Mutation.Create, dataResolver, currRecord, _args, _context, _info),
			resolveArgs(updateArgs, returnType, Mutation.Update, dataResolver, currRecord, _args, _context, _info)
		]);


		// could be creating more than 1 type
		const dataResolverPromises: Array<Promise<any>> = [];
		createArgs.forEach((createArg) => {
			createArg = createArg.hasOwnProperty ? createArg : Object.assign({}, createArg);
			clean(createArg);
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
			clean(updateArg);
			if (updateArg && !isEmpty(updateArg)) {
				dataResolverPromises.push(new Promise((resolve) => {
					updateArg.id = currRecord.id;
					dataResolver.update(returnTypeName, updateArg).then(data => {
						const id = isArray(data) ? map(data, 'id') : data.id;
						resolve({ index, key, id, data });
					});
				}));
			}
		});


		// now add the connect types
		connectArgs.forEach(connectArg => {
			dataResolverPromises.push(new Promise((resolve, reject) => {
				getValueByUnique(dataResolver, returnTypeName, connectArg).then(data => {
					if (data && data['id']) {
						resolve({ index, key, id: data['id'], data });
					} else {
						reject();
					}
				});
			}));
		});

		// disconnect
		const disconnectPromies: Array<Promise<any>> = [];
		disconnectArgs.forEach(disconnectArg => {
			if (disconnectArg === true) {
				dataResolverPromises.push(new Promise((resolve) => {
					dataResolver.update(currRecord.__typename, { id: currRecord.id, [key]: null }).then(data => {
						resolve({index, key, id: null, data});
					});
				}));
			} else {
				disconnectPromies.push(new Promise((resolve, reject) => {
					getValueByUnique(dataResolver, returnTypeName, disconnectArg).then(data => {
						if (data && data['id']) {
							resolve(data['id']);
						} else {
							reject();
						}
					});
				}));
			}
		});

		const disconnectIds = await Promise.all(disconnectPromies);
		if (!isEmpty(disconnectIds)) {
			dataResolverPromises.push(new Promise((resolve) => {
				dataResolver.update(currRecord.__typename, { id: currRecord.id, [key]: disconnectIds }, null, { pull: true }).then(data => {
					resolve({index, key, id: data[key], data});
				});
			}));
		}

		const dataResult = await Promise.all(dataResolverPromises);

		// if everything was an id no need to create anything new

		// if key this is recursed else it's the final value
		if (recursed) {
			return dataResult;
		} else {
			const defaultVal = (currRecord && updateArgs && updateArgs[0]) ? Object.assign(currRecord, updateArgs[0]) : null;

			return {
				// if everything was already done on the object (deletions and disconnects) it should be the currRecord
				data: get(dataResult, '[0].data', defaultVal),
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

export const filterArgs = {
	'filter': { type: 'JSON' },
	'sort': { type: 'JSON' },
	'first': { type: 'Int' },
	'last': { type: 'Int' },
	'offset': { type: 'Int' },
	'before': { type: 'String' },
	'after': { type: 'String' }
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
		if (filter[field.name]) {
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

	const scalarsParsed = parseScalars(pick(filter, ['not', 'or', 'and', 'range', 'match']), fieldMap);
	return Object.assign(filter, scalarsParsed);


};

export const filterNested = async (filter: object, sort: object, type: GraphQLNamedType, fortuneReturn: any[], cache: Map<string, object>, dataResolver: DataResolver): Promise<Set<string>> => {
	// if they have nested filters on types we need to get that data now so we can filter at this root query
	const pullIds = new Set<string>();
	if (filter && isObjectType(type) || isInterfaceType(type)) {
		await Promise.all(map(type.getFields(), async (field) => {
			const currFilter = filter[field.name] ? filter[field.name] : filter[`f_${field.name}`] ? filter[`f_${field.name}`] : null;
			const currSort = sort && sort[field.name] ? sort[field.name] : sort && sort[`f_${field.name}`] ? sort[`f_${field.name}`] : null;
			if (currFilter) {
				const childType = getReturnGraphQLType(field.type);
				const options = parseFilter(currFilter, childType);
				await Promise.all(fortuneReturn.map(async (result) => {
					const childIds = result[field.name];
					if (childIds && !isEmpty(childIds)) {
						if (currSort) {
							options.sort = currSort;
						}
						let childReturn = await dataResolver.find(childType.name, childIds, options);
						if (isArray(childReturn)) {
							const recursePullIds = await filterNested(options, currSort, childType, childReturn, cache, dataResolver);
							childReturn = childReturn ? childReturn.filter(result => !recursePullIds.has(result.id)) : childReturn;
						}
						if (childReturn && !isEmpty(childReturn)) {
							cache.set(childReturn.id, childReturn);
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


export const  capFirst = (val: string) => {
	return val ? val.charAt(0).toUpperCase() + val.slice(1) : '';
};

export const lowerFirst = (val: string) => {
	return val ? val.charAt(0).toLowerCase() + val.slice(1) : '';
};

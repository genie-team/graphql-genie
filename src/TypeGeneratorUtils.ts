import {
	GraphQLID, GraphQLInputObjectType, GraphQLInputType, GraphQLInterfaceType,
	GraphQLList, GraphQLNamedType, GraphQLNonNull, GraphQLObjectType,
	GraphQLOutputType, GraphQLResolveInfo, GraphQLScalarType, GraphQLSchema,
	GraphQLType, GraphQLUnionType, IntrospectionObjectType, IntrospectionType,
	isInputType, isInterfaceType, isListType, isNonNullType, isObjectType, isScalarType, isUnionType
} from 'graphql';
import { DataResolver } from './GraphQLGenieInterfaces';
import { each, endsWith, get, isArray, isEmpty, isObject, keys, map, mapValues, merge, pick, pickBy, set } from 'lodash';
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




const getInputName = (name: string): string => {
	return name + 'Input';
};

// We don't need a reference to the actual input type for the field to print correctly so just dummy it to prevent ifninite recursion

const generateInputs = (type: GraphQLObjectType | GraphQLInterfaceType | GraphQLUnionType | GraphQLNonNull<any> | GraphQLList<any>, currInputObjectTypes: Map<string, GraphQLInputType>, schemaInfo: IntrospectionType[], schema: GraphQLSchema, dummy?: boolean): GraphQLInputType[] => {
	if (isListType(type)) {
		return [new GraphQLList(new GraphQLNonNull(generateInputs(type.ofType, currInputObjectTypes, schemaInfo, schema, dummy)[0])),
		new GraphQLList(new GraphQLNonNull(generateInputs(type.ofType, currInputObjectTypes, schemaInfo, schema, dummy)[1]))];
	} else if (isNonNullType(type)) {
		return [generateInputs(type.ofType, currInputObjectTypes, schemaInfo, schema, dummy)[0],
		generateInputs(type.ofType, currInputObjectTypes, schemaInfo, schema, dummy)[1]];
	} else {
		const fields = {};
		const name = getInputName(type.name);
		if (!dummy && !currInputObjectTypes.has(name)) {
			if (isUnionType(type)) {
				each(type.getTypes(), unionType => {
					merge(fields, generateFieldsForInput(
						getInputName(unionType.name),
						generateInputs(unionType, currInputObjectTypes, schemaInfo, schema, true)));

					if (!dummy) {
						generateInputs(unionType, currInputObjectTypes, schemaInfo, schema);
					}
				});
			} else if (isObjectType(type)) {
				each(type.getFields(), field => {
					if (field.name !== 'id') {
						merge(fields, generateFieldsForInput(
							field.name,
							isInputType(field.type) ? [field.type, GraphQLID] : generateInputs(field.type, currInputObjectTypes, schemaInfo, schema, true),
							get(schemaInfo[type.name].fields.find((introField) => introField.name === field.name), 'metadata.defaultValue')));
					}
				});
			} else if (isInterfaceType(type)) {
				each(schemaInfo[type.name].possibleTypes, (possibleType) => {
					const schemaType = schema.getType(possibleType.name);

					merge(fields, generateFieldsForInput(
						possibleType.name,
						isInputType(schemaType) ? [schemaType, GraphQLID] : generateInputs(schemaType, currInputObjectTypes, schemaInfo, schema, true),
						get(schemaInfo[type.name].fields.find((introField) => introField.name === possibleType.name), 'metadata.defaultValue')));

					if (!isInputType(schemaType) && !dummy) {
						generateInputs(schemaType, currInputObjectTypes, schemaInfo, schema);
					}

				});
			}

			currInputObjectTypes.set(name, new GraphQLInputObjectType({
				name,
				fields
			}));
			// console.info(printType(newInputObjectTypes.get(name)));
		} else if (dummy) {
			return [new GraphQLInputObjectType({
				name: name,
				fields: {}
			}), GraphQLID];
		}
		return [currInputObjectTypes.get(name), GraphQLID];
	}
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

const stripNonNull = (type: GraphQLOutputType): GraphQLOutputType => {
	if (isNonNullType(type)) {
		return type.ofType;
	} else {
		return type;
	}
};

export const generateArgs = (type: IntrospectionObjectType, currArgs: Map<string, object>,
	currInputObjectTypes: Map<string, GraphQLInputType>,
	schemaInfo: IntrospectionType[], schema: GraphQLSchema, shouldStripNonNull?: boolean): object => {
	if (!currArgs.has(type.name)) {
		const args = {};
		const schemaType = <GraphQLObjectType>schema.getType(type.name);
		each(schemaType.getFields(), field => {
			if (field.name !== 'id') {
				if (isInputType(field.type)) {
					args[field.name] = {
						type: shouldStripNonNull ? stripNonNull(field.type) : field.type,
						defaultValue: get(type.fields.find((introField) => introField.name === field.name), 'metadata.defaultValue')
					};
				} else {
					// console.info('generate input for', field.type);
					merge(args, generateFieldsForInput(
						field.name,
						generateInputs(field.type, currInputObjectTypes, schemaInfo, schema)));

					// console.info(args.get(field.name));
				}
			}

		});

		currArgs.set(type.name, args);
	}

	return currArgs.get(type.name);
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

enum Mutation {
	create,
	update,
	delete
}


const mutateResolver = (mutation: Mutation, dataResolver: DataResolver) => {
	return async (_root: any, _args: { [key: string]: any }, _context: any, _info: GraphQLResolveInfo, key?: string, returnType?: GraphQLOutputType) => {
		// iterate over all the non-id arguments and recursively create new types
		const recursed = key ? true : false;
		if (!returnType) {
			returnType = (<GraphQLObjectType>_info.returnType).getFields().payload.type;
			returnType = <GraphQLOutputType>getReturnGraphQLType(returnType);
		}
		const returnTypeName = getReturnType(returnType);
		const clientMutationId = _args.input && _args.input.clientMutationId ? _args.input.clientMutationId : null;
		const createArgs = _args.create ? _args.create : mutation === Mutation.create && _args.input ? _args.input : null;
		// const updateArgs = _args.update ? _args.update : mutation === Mutation.update && _args.input ? _args.input : null;
		// const deleteArgs = _args.delete ? _args.delete : mutation === Mutation.delete && _args.input ? _args.input : null;
		// const connectArgs = _args.connect ? _args.create : null;
		// const disconnectArgs = _args.disconnect ? _args.disconnect : {};
		const whereArgs = _args.where ? _args.where : _args.input && _args.input.where ? _args.input.where : null;

		if (mutation === Mutation.update || mutation === Mutation.delete) {
			if (!whereArgs) {
				throw new Error(`Cannot ${Mutation[mutation]} without where arguments`);
			}
			let currValue;
			// tslint:disable-next-line:prefer-conditional-expression
			if (whereArgs.id) {
				currValue = await dataResolver.find(returnTypeName, [whereArgs.id]);
			} else {
				currValue = await dataResolver.find(returnTypeName, undefined, {match: whereArgs});
			}
			if (!currValue) {
				throw new Error(`${returnTypeName} does not exist with where args ${JSON.stringify(whereArgs)}`);
			}
		}

		const argPromises = [];
		for (const argName in createArgs) {
			let argReturnType: GraphQLOutputType;
			if ((isObjectType(returnType) || isInterfaceType(returnType)) && returnType.getFields()[argName]) {
				argReturnType = returnType.getFields()[argName].type;
			}
			const argReturnRootType = getReturnGraphQLType(argReturnType);
			if (!isScalarType(argReturnRootType)) {
				const arg = createArgs[argName];
				if (isArray(arg)) {
					each(arg, currArgObj => {
						if (isObject(currArgObj) && argReturnType) {
							argPromises.push(mutateResolver(Mutation.create, dataResolver)(_root, currArgObj, _context, _info, argName, argReturnType));
							createArgs[argName] = [];
						}
					});
				} else if (isObject(arg) && argReturnType) {
					argPromises.push(mutateResolver(Mutation.create, dataResolver)(_root, arg, _context, _info, argName, argReturnType));
					createArgs[argName] = undefined;
				}
			}
		}
		// wait for all the new types to be created
		const createdTypes = await Promise.all(argPromises);

		// setup the arguments to use the new types
		createdTypes.forEach(createdType => {
			const key = createdType.key;
			const id = createdType.id;
			if (isArray(createArgs[key])) {
				if (isArray(id)) {
					createArgs[key] = createArgs[key].concat(id);
				} else {
					createArgs[key].push(id);
				}
			} else {
				createArgs[key] = id;
			}
		});

		// now merge in the existing ids passed in
		const idArgs = pickBy(_args, (__, key) => {
			return endsWith(key, 'Id') || endsWith(key, 'Ids');
		});
		for (const argName in idArgs) {
			const arg = idArgs[argName];
			if (isArray(arg)) {
				const actualArgName = argName.replace('Ids', '');
				_args[actualArgName] = arg.concat(_args[actualArgName]);
			} else {
				const actualArgName = argName.replace('Id', '');
				if (_args[actualArgName]) {
					throw new Error(`Bad mutation\n Input argument contained multiple values for non array field with ${argName} and ${actualArgName}`);
				}
				_args[actualArgName] = arg;
			}
		}

		let dataResult;
		switch (mutation) {
			case Mutation.create:
				dataResult = await dataResolver.create(returnTypeName, createArgs);
				break;

			case Mutation.update:

				dataResult = await dataResolver.update(returnTypeName, _args);
				break;
		}

		let id;
		// if everything was an id no need to create anything new
		id = isArray(dataResult) ? map(dataResult, 'id') : dataResult.id;

		// if key this is recursed else it's the final value
		if (recursed) {
			return { key: key, id: id, created: dataResult };
		} else {
			return {
				payload: dataResult,
				clientMutationId
			};
		}
	};
};


export const createResolver = (dataResolver: DataResolver) => {
	return mutateResolver(Mutation.create, dataResolver);
};

export const updateResolver = (dataResolver: DataResolver) => {
	return mutateResolver(Mutation.update, dataResolver);
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
	'offset': { type: 'Int' },
	'cursor': { type: 'String' }
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
			payload: ${typeName}!
			clientMutationId: String
		}`;
};

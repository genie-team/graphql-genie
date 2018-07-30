import { GraphQLObjectType, GraphQLSchema, GraphQLType, defaultFieldResolver , getNamedType, isEnumType, isInterfaceType, isObjectType, isScalarType, isUnionType } from 'graphql';
import { FindByUniqueError, GeniePlugin, GraphQLGenie, getRecordFromResolverReturn } from 'graphql-genie';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { flattenDeep, get, isArray, isEmpty, omit } from 'lodash';
import graphqlFields from 'graphql-fields';

interface RequiredRoles {
	create: string[];
	read: string[];
	update: string[];
	delete: string[];
}

const fragmentTypesMap = new Map<string, { name: string }[]>();
let genie: GraphQLGenie;
export default (defaultCreateRole = 'ADMIN', defaultReadRole = 'ADMIN', defaultUpdateRole = 'ADMIN', defaultDeleteRole = 'ADMIN'): GeniePlugin => {
	return async (pluginGenie: GraphQLGenie) => {
		genie = pluginGenie;
		let fragmentTypes = await genie.getFragmentTypes();
		fragmentTypes = get(fragmentTypes, '__schema.types');
		if (fragmentTypes) {
			fragmentTypes.forEach(fragmentType => {
				fragmentTypesMap.set(fragmentType.name, fragmentType.possibleTypes);
			});
		}

		const newDefsAsString: string[] = [];
		newDefsAsString.push(`
			directive @auth(
				create: [Role] = [${defaultCreateRole}],
				read: [Role] = [${defaultReadRole}],
				update: [Role] = [${defaultUpdateRole}],
				delete: [Role] = [${defaultDeleteRole}]
				rules: [String!]
			) on OBJECT | FIELD_DEFINITION
		`);

		if (!genie.getSchema().getType('Role') || !isEnumType(genie.getSchema().getType('Role'))) {
			throw new Error('Type Definitions must have Role ENUM');
		}

		// wrap type resolvers
		genie.getSchemaBuilder().addTypeDefsToSchema(newDefsAsString.join('\n'));
		const schema = genie.getSchemaBuilder().getSchema();
		const dataResolver = genie.getDataResolver();
		SchemaDirectiveVisitor.visitSchemaDirectives(schema, {
			auth: AuthDirective,
			authorized: AuthDirective,
			authenticated: AuthDirective,
			requireAuth: AuthDirective,
		});

		// find queries, while the type resolver may solve some of this we want to say not authorized if there is no data and save time and not bother if not allowed
		// also we need to check the arguments so fields can't be deduced based on those
		const queryFields = schema.getQueryType().getFields();
		Object.keys(queryFields).forEach(fieldName => {
			const field = queryFields[fieldName];
			const { resolve = defaultFieldResolver } = field;
			field.resolve = async function (record, args, context, info) {
				if (!context.authenticate) {
					throw new Error('Context must have an authenticate function if using authentication plugin');
				}
				let queryFieldSchemaType = <GraphQLObjectType>getNamedType(field.type);
				if (queryFieldSchemaType.name.endsWith('Connection')) {
					queryFieldSchemaType = <GraphQLObjectType>schema.getType(queryFieldSchemaType.name.replace('Connection', ''));
				}

				const resolveResult = await resolve.apply(this, [record, args, context, info]);
				// check args
				if (!isEmpty(args)) {
					if (!isEmpty(args)) {
						const allowed = await checkArgsFromResolver(queryFieldSchemaType, args, schema, context.authenticate, resolveResult);
						if (!allowed) {
							throw new Error('Not Authorized');
						}
					}
				}

				let topLevelFields = Object.keys(graphqlFields(info));
				// if it's blank we still want to check the type auth so as to not leak that it's just empty
				if (!resolveResult) {
					const requiredRoles = queryFieldSchemaType['_requiredAuth'];
					if (requiredRoles) {
						const allowed = await authenticate(context.authenticate, 'read', requiredRoles, resolveResult, null, queryFieldSchemaType.name);
						if (!allowed) {
							throw new Error('Not Authorized');
						}
					}
					return resolveResult;
				}
				let arrayResults = getRecordFromResolverReturn(resolveResult);
				const checkedTypes = [];
				arrayResults = isArray(arrayResults) ? arrayResults : [arrayResults];
				const checkResultsPromises: Promise<any>[] = [];
				// check the results at the object level
				arrayResults.forEach(result => {

					// if it's a connection type we want to get to the actual data
					result = getRecordFromResolverReturn(result);
					if (result && result.__typename) {
						const typeName = result.__typename;
						if (typeName && !checkedTypes.includes(typeName)) {
							checkedTypes.push(typeName);
							const schemaType = schema.getType(typeName);
							const requiredRoles = schemaType['_requiredAuth'];
							if (requiredRoles) {
								checkResultsPromises.push(authenticate(context.authenticate, 'read', requiredRoles, result, null, schemaType.name));
							}
							// check the results at the field level
							if (isObjectType(schemaType)) {
								const currFields = schemaType.getFields();
								if (isScalarType(queryFieldSchemaType)) {
									topLevelFields = Object.keys(currFields);
								}
								topLevelFields.forEach(fieldName => {
									const currField = currFields[fieldName];
									if (currField) {
										const fieldRequiredRoles = currField['_requiredAuth'];
										if (fieldRequiredRoles) {
											checkResultsPromises.push(authenticate(context.authenticate, 'read', fieldRequiredRoles, result, null, schemaType.name, fieldName));
										}
									}
								});
							}
						}
					}
				});
				const checkResultsAllowed = await Promise.all(checkResultsPromises);
				checkResultsAllowed.forEach(allowed => {
					if (!allowed) {
						throw new Error('Not Authorized');
					}
				});
				return resolveResult;
			};
		});

		// wrap mutations just so we can check when they error

		const mutationFields = schema.getMutationType().getFields();
		Object.keys(mutationFields).forEach(fieldName => {
			const field = mutationFields[fieldName];
			const { resolve = defaultFieldResolver } = field;
			field.resolve = async function (record, args, context, info) {
				if (!context.authenticate) {
					throw new Error('Context must have an authenticate function if using authentication plugin');
				}
				let schemaType = <GraphQLObjectType>getNamedType(field.type);
				if (schemaType.name.endsWith('Connection')) {
					schemaType = <GraphQLObjectType>schema.getType(schemaType.name.replace('Connection', ''));
				}
				let resolveResult;
				try {
					resolveResult = await resolve.apply(this, [record, args, context, info]);
				} catch (e) {
					if (e instanceof FindByUniqueError) {
						const allowed = await checkArgsFromResolver(schema.getType(e.typename), e.arg, schema, context.authenticate, resolveResult);
						if (!allowed) {
							throw new Error('Not Authorized');
						}
					}
					throw e;
				}

				return resolveResult;
			};
		});

		// hooks for create, update, delete
		const typeMap = schema.getTypeMap();
		const types: string[] =  await genie.getUserTypes();
		types.forEach(typeName => {
			const schemaType = <GraphQLObjectType>typeMap[typeName];
			dataResolver.addInputHook(typeName, (context, record, update) => {
				const authFN = context.request.meta.context && context.request.meta.context.authenticate;
				if (!authFN) {
					throw new Error('Context must have an authenticate function if using authentication plugin');
				}
				const checkResultsPromises: Promise<any>[] = [];
				const requiredRoles = schemaType['_requiredAuth'];
				if (requiredRoles) {
					checkResultsPromises.push(authenticate(authFN, context.request.method, requiredRoles, record, update, schemaType.name));
				}
				let fieldsToCheck = [];
				switch (context.request.method) {
					case 'create':
						fieldsToCheck = Object.keys(record);
						break;
					case 'update':
						if (update.replace) {
							fieldsToCheck = fieldsToCheck.concat(Object.keys(update.replace));
						}
						if (update.push) {
							fieldsToCheck = fieldsToCheck.concat(Object.keys(update.push));
						}
						if (update.pull) {
							fieldsToCheck = fieldsToCheck.concat(Object.keys(update.pull));
						}
						break;
				}
				// check the results at the field level
				if (isObjectType(schemaType)) {
					const currFields = schemaType.getFields();
					fieldsToCheck.forEach(fieldName => {
						const currField = currFields[fieldName];
						if (currField) {
							const fieldRequiredRoles = currField['_requiredAuth'];
							if (fieldRequiredRoles) {
								checkResultsPromises.push(authenticate(authFN, context.request.method, fieldRequiredRoles, record, update, schemaType.name, fieldName));
							}
						}
					});
				}

				return new Promise((resolve, reject) => {
					Promise.all(checkResultsPromises).then(checkResultsAllowed => {
						checkResultsAllowed.forEach(allowed => {
							if (!allowed) {
								throw new Error('Not Authorized');
							}
						});
						switch (context.request.method) {
							// If it's a create request, return the record.
							case 'create':
								resolve(record);
								break;
							// If it's an update request, return the update.
							case 'update':
								resolve(update);
								break;
							// If it's a delete request, the return value doesn't matter.
							case 'delete':
								resolve(null);
								break;
						}
					}).catch(reason => {
						reject(reason);
					});
				});

			});
		});
	};
};

const authenticate = async (authFN, method: string, requiredRoles, records, updates, typeName: string, fieldName?: string, isFromFilter = false) => {
	if (requiredRoles) {
		let filterRecords;
		if (!isEmpty(records)) {
			records = isArray(records) ? records : [records];
			filterRecords = [];
			records = records.filter(record => !!record).map(record => {
				if (record) {
					const cache: Map<string, object> = record.cache;
					if (cache) {
						cache.forEach(entry => {
							filterRecords.push(entry);
						});
					}
					return getRecordFromResolverReturn(record);
				}
			});
		}
		return await authFN.call(this, method, requiredRoles, records, filterRecords, updates, typeName, fieldName, isFromFilter);
	} else {
		return true;
	}
};

const checkArgsFromResolver = async (type: GraphQLType, args, schema: GraphQLSchema, authFn, record) => {

	const argPromises: Promise<any>[] = [];

	if (isInterfaceType(type) || isUnionType(type)) {
		if (fragmentTypesMap && fragmentTypesMap.size > 0) {
			const possibleTypes = fragmentTypesMap.get(type.name) || [];
			possibleTypes.forEach(possibleType => {
				argPromises.push(checkArgsFromResolver(schema.getType(possibleType.name), args, schema, authFn, record));
			});
		}
	} else if (isObjectType(type)) {
		if (!isEmpty(args.where)) {
			argPromises.push(checkArgs(type, args.where, schema, authFn, record));
		}
		const identifyingRootFields = omit(args, ['first', 'where', 'orderBy', 'local', 'last', 'skip', 'before', 'after']);
		if (!isEmpty(identifyingRootFields)) {
			argPromises.push(checkArgs(type, {match: identifyingRootFields}, schema, authFn, record));
		}
	}

	const argResults = flattenDeep(await Promise.all(argPromises));
	argResults.forEach(allowed => {
		if (!allowed) {
			return false;
		}
	});
	return true;
};

const checkArgs = async (type: GraphQLObjectType, whereArgs, schema: GraphQLSchema, authFn, record) => {

	const promises: Promise<any>[] = [];
	const typeRequiredRoles = type['_requiredAuth'];

	if (!isEmpty(whereArgs)) {
		if (whereArgs.or) {
			promises.push(checkArgs(type, whereArgs.or, schema, authFn, record));
		}
		if (whereArgs.and) {
			promises.push(checkArgs(type, whereArgs.and, schema, authFn, record));
		}
		const nestedArgs = omit(whereArgs, ['not', 'or', 'and', 'range', 'match', 'exists']);
		const nestedFieldNames = Object.keys(nestedArgs);
		const fieldMap = type.getFields();

		if (!isEmpty(nestedArgs)) {
			nestedFieldNames.forEach(fieldName => {
				const field = fieldMap[fieldName];
				if (field) {
					const fieldRequiredRoles = field['_requiredAuth'];
					const requiredRoles = fieldRequiredRoles || typeRequiredRoles;
					const argReturnType = getNamedType(field.type);
					promises.push(authenticate(authFn, 'read', requiredRoles, record, null, type.name, fieldName, true));
					if (isObjectType(argReturnType)) {
						promises.push(checkArgs(argReturnType, nestedArgs[fieldName], schema, authFn, record));
					} else if (isInterfaceType(argReturnType) || isUnionType(argReturnType)) {
						if (fragmentTypesMap && fragmentTypesMap.size > 0) {
							const possibleTypes = fragmentTypesMap.get(argReturnType.name) || [];
							possibleTypes.forEach(possibleType => {
								promises.push(checkArgs(<GraphQLObjectType>schema.getType(possibleType.name), nestedArgs[fieldName], schema, authFn, record));
							});
						}
					}
				}
			});
		}

		if (!isEmpty(whereArgs.range)) {
			Object.keys(whereArgs.range).forEach(fieldName => {
				const field = fieldMap[fieldName];
				const fieldRequiredRoles = field['_requiredAuth'];
				const requiredRoles = fieldRequiredRoles || typeRequiredRoles;
				promises.push(authenticate(authFn, 'read', requiredRoles, record, null, type.name, fieldName, true));
			});
		}

		if (!isEmpty(whereArgs.match)) {
			Object.keys(whereArgs.match).forEach(fieldName => {
				const field = fieldMap[fieldName];
				const fieldRequiredRoles = field['_requiredAuth'];
				const requiredRoles = fieldRequiredRoles || typeRequiredRoles;
				promises.push(authenticate(authFn, 'read', requiredRoles, record, null, type.name, fieldName, true));
			});
		}

	}
	return await Promise.all(promises);
};

class AuthDirective extends SchemaDirectiveVisitor {
	visitObject(type) {
		this.ensureFieldsWrapped(type);
		type._requiredAuth = {
			create: this.args.create,
			read: this.args.read,
			update: this.args.update,
			delete: this.args.delete,
			rules: this.args.rules
		};
	}
	// Visitor methods for nested types like fields and arguments
	// also receive a details object that provides information about
	// the parent and grandparent types.
	visitFieldDefinition(field, details) {
		this.ensureFieldsWrapped(details.objectType);
		field._requiredAuth = {
			create: this.args.create,
			read: this.args.read,
			update: this.args.update,
			delete: this.args.delete,
			rules: this.args.rules
		};
	}

	ensureFieldsWrapped(objectType: GraphQLObjectType) {
		// Mark the GraphQLObjectType object to avoid re-wrapping:
		if (objectType['_authFieldsWrapped']) return;
		objectType['_authFieldsWrapped'] = true;

		const fields = objectType.getFields();

		Object.keys(fields).forEach(fieldName => {
			const field = fields[fieldName];
			const resolve = field.resolve || defaultFieldResolver;

			field.resolve = async function (record, args, context, info) {
				if (!context.authenticate) {
					throw new Error('Context must have an authenticate function if using authentication plugin');
				}
				// Get the required Role from the field first, falling back
				// to the objectType if no Role is required by the field:
				const requiredRoles: RequiredRoles = field['_requiredAuth'] || objectType['_requiredAuth'];
				if (!requiredRoles) {
					return resolve.apply(this, [record, args, context, info]);
				}
				let allowed = await authenticate(context.authenticate, 'read', requiredRoles, record, null, objectType.name, fieldName);
				if (!isEmpty(args) && allowed) {
					allowed = await checkArgsFromResolver(getNamedType(field.type), args, genie.getSchema(), context.authenticate, record);
				}
				if (!allowed) {
					throw new Error('Not Authorized');
				}

				return resolve.apply(this, [record, args, context, info]);
			};
		});
	}
}

import { GraphQLObjectType, GraphQLSchema, defaultFieldResolver, getNamedType, graphql, isEnumType, isInterfaceType, isObjectType, isUnionType } from 'graphql';
import { GeniePlugin, GraphQLGenie, getRecordFromResolverReturn } from 'graphql-genie';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { flattenDeep, get, isArray, isEmpty, omit } from 'lodash';
import graphqlFields from 'graphql-fields';

interface RequiredRoles {
	create: string[];
	read: string[];
	update: string[];
	delete: string[];
}

export default (defaultCreateRole = 'ADMIN', defaultReadRole = 'ADMIN', defaultUpdateRole = 'ADMIN', defaultDeleteRole = 'ADMIN'): GeniePlugin => {
	return async (genie: GraphQLGenie) => {
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
				let schemaType = <GraphQLObjectType> getNamedType(field.type);
				if (schemaType.name.endsWith('Connection')) {
					schemaType = <GraphQLObjectType> schema.getType(schemaType.name.replace('Connection', ''));
				}

				const resolveResult = await resolve.apply(this, [record, args, context, info]);
				// check args
				if (!isEmpty(args)) {
					const argPromises: Promise<any>[] = [];

					let fragmentTypes = await genie.getFragmentTypes();
					fragmentTypes = get(fragmentTypes, '__schema.types');
					const fragmentTypesMap = new Map<string, {name: string}[]>();
					if (fragmentTypes) {
						fragmentTypes.forEach(fragmentType => {
							fragmentTypesMap.set(fragmentType.name, fragmentType.possibleTypes);
						});
					}
					if (!isEmpty(args.where)) {
						argPromises.push(checkArgs(schemaType, args.where, fragmentTypesMap, schema, context.authenticate, resolveResult ));
					}
					const identifyingRootFields = omit(args, ['first', 'where', 'orderBy', 'local', 'last', 'skip', 'before', 'after']);
					if (!isEmpty(identifyingRootFields)) {
						argPromises.push(checkArgs(schemaType, identifyingRootFields, fragmentTypesMap, schema, context.authenticate, resolveResult ));
					}

					const argResults = flattenDeep(await Promise.all(argPromises));
					argResults.forEach(allowed => {
						if (!allowed) {
							throw new Error('Not Authorized');
						}
					});
				}

				const topLevelFields = Object.keys(graphqlFields(info));
				// if it's blank we still want to check the type auth so as to not leak that it's just empty
				if (!resolveResult) {
					const requiredRoles = schemaType['_requiredAuth'];
					if (requiredRoles) {
						const allowed = await authenticate(context.authenticate, 'read', requiredRoles, resolveResult, null, schemaType.name);
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

		// hooks for create, update, delete
		const typeMap = schema.getTypeMap();
		const nodesResult = await graphql(schema, `{
			__type(name: "Node") {
				possibleTypes {
					name
				}
			}
		}`);
		const nodes = nodesResult.data.__type.possibleTypes;
		nodes.forEach(node => {
			const schemaType = <GraphQLObjectType>typeMap[node.name];
			dataResolver.addInputHook(node.name, (context, record, update) => {
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

const authenticate = async (authFN, method: string, requiredRoles, record, updates, typeName: string, fieldName?: string) => {
	if (requiredRoles) {
		return await authFN.call(this, method, requiredRoles, record, updates, typeName, fieldName);
	} else {
		return true;
	}
};

const checkArgs = async(type: GraphQLObjectType, whereArgs, fragmentTypes: Map<string, {name: string}[]>, schema: GraphQLSchema, authFn, record) => {

	const promises: Promise<any>[] = [];
	const typeRequiredRoles = type['_requiredAuth'];

	if (!isEmpty(whereArgs)) {
		if (whereArgs.or) {
			promises.push(checkArgs(type, whereArgs.or, fragmentTypes, schema, authFn, record));
		}
		if (whereArgs.and) {
			promises.push(checkArgs(type, whereArgs.and, fragmentTypes, schema, authFn, record));
		}
		const nestedArgs = omit(whereArgs, ['not', 'or', 'and', 'range', 'match', 'exists']);
		const nestedFieldNames = Object.keys(nestedArgs);
		const fieldMap = type.getFields();

		if (!isEmpty(nestedArgs)) {
			nestedFieldNames.forEach(fieldName => {
				const field = fieldMap[fieldName];
				const fieldRequiredRoles = field['_requiredAuth'];
				const requiredRoles = fieldRequiredRoles || typeRequiredRoles;
				const argReturnType = getNamedType(field.type);

				promises.push(authenticate(authFn, 'read', requiredRoles, record, null, type.name, fieldName));
				if (isObjectType(argReturnType)) {
					promises.push(checkArgs(argReturnType, nestedArgs[fieldName], fragmentTypes, schema, authFn, record));
				} else if (isInterfaceType(argReturnType) || isUnionType(argReturnType)) {
					const possibleTypes = fragmentTypes.get(argReturnType.name);
					possibleTypes.forEach(possibleType => {
						promises.push(checkArgs(<GraphQLObjectType>schema.getType(possibleType.name), nestedArgs[fieldName], fragmentTypes, schema, authFn, record));
					});
				}
			});
		}

		if (!isEmpty(whereArgs.range)) {
			Object.keys(whereArgs.range).forEach(fieldName => {
				const field = fieldMap[fieldName];
				const fieldRequiredRoles = field['_requiredAuth'];
				const requiredRoles = fieldRequiredRoles || typeRequiredRoles;
				promises.push(authenticate(authFn, 'read', requiredRoles, record, null, type.name, fieldName));
			});
		}

		if (!isEmpty(whereArgs.match)) {
			Object.keys(whereArgs.match).forEach(fieldName => {
				const field = fieldMap[fieldName];
				const fieldRequiredRoles = field['_requiredAuth'];
				const requiredRoles = fieldRequiredRoles || typeRequiredRoles;
				promises.push(authenticate(authFn, 'read', requiredRoles, record, null, type.name, fieldName));
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

	ensureFieldsWrapped(objectType) {
		// Mark the GraphQLObjectType object to avoid re-wrapping:
		if (objectType._authFieldsWrapped) return;
		objectType._authFieldsWrapped = true;

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
				const requiredRoles: RequiredRoles = field._requiredAuth || objectType._requiredAuth;
				if (!requiredRoles) {
					return resolve.apply(this, [record, args, context, info]);
				}
				const allowed = await authenticate(context.authenticate, 'read', requiredRoles, record, null, objectType.name, fieldName);
				if (!allowed) {
					throw new Error('Not Authorized');
				}
				return resolve.apply(this, [record, args, context, info]);
			};
		});
	}
}

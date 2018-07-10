import { GraphQLObjectType, defaultFieldResolver, graphql, isObjectType } from 'graphql';
import { GeniePlugin, GraphQLGenie } from 'graphql-genie';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { isArray } from 'util';
import graphqlFields from 'graphql-fields';

interface RequiredRoles {
	create: string;
	read: string;
	update: string;
	delete: string;
}

export default (roles = ['ADMIN', 'USER', 'OWNER'], defaultCreateRole = 'ADMIN', defaultReadRole = 'ADMIN', defaultUpdateRole = 'ADMIN', defaultDeleteRole = 'ADMIN'): GeniePlugin => {
	return async (genie: GraphQLGenie) => {
		console.log('start auth plugin');
		const schema = genie.getSchema();
		const dataResolver = genie.getDataResolver();
		const newDefsAsString: string[] = [];
		newDefsAsString.push(`
			enum Role {
				${roles.join('\n')}
			}
		`);
		newDefsAsString.push(`
			directive @auth(
				create: Role = ${defaultCreateRole},
				read: Role = ${defaultReadRole},
				update: Role = ${defaultUpdateRole},
				delete: Role = ${defaultDeleteRole}
			) on OBJECT | FIELD_DEFINITION
		`);

		// wrap type resolvers
		genie.getSchemaBuilder().addTypeDefsToSchema(newDefsAsString.join('\n'));
		SchemaDirectiveVisitor.visitSchemaDirectives(schema, {
			auth: AuthDirective,
			authorized: AuthDirective,
			authenticated: AuthDirective,
			requireAuth: AuthDirective,
		});

		// find queries
		const queryFields = schema.getQueryType().getFields();
		Object.keys(queryFields).forEach(fieldName => {
			const field = queryFields[fieldName];
			const { resolve = defaultFieldResolver } = field;
			field.resolve = async function (record, args, context, info) {
				if (!context.authenticate) {
					throw new Error('Context must have an authenticate function if using authentication plugin');
				}
				const topLevelFields = Object.keys(graphqlFields(info));
				const resolveResult = await resolve.apply(this, [record, args, context, info]);
				let arrayResults = resolveResult && resolveResult.fortuneReturn ? resolveResult.fortuneReturn : resolveResult;
				// if it's a connection type we want to get to the actual data
				arrayResults = resolveResult && resolveResult.edges ? resolveResult.edges : resolveResult;

				const checkedTypes = [];
				arrayResults = isArray(arrayResults) ? arrayResults : [arrayResults];
				const checkResultsPromises: Promise<any>[] = [];
				// check the results at the object level
				arrayResults.forEach(result => {
					// if it's a connection type we want to get to the actual data
					result = result.node ? result.node : result;
					const typeName = result.__typename;
					if (typeName && !checkedTypes.includes(typeName)) {
						checkedTypes.push(typeName);
						const schemaType = schema.getType(typeName);
						const requiredRoles = schemaType['_requiredAuth'];
						if (requiredRoles) {
							checkResultsPromises.push(context.authenticate('read', requiredRoles, result, args, context));
						}
						// check the results at the field level
						if (isObjectType(schemaType)) {
							const currFields = schemaType.getFields();
							topLevelFields.forEach(fieldName => {
								const currField = currFields[fieldName];
								if (currField) {
									const fieldRequiredRoles = currField['_requiredAuth'];
									if (fieldRequiredRoles) {
										checkResultsPromises.push(context.authenticate('read', fieldRequiredRoles, result, args, context));
									}
								}
							});
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
				const authenticate = context.request.meta.context && context.request.meta.context.authenticate;
				if (!authenticate) {
					throw new Error('Context must have an authenticate function if using authentication plugin');
				}
				const checkResultsPromises: Promise<any>[] = [];
				const requiredRoles = schemaType['_requiredAuth'];
				if (requiredRoles) {
					checkResultsPromises.push(authenticate(context.request.method, requiredRoles, record));
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
								checkResultsPromises.push(authenticate(context.request.method, fieldRequiredRoles, record));
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

class AuthDirective extends SchemaDirectiveVisitor {
	visitObject(type) {
		this.ensureFieldsWrapped(type);
		type._requiredAuth = {
			create: this.args.create,
			read: this.args.read,
			update: this.args.update,
			delete: this.args.delete
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
			delete: this.args.delete
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
				const allowed = await context.authenticate('read', requiredRoles, record);
				if (!allowed) {
					throw new Error('Not Authorized');
				}
				return resolve.apply(this, [record, args, context, info]);
			};
		});
	}
}

import { GraphQLObjectType, getNamedType, graphql, isNonNullType, isScalarType } from 'graphql';
import { DataResolver, GeniePlugin, GraphQLGenie, filterNested, parseFilter, typeIsList } from 'graphql-genie';
import { PubSub, withFilter } from 'graphql-subscriptions';
import { IResolverObject } from 'graphql-tools';
import { camelCase, get, isEmpty } from 'lodash';
import { isObject } from 'util';

export default (pubsub: PubSub): GeniePlugin => {
	return async (genie: GraphQLGenie) => {
		const schema = genie.getSchema();
		const dataResolver = genie.getDataResolver();
		const newDefsAsString: string[] = [];
		newDefsAsString.push(`
			enum MutationType {
				CREATED
				UPDATED
				DELETED
			}
		`);
		const typeMap = schema.getTypeMap();
		const nodesResult = await graphql(schema, `{
			__type(name: "Node") {
				possibleTypes {
					name
				}
			}
		}`);
		const nodes = nodesResult.data.__type.possibleTypes;
		let subscriptionQueries = '';
		let subscriptionResolvers: IResolverObject = {};
		nodes.forEach(node => {
			const inputName = `${node.name}SubscriptionWhereInput`;
			const payloadName = `${node.name}SubscriptionPayload`;
			const schemaType = <GraphQLObjectType>typeMap[node.name];
			newDefsAsString.push(getInputString(inputName, node.name));
			newDefsAsString.push(getPayloadString(payloadName, node.name, schemaType));


			const fieldName = camelCase(node.name);

			subscriptionQueries += `${fieldName}(where: ${inputName}): ${payloadName}\n`;

			subscriptionResolvers = Object.assign(subscriptionResolvers, getResolver(fieldName, pubsub, schemaType, dataResolver));

			dataResolver.addOutputHook(node.name, (context, record) => {
				switch (context.request.method) {
					case 'create':
					case 'update':
					case 'delete':
						pubsub.publish(fieldName, { context, record });
				}
			});
		});
		newDefsAsString.push(`
		type Subscription {
			${subscriptionQueries}
		}
		`);
		genie.getSchemaBuilder().addTypeDefsToSchema(newDefsAsString.join('\n'));
		genie.getSchemaBuilder().setIResolvers({ 'Subscription': subscriptionResolvers });
	};
};

const getResolver = (name: string, pubsub: PubSub, schemaType: GraphQLObjectType, dataResolver: DataResolver): IResolverObject => {
	return {
		[name]: {
			resolve: ({ context, record }, _args) => {
				// console.log('subscribe resolve', name, context, record, _args);
				const mutation = context.request.method.toUpperCase() + 'D';
				let previousValues;
				if (mutation === 'UPDATED') {
					const payload = get(context, 'request.payload[0]', {});
					const sym = Object.getOwnPropertySymbols(payload).find(function (s) {
						return String(s) === 'Symbol(updateRecord)';
					});
					previousValues = payload[sym];
				}

				return {
					node: record,
					mutation,
					updatedFields: getUpdatedFields(context),
					previousValues
				};
			},
			subscribe: withFilter(() => pubsub.asyncIterator(name), async ({ context, record }, args): Promise<boolean> => {
				let resolve = true;
				if (args) {
					resolve = await subscribeFilter(args, context, record, schemaType, dataResolver);
					const and = get(args, 'where.AND');
					const or = get(args, 'where.OR');
					if (resolve && !isEmpty(and)) {
						const andResults = await Promise.all(and.map(async (arg): Promise<boolean> => {
							return await subscribeFilter({ where: arg }, context, record, schemaType, dataResolver);
						}));
						resolve = andResults.every((val: boolean) => val);
					}

					if (resolve && !isEmpty(or)) {
						const andResults = await Promise.all(or.map(async (arg): Promise<boolean> => {
							return await subscribeFilter({ where: arg }, context, record, schemaType, dataResolver);
						}));
						resolve = andResults.some((val: boolean) => val);
					}
				}
				// console.log('filter');
				// console.log(context, record);
				// console.log(args);
				// console.log('resolve?', resolve);
				return resolve;
			}),
		}
	};
};

const subscribeFilter = async (args, context, record, schemaType: GraphQLObjectType, dataResolver: DataResolver): Promise<boolean> => {
	let resolve = true;
	const mutation = context.request.method.toUpperCase() + 'D';
	const mutation_in = get(args, 'where.mutation_in', ['CREATED', 'UPDATED', 'DELETED']);
	resolve = mutation_in.includes(mutation);
	if (resolve && mutation === 'UPDATED') {
		const updatedFields_contains: string[] = get(args, 'where.updatedFields_contains', []);
		const updatedFields_contains_every: string[] = get(args, 'where.updatedFields_contains_every', []);
		let updatedFields: string[];
		if (!isEmpty(updatedFields_contains) || !isEmpty(updatedFields_contains_every)) {
			updatedFields = getUpdatedFields(context);
		}

		if (!isEmpty(updatedFields_contains_every)) {
			resolve = updatedFields_contains_every.every(fieldName => {
				return updatedFields.includes(fieldName);
			});
		}
		if (resolve && !isEmpty(updatedFields_contains)) {
			resolve = updatedFields_contains.some(fieldName => {
				return updatedFields.includes(fieldName);
			});
		}
	}
	let nodeWhere = get(args, 'where.node');

	if (resolve && nodeWhere) {
		nodeWhere = parseFilter(nodeWhere, schemaType);
		let recordWithWhere = dataResolver.applyOptions(schemaType.name, record, nodeWhere);
		resolve = !isEmpty(recordWithWhere);
		if (resolve) {
			const pullIds = await filterNested(nodeWhere, null, schemaType, recordWithWhere, new Map<string, object>(), dataResolver);
			recordWithWhere = recordWithWhere.filter(entry => !pullIds.has(entry.id));
			resolve = !isEmpty(recordWithWhere);
		}
	}
	return resolve;
};

const getUpdatedFields = (context): string[] => {
	let updatedFields: string[] = null;
	const mutation = context.request.method.toUpperCase() + 'D';
	if (mutation === 'UPDATED') {
		updatedFields = [];
		const update = context.request.payload[0];
		if (isObject(update.pull)) {
			updatedFields.push(...Object.keys(update.pull));
		}
		if (isObject(update.push)) {
			updatedFields.push(...Object.keys(update.push));
		}
		if (isObject(update.replace)) {
			updatedFields.push(...Object.keys(update.replace));
		}
	}
	return updatedFields;
};

const getInputString = (inputName: string, nodeName: string): string => {
	return `
	input ${inputName} {
		"""
		Logical AND on all given filters.
		"""
		AND: [${inputName}!]
		"""
		Logical OR on all given filters.
		"""
		OR: [${inputName}!]
		"""
		The subscription event gets dispatched when it's listed in mutation_in
		"""
		mutation_in: [MutationType!]
		"""
		The subscription event gets only dispatched when one of the updated fields names is included in this list
		"""
		updatedFields_contains: [String!]
		"""
		The subscription event gets only dispatched when all of the field names included in this list have been updated
		"""
		updatedFields_contains_every: [String!]
		node: ${nodeName}WhereInput
	}
`;
};

const getPayloadString = (payloadName: string, nodeName: string, schemaType: GraphQLObjectType): string => {
	let payloadStr = '';
	const fields = schemaType.getFields();
	// build the previousValues type, Scalars return the actual value but other output types return just the id(s)
	let previousValuesFields = '';
	Object.keys(fields).forEach(key => {
		const currField = fields[key];
		const namedType = getNamedType(currField.type);
		if (isScalarType(namedType)) {
			previousValuesFields += `${currField.name}: ${currField.type}
			`;
		} else {
			const isList = typeIsList(currField.type);
			const fieldDescription = `
			"""
			Just the IDs, make a separate to get full type data
			"""`;
			const fieldName = currField.name + '_id' + (isList ? 's' : '');
			// [String!] || String || [String!]!  || String!
			const fieldType = (isList ? '[' : '') + 'String' + (isList ? '!]' : '') + (isNonNullType(currField.type) ? '!' : '');
			previousValuesFields += `
			${fieldDescription}
			${fieldName}: ${fieldType}
			`;
		}
	});

	payloadStr += `
		"""
		Scalars return the actual value but other output types return just the id(s)
		"""
		type ${nodeName}PreviousValues {
			${previousValuesFields}
		}
	`;

	return payloadStr + `
	type ${payloadName} {
		mutation: MutationType!
		node: ${nodeName}
		updatedFields: [String!]
		previousValues: ${nodeName}PreviousValues
	}
`;
};

import { GraphQLObjectType, getNamedType, graphql, isNonNullType, isScalarType } from 'graphql';
import { PubSub, withFilter } from 'graphql-subscriptions';
import { IResolverObject } from 'graphql-tools';
import { get } from 'lodash';
import { GeniePlugin, GraphQLGenie, typeIsList } from '../.';

// enum MutationType {
// 	CREATED,
// 	UPDATED,
// 	DELETED,
// 	CONNECT,
// 	DISCONNECT,
// }
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
		const nodeNames = nodesResult.data.__type.possibleTypes;
		let subscriptionQueries = '';
		let subscriptionResolvers: IResolverObject = {};
		nodeNames.forEach(node => {
			const inputName = `${node.name}SubscriptionWhereInput`;
			const payloadName = `${node.name}SubscriptionPayload`;
			const schemaType = <GraphQLObjectType>typeMap[node.name];
			newDefsAsString.push(getInputString(inputName, node.name));
			newDefsAsString.push(getPayloadString(payloadName, node.name, schemaType));

			subscriptionQueries += `${node.name.toLowerCase()}(where: ${inputName}): ${payloadName}\n`;

			subscriptionResolvers = Object.assign(subscriptionResolvers, getResolver(node.name.toLowerCase(), pubsub));

			dataResolver.addOutputHook(node.name, (context, record) => {
				switch (context.request.method) {
					case 'create':
					case 'update':
					case 'delete':
						pubsub.publish(node.name.toLowerCase(), { context, record });
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

const getResolver = (name: string, pubsub: PubSub): IResolverObject => {
	return {
		[name]: {
			resolve: (payload, args) => {
				console.log('subscribe resolve', name, payload, args);
				return { mutation: 'CREATED' };
			},
			subscribe: withFilter(() => pubsub.asyncIterator(name), ({context, record}, args) => {
				const mutation = context.request.method.toUpperCase() + 'D';
				const mutation_in = get(args, 'where.mutation_in', ['CREATED', 'UPDATED', 'DELETED']);
				console.log('filter');
				console.log(context, record);
				console.log(args);
				return mutation_in.includes(mutation);
			}),
		}
	};
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
		updatedFields_contains: String
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
			Just the IDs, make a separate query would be necessary to get more info than the ID
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

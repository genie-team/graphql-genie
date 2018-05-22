import { GraphQLObjectType, graphql } from 'graphql';
import { GraphQLGenie } from '../.';
import { GeniePlugin } from '../GraphQLGenieInterfaces';

export default (): GeniePlugin => {
	return async (genie: GraphQLGenie) => {
		const schema = genie.getSchema();
		const dataResolver = genie.getDataResolver();
		const newDefsAsString = new Set<string>();
		newDefsAsString.add(`
			enum MutationType {
				CREATED
				UPDATED
				DELETED
				CONNECT
				DISCONNECT
			}
		`);
		const typeMap = schema.getTypeMap();
		const nodesResult = await graphql(this.schema, `{
			__type(name: "Node") {
				possibleTypes {
					name
				}
			}
		}`);
		const nodeNames = nodesResult.data.__type.possibleTypes;
		nodeNames.forEach(node => {
			const inputName = `${node.name}SubscriptionWhereInput`;
			newDefsAsString.add(`
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
					node: ${node.name}FilterInput
				}
			`);
			const schemaType =  <GraphQLObjectType>typeMap[node.name];
			dataResolver.addOutputHook(node.name, (context, record) => {
				switch (context.request.method) {
					// If it's a create request, return the record.
					case 'create': return record;

					// If it's an update request, return the update.
					case 'update': return record;

					// If it's a delete request, the return value doesn't matter.
					case 'delete': return null;
				}
			});
		});

	};
};

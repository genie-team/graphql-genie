import { GraphQLObjectType, graphql } from 'graphql';
import { GraphQLGenie } from '../.';
import { GeniePlugin } from '../GraphQLGenieInterfaces';

export default (): GeniePlugin => {
	return async (genie: GraphQLGenie) => {
		const schema = genie.getSchema();
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
		const nodeTypes: GraphQLObjectType[] = [];
		nodeNames.forEach(result => {
			nodeTypes.push(<GraphQLObjectType>typeMap[result.name]);
		});

	};
};

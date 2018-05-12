import pluralize from 'pluralize';
import { getAllResolver, queryArgs } from './TypeGeneratorUtils';
export class GenerateSubscriptions {
    constructor(dataResolver, objectName, types, $schema, $currOutputObjectTypeDefs) {
        this.dataResolver = dataResolver;
        this.objectName = objectName;
        this.types = types;
        this.schema = $schema;
        this.currOutputObjectTypeDefs = $currOutputObjectTypeDefs;
        this.fields = {};
        this.resolvers = new Map();
        this.edgeResolvers = new Map();
        this.generate();
    }
    generate() {
        this.currOutputObjectTypeDefs.add(`
		type PageInfo {
			hasNextPage: Boolean!
			hasPreviousPage: Boolean!
			startCursor: String
			endCursor: String
		}
	`);
        this.types.forEach(type => {
            const fieldName = `${pluralize(type.name.toLowerCase())}Connection`;
            this.currOutputObjectTypeDefs.add(`
				type ${type.name}Connection {
					edges: [${type.name}Edge]
					pageInfo: PageInfo
					aggregate: ${type.name}Aggregate
				}
			`);
            this.currOutputObjectTypeDefs.add(`
				type ${type.name}Aggregate {
					count: Int!
				}
			`);
            this.currOutputObjectTypeDefs.add(`
				type ${type.name}Edge {
					node: ${type.name}!
					cursor: String!
				}
			`);
            this.fields[fieldName] = {
                type: `${type.name}Connection`,
                args: queryArgs
            };
            this.resolvers.set(fieldName, getAllResolver(this.dataResolver, this.schema, type, true));
            const edgeFieldResolvers = new Map();
            edgeFieldResolvers.set('node', (root) => {
                return root;
            });
            edgeFieldResolvers.set('cursor', (root) => {
                const fortuneReturn = root && root.fortuneReturn ? root.fortuneReturn : root;
                return fortuneReturn.id;
            });
            this.edgeResolvers.set(`${type.name}Edge`, edgeFieldResolvers);
        });
    }
    getResolvers() {
        return new Map([[this.objectName, this.resolvers], ...this.edgeResolvers]);
    }
    getFieldsOnObject() {
        return new Map([[this.objectName, this.fields]]);
    }
}
//# sourceMappingURL=GenerateSubscriptions.js.map
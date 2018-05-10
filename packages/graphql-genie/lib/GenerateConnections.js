import pluralize from 'pluralize';
import { InputGenerator } from './InputGenerator';
import { getAllResolver, queryArgs } from './TypeGeneratorUtils';
export class GenerateConnections {
    constructor(dataResolver, objectName, types, $schema, $currOutputObjectTypeDefs, $currInputObjectTypes, $schemaInfo, $relations) {
        this.dataResolver = dataResolver;
        this.objectName = objectName;
        this.types = types;
        this.schema = $schema;
        this.currOutputObjectTypeDefs = $currOutputObjectTypeDefs;
        this.currInputObjectTypes = $currInputObjectTypes;
        this.schemaInfo = $schemaInfo;
        this.relations = $relations;
        this.fields = {};
        this.resolvers = new Map();
        this.edgeResolvers = new Map();
        this.currOutputObjectTypeDefs.add(`
			type PageInfo {
				hasNextPage: Boolean!
				hasPreviousPage: Boolean!
				startCursor: String
				endCursor: String
			}
		`);
        this.generate();
    }
    generate() {
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
            const schemaType = this.schema.getType(type.name);
            const generator = new InputGenerator(schemaType, null, this.currInputObjectTypes, this.schemaInfo, this.schema, this.relations);
            const args = Object.assign({
                filter: { type: generator.generateFilterInput(this.dataResolver.getFeatures().logicalOperators) },
                orderBy: { type: generator.generateOrderByInput() }
            }, queryArgs);
            this.fields[fieldName] = {
                type: `${type.name}Connection`,
                args
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
//# sourceMappingURL=GenerateConnections.js.map
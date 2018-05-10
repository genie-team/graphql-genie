import pluralize from 'pluralize';
import { InputGenerator } from './InputGenerator';
import { getAllResolver, queryArgs } from './TypeGeneratorUtils';
export class GenerateGetAll {
    constructor(dataResolver, objectName, types, $schema, $currInputObjectTypes, $schemaInfo, $relations) {
        this.dataResolver = dataResolver;
        this.objectName = objectName;
        this.types = types;
        this.schema = $schema;
        this.currInputObjectTypes = $currInputObjectTypes;
        this.schemaInfo = $schemaInfo;
        this.relations = $relations;
        this.fields = {};
        this.resolvers = new Map();
        this.generate();
    }
    generate() {
        this.types.forEach(type => {
            const schemaType = this.schema.getType(type.name);
            const generator = new InputGenerator(schemaType, null, this.currInputObjectTypes, this.schemaInfo, this.schema, this.relations);
            const args = Object.assign({
                filter: { type: generator.generateFilterInput(this.dataResolver.getFeatures().logicalOperators) },
                orderBy: { type: generator.generateOrderByInput() }
            }, queryArgs);
            const fieldName = `${pluralize(type.name.toLowerCase())}`;
            this.fields[fieldName] = {
                type: `[${type.name}]`,
                args
            };
            this.resolvers.set(fieldName, getAllResolver(this.dataResolver, this.schema, type));
        });
    }
    getResolvers() {
        return new Map([[this.objectName, this.resolvers]]);
    }
    getFieldsOnObject() {
        return new Map([[this.objectName, this.fields]]);
    }
}
//# sourceMappingURL=GenerateGetAll.js.map
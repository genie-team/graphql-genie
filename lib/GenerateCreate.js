import { GraphQLInputObjectType, GraphQLNonNull, GraphQLString } from 'graphql';
import { InputGenerator } from './InputGenerator';
import { createResolver, getPayloadTypeDef, getPayloadTypeName } from './TypeGeneratorUtils';
export class GenerateCreate {
    constructor(dataResolver, objectName, types, $config, currInputObjectTypes, currOutputObjectTypeDefs, schemaInfo, schema, relations) {
        this.dataResolver = dataResolver;
        this.objectName = objectName;
        this.types = types;
        this.config = $config;
        this.currInputObjectTypes = currInputObjectTypes;
        this.currOutputObjectTypeDefs = currOutputObjectTypeDefs;
        this.schema = schema;
        this.schemaInfo = schemaInfo;
        this.relations = relations;
        this.fields = {};
        this.resolvers = new Map();
        this.generate();
    }
    generate() {
        console.log('generate create');
        this.types.forEach(type => {
            const args = {};
            const createInputName = `Create${type.name}MutationInput`;
            const createInput = new GraphQLInputObjectType({
                name: createInputName,
                fields: {
                    data: { type: new GraphQLNonNull(new InputGenerator(this.schema.getType(type.name), this.config, this.currInputObjectTypes, this.schemaInfo, this.schema, this.relations).generateCreateInput()) },
                    clientMutationId: { type: GraphQLString }
                }
            });
            this.currInputObjectTypes.set(createInputName, createInput);
            args['input'] = {
                type: new GraphQLNonNull(createInput)
            };
            const outputTypeName = getPayloadTypeName(type.name);
            this.fields[`create${type.name}`] = {
                type: outputTypeName,
                args: args
            };
            this.currOutputObjectTypeDefs.add(getPayloadTypeDef(type.name));
            this.resolvers.set(`create${type.name}`, createResolver(this.dataResolver));
        });
    }
    getResolvers() {
        return new Map([[this.objectName, this.resolvers]]);
    }
    getFieldsOnObject() {
        return new Map([[this.objectName, this.fields]]);
    }
}
//# sourceMappingURL=GenerateCreate.js.map
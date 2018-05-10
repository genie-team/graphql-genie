import { GraphQLInputObjectType, GraphQLNonNull, GraphQLString } from 'graphql';
import { getPayloadTypeDef, getPayloadTypeName, upsertResolver } from './TypeGeneratorUtils';
import { InputGenerator } from './InputGenerator';
export class GenerateUpsert {
    constructor(dataResolver, objectName, types, $config, currInputObjectTypes, currOutputObjectTypeDefs, schemaInfo, schema, $relations) {
        this.dataResolver = dataResolver;
        this.objectName = objectName;
        this.types = types;
        this.config = $config;
        this.currInputObjectTypes = currInputObjectTypes;
        this.currOutputObjectTypeDefs = currOutputObjectTypeDefs;
        this.schema = schema;
        this.schemaInfo = schemaInfo;
        this.relations = $relations;
        this.fields = {};
        this.resolvers = new Map();
        this.generate();
    }
    generate() {
        this.types.forEach(type => {
            const args = {};
            const generator = new InputGenerator(this.schema.getType(type.name), this.config, this.currInputObjectTypes, this.schemaInfo, this.schema, this.relations);
            const upsertInputName = `Upsert${type.name}MutationInput`;
            const upsertInput = new GraphQLInputObjectType({
                name: upsertInputName,
                fields: {
                    create: { type: new GraphQLNonNull(generator.generateCreateInput()) },
                    update: { type: new GraphQLNonNull(generator.generateUpdateInput()) },
                    where: { type: new GraphQLNonNull(generator.generateWhereUniqueInput()) },
                    clientMutationId: { type: GraphQLString }
                }
            });
            this.currInputObjectTypes.set(upsertInputName, upsertInput);
            args['input'] = {
                type: new GraphQLNonNull(upsertInput)
            };
            const outputTypeName = getPayloadTypeName(type.name);
            this.fields[`upsert${type.name}`] = {
                type: outputTypeName,
                args: args
            };
            this.currOutputObjectTypeDefs.add(getPayloadTypeDef(type.name));
            this.resolvers.set(`upsert${type.name}`, upsertResolver(this.dataResolver));
        });
    }
    getResolvers() {
        return new Map([[this.objectName, this.resolvers]]);
    }
    getFieldsOnObject() {
        return new Map([[this.objectName, this.fields]]);
    }
}
//# sourceMappingURL=GenerateUpsert.js.map
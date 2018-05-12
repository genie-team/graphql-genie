var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { GraphQLInputObjectType, GraphQLNonNull, GraphQLString } from 'graphql';
import pluralize from 'pluralize';
import { InputGenerator } from './InputGenerator';
import { deleteResolver, getPayloadTypeDef, getPayloadTypeName, parseFilter } from './TypeGeneratorUtils';
export class GenerateDelete {
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
            const deleteInputName = `Delete${type.name}MutationInput`;
            const deleteInput = new GraphQLInputObjectType({
                name: deleteInputName,
                fields: {
                    where: { type: new GraphQLNonNull(generator.generateWhereUniqueInput()) },
                    clientMutationId: { type: GraphQLString }
                }
            });
            this.currInputObjectTypes.set(deleteInputName, deleteInput);
            args['input'] = {
                type: new GraphQLNonNull(deleteInput)
            };
            const outputTypeName = getPayloadTypeName(type.name);
            this.fields[`delete${type.name}`] = {
                type: outputTypeName,
                args: args
            };
            this.currOutputObjectTypeDefs.add(getPayloadTypeDef(type.name));
            this.resolvers.set(`delete${type.name}`, deleteResolver(this.dataResolver));
            // DELETE MANY
            const deleteManyInputName = `DeleteMany${pluralize(type.name)}MutationInput`;
            const deleteManyInput = new GraphQLInputObjectType({
                name: deleteManyInputName,
                fields: {
                    filter: { type: new GraphQLNonNull(generator.generateFilterInput(this.dataResolver.getFeatures().logicalOperators)) },
                    clientMutationId: { type: GraphQLString }
                }
            });
            this.currInputObjectTypes.set(deleteManyInputName, deleteManyInput);
            const manyArgs = {};
            manyArgs['input'] = {
                type: new GraphQLNonNull(deleteManyInput)
            };
            this.fields[`deleteMany${pluralize(type.name)}`] = {
                type: 'BatchPayload',
                args: manyArgs
            };
            this.resolvers.set(`deleteMany${pluralize(type.name)}`, (_root, _args) => __awaiter(this, void 0, void 0, function* () {
                let count = 0;
                const clientMutationId = _args.input && _args.input.clientMutationId ? _args.input.clientMutationId : '';
                const filter = _args.input && _args.input.filter ? _args.input.filter : '';
                if (filter) {
                    const schemaType = this.schema.getType(type.name);
                    const options = parseFilter(filter, schemaType);
                    let fortuneReturn = yield this.dataResolver.find(type.name, null, options);
                    count = fortuneReturn.length;
                    fortuneReturn = fortuneReturn.map((value) => {
                        return value.id;
                    });
                    yield this.dataResolver.delete(type.name, fortuneReturn);
                }
                return {
                    count,
                    clientMutationId
                };
            }));
        });
    }
    getResolvers() {
        return new Map([[this.objectName, this.resolvers]]);
    }
    getFieldsOnObject() {
        return new Map([[this.objectName, this.fields]]);
    }
}
//# sourceMappingURL=GenerateDelete.js.map
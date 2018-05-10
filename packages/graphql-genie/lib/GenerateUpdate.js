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
import { getPayloadTypeDef, getPayloadTypeName, parseFilter, updateResolver } from './TypeGeneratorUtils';
export class GenerateUpdate {
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
            const schemaType = this.schema.getType(type.name);
            const generator = new InputGenerator(schemaType, this.config, this.currInputObjectTypes, this.schemaInfo, this.schema, this.relations);
            const updateInputName = `Update${type.name}MutationInput`;
            const updateInput = new GraphQLInputObjectType({
                name: updateInputName,
                fields: {
                    data: { type: new GraphQLNonNull(generator.generateUpdateInput()) },
                    where: { type: new GraphQLNonNull(generator.generateWhereUniqueInput()) },
                    clientMutationId: { type: GraphQLString }
                }
            });
            this.currInputObjectTypes.set(updateInputName, updateInput);
            args['input'] = {
                type: new GraphQLNonNull(updateInput)
            };
            const outputTypeName = getPayloadTypeName(type.name);
            this.fields[`update${type.name}`] = {
                type: outputTypeName,
                args: args
            };
            this.currOutputObjectTypeDefs.add(getPayloadTypeDef(type.name));
            this.resolvers.set(`update${type.name}`, updateResolver(this.dataResolver));
            // UPDATE MANY
            const updateManyInputName = `UpdateMany${pluralize(type.name)}MutationInput`;
            const updateManyInput = new GraphQLInputObjectType({
                name: updateManyInputName,
                fields: {
                    data: { type: new GraphQLNonNull(generator.generateUpdateInput()) },
                    filter: { type: new GraphQLNonNull(generator.generateFilterInput(this.dataResolver.getFeatures().logicalOperators)) },
                    clientMutationId: { type: GraphQLString }
                }
            });
            this.currInputObjectTypes.set(updateManyInputName, updateManyInput);
            const manyArgs = {};
            manyArgs['input'] = {
                type: new GraphQLNonNull(updateManyInput)
            };
            this.fields[`updateMany${pluralize(type.name)}`] = {
                type: 'BatchPayload',
                args: manyArgs
            };
            this.resolvers.set(`updateMany${pluralize(type.name)}`, (_root, _args, _context, _info) => __awaiter(this, void 0, void 0, function* () {
                let count = 0;
                const clientMutationId = _args.input && _args.input.clientMutationId ? _args.input.clientMutationId : '';
                const filter = _args.input && _args.input.filter ? _args.input.filter : '';
                const updateArgs = _args.input && _args.input.data ? _args.input.data : '';
                if (filter && updateArgs) {
                    const options = parseFilter(filter, schemaType);
                    const fortuneReturn = yield this.dataResolver.find(type.name, null, options);
                    count = fortuneReturn.length;
                    yield Promise.all(fortuneReturn.map((fortuneRecord) => __awaiter(this, void 0, void 0, function* () {
                        return yield updateResolver(this.dataResolver)(fortuneRecord, { update: updateArgs, where: true }, _context, _info, null, null, schemaType);
                    })));
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
//# sourceMappingURL=GenerateUpdate.js.map
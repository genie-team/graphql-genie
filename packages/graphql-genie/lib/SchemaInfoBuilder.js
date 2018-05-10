var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getIntrospectionQuery, graphql } from 'graphql';
import { concat, each, findIndex, get, includes, keys, mapKeys, omit, omitBy, set, startsWith } from 'lodash';
export default class SchemaInfoBuilder {
    constructor(schema) {
        this.schema = schema;
    }
    getSchemaInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.schemaInfo) {
                this.schemaInfo = yield this.buildSchemaInfo(this.schema);
            }
            return this.schemaInfo;
        });
    }
    addDirectiveFromAST(astDirective, schemaInfo, path) {
        const name = astDirective.name.value;
        const args = [];
        each(astDirective.arguments, arg => {
            args.push(Object.assign({ name: arg.name.value }, omit(arg.value, ['loc'])));
        });
        const directives = get(schemaInfo, path) ? get(schemaInfo, path) : [];
        directives.push({ name: name, args: args });
        set(schemaInfo, path, directives);
    }
    buildSchemaInfo(schema) {
        return __awaiter(this, void 0, void 0, function* () {
            let originalSchemaInfo = yield graphql(schema, getIntrospectionQuery({ descriptions: true }));
            originalSchemaInfo = originalSchemaInfo.data;
            let schemaInfo = originalSchemaInfo;
            schemaInfo = omitBy(schemaInfo.__schema.types, (value) => {
                return startsWith(value.name, '__') || includes(['Boolean', 'String', 'ID', 'Int', 'Float'], value.name);
            });
            schemaInfo = mapKeys(schemaInfo, (type) => type.name);
            each(keys(schemaInfo), (typeName) => {
                const type = schemaInfo[typeName];
                // directives on type
                each(get(schema.getType(typeName), 'astNode.directives'), (astDirective) => {
                    this.addDirectiveFromAST(astDirective, schemaInfo, `${typeName}.directives`);
                });
                // directives on fields
                each(get(schema.getType(typeName), 'astNode.fields'), (field) => {
                    const fieldName = field.name.value;
                    each(get(field, 'directives'), (astDirective) => {
                        const fieldIndex = findIndex(get(schemaInfo, `${typeName}.fields`), { 'name': fieldName });
                        this.addDirectiveFromAST(astDirective, schemaInfo, `${typeName}.fields[${fieldIndex}].directives`);
                    });
                });
                // metadata on type
                set(schemaInfo, `${typeName}.metadata`, omit(get(schema, `_typeMap.${typeName}`), ['astNode', 'name', 'description', 'extensionASTNodes', 'isTypeOf', '_fields', '_interfaces', '_typeConfig', 'getFields', 'getInterfaces', 'toString', 'inspect', 'toJSON', '_enumConfig', 'getValue', 'getValues', 'parseLiteral', 'parseValue', 'getValue', 'serialize', '_getNameLookup', '_getValueLookup', '_values', 'resolveType', 'getTypes', '_types']));
                // metadata of fields
                each(get(schema, `_typeMap.${typeName}._fields`), (field) => {
                    const fieldIndex = findIndex(get(schemaInfo, `${typeName}.fields`), { 'name': field.name });
                    set(schemaInfo, `${typeName}.fields[${fieldIndex}].metadata`, omit(field, ['type', 'description', 'args', 'deprecationReason', 'astNode', 'isDeprecated', 'name']));
                });
                // add unions to types
                if (type.kind === 'UNION') {
                    each(type.possibleTypes, possibleType => {
                        schemaInfo[possibleType.name].unions = schemaInfo[possibleType.name].unions ? schemaInfo[possibleType.name].unions : [];
                        schemaInfo[possibleType.name].unions = concat(schemaInfo[possibleType.name].unions, [{ kind: type.kind, name: type.name, ofType: type.ofType }]);
                    });
                }
            });
            return schemaInfo;
        });
    }
}
//# sourceMappingURL=SchemaInfoBuilder.js.map
import { GraphQLSchema, IntrospectionType } from 'graphql';
export default class SchemaInfoBuilder {
    private schema;
    private schemaInfo;
    constructor(schema: GraphQLSchema);
    getSchemaInfo(): Promise<IntrospectionType[]>;
    private addDirectiveFromAST(astDirective, schemaInfo, path);
    private buildSchemaInfo(schema);
}

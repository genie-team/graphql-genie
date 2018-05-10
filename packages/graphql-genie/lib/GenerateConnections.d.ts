import { GraphQLFieldResolver, GraphQLInputType, GraphQLSchema, IntrospectionObjectType, IntrospectionType } from 'graphql';
import { DataResolver, TypeGenerator } from './GraphQLGenieInterfaces';
import { Relations } from './TypeGeneratorUtils';
export declare class GenerateConnections implements TypeGenerator {
    private objectName;
    private types;
    private schema;
    private dataResolver;
    private fields;
    private resolvers;
    private edgeResolvers;
    private currOutputObjectTypeDefs;
    private currInputObjectTypes;
    private schemaInfo;
    private relations;
    constructor(dataResolver: DataResolver, objectName: string, types: IntrospectionObjectType[], $schema: GraphQLSchema, $currOutputObjectTypeDefs: Set<string>, $currInputObjectTypes: Map<string, GraphQLInputType>, $schemaInfo: IntrospectionType[], $relations: Relations);
    generate(): void;
    getResolvers(): Map<string, Map<string, GraphQLFieldResolver<any, any>>>;
    getFieldsOnObject(): Map<string, object>;
}

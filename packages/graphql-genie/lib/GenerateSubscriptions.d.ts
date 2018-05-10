import { GraphQLFieldResolver, GraphQLSchema, IntrospectionObjectType } from 'graphql';
import { DataResolver, TypeGenerator } from './GraphQLGenieInterfaces';
export declare class GenerateSubscriptions implements TypeGenerator {
    private objectName;
    private types;
    private schema;
    private dataResolver;
    private fields;
    private resolvers;
    private edgeResolvers;
    private currOutputObjectTypeDefs;
    constructor(dataResolver: DataResolver, objectName: string, types: IntrospectionObjectType[], $schema: GraphQLSchema, $currOutputObjectTypeDefs: Set<string>);
    generate(): void;
    getResolvers(): Map<string, Map<string, GraphQLFieldResolver<any, any>>>;
    getFieldsOnObject(): Map<string, object>;
}

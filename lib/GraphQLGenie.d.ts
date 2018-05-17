import { IntrospectionResultData } from 'apollo-cache-inmemory';
import { GraphQLSchema } from 'graphql';
import { DataResolver, GeniePlugin, GraphQLGenieOptions } from './GraphQLGenieInterfaces';
import { GraphQLSchemaBuilder } from './GraphQLSchemaBuilder';
export declare class GraphQLGenie {
    private fortuneOptions;
    private config;
    private generators;
    private schema;
    private schemaBuilder;
    private schemaInfo;
    private schemaInfoBuilder;
    private relations;
    private graphQLFortune;
    private plugins;
    ready: boolean;
    constructor(options: GraphQLGenieOptions);
    private validate;
    init: () => Promise<GraphQLGenie>;
    private buildResolvers;
    private buildQueries;
    use: (plugin: GeniePlugin) => void;
    getSchema: () => GraphQLSchema;
    getDataResolver: () => DataResolver;
    getSchemaBuilder: () => GraphQLSchemaBuilder;
    getFragmentTypes: () => Promise<IntrospectionResultData>;
}

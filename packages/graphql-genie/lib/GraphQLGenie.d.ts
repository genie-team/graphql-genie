import { IntrospectionResultData } from 'apollo-cache-inmemory';
import { GraphQLSchema } from 'graphql';
import { DataResolver, GraphQLGenieOptions } from './GraphQLGenieInterfaces';
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
    private initialized;
    constructor(options: GraphQLGenieOptions);
    private validate;
    private init;
    private buildResolvers;
    buildQueries: () => Promise<void>;
    getSchema: () => Promise<GraphQLSchema>;
    getDataResolver: () => Promise<DataResolver>;
    getFragmentTypes: () => Promise<IntrospectionResultData>;
}

import { IntrospectionResultData } from 'apollo-cache-inmemory';
import { GraphQLSchema } from 'graphql';
import FortuneGraph from './FortuneGraph';
import { GraphQLGenieOptions } from './GraphQLGenieInterfaces';
export default class GraphQLGenie {
    private fortuneOptions;
    private config;
    private generators;
    private schema;
    private schemaBuilder;
    private schemaInfo;
    private schemaInfoBuilder;
    private relations;
    graphQLFortune: FortuneGraph;
    private initialized;
    constructor(options: GraphQLGenieOptions);
    private validate;
    private init;
    private buildResolvers;
    buildQueries: () => Promise<void>;
    getSchema: () => Promise<GraphQLSchema>;
    getFragmentTypes: () => Promise<IntrospectionResultData>;
}

import { GraphQLFieldResolver } from 'graphql';
import { GraphQLSchemaBuilder } from './GraphQLSchemaBuilder';
export interface TypeGenerator {
    getResolvers(): Map<string, Map<string, GraphQLFieldResolver<any, any>>>;
    getFieldsOnObject(): Map<string, object>;
}
export interface Aggregate {
    count: number;
}
export interface PageInfo {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
}
export declare class Connection {
    edges: any[];
    aggregate: Aggregate;
    pageInfo: PageInfo;
    constructor();
}
export interface Features {
    logicalOperators: boolean;
}
export interface DataResolver {
    getLink(graphQLTypeName: string, field: string): string;
    delete(graphQLTypeName: string, ids?: string[], include?: any, meta?: any): Promise<any>;
    update(graphQLTypeName: string, updates: object, meta?: any, options?: object): Promise<any>;
    find(graphQLTypeName: string, ids?: string[], options?: any, include?: any, meta?: any): Promise<any>;
    create(graphQLTypeName: string, records: any, include?: any, meta?: any): Promise<any>;
    getValueByUnique(returnTypeName: string, args: any): Promise<Object>;
    canAdd(graphQLTypeName: string, records: Object): Promise<boolean>;
    getConnection(allEdges: any[], before: string, after: string, first: number, last: number): Connection;
    getFeatures(): Features;
    applyOptions(graphQLTypeName: string, records: any, options: any, meta?: any): any;
}
export interface GenerateConfig {
    generateGetAll?: boolean;
    generateCreate?: boolean;
    generateUpdate?: boolean;
    generateDelete?: boolean;
    generateUpsert?: boolean;
    generateConnections?: boolean;
    generateSubscriptions?: boolean;
}
export interface GraphQLGenieOptions {
    schemaBuilder?: GraphQLSchemaBuilder;
    typeDefs?: string;
    generatorOptions?: GenerateConfig;
    fortuneOptions: FortuneOptions;
}
export interface FortuneSettings {
    enforceLinks?: boolean;
    name?: string;
    description?: string;
}
export interface FortuneOptions {
    adapter?: any;
    hooks?: object;
    documentation?: object;
    settings: FortuneSettings;
}

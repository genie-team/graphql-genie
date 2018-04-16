import {GraphQLFieldResolver } from 'graphql';
import GraphQLSchemaBuilder from './GraphQLSchemaBuilder';
export interface TypeGenerator {
	getResolvers(): Map<string, Map<string, GraphQLFieldResolver<any, any>>>;
	getFieldsOnObject(): Map<string, object>;
}

export interface DataResolver {
	getLink(graphQLTypeName: string, field: string): string;
	delete(graphQLTypeName: string, ids?: [string], include?, meta?): Promise<any>;
	update(graphQLTypeName: string, updates: object, meta?, options?: object): Promise<any>;
	find(graphQLTypeName: string, ids?: [string], options?, include?, meta?): Promise<any>;
	create(graphQLTypeName: string, records, include?, meta?): Promise<any>;
}

export interface GenerateConfig {
	generateGetAll?: boolean;
	generateGetAllMeta?: boolean;
	generateGetSingle?: boolean;
	generateCreate?: boolean;
	generateUpdate?: boolean;
	generateDelete?: boolean;
	generateAddToRelation?: boolean;
	generateRemoveFromRelation?: boolean;
	generateSetRelation?: boolean;
	generateUnsetRelation?: boolean;
	generateIntegrationFields?: boolean;
	generateCustomMutationFields?: boolean;
	generateCustomQueryFields?: boolean;
	includeSubscription?: boolean;
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

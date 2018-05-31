import { GraphQLFieldResolver } from 'graphql';
import { GraphQLGenie } from '.';
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
export class Connection {
	edges: any[];
	aggregate: Aggregate;
	pageInfo: PageInfo;

	constructor() {
		this.aggregate = {
			count: -1
		};
		this.pageInfo = {
			hasNextPage: false,
			hasPreviousPage: false,
			startCursor: '',
			endCursor: ''
		};
	}

}

export interface Features {
	logicalOperators: boolean;
}
export interface DataResolver {
	getLink(graphQLTypeName: string, field: string): string;
	delete(graphQLTypeName: string, ids?: string[], include?, meta?): Promise<any>;
	update(graphQLTypeName: string, updates: object, meta?, options?: object): Promise<any>;
	find(graphQLTypeName: string, ids?: string[], options?, include?, meta?): Promise<any>;
	create(graphQLTypeName: string, records, include?, meta?): Promise<any>;
	getValueByUnique(returnTypeName: string, args): Promise<Object>;
	canAdd(graphQLTypeName: string, records: Object): Promise<boolean>;
	getConnection(allEdges: any[], before: string, after: string, first: number, last: number): Connection;
	getFeatures(): Features;
	applyOptions(graphQLTypeName: string, records, options, meta?);
	getStore(): any;
	addOutputHook(graphQLTypeName: string, hook: DataResolverOutputHook);
	addInputHook(graphQLTypeName: string, hook: DataResolverInputHook);
	beginTransaction(): Promise<void>;
	endTransaction(): Promise<void>;
}

export interface GenerateConfig {
	generateGetAll?: boolean;
	generateCreate?: boolean;
	generateUpdate?: boolean;
	generateDelete?: boolean;
	generateUpsert?: boolean;
	generateConnections?: boolean;
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

export interface GeniePlugin {
	(genie: GraphQLGenie): any;
}

export interface DataResolverInputHook {
	(context?, record?, update?): any;
}
export interface DataResolverOutputHook {
	(context?, record?): any;
}

import { DocumentNode, GraphQLFieldResolver } from 'graphql';
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
	create(graphQLTypeName: string, records, meta?): Promise<any>;
	find(graphQLTypeName: string, ids?: string[], options?, meta?): Promise<any>;
	update(graphQLTypeName: string, updates: object, meta?, options?: object): Promise<any>;
	delete(graphQLTypeName: string, ids?: string[], meta?): Promise<any>;
	addOutputHook(graphQLTypeName: string, hook: DataResolverOutputHook);
	addInputHook(graphQLTypeName: string, hook: DataResolverInputHook);
	getValueByUnique(returnTypeName: string, args, meta): Promise<Object>;
	canAdd(graphQLTypeName: string, records: Object, meta): Promise<boolean>;
	getConnection(allEdges: any[], before: string, after: string, first: number, last: number): Connection;
	getFeatures(): Features;
	applyOptions(graphQLTypeName: string, records, options, meta?);
	getStore(): any;
	beginTransaction(): Promise<void>;
	endTransaction(): Promise<void>;
	computeId(graphType: string, id?: string): string;
	getTypeFromId(inputId: string): string;
	getOriginalIdFromObjectId(inputId: string): string;
	getLink(graphQLTypeName: string, field: string): string;
}

export interface GenerateConfig {
	generateGetOne?: boolean; // GraphQL API will have a singular queries using unique fields
	generateGetAll?: boolean; // GraphQL API will have a Query to get all of a type, with filters
	generateCreate?: boolean; // GraphQL API will have a Mutation to create new data of each type
	generateUpdate?: boolean; // GraphQL API will have a Mutation to update data of each type
	generateDelete?: boolean; // GraphQL API will have a Mutation to delete data of each type
	generateUpsert?: boolean; // GraphQL API will have a Mutation to upsert data of each type
	generateConnections?: boolean; // GraphQL API will have a Query to get all of a type, with filters, that returns a Connection rather than simple array
	generateMigrations?: boolean; // a Query exportData and a Mutation importData will be created
}

export interface GraphQLGenieOptions {
	schemaBuilder?: GraphQLSchemaBuilder;
	typeDefs?: string | DocumentNode;
	generatorOptions?: GenerateConfig;
	fortuneOptions?: FortuneOptions;
	plugins?: GeniePlugin[] | GeniePlugin;
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
	settings?: FortuneSettings;
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

export type GenericObject = { [key: string]: any };

import {GraphQLFieldResolver } from "graphql";

export interface TypeGenerator {
	getResolvers(): Map<string, Map<string, GraphQLFieldResolver<any, any>>>
	getFieldsOnObject(): Map<string, object>
}

export interface DataResolver {
	getLink(graphQLTypeName: string, field: string): string
	delete(graphQLTypeName: string, ids?: [string], include?, meta?): Promise<any>
	update(graphQLTypeName: string, updates, include?, meta?): Promise<any>
	find(graphQLTypeName: string, ids?: [string], options?, include?, meta?): Promise<any>
	create(graphQLTypeName: string, records, include?, meta?): Promise<any>
}
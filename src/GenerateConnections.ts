
import { GraphQLFieldResolver, GraphQLInputType, GraphQLSchema, IntrospectionObjectType, IntrospectionType } from 'graphql';
import pluralize from 'pluralize';
import { DataResolver, TypeGenerator } from './GraphQLGenieInterfaces';
import { InputGenerator } from './InputGenerator';
import { Relations, getAllResolver, queryArgs } from './TypeGeneratorUtils';

export class GenerateConnections implements TypeGenerator {
	private objectName: string;
	private types: IntrospectionObjectType[];
	private schema: GraphQLSchema;
	private dataResolver: DataResolver;
	private fields: object;
	private resolvers: Map<string, GraphQLFieldResolver<any, any>>;
	private edgeResolvers: Map<string, Map<string, GraphQLFieldResolver<any, any>>>;
	private currOutputObjectTypeDefs: Set<string>;
	private currInputObjectTypes: Map<string, GraphQLInputType>;
	private schemaInfo: IntrospectionType[];
	private relations: Relations;
	constructor(dataResolver: DataResolver, objectName: string,
		types: IntrospectionObjectType[], $schema: GraphQLSchema,
		$currOutputObjectTypeDefs: Set<string>,
		$currInputObjectTypes: Map<string, GraphQLInputType>,
		$schemaInfo: IntrospectionType[],
		$relations: Relations) {
		this.dataResolver = dataResolver;
		this.objectName = objectName;
		this.types = types;
		this.schema = $schema;
		this.currOutputObjectTypeDefs = $currOutputObjectTypeDefs;
		this.currInputObjectTypes = $currInputObjectTypes;
		this.schemaInfo = $schemaInfo;
		this.relations = $relations;
		this.fields = {};
		this.resolvers = new Map<string, GraphQLFieldResolver<any, any>>();
		this.edgeResolvers = new Map<string, Map<string, GraphQLFieldResolver<any, any>>>();

		this.currOutputObjectTypeDefs.add(`
			type PageInfo {
				hasNextPage: Boolean!
				hasPreviousPage: Boolean!
				startCursor: String
				endCursor: String
			}
		`);

		this.generate();
	}

	generate() {
		this.types.forEach(type => {
			const fieldName = `${pluralize(type.name.toLowerCase())}Connection`;
			this.currOutputObjectTypeDefs.add(`
				type ${type.name}Connection {
					edges: [${type.name}Edge]
					pageInfo: PageInfo
					aggregate: ${type.name}Aggregate
				}
			`);

			this.currOutputObjectTypeDefs.add(`
				type ${type.name}Aggregate {
					count: Int!
				}
			`);

			this.currOutputObjectTypeDefs.add(`
				type ${type.name}Edge {
					node: ${type.name}!
					cursor: String!
				}
			`);

			const schemaType = this.schema.getType(type.name);
			const generator = new InputGenerator(schemaType, null, this.currInputObjectTypes, this.schemaInfo, this.schema, this.relations);
			const args = Object.assign({
				filter: {type: generator.generateFilterInput(this.dataResolver.getFeatures().logicalOperators)},
				sort: {type: generator.generateSortInput()}
			}, queryArgs);

			this.fields[fieldName] = {
				type: `${type.name}Connection`,
				args
			};

			this.resolvers.set(fieldName, getAllResolver(this.dataResolver, this.schema, type, true));

			const edgeFieldResolvers = new Map<string, GraphQLFieldResolver<any, any>>();

			edgeFieldResolvers.set('node', (
				root: any
			): any => {
				return root;
			});

			edgeFieldResolvers.set('cursor', (
				root: any
			): any => {
				const fortuneReturn = root && root.fortuneReturn ? root.fortuneReturn : root;
				return fortuneReturn.id;
			});

			this.edgeResolvers.set(`${type.name}Edge`, edgeFieldResolvers);
		});
	}

	public getResolvers(): Map<string, Map<string, GraphQLFieldResolver<any, any>>> {
		return new Map([[this.objectName, this.resolvers], ...this.edgeResolvers]);
	}

	public getFieldsOnObject(): Map<string, object> {
		return new Map([[this.objectName, this.fields]]);
	}

}

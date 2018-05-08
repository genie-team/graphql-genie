
import { GraphQLFieldResolver, GraphQLSchema, IntrospectionObjectType } from 'graphql';
import pluralize from 'pluralize';
import { DataResolver, TypeGenerator } from './GraphQLGenieInterfaces';
import { getAllResolver, queryArgs } from './TypeGeneratorUtils';

export class GenerateSubscriptions implements TypeGenerator {
	private objectName: string;
	private types: IntrospectionObjectType[];
	private schema: GraphQLSchema;
	private dataResolver: DataResolver;
	private fields: object;
	private resolvers: Map<string, GraphQLFieldResolver<any, any>>;
	private edgeResolvers: Map<string, Map<string, GraphQLFieldResolver<any, any>>>;
	private currOutputObjectTypeDefs: Set<string>;

	constructor(dataResolver: DataResolver, objectName: string,
		types: IntrospectionObjectType[], $schema: GraphQLSchema,
		$currOutputObjectTypeDefs: Set<string>) {
		this.dataResolver = dataResolver;
		this.objectName = objectName;
		this.types = types;
		this.schema = $schema;
		this.currOutputObjectTypeDefs = $currOutputObjectTypeDefs;
		this.fields = {};
		this.resolvers = new Map<string, GraphQLFieldResolver<any, any>>();
		this.edgeResolvers = new Map<string, Map<string, GraphQLFieldResolver<any, any>>>();
		this.generate();
	}

	generate() {

		this.currOutputObjectTypeDefs.add(`
		type PageInfo {
			hasNextPage: Boolean!
			hasPreviousPage: Boolean!
			startCursor: String
			endCursor: String
		}
	`);
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

			this.fields[fieldName] = {
				type: `${type.name}Connection`,
				args: queryArgs
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

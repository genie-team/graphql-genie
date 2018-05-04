
import { DataResolver, TypeGenerator } from './GraphQLGenieInterfaces';
import { GraphQLFieldResolver, GraphQLSchema, IntrospectionObjectType } from 'graphql';
import pluralize from 'pluralize';
import { filterArgs, getAllResolver } from './TypeGeneratorUtils';

export class GenerateConnections implements TypeGenerator {
	private objectName: string;
	private types: IntrospectionObjectType[];
	private schema: GraphQLSchema;
	private dataResolver: DataResolver;
	private fields: object;
	private resolvers: Map<string, GraphQLFieldResolver<any, any>>;
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

			this.fields[fieldName] = {
				type: `${type.name}Connection`,
				args: filterArgs
			};

			this.resolvers.set(fieldName, getAllResolver(this.dataResolver, this.schema, type, true));
		});
	}


	public getResolvers(): Map<string, Map<string, GraphQLFieldResolver<any, any>>> {
		return new Map([[this.objectName, this.resolvers]]);
	}

	public getFieldsOnObject(): Map<string, object> {
		return new Map([[this.objectName, this.fields]]);
	}

}

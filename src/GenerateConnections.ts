
import { GraphQLFieldResolver, GraphQLInputObjectType, GraphQLInputType, GraphQLSchema, IntrospectionObjectType, IntrospectionType, isInterfaceType, isUnionType } from 'graphql';
import pluralize from 'pluralize';
import { DataResolver, TypeGenerator } from './GraphQLGenieInterfaces';
import { InputGenerator } from './InputGenerator';
import { getAllResolver, getRootMatchFields, queryArgs, Relations } from './TypeGeneratorUtilities';

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
			"""
			Information about pagination in a connection.
			"""
			type PageInfo {
				"""
				When paginating forwards, are there more items?
				"""
				hasNextPage: Boolean!
				"""
				When paginating backwards, are there more items?
				"""
				hasPreviousPage: Boolean!
				"""
				When paginating backwards, the cursor to continue.
				"""
				startCursor: String
				"""
				When paginating forwards, the cursor to continue.
				"""
				endCursor: String
			}
		`);

		this.generate();
	}

	generate() {
		Object.keys(this.schema.getTypeMap()).forEach(typeName => {
			const type = this.schema.getType(typeName);
			if (isInterfaceType(type) || isUnionType(type)) {
				this.createNewTypes(typeName);
			}
		});

		this.types.forEach(type => {
			const fieldName = `${pluralize(type.name.toLowerCase())}Connection`;

			this.createNewTypes(type.name);

			const schemaType = this.schema.getType(type.name);
			const generator = new InputGenerator(schemaType, null, this.currInputObjectTypes, this.schemaInfo, this.schema, this.relations);
			const args = Object.assign({
				where: {type: generator.generateWhereInput(this.dataResolver.getFeatures().logicalOperators)},
				orderBy: {type: generator.generateOrderByInput()}
			},
			queryArgs,
			getRootMatchFields((<GraphQLInputObjectType>this.currInputObjectTypes.get(`${type.name}MatchInput`))));

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

	private createNewTypes(typeName: string) {
		this.currOutputObjectTypeDefs.add(`
		"""
		A connection to a list of items.
		"""
		type ${typeName}Connection {
			"""
			A list of edges.
			"""
			edges: [${typeName}Edge]
			"""
			Information to aid in pagination.
			"""
			pageInfo: PageInfo
			"""
			Meta information
			"""
			aggregate: ${typeName}Aggregate
		}
	`);

	this.currOutputObjectTypeDefs.add(`
		type ${typeName}Aggregate {
			"""
			The total number that match the where clause
			"""
			count: Int!
		}
	`);

	this.currOutputObjectTypeDefs.add(`
		type ${typeName}Edge {
			node: ${typeName}!
			cursor: String!
		}
	`);
	}
}

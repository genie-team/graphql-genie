
import { GraphQLFieldResolver, GraphQLInputType, GraphQLSchema, IntrospectionObjectType, IntrospectionType } from 'graphql';
import pluralize from 'pluralize';
import { DataResolver, TypeGenerator } from './GraphQLGenieInterfaces';
import { InputGenerator } from './InputGenerator';
import { Relations, getAllResolver, queryArgs } from './TypeGeneratorUtils';

export class GenerateGetAll implements TypeGenerator {
	private objectName: string;
	private types: IntrospectionObjectType[];
	private schema: GraphQLSchema;
	private dataResolver: DataResolver;
	private fields: object;
	private resolvers: Map<string, GraphQLFieldResolver<any, any>>;
	private currInputObjectTypes: Map<string, GraphQLInputType>;
	private schemaInfo: IntrospectionType[];
	private relations: Relations;

	constructor(dataResolver: DataResolver, objectName: string, types: IntrospectionObjectType[], $schema: GraphQLSchema,
		$currInputObjectTypes: Map<string, GraphQLInputType>,
		$schemaInfo: IntrospectionType[],
		$relations: Relations) {
		this.dataResolver = dataResolver;
		this.objectName = objectName;
		this.types = types;
		this.schema = $schema;
		this.currInputObjectTypes = $currInputObjectTypes;
		this.schemaInfo = $schemaInfo;
		this.relations = $relations;
		this.fields = {};
		this.resolvers = new Map<string, GraphQLFieldResolver<any, any>>();
		this.generate();
	}

	generate() {
		this.types.forEach(type => {

			const schemaType = this.schema.getType(type.name);
			const generator = new InputGenerator(schemaType, null, this.currInputObjectTypes, this.schemaInfo, this.schema, this.relations);
			const args = Object.assign({
				filter: {type: generator.generateFilterInput(this.dataResolver.getFeatures().logicalOperators)},
				orderBy: {type: generator.generateOrderByInput()}
			}, queryArgs);

			const fieldName = `${pluralize(type.name.toLowerCase())}`;

			this.fields[fieldName] = {
				type: `[${type.name}]`,
				args
			};

			this.resolvers.set(fieldName, getAllResolver(this.dataResolver, this.schema, type));
		});
	}

	public getResolvers(): Map<string, Map<string, GraphQLFieldResolver<any, any>>> {
		return new Map([[this.objectName, this.resolvers]]);
	}

	public getFieldsOnObject(): Map<string, object> {
		return new Map([[this.objectName, this.fields]]);
	}

}

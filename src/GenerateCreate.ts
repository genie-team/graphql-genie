
import { TypeGenerator, DataResolver } from './TypeGeneratorInterface';
import { GraphQLFieldResolver, IntrospectionObjectType, GraphQLInputType, GraphQLSchema, IntrospectionType } from 'graphql';
import { generateArgs, createResolver } from './TypeGeneratorUtils';

export class GenerateCreate implements TypeGenerator {
	private objectName: string;
	private types: IntrospectionObjectType[];
	private dataResolver: DataResolver;
	private schema: GraphQLSchema
	private fields: object;
	private resolvers: Map<string, GraphQLFieldResolver<any, any>>;
	private createArgs: Map<string, object>;
	private currInputObjectTypes: Map<string, GraphQLInputType>
	private schemaInfo: IntrospectionType[];
	constructor(dataResolver: DataResolver, objectName: string, types: IntrospectionObjectType[], currInputObjectTypes: Map<string, GraphQLInputType>, schemaInfo: IntrospectionType[], schema: GraphQLSchema) {
		this.dataResolver = dataResolver;
		this.objectName = objectName;
		this.types = types;
		this.currInputObjectTypes = currInputObjectTypes;
		this.schema = schema;
		this.schemaInfo = schemaInfo;

		this.fields = {};
		this.resolvers = new Map<string, GraphQLFieldResolver<any, any>>();
		this.createArgs = new Map<string, object>();
		this.generate();
	}

	generate() {
		this.types.forEach(type => {
			const args = generateArgs(type, this.createArgs, this.currInputObjectTypes, this.schemaInfo, this.schema);
			this.fields[`create${type.name}`] = {
				type: type.name,
				args: args
			};
			this.resolvers.set(`create${type.name}`, createResolver(this.dataResolver));
		});
	
	}

	public getResolvers(): Map<string, Map<string, GraphQLFieldResolver<any, any>>> {
		return new Map([[this.objectName, this.resolvers]]);
	}

	public getFieldsOnObject(): Map<string, object> {
		return new Map([[this.objectName, this.fields]]);
	}

}
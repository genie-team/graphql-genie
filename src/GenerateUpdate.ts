
import { DataResolver, TypeGenerator } from './GraphQLGenieInterfaces';
import { GraphQLFieldResolver, GraphQLID, GraphQLInputType, GraphQLNonNull, GraphQLSchema, IntrospectionObjectType, IntrospectionType } from 'graphql';
import { generateArgs, updateResolver } from './TypeGeneratorUtils';

export class GenerateUpdate implements TypeGenerator {
	private objectName: string;
	private types: IntrospectionObjectType[];
	private dataResolver: DataResolver;
	private schema: GraphQLSchema;
	private fields: object;
	private resolvers: Map<string, GraphQLFieldResolver<any, any>>;
	private updateArgs: Map<string, object>;
	private currInputObjectTypes: Map<string, GraphQLInputType>;
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
		this.updateArgs = new Map<string, object>();
		this.generate();
	}

	generate() {
		this.types.forEach(type => {
			const args = {};
			args['id'] = {
				type: new GraphQLNonNull(GraphQLID)
			};
			Object.assign(args, generateArgs(type, this.updateArgs, this.currInputObjectTypes, this.schemaInfo, this.schema, true));

			this.fields[`update${type.name}`] = {
				type: type.name,
				args: args
			};
			this.resolvers.set(`update${type.name}`, updateResolver(this.dataResolver));
		});

	}

	public getResolvers(): Map<string, Map<string, GraphQLFieldResolver<any, any>>> {
		return new Map([[this.objectName, this.resolvers]]);
	}

	public getFieldsOnObject(): Map<string, object> {
		return new Map([[this.objectName, this.fields]]);
	}

}

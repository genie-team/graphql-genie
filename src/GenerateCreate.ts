
import { DataResolver, TypeGenerator } from './GraphQLGenieInterfaces';
import { GraphQLFieldResolver, GraphQLInputType, GraphQLSchema, IntrospectionObjectType, IntrospectionType, GraphQLString } from 'graphql';
import { Relations, createResolver} from './TypeGeneratorUtils';
import { InputGenerator } from './InputGenerator';

export class GenerateCreate implements TypeGenerator {
	private objectName: string;
	private types: IntrospectionObjectType[];
	private dataResolver: DataResolver;
	private schema: GraphQLSchema;
	private fields: object;
	private resolvers: Map<string, GraphQLFieldResolver<any, any>>;
	private currInputObjectTypes: Map<string, GraphQLInputType>;
	private schemaInfo: IntrospectionType[];
	private relations: Relations;
	constructor(dataResolver: DataResolver, objectName: string, types: IntrospectionObjectType[],
		currInputObjectTypes: Map<string, GraphQLInputType>, schemaInfo: IntrospectionType[], schema: GraphQLSchema, relations: Relations) {
		this.dataResolver = dataResolver;
		this.objectName = objectName;
		this.types = types;
		this.currInputObjectTypes = currInputObjectTypes;
		this.schema = schema;
		this.schemaInfo = schemaInfo;
		this.relations = relations;

		this.fields = {};
		this.resolvers = new Map<string, GraphQLFieldResolver<any, any>>();
		this.generate();
	}

	generate() {
		console.log('generate create');
		this.types.forEach(type => {
			console.log(type.name);
			const args = {};
			args['input'] = {type: new InputGenerator(this.schema.getType(type.name), this.currInputObjectTypes, this.schemaInfo, this.schema, this.relations).generateCreateInput({clientMutationId: {type: GraphQLString}})};
			console.log(args);
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


import { DataResolver, GenerateConfig, TypeGenerator } from './GraphQLGenieInterfaces';
import { GraphQLFieldResolver, GraphQLInputObjectType, GraphQLInputType, GraphQLNonNull, GraphQLSchema, GraphQLString, IntrospectionObjectType, IntrospectionType } from 'graphql';
import { Relations, createResolver, getPayloadTypeDef, getPayloadTypeName} from './TypeGeneratorUtils';
import { InputGenerator } from './InputGenerator';

export class GenerateCreate implements TypeGenerator {
	private objectName: string;
	private types: IntrospectionObjectType[];
	private config: GenerateConfig;
	private dataResolver: DataResolver;
	private schema: GraphQLSchema;
	private fields: object;
	private resolvers: Map<string, GraphQLFieldResolver<any, any>>;
	private currInputObjectTypes: Map<string, GraphQLInputType>;
	private currOutputObjectTypeDefs: Set<string>;
	private schemaInfo: IntrospectionType[];
	private relations: Relations;
	constructor(dataResolver: DataResolver, objectName: string, types: IntrospectionObjectType[], $config: GenerateConfig,
		currInputObjectTypes: Map<string, GraphQLInputType>,
		currOutputObjectTypeDefs: Set<string>,
		schemaInfo: IntrospectionType[],
		schema: GraphQLSchema, relations: Relations) {
		this.dataResolver = dataResolver;
		this.objectName = objectName;
		this.types = types;
		this.config = $config;
		this.currInputObjectTypes = currInputObjectTypes;
		this.currOutputObjectTypeDefs = currOutputObjectTypeDefs;
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
			const args = {};

			const createInputName = `Create${type.name}MutationInput`;
			const createInput =  new GraphQLInputObjectType({
				name: createInputName,
				fields: {
					data: {type: new GraphQLNonNull(new InputGenerator(this.schema.getType(type.name), this.config, this.currInputObjectTypes, this.schemaInfo, this.schema, this.relations).generateCreateInput())},
					clientMutationId: {type: GraphQLString}
				}
			});

			this.currInputObjectTypes.set(createInputName, createInput);
			args['input'] = {
				type: new GraphQLNonNull(createInput)
			};
			const outputTypeName = getPayloadTypeName(type.name);
			this.fields[`create${type.name}`] = {
				type: outputTypeName,
				args: args
			};
			this.currOutputObjectTypeDefs.add(getPayloadTypeDef(type.name));



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

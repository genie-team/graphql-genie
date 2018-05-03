
import { DataResolver, GenerateConfig, TypeGenerator } from './GraphQLGenieInterfaces';
import { GraphQLFieldResolver, GraphQLInputObjectType, GraphQLInputType,
	GraphQLNonNull, GraphQLSchema, GraphQLString, IntrospectionObjectType, IntrospectionType } from 'graphql';
import {Relations,  deleteResolver, getPayloadTypeDef, getPayloadTypeName} from './TypeGeneratorUtils';
import { InputGenerator } from './InputGenerator';

export class GenerateDelete implements TypeGenerator {
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
		schemaInfo: IntrospectionType[], schema: GraphQLSchema, $relations: Relations) {
		this.dataResolver = dataResolver;
		this.objectName = objectName;
		this.types = types;
		this.config = $config;
		this.currInputObjectTypes = currInputObjectTypes;
		this.currOutputObjectTypeDefs = currOutputObjectTypeDefs;
		this.schema = schema;
		this.schemaInfo = schemaInfo;
		this.relations = $relations;

		this.fields = {};
		this.resolvers = new Map<string, GraphQLFieldResolver<any, any>>();
		this.generate();
	}

	generate() {
		this.types.forEach(type => {
			const args = {};

			const generator = new InputGenerator(this.schema.getType(type.name), this.config, this.currInputObjectTypes, this.schemaInfo, this.schema, this.relations);
			const deleteInputName = `Delete${type.name}MutationInput`;
			const deleteInput =  new GraphQLInputObjectType({
				name: deleteInputName,
				fields: {
					where: {type: new GraphQLNonNull(generator.generateWhereUniqueInput())},
					clientMutationId: {type: GraphQLString}
				}
			});
			this.currInputObjectTypes.set(deleteInputName, deleteInput);
			args['input'] = {
				type: new GraphQLNonNull(deleteInput)
			};

			const outputTypeName = getPayloadTypeName(type.name);
			this.fields[`delete${type.name}`] = {
				type: outputTypeName,
				args: args
			};
			this.currOutputObjectTypeDefs.add(getPayloadTypeDef(type.name));
			this.resolvers.set(`delete${type.name}`, deleteResolver(this.dataResolver));
		});

	}

	public getResolvers(): Map<string, Map<string, GraphQLFieldResolver<any, any>>> {
		return new Map([[this.objectName, this.resolvers]]);
	}

	public getFieldsOnObject(): Map<string, object> {
		return new Map([[this.objectName, this.fields]]);
	}

}

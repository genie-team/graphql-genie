
import { GraphQLFieldResolver, GraphQLInputObjectType, GraphQLInputType, GraphQLNonNull, GraphQLSchema, GraphQLString, IntrospectionObjectType, IntrospectionType } from 'graphql';
import pluralize from 'pluralize';
import { DataResolver, GenerateConfig, TypeGenerator } from './GraphQLGenieInterfaces';
import { InputGenerator } from './InputGenerator';
import { Relations, deleteResolver, getPayloadTypeDef, getPayloadTypeName, getRootMatchFields, moveArgsIntoWhere, parseFilter } from './TypeGeneratorUtils';

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
			const deleteInput = new GraphQLInputObjectType({
				name: deleteInputName,
				fields: {
					where: { type: new GraphQLNonNull(generator.generateWhereUniqueInput()) },
					clientMutationId: { type: GraphQLString }
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

			// DELETE MANY
			const deleteManyInputName = `DeleteMany${pluralize(type.name)}MutationInput`;
			const deleteManyInput = new GraphQLInputObjectType({
				name: deleteManyInputName,
				fields: Object.assign({
					where: { type: new GraphQLNonNull(generator.generateWhereInput(this.dataResolver.getFeatures().logicalOperators)) },
					clientMutationId: { type: GraphQLString }
				},
				getRootMatchFields((<GraphQLInputObjectType>this.currInputObjectTypes.get(`${type.name}MatchInput`)))
			)
			});
			this.currInputObjectTypes.set(deleteManyInputName, deleteManyInput);

			const manyArgs = {};
			manyArgs['input'] = {
				type: new GraphQLNonNull(deleteManyInput)
			};
			this.fields[`deleteMany${pluralize(type.name)}`] = {
				type: 'BatchPayload',
				args: manyArgs
			};

			this.resolvers.set(`deleteMany${pluralize(type.name)}`, async (
				_root: any,
				_args: { [key: string]: any }
			): Promise<any> => {
				let count = 0;
				const clientMutationId = _args.input && _args.input.clientMutationId ? _args.input.clientMutationId : '';
				_args = moveArgsIntoWhere(_args);
				const filter = _args.input && _args.input.where ? _args.input.where : '';
				if (filter) {
					const schemaType = this.schema.getType(type.name);
					const options = parseFilter(filter, schemaType);
					let fortuneReturn: Array<any> = await this.dataResolver.find(type.name, null, options);
					count = fortuneReturn.length;
					fortuneReturn = fortuneReturn.map((value) => {
						return value.id;
					});
					await this.dataResolver.delete(type.name, fortuneReturn);
				}
				return {
					count,
					clientMutationId
				};
			});
		});

	}

	public getResolvers(): Map<string, Map<string, GraphQLFieldResolver<any, any>>> {
		return new Map([[this.objectName, this.resolvers]]);
	}

	public getFieldsOnObject(): Map<string, object> {
		return new Map([[this.objectName, this.fields]]);
	}

}

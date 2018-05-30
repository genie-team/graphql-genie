
import { GraphQLFieldResolver, GraphQLInputObjectType, GraphQLInputType, GraphQLNonNull, GraphQLOutputType, GraphQLSchema, GraphQLString, IntrospectionObjectType, IntrospectionType } from 'graphql';
import pluralize from 'pluralize';
import { DataResolver, GenerateConfig, TypeGenerator } from './GraphQLGenieInterfaces';
import { InputGenerator } from './InputGenerator';
import { Relations, getPayloadTypeDef, getPayloadTypeName, parseFilter, updateResolver } from './TypeGeneratorUtilities';

export class GenerateUpdate implements TypeGenerator {
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
			const schemaType = this.schema.getType(type.name);

			const generator = new InputGenerator(schemaType, this.config, this.currInputObjectTypes, this.schemaInfo, this.schema, this.relations);
			const updateInputName = `Update${type.name}MutationInput`;
			const updateInput = new GraphQLInputObjectType({
				name: updateInputName,
				fields: {
					data: { type: new GraphQLNonNull(generator.generateUpdateInput()) },
					where: { type: new GraphQLNonNull(generator.generateWhereUniqueInput()) },
					clientMutationId: { type: GraphQLString }
				}
			});
			this.currInputObjectTypes.set(updateInputName, updateInput);
			args['input'] = {
				type: new GraphQLNonNull(updateInput)
			};

			const outputTypeName = getPayloadTypeName(type.name);
			this.fields[`update${type.name}`] = {
				type: outputTypeName,
				args: args
			};
			this.currOutputObjectTypeDefs.add(getPayloadTypeDef(type.name));
			this.resolvers.set(`update${type.name}`, updateResolver(this.dataResolver));

			// UPDATE MANY
			const updateManyInputName = `UpdateMany${pluralize(type.name)}MutationInput`;
			const updateManyInput = new GraphQLInputObjectType({
				name: updateManyInputName,
				fields: {
					data: { type: new GraphQLNonNull(generator.generateUpdateInput()) },
					where: Object.assign(
						{ type: new GraphQLNonNull(generator.generateWhereInput(this.dataResolver.getFeatures().logicalOperators)) },
					),
					clientMutationId: { type: GraphQLString }
				}
			});
			this.currInputObjectTypes.set(updateManyInputName, updateManyInput);

			const manyArgs = {};
			manyArgs['input'] = {
				type: new GraphQLNonNull(updateManyInput)
			};
			this.fields[`updateMany${pluralize(type.name)}`] = {
				type: 'BatchPayload',
				args: manyArgs
			};

			this.resolvers.set(`updateMany${pluralize(type.name)}`, async (
				_root: any,
				_args: { [key: string]: any },
				_context: any,
				_info: any
			): Promise<any> => {
				let count = 0;
				const clientMutationId = _args.input && _args.input.clientMutationId ? _args.input.clientMutationId : '';
				const filter = _args.input && _args.input.where ? _args.input.where : '';
				const updateArgs = _args.input && _args.input.data ? _args.input.data : '';
				if (filter && updateArgs) {
					const options = parseFilter(filter, schemaType);
					const fortuneReturn: Array<any> = await this.dataResolver.find(type.name, null, options);
					count = fortuneReturn.length;
					await Promise.all(fortuneReturn.map(async (fortuneRecord) => {
						return await updateResolver(this.dataResolver)(fortuneRecord, { update: updateArgs, where: true }, _context, _info, null, null, <GraphQLOutputType>schemaType);
					}));
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

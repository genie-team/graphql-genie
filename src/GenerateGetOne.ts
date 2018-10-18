
import { GraphQLError, GraphQLFieldResolver, GraphQLInputType, GraphQLSchema, IntrospectionObjectType, IntrospectionType } from 'graphql';
import * as pluralize from 'pluralize';
import { DataResolver, TypeGenerator } from './GraphQLGenieInterfaces';
import { InputGenerator } from './InputGenerator';
import { Relations, getAllResolver, getRootMatchFields } from './TypeGeneratorUtilities';
import { camelCase, isArray, isEmpty } from 'lodash';
import { GenerateGetAll } from './GenerateGetAll';

export class GenerateGetOne implements TypeGenerator {
	private objectName: string;
	private types: IntrospectionObjectType[];
	private schema: GraphQLSchema;
	private dataResolver: DataResolver;
	private fields: object;
	private resolvers: Map<string, GraphQLFieldResolver<any, any>>;
	private currInputObjectTypes: Map<string, GraphQLInputType>;
	private schemaInfo: IntrospectionType[];
	private relations: Relations;
	private getAllResolvers: Map<string, GraphQLFieldResolver<any, any>>;
	constructor(dataResolver: DataResolver, objectName: string, types: IntrospectionObjectType[], $schema: GraphQLSchema,
		$currInputObjectTypes: Map<string, GraphQLInputType>,
		$schemaInfo: IntrospectionType[],
		$relations: Relations,
		$getAll: GenerateGetAll) {
		this.dataResolver = dataResolver;
		this.objectName = objectName;
		this.types = types;
		this.schema = $schema;
		this.currInputObjectTypes = $currInputObjectTypes;
		this.schemaInfo = $schemaInfo;
		this.relations = $relations;
		this.fields = {};
		this.resolvers = new Map<string, GraphQLFieldResolver<any, any>>();
		this.getAllResolvers = $getAll && $getAll.resolvers ? $getAll.resolvers : new Map<string, GraphQLFieldResolver<any, any>>();

		this.generate();
	}

	generate() {

		this.types.forEach(type => {
			const schemaType = this.schema.getType(type.name);
			const generator = new InputGenerator(schemaType, null, this.currInputObjectTypes, this.schemaInfo, this.schema, this.relations);
			const args = Object.assign(
				{
					where: { type: generator.generateWhereUniqueInput() }
				},
				getRootMatchFields(generator.generateWhereUniqueInput())
			);

			const fieldName = `${camelCase(type.name)}`;
			const allFieldName = `${camelCase(pluralize(type.name))}`;

			this.fields[fieldName] = {
				type: `${type.name}`,
				args
			};

			const allResolver = this.getAllResolvers.get(allFieldName) || getAllResolver(this.dataResolver, this.schema, type);

			this.resolvers.set(fieldName, async (root: any, args: { [key: string]: any }, context, info) => {
				if (isEmpty(args)) {
					throw new GraphQLError('Singular queries must have an argument');
				}
				let resolveResult = await allResolver.apply(this, [root, args, context, info]);

				if (isArray(resolveResult)) {
					resolveResult = resolveResult.length > 0 ? resolveResult[0] : null;
				}
				return resolveResult;
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

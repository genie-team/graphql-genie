
import { GraphQLFieldResolver, GraphQLInputObjectType, GraphQLInputType, GraphQLSchema, IntrospectionObjectType, IntrospectionType } from 'graphql';
import pluralize from 'pluralize';
import { DataResolver, TypeGenerator } from './GraphQLGenieInterfaces';
import { InputGenerator } from './InputGenerator';
import { Relations, getAllResolver, getRootMatchFields, queryArgs } from './TypeGeneratorUtilities';

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
				where: { type: generator.generateWhereInput(this.dataResolver.getFeatures().logicalOperators) },
				orderBy: { type: generator.generateOrderByInput() }
			},
				queryArgs,
				getRootMatchFields((<GraphQLInputObjectType>this.currInputObjectTypes.get(`${type.name}MatchInput`))));

			const fieldName = `${pluralize(type.name.toLowerCase())}`;

			this.fields[fieldName] = {
				type: `[${type.name}]`,
				args
			};

			this.resolvers.set(fieldName, getAllResolver(this.dataResolver, this.schema, type));
		});

		// basic node query
		this.fields['node'] = {
			description: 'Fetches an object given its ID',
			type: 'Node',
			args: {
				id: {
					description: 'The ID of an object',
					type: 'ID!'
				}
			}
		};

		this.resolvers.set('node', async (_root: any, _args: { [key: string]: any }, _context, _info) => {
			console.log('args', _args);
			const id = _args.id;
			const fortuneReturn = await this.dataResolver.find('Node', [id], undefined, undefined, {context: _context, info: _info});
			if (fortuneReturn) {
				const cache = new Map<string, object>();
				cache.set(id, fortuneReturn);
				return {
					fortuneReturn: fortuneReturn,
					cache: cache,
					__typename: fortuneReturn.__typename
				};
			} else {
				return null;
			}
		});
	}

	public getResolvers(): Map<string, Map<string, GraphQLFieldResolver<any, any>>> {
		return new Map([[this.objectName, this.resolvers]]);
	}

	public getFieldsOnObject(): Map<string, object> {
		return new Map([[this.objectName, this.fields]]);
	}

}

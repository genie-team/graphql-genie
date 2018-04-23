
import { DataResolver, TypeGenerator } from './GraphQLGenieInterfaces';
import { GraphQLFieldResolver, GraphQLNamedType, GraphQLResolveInfo, GraphQLSchema, IntrospectionObjectType, isInterfaceType, isObjectType } from 'graphql';
import { filterArgs, filterNested, parseFilter } from './TypeGeneratorUtils';
import { set } from 'lodash';

export class GenerateConnections implements TypeGenerator {
	private objectName: string;
	private types: IntrospectionObjectType[];
	private schema: GraphQLSchema;
	private dataResolver: DataResolver;
	private fields: object;
	private resolvers: Map<string, GraphQLFieldResolver<any, any>>;
	private currOutputObjectTypeDefs: Set<string>;

	constructor(dataResolver: DataResolver, objectName: string,
		types: IntrospectionObjectType[], $schema: GraphQLSchema,
		$currOutputObjectTypeDefs: Set<string>) {
		this.dataResolver = dataResolver;
		this.objectName = objectName;
		this.types = types;
		this.schema = $schema;
		this.currOutputObjectTypeDefs = $currOutputObjectTypeDefs;
		this.fields = {};
		this.resolvers = new Map<string, GraphQLFieldResolver<any, any>>();
		this.currOutputObjectTypeDefs.add(`
			type PageInfo {
				hasNextPage: Boolean!
				hasPreviousPage: Boolean!
				startCursor: String
				endCursor: String
			}
		`);
		this.generate();
	}

	generate() {
		this.types.forEach(type => {
			this.currOutputObjectTypeDefs.add(`
			type ${type.name.toLowerCase()}Connection {
				edges: Edge
				pageInfo: PageInfo
			}
		`);


			const fieldName = `${type.name.toLowerCase()}Connection`;

			this.fields[fieldName] = {
				type: `[${type.name}]`,
				args: filterArgs
			};

			this.resolvers.set(fieldName, async (
				_root: any,
				_args: { [key: string]: any },
				_context: any,
				_info: GraphQLResolveInfo,
			): Promise<any> => {

				let options = {};
				let filter = null;
				let schemaType: GraphQLNamedType = null;
				if (_args && _args.filter) {
					schemaType = this.schema.getType(type.name);
					filter = _args.filter;
					options = parseFilter(_args.filter, schemaType);
				}

				set(options, 'sort', _args.sort);
				set(options, 'limit', _args.first);
				set(options, 'offset', _args.offset);

				let fortuneReturn = await this.dataResolver.find(type.name, null, options);

				const cache = new Map<string, object>();
				fortuneReturn.forEach(result => {
					cache.set(result.id, result);
				});
				if (filter && isObjectType(schemaType) || isInterfaceType(schemaType)) {
					const pullIds = await filterNested(filter, _args.sort, schemaType, fortuneReturn, cache, this.dataResolver);
					fortuneReturn = fortuneReturn.filter(result => !pullIds.has(result.id));
				}

				return fortuneReturn.map((result) => {
					if (!result) { return result; }
					return {
						fortuneReturn: result,
						cache: cache,
						filter,
						__typename: result.__typename
					};
				});
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

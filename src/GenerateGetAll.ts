
import { DataResolver, TypeGenerator } from './GraphQLGenieInterfaces';
import { GraphQLFieldResolver, GraphQLResolveInfo, GraphQLSchema, IntrospectionObjectType } from 'graphql';
import pluralize from 'pluralize';
import { parseFilter } from './TypeGeneratorUtils';

export class GenerateGetAll implements TypeGenerator {
	private objectName: string;
	private types: IntrospectionObjectType[];
	private schema: GraphQLSchema;
	private dataResolver: DataResolver;
	private fields: object;
	private resolvers: Map<string, GraphQLFieldResolver<any, any>>;
	constructor(dataResolver: DataResolver, objectName: string, types: IntrospectionObjectType[], $schema: GraphQLSchema) {
		this.dataResolver = dataResolver;
		this.objectName = objectName;
		this.types = types;
		this.schema = $schema;
		this.fields = {};
		this.resolvers = new Map<string, GraphQLFieldResolver<any, any>>();
		this.generate();
	}

	generate() {
		this.types.forEach(type => {
			const fieldName = `all${pluralize(type.name)}`;

			this.fields[fieldName] = {
				type: `[${type.name}]`,
				args: { 'filter': { type: 'JSON' } }
			};

			this.resolvers.set(fieldName, async (
				_root: any,
				_args: { [key: string]: any },
				_context: any,
				_info: GraphQLResolveInfo,
			): Promise<any> => {
				let options = null;
				if (_args && _args.filter) {
					options = parseFilter(_args.filter, this.schema.getType(type.name));
				}
				const fortuneReturn = await this.dataResolver.find(type.name, null, options);
				const cache = new Map<string, object>();
				fortuneReturn.forEach(result => {
					cache.set(result.id, result);
				});
				return 	fortuneReturn.map((result) => {
					if (!result) { return result; }
					return {fortuneReturn: result,
						cache: cache,
						filter: _args.filter,
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

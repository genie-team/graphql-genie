
import { TypeGenerator, DataResolver } from './TypeGeneratorInterface';
import { GraphQLFieldResolver, IntrospectionObjectType, GraphQLResolveInfo } from 'graphql';
import pluralize from 'pluralize';
import { computeIncludes } from './TypeGeneratorUtils';

export class GenerateGetAll implements TypeGenerator {
	private objectName: string;
	private types: IntrospectionObjectType[];
	private dataResolver: DataResolver;
	private fields: object;
	private resolvers: Map<string, GraphQLFieldResolver<any, any>>;
	constructor(dataResolver: DataResolver, objectName: string, types: IntrospectionObjectType[]) {
		this.dataResolver = dataResolver;
		this.objectName = objectName;
		this.types = types;
		this.fields = {};
		this.resolvers = new Map<string, GraphQLFieldResolver<any, any>>();
		this.generate();
	}

	generate() {
		this.types.forEach(type => {
			const fieldName = `all${pluralize(type.name)}`;

			this.fields[fieldName] = {
				type: `[${type.name}]`,
			};
	
			this.resolvers.set(fieldName, (
				_root: any,
				_args: { [key: string]: any },
				_context: any,
				_info: GraphQLResolveInfo,
			): any => {
				const includes = computeIncludes(this.dataResolver, _info.operation.selectionSet.selections[0], type.name);
				return this.dataResolver.find(type.name, null, null, includes);
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
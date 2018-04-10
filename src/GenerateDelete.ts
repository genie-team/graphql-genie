
import { TypeGenerator, DataResolver } from './TypeGeneratorInterface';
import { GraphQLFieldResolver, IntrospectionObjectType, GraphQLNonNull, GraphQLID, GraphQLResolveInfo } from 'graphql';
import { computeIncludes } from './TypeGeneratorUtils';

export class GenerateDelete implements TypeGenerator {
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
			const args = {};
			args['id'] = {
				type: new GraphQLNonNull(GraphQLID)
			};

			this.fields[`delete${type.name}`] = {
				type: type.name,
				args: args
			};
			this.resolvers.set(`delete${type.name}`, async (
				_root: any,
				_args: { [key: string]: any },
				_context: any,
				_info: GraphQLResolveInfo,
			): Promise<any> => {
				const includes = computeIncludes(this.dataResolver, _info.operation.selectionSet.selections[0], type.name);
				const currValue = await this.dataResolver.find(type.name, [_args['id']], null, includes);
				await this.dataResolver.delete(type.name, [_args['id']]);
				return currValue;
			});		});
	
	}

	public getResolvers(): Map<string, Map<string, GraphQLFieldResolver<any, any>>> {
		return new Map([[this.objectName, this.resolvers]]);
	}

	public getFieldsOnObject(): Map<string, object> {
		return new Map([[this.objectName, this.fields]]);
	}

}
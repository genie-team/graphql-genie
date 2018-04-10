
import { TypeGenerator, DataResolver } from './TypeGeneratorInterface';
import { GraphQLFieldResolver, IntrospectionObjectType, GraphQLResolveInfo, GraphQLNonNull, GraphQLID } from 'graphql';
import { computeIncludes } from './TypeGeneratorUtils';

export class GenerateGetSingle implements TypeGenerator {
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
			this.fields[type.name] = {
				type: type.name,
				args: { 'id': { type: new GraphQLNonNull<any>(GraphQLID) } }
			};
	
			this.resolvers.set(type.name, (
				_root: any,
				_args: { [key: string]: any },
				_context: any,
				_info: GraphQLResolveInfo,
			): any => {
				const includes = computeIncludes(this.dataResolver, _info.operation.selectionSet.selections[0], type.name);
				return this.dataResolver.find(type.name, [_args['id']], null, includes);
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

import { DataResolver, TypeGenerator } from './GraphQLGenieInterfaces';
import { GraphQLFieldResolver, GraphQLID, GraphQLNonNull, GraphQLResolveInfo, IntrospectionObjectType } from 'graphql';

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
				return this.dataResolver.find(type.name, [_args['id']]);
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

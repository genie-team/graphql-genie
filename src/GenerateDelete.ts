
import { DataResolver, GenerateConfig, TypeGenerator } from './GraphQLGenieInterfaces';
import { GraphQLFieldResolver, GraphQLID, GraphQLNonNull, GraphQLResolveInfo, IntrospectionObjectType } from 'graphql';

export class GenerateDelete implements TypeGenerator {
	private objectName: string;
	private types: IntrospectionObjectType[];
	private config: GenerateConfig;
	private dataResolver: DataResolver;
	private fields: object;
	private resolvers: Map<string, GraphQLFieldResolver<any, any>>;

	constructor(dataResolver: DataResolver, objectName: string, types: IntrospectionObjectType[], $config: GenerateConfig) {
		this.dataResolver = dataResolver;
		this.objectName = objectName;
		this.types = types;
		this.config = $config;


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
			console.log(this.config);
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
				const currValue = await this.dataResolver.find(type.name, [_args['id']]);
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

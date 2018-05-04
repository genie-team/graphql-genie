
import { DataResolver, TypeGenerator } from './GraphQLGenieInterfaces';
import { GraphQLFieldResolver, GraphQLSchema, IntrospectionObjectType } from 'graphql';
import pluralize from 'pluralize';
import { filterArgs, getAllResolver } from './TypeGeneratorUtils';

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
			const fieldName = `${pluralize(type.name.toLowerCase())}`;

			this.fields[fieldName] = {
				type: `[${type.name}]`,
				args: filterArgs
			};

			this.resolvers.set(fieldName, getAllResolver(this.dataResolver, this.schema, type));
		});
	}


	public getResolvers(): Map<string, Map<string, GraphQLFieldResolver<any, any>>> {
		return new Map([[this.objectName, this.resolvers]]);
	}

	public getFieldsOnObject(): Map<string, object> {
		return new Map([[this.objectName, this.fields]]);
	}

}

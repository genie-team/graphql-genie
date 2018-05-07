
import {
	GraphQLFieldResolver, GraphQLInputType, GraphQLObjectType, GraphQLSchema, IntrospectionObjectType, IntrospectionType, graphql,
} from 'graphql';
import { assign, forOwn, get} from 'lodash';
import SchemaInfoBuilder from './SchemaInfoBuilder';
import FortuneGraph from './FortuneGraph';
import { GenerateGetAll } from './GenerateGetAll';
import { FortuneOptions, GraphQLGenieOptions, TypeGenerator } from './GraphQLGenieInterfaces';
import { printType } from 'graphql';
import { GenerateCreate } from './GenerateCreate';
import { GenerateUpdate } from './GenerateUpdate';
import { GenerateDelete } from './GenerateDelete';
import GraphQLSchemaBuilder from './GraphQLSchemaBuilder';
import { Relations, computeRelations, getTypeResolver } from './TypeGeneratorUtils';
import { IntrospectionResultData } from 'apollo-cache-inmemory';
import { GenerateUpsert } from './GenerateUpsert';
import { GenerateConnections } from './GenerateConnections';


export default class GraphQLGenie {
	private fortuneOptions: FortuneOptions;
	private config = {
		generateGetAll: true,
		generateCreate: true,
		generateUpdate: true,
		generateDelete: true,
		generateUpsert: true,
		generateConnectionQueries: true,
		includeSubscription: true
	};
	private generators: Array<TypeGenerator>;

	private schema: GraphQLSchema;
	private schemaBuilder: GraphQLSchemaBuilder;
	private schemaInfo: IntrospectionType[];
	private schemaInfoBuilder: SchemaInfoBuilder;
	private relations: Relations;
	public graphQLFortune: FortuneGraph;

	private initialized: Promise<boolean>;
	constructor(options: GraphQLGenieOptions) {
		if (!options.fortuneOptions) {
			throw new Error('Fortune Options is required');
		} else {
			this.fortuneOptions = options.fortuneOptions;
		}

		if (options.schemaBuilder) {
			this.schemaBuilder = options.schemaBuilder;
		} else if (options.typeDefs) {
			this.schemaBuilder = new GraphQLSchemaBuilder(options.typeDefs);
		} else {
			throw new Error('Need a schemaBuilder or typeDefs');
		}

		if (options.generatorOptions) {
			this.config = Object.assign(this.config, options.generatorOptions);
		}

		this.schema = this.schemaBuilder.getSchema();
		this.initialized = this.init();
	}



	private init = async () => {
		this.generators = [];
		this.schemaInfoBuilder = new SchemaInfoBuilder(this.schema);
		this.schemaInfo = await this.schemaInfoBuilder.getSchemaInfo();
		this.relations = computeRelations(this.schemaInfo);
		this.graphQLFortune = new FortuneGraph(this.fortuneOptions, this.schemaInfo);
		await this.buildQueries();
		await this.buildResolvers();
		window['graphql'] = graphql;

		window['schema'] = this.schema;

		return true;
	}

	private buildResolvers = async () => {
		forOwn(this.schemaInfo, (type: any, name: string) => {
			const fieldResolvers = new Map<string, GraphQLFieldResolver<any, any>>();

			if (type.kind === 'OBJECT' && name !== 'Query' && name !== 'Mutation' && name !== 'Subscription') {
				forOwn(type.fields, (field) => {
					fieldResolvers.set(field.name, getTypeResolver(this.graphQLFortune, this.schema, field));
				});
				this.schema = this.schemaBuilder.addResolvers(name, fieldResolvers);
			}
		});
	}

	public buildQueries = async () => {

		const nodesResult = await graphql(this.schema, `{
			__type(name: "Node") {
				possibleTypes {
					name
				}
			}
		}`);

		const nodeNames = nodesResult.data.__type.possibleTypes;
		const nodeTypes = [];
		nodeNames.forEach(result => {
			nodeTypes.push(<IntrospectionObjectType>this.schemaInfo[result.name]);
		});
		const currInputObjectTypes = new Map<string, GraphQLInputType>();
		const currOutputObjectTypeDefs = new Set<string>();

		if (this.config.generateGetAll) {
			this.generators.push(new GenerateGetAll(this.graphQLFortune, 'Query', nodeTypes, this.schema));
		}
		if (this.config.generateConnectionQueries) {
			this.generators.push(new GenerateConnections(this.graphQLFortune, 'Query', nodeTypes, this.schema, currOutputObjectTypeDefs));
		}
		if (this.config.generateCreate) {
			this.generators.push(new GenerateCreate(this.graphQLFortune, 'Mutation', nodeTypes, this.config, currInputObjectTypes, currOutputObjectTypeDefs, this.schemaInfo, this.schema, this.relations));
		}
		if (this.config.generateUpdate) {
			this.generators.push(new GenerateUpdate(this.graphQLFortune, 'Mutation', nodeTypes, this.config, currInputObjectTypes, currOutputObjectTypeDefs, this.schemaInfo, this.schema, this.relations));
		}
		if (this.config.generateUpsert) {
			this.generators.push(new GenerateUpsert(this.graphQLFortune, 'Mutation', nodeTypes, this.config, currInputObjectTypes, currOutputObjectTypeDefs, this.schemaInfo, this.schema, this.relations));
		}

		if (this.config.generateDelete) {
			this.generators.push(new GenerateDelete(this.graphQLFortune, 'Mutation', nodeTypes, this.config, currInputObjectTypes, currOutputObjectTypeDefs, this.schemaInfo, this.schema, this.relations));
		}




		let newTypes = '';
		currInputObjectTypes.forEach(inputObjectType => {
			// console.log(printType(inputObjectType));
			newTypes += printType(inputObjectType) + '\n';
		});

		currOutputObjectTypeDefs.forEach(newType => {
			newTypes += newType + '\n';
		});

		const fieldsOnObject = new Map<string, {}>();
		const resolvers = new Map<string, Map<string, GraphQLFieldResolver<any, any>>>();

		// merge maps and compute new input types
		this.generators.forEach(generator => {
			generator.getFieldsOnObject().forEach((fields, objectName) => {
				fieldsOnObject.set(objectName, assign({}, fieldsOnObject.get(objectName), fields));
			});

			const generatorResolvers = generator.getResolvers();

			generatorResolvers.forEach((resolver, name) => {
				if (!resolvers.has(name)) {
					resolvers.set(name, new Map<string, GraphQLFieldResolver<any, any>>());
				}
				resolvers.set(name, new Map([...resolvers.get(name), ...resolver]));
			});
		});

		fieldsOnObject.forEach((fields, objName) => {
			newTypes += printType(new GraphQLObjectType({ name: objName, fields: fields })) + '\n';
		});
		// console.log(newTypes);

		this.schema = this.schemaBuilder.addTypeDefsToSchema(newTypes);

		resolvers.forEach((resolverMap, name) => {
			this.schemaBuilder.addResolvers(name, resolverMap);
		});

		this.schema = this.schemaBuilder.getSchema();

	}



	public getSchema = async (): Promise<GraphQLSchema> => {
		await this.initialized;
		return this.schema;
	}

	public getFragmentTypes = async (): Promise<IntrospectionResultData> => {
		await this.initialized;
		const result = await graphql(this.schema, `{
			__schema {
				types {
					kind
					name
					possibleTypes {
						name
					}
				}
			}
		}`);
		// here we're filtering out any type information unrelated to unions or interfaces
		const types = get(result, 'data.__schema.types');
		if (types) {
			const filteredData = result.data.__schema.types.filter(
				type => type.possibleTypes !== null,
			);
			result.data.__schema.types = filteredData;

		}
		return <IntrospectionResultData>result.data;
	}

}






// cache.writeData({ data });

// cache.writeData({
// 	id: 'ROOT_QUERY.objects.1',
// 	data: {
// 		field: 'hi'
// 	}
// });
// window['gql'] = gql;
// window['cache'] = cache;
// console.info(cache.readQuery({
// 	query: gql`
//   query {
//     objects {
//       name
//     }
//   }
// `}));
// mutation {
//   createGraphQLField(name: "test new field", type:{list:true, type:""}) {
//     id
//     name
//     description
//   }
// }


// {
//   allGraphQLDirectives {
//     id
//     name
//     description
//     args {
//       id
//       type {
//         ... on GraphQLScalarType {
//           id
//         }

//       }
//     }
//   }
// }

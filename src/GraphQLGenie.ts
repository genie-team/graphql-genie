
import { GenerateGetSingle } from './GenerateGetSingle';
import {
	GraphQLFieldResolver, GraphQLInputType, GraphQLObjectType, GraphQLSchema, IntrospectionObjectType, IntrospectionType, graphql, } from 'graphql';
import { assign,  } from 'lodash';
import SchemaInfoBuilder from './SchemaInfoBuilder';
import FortuneBuilder from './FortuneBuilder';
import { GenerateGetAll } from './GenerateGetAll';
import { FortuneOptions, GraphQLGenieOptions, TypeGenerator } from './GraphQLGenieInterfaces';
import { printType } from 'graphql';
import { GenerateCreate } from './GenerateCreate';
import { GenerateUpdate } from './GenerateUpdate';
import { GenerateDelete } from './GenerateDelete';
import GraphQLSchemaBuilder from './GraphQLSchemaBuilder';
import { GenerateRelationMutations } from './GenerateRelationMutations';
import { computeRelations } from './TypeGeneratorUtils';


export default class GraphQLGenie {
	private fortuneOptions: FortuneOptions;
	private config = {
		'generateGetAll': true,
		'generateGetAllMeta': true,
		'generateGetSingle': true,
		'generateCreate': true,
		'generateUpdate': true,
		'generateDelete': true,
		'generateAddToRelation': true,
		'generateRemoveFromRelation': true,
		'generateSetRelation': true,
		'generateUnsetRelation': true,
		'generateIntegrationFields': true,
		'generateCustomMutationFields': true,
		'generateCustomQueryFields': true,
		'includeSubscription': true
	};
	private generators: Array<TypeGenerator>;

	private schema: GraphQLSchema;
	private schemaBuilder: GraphQLSchemaBuilder;
	private schemaInfo: IntrospectionType[];
	private schemaInfoBuilder: SchemaInfoBuilder;

	public graphQLFortune: FortuneBuilder;

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
		this.graphQLFortune = new FortuneBuilder(this.fortuneOptions, this.schemaInfo);
		await this.buildQueries();

		return true;
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
		if (this.config.generateGetAll) {
			this.generators.push(new GenerateGetAll(this.graphQLFortune, 'Query', nodeTypes));
		}
		if (this.config.generateGetSingle) {
			this.generators.push(new GenerateGetSingle(this.graphQLFortune, 'Query', nodeTypes));
		}
		if (this.config.generateCreate) {
			this.generators.push(new GenerateCreate(this.graphQLFortune, 'Mutation', nodeTypes, currInputObjectTypes, this.schemaInfo, this.schema));
		}
		if (this.config.generateUpdate) {
			this.generators.push(new GenerateUpdate(this.graphQLFortune, 'Mutation', nodeTypes, currInputObjectTypes, this.schemaInfo, this.schema));
		}
		if (this.config.generateDelete) {
			this.generators.push(new GenerateDelete(this.graphQLFortune, 'Mutation', nodeTypes));
		}

		const currOutputObjectTypeDefs = new Set<string>();
		if (this.config.generateSetRelation || this.config.generateUnsetRelation || this.config.generateAddToRelation || this.config.generateRemoveFromRelation) {
			const relations = computeRelations(this.schemaInfo);
			this.generators.push(new GenerateRelationMutations(this.graphQLFortune, 'Mutation', this.schemaInfo, this.config, relations, currOutputObjectTypeDefs));
		}



		let newTypes = '';

		currInputObjectTypes.forEach(inputObjectType => {
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
			newTypes += printType(new GraphQLObjectType({name: objName, fields: fields})) + '\n';
		});

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

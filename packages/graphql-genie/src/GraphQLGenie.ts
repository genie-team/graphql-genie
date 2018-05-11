
import { IntrospectionResultData } from 'apollo-cache-inmemory';
import { GraphQLFieldResolver, GraphQLInputObjectType, GraphQLObjectType, GraphQLSchema, IntrospectionObjectType, IntrospectionType, graphql, isObjectType, printType } from 'graphql';
import { assign, find, forOwn, get } from 'lodash';
import FortuneGraph from './FortuneGraph';
import { GenerateConnections } from './GenerateConnections';
import { GenerateCreate } from './GenerateCreate';
import { GenerateDelete } from './GenerateDelete';
import { GenerateGetAll } from './GenerateGetAll';
import { GenerateUpdate } from './GenerateUpdate';
import { GenerateUpsert } from './GenerateUpsert';
import { DataResolver, FortuneOptions, GenerateConfig, GraphQLGenieOptions, TypeGenerator } from './GraphQLGenieInterfaces';
import { GraphQLSchemaBuilder } from './GraphQLSchemaBuilder';
import SchemaInfoBuilder from './SchemaInfoBuilder';
import { Relations, computeRelations, getReturnType, getTypeResolver, typeIsList } from './TypeGeneratorUtils';

export class GraphQLGenie {
	private fortuneOptions: FortuneOptions;
	private config: GenerateConfig = {
		generateGetAll: true,
		generateCreate: true,
		generateUpdate: true,
		generateDelete: true,
		generateUpsert: true,
		generateConnections: true,
		generateSubscriptions: true
	};
	private generators: Array<TypeGenerator>;

	private schema: GraphQLSchema;
	private schemaBuilder: GraphQLSchemaBuilder;
	private schemaInfo: IntrospectionType[];
	private schemaInfoBuilder: SchemaInfoBuilder;
	private relations: Relations;
	private graphQLFortune: FortuneGraph;

	private initialized: Promise<boolean>;
	constructor(options: GraphQLGenieOptions) {
		if (!options.fortuneOptions) {
			throw new Error('Fortune Options is required');
		} else {
			this.fortuneOptions = options.fortuneOptions;
		}

		if (options.generatorOptions) {
			this.config = Object.assign(this.config, options.generatorOptions);
		}

		if (options.schemaBuilder) {
			this.schemaBuilder = options.schemaBuilder;
		} else if (options.typeDefs) {
			this.schemaBuilder = new GraphQLSchemaBuilder(options.typeDefs, this.config);
		} else {
			throw new Error('Need a schemaBuilder or typeDefs');
		}

		this.schema = this.schemaBuilder.getSchema();
		this.validate();
		this.initialized = this.init();
	}

	private validate = () => {
		const typeMap = this.schema.getTypeMap();
		Object.keys(typeMap).forEach(name => {
			const type = typeMap[name];
			if (isObjectType(type) && !type.name.includes('__')  && !(type.name.toLowerCase() === 'query') && !(type.name.toLowerCase() === 'mutation') && !(type.name.toLowerCase() === 'subscription')) {
				if (type.name.endsWith('Connection')) {
					throw new Error( `${type.name} is invalid because it ends with Connection which could intefere with necessary generated types and genie logic`);
				} else if (type.name.endsWith('Edge')) {
					throw new Error( `${type.name} is invalid because it ends with Edge which could intefere with necessary generated types and genie logic`);
				} else if (this.config.generateConnections && type.name === 'PageInfo') {
					throw new Error( `${type.name} is invalid. PageInfo type is auto generated for connections`);
				}
			}
		});
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
		const queryTypeFields = (<GraphQLObjectType>this.schema.getType('Query')).getFields();
		const queryField = queryTypeFields[Object.keys(queryTypeFields)[0]];
		const fullArgs = queryField.args;
		const filterArg = find(fullArgs, ['name', 'filter']);
		forOwn(this.schemaInfo, (type: any, name: string) => {
			const fieldResolvers = new Map<string, GraphQLFieldResolver<any, any>>();
			const schemaType = this.schema.getType(type.name);
			if (isObjectType(schemaType) && name !== 'Query' && name !== 'Mutation' && name !== 'Subscription') {
				const fieldMap = schemaType.getFields();
				forOwn(type.fields, (field) => {
					const graphQLfield = fieldMap[field.name];
					graphQLfield.args = graphQLfield.args ? graphQLfield.args : [];
					if (typeIsList(graphQLfield.type)) {
						graphQLfield.args = graphQLfield.args.concat(fullArgs);
					} else {
						graphQLfield.args.push(filterArg);
					}
					const returnConnection = getReturnType(graphQLfield.type).endsWith('Connection');

					fieldResolvers.set(field.name, getTypeResolver(this.graphQLFortune, this.schema, field, returnConnection));
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
		const currInputObjectTypes = new Map<string, GraphQLInputObjectType>();
		const currOutputObjectTypeDefs = new Set<string>();

		if (this.config.generateGetAll) {
			this.generators.push(new GenerateGetAll(this.graphQLFortune, 'Query', nodeTypes, this.schema, currInputObjectTypes, this.schemaInfo, this.relations));
		}
		if (this.config.generateConnections) {
			this.generators.push(new GenerateConnections(this.graphQLFortune, 'Query', nodeTypes, this.schema, currOutputObjectTypeDefs, currInputObjectTypes, this.schemaInfo, this.relations));
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

	public getDataResolver = async (): Promise<DataResolver> => {
		await this.initialized;
		return this.graphQLFortune;
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

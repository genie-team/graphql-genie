import gql from 'graphql-tag';
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { SchemaLink } from 'apollo-link-schema';

import {
	GraphQLFieldResolver, GraphQLObjectType, GraphQLSchema, IntrospectionType, graphql, GraphQLInputType, IntrospectionObjectType, } from 'graphql';
import { printType } from 'graphql';
import { assign, keyBy, map, each } from 'lodash'
import SchemaInfoBuilder from './SchemaInfoBuilder';
import FortuneBuilder from './FortuneBuilder';
import { GenerateGetAll } from './GenerateGetAll';
import { TypeGenerator } from './TypeGeneratorInterface';
import { GenerateGetSingle } from './GenerateGetSingle';
import { GenerateCreate } from './GenerateCreate';
import { GenerateUpdate } from './GenerateUpdate';
import { GenerateDelete } from './GenerateDelete';
import GraphQLSchemaBuilder from './GraphQLSchemaBuilder';

interface GraphQLGenieOptions {
	schemaBuilder?: GraphQLSchemaBuilder
	typeDefs?: string
}

export class GraphQLGenie {
	config = {
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

	private graphQLFortune: FortuneBuilder;

	constructor(options: GraphQLGenieOptions) {
		if (options.schemaBuilder) {
			this.schemaBuilder = options.schemaBuilder;
		} else if (options.typeDefs) {
			this.schemaBuilder = new GraphQLSchemaBuilder(options.typeDefs);			
		} else {
			throw new Error('Need a schemaBuilder or typeDefs');
		}
		this.schema = this.schemaBuilder.getSchema();
		console.log(this.schema);
		this.init();
	}


	private init = () => {
		this.generators = [];
		this.schemaInfoBuilder = new SchemaInfoBuilder(this.schema);
		this.schemaInfoBuilder.getSchemaInfo().then(schemaInfo => {
			this.schemaInfo = schemaInfo;
			const promises = [];
			promises.push(this.buildQueries());
			promises.push(this.buildResolveTypeResolvers());
			Promise.all(promises).then(() => {
				this.getClient();
			});
			this.graphQLFortune = new FortuneBuilder(schemaInfo);
		});
	}

	// private mapToObj(map) {
	// 	const obj = Object.create(null);
	// 	for (const [k, v] of map) {
	// 		// We don’t escape the key '__proto__'
	// 		// which can cause problems on older engines
	// 		obj[k] = v;
	// 	}
	// 	return obj;
	// }

	private buildResolveTypeResolvers = async() => {
		const typesResult = await graphql(this.schema, `{
			__schema {
				types{
					name
					kind
				}
			}
		}
		`);
		const types = typesResult.data.__schema.types;
		for (const type of types) {
			if (type.kind && type.kind === 'INTERFACE' || type.kind === 'UNION') {
				const resolver = (
					obj: any
				): any => {
					return obj.__typename;
				};
				this.schema = this.schemaBuilder.addResolvers(type.name, new Map().set('__resolveType', resolver));
			}
		}
	}

	public buildQueries = async () => {
		console.info(this.schema);
		console.info(this.schemaInfo);
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
		
		

		let newTypes = '';

		for(const [, inputObjectType] of currInputObjectTypes) {
			newTypes += printType(inputObjectType) + '\n';
		}

		let fieldsOnObject = new Map<string, {}>();
		const resolvers = new Map<string, Map<string, GraphQLFieldResolver<any, any>>>();

		//merge maps and compute new input types
		for (const generator of this.generators) {
			for(const [objectName, fields] of generator.getFieldsOnObject()) {
				fieldsOnObject.set(objectName, assign({}, fieldsOnObject.get(objectName), fields));
			}
			

			const generatorResolvers = generator.getResolvers();
			for(const [name, resolver] of generatorResolvers) {
				if(!resolvers.has(name)) {
					resolvers.set(name, new Map<string, GraphQLFieldResolver<any, any>>());
				}
				resolvers.set(name, new Map([...resolvers.get(name), ...resolver]));
			}
		}
		

		for(const [objName, fields] of fieldsOnObject) {
			newTypes += printType(new GraphQLObjectType({name: objName, fields: fields})) + '\n';
		}

		this.schema = this.schemaBuilder.addTypeDefsToSchema(newTypes);

		for(const [name, resolverMap] of resolvers) {
			this.schemaBuilder.addResolvers(name, resolverMap);
		}	
		this.schema = this.schemaBuilder.getSchema();	

	}






	// const state = { testings: [] };
	public getClient = async (): Promise<ApolloClient<any>> => {
		// const resolverMap = {
		// 	Query: {
		// 		allTestings: (_obj, { _name }, _context) => {
		// 			return state.testings;
		// 		},
		// 	},
		// 	Mutation: {
		// 		addTesting: (_, { name }, _context) => {
		// 			const testing = { name: name };
		// 			state.testings.push(testing);
		// 			return testing;
		// 		},
		// 	},
		// };
		// // for (const [name, resolve] of newQueryResolvers) {
		// // 	resolverMap.Query[name] = resolve;
		// // }
		console.log(this.schema);
		// const resolversMap = new Map<string, GraphQLFieldResolver<any, any>>();
		// resolversMap.set('args', (
		// 	_root: any,
		// 	_args: { [key: string]: any },
		// 	_context: any,
		// 	_info: GraphQLResolveInfo,
		// ): any => {
		// 	const selections = this.computeIncludes(_info.operation.selectionSet.selections[0], 'GraphQLDirective');
		// 	console.info('selections');
		// 	console.info(selections);
		// 	console.info(JSON.stringify(selections));
		// 	console.log(_root);
		// 	console.log(_args);
		// 	console.log(_context);
		// 	console.log(_info);
		// });
		// addResolvers('GraphQLDirective', resolversMap);
		const client = new ApolloClient({
			link: new SchemaLink({ schema: this.schema }),
			cache:  new InMemoryCache(),
			connectToDevTools: true
		});
		client.initQueryManager();
		console.log(client);
		// console.info(await client.mutate({
		// 	mutation: gql`
		// 							mutation addTesting($name: String!) {
		// 								addTesting(name: $name) {
		// 									name
		// 								}
		// 							}
		// 						`,
		// 	variables: {
		// 		name: name
		// 	}
		// }));
		// In every schema
		const createScalarsPromises = [];
		const scalars = [{
			name: 'Boolean',
			description: 'The `Boolean` scalar type represents `true` or `false`.',
		},
		{
			name: 'Int',
			description: 'The `Int` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1. ',
		},
		{
			name: 'String',
			description: 'The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.',
		},
		{
			name: 'Float',
			description: 'The `Float` scalar type represents signed double-precision fractional values as specified by [IEEE 754](http://en.wikipedia.org/wiki/IEEE_floating_point). ',
		},
		{
			name: 'ID',
			description: 'The `ID` scalar type represents a unique identifier, often used to refetch an object or as key for a cache. The ID type appears in a JSON response as a String; however, it is not intended to be human-readable. When expected as an input type, any string (such as `"4"`) or integer (such as `4`) input value will be accepted as an ID.',
		},
		];

		const createGraphQLScalarType = gql`
		mutation createGraphQLScalarType($name: String!, $description: String) {
			createGraphQLScalarType(name: $name, description: $description) {
				id
				name
			}
		}
	`;

		each(scalars, scalar => {
			createScalarsPromises.push(client.mutate({
				mutation: createGraphQLScalarType,
				variables: {name: scalar.name, description: scalar.description}
			}));
		});

		const scalarTypes = await Promise.all(createScalarsPromises);
		const scalarIdMap = keyBy(map(scalarTypes, 'data.createGraphQLScalarType'), 'name');
		console.log(scalarIdMap);


		const createDirectivesPromises = [];
		const directives = [
			{
				name: 'skip',
				description: 'Directs the executor to skip this field or fragment when the `if` argument is true.',
				location: ['FIELD', 'FRAGMENT_SPREAD', 'INLINE_FRAGMENT'],
				args: [{
					name: 'if',
					description: 'Skipped when true.',
					typeId: scalarIdMap['Boolean'].id
				}]
			},
			{
				name: 'include',
				description: 'Directs the executor to include this field or fragment only when the `if` argument is true.',
				location: ['FIELD', 'FRAGMENT_SPREAD', 'INLINE_FRAGMENT'],
				args: [{
					name: 'if',
					description: '"Included when true.',
					typeId: scalarIdMap['Boolean'].id
				}]
			},
			{
				name: 'deprecated',
				description: 'Marks an element of a GraphQL schema as no longer supported.',
				location: ['FIELD_DEFINITION', 'ENUM_VALUE'],
				args: [{
					name: 'reason',
					description: 'Explains why this element was deprecated, usually also including a suggestion for how to access supported similar data. Formatted in [Markdown](https://daringfireball.net/projects/markdown/).',
					typeId: scalarIdMap['String'].id,
					defaultValue: 'No longer supported'
				}]
			}
		];
		const createGraphQLDirective = gql`
		mutation createGraphQLDirective($name: String!, $description: String, $location: [String], $args: [GraphQLArgumentInput!]) {
			createGraphQLDirective(name: $name, description: $description, location: $location, args: $args) {
				id
			}
		}
	`;
		each(directives, directive => {
			createDirectivesPromises.push(client.mutate({
				mutation: createGraphQLDirective,
				variables: {name: directive.name, description: directive.description, location: directive.location, args: directive.args}
			}));
		});

		await this.graphQLFortune.create('GraphQLEnumType', { name: 'test enum', description: 'test' });
		await this.graphQLFortune.create('GraphQLObjectType', { name: 'test object', description: 'test' });

		return client;
	}


}






// const data = {
// 	networkStatus: {
// 		__typename: 'NetworkStatus',
// 		isConnected: true
// 	},
// 	objects: [
// 		{
// 			__typename: 'Object',
// 			name: 'Article',
// 			field: '0',
// 		},
// 		{
// 			__typename: 'Object',
// 			name: 'Post'
// 		}
// 	]
// };
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

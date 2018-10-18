
import { GraphQLBoolean, GraphQLFieldResolver, GraphQLList, GraphQLNonNull, GraphQLString } from 'graphql';
import { TypeGenerator } from './GraphQLGenieInterfaces';
import { GraphQLGenie } from './GraphQLGenie';
import * as GraphQLJSON  from 'graphql-type-json';

export class GenerateMigrations implements TypeGenerator {

	private genie: GraphQLGenie;
	private resolvers: Map<string, Map<string, GraphQLFieldResolver<any, any>>>;
	private fieldsOnObject: Map<string, object>;
	private currOutputObjectTypeDefs: Set<string>;

	constructor($genie: GraphQLGenie, $currOutputObjectTypeDefs: Set<string>) {
		this.resolvers = new  Map<string, Map<string, GraphQLFieldResolver<any, any>>>();
		this.fieldsOnObject = new Map<string, object>();
		this.genie = $genie;
		this.currOutputObjectTypeDefs = $currOutputObjectTypeDefs;

		this.generate();
	}

	generate() {

		this.fieldsOnObject.set('Query', {
			'exportData': {
				description: 'Returns data in the database which can be sent to importData',
				type: GraphQLJSON,
				args: {
					types: {
						description: 'List of the GraphQL Object Types you want data for. If null or blank all data will be returned',
						type: new GraphQLList(GraphQLString)
					}
				}
			}
		});

		const exportDataResolver = new Map<string, GraphQLFieldResolver<any, any>>();
		exportDataResolver.set('exportData', async (_root: any, args: { [key: string]: any }, context, _info) => {
			return await this.genie.getRawData(args.types || [], context);
		});

		this.resolvers.set('Query', exportDataResolver);

		this.currOutputObjectTypeDefs.add(`
			type ImportDataPayload {
				data: JSON,
				unalteredData: JSON,
				missingData: JSON
			}
		`);

		this.currOutputObjectTypeDefs.add(`
			input ConditionsInput {
				id: [String]!,
				conditions: JSON!
			}
		`);

		this.fieldsOnObject.set('Mutation', {
			'importData': {
				type: 'ImportDataPayload',
				args: {
					data: {
						type: new GraphQLNonNull(new GraphQLList(GraphQLJSON))
					},
					merge: {
						type: GraphQLBoolean,
						description: `If false every object will create a new object, the id won't be preserved from the current data but relationships will still be built as they were in the provided data.
						If true data will be merged based on ID, with new entries only being created if the given id does not exist already. Provided id will be used for creating data as well.
						Note when merging list fields by default the array in the provided data will replace the existing data array. If you don't want to do that instead of providing an array you can provide an object with fields for push and pull or set. `
					},
					defaultTypename: {
						type: GraphQLString,
						descriptions: 'Must be provided if every object in data does not have a `__typename` property or ids with the typename encoded'
					},
					conditions: {
						type: '[ConditionsInput]',
						descriptions: 'Conditions can be used to only update records if they are met'
					}
				}
			}
		});

		const importDataResolver = new Map<string, GraphQLFieldResolver<any, any>>();
		importDataResolver.set('importData', async (_root: any, args: { [key: string]: any }, context, _info) => {
			return await this.genie.importRawData(args.data, args.merge, args.defaultTypename, context, args.conditions);
		});

		this.resolvers.set('Mutation', importDataResolver);

	}

	public getResolvers(): Map<string, Map<string, GraphQLFieldResolver<any, any>>> {
		return this.resolvers;
	}

	public getFieldsOnObject(): Map<string, object> {
		return this.fieldsOnObject;
	}

}

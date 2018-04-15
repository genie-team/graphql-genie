
import { DataResolver, GenerateConfig, TypeGenerator } from './GraphQLGenieInterfaces';
import { GraphQLFieldResolver, GraphQLID, GraphQLNonNull, GraphQLResolveInfo } from 'graphql';
import { computeIncludes, Relations } from './TypeGeneratorUtils';
import { isEmpty } from 'lodash';

export class GenerateRelationMutations implements TypeGenerator {
	private relations: Relations;
	private currOutputObjectTypeDefs: Set<string>;
	private config: GenerateConfig;
	private objectName: string;
	private dataResolver: DataResolver;
	private fields: object;
	private resolvers: Map<string, GraphQLFieldResolver<any, any>>;

	constructor(dataResolver: DataResolver, objectName: string,
		 config: GenerateConfig, relations: Relations,
		 currOutputObjectTypeDefs: Set<string>) {
		this.dataResolver = dataResolver;
		this.objectName = objectName;
		this.config = config;
		this.currOutputObjectTypeDefs = currOutputObjectTypeDefs;
		this.relations = relations;

		this.fields = {};
		this.resolvers = new Map<string, GraphQLFieldResolver<any, any>>();
		this.generate();
	}	

	private generateRelationFields(fieldName: string, payloadTypeName: string, argNames: string[]) {
				// create the mutation field
				const args = {};
				args[`${argNames[0]}Id`] = {
					type: new GraphQLNonNull(GraphQLID)
				};
				args[`${argNames[1]}Id`] = {
					type: new GraphQLNonNull(GraphQLID)
				};
				this.fields[fieldName] = {
					type: payloadTypeName,
					args: args
				};


	}

	private async getReturn(_info, typeName0, typeName1, updateResult, id0, id1, argNames) {
		const includes0 = computeIncludes(this.dataResolver, _info.operation.selectionSet.selections[0], typeName0);
		const currValue0 = isEmpty(includes0) ? updateResult : await this.dataResolver.find(typeName0, [id0], null, includes0);
		const includes1 = computeIncludes(this.dataResolver, _info.operation.selectionSet.selections[0], typeName1);
		const currValue1 = await this.dataResolver.find(typeName1, [id1], null, includes1);
		return {
			[argNames[0]]: currValue0,
			[argNames[1]]: currValue1
		};
	}

	private generate() {
	// 	for(const [relationName, [[typeName0, fieldName0], [typeName1, fieldName1]]]ofthis.relations) {
		this.relations.relations.forEach((relation, relationName) => {
			const typeName0 = relation.type0;
			const fieldName0 = relation.field0;
			const field0IsArray = relation.field0isArray;
			const typeName1 = relation.type1;
			const fieldName1 = relation.field1;						
			const field1IsArray = relation.field1isArray;
			const payloadTypeName = `${relationName}Payload`;
			const argNames = [`${fieldName0}${typeName0}`, `${fieldName1}${typeName1}`];
			let createPayloadType = false;

			// set relation
			if (!field0IsArray && !field1IsArray && this.config.generateSetRelation) {
				createPayloadType = true;
				const fieldName = `set${relationName}`;
				this.generateRelationFields(fieldName, payloadTypeName, argNames);
				this.resolvers.set(fieldName, async (
					_root: any,
					_args: { [key: string]: any },
					_context: any,
					_info: GraphQLResolveInfo,
				): Promise<any> => {
					const updates = {};
					const id0 = _args[`${argNames[0]}Id`];
					const id1 = _args[`${argNames[1]}Id`];
					updates['id'] = id0;
					updates[fieldName0] = id1;
					const updateResult = await this.dataResolver.update(typeName0, updates);
					return this.getReturn(_info, typeName0, typeName1, updateResult, id0, id1, argNames);

				});
			}

			// unset relation
			if (!field0IsArray && !field1IsArray && this.config.generateUnsetRelation) {
				createPayloadType = true;
				const fieldName = `unset${relationName}`;
				this.generateRelationFields(fieldName, payloadTypeName, argNames);

				this.resolvers.set(fieldName, async (
					_root: any,
					_args: { [key: string]: any },
					_context: any,
					_info: GraphQLResolveInfo,
				): Promise<any> => {
					const updates = {};
					const id0 = _args[`${argNames[0]}Id`];
					const id1 = _args[`${argNames[1]}Id`];
					updates['id'] = id0;
					updates[fieldName0] = null;
					const updateResult = await this.dataResolver.update(typeName0, updates);
					return this.getReturn(_info, typeName0, typeName1, updateResult, id0, id1, argNames);
				});
			}

			if (field0IsArray || field1IsArray && this.config.generateAddToRelation) {
				createPayloadType = true;
				const fieldName = `addTo${relationName}`;
				this.generateRelationFields(fieldName, payloadTypeName, argNames);
				this.resolvers.set(fieldName, async (
					_root: any,
					_args: { [key: string]: any },
					_context: any,
					_info: GraphQLResolveInfo,
				): Promise<any> => {
					const updates = {};
					const id0 = _args[`${argNames[0]}Id`];
					const id1 = _args[`${argNames[1]}Id`];
					updates['id'] = id0;
					updates[fieldName0] = field0IsArray ? [id1] : id1;
					const updateResult = await this.dataResolver.update(typeName0, updates);
					return this.getReturn(_info, typeName0, typeName1, updateResult, id0, id1, argNames);
				});
			}

			if (field0IsArray || field1IsArray && this.config.generateRemoveFromRelation) {
				createPayloadType = true;
				const fieldName = `removeFrom${relationName}`;
				this.generateRelationFields(fieldName, payloadTypeName, argNames);
				this.resolvers.set(fieldName, async (
					_root: any,
					_args: { [key: string]: any },
					_context: any,
					_info: GraphQLResolveInfo,
				): Promise<any> => {
					const updates = {};
					const id0 = _args[`${argNames[0]}Id`];
					const id1 = _args[`${argNames[1]}Id`];
					updates['id'] = id0;
					updates[fieldName0]  = field0IsArray ? [id1] : null;
					const updateResult = await this.dataResolver.update(typeName0, updates, null, {pull: true});
					return this.getReturn(_info, typeName0, typeName1, updateResult, id0, id1, argNames);
				});
			}

			if (createPayloadType) {
				// create the payload type def
				const typeDef = `
				type ${payloadTypeName} {
					${argNames[0]}: ${typeName0}
					${argNames[1]}: ${typeName1}
				}`;
				this.currOutputObjectTypeDefs.add(typeDef);
			}
		});


	}

	public getResolvers(): Map<string, Map<string, GraphQLFieldResolver<any, any>>> {
		return new Map([[this.objectName, this.resolvers]]);
	}

	public getFieldsOnObject(): Map<string, object> {
		return new Map([[this.objectName, this.fields]]);
	}

}

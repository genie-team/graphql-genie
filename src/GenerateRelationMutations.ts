
import { TypeGenerator, DataResolver, GenerateConfig } from './GraphQLGenieInterfaces';
import { GraphQLFieldResolver, GraphQLNonNull, GraphQLID, GraphQLResolveInfo, IntrospectionType } from 'graphql';
import { computeIncludes } from './TypeGeneratorUtils';
import { isEmpty } from 'lodash';

export class GenerateRelationMutations implements TypeGenerator {
	private relations: Map<string, Map<string, string>>;
	private currOutputObjectTypeDefs: Set<string>;
	private config: GenerateConfig;
	private schemaInfo: IntrospectionType[];
	private objectName: string;
	private dataResolver: DataResolver;
	private fields: object;
	private resolvers: Map<string, GraphQLFieldResolver<any, any>>;

	constructor(dataResolver: DataResolver, objectName: string,
		 schemaInfo: IntrospectionType[], config: GenerateConfig, relations: Map<string, Map<string, string>>,
		 currOutputObjectTypeDefs: Set<string>) {
		this.dataResolver = dataResolver;
		this.objectName = objectName;
		this.schemaInfo = schemaInfo;
		this.config = config;
		this.currOutputObjectTypeDefs = currOutputObjectTypeDefs;
		this.relations = relations;

		this.fields = {};
		this.resolvers = new Map<string, GraphQLFieldResolver<any, any>>();
		this.generate();
	}

	private fieldIsArray(fieldInfo) {
		let isArray = false;
		while (fieldInfo.kind === 'NON_NULL' || fieldInfo.kind === 'LIST') {
			if (fieldInfo.kind === 'LIST') {
				isArray = true;
				break;
			}
			fieldInfo = fieldInfo.ofType;
		}
		return isArray;
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
		}
	}

	private generate() {
	//	for(const [relationName, [[typeName0, fieldName0], [typeName1, fieldName1]]]ofthis.relations) {
		this.relations.forEach((typeMap, relationName)=> {
			let typeName0 :string;
			let fieldName0 :string;
			let typeName1 :string;
			let fieldName1 :string;
			typeMap.forEach((fieldName, typeName) => {
				if (!typeName0) {					
					typeName0 = typeName;
					fieldName0 = fieldName;
				} else {
					typeName1 = typeName;
					fieldName1 = fieldName;
				}
			});
			const field0Info = this.schemaInfo[typeName0].fields.find(field => field.name === fieldName0);
			const field1Info = this.schemaInfo[typeName1].fields.find(field => field.name === fieldName1);
			const field0IsArray = this.fieldIsArray(field0Info.type);
			const field1IsArray = this.fieldIsArray(field1Info.type);			
			const payloadTypeName = `${relationName}Payload`;
			const argNames = [`${fieldName1}${typeName0}`, `${fieldName0}${typeName1}`];
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
					const updateResult = await this.dataResolver.update(typeName0,updates);					
					return this.getReturn(_info, typeName0, typeName1, updateResult, id0, id1, argNames);

				});	
			}

			//unset relation
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
					const updateResult = await this.dataResolver.update(typeName0,updates);					
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
					const updateResult = await this.dataResolver.update(typeName0,updates);					
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
				}`
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
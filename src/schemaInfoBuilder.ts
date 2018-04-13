import { GraphQLSchema, IntrospectionType, getIntrospectionQuery, graphql } from 'graphql';

import {each, omitBy, omit, set, get, includes, startsWith, findIndex, concat, mapKeys, keys} from 'lodash';

export default class SchemaInfoBuilder {


	private schema: GraphQLSchema;
	private schemaInfo: IntrospectionType[];

	constructor(schema: GraphQLSchema) {
		this.schema = schema;
	}

	public getSchemaInfo = async (): Promise<IntrospectionType[]> => {
		if (!this.schemaInfo) {
			this.schemaInfo = await this.buildSchemaInfo(this.schema);
		}
		return this.schemaInfo;
	}

	private addDirectiveFromAST = (astDirective, schemaInfo, path) => {
		const name = astDirective.name.value;
		const args = [];
		each(astDirective.arguments, arg => {
			args.push({ name: arg.name.value, ...omit(arg.value, ['loc']) });
		});
		
		const directives = get(schemaInfo, path) ? get(schemaInfo, path) : [];
		directives.push({ name: name, args: args });
		set(schemaInfo, path, directives);
	}

	private buildSchemaInfo = async (schema): Promise<IntrospectionType[]> => {
		let originalSchemaInfo = await graphql(schema, getIntrospectionQuery({ descriptions: true }));
		originalSchemaInfo = originalSchemaInfo.data;
		let schemaInfo = <any>originalSchemaInfo;
		schemaInfo = omitBy(schemaInfo.__schema.types, (value) => {
			return startsWith(value.name, '__') || includes(['Boolean', 'String', 'ID', 'Int', 'Float'], value.name);
		});
		schemaInfo = mapKeys(schemaInfo, (type: any) => type.name);
		each(keys(schemaInfo), (typeName) => {
			const type = schemaInfo[typeName];
			// directives on type
			each(get(schema.getType(typeName), 'astNode.directives'), (astDirective) => {
				this.addDirectiveFromAST(astDirective, schemaInfo, `${typeName}.directives`);
			});
			// directives on fields
			each(get(schema.getType(typeName), 'astNode.fields'), (field) => {
				const fieldName = field.name.value;
				each(get(field, 'directives'), (astDirective) => {
					const fieldIndex = findIndex(get(schemaInfo, `${typeName}.fields`), { 'name': fieldName });
					this.addDirectiveFromAST(astDirective, schemaInfo, `${typeName}.fields[${fieldIndex}].directives`);
				});
			});
				
			
			// metadata on type
			set(schemaInfo, `${typeName}.metadata`, omit(get(schema, `_typeMap.${typeName}`), ['astNode', 'name', 'description', 'extensionASTNodes', 'isTypeOf', '_fields', '_interfaces', '_typeConfig', 'getFields', 'getInterfaces', 'toString', 'inspect', 'toJSON', '_enumConfig', 'getValue', 'getValues', 'parseLiteral', 'parseValue', 'getValue', 'serialize', '_getNameLookup', '_getValueLookup', '_values', 'resolveType', 'getTypes', '_types']));
			// metadata of fields
			each(get(schema, `_typeMap.${typeName}._fields`), (field) => {
				const fieldIndex = findIndex(get(schemaInfo, `${typeName}.fields`), { 'name': field.name });
				set(schemaInfo, `${typeName}.fields[${fieldIndex}].metadata`, omit(field, ['type', 'description', 'args', 'deprecationReason', 'astNode', 'isDeprecated', 'name']));
			});
			

			// add unions to types
			if (type.kind === 'UNION') {
				each(type.possibleTypes, possibleType => {
					schemaInfo[possibleType.name].unions = schemaInfo[possibleType.name].unions ? schemaInfo[possibleType.name].unions : [];
					schemaInfo[possibleType.name].unions = concat(schemaInfo[possibleType.name].unions,
						[{ kind: type.kind, name: type.name, ofType: type.ofType }]);
				});				
			}
		});
		return schemaInfo;
	}


}


import { GraphQLSchema, IntrospectionType, getIntrospectionQuery, graphql } from 'graphql';

import _ from 'lodash';

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
		_.each(astDirective.arguments, arg => {
			args.push({ name: arg.name.value, ..._.omit(arg.value, ['loc']) });
		});
		const directives = _.get(schemaInfo, path) ? _.get(schemaInfo, path) : [];
		directives.push({ name: name, args: args });
		_.set(schemaInfo, path, directives);
	}

	private buildSchemaInfo = async (schema): Promise<IntrospectionType[]> => {
		let originalSchemaInfo = await graphql(schema, getIntrospectionQuery({ descriptions: true }));
		originalSchemaInfo = originalSchemaInfo.data;
		let schemaInfo = <any>originalSchemaInfo;
		schemaInfo = _.omitBy(schemaInfo.__schema.types, (value) => {
			return _.startsWith(value.name, '__') || _.includes(['Boolean', 'String', 'ID', 'Int', 'Float'], value.name);
		});
		schemaInfo = _.mapKeys(schemaInfo, (type: any) => type.name);
		_.each(_.keys(schemaInfo), (typeName) => {
			const type = schemaInfo[typeName];
			// directives on type
			_.each(_.get(schema.getType(typeName), 'astNode.directives'), (astDirective) => {
				this.addDirectiveFromAST(astDirective, schemaInfo, `${typeName}.directives`);
			});
			// directives on fields
			_.each(_.get(schema.getType(typeName), 'astNode.fields'), (field) => {
				const fieldName = field.name.value;
				_.each(_.get(field, 'directives'), (astDirective) => {
					const fieldIndex = _.findIndex(_.get(schemaInfo, `${typeName}.fields`), { 'name': fieldName });
					this.addDirectiveFromAST(astDirective, schemaInfo, `${typeName}.fields[${fieldIndex}].directives`);
				});
			});
			// metadata on type
			_.set(schemaInfo, `${typeName}.metadata`, _.omit(_.get(schema, `_typeMap.${typeName}`), ['astNode', 'name', 'description', 'extensionASTNodes', 'isTypeOf', '_fields', '_interfaces', '_typeConfig', 'getFields', 'getInterfaces', 'toString', 'inspect', 'toJSON', '_enumConfig', 'getValue', 'getValues', 'parseLiteral', 'parseValue', 'getValue', 'serialize', '_getNameLookup', '_getValueLookup', '_values', 'resolveType', 'getTypes', '_types']));
			// metadata of fields
			_.each(_.get(schema, `_typeMap.${typeName}._fields`), (field) => {
				const fieldIndex = _.findIndex(_.get(schemaInfo, `${typeName}.fields`), { 'name': field.name });
				_.set(schemaInfo, `${typeName}.fields[${fieldIndex}].metadata`, _.omit(field, ['type', 'description', 'args', 'deprecationReason', 'astNode', 'isDeprecated', 'name']));
			});

			// add unions to types
			if (type.kind === 'UNION') {
				_.each(type.possibleTypes, possibleType => {
					schemaInfo[possibleType.name].unions = schemaInfo[possibleType.name].unions ? schemaInfo[possibleType.name].unions : [];
					schemaInfo[possibleType.name].unions = _.concat(schemaInfo[possibleType.name].unions,
						[{ kind: type.kind, name: type.name, ofType: type.ofType }]);
				});
			}

			// add _typename field
			if (!_.isEmpty(type.fields)) {
				type.fields.push({
					name: '_typename',
					description: 'Used internally to keep track of type name',
					type: { kind: 'SCALAR', name: 'String' }
				});
			}
		});

		return schemaInfo;
	}


}


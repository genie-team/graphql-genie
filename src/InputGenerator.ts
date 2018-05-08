
import { GraphQLBoolean, GraphQLField, GraphQLInputObjectType, GraphQLInputType, GraphQLList, GraphQLNamedType, GraphQLNonNull, GraphQLSchema, IntrospectionField, IntrospectionObjectType, IntrospectionType, isInputType, isInterfaceType, isNonNullType, isObjectType, isScalarType, isUnionType } from 'graphql';
import { each, get, merge } from 'lodash';
import pluralize from 'pluralize';
import { GenerateConfig } from './GraphQLGenieInterfaces';
import { Mutation, Relations, capFirst, fortuneFilters, getReturnGraphQLType, getReturnType, lowerFirst, stripNonNull, typeIsList } from './TypeGeneratorUtils';
export class InputGenerator {

	private type: GraphQLNamedType;
	private config: GenerateConfig;
	private currInputObjectTypes: Map<string, GraphQLInputType>;
	private schemaInfo: IntrospectionType[];
	private schema: GraphQLSchema;
	private relations: Relations;
	private nestedGenerators: Map<string, {'function': () => GraphQLInputType, 'args': Array<any>, 'this': InputGenerator}>;
	private dummy: boolean;

	constructor($type: GraphQLNamedType, $config: GenerateConfig, $currInputObjectTypes: Map<string, GraphQLInputType>,
		 $schemaInfo: IntrospectionType[], $schema: GraphQLSchema, $relations: Relations, $dummy = false) {
		this.type = $type;
		this.config = $config;
		this.currInputObjectTypes = $currInputObjectTypes;
		this.schemaInfo = $schemaInfo;
		this.schema = $schema;
		this.relations = $relations;
		this.nestedGenerators = new Map<string, {'function': () => GraphQLInputType, 'args': Array<any>, 'this': InputGenerator}>();
		this.dummy = $dummy;
	}

	private handleNestedGenerators() {
		this.nestedGenerators.forEach((generator) => {
			if (generator.function) {
				generator.function.apply(generator.this, generator.args);
			}
			generator.function = null;
		});
	}

	private generateInputTypeForField(field: GraphQLField<any, any, {[argName: string]: any; }>,
		manyWithout: (fieldType: GraphQLNamedType, relationFieldName: string) => GraphQLInputType,
		oneWithout: (fieldType: GraphQLNamedType, relationFieldName: string) => GraphQLInputType,
		many: (fieldType: GraphQLNamedType) => GraphQLInputType,
		one: (fieldType: GraphQLNamedType) => GraphQLInputType,
	): GraphQLInputType {
		let inputType: GraphQLInputType;
		const fieldType = getReturnGraphQLType(field.type);
		const relationFieldName = this.relations.getInverseWithoutName(fieldType.name, field.name);
		const isList = typeIsList(field.type);
		// tslint:disable-next-line:prefer-conditional-expression
		if (relationFieldName) {
			inputType = isList ? manyWithout.call(this, fieldType, relationFieldName) : oneWithout.call(this, fieldType, relationFieldName);
		} else {
			inputType = isList ? many.call(this, fieldType) : one.call(this, fieldType);
		}
		return inputType;
	}

	private generateInputTypeForFieldInfo(field: IntrospectionField, mutation: Mutation): GraphQLInputType {
		let inputType: GraphQLInputType;
		const fieldTypeName = getReturnType(field.type);
		const schemaType = this.schema.getType(fieldTypeName);
		if (isInputType(schemaType)) {
			inputType = schemaType;
		} else {
			const isArray = typeIsList(field.type);
			let fieldInputName = schemaType.name;
			let fieldSuffix = Mutation[mutation];
			fieldSuffix += isArray ? 'Many' : 'One';

			const relationFieldName = this.relations.getInverseWithoutName(fieldTypeName, field.name);
			fieldSuffix += relationFieldName ? 'Without'  : '';
			fieldInputName += fieldSuffix + capFirst(relationFieldName) + 'Input';
			if (isInterfaceType(schemaType)) {
				if (this.currInputObjectTypes.has(fieldInputName)) {
					inputType = this.currInputObjectTypes.get(fieldInputName);
				} else {
					const fields = {};
					const possibleTypes = this.schemaInfo[fieldTypeName].possibleTypes;
					possibleTypes.forEach(typeInfo => {
						const typeName = isArray ? pluralize(typeInfo.name) : typeInfo.name;
						const fieldName = lowerFirst(typeName);
						const fieldInputTypeName = typeInfo.name + fieldSuffix + capFirst(relationFieldName) + 'Input';
						merge(fields, this.generateFieldForInput(
							fieldName,
							new GraphQLInputObjectType({name: fieldInputTypeName, fields: {}})));

						const functionName = `generate${fieldSuffix}Input`;
						if (!this.dummy && !this.nestedGenerators.has(fieldInputTypeName)) {
							const possibleSchemaType = getReturnGraphQLType(this.schema.getType(typeInfo.name));
							const possibleTypeGenerator = new InputGenerator(possibleSchemaType, this.config, this.currInputObjectTypes, this.schemaInfo, this.schema, this.relations, true);
							this.nestedGenerators.set(fieldInputTypeName, {
								'function': possibleTypeGenerator[functionName],
								'args': [possibleSchemaType, relationFieldName],
								'this': possibleTypeGenerator
							});
						}
					});
					this.currInputObjectTypes.set(fieldInputName, new GraphQLInputObjectType({
						name: fieldInputName,
						fields
					}));
					inputType = this.currInputObjectTypes.get(fieldInputName);
				}
			} else {
				inputType = new GraphQLInputObjectType({name: fieldInputName, fields: {}});
			}
		}
		if (!this.dummy) {
			this.handleNestedGenerators();
		}

		return inputType;
	}

	private generateFieldForInput = (fieldName: string, inputType: GraphQLInputType, defaultValue?: string): object => {
		const field = {};
		field[fieldName] = {
			type: inputType,
			defaultValue: defaultValue
		};
		return field;
	}

	generateWhereUniqueInput(fieldType: GraphQLNamedType = this.type): GraphQLInputType {
		const name = fieldType.name + 'WhereUniqueInput';
		if (!this.currInputObjectTypes.has(name)) {
			const fields = {};
			const infoType = <IntrospectionObjectType>this.schemaInfo[fieldType.name];
			infoType.fields.forEach(field => {
				if (get(field, 'metadata.unique') === true) {
					const isArray = typeIsList(field.type);
					const schemaType = this.schema.getType(getReturnType(field.type));
					let inputType;
					if (isInputType(schemaType)) {
						inputType = schemaType;
					} else {
						const fieldInputName = schemaType.name + 'WhereUniqueInput';
						inputType = new GraphQLInputObjectType({name: fieldInputName, fields: {}});
					}
					if (isArray) {
						inputType = new GraphQLList(inputType);
					}
					merge(fields, this.generateFieldForInput(
						field.name,
						inputType,
						get(field, 'metadata.defaultValue')));
				}
			});

			this.currInputObjectTypes.set(name, new GraphQLInputObjectType({
				name,
				fields
			}));
		}
		return this.currInputObjectTypes.get(name);
	}

	generateFilterInput(fieldType: GraphQLNamedType = this.type): GraphQLInputType {
		const name = fieldType.name + 'FilterInput';
		if (!this.currInputObjectTypes.has(name)) {
			const dummyListOfFilterInput = new GraphQLList(new GraphQLNonNull(new GraphQLInputObjectType({name: name, fields: {}})));
			const existsFields = {};
			const matchFields = {};
			const rangeFields = {};
			const fields = {
				and: {type: dummyListOfFilterInput},
				or: {type: dummyListOfFilterInput},
				not: {type: dummyListOfFilterInput}
			};
			const infoType = <IntrospectionObjectType>this.schemaInfo[fieldType.name];
			infoType.fields.forEach(field => {
					const schemaType = this.schema.getType(getReturnType(field.type));

					merge(existsFields, this.generateFieldForInput(
						field.name,
						GraphQLBoolean));

					let inputType;
					if (isScalarType(schemaType)) {
						inputType = schemaType;
						merge(matchFields, this.generateFieldForInput(
							field.name,
							new GraphQLList(new GraphQLNonNull(inputType))));

						merge(rangeFields, this.generateFieldForInput(
							field.name,
							new GraphQLList(inputType)));
					} else {
						const fieldInputName = schemaType.name + 'FilterInput';
						let fieldName = field.name;
						if (isInterfaceType(schemaType) || isUnionType(schemaType)) {

							if (!this.currInputObjectTypes.has(fieldInputName)) {
								const interfaceFields = {};
								const possibleTypes: IntrospectionObjectType[] = this.schemaInfo[schemaType.name].possibleTypes;
								possibleTypes.forEach(typeInfo => {
									const possibleSchemaType = getReturnGraphQLType(this.schema.getType(typeInfo.name));
									const possibleTypeGenerator = new InputGenerator(possibleSchemaType, this.config, this.currInputObjectTypes, this.schemaInfo, this.schema, this.relations, true);
									const possibleTypeFilter = possibleTypeGenerator.generateFilterInput();
									const possibleTypeFieldMap = (<GraphQLInputObjectType>possibleTypeFilter).getFields();
									merge(interfaceFields, possibleTypeFieldMap);
								});
								inputType = new GraphQLInputObjectType({name: fieldInputName, fields: interfaceFields});
								this.currInputObjectTypes.set(fieldInputName, inputType);
							}
						} else {
							inputType = new GraphQLInputObjectType({name: fieldInputName, fields: {}});
							if (fortuneFilters.includes(fieldName)) {
								fieldName = 'f_' + fieldName;
							}
						}
						merge(fields, this.generateFieldForInput(
							fieldName,
							inputType));
					}
			});

			const existsName = fieldType.name + 'ExistsInput';
			const matchName = fieldType.name + 'MatchInput';
			const rangeName = fieldType.name + 'RangeInput';
			const existsInput = new GraphQLInputObjectType({
				name: existsName,
				fields: existsFields
			});
			const matchInput = new GraphQLInputObjectType({
				name: matchName,
				fields: matchFields
			});
			const rangeInput = new GraphQLInputObjectType({
				name: rangeName,
				fields: rangeFields
			});

			this.currInputObjectTypes.set(existsName, existsInput);
			this.currInputObjectTypes.set(matchName, matchInput);
			this.currInputObjectTypes.set(rangeName, rangeInput);

			merge(fields, {
				exists: {type: existsInput},
				match: {type: matchInput},
				range: {type: rangeInput}
			});

			this.currInputObjectTypes.set(name, new GraphQLInputObjectType({
				name,
				fields
			}));
		}
		return this.currInputObjectTypes.get(name);
	}

	generateCreateWithoutInput(fieldType: GraphQLNamedType = this.type, relationFieldName?: string): GraphQLInputType {

		let name = fieldType.name + 'Create';
		name += relationFieldName ? 'Without' + capFirst(relationFieldName) : '';
		name += 'Input';
		if (!relationFieldName) {
			return new GraphQLInputObjectType({name, fields: {}});
		}
		if (!this.currInputObjectTypes.has(name)) {
			const fields = {};
			const infoType = <IntrospectionObjectType>this.schemaInfo[fieldType.name];
			infoType.fields.forEach(field => {
				if (field.name !== relationFieldName && field.name !== 'id') {
					let inputType = this.generateInputTypeForFieldInfo(field, Mutation.Create);
					if (field.type.kind === 'NON_NULL') {
						inputType = new GraphQLNonNull(inputType);
					}

					merge(fields, this.generateFieldForInput(
						field.name,
						inputType,
						get(field, 'metadata.defaultValue')));
				}
			});

			this.currInputObjectTypes.set(name, new GraphQLInputObjectType({
				name,
				fields
			}));
		}
		return this.currInputObjectTypes.get(name);
	}

	generateCreateManyWithoutInput(fieldType: GraphQLNamedType  = this.type, relationFieldName: string): GraphQLInputType {
		const name = fieldType.name + 'CreateManyWithout' + capFirst(relationFieldName) + 'Input';
		if (!this.currInputObjectTypes.has(name)) {
			const fields = {};
			fields['create'] = {type: new GraphQLList(new GraphQLNonNull(this.generateCreateWithoutInput(fieldType, relationFieldName)))};
			fields['connect'] = {type: new GraphQLList(new GraphQLNonNull(this.generateWhereUniqueInput(fieldType)))};
			this.currInputObjectTypes.set(name, new GraphQLInputObjectType({
				name,
				fields
			}));
		}
		return this.currInputObjectTypes.get(name);
	}

	generateCreateOneWithoutInput(fieldType: GraphQLNamedType, relationFieldName: string): GraphQLInputType {
		const name = fieldType.name + 'CreateOneWithout' + capFirst(relationFieldName) + 'Input';
		if (!this.currInputObjectTypes.has(name)) {
			const fields = {};
			fields['create'] = {type: this.generateCreateWithoutInput(fieldType, relationFieldName)};
			fields['connect'] = {type: this.generateWhereUniqueInput(fieldType)};
			this.currInputObjectTypes.set(name, new GraphQLInputObjectType({
				name,
				fields
			}));
		}
		return this.currInputObjectTypes.get(name);
	}

	generateCreateManyInput(fieldType: GraphQLNamedType): GraphQLInputType {
		const name = fieldType.name + 'CreateManyInput';
		if (!this.currInputObjectTypes.has(name)) {
			const fields = {};
			fields['create'] = {type: new GraphQLList(new GraphQLNonNull(this.generateCreateWithoutInput(fieldType)))};
			fields['connect'] = {type: new GraphQLList(new GraphQLNonNull(this.generateWhereUniqueInput(fieldType)))};
			this.currInputObjectTypes.set(name, new GraphQLInputObjectType({
				name,
				fields
			}));
		}
		return this.currInputObjectTypes.get(name);
	}

	generateCreateOneInput(fieldType: GraphQLNamedType): GraphQLInputType {
		const name = fieldType.name + 'CreateOneInput';
		if (!this.currInputObjectTypes.has(name)) {
			const fields = {};
			fields['create'] = {type: this.generateCreateWithoutInput(fieldType)};
			fields['connect'] = {type: this.generateWhereUniqueInput(fieldType)};
			this.currInputObjectTypes.set(name, new GraphQLInputObjectType({
				name,
				fields
			}));
		}
		return this.currInputObjectTypes.get(name);
	}

	generateCreateInput(): GraphQLInputType {
		const name = this.type.name + 'CreateInput';
		const fields = {};
		if (isObjectType(this.type) && !this.currInputObjectTypes.has(name)) {
			each(this.type.getFields(), field => {
				if (field.name !== 'id') {
					let inputType;
					if (isInputType(field.type)) {
						inputType = field.type;
					} else {
						inputType = this.generateInputTypeForField(field, this.generateCreateManyWithoutInput,
							this.generateCreateOneWithoutInput,
							this.generateCreateManyInput,
							this.generateCreateOneInput);
						if (isNonNullType(field.type)) {
							inputType = new GraphQLNonNull(inputType);
						}
					}
					merge(fields, this.generateFieldForInput(
						field.name,
						inputType,
						get(this.schemaInfo[this.type.name].fields.find((introField) => introField.name === field.name), 'metadata.defaultValue')));
				}
			});

			this.currInputObjectTypes.set(name, new GraphQLInputObjectType({
				name,
				fields
			}));

		}
		return this.currInputObjectTypes.get(name);
	}

	generateUpdateWithoutInput(fieldType: GraphQLNamedType, relationFieldName?: string): GraphQLInputType {

		let name = fieldType.name + 'Update';
		name += relationFieldName ? 'Without' + capFirst(relationFieldName) : '';
		name += 'Input';
		if (!relationFieldName) {
			return new GraphQLInputObjectType({name, fields: {}});
		}
		if (!this.currInputObjectTypes.has(name)) {
			const fields = {};
			const infoType = <IntrospectionObjectType>this.schemaInfo[fieldType.name];
			infoType.fields.forEach(field => {
				if (field.name !== relationFieldName && field.name !== 'id') {
					const inputType = this.generateInputTypeForFieldInfo(field, Mutation.Update);
					merge(fields, this.generateFieldForInput(
						field.name,
						inputType));
				}
			});

			this.currInputObjectTypes.set(name, new GraphQLInputObjectType({
				name,
				fields
			}));
		}
		return this.currInputObjectTypes.get(name);
	}

	generateUpdateWithWhereUniqueWithoutInput(fieldType: GraphQLNamedType, relationFieldName?: string): GraphQLInputType {
		const name = fieldType.name + 'UpdateWithWhereUniqueWithout' + capFirst(relationFieldName) + 'Input';
		if (!this.currInputObjectTypes.has(name)) {
			const fields = {};
			fields['data'] = {type: new GraphQLNonNull(this.generateUpdateWithoutInput(fieldType, relationFieldName))};
			fields['where'] = {type: new GraphQLNonNull(this.generateWhereUniqueInput(fieldType))};
			this.currInputObjectTypes.set(name, new GraphQLInputObjectType({
				name,
				fields
			}));
		}
		return this.currInputObjectTypes.get(name);
	}

	generateUpdateManyWithoutInput(fieldType: GraphQLNamedType, relationFieldName: string): GraphQLInputType {
		const name = fieldType.name + 'UpdateManyWithout' + capFirst(relationFieldName) + 'Input';
		if (!this.currInputObjectTypes.has(name)) {
			const fields = {};
			fields['create'] = {type: new GraphQLList(new GraphQLNonNull(this.generateCreateWithoutInput(fieldType, relationFieldName)))};
			fields['connect'] = {type: new GraphQLList(new GraphQLNonNull(this.generateWhereUniqueInput(fieldType)))};
			fields['disconnect'] = {type: new GraphQLList(new GraphQLNonNull(this.generateWhereUniqueInput(fieldType)))};
			fields['delete'] = {type: new GraphQLList(new GraphQLNonNull(this.generateWhereUniqueInput(fieldType)))};
			fields['update'] = {type: new GraphQLList(new GraphQLNonNull(this.generateUpdateWithWhereUniqueWithoutInput(fieldType, relationFieldName)))};
			if (this.config.generateUpsert) {
				fields['upsert'] = {type: new GraphQLList(new GraphQLNonNull(this.generateUpsertWithWhereUniqueWithoutInput(fieldType, relationFieldName)))};
			}
			this.currInputObjectTypes.set(name, new GraphQLInputObjectType({
				name,
				fields
			}));
		}
		return this.currInputObjectTypes.get(name);
	}

	generateUpdateOneWithoutInput(fieldType: GraphQLNamedType, relationFieldName: string): GraphQLInputType {
		const name = fieldType.name + 'UpdateOneWithout' + capFirst(relationFieldName) + 'Input';
		if (!this.currInputObjectTypes.has(name)) {
			const fields = {};
			fields['create'] = {type: this.generateCreateWithoutInput(fieldType, relationFieldName)};
			fields['connect'] = {type: this.generateWhereUniqueInput(fieldType)};
			fields['disconnect'] = {type: GraphQLBoolean};
			fields['delete'] = {type: GraphQLBoolean};
			fields['update'] = {type: this.generateUpdateWithoutInput(fieldType, relationFieldName)};
			if (this.config.generateUpsert) {
				fields['upsert'] = {type: this.generateUpsertWithoutInput(fieldType, relationFieldName)};
			}
			this.currInputObjectTypes.set(name, new GraphQLInputObjectType({
				name,
				fields
			}));
		}
		return this.currInputObjectTypes.get(name);
	}

	generateUpdateManyInput(fieldType: GraphQLNamedType): GraphQLInputType {
		const name = fieldType.name + 'UpdateManyInput';
		if (!this.currInputObjectTypes.has(name)) {
			const fields = {};
			fields['create'] = {type: new GraphQLList(new GraphQLNonNull(this.generateCreateWithoutInput(fieldType)))};
			fields['connect'] = {type: new GraphQLList(new GraphQLNonNull(this.generateWhereUniqueInput(fieldType)))};
			fields['disconnect'] = {type: new GraphQLList(new GraphQLNonNull(this.generateWhereUniqueInput(fieldType)))};
			fields['delete'] = {type: new GraphQLList(new GraphQLNonNull(this.generateWhereUniqueInput(fieldType)))};
			fields['update'] = {type: new GraphQLList(new GraphQLNonNull(this.generateUpdateWithWhereUniqueWithoutInput(fieldType)))};
			if (this.config.generateUpsert) {
				fields['upsert'] = {type: new GraphQLList(new GraphQLNonNull(this.generateUpsertWithWhereUniqueWithoutInput(fieldType)))};
			}
			this.currInputObjectTypes.set(name, new GraphQLInputObjectType({
				name,
				fields
			}));
		}
		return this.currInputObjectTypes.get(name);
	}

	generateUpdateOneInput(fieldType: GraphQLNamedType): GraphQLInputType {
		const name = fieldType.name + 'UpdateOneInput';
		if (!this.currInputObjectTypes.has(name)) {
			const fields = {};
			fields['create'] = {type: this.generateCreateWithoutInput(fieldType)};
			fields['connect'] = {type: this.generateWhereUniqueInput(fieldType)};
			fields['disconnect'] = {type: GraphQLBoolean};
			fields['delete'] = {type: GraphQLBoolean};
			fields['update'] = {type: this.generateUpdateWithoutInput(fieldType)};
			if (this.config.generateUpsert) {
				fields['upsert'] = {type: this.generateUpsertWithoutInput(fieldType)};
			}
			this.currInputObjectTypes.set(name, new GraphQLInputObjectType({
				name,
				fields
			}));
		}
		return this.currInputObjectTypes.get(name);
	}

	generateUpdateInput(): GraphQLInputType {
		const name = this.type.name + 'UpdateInput';
		const fields = {};
		if (isObjectType(this.type) && !this.currInputObjectTypes.has(name)) {
			each(this.type.getFields(), field => {
				if (field.name !== 'id') {
					let inputType;
					if (isInputType(field.type)) {
						inputType = stripNonNull(field.type);
					} else {
						inputType = this.generateInputTypeForField(field, this.generateUpdateManyWithoutInput,
							this.generateUpdateOneWithoutInput,
							this.generateUpdateManyInput,
							this.generateUpdateOneInput);
					}
					merge(fields, this.generateFieldForInput(
						field.name,
						inputType));
				}
			});

			this.currInputObjectTypes.set(name, new GraphQLInputObjectType({
				name,
				fields
			}));

		}
		return this.currInputObjectTypes.get(name);
	}

	generateUpsertWithoutInput(fieldType: GraphQLNamedType, relationFieldName?: string): GraphQLInputType {

		let name = fieldType.name + 'Upsert';
		name += relationFieldName ? 'Without' + capFirst(relationFieldName) : '';
		name += 'Input';
		if (!this.currInputObjectTypes.has(name)) {
			const fields = {};
			fields['update'] = {type: new GraphQLNonNull(this.generateUpdateWithoutInput(fieldType, relationFieldName))};
			fields['create'] = {type: new GraphQLNonNull(this.generateCreateWithoutInput(fieldType, relationFieldName))};
			this.currInputObjectTypes.set(name, new GraphQLInputObjectType({
				name,
				fields
			}));
		}
		return this.currInputObjectTypes.get(name);
	}

	generateUpsertWithWhereUniqueWithoutInput(fieldType: GraphQLNamedType, relationFieldName?: string): GraphQLInputType {
		const name = fieldType.name + 'UpsertWithWhereUniqueWithout' + capFirst(relationFieldName) + 'Input';
		if (!this.currInputObjectTypes.has(name)) {
			const fields = {};
			fields['update'] = {type: new GraphQLNonNull(this.generateUpdateWithoutInput(fieldType, relationFieldName))};
			fields['create'] = {type: new GraphQLNonNull(this.generateCreateWithoutInput(fieldType, relationFieldName))};
			fields['where'] = {type: new GraphQLNonNull(this.generateWhereUniqueInput(fieldType))};
			this.currInputObjectTypes.set(name, new GraphQLInputObjectType({
				name,
				fields
			}));
		}
		return this.currInputObjectTypes.get(name);
	}
}

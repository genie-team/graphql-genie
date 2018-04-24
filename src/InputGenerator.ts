
import { Relations, fieldIsArray, getReturnGraphQLType, getReturnType } from './TypeGeneratorUtils';
import { GraphQLInputObjectType, GraphQLInputType, GraphQLList, GraphQLNamedType, GraphQLNonNull,
	 GraphQLSchema, IntrospectionObjectType, IntrospectionType, isInputType, isObjectType } from 'graphql';
import { each, get, merge } from 'lodash';

export class InputGenerator {

	private type: GraphQLNamedType;
	private currInputObjectTypes: Map<string, GraphQLInputType>;
	private schemaInfo: IntrospectionType[];
	private schema: GraphQLSchema;
	private relations: Relations;

	constructor($type: GraphQLNamedType, $currInputObjectTypes: Map<string, GraphQLInputType>,
		 $schemaInfo: IntrospectionType[], $schema: GraphQLSchema, $relations: Relations) {
		this.type = $type;
		this.currInputObjectTypes = $currInputObjectTypes;
		this.schemaInfo = $schemaInfo;
		this.schema = $schema;
		this.relations = $relations;
	}

	generateFieldForInput = (fieldName: string, inputType: GraphQLInputType, defaultValue?: string): object => {
		const field = {};
		field[fieldName] = {
			type: inputType,
			defaultValue: defaultValue
		};
		return field;
	}

	generateCreateWithoutInput(fieldType: GraphQLNamedType, relationFieldName?: string): GraphQLInputType {

		let name = fieldType.name + 'Create';
		name += relationFieldName ? 'Without' + relationFieldName.charAt(0).toUpperCase() + relationFieldName.slice(1) : '';
		name += 'Input';
		if (!relationFieldName) {
			return new GraphQLInputObjectType({name, fields: {}});
		}
		if (!this.currInputObjectTypes.has(name)) {
			const fields = {};
			const infoType = <IntrospectionObjectType>this.schemaInfo[fieldType.name];
			infoType.fields.forEach(field => {
				if (field.name !== relationFieldName) {
					const schemaType = this.schema.getType(getReturnType(field.type));
					let inputType;
					if (isInputType(schemaType)) {
						inputType = field.type;
					} else {
						const isArray = fieldIsArray(field.type);
						let fieldInputName = schemaType.name + 'Create';
						fieldInputName += isArray ? 'Many' : 'One';

						const relationFieldName = this.relations.getInverseWithoutName(schemaType.name, field.name);
						fieldInputName += relationFieldName ? 'Without' + relationFieldName : '';
						fieldInputName += 'Input';
						inputType = new GraphQLInputObjectType({name: fieldInputName, fields: {}});
					}

					this.generateFieldForInput(
						field.name,
						inputType,
						get(field, 'metadata.defaultValue'));
				}
			});

			this.currInputObjectTypes.set(name, new GraphQLInputObjectType({
				name,
				fields
			}));
		}
		return this.currInputObjectTypes.get(name);
	}


	generateWhereUniqueInput(fieldType: GraphQLNamedType): GraphQLInputType {
		const name = fieldType.name + 'WhereUniqueInput';
		if (!this.currInputObjectTypes.has(name)) {
			const fields = {};
			const infoType = <IntrospectionObjectType>this.schemaInfo[fieldType.name];
			infoType.fields.forEach(field => {
				if (get(field, 'metadata.unique') === true) {
					const isArray = fieldIsArray(field.type);
					const schemaType = this.schema.getType(getReturnType(field.type));
					let inputType;
					if (isInputType(schemaType)) {
						inputType = field.type;
					} else {
						const fieldInputName = schemaType.name + 'WhereUniqueInput';
						inputType = new GraphQLInputObjectType({name: fieldInputName, fields: {}});
					}
					if (isArray) {
						inputType = new GraphQLList(inputType);
					}
					this.generateFieldForInput(
						field.name,
						inputType,
						get(field, 'metadata.defaultValue'));
				}
			});

			this.currInputObjectTypes.set(name, new GraphQLInputObjectType({
				name,
				fields
			}));
		}
		return this.currInputObjectTypes.get(name);
	}
	generateCreateManyWithoutInput(fieldType: GraphQLNamedType, relationFieldName: string): GraphQLInputType {
		const name = fieldType.name + 'CreateManyWithout' + relationFieldName.charAt(0).toUpperCase() + relationFieldName.slice(1) + 'Input';
		if (!this.currInputObjectTypes.has(name)) {
			const fields = {};
			fields['create'] = new GraphQLList(new GraphQLNonNull(this.generateCreateWithoutInput(fieldType, relationFieldName)));
			fields['connect'] = new GraphQLList(new GraphQLNonNull(this.generateWhereUniqueInput(fieldType)));
			this.currInputObjectTypes.set(name, new GraphQLInputObjectType({
				name,
				fields
			}));
		}
		return this.currInputObjectTypes.get(name);
	}

	generateCreateOneWithoutInput(fieldType: GraphQLNamedType, relationFieldName: string): GraphQLInputType {
		const name = fieldType.name + 'CreateOneWithout' + relationFieldName.charAt(0).toUpperCase() + relationFieldName.slice(1) + 'Input';
		if (!this.currInputObjectTypes.has(name)) {
			const fields = {};
			fields['create'] = this.generateCreateWithoutInput(fieldType, relationFieldName);
			fields['connect'] = this.generateWhereUniqueInput(fieldType);
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
			fields['create'] = new GraphQLList(new GraphQLNonNull(this.generateCreateWithoutInput(fieldType)));
			fields['connect'] = new GraphQLList(new GraphQLNonNull(this.generateWhereUniqueInput(fieldType)));
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
			fields['create'] = this.generateCreateWithoutInput(fieldType);
			fields['connect'] = this.generateWhereUniqueInput(fieldType);
			this.currInputObjectTypes.set(name, new GraphQLInputObjectType({
				name,
				fields
			}));
		}
		return this.currInputObjectTypes.get(name);
	}

	generateCreateInput(fields = {}): GraphQLInputType {
		const name = this.type.name + 'CreateInput';
		if (isObjectType(this.type) && !this.currInputObjectTypes.has(name)) {
			each(this.type.getFields(), field => {
				if (field.name !== 'id') {
					let inputType;
					if (isInputType(field.type)) {
						inputType = field.type;
					} else {
						const relationFieldName = this.relations.getInverseWithoutName(this.type.name, field.name);
						const isList = fieldIsArray(field.type);
						const fieldType = getReturnGraphQLType(field.type);
						if (relationFieldName) {
							// tslint:disable-next-line:prefer-conditional-expression
							if (isList) {
								inputType = this.generateCreateManyWithoutInput(fieldType, relationFieldName);
							} else {
								inputType = this.generateCreateOneWithoutInput(fieldType, relationFieldName);
							}
						} else {
							if (isList) {
								inputType = this.generateCreateManyInput(fieldType);
							} else {
								inputType = this.generateCreateOneInput(fieldType);
							}
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


}

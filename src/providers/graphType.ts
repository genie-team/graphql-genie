

import { get, set } from './storage';
import _ from 'lodash';
// import { makeExecutableSchema } from 'graphql-tools';
// const typeDefs = `
// """
// Schema metadata for use in displaying the schema
// """
// directive @display(
//   name: String
// ) on FIELD_DEFINITION | ENUM_VALUE | OBJECT
// `;



// console.info(makeExecutableSchema({typeDefs}));
import QueryBuilder from './queryBuilder';



// export function printSchemaWithDirectives(schema) {
// 	const str = Object
// 		.keys(schema.getTypeMap())
// 		.filter(k => !k.match(/^__/))
// 		.reduce((accum, name) => {
// 			const type = schema.getType(name);
// 			return !isSpecifiedScalarType(type)
// 				? accum += `${print(type.astNode)}\n`
// 				: accum;
// 		}, '');

// 	return schema
// 		.getDirectives()
// 		.reduce((accum, d) => {
// 			return !isSpecifiedDirective(d)
// 				? accum += `${print(d.astNode)}\n`
// 				: accum;
// 		}, str + `${print(schema.astNode)}\n`);
// }



new QueryBuilder();


export class DirectiveBuilder {
	name: string;
	args: Map<string, string> = new Map<string, string>();
	constructor(name: string) {
		this.name = name;
	}

	addArg(key: string, value: string) {
		this.args.set(key, value);
	}

	addArgs(args: Map<string, string>) {
		args.forEach((value, key) => {
			this.args.set(key, value);
		});
	}

	getString(): string {
		let str = '@' + this.name;
		if (this.args.size > 0) { str += '('; }
		let i = 0;
		for (const [name, value] of this.args) {
			str += name + ': ' + value;
			i++;
			if (i !== this.args.size) { str += ', '; }
		}
		if (this.args.size > 0) { str += ')'; }
		return str;
	}
}

export class FieldBuilder {
	name: string;
	description: string;
	type: string;
	isArray = false;
	nonNullArray = false;
	nonNullValue = false;
	directives: DirectiveBuilder[] = [];

	constructor(name: string, type?: string, description?: string) {
		this.name = name;
		this.type = type;
		this.description = description;
	}

	addDirective(directives: DirectiveBuilder | DirectiveBuilder[]) {
		directives = _.isArray(directives) ? directives : [directives];
		this.directives.push(...directives);
	}

	getString(): string {
		let field = '';
		if (!_.isEmpty(this.description)) field += '"""\n' + this.description + '\n"""\n';
		field += this.name;
		if (!_.isEmpty(this.type)) {
			field += ': ';
			if (this.isArray) field += '[';
			field += this.type;
			if (this.nonNullValue) field += '!';
			if (this.isArray) field += ']';
			if (this.isArray && this.nonNullArray) field += '!';
			for (const directive of this.directives) {
				field += ' ' + directive.getString();
			}
		}

		return field;
	}
}

export class SchemaTypeBuilder {
	name: string;
	description: string;
	fields: FieldBuilder[] = [];
	directives: DirectiveBuilder[] = [];
	type = 'type';
	extend = false;
	implements: string[] = [];
	constructor(name?: string, type?: string, description?: string, fields?: FieldBuilder[]) {
		this.name = name;
		this.type = type;
		this.description = description;
		this.fields = fields ? fields : [];
	}

	addField(fields: FieldBuilder | FieldBuilder[]) {
		fields = _.isArray(fields) ? fields : [fields];
		this.fields.push(...fields);
	}

	addDirective(directives: DirectiveBuilder | DirectiveBuilder[]) {
		directives = _.isArray(directives) ? directives : [directives];
		this.directives.push(...directives);
	}

	getString(): string {
		let type = '';
		// type and name
		if (!_.isEmpty(this.description)) type += '"""\n' + this.description + '\n"""\n';
		type += this.type + ' ' + this.name;

		// add directives
		for (const directive of this.directives) {
			type += ' ' + directive.getString();
		}

		// add implements
		if (this.implements.length > 0) { type += ' implements '; }
		for (const implement of this.implements) {
			type += implement + ', ';
		}
		if (this.implements.length > 0) { type = type.substr(0, type.length - 2); }

		if (this.fields.length > 0) {
			// add fields, special condition for unions
			type += this.type === 'union' ? ' = ' : ' {\n';
			for (const field of this.fields) {
				type += field.getString();
				type += this.type === 'union' ? ' | ' : '\n';
			}
			if (this.type === 'union') type = type.substr(0, type.length - 3);
			type += this.type === 'union' ? '\n' : ' }';
		}

		type += '\n';

		return type;
	}
}


export class GraphQLTypeController {
	types: Map<string, SchemaTypeBuilder> = new Map<string, SchemaTypeBuilder>();
	loaded = false;

	constructor() {
		this.loadTypes();
	}

	addType(name: string, type: string, description?: string) {
		this.types.set(name, new SchemaTypeBuilder(name, type, description));
		this.saveTypes();
	}

	deleteType(name: string) {
		this.types.delete(name);
		this.saveTypes();
	}

	getTypes(): SchemaTypeBuilder[] {
		return [...this.types.values()];
	}

	private async loadTypes() {
		const typesArr = <string[]>await get('types');
		if (!_.isEmpty(typesArr)) {
			// console.info(typesArr);
			for (const typeStr of typesArr) {
				const type = Object.assign(new SchemaTypeBuilder(), JSON.parse(typeStr));
				// console.info(type);
				// console.info(type.getString());

				this.types.set(type.name, type);
			}
		}
		this.loaded = true;
		return this.loaded;
	}

	private async saveTypes() {
		const typesArr = [];
		for (const [, type] of this.types) {
			typesArr.push(JSON.stringify(type));
		}
		await set('types', typesArr);
		return true;
	}

}

export const GraphTypeCtrl = new GraphQLTypeController();



// import { GraphQLObjectType } from 'graphql'; // ES6
// import graphqltools from 'graphql-tools';
// import _ from 'lodash';



// export class GraphQLTypeController {
// 	types: Map<string, TypeBuilder> = new Map<string, TypeBuilder>();

//   async setObject(type: TypeBuilder): Promise<TypeBuilder> {
// 		this.types.set(type.name, type);
// 		return type;
// 	}

// 	setFieldOnObject(objName: string, fields: string | string[]) {
// 		this.types.get(objName).addField(fields);
// 	}

// 	async getTypes(): Promise<Array<GraphQLObjectType>> {
// 		return null;
// 	}


// }


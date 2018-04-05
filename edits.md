
/Users/Corey/Documents/workspace/mkr/node_modules/@stencil/core/dist/compiler/index.js

                config.sys.rollup.plugins.nodeResolve({
										extensions: ['.mjs', '.js', '.json'],
                    jsnext: true,
                    main: true
                }),
                config.sys.rollup.plugins.commonjs({
                    include: 'node_modules/**',
										sourceMap: false,
										namedExports: {
											'node_modules/graphql-tools/dist/index.js': [ 'SchemaDirectiveVisitor', 'makeExecutableSchema', 'addResolveFunctionsToSchema' ]
											}
                }),
/Users/Corey/Documents/workspace/mkr/node_modules/zen-observable-ts/lib/zenObservable.js

import zenObservable from 'zen-observable';
export var Observable = zenObservable;
//# sourceMappingURL=zenObservable.js.map


/Users/Corey/Documents/workspace/mkr/node_modules/@types/graphql/type/definition.d.ts

export function isOutputType(type: GraphQLType): type is GraphQLOutputType;

export function isInterfaceType(type: GraphQLType): type is GraphQLInterfaceType;
export function isListType(type: GraphQLType): type is GraphQLList<any>;
export function isUnionType(type: GraphQLType): type is GraphQLUnionType;
export function isNonNullType(type: GraphQLType): type is GraphQLNonNull<any>;
export function isObjectType(type: GraphQLType): type is GraphQLObjectType;

export function isIntrospectionType(type:any): boolean;



node_modules/@stencil/core/node_modules/rollup-plugin-commonjs/dist/rollup-plugin-commonjs.cjs.js:765 change to:

					{ return ("import * as " + name$1 + " from " + (JSON.stringify( actualId$1 )) + "; export default " + name$1 + ";"); }

import commonjs from 'rollup-plugin-commonjs';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
export default [
	// browser-friendly UMD build
	{
		input: 'src/main.ts',
		output: {
			name: 'graphql-genie',
			file: pkg.browser,
			format: 'umd',
			globals: {
				graphql: 'graphql_1',
				lodash: 'lodash'
			}
		},
		watch: {
			include: 'src/**'
		},
		onwarn,
		plugins: [
			resolve({
				extensions: ['.mjs', '.js', '.json'],
				jsnext: true,
				main: true
			}), // so Rollup can find `ms`
			commonjs({
				include: ['node_modules/**'],
				sourceMap: true,
				namedExports: {
					'node_modules/lodash/lodash.js': ['find', 'eq', 'difference', 'union', 'uniq', 'pick', 'isDate', 'startsWith', 'includes', 'omitBy', 'omit', 'set', 'has', 'isString', 'isEqual', 'findIndex', 'concat', 'forOwn', 'keyBy', 'assign', 'each', 'get', 'merge', 'pickBy', 'endsWith', 'isEmpty', 'isArray', 'isObject', 'map', 'keys', 'mapKeys', 'mapValues'],
					'node_modules/graphql-tools/dist/index.js': [ 'SchemaDirectiveVisitor', 'makeExecutableSchema', 'addResolveFunctionsToSchema' ],
					'node_modules/graphql-type-json/lib/index.js': ['GraphQLJSON'],
					'node_modules/graphql-iso-date/dist/index.js': ['GraphQLDate', 'GraphQLTime', 'GraphQLDateTime']
				}
			}), // so Rollup can convert `ms` to an ES module
			typescript(),
			replace({
				'process': true,
				'process.env.NODE_ENV': JSON.stringify( 'development' )
			}),
			globals(),
			builtins(),
			serve({
				contentBase: 'lib',
				port: '10001'
			}),  
			livereload()
		],
		//external: ['lodash', 'graphql', 'graphql/language', 'graphql/execution/values', 'graphql/language/printer', 'graphql/error']
	}
];

function onwarn(message) {
  const suppressed = ['THIS_IS_UNDEFINED'];

  if (!suppressed.find(code => message.code === code)) {
    return console.warn(message.message);
  }
}

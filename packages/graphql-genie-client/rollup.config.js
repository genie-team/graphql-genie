import commonjs from 'rollup-plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import serve from 'rollup-plugin-serve';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';
// import uglify from 'rollup-plugin-uglify';

export default [
	// browser-friendly UMD build
	{
		input: 'src/main.ts',
		output: {
			name: 'graphql-genie-client',
			file: pkg.browser,
			format: 'umd'
		},
		watch: {
			include: '../graphql-genie/src/**'
		},
		onwarn,
		plugins: [
			resolve({
				extensions: ['.mjs', '.js', '.json'],
				jsnext: true,
				main: true,
				browser: true
			}), // so Rollup can find `ms`
			commonjs({
				include: ['node_modules/**', '../graphql-genie/lib/bundle.umd.js', '../../node_modules/**'],
				exclude: ['../graphql-genie/node_modules/**'],
				sourceMap: true,
				namedExports: {
					'node_modules/graphql/index.mjs': [ 'default' ],
					'../graphql-genie/lib/bundle.umd.js': ['GraphQLGenie'],
					'../graphql-genie/node_modules/lodash/lodash.js': ['find', 'eq', 'difference', 'union', 'uniq', 'pick', 'isDate', 'startsWith', 'includes', 'omitBy', 'omit', 'set', 'has', 'isString', 'isEqual', 'findIndex', 'concat', 'forOwn', 'keyBy', 'assign', 'each', 'get', 'merge', 'pickBy', 'endsWith', 'isEmpty', 'isArray', 'isObject', 'map', 'keys', 'mapKeys', 'mapValues'],
					'../graphql-genie/node_modules/graphql-tools/dist/index.js': [ 'SchemaDirectiveVisitor', 'makeExecutableSchema', 'addResolveFunctionsToSchema' ],
					'../graphql-genie/node_modules/graphql-type-json/lib/index.js': ['GraphQLJSON'],
					'../graphql-genie/node_modules/graphql-iso-date/dist/index.js': ['GraphQLDate', 'GraphQLTime', 'GraphQLDateTime']
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
			//uglify()
		]
	}
];

function onwarn(message) {
  const suppressed = ['THIS_IS_UNDEFINED'];

  if (!suppressed.find(code => message.code === code)) {
    return console.warn(message.message);
  }
}

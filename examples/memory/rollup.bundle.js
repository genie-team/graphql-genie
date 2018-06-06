import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import livereload from 'rollup-plugin-livereload';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import serve from 'rollup-plugin-serve';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';
const prod = !process.env.ROLLUP_WATCH;

export default [
	// browser-friendly UMD build
	{
		input: 'src/main.ts',
		output: {
			name: 'graphql-genie-browser',
			file: pkg.browser,
			format: 'umd'
		},
		watch: {
			include: 'src/**'
		},
		onwarn,
		plugins: [
			resolve({
				extensions: ['.mjs', '.js', '.json'],
				preferBuiltins: true,
				jsnext: true,
				main: true,
				browser: true
			}), // so Rollup can find `ms`
			commonjs({
				include: ['node_modules/**'],
				sourceMap: false,
				namedExports: {
					'node_modules/lodash/lodash.js': ['values', 'find', 'eq', 'difference', 'union', 'uniq', 'pick', 'isDate', 'startsWith', 'includes', 'omitBy', 'omit', 'set', 'has', 'isString', 'isEqual', 'findIndex', 'concat', 'forOwn', 'keyBy', 'assign', 'each', 'get', 'merge', 'pickBy', 'endsWith', 'isEmpty', 'isArray', 'isObject', 'map', 'keys', 'mapKeys', 'mapValues'],
					'node_modules/graphql-tools/dist/index.js': [ 'SchemaDirectiveVisitor', 'makeExecutableSchema', 'addResolveFunctionsToSchema' ],
					'node_modules/graphql-genie/lib/browser.umd.js': ['GraphQLGenie', 'subscriptionPlugin', 'FortuneOptions']
				}
			}), // so Rollup can convert `ms` to an ES module
			typescript(),
			json(),
			replace({
				exclude: [
					'node_modules/rollup-plugin-node-builtins/**'
				],
				'process': true,
				'process.env.NODE_ENV': !prod ?  '"development"' : '"production"'
			}),
			builtins(),
			globals(),
			!prod && serve({
				contentBase: 'lib',
				port: '10001'
			}), 
			!prod && livereload()
		]
	}
];


function onwarn(message) {
  const suppressed = ['THIS_IS_UNDEFINED'];

  if (!suppressed.find(code => message.code === code)) {
    return console.warn(message.message);
  }
}

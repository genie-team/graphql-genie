import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import pkg from './package.json';
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'
import typescript from 'rollup-plugin-typescript2';
import replace from 'rollup-plugin-replace';
import globals from 'rollup-plugin-node-globals';
import builtins from 'rollup-plugin-node-builtins';

export default [
	// browser-friendly UMD build
	{
		input: 'src/main.ts',
		output: {
			name: 'rollupMaker',
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
				jsnext: true,
				main: true
			}), // so Rollup can find `ms`
			commonjs({
				include: 'node_modules/**',
				sourceMap: false,
				namedExports: {
					'node_modules/graphql-tools/dist/index.js': [ 'SchemaDirectiveVisitor', 'makeExecutableSchema', 'addResolveFunctionsToSchema' ],
					'node_modules/lodash/lodash.js': ['startsWith', 'includes', 'omitBy', 'omit', 'set', 'has', 'isString', 'isEqual', 'findIndex', 'concat', 'forOwn', 'keyBy', 'assign', 'each', 'get', 'merge', 'pickBy', 'endsWith', 'isEmpty', 'isArray', 'isObject', 'map', 'keys', 'mapKeys', ]
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
		]
	}
];

function onwarn(message) {
  const suppressed = ['THIS_IS_UNDEFINED'];

  if (!suppressed.find(code => message.code === code)) {
    return console.warn(message.message);
  }
}

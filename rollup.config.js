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
					'node_modules/lodash/lodash.js': ['set', 'isString', 'isEqual', 'forOwn', 'keyBy', 'assign', 'each', 'get', 'merge', 'pickBy', 'endsWith', 'isEmpty', 'isArray', 'isObject', 'map', 'keys']
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
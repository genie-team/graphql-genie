import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

export default [
	// browser-friendly UMD build
	{
		input: 'src/genie-persistence.ts',
		output: {
			name: 'graphql-genie',
			file: pkg.browser,
			format: 'umd',
			globals: {
				'graphql': 'graphql_1',
				'lodash': 'lodash',
				'fortune': 'fortune',
				'graphql-tools': 'graphql-tools',
				'apollo-client': 'apollo-client',
				'apollo-link': 'apollo-link',
				'graphql-genie': 'graphql-genie'
			}
		},
		watch: {
			include: 'src/**'
		},
		onwarn,
		plugins: [
			typescript({
				tsconfig: "tsconfigBrowser.json",
			})
		],
		external: ['apollo-client', 'apollo-link', 'graphql-tools', 'graphql-genie', 'lodash', 'graphql', 'graphql/language', 'graphql/execution/values', 'graphql/language/printer', 'graphql/error']

	}
];


function onwarn(message) {
  const suppressed = ['THIS_IS_UNDEFINED'];

  if (!suppressed.find(code => message.code === code)) {
    return console.warn(message.message);
  }
}

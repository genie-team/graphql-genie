const path = require('path');
var webpack = require('webpack');
var nodeExternals = require('webpack-node-externals');
const root = (dir) => {
  return path.resolve(__dirname, dir);
};

module.exports = (options) => {
  return {
		mode: 'development',
		watchOptions: {
			ignored: /node_modules/
		},
    entry: {
      'main': './src/main.ts'
    },
    resolve: {
      extensions: ['.ts', '.mjs', '.js'],
      modules: [root('node_modules'), root('src')]
		},
		externals: [
			nodeExternals()
		],
    target: 'node',
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: 'awesome-typescript-loader',
              options: {
                useCache: false
              }
            }
          ],
          exclude: [/\.(spec|e2e)\.ts$/]
        }
      ]
		},
		plugins: [new webpack.IgnorePlugin(/\.\/native/, /\/pg\//)],
    output: {
      path: root('dist'),
      filename: 'index.js',
      libraryTarget: 'commonjs'
    }
  };
};

const path = require('path');
var webpack = require('webpack');
const root = (dir) => {
  return path.resolve(__dirname, dir);
};

module.exports = (options) => {
  return {
		mode: 'development',
    entry: {
      'main': './src/main.ts'
    },
    resolve: {
      extensions: ['.ts', '.mjs', '.js'],
      modules: [root('node_modules'), root('src')]
    },
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
      filename: 'postgresql.js',
      libraryTarget: 'commonjs'
    }
  };
};

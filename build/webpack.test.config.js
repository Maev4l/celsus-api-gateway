/* eslint-disable import/no-extraneous-dependencies */
const { merge } = require('webpack-merge');
const path = require('path');
const Dotenv = require('dotenv-webpack');

const common = require('./webpack.base.config.js');

module.exports = merge(common, {
  mode: 'development',
  output: {
    // use absolute paths in sourcemaps (important for debugging via IDE)
    devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]',
  },
  devtool: 'inline-cheap-module-source-map',
  module: {
    rules: [
      {
        test: /\.(js)/,
        include: path.resolve('src'),
        loader: 'istanbul-instrumenter-loader',
        options: { esModules: true },
      },
    ],
  },
  plugins: [
    new Dotenv({
      path: path.resolve(__dirname, '..', '.env'),
    }),
  ],
});

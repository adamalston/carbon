/**
 * Copyright IBM Corp. 2018, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

module.exports = {
  parser: '@babel/eslint-parser',
  parserOptions: {
    babelOptions: {
      presets: ['babel-preset-carbon'],
    },
    requireConfigFile: false,
  },
  extends: [
    'eslint:recommended',
    require.resolve('./rules/best-practices'),
    require.resolve('./plugins/jsdoc'),
  ],
  rules: {
    // Handle cases where we are destructuring but may not be using the initial
    // variables
    'no-unused-vars': [
      'error',
      {
        args: 'after-used',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
  },
  env: {
    node: true,
    browser: true,
    es6: true,
    jest: true,
    jasmine: true,
  },
};

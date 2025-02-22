import eslint from '@eslint/js';
import globals from 'globals';

export default [
  eslint.configs.recommended,
  /*
  {
    languageOptions: {
      parser: {
        meta: {
          name: 'Ignore Without Parsing',
        },

        // Ignore Paring error
        parse: function () {
          return {
            type: 'Program',
            loc: {},
            comments: [],
            range: [0, 0],
            body: [],
            tokens: [],
          };
        },
      },
    },
  },
  */
  {
    // Config specifically for test files
    files: [
      'config/jest-config-carbon/setup/setup.js',
      'config/jest-config-carbon/setup/setupAfterEnv.js',
      'packages/**/__mocks__/**/*.js',
      'packages/**/__tests__/**/*.js',
      'packages/react/src/components/ListBox/test-helpers.js',
      'packages/utilities/src/dateTimeFormat/*-test.js',
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  // {
  //   // Override for test files
  //   files: ["**/__tests__/**/*.js"],
  //   languageOptions: {
  //     parserOptions: {
  //       // Ensure you're using a parser that supports JSX (if necessary, e.g. @babel/eslint-parser)
  //       ecmaFeatures: {
  //         jsx: true,
  //       },
  //       ecmaVersion: 2021, // or your desired version
  //     },
  //   },
  // },
  {
    // Config specifically for test files
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  {
    files: ['packages/**/*.js'],
    languageOptions: {
      globals: {
        __DEV__: 'readonly',
      },
    },
  },
  {
    rules: {
      'no-console': 'error',
      'no-template-curly-in-string': 'error',
      'prefer-arrow-callback': 'error',
      'require-atomic-updates': 'error',
    },
  },
  {
    files: [
      '**/tasks/**',
      'actions/**',
      'packages/carbon-components-react/tasks/**',
      'packages/carbon-components*/scripts/postinstall.js',
      'packages/cli/**',
      'packages/icon-build-helpers/src/metadata/**',
      'packages/upgrade/**',
      'packages/web-components/tools/**',
    ],
    rules: {
      'no-console': 'off',
    },
  },
  {
    ignores: [
      // Build folders
      '/build',
      'packages/**/build/',
      'packages/**/examples/**/build/',
      '**/es/**',
      '**/lib/**',
      '**/dist/**',
      '**/umd/**',

      'node_modules',
      'packages/*/examples/*',

      // Components
      'packages/components/demo/*.css',
      'packages/components/demo/*.map',
      'packages/components/demo/*.js',
      'packages/components/demo/js/prism.js',
      'packages/components/demo/hot',
      '!packages/components/demo/index.js', // This negation might need manual handling
      'packages/components/dist',
      'packages/components/tests/a11y-results',
      'packages/components/tests/coverage',
      'packages/components/es',
      'packages/components/umd',
      'packages/components/scripts',
      'packages/components/css',
      'packages/components/scss',
      'packages/components/html',
      'packages/components/docs/js',
      'packages/components/node_modules',
      'packages/components/scss/globals/vendor/**',
      'packages/components/src/globals/scss/vendor/**',

      // Upgrade
      '**/__testfixtures__/**',
      'packages/upgrade/cli.js',

      // React
      '**/storybook-static/**',
      'packages/react/icons/index.js',
      'packages/react/icons/index.esm.js',

      // Icons React
      'packages/icons-react/next/**',

      // Templates
      'packages/cli/src/component/templates/**',

      '**/generated/**',
      'config/typescript-config-carbon/index.js',
    ],
  },
];

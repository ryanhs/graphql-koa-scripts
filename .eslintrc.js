module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: ['airbnb-base', 'plugin:jest/recommended', 'plugin:prettier/recommended'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    fetch: 'readonly',
    yup: 'readonly',
    moment: 'readonly',
    sdk: 'readonly',
    bluebird: 'readonly',
    faker: 'readonly',
    flaverr: 'readonly',
    graphqlPubSub: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  plugins: ['jest'],
  rules: {
    camelcase: 'off',
    'no-console': 'warn',
    'no-trailing-spaces': 'off',
    'global-require': 'off',
    'padded-blocks': 'off',
    'no-unused-vars': 'warn',
    'no-return-assign': 'off',
    'no-param-reassign': ['error', { props: false }],
    radix: 'warn',
    'max-len': ['error', { code: 120, comments: 200, ignoreTrailingComments: true, ignoreUrls: true }],
    'prettier/prettier': ['error'],
  },
  overrides: [
    {
      files: ['tests/**/*.js'],
      rules: {
        'func-names': 'off',
        'no-unused-vars': 'off',
        'no-console': 'warn',
        'no-return-assign': 'off',
        'jest/no-commented-out-tests': 'off',
        'prefer-const': 'off',
        'no-new': 'off'
      },
    },
  ],
};

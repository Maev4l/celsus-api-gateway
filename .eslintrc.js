module.exports = {
  extends: ['airbnb-base', 'prettier'],
  env: {
    mocha: true,
    node: true,
  },
  rules: {
    'class-methods-use-this': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/prefer-default-export': 'off',
  },
  globals: {
    INFRA: true,
  },
};

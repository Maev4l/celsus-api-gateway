module.exports = {
  extends: ['airbnb-base', 'prettier'],
  env: {
    mocha: true,
    node: true,
  },
  rules: {
    'class-methods-use-this': 'off',
    'import/no-extraneous-dependencies': 'off',
  },
};

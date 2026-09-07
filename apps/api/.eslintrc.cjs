module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { sourceType: 'module' },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: { node: true },
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
  },
};

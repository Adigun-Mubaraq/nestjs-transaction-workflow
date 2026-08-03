module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: { project: 'tsconfig.json', tsconfigRootDir: __dirname },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  root: true,
  env: { node: true, jest: true },
  ignorePatterns: ['.eslintrc.cjs', 'dist', 'coverage'],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prettier/prettier': 'error'
  }
};

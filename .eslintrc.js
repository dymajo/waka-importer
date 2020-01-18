module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    useJSXTextNode: true,
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      modules: true,
      jsx: true,
    },
    project: 'tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/consistent-type-assertions': [
      'error',
      {
        assertionStyle: 'as',
        objectLiteralTypeAssertions: 'never',
      },
    ],
    '@typescript-eslint/no-empty-interface': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-require-imports': 'error',
    '@typescript-eslint/no-unnecessary-condition': [
      'error',
      {
        allowConstantLoopConditions: true,
      },
    ],
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/prefer-readonly': 'error',
    '@typescript-eslint/strict-boolean-expressions': [
      'error',
      { allowNullable: true, allowSafe: true },
    ],
    curly: ['error', 'all'],
    eqeqeq: ['error', 'smart'],
    'no-caller': 'error',
    'no-console': 'error',
    'no-debugger': 'error',
    'no-eval': 'error',
    'no-new-wrappers': 'error',
    'no-sequences': 'error',
    'no-throw-literal': 'error',
    'no-unsafe-finally': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    radix: 'error',
  },
}

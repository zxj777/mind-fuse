import antfu from '@antfu/eslint-config'

export default antfu({
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-redeclare': 'off',
    'ts/no-redeclare': ['error', { ignoreDeclarationMerge: true }],
  },
  overrides: {
    test: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
  ignores: [
    '**/dist',
    '**/build',
    '**/.next',
    '**/out',
    '**/.turbo',
    '**/*.md',
    'packages/types/test-geometry.ts',
    'plan.md',
    'PROJECT_ARCHITECTURE.md',
  ],
})

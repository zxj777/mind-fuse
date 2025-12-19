import antfu from '@antfu/eslint-config'

export default [
  ...antfu({
    // TypeScript 和 React 支持会自动检测

    // 可选：针对项目的自定义规则
    rules: {
      // 允许 console.warn 和 console.error
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // TypeScript 相关
      '@typescript-eslint/no-explicit-any': 'warn',
    },

    // 针对不同文件类型的规则
    overrides: {
      // 测试文件更宽松
      test: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
      },
    },

    // 忽略的文件（antfu 已经有默认的，这里可以添加额外的）
    ignores: [
      '**/dist',
      '**/build',
      '**/.next',
      '**/out',
      '**/.turbo',
      '**/*.md', // 忽略 Markdown 文件
      'plan.md',
      'PROJECT_ARCHITECTURE.md',
    ],
  }),

  // 确保规则在整个 flat config 的“最后”生效：TS 允许 interface/type 与 value 同名（声明合并）
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    rules: {
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': ['error', { ignoreDeclarationMerge: true }],
    },
  },
]

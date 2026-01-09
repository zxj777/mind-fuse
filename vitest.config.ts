import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // 包含所有包的测试文件
    include: ['packages/**/*.{test,spec}.{js,ts}', 'apps/**/*.{test,spec}.{js,ts}'],

    // 排除
    exclude: ['**/node_modules/**', '**/dist/**'],

    // 全局设置
    globals: true,

    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.d.ts', '**/test/**'],
    },
  },
})

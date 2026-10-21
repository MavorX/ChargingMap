import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: false,
    // 既有用例（如支付面板的优惠券断言）依赖演示券数据；
    // 门控本身由 demo-gating.spec.js 用 vi.stubEnv 分别验证开/关两种环境。
    env: {
      VITE_DEMO: 'true'
    },
    include: ['src/__tests__/**/*.spec.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/store/**/*.js', 'src/services/**/*.js']
    }
  }
})

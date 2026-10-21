import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // loadEnv merges .env / .env.local / .env.[mode] AND the matching process.env
  // keys, so `VITE_BASE=/ChargingMap/ npm run build` and an .env.local entry
  // both work without a second code path.
  const env = loadEnv(mode, process.cwd())
  const base = env.VITE_BASE || process.env.VITE_BASE || '/'

  return {
    base,
    plugins: [
      vue(),
      // Only active for `npm run build:analyze` (--mode analyze); writes
      // stats.html at the project root and never opens a browser.
      mode === 'analyze' &&
        visualizer({
          filename: 'stats.html',
          open: false,
          gzipSize: true,
          brotliSize: true
        })
    ].filter(Boolean),
    server: {
      port: 3000,
      open: true
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          // JS-only vendor split; CSS is emitted by Vite's own CSS pipeline and
          // must not be routed through manualChunks.
          manualChunks: {
            'vendor-vue': ['vue', 'pinia', 'vue-router']
          }
        }
      }
    }
  }
})

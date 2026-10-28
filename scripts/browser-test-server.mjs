import process from 'node:process'
import { build, preview } from 'vite'

// Test the shipped bundles, not Vite's on-demand development transforms: CI
// traces showed UserProfile.vue stuck pending after a reload of the dev server.
// Keep this build separate from dist/ and never bake local map credentials or
// optional demo-account data into the browser-test artifact.
process.env.VITE_DEMO = 'false'
process.env.VITE_AMAP_KEY = 'dummy_key_for_browser_tests'
process.env.VITE_AMAP_SECURITY_CODE = 'dummy_code_for_browser_tests'
const outDir = '.cache/browser-test'
await build({ base: '/', mode: 'test', build: { outDir } })
const server = await preview({
  base: '/',
  mode: 'test',
  build: { outDir },
  preview: { host: '127.0.0.1', port: 5176, strictPort: true, open: false }
})
console.log('[browser-test] http://127.0.0.1:5176')
const close = () => {
  server.httpServer.close(() => process.exit(0))
  server.httpServer.closeAllConnections()
}
process.on('SIGINT', close)
process.on('SIGTERM', close)

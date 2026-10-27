import process from 'node:process'
import { createServer } from 'vite'

// Exercise genuine application data and controls, but start from an empty user
// account regardless of the developer's optional local demo-data setting.
process.env.VITE_DEMO = 'false'
const server = await createServer({
  base: '/',
  mode: 'test',
  server: { host: '127.0.0.1', port: 5176, strictPort: true, open: false }
})
await server.listen()
console.log('[browser-test] http://127.0.0.1:5176')
const close = async () => {
  await server.close()
  process.exit(0)
}
process.on('SIGINT', close)
process.on('SIGTERM', close)

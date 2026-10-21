// Pre-build guard: fail fast when VITE_AMAP_KEY is missing or still the
// unresolved `%VITE_AMAP_KEY%` placeholder from index.html.
// Reads .env / .env.local / .env.[mode] via Vite's loadEnv so a local
// .env.local is honored exactly like `vite build` would honor it.
/* global process */

import { loadEnv } from 'vite'

const PLACEHOLDER = '%VITE_AMAP_KEY%'
const mode = process.env.NODE_ENV === 'development' ? 'development' : 'production'

// Empty prefix keeps non-VITE_* vars too; loadEnv already merges process.env.
const env = loadEnv(mode, process.cwd(), '')
const key = (env.VITE_AMAP_KEY || '').trim()

if (!key || key === PLACEHOLDER) {
  console.error('')
  console.error('[prebuild-check] 缺少 VITE_AMAP_KEY，构建已终止。')
  console.error('  1. 复制 .env.example 为 .env.local')
  console.error('  2. 在高德开放平台 https://lbs.amap.com/ 申请 JS API key')
  console.error('  3. 填入 VITE_AMAP_KEY / VITE_AMAP_SECURITY_CODE 后重试')
  console.error('')
  process.exit(1)
}

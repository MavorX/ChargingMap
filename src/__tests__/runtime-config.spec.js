import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

describe('shared Node runtime configuration', () => {
  it('declares the Node versions required by the locked test environment', () => {
    const manifest = JSON.parse(read('package.json'))
    const lock = JSON.parse(read('package-lock.json'))
    expect(manifest.engines.node).toBe(lock.packages['node_modules/jsdom'].engines.node)
    expect(lock.packages[''].engines.node).toBe(manifest.engines.node)
  })

  it('uses one explicit version file for local development, CI and deployment', () => {
    expect(read('.nvmrc').trim()).toMatch(/^\d+\.\d+\.\d+$/)
    for (const file of ['.github/workflows/ci.yml', '.github/workflows/deploy-pages.yml']) {
      const workflow = read(file)
      expect(workflow, file).toMatch(/^\s+node-version-file: \.nvmrc\s*$/m)
      expect(workflow, file).not.toMatch(/^\s+node-version:/m)
    }
  })
})

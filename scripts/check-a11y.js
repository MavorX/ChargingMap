#!/usr/bin/env node
/* global process */
/**
 * Static accessibility guard for icon-only buttons.
 *
 * Scans every .vue file under src/ and reports `<button>` elements that render
 * only an icon (`<i>` / `<svg>`) but expose no accessible name through
 * `aria-label`. A visible `title` is intentionally NOT accepted on its own:
 * `title` is a tooltip, not a reliable assistive-technology name.
 *
 * Usage:
 *   node scripts/check-a11y.js
 *
 * Add an entry to WHITELIST only for a genuinely unavoidable exception and
 * document the reason. Each entry may target a file (path) and/or a snippet
 * that appears in the button's opening tag (match).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SRC_DIR = path.join(ROOT, 'src')

const WHITELIST = []

const stripTags = (html) =>
  html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()

const hasAccessibleName = (attrs) =>
  /\baria-label(?:ledby)?\s*=/.test(attrs) || /\bv-bind\s*=\s*"\s*\{[^}]*aria-label/.test(attrs)

const findOpeningTagEnd = (source, start) => {
  let quote = null
  for (let i = start; i < source.length; i += 1) {
    const char = source[i]
    if (quote) {
      if (char === quote) quote = null
    } else if (char === '"' || char === "'") {
      quote = char
    } else if (char === '>') {
      return i
    }
  }
  return -1
}

const isWhitelisted = (relativePath, attrs) =>
  WHITELIST.some((entry) => {
    if (entry.path !== relativePath) return false
    if (!entry.match) return true
    return attrs.includes(entry.match)
  })

const walk = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...walk(full))
    else if (entry.isFile() && entry.name.endsWith('.vue')) files.push(full)
  }
  return files
}

const offenders = []
let checkedButtons = 0
let iconOnlyButtons = 0

for (const file of walk(SRC_DIR)) {
  const relativePath = path.relative(ROOT, file).split(path.sep).join('/')
  const source = fs.readFileSync(file, 'utf8')
  const buttonStartRe = /<button\b/g
  let match
  while ((match = buttonStartRe.exec(source)) !== null) {
    checkedButtons += 1
    const attrsStart = match.index + match[0].length
    const openingTagEnd = findOpeningTagEnd(source, attrsStart)
    if (openingTagEnd === -1) continue

    const closeIndex = source.indexOf('</button>', openingTagEnd)
    if (closeIndex === -1) continue

    const attrs = source.slice(attrsStart, openingTagEnd)
    const inner = source.slice(openingTagEnd + 1, closeIndex)

    const hasIcon = /<i\b|<svg\b/.test(inner)
    // Mustache interpolations and v-text render text, so they count as content.
    const text = stripTags(inner).replace(/\s+/g, ' ').trim()
    if (!hasIcon || text.length > 0) continue

    iconOnlyButtons += 1
    if (hasAccessibleName(attrs)) continue
    if (isWhitelisted(relativePath, attrs)) continue

    const line = source.slice(0, match.index).split('\n').length
    offenders.push({ relativePath, line, snippet: match[0].replace(/\s+/g, ' ').slice(0, 120) })
  }
}

if (offenders.length === 0) {
  console.log(
    `check:a11y OK — ${iconOnlyButtons} icon-only button(s) scanned across ${checkedButtons} buttons, all have an accessible name.`
  )
  process.exit(0)
}

console.error(`check:a11y FAILED — ${offenders.length} icon-only button(s) missing aria-label:`)
for (const offender of offenders) {
  console.error(`  ${offender.relativePath}:${offender.line}  ${offender.snippet}`)
}
console.error(
  '\nAdd aria-label (keep the existing title for tooltip parity) or whitelist with a documented reason.'
)
process.exit(1)

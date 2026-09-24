// Guards the two things a Russian-only product can silently regress into:
//
//   1. a t('…') literal with no entry in the Russian pack — the screen then renders the English
//      source string, which is invisible in review because the source file looks fine;
//   2. a stray English word in visible JSX — an aria-label, a heading written straight into the
//      markup. The product has one language, so this must not appear without a deliberate
//      allowlist entry below.
//
// It reads the source tree rather than rendering it: a rendered pass would only cover the routes
// the test happens to mount, and the failure this catches is on the ones it does not.
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import ru from '../locales/ru.js'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const SRC = root

// Brand names, proper nouns and units. Everything else visible has to be Russian.
const ALLOWED_LATIN_VISIBLE = new Set([
  'Cyber Gym',
  'Face ID / Touch ID',
  'iCloud Keychain',
  'Google Password Manager',
  'Ollama',
  'LM Studio',
  'OpenRouter',
  'Gym visual',
  'SkiErg',
  'Push / Pull / Legs',
  'Upper / Lower',
  'Full Body',
  'kg',
  'lb',
  // Technical input hints, not copy: a UUID shape and two endpoint examples.
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  'http://ollama:11434  or  https://openrouter.ai/api',
  'http://ollama.lan:11434',
])

const SKIP_DIRS = new Set(['locales', 'instr', 'exercise-names', 'node_modules', 'assets'])

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      if (!SKIP_DIRS.has(name)) walk(p, out)
    } else if (/\.(js|jsx)$/.test(name) && !/\.test\.(js|jsx)$/.test(name)) {
      out.push(p)
    }
  }
  return out
}

const files = walk(SRC)

// t('literal') / t("literal") — preceded by a non-identifier char so DateTimeFormat( misses.
const CALL = /(^|[^A-Za-z0-9_$.])t\(\s*(['"])((?:\\.|(?!\2)[^\\])*)\2/g

describe('Russian-only product language', () => {
  it('has a Russian string for every literal passed to t()', () => {
    const missing = new Map()
    for (const file of files) {
      for (const m of readFileSync(file, 'utf8').matchAll(CALL)) {
        const key = m[3].replace(/\\(['"\\])/g, '$1')
        if (key && !(key in ru)) {
          if (!missing.has(key)) missing.set(key, new Set())
          missing.get(key).add(relative(SRC, file))
        }
      }
    }
    expect([...missing.keys()]).toEqual([])
  })

  it('never carries the old product identity in the Russian pack', () => {
    const text = Object.values(ru).join('\n')
    expect(text).not.toMatch(/opengym|duartesantos|duarte-santos|openGym/i)
    expect(text).not.toMatch(/gitlab/i)
  })

  it('renders no unexplained Latin sentence straight into the markup', () => {
    const offenders = []
    for (const file of files) {
      const lines = readFileSync(file, 'utf8').split('\n')
      lines.forEach((line, i) => {
        for (const m of line.matchAll(/>\s*([A-Z][A-Za-z][A-Za-z ,.'’!?%\-]{3,60})\s*</g)) {
          const text = m[1].trim()
          if (!ALLOWED_LATIN_VISIBLE.has(text)) offenders.push(`${relative(SRC, file)}:${i + 1} ${JSON.stringify(text)}`)
        }
        for (const m of line.matchAll(/\b(aria-label|alt|placeholder)\s*=\s*"([A-Za-z][^"]{2,60})"/g)) {
          if (!ALLOWED_LATIN_VISIBLE.has(m[2])) offenders.push(`${relative(SRC, file)}:${i + 1} ${m[1]}=${JSON.stringify(m[2])}`)
        }
      })
    }
    expect(offenders).toEqual([])
  })
})

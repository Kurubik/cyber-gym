// Screenshots + live checks for the built Cyber Gym app, driven with playwright-core.
// Serves frontend/dist over http://127.0.0.1 (a secure context, so the service worker registers)
// and walks the real routes through guest mode — once with the default Blackwall theme and once
// with DAEMON CRT, so both skins are captured against the same data.
//
// The profile is the demo seed (lib/demoSeed.js), so the charts, heatmap, body map and history
// are populated instead of empty; the theme and a couple of flags are overlaid on top. The seed
// is what also lets the active-workout state be reached by starting today's session in the UI.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

// playwright-core is not a dependency of this repository on purpose: the screenshots and the
// live checks are a maintainer tool, not part of the product. Resolve it from the host install.
const require = createRequire('/usr/lib/node_modules/openclaw/')
const { chromium } = require('playwright-core')

const DIST = '/root/.openclaw/workspace/cyber-gym/frontend/dist'
const OUT = '/root/.openclaw/workspace/cyber-gym/assets/screenshots'
const EXEC = process.env.CHROME || '/root/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome'
const PORT = 8123

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
}

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    if (p === '/') p = '/index.html'
    const file = join(DIST, normalize(p).replace(/^(\.\.[/\\])+/, ''))
    const body = await readFile(file)
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404); res.end('not found')
  }
})
await new Promise(r => server.listen(PORT, '127.0.0.1', r))

const { buildDemoState } = await import('/root/.openclaw/workspace/cyber-gym/frontend/src/lib/demoSeed.js')

const report = { themes: {}, overflow: {}, screenshots: [], consoleErrors: [], checks: {} }
const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] })

const MOBILE = { width: 390, height: 844 }
const DESKTOP = { width: 1440, height: 900 }
const NARROW = { width: 320, height: 844 }
const THEMES = [
  { id: 'blackwall', prefix: '' },
  { id: 'daemon', prefix: 'daemon-' },
]
const ROUTES = [
  ['#/home', 'home'], ['#/plan', 'plan'], ['#/stats', 'stats'], ['#/library', 'library'],
  ['#/muscles', 'muscles'], ['#/history', 'history'], ['#/settings', 'settings'],
]

const seed = theme => ({
  ...buildDemoState(),
  theme,
  weighIn: false,
  checkIn: false,
  _ts: Date.now(),
})

// Runs before every document in the context: put the chosen theme (plus the seeded profile)
// where the inline boot script and the store will both read it.
const seedInit = (arg) => {
  try {
    localStorage.setItem('gym_state_v1', JSON.stringify(arg.state))
    if (arg.guest) localStorage.setItem('gym_guest', '1')
    else localStorage.removeItem('gym_guest')
  } catch {}
}

async function shoot(page, prefix, name, w, h, fullPage = false) {
  const file = `${prefix}${name}-${w}.png`
  await page.screenshot({ path: join(OUT, file), fullPage })
  report.screenshots.push(file)
}

async function settle(page, ms = 450) { await page.waitForTimeout(ms) }

async function domFacts(page) {
  return page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    meta: document.querySelector('meta[name="theme-color"]')?.content,
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    crt: !!document.querySelector('.crt'),
  }))
}

for (const theme of THEMES) {
  const key = theme.id
  report.themes[key] = {}
  for (const [label, viewport] of [['mobile', MOBILE], ['desktop', DESKTOP]]) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, locale: 'ru-RU' })
    await ctx.addInitScript(seedInit, { state: seed(key), guest: false })
    const page = await ctx.newPage()
    page.on('console', m => {
      if (m.type() !== 'error') return
      const text = m.text()
      // exercise media is not in the repository (upstream licence), so /img/* and /gif/* 404 by
      // design — counted separately rather than treated as an app error
      if (/Failed to load resource/.test(text)) report.media404 = (report.media404 || 0) + 1
      else report.consoleErrors.push(`${key}/${label}: ${text}`)
    })
    page.on('pageerror', e => report.consoleErrors.push(`${key}/${label}: ${e.message}`))

    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
    await settle(page)
    // the boot script must have painted the right theme before anything else ran
    const boot = await domFacts(page)
    report.themes[key][`boot:${label}`] = { theme: boot.theme, meta: boot.meta, crt: boot.crt }
    await shoot(page, theme.prefix, 'login', viewport.width, viewport.height)

    // sign in as a guest and walk the routes
    await page.evaluate(() => localStorage.setItem('gym_guest', '1'))
    await page.goto(`http://127.0.0.1:${PORT}/#/home`, { waitUntil: 'networkidle' })
    await settle(page)
    report.overflow[`${key}:${label}:home`] = await page.evaluate(() =>
      ({ scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth }))

    for (const [route, name] of ROUTES) {
      await page.goto(`http://127.0.0.1:${PORT}/${route}`, { waitUntil: 'networkidle' })
      await settle(page, name === 'settings' ? 600 : 450)
      report.overflow[`${key}:${label}:${name}`] = await domFacts(page)
      if (name === 'settings') {
        await page.evaluate(() => {
          const g = document.querySelector('[role=radiogroup]')
          if (g) g.scrollIntoView({ block: 'center' })
        })
        await settle(page, 250)
      }
      await shoot(page, theme.prefix, name, viewport.width, viewport.height)
    }

    // empty workout state, then start today's session and capture it live
    await page.goto(`http://127.0.0.1:${PORT}/#/workout`, { waitUntil: 'networkidle' })
    await settle(page)
    await shoot(page, theme.prefix, 'workout-empty', viewport.width, viewport.height)
    await page.goto(`http://127.0.0.1:${PORT}/#/home`, { waitUntil: 'networkidle' })
    await settle(page)
    const started = await page.evaluate(() => {
      const row = document.querySelector('.today-row')
      if (!row) return false
      row.click()
      return true
    })
    await settle(page, 800)
    await page.goto(`http://127.0.0.1:${PORT}/#/workout`, { waitUntil: 'networkidle' })
    await settle(page, 600)
    report.themes[key][`activeWorkout:${label}`] = await page.evaluate(() => ({
      sets: document.querySelectorAll('.setrow').length,
      started: !!document.querySelector('.whdr'),
    }))
    await shoot(page, theme.prefix, 'workout', viewport.width, viewport.height)
    if (!started) report.consoleErrors.push(`${key}/${label}: no today-row to start a workout`)

    // a representative sheet/dialog: the destructive confirm, opened but never confirmed
    await page.goto(`http://127.0.0.1:${PORT}/#/settings`, { waitUntil: 'networkidle' })
    await settle(page, 600)
    const opened = await page.evaluate(() => {
      const row = document.querySelector('.lrow.danger')
      if (!row) return false
      row.click()
      return true
    })
    await settle(page, 500)
    await shoot(page, theme.prefix, 'sheet', viewport.width, viewport.height)
    report.themes[key][`sheet:${label}`] = opened
    await page.keyboard.press('Escape').catch(() => {})
    await settle(page, 300)

    if (label === 'mobile') {
      // the switch is live: no reload, the attribute and the chrome colour follow, and the
      // scroll position survives.
      await page.goto(`http://127.0.0.1:${PORT}/#/settings`, { waitUntil: 'networkidle' })
      await settle(page, 600)
      report.themes[key].liveSwitch = await page.evaluate(async () => {
        const rs = [...document.querySelectorAll('[role=radio]')]
        const other = rs.find(r => r.getAttribute('aria-checked') !== 'true')
        window.scrollTo(0, 700)
        const before = window.scrollY
        if (!other) return { ok: false }
        other.click()
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
        const out = {
          ok: true,
          clicked: other.textContent.includes('DAEMON') ? 'daemon' : 'blackwall',
          theme: document.documentElement.dataset.theme,
          meta: document.querySelector('meta[name="theme-color"]')?.content,
          checked: other.getAttribute('aria-checked'),
          before, after: window.scrollY,
        }
        rs.find(r => r.getAttribute('aria-checked') !== 'true')?.click()
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
        out.restored = document.documentElement.dataset.theme
        return out
      })

      report.fonts = report.fonts || {}
      report.fonts = report.fonts || {}
      report.fonts[key] = await page.evaluate(async () => {
        await document.fonts.ready
        return {
          body: getComputedStyle(document.body).fontFamily,
          plexLoaded: document.fonts.check('16px "IBM Plex Sans"'),
          jetbrainsLoaded: document.fonts.check('12px "JetBrains Mono"'),
          cyrillicRendered: !!document.fonts.check('16px "IBM Plex Sans"', 'Тренировка'),
          cyrillicMono: !!document.fonts.check('12px "JetBrains Mono"', 'Тренировка'),
        }
      })
      report.pwa = report.pwa || {}
      report.pwa[key] = await page.evaluate(async () => {
        // main.jsx only registers a worker on https: (the upstream rule), so the local probe
        // registers it explicitly and then reads the cache the worker filled.
        let reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null
        if (!reg && 'serviceWorker' in navigator) {
          try { reg = await navigator.serviceWorker.register('sw.js') } catch { reg = null }
        }
        if (reg) { try { await navigator.serviceWorker.ready } catch {} }
        const keys = await caches.keys()
        let entries = []
        for (const k of keys) {
          const c = await caches.open(k)
          entries = entries.concat(await c.keys())
        }
        const link = document.querySelector('link[rel=manifest]')
        const m = link ? await (await fetch(link.href)).json() : null
        return {
          sw: !!reg, caches: keys, cached: entries.length,
          cachedFonts: entries.filter(r => r.url.endsWith('.woff2')).length,
          manifest: m && { name: m.name, lang: m.lang, theme: m.theme_color, icons: m.icons.length },
        }
      })
    }
    await ctx.close()
  }

  // 320 px overflow: the narrowest phone we claim to support
  {
    const ctx = await browser.newContext({ viewport: NARROW, locale: 'ru-RU' })
    await ctx.addInitScript(seedInit, { state: seed(key), guest: true })
    const page = await ctx.newPage()
    await page.goto(`http://127.0.0.1:${PORT}/#/home`, { waitUntil: 'networkidle' })
    await settle(page)
    for (const [route, name] of [['#/home', 'home'], ['#/workout', 'workout'], ['#/stats', 'stats'], ['#/settings', 'settings']]) {
      await page.goto(`http://127.0.0.1:${PORT}/${route}`, { waitUntil: 'networkidle' })
      await settle(page)
      report.overflow[`${key}:320:${name}`] = await domFacts(page)
    }
    // the top of Settings at the narrowest width, then the chooser itself, where it collapses
    // to a single column
    await page.goto(`http://127.0.0.1:${PORT}/#/settings`, { waitUntil: 'networkidle' })
    await settle(page, 600)
    await shoot(page, theme.prefix, 'settings', 320, 844)
    await page.evaluate(() => document.querySelector('[role=radiogroup]')?.scrollIntoView({ block: 'center' }))
    await settle(page, 250)
    await shoot(page, theme.prefix, 'theme', 320, 844)
    await ctx.close()
  }

  // reduced motion: the CRT sweeps/tear must stop, the static tube must stay
  if (key === 'daemon') {
    const ctx = await browser.newContext({ viewport: MOBILE, reducedMotion: 'reduce', locale: 'ru-RU' })
    await ctx.addInitScript(seedInit, { state: seed(key), guest: true })
    const page = await ctx.newPage()
    await page.goto(`http://127.0.0.1:${PORT}/#/home`, { waitUntil: 'networkidle' })
    await settle(page)
    report.reducedMotion = await page.evaluate(() => {
      const roll = document.querySelector('.crt-roll')
      const tear = document.querySelector('.crt-tear')
      const scan = document.querySelector('.crt-scan')
      const app = document.querySelector('#app') || document.body
      const vis = el => el && getComputedStyle(el).display !== 'none'
      return {
        rollVisible: vis(roll), tearVisible: vis(tear), scanVisible: vis(scan),
        rollAnimation: roll ? getComputedStyle(roll).animationName : null,
        animationDuration: getComputedStyle(app).animationDuration,
        theme: document.documentElement.dataset.theme,
      }
    })
    await shoot(page, 'daemon-', 'reduced-motion', 390, 844)
    await ctx.close()
  }
}

await browser.close()
server.close()
console.log(JSON.stringify(report, null, 2))

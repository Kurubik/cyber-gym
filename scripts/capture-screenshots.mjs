// Screenshots + live checks for the built Cyber Gym app, driven with playwright-core.
// Serves frontend/dist over http://127.0.0.1 (a secure context, so the service worker registers)
// and walks the real routes through guest mode.
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

const report = { fonts: {}, overflow: {}, screenshots: [], consoleErrors: [] }
const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] })

async function shoot(page, name, w, h) {
  await page.screenshot({ path: join(OUT, `${name}-${w}.png`), fullPage: false })
  report.screenshots.push(`${name}-${w}.png`)
}

const MOBILE = { width: 390, height: 844 }
const DESKTOP = { width: 1440, height: 900 }

for (const [label, viewport] of [['mobile', MOBILE], ['desktop', DESKTOP]]) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, locale: 'ru-RU' })
  const page = await ctx.newPage()
  page.on('console', m => { if (m.type() === 'error') report.consoleErrors.push(`${label}: ${m.text()}`) })
  page.on('pageerror', e => report.consoleErrors.push(`${label}: ${e.message}`))
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })

  // The access node: sign-in is a passkey, but guest mode is offered on a fresh instance.
  const guest = page.getByText(/Продолжить без аккаунта|Continue without account/)
  await shoot(page, 'login', viewport.width, viewport.height)
  if (await guest.count()) {
    await guest.first().click()
    await page.waitForTimeout(700)
  }

  for (const [route, name] of [['#/home', 'home'], ['#/plan', 'plan'], ['#/workout', 'workout'],
    ['#/stats', 'stats'], ['#/library', 'library'], ['#/muscles', 'muscles'],
    ['#/history', 'history'], ['#/settings', 'settings']]) {
    await page.goto(`http://127.0.0.1:${PORT}/${route}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(450)
    report.overflow[`${label}:${name}`] = await page.evaluate(() =>
      ({ scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth }))
    await shoot(page, name, viewport.width, viewport.height)
  }

  if (label === 'mobile') {
    report.fonts = await page.evaluate(async () => {
      await document.fonts.ready
      const body = getComputedStyle(document.body).fontFamily
      const mono = getComputedStyle(document.querySelector('.sect-t') || document.body).fontFamily
      return {
        body,
        mono,
        plexLoaded: document.fonts.check('16px "IBM Plex Sans"'),
        jetbrainsLoaded: document.fonts.check('12px "JetBrains Mono"'),
        cyrillicRendered: !!document.fonts.check('16px "IBM Plex Sans"', 'Тренировка'),
      }
    })
    report.pwa = await page.evaluate(async () => {
      const link = document.querySelector('link[rel=manifest]')
      const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null
      const m = link ? await (await fetch(link.href)).json() : null
      return { manifest: m && { name: m.name, lang: m.lang, theme: m.theme_color, icons: m.icons.length }, sw: !!reg }
    })
  }
  await ctx.close()
}

// reduced motion: the sheet must not animate
{
  const ctx = await browser.newContext({ viewport: MOBILE, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
  report.reducedMotion = await page.evaluate(() => {
    const el = document.querySelector('#app') || document.body
    const cs = getComputedStyle(el)
    return { animationDuration: cs.animationDuration, transitionDuration: cs.transitionDuration }
  })
  await ctx.close()
}

await browser.close()
server.close()
console.log(JSON.stringify(report, null, 2))

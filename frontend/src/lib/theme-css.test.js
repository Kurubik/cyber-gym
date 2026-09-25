// The DAEMON CRT layer is CSS-only on purpose, so the parts that a unit test can pin down are
// the source guarantees: the token block exists, the CRT layer animates, reduced motion turns
// those animations off while leaving the static theme, and the boot script in index.html lands
// on Blackwall for anything that is not the daemon id. This reads the real files rather than a
// rendered DOM, which is the only way to assert an @media (prefers-reduced-motion) block without
// a browser.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8')
const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')

describe('DAEMON CRT stylesheet', () => {
  it('defines the daemon token block and the two-theme chart token', () => {
    expect(css).toMatch(/:root\[data-theme="daemon"\]\s*\{/)
    expect(css).toMatch(/:root\s*\{\s*--chart:var\(--acc\)\s*\}/)
    expect(css).toMatch(/:root\[data-theme="daemon"\][^}]*--chart:var\(--tele\)/)
  })

  it('ships the CRT layer with scanlines, vignette, a roll band and a rare tear', () => {
    for (const part of ['.crt-scan', '.crt-vig', '.crt-roll', '.crt-tear', '.crt-bloom']) {
      expect(css, part).toContain(`[data-theme="daemon"] ${part}`)
    }
    expect(css).toContain('@keyframes daemon-roll')
    expect(css).toContain('@keyframes daemon-tear')
    // the tear is idle for almost the whole cycle: no continuous noise
    expect(css).toMatch(/@keyframes daemon-tear\{\s*0%,\s*95\.6%\{opacity:0/)
  })

  it('keeps the CRT layer pointer-transparent and cheap', () => {
    expect(css).toMatch(/\[data-theme="daemon"\] \.crt\{[^}]*pointer-events:none/)
    expect(css).toMatch(/\[data-theme="daemon"\] \.crt\{[^}]*contain:paint/)
    expect(css).not.toMatch(/\.crt[^}]*backdrop-filter/)
  })

  it('disables the moving CRT parts under prefers-reduced-motion while keeping the theme', () => {
    const block = css.slice(css.indexOf('daemon reduced motion'))
    expect(block).toMatch(/@media \(prefers-reduced-motion:\s*reduce\)/)
    expect(block).toMatch(/\.crt-roll[\s\S]*?\{display:none\}/)
    expect(block).toMatch(/\.crt-tear[\s\S]*?\{display:none\}/)
    // the static scanline/vignette planes survive, so the theme still reads as a CRT
    expect(block).not.toMatch(/\.crt-scan[\s\S]*?display:none/)
    expect(block).not.toMatch(/\.crt-vig[\s\S]*?display:none/)
  })

  it('gives the theme chooser a two-column grid that collapses on the narrowest phone', () => {
    expect(css).toMatch(/\.theme-choice\{[^}]*grid-template-columns:1fr 1fr/)
    expect(css).toMatch(/@media \(max-width:359px\)\{\.theme-choice\{grid-template-columns:1fr\}\}/)
    // comfortable tap target, whatever the viewport
    expect(css).toMatch(/\.thm\{[^}]*min-height:78px/)
  })
})

describe('theme boot script', () => {
  it('is inline and resolves the stored theme before first paint', () => {
    expect(html).toMatch(/<script>\n\(function \(\) \{/)
    expect(html).toContain("localStorage.getItem('gym_state_v1')")
    expect(html).toContain("dataset.theme = theme")
    // only the daemon id escapes the default
    expect(html).toMatch(/\.theme === 'daemon' \? 'daemon' : 'blackwall'/)
  })

  it('sets the runtime theme-color consistently with lib/theme.js', () => {
    expect(html).toContain("theme === 'daemon' ? '#080204' : '#020407'")
  })
})

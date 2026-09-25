// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_THEME, THEMES, THEME_VALUES, applyTheme, isDaemon, normalizeTheme, themeMetaColor,
} from './theme.js'

beforeEach(() => {
  document.head.innerHTML = '<meta name="theme-color" content="#000000">'
  delete document.documentElement.dataset.theme
})

describe('theme contract', () => {
  it('exposes exactly the two current choices', () => {
    expect(THEME_VALUES).toEqual(['blackwall', 'daemon'])
    expect(THEMES.map(t => t.name)).toEqual(['BLACKWALL', 'DAEMON CRT'])
    expect(DEFAULT_THEME).toBe('blackwall')
  })

  it('normalizes every legacy or unknown value to Blackwall', () => {
    for (const legacy of ['dark', 'light', 'lime', 'system', '', 'DAEMON', 'Daemon', null, undefined, 0, {}, []]) {
      expect(normalizeTheme(legacy), String(legacy)).toBe('blackwall')
    }
    expect(normalizeTheme('daemon')).toBe('daemon')
  })

  it('maps each theme to a distinct browser-chrome colour and defaults safely', () => {
    expect(themeMetaColor('daemon')).toBe('#080204')
    expect(themeMetaColor('dark')).toBe('#020407')
    expect(new Set(THEME_VALUES.map(themeMetaColor)).size).toBe(2)
  })

  it('applies data-theme and the runtime theme-color immediately', () => {
    expect(applyTheme('daemon')).toBe('daemon')
    expect(document.documentElement.dataset.theme).toBe('daemon')
    expect(document.querySelector('meta[name="theme-color"]').content).toBe('#080204')

    // a legacy value arriving mid-session must repaint to Blackwall, not paint nothing
    expect(applyTheme('light')).toBe('blackwall')
    expect(document.documentElement.dataset.theme).toBe('blackwall')
    expect(document.querySelector('meta[name="theme-color"]').content).toBe('#020407')
  })

  it('never throws without a document and still reports the normalized id', () => {
    expect(applyTheme('daemon', null)).toBe('daemon')
    expect(applyTheme('dark', null)).toBe('blackwall')
    expect(applyTheme(undefined, {})).toBe('blackwall')
  })

  it('reports daemon only for the daemon id', () => {
    expect(isDaemon('daemon')).toBe(true)
    for (const other of ['blackwall', 'dark', 'light', undefined, null]) expect(isDaemon(other)).toBe(false)
  })
})

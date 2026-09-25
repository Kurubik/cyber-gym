// The two-theme contract.
//
// Blackwall — the cyan control-system skin — is the default and the destination for every
// stored value that predates the picker ('dark', 'light', an old accent-era profile, an
// unknown string). DAEMON CRT is the opt-in red terminal theme. One source of truth for the
// ids, the legacy mapping and the browser-chrome colour, shared by the store, the shell and
// the tests. Kept runtime-agnostic and Node-loadable on purpose — no React, no import.meta.

export const DEFAULT_THEME = 'blackwall'

// `name` is a brand string and is deliberately not translated; `descKey` is the English source
// string the Settings preview passes to t(); `meta` is the colour the browser paints its own
// chrome (address/status bar) from, so runtime chrome matches the active theme.
export const THEMES = [
  {
    value: 'blackwall',
    name: 'BLACKWALL',
    descKey: 'Cyan Blackwall terminal — the default control-system skin.',
    meta: '#020407',
  },
  {
    value: 'daemon',
    name: 'DAEMON CRT',
    descKey: 'Serious red CRT terminal: oxblood tube, red rails, sparse HUD.',
    meta: '#080204',
  },
]

const BY_VALUE = new Map(THEMES.map(t => [t.value, t]))

export const THEME_VALUES = THEMES.map(t => t.value)

// Anything that is not one of the two current ids resolves to Blackwall. Never throws: a
// corrupt profile key or a backup from another build must still boot, not white-screen.
export function normalizeTheme(value) {
  return BY_VALUE.has(value) ? value : DEFAULT_THEME
}

export function themeMetaColor(theme) {
  return BY_VALUE.get(normalizeTheme(theme)).meta
}

export const isDaemon = theme => normalizeTheme(theme) === 'daemon'

// Apply a theme to a document: the <html data-theme> the stylesheet keys off, plus the runtime
// theme-color the browser chrome reads. Returns the normalized id so callers can compare.
// `doc` is injectable so the behaviour is testable without a browser.
export function applyTheme(theme, doc = (typeof document !== 'undefined' ? document : null)) {
  const value = normalizeTheme(theme)
  if (!doc || !doc.documentElement) return value
  doc.documentElement.dataset.theme = value
  const meta = doc.querySelector && doc.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = themeMetaColor(value)
  return value
}

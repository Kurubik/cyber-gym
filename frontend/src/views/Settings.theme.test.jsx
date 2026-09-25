// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// A real (tiny) zustand store stands in for the app store, so a switch actually re-renders the
// chooser — the thing under test is the wiring from a tap to S.theme, not a mocked callback.
vi.mock('../store/useStore.js', async () => {
  const { create } = await import('zustand')
  const DEF = { theme: 'blackwall', unit: 'kg', body: 'male', gifSize: 'full', sound: false, effort: 'none' }
  const useStore = create((set, get) => ({
    S: { ...DEF },
    user: null,
    coachLocal: null,
    update(mut) { const S = structuredClone(get().S); mut(S); set({ S }) },
    replaceState: vi.fn(), setUser: vi.fn(), pullState: vi.fn(), pushState: vi.fn(),
    signOut: vi.fn(), signOutAll: vi.fn(), resetDemo: vi.fn(), disconnectServer: vi.fn(), adoptProfile: vi.fn(),
  }))
  return { useStore, DEF, hasData: () => false }
})
vi.mock('../store/useUI.js', () => {
  const snap = () => ({ toast: vi.fn(), openSheet: vi.fn() })
  const useUI = selector => (selector ? selector(snap()) : snap())
  useUI.getState = snap
  return { useUI }
})
vi.mock('react-router-dom', () => ({ useNavigate: () => () => {} }))
vi.mock('../lib/api.js', () => ({
  api: vi.fn(), webauthnOK: () => false, passkeyLogin: vi.fn(), passkeyRegister: vi.fn(), IS_ANDROID: false,
}))
vi.mock('../lib/push.js', () => ({ pushSupported: () => false, enablePush: vi.fn(), disablePush: vi.fn(), sendTestPush: vi.fn(), syncPushSubscription: vi.fn() }))
vi.mock('../lib/wakelock.js', () => ({ wakeLockSupported: () => false }))
vi.mock('../lib/mobile.js', () => ({ MOBILE: false, isAndroid: () => Promise.resolve(false), shareExport: vi.fn(), syncReminder: vi.fn() }))
vi.mock('../lib/update.js', () => ({
  checkForUpdate: vi.fn(() => Promise.resolve({ hasUpdate: false, latestVersion: 'test', apkUrl: null, hashUrl: null })),
  downloadAndInstall: vi.fn(),
}))
vi.mock('./MobileOnboarding.jsx', () => ({ ConnectSheet: () => null }))
vi.mock('../sheets.jsx', () => ({
  starterPlanSheet: vi.fn(), confirmSheet: vi.fn(), importFromApp: vi.fn(), importFromHevy: vi.fn(),
  equipmentProfileSheet: vi.fn(), menuSheet: vi.fn(), askAddDeviceData: vi.fn(),
}))

import Settings from './Settings.jsx'
import { useStore } from '../store/useStore.js'

globalThis.__APP_VERSION__ ??= 'test'
globalThis.IS_REACT_ACT_ENVIRONMENT = true

let host, root
beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})
afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

const mount = async () => { await act(async () => { root.render(<Settings />) }) }
const radios = () => [...host.querySelectorAll('[role=radio]')]
const group = () => host.querySelector('[role=radiogroup]')
const key = (el, k) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))

describe('Settings — theme chooser', () => {
  it('renders both themes as a labelled radio group with Blackwall selected', async () => {
    await mount()
    expect(group()).toBeTruthy()
    expect(group().getAttribute('aria-label')).toBe('Theme')
    const r = radios()
    expect(r).toHaveLength(2)
    expect(r[0].textContent).toContain('BLACKWALL')
    expect(r[1].textContent).toContain('DAEMON CRT')
    expect(r[0].getAttribute('aria-checked')).toBe('true')
    expect(r[1].getAttribute('aria-checked')).toBe('false')
    // one tab stop: focus lands on the selected card, not both
    expect(r.map(x => x.tabIndex)).toEqual([0, -1])
  })

  it('gives each card a real accessible name from its visible copy', async () => {
    await mount()
    const [bw, dm] = radios()
    expect(bw.textContent).toContain('Cyan Blackwall terminal')
    expect(dm.textContent).toContain('Serious red CRT terminal')
  })

  it('switches on click: store value, checked state and roving focus follow at once', async () => {
    await mount()
    act(() => { radios()[1].click() })
    expect(useStore.getState().S.theme).toBe('daemon')
    expect(radios()[1].getAttribute('aria-checked')).toBe('true')
    expect(radios()[0].getAttribute('aria-checked')).toBe('false')
    expect(radios().map(x => x.tabIndex)).toEqual([-1, 0])
  })

  it('moves the selection with the arrow keys, as a radio group implies', async () => {
    await mount()
    const [bw, dm] = radios()
    act(() => { bw.focus() })
    act(() => { key(bw, 'ArrowRight') })
    expect(useStore.getState().S.theme).toBe('daemon')
    expect(document.activeElement).toBe(radios()[1])
    act(() => { key(dm, 'ArrowLeft') })
    expect(useStore.getState().S.theme).toBe('blackwall')
    expect(document.activeElement).toBe(radios()[0])
  })

  it('normalizes a legacy stored theme to Blackwall in the chooser', async () => {
    useStore.setState({ S: { ...useStore.getState().S, theme: 'dark' } })
    await mount()
    expect(radios()[0].getAttribute('aria-checked')).toBe('true')
    expect(radios()[1].getAttribute('aria-checked')).toBe('false')
  })
})

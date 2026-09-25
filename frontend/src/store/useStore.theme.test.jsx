// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/api.js', () => ({ api: vi.fn() }))
// pushState reaches the toast through a lazy import of useUI (which imports this store).
const { toast } = vi.hoisted(() => ({ toast: vi.fn() }))
vi.mock('./useUI.js', () => ({ useUI: { getState: () => ({ toast }) } }))

import { DEF, restoredStateFor, useStore } from './useStore.js'

const clone = v => JSON.parse(JSON.stringify(v))

beforeEach(() => {
  localStorage.clear()
  useStore.setState({ S: clone(DEF), user: null, ready: false })
})
afterEach(() => {
  localStorage.clear()
  useStore.setState({ S: clone(DEF), user: null, ready: false })
})

describe('theme state', () => {
  it('defaults to Blackwall', () => {
    expect(DEF.theme).toBe('blackwall')
  })

  it('applies a switch immediately and persists the current id', () => {
    useStore.getState().update(s => { s.theme = 'daemon' })
    expect(useStore.getState().S.theme).toBe('daemon')
    expect(JSON.parse(localStorage.getItem('gym_state_v1')).theme).toBe('daemon')
  })

  it('rewrites a legacy value to Blackwall as it is stored', () => {
    useStore.getState().update(s => { s.theme = 'dark' })
    expect(useStore.getState().S.theme).toBe('blackwall')
    expect(JSON.parse(localStorage.getItem('gym_state_v1')).theme).toBe('blackwall')
  })

  it('keeps a daemon choice across a reload', () => {
    useStore.getState().update(s => { s.theme = 'daemon' })
    // what a fresh boot would read back out of storage
    const stored = JSON.parse(localStorage.getItem('gym_state_v1'))
    expect(stored.theme).toBe('daemon')
  })

  it('normalizes a legacy theme on a pulled server copy', () => {
    const local = clone(DEF)
    const remote = { ...clone(DEF), theme: 'dark', _ts: Date.now() + 1000 }
    expect(restoredStateFor(local, remote).theme).toBe('blackwall')
  })

  it('leaves a daemon value from the server alone', () => {
    const remote = { ...clone(DEF), theme: 'daemon', _ts: Date.now() + 1000 }
    expect(restoredStateFor(clone(DEF), remote).theme).toBe('daemon')
  })

  it('migrates a legacy theme already sitting in storage at boot', async () => {
    localStorage.setItem('gym_state_v1', JSON.stringify({ theme: 'dark', unit: 'lb' }))
    vi.resetModules()
    const fresh = await import('./useStore.js')
    expect(fresh.useStore.getState().S.theme).toBe('blackwall')
    expect(fresh.useStore.getState().S.unit).toBe('lb')   // the rest of the profile is untouched
  })
})

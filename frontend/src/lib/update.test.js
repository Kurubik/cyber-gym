import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { checkForUpdate, sha256, resetUpdateCheck } from './update.js'

// __APP_VERSION__ is defined at build time by vite.config.js (reads package.json).
// In the test environment vitest applies the same define, so it's available here.

describe('sha256', () => {
  it('computes the correct hash for a known input', async () => {
    const input = new TextEncoder().encode('hello world')
    const hash = await sha256(input.buffer)
    // Well-known SHA-256 of "hello world"
    expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9')
  })

  it('computes a different hash for different input', async () => {
    const a = await sha256(new TextEncoder().encode('aaa').buffer)
    const b = await sha256(new TextEncoder().encode('bbb').buffer)
    expect(a).not.toBe(b)
  })

  it('returns a 64-character hex string', async () => {
    const hash = await sha256(new TextEncoder().encode('test').buffer)
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('checkForUpdate', () => {
  let originalFetch

  beforeEach(() => { originalFetch = globalThis.fetch; resetUpdateCheck() })
  afterEach(() => { globalThis.fetch = originalFetch })

  function mockFetch(body, status = 200) {
    globalThis.fetch = vi.fn(() => Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    }))
  }

  const release = (tag, assets = []) => ({ tag_name: tag, assets })

  it('reports no update when the latest release matches the current version', async () => {
    mockFetch(release('v' + __APP_VERSION__))
    const result = await checkForUpdate()
    expect(result.hasUpdate).toBe(false)
    expect(result.latestVersion).toBe(__APP_VERSION__)
    expect(result.apkUrl).toBe(null)
    expect(result.hashUrl).toBe(null)
  })

  it('reports no update when the latest release is older than current', async () => {
    mockFetch(release('v0.0.1'))
    const result = await checkForUpdate()
    expect(result.hasUpdate).toBe(false)
    expect(result.latestVersion).toBe('0.0.1')
  })

  it('reports an update when the latest release is newer', async () => {
    mockFetch(release('v99.0.0'))
    const result = await checkForUpdate()
    expect(result.hasUpdate).toBe(true)
    expect(result.latestVersion).toBe('99.0.0')
  })

  it('strips the v prefix from the tag name', async () => {
    mockFetch(release('v99.1.2'))
    const result = await checkForUpdate()
    expect(result.latestVersion).toBe('99.1.2')
  })

  it('handles tag names without a v prefix', async () => {
    mockFetch(release('99.0.0'))
    const result = await checkForUpdate()
    expect(result.hasUpdate).toBe(true)
    expect(result.latestVersion).toBe('99.0.0')
  })

  it('finds the APK download URL among the release assets', async () => {
    const apkUrl = 'https://github.com/Kurubik/cyber-gym/releases/download/v2.0.0/cyber-gym.apk'
    mockFetch(release('v99.0.0', [{ name: 'cyber-gym.apk', browser_download_url: apkUrl }]))
    const result = await checkForUpdate()
    expect(result.apkUrl).toBe(apkUrl)
  })

  it('returns null apkUrl when no .apk asset exists', async () => {
    mockFetch(release('v99.0.0', [{ name: 'changelog.md', browser_download_url: 'https://example.com/changelog.md' }]))
    const result = await checkForUpdate()
    expect(result.hasUpdate).toBe(true)
    expect(result.apkUrl).toBe(null)
  })

  it('finds the .sha256 checksum asset', async () => {
    const hashUrl = 'https://github.com/Kurubik/cyber-gym/releases/download/v99.0.0/cyber-gym.apk.sha256'
    mockFetch(release('v99.0.0', [
      { name: 'cyber-gym.apk', browser_download_url: 'https://example.com/cyber-gym.apk' },
      { name: 'cyber-gym.apk.sha256', browser_download_url: hashUrl },
    ]))
    const result = await checkForUpdate()
    expect(result.hashUrl).toBe(hashUrl)
  })

  it('does not mistake the APK for its checksum when the checksum is listed first', async () => {
    const apkUrl = 'https://github.com/Kurubik/cyber-gym/releases/download/v99.0.0/cyber-gym.apk'
    const hashUrl = apkUrl + '.sha256'
    mockFetch(release('v99.0.0', [
      { name: 'cyber-gym.apk.sha256', browser_download_url: hashUrl },
      { name: 'cyber-gym.apk', browser_download_url: apkUrl },
    ]))
    const result = await checkForUpdate()
    expect(result.apkUrl).toBe(apkUrl)
    expect(result.hashUrl).toBe(hashUrl)
  })

  // The shape api.github.com returns for GET /repos/Kurubik/cyber-gym/releases/latest.
  // Only the fields the updater reads are kept.
  const REAL_RELEASE = {
    tag_name: 'v0.2.0',
    name: 'Cyber Gym 0.2.0',
    assets: [
      {
        name: 'cyber-gym-0.2.0.apk',
        browser_download_url: 'https://github.com/Kurubik/cyber-gym/releases/download/v0.2.0/cyber-gym-0.2.0.apk',
      },
      {
        name: 'cyber-gym-0.2.0.apk.sha256',
        browser_download_url: 'https://github.com/Kurubik/cyber-gym/releases/download/v0.2.0/cyber-gym-0.2.0.apk.sha256',
      },
    ],
  }

  it('finds the APK and its checksum in a real release payload', async () => {
    mockFetch(REAL_RELEASE)
    const result = await checkForUpdate()
    expect(result.latestVersion).toBe('0.2.0')
    expect(result.apkUrl).toBe('https://github.com/Kurubik/cyber-gym/releases/download/v0.2.0/cyber-gym-0.2.0.apk')
    expect(result.hashUrl).toBe('https://github.com/Kurubik/cyber-gym/releases/download/v0.2.0/cyber-gym-0.2.0.apk.sha256')
  })

  it('returns null hashUrl when no hash asset exists', async () => {
    mockFetch(release('v99.0.0', [{ name: 'cyber-gym.apk', browser_download_url: 'https://example.com/cyber-gym.apk' }]))
    const result = await checkForUpdate()
    expect(result.hashUrl).toBe(null)
  })

  it('reports no update when the repository has no release yet', async () => {
    mockFetch({ message: 'Not Found' }, 404)
    const result = await checkForUpdate()
    expect(result.hasUpdate).toBe(false)
    expect(result.latestVersion).toBe(__APP_VERSION__)
    expect(result.hashUrl).toBe(null)
  })

  it('throws when the API responds with an error status', async () => {
    mockFetch(null, 500)
    await expect(checkForUpdate()).rejects.toThrow('GitHub API 500')
  })

  it('throws on network failure', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('Network error')))
    await expect(checkForUpdate()).rejects.toThrow('Network error')
  })
})

describe('semver comparison (via checkForUpdate behavior)', () => {
  let originalFetch
  beforeEach(() => { originalFetch = globalThis.fetch; resetUpdateCheck() })
  afterEach(() => { globalThis.fetch = originalFetch })

  function mockRelease(tag) {
    globalThis.fetch = vi.fn(() => Promise.resolve({
      ok: true, status: 200,
      json: () => Promise.resolve({ tag_name: tag, assets: [] }),
    }))
  }

  // Versions are derived from the running __APP_VERSION__ so the suite never breaks
  // when package.json bumps. bump(2, +1) raises the patch; bump(0, +1) raises the major.
  const [MAJ, MIN, PATCH] = __APP_VERSION__.split('.').map(Number)
  const bump = (idx, by) => {
    const parts = [MAJ, MIN, PATCH]
    parts[idx] += by
    return 'v' + parts.join('.')
  }

  it('detects a patch bump as an update', async () => {
    mockRelease(bump(2, 1))
    expect((await checkForUpdate()).hasUpdate).toBe(true)
  })

  it('detects a minor bump as an update', async () => {
    mockRelease(bump(1, 1))
    expect((await checkForUpdate()).hasUpdate).toBe(true)
  })

  it('detects a major bump as an update', async () => {
    mockRelease(bump(0, 1))
    expect((await checkForUpdate()).hasUpdate).toBe(true)
  })

  it('does not flag an older patch as an update', async () => {
    // One patch below current (current patch is always >= our test floor)
    mockRelease('v' + [MAJ, MIN, Math.max(0, PATCH - 1)].join('.'))
    // Only meaningful when we could actually go lower; when patch is 0 this equals current,
    // which correctly reports no update either way.
    expect((await checkForUpdate()).hasUpdate).toBe(false)
  })

  it('does not flag an older minor as an update', async () => {
    // A version guaranteed lower than any 1.x+ release: same major, minor 0, patch 0,
    // minus one on the minor when possible.
    mockRelease('v' + [MAJ, Math.max(0, MIN - 1), 0].join('.'))

    expect((await checkForUpdate()).hasUpdate).toBe(false)
  })
})

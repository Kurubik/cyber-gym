# Cyber Gym — handoff (Blackwall redesign)

Target repository: `/root/.openclaw/workspace/cyber-gym`
Remote: `git@github.com:Kurubik/cyber-gym.git` · Branch: `main`

## 1. Bootstrap

- Upstream snapshot: `https://github.com/DuarteSantos8/openGym.git` @ `f91cde15a1c7ec9af815a1c5878643105636abdf` (branch `main`).
- Working tree copied **without `.git`**; a fresh repository was initialised in the target.
- No upstream history, branches, tags or remotes were imported.

## 2. Inventory (before editing)

| Surface | What was there |
|---|---|
| Frontend | React 19 + Vite, 555 files total; ~90 `.jsx` (views, sheets, modals, ui primitives, charts, heatmap, body map, QR, camera), 126 vitest files |
| API | framework-less Node: WebAuthn/passkeys, per-profile state, push (web-push), admin + audit, AI coach (adapters, prompts, jobs, limits) |
| MCP | `@modelcontextprotocol/sdk` stdio bridge, read-only |
| PWA | `manifest.json`, `sw.js` (build-stamped cache), install/update UX |
| Containers | `docker-compose.yml` (media/api/web), `api/Dockerfile` (2 targets), `web/Dockerfile` + nginx template |
| Native | Capacitor Android + iOS projects, `ch.duartesantos.opengym`, custom Install/Print plugins |
| Coach prompts | `api/coach/prompts/*.md`, one shared system prompt |
| Website/docs | marketing site (4 HTML pages, 350 KB), 8 dev docs, README/NOTICE/CONTRIBUTING/SECURITY/ROADMAP/CHANGELOG |
| Assets | banner + 5 old-brand screenshots + social image, lime dumbbell icon |
| CI | GitHub Actions (test/docker-publish/pages/mirror), GitLab CI + mirror, Gitea workflows, renovate, FUNDING |

## 3. Decisions

1. **One language.** Russian is the default *and* the only product language. `LANGS` keeps the
   plumbing (the locale mechanism is still exercised by tests), but the language selector is
   gone and `lang` defaults to `ru` in the store, the i18n core and the shell. Every `t()`
   literal now has a Russian entry — enforced by `src/lib/i18n-ru.test.js`.
2. **Identity, not a reskin.** Old names, domains, badges, funding, Discord, mirror pipelines and
   stale release prose were removed. The only surviving mention of the original project is the
   attribution block in `NOTICE.md` (see §7).
3. **`cybergym_plan`** replaced the old `opengym_plan` export marker: new product, no legacy
   files to read.
4. **No GitLab.** The Android OTA updater now reads GitHub Releases; CI is GitHub Actions only;
   `.gitlab-ci.yml`, `.gitlab/`, `.gitea/`, `renovate.json`, the mirror job and `FUNDING.yml` are
   gone.
5. **Typography is self-hosted.** IBM Plex Sans (400/600) + JetBrains Mono (500), `latin` +
   `cyrillic` subsets, OFL. The service worker precaches the `.woff2` files (read out of the
   built CSS, since a font is not referenced from `index.html`).
6. **Dark-only by fiat.** The theme/accent pickers were removed; `applyPrefs()` pins
   `data-theme="dark"` so a stale stored preference cannot resurrect the old skin.
7. **Website rebuilt, not patched.** The four old marketing pages and the API-doc generator were
   removed and replaced by one Russian Blackwall page (`website/`); GitHub Pages publishes it.

## 4. Design system (Blackwall)

Tokens first in `frontend/src/index.css` (`--bg #020407`, `--surface #091018/#0D1722`,
`--cyan #00E5FF`, `--magenta #FF2BD6`, `--amber #FFB000`), then a `Blackwall layer` that adds:
technical grid + scanlines, chamfered panels with HUD corner ticks, mono telemetry labels,
status chips with a leading bar, cyan tab bar, boot sweep. Legacy palette names (`--blue`,
`--purple`, …) are aliased onto the new signals so every pre-existing screen lands on-system
without being rewritten class by class. Reduced motion is respected globally.

## 5. Verification (all on the built artifact)

| Check | Command | Result |
|---|---|---|
| Frontend tests | `cd frontend && npm test` | **127 files / 1586 tests passed** |
| API tests | `cd api && npm test` | **193 passed, 0 failed** |
| MCP tests | `cd mcp && npm test` | **58 passed** |
| Production build | `cd frontend && npm run build` | OK (fonts + icons + manifest emitted) |
| Locale parity | `node scripts/check-locales.mjs` | 14 packs × 1573 keys, in sync |
| t() coverage | `node scripts/check-source-strings.mjs --strict` | 1269 strings, all defined |
| Compose config | `docker compose config -q` | valid (`api`, `media`, `web`) |
| Service worker | `scripts/capture-screenshots.mjs` + `sw` probe | activates, cache `cybergym-rt-<hash>`, 11 entries incl. `.woff2` |
| PWA manifest | same | `name: Cyber Gym`, `lang: ru`, `theme: #04060D`, 3 icons |
| Fonts (computed) | same | `IBM Plex Sans` + `JetBrains Mono` loaded, `cyrillicRendered: true` |
| Overflow | same, 8 routes × {390, 1440} | no horizontal overflow anywhere |
| Reduced motion | same | animation/transition ≈ 0 |
| Android build | `ANDROID_HOME=/opt/android-sdk npx cap sync android && JAVA_HOME=<jdk21> ./android/gradlew -p android assembleDebug` | **BUILD SUCCESSFUL** — `app-debug.apk` (30 MB), package `com.kurubik.cybergym.test`, versionName `0.1.0`, minSdk 23, target/compileSdk 35 |
| iOS | static: `App/Info.plist`, `project.pbxproj`, asset catalogs | `Cyber Gym`, `com.kurubik.cybergym`, `0.1.0`, icons/splash present |

Screenshots (fresh, from the built app, 390 px + 1440 px): `assets/screenshots/` —
`login`, `home`, `plan`, `workout`, `stats`, `library`, `muscles`, `history`, `settings`.

## 6. Android / iOS

- Android: package `com.kurubik.cybergym`, sources moved to
  `android/app/src/main/java/com/kurubik/cybergym`, labels "Cyber Gym" (debug overlay
  "CyberGymTest"), launcher/adaptive/splash icons regenerated, version `0.1.0`.
- iOS: display name "Cyber Gym", bundle id `com.kurubik.cybergym`, camera permission string in
  Russian, app icon + splash regenerated.
- Android `assembleDebug` was run on this host. Three blockers had to be cleared first, all of them
  environment, not code: `cap sync android` had never run (so
  `android/capacitor-cordova-android-plugins/` did not exist), `platforms;android-35` was only a
  partial directory, and the Capacitor 7 plugins want a Java 21 toolchain while the host had 17.
  After `npx cap sync android`, `sdkmanager "platforms;android-35"` and installing
  `openjdk-21-jdk-headless`, the build succeeded and the APK reports the new identity:
  `package: name='com.kurubik.cybergym.test'` (the `.test` suffix is the debug variant, by
  design), `versionName='0.1.0'`, `compileSdkVersion='35'`, label `CyberGymTest` (the debug label
  overlay; the release label is "Cyber Gym").
- No release APK was signed, and the iOS side was validated statically only — there is no macOS
  toolchain on this host.

## 7. Branding scrub and legal allowlist

`grep -rniI -E 'opengym|duartesantos|duarte-santos'` over the tree (excluding `node_modules`,
`.git`, `dist`) returns **no hit outside** the two allowlisted places:

1. `LICENSE` — untouched AGPL text (no product names in it).
2. `NOTICE.md` — the attribution block that names the original project, its author and its URL,
   as the licence requires. Marked in-file as attribution-only, not product.

Additional scrub: `discord|buymeacoffee|patreon|ko-fi|gitea|gitlab` → no hits in first-party code
or docs (remaining `github.com/sponsors/*` hits are third-party lockfile metadata).
`src/lib/i18n-ru.test.js` fails the build if either the old identity or a Latin sentence
reappears in the Russian pack or in visible markup.

## 8. Honest limitations

- The language selector is gone and only Russian ships; the other 13 packs are still present as
  internal plumbing (tests exercise them). They are not reachable from the UI.
- `sw.js` registers on `https:` only, which is the upstream behaviour; local verification
  therefore registered it explicitly and probed the cache rather than relying on the app's own
  registration.
- Exercise media is not in the repository (by upstream licence design), so the screenshots show
  placeholder thumbnails and the console reports 404s for `/img/*` and `/gif/*`.
- `artifacts/` and `scripts/capture-screenshots.mjs` are maintainer tools, not product code;
  `playwright-core` is resolved from the host install, not added as a dependency.
- The AI Coach now instructs the provider to write human-readable fields in Russian; that
  instruction was not exercised against a live provider here.

---

# Addendum — DAEMON CRT second theme (2026-09-25)

Base revision: `fdfede109393b3715de3fee7025b6d662fe9b817` (`main`, clean, matched `origin/main`).
This addendum travels in the commit that carries the change; it was pushed normally to `main`
(no force) as **`b3afa07`** `Add DAEMON CRT as a second, opt-in theme` — a fast-forward from
`fdfede1`, with local `HEAD`, `origin/main` and the remote ref equal afterwards and a clean
tree. The addendum itself lands in the small follow-up commit that records this line.

## A. What changed

A second, opt-in theme. Blackwall (cyan) stays the default and keeps every legacy value; the new
**DAEMON CRT** is a deliberately distinct red terminal skin, not a hue swap.

- Theme ids: `blackwall` (default) and `daemon`; `dark`, `light`, unknown strings, `null` and a
  missing key all normalize to `blackwall` (profile, backup import and server pull alike).
- Tokens are overridden under `:root[data-theme="daemon"]`: near-black oxblood tube
  (`#080204`/`#120407`), red structure (`#650014`/`#A50022`/`#FF173F`), off-white rose-tinted body
  copy, mauve/steel muted text, restrained cyan (`#62DDE8`/`#7DF6FF`) reserved for measurement —
  charts, heatmap, body map, progress bars, the live timer clock and set/day completion ticks —
  and amber for warning. Red owns borders, rails, separators, focus traces and active state.
- DAEMON controls read as instruments: `.btn.primary` is a dark plate with a red rail (the cyan
  slab is gone) and a cyan confirmation state on press; the bottom bar is an instrument rail and
  the desktop bar a wider console rail; labels/data lean on JetBrains Mono while body copy stays
  on IBM Plex Sans.
- A reusable, pointer-transparent CRT layer (`frontend/src/components/CrtLayer.jsx` + the `crt-*`
  CSS) mounts only for daemon: fine scanlines, a tube vignette, restrained phosphor bloom, a slow
  red roll band, a rare tear (idle 95.6% of a 13 s cycle) and a red/cyan convergence split on
  large headings and numeric telemetry. No large blurs; `contain:paint`, no layout impact.
- Settings gains an **Интерфейс** section with an accessible preview-card radio group
  (`role=radiogroup`/`role=radio`, roving tabindex, arrow-key selection, ≥78 px cards, Russian
  copy). Switching is immediate, no reload, scroll position kept.
- `document.documentElement.dataset.theme` and `<meta name="theme-color">` follow `S.theme`
  reactively; an inline bootstrap in `frontend/index.html` sets both before first paint so a daemon
  profile never flashes the cyan skin (no CSP relaxation — the template ships only
  `frame-ancestors`).
- `frontend/src/components/TimerFlash.jsx` no longer flips `data-theme`; the timer blink is a
  theme-independent `data-flash` invert, so it reads the same in either skin.

### Changed paths

- New: `frontend/src/lib/theme.js`, `frontend/src/components/CrtLayer.jsx`,
  `frontend/src/lib/theme.test.js`, `frontend/src/lib/theme-css.test.js`,
  `frontend/src/store/useStore.theme.test.jsx`, `frontend/src/views/Settings.theme.test.jsx`,
  `assets/screenshots/daemon-*.png` (and the new `*-320`/`*-empty`/`*-sheet`/`*-reduced-motion`
  captures).
- Modified: `frontend/index.html`, `frontend/src/App.jsx`, `frontend/src/index.css`,
  `frontend/src/store/useStore.js`, `frontend/src/views/Settings.jsx`,
  `frontend/src/components/TimerFlash.jsx`, `frontend/src/components/LineChart.jsx` (default chart
  colour moved onto the new `--chart` token), all 14 `frontend/src/locales/*.js`,
  `frontend/src/lib/pt-br-locale.test.js`, `scripts/capture-screenshots.mjs`.

### Pre-existing layout bug fixed (outside the theme, affecting both skins)

`frontend/src/index.css` grouped `#app,#tabbar,#timer,#toast,.sheet,.modal-back` under
`{position:relative;z-index:2}`. For `#app` that is correct; for the others it overturned their
own `position:fixed`/`absolute`, which put the tab bar at the **end of the document** (off-screen
on any long page), pinned the rest timer and toast into the flow, and anchored every bottom sheet
to the **top** of the screen. Verified in the built app before the fix (`#tabbar` computed
`position:relative`, rect `y:3452` at a 844 px viewport; `.sheet` at `y:0`). The rule is now
`#app{position:relative;z-index:2}` only. The theme work made this impossible to leave alone — an
“instrument rail” that lives 3 400 px down the page is not a bottom navigation and cannot be
shown in a screenshot. Flagged here because it visibly changes Blackwall on long pages and in
sheets; if that trade is unwanted, revert that single line.

## B. Verification (all on the built artifact)

Baseline before editing: `cd frontend && npm test` → **127 files / 1586 tests passed, exit 0**.

| Check | Command | Result |
|---|---|---|
| Frontend tests | `cd frontend && npm test` | **131 files / 1611 tests passed, exit 0** (4 new files / 25 new tests) |
| Locale parity | `node scripts/check-locales.mjs` | **14 locales × 1579 keys, in sync, exit 0** |
| t() coverage (strict) | `node scripts/check-source-strings.mjs --strict` | **1274 strings, all defined, exit 0** |
| Production build | `cd frontend && npm run build` | **exit 0**; bootstrap preserved in `dist/index.html` |
| Fatigue probe | `npm run test:fatigue-probe` | **exit 0** (108 000 comparisons, PASS) |
| Compose config | `docker compose config -q` | **exit 0** with a `.env` (copied from `.env.example`, then removed); exit 1 without one, because the file declares `env_file: .env` — environmental, not a config error |
| SW cache invalidation | build stamps | `cybergym-rt-66b7140bb1` → `…ecdd1db279` → `…eebbe01daf` → `cybergym-rt-c50d3a1700` across the rebuilds; no `__BUILD__` left |
| Browser verification | `node scripts/capture-screenshots.mjs` | **49 screenshots, 0 console errors**, 138 expected exercise-media 404s |
| Boot theme | capture, both themes × {390,1440} | blackwall → `data-theme=blackwall`, meta `#020407`, no CRT; daemon → `data-theme=daemon`, meta `#080204`, CRT present |
| Live switch | capture (mobile) | theme + meta follow a click immediately, `aria-checked` flips, scroll `700 → 700`, selection restores |
| Overflow | capture, 390/1440 all routes + 320 subset ×2 themes (36 checks) | **0 offenders** |
| Reduced motion | capture (`reducedMotion:'reduce'`) | roll + tear hidden, scanlines/vignette still painted, theme still daemon, app animation `1e-06s` |
| Fonts | capture, both themes | IBM Plex Sans + JetBrains Mono loaded; Cyrillic renders in **both** (incl. the mono face) |
| PWA | capture | worker registers, cache `cybergym-rt-c50d3a1700`, 11 entries incl. 4 `.woff2`; manifest unchanged (`theme #04060D`, 3 icons) |

### Screenshots

`assets/screenshots/`, both themes from the same seeded profile: `daemon-login-{390,1440}`,
`daemon-home-{390,1440}`, `daemon-plan-*`, `daemon-workout-*` (active) and
`daemon-workout-empty-*`, `daemon-stats-*`, `daemon-library-*`, `daemon-muscles-*`,
`daemon-history-*`, `daemon-settings-*`, `daemon-sheet-*`, `daemon-theme-320`,
`daemon-reduced-motion-390`; the Blackwall regression set is the unprefixed names
(`home-390`, `settings-390`, `stats-1440`, `workout-390`, `theme-320`, …), refreshed in the same
run. Pixels were inspected: daemon reads as a sparse oxblood terminal (red rails, off-white copy,
cyan only on charts/heatmap/body map/completion), not a recoloured Blackwall; Blackwall is
unchanged.

## C. Honest limitations

- **Native packaging was not rebuilt.** This is a CSS/state-only web change: no Capacitor config,
  native assets or plugins were touched, so no `cap sync`/Gradle/Xcode run. On device the theme is
  WebView-rendered; the Android/iOS build identity from §6 is unaffected. Android/iOS visual
  verification is therefore **not** claimed.
- The pre-existing positioning fix (A) changes Blackwall's rendered layout as well; see the note.
- Exercise media is still absent from the repository, so the capture logs 138 `/img/*`,`/gif/*`
  404s and the screenshots show placeholder tiles.
- The 13 non-Russian locale packs carry the six new strings as English fallbacks (parity tooling
  only); Russian is the only visible language.
- The `data-flash` timer blink and the CRT bloom were not captured mid-blink; only the static
  daemon and the reduced-motion daemon are screenshotted.
- `sw.js` registers on `https:` only (upstream rule), so the local probe registered it explicitly
  before reading the cache — same caveat as §8.

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

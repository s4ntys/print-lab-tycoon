# PRINT LAB World

Public, server-authoritative browser tycoon with 8 stages, 8 printable models, 16 printer slots, printer levels, 4 research tracks, offline production, customer contracts, daily missions, milestones and prestige.

## Identity and ranking

The server creates a 256-bit random session token. Only its SHA-256 hash is stored in D1. The browser receives a `__Host-pl_session` cookie with Secure, HttpOnly, SameSite=Strict, Path=/ and a one-year lifetime. Names are unique, normalized gamer tags (3–20 A–Z letters, digits or underscores), locked after creation. Countries and languages remain editable. A unique player ID exists independently of the name.

A separate 256-bit recovery code is shown once. Recovery rotates both the session token and recovery code, invalidating previous sessions. Keep the code private: possession grants recovery access. Cookies prevent casual impersonation; device compromise or theft of a recovery code is outside this protection. Clearing cookies requires the recovery code. There is no email collection or external login.

All competitive game state is in D1. Clients submit actions and expected revisions, never accepted balances or scores. Optimistic updates reject concurrent overwrites and replayed requests. Same-origin JSON writes enforce Origin checks, parameterized SQL handles user input, account creation/recovery are rate limited, and a CSP limits script execution. Rankings expose only gamer tag, country, public ID, lifetime earnings, stage, prestige and active time. Countries are self-selected, not verified locations. No fake leaderboard entries are seeded.

The score is server-calculated lifetime earnings; spending and prestige do not lower it. Active time is based on server intervals between visible-page heartbeats, excluding gaps above 20 seconds. It measures connected gameplay, not human attention, and is shared across tabs to avoid double counting. Automation uses server time and has a research-dependent offline cap. This blocks local save/time/score tampering; it is not a claim of complete bot detection or prevention of multiple anonymous accounts.

## Languages

117 UI strings per language, 8 stage names, 8 model names and 17 error messages are fully covered in English, Slovak, Czech, German, Spanish, French, Portuguese, Polish, Simplified Chinese and Japanese. All 249 ISO country/territory choices use localized region names. Selecting a country suggests a language; unsupported native languages use English. Players can override language independently. We do not claim to translate every world language.

## Hosting

The online game runs on Sites with a Worker and D1. GitHub Pages is a static entry point and retains the original local game at `classic.html`; it cannot host the server or an HttpOnly session for another origin. Old local saves remain on that original origin and cannot enter ranked mode. All ranked players start from the same state. No local saves are deleted.

## Development

`node scripts/build.mjs` builds a dependency-free Worker, embedded frontend and migration metadata. `node --test tests/world.test.mjs` runs engine, translations and real SQLite API tests. `node scripts/preview.mjs` starts http://127.0.0.1:4180 using an ignored local SQLite database. Preview cookies intentionally lack Secure on HTTP; production cookies require HTTPS. Do not expose the local preview server.

Production schema migrations are under `drizzle/`. Do not modify applied migrations. Publish the exact pushed source commit with the Sites packaging helper. `.openai/hosting.json` stores the Site ID and logical DB binding, never secrets.

## Dimensional visual update (v5)

CSS 3D cuboids create eight decorative printable objects and eight miniature stage buildings. Printer frames have rear, top and side surfaces, a recessed print bed and a filament reel. The workshop has perspective flooring, rim lighting and contact shadows. Desktop pointer tilt is limited to decorative cards, pauses when controls receive focus and is disabled on coarse pointers and reduced-motion devices. The same layout and action targets remain available on mobile. No gameplay state, scoring, auth or database schema changes are introduced. The geometry and styles are in `web/visuals.js` and `web/depth.css`.

## Modelled WebGL workshop (v6)

The main workshop is now a real Three.js/WebGL 2 scene loaded from authored binary glTF assets, not CSS geometry. `models/workshop-model.js` creates the room, furniture, bevelled printer frame, moving gantry/nozzle/spool, helper robot and eight printable mesh models. `node scripts/build-models.mjs` exports `room.glb`, `printer.glb`, `prints.glb` and a self-contained `workshop.glb` that players can download from the viewer. Meshes are merged by material and indexed to keep transfers and draw calls small. The room has PBR materials, environment fill, a warm shadow-casting key, cool fill, a tiled floor and physically modelled windows and furniture. The model files do not use external textures or third-party art assets.

The persistent canvas survives server updates and tab navigation. Orbit, zoom, reset and printer-focus controls support mouse, touch and keyboard; clicking a mesh selects its server-backed printer. Interaction is not interrupted by heartbeat updates. Print meshes grow and nozzle/spool motion follows production state. Pixel ratio and frame rate are bounded; offscreen or background viewers pause. Older devices without WebGL can continue with ordinary printer controls and see a translated fallback. All new controls and turbo messages have full ten-language coverage.

Turbo now supplies 2× production for 10 seconds. The server locks the next activation until 45 seconds after the previous activation (35 seconds after the boost ends). The overlap calculation is bounded by the actual boost interval and the offline cap, so relaunching the page, restoring a session or waiting offline cannot extend it. Prestige does not bypass the cooldown. Production progress shows actual remaining work; ETA accounts for both the active and future boost window. Controls show separate active and cooldown countdowns. Small action queues and request spacing prevent fast legitimate clicks from being silently dropped or colliding with heartbeats. New customer offers arrive automatically when a previous offer expires or is delivered.

Build dependencies are pinned in `package.json` and `pnpm-lock.yaml`; run `pnpm install` before building on a fresh checkout. The build bundles Three.js locally and embeds the GLBs in the Worker so the live game does not depend on a CDN. Three.js license is served at `/licenses/three.txt`. The Worker runtime remains self-contained. `node --test tests/*.test.mjs` includes real GLB parsing, model names/materials, translations, turbo boundary cases and session/recovery/ranking tests.

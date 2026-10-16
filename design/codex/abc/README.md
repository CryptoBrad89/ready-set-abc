# Lucy’s Sound Garden

A fresh Ready Set ABC game for ages 3–4. Open `index.html` from static hosting, or serve **this folder** on localhost. All URLs are relative; no build system, network API, login, microphone, browser speech synthesis, or third-party runtime is used. On first load from HTTPS or localhost, the PWA saves its available assets for offline play.

A child meets one letter, taps its name and sound, pairs its big and little forms, finds a sound picture, then recognizes the sound once more to plant a flower. Two choices keep the first adventures small; three appear after six unique letters. There are no timers, star deductions, or automatic screen advances. A wrong choice gets another try; after two misses, the answer gets a sunny outline. Repeat play keeps one flower per letter. The garden doubles as a sound replay collection.

The default order is the existing teacher room’s S A T P I M, followed by the other letters. All 26 letters work. C/K share /k/ and are excluded as each other’s sound distractors. X uses the final sound in **fox**, with a distinct spoken instruction. Approved vowels use their existing short-sound clips. The additional approved long-I clip is retained byte-for-byte but is not substituted for short I.

## What was retained

- All **53** approved letter MP3s and their checksum file, byte-identical.
- The complete **33-file Lucy reference lock**, including its original nested paths and checksum file. This folder is a production reference, never a game image source and never precached.
- The current game’s teacher-room views and helper functions verbatim, its local progress model, and its form behavior: PIN **2468**, change PIN, profiles, progress, CSV, letter locks/order, auto-unlock, effects/motion/audio settings, confirmed resets, five-minute inactivity lock, and locking when the page is hidden.
- Follow-device/light/dark behavior and a persistent header toggle. The teacher room’s existing World selector and labels remain; they choose the warm or moonlit garden palette.
- Existing Lucy / eleven_v4 word and coaching recordings, with hashes and provenance in `voice-manifest.json`.

This build uses a separate local-storage key (`ready-set-abc-sound-garden-v1`) so opening the new design does not modify the old game’s data. Device data stays local. CSV export is in Grown-ups → Progress.

## Artwork and delivery

The 26 picture cards, flower collection, layout, app icon, and play flow were created afresh using SVG/CSS/JS. Lucy has **no substitute dog illustration**. Until her new art is delivered, a clearly named Lucy paw badge occupies her scene. Speech causes a gentle bob; Reduce Motion always wins. All three requested Lucy scenes use entirely new poses and compositions. No archival reference image appears in play.

`needs/needs.json` requests **3 PNG images + 4 short MP3 voice lines**. Paths in that file are relative to `design/codex/abc/`. Use the listed references together for Lucy’s exact likeness. Generate every requested voice with **Lucy `FgiNpTIapnCbaD6xiqIo`, `eleven_v4`** and the exact listed text. Do not regenerate any existing clip.

Place each delivery at its requested path. The app automatically uses it; no wiring changes are necessary. The service worker already lists all seven future files. Grown-ups → Settings → Refresh offline files fetches deliveries on a previously installed device. A newly hosted deployment must be served again with connectivity to receive new assets before offline use.

`LIKENESS.md` contains the required visual review. Hash tests enforce the reference lock and reject any game asset identical to any reference file. A checksum cannot judge a newly generated face: human likeness review remains necessary.

## Verification

From the repository root:

```sh
python3 design/codex/abc/tests/run_tests.py
node design/codex/abc/tests/runtime_checks.cjs
python3 design/codex/abc/tests/run_tests.py --strict
```

Default tests allow only specifically declared undelivered needs. Strict mode requires every requested file, valid PNG deliveries, correct voice declarations, all paths, preserved source controls, and a complete precache. No dependencies beyond Python stdlib and Node built-ins. The runtime test uses the repository’s small DOM testing utility to exercise the real application event handlers across A–Z; it also executes the service worker in a cache/fetch simulator, including offline MP3 byte ranges, failed installs, cache repair, and isolation from neighboring worktrees.

After changing runtime code/assets, update the deterministic precache:

```sh
python3 design/codex/abc/tools/build_precache.py
```

Future delivery files are already optional cache members; adding them does not require rebuilding. Existing asset edits do. Art/icon source scripts are in `tools/` and require only Python stdlib.

### Current verification limits

The offline sandbox rejects local sockets and Chromium launch, so rendered screenshots, real-browser audio autoplay, PWA installation, and physical touch behavior could not be checked here. Before release on an actual tablet:

1. Check 390px portrait, 768px tablet portrait, and 1024px landscape in light and dark. Check large text, keyboard focus, and no horizontal page overflow.
2. Play the S, A, G, and X flows with sound; check the letter name/sound distinction and fox’s final sound. Replay audio rapidly, mute during speech, and navigate away mid-clip: voices must stop without overlap.
3. Load once over localhost/HTTPS, wait for “Offline garden ready,” disconnect, reload, and finish a new letter. Verify approved letter and word playback offline.
4. Verify PIN 2468, incorrect PIN, changed PIN, child switching, order/locks, CSV, reset confirmation, and return-from-background lock.
5. Fulfil needs, review Lucy against `LIKENESS.md`, refresh offline files, rerun `--strict`, and repeat offline play with delivered art/audio.

No commit or push was made.

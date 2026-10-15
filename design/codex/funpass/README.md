# Little Woof · approved fun pass

Open either playable folder directly; both work offline on `file://`:

- [Lucy’s Letter Post](v1-letter-post/index.html)
- [Lucy’s Moonboat](v3-moonboat/index.html)

Implemented the eight ideas for each variation from `ref/fun-pass-plan-2026-10-15.md`. The existing six-letter sound/picture loop and supplied teaching recordings remain the foundation. All authored changes and evidence are inside `/tmp/rsabc-funpass/out/`. No git commands, pushes, deployments, new dependencies, or `/workspace` access were used.

## What was added

| Idea | v1 · Letter Post | v3 · Moonboat |
| --- | --- | --- |
| 1 | A single **DELIVERED** stamp lands on the postcard, replacing the old confetti shower. | A world settles into a lit rim with six small rim stars; the label and picture remain clear. |
| 2 | The sound envelope’s triangular flap opens before the recorded name/phoneme, with a synthesized paper rustle. | A signal orbit changes color and settles before the recorded name/phoneme. |
| 3 | A six-slot stamp strip on home and celebration fills with a paw stamp, letter, and word. | A connected six-star constellation on home and celebration fills with explored letters and words. |
| 4 | Postmaster Lucy raises her paw, tilts in greeting/encouragement, and nods after delivery. | Captain Lucy salutes with her paw, gives a small visor glint and tilt, then nods after a world lights up. |
| 5 | A miss leaves a quiet dashed card edge. After two misses, a dotted route inside the correct card, solid outer outline, written clue, and recorded sound/word help the child. | A miss leaves a scanner-style dashed edge. After two misses, the correct card gets a beacon mark, solid outline, written clue, and recorded sound/word. |
| 6 | A brief opening-sign swing, followed by one finite idle wiggle. Lucy’s greeting runs between them, sequentially. | A small rocket arc introduces the map, followed by one finite star swell. Lucy’s greeting runs between them, sequentially. |
| 7 | Paper-textured, square-corner action buttons, a short paper press, and an ink-ring replay. | Orbit-bracket buttons, a short squish, and a signal-ring replay. |
| 8 | Browser-made rustle/flap, soft pom, and chime; theme scraps are Air mail stripes, Candy post seals, and Dark gold stars. | Browser-made boop, ping, and chord; theme weather is Dark stardust, Cloud day puffs, and Plum dusk aurora ribbons. |

## Safety and interaction

| Rule | Implementation and evidence |
| --- | --- |
| One main effect at a time | `fun.js` owns one finite WAAPI animation. Starting another effect cancels the old one; route changes cancel the channel. The inherited repeating CSS motion, simultaneous entrances, voice bobbing, waves, and confetti are disabled by `fun.css`. Per-frame QA measured **one** running animation maximum in each variation. |
| No flash, shake, timers, penalties, lost streaks, or locked letters | Feedback uses still borders/text and small, finite settling movements. No game countdown, auto-navigation timeout, repeating idle timer, score, streak, or lost collectible. All six letters remain available. A busy answer accepts one activation while its recorded word/feedback completes. |
| At most 12 decorative particles; navigation cleanup | Theme weather has six nodes. Moonboat’s reward has six fixed rim-star nodes, making **12 total** when weather is shown over that reward; Letter Post peaks at six. Theme nodes are removed on completion/cancellation; route replacement removes reward stars. Navigation and rapid theme changes were checked. Background textures and the collection’s permanent icons are artwork, not particle systems. |
| Idle pauses while hidden | The owned animation pauses on `visibilitychange`, resumes when visible, and uses no idle interval. Hidden-tab checks confirmed its clock stopped. Recorded voice and synthesized sources stop while hidden; abandoned routes cannot resume a stale sequence. |
| Reduced motion | Effects return their final state immediately without calling `animate()`. No decorative particles are created, including the reward rim stars. Changing the preference during an effect cancels it and removes particles. The open flap, lit rim, delivery stamp, hints, and collection remain usable as still states. QA found **zero animations and zero particles**. |
| Offline browser SFX; interaction unlock; mute; voice priority | WebAudio is created/resumed only on pointer or keyboard interaction. Oscillators and a locally generated noise buffer create the cues; there are no SFX downloads. Mute immediately stops all synthesized sources and recorded playback. Teaching voice stops/disconnects SFX before starting; SFX requests during voice are ignored. Instrumented real oscillator/noise starts found **zero starts while muted or during voice**, and zero SFX sources when recorded voice began. |
| Session collectibles; no mastery claims | Collections use an in-memory `Set`, reset on reload, and explicitly say “this visit.” Replaying a letter adds no duplicate. Only color theme is stored in localStorage; blocked storage has a visit-only fallback. |
| Lucy clear of choices | Lucy remains in the prompt/home/reward area, never in the answer grid. Her prompt portrait is hidden at narrow widths. Bounding-box checks found no overlap with choices at eleven sizes. |
| Native, accessible input and flexible layout | Native buttons/select; keyboard Enter/Space, arrow navigation, Escape, mouse, and touch. Focus and textual hint feedback remain available. Utility controls are at least **44px**; letter/picture targets are larger. Layouts reflow and scroll naturally in short windows, with no orientation blocker or zoom restriction. |
| Vanilla JS, offline, file://, file size | No package or runtime dependency added; all assets remain local. Actual QA and video capture used file URLs. No HTTP(S) requests or console/page errors were observed. Every file under `out/` is below **5,000,000 bytes**. |

## Captures and videos

Each folder’s `stills/` contains newly regenerated `home`, `listen`, `match`, and `celebrate` exact viewport PNGs at **1920×1080, 1366×768, 820×1180, 1180×820, 390×844, and 844×390**. Additional `*-fullpage.png` files show reachable content in scrolling layouts.

Also included per variation:

- `theme-0-home.png`, `theme-1-home.png`, `theme-2-home.png`: every theme.
- `hint-1366x768.png`, `hint-390x844.png`: two-miss helpful outline states (full-page captures).
- `collection-*` and `collection-full-*` at desktop and phone sizes: one earned discovery and all six session discoveries (full-page captures).
- `moment-open-1366x768.png`, `moment-reward-1366x768.png`, and `moment-weather-1366x768.png`: normal-motion final/open/reward compositions and in-flight theme decoration. Main screen matrix captures use reduced motion for stable, reproducible states.

Both new `motion.mp4` files use **Playwright recordVideo on file://**, converted with ffmpeg to **H.264, yuv420p, +faststart**. Letter Post is **16.00s / 582,597 bytes**; Moonboat is **15.97s / 453,086 bytes**. Each shows intro, letter selection, a miss, the second-miss hint, correct choice, celebration, collection, and theme switch. Playwright records silent viewport video; actual MP3 completion and WebAudio behavior were verified separately. Faststart was verified by checking that the MP4 `moov` box precedes `mdat`.

## QA results and reproduction

Reports and adapted prior QA scripts are in [`_qa/`](_qa/). Run commands from `/tmp/rsabc-funpass`; Playwright and ffmpeg were already installed. Scripts use a local `_qa/tmp` directory for owned browser temporary files and close their browser contexts; recording WebM intermediates are removed.

| Script / report | Result |
| --- | --- |
| `node out/_qa/verify.mjs` → `functional-report.json` | Both games: real recorded name then phoneme finish, helpful two-miss hint, all six letters completed by keyboard, arrows, voice cancellation on navigation, every theme reloads and completes play, blocked-storage fallback, no network/page errors. |
| `node out/_qa/fun-check.mjs` → `fun-report.json` | Reduced motion, actual WebAudio mute/voice priority, rapid replay cancellation, bursts of 12 miss/correct activations, collection deduplication/reset, particle cap, immediate navigation cleanup, finite hidden idle pause/resume, single animation channel, no console errors, Lucy clear of choices. |
| `node out/_qa/capture.mjs` → `layout-report.json` | **48 screen/viewport cases** across the required six sizes: zero horizontal overflow, zero undersized measured buttons, no page errors. |
| `node out/_qa/contrast.mjs` → `contrast-report.json` | **36 theme/state cases**, including hints and collected home states: zero computed text contrast failures (4.5:1 ordinary text / 3:1 large text). Artwork backgrounds were also visually inspected. |
| `node out/_qa/edge.mjs` → `edge-report.json` | **48 additional screen/size cases** at 280×480, 480×280, 320×568, 568×320, 1000×1000, 2560×1440: zero overflow or undersized buttons. Active rounds survive portrait → landscape → portrait changes. |
| `node out/_qa/moments.mjs` → `moments-report.json` | New moment captures and all-six-item collections in both worlds. |
| `node out/_qa/record.mjs` → `video-report.json` | Both videos satisfy duration, codec, pixel format, and size requirements. |
| `python3 out/_qa/sheets.py` / `video-sheets.py` | Desktop, portrait, all-theme, and video contact sheets for visual review. |
| `python3 out/_qa/finalize.py` → `final-report.json` | Consolidated passes; exact PNG dimensions, all output file sizes, video metadata, and actual MP4 faststart box order. |

Own stills and video contact sheets were inspected. Fixed during review: click-count filtering that suppressed valid fast touch taps; Moonboat stars crowding its reward label; a rotated decorative ring causing scroll overflow at 280px. The final narrow celebration was inspected again after correction.

No known remaining functional issue in the tested Chromium flows. Short screens intentionally scroll. Safari/Firefox, physical devices, screen-reader interaction, and child usability were not tested. Hidden-tab logic was checked using a controlled `document.hidden`/`visibilitychange` test. Original asset provenance and font notices remain in each folder’s `assets/`.

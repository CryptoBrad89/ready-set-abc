# Phase 2 mockups

Animated directions for Ready Set ABC, including Silk Thread plus C1–C4. Ages 3–4, landscape tablet first, phone as the second frame. These are review prototypes under `design/` only. Nothing in `app/` changes.

Open `design/index.html` from a static server (`python3 -m http.server` inside `design/`). Each prototype has a bottom bar for Home, the letter trail, Listen, celebration, and Grown-Ups. Add `?demo=1` to loop the screens. Add `?screen=listen&shot=1` to open one screen with the review bar hidden.

Lucy is the existing golden retriever photos in `design/assets/`. No new Lucy art. No new phonics audio. SATPIN is the letter set on every direction. Listen is three pictures (Sun, Apple, Sock), not three speakers.

## Rulebook

Written for a Pre-K tablet. Numbers are CSS pixels.

### Type

- **Hero letter or celebration word:** about 90–160px on a tablet, heavy or high-contrast, one or two words.
- **Play and Check:** 26–36px, heavy, inside a control at least 88px tall.
- **Lucy’s line:** 22–28px. One short sentence.
- **Settings and labels:** 18px minimum.
- **Tiny print** (job tickets, colophons): 12–14px, grown-up screens only, never the only instruction.

Directions pick their own faces. A uses Bricolage Grotesque and Fraunces. B uses Anton, Newsreader, and IBM Plex Mono. C uses Instrument Serif and Instrument Sans.

### Spacing

An 8px step, used loosely so the pictures can breathe.

- 8px between bulbs, beads, and inline chips
- 12–16px inside a card
- 24px between a sentence and the next control
- 32–48px between Lucy and the letter she is teaching
- Page padding about 7vw on a tablet and 16px on a phone

### Tap targets

- **Lesson controls** (Play, picture choices, trail letters, PIN keys): at least **88×88**.
- **Play on the tablet home:** 96px tall.
- **Header sound chips:** at least 64px tall and 88px wide on a tablet. On a phone they share one row and stay at least 52px tall.
- **Grown-Ups** is a real control, at least 64px, and it never dumps settings onto the play screen.

### Contrast pairs

| Pair | Ink | Ground | Where |
|---|---|---|---|
| Cream on night | `#f7f0e4` | `#120910` | Direction A panels |
| Cocoa on gold | `#24160f` | `#ffc857` | Direction A Play |
| Print black on stock | `#21201c` | `#f4edde` | Direction B body |
| Stock on print black | `#f4edde` | `#21201c` | Direction B Play |
| Ink on ivory card | `#1c1915` | `#fffaf3` | Direction C cards |
| Ivory on ink | `#f6f1e8` | `#1c1915` | Direction C Play |

State is never color alone. The current letter is also larger, or starred, or sitting on a solid field.

### Motion, including reduced motion

Motion is the default. `prefers-reduced-motion: reduce` is an opt-out: durations collapse, shader speed goes to 0, and confetti does not spawn. Everyone else gets the full loop.

Shared press feel, in `design/shared/engine.js`: pointer down squashes to `scale(0.9, 1.16)` in 80ms; release springs through `scale(1.08, 0.9)` back to rest in 460ms (`cubic-bezier(0.18, 1.55, 0.32, 1)`).

Screen changes cover the stage for 460ms, swap, then reveal. Entrances are held at opacity 0 while the cover is shut, so the pop plays as the new screen opens.

## Direction A — Midnight Marquee

**Why this one.** A dark puppet theatre. Velvet curtains, a chasing bulb marquee, Lucy hung on strings. It keeps the lesson loud and warm without using the current sunny-yellow comic chrome. Paper Shaders **NeuroNoise** is the stage wash (gold filaments on wine and near-black) and speeds up on the bow.

**Motion**

- Curtains sit open at the sides and slam shut, then open, on every screen change (460ms).
- A spotlight drifts across the stage on an 8s loop.
- Eighteen marquee bulbs chase, 70ms apart, 1.05s each.
- Lucy bobs and tilts forever (2.5s). On the bow she dips in, then returns to the bob.
- The hero S and SATPIN chips pop from a squashed blur, staggered by 50ms (`cubic-bezier(0.16, 1.45, 0.3, 1)`, 700ms).
- Play breathes with a squash pulse every 1.8s.
- The trail is a gold path. A disc runs it with SVG `animateMotion` in 3.6s, looping. The current letter pulses.
- Listen cards stagger in. The picked picture keeps a gold ring. Sun rays spin.
- Celebration: three stars pop in sequence, the trophy rises from below the stage with overshoot, gold confetti bursts (160 pieces) and keeps falling. NeuroNoise speed goes from 0.55 to 1.25.

## Direction B — Riso Drum

**Why this one.** A two-ink print shop, from the retro-print taste: warm stock `#f4edde`, riso red `#e4572e`, riso blue `#355e8c`, crop marks, a rubber stamp, halftone dots. The giant S is misregistered on purpose. Lucy’s photo is the existing picture, grayscale, inside a hard ink offset. Paper Shaders **SimplexNoise** moves red and blue under a paper scrim.

**Motion**

- Screen changes are an ink bar that scales across the viewport in 460ms, then pulls back.
- Halftone dots drift 44px over 7s.
- The red plate of the giant S keeps sliding (1.8s loop). The letter itself slams in from a flat squash.
- Lucy’s frame and the “Pull” stamp wobble a few degrees forever.
- The trail is six letterpress blocks. An ink roller travels the width of the screen, spinning, in 3.2s, and loops. On a phone the roller hides and the blocks reflow to two rows of three so each stays at least 88px.
- Listen cards are fanned and overlapping. Picking one snaps it forward and onto the red field.
- Celebration slams a huge YES with red and blue offsets, drops the trophy the same way, and throws red and blue confetti. Simplex speed goes from 0.5 to 1.3.

## Direction C — Silk Thread

**Why this one.** A quiet room that is still alive. Instrument Serif at a huge size, copper and sage, lots of air. This is the Paper Shaders **MeshGradient** direction: ivory, peach, sage, gold, and copper, distortion 0.9, swirl 0.48, speed 0.8 the whole time. Not a purple gradient. Dust motes rise through the mesh. Lucy floats, and her shadow shrinks when she lifts.

**Motion**

- Screen changes are an iris of ink that opens from the center (500ms).
- “Hello, letter S.” rises as separate words with a blur, 100ms apart (the text-stagger idea, drawn in CSS).
- Play wears a rotating conic beam, 2.6s per turn.
- Lucy’s oval floats 16px and tilts on a 3.4s loop. The shadow scales the other way.
- The trail is a hairline path. A copper bead travels it in 4s, looping. The current pearl is larger and sage, and floats on its own.
- Picture plates stagger up. The picked plate lifts 8px.
- Celebration reveals the word Star, spins the trophy up, and switches the mesh to speed 1.55 while peach and sage confetti falls. Motes never stop.

## What was redrawn, not imported

| Idea | Where it lives |
|---|---|
| Paper Shaders NeuroNoise, SimplexNoise, MeshGradient | `design/vendor/paper-shaders` (Apache-2.0) and `design/shared/paper-mount.js` |
| Blur-rise type, squash/stretch, veil transitions, confetti, trophy reveal | `design/shared/engine.js` and each direction’s CSS |
| Bulb chase, curtain wipe, ink misregistration, border beam, path travel | Each direction’s CSS and SVG |

No React. No vendored UI kits. `prefers-reduced-motion` only opts out.

## Stills and clips

PNGs and MP4s are written to the project store, not into `app/`:

`/cursor/stores/bc-69cca2ee-086d-4958-861f-572ca096de17/media/phase2-design/`

- `direction-{a|b|c|c1|c2|c3|c4}-{home|trail|listen|celebration|grown-ups}-{1180x820|390x844}.png`
- matching `direction-*-motion.mp4` clips, about 17s, from `?demo=1`

Regenerate one set with `DIRECTIONS=c1,c2,c3,c4 node design/scripts/capture.mjs`.

## C1 — Ink Room

**Why.** Silk Thread’s room, float, iris, and mesh stay. The look is the in-repo comic skin (`app/css/skins.css`, `UX-FROM-STITCH.md`): ink `#111`, yellow `#ffe600`, blue `#3b82f6`, red `#ef4444`, thick outlines, halftone, a speech balloon, and a POW sticker. Bangers plus Nunito. Plate notes: `design/direction-c1/README.md`.

**Motion.** Everything in C, plus letter trickle, a wobbling POW sticker, halftone drift (7s), a drifting primary-dot canvas, a 700ms POW / TAP / YES burst on press, and mesh speed 1.05 (1.85 on the bow). Iris wipe unchanged.

## C2 — Pop Press

**Why.** Same Silk Thread skeleton as C, not the Stitch page chrome. A second comic: Anton, cyan `#00b4d8` / magenta `#e91e8c` / yellow `#ffe14a`, a spinning starburst, misregistered type, cloud balloon, BOOM / ZAP / WOW. Distinct from C1’s primary ink. Plate notes: `design/direction-c2/README.md`.

**Motion.** Letter trickle, starburst spin (9s), magenta halftone drift, CMYK canvas dots, border beam on Play, 650ms bursts, mesh speed 1.1 (1.9 on celebration). Iris wipe unchanged.

## C3 — Puddle Room

**Why.** Same Silk Thread skeleton, no comic ink. The room is a shallow pool: Fredoka type, sky-and-sand mesh, rings that expand and fade. Letters and pictures are round. For a 3- or 4-year-old it should feel like jumping in, not like a poster. Plate notes: `design/direction-c3/README.md`.

**Motion.** Lucy’s float adds a squash at the top of each hop (about 22px). SATPIN beads hop in a wave, 120ms apart. Three ripple rings loop every 3.2s. Letters trickle in. A warm spotlight drifts. Bubbles rise on a canvas. The trail stroke marches. Mesh speed is 1.05, and 1.8 when the stars come out. Iris wipe unchanged.

## C4 — Lantern Room

**Why.** Same skeleton again, and not a cousin of the puddle. Comfortaa letters, honey mesh, paper lanterns rising. Lucy wears a warm halo. Beads hang like little lamps. No panels, no halftone, no speech-balloon tail. Plate notes: `design/direction-c4/README.md`.

**Motion.** Lucy travels a small loop (side to side and up) over 3.4s instead of a straight bob. Letters trickle in with a small tilt. Trail pearls bobble 14px, staggered. Five lanterns climb the screen on a 7s sway. A soft sheen crosses the headline. Firefly dots rise on a canvas. Mesh speed 0.9, 1.6 on celebration. Iris wipe unchanged.

## Left for Bradley

A, B, and C are unchanged. C1 and C2 are the comic blends. C3 and C4 are the soft kid rooms. The live app is untouched.

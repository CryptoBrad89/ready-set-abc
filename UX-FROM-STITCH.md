# Ready Set ABC — UI/UX from Stitch (source of truth)

**Status:** Bradley 2026-09-07 — Stitch options/details are the look & feel target (not moodboard-only).  
**Sources:** `stitch/.../ready_set_abc/DESIGN.md`, `design.md` (GAME-FLOW), screens `ready_set_abc_home_screen`, `step_a_*`, `step_b_*`, `step_c_*`, cleanshot celebration.

---

## Visual system (lock this)

| Token | Value |
|-------|--------|
| Background | warm cream `#fff8f5` / `#FFFDF5` — never sterile white playfield |
| Primary CTA | Sunny Yellow `#FFB800` with pressed lip `#D99B00` |
| Active / select | Sky Blue `#29B6F6` ring + tint |
| Success | Mint Green `#26C281` |
| Accent / miss | Coral `#FF5252` (soft wobble, not punish) |
| Text | Warm cocoa `#251911` / `#4A3B32` — not pure black |
| Type | **Comfortaa** (letters/titles) + **Nunito Sans** (instructions) |
| Letters | Single-storey **a** / **g** |
| Depth | Extruded pillow cards: 6–8px bottom lip; press = translateY + lip collapse |
| Targets | ≥88px kid; ~140px tablet cards; ~220px whiteboard |
| Shape | Hyper-round squircles / pills — no sharp corners |
| Logo | Yellow paw circle + "Ready Set ABC" / "Pre-K Phonics with Lucy" |

Lucy: golden retriever, real name, **talks + moves**. Glasses when teaching, bows when celebrating. Never harness. Photoreal-still silent Lucy = fail.

Audio chrome on every play screen: independent **Music / SFX / Voice** toggles (header cluster). Grown-Ups entry is low-contrast slate, lock icon.

---

## Interaction chrome (from screens — keep)

### Home
- Giant primary **"PLAY! TAP TO START SOUND"** (audio unlocks on this tap)
- Lucy greeting bubble + say/woof affordances
- Round preview strip (Letter A Ready / B Current / C Next) with stars
- Tabs shown in Stitch: **Play Cards · ABC Trail · Star Pouch**
- Grown-Ups gate (math or long-press) — not dumped settings on kid home

### Case match (Step A)
- Explicit two-step chrome: **① Tap little letter → ② Tap Big A**
- Prompt card = big letter + **"Tap to Match!"**
- Choice cards: letter + optional word cue + phoneme chip `(/æ/)`
- Selected = blue ring + Selected badge; Lucy coaches ("You picked little a…")
- Hint + primary **Match** CTA after selection
- Instruction: "Find the little/big letter"

### Picture match (Step B)
- Prompt is **Aa** together; CTA **"TAP HERE TO CHECK MATCH!"**
- Picture cards with word (showWords) — leading letter highlighted
- Same two-tap: select picture → tap Aa to submit
- Lucy asks for the sound: "What starts with the /æ/ sound?"

### Celebrate (Step C)
- 1–3 stars ("PERFECT MATCH! 3 OF 3")
- Trophy / "Aa is for Apple" + Hear Again
- Play again / Next letter
- Round progress A★ → B → C
- Cleanshot art direction: festive room, bows on Lucy, balloons, "C IS FOR CELEBRATE!" — use for celebration juice

### Bonus (Step B½ — PASS C4, not a Stitch screen)
- Rotates by letter: **Letter Hunt** (A, D) · **Sound Sort** (B) · **ABC Order** (C)
- Single tap — there is no prompt to match, so no second tap
- Bonus misses never cost a star; "Skip to stars" appears after 2 misses / 20s
- Chrome reused from Step A/B: pillow tiles, `--target-min` taps, Lucy teaching card, sunny bonus badge

### Celebrate cap (PASS C4)
- Party settles itself at **8s** (`CELEBRATE_MS`); Skip / background tap / Esc settles it sooner
- Sticker drop card + Lucy's closet unlock ("Put it on Lucy") sit under the trophy

### Mechanics behind the chrome (from GAME-FLOW — keep)
- Two-tap true match (choice then prompt) — non-negotiable
- Per letter: case → picture → celebrate; round default 3 letters
- Phoneme ≠ letter name; board-appear says name; choice tap says sound/word
- Stars 3/2/1 from misses+hint; device-local
- No drag; ≥88px; offline after load

---

## Conflicts with earlier classroom PLAN (need Bradley calls)

| Topic | Stitch UI | Earlier classroom plan | Proposal |
|-------|-----------|------------------------|----------|
| Kid shell | Play Cards / ABC Trail / Star Pouch + giant Play | Face pick-me → Home → A–Z map board | **Adopt Stitch chrome**; map/trail = ABC Trail screen; face roster can live under Grown-Ups / device start if still needed for class |
| Round | 3-letter round, continue ABC cursor | A–D map slice, per-letter center end card | **Adopt Stitch round** (size teacher-settable); A–D = first content pack, not a different loop |
| Match | Two-tap | Implied single-tap in phase-1 stub | **Two-tap** as in Stitch |
| Bonus activity | Not in Stitch flow | "one bonus" in first-slice locks | ~~Defer bonus~~ → **Bradley call (PASS C4): the bonus ships as the third step**, built out of Stitch parts (pillow tiles, sunny badge, Lucy card) so it reads as the same app. Grown-Ups → Play can pin one game or switch it off. |
| Teacher | Grown-Ups settings (round size, choices, mutes, progress) | Full suite day one: class grid, CSV, print, pin letter | **Keep Stitch Grown-Ups look**; add classroom roster/CSV as Grown-Ups tabs without dumping on kid home |
| Closet / stickers | Star Pouch | Lucy closet + stickers | **Star Pouch = reward home**; Lucy accessories live there — **shipped C4**: 6 star-gated treats, tap to wear, Lucy really wears it (`data-wear`) |
| Gate | Math challenge and/or long-press | PIN 1234 | Prefer Stitch gate patterns; PIN ok as alternate |

---

### Visual polish (PASS C5 — closed against the Stitch screens)

| Gap found | Fixed to |
|-----------|----------|
| Header tabs + Grown-Ups chip at 16–20px radius | Stitch `rounded-xl` (`--r-xl`) — reads as a pill, no squarish chrome |
| Base body type at the browser default 16px | Stitch `body-md` 18px/600 Nunito (clamped for short Chromebooks) |
| Step A anchor was flat white | Soft sky-tint radial wash behind the glyph (Stitch step_a); Step B's `Aa` pair card stays clean white |
| `Selected` badge in bright `--sky-blue` | `--secondary` deep sky, so it stays legible on the sky-tint card face; the picked word turns sky ink with the glyph |
| Step B sandbox headed with small Nunito | "Pick the Sound Partner" as a real Comfortaa title + card icon |
| Picture wells always white | Peach plate on idle white cards, white on the selected sky card — the well always contrasts its face |
| Raw hexes/rgba outside the freeze (`#fff1ea`, `#c6e7ff`, `#81cfff`, `#001e2d`, `#FFD9D9`, mint rgba) | Tokens; `--secondary-fixed`, `--secondary-fixed-dim`, `--on-secondary-fixed` added to `tokens.css` from `DESIGN.md` |

Shell pin bumped to `rsabc-shell-v16-stitch-polish` (sw.js + version.js + README).

## Phase 1 skeleton gap

Current `/app` is wireframe (emoji faces, flat map). Next visual pass should restyle to Stitch tokens + rebuild play screens to match Step A/B/C chrome **before** more content pipeline. Do not keep building the flat skeleton aesthetic.

---

## Next (after Bradley confirms conflicts)
1. Freeze design tokens CSS from `ready_set_abc/DESIGN.md`
2. Restyle shell to Stitch home + tabs
3. Implement two-tap case/picture/celebrate for letter A matching Step A/B/C
4. Grown-Ups panel from Stitch settings list + classroom extras as secondary tabs

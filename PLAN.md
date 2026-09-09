# Ready Set ABC — Opinionated Plan (first slice)

**Status:** research done · plan for Bradley / Brandy review · **no build until go**  
**Sources:** `/workspace/ready-set-abc/research/01`–`05` (Duolingo ABC, Khan Kids, peers)  
**Date:** 2026-09-07

---

## TLDR

Competitors are **home apps** with one kid per device and no "everyone do C today." Our wedge is classroom reality: roster of ~25 faces, pin today's letter, center end-card, whiteboard mode, offline PWA, Lucy as the voice.

**Build the A–D content + full teacher suite + kid shell in one shippable classroom slice.** Do not build a serpentine path, kid avatar store, or cloud accounts.

---

## Research steal / avoid (compressed)

**Steal**
- ≤15s to first activity; spoken-only prompts; tap Lucy = replay
- Un-failable trials (no hearts/timers/scores for kids); short skippable celebrate
- Collect durable stickers / dress-ups — not currency shops (Khan / monster > ABCmouse tickets)
- Teacher gate + roster as root object; printables that teachers keep opening
- Offline as an explicit adult "Set up this device" action with progress bar

**Avoid**
- Phonics path / adaptive sequencing that steals teacher control (we're locked A–Z for wall/chart fit)
- Bottom tab bars, scrolling kid lists, small targets, drag-first whiteboard UX
- Streaks, leaderboards, cross-kid comparison
- Accounts / email / COPPA invite flows for v1 (one class, PIN only)
- Hard-locking unpinned letters (stuck kid with no adult free)

**Wedges nobody owns well**
1. 20–25 kids on a few shared tablets (face grid + auto sign-out + reassign last session)
2. Teacher pins today's letter
3. Offline-first vanilla PWA on cart Chromebooks / iPads

Full notes: `research/01`–`04`.

---

## First-slice product (locked + my calls)

### Kid shell
`Pick-me (face grid) → Home → Map (A–Z board) → Letter round → Celebrate → Sticker → End card`

- Landscape only; **no scrolling** in kid shell; min target ~88px (~140px whiteboard)
- **Map = illustrated A–Z board**, all 26 tiles visible; A–D awake, E–Z asleep (Lucy snoozing) — not a Duolingo road
- Modes (teacher sets, not kid): **Center** (tracked, hard end card) · **Small group** (turn-taking language) · **Whiteboard** (16:9, tap-only, no tracking)
- Closet outfits **Lucy** (collar/hat/bandana…), not a kid avatar
- One sticker (+ closet piece; shiny sticker on harder second pass) per completed letter round — no store

### Round shape (A–D)
`Meet letter (~20s) → Case match (4–5) → Picture match (4–5) → Bonus (rotating) → Celebrate (≤8s, skippable)`  
Target **6–8 min** = one center rotation. Hold-to-hear letter sound while touching (Endless Alphabet trick).

### Teacher suite (day one, even with A–D only)
1. Pin today's letter  
2. Class grid (played today, letters, stuck flags)  
3. Kid detail (per letter × case/picture + notes + reassign last session)  
4. CSV export  
5. Print (certificate, small-group sheet, roster cards)  
6. Device (mode, Lucy voice A/B, cache health, Get update)

PIN gate via long-press logo → 4-digit PIN (no birth-year math).

### Tech
Vanilla HTML/CSS/JS PWA; precache full A–D bundle; pinned content version; updates only on teacher tap. IndexedDB per device — **merge via export/import JSON** with visible "last merged" (biggest architecture risk; decide before build).

### Lucy / art
- Pre-recorded clips only (~55–70 for A–D); two voices, **class-level** pick for Brandy  
- Film Lucy for celebrate/end-card only; AI-art Lucy for UI chrome (don't mix in one frame)  
- Style: warm classroom sunshine, readable shapes at whiteboard distance; Stitch zip = **moodboard only**

---

## Style direction (recommended)

Ignore Stitch layouts. Keep mood: soft sky/grass, big Lucy, chunky letter tiles.

| Axis | Call |
|------|------|
| Kid chrome | No bottom nav — Lucy doghouse (home) + closet only |
| Type on kid screens | Almost none; adults read teacher suite |
| Motion | Snappy feedback <100ms; celebrate short |
| Color | High contrast letter tiles; muted asleep E–Z |
| Whiteboard | Same activities, bigger hit areas, no drag |

---

## Challenge the draft (open for Brandy/Bradley)

1. **Serpentine / path map → A–Z board** (strong recommendation)  
2. **Kid avatar customization → Lucy's closet**  
3. **Per-kid voice → one class voice setting**  
4. **Any bottom tab bar / browse library in kid shell → cut**  
5. **Hard lock on non-pinned letters → dim only**  
6. **Multi-device data** — must pick merge story before coding (export/import vs single teacher device of truth)  
7. A–Z is classroom fit, not reading science — activities stay recognition/initial-sound so order still works  

---

## Build phases (after plan go — not starting yet)

| Phase | What | Exit |
|-------|------|------|
| **0 · Plan go** | Bradley filter + Brandy on style/voice/map/closet | Written yes |
| **1 · Skeleton** | PWA shell, PIN, face grid stub, offline precache stub, landscape layout system | Loads offline on a cart Chromebook |
| **2 · Letter A pipeline** | Art plate → letter JSON → case + picture + one bonus + celebrate + Lucy clips (both voices sample) | Playable A end-to-end |
| **3 · Teacher suite** | Pin letter, class grid, kid detail, CSV, print, device/cache | Brandy can run a fake roster |
| **4 · Modes** | Center end card, small-group prompts, whiteboard render mode | All three modes on A |
| **5 · B–D content** | Same pipeline × 3; sticker/closet rewards density | A–D complete |
| **6 · Classroom harden** | Real cart Wi-Fi-off test, iPad A2HS, merge flow, reassign session | Brandy pilot week |

**Sibling bots:** default **no** until build go. If build starts, consider one thin **asset-pipeline** sibling (art/VO batch only) — not before.

---

## Ask of Bradley

1. Approve plan direction (esp. A–Z board, Lucy closet, PIN teacher gate, device merge via export/import)  
2. Flag anything Brandy will hate  
3. When ready: **go on build** (phase 1) — or send back challenges  

No hard deadline — doing it right.

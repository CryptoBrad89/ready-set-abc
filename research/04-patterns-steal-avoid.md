# 04 — Cross-app patterns: Steal / Avoid / Adapt

Patterns that recur across Duolingo ABC, Khan Academy Kids, Starfall, Endless Alphabet, ABCmouse, and Teach Your Monster — sorted against Ready Set ABC's locks. Confidence tags carried over from `01`–`03`.

## Cross-app patterns (what the category has converged on)

1. **Spoken-only instruction.** Every credible Pre-K app assumes zero reading. Text on kid screens exists for adults. **[H]**
2. **A persistent "say it again" affordance.** Duolingo ABC and Khan Kids both let a child re-trigger the prompt. Non-negotiable in a noisy classroom. **[H]**
3. **Un-failable interactions.** No timers, no lives, no visible score for this age. Endless Alphabet is the extreme; even Duolingo dropped hearts for ABC. **[H]**
4. **Short bounded units.** 2–5 minutes per activity, everywhere. **[H]**
5. **Collect-and-customize beats currency.** Khan Kids and Teach Your Monster reward with durable artifacts; ABCmouse's store is the outlier and the one that eats session time. **[M]**
6. **One mascot carries the voice.** Kodi, the monster, the Duolingo cast. The mascot asks, praises, and narrates — it doesn't grade.
7. **Adults are gated, not absent.** A birth-year/hold gate separates kid and adult surfaces. **[H]**
8. **Sequencing belongs to the app, not the teacher.** Universal — and universally wrong for a Pre-K center. This is our wedge.
9. **Nobody ships offline-first web.** Native apps download content; web apps assume connectivity. Both primaries — Duolingo ABC and Khan Kids — are app-store-only, so neither covers Brandy's iPad + Chromebook + whiteboard mix from one link; Starfall covers all three but only online. An offline PWA is the only thing that does both, and it is genuinely differentiated. **[M]**
10. **Identity models assume one kid per device.** Nobody solves 25 kids / 5 tablets well. Second wedge.

---

## Against our locks

### Lock: classroom-only, one teacher, 20–25 kids, no sharing in v1
- **Steal:** teacher-gated adult area (long-press logo + 4-digit PIN — no birth-year math, Brandy will do this ten times a day). Roster as the root object, like ABCmouse Classroom / Khan teacher mode.
- **Avoid:** accounts, emails, passwords, cloud sync, COPPA-flavored consent flows, and any "invite another teacher" surface. One class, seeded by Brandy pasting 25 names. No auth beyond the PIN.
- **Adapt:** identity = a **single-screen grid of ~25 face tiles**, landscape, no scrolling, no typing. Kid taps their face, plays, and the round auto-signs-out at the end card. Wrong-kid taps *will* happen — give the teacher a "reassign last session" control in kid detail rather than pretending it won't.

### Lock: straight A–Z
- **Steal:** Starfall's flat A–Z grid as the primary navigation. It is the only IA in the category that lets a teacher say "go tap C" and be obeyed.
- **Avoid:** Duolingo/Teach Your Monster's serpentine path. A winding path *implies* gating and linear progress; with 26 letters it also means scrolling, which we've banned in the kid shell.
- **Adapt:** the locked "map" should be a **map-styled A–Z board, not a road** — 26 illustrated tiles in a fixed grid over a scene, all visible at once, A–D awake and E–Z asleep (dimmed, snoozing Lucy, tappable for a "not yet!" wag). This honors the map lock, keeps A–Z addressable, and makes the A–D slice legible instead of looking broken. Teacher setting: pin today's letter → non-pinned tiles dim further but stay tappable (never hard-lock a kid out mid-center; a locked screen with no teacher nearby is a stuck kid).

### Lock: centers (1 kid) + small group (shared device) + teacher-led whiteboard
- **Steal:** Starfall's "works on the whiteboard from a browser" simplicity. Lingokids' named finite playlist so a session visibly ends.
- **Avoid:** Khan Kids' open library and ABCmouse's zones — any browse surface turns a 10-minute center into eight minutes of video. Also avoid unbounded paths with no stopping point.
- **Adapt:** three **modes off one content set**, chosen by the teacher, not the kid:
  - *Center* — one kid, tracked, ends with a hard "Your turn's done — go get a friend!" card.
  - *Small group* — same round, tracked to a group tile, prompts phrased "whose turn is it?", turn-taking beat between trials.
  - *Whiteboard* — landscape 16:9, ~2× target sizes, **tap-only (no drag — drag on IR/optical whiteboards is unreliable)**, no tracking, no data written, no end card; teacher drives with a big Next. Building whiteboard as a *rendering mode* of the same activities, not separate content, is the whole trick.

### Lock: full teacher suite day one
- **Steal:** rosters + progress reports (ABCmouse Classroom, Khan teacher mode); printables as a real feature (Starfall); printable identity cards (Teach Your Monster).
- **Avoid:** "assign a lesson to a student" as the primitive — too slow, wrong granularity for Pre-K. Avoid dashboards that show engagement metrics (minutes, streaks) instead of skill evidence.
- **Adapt:** the primitives Brandy actually needs, in order: **(1) pin today's letter for the class · (2) class grid — who played, which letters, where they're stuck · (3) kid detail — per-letter, per-skill (case vs picture) trial counts + a notes field · (4) CSV export · (5) print (certificate, small-group planning sheet, roster cards).** Build all five for A–D; they scale to Z for free.

### Lock: vanilla HTML/CSS/JS PWA, offline after first load
- **Steal:** Khan Kids' explicit, visible content download — offline as a *feature the adult performs*, with a progress bar and an MB count.
- **Avoid:** lazy/opportunistic caching, auto-updating service workers, and anything that shows a spinner that can't resolve. A silent cache miss mid-center looks like a broken app to a 4-year-old.
- **Adapt:** a teacher **"Set up this device"** screen that precaches the entire A–D bundle up front, pins a content version, and only updates when the teacher taps "Get update." Audio is the budget (target the full A–D voice set well under ~20 MB; use AAC/m4a for iOS Safari compatibility **[M]**). Unlock the audio context on the first user tap (iOS requires a gesture **[H]**) — the "tap Lucy to start" moment on the pick-me screen does this for free. Assume Safari can evict storage: the teacher device screen should show cache health and a one-tap re-cache. **[M]**

### Lock: A–D content slice, full shell
- **Steal:** Starfall's per-letter bounded visit — with only four letters, replay value must come from *variation within a letter*, not from more letters.
- **Avoid:** shipping a shell that visibly advertises 22 broken doors, and avoid padding A–D with filler mechanics that won't survive to Z.
- **Adapt:** every A–D letter needs 2–3 rotations of picture sets and distractors so the fifth visit isn't identical to the first; the bonus slot should rotate across a small set of mechanics (trace / find-the-letter / initial-sound sort) so novelty is structural. E–Z tiles are "asleep," framed as coming, not missing. Prove the pipeline — art plate → Lucy clips → letter JSON → live tile — on A, then B–D should be content work, not engineering.

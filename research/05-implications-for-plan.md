# 05 — Implications for the build plan

Opinionated recommendations drawn from `01`–`04`. Written to be argued with. The Stitch export is treated as a **moodboard only** — color, character feel, art direction. Its screen layouts are not a spec, and several category defaults it likely inherits (bottom tab bars, small icon buttons, text labels, scrolling lists, progress bars) are wrong for 3-year-olds on a shared classroom tablet and should be dropped.

## 1. Information architecture

**Two apps, one PWA, one PIN between them.**

- **Kid shell:** Pick-me → Home → Map → Letter round → Celebrate → End card. That's it. No settings, no back-to-parents, no browse.
- **Teacher suite:** long-press the logo → 4-digit PIN → Class grid / Kid detail / Content (pin today's letter) / Device (cache, audio, mode) / Export.

**Rules I'd hold hard:**
- **Landscape only, no scrolling anywhere in the kid shell.** Every kid screen fits 1024×768 and 1366×768 without scroll. Scrolling is how 3-year-olds get lost.
- **Minimum touch target 88px** (kid shell), 140px in whiteboard mode. Nothing important within 40px of a screen edge (palm rejection, iPad home indicator).
- **Three taps maximum** from device wake to first trial: face → Play → letter.
- **Make the map a board, not a road.** 26 tiles visible at once in a fixed grid over an illustrated scene; A–D awake, E–Z asleep with Lucy curled up on them. Honors the map lock, keeps every letter directly addressable for "go tap C," and never scrolls. A serpentine path is the wrong metaphor for A–Z — it implies gating we don't want and requires scroll we can't afford.
- **No bottom nav bar in the kid shell.** One home affordance (Lucy's doghouse, top-left) and one closet/sticker affordance. Two, total.

## 2. Activity design

**Round shape (locked activities, my proposed pacing):**
`Meet the letter (~20s) → Case match (4–5 trials) → Picture match (4–5 trials) → Bonus (rotating, ~60–90s) → Celebrate (≤8s) → Sticker → End card.` Target **6–8 minutes**, which is one center rotation. Instrument it and tune; if median round exceeds 9 minutes, cut trials, not activities.

- **Tap is the default verb.** Drag only where a generous snap radius makes it un-failable, and never in whiteboard mode. Chromebook trackpads and IR whiteboards both make drag miserable; 3-year-old fine motor makes it worse.
- **Un-failable, but honest.** Wrong tap → the wrong option gently shakes and returns, Lucy says a *nudge* line (never "no"), nothing is lost. After two wrong attempts on the same trial, the correct answer pulses. **Log every attempt anyway** — that error data is the whole value of the teacher suite, even though the child never sees a score.
- **Steal Endless Alphabet's best trick:** while a letter is touched/held, it says its sound, repeatedly, in Lucy's voice. One extra clip per letter, enormous instructional payoff.
- **Distractors are curriculum.** Case match: uppercase target, 3 lowercase options (2 for the very first A trial), distractors chosen for confusability (b/d, p/q) once basics land. Picture match: distractors must differ in *initial sound*, not just look different — and no picture whose name is ambiguous to a 3-year-old (no "bunny/rabbit" collisions).
- **Bonus rotates** across trace / find-the-letter-in-a-scene / initial-sound sort, so a fifth visit to A isn't the fourth visit to A. Tracing must be un-scored: follow the dot, any path completes.
- **Latency budget:** visible feedback <100 ms from touch; audio start <150 ms (preload and decode all round audio before the first trial); celebration ≤8 s and skippable by tap. Slow celebration is the #1 way to lose a 3-year-old.

## 3. Reward loop

- **One sticker per completed letter round**, awarded automatically and flown into the sticker book. Never a store, never a currency, never something to spend. ABCmouse's ticket economy motivates *and* eats the center — we get the motivation without the tax.
- **Dress Lucy, not the kid.** The closet should outfit **Lucy** — collar, hat, bandana, bow, sunglasses. Reasons: it concentrates all art on one beloved character (cheaper AI-art pipeline, one style plate), it dodges the body/appearance politics of a kid avatar, and it strengthens the mascot relationship that carries the whole VO. If a kid-identity need appears, meet it on the pick-me tile (photo/color), not in the closet.
- **Reward density for a 4-letter slice:** 4 letter stickers is too thin. Give each letter a sticker *plus* one closet piece, plus a "shiny" version of the sticker for a second, harder pass (more trials, confusable distractors). That's ~12 earnable things across A–D — enough for two weeks of centers.
- **No streaks, no daily goals, no leaderboards, no cross-kid comparison.** Duolingo — of all companies — declined to put streaks in front of preschoolers. Follow them.
- **Optional and strong:** a class-level sticker wall for the whiteboard, so the collective is celebrated without ranking individuals.

## 4. Teacher tools (build all of it for A–D)

Priority order:
1. **Pin today's letter** — one tap, class-wide. This is the feature no competitor has and the reason Brandy keeps using it.
2. **Class grid** — 25 tiles: played today (y/n), letters attempted, per-letter accuracy dot, and a "needs small group" flag auto-raised when accuracy on a skill stays under threshold across two rounds.
3. **Kid detail** — per letter × per skill (case vs picture) attempt/first-try-correct counts, last played, plus a free-text notes field. Notes are what a teacher actually uses at conference time.
4. **CSV export** — one row per kid × letter × skill. Plain and boring; it will be opened in Google Sheets.
5. **Print** — letter certificate ("Marcus mastered C"), a small-group planning sheet (kids grouped by shared weak letter), and roster/face cards. Starfall's teachers stay for the printables.
6. **Device controls** — mode (center / small group / whiteboard), Lucy voice, volume/headphone reminder, cache status, reassign-last-session.

**Data honesty:** with no server, each device holds its own records in IndexedDB. Two tablets = two partial pictures. Decide now: either (a) teacher exports/imports JSON per device and the suite merges on import, or (b) one designated "teacher device" is the record of truth and kid devices export to it. I'd ship (a) with a visible "last merged" timestamp on the class grid. Do not let this stay implicit — it is the plan's biggest architectural risk, and a teacher discovering half her data is on the other iPad in November is the failure mode that kills the product.

## 5. Lucy

- **Lucy narrates, asks, and cheers — she never judges.** Praise is for effort and completion; wrong answers get a nudge from Lucy, not a verdict.
- **Lucy is the replay button.** Tap Lucy anywhere = repeat the current instruction. This single affordance solves non-readers, noisy rooms, and kids joining mid-round.
- **Pre-recorded clips only, no TTS.** Rough A–D inventory: 3 greetings, 1 letter-name + 1 letter-sound + 1 hold-to-hear-sound clip per letter, 2 prompts per activity, 6 praise variants, 4 nudge variants, 4 celebrate variants, 3 idles, 2 end-card lines ≈ **55–70 clips**. Anti-repetition: never play the same praise clip twice in one round.
- **Two voices = one teacher setting, one default per class** — not a per-kid choice. Record the same script twice; make the A-letter set in both voices first so Brandy can decide from real material in week one, before the full VO spend.
- **Animated real Lucy** (film clips) should be reserved for celebrate and end-card moments; AI-art Lucy carries the everyday UI. Mixing them in the same frame will look wrong — keep them in separate moments.

## 6. Offline UX

- **"Set up this device"** is a teacher screen with a real progress bar, MB count, and a green "Ready to play offline" state. Precache the whole A–D bundle; no lazy caching.
- **Pin the content version.** Show it in teacher settings. Updates only on an explicit "Get update" tap, never mid-session, never automatic.
- **Never show an unresolvable spinner.** If an asset is missing, Lucy says "let's try a different one" and the round substitutes — silent degradation, not a broken screen.
- **iOS realities:** Add-to-Home-Screen for fullscreen; audio context unlocks on the first tap (use the "tap Lucy to start" moment); Safari can evict storage from unused PWAs, so surface cache health and a one-tap re-cache on the device screen. **[M — verify eviction behavior on Brandy's actual iPad OS version.]**
- **Test on the real cart, early.** The oldest Chromebook in Brandy's room is the performance target, not a dev laptop. Test with Wi-Fi physically off, not just DevTools offline.

## 7. What I'd cut or challenge
- Cut any kid-facing settings, browse, or library surface.
- Cut kid-avatar customization in favor of Lucy's closet.
- Challenge the serpentine map (→ A–Z board) and any bottom tab bar in the kid shell.
- Challenge per-kid voice selection (→ class-level setting).
- Don't hard-lock unpinned letters; dim them. A stuck kid with no adult free is worse than a kid playing B on C day.

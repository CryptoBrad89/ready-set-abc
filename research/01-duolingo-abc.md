# 01 — Duolingo ABC (primary teardown)

*Public knowledge + product analysis, as of Sept 2026. Confidence tags: **[H]** high, **[M]** medium, **[L]** low/verify before relying on it.*

## What it is
Free standalone learn-to-read app from Duolingo, launched ~Feb 2020 on iPad/iOS, later Android. **[H]** Target ages ~3–8, English literacy. No ads, no in-app purchases, no subscription — a genuine outlier in this category. **[H]** It is a *home* product; there is no real classroom deployment story. Duolingo has periodically talked about schools/classroom distribution for ABC **[L]** — do not assume a working teacher dashboard exists. Product status is also worth re-checking before citing anything to Brandy: Duolingo has repeatedly reshuffled its kids/literacy line, and specifics below may have shifted. **[L]**

**App-store only — no browser version. [H]** This is the fact that matters most for us and it is easy to miss: Brandy's room mixes iPads, Chromebooks, and a whiteboard. Duolingo ABC cannot be opened from a URL on the whiteboard browser, and putting it on a Chromebook means the Android/Play path with its own install and profile mess. Our URL-plus-PWA delivery isn't a technical preference; it is the only model that covers all three surfaces Brandy actually has.

## Onboarding
Very short: age (or grade-ish level), child's name, then straight into the path. No account required to start; account/parent gate appears later. **[M]** There's a light placement — "what can your child already do" / a couple of screening taps — that drops the child at a level on the path rather than at the beginning. **[M]**

**Read for us:** their onboarding is a *home* onboarding — it exists to get one parent's one child playing in 30 seconds. Brandy has 20–25 kids sharing 4–6 devices. Our equivalent screen is not "tell us about your child," it's "which kid are you" — a class grid of faces. Steal the *speed* (under 15 seconds to first activity), discard the shape.

## Core loop
Path (vertical, Duolingo-style) → tap next lesson bubble → 3–6 short exercises → confetti/character celebration → back to path, next bubble unlocked. Lessons run ~3–5 minutes. **[H]** The loop is deliberately calmer than main Duolingo: no hearts/lives, no XP leaderboards, no streak pressure aimed at the kid. **[M]** Duolingo's own framing has been that they stripped the competitive gamification for this age band — that judgment is worth copying wholesale.

## Letter progression
**Not A–Z.** ABC follows a phonics scope-and-sequence — high-utility, high-contrast sounds first (m/s/a/t family), letter *sounds* before letter *names*, blending into decodable words and then decodable stories quickly. **[M on exact order, H on "not alphabetical"]**

**Read for us:** this is the single biggest divergence from our lock. Duolingo ABC optimizes for "reading words in week three." A–Z optimizes for "matches the classroom alphabet wall, the letter-of-the-week chart, and the name cards." Both are defensible; ours is the right call for Brandy because the app has to slot into *her* sequence, not replace it. But we should be honest in our own docs: A–Z is a classroom-integration decision, not a reading-science decision. The mitigation is that our activities (case match, picture match) are recognition and initial-sound tasks — which survive any order — rather than blending, which genuinely wants a phonics order.

## Activity types
Roughly: letter tracing with a finger (guided stroke path with a dot to follow), tap-the-letter-that-makes-/s/, match letter to picture, sight-word tap, word building from letter tiles, and a strong library of decodable **Stories** with word-by-word audio highlighting and tap-any-word-to-hear-it. **[H on tracing, matching and stories; M on the rest]** Audio quality and voice-acting are excellent; instructions are spoken, not written.

**Steal:** tap-to-hear-again on any prompt; spoken-only instruction; the tracing dot; word/letter highlighting synced to audio.
**Avoid:** free-form tracing scoring — their tracing is forgiving, but any stroke-accuracy judgment is a bad fit for 3-year-olds on a whiteboard with a fat finger. If we do tracing as a bonus, it must be un-failable.

## Rewards
Modest by design: completion animations, character cameos (Duolingo cast — Junior and friends **[M on which characters appear]**), progress along the path, some collectible/level-up moments. No shop, no currency, no daily-streak guilt-trip for the child. **[M]** Parent-facing streak/reminder nudges exist via notifications. **[M]**

**Read for us:** Duolingo — the company that invented the modern streak — chose *not* to weaponize it on 3-year-olds. That's strong external validation for our stickers/closet model: reward = a durable, collectible artifact of what you did, not a currency you spend or a number you can lose.

## Teacher / parent controls
Weak. A parent gate (hold-to-enter or a math problem), a progress view, notification settings, and multi-child profiles. **[M]** No roster, no assignment, no "everyone do letter C today," no CSV, no printables, no per-skill drill-down. **[H on absence of a real teacher suite]**

## Classroom fit: poor
- **Identity:** one device ≈ one child. Twenty kids cycling through a center will pollute one profile's data or require slow profile switching.
- **Control:** teacher cannot pin today's letter. The adaptive path decides.
- **Session shape:** the path has no natural stopping point — nothing says "you're done, hand the iPad to Marcus." Center rotation needs a hard end card.
- **Whiteboard:** phone/tablet-portrait-leaning layouts, small targets, no teacher-led mode. **[M]**
- **Offline:** app-store native, content downloads; not a guaranteed-offline story on a school Chromebook cart. **[M]**

## Strengths worth respecting
Instructional rigor; ruthless lesson brevity; superb audio; no dark patterns; free; the path makes "what's next" unambiguous for a non-reader.

## Weaknesses to learn from
Home-shaped identity model; no teacher control surface; progression the teacher can't override; no offline/print/export; character cast that means nothing to Brandy's kids (ours has Lucy, a *real* dog they'll recognize — a genuine advantage we should press).

## Steal / Avoid for Ready Set ABC
**Steal:** ≤15s to first activity · spoken-only instructions with a persistent replay affordance (ours = tap Lucy) · 3–5 minute bounded lesson · no hearts/timers/scores shown to kids · celebration that is short and skippable · one obvious "next thing to tap."
**Avoid:** phonics-ordered path (we're locked A–Z, correctly, for classroom fit) · adaptive sequencing that removes teacher control · profile model that assumes one kid per device · stroke-accuracy grading · notification/streak machinery of any kind.

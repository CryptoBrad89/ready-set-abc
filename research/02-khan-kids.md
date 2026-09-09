# 02 — Khan Academy Kids (primary teardown)

*Public knowledge + product analysis, as of Sept 2026. Confidence tags: **[H]/[M]/[L]**.*

## What it is
Free, ad-free, no-subscription early-learning app from Khan Academy, built with the former Duck Duck Moose team. **[H]** Ages ~2–8. Covers reading/phonics, math, logic, social-emotional learning, plus a large media library (books, videos, songs, drawing/coloring). Mascot cast: Kodi the bear plus friends including Ollo the elephant and Peck the bird. **[H on Kodi; M on the rest of the cast names]** This is the closest thing in the market to "free, whole-child, teacher-friendly," and it is the app Brandy is most likely to already have heard of.

## Onboarding
Name + age → a personalized **Learning Path** is generated. **[H]** Adults enter a gated parent/teacher area (birth-year gate) to manage profiles. Multiple child profiles per device are supported. **[H]** Teacher onboarding is a separate flow: create a class, add students, then assign. **[M]**

**Read for us:** Khan Kids at least *has* a teacher concept, which Duolingo ABC doesn't. But profile switching still runs through an adult-ish menu, and with 25 kids in a scrolling list on a shared iPad, center rotation gets slow and error-prone (kid taps the wrong face, data goes to the wrong child). Our pick-me screen should be a single non-scrolling grid of ~25 photo tiles, landscape, thumb-sized, no text required.

## Core loop
Home = a winding **Learning Path** of activity bubbles that mixes subjects, wrapped in a friendly world scene. Tap bubble → one activity (2–5 min) → reward moment → next bubble. Alongside it: a **Library** for free browsing by subject/format — books, videos, songs, activities. **[H]** Adaptive: the path adjusts difficulty and content based on performance. **[M]**

The dual structure (guided path + open library) is smart at home and dangerous in a center. A 4-year-old given a library will watch a video for eight minutes. If we ever add a browse surface, it must be teacher-gated.

## Letter progression
Letter recognition (uppercase/lowercase), letter names, letter sounds, tracing, ABC songs, then rhyming/blending/sight words and leveled readers. **[H on coverage]** Sequencing on the path is curricular/adaptive, not strict A–Z. **[M]** There is enough alphabet content that a teacher *could* find letter-specific activities, but the path won't serve them on demand — that's a library-hunt, mid-center, which is exactly the friction we're removing.

## Activity types
Tap-to-identify, letter tracing, matching, drag-and-drop sorting, listen-and-choose, read-along books with word highlighting, sing-along songs, drawing/coloring, plus filmed and animated video segments. **[H]** Interaction is forgiving: wrong taps generally produce a gentle re-prompt rather than a penalty, and there are no timers or lives. **[M]**

**Steal:** the forgiving-failure posture; read-along word highlighting; the variety-within-a-consistent-chrome approach — every activity looks like it belongs to the same world even when the mechanic changes.

## Rewards
Completing activities yields collectibles and character/room customization — a decorate-and-collect loop rather than a purchase economy. **[M on mechanics detail, H on "collect + customize, no currency store"]** Celebrations are short and character-led (Kodi cheers). No leaderboards, no streak shaming.

**Read for us:** this is essentially our stickers/closet loop, already validated in the closest peer. The important detail is that the reward is *tied to the character kids love*, not to an abstract score. That argues for **Lucy's closet** over a kid-avatar closet (see `05`).

## Teacher / parent controls
The strongest in this set. Parent/teacher area behind a gate with per-child progress by domain; a **teacher mode** with class creation, student rosters, assigning activities/lessons to students, and progress reports. **[M — the teacher feature set has changed over releases; verify current capabilities before citing to Brandy]** Content is also available in Spanish. **[M]**

Still missing for a Pre-K center context: a "today's letter" pin, printables tied to what the kid just did, CSV export for a teacher's own tracking, and any whiteboard/teacher-led mode. **[M]**

## Classroom fit: fair-to-good, with real friction
- **Best-in-class for free + teacher rostering.** Genuinely usable in a school.
- **Sprawl is the enemy of a 10-minute center.** Path + library = unbounded session; nothing enforces "one letter, then done."
- **No teacher pinning.** Brandy can assign, but she can't easily say "this week is C, everything is C."
- **Offline works** once content is downloaded — a real strength and proof the offline-first bet is right. **[M]**
- **No browser version — native iOS/Android only. [H]** On a Chromebook that means the Play Store path (install, storage, per-device profiles), and on the interactive whiteboard it means Khan Kids is effectively unavailable unless the panel happens to run Android. Ours opens from a URL on all three surfaces. **Install/storage weight** on a Chromebook cart is non-trivial; ours is a bookmark. **[M]**
- **Whiteboard:** not designed for teacher-led group play — no big-target group mode, no "no scoring, just play" mode. **[M]**

## Strengths worth respecting
Free and genuinely ad-free; broad, well-produced content; forgiving interactions; real teacher rostering; offline downloads; warm consistent art direction that never talks down to kids.

## Weaknesses to learn from
Too much surface area for a bounded center rotation; adaptive path that the teacher doesn't drive; profile switching too slow for 25 kids; no letter-pinning; no print/CSV; no whiteboard mode; teacher features that feel bolted onto a home app rather than designed for a rotation.

## Steal / Avoid for Ready Set ABC
**Steal:** collect-and-customize rewards tied to the mascot · forgiving wrong-answer handling with no penalty · read-along/audio highlighting · one consistent world skin across varied mechanics · offline content download as a first-class, visible feature (ours: a teacher "Set up this device" screen with a real progress bar) · a teacher area that is genuinely part of the product, not an afterthought.
**Avoid:** an open library/browse surface in the kid shell · unbounded sessions with no end card · adaptive sequencing that overrides the teacher · scrolling profile lists · subject sprawl (we do letters, and only letters, extremely well) · assuming "assign a lesson" is the teacher primitive — for Pre-K the primitive is **"pin today's letter for the whole class."**

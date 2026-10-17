# Ready Set ABC · Letter Post + Moonboat

Open [index.html](index.html) directly, or serve the repository with
`python3 -m http.server 8000` and visit `/design/codex/game/`.
Both games work offline from local files, without a build step.

Both games now cover A–Z with the original screens, typography, palettes,
Lucy photos, finite animations, themes, hints, replay and visit collections.
The original envelope/planet cards scroll vertically within their shelves;
stamp strips/constellations scroll horizontally and count up to 26. A newly
earned letter is brought into view on the celebration screen. Collections
last for the current visit, as before.

G uses goat. X uses fox's ending /ks/: the question and hint say “ends with,”
and the celebration says “Fox ends with x.” These are text changes using only
the existing X and fox clips; no new spoken line is required. Distractors
exclude matching sounds (cat/kite) and matching starting words (fish/fox).
Word pictures extend the original code-native SVG vocabulary; the existing
leaf SVG is reused. No raster art, photos, fonts or audio were changed.

`audio-map.js` retains the 53 approved letter clips, including the long-I
extra (the insect round uses short I). They remain byte-identical to
`approved/approved-sha256.txt`. The original six word clips remain in each
game's assets. The 20 supplied `audio/words/word-*.mp3` clips and their entries
from `lpmb-word-manifest.json` are included in `voice-manifest.json`, with
the supplied provenance and hashes. All 91 inventoried clips are Lucy /
`eleven_v4`; the older Flicker notes in source asset documentation are
historical. Nothing was generated, renamed or re-encoded.

Run the required read-only, stdlib checks from the repository root:

```sh
python3 design/codex/game/tests/run_tests.py
```

Strict mode passes **6/6** groups: the four original approved-audio,
trim-metadata, wiring and voice-inventory checks, plus A–Z word/audio/SVG
coverage and preservation of both games' light and dark themes. Failures
exit nonzero; no mismatch allowance is needed.

Optional offline runtime and browser checks:

```sh
node design/codex/game/tests/runtime_smoke.cjs
node design/codex/game/tests/browser_smoke.cjs
```

The dependency-free runtime check passes 156 rounds (26 letters × 3 themes ×
2 games), exercising actual game rendering and voice sequencing with browser
APIs stubbed. It covers listen/replay, wrong answers and two-miss hints,
celebration, next-letter wraparound, collections and mute.

The optional browser script uses locally installed Playwright/Chromium and
file URLs; it needs no server or internet. It checks B/J/X/Z at 390×844,
768×1024 and 1440×1000 in all themes, including touch targets and horizontal
overflow, and saves screenshots to `/tmp/lpmb-shots`. Set `PLAYWRIGHT_MODULE`
and/or `CHROMIUM_EXECUTABLE` to existing local installations if needed.
Use `CHROMIUM_EXECUTABLE=/usr/bin/google-chrome` when the bundled Playwright browser is unavailable. Set `BROWSER_SMOKE_SHARD` to 0–5 to run one game/viewport pair, with all three themes. Omit it for the full 18-case suite.

The child UI uses a storybook stage with chunky letter cards, finite staggered
entrances, expressive portrait movements, sound bars during narration, and
stamp/star reward choreography. Design Taste's playful-color and motion skills
informed the presentation. Approved Lucy images and all audio remain unchanged.
Animations use transform and opacity, including individual transform properties.
Lucy breathes gently on play screens, and sound bars repeat during narration. Hidden tabs pause motion;
reduced-motion preferences disable it, including hover movement.

Run the motion and reduced-motion browser journeys:

```sh
CHROMIUM_EXECUTABLE=/usr/bin/google-chrome node design/codex/game/tests/motion_smoke.cjs
```

This exercises both worlds at phone, tablet, and whiteboard sizes with actual
user interactions, no audio or learning stubs, and no network requests.
It checks entrances, replay, wrong/correct choices, collection, rapid exits,
live reduced-motion changes, and compositor-friendly animation properties.
Screenshots survive browser cleanup in `/tmp/lpmb-motion-shots`.
The scoped [verification skill](tests/verify-game/SKILL.md) documents repeatable
home, play, and reward journeys. Local-file offline behavior is covered; these
design prototypes do not install a service worker on a hosted origin.

Screen changes fade out before the next scene enters. Correct picture cards
bounce before the reward; wrong cards wiggle with a fading soft red glow.
Rewards add six temporary confetti pieces, cleared when their effect ends
or the route changes. Existing audio and approved Lucy images are unchanged.

Every four completed rounds produces a short parade on the reward screen.
Lucy leads the last four completed letters in finish order. Repeated letters
count, and the running batch lasts for the current visit. Existing Lucy images
stand in for parade characters; their alt text identifies temporary placeholders.
The parade fades in and out and leaves Next and Home available. Reduced motion
keeps the ordered strip still. The runtime helper checks recurring batches,
finish order, and repeats; the motion helper checks the parade in both games
with normal and reduced motion at phone size.

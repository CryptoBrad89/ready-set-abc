# Ready Set ABC · Letter Post, Moonboat, and Silk Thread

Open [index.html](index.html) directly, or serve the repository with
`python3 -m http.server 8000` and visit `/design/codex/game/`.
All three games work offline from local files, without a build step.

All three games cover A–Z with the original screens, typography, palettes,
Lucy photos, screen animations, themes, hints, replay and visit collections.
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

The dependency-free runtime check passes 234 rounds (26 letters × 3 themes ×
3 games), exercising actual game rendering and voice sequencing with browser
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
Rewards recycle twenty-four paper cut-outs continuously until the route changes.
Replay keeps the same pieces falling. Reduced motion removes them. Existing audio and approved Lucy images are unchanged.

Run the confetti visibility regression in Chrome:

```sh
CHROMIUM_EXECUTABLE=/usr/bin/google-chrome node design/codex/game/tests/confetti_smoke.cjs
```

It checks all three games in all three themes at phone and whiteboard sizes. Each
correct-answer journey verifies painted SVG artwork, shape variety, independent
fall and flutter, large hero pieces, continuous recycling, replay, theme changes, cleanup, and
navigation. It also rejects animated layout properties and per-piece SVG filters. Chrome screenshots
are saved mid-fall in `/workspace/rsabc-layouts-r4/confetti/`. Existing reduced-motion
behavior remains unchanged.

Letter Post scatters envelopes, perforated stamps, hearts, and paper curls. Moonboat
scatters stars, crescents, ringed planets, and curls. Twenty-four bounded descriptors
set each piece's lane, delay, size, drift, and turn. Separate transform layers
handle descent, flutter, and tumble; static folds and inset shapes give the
SVG cut-outs a matte paper finish. Four larger pieces make the shapes easier to
recognize. Individual falls last 3.1–3.64 seconds, with evenly distributed phases and
entry/exit fades on every cycle. The count stays fixed at 24, and the effect uses no per-frame
JavaScript or SVG filters. Colors use the existing world palette.

Design references came from the local design-tool repos. Design Taste informed
finite transform/opacity choreography. Motion Primitives' TransitionPanel
informed entry, visible, and exit phases. Canvas UI's Shatter informed independent
piece tilt and scatter. UI Layouts' 3D marquee informed nested perspective and
orientation. These ideas are implemented in vanilla CSS/JS without dependencies.


Silk Thread reuses Letter Post's engine, artwork, motion, fonts, and approved Lucy
assets through relative paths. Its `config.js` supplies the home view, title,
palette labels, and asset base. Its stylesheet adapts the round-3 Silk Thread
plate. Pink is the default, followed by Purple and Yellow. Each world keeps its
own theme choice. Silk Thread scatters paper hearts, curls, and stars.

Run the Silk Thread browser journeys and requested screenshots:

```sh
CHROMIUM_EXECUTABLE=/usr/bin/google-chrome node design/codex/game/tests/silk_smoke.cjs
```

This checks all 26 completed rounds, palette persistence, 60px touch targets,
reduced motion, and local offline resources. It checks widths 390, 1180, and
1920 and captures every palette at 390 and 1180 in `/workspace/rsabc-layouts-r4/`.
The chooser screenshots cover all three widths.

The round-4 implementation uses Design Taste's playful-color guidance for the
chooser hierarchy, Superdesign's spacing guidance for Silk Thread, and Motion
Primitives' TransitionPanel and InfiniteSlider as motion references. Existing
vanilla CSS and JavaScript implement the motion without a new dependency.

## Grown-ups

Each world has a **Grown-ups** button in its footer. A fresh reading check
asks for the digits shown as number words. Opening it returns play to the
letter shelf and cancels the unfinished round. The check discourages casual
entry by young children; it is not an account or password.

Choose practice letters, sound, and the world's color theme. **Save and return**
applies the draft. **Cancel**, **Close**, and Escape discard it. At least one
letter must remain selected. The shelf and **Another sound** use the chosen
letters; picture choices still draw from the full vocabulary. The visit
summary reports pictures found and does not assess mastery.

Letter and sound preferences use one validated, versioned settings record per
world. Themes retain their existing keys. Collections still last for the
current visit. If browser storage is unavailable, settings work for the visit
and the game explains that limitation.

Run the settings journeys and edge cases:

```sh
CHROMIUM_EXECUTABLE=/usr/bin/google-chrome node design/codex/game/tests/grownups_smoke.cjs
CHROMIUM_EXECUTABLE=/usr/bin/google-chrome node design/codex/game/tests/grownups_edges.cjs
```

Screenshots remain in `/workspace/rsabc-grownups/`. The shared dialog uses native
modal focus behavior and the game's existing fonts. Design Taste's local
accessibility, UX copy, and playful-color guidance informed its quiet paper
layout, visible labels, and touch targets. Better Design was inspected, but
its required MCP was unavailable, so no Better Design guidance or review
results were used.

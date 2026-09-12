# ABC Trail

The ABC Trail shows every letter A–Z as a playable tile, marks the next PLAY with a gold ring / Next up tag, and can carry a blue letter-of-the-day flag when a grown-up pinned a letter.

## Sub-features

- `trail-open-tab` opens the trail from the ABC Trail tab.
- `trail-open-smoke` opens from `to=%23/trail`.
- `trail-all-awake` shows 26 playable tiles with words, not dashes.
- `trail-play-tile` starts that letter's round.
- `trail-pin-flag` shows the pinned letter's flag when a pin is set.

## How to get to it (user POV)

- Tap the **ABC Trail** tab.
- Smoke: `_smoke.html?to=%23/trail`.
- Smoke with pin: `_smoke.html?pin=C&to=%23/trail`.
- A non-letter play bookmark (`play=9`) lands here and Lucy names the letter that is up.

## Driving it with the browser

Preconditions:

- `verify-rsabc doctor` is OK on port 4173.
- Viewport is landscape 1280×800.
- Navigate to `verify-rsabc smoke 'reset=1&classroom=0&pin=C&to=%23/trail'`.

- **See the trail.** `body[data-screen]` is `trail`. Snapshot `artifacts/abc-trail/01-trail.aria.txt` and screenshot `artifacts/abc-trail/01-trail.png`. A tile named `Letter C, … Letter of the day.` exists. A tile named `Letter Z, … Play this letter.` exists. Nothing says a letter is asleep.
- **Open letter C.** Choose `Letter C, … Play this letter.` The case-match (or picture) board for C opens.
- **Proof.** Snapshot `artifacts/abc-trail/02-letter-c.aria.txt`. Instruction or Lucy mentions letter C / its phoneme. `localStorage['rsabc.pinnedLetter']` is `"C"`.

## Gotchas

- `#/letter/9` or `play=9` is a stray on purpose: it must land on the trail, not silently start A.
- Unpin with `unpin=1` before asserting the blue flag is gone. A leftover pin from an earlier origin-4173 run will still flag.
- Trail tiles start a round immediately when classroom is off. With classroom on and no kid, a tile still needs a face first.
- Do not count CSS gold/blue rings as the only proof; the accessible name includes `Letter of the day` and `Starts next.`

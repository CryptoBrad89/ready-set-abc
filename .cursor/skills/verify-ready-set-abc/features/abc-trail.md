# ABC Trail

Letters & Phonics is that child's path. SATPIN Ava sees Cloud 1 letters **S, A, T, P, I, N** and the cloud islands. Assigned Miles sees **S, O, J** and no islands. The next PLAY tile carries a gold ring / Next up tag. A grown-up pin can add a letter-of-the-day flag when that letter is in the child's work.

## Sub-features

- `trail-open-tab` opens the path from the **Letters & Phonics** tab.
- `trail-open-smoke` opens from `to=%23/trail` after a named child is seeded.
- `trail-satpin-ava` shows six Cloud 1 tiles and the cloud islands.
- `trail-assigned-miles` shows S O J, no islands, and Lucy without "Cloud 1 is open".
- `trail-play-tile` starts that letter's round when the letter is open.
- `trail-pin-flag` shows the pinned letter's flag when a pin is in the child's work.

## How to get to it (user POV)

- Tap the **Letters & Phonics** tab.
- Smoke Ava path: `_smoke.html?kid=k01&to=%23/trail`.
- Smoke with pin: `_smoke.html?kid=k01&pin=P&to=%23/trail`.
- A non-letter play bookmark (`kid=k01&play=9`) lands here and Lucy names the letter that is up.

## Driving it with the browser

Preconditions:

- `verify-rsabc doctor` is OK on port 4173 with shell `rsabc-shell-v40-nudge-home`.
- Viewport is landscape 1280×800.

- **SATPIN Ava.** Navigate to `verify-rsabc smoke 'reset=1&kid=k01&to=%23/trail'`. `body[data-screen]` is `trail`. Heading `Letters & Phonics`. Lucy says Cloud 1 is open. Six tiles for S A T P I N. Footer `Tap a letter in the open cloud`. Snapshot `artifacts/abc-trail/01-ava-trail.aria.txt`.
- **Open letter P.** Choose `Letter P, … Play this letter.` Meet for P opens.
- **Assigned Miles.** From Ava Home, open Grown-Ups, PIN 1234, Class tab. Set **Work mode for Miles** to **Assigned letters**. Set **Assigned letters for Miles** to `S O J`. Choose **Return to Letter Play**. Tap the who-chip, then **Miles**. Tap **Letters & Phonics**. Board is S O J. No cloud islands. Lucy `Tap letter S to start.` Footer `Tap one of your letters`. A tile named `Letter Z` must not appear. Snapshot `artifacts/abc-trail/02-miles-trail.aria.txt`.
- **Closed letter.** With Miles still assigned, open `#/letter/P` or smoke `kid=k24&play=P`. Screen stays trail. Tile `Letter P, locked.`
- **Proof.** For Ava, `localStorage['rsabc.kid']` is `"k01"`. For Miles, `"k24"`.

## Gotchas

- This path is not 26 lit A to Z tiles. A recipe that requires a playable Z on SATPIN Ava is proving the old trail and will fail a correct Cloud 1 board.
- `#/letter/9` or `kid=k01&play=9` is a stray on purpose. It must land on Letters & Phonics, not silently start A. Empty session still shows the roster first.
- Unpin with `unpin=1` before asserting the blue flag is gone. A leftover pin from an earlier origin-4173 run will still flag.
- Trail tiles start a round only when that letter is open for this child. Empty session still needs the roster first.
- Do not count CSS gold/blue rings as the only proof. The accessible name includes `Letter of the day` and `Starts next.`
- `kid=k24` without the Class step is SATPIN Miles, not assigned Miles.
- Do not `reset=1` after the Class step. Reset wipes the roster override and Miles falls back to SATPIN.

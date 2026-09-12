# Grown-Ups pin

A grown-up opens the boring Grown-Ups gate, unlocks it with PIN 1234 (or the sum), and pins today's letter so the next PLAY starts there.

## Sub-features

- `gu-open-button` opens the gate from the slate Grown-Ups button.
- `gu-open-smoke` opens a tab URL that still shows the keypad (`gu=play`).
- `gu-pin-1234` accepts 1234 and shows Grown-Ups settings.
- `gu-pin-letter` pins a letter on the Play tab and reports it as pinned.
- `gu-close` returns to letter play without changing kid chrome permanently.

## How to get to it (user POV)

- Tap **Grown-Ups** (top right).
- Hold the yellow paw logo for 3 seconds.
- Press Shift+T.
- Smoke: `_smoke.html?gu=play` (still gated).

## Driving it with the browser

Preconditions:

- `verify-rsabc doctor` is OK on port 4173.
- Viewport is landscape 1280×800.
- Navigate to `verify-rsabc smoke 'reset=1&classroom=0&gu=play'`.

- **See the keypad.** Dialog named `Grown-up check` with heading `Grown-Up Check`. Copy mentions the teacher PIN. Snapshot `artifacts/grown-ups-pin/01-gate.aria.txt` and screenshot `artifacts/grown-ups-pin/01-gate.png`.
- **Unlock.** Choose keys `1`, then `2`, then `3`, then `4` (buttons whose names are `1` `2` `3` `4`). Dialog named `Grown-Ups settings` appears. Play tab is selected.
- **Pin C.** Under `Letter of the day`, choose the button named `C`. Note text reads `Pinned: rounds start at C`. That button is `aria-pressed=true`.
- **Return.** Choose `Return to Letter Play`. The overlay closes.
- **Proof.** Snapshot `artifacts/grown-ups-pin/02-home.aria.txt` on Home. Read `localStorage['rsabc.pinnedLetter']` into `artifacts/grown-ups-pin/storage.json` — value `"C"`. Optional: open ABC Trail and confirm a tile name includes `Letter of the day`.

## Gotchas

- `?gu=play` still requires the PIN. A bookmark is not a back door.
- The keypad also accepts the sum (`3 + 5` → `8`). Digit length ≥ 4 that is neither PIN nor sum clears. Do not treat a cleared pad as a lockout.
- Hold-logo for 3 seconds opens the same gate; a short click on the paw goes Home instead.
- Pin applies on the **next** PLAY, not mid-round. Do not start a letter, then pin, and expect the current board to change.
- Tap the same letter again to unpin. Proof that a pin stuck must read storage or the note, not only that C was clicked.
- Shift+H hides chrome. Lucy's bubble stays. With chrome hidden, hold the paw or Shift+T to get back in.

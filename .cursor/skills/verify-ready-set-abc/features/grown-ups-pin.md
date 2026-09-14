# Grown-Ups pin

A grown-up opens the Grown-Ups gate, unlocks it with PIN 1234 (or the sum), pins today's letter, and sets each child's work mode on the Class tab.

## Sub-features

- `gu-open-button` opens the gate from the slate Grown-Ups button.
- `gu-open-smoke` opens a tab URL that still shows the keypad (`gu=play`) after a child session exists.
- `gu-pin-1234` accepts 1234 and shows Grown-Ups settings.
- `gu-pin-letter` pins a letter on the Play tab.
- `gu-miles-assigned` sets Miles to Assigned letters S O J.
- `gu-close` returns to letter play without changing kid chrome permanently.

## How to get to it (user POV)

- Tap a child on the roster, then **Grown-Ups** (top right).
- Hold the yellow paw logo for 3 seconds.
- Press Shift+T.
- Smoke `_smoke.html?kid=k01&gu=play` (still gated).

## Driving it with the browser

Preconditions:

- `verify-rsabc doctor` is OK on port 4173 with shell `rsabc-shell-v40-nudge-home`.
- Viewport is landscape 1280×800.
- Ava is playing. Navigate to `verify-rsabc smoke 'reset=1&kid=k01&gu=play'`.

- **See the keypad.** Dialog named `Grown-up check` with heading `Grown-Up Check`. Copy mentions the teacher PIN. Gate cancel is `Return to Letter Play`. Snapshot `artifacts/grown-ups-pin/01-gate.aria.txt` and screenshot `artifacts/grown-ups-pin/01-gate.png`.
- **Unlock.** Choose keys `1`, then `2`, then `3`, then `4` (buttons whose names are `1` `2` `3` `4`). Dialog named `Grown-Ups settings` appears. Heading `Grown-Ups`. Play tab is selected. Open clouds is visible for SATPIN Ava. Note text names the open cloud.
- **Pin P.** Under `Letter of the day`, choose the button named `P`. Note text reads `Pinned: P is highlighted inside the open cloud (P is for Pig). If that letter is locked, PLAY starts the open cloud instead. Tap it again to unpin.` That button is `aria-pressed=true`.
- **Assign Miles.** Choose the **Class** tab. Find Miles. Set **Work mode for Miles** to **Assigned letters**. Set **Assigned letters for Miles** to `S O J`. Optionally set Arcade to Locked.
- **Return.** Choose `Back to play`. The overlay closes. Header unlock does not switch session. Ava is still playing.
- **Assigned Play.** Tap the who-chip, then **Miles**. Open **Grown-Ups**, PIN 1234. Play tab hides Open clouds. Note text uses "your letters".
- **Proof.** Snapshot `artifacts/grown-ups-pin/02-home.aria.txt` on Home. Read `localStorage['rsabc.pinnedLetter']` into `artifacts/grown-ups-pin/storage.json`. Value is `"P"`. Open Letters & Phonics if you need the flag. A tile name includes `Letter of the day`.

## Gotchas

- Prefer tap Ava, then **Grown-Ups**. Empty-session `#/grownups` still shows the roster because the roster is login. Seed `kid=k01` before you treat the keypad as the first screen.
- The keypad also accepts the sum on the card. Digit length of 4 or more that is neither PIN nor sum clears. Do not treat a cleared pad as a lockout.
- Hold-logo for 3 seconds opens the same gate. A short click on the paw goes Home instead.
- Pin applies on the next PLAY, not mid-round. Do not start a letter, then pin, and expect the current board to change.
- Tap the same letter again to unpin. Proof that a pin stuck must read storage or the note, not only that P was clicked.
- Assigned Play hides the Open clouds row. SATPIN Play still shows it. Prove Assigned Play while Miles is the session child.
- Assigned pin copy says "your letters". SATPIN pin copy says "open cloud".
- Shift+H hides chrome. Lucy's bubble stays. With chrome hidden, hold the paw or Shift+T to get back in.
- Free play is a Class work-mode option. Do not invent a proof for it in this pass.

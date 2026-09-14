# Face pick

The roster is login. The first screen is **Who is playing?**. A child tap opens that child's Home. Stars file under that child. The who-chip sends the tablet back to the roster.

## Sub-features

- `faces-grid` shows **Who is playing?** with the class name. Tabs are hidden.
- `faces-choose` opens that child's Home after a face tap. It does not start a round.
- `faces-who-chip` shows the playing child in the header on Home.
- `faces-switch` returns to the roster from the who-chip and clears the session.

## How to get to it (user POV)

- Open the tablet with an empty session.
- Smoke: `_smoke.html?reset=1`.
- On Home, tap the header chip `{Name} is playing. Tap to pick a different friend.`

## Driving it with the browser

Preconditions:

- `verify-rsabc doctor` is OK on port 4173 with shell `rsabc-shell-v40-nudge-home`.
- Viewport is landscape 1280×800.
- Navigate to the URL from `verify-rsabc smoke 'reset=1'`.

- **See the roster.** Heading `Who is playing?`. Copy contains the class name. `body[data-screen]` is `faces`. Tabs are hidden. Snapshot `artifacts/face-pick/01-grid.aria.txt` and screenshot `artifacts/face-pick/01-grid.png`.
- **Choose Ava.** Choose the button named `Ava`. After a short pause Home opens. Heading `Welcome back, Ava!`. Hash `#/home`. `body[data-screen]` is `home`. Mission button `Play letter P. Tap to start sound.`. Stat line `S · A · T · P · I · N`. Gold chip `Cloud 1`. `localStorage['rsabc.kid']` is `"k01"`. `localStorage['rsabc.session']` is `"child"`. The header chip reads `Ava is playing. Tap to pick a different friend.`
- **Switch kids.** Choose that who-chip. The roster returns. `localStorage['rsabc.kid']` is empty.
- **Proof.** Snapshot `artifacts/face-pick/02-back.aria.txt`. Heading is again `Who is playing?`. Write `artifacts/face-pick/storage.json` with `rsabc.kid` null.

## Gotchas

- `kid=k01` never shows the roster. Ava is already playing. Use `reset=1` to prove the grid.
- A face tap must not open meet, choose, or case-match. If `body[data-screen]` is `meet` or `case`, the recipe failed.
- `classroom=0` does not skip the roster. Empty session always lands on **Who is playing?**.
- `kid=k24` opens Miles Home with default SATPIN until Class sets Assigned letters. Do not treat shipped Miles as assigned without that step.
- The Back chip on the roster (only when a session already exists) returns to Home. That is not the who-chip switch.

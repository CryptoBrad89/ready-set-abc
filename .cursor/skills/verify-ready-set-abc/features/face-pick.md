# Face pick

Classroom mode asks who is playing before a round, files stars under that child, and lets a grown-up or the name chip send PLAY back to the face grid.

## Sub-features

- `faces-grid` shows Who is playing? with the class name.
- `faces-choose` starts a round after tapping a face.
- `faces-who-chip` shows the playing child in the header.
- `faces-switch` returns to the grid from the name chip.

## How to get to it (user POV)

- Grown-Ups → Class → **Face pick before play** On, then Home **PLAY!**.
- Smoke: `_smoke.html?classroom=1&clearKid=1`.
- Smoke named round: `_smoke.html?classroom=1&kid=k01&play=A` (skips the grid because Ava is already playing).
- Tap the header name chip `{Name} is playing. Tap to pick a different friend.`

## Driving it with the browser

Preconditions:

- `verify-rsabc doctor` is OK on port 4173.
- Viewport is landscape 1280×800.
- Navigate to `verify-rsabc smoke 'reset=1&classroom=1&clearKid=1'`.

- **See the grid.** Heading `Who is playing?` and copy containing `Ms. Brandy — Pre-K AM`. Tabs are hidden. Snapshot `artifacts/face-pick/01-grid.aria.txt` and screenshot `artifacts/face-pick/01-grid.png`.
- **Choose Ava.** Choose the button named `Ava`. After a short pause the case-match board opens (`body[data-screen]` is `case` or `picture`). The header chip reads `Ava is playing. Tap to pick a different friend.`
- **Switch kids.** Choose that who-chip. The grid returns. `localStorage['rsabc.kid']` is empty.
- **Proof.** Snapshot `artifacts/face-pick/02-back.aria.txt`. Heading is again `Who is playing?`. Write `artifacts/face-pick/storage.json` with `rsabc.classroom` true and `rsabc.kid` null.

## Gotchas

- `classroom=1&kid=k01&play=A` never shows the grid — Ava is already selected. Use `clearKid=1` to prove the grid.
- Face pick Off (`classroom=0`) sends PLAY into the round and keeps one shared pouch under `_device`.
- Removing a child or importing a CSV without them also returns PLAY to this grid. Do not prove that path unless Class-tab mutation is in scope.
- The Back chip on the grid ends the round and goes Home; that is not the same as the who-chip switch.

# Play a letter round

A child starts PLAY from that child's Home. The round is meet, then choose, then listen, then payoff, then a skippable celebrate. Cloud 1 proof letter for SATPIN Ava is **P**. Assigned Miles starts at **S**.

## Sub-features

- `round-play-home` starts from Home via the mission card.
- `round-play-hash` starts from a smoke round URL after a named child is seeded.
- `round-meet` tap the giant letter to continue.
- `round-choose` single-tap hanging letters (Lucy wants this letter).
- `round-listen` tap the orb that plays the isolated phoneme file (or silence plus Lucy's line).
- `round-payoff` word plates (P is for Pan / Panda) then Hooray.
- `round-celebrate` shows 1 to 3 stars and a Skip control.

## How to get to it (user POV)

- On Ava Home, tap **Play letter P**.
- On Letters & Phonics, tap the P tile in Cloud 1 (Ava) or the S tile (Miles assigned).
- Open a named round: `_smoke.html?kid=k01&play=P`.

## Driving it with the browser

Preconditions:

- `verify-rsabc doctor` reports `http://127.0.0.1:4173` and shell `rsabc-shell-v40-nudge-home`.
- Viewport is landscape 1280×800.
- Navigate to the URL from `verify-rsabc smoke 'reset=1&kid=k01&play=P'`.

- **Land in meet.** `body[data-screen]` is `meet`. A hanging P is on the stage. Lucy is in the corner, not a coach overlay. Snapshot `artifacts/play-round/01-meet.aria.txt`.
- **Choose.** Tap the P card(s). Misses wobble only. No drag.
- **Listen.** Three identical orbs. One is the sound. Wrong orbs wobble.
- **Payoff.** Pan / Panda plates. Tap **Hooray!**
- **Celebrate.** Skip is live. Stars are already banked.

## Gotchas

- `play=P` with an empty session lands on **Who is playing?** first. Seed `kid=k01` or tap Ava, then PLAY.
- Ava SATPIN PLAY is P. Miles assigned PLAY is S. Do not expect P on Miles after Class sets S O J.
- Letters outside that child's work do not start PLAY. Miles assigned refuses P from a hash and lands on Letters & Phonics with `Letter P, locked.`
- Isolated phonemes are files only. Missing clip is silence plus Lucy's bubble, never TTS "puh".
- Celebration auto-settles at 8 seconds. Skip only stops the party.
- First PLAY also unlocks Web Audio.

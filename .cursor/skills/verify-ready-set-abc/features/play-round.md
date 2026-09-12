# Play a letter round

A child starts an open-cloud letter, runs meet → choose → listen → payoff, then the skippable celebrate. Cloud 1 proof letter is **P**.

## Sub-features

- `round-play-home` starts from Home via Lucy’s Pick / PLAY.
- `round-play-hash` starts from a smoke round URL (`play=P`) after seed.
- `round-meet` tap the giant letter to continue.
- `round-choose` single-tap hanging letters (Lucy wants P).
- `round-listen` tap the orb that plays the isolated phoneme file (or silence + Lucy’s line).
- `round-payoff` word plates (P is for Pan / Panda) then Hooray.
- `round-celebrate` shows 1–3 stars and a Skip control.

## How to get to it (user POV)

- On Home, tap **Play Letter P**.
- On Letters & Phonics, tap the P tile in Cloud 1.
- Open a smoke round: `_smoke.html?classroom=0&play=P`.

## Driving it with the browser

Preconditions:

- `verify-rsabc doctor` reports `http://127.0.0.1:4173` and shell `rsabc-shell-v36-login-satpin`.
- Viewport is landscape 1280×800.
- Face pick is off so PLAY goes straight into the letter.
- Navigate to the URL from `verify-rsabc smoke 'reset=1&classroom=0&play=P'`.

- **Land in meet.** `body[data-screen]` is `meet`. A hanging P is on the stage. Lucy is in the corner, not a coach overlay. Snapshot `artifacts/play-round/01-meet.aria.txt`.
- **Choose.** Tap the P card(s). Misses wobble only. No drag.
- **Listen.** Three identical orbs. One is the sound. Wrong orbs wobble.
- **Payoff.** Pan / Panda plates. Tap **Hooray!**
- **Celebrate.** Skip is live. Stars are already banked.

## Gotchas

- `play=P` with `classroom=1` and no kid lands on **Who is playing?** first. This recipe uses `classroom=0`.
- Letters outside the open cloud (default Cloud 1 = S A T P I N) do not start PLAY.
- Isolated phonemes are files only. Missing clip = silence + Lucy’s bubble, never TTS “puh”.
- Celebration auto-settles at 8 seconds. Skip only stops the party.
- First PLAY also unlocks Web Audio.

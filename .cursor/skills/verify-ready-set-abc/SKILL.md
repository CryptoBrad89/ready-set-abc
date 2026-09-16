---
name: verify-ready-set-abc
description: Drive the Ready Set ABC Pre-K phonics PWA in a real browser. Launch an isolated static server, seed tablet state via _smoke.html, tap the roster, that child's Home, Letters & Phonics, Lucy's Closet, and the Grown-Ups gate the way a classroom user would, and capture proof. Use when proving a UI change, a round/flow fix, or that roster, Home, Letters & Phonics, Lucy's Closet, or Grown-Ups still work.
---

# Verify Ready Set ABC

Vanilla HTML/CSS/JS PWA in `app/`. No build, no backend. The roster is login. Kids tap giant cards. Grown-ups unlock a PIN gate. This skill is for the next agent: launch an isolated instance, drive the real screens, keep the proof.

Read `features/README.md` before driving. A proof that hits one convenient URL is incomplete when the map lists other entry points.

## Launch

From the repo root:

```
.cursor/skills/verify-ready-set-abc/bin/verify-rsabc launch
```

Ready when stdout contains `ready http://127.0.0.1:4173` (or `already running`). Default bind is `127.0.0.1:4173` serving `app/`. Override with `--port` or `RSABC_VERIFY_PORT`.

Teardown (instances and scratch only. Never the evidence):

```
.cursor/skills/verify-ready-set-abc/bin/verify-rsabc cleanup
```

That kills the pid recorded in `/tmp/rsabc-verify/state` only. It does not `pkill python`, does not touch ports 8000/8080, and does not delete `artifacts/`.

The helper `nohup`s the server so a finished launch command does not take it down. If a sandbox still reaps that child, keep `python3 -m http.server 4173 --directory app --bind 127.0.0.1` running in a lasting terminal/job and write `PORT`, `PID`, `URL`, and `REPO` into `/tmp/rsabc-verify/state` so `doctor` still matches.

Do not start `python3 -m http.server 8000` (README demo) or the Cursor environment server on 8080 for verification. Those origins share localStorage with anyone already using them. A different port is a different origin: 4173 is isolated.

The page must be `http://`, not `file://`. `file://` will not play sound and will not run the service worker.

Repo gates (run from `app/` if the checkout looks broken, before trusting a drive):

```
cd app && node _check.mjs && node _flow.mjs
```

Both print `ALL-OK`. `_flow.mjs` is a pocket-DOM classroom walk, not a substitute for a browser proof.

## Doctor

Run this first whenever anything looks off:

```
.cursor/skills/verify-ready-set-abc/bin/verify-rsabc doctor
```

It is read-only. It must report: our pid alive, that pid owns the port, `GET /` is Ready Set ABC, `GET /js/version.js` contains `rsabc-shell-v45-letter-names`, `_smoke.html` answers, and the port is not 8000 or 8080. If it fails, stop driving. Launch a fresh instance or pick another port. Never drive an instance this helper did not start.

## Drive

Use a real browser (Cursor browser tools or CDP). Landscape viewport **1280×800 or 1366×768**. Portrait under 900px wide shows **Turn the tablet sideways** and blocks the app.

Seed tablet state by navigating to a smoke URL on **this** origin, then wait for `index.html`. Print the URL with:

```
.cursor/skills/verify-ready-set-abc/bin/verify-rsabc smoke 'reset=1'
.cursor/skills/verify-ready-set-abc/bin/verify-rsabc smoke 'kid=k01'
.cursor/skills/verify-ready-set-abc/bin/verify-rsabc smoke 'kid=k01&play=P'
```

`_smoke.html?<query>` writes `rsabc.*` localStorage then `location.replace`s into the app. Query with no keys lists bookmarks. That index is not a play screen. `reset=1` is the roster. `kid=k01` is Ava Home. `kid=k01&play=P` is a named round. Empty session never skips the roster.

Prefer ARIA roles and accessible names over CSS, coordinates, or tab order.

Stable handles:

| What | Handle |
|---|---|
| App identity | roster heading `Who is playing?`; Home heading `Welcome back, Ava!` (or that child's name); brand button name `Ready Set ABC — home. Hold for Grown-Ups.` |
| Play | button `Play letter P. Tap to start sound.` on SATPIN Ava Home. Miles assigned is `Play letter S. Tap to start sound.` |
| Tabs | `Home`, `Letters & Phonics`, `Lucy's Closet`, `Storybooks`, `Arcade` |
| Grown-Ups | button `Grown-Ups`, then dialog `Grown-up check`, then PIN **1234** (keys `1` `2` `3` `4`) or the sum on the card |
| Close gate | PIN pad `Return to Letter Play` or Escape. Unlocked sheet `Back to play`. |
| Home from logo | click the brand (hold 3s opens the gate instead) |
| Case-match choice | button `Letter a, … as in Apple` or `Letter A, …`. Hunt case is in the instruction (`little` vs `big`). |
| Complete match | button whose name contains `Tap here to complete the match` (or the CTA `Match A & a!` / `Check Aa`) |
| Picture choice | button `{Word}, starts with {phoneme}`. Pick the word that starts with this letter. |
| Celebrate skip | button `Skip the celebration` |
| Next letter | button whose name contains `Play Letter B` (or whichever letter is next) |
| Roster | heading `Who is playing?`; face buttons named `Ava`, `Miles`, … A face tap opens that child's Home, not a round. |
| Letters & Phonics tile | SATPIN `Letter P, Pig. … Play this letter.` Assigned Miles tiles are S O J only. |
| Lucy | image `Lucy the golden retriever` |
| Lucy's Picnic Day | Home card `Lucy's Picnic Day`; Storybooks tab; cover heading `Lucy's Picnic Day`; `Next page` / `Previous page`; `body[data-screen]` is `stories` |
| Rhymes & Songs | Home card `Rhymes & Songs`; heading `Rhymes & Songs`; `Play song` / `Play song again`; `body[data-screen]` is `rhymes` |
| Coloring Canvas | Home card `Coloring Canvas`; heading `Coloring Canvas`; `Color Lucy` / `Color letter P`; crayons `Yellow crayon`; `Done coloring`; `body[data-screen]` is `color` |
| Lucy hello | button `Talk with Lucy` (Lucy's paw), then dialog `Lucy says`. Close is `Close Lucy` or Escape. Sound chip `Hear the sound of letter P` does not unlock audio. Peek plates `Pan` / `Panda`. Play in the dialog is `Play letter P with Lucy. Tap to start sound.` |

`document.body.dataset.screen` is `home` · `faces` · `trail` · `pouch` · `stories` · `rhymes` · `color` · `case` · `picture` · `bonus` · `celebrate`. Use it to know which step you are on.

Two-tap match (case and picture). (1) tap a choice until `aria-pressed=true`. (2) tap the prompt. A wrong submit wobbles coral and clears the selection. Try another choice. Do not treat wobble as a hang. Nothing times out. Nothing punishes.

Bonus (`body[data-screen=bonus]`): Letter Hunt / ABC Order tiles are `Letter {glyph}, tap it if it is {letter}` or `Letter {glyph}`. Sound Sort is `Yes!` / `No`. `Skip to stars` appears after two misses or 20 seconds. Bonus misses never cost a star.

PIN for the Grown-Ups gate is `1234` (also printed in `app/README.md` for the cart). Wrong PIN clears. Nobody locks out.

Do not use `_flow.mjs`, `store.set*` from the console, or hash-only jumps as the proof of a kid path. Smoke URLs may **seed** settings (bonus off, named kid, pin). The **action** under test still has to be a user tap.

## Evidence

Write proof under `.cursor/skills/verify-ready-set-abc/artifacts/<feature-id>/`. Cleanup must leave this tree alone.

Proof standards:

- Exercise the real user path (roster face, that child's Home PLAY, a Letters & Phonics tile, the Grown-Ups keypad). Do not call `round.startRound()` from the console and call it verified.
- Capture the action **and** the resulting state, not only the final screen. That means: ARIA snapshot (or accessibility tree) **plus** a screenshot with **Ready Set ABC** visible, for at least the before-tap and after-tap moments that matter.
- Verify side effects next to what is visible. Stars live in `localStorage` key `rsabc.stars`. Who is playing is `rsabc.kid`. Pin is `rsabc.pinnedLetter`. Settings are `rsabc.settings`. Read them from the page after the tap. The Node `_flow.mjs` gate is not this proof.
- Record the feature id and the entry point (smoke query or tab path) with every artifact.
- There is no production network boundary to mock. Audio is Web Audio SFX plus optional voice clips. Silence is not a failure if the rest of the board is correct. Do not treat a missing Lucy recording as a broken round. Clips are still placeholders.
- If an entry point is unreachable, report the attempted URL/tap and the unmet precondition. Do not report a skipped path as verified through a different one.

Suggested filenames: `01-before.aria.txt`, `01-before.png`, `02-after.aria.txt`, `02-after.png`, `storage.json`.

## Cleanup

```
.cursor/skills/verify-ready-set-abc/bin/verify-rsabc cleanup
```

Stops the recorded pid. Leaves `artifacts/` in place. After cleanup, confirm those files still exist before handing the run over.

`_smoke.html?reset=1` wipes `rsabc.*` on **this origin only**. Use it to restore a clean tablet; it is not a substitute for stopping the server.

Never kill by process name. Never wipe `/tmp/rsabc-verify/server.log` until you have copied any failure you need into `artifacts/`.

## Helpers

All invocations assume repo root. The script is executable.

```
.cursor/skills/verify-ready-set-abc/bin/verify-rsabc launch
.cursor/skills/verify-ready-set-abc/bin/verify-rsabc doctor
.cursor/skills/verify-ready-set-abc/bin/verify-rsabc url
.cursor/skills/verify-ready-set-abc/bin/verify-rsabc smoke 'reset=1'
.cursor/skills/verify-ready-set-abc/bin/verify-rsabc smoke 'kid=k01'
.cursor/skills/verify-ready-set-abc/bin/verify-rsabc smoke 'kid=k01&play=P'
.cursor/skills/verify-ready-set-abc/bin/verify-rsabc cleanup
```

`smoke` prints a full URL against the running instance. Open that URL in the verification browser so localStorage lands on 4173, not on 8080.

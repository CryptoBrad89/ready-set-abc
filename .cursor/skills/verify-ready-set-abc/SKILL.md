---
name: verify-ready-set-abc
description: Drive the Ready Set ABC Pre-K phonics PWA in a real browser — launch an isolated static server, seed tablet state via _smoke.html, tap the kid path and Grown-Ups gate the way a classroom user would, and capture proof. Use when proving a UI change, a round/flow fix, or that Home, Play Cards, ABC Trail, Star Pouch, or Grown-Ups still work.
---

# Verify Ready Set ABC

Vanilla HTML/CSS/JS PWA in `app/`. No build, no login, no backend. Kids tap giant cards; grown-ups unlock a PIN gate. This skill is for the next agent: launch an isolated instance, drive the real screens, keep the proof.

Read `features/README.md` before driving. A proof that hits one convenient URL is incomplete when the map lists other entry points.

## Launch

From the repo root:

```
.cursor/skills/verify-ready-set-abc/bin/verify-rsabc launch
```

Ready when stdout contains `ready http://127.0.0.1:4173` (or `already running`). Default bind is `127.0.0.1:4173` serving `app/`. Override with `--port` or `RSABC_VERIFY_PORT`.

Teardown (instances and scratch only — never the evidence):

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

It is read-only. It must report: our pid alive, that pid owns the port, `GET /` is Ready Set ABC, `GET /js/version.js` contains `rsabc-shell-v38-el-beds`, `_smoke.html` answers, and the port is not 8000 or 8080. If it fails, stop driving. Launch a fresh instance or pick another port. Never drive an instance this helper did not start.

## Drive

Use a real browser (Cursor browser tools or CDP). Landscape viewport **1280×800 or 1366×768**. Portrait under 900px wide shows **Turn the tablet sideways** and blocks the app.

Seed tablet state by navigating to a smoke URL on **this** origin, then wait for `index.html`. Print the URL with:

```
.cursor/skills/verify-ready-set-abc/bin/verify-rsabc smoke 'classroom=0&bonus=off&play=A'
```

`_smoke.html?<query>` writes `rsabc.*` localStorage then `location.replace`s into the app. Query with no keys lists bookmarks — that index is not a play screen.

Prefer ARIA roles and accessible names over CSS, coordinates, or tab order.

Stable handles:

| What | Handle |
|---|---|
| App identity | heading `Welcome back, friend!` on Home; brand button name `Ready Set ABC — home. Hold for Grown-Ups.` |
| Play | button `Play letter P. Tap to start sound.` (mission card) |
| Tabs | `Home`, `Letters & Phonics`, `Lucy's Closet`, `Storybooks`, `Arcade` |
| Grown-Ups | button `Grown-Ups` → dialog `Grown-up check` → PIN **1234** (keys `1` `2` `3` `4`) or the sum on the card |
| Close gate | `Return to Letter Play` or Escape |
| Home from logo | click the brand (hold 3s opens the gate instead) |
| Case-match choice | button `Letter a, … as in Apple` or `Letter A, …` — hunt case is in the instruction (`little` vs `big`) |
| Complete match | button whose name contains `Tap here to complete the match` (or the CTA `Match A & a!` / `Check Aa`) |
| Picture choice | button `{Word}, starts with {phoneme}` — pick the word that starts with this letter |
| Celebrate skip | button `Skip the celebration` |
| Next letter | button whose name contains `Play Letter B` (or whichever letter is next) |
| Face pick | heading `Who is playing?`; face buttons named `Ava`, `Marcus`, … |
| Trail tile | `Letter A, Apple. … Play this letter.` |
| Lucy | image `Lucy the golden retriever` |
| Lucy hello | button `Talk with Lucy` (Lucy’s paw) → dialog `Lucy says`; close is `Close Lucy` or Escape. Sound chip `Hear the sound of letter P` does not unlock audio. Peek plates `Pan` / `Panda`. Play in the dialog is `Play letter P with Lucy. Tap to start sound.` |

`document.body.dataset.screen` is `home` · `faces` · `trail` · `pouch` · `case` · `picture` · `bonus` · `celebrate`. Use it to know which step you are on.

Two-tap match (case and picture): (1) tap a choice until `aria-pressed=true`, (2) tap the prompt. A wrong submit wobbles coral and clears the selection — try another choice, do not treat wobble as a hang. Nothing times out. Nothing punishes.

Bonus (`body[data-screen=bonus]`): Letter Hunt / ABC Order tiles are `Letter {glyph}, tap it if it is {letter}` or `Letter {glyph}`. Sound Sort is `Yes!` / `No`. `Skip to stars` appears after two misses or 20 seconds. Bonus misses never cost a star.

Classroom PIN for the Grown-Ups gate is `1234` (also printed in `app/README.md` for the cart). Wrong PIN clears. Nobody locks out.

Do not use `_flow.mjs`, `store.set*` from the console, or hash-only jumps as the proof of a kid path. Smoke URLs may **seed** settings (bonus off, named kid, pin). The **action** under test still has to be a user tap.

## Evidence

Write proof under `.cursor/skills/verify-ready-set-abc/artifacts/<feature-id>/`. Cleanup must leave this tree alone.

Proof standards:

- Exercise the real user path (Home `PLAY!`, a trail tile, a face, the Grown-Ups keypad). Do not call `round.startRound()` from the console and call it verified.
- Capture the action **and** the resulting state, not only the final screen. That means: ARIA snapshot (or accessibility tree) **plus** a screenshot with **Ready Set ABC** visible, for at least the before-tap and after-tap moments that matter.
- Verify side effects next to what is visible. Stars live in `localStorage` key `rsabc.stars`. Who is playing is `rsabc.kid`. Pin is `rsabc.pinnedLetter`. Settings are `rsabc.settings`. Read them from the page after the tap. The Node `_flow.mjs` gate is not this proof.
- Record the feature id and the entry point (smoke query or tab path) with every artifact.
- There is no production network boundary to mock. Audio is Web Audio SFX plus optional voice clips; silence is not a failure if the rest of the board is correct. Do not treat a missing Lucy recording as a broken round — clips are still placeholders.
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
.cursor/skills/verify-ready-set-abc/bin/verify-rsabc smoke 'classroom=0&bonus=off&play=A'
.cursor/skills/verify-ready-set-abc/bin/verify-rsabc cleanup
```

`smoke` prints a full URL against the running instance. Open that URL in the verification browser so localStorage lands on 4173, not on 8080.

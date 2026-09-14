# Product shell proof

Historical drive used origin `http://127.0.0.1:4174` and pin `rsabc-shell-v36-login-satpin`. Default verify port is now **4173**. Current shell pin on origin/main is `rsabc-shell-v40-nudge-home`. Do not bump the pin in this unit. Do not drive 8000 or 8080.

New drives use `.cursor/skills/verify-ready-set-abc/bin/verify-rsabc launch` then `doctor`. Leftover PNGs under this folder remain historical evidence. They are not a queue.

## Passed (still true)

- Roster-first. Empty hash, empty `rsabc.*`, heading `Who is playing?`, `body[data-screen]=faces`. `02-roster-first-v36.png`.
- Child tap to Home. Ava → `Welcome back, Ava!`, hash `#/home`, `rsabc.kid` k01, `rsabc.session` child. Not a round. `03-ava-home.png`.
- SATPIN on Home. Level 1 line `S · A · T · P · I · N`. Mission Play letter P. `03-ava-home.png`.
- PIN 1234 on the pad. Tap 1 2 3 4, sheet heading Grown-Ups. `04-pin-gate.png`, `05-grownups-unlocked.png`. Header unlock does not switch session (still child / Ava).
- Keyboard PIN. Header Grown-Ups, Digit1 then Digit2 Digit3 Digit4. Sheet heading Grown-Ups. Measured on the v36 drive.
- Assigned-letter child. Class tab, Miles work mode Assigned, letters `S O J`. Miles tap → `#/home`, `Welcome back, Miles!`, `S · O · J`, PLAY `Play letter S`. `08-miles-assigned-home.png`. Later leftovers replaced Cloud 1 copy on this path with Your letters. See `artifacts/home-cloud1/NOTES.md` and `artifacts/home-level1/NOTES.md`.
- Locked Arcade wobble. Tab `Arcade, locked` stays on `#/home`. Puppy Treat Match stays on Home, CTA Locked. `09-arcade-lock-wobble.png`.
- `#/arcade` with lock. Lands on Arcade heading. Does not start a round. `10-arcade-hash-locked.png`.

## Shipped after this NOTES was first written

These four sat under "Not yet closed in code" on disk. All four shipped in the comic-hub squash and follow-ups. Do not redo them.

- CSV kid rows export and import `workMode`, `assignedLetters`, and `arcadeLocked`. `app/js/csv.js` columns. `_flow.mjs` asserts the Miles row. [PR 3](https://github.com/CryptoBrad89/ready-set-abc/pull/3).
- SAT blend on assigned Miles is `Your letters S, O, J`. No Cloud 1 tag. `artifacts/home-cloud1/NOTES.md`.
- Letters & Phonics consults `workLetters`. Assigned board is S O J. Closed `#/letter/P` stays on trail. `artifacts/assigned-trail/NOTES.md`, `artifacts/letter-hash/NOTES.md`, `artifacts/assigned-trail-chrome/NOTES.md`.
- `#/letter/P` with empty session is the roster (`Who is playing?`), not meet. `app.js` calls `needsRoster()` before `startRound`. `11-letter-skip-roster.png` is a before shot.

Also shipped, so this NOTES no longer tracks them as bugs:

- Roster footer no longer prints `null`. `faces.js` only appends Back when `hasSession()`.
- Roster chrome sets `who: false`, so the FRIEND who-chip is off on login.
- `#rotate` gets `aria-hidden="true"` and `inert` in landscape. `app.js` `syncRotate`.
- Leftover 11 choose/listen nudge. [PR 4](https://github.com/CryptoBrad89/ready-set-abc/pull/4).
- Unused Home `previewLetters` binding. [PR 5](https://github.com/CryptoBrad89/ready-set-abc/pull/5).
- Shell pin v40. [PR 6](https://github.com/CryptoBrad89/ready-set-abc/pull/6).

## Do not rebuild

Leftovers 1 to 14, leftover 11, Home preview, and Lucy's Closet compositor are closed. SATPIN Ava still names Cloud 1, open cloud, and Level 1. That is correct. Open clouds stays on SATPIN Play. Keep `satCard` named `satCard`.

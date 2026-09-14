# Product shell proof

Origin `http://127.0.0.1:4174` (fresh, no cached service worker). Viewport 1280×800. Pin `rsabc-shell-v36-login-satpin`.

Do not drive `http://127.0.0.1:4173` for this pin. That origin still served `rsabc-shell-v35-stitch-hub` from an old service worker and skipped roster.

Smoke `_smoke.html?reset=1`. Doctor OK on pid 75960.

## Passed

- Roster-first. Empty hash, empty `rsabc.*`, heading `Who is playing?`, `body[data-screen]=faces`. `02-roster-first-v36.png`.
- Child tap to Home. Ava → `Welcome back, Ava!`, hash `#/home`, `rsabc.kid` k01, `rsabc.session` child. Not a round. `03-ava-home.png`.
- SATPIN on Home. Level 1 line `S · A · T · P · I · N`. Mission Play letter P. `03-ava-home.png`.
- PIN 1234 on the pad. Grown-Up Check `4 + 4 = ?`, tap 1 2 3 4, sheet heading Grown-Ups. `04-pin-gate.png`, `05-grownups-unlocked.png`. Header unlock does not switch session (still child / Ava).
- Keyboard PIN. Header Grown-Ups, `keydown` Digit1 then Digit2 Digit3 Digit4. Display went `•` then sheet heading Grown-Ups. Measured.
- Assigned-letter child. Class tab, Miles work mode Assigned, letters `S O J`, Arcade switch released. Miles tap → `#/home`, `Welcome back, Miles!`, Level 1 `S · O · J`, PLAY `Play letter S` (P remapped). `08-miles-assigned-home.png`.
- Locked Arcade wobble. Tab `Arcade, locked` stays on `#/home`, class `tab is-locked wobble`. Puppy Treat Match stays on Home, CTA Locked. `09-arcade-lock-wobble.png`.
- `#/arcade` with lock. Lands on Arcade heading, Lucy `Arcade is locked. Ask a grown-up.`, play `Arcade, locked`. Does not start a round. `10-arcade-hash-locked.png`.

## Closed after writer (re-proof on 4174)

Hard-reset `_smoke.html?reset=1` after unregistering the service worker (pin stayed v36). Same origin, same viewport.

- Roster. No text node `null`. `#who-slot` empty. No Friend chip. `12-roster-fixed.png`.
- `#rotate` at 1280×800. `aria-hidden="true"`, `inert=true`, `display:none`. Cursor snapshot still lists the string. The attributes are set.
- `#/letter/P` with empty session. `body[data-screen]=faces`, heading `Who is playing?`, no meet. Hash stays `#/letter/P`. `13-letter-p-roster.png`.
- Class path. Miles work mode Assigned, letters `S O J`, Arcade switch released (locked). Kid row in `rsabc.roster` is `{ workMode: assigned, assignedLetters: [S,O,J], arcadeLocked: true }`.
- CSV after that save. Kid line `kid,,,k24,Miles,…,assigned,S O J,true,…`. Header includes `workMode,assignedLetters,arcadeLocked`.
- Miles Home. `Welcome back, Miles!` PLAY `Play letter S`. Blend aria `Open cloud letters S, O, J`. Arcade tab `Arcade, locked`. Puppy Treat Match locked. `15-miles-home-soj.png`.
- Trail. S playable. A T P I N `is-locked`. Tap A stays `#/trail`, no round. `16-miles-trail-locked.png`.
- Locked Arcade tab from trail stays `#/trail`. `#/arcade` with lock. Heading Arcade, Lucy `Arcade is locked. Ask a grown-up.`, card Locked. Hash does not bounce. `17-miles-arcade-locked.png`.

## Still open (not this slice)

None for assigned work on the trail board. Other clip-less `audio.speak` callers are a different leftover.

## Bugs seen (reproduced, then fixed)

- Roster footer printed the word `null` under Miles. `faces.js` called native `root.append(..., hasSession() ? back : null)`. `Element.append(null)` became the text `null`. Fixed. Was `06-roster-bugs.png`.
- Roster showed a FRIEND who-chip. `paintWho` now clears `#who-slot` when `chrome.who === false`.
- `#rotate` had `display:none` with no `aria-hidden` / `inert`. Now both are set on landscape.

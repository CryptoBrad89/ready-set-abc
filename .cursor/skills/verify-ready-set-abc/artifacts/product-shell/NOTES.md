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

## Not yet closed in code

- CSV drop of work fields. `csv.js` kid rows still omit `workMode`, `assignedLetters`, `arcadeLocked`. Import would fall back to SATPIN / Arcade open.
- SAT blend card still says `Sounds S, A, T` / `Open cloud letters S, A, T` on Miles Home. Assigned path is S O J.
- Trail still starts any open-cloud letter. It does not consult `workLetters`.
- `#/letter/P` with empty session starts meet. `rsabc.kid` null, `rsabc.session` null, `body[data-screen]=meet`. Skips roster. `11-letter-skip-roster.png`.

## Bugs seen (reproduced)

- Roster footer prints the word `null` under Miles. Root cause measured: `faces.js` calls native `root.append(..., hasSession() ? back : null)`. `Element.append(null)` becomes the text `null`. `06-roster-bugs.png`.
- Roster still shows a FRIEND who-chip. `paintWho` always paints. `chrome.who: false` only switches button vs div. `who-slot` text `friend Pre-K`.
- Accessibility tree still names `Turn the tablet sideways` at 1280×800. `#rotate` is `display:none` with no `aria-hidden` / `inert`.

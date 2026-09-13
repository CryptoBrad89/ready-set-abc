feature: trail-lucy
entry: Miles session, assigned S O J, Letters & Phonics
origin: http://127.0.0.1:4174
pin: rsabc-shell-v39-mute-dots
viewport: 1280×800 landscape

Before
- Lucy: Tap letter A to start. Cloud 1 is open!
- Chip: Next up: A
- Letter A, locked. is aria-current
- Letter S, Sun. Play this letter. 0 of 4. is open, not current
- Hash from leftover letter-gate still #/letter/P on that shot

After (PRECACHE, then index.html?v=trail-lucy#/trail)
- Lucy: Tap letter S to start. Cloud 1 is open!
- Chip: Next up: S
- Letter S, Sun. Starts next. Play this letter. 0 of 4. is aria-current
- Letter A, locked. is not current
- Tap locked A stays #/trail

Nearby
- Miles Home still Play letter S
- Ava SATPIN trail still Tap letter A (cursor A, all six Cloud 1 tiles open)

_flow.mjs FAIL then ALL-OK for "trail next letter runs playStartLetter through startLetter"
node _check.mjs ALL-OK

Left for later
- Other clip-less audio.speak callers (match, faces, Home Lucy)

feature: arcade-start-letter
origin: http://127.0.0.1:4174
entry: Miles session, assigned S O J, Arcade unlocked
viewport: 1280x800
pin: rsabc-shell-v39-mute-dots (no bump)

Before
- Home PLAY: Play letter S.
- Arcade: Start match for A. Lucy Tap the As with me. FIND LETTER A.

After (Get update, then _smoke.html?kid=k24&v=arcade2)
- Arcade: Start match for S. Lucy Tap the Ss with me. FIND LETTER S.
- Start Match opens choose with Lucy wants S! Tap the S.

Nearby
- Ava SATPIN Home PLAY still P.
- Ava Arcade still Start match for A.

Left out
- stage.js choose/listen nudge stays uncommitted.
- Open clouds row stays.
- Unused Home preview binding stays.

_flow.mjs FAIL then ALL-OK
- arcade start letter runs playStartLetter through startLetter
- assigned Arcade starts S, not the SATPIN cursor
- assigned Arcade does not start SATPIN A
- assigned Arcade Lucy names S
- SATPIN Arcade still names the open-cloud letter

node _check.mjs ALL-OK

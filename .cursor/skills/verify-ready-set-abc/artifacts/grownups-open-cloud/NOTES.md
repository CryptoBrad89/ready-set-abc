feature: grownups-open-cloud
entry: Miles session, assigned S O J, Grown-Ups Play
origin: http://127.0.0.1:4174
pin: rsabc-shell-v39-mute-dots
viewport: 1280×800 landscape

Before
- Home PLAY: Play letter S. Tap to start sound.
- Blend: Your letters S, O, J
- Grown-Ups Letter of the day: Not pinned — next PLAY starts the first unfinished letter in the open cloud (S).

After (Get update, then _smoke.html?kid=k24)
- Home PLAY still S.
- Grown-Ups Letter of the day: Not pinned — next PLAY starts the first unfinished of your letters (S).
- Family note still Ss / Sun.

Nearby
- Ava SATPIN Home PLAY still P. letterOfDayNote still names the open cloud (A).

Left out
- Open clouds row stays. It is the tablet SATPIN unlock, not Letter of the day copy.
- stage.js choose/listen nudge stays uncommitted.

_flow.mjs FAIL then ALL-OK
- assigned Grown-Ups Play does not say open cloud
- assigned Grown-Ups Play names your letters
- SATPIN Grown-Ups Play still names the open cloud

node _check.mjs ALL-OK

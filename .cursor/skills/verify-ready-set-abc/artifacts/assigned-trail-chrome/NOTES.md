feature: assigned-trail-chrome
entry: Miles session, assigned S O J, Letters & Phonics
origin: http://127.0.0.1:4174
pin: rsabc-shell-v39-mute-dots
viewport: 1280×800 landscape

Before
- Board: S O J (leftover 4).
- Lucy: Tap letter S to start. Cloud 1 is open!
- Islands: Cloud 1 through Revision.
- Footer: Tap a letter in the open cloud.

After (PRECACHE, then index.html?v=trail-chrome2#/trail)
- Lucy: Tap letter S to start.
- Islands: none.
- Footer: Tap one of your letters.
- Board still S O J. Next up: S.

Nearby
- Ava SATPIN: Tap letter A to start. Cloud 1 is open! Five islands. Footer Tap a letter in the open cloud. Six tiles.

_flow.mjs FAIL then ALL-OK
- assigned trail Lucy does not say Cloud 1 is open
- assigned trail does not draw SATPIN cloud islands
- assigned trail foot does not say open cloud
- SATPIN trail Lucy still names the open cloud
- SATPIN trail still draws the cloud path
- SATPIN trail foot still names the open cloud

node _check.mjs ALL-OK

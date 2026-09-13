feature: grownups-next-play
entry: Miles session, assigned S O J, Grown-Ups Play
origin: http://127.0.0.1:4174
pin: rsabc-shell-v39-mute-dots
viewport: 1280×800 landscape

Before
- Home PLAY: Play letter S. Tap to start sound.
- Lucy: Let's find words that start with S!
- Grown-Ups Letter of the day: Not pinned — next PLAY starts the first unfinished letter in the open cloud (J).
- Family note: Written for Jj. J is for Juice.

After (PRECACHE, then index.html?v=gu-next#/home)
- Home PLAY still S.
- Grown-Ups Letter of the day: open cloud (S).
- Family note: Written for Ss. S is for Sun. Copy family note — S is for Sun.

Nearby
- Ava SATPIN Home PLAY still P. Grown-Ups unpinned still names A (open-cloud cursor).

_flow.mjs FAIL then ALL-OK
- previewLetters runs playStartLetter through startLetter so Grown-Ups names what PLAY opens
- Grown-Ups next PLAY letter matches Home PLAY for assigned work, not catalog-order J
- family note for Miles names S
- SATPIN unpinned Grown-Ups still names the open-cloud letter

node _check.mjs ALL-OK

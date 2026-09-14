feature: letter-hash
entry: Miles session, assigned S O J, hash #/letter/P
origin: http://127.0.0.1:4174
pin: rsabc-shell-v39-mute-dots
viewport: 1280×800 landscape

Before
- isLetterOpen(P)=false, isLetterOpen(S)=true
- hash #/letter/P → body[data-screen]=meet, hanging P, round letters P S T
- Trail tiles already refuse P

After
- hash #/letter/P → body[data-screen]=trail, heading Letters & Phonics, Letter P locked, no meet
- hash #/letter/S → meet S
- hash #/letter/9 → trail (stray)
- Trail tap Letter P, locked. stays #/trail

_flow.mjs FAIL then ALL-OK for "#/letter consults isLetterOpen before startRound"
node _check.mjs ALL-OK

Left for later
- Other clip-less audio.speak callers (match, faces, Home Lucy)

feature: play-round
entry: http://127.0.0.1:4173/_smoke.html?reset=1&classroom=0&bonus=off&play=A
viewport: 1280x800 landscape
shell: rsabc-shell-v25-az-art
instance: http://127.0.0.1:4173 (verify-rsabc doctor OK)

Actions
- Landed on case match for A (hunt: big letter). Choice "Letter A, /æ/ as in Apple" then prompt "Little Letter a. Tap here to complete the match."
- Picture match: "Ambulance, starts with /æ/" then "Letter Pair Aa. Tap here to complete the match."
- Celebrate: "Perfect Match! 3 of 3 Stars", trophy "Aa is for Ambulance", Party bows unlocked.
- Next: "Next Adventure Play Letter B" opened case match for B (Round 2/3, /b/ as in Ball).

Side effect
- localStorage rsabc.stars = {"_device":{"A":3}}
- rsabc.settings bonusMode=off
- rsabc.classroom=false

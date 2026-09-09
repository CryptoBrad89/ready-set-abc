# Phase 1 — PWA skeleton (BUILD NOW)

Read  and  for product truth. Coding bar: tight vanilla HTML/CSS/JS — no frameworks.

## Goal
Playable skeleton under :

1. PWA: index.html, manifest.webmanifest, service worker precache; landscape-first CSS.
2. Kid shell stubs with real navigation:
   - Pick-me: ~20-25 face tiles from seeded roster JSON
   - Home: Lucy doghouse + closet stub
   - Map: A-Z board, 26 tiles visible no scroll; A-D awake, E-Z asleep
   - Letter stub: tap A -> placeholder round -> End card
3. Teacher suite: long-press logo -> PIN 1234 -> Class grid stub, Content (pin letter), Device (mode + cache stub)
4. Modes: center / small-group / whiteboard CSS flag
5. Offline stub: Set up this device registers SW + caches shell
6. Data: data/roster.json, data/letters.json; localStorage for pin/letter/kid

## Constraints
Vanilla only. No accounts. No full case/picture match (phase 2).

## Deliverables
Files under app/, short README with run + PIN. Success = pick a face, see map A-D, open teacher PIN suite.

feature: home-cloud1
origin: http://127.0.0.1:4174
entry: Miles session, assigned S O J, Home
viewport: 1280×800
pin: rsabc-shell-v39-mute-dots (no bump)

Before
- Welcome back, Miles. PLAY letter S. Level 1 S · O · J.
- Gold chip Cloud 1.
- Blend tag Cloud 1. Aria Open cloud letters S, O, J.
- Footer Cloud 1 · 0/24.

After (Grown-Ups Device Get update, then _smoke.html?kid=k24)
- Gold chip gone.
- Blend aria Your letters S, O, J. No Cloud 1 tag.
- Footer Your letters · 0/12.
- PLAY still letter S. Tiles still S O J.

Nearby
- Ava SATPIN: gold chip Cloud 1. Blend tag Cloud 1. Aria Open cloud letters S, A, T. Footer Cloud 1 · 0/24.

_flow.mjs FAIL then ALL-OK
- assigned Home does not tag Cloud 1
- assigned Home blend does not say open cloud
- assigned Home foot does not say Cloud 1
- SATPIN Home still names Cloud 1
- SATPIN Home blend still says open cloud
- SATPIN Home foot still names Cloud 1

node _check.mjs ALL-OK

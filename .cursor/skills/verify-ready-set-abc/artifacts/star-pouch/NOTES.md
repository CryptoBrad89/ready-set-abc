# Star Pouch mix-and-match

Feature: `star-pouch` / `pouch-wear`
Entry: `http://127.0.0.1:4173/_smoke.html?reset=1&classroom=0&stars=A3,B3,C3,D3&to=#/pouch`
Viewport: 1280x800. Shell: `rsabc-shell-v28-closet`.

Tapped Party bows, then Ball cap. Did not smoke the outfit on.

Measured after both taps:

- `localStorage['rsabc.outfit']` is `["bows","cap"]`
- Lucy `img.lucy-photo` src is `art/lucy/lucy-cap.jpg`
- Overlay `art/lucy/layer-headband.png` (`.lucy-layer--bows`)
- Both treat buttons `aria-pressed=true`

Proof: `01-pouch.png` (plain Lucy), `02-bows.png` (bows plate), `02-worn.png` (cap plate plus bows).

# Coloring Canvas

Coloring Canvas is a short tap-to-fill play on Home. It is not meet, choose, listen, or payoff, and it is not Lucy's Picnic Day or Rhymes & Songs. Ava colors the same Lucy page, plus letter P.

## Sub-features

- `color-home` opens from Home **Coloring Canvas**.
- `color-pick` offers **Color Lucy** and **Color letter P**. No scroll.
- `color-paint` fills a spot after a crayon tap, then a spot tap.
- `color-done` returns to the page picker with **Done coloring**.
- `color-back` keeps the fill after Home and a return.

## How to get to it (user POV)

- On Ava Home, tap **Coloring Canvas**.
- Smoke `_smoke.html?kid=k01&to=%23/color`.

## Driving it with the browser

Preconditions:

- `verify-rsabc doctor` reports `http://127.0.0.1:4173` and shell `rsabc-shell-v43-voice-clips`.
- Viewport is landscape 1280×800.
- Ava is playing. Navigate to the URL from `verify-rsabc smoke 'reset=1&kid=k01'`.

- **Home card.** Heading `Welcome back, Ava!`. Card `Coloring Canvas`. Subcopy `Tap a crayon, then tap a picture.` CTA `Color now`. It does not say Coming next week. Choose that card.
- **Picker.** Heading `Coloring Canvas`. Lucy says `Pick a page to color!`. Buttons `Color Lucy` and `Color letter P`. `body[data-screen]` is `color`. No `Coming next week`. Snapshot `artifacts/coloring-canvas/01-pick.aria.yml`.
- **Lucy page.** Choose `Color Lucy`. Chip `Lucy`. Lucy says `Tap a crayon, then tap a spot!`. Buttons include `Yellow crayon` and `Lucy's head`. Choose `Sky crayon`, then `Sky`. Choose `Done coloring`.
- **Back.** Heading `Coloring Canvas` picker returns. Choose `Color Lucy` again. The sky is still sky blue.
- **Letter page.** From the picker, choose `Color letter P`. Chip `Letter P`. Comfortaa letter P is on the page.

## Gotchas

- Kid screens cannot scroll. If the page scrolls, the recipe failed.
- This is not Picnic Day, not Rhymes & Songs, and not the four-beat round.
- Isolated name / phoneme / word clips may be silent. Coloring uses SFX only. Do not use TTS.
- `#/coming/color` opens the same picker.

# Lucy's Picnic Day

Storybooks is Lucy's Picnic Day, a short picture story for this letter. It is not meet, choose, listen, or payoff. SATPIN Ava reads P. Assigned Miles reads S.

## Sub-features

- `picnic-home` opens from Home **Lucy's Picnic Day**.
- `picnic-tab` opens from the **Storybooks** tab.
- `picnic-pages` pages one picture at a time. Next page / Previous page. No scroll.
- `picnic-letter` uses the same letter as Home PLAY (`startLetter('P')`).
- `picnic-lucy` keeps Lucy on every page.

## How to get to it (user POV)

- On Ava Home, tap **Lucy's Picnic Day**.
- Tap the **Storybooks** tab.
- Smoke `_smoke.html?kid=k01&to=%23/stories`.

## Driving it with the browser

Preconditions:

- `verify-rsabc doctor` reports `http://127.0.0.1:4173` and shell `rsabc-shell-v40-nudge-home`.
- Viewport is landscape 1280×800.
- Ava is playing. Navigate to the URL from `verify-rsabc smoke 'reset=1&kid=k01'`.

- **Home card.** Heading `Welcome back, Ava!`. Card `Lucy's Picnic Day`. Subcopy `A tiny picture story for this letter.` Choose that card.
- **Cover.** Heading `Lucy's Picnic Day`. Copy `Lucy packs a picnic for P.` Lucy is on the page. `body[data-screen]` is `stories`. Button `Next page`. No `Previous page`. No four-word payoff grid. Snapshot `artifacts/picnic-day/01-cover.aria.yml`.
- **Page.** Choose `Next page`. Copy `Pig is at the picnic.` Button `Pig`. Choose `Next page` through The End.
- **The End.** Heading `The End`. Copy `P is in this picnic!` No `Next page`. Lucy is still there.
- **Tab.** From Home, choose tab `Storybooks`. Cover returns.

## Gotchas

- Ava SATPIN picnic is P, same as PLAY. It is not S (first open SATPIN letter).
- Assigned Miles picnic is S after Class sets S O J.
- Kid screens cannot scroll. If the page scrolls, the recipe failed.
- Rhymes & Songs still says Coming next week. That is a different card.
- Isolated word clips may be silent. Silence plus Lucy's bubble is not a failure. Do not use TTS.

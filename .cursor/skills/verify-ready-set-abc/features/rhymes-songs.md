# Rhymes & Songs

Rhymes & Songs is a short Lucy song on Home. It is not meet, choose, listen, or payoff, and it is not Lucy's Picnic Day. Ava plays the same song as Miles.

## Sub-features

- `rhymes-home` opens from Home **Rhymes & Songs**.
- `rhymes-play` starts the song with **Play song**. Lines light up one at a time. No scroll.
- `rhymes-end` offers **Play song again** after the last line.
- `rhymes-lucy` keeps Lucy on idle, singing, and the end.

## How to get to it (user POV)

- On Ava Home, tap **Rhymes & Songs**.
- Smoke `_smoke.html?kid=k01&to=%23/rhymes`.

## Driving it with the browser

Preconditions:

- `verify-rsabc doctor` reports `http://127.0.0.1:4173` and shell `rsabc-shell-v43-voice-clips`.
- Viewport is landscape 1280×800.
- Ava is playing. Navigate to the URL from `verify-rsabc smoke 'reset=1&kid=k01'`.

- **Home card.** Heading `Welcome back, Ava!`. Card `Rhymes & Songs`. Subcopy `A short Lucy song. Tap Play and sing along.` CTA `Sing along`. It does not say Coming next week. Choose that card.
- **Idle.** Heading `Rhymes & Songs`. Chip `Lucy the Pup`. Copy includes `L is for Lucy, come sing with me.` Lucy is on the page. `body[data-screen]` is `rhymes`. Button `Play song`. No `Coming next week`. Snapshot `artifacts/rhymes-songs/01-idle.aria.yml`.
- **Music on.** Header `Music` is a mute toggle (`aria-pressed` true means on). Turn Music on before the first Play if it is off. Default Music is off.
- **Sing.** Choose `Play song`. The keeper track plays on the Music channel. One line is current. Chip `1 / 5`. Lucy is still there. No `Play song` while it sings. Wait through the five lines.
- **The end.** Lucy says `Sing it again?`. Button `Play song again`.
- **Music mute.** Turn Music off. Choose `Play song again`. Lines still light. The song does not play. Voice mute and SFX mute are not this check.

## Gotchas

- Kid screens cannot scroll. If the page scrolls, the recipe failed.
- This is not Picnic Day and not the four-beat round. Storybooks still opens Lucy's Picnic Day.
- Isolated name / phoneme / word clips may be silent. The song uses on-screen lines plus Music / SFX. Do not use TTS.
- Coloring Canvas is its own Home card.

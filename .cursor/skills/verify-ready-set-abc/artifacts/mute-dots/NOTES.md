# Sound tab mutes match header

- Origin: `http://127.0.0.1:4174`
- Seed: `_smoke.html?reset=1&classroom=0&bonus=off`, viewport 1280×800
- Pin: `rsabc-shell-v39-mute-dots`

## Before (v38, prior drive)

Sound-tab SFX off. `store.getAudio().sfx` was false. Header Sound effects stayed `aria-pressed=true`.

## After

Sound-tab SFX off. Header Sound effects `pressed=false`. Store `{ music: false, sfx: false, voice: true }`. Sheet switches matched.

Sound-tab Voice off. Header Lucy voice `pressed=false`. Store `{ music: false, sfx: false, voice: false }`.

Footer: `READY SET ABC · Pre-K Phonics with Lucy · rsabc-shell-v39-mute-dots`.

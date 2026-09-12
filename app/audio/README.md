# Lucy's voice clips (empty on purpose)

Nothing is recorded yet. Names, letter sounds, and words stay silent until a
clip is mapped. Lucy’s lines still show on screen. The success jingle is SFX.

`../data/audio.json` is the recording checklist. Each of the **128** clip ids
is listed there as a **silent placeholder** (`null`): nothing is fetched, so
nothing 404s offline, and the file doubles as the script.

| Ids | How many | What Lucy says |
|---|---|---|
| `name-A` … `name-Z` | 26 | the letter **name**, warm and short — “A!” |
| `phoneme-A` … `phoneme-Z` | 26 | the **sound**, stretched — `ah`, `buh`, `kuh`. **Never the name.** |
| `word-<L>-<id>` | 60 | that picture's word on its own — “Apple!” (A–D, the awake letters) |
| `word-A` … `word-D` | 4 | one fallback per letter, used when the per-picture clip is missing |
| `cheer`, `cheer-1` … `cheer-6` | 7 | the celebration lines, in `CHEERS` order |
| `nudge`, `nudge-1` … `nudge-4` | 5 | the try-again lines, in `NUDGES` order |

## Ship one clip

1. Record it. Keep it under about 2 seconds; a clip that stalls is let go of
   after 8s so the music duck cannot stick.
2. Drop the file in this folder (`app/audio/`). `.m4a`, `.mp3`, `.ogg`, `.wav`.
3. Move its id out of `placeholders` in `data/audio.json` into `clips`, with
   the bare filename as the value: `"phoneme-A": "lucy-sound-a.m4a"`.
4. Add `audio/lucy-sound-a.m4a` to `SHELL` in `sw.js`.
5. Bump `VERSION` in `sw.js` and `APP_VERSION` in `js/version.js` together, so
   the classroom tablets pull it on the next **Get update**.
6. `node _check.mjs` — it fails if a mapped clip has no file or is not pinned.

Anything still unmapped stays silent (on-screen line only), so a
half-recorded folder is a perfectly good folder.

## The one rule

`name-` / `phoneme-` / `word-` are three channels, not three spellings of the
same thing. A `phoneme-` clip must say the **sound**. If it points at the same
file as that letter's `name-` clip, `js/audio.js` throws it away rather than
playing it — saying “A” on a letter-choice tap is a ship-blocker, not a typo.

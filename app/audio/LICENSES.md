# Audio licences

`music-loop.wav` and the UI hits `sfx-tap.wav`, `sfx-select.wav`,
`sfx-right.wav`, `sfx-wrong.wav`, `sfx-star.wav`, `sfx-pop.wav`, and
`sfx-woof.wav` are ElevenLabs beds, converted to 22.05 kHz mono 16-bit
WAV by `bake-beds.py`. Hits are Sound Effects v2 (`eleven_text_to_sound_v2`).
The loop is Music v2 (`eleven_music_v2`), instrumental, take
`Sn29nmIdcNWtMYW3nqBc`. Peak and loop-seam numbers live in `bake-beds.py`,
not here. No speech.

`sfx-cheer.wav` is ElevenLabs Sound Effects v2 (`eleven_text_to_sound_v2`).
Instrumental xylophone chime. No speech. `bake-beds.py` does not rewrite it.

`lucy-cheer-1.mp3` through `lucy-cheer-6.mp3` and `lucy-nudge-1.mp3`
through `lucy-nudge-4.mp3` are ElevenLabs multilingual v2
(`eleven_multilingual_v2`), voice Flicker (`piI8Kku0DcvcL6TTSeQt`).
MPEG layer III, 128 kbps, 44.1 kHz, mono, under 2s.

Picture **words** (`lucy-word-*.mp3`) use the same Flicker voice and model.
Letter **names** are not shipped as ElevenLabs — `name-*` stays a silent
placeholder until Bradley records. Isolated **phonemes**
(`lucy-phoneme-a.mp3` … `lucy-phoneme-z.mp3`) are original kid-voice
recreations copied from `reference/Starfall/audio/{A-Z}/phoneme.mp3`.
They are not ElevenLabs and not a website rip; the folder name is only
Bradley’s pronunciation reference. Isolated phonemes are never TTS.

`lucy-the-pup-l-for-lucy.mp3` is ElevenLabs Music v2 (`eleven_music_v2`),
custom lyrics, Bradley's keeper take. MPEG layer III, 192 kbps, 48 kHz,
stereo, ~20s. Vocals ~16s. Music channel, not Voice.

Never scrape Logic of English, Starfall, or other commercial phonics sites.

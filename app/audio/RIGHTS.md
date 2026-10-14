# Audio and Lucy video rights inventory

Facts from this repo only. Where classroom redistribution is not documented here, status is **not granted yet**.

## Letter sounds and names (`lucy-phoneme-*.mp3`, `lucy-name-*.mp3`)

- Kid-voice recreations copied from the local Starfall reference folder (`reference/Starfall/audio/{A-Z}/`) into `app/audio/` per `.cursor/rules/voice-audio.mdc`.
- The reference folder is gitignored and is **not** shipped with the app.
- Classroom/offline redistribution: **not granted yet** (Starfall-derived recreations).

## Picture words (`lucy-word-*.mp3`)

- Generated with ElevenLabs voice **Flicker** (`piI8Kku0DcvcL6TTSeQt`, model `eleven_multilingual_v2`) per workspace voice rules.
- Classroom/offline redistribution: **not granted yet** (confirm against ElevenLabs terms for generated clips).

## Beds and song

- `music-loop.wav`, SFX WAVs, and mapped cheer/nudge MP3s ship from `app/audio/` as listed in `data/audio.json`.
- `lucy-the-pup-l-for-lucy.mp3` is the Rhymes & Songs track on the music bus.
- Composition/recording rights for shipped beds: **not granted yet** unless named in `audio/LICENSES.md`.

## Lucy idle and talk videos (`art/lucy/idle.mp4`, `art/lucy/talk.mp4`)

From PR #15 (Ready Set ABC Lucy clips):

| Asset | Generator | Generation id |
| --- | --- | --- |
| Idle loop | Google Omni `gemini-omni-1.1-flash` | `Qcpda3pd7bQ1RFmLsqLG` |
| Talk loop | HeyGen Avatar 4 | `VkKcg4bpwQU0ixLc6PpK` |

- Offline PWA distribution to schools: **not granted yet** (confirm Google/Omni and HeyGen license terms).

## What this file is not

- Not legal advice. It is an engineering checklist so deploy and audit do not rely on memory.

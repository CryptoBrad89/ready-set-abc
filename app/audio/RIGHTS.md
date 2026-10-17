# Audio and Lucy video rights inventory

Facts drawn from this repo only. Unknown permission fields are marked **Bradley to confirm**.

## Letter sounds and names (`lucy-phoneme-*.mp3`, `lucy-name-*.mp3`)

- Source workflow: kid-voice recreations copied from the local Starfall reference folder (`reference/Starfall/audio/{A-Z}/`) into `app/audio/` per `.cursor/rules/voice-audio.mdc`.
- That reference folder is gitignored and is **not** shipped with the app.
- **Bradley to confirm:** rights to use and distribute these recreations in a classroom PWA.

## Picture words (`lucy-word-*.mp3`)

- Mapped words are spoken with ElevenLabs voice **Flicker** (`piI8Kku0DcvcL6TTSeQt`, model `eleven_multilingual_v2`) per workspace voice rules.
- **Bradley to confirm:** ElevenLabs terms for classroom/offline redistribution of generated clips.

## Beds and song

- `music-loop.wav`, SFX WAVs, and any mapped cheer/nudge MP3s ship from `app/audio/` as listed in `data/audio.json`.
- **Bradley to confirm:** composition/recording rights for any non-generated beds.

## Lucy idle and talk videos (`art/lucy/idle.mp4`, `art/lucy/talk.mp4`)

From PR #15 (Ready Set ABC Lucy clips):

| Asset | Generator | Generation id |
| --- | --- | --- |
| Idle loop | Google Omni `gemini-omni-1.1-flash` | `Qcpda3pd7bQ1RFmLsqLG` |
| Talk loop | HeyGen Avatar 4 | `VkKcg4bpwQU0ixLc6PpK` |

- **Bradley to confirm:** Google/Omni and HeyGen license terms for offline PWA distribution to schools.

## What this file is not

- Not legal advice. It is an engineering checklist so deploy and audit do not rely on memory.

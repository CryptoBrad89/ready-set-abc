# ElevenLabs music and hits

- Origin: `http://127.0.0.1:4174` after unregistering `rsabc-shell-v37-lucy-voice` and both caches.
- Seed: `_smoke.html?reset=1&classroom=0&bonus=off`, viewport 1280×800.
- Doctor pid-liveness failed in the sandbox. `GET /` and `js/version.js` both served `rsabc-shell-v38-el-beds`.
- Gates from `app/`: `python3 audio/bake-beds.py --check`, `node _check.mjs`, `node _flow.mjs`. All printed `ALL-OK`.

## Prefs and unlock

- After reset, store audio was `{ music: false, sfx: true, voice: true }`, `audio.isUnlocked()` false.
- Header Music toggle set `music: true` and left `unlocked` false. Header dots do not unlock.
- Ava face pick unlocked (faces.js). PLAY `#/play` also called unlock.
- Footer on Home read `READY SET ABC · Pre-K Phonics with Lucy · rsabc-shell-v38-el-beds`.

## Beds on the wire

Fetched and decoded on this origin (not the 4s sine):

- `audio/music-loop.wav` 441044 bytes, duration 10.000s.
- `audio/sfx-cheer.wav` 44144 bytes, duration 1.000s (Keep xylophone).

Hooked `AudioBufferSourceNode.start` after PLAY, music pref on:

- loop true, duration 10, 480000 frames at 48000 Hz (browser resample of the 22050 bed).
- `sfx-select` 0.210s on the face tap path.

## Grown-Ups Sound tests

PIN 1234, Sound tab. Hooked starts plus `HTMLMediaElement.play`.

- Test cheer, SFX and Voice on. 1.000s cheer, 0.700s right, `audio/lucy-cheer-6.mp3`. Dual-fire.
- Test cheer, SFX off, Voice on. `audio/lucy-cheer-2.mp3`. No 1.000s or 0.700s buffers. Music 10s loop still restarted (duck).
- Test cheer, SFX on, Voice off. 1.000s cheer, 0.700s right. `plays` empty.
- Test nudge, Voice off. 0.700s wrong. No Lucy mp3.
- Test stars. Three 0.709s star buffers at ~260ms spacing.

Known leftover, not this slice. Sound-tab mute does not refresh the header dots. Store prefs were the source of truth for the mute cases above.

## Shots

- `01-sound-tab.png` Grown-Ups Sound, unlocked, 10 recorded clips.
- `02-home-pin.png` Home after Ava, pin in the footer via CDP (`rsabc-shell-v38-el-beds`).

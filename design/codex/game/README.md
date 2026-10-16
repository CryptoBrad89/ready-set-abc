# Ready Set ABC · playable fun pass

Open [index.html](index.html) directly, or serve the repository with
`python3 -m http.server 8000` and visit `/design/codex/game/`.
Both games work offline from local files; no dependencies or build step.

Runtime copies of `../funpass/v1-letter-post` and `../funpass/v3-moonboat`
preserve the six-letter S/A/T/P/I/M picture games, themes, mute, keyboard
controls, hints, and visit collections. Captures/videos are omitted.
`audio-map.js` supplies approved names/sounds for all A–Z and the long-I extra
(available in the map; the insect round uses short I). Both games use that map
for listening, replay, matching prompts, and hints.

All 53 approved MP3s were copied with `cp`, unchanged, from the supplied
`/tmp/design/codex/phoneme-test/full-sentence-trim/audio/` export of
`codex/phoneme-test@77c462a`. `approved/clips.json` and `check_trims.py` are
unchanged copies from that commit. `approved-sha256.txt` is the supplied
checksum authority. No audio was generated or processed.

`voice-manifest.json` inventories every audio file with provenance and hashes.
The 18 retained word/cheer/nudge files use Flicker / `eleven_multilingual_v2`;
[VOICE-MISMATCHES.md](VOICE-MISMATCHES.md) lists them for Bradley’s regeneration
approval. They remain in place, including the unused source nudge.
Synthesized browser SFX have no audio files or spoken voice.

Run the stdlib checks from the repository root:

```sh
python3 design/codex/game/tests/run_tests.py
python3 design/codex/game/tests/run_tests.py --allow-known-mismatches
```

Strict mode must fail until the listed voice mismatches are resolved.
The flag warns only for exact file/text/voice/model rows in the mismatch table;
all hashes, metadata, inventory, and wiring checks remain enforced.
Trim checks validate the approved metadata and stored STT, without rerunning
speech recognition or modifying MP3s. The original `approved/check_trims.py`
is retained for provenance; it requires external tools and is not the runner.

Validation: strict mode passes 3/4 groups (18 expected voice mismatches, exit 1);
allowance mode passes 4/4 (18 warnings, exit 0). All JavaScript passes
`node --check`. Browser smoke testing was blocked by the sandbox at Chromium
startup; gameplay has not been browser-verified in this worktree.

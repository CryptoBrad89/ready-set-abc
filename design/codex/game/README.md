# Ready Set ABC · Lucy’s little adventures

A vanilla HTML/CSS/JS alphabet playground for ages 3–4, designed for landscape
tablets. Open `index.html` for local play. For installation and service-worker
caching, serve this directory on localhost (or HTTPS):

```sh
python3 -m http.server 8000 --directory design/codex/game
```

Open `http://localhost:8000/`. Wait for **Offline ready**, then install with the
browser’s Add to Home Screen / Install command. After that, every available
asset is cached, including A–Z audio, pictures, fonts, outfits and the original
prototypes. The service worker stays inside this game’s URL scope. No build
step, CDN, TTS, microphone, account, analytics or external service is used.

Each A–Z adventure includes name/sound listening, uppercase → lowercase and
lowercase → uppercase matching, picture matching, name/sound bonus questions,
and a sticker celebration. X uses the final /ks/ in **fox**. There are visual
cues, retry hints, keyboard controls, saved interrupted rounds, a letter map,
26 stickers, and eight original Lucy outfit portraits. Repeating a letter
keeps its sticker; outfit milestones use unique stickers. Letter Post and
Moonboat each support light, dark and device colors. Reduced Motion always
suppresses animation; teacher settings can also disable motion and effects.
Muted bonus rounds show the matching glyph instead of requiring audio.

**Teacher PIN: `2468` initially.** Use the key button; change the PIN in Settings.
Teachers can add/edit/delete up to 24 children, inspect activity counts per
child/letter, reorder and unlock letters, choose automatic next-letter opening,
export all progress as CSV, and reset a child or the whole device. All letters
start open; the initial order starts S/A/T/P/I/M. Settings and unlocks apply to
all children. Progress, stickers, outfits and resume points belong to each child.
The teacher room locks when hidden, after five idle minutes, or on returning to
play. The PIN is a local child gate, stored with local progress; it is not an
account or a security boundary. If storage is blocked, play continues with a
visible visit-only notice. Browser storage eviction clears local progress;
export CSV for a progress record. Full reset restores the default PIN.

`audio/letters/` contains all **53 approved MP3s, unchanged**. The checksum and
trim-metadata tests remain enforced. Every recorded clip is inventoried in
`voice-manifest.json` with Lucy `FgiNpTIapnCbaD6xiqIo` / `eleven_v4` and its hash.
`lucy-reference/` holds **33 unchanged source art files**, preserving their source
paths; `sha256.txt` locks the complete set. Reference videos are archived only,
never played. All dress-up portraits reuse these originals. Picture SVGs are
code-native non-Lucy art; no new Lucy image was drawn or generated. The original
six-letter prototypes remain at `v1-letter-post/` and `v3-moonboat/`.

**Pending production: 37 voice clips, 0 images.** Exact short scripts and target
paths are in `needs/needs.json`; the manifest marks them pending, without invented
hashes or generation provenance. The app tries those paths and falls back to
captions/pictures. Approved letter audio and the six existing picture words still
play. Deliver each missing clip using the specified Lucy voice/model, update its
manifest status, provenance and SHA-256, then rebuild the cache. Keep needs entries
as the production inventory; tests warn only while their targets are missing.

```sh
python3 design/codex/game/tools/build_assets.py   # after changing shipped files
python3 design/codex/game/tests/run_tests.py
python3 design/codex/game/tests/run_tests.py --final
```

The stdlib runner checks approved hashes/metadata, legacy playback, all voice
metadata, reference completeness/hashes, A–Z wiring, asset paths and full precache
coverage/revision. When Node exists it checks all JS syntax and runs integration
checks for every letter, resume/retries/mute, child isolation, teacher controls,
CSV escaping, reduced motion and service-worker install/fetch/update failures.
`--final` fails until every needs item has been delivered. There is no voice
identity exception; the old `--allow-known-mismatches` option is compatibility only.

Browser verification is still required: this sandbox blocks local server sockets
and Chromium startup. The Node DOM/cache harness checks behavior, not rendering
or browser media policy. On a tablet, check 1024×768 and smaller landscape views,
touch/keyboard focus, replay after an interrupted clip, theme/dark contrast,
Reduce Motion, PIN and CSV, then airplane-mode reload and a complete letter round.
For future edits, rebuild the cache and use “Refresh offline files” in Settings;
reload after a service-worker update activates.

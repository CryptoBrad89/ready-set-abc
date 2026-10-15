# Section 2 phoneme listening test

Open `index.html` directly in a browser, then choose **Letter Post** or **Moonboat**. Everything is local: vanilla HTML/CSS/JS, bundled fonts and MP3s, no network services or install step. Both `file://` and a normal HTTP static server work. To serve locally, from this directory run `python3 -m http.server 8080`, open `http://localhost:8080/`, and stop it with Ctrl+C.

This is a separate Section 2 test of whether ElevenLabs v4 phonemes can replace the Starfall reference. It has no game progression and does not modify the app or Section 1.

## Voice and listening

The supplied manifest chooses **Emma – Bright Kids Educator**, voice ID `oClOrzqamOXmtcB8iqTj`, model **eleven_v4**, for names, phonemes and words. This site does not generate or alter audio, certify pronunciation, or change prompts or chosen takes. Review the sounds by listening before treating them as replacements.

- Tap an A–Z tile or the selected letter's **Play name → sound → word** button for three clips in sequence.
- The two comparison buttons play **only** the Starfall phoneme or **only** the v4 phoneme. Starting any sound stops the previous one. Stop or Escape cancels a sequence.
- **Pass / Fail** rates the currently selected letter; arrows move focus and select a letter without playing. Enter/Space activates the focused button. **1 = Pass**, **0 = Fail**. Tab reaches comparison and rating controls; Home/End select the first/last letter while in the grid.
- The inspector shows the selected letter's IPA, word, actual phoneme filename, and whether it is a chosen take or automatic fallback. Word/IPA labels are preserved from `clips.json`, including X = Xylophone with /ks/; assess any mismatch during review.
- Missing/unreadable clips are labeled **Missing**. Full-sequence Play requires all three v4 clips; an available individual comparison clip remains playable. Tiles still select letters for comparison/rating. Use **Check for new clips** after audio arrives; no rebuild is needed when only MP3s change. The browser checks decodable audio metadata, so empty/unfinished files also remain unavailable.

## Clip selection and manifest updates

All v4 filenames come from `clips.json`. For each letter, `phoneme.chosen_filename` wins when set. If that chosen file is missing, the UI reports it missing rather than substituting an unapproved take. Otherwise it checks the manifest's attempts in try1, try2, try3 order and uses the first available file. Starfall is comparison-only at `audio/starfall/lucy-phoneme-<letter>.mp3`.

HTTP pages reread `clips.json` on load and when checking for new clips. Browsers restrict JSON fetches from `file://`, so `clips-data.js` supplies an identical generated manifest copy for direct opening. After **manifest edits** (including later chosen_filename changes), run:

```sh
python3 design/codex/phoneme-test/sync-data.py
```

Run that from the repository root, then reload the page. The script only refreshes `clips-data.js`; it never rewrites `clips.json`. The supplied manifest now includes chosen takes, which the site follows. The supplied `ratings.json` contains generation notes (clean/iffy); those notes are separate from your browser's Pass/Fail listening ratings. This build does not change take choices or import generation notes as listening judgments.

## Ratings

Ratings use localStorage key **`rsabc-phoneme-test-ratings`**, with values such as `{"A":"pass","B":"fail"}`. Both layouts share ratings. For direct file opening, a hidden local `ratings-store.html` frame provides one consistent storage URL for both layouts. HTTP uses normal same-origin localStorage and synchronizes other open tabs. Storage exceptions produce a visible notice and keep ratings in memory for the current page.

Ratings stay in this browser/profile and origin. File opening and HTTP are separate storage contexts, as are different HTTP ports. Private browsing, blocked local storage, moved folders or cleared browser data can affect persistence. Ratings are listening judgments, not changes to the manifest or take selection.

## Visual sources and scope

Colors, postal edges, envelope folds, rounded planets and orbit details are adapted from the supplied `codex-funpass/v1-letter-post` and `v3-moonboat` references. Only the local fonts, their licenses and one Lucy portrait are copied; shared assets avoid duplicates. No `motion.mp4`, source game logic, service worker, dependencies or external requests are used. Controls are at least 44px; the layouts resize with the viewport and use no animation, including under reduced motion.

All build writes are inside `design/codex/phoneme-test/`. No commit or push is performed.

## Validation

Verified local links/control IDs, JavaScript syntax, manifest-copy consistency, and interaction logic using isolated audio/storage adapters: three-clip order, separate comparison playback, chosen/fallback selection, missing clips, rescan recovery, keyboard ratings, persistence, storage failures, file storage sharing, and cancellation. All 26 full sequences have their required files. All 87 v4 MP3s present at validation decoded without errors. Supplied Starfall F, G and N report frame/header warnings in FFmpeg while still decoding audio; these references were left intact.

The execution sandbox blocks Chrome startup and local HTTP listeners, so live browser playback and visual checks could not be completed here. The logic checks use adapters rather than a real browser/audio output.

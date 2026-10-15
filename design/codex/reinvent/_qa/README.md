# Evidence and reproduction

Run from `/tmp/rsabc-reinvent` using the already-installed Playwright package and ffmpeg.

- `node out/_qa/verify.mjs`: keyboard, six-letter loop, real audio completion, hints, cancellation, themes, blocked storage, reduced motion, and no-network checks.
- `node out/_qa/capture.mjs`: the full six-size/four-screen matrix, exact viewport PNGs, optional full-page PNGs, theme homes, and measured layout report.
- `node out/_qa/edge.mjs`: extra narrow/wide/square sizes with touch and mid-round orientation changes.
- `node out/_qa/contrast.mjs`: computed text contrast across themes/states; should print no failures.
- `node out/_qa/record.mjs`: all three Playwright recordings and H.264 conversion. Optional folder arguments record only selected concepts.
- `node out/_qa/launcher.mjs`: gallery screenshot and image/overflow checks.
- `python3 out/_qa/sheets.py`: contact sheets for visual review. Full-page versions are used when a short viewport scrolls.

`final-report.json` consolidates the final matrix, contrast, edge, file-size, and exact PNG dimension checks. `functional-report.json` has the completed learning-flow checks. `video-report.json` records durations, codecs, pixel formats, and byte sizes for the three final MP4s.

`build.py` records the initial asset preparation and HTML scaffold, not a complete source generator. The source files in each variation are the deliverable. `_qa/app.js`, `_qa/art.js`, and `_qa/base.css` are the common authored source copies used during construction; no shared runtime is required by the three games.

Video contact sheets show frames at 1, 4, 7, 10, and 14 seconds. Videos have no audio track because Playwright recordVideo captures the viewport only; actual local MP3 playback is verified separately.

All browser instances are owned by these scripts and closed. No web server was used. Recording WebM intermediates and the owned recording temporary directory were removed. The scripts, reports, stills, final MP4s, and small review contact sheets are intentionally kept.

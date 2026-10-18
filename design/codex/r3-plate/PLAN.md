# Work plan

1. Ground. Read the round-2 brief, review, implementation, README files and stills.
2. Sketch. Compare a permanent three-button color shelf with a compact cycling control. Choose the shelf because every option stays visible and switching is one tap.
3. Agree. No checkpoint requested. Proceed with the brief.
4. Implement. One route DOM, one theme registry, one shared stylesheet.
5. Scrap. Remove old variant selectors and illustrated additions to Lucy.

## Throughput checkpoint

- Blocking first steps. Inspect source palettes, photos, motion references and route behavior before changes.
- Independent workstreams. Delegate runtime and theme registry. Lead owns markup, CSS and browser verification.
- Shared mutable state. Split file ownership. Runtime delegate owns app.js and themes.js only.
- Smallest safe decomposition. One runtime worker preserves the existing lesson flow while the lead checks the actual screens.

## Remaining steps

- Verify every theme and route at tablet, phone and whiteboard sizes.
- Exercise selection, retry, success, PIN, voice, theme persistence and reduced motion.
- Capture 30 required stills and a live theme-switch video.
- Document choices and evidence.
- Commits and PR skipped because TASK.md prohibits git.

## Completed

All implementation and verification steps are complete. The first layout pass caught a phone keypad overlap and a tablet celebration spacing issue. Removing the static Learning pace row and tightening celebration spacing resolved both. The final 45-composition audit has no findings. Thirty required stills, three whiteboard home stills and a 14.32-second MP4 were captured and visually checked. The final runtime check passed, including blocked storage and reduced motion. Both Lucy image files match round 2 byte for byte.

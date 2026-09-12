# Ready Set ABC verification map

This directory is the maintained source for verifying the user-facing behavior of Ready Set ABC. Read the index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- Launch with `.cursor/skills/verify-ready-set-abc/bin/verify-rsabc launch` and require `http://127.0.0.1:4173`.
- Run `verify-rsabc doctor` and require pid ownership of 4173, `Ready Set ABC` on `GET /`, and shell `rsabc-shell-v38-el-beds`.
- Browser viewport is landscape 1280×800 or 1366×768. Portrait under 900px wide is blocked by the rotate overlay.
- Seed state only through `_smoke.html` on this origin (`verify-rsabc smoke '<query>'`).
- Never drive `:8000` or `:8080`. Never drive an instance this helper did not start.
- PIN for Grown-Ups is `1234`.

## Driving conventions

- Start every recipe from the baseline state unless its preconditions say otherwise.
- Prefer ARIA roles and accessible names over CSS selectors or DOM position.
- Treat every command as literal. Keep quoted names and smoke queries unchanged.
- Open smoke URLs in the verification browser, wait until `index.html` is showing, then tap.
- Restore a clean tablet with `_smoke.html?reset=1` after a mutation. Do not remove proof artifacts during cleanup.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes an ARIA snapshot and a screenshot with Ready Set ABC visible.
- Mutation proof includes a read of the matching `rsabc.*` localStorage key.
- Record the feature ID and entry point used with every artifact.
- Report an unreachable path with the attempted URL or tap and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with the browser` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

Keep implementation details out of the map. Name only user paths, stable handles, required state, commands, and observable proof.

## Features

- [Play a letter round](./play-round.md) covers PLAY, two-tap case and picture match, optional bonus, celebrate, and the next-letter button.
- [Face pick](./face-pick.md) covers classroom Who-is-playing, a named child, and switching kids.
- [ABC Trail](./abc-trail.md) covers the A–Z trail, letter-of-the-day ring, and opening a letter from a tile.
- [Grown-Ups pin](./grown-ups-pin.md) covers the PIN gate, Play tab, and pinning today's letter.
- [Star Pouch](./star-pouch.md) covers empty pouch, earned stars, and putting a closet treat on Lucy.

# Ready Set ABC verification map

This directory is the maintained source for verifying the user-facing behavior of Ready Set ABC. Read the index before driving the app, then use the matching feature file as the recipe.

The product story is in [PRODUCT.md](../../../../PRODUCT.md). If a recipe disagrees with that file, PRODUCT.md wins.

## Tablet session

A tablet session is a state machine.

1. No session shows the roster. Heading **Who is playing?**. `body[data-screen]` is `faces`. Tabs are hidden. Empty hash and `_smoke.html?reset=1` land here. Smoke `classroom=0` also lands here. It does not skip the roster.
2. A child tap opens that child's Home. Heading **Welcome back, {Name}!**. Hash `#/home`. It never starts a round.
3. The adult tile opens the PIN, then that adult's Home.
4. Home cards and Letters & Phonics follow that child's work mode.

Work mode lives on the child record.

- **SATPIN** is the default. Ava (`k01`) is SATPIN. Cloud 1 letters are S A T P I N. PLAY is P. Gold chip **Cloud 1**. Blend aria `Open cloud letters S, A, T`. Stat **Level 1** with `S · A · T · P · I · N`. Letters & Phonics shows cloud islands and six open-cloud tiles. Path footer `Tap a letter in the open cloud`. Home footer `Cloud 1 · n/24`.
- **Assigned letters** is set on the Class tab. Miles (`k24`) stays SATPIN until Class sets assigned letters. After Class sets `S O J`, PLAY is S. No Cloud 1 chip. Blend aria `Your letters S, O, J`. Stat **Your letters** with `S · O · J`. Letters & Phonics has no islands. The board is S O J. Lucy does not say Cloud 1 is open. Path footer `Tap one of your letters`. Home footer `Your letters · n/12`.
- **Free play** exists in Grown-Ups. Do not invent a proof for it in this pass.

Seed Ava with `kid=k01`. Seed Miles with `kid=k24`. Assigned Miles still needs the Class step.

## Baseline preconditions

- Launch with `.cursor/skills/verify-ready-set-abc/bin/verify-rsabc launch` and require `http://127.0.0.1:4173`.
- Run `verify-rsabc doctor` and require pid ownership of 4173, `Ready Set ABC` on `GET /`, and shell `rsabc-shell-v43-voice-clips`.
- Browser viewport is landscape 1280×800 or 1366×768. Portrait under 900px wide is blocked by the rotate overlay.
- Seed state only through `_smoke.html` on this origin (`verify-rsabc smoke '<query>'`).
- Never drive `:8000` or `:8080`. Never drive an instance this helper did not start.
- PIN for Grown-Ups is `1234`.
- Leftover proofs in `artifacts/` used port 4174. New drives use the skill default 4173 so localStorage stays isolated.

## Driving conventions

- Start every recipe from the roster unless its preconditions seed a named child.
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

- [Play a letter round](./play-round.md) covers PLAY from that child's Home, meet through celebrate, Ava SATPIN letter P, and Miles assigned letter S.
- [Face pick](./face-pick.md) covers roster login. A face tap opens that child's Home. The who-chip returns to the roster.
- [Letters & Phonics](./abc-trail.md) covers the path. SATPIN Ava has Cloud 1 (S A T P I N). Assigned Miles has S O J and no cloud islands.
- [Grown-Ups pin](./grown-ups-pin.md) covers the PIN gate, pinning a letter, and setting Miles to assigned letters S O J.
- [Lucy's Closet](./star-pouch.md) covers dress-up with stars. Mix and match. Stars are never spent.
- [Lucy's Picnic Day](./picnic-day.md) covers Storybooks. A paged picture story for this letter. Not the four-beat round.
- [Rhymes & Songs](./rhymes-songs.md) covers the Fun-row song. A short Lucy rhyme. Not the four-beat round and not Picnic Day.
- [Coloring Canvas](./coloring-canvas.md) covers the Fun-row coloring play. Pick a Lucy or letter page, tap crayons, done.

# Grown-ups

## Sub-features

- A fresh reading check keeps young children from casually opening settings.
- Choose a nonempty set of practice letters, sound, and the current world's color theme.
- Save changes or cancel the draft. Settings stay on this browser, separately for each world.
- Read the pictures matched during this visit and guidance for playing together.

## How to get to it (user POV)

Open any world from the chooser. Select **Grown-ups** in the footer. The game returns to its letter shelf and opens a dialog. Read the three number words, type their digits, and select **Continue**.

## Driving it with Playwright

Run from the repository root:

```sh
CHROMIUM_EXECUTABLE=/usr/bin/google-chrome node design/codex/game/tests/grownups_smoke.cjs
CHROMIUM_EXECUTABLE=/usr/bin/google-chrome node design/codex/game/tests/grownups_edges.cjs
```

The helper opens each world through its real HTML entry point. It drives `#grownups-entry`, solves the visible `#grownups-challenge`, and selects letter checkboxes inside `#grownups-settings`. It verifies failed entry, modal focus, Escape, empty-selection rejection, cancellation, saved settings after reload, and selected-letter wraparound. It tests unavailable and malformed browser storage separately. The edge helper checks 320px touch targets, one-letter wraparound, per-world isolation, invalid saved values, and entry during audio or answer animation.

Screenshots remain in `/workspace/rsabc-grownups/` after the browser closes. Each world's gate and settings are captured at widths 390, 768, and 1440. Page errors and network requests fail the main journeys.

## Gotchas

The entry check is a barrier for young children, not authentication. Closing the dialog locks it again. Opening it ends the current round and returns to the letter shelf. Collections remain available during that visit, but reload clears them. A matched picture does not establish mastery. Letter selection changes the shelf and next-letter sequence; picture choices still use the full vocabulary. Storage restrictions allow changes for the current visit only.

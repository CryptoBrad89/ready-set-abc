# Handoff — Stitch-only spin on the rough draft

**Run this in a local Cursor chat.** Google Stitch MCP does not reach Cloud Agents. Bradley’s Stitch account is `techiebrad89@gmail.com`. Desktop Cursor already has the Stitch MCP connected.

**Do not change the website** (`app/`, tokens, service worker, GitHub app code). Work only inside the existing Stitch project. Do not delete, overwrite, rename, or “clean up” any current screens.

---

## Paste this as the first message in the new local chat

```
Read STITCH-HANDOFF.md in this repo and do the Stitch-only task it describes.

Stitch MCP is already connected in this local Cursor (techiebrad89@gmail.com).
Project title: brandys ABC classroom game.
Bradley liked the rough draft. The other screens are animation experiments — leave them alone.

Create a NEW variation of the rough draft with a classroom-first UI/UX spin (graphics, motion, VO/SFX labels — all options on the table in the mock).
Add new screens only. Never delete or overwrite existing work.
Do not edit the Ready Set ABC PWA in app/.
```

---

## Why this chat exists

A Cloud Agent (`bc-4bbf009e-97ab-4913-9caf-170087a9cbfc`) planned the work and confirmed Stitch MCP is desktop-only. It could not call `list_projects` / `generate_screen_from_text`. Bradley asked for this handoff so a **local** agent can finish.

Approved plan (do not edit the plan file): Cloud Agent artifact `stitch_draft_variation_337ae4cf.plan.md`.

---

## 1. Confirm Stitch, then inventory (read-only)

1. Confirm Stitch tools exist: `list_projects`, `get_project`, `list_screens`, `get_screen`, plus a generate tool (`generate_screen_from_text` and/or `generate_variants`).
2. `list_projects` — find **brandys ABC classroom game**. Record the exact project id.
3. `get_project` + `list_screens` — write a short inventory: title, screen id, which one is the **rough draft**, which are animation variants.
4. Pull HTML + screenshot of the **rough draft only**. Skim variants so the new spin does not copy them.
5. Stop. No generate/edit until the inventory is written.

Official ID shapes (easy to get wrong):

| Tool | projectId | screenId |
|------|-----------|----------|
| `get_project`, `list_screens` | `projects/NUMERIC` | — |
| `get_screen` | NUMERIC | NUMERIC |
| `generate_screen_from_text` | NUMERIC | — |
| `generate_variants` | NUMERIC | NUMERIC array |
| `edit_screens` | NUMERIC | NUMERIC array — **do not use on Bradley’s originals** |

---

## 2. Add new screens only (never replace)

Create **new** screens in the same project. Names must be obvious, e.g.:

- `Agent spin — home (from rough draft)`
- `Agent spin — case match (from rough draft)` (only if you add supporting frames)
- `Agent spin — celebrate (from rough draft)`

Rules:

- Prefer `generate_screen_from_text` as **new** screens.
- `generate_variants` is OK only if it **adds** alternatives and leaves the original selected/default. If it would overwrite, skip it.
- Never `edit_screens` / `delete_project` / `delete` on existing screens.
- Never rename Bradley’s work.
- Never generate “cleanup” screens.

If the rough draft is a **single home screen**, add that home plus 2–3 supporting frames (case match, celebrate, maybe trail) so the variation is a readable flow — still new screens only.

If it is already a multi-screen draft, one new prefixed screen per draft screen.

---

## 3. Design spin (start from the rough draft)

Keep from the draft and from the live PWA (`app/`, [UX-FROM-STITCH.md](UX-FROM-STITCH.md)):

- Warm cream `#fff8f5` / `#FFFDF5`, sunny yellow `#FFB800`, sky `#29B6F6`, mint `#26C281`, coral `#FF5252`, cocoa text `#251911`
- Comfortaa + Nunito Sans, pillow cards (6–8px lip), yellow paw logo, Lucy by name
- Giant **PLAY** as the one kid CTA; Grown-Ups dull and small
- Two-tap match if that screen is in the draft: `① pick → ② tap the prompt`

Push UI/UX for Brandy’s room: landscape tablet, ages 3–4, ~25 kids, whiteboard distance, spoken prompts over text.

Put these on the **new** screens only:

- **Lucy is the product.** Bigger Lucy on home; teaching glasses on play; bows + party on celebrate. Motion in the HTML: wag, blink, mouth yap, PLAY breathe. Paw / bubble = tap to hear Lucy. Photoreal-still silent Lucy = fail.
- **Less adult chrome on kid home.** Drop marketing chips like “Tamper-Proof Gate” / “Pure Phonemic Phonics.” Kid-readable status: stars today, next-letter pillows, Sound Ready after PLAY.
- **Targets and landscape.** 16:9 tablet frame. Tap areas that read as toys (≥88px, ~140px cards). If you draw a trail, 26 readable tiles — not a dense 13-column spreadsheet.
- **Celebrate juice.** Festive room, balloons, sticker flying toward the pouch, Skip so the party can end.
- **Audio as chrome.** Music / SFX / Voice dots in the header. PLAY unlocks sound. Label VO/SFX on the mock (`Lucy: “Hi! Let’s play!”`, woof on paw, letter name on board-appear, phoneme on choice tap). Stitch cannot ship classroom audio; specify it.
- **Motion budget.** Snappy pillow press; looping Lucy idle; short celebrate. No decorative loops that compete with PLAY.

Live app reference (do not edit it): `app/css/tokens.css`, `app/css/shell.css`, `app/css/play.css`, `app/js/screens/home.js`. Product name in the repo is **Ready Set ABC** / Pre-K Phonics with Lucy.

---

## 4. Out of scope

- No edits under `app/`
- No restyle of the live PWA unless Bradley later points at a specific new Stitch screen and asks to implement it
- No new Stitch **project** — same project only

---

## 5. Done when

- Every original screen id is still there, unchanged
- New “Agent spin — …” screens exist, based on the rough draft
- Bradley can open Stitch and compare rough draft vs the new variation side by side
- You report: project id, original screen list, new screen names/ids, and Stitch URLs

---

## Cloud Agent notes (do not redo)

- Cloud run could not see a `stitch` namespace. Desktop Stitch MCP does not forward to Cloud Agents.
- Gmail on the Cloud Agent was `techiebrad89@gmail.com` (same Google account). That is not Stitch access.
- Bradley skipped `STITCH_API_KEY` on purpose. Do not ask for it in the local chat if Stitch tools are already listed.

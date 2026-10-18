# Ready Set ABC · Pick your colors

Open [index.html](index.html) directly in Chrome. The plate runs from `file://` with local fonts, pictures and audio. No server or network is needed.

Pink opens first. The always-visible shelf offers Pink, Purple and Yellow in that order. Each button has a text label, a color swatch, a selected checkmark and a target at least 60px tall. A child can switch with one tap. Keyboard users can Tab to a color and press Space or Enter. The choice is saved in `rsabc-r3-theme` when browser storage is available. Invalid saved values fall back to pink; unavailable storage still allows live switching.

## One shared layout

The five routes share one DOM and one stylesheet. Switching changes color tokens, display type and decorative particles. It preserves the current route, picture choice, partial PIN and audio settings.

The home combines v1's clear greeting and SATPIN preview, v2's aqua play button against a pink room, and v3's luminous portrait surround. Lucy stays on the right at tablet and whiteboard sizes. On the phone, her speech bubble sits beside her beneath Play so the color shelf can stay visible on every route. The card shapes, button locations and layout rules are identical for all themes.

Lucy uses the unchanged round-2 `lucy-default.jpg` and `lucy-celebrate.jpg` files. Her portrait floats and responds to recorded speech. There are no newly drawn body parts, eyelid overlays, accessories or color filters.

| Theme | Round-2 source | Room / wash | Main / accent | Character |
| --- | --- | --- | --- | --- |
| Pink | v2/theme.css | `#ffd2eb` / `#ee6bbd` | `#b41468` / `#61ead7` | Heavy Nunito, aqua letter shadow, floating dots and rings |
| Purple | v3/theme.css | `#e3d4ff` / `#9485ef` | `#653bce` / `#ffba52` | Rounded Comfortaa, pale letter highlight, luminous stars |
| Yellow | v1/theme.css | `#fff1a6` / `#83c4ff` | `#235fe9` / `#ffcd38` | Slanted Nunito, sunny letter shadow, suns and sparks |

All eight tokens from each source palette are preserved in `themes.js`, including ink, secondary, lip and paper. CSS registered color properties blend the room and controls over 600ms. Existing confetti recolors immediately when the theme changes.

## Routes and controls

- `#home` starts play and unlocks local audio on the Play gesture.
- `#trail` shows SATPIN on the curved Silk Thread path.
- `#listen` asks for /s/. Choose Sun, then tap S to match. Apple and Cat gently retry. Number keys 1–3 select a picture; Enter confirms when focus is outside a button.
- `#celebrate` shows Lucy, three stars and confetti. Next little letter returns to the trail.
- `#grownups` accepts PIN **1234**, through the keypad or keyboard, and unlocks the saved round-size setting.

Music, SFX and Voice are independent switches. Escape returns home, including during an iris transition. Bottom navigation also reaches every route.

This preserves round 2's single /s/ demonstration. Every trail letter opens that demonstration. Round size is an editable, remembered setting; it does not expand this plate into a full lesson engine. The displayed PIN is a demonstration gate, not authentication.

Reduced motion stops ambient movement, portrait floating, glyph entrances, tap springs, palette interpolation, iris transitions and confetti. Theme selection and lesson feedback remain immediate.

## Design references actually used

The local `/workspace/rsabc-design-tools/INDEX.md` guided the selection. No React, Tailwind, shader runtime or remote dependency was added.

- **Design Taste**, `skills/playful-color/SKILL.md` and `skills/taste-motion/SKILL.md`. Used large display hierarchy, chunky primary action, limited rotation, distinct motion durations and reduced-motion handling. The task's saturated moving Silk room takes precedence over the reference's cream-only ground and loop restrictions.
- **Better Design**, `scripts/transitions-src/icon-swap.tsx`. Adapted its selected-state scale/opacity idea into the color swatch's 200ms checkmark feedback. Its local skill was read, but the MCP was unavailable. No MCP guidance or automated Better Design review is claimed.
- **Motion Primitives**, `app/docs/text-effect/page.mdx`. Used per-character segmentation and stagger timing for the greeting, implemented with plain spans and CSS. The original accessible label remains intact while decorative character spans are hidden from assistive technology.
- **Trickle**, `registry/default/wave/wave.tsx` and the `trickle-wave` keyframes in `app/globals.css`. Adapted the 80ms stagger and 0.3em lift into the one-pass SATPIN greeting wave. Repeated waving was reduced to one greeting so it does not compete with Lucy.

The existing CSS room, iris transition and canvas celebration were retained and connected to the live theme registry. Heavy canvas/WebGL effects and cursor trails were unnecessary for this touch-first plate.

## Pstack decisions

Poteto Mode supplied the grounding, architecture comparison, delegated runtime implementation and independent source review. The available runtime agents inherited the session model; the default Grok/Claude roles were unavailable here.

Model the Domain led to one validated theme registry instead of three applications. Prove It Works led to saved browser scripts, actual file-URL checks, screenshots and a recorded live switch. The alternatives and throughput checkpoint are in [PLAN.md](PLAN.md). A full state-driven renderer was rejected because the static route DOM already preserves working lesson state. The final review removed redundant comments. No git operations were used.

## Verification and media

[stills/](stills/) contains every route in every theme at 1180×820 and 390×844, plus three whiteboard home stills. [motion.mp4](motion.mp4) records live Pink → Purple → Yellow → Pink changes, the lesson flow, and another switch during celebration. It is encoded as H.264, yuv420p, with faststart.

The scripts use the installed Playwright Core package. Set `PLAYWRIGHT_PATH` if your installation differs. Run from this directory after creating `qa/tmp`.

```sh
TMPDIR="$PWD/qa/tmp" CHROMIUM_EXECUTABLE=/usr/bin/google-chrome node qa/runtime-check.cjs
TMPDIR="$PWD/qa/tmp" CHROMIUM_EXECUTABLE=/usr/bin/google-chrome node qa/capture.cjs
```

`qa/runtime-report.json` records behavior checks. `qa/layout-report.json` records all 45 route/theme/viewport combinations, target sizes, viewport and navigation boundaries, browser errors and network requests. The stills also received visual review. `qa/motion.cjs` records the motion sequence using Playwright video capture; its FFmpeg executable is supplied under `qa/browsers` for this environment.

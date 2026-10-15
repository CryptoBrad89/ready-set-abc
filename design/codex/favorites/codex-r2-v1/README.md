# v1 — Super Sound Club

A little sound. A big adventure. Silk Thread skeleton with comic citrus personality.

## Palette

- Ink: `#202752`
- Primary: `#235fe9`
- Accent: `#ffcd38`
- Secondary: `#f34e6b`
- Base: `#fff1a6`
- Wash: `#83c4ff`
- Lip: `#12378b`
- Paper: `#fffdf4`

Original derived palette; no Stitch token sheet was copied.

## Stitch vibe

Inspired by `style_10_bold_comic_pop_art`, `style_5_sunburst_citrus_fiesta`, `direction_2_chunky_bauhaus_toy_blocks` plus `ready_set_abc_home_screen`, `lucy_golden_retriever_mascot` and `step_a/b/c`.

Comic panel outlines and hard offset shadows meet an electric blue / citrus room. Stitch’s saturated yellow playfield and chunky block energy become a softer moving Silk room.

## Skeleton and interaction

The original `ref/design/direction-c` determines the regions: header, left greeting / SATPIN preview / Play, floating Lucy on the right; a single curved trail; Listen instruction / three picture plates / confirmation; celebration copy left / Lucy right; Grown-Ups folio left / PIN keypad right. Phone keeps the original stacking order. C1–C4 were reviewed only as context.

Open `index.html` directly. Routes: `#home`, `#trail`, `#listen`, `#celebrate`, `#grownups`. Home starts audio on the Play gesture. Listen uses two taps: select a picture, then the big S speaker/check button. There is one correct answer (Sun); Apple and Cat gently retry. Number keys select; Enter checks; Escape returns home. Adult PIN is 1234; unlocked round-size setting and audio switches persist locally where the browser permits file storage. This is a design exploration, not a production PWA / complete lesson engine.

Lucy uses the original local photos, a floating portrait, a wagging illustrated tail behind the frame, brief eyelid overlays and speaking bounce. Music is a soft synthesized loop; voice clips and sound effects are offline. Audio toggles are independent. A moving color room, ambient dots, staggered glyphs, letter pops, elastic taps, iris route changes and canvas confetti / stars complete the motion. Reduced motion freezes the room and idle loops, disables particle bursts and removes iris / spring movement.

## Reference decisions

All eleven local tool repositories were inspected as references. No network runtime, React, Tailwind or package installation is required.

- **superdesign-skill:** brief → direction → design tokens → iterative visual review. Its hosted canvas/CLI workflow was not used because these are explicitly local static plates.
- **superdesign:** independent directions and responsive spacing; the archived extension’s CDN, black/white-only and no-images rules were rejected in favor of this brief.
- **better-design:** local README and component catalog informed consistent semantic tokens, focus and review. Its MCP is not connected; no MCP guidance or automated review is claimed.
- **design-taste:** playful-color outlines / display scale (comic plates), hierarchy and motion timing; its muted grounds and restrictions on gradients/loops were overridden by this round’s Stitch and rich-motion requirements.
- **canvas-ui:** effects stay behind the interactive DOM; implemented our own small 2D particle layer rather than experimental HTML-in-canvas/WebGPU effects.
- **paper-design shaders:** flowing mesh-gradient trajectories and palette blending informed the animated layered CSS room; avoided module/WebGL loading so file:// works without flags.
- **uilayouts:** masked portraits and generous tactile picture cards, reimplemented in vanilla.
- **hyperiux-components:** milky-way particle depth and halo ideas, reimplemented without React/Three.js.
- **motion-primitives:** text scale/pop stagger and spring press choreography, reimplemented with CSS and Web Animations.
- **trickle-UI-kit:** pure CSS character staggering and per-letter celebration idea; no React runtime.
- **cursify:** inspected RippleCursor; skipped continuous cursor trails because this is a finger-first Pre-K interface. Used a short tap-position ripple only in the non-comic plates.

## Review artifacts

`stills/` contains all five routes at 1180×820 and 390×844. `motion.mp4` is a ~14s Playwright recordVideo capture on file://, encoded H.264 / yuv420p / faststart. The gallery is `../index.html`. Local fonts and Lucy photos are copied into this plate, so it remains independent if moved.

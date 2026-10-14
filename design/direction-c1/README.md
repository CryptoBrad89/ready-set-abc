# C1 Ink Room

Silk Thread layout (soft room, floating Lucy, circle-wipe iris, shifting mesh) with the in-repo comic skin: thick black ink, halftone, yellow `#ffe600`, blue `#3b82f6`, red `#ef4444`, speech balloon, POW sticker. Comic reference is `UX-FROM-STITCH.md` and `app/css/skins.css`. No Stitch export folder was in this checkout.

## Motion

- MeshGradient drifts at speed 1.05, 1.85 on celebration.
- Headline letters trickle up, 45ms apart.
- POW sticker rocks. Halftone drifts over 7s. A canvas of primary dots wanders (vanilla redraw of a particle field).
- Play carries a conic border beam. Press squash, then a POW / TAP / YES burst (700ms).
- Lucy floats. Iris wipe on every screen change. Confetti on the bow.
- `prefers-reduced-motion` collapses animation and skips the canvas. It is an opt-out only.

## References

Used as rulebooks or redrawn in vanilla HTML/CSS/JS: superdesign-skill (written system), superdesign (more than one option), better-design (88px taps, contrast), design-taste retro-print and playful color, canvas-ui (original particle canvas, no library code), paper-design/shaders MeshGradient, uilayouts (picture plates as playful cards), hyperiux rising-particle idea, motion-primitives border trail and text rise, trickle-UI-kit letter stagger.

**Skipped:** [cursify](https://github.com/ui-layouts/cursify). It is cursor-follow chrome. This is a touch tablet for ages 3–4, so a mouse trail would fight the finger taps.

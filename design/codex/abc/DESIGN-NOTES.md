# Garden storybook polish

Guidance comes from `design/PHASE2_PLAN.md` and the C1–C4 READMEs; original tool skills and the pass-1 seven-rule text were unavailable. Existing gameplay, theme toggle and grown-ups remain unchanged. Stitch supplies cream, sunny yellow, sky selection, mint success, cocoa ink, Comfortaa/Nunito and pillow depth.

Three options considered: **comic garden** (halftone/stickers competed with Lucy); **lantern garden** (floating lights added unnecessary movement); **garden storybook**, chosen (still mint patch, separate speech-bubble row, roomy picture cards). It combines C1's Stitch vocabulary with C4's warmth, without their animation systems.

| Tool guidance | Took | Skipped |
| --- | --- | --- |
| Better Design | 88px stage buttons; 96px Play; readable labels; darker supporting text; outlined/larger active step; check-mark success. Three-choice phone rounds stack. | Shrunken cards and faded locked letters. Existing header/grown-ups dimensions are preserved. |
| design-taste | Deliberate yellow/sky/mint roles; rounded letters; peach picture wells. | New fonts, CMYK, pure-black comic ink, decorative gradients. |
| Superdesign / superdesign-skill | Three composition options, one chosen system, explicit tokens in `polish.css`. | New framework or copied components. |
| Paper Shaders / paper-design | Evaluated against Stitch and calm preschool play; retained the static CSS garden. | Shaders, WebGL, vendor code and mount helper. No shader fallback asset is needed. |
| uilayouts | Rounded picture plates and tactile press depth. | UI kits and overlapping answer cards. |
| canvas-ui / hyperiux | Expressive Lucy poses provide the scene's character. | Particle canvases, bubbles, fireflies and ambient drift. |
| motion-primitives / trickle-UI-kit | Existing brief entrance/voice bob; stationary press under reduced motion or motion-off. | Staggers, beams, shimmer, iris transitions and new continuous motion. Existing reward effects obey reduced motion. |
| cursify | None. | Cursor trails offer no help on a touch tablet. |

System: spacing **8/16/24/32px**; labels **18px**, instruction **22px**, action **26px**, lesson title **28–32px**, home title **40–64px**. Existing large letter glyphs stay. Cards: **32–36px** corners, **6px** lips; primary actions: **8px** lips. Supporting ink is Stitch `#514532`, selected glyphs `#00658d`, with readable dark equivalents. All additions target the child stage, excluding teacher screens and dialogs.

Reviewed all three delivered PNGs alongside default/specs/bows references; see `LIKENESS.md`. Full silhouettes use `object-fit: contain`; decorative glyphs/captions no longer cover Lucy. PNGs remain unchanged, hash-pinned and required offline alongside the new CSS.

Both test modes pass **8/8**, including offline byte checks for images/CSS. CSS parses locally. Chromium socket setup is blocked here, so rendered light/dark device review and final human likeness sign-off remain manual. All work stayed offline and within this folder; no commit or push.

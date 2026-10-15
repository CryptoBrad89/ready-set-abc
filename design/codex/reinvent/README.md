# Little Woof

**Little sounds. Big discoveries.** Three ground-up reinventions of Ready Set ABC for children aged 3–4, with Lucy the golden retriever at the heart of each world.

Open **[index.html](index.html)** directly in a browser. Everything needed by the games is inside this output. No server, installation, CDN, account, fetch request, or service worker is required.

## Three different places to play

| Variation | Layout and interaction | Themes |
| --- | --- | --- |
| [Lucy’s Letter Post](v1-letter-post/index.html) | A graphic postal counter. Children open a letter from a sorting shelf, hear its sound, choose an illustrated postcard, and receive a stamped delivery. Bold ink, paper folds, tilted envelopes, and a cheerful postmaster. | Air mail; Candy post; **Dark** |
| [Lucy’s Sound Garden](v2-sound-garden/index.html) | A spacious garden bed. Children choose a sprouting seed, listen, find its picture, and grow a flower. The play board spreads horizontally, with a small sound plant and Lucy above the picture bed. Organic shapes, rounded type, gentle colors. | Daylight; Peach grove; **Dark** |
| [Lucy’s Moonboat](v3-moonboat/index.html) | A captain’s panel beside a constellation. Children choose a planet, hear its signal, and match a picture from a vertical scanner list. The reward lights up a little world. Helmet-framed Lucy, orbital lines, and quiet cosmic color. | **Dark**; Cloud day; Plum dusk |

These are different compositions and reward metaphors, with shared learning logic. They do not reuse the Silk Thread hero, navigation dock, or screen structure. Every theme changes the background, surfaces, text, accents, borders, and shadows. Art retains recognizable colors. Each variation has an independent `localStorage` theme key. If storage is blocked, the game continues and reports that the theme lasts for this visit.

## Play loop

1. Choose **S, A, T, P, I, or M** on the home screen. All six are playable immediately.
2. Hear the recorded letter name and then its phoneme. The large letter replays both. Continue when ready.
3. Tap one of three shuffled pictures. Each tapped picture speaks its actual word. The correct picture leads to a celebration after the word finishes. A wrong choice stays in place and replays the target sound. After two misses, the correct picture receives an outline and a written/spoken clue.
4. Celebrate with Lucy, then choose another sound, return home, or replay the matched word.

Picture vocabulary is deliberately small and consistent: **sun, apple, tiger, pig, insect, moon**. A and I use short vowels. The sequence is an exploratory six-letter sampler, not a claimed SATPIN curriculum or a full alphabet course. Each match contains exactly one correct answer; correct positions vary. A home checkmark means “played this visit,” not mastery. No penalties, countdowns, locked content, or persistent child records.

## What changed, and why

The supplied main snapshot uses a hub, a Meet → Choose → Listen → payoff sequence, classroom features, and multiple secondary activities. The redesign focuses the prototype on one short, visible path. The home screen itself is the letter chooser; navigation options do not compete with the activity.

The review findings informed the implementation:

- Real picture choices replace indistinguishable speaker guesses. Every option has a defined word and sound correspondence.
- Recorded names and phonemes are separate files, played in sequence. Playback drives Lucy’s talking movement; speech does not start on page load.
- A single voice channel, cancellation tokens, and route ownership stop abandoned sequences. There are no delayed auto-navigation timers. Rapid duplicate answers cannot skip stages.
- Useful hints appear after two misses. Encouragement is not labeled “mastery.”
- Lucy has her own layout space. She never floats over a choice or intercepts a child’s answer.
- Native page scrolling replaces fixed stage scaling and orientation-blocking overlays. Browser zoom remains enabled.
- Dark themes use their own readable foregrounds; picture cards keep explicit foreground/background pairs.

This is a new prototype implementation, not a modification of main or a migration of its saved data. Rosters, teacher tools, tracing, stories, music beds, and full A–Z content are outside this prototype’s scope. Printed task instructions are supported by pictorial controls and recorded names, sounds, words, and cheers; new spoken instruction sentences were not generated.

## Lucy, artwork, and motion

Lucy’s supplied photographs are copied from `ref/phase2/design/assets/`: default, teaching glasses, and celebration. Her framing changes by world: postmaster window, soft garden portrait, and space helmet. She tilts during idle moments, gently bobs only while recorded voice is playing, changes expression for teaching and celebration, and does a brief happy bounce on success.

All picture vocabulary, interface icons, leaf shapes, envelopes, and space decorations are original inline SVG/CSS. No emoji font is required for the learning pictures. The local fonts are Nunito Sans and Comfortaa; their supplied OFL notices are retained.

Motion includes spring-like button presses, staggered seed/planet arrivals, letter reveals, short screen entrances, a growing flower, a revealed planet/postcard, animated voice bars, and a finite confetti shower. `prefers-reduced-motion: reduce` removes animation and transitions and suppresses confetti creation. The same play sequence, feedback, and rewards remain available as still compositions.

## Input and layout

- Touch or mouse: tap a letter, speaker, picture, or continuation button. No drag gestures and no hover-only instructions.
- Keyboard: Tab to controls; Enter/Space activates buttons; arrow keys move between letter choices or picture choices; Escape returns to home. Select theme using the native select control.
- Screen replacement moves focus to the main landmark. Controls have visible focus outlines, accessible names, and status announcements. Wrong feedback uses text and an outline, not color alone.
- CSS Grid/Flexbox, `clamp()`, flexible tracks, and `aspect-ratio` reflow the content. There is no fixed-size canvas or global scale transform.
- At narrow widths, the letter shelves and seed beds use three columns; postal and garden play stack vertically. Moonboat keeps its choices in a roomy vertical list. At short heights, normal scrolling keeps every control reachable without shrinking targets.
- Gameplay letter/picture targets are substantially larger than ordinary utility buttons. All measured buttons at the requested sizes and additional edge sizes are at least 44 × 44 CSS pixels.
- Sound can be muted independently of gameplay. A visible speaker button replays the target; playback failures leave the visual activity usable and announce the problem.

## Local references and tool repositories

Reviewed before building: main’s actual home/stage/round implementation, original inline art and local audio; phase2 directions A, B, C and C1–C4; past review/recheck findings; Stitch’s design handoff and palette examples; Bradley’s comic/soft picks and the individual Berry Boom/Starlight Snuggle screenshots. The Stitch mechanics document is historical context; the user’s current reinvention brief determines this prototype’s scope.

| Tool repository | Used or skipped, and why |
| --- | --- |
| `madebymustafa_design-taste` | Used the local playful-color, motion, and accessibility guidance: strong shape hierarchy, explicit palette pairs, native controls, short entrances, clear focus, reduced motion. Adapted its rules to the requested lively preschool mascot. |
| `ibelick_motion-primitives` | Consulted animated-group/text-effect source for staged entrances and spring timing. Reimplemented the ideas with CSS keyframes; no React or Motion dependency. |
| `akaieuan_trickle-UI-kit` | Consulted the CSS-oriented bounce/stagger approach. Applied short staggered reveals to letter objects; no React component copied. |
| `superdesigndev_superdesign-skill` | Reviewed the local overview; skipped the hosted generation/setup workflow. The supplied references were sufficient for a custom design system. |
| `superdesigndev_superdesign` | Reviewed its multiple-directions approach; skipped the legacy IDE extension. This deliverable implements three independent compositions directly. |
| `marvkr_better-design` | Reviewed its skill/workflow. Skipped the MCP workflow because that service was not connected; no service-generated guidance or review is claimed. |
| `DavidHDev_canvas-ui` | Reviewed its rendering approach; skipped experimental HTML-in-canvas/WebGPU effects. Semantic DOM and simple SVG give broader browser and input compatibility. |
| `paper-design_shaders` | Reviewed the package overview; skipped shader backgrounds. Flat postal ink, garden paper, and drawn orbit lines give each world a clearer identity at lower runtime cost. |
| `ui-layouts_uilayouts` | Reviewed the component/library overview; skipped its React/Tailwind/Motion runtime. The child-facing objects were built as native buttons. |
| `Hyperiux-Immersion-Labs_hyperiux-components` | Reviewed the effects catalog; skipped heavyweight trails/immersive effects that compete with a preschool task. |
| `ui-layouts_cursify` | Skipped cursor-follow effects: mouse-specific decoration adds no value for fingers or keyboards. |

No new dependencies were installed. No external service, image generation service, or network asset is used by the output.

## Evidence and verification

Each variation includes:

- `stills/home-WxH.png`, `listen-WxH.png`, `match-WxH.png`, and `celebrate-WxH.png` at **1920×1080, 1366×768, 820×1180, 1180×820, 390×844, and 844×390**. These are exact viewport captures.
- Additional `*-fullpage.png` captures wherever a short viewport scrolls, so the entire reachable composition can also be inspected.
- `stills/theme-0-home.png`, `theme-1-home.png`, and `theme-2-home.png`, covering every theme.
- `motion.mp4`: approximately **15.6 seconds**, recorded by Playwright on a `file://` URL, then converted by ffmpeg to **H.264, yuv420p, faststart**. The clips show home, listening, picture match, celebration, and a theme switch. Playwright’s video captures are silent; the playable games have recorded audio.

Own screenshots were visually inspected across the full six-size matrix and all themes. Fixes included shrinking grid children correctly, removing decorative horizontal overflow, moving Lucy’s speech clear of the phone portrait, tightening home layouts, and correcting dark-theme text pairs.

The retained `_qa/` scripts and JSON reports cover:

- All 72 main screen/viewport combinations; no horizontal overflow, undersized measured buttons, or browser page errors in the final requested-size matrix.
- All six letters completed through ordinary keyboard actions in every variation; arrow navigation, actual recorded name/phoneme completion, two-miss hints, and cancellation on leaving a screen.
- All nine themes reloaded and used to complete a round. Blocked storage has a working session fallback.
- Touch-driven play at additional 320×568, 568×320, 1000×1000, and 2560×1440 sizes, plus orientation changes during play.
- No HTTP(S) requests from the games; all bundled audio was decoded/re-encoded locally with a peak limiter. Reduced-motion checks find zero running animations.
- Computed text contrast checks across every theme and state, supplemented by visual inspection of decorative backgrounds.
- All output files individually under **5,000,000 bytes**.

Verification used installed Chromium via Playwright. This is not a physical-device, Safari/Firefox, screen-reader, or child usability study. Browser handling of `file://` storage can vary; the persistence fallback is intentional.

## Asset provenance and scope

Audio files are derived only from `ref/main/app/audio/`. The supplied provenance document is preserved in each `assets/SOURCE-AUDIO-NOTES.md`; it describes the recordings but does not independently establish every redistribution grant. These are local scratch prototypes using the user-provided materials, with no new licensing claim. SVG drawings and application code were made for this reinvention.

All authored work and evidence live under `/tmp/rsabc-reinvent/out/`. References were read only. No git commands, pushes, deployments, repository edits, or servers were used. Browser contexts launched by the QA scripts are closed by those scripts; recording intermediates are removed after conversion.

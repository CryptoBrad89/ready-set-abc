# Ready Set ABC: animation polish brief (GO given 2026-10-16 10:38pm CT)

Goal for Codex (general): the play screens should feel alive the whole time, and every right answer should feel like a big win.
Codex may use these as inspiration, not as a checklist.

## Scope
Layout and animation polish only. No image generation, no new sounds or audio, no letters beyond A–D, no new areas. Vanilla HTML/CSS/JS PWA that works offline after first load. Use poteto-mode/pstack tightness. Read AGENTS.md first.

## Rules (standing, not inspiration)
- Pushback: if you think an idea here would hurt the balance between learning and fun, push back. Stop, say exactly what you object to and why, and wait for a reply before continuing. Do not go ahead with the disputed item.
- Every animation has both an entry and an exit. Screens and elements leave as gracefully as they arrive, so nothing just pops off.

## Ideas pool
1. Right answers: confetti burst, the correct card bounces, Lucy jumps. Visual only, with no new sounds.
2. Idle life: Lucy breathing, blinking, tilting her head and perking her ears; cards drifting, stars twinkling.
3. Tap reactions: a squish and sparkle on any tap, a gentle wiggle on a wrong answer.
4. Smoother screen transitions, with Lucy staying on screen.
5. Bigger celebrate: confetti rain, a sticker flying into the sticker book, a letter badge stamped in.
6. Map life: the next letter pulses and the dotted path draws itself.
7. Whiteboard versions that are bigger and slower.
8. Lucy's life on her still image uses CSS keyframes and transforms only.
9. Progress trail on the map in A–Z order: done tiles marked, the current tile big with a sparkle, the next tile pulsing.
10. On Home, a soft glow on the next letter's tile.
11. Right-answer morph (correct answers only): the picture card briefly turns into the real object for about half a second, then snaps back.
12. Wrong tap: the card wiggles for about half a second while a soft light-red glow pulses around it, then both ease back to normal. No X (too defeating) and no slide-back story.
13. (REMOVED, do not build) Four-letter parade: each time a kid completes four letters (a running count, in any order), the last four letters they finished parade across the screen in the order they finished, with Lucy leading. Cap it at four letters to keep it snappy.
14. (REMOVED, do not build) Parade placeholder art: use any existing Lucy image in the project, with alt text marking it as a temporary placeholder so the stand-ins are easy to spot.

## Constraints
- Vanilla HTML/CSS/JS, offline.
- No new audio and no ElevenLabs.
- Lucy is never redrawn.

## Later list (parked)
- Teacher suite: a visual cue when a kid finishes, such as a badge or count on Brandy's screen.
- Nice-to-have, for the future only (leave the existing reduced-motion behavior exactly as it is): if the project adds a reduced-motion feature, animations respect prefers-reduced-motion and switch to a calmer version automatically. Not a current requirement.
- Parade: REMOVED by Bradley 2026-10-16 after playtest. Do not add it back.

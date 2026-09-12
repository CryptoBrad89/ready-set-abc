# Lottie slots

`lottie-web` plays these JSON files offline (pinned in `sw.js`).

| File | Used for |
| --- | --- |
| `loader.json` | First-paint orbiting loader |
| `sparkle.json` | Short success spark |
| `check.json` | Payoff / choose confirm |

**Lucy** stays a living SVG in `js/lucy.js` until we drop `lucy-idle.json`,
`lucy-talk.json`, and `lucy-celebrate.json` here (LottieFiles golden-retriever
clips, or a Rive file later). `createLucy()` already mounts a `.lucy-lottie-slot`
when those files exist.

Replace any of these with a LottieFiles / Lordicon download of the same name.
Keep the filename so `js/motion.js` does not change.

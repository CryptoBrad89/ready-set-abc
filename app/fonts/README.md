# The fonts ship with the app

Ready Set ABC self-hosts its two faces. They are **in this folder** and they are
**pinned in `sw.js` SHELL**, so a cart Chromebook with the radio off paints the
real Stitch look — no `fonts.googleapis.com` request, online or off.

| File | Family / weight | Used for |
|---|---|---|
| `Comfortaa-Medium.woff2` | Comfortaa 500 | letter glyphs, titles |
| `Comfortaa-Bold.woff2` | Comfortaa 700 | letter glyphs, titles |
| `NunitoSans-SemiBold.woff2` | Nunito Sans 600 | instructions |
| `NunitoSans-Bold.woff2` | Nunito Sans 700 | instructions, buttons |
| `NunitoSans-ExtraBold.woff2` | Nunito Sans 800 | headings, CTAs |
| `NunitoSans-Black.woff2` | Nunito Sans 900 | the biggest board type |

Both families are **SIL Open Font License 1.1**. The licences stay in this
folder with the files they cover: `Comfortaa-OFL.txt`, `NunitoSans-OFL.txt`.
Do not delete them, and do not add a font you cannot redistribute.

The faces are built from the upstream OFL variable fonts in `google/fonts`
(`ofl/comfortaa`, `ofl/nunitosans`): one static instance per weight above,
subset to Latin + Latin Extended plus punctuation and currency, saved as
woff2. That is enough for English classroom rosters with accented names.

## The three places a face is named

A font is only really shipped when all three agree:

1. **`css/tokens.css`** — an `@font-face` block at the top of the file points at
   `../fonts/<file>.woff2` with `font-display: swap`.
2. **`sw.js`** — the same `fonts/<file>.woff2` path is listed in `SHELL`.
3. **`js/version.js`** — `APP_VERSION` matches `const VERSION` in `sw.js`.

`node _check.mjs` fails loudly if any of those drift: a woff2 sitting in this
folder that `SHELL` does not pin, an `@font-face` pointing at a file that is not
on disk, a file that is not really a woff2, or a version pin that has not been
bumped. `node _flow.mjs` re-checks the same ground.

## Adding or replacing a face

1. Drop the `.woff2` in this folder, with its licence.
2. Add the `@font-face` rule at the top of `css/tokens.css` (`../fonts/…`).
3. Add the `fonts/….woff2` line to `SHELL` in `sw.js`.
4. Bump `VERSION` in `sw.js` **and** `APP_VERSION` in `js/version.js` to the
   same new pin, and update the pin in `README.md`.
5. Run `node _check.mjs && node _flow.mjs` from `app/` — both must say `ALL-OK`.
6. On school Wi-Fi: Grown-Ups → Device → **Get update**.

## Two rules that do not bend

- **Never put a `fonts.googleapis.com` or `fonts.gstatic.com` URL in `sw.js`.**
  Those 404 with the radio off and one failure fails the whole precache, which
  leaves a tablet that says it is set up and is not. `_check.mjs` rejects them.
- **Never let a font stack end at the webfont.** `--font-display` and
  `--font-body` in `css/tokens.css` keep rounded system fallbacks
  (Quicksand / Varela Round / Trebuchet MS, Nunito / Segoe UI) after the
  webfont name. If Chrome evicts a woff2 on a full disk, a child still reads
  the letters. Play never blocks on a webfont.

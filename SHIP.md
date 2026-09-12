# Putting Ready Set ABC on your web host

Bradley — this is the whole job. It is a folder of files. There is nothing to
install, no database, no build step, no account. Copy the folder up, open it
once on Wi-Fi, done.

Shell pin for this drop: **`rsabc-shell-v38-el-beds`**

**What is new in this one:** Music and the thin UI hits are ElevenLabs beds.
The xylophone celebrate sting still plays. Lucy still speaks the ten mapped
cheer and nudge clips. Names, letter sounds, and words stay silent. Home,
Grown-Ups PIN, and Music / SFX / Voice mutes stay. Tablets that already have
an older pin need step 4 below.

---

## 1. Copy the folder

Upload everything inside `app/` to your web host.

- Upload the **contents** of `app/`, not the folder itself, if you want the app
  at `https://yoursite.com/abc/`. So `index.html` should end up at
  `https://yoursite.com/abc/index.html`.
- Keep the **folder shapes exactly as they are**: `css/`, `js/`, `js/screens/`,
  `data/`, `icons/`, `fonts/`, `audio/`. If you flatten them, nothing loads.
- Upload everything, including the `.woff2` font files and the `.txt` licence
  files sitting next to them. Those licences are required to stay with the fonts.
- If your uploader has an "ASCII / text mode" option, use **binary**. Text mode
  quietly corrupts the fonts and the icons.

You can drop it in the site root too (`https://yoursite.com/`). Either works.

## 2. It has to be https

Not optional. The offline part of this app (the bit that makes it work in a
classroom with no Wi-Fi) only turns on over **https**. On plain `http://` the
app still opens, but it will never work offline, and the "Set up this device"
button will not do anything useful.

Most hosts give you https with a checkbox or a free Let's Encrypt certificate.
Turn it on before you hand any tablet out. `https://localhost` also counts if
you are just testing on your own machine.

## 3. First load, on Wi-Fi, on each tablet

Do this **once per tablet**, sitting on good Wi-Fi, before the cart ever goes to
a room with no signal.

1. Open the app in Chrome on the tablet.
2. Hold or tap into **Grown-Ups** — the PIN is **`1234`**.
3. Tap the **Device** tab.
4. Tap **Set up this device**. Watch the bar fill.
5. Wait for it to say **Pinned `rsabc-shell-v38-el-beds`**.

That tablet now has the whole app — screens, pictures, and the letter fonts —
stored on it. You can turn the Wi-Fi off and it still opens and still looks
right. Skip this step and the app will look fine on Wi-Fi and be blank in the
classroom, which is the one failure nobody catches until it matters.

Tap **Check offline files** any time to make it re-count what is really stored.
It should say all **96** files. Chrome sometimes throws files away when a
tablet's disk fills up; this is how you find out before a teacher does.

## 4. When you put up a new version later

1. Upload the new files over the old ones.
2. On each tablet, on Wi-Fi: **Grown-Ups → Device → Get update**.
3. When a **Reload to finish** button appears, tap it.

Tablets do **not** update by themselves, on purpose. The app will never change
under a child in the middle of a round. It waits for a grown-up to tap the
button — which means if you skip step 2, the tablets keep happily running the
old version forever. That is a feature, but it is also on you to remember.

Do this on a prep period, never mid-lesson.

## 5. Smoke test it in two minutes

Open the app once at the top level and check the home screen paints. Then open
`_smoke.html` with no query — it is a clickable index of every test URL. The
ones worth clicking after a fresh upload:

| URL | What you should see |
|---|---|
| `index.html` | Home screen, rounded chunky letters, Lucy the dog |
| `_smoke.html` | The index of test links |
| `_smoke.html?classroom=1&kid=k01&play=A` | Straight into a letter A round |
| `_smoke.html?play=W` | A letter that used to be asleep — a real round, same as A |
| `_smoke.html?to=%23/trail` | The ABC Trail: 26 tiles, every one of them lit |
| `_smoke.html?gu=device` | The Grown-Ups Device panel (asks for PIN `1234`) |
| `_smoke.html?mode=whiteboard` | Everything much bigger, for the wall board |

Then the real test: **turn the tablet's Wi-Fi off and reload the app.** It
should open normally and the letters should still be the round friendly ones.
If it opens but the letters look like a plain boring font, the font files did
not upload — check `fonts/` on the server.

## 6. What NOT to do

- **Do not rename or reorganise anything.** Not the folders, not the files, not
  `sw.js`. The app looks for exact paths.
- **Do not upload only the files you think changed.** Upload all of it.
- **Do not put it behind a login page or a password-protected folder.** The
  offline part cannot work through a login prompt.
- **Do not skip https.** See step 2. This is the one that silently ruins it.
- **Do not delete `fonts/`** or the `.txt` licence files in it.
- **Do not delete `sw.js`** — that one file is the entire offline feature.
- **Do not hand out tablets before doing step 3 on each one.** "It worked in my
  office" is not the same as "it works in Room 4."
- **Do not give the PIN `1234` to kids.** It is a speed bump for 3-year-olds,
  not real security. Anything sensitive should not live on a classroom tablet.
- **Do not edit the files on the server to make a quick fix.** Change them here,
  re-run the checks (`node _check.mjs && node _flow.mjs` from `app/`), re-upload.

## If something is wrong

| What you see | Almost always |
|---|---|
| Blank white page | Files uploaded into the wrong folder, or folder shapes flattened |
| Works on Wi-Fi, blank offline | Step 3 was never done on that tablet, or the site is not https |
| Plain flat letters instead of round ones | `fonts/` did not upload, or uploaded in text mode |
| "Only 66 of 96 files are cached" | Chrome evicted some. Back on Wi-Fi, tap **Set up this device** |
| Tablet stuck on an old version | Nobody tapped **Get update** then **Reload to finish** |
| Icons missing / broken | `icons/` did not upload, or uploaded in text mode |

Everything a teacher needs day-to-day — the PIN, the class list, printables, CSV
backup, the tape-to-the-cart card — is in `app/README.md`.

# Ready Set ABC — classroom how-to (Brandy)

Pre-K phonics with Lucy. Kids tap giant letter and picture cards. Grown-ups pin today’s letter, pick who is playing, and set the tablets up once for offline.

There is no login, no kid account, and no internet after the first setup. Everything lives on that tablet.

**The PIN is `1234`.** It is the only number in here you have to remember, and the last section is a card you can tape inside the cart lid.

## Start here

| If it is… | Go to |
|---|---|
| a brand-new tablet or a cart that has never run this | [Put it on a classroom tablet](#put-it-on-a-classroom-tablet-once), then [First morning: Set up this device](#first-morning-set-up-this-device-offline) — do the offline setup **on Wi-Fi**, before the cart goes to a dead-zone room |
| a normal Tuesday | [A normal morning](#a-normal-morning) — four taps, about a minute |
| the wall board | [The wall board](#the-wall-board-whiteboard-mode) |
| Friday, and you want paper | [Print tab](#print-tab--paper-for-the-table) — certificates, small-group sheet, roster cards |
| today's short game | [The bonus round](#the-bonus-round), and [how to set it in 30 seconds](#how-to-set-todays-bonus-30-seconds) |
| a second tablet, or the end of term | [Back up a tablet](#back-up-a-tablet-and-put-it-back) — Export / Import CSV |
| a dead-zone room tomorrow | [Check offline files](#first-morning-set-up-this-device-offline) |
| something wrong in front of children | [If something is wrong](#if-something-is-wrong) |
| you, on a laptop, checking a screen quickly | [Smoke bookmarks](#put-it-on-a-classroom-tablet-once) |
| one page to print and tape up | [Tape this to the cart](#tape-this-to-the-cart) |

---

## What the kids see

1. Home — Lucy says hello. Giant **PLAY!** button.
2. (Classroom mode only) Face grid — tap your face.
3. **Case match** — tap a little/big letter, then tap the big prompt to match.
4. **Picture match** — tap a picture, then tap **Aa**.
5. **Bonus round** — one short game, a different one each letter (below).
6. **Celebrate** — 1, 2 or 3 stars, the sticker dropping into the Star Pouch, and anything new in Lucy's closet. It settles itself after 8 seconds, and **Skip** (or a tap on the background) settles it sooner. The big button always names the letter that opens next (**Play Letter B**), whether that is the next one in the set or the next one on the trail.
7. Tabs: **Play Cards · ABC Trail · Star Pouch**.

A wrong tap wobbles coral and lets them try again. Nothing punishes. Nothing times out.

### The bonus round

The third step is one short game, decided by the letter, so a 3-letter round plays three different games:

| Letter | Game | What the child does |
|---|---|---|
| A, D | **Letter Hunt** | Tap all three hiding **A**s and **a**s among eight tiles |
| B | **Sound Sort** | One picture at a time: does it start with /b/? **Yes** or **No** |
| C | **ABC Order** | Three letters, tapped in alphabet order |

The bonus is single-tap — there is no prompt to match, so there is no second tap. **Bonus misses never cost a star**; stars still come from the two matches only. After two misses (or twenty seconds) a quiet **Skip to stars** appears so nobody is stuck. Grown-Ups → Play can pin one game for the whole day, or switch the bonus **Off** — then a letter runs case match → picture match → celebrate, as before.

#### How to set today's bonus (30 seconds)

1. **Grown-Ups** → **Play** tab → **Bonus round**.
2. Pick one:
   - **Rotate** — leave it here for a normal morning. The letter picks the game, so a 3-letter round plays three different ones and nobody gets bored.
   - **Hunt** / **Sound** / **ABC** — every letter runs that one game all day. Use this when you are teaching that skill, or when a child needs the same shape three times to get it.
   - **Off** — a letter is two steps again (case match → picture match → celebrate). Use it when the rotation is running short, or for a child who is done after the matches.
3. Close with **Return to Letter Play**. It takes effect on the **next letter**, not mid-round — a child already in a round finishes the one they are in.

The setting lives on the tablet and survives a power-cycle, so check it Monday if someone else had the cart. It also rides along in **Export CSV**, so setting one tablet and importing on the rest sets the whole cart.

**Which one to pin, if you are not sure:** **Sound** is the one that carries phonics (does *ball* start with /b/?). **ABC** is alphabet-song order, and it is the only place Lucy says letter *names* on a tap. **Hunt** is the easiest and the best for a wobbly first week.

**All 26 letters are awake.** A–Z each run the full letter — case match → picture match → bonus → celebrate — off a pool of **15 pictures**, so the same letter is a different board every time. There is nothing left to wake and nothing that refuses to open: pin any letter, tap any tile.

On the **ABC Trail**, a gold ring and a **Next up** tag mark the letter the next PLAY opens. If you pinned a letter of the day it also carries a blue ring and a small flag.

All 390 pictures are drawn (flat SVG stickers, A–Z). Every one of them still carries its own emoji as a fallback, so two cards on a board can never show the same plate, and each letter's own picture (**J is for Juice**, **X is for Xylophone**) is one an older tablet can definitely draw.

---

## Put it on a classroom tablet (once)

You need a folder of files, not an app store.

1. Copy the `app` folder onto the tablet (or serve it from a classroom cart page).
2. Open it in **Chrome** (Chromebook) or **Safari** (iPad).
3. It **must** be `http://` or `https://` — opening the file from the desktop will not play sound or work offline.

On a laptop for a demo:

```
cd app
python3 -m http.server 8000
```

Then open **http://localhost:8000/**. It has to be that http URL — `file://` will not play sound or work offline.

From the same `app/` folder, the gates (no browser, no network):

```
node _check.mjs
node _flow.mjs
```

Smoke bookmarks on that same server. **http://localhost:8000/_smoke.html** with no query is the index — every tested URL on one clickable page, grouped by what it sets up. That is the only one worth bookmarking; the rest are links on it:

- http://localhost:8000/_smoke.html — the smoke index (all of the below, clickable)
- http://localhost:8000/_smoke.html?classroom=1&kid=k01&play=A
- http://localhost:8000/_smoke.html?classroom=1&clearKid=1 — face grid, nobody playing
- http://localhost:8000/_smoke.html?play=E — letter E, a real round (any of A–Z works here)
- http://localhost:8000/_smoke.html?play=9 — not a letter, lands on the trail and Lucy names the letter that is up
- http://localhost:8000/_smoke.html?pin=C — pin the letter of the day (`?unpin=1` clears it)
- http://localhost:8000/_smoke.html?bonus=sound&play=A — pin one bonus game (`off·rotate·hunt·sound·order`)
- http://localhost:8000/_smoke.html?outfit=cap — dress Lucy from the closet (`?outfit=` clears it)
- http://localhost:8000/_smoke.html?mode=whiteboard
- http://localhost:8000/_smoke.html?mode=whiteboard&hideChrome=1
- http://localhost:8000/_smoke.html?gu=device — straight into Grown-Ups → Device (still asks for the PIN)
- http://localhost:8000/_smoke.html?reset=1

Icons (optional regen; stdlib PNG writer, Pillow used if installed):

```
python3 icons/make-icons.py
```

### Add to Home Screen (iPad)

Safari → Share → **Add to Home Screen**. Use landscape. The icon is the yellow paw.

### Chromebook / cart

Bookmark the page, or install it as a Chrome app (the install icon in the address bar). Fullscreen with F11 if the kids can reach the shelf.

Landscape. If a tablet is portrait, Lucy asks them to turn it.

---

## First morning: Set up this device (offline)

Do this **once per tablet, on school Wi-Fi**, before the cart goes into a dead-zone classroom.

1. Open Ready Set ABC.
2. Open **Grown-Ups** (see PIN below).
3. Tap **Device**.
4. Tap **Set up this device**. Watch the bar fill.
5. When it says **Pinned** plus the shell version (Grown-Ups → Device, currently `rsabc-shell-v34-eleven-sfx`), you can turn the radio off.

The tablet now keeps this exact shell. It will **not** silently update mid-week. If someone drops a newer copy of the files on the server, the tablet quietly downloads it and then **waits** — the swap only happens when a grown-up taps **Get update**. No child has ever had the app change under them mid-round, and that is on purpose.

**Get update** (same screen, school Wi-Fi on) is how you pull a newer pin later. Do it on a prep period, not during a round. It takes three beats, and the screen tells you which one it is on:

1. *Fetching the pinned shell…* — it is downloading the newer copy. On a slow prep-period connection this is the long part; the bar has not started yet because the new shell is still installing itself.
2. *Pinned `…` · N files cached* — the files are on the tablet.
3. **Reload to finish** — a button appears next to the other three. Until you tap it the tablet has the new shell but is still **running** the one it opened with. Tap it. It takes a second and drops you back on Home.

If step 3 never appears, there was no newer copy to get — the tablet was already on the pinned version, and it just re-checked every file. That is a fine thing to have done.

Off Wi-Fi, **Get update** and **Set up this device** both say so and stop. They never touch the files the tablet already has, so tapping either one by accident in a dead-zone room cannot break a morning.

**Check offline files** (same card) re-reads the tablet's actual cache and counts it against the list in `sw.js`. Use it before a dead-zone morning. Three answers:

| It says | What it means | What to do |
|---|---|---|
| *Checked just now · all N files cached* | Genuinely ready. | Turn the radio off. |
| *Only 66 of 81 files are cached…* | Chrome evicted part of it (usually a full disk). | Back on Wi-Fi, tap **Set up this device**. |
| *Nothing is cached on this tablet* | It was never set up, or site data was cleared. | Back on Wi-Fi, tap **Set up this device**. |
| *All N files cached on `…`, but this page is running `…`* | A **Get update** finished and nobody tapped **Reload to finish**. | Reload the tablet. Nothing is wrong with the files. |

That check is the one that matters: the tablet used to just repeat the note it wrote itself the first morning, which stayed cheerful even after the files were gone.

Comfortaa and Nunito Sans **ship inside the app** (`app/fonts/`, SIL Open Font License) and are precached with everything else. There is no Google Fonts request, so a tablet with the radio off paints the real letters and first paint never waits on a network that is not there. If Chrome ever evicts a font file, the letters fall back to the rounded system fonts already on the tablet and play carries on. See `fonts/README.md`.

---

## Grown-Ups (keep this away from 3-year-olds)

Three ways in:

| How | Where |
|---|---|
| Slate **Grown-Ups** button | top right, deliberately boring |
| Hold the yellow paw logo | 3 seconds |
| Keyboard | **Shift+T** (Grown-Ups) · **Shift+H** (hide chrome) |

The keypad accepts **either**:

- the PIN **`1234`**, or
- the sum on the card (example: `3 + 5` → tap `8`)

**Esc** or **Return to Letter Play** closes it. Wrong PIN just clears. Nobody gets locked out.

### Play tab — before the kids sit down

| Control | What to do |
|---|---|
| **Letters per round** | Default **3**. Use **1** for a tiny group. |
| **Answer cards** | Default **3**. Whiteboard groups often like **4**. |
| **Case hunt** | Mix / Little / Big. Mix is 50/50. |
| **Bonus round** | **Rotate** (default) · pin **Hunt** / **Sound** / **ABC** · **Off**. Off makes a letter two steps again. |
| **Word print** | On = the word under the picture, first letter highlighted. |
| **Hint after misses** | Glow the answer after 2 misses. Off = never. |
| **Stars** | **Save** (this tablet, recommended) · Session · Off |
| **Letter of the day** | Tap a letter to pin it. Rounds start there until you unpin. |

**Family note** is the take-home blurb, written out in full under the letter picker so you can read it before you send it. It is written for the letter the **next PLAY actually opens** — your pin if you set one, the ABC trail if you did not.

**Copy family note — A is for Apple** puts it on the clipboard, ready to paste into a newsletter, a class message or a take-home slip with no editing:

```
Ready Set ABC — Aa · Tuesday, September 8

Today in Ms. Brandy — Pre-K AM we played the letter Aa with Lucy.
A is for Apple. The sound is "aaa" /æ/ — that is the sound the letter makes, not its name.

At home tonight:
1. Say the sound together three times: aaa, aaa, aaa.
2. Hunt for it around the house: Alligator, Astronaut, Ant — say the sound first, then the word.
3. Draw a big A and a little a, and let your child point to the little one.

In class we matched big A to little a, found the pictures that start with "aaa", and collected stars with Lucy.

Ready Set ABC · Pre-K Phonics with Lucy
```

The class name is your own from the Class tab, the words come from that letter's picture pack, and the sound is spelled the way Lucy says it — the letter *name* is the thing families reach for first and the one thing that does not help. Nothing about pins, cursors or trails goes in the note; that is Grown-Ups language.

If the tablet refuses clipboard permission (it happens on a locked-down cart Chromebook), the note is selected in the box for you — press **Ctrl+C**. Paper for the table is on the **Print** tab.

Unpin = tap the same letter again. Unpinned rounds follow the ABC trail (A → B → C → D → A).

### Sound tab

Three independent switches: **Music / Sound effects / Voice**. Mute music does not mute Lucy. Mute voice does not mute taps. Music ducks while Lucy talks, then comes back.

Kids also have the same three dots in the header (prefs only — they do not unlock the speaker). Sound stays silent until someone taps **PLAY!** — that first tap is what unlocks the tablet speaker.

**Test name / sound / word / cheer / nudge / stars** if a cart Chromebook is muted. Those tests also unlock, so a grown-up can hear the cart without walking back to Home.

Lucy talks in three separate channels and they never borrow from each other:

| Channel | When | What she says |
|---|---|---|
| **name** | the board appears | the letter **name** — “A!” |
| **phoneme** | a letter card is tapped | the **sound** — `ah`, `buh`, `kuh`. Never the name. |
| **word** | a picture card is tapped | just that picture’s word — “Apple!” |

The one place Lucy says a letter **name** on a tap is the **ABC Order** bonus, because that game is the alphabet song, not a sound match. Letter Hunt taps say the **sound**; Sound Sort taps say the **word**.

Lucy’s recorded clips are **not in the folder yet**. Names, letter sounds, and words stay silent until a clip is mapped. The words are always on screen as well, so nothing in a round is waiting on a recording. Success chimes are sound effects, not speech.

`data/audio.json` is the recording checklist. Every clip she still owes is listed there as a **silent placeholder** (`null`): 26 letter names, 26 letter sounds, the 390 picture words (plus a `word-<L>` fallback per letter), 6 cheers, 4 nudges. Nothing is fetched, so nothing 404s offline. `node _check.mjs` fails if a picture in `data/letters.json` has no placeholder, so a letter can never be woken without being added to Lucy's list.

To ship a real clip: drop the file in `app/audio/`, move its id out of `placeholders` into `clips` with the filename, add the file to `SHELL` in `sw.js`, then bump `VERSION` in `sw.js` and `APP_VERSION` in `js/version.js`. `node _check.mjs` fails if a mapped clip has no file or is not pinned for offline.

A `phoneme-` clip that points at the same recording as that letter’s `name-` clip is **dropped** rather than played — saying “A” on a choice tap is the one mistake this app will not make.

### Class tab — roster

Turn **Face pick before play** **On** for a real class (Ms. Brandy — Pre-K AM ships with 24 faces).

- PLAY then goes to the face grid.
- Stars and notes are **per child on this tablet**.
- Tap the name chip in the header to switch kids.

Turn it **Off** for a demo, a hallway iPad, or the wall board — PLAY goes straight into the round and the tablet keeps one shared Star Pouch.

Who is playing sticks through a reload, a home-screen relaunch and a cart power-cycle. It is released when the child taps the name chip, when you tap **Clear** on this tab, when you **remove that child** from the roster, or when an **Import CSV** brings a class list that has no such child. Every one of those sends the next PLAY back to the face grid — a round is never banked to a name that is not on the roster.

**Class name** — the first card on this tab. Whatever is in that box is printed on **every certificate, small-group sheet and roster card**, and shown above the face grid and in the Grown-Ups header. Leave it blank and it follows `data/roster.json` (`Ms. Brandy — Pre-K AM`); type over it and yours wins. Do this the moment you **Import CSV** from another room's tablet — the roster changes but the shipped class name does not, and 24 certificates with the wrong room on them is a whole print run wasted. **Use class file** puts it back. It rides along in Export CSV, so the second tablet in the room prints the same name; a CSV made before this existed imports fine and falls back to the class file.

Roster tools (this tablet only, never writes the class file):

- Add / remove a child
- **Notes** field under each face — type, it saves on the spot, kids never see it. Notes stay **on this tablet**: they ride along in Export CSV and nowhere else.
- **Reset to class file** — back to the 24 shipped names

**Copy this tablet** (same Class tab — kids never see this):

- **Export CSV** — class name, class list, per-letter stars, stickers, notes, what Lucy is wearing, and Grown-Ups settings (round size, choices, case hunt, words, hints, bonus round, star mode, mutes, device mode, letter pin, ABC cursor)
- **Import CSV** — replaces this tablet with that file. Confirm first.
- Older name-list files (`name,emoji,color`) still import as a class list only; stars stay with matching names and settings stay put
- With **Class off**, the tablet itself is the player and has no name row, so its last play date rides along as the `deviceLastPlayed` setting — a copy still knows the cart played today

Opens in Google Sheets. Export on tablet A, import on tablet B, to copy the picture. There is no cloud merge.

#### Back up a tablet (and put it back)

Everything the children have done lives in that one tablet's browser storage. A wiped Chromebook, a cleared site-data, a tap on **Erase this device** — all three take the stars with them. The backup is the CSV, and it takes about a minute.

**Back it up** (end of term, before you hand the cart to IT, or any Friday you care about)

1. **Grown-Ups** → **Class** tab → **Copy this tablet** → **Export CSV**.
2. The browser saves **`ready-set-abc.csv`** to that tablet's Downloads. It says *Saved ready-set-abc.csv — class list, stars, notes and settings.*
3. Get it off the tablet — email it to yourself, drop it in Drive, or copy it to a stick. A backup that only exists on the tablet you are about to wipe is not a backup.
4. Rename it with the room and the date (`pre-k-am-2026-06-12.csv`). The app does not care what it is called on the way back in.

**Put it back** (new tablet, wiped tablet, or the second tablet in the room)

1. **Grown-Ups** → **Class** → **Import CSV**, and pick the file.
2. It asks first: *Replace this tablet's class list, stars, notes, and Grown-Ups settings with this file?* Say yes only if you mean it — **import replaces, it never merges**. Whatever is on this tablet is gone.
3. It comes back with the class name, the 24 faces, every child's stars and stickers, your notes, what Lucy is wearing, and your Grown-Ups settings, including the bonus round and the letter pin.

What a backup does **not** carry: nothing at all lives on a server, so there is no other copy anywhere. Two tablets that both played this morning cannot be added together — pick the one you keep records on, back that one up, and import it onto the other.

### Print tab — paper for the table

Three printables, straight from the tablet to the hall printer. Nothing is uploaded, nothing is saved, and it works with the radio off — the page is built on the tablet and handed to the browser’s own print dialog. **Save as PDF** in that dialog works the same way.

Every card has **Print** and **Preview** (Preview shows the real page at 42% inside Grown-Ups, so you can check it without walking to the printer).

The card at the top picks the letter. It follows the letter you pinned on the **Play** tab, or the ABC trail if nothing is pinned; tap a letter here to override just the printing, and tap it again to go back to following Play. That override is for **one print job**: the moment you move the pin on the Play tab, printing follows the room again, so last week's override can never quietly send home a stack of certificates for the wrong letter.

Every sheet carries the **Class name** from the Class tab, so a tablet that imported another room's roster prints that room, not the shipped one.

| Sheet | What comes out |
|---|---|
| **Certificate** | One **landscape** page per child: the big `Aa`, the child’s name on a ruled line, `A is for Apple`, the sound, and their stars filled in. Blank date and teacher lines. Choose **Whole class · Played today · Just \<child\> · Blank name**. |
| **Small-group sheet** | One upright page for the adult running the table: the letter’s name/sound/anchor word, the 6–8 minute script, what to set on the tablet, the 15-word bank with tick boxes, and a turn-taking grid. Grid rows are your **roster names** or **blank rows**. |
| **Roster cards** | Cut-apart name cards, **8 to a page**, each with the face, the name, the class, and a star box for **every letter A–Z** (two rows of 13). Print **this tablet’s stars**, or **blank boxes** to colour in as children finish letters. Good for centre rotation tokens or cubby labels. |

In the print dialog turn **Background graphics on** — that is what keeps the gold stars and the letter tile — and leave **Margins** on **Default**.

The certificate page asks the printer for **landscape** by itself and the other two ask for upright. Chrome and recent Safari honour that. Firefox and older browsers do not read per-page orientation, so they print the certificate **upright** — it still fits and is still readable, but if you want it sideways set **Layout → Landscape** in the dialog by hand. Nothing on the certificate is pinned to a sideways width, so neither way loses a line or spills onto a second sheet.

Stars on the certificate and the roster cards come from **this tablet** (Grown-Ups → Play → Stars must be **Save** or **Session**). With stars **Off**, everything prints blank for hand-marking.

With **Face pick before play Off** the tablet keeps one shared Star Pouch and nothing is filed per child, so the certificate offers only **Whole class** and **Blank name**, and the star boxes print **empty to colour in**. Printing one tablet's shared stars under twenty-four different names would be a guess on paper that goes home. Turn face pick **On** to print each child's own stars.

#### How to print — the three walkthroughs

**Certificates for the whole class (Friday, ~2 minutes)**

1. Print from **the tablet the children actually played on** — that is where the stars are. If the class was spread over two tablets, Export CSV from one and Import on the other first, or print from each.
2. **Grown-Ups** → **Print** tab.
3. Top card: check the **letter**. It follows the letter you pinned on **Play**, or the ABC trail. Tap a letter here to print a different one without changing what the kids are playing; tap it again to go back to following Play.
4. **Certificate** card → **Who** → **Whole class** (or **Played today** for just this morning's children, **Just \<child\>** for one, **Blank name** for a spare pile).
5. Tap **Preview** first. It shows the real page at 42% inside Grown-Ups — check the letter and a name before you walk to the printer.
6. Tap **Print**. In the browser's dialog turn **Background graphics on** (that is the gold stars and the letter tile) and leave **Margins** on **Default**. The page asks for **Landscape** on its own; if your browser shows it upright, set **Layout → Landscape** by hand. Then print — **Save as PDF** in the same dialog if you want to email them.
7. One page per child. Date and teacher lines are blank on purpose — sign them at the table.

**Small-group sheet (before you run the table)**

1. **Grown-Ups** → **Print** → check the letter on the top card.
2. **Small-group sheet** → **Print**. Upright, one page, background graphics on.
3. It is written for the adult, not the child: the letter's name and sound, the anchor word, the 6–8 minute script, **what to set on the tablet** before the children sit down, the 15-word bank with tick boxes, and a turn-taking grid.
4. Choose **roster names** to get the grid pre-filled with your class, or **blank rows** for a substitute or a mixed group.
5. Print it before the rotation starts. It works with the radio off.

**Roster cards (start of a unit)**

1. **Grown-Ups** → **Print** → **Roster cards**.
2. Choose **this tablet's stars** (a progress snapshot for your records) or **blank boxes** (cut them out and colour a box in as each child finishes a letter).
3. **Print**, background graphics on, upright. Eight cards to a page, each with the face, the name, the class, and an A–Z star strip.
4. Cut apart. They work as centre-rotation tokens, cubby labels, or a table-tent for a substitute who does not know the faces yet.

Nothing here is uploaded and nothing is saved — the page is built on the tablet and handed to the browser's own print dialog. If the printer is on the hall network you still need Wi-Fi for the *printer*, but not for the app.

### Device tab — mode, offline, erase

| Mode | Use it for | Tap size |
|---|---|---|
| **Center** | One kid at a table | 88px, cards ~140px |
| **Small group** | Two or three at a table | 104px, cards ~170px |
| **Whiteboard** | Wall board, kids standing | 140px, cards **220px**, high-contrast letters |

On a screen wider than 1440px the cards also grow, even in Center.

**Hide chrome** (same Device card, or **Shift+H**): hides the tabs, Grown-Ups button, sound dots, and footer so the playfield fills the wall. Lucy’s speech bubble **stays**. Hold the yellow paw (3 seconds) to open Grown-Ups when the bars are hidden.

**Erase this device** wipes stars, notes, roster edits and the pin. The class file comes back.

The offline card has four buttons and they are not the same button: **Set up this device** and **Get update** both re-download every file in the shell (the difference is that **Get update** first hands over to a newer copy if one is waiting), **Check offline files** downloads nothing and just counts what is really there, and **Reload to finish** only appears after a hand-over actually happened.

### The wall board (whiteboard mode)

For a whole-group turn on the wall board or a big touchscreen, with children standing on the rug.

1. **Grown-Ups** → **Device** → **Whiteboard**. Buttons go to 140px, answer cards to 220px, and the letters switch to high-contrast cocoa ink so a child at the back of the rug can read them.
2. Same trip: **Hide chrome** **On** (or press **Shift+H** any time). The tabs, the Grown-Ups button, the sound dots and the footer drop away and the playfield fills the board. **Lucy's speech bubble stays** — that is the prompt, so it is never part of the chrome that hides.
3. **Play** tab → **Answer cards** → **4**. Three cards on a wall board leaves a lot of empty board; 4 gives a standing group something to point at without crowding. **6** and **8** are there for an older group.
4. **Class** tab → **Face pick before play** **Off**. On the wall board nobody is filing stars under one child's name, so the board keeps one shared Star Pouch and PLAY goes straight into the round.
5. **Return to Letter Play**. Hand the pen or let them come up and tap.

To get back into Grown-Ups with the bars hidden: **hold the yellow paw logo for 3 seconds**, or press **Shift+T**. Both still ask for the PIN. **Shift+H** brings the chrome back.

Landscape, as always — a portrait board gets the rotate screen. On a screen wider than 1440px the cards grow again on top of whiteboard sizing.

Two smoke bookmarks set this up on a laptop without any tapping: `_smoke.html?mode=whiteboard` and `_smoke.html?mode=whiteboard&hideChrome=1`.

---

## A normal morning

1. Charge the cart. Open the app (it should load offline).
2. Grown-Ups → **Play** → pin today’s letter (or leave it on the trail).
3. Grown-Ups → **Class** → Face pick **On** if you want names.
4. Grown-Ups → **Device** → **Whiteboard** if this is the wall board. Turn on **Hide chrome** (or **Shift+H**) so the bars drop away — Lucy’s prompt stays.
5. Hand the tablet over. A child taps **PLAY!**.

If a grown-up is running the table, print the day's paper first: Grown-Ups → **Print** → **Small-group sheet**. Certificates at the end of the week.

They tap a card, then tap the big letter. Lucy talks. Stars land. Next letter.

At the end of a 3-letter round the big button reads **Play Letter D** (or whatever the ABC cursor landed on — it wraps after D, and a pin holds it still). **Home** goes back to Lucy.

---

## What the stars mean

| Stars | How they got there |
|---|---|
| 3 | Clean match, no hint |
| 2 | 1–2 misses |
| 1 | A hint, or 3+ misses |

Best result per letter stands. ABC Trail shows them. Star Pouch lists every picture sticker a child has matched.

### Lucy's closet (Star Pouch)

Stars also unlock dress-ups for Lucy. They are never spent — a treat unlocks and stays unlocked.

| Stars | Treat |
|---|---|
| 3 | Party bows |
| 6 | Teacher specs |
| 9 | Big bone |
| 12 | Ball cap |
| 18 | Rainbow collar |
| 24 | School pack |

The rungs are 3 or more stars apart and a letter is worth at most 3, so a child opens **one treat at a time** — never three in a heap they cannot take in.

Tap an open treat in the Star Pouch and Lucy **wears** it — on every screen, until someone taps it again to take it off. One at a time. The shelf does not jump: the tap repaints the cards where they are. It is saved on the tablet (`rsabc.outfit`) and travels in the CSV.

The card the child has not reached yet never says *locked* at them. The nearest one counts down (**2 more stars**) with a little filling bar; the further ones just name their number (**24 stars opens it**) and are not buttons at all, so no tap can be refused.

**The celebrate card hands over to the pouch.** A treat that just opened arrives there with a **Put it on Lucy** button and *It lives in your Star Pouch now*. When a letter opened nothing, the same slot names how close the next one is (**2 more stars opens Ball cap**) — so the Star Pouch is somewhere a child is heading.

That row and the two big buttons are **pinned** to the bottom of the celebration. On a 1366×768 cart Chromebook the stars and the trophy do not fit above them, so those scroll; the hand-off and **Play Letter B** never do. (The trophy card being cut off on a short screen is a Step C sizing job, not a closet one.)

### The Star Pouch when it is empty

| What the tablet is | What the pouch says |
|---|---|
| Brand new | *Nothing here yet — tap Play Cards and match a letter with Lucy.* The closet is there, counting down to Party bows. |
| Stars, no stickers yet | *Your stars are here! Match a picture with Lucy to earn a sticker too.* |
| **Stars are off** (Grown-Ups → Play) | No count, no closet: *The pouch is resting today — Lucy still loves playing letters with you!* The line telling you to turn stars back on is grey and for you, not the child. Lucy is plain. |

---

## If something is wrong

| What you see | What to try |
|---|---|
| No sound | Tap the giant **PLAY!** once. Check the three header dots (Voice should be on). Check the tablet volume. Grown-Ups → Sound → Test cheer. |
| Blank cream screen | You opened `index.html` as a file. Serve it over http. |
| A letter tile does nothing | Every letter A–Z opens. If a tap does nothing at all, the page is mid-render — wait a beat and tap again, or go Home and back. |
| A picture you would not have chosen | The pools are in `data/letters.json` under that letter. Q, U, X and Y are thin on purpose — those are the words that exist. |
| An empty box where a picture should be | That tablet's emoji font is older than the picture. Every **letter's own** picture is deliberately an old, safe one, so this is at worst one card in a pool of fifteen. Chrome → update the tablet. |
| Face grid keeps coming back | That child is no longer on the roster (removed, or an Import CSV replaced the class). Pick a face again, or re-add them on the Class tab. |
| Old version after a file drop | Grown-Ups → Device → **Get update** on Wi-Fi. A newer copy installs and then waits on purpose — **Get update** is the tap that swaps it in. |
| Would not open in a dead-zone room | Back on Wi-Fi: Grown-Ups → Device → **Check offline files**. If it is short of the full count, tap **Set up this device** and watch the bar fill. |
| Two tablets disagree on stars | Expected. Export CSV from the one you use for records, Import on the other. |
| **Copy family note** said it could not reach the clipboard | A locked-down cart Chromebook blocks it. The note is already selected in the box above the button — press **Ctrl+C**. |
| Kid opened Grown-Ups | Unlikely. Close with **Return to Letter Play**. PIN is 1234 if you need it. |
| Child stuck on the bonus | Wait a moment — **Skip to stars** appears after two misses or twenty seconds. Or turn the bonus off in Grown-Ups → Play. |
| Celebration goes on too long | It stops itself at 8 seconds. **Skip** (top right) or a tap on the background stops it now. |
| Trophy card looks cut off after a letter | A short screen. The stars and trophy scroll; the sticker, Lucy's treat and **Play Letter B** stay put at the bottom. |
| Star Pouch says the pouch is resting | Stars are **Off**: Grown-Ups → Play → Stars. Nothing is being kept, so there is no closet to show. |
| Portrait iPad | Turn it sideways. The rotate screen is on purpose. |
| Certificate printed with no colour | The print dialog has **Background graphics** off. Turn it on. |
| Certificate printed upright, not sideways | Your browser does not read per-page orientation (Firefox, older Safari). The sheet still fits. Set **Layout → Landscape** in the dialog if you want it sideways. |
| A blank page after every certificate | The printer is enforcing wider margins than the page asks for. Set **Margins → Default** in the dialog. |
| Sheets print the wrong class name | Grown-Ups → **Class** → **Class name**. An Import CSV brings the roster, not the room. |
| Certificate star boxes are all empty | Either stars are **Off** on the Play tab, or **Face pick before play** is off — with face pick off the tablet has one shared pouch and no per-child stars to print. |
| Certificate printed upright | That printer ignored the landscape request. It still reads fine, or set landscape by hand in the dialog. |
| Certificate name line is blank | Nobody matched the **Who** setting — check Grown-Ups → Print → Certificate. |

---

## Tape this to the cart

One page. Print it, or copy it onto an index card and tape it inside the cart lid.

> **Ready Set ABC — Ms. Brandy**
>
> **Grown-Ups** is the slate button, top right. **PIN `1234`**. **Esc** or **Return to Letter Play** closes it. Kids never need it.
>
> **A morning (about a minute)**
> 1. **Play** → tap today's letter to pin it. *(Leave it alone and it follows the trail: A → B → C → D.)*
> 2. **Class** → **Face pick before play** **On** if you want stars kept per child.
> 3. **Device** → **Whiteboard** + **Hide chrome** if this is the wall board. Otherwise leave it on **Center**.
> 4. **Return to Letter Play**. A child taps the giant **PLAY!**.
>
> **No sound?** Tap **PLAY!** once — that first tap is what unlocks the tablet speaker. Then check the three dots in the header and the tablet's own volume.
>
> **Before a dead-zone room:** **Device** → **Check offline files**. If it is short of the full count, go back on Wi-Fi and tap **Set up this device**.
>
> **Paper (Print tab):** small-group sheet *before* you run the table · certificates on Friday · roster cards at the start of a unit. In the print dialog: **Background graphics on**, **Margins: Default**.
>
> **Bonus round (Play tab):** **Rotate** is the normal setting. Pin **Sound** for phonics, **ABC** for alphabet order, **Hunt** for a wobbly week, **Off** to make a letter two steps.
>
> **Back up / copy a tablet (Class tab):** **Export CSV** on the tablet with the stars → **Import CSV** on the other. It **replaces**, it does not merge. Get the file off the tablet.
>
> **Every letter A–Z opens.** Pin any one on the Play tab, or tap any tile on the ABC Trail.
>
> **A child is stuck on the bonus** — **Skip to stars** shows up after two misses or twenty seconds. Bonus misses never cost a star.
>
> **The celebration is long** — it stops itself at 8 seconds. **Skip**, top right, ends it now.
>
> **Turn the tablet sideways.** Landscape only.

---

## PIN, versions, storage (the sticky note)

- PIN **`1234`**
- Shell pin **`rsabc-shell-v34-eleven-sfx`** (Grown-Ups → Device)
- Content pin from `data/letters.json` (all 26 awake · 15-picture GAME-FLOW pool each · 390 plates, no two sharing an emoji)
- Saved on the tablet under `rsabc.` keys: kid, classroom, roster, settings, audio, mode, hideChrome, pinnedLetter, cursor, nextAbcIndex, stars, stickers, outfit, progress, notes, cache
- Tablet copy / backup: Grown-Ups → Class → **Export CSV** writes `ready-set-abc.csv` (format `rsabc-csv-v1`). Import replaces this tablet — it never merges.
- Paper: Grown-Ups → **Print** → certificate · small-group sheet · roster cards (`css/print.css`, `window.print()`, no server)
- **Erase this device** or clearing site data wipes it

---

## For Bradley / a substitute (short)

Vanilla HTML/CSS/JS PWA. No build. Look and chrome from `stitch/.../ready_set_abc/DESIGN.md` and the four Stitch screens (`ready_set_abc_home_screen`, `step_a_case_match_letter_a`, `step_b_picture_match_aa_is_for_apple`, `step_c_letter_celebration_stars`). Mechanics from GAME-FLOW. Tokens live in `css/tokens.css` — do not invent colours.

Kid chrome to match those screens: white-pill header tabs, mint giant **PLAY!** with a 10px lip, extruded pillow cards (solid underside, not a hairline border), sky-blue 4px select rings, Lucy in a circular home well / square Teacher panel / celebrate card, and a three-star celebration tray.

Printables are `js/screens/printables.js` + `css/print.css`: plain DOM built into `#print-root`, then `window.print()`. No popup, no PDF library, no server. Sheet geometry lives outside `@media print` so the in-panel preview is literally the page the printer gets; `@media print` only hides the app, unpins `shell.css`’s non-scrolling `html, body` (otherwise Chrome clips the job to page 1), and sets the breaks. Certificates use the named page `@page rsabc-cert` for landscape and degrade to portrait where that is unsupported.

A letter is four steps: `js/screens/match.js` runs case and picture (one module, one two-tap board), `js/screens/bonus.js` runs the rotating game, `js/screens/celebrate.js` runs the stars. `js/round.js` owns the state machine (`STEPS`), `js/bonus.js` builds the bonus board (rotation is `letterIndex % 3`), `js/closet.js` owns the treat list, what Lucy is wearing, and **every word the closet says** (`treatStatus` / `closetLine` / `nextTreatNudge`) so the pouch and the celebrate card cannot drift and nothing scolds. The rungs stay ≥3 stars apart on purpose: a letter is worth at most 3, so `newlyUnlocked()[0]` can never silently drop a second treat — `_flow.mjs` holds the ladder to it. A wear tap repaints the shelf in place (plus `ctx.foot()` for the footer); re-rendering would scroll a child back to the top mid-tap. Bonus taps go through `round.bonusTap()` and never touch `round.misses` — that is what makes it a bonus. Celebrate caps its own juice at `CELEBRATE_MS` (8s) and `settle()` is what Skip, Esc and a background tap call.

This README is gated too: `_flow.mjs` holds it to the PIN the keypad takes, the filename Export CSV writes, the whiteboard sizes in `css/tokens.css`, the real length of `SHELL`, and every `#anchor` in the Start here table — a renamed heading fails the gate instead of quietly sending a teacher nowhere. It is not in `SHELL`, so a README pass alone does not need a `VERSION` bump.

Dev, from `app/`: `python3 -m http.server 8000` then http://localhost:8000/ · `node _check.mjs` · `node _flow.mjs` · `python3 icons/make-icons.py`. Smoke: open `_smoke.html` with **no query** — that is the index of every tested URL, grouped and clickable. The individual bookmarks still work directly: `_smoke.html?classroom=1&kid=k01&play=A`, `?classroom=1&clearKid=1`, `?play=E`, `?play=9`, `?pin=C`, `?unpin=1`, `?bonus=sound`, `?outfit=cap`, `?stars=A3,B2&to=%23/pouch`, `?progress=none&to=%23/pouch`, `?mode=whiteboard`, `?mode=whiteboard&hideChrome=1`, `?gu=print`, `?gu=device`, `?reset=1`. `?gu=<tab>` maps to `#/grownups/<tab>` (`play·sound·class·print·device`) and still goes through the gate — it is the only way to bookmark a Grown-Ups panel, and `_check.mjs` fails if a tab in `grownups.js` has no bookmark for it. Old hashes `#/pickme` `#/map` `#/letter/A` `#/teacher` still resolve; `#/letter/<any of A–Z>` opens that round, and `#/letter/<not a letter>` (`?play=9`) lands on the trail with Lucy naming the letter that is up. Shift+H hides chrome; Lucy’s prompts stay. Self-hosted offline fonts: `fonts/README.md`.

Offline is `sw.js` + Grown-Ups → Device. `SHELL` is the whole precache list and `_check.mjs` fails if a runtime file (or a mapped Lucy clip) is missing from it, or if `VERSION` and `js/version.js`’s `APP_VERSION` drift. The worker **does not** `skipWaiting()` on install: a newer pin installs and waits, and only the `SKIP_WAITING` message from **Get update** hands over — that is what “nothing changes mid-round” actually rests on. Registration passes `updateViaCache: 'none'` in both `js/app.js` and the Device panel, or the HTTP cache re-pins the version the cart already has. Runtime caching only stores a same-origin `200` (a ranged `206` from `<audio>` throws inside `cache.put`, and an opaque body has no readable status), never `sw.js`, and never a `_`-prefixed dev file — so a smoke bookmark always runs the copy on disk. Each shell fetch is retried once, because school Wi-Fi drops one request far more often than it stays down and a half-cached shell is the failure nobody can diagnose. The `HEALTH` message counts what is really in the cache; **Check offline files** is that read, and it is why the Device tab can contradict the note it wrote itself on setup day. **Get update** waits out `reg.installing` before it looks at `reg.waiting`: `reg.update()` resolves as soon as the newer `sw.js` has been *fetched*, and that worker then spends the whole precache in `installing` — a Get update that checked `waiting` at that moment found nothing, talked to the worker the cart already had, and re-pinned the version it was trying to replace. After a hand-over the page is still the modules the old pin served, so the panel shows a **Reload to finish** button and says so rather than pretending the swap is done. Both cache buttons short-circuit on `navigator.onLine === false` (every shell fetch is `cache: 'reload'`, so off Wi-Fi they can only fail), and a precache error is truncated — the failure list is for the log, not for a teacher.

`_check.mjs` does not trust the `SHELL` list against a directory scan alone: it walks the import graph from `js/app.js` and every module it reaches has to exist and be pinned, wherever it lives, and it resolves local `url()` in every stylesheet the same way. A new module in a folder nobody thought to scan is exactly how a shell goes half-offline.

Audio is `js/audio.js`: three Web Audio buses (music / sfx / voice), one unlock gate behind the giant PLAY, music ducked to 16% for the length of a voice line, and three clip namespaces built only by `clipId` so a phoneme tap can never reach a name recording. `data/audio.json` + `audio/README.md` are the recording checklist — 128 silent placeholders, nothing mapped, nothing fetched.

**Not yet:** recorded Lucy voice (the checklist is written — `audio/README.md`). Two-tablet copy is Export / Import CSV (replace, not a silent merge).

Lucy is a drawn golden retriever. Glasses when she teaches. Bows when she celebrates. She talks and moves. A still photo of a dog is a failed Lucy. Her closet is `data-wear` on the same SVG (`css/shell.css`), independent of the pose — teaching Lucy in a ball cap is correct.

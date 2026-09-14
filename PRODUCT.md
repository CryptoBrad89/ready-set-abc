# Ready Set ABC — one product story

This is the story the app follows. [PLAN.md](PLAN.md), [UX-FROM-STITCH.md](UX-FROM-STITCH.md), and [LOCAL-BUILD.md](LOCAL-BUILD.md) are older notes. If they disagree with this file, this file wins.

**Who this is for.** Bradley and Brandy, and the next person who opens the tablet or the repo.

**What you get.** One login, one Home, one teaching order, one Grown-Ups area. School and home use the same product.

---

## What the words mean

**Login** is the roster. Adult tiles and child tiles. First screen every time someone opens the tablet.

**Home** is the pop-art comic hub. Yellow header. Blue dotted page. Lucy. Star bank. Tabs. Game cards. You only see it after a name is chosen.

**SATPIN** is the default first letter group. **S, A, T, P, I, N.** It is a teaching order, not the name of the website and not the Stitch look.

**Grown-Ups** is the adult area behind PIN `1234`. Parent and teacher are the same person-type. Child and student are the same. Add as many children as you need.

**Arcade lock** hides nothing. Locked tiles stay on Home. A tap wobbles and plays the miss sound.

---

## How a session works

1. Open the tablet. You see the roster.
2. Tap a child. That child's Home appears. Phonics cards follow that child's work mode.
3. Tap the adult tile. Enter the PIN on the pad or the keyboard. That adult's Home appears.
4. Grown-Ups in the header opens the same PIN, then the settings sheet.

Work mode on each child is one of these.

- **Default SATPIN.** Cloud 1 letters. S, A, T, P, I, N.
- **Assigned letters.** The adult picks the letters. Those letters are that child's work.
- **Free play.** The child may choose any letter.

Arcade on or locked is a separate toggle on the same child sheet. It does not change the phonics path.

---

## What Home cards do

**Letters & Phonics row.** Today's mission, the featured sound, the SAT blend card, and Case Match. These start real phonics play for that child's letters.

**Storybooks.** Lucy's Picnic Day is a picture story for this letter. It is not the four-beat lesson.

**Fun row.** Rhymes & Songs and Coloring Canvas stay on the page as their own destinations. They do not restart the letter loop. Puppy Treat Match is Arcade. A locked Arcade tile stays visible.

**Lucy's Closet.** Dress-up. Stars, not a ticket shop.

Tabs mean what they say. Home is the lobby. Letters & Phonics is the path. Storybooks is stories. Arcade is extra games.

---

## What stays

Lucy Imagine plates in `app/art/lucy/`. Offline PWA. No Tailwind from the internet. Comfortaa for letters. Music, SFX, and Voice as three mutes. The header voice control mutes Lucy. It is not a microphone. Isolated letter sounds stay file drop-ins.

Corner Lucy is never a still sticker. First loops are Imagine plates plus Lottie sparkles around her. Rive is the editor when she must switch idle, talk, celebrate, and tail-chase as one character, and we are managing more than about four separate loops. The Rive MCP is `rive` in `~/.cursor/mcp.json`, at `http://127.0.0.1:9791/mcp`. That local process has to be running.

---

## What the code should match

Cloud 1 in `app/data/clouds.json` is S, A, T, P, I, N. **M** lives in a later cloud.

Each child record may carry `workMode`, `assignedLetters`, and `arcadeLocked`. Missing fields mean SATPIN, no custom list, Arcade open.

The roster route is login. A child tap must not start a round.

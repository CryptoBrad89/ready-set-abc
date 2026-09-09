# 03 — Peers (short teardowns + pattern table)

*Five peers, chosen for classroom relevance rather than market share. Confidence tags **[H]/[M]/[L]**. Homer and Lingokids were considered and deprioritized — see "Also-rans" at the end.*

---

## 1. Starfall (starfall.com — "ABCs" / "Learn to Read")
**Why it matters most:** it is the closest structural ancestor of what we're building, and it's already in thousands of Pre-K/K classrooms and on classroom whiteboards. **[H]**

- **IA:** the home screen for ABCs is a **flat A–Z grid**. Tap A, get A. No path, no gating, no adaptivity. **[H]** This is exactly our lock, already proven in the field for 20+ years.
- **Loop:** letter → short animation/song establishing the letter name and sound → 1–3 small interactions (pick the picture that starts with A, tap the letter) → back to the grid. Bounded, repeatable, ~2–4 minutes. **[M]**
- **Progression:** none enforced. The teacher (or the kid) picks. Teachers use it precisely *because* it obeys the letter-of-the-week chart.
- **Rewards:** essentially none. Intrinsic novelty only.
- **Teacher tools:** free tier has no per-child tracking; the paid Starfall Home/Classroom membership adds teacher accounts and printables. **[M]** Printable worksheets are a big part of the appeal to teachers. **[M]**
- **Whiteboard fit:** good — web-based, big targets, works from a browser without installs; the standard "call a kid up to tap the letter" tool. **[M]**
- **Weaknesses:** visually dated post-Flash-migration; interaction grammar is inconsistent letter-to-letter (some drag, some tap, some require precise clicks); no progress data at all; audio-dense with no per-device volume/headphone story.

**Steal:** flat A–Z grid as the primary IA · browser-first, zero-install · per-letter bounded visit · printables as a teacher feature, not a nice-to-have.
**Avoid:** inconsistent interaction grammar between letters · zero progress tracking · precise-click targets.

---

## 2. Endless Alphabet (Originator)
**Why it matters:** the best letter-sound *feel* ever shipped, and a masterclass in un-failable design. **[H]**

- **Loop:** a word appears, monsters scatter the letters, the child drags each letter back to its slot; while dragged, the letter wiggles and repeatedly *speaks its sound* in a silly voice; when the word completes, a short animation defines the word. **[H]**
- **Failure model:** you cannot fail. Letters snap to the correct slot from a generous radius; wrong placement just returns the letter home. No score, no timer, no lives, no "try again" scold. **[H]**
- **Progression:** word-first, not letter-first. Words are browsed, not sequenced. **[H]**
- **Rewards:** the payoff animation *is* the reward. No stickers, no economy.
- **Teacher tools:** none. One-time paid app, iOS/Android only. **[H]**

**Steal:** letter-says-its-sound-continuously-while-touched — this is the single strongest teaching micro-interaction in the category and it costs us one audio clip per letter · generous snap radius · payoff animation as reward · absolute absence of punishment.
**Avoid:** browse-a-word-list IA (no sequence, teacher can't pin) · drag as the *only* verb · no data.

---

## 3. ABCmouse (Age of Learning)
**Why it matters:** the biggest reward economy in early learning, and it has a real classroom SKU (ABCmouse for Teachers / ABCmouse Classroom, free for PreK–2 teachers with rosters and assignments). **[M]**

- **IA/Loop:** a "Step-by-Step Learning Path" of ~10 levels with hundreds of activities, plus open zones (Farm, Zoo, art, books). **[M]** Activities are short; navigation between them is not.
- **Rewards:** earn **tickets** → spend in a rewards store on items for a virtual room, pet/aquarium, avatar. **[H]** It works — kids are motivated — and that's the problem.
- **Teacher tools:** class rosters, assignments, progress reports in the classroom edition. **[M]**
- **Weaknesses:** the economy hijacks the session — kids will spend a 10-minute center shopping and decorating rather than learning; heavy nav depth for a 3-year-old; upsell surfaces in the consumer version; slow, legacy-feeling front end.

**Steal:** the fact that a *durable, visible, personal* collection motivates strongly at this age · teacher rosters + assignments as table stakes.
**Avoid:** currency + store. For Ready Set ABC, rewards should be **earned and auto-placed**, never purchased and never browsable mid-round. Also avoid multi-zone nav depth.

---

## 4. Teach Your Monster to Read
**Why it matters:** free in the browser, explicitly school-friendly, and it has the avatar-customization loop we're planning — the closest analog to our stickers/closet. **[M]**

- **Onboarding:** the child **builds a monster** (body, eyes, mouth, colors) before anything else. High buy-in, instantly personal, and it doubles as identity on shared devices. **[H]**
- **Loop:** a journey/island map of small phonics games (letter-sound matching, blending, tricky words), with the monster earning new parts and accessories along the way. **[M]**
- **Progression:** phonics-ordered (UK Letters and Sounds tradition), not A–Z. **[M]**
- **Teacher tools:** a free schools portal — teacher creates a class, adds pupils, gets printable logins, sees progress. **[M — verify current terms before citing]**
- **Whiteboard fit:** browser-based, works on a whiteboard; some games want precision, which hurts on a big touch panel. **[L]**

**Steal:** customization-as-identity at first run · earn-a-part-per-milestone pacing · free browser delivery with a teacher class portal · printable login/identity cards.
**Avoid:** long journey map that implies linear gating · phonics-ordered sequence we can't pin by letter · character-builder complexity (too many choices for a 3-year-old — cap it hard).

---

## 5. Osmo / physical-digital hybrids (brief)
**Why it matters as a negative control:** hardware-dependent letter games (Osmo Words/Little Genius ABCs) get cited as best-in-class for tactile letter learning, but they require a base, a mirror, specific iPads, and adult setup per station. **[M]** In a 25-kid rotation on mixed iPads *and* Chromebooks, hardware dependency is fatal. Reinforces our lock: pure web, any device, no accessories.

---

## Also-rans (why not)
- **Homer / Begin Learn & Grow:** strong interest-based onboarding personalization and good audio scaffolding, but subscription-gated, home-shaped, no classroom tools. **[M]** The one idea worth lifting: asking about the child's interests up front and skinning content accordingly — but in our case Brandy already knows the kids, so that intelligence belongs in the *teacher* suite (per-kid notes/interests), not a kid-facing quiz.
- **Lingokids:** ad-free playlist-based sessions with a parent progress area; ESL-oriented and sprawling. **[M]** One idea worth lifting: bundling activities into a **named, finite playlist** so a session has a visible beginning and end.

---

## Pattern table

| | Starfall | Endless Alphabet | ABCmouse | Teach Your Monster | Osmo |
|---|---|---|---|---|---|
| **Delivery** | Web (free tier) | Native app, paid | Web + app, sub | Web free / app paid | App + hardware |
| **Primary IA** | **A–Z grid** | Word browse | Path + zones | Journey map | Game list |
| **Letter order** | Teacher's choice | None | Curricular | Phonics | Mixed |
| **Session bound** | Per letter ✅ | Per word ✅ | Unbounded ❌ | Per game ✅ | Per game ✅ |
| **Failure model** | Mixed | **Un-failable** ✅ | Retry | Retry | Retry |
| **Reward** | None | Payoff animation | **Tickets → store** ❌ | Monster parts ✅ | None |
| **Teacher roster** | Paid tier | None ❌ | Yes ✅ | Yes (free) ✅ | No |
| **Printables** | Yes ✅ | No | Some | Logins ✅ | No |
| **Whiteboard-ready** | Yes ✅ | No | Partial | Partial | No |
| **Offline** | No ❌ | Yes | No | No | Yes |
| **Best single steal** | A–Z grid IA | Letter speaks while touched | Durable collection motivates | Customize-as-identity | — |

**The composite we want:** Starfall's A–Z grid IA + Endless Alphabet's un-failable, sound-rich micro-interaction + Khan Kids' collect-and-customize reward + Teach Your Monster's identity-at-first-run + ABCmouse's classroom roster — delivered as an offline PWA none of them ship.

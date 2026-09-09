# Ready Set ABC — Competitive Research Brief

## Product (locked first slice)
- **Name:** Ready Set ABC
- **Who:** Brandy’s Pre-K classroom only (ages 3–4), ~20–25 kids. Not a shareable product for other teachers in v1.
- **Devices:** tablets/iPads, Chromebooks, interactive whiteboard (not phones)
- **Play pattern:** mix of centers (one kid), small group around one device, teacher-led whiteboard
- **Letter order:** straight A–Z (not SATPIN/phonics order as default)
- **Kid shell:** home + map + stickers/closet
- **Content v1:** letters A–D
- **Activities:** case match + picture match + one bonus + celebrate
- **Art:** AI art from style plate + pre-recorded clips; animated real Lucy (golden puppy film character); both Lucy voices for Brandy to pick
- **Tech:** vanilla HTML/CSS/JS PWA, offline after first load
- **Teacher suite day one:** full (class grid, kid detail, CSV, print) even while kid content is A–D only
- **Tone:** balanced learning vs fun; no hard deadline — do it right
- **Prior kits/specs/Stitch:** context/soft ideas only — recommend freely including UI/UX; do not plan around old kit as architecture

## Research goal
Solid competitive pass (not a novel). Tear down peers that teach letter recognition / early phonics to ages 3–5 on tablets:
1. **Duolingo ABC** (primary)
2. **Khan Academy Kids** (primary)
3. **3–5 peers** worth stealing from or avoiding (e.g. ABCmouse, Endless Alphabet, Starfall, Homer, Lingokids — pick the most relevant)

## Deliverables (write these files under `/workspace/ready-set-abc/research/`)
1. `01-duolingo-abc.md` — teardown: onboarding, loop, letter progression, activities, rewards, teacher/parent controls, classroom fit, strengths, weaknesses, steal/avoid for Ready Set ABC
2. `02-khan-kids.md` — same structure
3. `03-peers.md` — short teardowns of 3–5 peers + pattern table
4. `04-patterns-steal-avoid.md` — cross-app patterns; explicit Steal / Avoid / Adapt for our locked constraints (classroom-only, A–Z, centers+whiteboard, teacher suite, PWA offline, A–D slice)
5. `05-implications-for-plan.md` — concrete recommendations that should shape the opinionated build plan (IA, activity design, reward loop, teacher tools, Lucy mascot use, offline UX)

Use public knowledge + reasoned product analysis. Mark uncertainty. Be opinionated and specific to Pre-K classroom (not home-subscription kids apps). Cite app features by name when known. Keep each file tight (roughly 400–900 words; peers file can be longer as a set).

Success = all five files exist, are substantive, and speak directly to Ready Set ABC’s locks.

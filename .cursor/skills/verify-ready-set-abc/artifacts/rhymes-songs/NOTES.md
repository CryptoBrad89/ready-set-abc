# Rhymes & Songs drive (4173)

Viewport 1280×800. Ava via `_smoke.html?reset=1&kid=k01`. Shell `rsabc-shell-v40-nudge-home`.

Cleared a stale v40 service-worker cache from the Picnic Day drive first. Doctor still reported v40, so a pin bump was not required. Get update / a reload picks up `js/screens/rhymes.js` on the same pin.

- Home card: Rhymes & Songs, "A short Lucy song. Tap Play and sing along.", CTA Sing along. Coloring Canvas still Coming soon.
- Idle `#/rhymes`: heading Rhymes & Songs. Chip Lucy the Pup. Lucy says Tap Play to sing with me! Button Play song. No Coming next week. `body[data-screen]` is `rhymes`. html/body overflow hidden. Snapshot `02-idle`.
- Sing: Play song → `#/rhymes/1` then auto-advance. Beat 3/4 lights "Paw on the page, stars in a cup,". No Play song while singing. Lucy stays. Snapshot `03-sing`.
- End `#/rhymes/end`: Lucy says Sing it again? Button Play song again. Snapshot `04-end`.
- `#/coming/rhymes` aliases to the same idle screen (`data-screen=rhymes`).
- Coloring `#/coming/color` still Coming next week.
- Storybooks `#/stories` still Lucy packs a picnic for P. Next page still there.

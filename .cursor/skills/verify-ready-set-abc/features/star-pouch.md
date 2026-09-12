# Star Pouch

The Star Pouch shows earned stars and picture stickers and lets a child put unlocked closet treats on Lucy. Kids mix and match. Stars are never spent.

## Sub-features

- `pouch-empty` shows the brand-new empty copy and a countdown to Party bows.
- `pouch-stars` shows a star count when stars exist even without stickers.
- `pouch-resting` shows the resting copy when Grown-Ups Stars are Off.
- `pouch-wear` puts an unlocked treat on Lucy from the shelf.

## How to get to it (user POV)

- Tap the **Star Pouch** tab.
- Smoke empty: `_smoke.html?stars=&to=%23/pouch`.
- Smoke with stars: `_smoke.html?stars=A3&to=%23/pouch` (Party bows just opened).
- Smoke resting: `_smoke.html?progress=none&to=%23/pouch`.
- After a letter, the celebrate card hands off to the pouch.

## Driving it with the browser

Preconditions:

- `verify-rsabc doctor` is OK on port 4173.
- Viewport is landscape 1280×800.
- Navigate to `verify-rsabc smoke 'reset=1&classroom=0&stars=A3&to=%23/pouch'`.

- **See the pouch.** `body[data-screen]` is `pouch`. A count `3` and copy `stars in the pouch`. Empty-sticker line `Your stars are here! Match a picture with Lucy to earn a sticker too.` Snapshot `artifacts/star-pouch/01-pouch.aria.txt` and screenshot `artifacts/star-pouch/01-pouch.png`.
- **Wear Party bows.** Choose the treat whose name includes `Party bows` and is pressed/unpressed as a button (not a locked non-button). Lucy's bubble mentions the bows or `How do I look?`. The treat is `aria-pressed=true`.
- **Proof.** Read `localStorage['rsabc.outfit']` into `artifacts/star-pouch/storage.json`. Value includes the bows treat id (`bows`, as a JSON array). Screenshot `artifacts/star-pouch/02-worn.png` with Lucy wearing bows. Tap Ball cap as well if 12 stars are banked and confirm bows stay on. Tap the same treat again to take them off if you need to restore; keep the worn screenshots.

## Gotchas

- `stars=A3` banks stars without a sticker. Do not require an Apple sticker on this path.
- Stars Off (`progress=none`) hides the closet. That is `pouch-resting`, not a failed empty pouch.
- Locked treats are not buttons. A tap that does nothing on a far rung is correct.
- Wear repaints the shelf in place. A jump back to the top of the page is a regression.
- Celebrate `Put it on Lucy` is a second entry. Proving only the pouch tab does not cover celebrate hand-off; say so if you skip it.
- Outfit stacks. Wearing cap keeps bows on. Tap a worn treat to take that one off.

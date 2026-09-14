# Home comic-arena allowed deltas

Baseline file `baseline/home-comic-arena.png` is the Stitch PNG.
Do not edit that file.

Pixel-exact match is not the goal. Bradley asked for the Stitch layout
with product exceptions:

1. Lucy is our photo plates, not the Stitch CDN cartoon.
2. Grown-Ups with PIN, not Parents.
3. Music / SFX / Voice mute cluster stays.
4. Comfortaa + Nunito Sans stay (offline). No Google fonts. No Tailwind.
5. No floating TAP LUCY overlay. Lucy tap opens the existing hello dialog.
6. Card copy uses SATPIN beats and real routes. No fake XP ranks.
7. Header left is the child stamp. Brand name lives in the footer.
8. Hub may scroll. Stitch is a tall comic page.

The harness diffs a 1280x800 screenshot of `#/home` against a downscaled
crop of the baseline. A nonzero pixel diff is expected. Fail if Home is
missing the yellow header, the 4+4 card grid, or the cream hero panel.

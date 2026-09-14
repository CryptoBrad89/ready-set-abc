#!/usr/bin/env python3
"""Compare a Home shot to the Stitch baseline. Does not edit baseline.

Pixel-exact match is not the goal (see ALLOWED.md). This checks the comic
family: yellow header, ben-day blue field, cream hero. Mean delta is printed
for humans. A nonzero delta is expected.
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parent
BASE = ROOT / "baseline" / "home-comic-arena.png"
SHOT = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / "shots" / "home.png")
OUT = ROOT / "shots" / "diff.png"
SIZE = (1280, 800)


def avg(im: Image.Image, box: tuple[int, int, int, int]) -> tuple[float, float, float]:
    stat = ImageStat.Stat(im.crop(box))
    return tuple(stat.mean)


def letterbox_crop(im: Image.Image) -> Image.Image:
    """Drop the cream panel Cursor puts beside a 1280x800 page."""
    px = im.load()
    w, h = im.size
    cream = lambda p: p[0] > 248 and p[1] > 240 and p[2] > 240
    right = w - 1
    while right > w // 2 and cream(px[right, 8]):
        right -= 1
    bottom = h - 1
    while bottom > h // 2 and cream(px[8, bottom]):
        bottom -= 1
    return im.crop((0, 0, right + 1, bottom + 1))


def main() -> None:
    if not BASE.exists():
        raise SystemExit(f"missing baseline {BASE}")
    if not SHOT.exists():
        raise SystemExit(f"missing shot {SHOT}")
    base = Image.open(BASE).convert("RGB")
    shot = letterbox_crop(Image.open(SHOT).convert("RGB"))
    fold_h = int(base.width * SIZE[1] / SIZE[0])
    fold = base.crop((0, 0, base.width, min(fold_h, base.height))).resize(SIZE, Image.Resampling.LANCZOS)
    view = shot.resize(SIZE, Image.Resampling.LANCZOS)
    delta = ImageChops.difference(fold, view)
    mean = sum(ImageStat.Stat(delta).mean) / 3
    OUT.parent.mkdir(parents=True, exist_ok=True)
    delta.save(OUT)
    header = avg(view, (0, 0, SIZE[0], 80))
    hero = avg(view, (360, 120, 980, 260))
    tiny = view.resize((160, 100))
    blue_dots = sum(1 for r, g, b in tiny.getdata() if b > r + 25 and b > 110)
    print(
        f"baseline {base.size} shot {shot.size} fold {SIZE} mean_delta {mean:.2f} "
        f"header {tuple(round(c) for c in header)} hero {tuple(round(c) for c in hero)} "
        f"blue_dots {blue_dots} diff {OUT}"
    )
    fails = []
    if not (header[0] > 150 and header[1] > 140 and header[1] > header[2]):
        fails.append("yellow header")
    if blue_dots < 40:
        fails.append("ben-day blue field")
    if not (hero[0] > 180 and hero[1] > 180):
        fails.append("cream hero panel")
    if fails:
        raise SystemExit("home is missing " + ", ".join(fails))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Generates the PWA icons (stdlib PNG writer; Pillow used if installed).

Run from app/:          python3 icons/make-icons.py
Or from app/icons/:     python3 make-icons.py
"""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

HERE = Path(__file__).resolve().parent

CREAM = (255, 248, 245)          # surface
YELLOW = (255, 184, 0)           # sunny-yellow
YELLOW_LIP = (217, 155, 0)       # sunny-yellow-press
COCOA = (37, 25, 17)             # on-surface

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False


def pixel(x, y, size):
    """Sunny-yellow disc on cream, with a cocoa A — the Stitch brand mark."""
    cx = cy = size / 2
    r = size * 0.355
    dx, dy = x - cx, y - cy
    dist = (dx * dx + dy * dy) ** 0.5
    if dist > r:
        return CREAM
    base = YELLOW if dy < size * 0.02 else YELLOW_LIP

    top, bottom = size * 0.30, size * 0.72
    stroke = size * 0.066
    if top <= y <= bottom:
        p = (y - top) / (bottom - top)
        spread = size * 0.165 * p
        if abs(dx + spread) < stroke or abs(dx - spread) < stroke:
            return COCOA
        if 0.56 < p < 0.73 and abs(dx) < spread:
            return COCOA
    return base


def raster(size):
    raw = bytearray(size * size * 3)
    i = 0
    for y in range(size):
        for x in range(size):
            r, g, b = pixel(x, y, size)
            raw[i] = r
            raw[i + 1] = g
            raw[i + 2] = b
            i += 3
    return bytes(raw)


def chunk(tag, data):
    return (struct.pack('>I', len(data)) + tag + data
            + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF))


def write_png_stdlib(path, size, rgb):
    raw = bytearray()
    row = size * 3
    for y in range(size):
        raw.append(0)
        raw += rgb[y * row:(y + 1) * row]
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(bytes(raw), 9))
    png += chunk(b'IEND', b'')
    Path(path).write_bytes(png)


def write_png(path, size):
    path = Path(path)
    if HAS_PIL:
        scale = 3
        src = size * scale
        img = Image.frombytes('RGB', (src, src), raster(src))
        img = img.resize((size, size), Image.Resampling.LANCZOS)
        img.save(path, 'PNG')
        how = 'Pillow'
    else:
        write_png_stdlib(path, size, raster(size))
        how = 'stdlib'
    print(f'wrote {path} ({size}x{size}, {how})')


if __name__ == '__main__':
    write_png(HERE / 'icon-192.png', 192)
    write_png(HERE / 'icon-512.png', 512)

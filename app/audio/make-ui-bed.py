#!/usr/bin/env python3
"""Write original CC0 UI hits + a soft music loop. No third-party samples."""
from __future__ import annotations
import math
import struct
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RATE = 22050


def write_wav(path: Path, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), 'w') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        frames = b''.join(
            struct.pack('<h', max(-32767, min(32767, int(s * 32767))))
            for s in samples
        )
        w.writeframes(frames)


def env(i: int, n: int, attack=0.02, release=0.12) -> float:
    a = int(RATE * attack)
    r = int(RATE * release)
    if i < a:
        return i / max(1, a)
    if i > n - r:
        return max(0.0, (n - i) / max(1, r))
    return 1.0


def tone_hit(freq: float, dur: float, gain=0.22, kind='sine') -> list[float]:
    n = int(RATE * dur)
    out = []
    for i in range(n):
        t = i / RATE
        if kind == 'square':
            v = 0.35 if math.sin(2 * math.pi * freq * t) >= 0 else -0.35
        elif kind == 'noise':
            v = ((i * 1103515245 + 12345) % 32768) / 16384 - 1
            v *= 0.2
        else:
            v = math.sin(2 * math.pi * freq * t)
        out.append(v * gain * env(i, n))
    return out


def chord(freqs, dur, gain=0.12) -> list[float]:
    n = int(RATE * dur)
    out = [0.0] * n
    for f in freqs:
        hit = tone_hit(f, dur, gain)
        for i, s in enumerate(hit):
            out[i] += s
    peak = max(abs(x) for x in out) or 1
    return [x / peak * 0.55 for x in out]


def music_loop() -> list[float]:
    notes = [392.00, 523.25, 587.33, 659.25, 587.33, 523.25, 440.00, 392.00]
    chunk = []
    for f in notes:
        chunk.extend(tone_hit(f, 0.42, 0.08, 'sine'))
        chunk.extend([0.0] * int(RATE * 0.08))
    return chunk


def main() -> None:
    files = {
        'sfx-tap.wav': tone_hit(760, 0.09, 0.18),
        'sfx-select.wav': chord([587.33, 880], 0.22, 0.16),
        'sfx-right.wav': chord([523.25, 659.25, 783.99, 1046.5], 0.55, 0.14),
        'sfx-wrong.wav': tone_hit(240, 0.22, 0.14, 'sine') + tone_hit(196, 0.28, 0.12, 'sine'),
        'sfx-star.wav': tone_hit(1046.5, 0.4, 0.16),
        'sfx-pop.wav': tone_hit(980, 0.11, 0.16, 'sine'),
        'sfx-woof.wav': tone_hit(180, 0.16, 0.14, 'square') + tone_hit(140, 0.2, 0.12, 'square'),
        'music-loop.wav': music_loop(),
    }
    for name, samples in files.items():
        write_wav(ROOT / name, samples)
        print('wrote', name, 'frames', len(samples))


if __name__ == '__main__':
    main()

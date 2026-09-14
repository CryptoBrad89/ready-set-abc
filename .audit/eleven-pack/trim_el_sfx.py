#!/usr/bin/env python3
"""Download ElevenLabs MP3s, trim to a short first burst, write 22.05 kHz mono WAVs."""
from __future__ import annotations

import json
import math
import struct
import subprocess
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RATE = 22050
PEAK = 0.55
WIN = int(RATE * 0.01)

CAPS = {
    "tap": 0.22,
    "select": 0.40,
    "right": 0.70,
    "wrong": 0.70,
    "star": 0.80,
    "pop": 0.25,
    "woof": 0.55,
}


def read_pcm(path: Path) -> list[float]:
    with wave.open(str(path), "r") as w:
        assert w.getnchannels() == 1 and w.getsampwidth() == 2
        n = w.getnframes()
        raw = w.readframes(n)
    samples = [
        struct.unpack_from("<h", raw, i)[0] / 32767.0 for i in range(0, len(raw), 2)
    ]
    return samples


def write_pcm(path: Path, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        frames = b"".join(
            struct.pack("<h", max(-32767, min(32767, int(s * 32767)))) for s in samples
        )
        w.writeframes(frames)


def rms_at(samples: list[float], i: int) -> float:
    chunk = samples[i : i + WIN]
    if not chunk:
        return 0.0
    return math.sqrt(sum(s * s for s in chunk) / len(chunk))


def trim(samples: list[float], max_s: float) -> list[float]:
    peak = max((abs(s) for s in samples), default=0.0)
    if peak < 0.02:
        raise SystemExit("silent take")
    thresh = peak * 0.08
    onset = 0
    for i in range(0, len(samples), WIN):
        if rms_at(samples, i) >= thresh:
            onset = max(0, i - WIN)
            break
    cap = onset + int(RATE * max_s)
    end = min(len(samples), cap)
    quiet = 0
    last_loud = onset
    hang = int(RATE * 0.05)
    for i in range(onset, end, WIN):
        if rms_at(samples, i) >= thresh * 0.7:
            last_loud = i + WIN
            quiet = 0
        else:
            quiet += WIN
            if quiet >= hang and last_loud > onset:
                end = min(end, last_loud + int(RATE * 0.06))
                break
    out = samples[onset:end]
    fade = min(len(out), int(RATE * 0.04))
    if fade:
        for i in range(fade):
            out[-1 - i] *= i / fade
    peak2 = max((abs(s) for s in out), default=0.0) or 1.0
    return [s / peak2 * PEAK for s in out]


def stats(samples: list[float]) -> dict:
    peak = max((abs(s) for s in samples), default=0.0)
    rms = math.sqrt(sum(s * s for s in samples) / max(1, len(samples)))
    zc = sum(
        1 for a, b in zip(samples, samples[1:]) if (a >= 0) != (b >= 0)
    )
    return {
        "dur_s": round(len(samples) / RATE, 3),
        "peak": round(peak, 3),
        "rms": round(rms, 4),
        "zc": zc,
        "zc_per_s": round(zc / max(0.001, len(samples) / RATE), 1),
    }


def convert(mp3: Path, wav: Path) -> None:
    tmp = wav.with_suffix(".raw.wav")
    subprocess.check_call(
        [
            "afconvert",
            "-f",
            "WAVE",
            "-d",
            "LEI16",
            "-c",
            "1",
            "-r",
            str(RATE),
            str(mp3),
            str(tmp),
        ]
    )
    samples = read_pcm(tmp)
    name = wav.stem.replace("sfx-", "")
    out = trim(samples, CAPS[name])
    write_pcm(wav, out)
    print(name, "raw", stats(samples), "out", stats(out), flush=True)


def load_hits() -> dict[str, dict]:
    hits = {}
    tsv = ROOT / "hits.tsv"
    if tsv.exists():
        for line in tsv.read_text().splitlines():
            if not line.strip():
                continue
            name, gen, url = line.split("\t", 2)
            hits[name] = {"generation_id": gen, "url": url}
        return hits
    return json.loads((ROOT / "hits.json").read_text())


def main() -> None:
    hits = load_hits()
    raw_dir = ROOT / "raw"
    out_dir = ROOT / "wav"
    raw_dir.mkdir(parents=True, exist_ok=True)
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, meta in hits.items():
        mp3 = raw_dir / f"{name}.mp3"
        print("fetch", name, flush=True)
        subprocess.check_call(
            ["curl", "-fsSL", "--retry", "2", "-o", str(mp3), meta["url"]]
        )
        convert(mp3, out_dir / f"sfx-{name}.wav")
    print("ok", file=sys.stderr)


if __name__ == "__main__":
    main()

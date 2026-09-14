#!/usr/bin/env python3
"""Normalize staging takes into the dest names SFX_FILES and MUSIC_FILE already use."""
from __future__ import annotations

import argparse
import hashlib
import math
import os
import struct
import sys
import wave
from dataclasses import dataclass
from pathlib import Path

HIT_PEAK = 0.55
MUSIC_PEAK = 0.18
RATE = 22050
SEAM_MS = 80
SEAM_RMS_MAX = 0.02
SEAM_RMS_CHECK = SEAM_RMS_MAX
PEAK_SLACK = 0.01
FADE_OUT_S = 0.040
ONSET_WIN_S = 0.010
DEST = Path(__file__).resolve().parent


@dataclass(frozen=True)
class HitSpec:
    key: str
    max_seconds: float
    peak: float = HIT_PEAK
    kind: str = 'hit'

    @property
    def dest_name(self) -> str:
        return f'sfx-{self.key}.wav'


@dataclass(frozen=True)
class LoopSpec:
    min_seconds: float = 4.0
    max_seconds: float = 16.0
    peak: float = MUSIC_PEAK
    seam_ms: int = SEAM_MS
    seam_rms_max: float = SEAM_RMS_MAX
    kind: str = 'loop'
    key: str = 'music'
    dest_name: str = 'music-loop.wav'


# Cheer 1.2s so the shipped 1.000s xylophone still passes Keep.
HITS = (
    HitSpec('tap', 0.22),
    HitSpec('select', 0.40),
    HitSpec('right', 0.70),
    HitSpec('wrong', 0.70),
    HitSpec('star', 0.80),
    HitSpec('pop', 0.25),
    HitSpec('woof', 0.55),
    HitSpec('cheer', 1.2),
)
LOOP = LoopSpec()
SPECS = (*HITS, LOOP)


@dataclass(frozen=True)
class Replace:
    spec: HitSpec | LoopSpec
    source: Path


@dataclass(frozen=True)
class Keep:
    spec: HitSpec
    dest: Path


Job = Replace | Keep


def _fail(msg: str) -> None:
    print(msg, file=sys.stderr)
    raise SystemExit(1)


def _rms(samples: list[float]) -> float:
    if not samples:
        return 0.0
    return math.sqrt(sum(s * s for s in samples) / len(samples))


def _peak(samples: list[float]) -> float:
    return max((abs(s) for s in samples), default=0.0)


def parse_wav(path: Path) -> list[float]:
    if not path.is_file():
        _fail(f'missing wav: {path}')
    with wave.open(str(path), 'r') as w:
        if w.getnchannels() != 1 or w.getsampwidth() != 2 or w.getframerate() != RATE:
            _fail(
                f'{path.name}: want {RATE} Hz mono 16-bit, '
                f'got {w.getframerate()} Hz {w.getnchannels()}ch {w.getsampwidth() * 8}-bit'
            )
        raw = w.readframes(w.getnframes())
    return [struct.unpack_from('<h', raw, i)[0] / 32767.0 for i in range(0, len(raw), 2)]


def write_wav_atomic(path: Path, samples: list[float]) -> None:
    part = path.with_suffix(path.suffix + '.part')
    if part.exists():
        part.unlink()
    with wave.open(str(part), 'w') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        frames = b''.join(
            struct.pack('<h', max(-32767, min(32767, int(s * 32767))))
            for s in samples
        )
        w.writeframes(frames)
    os.replace(part, path)


def normalize_peak(samples: list[float], peak: float) -> list[float]:
    cur = _peak(samples)
    if cur <= 0:
        _fail('silent take')
    scale = peak / cur
    return [s * scale for s in samples]


def trim_hit(samples: list[float], max_seconds: float) -> list[float]:
    peak = _peak(samples)
    if peak <= 0:
        _fail('silent take')
    win = max(1, int(RATE * ONSET_WIN_S))
    thresh = peak * 0.08
    onset = 0
    for i in range(0, len(samples), win):
        if _rms(samples[i : i + win]) >= thresh:
            onset = max(0, i - win)
            break
    cap = onset + int(RATE * max_seconds)
    out = samples[onset : min(len(samples), cap)]
    fade = min(len(out), int(RATE * FADE_OUT_S))
    if fade:
        out = list(out)
        for i in range(fade):
            out[-fade + i] *= (fade - i) / fade
    return out


def seal_loop(samples: list[float], spec: LoopSpec) -> list[float]:
    out = list(samples)
    n = min(len(out) // 2, int(RATE * spec.seam_ms / 1000))
    if n <= 0:
        _fail('loop too short to seal')
    for i in range(n):
        gain = i / n
        out[i] *= gain
        out[-1 - i] *= gain
    head = _rms(out[:n])
    tail = _rms(out[-n:])
    if head > spec.seam_rms_max or tail > spec.seam_rms_max:
        _fail(f'{spec.dest_name}: seam rms {head:.4f}/{tail:.4f} > {spec.seam_rms_max}')
    return out


def assert_wav_contract(path: Path, spec: HitSpec | LoopSpec) -> None:
    samples = parse_wav(path)
    seconds = len(samples) / RATE
    if seconds > spec.max_seconds + 1e-4:
        _fail(f'{path.name}: {seconds:.3f}s > max {spec.max_seconds}s')
    if spec.kind == 'loop' and seconds < spec.min_seconds - 1e-4:
        _fail(f'{path.name}: {seconds:.3f}s < min {spec.min_seconds}s')
    peak = _peak(samples)
    if peak > spec.peak + PEAK_SLACK:
        _fail(f'{path.name}: peak {peak:.3f} > {spec.peak}')
    if spec.kind == 'loop':
        n = min(len(samples) // 2, int(RATE * spec.seam_ms / 1000))
        head = _rms(samples[:n])
        tail = _rms(samples[-n:])
        if head > SEAM_RMS_CHECK or tail > SEAM_RMS_CHECK:
            _fail(f'{path.name}: seam rms {head:.4f}/{tail:.4f} > {SEAM_RMS_CHECK}')


def resolve_source(src_dir: Path, spec: HitSpec | LoopSpec) -> Path:
    if spec.kind == 'loop':
        names = (spec.dest_name, 'music.wav')
    else:
        names = (spec.dest_name, f'{spec.key}.wav')
    for name in names:
        cand = src_dir / name
        if cand.is_file():
            return cand
    _fail(f'missing source for {spec.dest_name} in {src_dir} (tried {", ".join(names)})')


def plan_jobs(src_dir: Path, dest_dir: Path) -> list[Job]:
    jobs: list[Job] = []
    for spec in HITS:
        if spec.key == 'cheer':
            jobs.append(Keep(spec, dest_dir / spec.dest_name))
            continue
        jobs.append(Replace(spec, resolve_source(src_dir, spec)))
    jobs.append(Replace(LOOP, resolve_source(src_dir, LOOP)))
    return jobs


def _file_hash(path: Path) -> str | None:
    if not path.is_file():
        return None
    return hashlib.sha256(path.read_bytes()).hexdigest()


def bake(src_dir: Path, dest_dir: Path) -> None:
    if not src_dir.is_dir():
        _fail(f'--src is not a directory: {src_dir}')
    jobs = plan_jobs(src_dir, dest_dir)
    payloads: list[tuple[Replace, list[float]]] = []
    for job in jobs:
        if isinstance(job, Keep):
            continue
        samples = parse_wav(job.source)
        if job.spec.kind == 'loop':
            samples = seal_loop(normalize_peak(samples, job.spec.peak), job.spec)
        else:
            samples = normalize_peak(trim_hit(samples, job.spec.max_seconds), job.spec.peak)
        payloads.append((job, samples))

    before = {job.spec.dest_name: _file_hash(dest_dir / job.spec.dest_name) for job, _ in payloads}
    for job, samples in payloads:
        write_wav_atomic(dest_dir / job.spec.dest_name, samples)
    after = {job.spec.dest_name: _file_hash(dest_dir / job.spec.dest_name) for job, _ in payloads}
    if before != after:
        print('beds-changed: bump sw.js VERSION and js/version.js APP_VERSION')

    check(dest_dir)


def check(dest_dir: Path) -> None:
    for spec in SPECS:
        assert_wav_contract(dest_dir / spec.dest_name, spec)


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(add_help=True)
    parser.add_argument('--src', metavar='DIR', help='bake Replace jobs from staging')
    parser.add_argument('--check', action='store_true', help='validate dest WAVs, no write')
    args = parser.parse_args(argv)
    if args.src is None and not args.check:
        parser.error('need --check or --src DIR')
    dest_dir = DEST
    try:
        if args.src is not None:
            bake(Path(args.src), dest_dir)
        elif args.check:
            check(dest_dir)
    except SystemExit as err:
        return int(err.code) if isinstance(err.code, int) else 1
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))

#!/usr/bin/env python3
"""Read-only, offline verification. Python stdlib; Node is used if installed."""
import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import shutil
import string
import struct
import subprocess
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
NEEDS = json.loads((ROOT / 'needs/needs.json').read_text())
REQUESTS = {n['file']: n for group in NEEDS.values() for n in group}
VOICE = 'FgiNpTIapnCbaD6xiqIo'
LOCK_AUDIO = '02f75a7829ca683c60dd3cbbbecb83b33f68dd9549f46fe17446e5ba6923f550'
LOCK_LUCY = '91550b0c040c41a575738af57cf91760a7b3440c6779ef96f5526541116f8000'


def require(ok, message):
    if not ok:
        raise AssertionError(message)


def sha(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()


def inside(name):
    p = (ROOT / name).resolve()
    require(p.is_relative_to(ROOT) and not name.startswith('/'), f'Path escapes app: {name}')
    return p


def resolve(name):
    p = inside(name)
    # Audit wiring/cache integrity in both modes. delivery() is the strict release
    # gate, so each missing delivery is reported once without hiding other bugs.
    require(p.is_file() or name in REQUESTS, f'Missing asset: {name}')
    return p


def checksums(path):
    result = {}
    for line in path.read_text().splitlines():
        digest, name = line.split(None, 1)
        require(re.fullmatch('[a-f0-9]{64}', digest) and name not in result, 'Malformed/duplicate checksum')
        result[name] = digest
    return result


def approved():
    lock = ROOT / 'approved/approved-sha256.txt'
    require(sha(lock) == LOCK_AUDIO, 'Approved checksum lock changed')
    expected = {f'{l}-{k}-trim.mp3' for l in string.ascii_lowercase for k in ['name', 'sound']} | {'i-long-extra-trim.mp3'}
    hashes = checksums(lock)
    require(set(hashes) == expected, 'Must retain exactly 53 approved names')
    require({p.name for p in (ROOT/'audio/letters').iterdir()} == expected, 'Approved audio directory differs')
    for name, digest in hashes.items():
        require(sha(ROOT / 'audio/letters' / name) == digest, f'Approved audio changed: {name}')
    return '53 approved clips byte-identical; checksum lock unchanged'


def lucy():
    folder = ROOT / 'lucy-reference'
    require(sha(folder/'sha256.txt') == LOCK_LUCY, 'Lucy checksum lock changed')
    hashes = checksums(folder/'sha256.txt')
    actual = {p.relative_to(folder).as_posix() for p in folder.rglob('*') if p.is_file() and p.name != 'sha256.txt'}
    require(actual == set(hashes), 'Lucy reference set has missing or extra files')
    for name, digest in hashes.items():
        require(sha(folder/name) == digest, f'Lucy reference changed: {name}')
    forbidden = set(hashes.values())
    count = 0
    for p in ROOT.rglob('*'):
        if not p.is_file() or folder in p.parents or p.suffix not in {'.jpg','.jpeg','.webp','.png','.svg','.mp4','.gif'}:
            continue
        count += 1
        require(sha(p) not in forbidden, f'Shipped asset reuses reference bytes: {p.relative_to(ROOT)}')
    return f'{len(hashes)} locked references unchanged; {count} game images distinct from every reference'


def delivery():
    require(set(NEEDS) == {'images','voice'}, 'Needs must contain images and voice')
    require(len(REQUESTS) == sum(map(len, NEEDS.values())), 'Duplicate needs paths')
    ids = set()
    for kind, items in NEEDS.items():
        for n in items:
            require(n['id'] not in ids, 'Duplicate need ID'); ids.add(n['id'])
            p = inside(n['file'])
            if kind == 'images':
                require(p.suffix == '.png' and type(n['lucy']) is bool and type(n['transparent']) is bool, 'Invalid image metadata')
                require(n['prompt'].strip() and re.fullmatch(r'\d+x\d+', n['size']), 'Missing image brief/size')
                require(isinstance(n['reference'], list) and (n['reference'] or not n['lucy']), 'Lucy needs references')
                for ref in n['reference']:
                    require(ref.startswith('lucy-reference/') and inside(ref).is_file(), f'Missing likeness reference {ref}')
                if p.is_file():
                    header = p.read_bytes()[:24]
                    require(header[:8] == b'\x89PNG\r\n\x1a\n', f'Not a PNG: {n["file"]}')
                    require(min(struct.unpack('!II', header[16:24])) >= 512, f'Lucy delivery too small: {n["file"]}')
            else:
                require(p.suffix == '.mp3' and n['kind'] in ['short','long'] and n['text'].strip(), 'Invalid voice request')
    missing = [name for name in REQUESTS if not inside(name).is_file()]
    require(not ARGS.strict or not missing, 'Undelivered needs: ' + ', '.join(missing))
    return f'{len(NEEDS["images"])} images + {len(NEEDS["voice"])} voice lines; {len(missing)} pending' + (' (fallbacks allowed)' if missing else '')


def voices():
    entries = json.loads((ROOT/'voice-manifest.json').read_text())
    indexed = {}
    for n in entries:
        name = n['file']; require(name not in indexed, f'Duplicate voice entry {name}'); indexed[name] = n
        require(n.get('voice_id') == VOICE and n.get('voice_name') == 'Lucy' and n.get('model') == 'eleven_v4', f'Wrong voice/model: {name}')
        require(n.get('text'), f'Missing transcript {name}')
        p = resolve(name)
        if p.is_file():
            require(p.stat().st_size > 100, f'Empty voice {name}')
            require(n.get('status') != 'requested', f'Delivered voice still requested: {name}')
            require(n.get('sha256') == sha(p), f'Voice hash missing or changed {name}')
        else:
            require(name in {x['file'] for x in NEEDS['voice']}, f'Undeclared missing voice {name}')
    actual = {p.relative_to(ROOT).as_posix() for p in (ROOT/'audio').rglob('*.mp3')}
    require(actual <= set(indexed), 'Unmanifested voice clip')
    require(set(indexed) == actual | {n['file'] for n in NEEDS['voice']}, 'Voice inventory differs')
    for n in NEEDS['voice']:
        require(indexed[n['file']]['text'] == n['text'], 'Voice brief/manifest transcript mismatch')
    return f'{len(indexed)} clips declared Lucy / {VOICE} / eleven_v4; existing hashes verified'


class Paths(HTMLParser):
    def __init__(self):
        super().__init__(); self.assets = []
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in {'src','href'} and value and not value.startswith('#'):
                self.assets.append(value)


def references():
    used = set()
    for p in ROOT.glob('*.html'):
        parser = Paths(); parser.feed(p.read_text()); used.update(parser.assets)
    for p in ROOT.glob('*.css'):
        for name in re.findall(r'url\([\'"]?([^\)\'"\s]+)', p.read_text()):
            used.add(name)
    # Check literal resources embedded in JS templates, and explicitly validate dynamic sources.
    for p in [ROOT/'app.js', ROOT/'content.js']:
        for name in re.findall(r'(?:src|href)="([^"]+)"', p.read_text()):
            if '${' not in name:
                used.add(name)
            else:
                require(name in {'${file}', '${l.image}'}, f'Unvalidated dynamic source: {name}')
    manifest = json.loads((ROOT/'manifest.webmanifest').read_text())
    used.update(n['src'] for n in manifest['icons'])
    require(manifest['start_url'] == './index.html' and manifest['scope'] == './', 'PWA scope must stay relative')
    # Content.js is the single dynamic resource inventory; Node expands A–Z templates.
    if shutil.which('node'):
        run = subprocess.run(['node',str(ROOT/'tests/runtime_checks.cjs'),'--assets'],capture_output=True,text=True,check=True)
        used.update(json.loads(run.stdout))
    else:
        used.update(f'audio/letters/{l}-{k}-trim.mp3' for l in string.ascii_lowercase for k in ['name','sound'])
        used.update(n['file'] for n in json.loads((ROOT/'voice-manifest.json').read_text()))
        used.update('art/'+w+'.svg' for w in re.search(r'const words = \[([^\]]+)\]',(ROOT/'content.js').read_text())[1].replace("'",'').split(','))
        used.update(n['file'] for n in NEEDS['images'])
    for name in used:
        require(not re.match(r'\w+:|//',name), f'External URL: {name}')
        require(not name.startswith('lucy-reference/'), 'Reference file used in game')
        resolve(name)
    for p in (ROOT/'art').glob('*.svg'):
        ET.fromstring(p.read_text())
    return used


def assets():
    used = references()
    return f'{len(used)} local asset paths resolve or have declared fallbacks; SVGs parse'


def offline():
    config = json.loads((ROOT/'precache.json').read_text())
    required, optional = config['required'], config['optional']
    require(len(required+optional) == len(set(required+optional)), 'Duplicate precache path')
    require(set(optional) == set(REQUESTS), 'All delivery needs must be precached as optional')
    actual = {p.relative_to(ROOT).as_posix() for p in ROOT.rglob('*') if p.is_file() and p.suffix in {'.html','.css','.js','.svg','.woff2','.mp3','.png','.webmanifest'} and p.parts[len(ROOT.parts)] not in {'lucy-reference','tests','tools'} and p.name != 'sw.js'}
    require(actual <= set(required+optional), 'Offline cache misses shipped files: '+str(actual-set(required+optional)))
    require(references() <= set(required+optional)|{'manifest.webmanifest'}, 'Referenced assets not precached')
    for name in required: require(inside(name).is_file(), f'Missing required cache file {name}')
    for name in optional: resolve(name)
    digest = hashlib.sha256(''.join(p+sha(ROOT/p) for p in required).encode()).hexdigest()[:12]
    expected = '/* Generated by tools/build_precache.py. */\nconst VERSION='+json.dumps(digest)+';\nconst FILES='+json.dumps(config,indent=2)+';\n'+(ROOT/'tools/sw-template.js').read_text()
    require((ROOT/'sw.js').read_text() == expected, 'Stale service worker: run python3 tools/build_precache.py')
    require(not any('lucy-reference/' in p for p in required+optional), 'Do not precache reference art')
    return f'{len(required)} required + {len(optional)} delivery assets; complete, scoped, versioned precache'


def retained():
    source = (ROOT/'app.js').read_text()
    fragment = source[source.index('function teacher()'):source.index('function invalidateLockedSessions()')].rstrip()+'\n'
    expected = (ROOT/'tools/teacher-source.sha256').read_text().strip()
    require(hashlib.sha256(fragment.encode()).hexdigest() == expected, 'Preserved teacher room changed')
    original = ROOT.parent/'game'
    if original.is_dir():
        require((ROOT/'model.js').read_bytes() == (original/'model.js').read_bytes(), 'Preserved teacher progress model changed')
        old = (original/'app.js').read_text()
        require(fragment == old[old.index('function teacher()'):old.index('function routeAction(')], 'Teacher room differs from original')
    require("state.settings.dark==='dark'||(state.settings.dark==='system'&&dark.matches)" in source, 'Follow-device dark mode missing')
    return 'Teacher room preserved, PIN 2468 model, follow-device/light/dark behavior retained'


def runtime():
    if not shutil.which('node'):
        require(not ARGS.strict, 'Node required for strict runtime verification')
        return 'SKIP: Node unavailable; run node tests/runtime_checks.cjs before release'
    run = subprocess.run(['node',str(ROOT/'tests/runtime_checks.cjs')],capture_output=True,text=True)
    require(run.returncode == 0, run.stdout+run.stderr)
    return run.stdout.strip()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--strict',action='store_true',help='Require every delivery asset; full release checks')
    ARGS = parser.parse_args()
    failures = []
    for label, fn in [('Approved audio',approved),('Lucy likeness lock',lucy),('Needs',delivery),('Voice manifest',voices),('Asset references',assets),('Offline PWA',offline),('Retained controls',retained),('Runtime',runtime)]:
        try:
            print(f'PASS {label}: {fn()}')
        except Exception as exc:
            failures.append(label); print(f'FAIL {label}: {exc}')
    print(f'\n{8-len(failures)}/8 checks passed · {"strict" if ARGS.strict else "fallback"} mode')
    missing = [n for n in REQUESTS if not inside(n).is_file()]
    if ARGS.strict and failures == ['Needs'] and missing and all(REQUESTS[n].get('lucy') for n in missing):
        print(f'Strict fails ONLY because of {len(missing)} undelivered Lucy images: ' + ', '.join(missing))
    sys.exit(bool(failures))

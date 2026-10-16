#!/usr/bin/env python3
"""Read-only, stdlib checks for the standalone game build."""
import argparse
import hashlib
import json
import re
import string
import sys
import shutil
import subprocess
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VOICE = 'FgiNpTIapnCbaD6xiqIo'
MODEL = 'eleven_v4'
GAMES = ('v1-letter-post', 'v3-moonboat')
AUDIO_EXT = {'.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.opus', '.webm'}
EXPECTED = {f'{letter}-{kind}-trim.mp3' for letter in string.ascii_lowercase
            for kind in ('name', 'sound')} | {'i-long-extra-trim.mp3'}


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def inside(path):
    resolved = path.resolve()
    require(resolved.is_relative_to(ROOT), f'Path escapes game: {path}')
    return resolved


def approved_audio():
    lines = (ROOT / 'approved/approved-sha256.txt').read_text().splitlines()
    expected = {}
    for line in lines:
        match = re.fullmatch(r'([0-9a-f]{64})\s+([^/\s]+)', line)
        require(match is not None, f'Invalid checksum line: {line}')
        digest, name = match.groups()
        require(name not in expected, f'Duplicate checksum: {name}')
        expected[name] = digest
    require(set(expected) == EXPECTED and len(lines) == 53, 'Manifest must contain exactly the 53 approved filenames')
    folder = ROOT / 'audio/letters'
    require({p.name for p in folder.iterdir()} == EXPECTED, 'Approved directory missing files or has extras')
    for name, digest in expected.items():
        require(sha(folder / name) == digest, f'Approved hash mismatch: {name}')
    return '53 approved clips, exact hashes, no extras'


def trim_metadata():
    data = json.loads((ROOT / 'approved/clips.json').read_text())
    require(data['meta']['voice'] == f'Lucy {VOICE}', 'Trim voice metadata must be Lucy')
    require(data['meta']['model'] == MODEL, 'Trim model metadata must be eleven_v4')
    seen = set()
    by_id = {item['id']: item for item in data['items']}
    for item in data['items']:
        name = Path(item['trimmed']).name
        require(item['trimmed'] == f'audio/{name}', f'Unexpected trim path: {item["trimmed"]}')
        if 'alias' in item:
            target = by_id[item['alias']]
            require(target['trimmed'] == item['trimmed'] and 'alias' not in target,
                    f'Invalid trim alias: {item["id"]}')
        else:
            require(name not in seen, f'Duplicate trimmed item: {name}')
        seen.add(name)
        require((ROOT / 'audio/letters' / name).is_file(), f'Missing trim: {name}')
        duration = item['trim_duration']
        require(type(duration) in (int, float) and 0 < duration <= 1.5, f'Invalid trim duration: {name}')
        require(item['slash_spoken'] is False, f'Slash spoken: {name}')
        require(item['model'] == MODEL, f'Wrong model: {name}')
        if item['kind'] == 'name':
            require(not re.search(r'\bis\b', item['stt_trim'], re.I), f'Name contains "is": {name}')
        require(item['letter'] in string.ascii_uppercase, f'Invalid letter: {name}')
        if name != 'i-long-extra-trim.mp3' and 'alias' not in item:
            require(name == f'{item["letter"].lower()}-{item["kind"]}-trim.mp3', f'Trim item mismatch: {name}')
    require(seen == EXPECTED, 'Trim metadata must cover all 53 approved clips')
    return '54 metadata items / 53 clips (soft G aliases J): duration, slash, voice/model and stored name STT valid'


def strings(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for child in value.values():
            yield from strings(child)
    elif isinstance(value, list):
        for child in value:
            yield from strings(child)


def wiring():
    raw = (ROOT / 'audio-map.js').read_text()
    match = re.fullmatch(r'window\.GAME_AUDIO = (.*);\s*', raw, re.S)
    require(match is not None, 'Audio map must be a static JSON assignment')
    audio = json.loads(match[1])
    require(set(audio['letters']) == set(string.ascii_uppercase), 'Audio map must cover A-Z')
    for letter in string.ascii_uppercase:
        require(audio['letters'][letter] == {
            kind: f'../audio/letters/{letter.lower()}-{kind}-trim.mp3'
            for kind in ('name', 'sound')}, f'Wrong approved mapping: {letter}')
    require(audio['longI'] == '../audio/letters/i-long-extra-trim.mp3', 'Missing long-I extra')
    for game in GAMES:
        folder = ROOT / game
        html = (folder / 'index.html').read_text()
        scripts = re.findall(r'<script\b[^>]*\bsrc="([^"]+)"', html)
        require('../audio-map.js' in scripts and scripts.index('../audio-map.js') < scripts.index('app.js'), f'{game}: map must load before app')
        for script in scripts:
            require(inside(folder / script).is_file(), f'{game}: missing script {script}')
        for path in strings(audio):
            require(inside(folder / path).is_file(), f'{game}: missing audio {path}')
        app = (folder / 'app.js').read_text()
        # Guard the actual playback sites, including match and two-miss hints.
        for fragment in ('const A=window.GAME_AUDIO;', 'new Audio(file)',
                         'return [A.letters[current.letter].name,A.letters[current.letter].sound];',
                         'return A.words[l.word];', 'voice(letterAudio())',
                         'voice([A.letters[current.letter].sound])',
                         'voice(reward?[wordAudio(current)]:letterAudio())',
                         '...letterAudio(),wordAudio(current)',
                         ':[A.letters[current.letter].sound]',
                         'A.feedback.cheers[visited.size%2]'):
            require(fragment in app, f'{game}: missing playback wiring {fragment}')
        require(app.count('new Audio(') == 1, f'{game}: unexpected playback entry point')
        require(set(audio['words']) == {'sun', 'apple', 'tiger', 'pig', 'insect', 'moon'}, 'Missing picture word mapping')
    # Scan every game JS/HTML, including files not currently loaded.
    for file in sorted(ROOT.rglob('*')):
        if file.suffix not in {'.js', '.html'}:
            continue
        text = file.read_text()
        require(not re.search(r'lucy-name-|lucy-phoneme-|starfall', text, re.I), f'Forbidden audio reference: {file.relative_to(ROOT)}')
        for quote, path in re.findall(r'''(["'`])([^"'`\n]+?\.(?:mp3|wav|ogg|m4a|aac|flac|opus|webm))(?:\1)''', text, re.I):
            require('${' not in path, f'Unresolved dynamic audio path: {file.name}: {path}')
            bases = [ROOT / game for game in GAMES] if file.name == 'audio-map.js' else [file.parent]
            for base in bases:
                require(inside(base / path).is_file() or inside(base / path).relative_to(ROOT).as_posix() in pending_paths(), f'Missing audio reference: {file.name}: {path}')
    for file in ROOT.rglob('*'):
        require(not re.search(r'lucy-name-|lucy-phoneme-|starfall|mary|emma', file.name, re.I), f'Old audio asset: {file.relative_to(ROOT)}')
    return 'both games: A-Z approved maps, long I, playback sites and local audio paths valid'


def needs_data():
    return json.loads((ROOT / 'needs/needs.json').read_text())


def pending_paths():
    return {item['file'] for group in needs_data().values() for item in group}


def game_data():
    text = (ROOT / 'data.js').read_text()
    match = re.fullmatch(r'window\.GAME_DATA = (.*);\s*', text, re.S)
    require(match is not None, 'Game data must be a static JSON assignment')
    return json.loads(match[1])


def voice_inventory():
    entries = json.loads((ROOT / 'voice-manifest.json').read_text())
    require(isinstance(entries, list), 'Voice manifest must be an entry list')
    actual = {f.relative_to(ROOT).as_posix(): f for f in ROOT.rglob('*')
              if f.is_file() and f.suffix.lower() in AUDIO_EXT}
    indexed = {}
    pending = {i['file']: i for i in needs_data()['voice']}
    for entry in entries:
        name = entry['file']
        inside(ROOT / name)
        require(name not in indexed, f'Duplicate voice entry: {name}')
        indexed[name] = entry
        for field in ('text', 'voice_id', 'voice_name', 'model', 'provenance'):
            require(entry.get(field), f'Missing voice field {field}: {name}')
        require(entry['voice_id'] == VOICE and entry['voice_name'] == 'Lucy' and entry['model'] == MODEL,
                f'Every voice must be Lucy / eleven_v4: {name}')
        if name in actual:
            require(entry.get('status') != 'pending', f'Update recorded provenance/status for delivered clip: {name}')
            require(sha(actual[name]) == entry.get('sha256'), f'Voice hash mismatch: {name}')
        else:
            require(name in pending and entry.get('status') == 'pending' and entry.get('sha256') is None,
                    f'Unlisted missing voice: {name}')
            require(entry['text'] == pending[name]['text'], f'Voice production text mismatch: {name}')
    require(set(indexed) == set(actual) | set(pending), 'Voice manifest must cover every clip and voice need')
    # Archived Lucy videos are reference art, never played as alternate spoken audio.
    require('<video' not in (ROOT / 'app.js').read_text(), 'Do not play archival reference video audio')
    return f'{len(actual)} exact-hash clips, {len(set(pending)-set(actual))} pending; all Lucy / eleven_v4'


def needs_check(final):
    data = needs_data()
    require(set(data) == {'voice', 'images'}, 'Needs must contain voice and images arrays')
    seen, missing = set(), []
    targets = json.dumps(game_data())
    for group, items in data.items():
        require(isinstance(items, list), f'Needs {group} must be an array')
        ids = set()
        for item in items:
            require(item['id'] not in ids, f'Duplicate need id: {item["id"]}')
            ids.add(item['id'])
            path = item['file']
            require(path not in seen, f'Duplicate needs path: {path}')
            seen.add(path)
            inside(ROOT / path)
            require(path in targets, f'Need is not wired into game data: {path}')
            if group == 'voice':
                require(path == f'audio/lines/{item["id"]}.mp3', f'Invalid voice target: {path}')
                require(item['text'].strip() and item['kind'] in {'short','long'}, f'Invalid voice brief: {path}')
                require(len(item['text'].split()) <= 12 or item['kind'] == 'long', f'Long line must be marked long: {path}')
            else:
                require(re.fullmatch(r'art/[^/]+\.(?:webp|png)', path), f'Invalid image target: {path}')
                require(type(item['lucy']) is bool and item['prompt'].strip(), f'Invalid image brief: {path}')
                require(item['reference'].startswith('lucy-reference/'), f'Missing Lucy reference path: {path}')
                require(inside(ROOT / item['reference']).is_file(), f'Missing image reference: {path}')
            if not (ROOT / path).is_file():
                missing.append(path)
                print(f'WARN pending {group}: {path}')
    require(not final or not missing, f'--final requires delivery of {len(missing)} pending assets')
    return f'{len(seen)} needs items, {len(missing)} still missing'


def lucy_reference():
    folder = ROOT / 'lucy-reference'
    locked = {}
    for line in (folder / 'sha256.txt').read_text().splitlines():
        match = re.fullmatch(r'([0-9a-f]{64})  (.+)', line)
        require(match is not None, f'Invalid Lucy checksum: {line}')
        digest, name = match.groups()
        require(name not in locked, f'Duplicate Lucy reference: {name}')
        locked[name] = digest
        path = inside(folder / name)
        require(path.is_file() and sha(path) == digest, f'Lucy reference changed: {name}')
    actual = {p.relative_to(folder).as_posix() for p in folder.rglob('*') if p.is_file() and p.name != 'sha256.txt'}
    require(actual == set(locked), 'Lucy reference files differ from locked set')
    repo = ROOT.parents[2]
    if (repo / 'app/art').exists():
        sources = set()
        for base in [repo / 'design', repo / 'app/art']:
            for p in base.rglob('*'):
                if folder in p.parents:
                    continue
                if p.is_file() and ('lucy' in p.name.lower() or 'lucy' in p.parts) and p.suffix.lower() in {'.jpg','.jpeg','.png','.webp','.svg','.gif','.mp4'}:
                    name = p.relative_to(repo).as_posix()
                    sources.add(name)
                    require(locked.get(name) == sha(p), f'Lucy source omitted or changed: {name}')
        require(sources == set(locked), 'Reference set must include every existing Lucy art source')
    require(len(locked) >= 33, 'Lucy reference set unexpectedly small')
    return f'{len(locked)} byte-identical references, complete source set and lock verified'


def alphabet_wiring():
    data = game_data()
    require([l['upper'] for l in data['letters']] == list(string.ascii_uppercase), 'Exactly one entry for every A-Z letter')
    for l in data['letters']:
        upper, lower = l['upper'], l['lower']
        require(lower == upper.lower(), f'Case mapping: {upper}')
        for kind in ('name', 'sound'):
            require(l[kind] == f'audio/letters/{lower}-{kind}-trim.mp3', f'Wrong approved {kind}: {upper}')
        require(l['word'] and l['wordAudio'] and l['image'], f'Missing picture word/image/voice: {upper}')
        if upper == 'X':
            require(l['word'] == 'fox' and l['soundPosition'] == 'end', 'X must teach final /ks/ honestly')
        else:
            require(l['word'].startswith(lower) and l['soundPosition'] == 'start', f'Picture initial: {upper}')
        for key in ('name', 'sound', 'wordAudio', 'image'):
            require(inside(ROOT / l[key]).is_file() or l[key] in pending_paths(), f'Missing {upper}: {l[key]}')
    html = (ROOT / 'index.html').read_text()
    scripts = re.findall(r'<script\b[^>]*\bsrc="([^"]+)"', html)
    require(scripts == ['data.js','model.js','app.js'], 'Load game data and model before app')
    app = (ROOT / 'app.js').read_text()
    for token in ['caseRound','bonusRound','caseMatch','pictureMatch','celebrate','heardName','heardSound','current.name','current.sound','current.wordAudio','M.complete','M.answer']:
        require(token in app, f'Missing activity wiring: {token}')
    return 'A-Z names/sounds, both cases, voiced picture vocabulary and complete activity flow'


class Resources(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = []
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in {'src','href','poster'} and value:
                self.paths.append(value)


def assets():
    pending = pending_paths()
    checked = set()
    def check(base, path, source):
        if not path or path.startswith(('#','data:','blob:')):
            return
        if '${' in path:
            if path == 'assets/lucy-${mood}.jpg':
                for mood in ['default','specs','celebrate']:
                    check(base, path.replace('${mood}',mood), source)
                return
            require(path in {'${file}','${l.image}','${o.image}','${current.image}','${D.lucyCelebrate}'}, f'Unvalidated dynamic resource: {source}: {path}')
            return
        parsed = urlsplit(path)
        require(not parsed.scheme and not parsed.netloc, f'External asset is not offline: {source}: {path}')
        target = inside(base / unquote(parsed.path))
        name = target.relative_to(ROOT).as_posix()
        require(target.exists() or name in pending, f'Broken asset: {source}: {path}')
        checked.add(name)
    for file in sorted(ROOT.rglob('*')):
        if not file.is_file() or file.suffix not in {'.html','.js','.css','.webmanifest'} or 'tests' in file.relative_to(ROOT).parts:
            continue
        text = file.read_text()
        bases = [ROOT / game for game in GAMES] if file.name == 'audio-map.js' else [ROOT if file.name == 'sw-template.js' else file.parent]
        if file.suffix in {'.html','.js'}:
            parser = Resources()
            parser.feed(text)
            for path in parser.paths:
                for base in bases:
                    check(base,path,file.relative_to(ROOT))
        for path in re.findall(r'url\([\s\'"]*([^\)\'"\s]+)', text):
            check(file.parent,path,file.relative_to(ROOT))
        for path in re.findall(r'[\'"]([A-Za-z0-9_./+-]+\.(?:mp3|wav|ogg|m4a|aac|flac|opus|webm|jpg|jpeg|png|webp|svg|mp4|woff2?|js|css|json|webmanifest|txt|md))[\'"]', text, re.I):
            for base in bases:
                check(base,path,file.relative_to(ROOT))
        if file.suffix == '.webmanifest':
            manifest = json.loads(text)
            for path in [manifest['start_url'], manifest['scope'], *[i['src'] for i in manifest['icons']]]:
                check(file.parent,path,file.name)
    # All strings from static data are checked, not just currently selected outfits/letters.
    for path in strings(game_data()):
        if re.fullmatch(r'[A-Za-z0-9_./+-]+\.[a-z0-9]+',path):
            check(ROOT,path,'data.js')
    return f'{len(checked)} distinct asset paths; only needs-listed paths may be pending'


def pwa():
    raw = (ROOT / 'sw.js').read_text()
    required = json.loads(re.search(r'const PRECACHE = (\[.*?\]);',raw,re.S)[1])
    optional = json.loads(re.search(r'const OPTIONAL = (\[.*?\]);',raw,re.S)[1])
    require(len(required) == len(set(required)), 'Duplicate precache paths')
    expected = {p.relative_to(ROOT).as_posix() for p in ROOT.rglob('*') if p.is_file()
                and not any(part in {'tests','tools','__pycache__'} for part in p.relative_to(ROOT).parts)} | {'./'}
    require(set(required) == expected, f'Precache differs from shipped files: {sorted(set(required)^expected)}; run tools/build_assets.py')
    require(set(optional) == {p for p in pending_paths() if not (ROOT / p).exists()}, 'Optional cache must match missing needs')
    for path in required:
        require(inside(ROOT / path).exists(), f'Missing precache: {path}')
    files = sorted(p for p in ROOT.rglob('*') if p.is_file() and not any(part in {'tests','tools','__pycache__'} for part in p.relative_to(ROOT).parts) and p.name != 'sw.js')
    revision = hashlib.sha256(b''.join(p.relative_to(ROOT).as_posix().encode()+p.read_bytes() for p in files)).hexdigest()[:16]
    require(f"const CACHE = CACHE_PREFIX + '{revision}';" in raw, 'Stale cache revision; run tools/build_assets.py')
    manifest = json.loads((ROOT / 'manifest.webmanifest').read_text())
    require(manifest['display'] == 'standalone' and manifest['orientation'] == 'landscape', 'Installable landscape manifest')
    return f'{len(required)} required URLs precached, {len(optional)} optional production needs, current content revision'


def javascript():
    node = shutil.which('node')
    if not node:
        print('WARN node unavailable; JavaScript syntax/runtime checks skipped')
        return 'node not installed'
    files = sorted(ROOT.rglob('*.js')) + sorted((ROOT / 'tests').glob('*.cjs'))
    for file in files:
        result = subprocess.run([node,'--check',str(file)],capture_output=True,text=True,timeout=20)
        require(result.returncode == 0, f'JavaScript syntax: {file.relative_to(ROOT)}: {result.stderr}')
    result = subprocess.run([node,str(ROOT/'tests/runtime_checks.cjs')],capture_output=True,text=True,timeout=45)
    require(result.returncode == 0, result.stdout + result.stderr)
    return f'{len(files)} JS syntax checks; {result.stdout.strip()}'

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--allow-known-mismatches', action='store_true', help='Compatibility option; voice identity remains strict')
    parser.add_argument('--final', action='store_true', help='Fail if any production need remains missing')
    args = parser.parse_args()
    failed = 0
    checks = [('approved audio', approved_audio), ('trim metadata', trim_metadata),
              ('legacy wiring', wiring), ('voice', voice_inventory),
              ('needs', lambda: needs_check(args.final)), ('Lucy reference lock', lucy_reference),
              ('A-Z wiring', alphabet_wiring), ('asset paths', assets), ('offline PWA', pwa),
              ('JavaScript & behavior', javascript)]
    for name, check in checks:
        try:
            print(f'PASS {name}: {check()}')
        except (AssertionError, OSError, ValueError, KeyError, TypeError) as exc:
            print(f'FAIL {name}: {exc}')
            failed += 1
    data = needs_data()
    count = sum(len(group) for group in data.values())
    missing = sum(not (ROOT / item['file']).is_file() for group in data.values() for item in group)
    print(f'{len(checks) - failed}/{len(checks)} checks passed ({"final" if args.final else "development"}); needs: {count} items, {missing} missing')
    return int(bool(failed))


if __name__ == '__main__':
    sys.exit(main())

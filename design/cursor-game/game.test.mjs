import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const repo = join(root, '..', '..');
const LUCY = 'FgiNpTIapnCbaD6xiqIo';
const MODEL = 'eleven_v4';
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const WORDS = Object.fromEntries('apple ball cat duck egg fish goat hat insect jellyfish kite leaf moon nest octopus pig quilt rabbit sun tiger umbrella van web fox yak zebra'.split(' ').map((word, i) => [ABC[i], word]));

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function parseSums(text) {
  const rows = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const match = line.match(/^([0-9a-f]{64})  (\S+)$/);
    assert.ok(match, 'sum line ' + line);
    rows.push({ hash: match[1], file: match[2] });
  }
  return rows;
}

function assignment(file, name) {
  const text = readFileSync(join(root, file), 'utf8');
  const match = text.match(new RegExp('window\\.' + name + ' = ([\\s\\S]*);\\s*$'));
  assert.ok(match, file + ' assignment');
  return JSON.parse(match[1]);
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

function blob(commit, source) {
  return execFileSync('git', ['cat-file', 'blob', commit + ':' + source], {
    cwd: repo,
    maxBuffer: 16 * 1024 * 1024,
  });
}

test('copied clips match the Codex source bytes', () => {
  const rows = JSON.parse(readFileSync(join(root, 'audio-sources.json'), 'utf8'));
  assert.ok(rows.length > 53, 'library must include more than the 53 trims');
  const seen = new Set();
  for (const row of rows) {
    assert.equal(seen.has(row.file), false, 'duplicate ' + row.file);
    seen.add(row.file);
    const local = join(root, row.file);
    assert.equal(sha256(local), row.sha256, row.file);
    const source = blob(row.commit, row.source);
    assert.equal(createHash('sha256').update(source).digest('hex'), row.sha256, row.source);
    assert.equal(Buffer.compare(readFileSync(local), source), 0, row.file);
    for (const extra of row.also || []) {
      const again = blob(extra.commit, extra.source);
      assert.equal(createHash('sha256').update(again).digest('hex'), row.sha256, extra.source);
    }
  }
  const onDisk = walk(join(root, 'audio')).filter((path) => path.endsWith('.mp3')).map((path) => relative(root, path));
  assert.deepEqual(onDisk.sort(), [...seen].sort());
});

test('every letter A–Z has its name and sound', () => {
  const letters = assignment('shared/letters.js', 'LETTERS');
  const audio = assignment('shared/audio-map.js', 'GAME_AUDIO');
  const sources = JSON.parse(readFileSync(join(root, 'audio-sources.json'), 'utf8'));
  assert.deepEqual(letters.map((row) => row[0]), [...ABC]);
  for (const [letter, word, sound] of letters) {
    assert.equal(word, WORDS[letter], letter);
    assert.match(sound, /^\/[^/\s]+\/$/);
    const name = sources.find((row) => row.role === 'letter-name' && row.letter === letter);
    const phoneme = sources.find((row) => row.role === 'letter-sound' && row.letter === letter);
    assert.ok(name, letter + ' name');
    assert.ok(phoneme, letter + ' sound');
    assert.equal(audio.letters[letter].name, '../' + name.file);
    assert.equal(audio.letters[letter].sound, '../' + phoneme.file);
    assert.equal(sha256(join(root, name.file)), name.sha256);
    assert.equal(sha256(join(root, phoneme.file)), phoneme.sha256);
    assert.equal(audio.words[word].length > 0, true, word);
    assert.equal(existsSync(join(root, audio.words[word].replace('../', ''))), true, word);
  }
  assert.equal(audio.letters.I.sound.endsWith('/i-sound-trim.mp3'), true);
  assert.equal(existsSync(join(root, 'audio/letters/i-long-extra-trim.mp3')), true);
  assert.notEqual(audio.longI, audio.letters.I.sound);
  const play = readFileSync(join(root, 'shared/play.js'), 'utf8');
  assert.match(play, /AUDIO\.letters\[current\.letter\]/);
  assert.match(play, /l\.sound !== target\.sound/);
  assert.match(play, /target\.letter === 'X'/);
  assert.match(play, /Fox ends with x/);
  for (const letter of letters) {
    const target = { letter: letter[0], word: letter[1], sound: letter[2] };
    const pool = letters.filter((row) => row[0] !== target.letter && row[2] !== target.sound && (target.letter === 'X' || row[1][0] !== target.word[0]));
    assert.ok(pool.length >= 2, target.letter + ' distractors');
  }
});

test('letter clips match the approved sha256 list', () => {
  const rows = parseSums(readFileSync(join(root, 'approved-sha256.txt'), 'utf8'));
  assert.equal(rows.length, 53);
  const byName = new Map(rows.map((row) => [row.file, row.hash]));
  const onDisk = readdirSync(join(root, 'audio/letters')).filter((name) => name.endsWith('-trim.mp3'));
  assert.deepEqual(onDisk.sort(), rows.map((row) => row.file).sort());
  for (const row of rows) {
    assert.equal(sha256(join(root, 'audio/letters', row.file)), row.hash, row.file);
  }
  const clips = JSON.parse(readFileSync(join(root, 'clips.json'), 'utf8'));
  for (const letter of ABC) {
    const name = clips.items.find((item) => item.letter === letter && item.kind === 'name');
    const sound = clips.items.find((item) => item.letter === letter && item.kind === 'sound');
    assert.ok(name, letter + ' name');
    assert.ok(sound, letter + ' sound');
    const nameFile = name.trimmed.slice('audio/'.length);
    const soundFile = sound.trimmed.slice('audio/'.length);
    assert.equal(byName.get(nameFile), sha256(join(root, 'audio/letters', nameFile)), nameFile);
    assert.equal(byName.get(soundFile), sha256(join(root, 'audio/letters', soundFile)), soundFile);
    const lower = letter.toLowerCase();
    const playedName = join(repo, 'design/cursor-phoneme-test/audio', `v4-name-${lower}.mp3`);
    const playedSound = join(repo, 'design/cursor-phoneme-test/audio', `v4-phoneme-${lower}.mp3`);
    assert.equal(sha256(playedName), byName.get(nameFile), playedName);
    assert.equal(sha256(playedSound), byName.get(soundFile), playedSound);
  }
});

test('every copied clip is Lucy on eleven_v4', () => {
  const manifest = JSON.parse(readFileSync(join(root, 'voice-manifest.json'), 'utf8'));
  const sources = JSON.parse(readFileSync(join(root, 'audio-sources.json'), 'utf8'));
  assert.equal(manifest.length, sources.length);
  const mismatches = [];
  for (const clip of manifest) {
    assert.equal(typeof clip.file, 'string');
    assert.equal(typeof clip.text, 'string');
    assert.equal(typeof clip.sha256, 'string');
    assert.equal(sha256(join(root, clip.file)), clip.sha256, clip.file);
    if (clip.voice_id !== LUCY || clip.model !== MODEL || clip.voice_name !== 'Lucy') mismatches.push(clip);
  }
  const mismatchPath = join(root, 'VOICE-MISMATCHES.md');
  if (mismatches.length) {
    const lines = mismatches.map((clip) => `${clip.file}\t${clip.text}\t${clip.voice_id}`);
    writeFileSync(mismatchPath, lines.join('\n') + '\n');
  }
  assert.equal(mismatches.length, 0, mismatches.map((clip) => clip.file).join(', '));
  assert.equal(existsSync(mismatchPath), false);
});

test('both games play the shared A–Z map and keep Lucy locked', () => {
  const play = readFileSync(join(root, 'shared/play.js'), 'utf8');
  assert.match(play, /-name-trim\.mp3|\.name, row\.sound|AUDIO\.letters/);
  assert.match(play, /\.\.\/lucy-lock\/lucy-\$\{mood\}\.jpg/);
  assert.doesNotMatch(play, /assets\/lucy-\$\{mood\}\.jpg/);
  assert.doesNotMatch(play, /lucy-name-|lucy-phoneme-/);
  const art = readFileSync(join(root, 'shared/art.js'), 'utf8');
  for (const word of Object.values(WORDS)) {
    assert.match(art, new RegExp('\\b' + word + '\\s*:'));
  }
  for (const layout of ['letter-post', 'moonboat']) {
    const html = readFileSync(join(root, layout, 'index.html'), 'utf8');
    const scripts = [...html.matchAll(/src="([^"]+)"/g)].map((match) => match[1]);
    const lettersAt = scripts.indexOf('../shared/letters.js');
    const mapAt = scripts.indexOf('../shared/audio-map.js');
    const playAt = scripts.indexOf('../shared/play.js');
    assert.ok(lettersAt >= 0 && mapAt > lettersAt && playAt > mapAt, layout);
    assert.match(html, /href="\.\.\/shared\/az\.css"/);
    const config = assignment(layout + '/config.js', 'CONCEPT');
    const expected = config.kind === 'post'
      ? ['Air mail', 'Candy post', 'Dark']
      : ['Dark', 'Cloud day', 'Plum dusk'];
    assert.deepEqual(config.themes, expected);
  }
});

test('locked Lucy reference files are unchanged copies of the originals', () => {
  const rows = parseSums(readFileSync(join(root, 'lucy-reference-sha256.txt'), 'utf8'));
  assert.ok(rows.length > 0);
  const listed = new Set(rows.map((row) => row.file));
  const refDir = join(root, 'lucy-lock');
  const origDir = join(repo, 'app/art/lucy');
  for (const row of rows) {
    assert.equal(sha256(join(refDir, row.file)), row.hash, row.file);
    assert.equal(sha256(join(origDir, row.file)), row.hash, 'original ' + row.file);
  }
  const originals = readdirSync(origDir).filter((name) => /\.(jpg|png)$/i.test(name));
  for (const name of originals) assert.ok(listed.has(name), 'missing lock ' + name);
  for (const name of readdirSync(refDir)) assert.ok(listed.has(name), 'extra lock ' + name);
});

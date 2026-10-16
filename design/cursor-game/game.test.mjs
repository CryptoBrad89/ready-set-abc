import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const repo = join(root, '..', '..');
const LUCY = 'FgiNpTIapnCbaD6xiqIo';
const MODEL = 'eleven_v4';

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

test('letter clips match the approved sha256 list and map A–Z name and sound', () => {
  const rows = parseSums(readFileSync(join(root, 'approved-sha256.txt'), 'utf8'));
  assert.equal(rows.length, 53);
  const byName = new Map(rows.map((row) => [row.file, row.hash]));
  const onDisk = readdirSync(join(root, 'audio')).filter((name) => name.endsWith('-trim.mp3'));
  assert.deepEqual(onDisk.sort(), rows.map((row) => row.file).sort());
  for (const row of rows) {
    assert.equal(sha256(join(root, 'audio', row.file)), row.hash, row.file);
  }

  const clips = JSON.parse(readFileSync(join(root, 'clips.json'), 'utf8'));
  for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    const name = clips.items.find((item) => item.letter === letter && item.kind === 'name');
    const sound = clips.items.find((item) => item.letter === letter && item.kind === 'sound');
    assert.ok(name, letter + ' name');
    assert.ok(sound, letter + ' sound');
    const nameFile = name.trimmed.slice('audio/'.length);
    const soundFile = sound.trimmed.slice('audio/'.length);
    assert.equal(byName.get(nameFile), sha256(join(root, 'audio', nameFile)), nameFile);
    assert.equal(byName.get(soundFile), sha256(join(root, 'audio', soundFile)), soundFile);
    const lower = letter.toLowerCase();
    const playedName = join(repo, 'design/cursor-phoneme-test/audio', `v4-name-${lower}.mp3`);
    const playedSound = join(repo, 'design/cursor-phoneme-test/audio', `v4-phoneme-${lower}.mp3`);
    assert.equal(sha256(playedName), byName.get(nameFile), playedName);
    assert.equal(sha256(playedSound), byName.get(soundFile), playedSound);
  }
});

test('every clip is Lucy on eleven_v4', () => {
  const manifest = JSON.parse(readFileSync(join(root, 'voice-manifest.json'), 'utf8'));
  assert.ok(Array.isArray(manifest));
  assert.equal(manifest.length, 53);
  const mismatches = [];
  for (const clip of manifest) {
    assert.equal(typeof clip.file, 'string');
    assert.equal(typeof clip.text, 'string');
    assert.equal(typeof clip.sha256, 'string');
    const file = join(root, clip.file);
    assert.equal(sha256(file), clip.sha256, clip.file);
    if (clip.voice_id !== LUCY || clip.model !== MODEL) {
      mismatches.push(clip);
    }
  }
  const mismatchPath = join(root, 'VOICE-MISMATCHES.md');
  if (mismatches.length) {
    const lines = mismatches.map((clip) => `${clip.file}\t${clip.text}\t${clip.voice_id}`);
    writeFileSync(mismatchPath, lines.join('\n') + '\n');
  }
  assert.equal(mismatches.length, 0, mismatches.map((clip) => clip.file).join(', '));
  assert.equal(existsSync(mismatchPath), false);
});

test('the game plays approved name and sound clips', () => {
  for (const layout of ['letter-post', 'moonboat']) {
    const source = readFileSync(join(root, layout, 'app.js'), 'utf8');
    assert.match(source, /-name-trim\.mp3/);
    assert.match(source, /-sound-trim\.mp3/);
    assert.match(source, /\.\.\/lucy-lock\/lucy-\$\{mood\}\.jpg/);
    assert.doesNotMatch(source, /assets\/lucy-\$\{mood\}\.jpg/);
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

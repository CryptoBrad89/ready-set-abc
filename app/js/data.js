/* Seeded content. Loaded once at boot and held in memory for the session.
   The roster a teacher edits in Grown-Ups is layered over the shipped file. */

import { store } from './store.js';
import { setClouds, isPlayable } from './clouds.js';

const cache = { roster: null, letters: null, audio: null, clouds: null };

async function loadJSON(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.json();
}

export async function loadData() {
  const [roster, letters, audioMap, cloudsFile] = await Promise.all([
    loadJSON('data/roster.json'),
    loadJSON('data/letters.json'),
    loadJSON('data/audio.json').catch(() => ({ clips: {} })),
    loadJSON('data/clouds.json').catch(() => ({ clouds: [] })),
  ]);
  cache.roster = roster;
  cache.letters = letters;
  cache.audio = audioMap;
  cache.clouds = cloudsFile;
  setClouds((cloudsFile && cloudsFile.clouds) || []);
  return { roster, letters, audio: audioMap, clouds: cloudsFile };
}

/* What goes on the printed sheets and the face grid. A teacher who imports
   another tablet's roster (or renames the room in Grown-Ups → Class) owns the
   name; data/roster.json is only the fallback. */
export function className() {
  return store.getClassNameOverride() || shippedClassName();
}
export function shippedClassName() {
  const name = cache.roster ? String(cache.roster.className || '').trim() : '';
  return name || 'Class';
}
export function shippedKids() { return (cache.roster ? cache.roster.kids : []).map(withKidDefaults); }
export function kids() { return (store.getRosterOverride() || shippedKids()).map(withKidDefaults); }

function withKidDefaults(kid) {
  if (!kid || typeof kid !== 'object') return kid;
  const workMode = ['satpin', 'assigned', 'free'].includes(kid.workMode) ? kid.workMode : 'satpin';
  const assignedLetters = Array.isArray(kid.assignedLetters)
    ? kid.assignedLetters.map((ch) => String(ch || '').toUpperCase()).filter((ch) => /^[A-Z]$/.test(ch))
    : [];
  return { ...kid, workMode, assignedLetters, arcadeLocked: !!kid.arcadeLocked };
}
export function kidById(id) { return kids().find((k) => k.id === id) || null; }

/* True once there is a roster to check an id against — either the shipped
   class file has loaded, or a teacher override is sitting in localStorage. */
export function rosterReady() { return !!cache.roster || store.getRosterOverride() !== null; }

/* Who is playing, self-healing.

   rsabc.kid outlives the roster it came from: a grown-up removes that child,
   imports another tablet's CSV, resets to the class file, or a smoke bookmark
   names an id nobody has. The old code carried on with a null kid — no name
   chip, and stars filed under a ghost owner. Now a stale id is dropped, which
   sends the child back to the face grid where they can pick again. */
export function activeKid() {
  const id = store.getKidId();
  if (!id) return null;
  if (!rosterReady()) return null;      // pre-boot: never clear on a guess
  const kid = kidById(id);
  if (kid) return kid;
  store.clearKid();
  return null;
}
export function audioClips() { return (cache.audio && cache.audio.clips) || {}; }

export function letters() { return cache.letters ? cache.letters.letters : []; }
export function letterByChar(ch) { return letters().find((l) => l.letter === ch) || null; }
export function contentAwake() { return letters().filter((l) => l.awake); }
export function awakeLetters() { return letters().filter((l) => isPlayable(l.letter)); }
export function contentVersion() { return cache.letters ? cache.letters.contentVersion : 'unknown'; }
export function isAwake(ch) { return isPlayable(ch); }

/* GAME-FLOW §15: each letter has a picture pool. Canonical word/emoji is the
   fallback so a letter with no pool still has one card. */
export function picturesFor(letter) {
  const entry = typeof letter === 'string' ? letterByChar(letter) : letter;
  if (!entry) return [];
  if (Array.isArray(entry.pictures) && entry.pictures.length) {
    return entry.pictures.map((p) => ({
      id: p.id || String(p.word || '').toLowerCase().replace(/\s+/g, '-'),
      word: p.word,
      emoji: p.emoji,
      letter: entry.letter,
      phoneme: entry.phoneme,
      say: entry.say,
    }));
  }
  return [{
    id: String(entry.word || '').toLowerCase().replace(/\s+/g, '-'),
    word: entry.word,
    emoji: entry.emoji,
    letter: entry.letter,
    phoneme: entry.phoneme,
    say: entry.say,
  }];
}

export function pickPicture(letter, { exclude = [] } = {}) {
  const pool = picturesFor(letter);
  if (!pool.length) return null;
  const skip = new Set(exclude.map((x) => (x && x.word) || x));
  const fresh = pool.filter((p) => !skip.has(p.word));
  const bag = fresh.length ? fresh : pool;
  return bag[Math.floor(Math.random() * bag.length)];
}

/* n distractors that are not `letter`. Awake letters first so the sounds a
   child hears in a round are ones the class has actually met. */
export function distractors(letter, n) {
  const pool = awakeLetters().filter((l) => l.letter !== letter);
  const rest = letters().filter((l) => l.letter !== letter && !l.awake);
  const picked = [];
  const take = (arr) => {
    const bag = arr.slice();
    while (bag.length && picked.length < n) {
      picked.push(bag.splice(Math.floor(Math.random() * bag.length), 1)[0]);
    }
  };
  take(pool);
  take(rest);
  return picked;
}

export function shuffle(list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

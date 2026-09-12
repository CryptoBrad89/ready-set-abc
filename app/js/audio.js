/* Audio: three independent channels (Music / SFX / Voice), one unlock gate.
   Browsers will not make a sound until a real user gesture. The giant PLAY
   button is that gesture. Header mute dots only flip prefs — they do not
   unlock. Grown-Ups tests and other play-start taps (trail / faces / round
   cards) may unlock because they are also user gestures that start sound.

   Voice resolves in this order:
     1. a recorded clip listed in data/audio.json  (audio/<file>)
     2. silence. No speechSynthesis. Names, words, and other Lucy lines wait
        for mapped clips. Cheers and nudges speak when their ids are mapped.
     3. phonemes: clip only. No TTS, no oscillator “puh”. Silence + Lucy’s line.

   Music and SFX are WAV beds in audio/ (see audio/LICENSES.md).
   The celebrate sting is SFX. Lucy also speaks the mapped cheer clip.

   Phoneme ≠ name ≠ word. The three live in three clip namespaces that cannot
   overlap (see `clipId`), sayPhoneme() never sends a letter name to the
   speaker, and setClips() drops a phoneme id that points at a name file.

   data/audio.json maps a clip only when `clips` has a filename. A null
   placeholder is not fetched, so unmapped ids stay silent offline. */

import { store } from './store.js';

let ctx = null;
let musicGain = null;
let sfxGain = null;
let unlocked = false;
let clips = {};
let musicTimer = 0;
let musicStep = 0;
let musicSource = null;
let duckCount = 0;
let voiceGen = 0;
let clipEl = null;
const buffers = {};

const listeners = new Set();

/* Longest a recorded clip may hold the music duck before we let go of it. */
const CLIP_WATCHDOG_MS = 8000;

function notify() { listeners.forEach((fn) => fn(unlocked)); }

/* TTS-safe phonemes. Repeating the letter ("aaa") is read as "A, A, A"
   by speechSynthesis — a GAME-FLOW ship-blocker. */
export const PHONEME_VOICE = {
  A: 'ah', B: 'buh', C: 'kuh', D: 'duh', E: 'eh', F: 'ffff',
  G: 'guh', H: 'huh', I: 'ih', J: 'juh', K: 'kuh', L: 'llll',
  M: 'mmm', N: 'nnn', O: 'aw', P: 'puh', Q: 'kwuh', R: 'rrrr',
  S: 'ssss', T: 'tuh', U: 'uh', V: 'vvvv', W: 'wuh', X: 'ks',
  Y: 'yuh', Z: 'zzzz',
};

function up(value) { return String(value || '').slice(0, 1).toUpperCase(); }

/* The three voice channels get three id namespaces, built here and nowhere
   else. `name-A` can never be reached by a phoneme tap and `word-A-apple` can
   never be reached by either, because no call site types the string itself.
   data/audio.json lists exactly these ids as silent placeholders. */
export const clipId = {
  name: (letter) => `name-${up(letter)}`,
  phoneme: (letter) => `phoneme-${up(letter)}`,
  word: (letter, id) => (id ? `word-${up(letter)}-${id}` : `word-${up(letter)}`),
  cheer: (i) => `cheer-${i + 1}`,
  nudge: (i) => `nudge-${i + 1}`,
};

/* First mapped id wins: word-A-apple, else word-A, else silence. */
function firstClip(candidates) {
  const list = Array.isArray(candidates) ? candidates : [candidates];
  return list.find((id) => id && clips[id]) || null;
}

export function looksLikeLetterName(text, letter) {
  const t = String(text || '').trim().replace(/[!.]+$/g, '').trim();
  if (!t) return true;
  if (/^[A-Za-z]$/.test(t)) return true;
  if (/^letter\s+[A-Za-z]$/i.test(t)) return true;
  if (letter && t.toUpperCase() === String(letter).toUpperCase()) return true;
  return false;
}

export function phonemeText(entry) {
  if (!entry) return '';
  const letter = String(entry.letter || '').toUpperCase();
  if (PHONEME_VOICE[letter]) return PHONEME_VOICE[letter];
  const raw = String(entry.say || '').trim();
  if (looksLikeLetterName(raw, letter)) return 'uh';
  return raw || 'uh';
}

function ensureCtx() {
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') ctx.resume();
  if (ctx && !musicGain) {
    musicGain = ctx.createGain();
    musicGain.gain.value = 1;
    musicGain.connect(ctx.destination);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = 1;
    sfxGain.connect(ctx.destination);
  }
  return ctx;
}

function buses() {
  const ac = ensureCtx();
  if (!ac) return null;
  return { ac, music: musicGain, sfx: sfxGain };
}

function ramp(gainNode, value, seconds) {
  if (!gainNode || !ctx) return;
  const g = gainNode.gain;
  const t = ctx.currentTime;
  g.cancelScheduledValues(t);
  const from = Math.max(0.0001, g.value || 0.0001);
  g.setValueAtTime(from, t);
  g.exponentialRampToValueAtTime(Math.max(0.0001, value), t + seconds);
}

function setMusicDuck(on) {
  const b = buses();
  if (!b || !store.getAudio().music) return;
  ramp(b.music, on ? 0.16 : 1, on ? 0.08 : 0.28);
}

function beginDuck() {
  duckCount += 1;
  setMusicDuck(true);
}

function endDuck() {
  duckCount = Math.max(0, duckCount - 1);
  if (duckCount === 0) setMusicDuck(false);
}

/* One oscillator blip. SFX and music share the helper, not the bus. */
function tone({ freq = 523.25, type = 'triangle', dur = 0.28, gain = 0.16, delay = 0, dest = null } = {}) {
  const ac = ensureCtx();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp);
  amp.connect(dest || (sfxGain || ac.destination));
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const CHEERS = ['Yes!', 'You got it!', 'Excellent!', 'Nice job!', 'Woohoo!', 'High five!'];
export const NUDGES = ['Not quite!', 'Try again!', 'Almost!', 'Keep going!'];

const SFX_FILES = {
  tap: 'audio/sfx-tap.wav',
  select: 'audio/sfx-select.wav',
  right: 'audio/sfx-right.wav',
  cheer: 'audio/sfx-cheer.wav',
  wrong: 'audio/sfx-wrong.wav',
  star: 'audio/sfx-star.wav',
  pop: 'audio/sfx-pop.wav',
  woof: 'audio/sfx-woof.wav',
};
const MUSIC_FILE = 'audio/music-loop.wav';

function playBuffer(name, dest = null, { loop = false } = {}) {
  const ac = ensureCtx();
  const buf = buffers[name];
  if (!ac || !buf) return null;
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.loop = !!loop;
  src.connect(dest || sfxGain || ac.destination);
  try { src.start(); } catch (err) { return null; }
  return src;
}

async function loadBuffers() {
  const ac = ensureCtx();
  if (!ac) return;
  const jobs = Object.entries({ ...SFX_FILES, music: MUSIC_FILE }).map(async ([key, url]) => {
    try {
      const res = await fetch(url, { cache: 'force-cache' });
      if (!res.ok) return;
      const raw = await res.arrayBuffer();
      buffers[key] = await ac.decodeAudioData(raw.slice(0));
    } catch (err) {
      console.warn('[audio] missing bed', url, err);
    }
  });
  await Promise.all(jobs);
}

function silentUnlockPulse(ac) {
  try {
    const buf = ac.createBuffer(1, 1, ac.sampleRate);
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.connect(ac.destination);
    src.start();
  } catch (err) { /* resume() is the real unlock */ }
}

function stopVoice() {
  voiceGen += 1;
  if (clipEl) {
    try { clipEl.pause(); } catch (err) { /* already gone */ }
    clipEl.src = '';
    clipEl = null;
  }
  if ('speechSynthesis' in window) {
    try { window.speechSynthesis.cancel(); } catch (err) { /* ignore */ }
  }
  duckCount = 0;
  setMusicDuck(false);
}

function phonemeBlip() {
  /* Isolated phonemes are files only. Never invent a “puh” with TTS or a tone. */
}

function speakSynth(text, { kind = 'line', letter = '', gen = voiceGen } = {}) {
  /* English waits for a recorded clip. Never invent speechSynthesis words. */
  const done = () => { if (gen === voiceGen) endDuck(); };
  setTimeout(done, 80);
}

export const audio = {
  /* PLAY (and teacher tests / other play-start taps). Not the header dots. */
  unlock() {
    const ac = ensureCtx();
    if (!ac) return false;
    silentUnlockPulse(ac);
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.resume(); } catch (err) { /* ignore */ }
    }
    unlocked = true;
    notify();
    loadBuffers().then(() => audio.syncMusic());
    return true;
  },
  isUnlocked() { return unlocked; },
  onUnlock(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  /* data/audio.json is a recording checklist first and a clip map second.
     A null / blank value is a documented silent placeholder, not a file, so it
     is dropped here — otherwise `new Audio('audio/null')` would 404 on every
     tap. A phoneme id pointing at the file a name id already uses is the one
     mix-up that would say the letter name on a choice tap: dropped and logged,
     so the round falls back to the sound rather than shipping the name. */
  setClips(map) {
    const src = map && typeof map === 'object' ? map : {};
    const next = {};
    Object.entries(src).forEach(([id, file]) => {
      const name = typeof file === 'string' ? file.trim() : '';
      if (id && name) next[id] = name;
    });
    Object.keys(next).forEach((id) => {
      const m = /^phoneme-([A-Z])$/.exec(id);
      if (!m) return;
      if (next[clipId.name(m[1])] === next[id]) {
        console.warn(`[audio] ${id} points at the ${clipId.name(m[1])} clip — dropped, using the sound instead`);
        delete next[id];
      }
    });
    clips = next;
    return clips;
  },
  hasClip(id) { return !!(id && clips[id]); },
  clipCount() { return Object.keys(clips).length; },

  sfx(name) {
    if (!unlocked || !store.getAudio().sfx) return;
    if (!playBuffer(name)) {
      /* Bed not decoded yet — skip rather than invent an oscillator hit. */
    }
  },

  /* Voice channel. Recorded clip if we have one, else silence.
     Silent until PLAY (or a Grown-Ups test) unlocks audio.
     Mute Voice does not touch SFX; mute SFX does not touch Voice. */
  speak(text, { clip = null, kind = 'line', letter = '' } = {}) {
    if (!unlocked || !store.getAudio().voice) return;
    let line = String(text || '').trim();
    if (kind === 'phoneme') {
      line = phonemeText({ letter, say: line });
      if (looksLikeLetterName(line, letter)) line = phonemeText({ letter });
    }
    if (!line) return;

    const key = firstClip(clip);
    if (!key) return;

    stopVoice();
    const gen = voiceGen;
    beginDuck();
    const done = () => { if (gen === voiceGen) endDuck(); };

    try {
      const a = new Audio(`audio/${clips[key]}`);
      clipEl = a;
      let handed = false;
      const fallback = () => {
        if (gen !== voiceGen || handed) return;
        handed = true;
        done();
      };
      /* A clip that stalls fires neither `ended` nor `error`. Without this
         the music would stay ducked for the rest of the morning. */
      const guard = setTimeout(() => {
        if (gen !== voiceGen || handed) return;
        handed = true;
        done();
      }, CLIP_WATCHDOG_MS);
      a.addEventListener('ended', () => {
        clearTimeout(guard);
        if (handed) return;
        handed = true;
        done();
      }, { once: true });
      a.addEventListener('error', () => { clearTimeout(guard); fallback(); }, { once: true });
      a.play().catch(() => { clearTimeout(guard); fallback(); });
    } catch (err) {
      done();
    }
  },

  stopVoice,

  /* ---- audio contract (GAME-FLOW §7) --------------------------------
     name    — board appear (case + picture). Never on a choice tap.
     phoneme — letter-choice tap. The SOUND, never the letter name.
     word    — picture tap. The picture's word only.
     cheer   — after a correct submitted two-tap.
     nudge   — after a wrong one. Never scolds, always invites another go. */
  sayLetterName(letter) {
    if (!letter) return;
    const L = up(letter);
    audio.speak(`${L}!`, { clip: clipId.name(L), kind: 'name', letter: L });
  },
  sayPhoneme(entry) {
    if (!entry) return;
    const L = up(entry.letter);
    const id = clipId.phoneme(L);
    if (!audio.hasClip(id)) return;
    audio.speak(phonemeText(entry), { clip: id, kind: 'phoneme', letter: L });
  },
  /* Per-picture clip first ("Apple!"), then one clip for the whole letter. */
  sayWord(picture) {
    if (!picture || !picture.word) return;
    const L = up(picture.letter);
    if (!L) { audio.speak(picture.word, { kind: 'word' }); return; }
    const chain = picture.id ? [clipId.word(L, picture.id), clipId.word(L)] : [clipId.word(L)];
    audio.speak(picture.word, { clip: chain, kind: 'word', letter: L });
  },
  /* SFX bed still plays. Lucy also speaks the mapped line. */
  cheer() {
    const i = Math.floor(Math.random() * CHEERS.length);
    const line = CHEERS[i];
    audio.sfx('cheer');
    audio.speak(line, { clip: [clipId.cheer(i), 'cheer'], kind: 'line' });
    return line;
  },
  nudge() {
    const i = Math.floor(Math.random() * NUDGES.length);
    const line = NUDGES[i];
    audio.speak(line, { clip: [clipId.nudge(i), 'nudge'], kind: 'line' });
    return line;
  },

  /* Header / Grown-Ups mute dots. Prefs are already in the store. */
  applyMutes() {
    const prefs = store.getAudio();
    if (!prefs.voice) stopVoice();
    audio.syncMusic();
  },

  syncMusic() {
    if (musicSource) {
      try { musicSource.stop(); } catch (err) { /* already stopped */ }
      musicSource = null;
    }
    clearInterval(musicTimer);
    musicTimer = 0;
    const b = buses();
    const on = unlocked && store.getAudio().music;
    if (b) ramp(b.music, on ? (duckCount > 0 ? 0.16 : 1) : 0.0001, 0.08);
    if (on) {
      musicSource = playBuffer('music', b.music, { loop: true });
    }
  },
  stopAll() {
    clearInterval(musicTimer);
    musicTimer = 0;
    stopVoice();
  },
};

document.addEventListener('visibilitychange', () => {
  if (document.hidden) audio.stopAll();
  else audio.syncMusic();
});

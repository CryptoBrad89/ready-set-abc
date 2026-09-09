/* Audio: three independent channels (Music / SFX / Voice), one unlock gate.
   Browsers will not make a sound until a real user gesture. The giant PLAY
   button is that gesture. Header mute dots only flip prefs — they do not
   unlock. Grown-Ups tests and other play-start taps (trail / faces / round
   cards) may unlock because they are also user gestures that start sound.

   Voice resolves in this order:
     1. a recorded clip listed in data/audio.json  (audio/<file>)
     2. speechSynthesis                            (phase-2 stand-in)
     3. a short Web Audio voicing for phonemes, else silence — Lucy's
        on-screen line still shows.

   Phoneme ≠ name ≠ word. The three live in three clip namespaces that cannot
   overlap (see `clipId`), sayPhoneme() never sends a letter name to the
   speaker, and setClips() drops a phoneme id that points at a name file.

   data/audio.json ships every id as a SILENT PLACEHOLDER (null): the file
   documents what Lucy still has to record without mapping anything, so no
   clip is fetched and nothing 404s offline. */

import { store } from './store.js';

let ctx = null;
let musicGain = null;
let sfxGain = null;
let unlocked = false;
let clips = {};
let musicTimer = 0;
let musicStep = 0;
let duckCount = 0;
let voiceGen = 0;
let clipEl = null;

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

/* First mapped id wins: word-A-apple, else word-A, else the synth stand-in. */
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

const SFX = {
  tap:    () => tone({ freq: 660, dur: 0.1, gain: 0.09 }),
  select: () => { tone({ freq: 587.33, dur: 0.14 }); tone({ freq: 880, dur: 0.16, delay: 0.07 }); },
  right:  () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone({ freq: f, dur: 0.3, delay: i * 0.09 })),
  wrong:  () => { tone({ freq: 300, type: 'sine', dur: 0.18, gain: 0.12 }); tone({ freq: 233, type: 'sine', dur: 0.26, gain: 0.12, delay: 0.12 }); },
  star:   (i = 0) => tone({ freq: [659.25, 830.61, 1046.5][i] || 1046.5, dur: 0.45, gain: 0.18 }),
  pop:    () => tone({ freq: 880, type: 'sine', dur: 0.12, gain: 0.12 }),
  woof:   () => { tone({ freq: 196, type: 'sawtooth', dur: 0.16, gain: 0.1 }); tone({ freq: 147, type: 'sawtooth', dur: 0.2, gain: 0.09, delay: 0.13 }); },
};

/* Quiet playground wander on the music bus. One timer, never two loops. */
const MUSIC_NOTES = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46];
function musicTick() {
  if (!store.getAudio().music || !unlocked) return;
  const b = buses();
  if (!b) return;
  tone({
    freq: MUSIC_NOTES[musicStep % MUSIC_NOTES.length],
    type: 'sine',
    dur: 0.55,
    gain: 0.045,
    dest: b.music,
  });
  musicStep += 1;
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

function phonemeBlip(letter) {
  const b = buses();
  if (!b) return;
  const freq = 280 + ((String(letter || 'A').toUpperCase().charCodeAt(0) - 65) % 26) * 18;
  tone({ freq, type: 'sine', dur: 0.32, gain: 0.11, dest: b.sfx });
}

function speakSynth(text, { kind = 'line', letter = '', gen = voiceGen } = {}) {
  const done = () => { if (gen === voiceGen) endDuck(); };
  if (!('speechSynthesis' in window)) {
    if (kind === 'phoneme') phonemeBlip(letter);
    setTimeout(done, kind === 'phoneme' ? 400 : 80);
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = kind === 'phoneme' ? 0.7 : 0.85;
    u.pitch = kind === 'phoneme' ? 1.05 : 1.2;
    const hold = Math.max(900, String(text).length * 90);
    const watchdog = setTimeout(done, hold + 500);
    u.onend = () => { clearTimeout(watchdog); done(); };
    u.onerror = () => { clearTimeout(watchdog); done(); };
    window.speechSynthesis.speak(u);
  } catch (err) {
    if (kind === 'phoneme') phonemeBlip(letter);
    done();
  }
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
    audio.syncMusic();
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

  sfx(name, arg) {
    if (!unlocked || !store.getAudio().sfx) return;
    const fn = SFX[name];
    if (fn) fn(arg);
  },

  /* Voice channel. Recorded clip if we have one, else the synth stand-in.
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

    stopVoice();
    const gen = voiceGen;
    beginDuck();
    const done = () => { if (gen === voiceGen) endDuck(); };

    const key = firstClip(clip);
    if (key) {
      try {
        const a = new Audio(`audio/${clips[key]}`);
        clipEl = a;
        let handed = false;
        const fallback = () => {
          if (gen !== voiceGen || handed) return;
          handed = true;
          speakSynth(line, { kind, letter, gen });
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
        return;
      } catch (err) { /* fall through to synth */ }
    }
    speakSynth(line, { kind, letter, gen });
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
    audio.speak(phonemeText(entry), { clip: clipId.phoneme(L), kind: 'phoneme', letter: L });
  },
  /* Per-picture clip first ("Apple!"), then one clip for the whole letter. */
  sayWord(picture) {
    if (!picture || !picture.word) return;
    const L = up(picture.letter);
    if (!L) { audio.speak(picture.word, { kind: 'word' }); return; }
    const chain = picture.id ? [clipId.word(L, picture.id), clipId.word(L)] : [clipId.word(L)];
    audio.speak(picture.word, { clip: chain, kind: 'word', letter: L });
  },
  /* Recorded Lucy rotates with the on-screen line: cheer-3 for "Excellent!".
     A single `cheer` clip still works as the catch-all for a short session. */
  cheer() {
    const i = Math.floor(Math.random() * CHEERS.length);
    const line = CHEERS[i];
    audio.speak(line, { clip: [clipId.cheer(i), 'cheer'], kind: 'cheer' });
    return line;
  },
  nudge() {
    const i = Math.floor(Math.random() * NUDGES.length);
    const line = NUDGES[i];
    audio.speak(line, { clip: [clipId.nudge(i), 'nudge'], kind: 'nudge' });
    return line;
  },

  /* Header / Grown-Ups mute dots. Prefs are already in the store. */
  applyMutes() {
    const prefs = store.getAudio();
    if (!prefs.voice) stopVoice();
    audio.syncMusic();
  },

  syncMusic() {
    clearInterval(musicTimer);
    musicTimer = 0;
    const b = buses();
    const on = unlocked && store.getAudio().music;
    if (b) ramp(b.music, on ? (duckCount > 0 ? 0.16 : 1) : 0.0001, 0.08);
    if (on) {
      musicTick();
      musicTimer = setInterval(musicTick, 720);
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

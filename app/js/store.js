/* Local device state. localStorage only — no accounts, no backend, no network.
   Stars and progress are device-local by design (see research/05 §4). */

const NS = 'rsabc.';

export const KEYS = {
  kid: 'kid',                   // currently selected kid id (classroom mode)
  classroom: 'classroom',       // face pick before play, on/off
  roster: 'roster',             // teacher edits layered over data/roster.json
  className: 'className',       // teacher's name for this class, this device
  settings: 'settings',         // round size, choice count, case mode, words
  audio: 'audio',               // { music, sfx, voice }
  mode: 'mode',                 // center | small-group | whiteboard
  hideChrome: 'hideChrome',     // hide header tabs / gate / footer; Lucy stays
  pinnedLetter: 'pinnedLetter', // teacher's letter of the day
  cursor: 'cursor',             // letter form of the ABC cursor (legacy)
  nextAbcIndex: 'nextAbcIndex', // GAME-FLOW ABC cursor, 0–25 (A=0)
  stars: 'stars',               // { kidId|_device: { A: 3, B: 2 } }  best result
  stickers: 'stickers',         // { kidId|_device: [ {letter,id,word,emoji} ] }
  outfit: 'outfit',             // treat ids Lucy is wearing (js/closet.js), [] = plain
  progress: 'progress',         // { kidId: { lastPlayed, letters: {...} } }
  cache: 'cache',               // { at, version, files }
  notes: 'notes',               // { kidId: string } roster notes, this device
  beats: 'beats',               // { kidId|_device: { P: 4, S: 2 } } 0–4 SATPIN beats
  skin: 'skin',                 // comic (light hub) | cosmic | violet
};

const MODES = ['center', 'small-group', 'whiteboard'];
const SKINS = ['comic', 'cosmic', 'violet'];
const DEVICE = '_device';

const DEFAULT_SETTINGS = {
  roundSize: 3,        // letters per round (1–26)
  choiceCount: 4,      // hanging letters on choose (2–8)
  showWords: true,     // word print under picture cards
  caseMode: 'both',    // both (mix) | upper | lower — what the child hunts
  hintAfter: 2,        // auto-glow after N misses; 0 = off
  progressMode: 'stars-save', // none | stars (session) | stars-save (localStorage)
  bonusMode: 'rotate', // off | rotate | hunt | sound | order  (js/bonus.js)
  cloudUnlock: 1,      // grown-up override: highest cloud id unlocked (1–5)
};
const BONUS_MODES = ['off', 'rotate', 'hunt', 'sound', 'order'];
const DEFAULT_AUDIO = { music: false, sfx: true, voice: true };

/* Session-only maps for progressMode === 'stars'. Cleared on reload. */
let sessionStars = {};
let sessionStickers = {};

function letterIndex(ch) {
  const n = String(ch || 'A').toUpperCase().charCodeAt(0) - 65;
  return Number.isFinite(n) ? ((n % 26) + 26) % 26 : 0;
}
function letterAt(index) {
  return String.fromCharCode(65 + (((index % 26) + 26) % 26));
}

const OUTFIT_SLUG = /^[a-z0-9-]{1,24}$/;
function parseOutfits(raw) {
  const parts = Array.isArray(raw)
    ? raw
    : String(raw || '').split('+');
  const seen = new Set();
  const out = [];
  let rejected = false;
  parts.forEach((part) => {
    const id = String(part || '').trim();
    if (!id) return;
    if (!OUTFIT_SLUG.test(id) || seen.has(id)) {
      rejected = true;
      return;
    }
    seen.add(id);
    out.push(id);
  });
  if (rejected) return [];
  return out;
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(NS + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (err) {
    console.warn('[store] unreadable key', key, err);
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
  } catch (err) {
    console.warn('[store] could not save', key, err);
  }
}

export const store = {
  /* --- who's playing ------------------------------------------------ */
  getKidId() {
    const id = read(KEYS.kid, null);
    return typeof id === 'string' && id && id !== DEVICE ? id : null;
  },
  /* An unusable id would file stars under a ghost owner — refuse it here so
     data.js only ever has to check "is this id still on the roster". */
  setKidId(id) {
    const clean = String(id ?? '').trim();
    if (!clean || clean === DEVICE) return store.clearKid();
    write(KEYS.kid, clean);
  },
  clearKid() { localStorage.removeItem(NS + KEYS.kid); },

  isClassroom() { return read(KEYS.classroom, false) === true; },
  setClassroom(on) {
    write(KEYS.classroom, !!on);
    if (!on) store.clearKid();
  },

  /* --- roster overrides (Grown-Ups → Class) -------------------------- */
  getRosterOverride() { return read(KEYS.roster, null); },
  setRosterOverride(kids) { write(KEYS.roster, kids); },
  clearRosterOverride() { localStorage.removeItem(NS + KEYS.roster); },

  /* --- class name -----------------------------------------------------
     data/roster.json ships one, but the roster a teacher actually uses is
     the override in this browser: import another tablet's CSV and every
     printed sheet still claimed the shipped class. Blank = follow the file. */
  getClassNameOverride() {
    const raw = read(KEYS.className, null);
    const name = typeof raw === 'string' ? raw.trim() : '';
    return name || null;
  },
  setClassName(name) {
    const clean = String(name ?? '').trim().replace(/\s+/g, ' ').slice(0, 48);
    if (clean) write(KEYS.className, clean);
    else localStorage.removeItem(NS + KEYS.className);
  },

  /* --- play settings ------------------------------------------------- */
  getSettings() { return { ...DEFAULT_SETTINGS, ...read(KEYS.settings, {}) }; },
  setSetting(key, value) {
    const next = store.getSettings();
    next[key] = value;
    write(KEYS.settings, next);
  },

  /* --- audio channels ------------------------------------------------ */
  getAudio() { return { ...DEFAULT_AUDIO, ...read(KEYS.audio, {}) }; },
  setAudio(channel, on) {
    const next = store.getAudio();
    next[channel] = !!on;
    write(KEYS.audio, next);
  },

  /* --- device mode ---------------------------------------------------- */
  getMode() {
    const m = read(KEYS.mode, 'center');
    return MODES.includes(m) ? m : 'center';
  },
  setMode(mode) {
    if (!MODES.includes(mode)) return;
    write(KEYS.mode, mode);
    applyMode(mode);
  },

  /* Kid chrome skin. comic = the light pop-art hub (default). cosmic / violet
     are the darker Stitch layouts. Layout regions stay the same; tokens swap. */
  getSkin() {
    const s = read(KEYS.skin, 'comic');
    return SKINS.includes(s) ? s : 'comic';
  },
  setSkin(skin) {
    if (!SKINS.includes(skin)) return;
    write(KEYS.skin, skin);
    applySkin(skin);
  },

  /* Hide tabs, Grown-Ups, audio dots, who-chip, footer. Lucy's prompts stay. */
  getHideChrome() { return read(KEYS.hideChrome, false) === true; },
  setHideChrome(on) {
    write(KEYS.hideChrome, !!on);
    applyChrome(!!on);
  },

  /* --- letter of the day / ABC cursor (GAME-FLOW nextAbcIndex) -------- */
  getPinnedLetter() { return read(KEYS.pinnedLetter, null); },
  setPinnedLetter(letter) { write(KEYS.pinnedLetter, letter); },
  getNextAbcIndex() {
    const n = read(KEYS.nextAbcIndex, null);
    if (typeof n === 'number' && n >= 0 && n <= 25) return n;
    return letterIndex(read(KEYS.cursor, 'A'));
  },
  setNextAbcIndex(index) {
    const n = letterIndex(letterAt(index));
    write(KEYS.nextAbcIndex, n);
    write(KEYS.cursor, letterAt(n));
  },
  getCursor() { return letterAt(store.getNextAbcIndex()); },
  setCursor(letter) { store.setNextAbcIndex(letterIndex(letter)); },

  /* --- stars: best result per letter, 3/2/1 ---------------------------
     GAME-FLOW progress modes:
       none        — play only; don't show or save
       stars       — show this session; do not persist
       stars-save  — show and persist per-letter best in localStorage (default) */
  starsOwner() { return store.isClassroom() ? (store.getKidId() || DEVICE) : DEVICE; },
  progressMode() { return store.getSettings().progressMode || 'stars-save'; },
  getStars(owner = store.starsOwner()) {
    const mode = store.progressMode();
    if (mode === 'none') return {};
    if (mode === 'stars') return sessionStars[owner] || {};
    return read(KEYS.stars, {})[owner] || {};
  },
  starsFor(letter) { return store.getStars()[letter] || 0; },
  totalStars() { return Object.values(store.getStars()).reduce((a, b) => a + b, 0); },
  awardStars(letter, count) {
    const mode = store.progressMode();
    if (mode === 'none') return;
    const owner = store.starsOwner();
    if (mode === 'stars') {
      const mine = sessionStars[owner] || {};
      mine[letter] = Math.max(mine[letter] || 0, count);
      sessionStars[owner] = mine;
      return;
    }
    const all = read(KEYS.stars, {});
    const mine = all[owner] || {};
    mine[letter] = Math.max(mine[letter] || 0, count);   // best run stands
    all[owner] = mine;
    write(KEYS.stars, all);
  },

  /* Stickers: one plate per unique picture a child has matched. */
  getStickerMap(owner = store.starsOwner()) {
    const mode = store.progressMode();
    if (mode === 'none') return [];
    if (mode === 'stars') return sessionStickers[owner] || [];
    return read(KEYS.stickers, {})[owner] || [];
  },
  stickers() { return store.getStickerMap(); },
  /* Returns true when this plate is new to the pouch, so celebrate can say
     "new sticker!" instead of announcing one the child already had. */
  awardSticker(picture) {
    const mode = store.progressMode();
    if (mode === 'none' || !picture || !picture.id) return false;
    const owner = store.starsOwner();
    const snap = {
      letter: picture.letter,
      id: picture.id,
      word: picture.word,
      emoji: picture.emoji,
    };
    const has = (list) => list.some((s) => s.letter === snap.letter && s.id === snap.id);
    const push = (list) => (has(list) ? list.slice() : [...list, snap]);
    if (mode === 'stars') {
      const mine = sessionStickers[owner] || [];
      const fresh = !has(mine);
      sessionStickers[owner] = push(mine);
      return fresh;
    }
    const all = read(KEYS.stickers, {});
    const mine = all[owner] || [];
    const fresh = !has(mine);
    all[owner] = push(mine);
    write(KEYS.stickers, all);
    return fresh;
  },

  /* Lucy's closet: which treats she is wearing. Kids pick and choose.
     Each id is a slug; closet.js owns the real treat list. A renamed treat
     just falls off. Old tablets stored one slug string; that still reads. */
  getOutfits() {
    return parseOutfits(read(KEYS.outfit, ''));
  },
  getOutfit() {
    return store.getOutfits().join('+');
  },
  setOutfits(ids) {
    const clean = parseOutfits(ids);
    if (!clean.length) { localStorage.removeItem(NS + KEYS.outfit); return; }
    write(KEYS.outfit, clean);
  },
  setOutfit(id) {
    if (id == null || String(id).trim() === '') {
      localStorage.removeItem(NS + KEYS.outfit);
      return;
    }
    const next = parseOutfits(id);
    if (!next.length) return;
    write(KEYS.outfit, next);
  },

  /* --- progress records ----------------------------------------------- */
  getProgress() { return read(KEYS.progress, {}); },
  recordRound(kidId, letter, stars) {
    const id = kidId || DEVICE;
    const all = store.getProgress();
    const kid = all[id] || { lastPlayed: null, letters: {} };
    const entry = kid.letters[letter] || { rounds: 0, lastAt: null, bestStars: 0 };
    entry.rounds += 1;
    entry.lastAt = new Date().toISOString();
    entry.bestStars = Math.max(entry.bestStars || 0, stars || 0);
    kid.letters[letter] = entry;
    kid.lastPlayed = entry.lastAt;
    all[id] = kid;
    write(KEYS.progress, all);
  },
  playedToday(kidId) {
    const kid = store.getProgress()[kidId];
    if (!kid || !kid.lastPlayed) return false;
    return kid.lastPlayed.slice(0, 10) === new Date().toISOString().slice(0, 10);
  },
  starsToday() {
    const kid = store.getProgress()[store.starsOwner()];
    if (!kid) return 0;
    const today = new Date().toISOString().slice(0, 10);
    return Object.values(kid.letters)
      .filter((l) => l.lastAt && l.lastAt.slice(0, 10) === today)
      .reduce((sum, l) => sum + (l.bestStars || 0), 0);
  },

  /* SATPIN beats: 0–4 per letter, per child on this tablet. */
  getBeatsMap(owner = store.starsOwner()) {
    return read(KEYS.beats, {})[owner] || {};
  },
  beatsFor(letter) {
    const L = String(letter || '').toUpperCase();
    const n = Number(store.getBeatsMap()[L]);
    return Number.isFinite(n) ? Math.max(0, Math.min(4, n)) : 0;
  },
  setBeats(letter, n) {
    const L = String(letter || '').toUpperCase();
    if (!/^[A-Z]$/.test(L)) return;
    const owner = store.starsOwner();
    const all = read(KEYS.beats, {});
    const mine = { ...(all[owner] || {}) };
    mine[L] = Math.max(0, Math.min(4, Number(n) || 0));
    all[owner] = mine;
    write(KEYS.beats, all);
  },

  /* --- roster notes (Grown-Ups Class tab, this device only, never synced) */
  getNotes() { return read(KEYS.notes, {}); },
  getNote(kidId) { return (read(KEYS.notes, {})[kidId] || ''); },
  setNote(kidId, text) {
    const all = read(KEYS.notes, {});
    const next = String(text || '').slice(0, 280);
    if (next) all[kidId] = next;
    else delete all[kidId];
    write(KEYS.notes, all);
  },

  /* --- offline cache health -------------------------------------------- */
  getCache() { return read(KEYS.cache, null); },
  setCache(info) { write(KEYS.cache, info); },

  /* --- Grown-Ups CSV snapshot (progress + settings, this device) ------- */
  exportSnapshot() {
    const roster = store.getRosterOverride();
    return {
      settings: store.getSettings(),
      audio: store.getAudio(),
      mode: store.getMode(),
      hideChrome: store.getHideChrome(),
      classroom: store.isClassroom(),
      outfit: store.getOutfit(),
      skin: store.getSkin(),
      pinnedLetter: store.getPinnedLetter(),
      nextAbcIndex: store.getNextAbcIndex(),
      kidId: store.getKidId(),
      className: store.getClassNameOverride() || '',
      hasRosterOverride: roster !== null,
      roster: clone(roster !== null ? roster : []),
      notes: clone(store.getNotes()),
      stars: clone(read(KEYS.stars, {})),
      stickers: clone(read(KEYS.stickers, {})),
      progress: clone(store.getProgress()),
      beats: clone(read(KEYS.beats, {})),
    };
  },
  importSnapshot(snap) {
    if (!snap || typeof snap !== 'object') return;
    sessionStars = {};
    sessionStickers = {};

    write(KEYS.settings, sanitizeSettings(snap.settings));
    write(KEYS.audio, sanitizeAudio(snap.audio));

    const mode = MODES.includes(snap.mode) ? snap.mode : 'center';
    write(KEYS.mode, mode);
    write(KEYS.hideChrome, sanitizeBool(snap.hideChrome, false));
    applyPresentation();

    const skin = SKINS.includes(snap.skin) ? snap.skin : 'comic';
    write(KEYS.skin, skin);
    applySkin(skin);

    write(KEYS.classroom, sanitizeBool(snap.classroom, false));
    /* Import replaces this tablet: clear first so a rejected outfit id cannot
       leave the old Lucy dressed in something the file never mentioned. */
    localStorage.removeItem(NS + KEYS.outfit);
    store.setOutfit(Array.isArray(snap.outfit) ? snap.outfit : (typeof snap.outfit === 'string' ? snap.outfit.trim() : ''));

    const pin = sanitizeLetter(snap.pinnedLetter);
    if (pin) write(KEYS.pinnedLetter, pin);
    else localStorage.removeItem(NS + KEYS.pinnedLetter);

    store.setNextAbcIndex(sanitizeInt(snap.nextAbcIndex, 0, 0, 25));

    store.setClassName(typeof snap.className === 'string' ? snap.className : '');

    if (sanitizeBool(snap.hasRosterOverride, false)) {
      const list = Array.isArray(snap.roster) ? snap.roster.map(sanitizeKid).filter(Boolean) : [];
      write(KEYS.roster, list);
    } else {
      localStorage.removeItem(NS + KEYS.roster);
    }

    write(KEYS.notes, sanitizeNotes(snap.notes));
    write(KEYS.stars, sanitizeStarsMap(snap.stars));
    write(KEYS.stickers, sanitizeStickerMap(snap.stickers));
    write(KEYS.progress, sanitizeProgressMap(snap.progress));
    write(KEYS.beats, sanitizeBeatsMap(snap.beats));

    const kidId = typeof snap.kidId === 'string' && snap.kidId ? snap.kidId : null;
    if (sanitizeBool(snap.classroom, false) && kidId) write(KEYS.kid, kidId);
    else localStorage.removeItem(NS + KEYS.kid);
  },

  reset() {
    sessionStars = {};
    sessionStickers = {};
    Object.values(KEYS).forEach((k) => localStorage.removeItem(NS + k));
    applyPresentation();
  },
};

export function applyMode(mode) {
  document.documentElement.dataset.mode = mode || store.getMode();
}

export function applyChrome(hidden) {
  const on = hidden === undefined ? store.getHideChrome() : !!hidden;
  document.documentElement.dataset.chrome = on ? 'hidden' : 'shown';
}

export function applySkin(skin) {
  document.documentElement.dataset.skin = skin || store.getSkin();
}

export function applyPresentation() {
  applyMode(store.getMode());
  applyChrome(store.getHideChrome());
  applySkin(store.getSkin());
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sanitizeBool(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  const s = String(value ?? '').trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(s)) return true;
  if (['0', 'false', 'no', 'off', ''].includes(s)) return false;
  return fallback;
}

function sanitizeInt(value, fallback, min, max) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function sanitizeLetter(value) {
  const ch = String(value ?? '').trim().toUpperCase();
  return /^[A-Z]$/.test(ch) ? ch : null;
}

function sanitizeSettings(raw = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const caseMode = ['both', 'upper', 'lower'].includes(src.caseMode) ? src.caseMode : DEFAULT_SETTINGS.caseMode;
  const progressMode = ['none', 'stars', 'stars-save'].includes(src.progressMode)
    ? src.progressMode
    : DEFAULT_SETTINGS.progressMode;
  const bonusMode = BONUS_MODES.includes(src.bonusMode) ? src.bonusMode : DEFAULT_SETTINGS.bonusMode;
  return {
    roundSize: sanitizeInt(src.roundSize, DEFAULT_SETTINGS.roundSize, 1, 26),
    choiceCount: sanitizeInt(src.choiceCount, DEFAULT_SETTINGS.choiceCount, 2, 8),
    showWords: sanitizeBool(src.showWords, DEFAULT_SETTINGS.showWords),
    caseMode,
    hintAfter: sanitizeInt(src.hintAfter, DEFAULT_SETTINGS.hintAfter, 0, 9),
    progressMode,
    bonusMode,
    cloudUnlock: sanitizeInt(src.cloudUnlock, DEFAULT_SETTINGS.cloudUnlock, 1, 5),
  };
}

function sanitizeAudio(raw = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    music: sanitizeBool(src.music, DEFAULT_AUDIO.music),
    sfx: sanitizeBool(src.sfx, DEFAULT_AUDIO.sfx),
    voice: sanitizeBool(src.voice, DEFAULT_AUDIO.voice),
  };
}

function sanitizeKid(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const name = String(raw.name || '').trim().slice(0, 18);
  if (!name) return null;
  const id = String(raw.id || '').trim().slice(0, 40);
  if (!id || id === DEVICE || !/^[A-Za-z0-9_-]+$/.test(id)) return null;
  const emoji = String(raw.emoji || '🐾').trim().slice(0, 8) || '🐾';
  const color = String(raw.color || '#5aa9f0').trim().slice(0, 32) || '#5aa9f0';
  return { id, name, emoji, color };
}

function sanitizeNotes(raw = {}) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  Object.entries(raw).forEach(([id, text]) => {
    const kidId = String(id || '').trim().slice(0, 40);
    const note = String(text || '').slice(0, 280);
    if (kidId && note) out[kidId] = note;
  });
  return out;
}

function sanitizeStarsMap(raw = {}) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  Object.entries(raw).forEach(([owner, letters]) => {
    if (!letters || typeof letters !== 'object') return;
    const mine = {};
    Object.entries(letters).forEach(([ch, count]) => {
      const letter = sanitizeLetter(ch);
      if (!letter) return;
      mine[letter] = sanitizeInt(count, 0, 0, 3);
    });
    if (Object.keys(mine).length) out[owner] = mine;
  });
  return out;
}

function sanitizeStickerMap(raw = {}) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  Object.entries(raw).forEach(([owner, list]) => {
    if (!Array.isArray(list)) return;
    const next = [];
    const seen = new Set();
    list.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const letter = sanitizeLetter(item.letter);
      const id = String(item.id || '').trim().slice(0, 40);
      if (!letter || !id) return;
      const key = `${letter}:${id}`;
      if (seen.has(key)) return;
      seen.add(key);
      next.push({
        letter,
        id,
        word: String(item.word || '').slice(0, 40),
        emoji: String(item.emoji || '').slice(0, 8),
      });
    });
    if (next.length) out[owner] = next;
  });
  return out;
}

function sanitizeProgressMap(raw = {}) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  Object.entries(raw).forEach(([owner, rec]) => {
    if (!rec || typeof rec !== 'object') return;
    const letters = {};
    const src = rec.letters && typeof rec.letters === 'object' ? rec.letters : {};
    Object.entries(src).forEach(([ch, entry]) => {
      const letter = sanitizeLetter(ch);
      if (!letter || !entry || typeof entry !== 'object') return;
      letters[letter] = {
        rounds: sanitizeInt(entry.rounds, 0, 0, 9999),
        lastAt: typeof entry.lastAt === 'string' ? entry.lastAt.slice(0, 40) : null,
        bestStars: sanitizeInt(entry.bestStars, 0, 0, 3),
      };
    });
    const lastPlayed = typeof rec.lastPlayed === 'string' ? rec.lastPlayed.slice(0, 40) : null;
    if (!lastPlayed && !Object.keys(letters).length) return;
    out[owner] = { lastPlayed, letters };
  });
  return out;
}

function sanitizeBeatsMap(raw = {}) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  Object.entries(raw).forEach(([owner, letters]) => {
    if (!letters || typeof letters !== 'object') return;
    const mine = {};
    Object.entries(letters).forEach(([ch, count]) => {
      const letter = sanitizeLetter(ch);
      if (!letter) return;
      mine[letter] = sanitizeInt(count, 0, 0, 4);
    });
    if (Object.keys(mine).length) out[owner] = mine;
  });
  return out;
}

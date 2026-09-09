/* The round engine.

   A round is N letters (default 3, teacher-settable). Each letter runs
   case match → picture match → bonus → celebrate. Both match steps are
   TWO-TAP: tap a choice, then tap the prompt. Stars are 3 (clean), 2 (1–2
   misses), 1 (3+ misses or a hint used).

   The bonus (js/bonus.js) is the one rotating step. It is a bonus in the
   plain sense: its misses never touch the star count, and a stuck child can
   always move on. Grown-Ups → Play can pin one game or switch it off, and
   then a letter goes straight from the picture match to celebrate. */

import { letterByChar, awakeLetters, distractors, shuffle, pickPicture } from './data.js';
import { buildBonus, BONUS_MODES } from './bonus.js';
import { newlyUnlocked } from './closet.js';
import { store } from './store.js';

export const STEPS = ['case', 'picture', 'bonus', 'celebrate'];

let round = null;

function letterSequence(startAt, size) {
  const awake = awakeLetters().map((l) => l.letter);
  const pool = awake.length ? awake : ['A'];
  let i = pool.indexOf(startAt);
  if (i < 0) i = 0;
  const n = Math.max(1, Math.min(size, pool.length));
  const seq = [];
  for (let k = 0; k < n; k += 1) seq.push(pool[(i + k) % pool.length]);
  return seq;
}

function freezeSettings() {
  const s = store.getSettings();
  return {
    roundSize: Math.max(1, Math.min(26, Number(s.roundSize) || 3)),
    choiceCount: Math.max(2, Math.min(8, Number(s.choiceCount) || 3)),
    caseMode: s.caseMode || 'both',
    hintAfter: Math.max(0, Math.min(5, Number(s.hintAfter) || 0)),
    showWords: s.showWords !== false,
    bonusMode: BONUS_MODES.includes(s.bonusMode) ? s.bonusMode : 'rotate',
  };
}

export function startRound({ startAt = null } = {}) {
  const frozen = freezeSettings();
  const first = startAt || store.getPinnedLetter() || store.getCursor() || 'A';
  round = {
    letters: letterSequence(first, frozen.roundSize),
    index: 0,
    step: 'case',
    misses: 0,
    hinted: false,
    results: {},
    trial: null,
    bonus: null,
    sticker: null,
    unlockedTreat: null,
    matchedPicture: null,
    cursorMoved: null,
    roundSize: frozen.roundSize,
    choiceCount: frozen.choiceCount,
    caseMode: frozen.caseMode,
    hintAfter: frozen.hintAfter,
    bonusMode: frozen.bonusMode,
  };
  buildTrial();
  return round;
}

/* What the home strip shows before anyone has tapped PLAY. */
export function previewLetters() {
  const frozen = freezeSettings();
  const first = store.getPinnedLetter() || store.getCursor() || 'A';
  return letterSequence(first, frozen.roundSize);
}

/* The letter the next CTA will really open.

   Inside a round that is the next letter in the set. At the end of a round it
   is the pin, else the ABC cursor (rsabc.nextAbcIndex, already stepped past the
   letter we just banked) — run back through letterSequence so the CTA can only
   ever name a letter the content file actually has. */
export function upNextLetter() {
  if (round && round.index < round.letters.length - 1) return round.letters[round.index + 1];
  const want = store.getPinnedLetter() || store.getCursor() || 'A';
  return letterSequence(want, 1)[0];
}

export function getRound() { return round; }
export function isActive() { return !!round; }
export function endRound() { round = null; }

export function currentLetter() {
  if (!round) return null;
  return letterByChar(round.letters[round.index]);
}

export function currentPicture() {
  if (!round) return null;
  return round.matchedPicture
    || (round.trial && round.trial.picture)
    || pickPicture(round.letters[round.index]);
}

function advanceCursorPast(letter) {
  if (!letter || store.getPinnedLetter()) return;
  const awake = awakeLetters().map((l) => l.letter);
  const at = awake.indexOf(letter);
  if (at >= 0) store.setCursor(awake[(at + 1) % awake.length]);
}

/* Which case the child hunts for. GAME-FLOW promptMode mix/upper/lower is
   stored as hunt (the other case is the given prompt). Frozen on the trial
   so a re-render never flips the board. */
function huntFor(mode) {
  if (mode === 'upper' || mode === 'lower') return mode;
  return Math.random() < 0.5 ? 'lower' : 'upper';   // both / mix
}

/* Choice cards for the current step. Case match shows letters, picture match
   shows one random picture from each letter's pool (GAME-FLOW §15).
   choiceCount is frozen on the round so Grown-Ups edits apply next PLAY. */
export function buildTrial() {
  if (!round) return null;
  const entry = currentLetter();
  const count = Math.max(2, Math.min(8, round.choiceCount || 3));
  const others = distractors(entry.letter, count - 1);
  const isPicture = round.step === 'picture';
  const picture = isPicture
    ? pickPicture(entry.letter, { exclude: round.matchedPicture ? [round.matchedPicture] : [] })
    : null;
  const choices = shuffle([entry, ...others]).map((item) => {
    if (!isPicture) return { ...item };
    const pic = item.letter === entry.letter ? picture : pickPicture(item.letter);
    return { ...item, picture: pic };
  });
  round.trial = {
    answer: entry.letter,
    picture,
    selected: null,
    locked: false,
    choices,
    hunt: huntFor(round.caseMode),
  };
  if (isPicture) round.matchedPicture = picture;
  return round.trial;
}

export function select(letter) {
  if (!round || !round.trial || round.trial.locked) return;
  round.trial.selected = letter;
}

/* The second tap. Returns 'right' | 'wrong' | null (nothing selected yet). */
export function submit() {
  if (!round || !round.trial || round.trial.locked) return null;
  const { selected, answer } = round.trial;
  if (!selected) return null;
  if (selected === answer) {
    round.trial.locked = true;
    return 'right';
  }
  round.misses += 1;
  round.trial.selected = null;
  maybeHint();
  return 'wrong';
}

export function useHint() {
  if (!round) return null;
  round.hinted = true;
  return round.trial ? round.trial.answer : null;
}

/* Auto-glow after N misses on this letter (default 2; 0 = off). */
export function maybeHint() {
  if (!round) return null;
  const after = round.hintAfter;
  if (after > 0 && round.misses >= after && !round.hinted) return useHint();
  return null;
}

export function starsEarned() {
  if (!round) return 0;
  if (round.hinted || round.misses >= 3) return 1;
  if (round.misses >= 1) return 2;
  return 3;
}

/* ------------------------------------------------------------- bonus ---
   One rotating game per letter (js/bonus.js builds the board). Misses here
   are free: they are counted for the grown-up, never for the stars. */

export function openBonus() {
  if (!round) return null;
  const spec = buildBonus(round.letters[round.index], { mode: round.bonusMode });
  if (!spec) { round.bonus = null; return null; }
  round.bonus = {
    ...spec,
    found: [],
    at: 0,            // sound: which picture we are asking about
    misses: 0,
    done: false,
    skipped: false,
  };
  return round.bonus;
}

export function getBonus() { return round ? round.bonus : null; }

/* The picture Sound Sort is asking about right now (null for the others). */
export function bonusCurrent() {
  const b = round && round.bonus;
  if (!b || b.type !== 'sound') return null;
  return b.items[b.at] || null;
}

function finishBonus(b) {
  if (b.found.length >= b.need) b.done = true;
  return b.done;
}

/* One tap. 'right' | 'wrong' | null (already used / not a tile).
   Sound Sort sends 'yes' / 'no'; the others send an item id. */
export function bonusTap(id) {
  const b = round && round.bonus;
  if (!b || b.done) return null;

  if (b.type === 'sound') {
    const item = b.items[b.at];
    if (!item || (id !== 'yes' && id !== 'no')) return null;
    const want = item.starts ? 'yes' : 'no';
    if (id !== want) { b.misses += 1; return 'wrong'; }
    b.found.push(item.id);
    b.at += 1;
    finishBonus(b);
    return 'right';
  }

  const item = b.items.find((it) => it.id === id);
  if (!item || b.found.includes(id)) return null;

  if (b.type === 'order') {
    if (item.rank !== b.found.length) { b.misses += 1; return 'wrong'; }
  } else if (!item.target) {                     // hunt
    b.misses += 1;
    return 'wrong';
  }
  b.found.push(id);
  finishBonus(b);
  return 'right';
}

export function bonusDone() { return !!(round && round.bonus && round.bonus.done); }

/* Never a dead end: a stuck child (or the grown-up running the table) can
   move on to the stars. The letter still banks — the bonus costs nothing. */
export function skipBonus() {
  const b = round && round.bonus;
  if (!b) return null;
  b.skipped = true;
  b.done = true;
  return b;
}

export function bonusSummary() {
  const b = round && round.bonus;
  if (!b) return null;
  return {
    type: b.type,
    label: b.label,
    letter: b.letter,
    need: b.need,
    found: b.found.length,
    misses: b.misses,
    skipped: b.skipped,
    done: b.done && !b.skipped,
  };
}

/* Advance after a locked-in match (or a finished bonus). Returns the next
   step name, or 'done'. A bonus that cannot be built is stepped over, so
   Grown-Ups → Play → Bonus Off is a two-step letter again. */
export function advance() {
  if (!round) return 'done';
  const at = STEPS.indexOf(round.step);
  if (at < 0 || at >= STEPS.length - 1) return 'done';
  let next = STEPS[at + 1];
  if (next === 'bonus' && !openBonus()) next = 'celebrate';
  round.step = next;
  if (next === 'case' || next === 'picture') buildTrial();
  return next;
}

/* Called from the celebrate screen once the stars are banked.
   ABC cursor advances here (once per letter) so Play again / Home / Next
   all continue from the next awake letter. A pin freezes the cursor. */
export function bankLetter() {
  if (!round) return 0;
  const entry = currentLetter();
  const stars = starsEarned();
  const firstBank = round.results[entry.letter] === undefined;
  round.results[entry.letter] = stars;
  /* Stars first, then the sticker, then what those stars just opened in
     Lucy's closet — celebrate reads all three off the round. */
  const starsBefore = store.totalStars();
  store.awardStars(entry.letter, stars);
  const picture = round.matchedPicture || pickPicture(entry.letter);
  round.sticker = { picture, isNew: store.awardSticker(picture) };
  round.unlockedTreat = newlyUnlocked(starsBefore, store.totalStars())[0] || null;
  if (store.progressMode() !== 'none') {
    store.recordRound(store.isClassroom() ? store.getKidId() : null, entry.letter, stars);
  }
  if (firstBank && round.cursorMoved !== entry.letter) {
    advanceCursorPast(entry.letter);
    round.cursorMoved = entry.letter;
  }
  return stars;
}

/* Move to the next letter in the round. Returns false when the round is over. */
export function nextLetter() {
  if (!round) return false;
  if (round.index >= round.letters.length - 1) return false;
  round.index += 1;
  round.step = 'case';
  round.misses = 0;
  round.hinted = false;
  round.matchedPicture = null;
  round.bonus = null;
  round.sticker = null;
  round.unlockedTreat = null;
  round.cursorMoved = null;
  buildTrial();
  return true;
}

/* Round-end Play again: next letters on the ABC cursor (or the pinned set). */
export function playAgain() {
  endRound();
  return startRound();
}

export function goHome() {
  endRound();
}

/* Replay the letter we just finished, from step A, misses cleared.
   The banked result is dropped so the replay can bank a fresh one.
   Cursor already moved on the first bank and stays put. */
export function replayLetter() {
  if (!round) return;
  delete round.results[round.letters[round.index]];
  round.step = 'case';
  round.misses = 0;
  round.hinted = false;
  round.matchedPicture = null;
  round.bonus = null;
  round.sticker = null;
  round.unlockedTreat = null;
  buildTrial();
}

export function roundProgress() {
  if (!round) return [];
  return round.letters.map((L, i) => ({
    letter: L,
    state: i < round.index ? 'done' : i === round.index ? 'active' : 'next',
    stars: round.results[L] || store.starsFor(L),
  }));
}

/* The round engine.

   Kid path (Cloud 1 first): one letter runs
     meet → choose → listen → payoff → celebrate.

   Celebrate is still the existing skippable party (≤8s). The old two-tap
   case/picture board and the rotating bonus are not on the kid PLAY path.
   Bonus helpers stay so Grown-Ups CSV / leftover screens do not crash. */

import { letterByChar, distractors, shuffle, pickPicture, picturesFor } from './data.js';
import { buildBonus, BONUS_MODES } from './bonus.js';
import { newlyUnlocked } from './closet.js';
import { markBeat, firstIncomplete, isPlayable } from './clouds.js';
import { nextLetter as nextWorkLetter, roundLetters } from './profile.js';
import { store } from './store.js';

export const STEPS = ['meet', 'choose', 'listen', 'payoff', 'celebrate'];
export const BEATS = ['meet', 'choose', 'listen', 'payoff'];

let round = null;
let serial = 0;

function freezeSettings() {
  const s = store.getSettings();
  return {
    roundSize: Math.max(1, Math.min(26, Number(s.roundSize) || 3)),
    choiceCount: Math.max(2, Math.min(8, Number(s.choiceCount) || 4)),
    caseMode: s.caseMode || 'both',
    hintAfter: Math.max(0, Math.min(5, Number(s.hintAfter) || 0)),
    showWords: s.showWords !== false,
    bonusMode: BONUS_MODES.includes(s.bonusMode) ? s.bonusMode : 'rotate',
  };
}

const MINIS = ['case', 'picture'];

export function startRound({ startAt = null, step = 'meet', mode = 'loop' } = {}) {
  const frozen = freezeSettings();
  const first = nextWorkLetter(undefined, startAt);
  const wantStep = STEPS.includes(step) || MINIS.includes(step) ? step : 'meet';
  serial += 1;
  round = {
    id: serial,
    letters: roundLetters(first, mode === 'once' ? 1 : frozen.roundSize),
    index: 0,
    step: wantStep,
    mode: mode === 'once' ? 'once' : 'loop',
    fullRun: wantStep === 'meet',
    misses: 0,
    hinted: false,
    results: {},
    trial: null,
    trialSeq: 0,
    bonus: null,
    sticker: null,
    unlockedTreat: null,
    matchedPicture: null,
    roundSize: frozen.roundSize,
    choiceCount: frozen.choiceCount,
    caseMode: frozen.caseMode,
    hintAfter: frozen.hintAfter,
    bonusMode: frozen.bonusMode,
  };
  buildTrial();
  return round;
}

export function previewLetters() {
  return roundLetters(nextWorkLetter(), freezeSettings().roundSize);
}

export function upNextLetter() {
  if (round && round.index < round.letters.length - 1) return round.letters[round.index + 1];
  return nextWorkLetter();
}

/* Which round and which trial a delayed callback was scheduled for. */
export function trialToken() {
  if (!round || !round.trial) return null;
  return `${round.id}:${round.index}:${round.step}:${round.trialSeq}`;
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

function huntFor(mode) {
  if (mode === 'upper' || mode === 'lower') return mode;
  return Math.random() < 0.5 ? 'lower' : 'upper';
}

function buildChooseTrial(entry) {
    const count = Math.max(2, Math.min(8, round.choiceCount || 4));
  const others = distractors(entry.letter, count - 1);
  const doubleUp = count >= 4 && others.length >= 2 && Math.random() < 0.45;
  const letters = doubleUp
    ? shuffle([entry.letter, entry.letter, ...others.slice(0, count - 2).map((o) => o.letter)])
    : shuffle([entry.letter, ...others.slice(0, count - 1).map((o) => o.letter)]);
  const choices = letters.map((L, i) => {
    const item = letterByChar(L) || { letter: L, lower: String(L).toLowerCase(), word: '' };
    return { ...item, id: `${L}-${i}`, target: L === entry.letter };
  });
  const targets = choices.filter((c) => c.target).map((c) => c.id);
  round.trial = {
    kind: 'choose',
    answer: entry.letter,
    targets,
    found: [],
    selected: null,
    locked: false,
    choices,
    hunt: huntFor(round.caseMode),
  };
  return round.trial;
}

function buildListenTrial(entry) {
  const orbs = [
    { id: 'orb-a', target: false },
    { id: 'orb-b', target: false },
    { id: 'orb-c', target: false },
  ];
  const hit = Math.floor(Math.random() * orbs.length);
  orbs[hit].target = true;
  round.trial = {
    kind: 'listen',
    answer: entry.letter,
    orbs,
    selected: null,
    locked: false,
    picture: pickPicture(entry.letter),
  };
  return round.trial;
}

function buildPayoffTrial(entry) {
  const pool = picturesFor(entry.letter);
  const first = pickPicture(entry.letter);
  const second = pool.find((p) => p.id !== first.id) || null;
  const plates = [first, second].filter(Boolean);
  round.matchedPicture = first;
  round.trial = {
    kind: 'payoff',
    answer: entry.letter,
    picture: first,
    plates,
    locked: false,
  };
  return round.trial;
}

function buildCaseTrial(entry) {
  const count = Math.max(2, Math.min(8, round.choiceCount || 4));
  const others = distractors(entry.letter, count - 1);
  const letters = shuffle([entry.letter, ...others.slice(0, count - 1).map((o) => o.letter)]);
  const hunt = huntFor(round.caseMode);
  const choices = letters.map((L) => {
    const item = letterByChar(L) || { letter: L, lower: String(L).toLowerCase(), word: '' };
    return { ...item, target: L === entry.letter };
  });
  round.trial = {
    kind: 'case',
    answer: entry.letter,
    selected: null,
    locked: false,
    choices,
    hunt,
  };
  return round.trial;
}

export function buildTrial() {
  if (!round) return null;
  const entry = currentLetter();
  if (!entry) return null;
  round.trialSeq += 1;
  if (round.step === 'choose') return buildChooseTrial(entry);
  if (round.step === 'listen') return buildListenTrial(entry);
  if (round.step === 'payoff') return buildPayoffTrial(entry);
  if (round.step === 'case') return buildCaseTrial(entry);
  round.trial = {
    kind: round.step,
    answer: entry.letter,
    picture: pickPicture(entry.letter),
    selected: null,
    locked: false,
    choices: [],
    hunt: huntFor(round.caseMode),
  };
  return round.trial;
}

export function select(letter) {
  if (!round || !round.trial || round.trial.locked) return;
  round.trial.selected = letter;
}

/* One card, one find. Pass the choice id the child tapped; a letter is
   accepted for callers that have no card, and takes the next unfound one.
   A card that was already found is ignored, so two taps on the same A
   cannot satisfy a "find both" board. */
export function tapChoose(choiceOrLetter) {
  if (!round || round.step !== 'choose' || !round.trial || round.trial.locked) return null;
  const t = round.trial;
  const raw = String(choiceOrLetter || '');
  let choice = t.choices.find((c) => c.id === raw);
  if (!choice) {
    const L = raw.toUpperCase();
    choice = t.choices.find((c) => c.letter === L && c.target && !t.found.includes(c.id))
      || t.choices.find((c) => c.letter === L);
  }
  if (!choice) return null;
  if (t.found.includes(choice.id)) return null;
  if (choice.target) {
    t.found.push(choice.id);
    t.selected = choice.id;
    if (t.found.length >= t.targets.length) {
      t.locked = true;
      return 'right';
    }
    return 'collect';
  }
  round.misses += 1;
  round.trial.selected = null;
  maybeHint();
  return 'wrong';
}

export function tapListen(id) {
  if (!round || round.step !== 'listen' || !round.trial || round.trial.locked) return null;
  const orb = round.trial.orbs.find((o) => o.id === id);
  if (!orb) return null;
  round.trial.selected = id;
  if (orb.target) {
    round.trial.locked = true;
    return 'right';
  }
  round.misses += 1;
  maybeHint();
  return 'wrong';
}

export function continueBeat() {
  if (!round || !round.trial || round.trial.locked) return null;
  if (round.step !== 'meet' && round.step !== 'payoff') return null;
  round.trial.locked = true;
  return 'right';
}

export function submit() {
  if (!round || !round.trial || round.trial.locked) return null;
  if (round.step === 'choose') return tapChoose(round.trial.selected);
  if (round.step === 'listen') return tapListen(round.trial.selected);
  if (round.step === 'meet' || round.step === 'payoff') return continueBeat();
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

export function openBonus() {
  if (!round) return null;
  const spec = buildBonus(round.letters[round.index], { mode: round.bonusMode });
  if (!spec) { round.bonus = null; return null; }
  round.bonus = {
    ...spec,
    found: [],
    at: 0,
    misses: 0,
    done: false,
    skipped: false,
  };
  return round.bonus;
}

export function getBonus() { return round ? round.bonus : null; }

export function bonusCurrent() {
  const b = round && round.bonus;
  if (!b || b.type !== 'sound') return null;
  return b.items[b.at] || null;
}

function finishBonus(b) {
  if (b.found.length >= b.need) b.done = true;
  return b.done;
}

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
  } else if (!item.target) {
    b.misses += 1;
    return 'wrong';
  }
  b.found.push(id);
  finishBonus(b);
  return 'right';
}

export function bonusDone() { return !!(round && round.bonus && round.bonus.done); }

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

function beatIndex(step) {
  const at = BEATS.indexOf(step);
  return at < 0 ? 0 : at + 1;
}

export function finishOnce() {
  if (!round) return;
  const letter = round.letters[round.index];
  const beat = beatIndex(round.step) || 1;
  markBeat(letter, beat);
  endRound();
}

export function advance() {
  if (!round) return 'done';
  if (round.mode === 'once') {
    finishOnce();
    return 'home';
  }
  const at = STEPS.indexOf(round.step);
  if (at < 0 || at >= STEPS.length - 1) return 'done';
  markBeat(round.letters[round.index], beatIndex(round.step));
  const next = STEPS[at + 1];
  round.step = next;
  if (next !== 'celebrate') buildTrial();
  return next;
}

export function bankLetter() {
  if (!round) return 0;
  const entry = currentLetter();
  const stars = starsEarned();
  const firstBank = round.results[entry.letter] === undefined;
  round.results[entry.letter] = stars;
  markBeat(entry.letter, 4);
  const starsBefore = store.totalStars();
  store.awardStars(entry.letter, stars);
  const picture = round.matchedPicture || pickPicture(entry.letter);
  round.sticker = { picture, isNew: store.awardSticker(picture) };
  round.unlockedTreat = newlyUnlocked(starsBefore, store.totalStars())[0] || null;
  if (store.progressMode() !== 'none') {
    store.recordRound(store.starsOwner(), entry.letter, stars);
  }
  /* Only a run that went meet → payoff counts toward mastery, and only one
     that needed no hint and stayed under three misses counts as independent. */
  if (firstBank && round.fullRun && store.beatsFor(entry.letter) >= 4) {
    store.recordCompletion(entry.letter, { independent: !round.hinted && round.misses < 3 });
  }
  return stars;
}

export function nextLetter() {
  if (!round) return false;
  if (round.index >= round.letters.length - 1) return false;
  round.index += 1;
  round.step = 'meet';
  round.misses = 0;
  round.hinted = false;
  round.matchedPicture = null;
  round.bonus = null;
  round.sticker = null;
  round.unlockedTreat = null;
  round.fullRun = true;
  buildTrial();
  return true;
}

export function playAgain() {
  endRound();
  return startRound();
}

export function goHome() {
  endRound();
}

export function replayLetter() {
  if (!round) return;
  delete round.results[round.letters[round.index]];
  round.step = 'meet';
  round.misses = 0;
  round.hinted = false;
  round.matchedPicture = null;
  round.bonus = null;
  round.sticker = null;
  round.unlockedTreat = null;
  round.fullRun = true;
  buildTrial();
}

export function roundProgress() {
  if (!round) return [];
  return round.letters.map((L, i) => ({
    letter: L,
    state: i < round.index ? 'done' : i === round.index ? 'active' : 'next',
    stars: round.results[L] || store.starsFor(L),
    beats: store.beatsFor(L),
  }));
}

export { isPlayable, firstIncomplete };

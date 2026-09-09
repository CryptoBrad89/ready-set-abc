/* The bonus activity — step 3 of a letter (PLAN §Round shape:
   meet → case match → picture match → bonus (rotating) → celebrate).

   Three games rotate so a 3-letter round is never the same board three times:

     hunt   Letter Hunt — tap every A and a hiding in the tiles
     sound  Sound Sort  — three pictures, one at a time: does it start with /æ/?
     order  ABC Order   — three letters, tap them in alphabet order

   Which one a letter gets is decided by the letter itself (A → hunt, B →
   sound, C → order, D → hunt), so a grown-up can predict the morning and the
   gate can test it. Grown-Ups → Play can pin one game or turn the bonus off.

   The bonus is a BONUS: a wrong tap wobbles and invites another go, and it
   never costs a star. Stars still come from the two matches (misses + hint).

   This file only builds the board. The tap rules live in round.js and the
   chrome in js/screens/bonus.js — same split as trials. */

import { letterByChar, letters, awakeLetters, picturesFor, pickPicture, shuffle } from './data.js';

export const BONUS_TYPES = ['hunt', 'sound', 'order'];
export const BONUS_MODES = ['off', 'rotate', ...BONUS_TYPES];

export const BONUS_LABEL = {
  hunt: 'Letter Hunt',
  sound: 'Sound Sort',
  order: 'ABC Order',
};

function index(ch) {
  const n = String(ch || 'A').toUpperCase().charCodeAt(0) - 65;
  return Number.isFinite(n) ? ((n % 26) + 26) % 26 : 0;
}

/* 'off' → no bonus. A pinned game always wins. 'rotate' walks the three
   games down the alphabet, so a round of A B C plays all three. */
export function bonusTypeFor(letter, mode = 'rotate') {
  if (mode === 'off') return null;
  if (BONUS_TYPES.includes(mode)) return mode;
  return BONUS_TYPES[index(letter) % BONUS_TYPES.length];
}

/* Letters that are not `letter`, awake ones first: a bonus board only shows
   sounds the class has actually met (same rule as data.js distractors). */
function otherLetters(letter, n) {
  const awake = awakeLetters().filter((l) => l.letter !== letter);
  const rest = letters().filter((l) => l.letter !== letter && !l.awake);
  return [...shuffle(awake), ...shuffle(rest)].slice(0, n);
}

function huntBoard(entry, { targets = 3, tiles = 8 } = {}) {
  const items = [];
  for (let i = 0; i < targets; i += 1) {
    /* Both cases in the same hunt — that is the point of the game. */
    const upper = i % 2 === 0;
    items.push({
      id: `t${i}`,
      glyph: upper ? entry.letter : entry.lower,
      letter: entry.letter,
      target: true,
    });
  }
  const fillers = otherLetters(entry.letter, Math.max(0, tiles - targets));
  fillers.forEach((other, i) => {
    items.push({
      id: `f${i}`,
      glyph: i % 2 === 0 ? other.letter : other.lower,
      letter: other.letter,
      target: false,
    });
  });
  return {
    type: 'hunt',
    need: targets,
    items: shuffle(items),
    title: `Find every ${entry.letter}${entry.lower}!`,
    ask: `Tap all ${targets} — big ${entry.letter} and little ${entry.lower}.`,
    lucy: `Can you find every ${entry.letter}${entry.lower}?`,
  };
}

function soundBoard(entry, { yes = 2, no = 1 } = {}) {
  const items = [];
  const mine = shuffle(picturesFor(entry.letter)).slice(0, yes);
  mine.forEach((picture, i) => items.push({ id: `y${i}`, picture, starts: true }));
  otherLetters(entry.letter, no).forEach((other, i) => {
    const picture = pickPicture(other.letter);
    if (picture) items.push({ id: `n${i}`, picture, starts: false });
  });
  return {
    type: 'sound',
    need: items.length,
    items: shuffle(items),
    title: `Does it start with ${entry.phoneme}?`,
    ask: `Tap Yes or No. ${entry.phoneme} as in ${entry.word}.`,
    lucy: `Listen! Does it start with ${entry.phoneme}?`,
  };
}

function orderBoard(entry, { size = 3 } = {}) {
  const pool = [entry, ...otherLetters(entry.letter, size - 1)];
  const sorted = pool.slice().sort((a, b) => index(a.letter) - index(b.letter));
  const items = shuffle(sorted.map((l, rank) => ({
    id: `o${l.letter}`,
    glyph: l.letter,
    lower: l.lower,
    letter: l.letter,
    rank,
  })));
  return {
    type: 'order',
    need: items.length,
    items,
    title: 'Tap them in ABC order!',
    ask: `${items.length} letters. Tap the one that comes first in the alphabet, then the next.`,
    lucy: 'Sing with me — which letter comes first?',
  };
}

/* One bonus board for one letter. Returns null when the bonus is off or the
   letter has no content, and the round steps straight to celebrate. */
export function buildBonus(letter, { mode = 'rotate', type = null } = {}) {
  const entry = typeof letter === 'string' ? letterByChar(letter) : letter;
  if (!entry) return null;
  const kind = type || bonusTypeFor(entry.letter, mode);
  if (!kind) return null;
  const board = kind === 'sound' ? soundBoard(entry)
    : kind === 'order' ? orderBoard(entry)
    : huntBoard(entry);
  if (!board || !board.items.length || !board.need) return null;
  return {
    ...board,
    letter: entry.letter,
    lower: entry.lower,
    phoneme: entry.phoneme,
    label: BONUS_LABEL[board.type] || 'Bonus',
  };
}

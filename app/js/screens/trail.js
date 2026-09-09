/* ABC Trail — this IS the map. All 26 letters, no scroll, all awake: every
   tile opens a real round (case match → picture match → bonus → celebrate).

   Two highlights, because they are two different facts:
     · pinned  — the grown-up's letter of the day (Grown-Ups → Play)
     · current — the letter the next PLAY really opens (previewLetters()[0]) */

import { el, icon, starRow, pressable } from '../ui.js';
import { letters, letterByChar } from '../data.js';
import { createLucy } from '../lucy.js';
import { store } from '../store.js';
import { audio } from '../audio.js';
import { startRound, previewLetters } from '../round.js';

export const chrome = { tabs: true, tab: 'trail', who: true };

export function render(ctx) {
  const root = el('div', { class: 'trail' });
  const all = letters();
  const pinned = store.getPinnedLetter();
  const current = previewLetters()[0];

  const lucy = createLucy({
    state: 'teaching',
    variant: 'circle',
    line: pinned
      ? `Letter ${pinned} is our letter today. Tap it to start!`
      : `Tap letter ${current} to start. Every letter is awake — pick any one!`,
  });

  const status = el('span', { class: 'chip chip--gold' }, icon('star'), `${store.totalStars()} stars earned`);

  root.append(el('div', { class: 'trail-head' },
    el('h1', {}, icon('trail'), 'ABC Trail'),
    el('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' } },
      status,
      pinned
        ? el('span', { class: 'chip chip--sky' }, icon('flag'), `Letter of the day: ${pinned}`)
        : el('span', { class: 'chip chip--sky' }, icon('next'), `Next up: ${current}`),
      el('span', { class: 'chip' }, icon('school'), `All ${all.length} letters awake`),
    ),
  ));

  /* Lucy is visible here, not just audible: the trail talks back on a muted
     cart too, and a bubble with no dog behind it is not Lucy. */
  root.append(el('div', { class: 'trail-say' }, lucy.stage, lucy.bubble));

  const board = el('div', { class: 'trail-board' });
  all.forEach((entry) => {
    const isCurrent = entry.letter === current;
    const isPinned = entry.letter === pinned;
    const flags = `${isCurrent ? ' current' : ''}${isPinned ? ' pinned' : ''}`;
    const tile = el('button', {
      class: `pillow trail-tile${flags}`,
      type: 'button',
      'aria-current': isCurrent ? 'true' : null,
      'aria-label': `Letter ${entry.letter}, ${entry.word}.${isPinned ? ' Letter of the day.' : ''}${isCurrent ? ' Starts next.' : ''} Play this letter.`,
    },
      isPinned ? el('span', { class: 't-pin' }, icon('flag')) : null,
      el('span', { class: 't-glyph' }, `${entry.letter}${entry.lower}`),
      el('span', { class: 't-pic', 'aria-hidden': 'true' }, entry.emoji),
      el('span', { class: 't-word' }, entry.word),
      store.progressMode() !== 'none' ? starRow(store.starsFor(entry.letter)) : null,
      isCurrent ? el('span', { class: 't-flag' }, pinned && isPinned ? 'Today' : 'Next up') : null,
    );
    pressable(tile, () => {
      audio.unlock();
      audio.sayLetterName(entry.letter);
      startRound({ startAt: entry.letter });
      const next = store.isClassroom() && !ctx.kid ? 'faces' : 'play';
      setTimeout(() => ctx.go(next), 260);
    });
    board.append(tile);
  });

  root.append(board);

  /* Arrived here from #/letter/<something that is not a letter> (a stale cart
     bookmark, a typo in _smoke.html?play=): say which letter is up instead of
     dropping the child onto a board with no explanation. */
  if (ctx.strayLetter && !letterByChar(ctx.strayLetter)) {
    setTimeout(() => {
      audio.sfx('pop');
      lucy.say(`I could not find letter ${ctx.strayLetter}. Let's play ${current}!`);
    }, 320);
  }

  return root;
}

export function footLeft() { return el('span', {}, icon('trail'), ' Tap any letter to start a round'); }

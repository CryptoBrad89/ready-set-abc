/* Letters & Phonics — SATPIN cloud path.
   Numbered islands, glow on the open cloud, locked neighbors, per-letter n/4. */

import { el, icon, pressable } from '../ui.js';
import { letterByChar } from '../data.js';
import { createLucy } from '../lucy.js';
import { store } from '../store.js';
import { audio } from '../audio.js';
import { startRound, playStartLetter } from '../round.js';
import {
  allClouds, openCloud, isCloudUnlocked, beatsFor, letterMastered, pinInOpenCloud,
} from '../clouds.js';

export const chrome = { tabs: true, tab: 'trail', who: true };

export function render(ctx) {
  const root = el('div', { class: 'clouds' });
  const open = openCloud();
  const current = playStartLetter();
  const pinnedLetter = store.getPinnedLetter();
  const pinned = pinInOpenCloud();
  const clouds = allClouds();

  const lucy = createLucy({
    state: 'teaching',
    variant: 'circle',
    cutout: true,
    line: pinned
      ? `Letter ${pinned} is our letter today. Tap it to start!`
      : `Tap letter ${current} to start. ${open ? open.name : 'Cloud 1'} is open!`,
  });

  root.append(el('div', { class: 'trail-head' },
    el('h1', {}, icon('trail'), ' Letters & Phonics'),
    el('div', { class: 'hub-chips' },
      el('span', { class: 'chip chip--gold' }, icon('star'), `${store.totalStars()} stars`),
      pinned
        ? el('span', { class: 'chip chip--sky' }, icon('flag'), `Letter of the day: ${pinned}`)
        : el('span', { class: 'chip chip--sky' }, icon('next'), `Next up: ${current}`),
    ),
  ));
  root.append(el('div', { class: 'trail-say' }, lucy.stage, lucy.bubble));

  const path = el('div', { class: 'cloud-path' });
  clouds.forEach((cloud, i) => {
    const unlocked = isCloudUnlocked(cloud.id);
    const isOpen = open && cloud.id === open.id;
    const island = el('div', {
      class: `cloud-island${unlocked ? '' : ' is-locked'}${isOpen ? ' is-open' : ''}`,
    },
      el('span', { class: 'cloud-num' }, String(cloud.id)),
      el('span', { class: 'cloud-name' }, cloud.name),
    );
    if (i < clouds.length - 1) {
      path.append(island, el('span', { class: 'cloud-dots', 'aria-hidden': 'true' }));
    } else {
      path.append(island);
    }
  });
  root.append(path);

  const letters = (open && open.letters) || [];
  const board = el('div', { class: 'trail-board cloud-letters' });
  letters.forEach((L) => {
    const entry = letterByChar(L) || { letter: L, lower: String(L).toLowerCase(), word: '', emoji: '' };
    const isCurrent = L === current;
    const isPinned = L === pinned;
    const n = beatsFor(L);
    const flags = `${isCurrent ? ' current' : ''}${isPinned ? ' pinned' : ''}${letterMastered(L) ? ' mastered' : ''}`;
    const tile = el('button', {
      class: `pillow trail-tile${flags}`,
      type: 'button',
      'aria-current': isCurrent ? 'true' : null,
      'aria-label': `Letter ${entry.letter}, ${entry.word}.${isPinned ? ' Letter of the day.' : ''}${isCurrent ? ' Starts next.' : ''} Play this letter. ${n} of 4.`,
    },
      isPinned ? el('span', { class: 't-pin' }, icon('flag')) : null,
      el('span', { class: 't-glyph' }, `${entry.letter}${entry.lower}`),
      el('span', { class: 't-pic', 'aria-hidden': 'true' }, entry.emoji),
      el('span', { class: 't-word' }, entry.word),
      el('span', { class: 't-beats' }, `${n}/4`),
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

  if (ctx.strayLetter && !letterByChar(ctx.strayLetter)) {
    setTimeout(() => {
      audio.sfx('pop');
      lucy.say(`I could not find letter ${ctx.strayLetter}. Let's play ${current}!`);
    }, 320);
  }

  return root;
}

export function footLeft() {
  return el('span', {}, icon('trail'), ' Tap a letter in the open cloud');
}

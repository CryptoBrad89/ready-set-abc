/* Arcade tab — later slot. This slice starts the choose (tap letters) beat.
   Memory / canvas games come later. */

import { el, icon, pressable } from '../ui.js';
import { letterByChar } from '../data.js';
import { createLucy } from '../lucy.js';
import { audio } from '../audio.js';
import { store } from '../store.js';
import { playStartLetter } from '../clouds.js';
import { startRound } from '../round.js';

export const chrome = { tabs: true, tab: 'arcade', who: true };

export function render(ctx) {
  const L = playStartLetter();
  const entry = letterByChar(L);
  const lucy = createLucy({
    state: 'idle',
    cutout: true,
    line: entry ? `Tap the ${entry.letter}s with me!` : "Let's play!",
  });
  const play = el('button', {
    class: 'pillow play-btn breathe',
    type: 'button',
    id: 'play-btn',
    'aria-label': `Start match for ${L}`,
  },
    el('span', { class: 'play-disc' }, icon('play')),
    el('span', { class: 'play-words' },
      el('span', { class: 'play-big' }, 'Start Match'),
      el('span', { class: 'play-small' }, `Find letter ${L}`),
    ),
  );
  pressable(play, () => {
    audio.unlock();
    startRound({ startAt: L, step: 'choose' });
    ctx.go(store.isClassroom() && !ctx.kid ? 'faces' : 'play');
  });
  return el('div', { class: 'later-slot' },
    el('div', { class: 'trail-head' },
      el('h1', {}, icon('arcade'), ' Arcade'),
      el('span', { class: 'chip' }, 'Letter tap now · more games later'),
    ),
    el('div', { class: 'trail-say' }, lucy.stage, lucy.bubble),
    play,
  );
}

export function footLeft() {
  return el('span', {}, icon('arcade'), ' Tap letters with Lucy');
}

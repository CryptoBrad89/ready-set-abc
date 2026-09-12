/* Arcade tab — later slot. This slice starts the choose (tap letters) beat.
   Memory / canvas games come later. */

import { el, icon, pressable } from '../ui.js';
import { letterByChar } from '../data.js';
import { createLucy } from '../lucy.js';
import { audio } from '../audio.js';
import { playStartLetter } from '../clouds.js';
import { startRound } from '../round.js';
import { isArcadeLocked } from '../profile.js';
import { wobble } from '../motion.js';

export const chrome = { tabs: true, tab: 'arcade', who: true };

export function render(ctx) {
  const locked = isArcadeLocked(ctx.kid);
  const L = playStartLetter();
  const entry = letterByChar(L);
  const lucy = createLucy({
    state: 'idle',
    cutout: true,
    line: locked ? 'Arcade is locked. Ask a grown-up.' : (entry ? `Tap the ${entry.letter}s with me!` : "Let's play!"),
  });
  const play = el('button', {
    class: locked ? 'pillow play-btn is-locked' : 'pillow play-btn breathe',
    type: 'button',
    id: 'play-btn',
    'aria-label': locked ? 'Arcade, locked' : `Start match for ${L}`,
  },
    el('span', { class: 'play-disc' }, locked ? icon('lock') : icon('play')),
    el('span', { class: 'play-words' },
      el('span', { class: 'play-big' }, locked ? 'Locked' : 'Start Match'),
      el('span', { class: 'play-small' }, locked ? 'Ask a grown-up' : `Find letter ${L}`),
    ),
  );
  pressable(play, () => {
    if (locked) {
      audio.unlock();
      audio.sfx('wrong');
      wobble(play);
      return;
    }
    audio.unlock();
    startRound({ startAt: L, step: 'choose' });
    ctx.go('play');
  });
  return el('div', { class: 'later-slot' },
    el('div', { class: 'trail-head' },
      el('h1', {}, icon('arcade'), ' Arcade'),
      el('span', { class: 'chip' }, locked ? 'Locked' : 'Letter tap now · more games later'),
    ),
    el('div', { class: 'trail-say' }, lucy.stage, lucy.bubble),
    play,
  );
}

export function footLeft() {
  return el('span', {}, icon('arcade'), ' Tap letters with Lucy');
}

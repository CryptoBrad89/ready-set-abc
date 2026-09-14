/* Storybooks tab — later slot. This slice shows the open letter’s word plates
   (payoff) so the tab is never an empty catalog. Real read-along comes later. */

import { el, icon, pressable, picturePlate } from '../ui.js';
import { letterByChar, picturesFor } from '../data.js';
import { createLucy } from '../lucy.js';
import { audio } from '../audio.js';
import { startLetter } from '../profile.js';

export const chrome = { tabs: true, tab: 'stories', who: true };

export function render(ctx) {
  const L = startLetter();
  const entry = letterByChar(L);
  const plates = picturesFor(L).slice(0, 4);
  const lucy = createLucy({
    state: 'idle',
    cutout: true,
    line: entry ? `${entry.letter} is for ${entry.word}!` : 'Let’s play a letter!',
  });
  const root = el('div', { class: 'later-slot' });
  root.append(
    el('div', { class: 'trail-head' },
      el('h1', {}, icon('book'), ' Storybooks'),
      el('span', { class: 'chip' }, 'Pictures today · read-along later'),
    ),
    el('div', { class: 'trail-say' }, lucy.stage, lucy.bubble),
  );
  const grid = el('div', { class: 'later-grid' });
  plates.forEach((pic) => {
    const card = el('button', {
      class: 'pillow stage-plate',
      type: 'button',
      'aria-label': `${L} is for ${pic.word}`,
    }, picturePlate(pic, { size: 'card' }), el('span', { class: 'stage-word' }, pic.word));
    pressable(card, () => {
      audio.unlock();
      audio.sayWord(pic);
      lucy.say(`${pic.word}!`, { voice: false });
    });
    grid.append(card);
  });
  root.append(grid);
  return root;
}

export function footLeft() {
  return el('span', {}, icon('book'), ' Word pictures for this letter');
}

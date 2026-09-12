/* Later-slot destinations that must not restart the four-beat lesson. */

import { el, icon } from '../ui.js';
import { createLucy } from '../lucy.js';

export const chrome = { tabs: true, tab: 'home', who: true };

const COPY = {
  rhymes: {
    title: 'Rhymes & Songs',
    line: 'A short Lucy song lives here next. Not a letter lesson.',
    tab: 'stories',
  },
  color: {
    title: 'Coloring Canvas',
    line: 'Tap-to-fill pictures live here next. Closet stays in Lucy’s Closet.',
    tab: 'home',
  },
};

export function render(ctx) {
  const key = String((ctx.params && ctx.params[0]) || '').toLowerCase();
  const copy = COPY[key] || COPY.rhymes;
  chrome.tab = copy.tab;
  const lucy = createLucy({
    state: 'idle',
    cutout: true,
    line: copy.line,
  });
  return el('div', { class: 'later-slot' },
    el('div', { class: 'trail-head' },
      el('h1', {}, icon('sparkle'), ' ', copy.title),
      el('span', { class: 'chip' }, 'Coming next week'),
    ),
    el('div', { class: 'trail-say' }, lucy.stage, lucy.bubble),
    el('p', { class: 'later-copy' }, copy.line),
  );
}

export function footLeft() {
  return el('span', {}, icon('sparkle'), ' A new game is on the way');
}

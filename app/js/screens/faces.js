/* Face pick — classroom mode only, and only before play.
   Grown-Ups → Class → Classroom mode turns this on; with it off a kid never
   sees a roster at all and PLAY goes straight into the round. */

import { el, icon, pressable } from '../ui.js';
import { kids, className } from '../data.js';
import { store } from '../store.js';
import { audio } from '../audio.js';
import { startRound, isActive, endRound } from '../round.js';

export const chrome = { tabs: false, tab: 'home', who: false };

export function render(ctx) {
  const root = el('div', { class: 'faces' });

  const grid = el('div', { class: 'faces-grid' });
  kids().forEach((kid) => {
    const card = el('button', {
      class: 'pillow face-card',
      type: 'button',
      'aria-label': `${kid.name}`,
    },
      el('span', { class: 'face-disc', style: { background: kid.color } }, kid.emoji),
      el('span', { class: 'face-name' }, kid.name),
      store.playedToday(kid.id) ? el('span', { class: 'face-today' }, '★ played today') : null,
    );
    pressable(card, () => {
      audio.unlock();
      audio.sfx('select');
      store.setKidId(kid.id);
      audio.speak(`Hi ${kid.name}!`);
      if (!isActive()) startRound();   // a letter tapped before the face pick keeps its round
      setTimeout(() => ctx.go('play'), 220);
    });
    grid.append(card);
  });

  root.append(
    el('div', { class: 'faces-head' },
      el('h1', {}, 'Who is playing?'),
      el('p', {}, `Tap your face — ${className()}`),
    ),
    grid,
    el('div', { style: { textAlign: 'center' } },
      el('button', { class: 'chip', type: 'button', onclick: () => { endRound(); ctx.go('home'); } }, icon('home'), 'Back'),
    ),
  );
  return root;
}

export function footLeft() {
  return el('span', {}, icon('lock'), ' Roster lives on this device only');
}

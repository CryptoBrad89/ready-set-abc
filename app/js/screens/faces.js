/* Roster login. Always first. A child tap goes to that child's Home.
   The adult tile opens the same PIN as Grown-Ups, then the adult Home. */

import { el, icon, pressable } from '../ui.js';
import { kids, className } from '../data.js';
import { store } from '../store.js';
import { audio } from '../audio.js';
import { endRound } from '../round.js';
import { enterAdult, enterChild, hasSession } from '../profile.js';
import { createLucy } from '../lucy.js';
import { openGrownUps } from './grownups.js';

export const chrome = { tabs: false, tab: 'home', who: false };

export function render(ctx) {
  const root = el('div', { class: 'faces' });

  const grid = el('div', { class: 'faces-grid' });
  const adult = el('button', {
    class: 'pillow face-card face-card--adult',
    type: 'button',
    'aria-label': 'Grown-Ups',
  },
    el('span', { class: 'face-disc', style: { background: '#334155' } }, icon('lock')),
    el('span', { class: 'face-name' }, 'Grown-Ups'),
  );
  pressable(adult, () => {
    audio.unlock();
    audio.sfx('tap');
    openGrownUps({
      onChange: () => {},
      afterUnlock: 'home',
      onUnlocked: () => {
        enterAdultHome(ctx);
      },
    });
  });
  grid.append(adult);

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
      endRound();
      enterChild(kid.id);
      audio.speak(`Hi ${kid.name}!`);
      setTimeout(() => ctx.go('home'), 220);
    });
    grid.append(card);
  });

  const lucy = createLucy({
    state: 'idle',
    cutout: true,
    line: 'Tap your face. I will wait right here!',
    paw: () => audio.speak('Tap your face. I will wait right here!'),
  });

  root.append(
    el('div', { class: 'faces-head' },
      el('h1', {}, 'Who is playing?'),
      el('p', {}, `Tap your face — ${className()}`),
      el('div', { class: 'faces-lucy' }, lucy.stage, lucy.bubble),
    ),
    grid,
  );
  if (hasSession()) {
    root.append(el('div', { style: { textAlign: 'center' } },
      el('button', { class: 'chip', type: 'button', onclick: () => ctx.go('home') }, icon('home'), 'Back'),
    ));
  }
  return root;
}

function enterAdultHome(ctx) {
  enterAdult();
  ctx.go('home');
}

export function footLeft() {
  return el('span', {}, icon('lock'), ' Roster lives on this device only');
}

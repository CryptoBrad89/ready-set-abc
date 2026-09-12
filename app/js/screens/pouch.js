/* Star Pouch — earned picture stickers plus Lucy's closet.

   The closet is the dress-up loop: a treat unlocks at a star count and stays
   unlocked, and tapping an unlocked treat adds it to Lucy for real (she wears
   the set on every screen). Tap it again to take that one off. Other treats
   stay on.

   Two rules this screen exists to keep:
   1. It never scolds and never shows a wall of padlocked nothing. Every word
      it says comes from js/closet.js, the nearest treat counts down, and the
      empty pouch tells a child what to go and do.
   2. Putting a treat on repaints the shelf in place. A re-render would drop
      the child back at the top of the page on the very tap that was supposed
      to feel good. */

import { el, icon, starRow, pressable, picturePlate } from '../ui.js';
import { letterByChar } from '../data.js';
import { store } from '../store.js';
import { audio } from '../audio.js';
import { createLucy } from '../lucy.js';
import {
  TREATS, toggleWear, wornTreats, treatStatus, treatProgress, closetLine,
} from '../closet.js';

export const chrome = { tabs: true, tab: 'pouch', who: true };

export function render(ctx) {
  /* Stars off (Grown-Ups → Play → Stars) means nothing is kept anywhere:
     no stars, no stickers, no closet. The pouch says so plainly instead of
     promising a child that playing will fill it. */
  const starsOff = store.progressMode() === 'none';
  const total = store.totalStars();
  const stickers = store.stickers();
  const root = el('div', { class: 'pouch' });

  const worn = starsOff ? [] : wornTreats(total);
  const wornNames = worn.map((t) => t.name).join(', ');
  /* Never the celebrating pose here: that pose draws bows on Lucy's ears, and
     a child cannot read "tap to wear Party bows" off a Lucy who already has
     bows on. The pouch is a dressing room — what she wears is the closet's. */
  const lucy = createLucy({
    state: 'idle',
    cutout: true,
    line: starsOff
      ? "Let's go play some letters!"
      : worn.length
        ? `${wornNames} on! How do I look?`
        : stickers.length
          ? `You have ${stickers.length} ${stickers.length === 1 ? 'sticker' : 'stickers'}!`
          : 'Play a letter to fill the pouch!',
  });

  root.append(el('div', { class: 'pouch-hero' },
    el('span', { class: 'pouch-bag' }, icon('pouch')),
    el('div', {},
      starsOff ? null : el('div', { class: 'pouch-count' }, String(total)),
      el('div', { class: 'pouch-sub' }, starsOff
        ? 'Stars are off today'
        : total === 1 ? 'star in the pouch' : 'stars in the pouch'),
    ),
    el('div', { class: 'pouch-lucy' }, lucy.bubble, el('div', { class: 'pouch-lucy-stage' }, lucy.stage)),
  ));

  if (starsOff) {
    root.append(el('div', { class: 'quiet-note' },
      el('p', {}, 'The pouch is resting today — Lucy still loves playing letters with you!'),
      el('p', { class: 'note-grown' }, 'Grown-Ups → Play → Stars turns the pouch back on.'),
    ));
    return root;
  }

  /* --- stickers --------------------------------------------------------- */
  root.append(el('h2', { class: 'pouch-heading' }, icon('sparkle'), ' Stickers you earned'));

  if (!stickers.length) {
    /* Two different empty shelves: a brand-new pouch, and one that has stars
       in it but no picture yet. Neither one is a dead end. */
    root.append(el('div', { class: 'quiet-note' }, total
      ? 'Your stars are here! Match a picture with Lucy to earn a sticker too.'
      : 'Nothing here yet — tap Home and play a letter with Lucy.'));
  } else {
    const grid = el('div', { class: 'pouch-grid' });
    stickers.forEach((pic) => {
      const entry = letterByChar(pic.letter) || { letter: pic.letter, lower: (pic.letter || '').toLowerCase(), say: '', phoneme: '' };
      const card = el('button', {
        class: 'pillow treat treat--sticker',
        type: 'button',
        'aria-label': `${pic.word}, letter ${pic.letter}`,
      },
        picturePlate(pic, { size: 'card' }),
        el('span', { class: 'treat-name' }, `${entry.letter}${entry.lower} · ${pic.word}`),
        store.starsFor(pic.letter) ? starRow(store.starsFor(pic.letter)) : null,
      );
      pressable(card, () => {
        audio.sayPhoneme(entry);
        setTimeout(() => audio.sayWord(pic), 500);
        lucy.say(`${entry.say}, ${pic.word}!`, { voice: false });
      });
      grid.append(card);
    });
    root.append(grid);
  }

  /* --- Lucy's closet ---------------------------------------------------- */
  const closetChip = el('span', { class: 'chip' }, closetLine(total, worn));
  root.append(el('div', { class: 'closet-head' },
    el('h2', { class: 'pouch-heading' }, icon('pouch'), " Lucy's closet"),
    closetChip,
  ));

  const treats = el('div', { class: 'pouch-grid' });
  const painters = [];

  TREATS.forEach((treat) => {
    const first = treatStatus(treat, total, worn.map((t) => t.id).join('+'));
    /* An unreachable treat is a plain card, not a button: nothing to press,
       so nothing that can feel like a refused tap. */
    const card = el(first.open ? 'button' : 'div', {
      class: 'pillow treat',
      type: first.open ? 'button' : null,
    },
      el('span', { class: 'treat-pic' }, treat.pic),
      el('span', { class: 'treat-name' }, treat.name),
    );
    const need = el('span', { class: 'treat-need' });
    card.append(need);

    /* Only the nearest treat carries a meter — six bars would be a chart, one
       bar is "you are nearly there". It fills from the treat before it. */
    if (first.state === 'next') {
      card.append(el('span', { class: 'treat-meter', 'aria-hidden': 'true' },
        el('i', { style: { width: `${Math.round(treatProgress(treat, total) * 100)}%` } })));
    }

    const paint = (wornId) => {
      const status = treatStatus(treat, total, wornId);
      card.className = `pillow treat treat--${status.state}${status.open ? '' : ' locked'}`;
      need.textContent = status.label;
      if (status.open) card.setAttribute('aria-pressed', String(status.state === 'worn'));
      card.setAttribute('aria-label', status.aria);
    };
    paint(worn.map((t) => t.id).join('+'));
    painters.push(paint);

    if (first.open) {
      pressable(card, () => {
        const now = toggleWear(treat.id, total);
        audio.sfx('pop');
        lucy.setOutfit();
        lucy.say(now === treat.id ? treat.line : 'Off it comes! Pick another one.');
        const ids = wornTreats(total).map((t) => t.id).join('+');
        painters.forEach((fn) => fn(ids));
        closetChip.textContent = closetLine(total, wornTreats(total));
        if (ctx.foot) ctx.foot();
      });
    }
    treats.append(card);
  });
  root.append(treats);
  return root;
}

export function footLeft() {
  const mode = store.progressMode();
  const worn = wornTreats();
  const names = worn.map((t) => t.name.toLowerCase()).join(', ');
  const line = mode === 'none' ? 'Stars are off'
    : mode === 'stars' ? 'Stars stay for this session'
    : 'Stars are saved on this device';
  return el('span', {}, icon('star'), ` ${line}${names ? ` · Lucy wears ${names}` : ''}`);
}

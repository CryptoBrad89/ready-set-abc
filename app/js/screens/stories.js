/* Lucy's Picnic Day — a picture story for this letter, not the four-beat round. */

import { el, icon, pressable, picturePlate } from '../ui.js';
import { picturesFor } from '../data.js';
import { createLucy } from '../lucy.js';
import { audio } from '../audio.js';
import { startLetter } from '../profile.js';

export const chrome = { tabs: true, tab: 'stories', who: true };

const BEATS = [
  (word) => `${word} is at the picnic.`,
  (word) => `Lucy sees a ${word}.`,
  (word) => `They share a ${word}.`,
  (word) => `A ${word} sits on the blanket.`,
];

export function picnicStory(letter) {
  const L = String(letter || '').toUpperCase();
  const pics = picturesFor(L).slice(0, 4);
  const pages = [{
    kind: 'cover',
    title: "Lucy's Picnic Day",
    line: pics[0] ? `Lucy packs a picnic for ${L}.` : 'Lucy packs a picnic.',
    lucy: pics[0] ? `${L} is for ${pics[0].word}!` : "Let's read!",
    plates: [],
  }];
  pics.forEach((pic, i) => {
    const word = pic.word;
    const line = (BEATS[i] || BEATS[0])(word);
    pages.push({
      kind: 'spread',
      title: "Lucy's Picnic Day",
      line,
      lucy: `${word}!`,
      plates: [pic],
    });
  });
  pages.push({
    kind: 'end',
    title: 'The End',
    line: pics[0] ? `${L} is in this picnic!` : 'The End',
    lucy: pics[0] ? `${L} is for ${pics[0].word}!` : 'Woof!',
    plates: pics[0] ? [pics[0]] : [],
  });
  return { letter: L, pages };
}

export function pageIndex(params, pageCount) {
  const raw = Number.parseInt(String((params && params[0]) || '1'), 10);
  if (!Number.isFinite(raw) || raw < 1) return 0;
  return Math.min(pageCount, raw) - 1;
}

function hashFor(i) {
  return i <= 0 ? 'stories' : `stories/${i + 1}`;
}

export function render(ctx) {
  const L = startLetter('P');
  const story = picnicStory(L);
  const pages = story.pages;
  const i = pageIndex(ctx.params, pages.length);
  const page = pages[i];
  const lucy = createLucy({
    state: page.kind === 'end' ? 'celebrating' : 'idle',
    cutout: true,
    line: page.lucy,
  });

  const spread = el('div', { class: 'picnic-spread' },
    el('p', { class: 'picnic-line' }, page.line),
  );
  page.plates.forEach((pic) => {
    const card = el('button', {
      class: 'pillow picnic-plate',
      type: 'button',
      'aria-label': pic.word,
    }, picturePlate(pic, { size: 'pic' }), el('span', { class: 'stage-word' }, pic.word));
    pressable(card, () => {
      audio.unlock();
      audio.sayWord(pic);
      lucy.say(`${pic.word}!`, { voice: false });
    });
    spread.append(card);
  });

  const nav = el('div', { class: 'picnic-nav' });
  if (i > 0) {
    const back = el('button', {
      class: 'pillow picnic-turn',
      type: 'button',
      'aria-label': 'Previous page',
    }, icon('chevron'), ' Back');
    pressable(back, () => {
      audio.unlock();
      ctx.go(hashFor(i - 1));
    });
    nav.append(back);
  }
  nav.append(el('span', { class: 'chip' }, `${i + 1} / ${pages.length}`));
  if (i < pages.length - 1) {
    const next = el('button', {
      class: 'pillow picnic-turn picnic-turn--next',
      type: 'button',
      'aria-label': 'Next page',
    }, 'Next ', icon('next'));
    pressable(next, () => {
      audio.unlock();
      ctx.go(hashFor(i + 1));
    });
    nav.append(next);
  }

  return el('div', { class: 'picnic' },
    el('div', { class: 'trail-head' },
      el('h1', {}, icon('book'), ' ', page.title),
    ),
    el('div', { class: 'trail-say' }, lucy.stage, lucy.bubble),
    spread,
    nav,
  );
}

export function footLeft() {
  return el('span', {}, icon('book'), " Lucy's Picnic Day");
}

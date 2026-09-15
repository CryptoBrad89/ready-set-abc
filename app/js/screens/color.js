/* Fun-row Coloring Canvas. Pick a Lucy or letter page, tap a crayon,
   tap a spot. Not the four-beat lesson and not a paint studio. */

import { el, icon, pressable } from '../ui.js';
import { createLucy } from '../lucy.js';
import { audio } from '../audio.js';
import { startLetter } from '../profile.js';

export const chrome = { tabs: true, tab: 'home', who: true };

export const PAPER = '#FFFDF5';
export const INK = '#251911';

export const CRAYONS = [
  { id: 'yellow', hex: '#FFB800', label: 'Yellow' },
  { id: 'sky', hex: '#29B6F6', label: 'Sky' },
  { id: 'mint', hex: '#26C281', label: 'Mint' },
  { id: 'coral', hex: '#FF5252', label: 'Coral' },
  { id: 'gold', hex: '#E69138', label: 'Gold' },
  { id: 'cream', hex: '#FFE3BF', label: 'Cream' },
];

const fills = new Map();
let crayonId = 'yellow';

export function colorPages(letter) {
  const L = String(letter || 'P').toUpperCase();
  return [
    { id: 'lucy', title: 'Lucy', hash: 'color/lucy', label: 'Color Lucy' },
    { id: `letter-${L}`, title: `Letter ${L}`, hash: 'color/letter', label: `Color letter ${L}`, letter: L },
  ];
}

export function colorView(params, letter) {
  const raw = String((params && params[0]) || '').toLowerCase();
  const pages = colorPages(letter);
  if (raw === 'lucy') return { kind: 'paint', page: pages[0] };
  if (raw === 'letter') return { kind: 'paint', page: pages[1] };
  return { kind: 'pick', page: null };
}

export function getFills(pageId) {
  return { ...(fills.get(pageId) || {}) };
}

export function setFill(pageId, regionId, hex) {
  const next = { ...(fills.get(pageId) || {}) };
  next[regionId] = hex;
  fills.set(pageId, next);
  return next;
}

export function resetFills() {
  fills.clear();
  crayonId = 'yellow';
}

export function selectedCrayon() {
  return CRAYONS.find((c) => c.id === crayonId) || CRAYONS[0];
}

function svgEl(tag, attrs = {}, ...kids) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value == null || value === false) return;
    if (key === 'class') {
      node.setAttribute('class', value);
      if (typeof node.className === 'string') node.className = value;
    } else node.setAttribute(key, String(value));
  });
  kids.flat().forEach((kid) => {
    if (kid) node.append(kid);
  });
  return node;
}

function spot(tag, attrs, label, pageId, regionId) {
  const painted = getFills(pageId)[regionId] || PAPER;
  const node = svgEl(tag, {
    ...attrs,
    class: 'color-spot',
    fill: painted,
    stroke: INK,
    'stroke-width': attrs['stroke-width'] || '3',
    'data-region': regionId,
    role: 'button',
    tabindex: '0',
    'aria-label': label,
  });
  pressable(node, () => {
    const crayon = selectedCrayon();
    audio.unlock();
    audio.sfx('pop');
    setFill(pageId, regionId, crayon.hex);
    node.setAttribute('fill', crayon.hex);
  });
  return node;
}

function lucyArt(pageId) {
  return svgEl('svg', {
    class: 'color-art',
    viewBox: '0 0 240 180',
    role: 'img',
    'aria-label': 'Lucy coloring page',
  },
    spot('rect', { x: 0, y: 0, width: 240, height: 112, 'stroke-width': '0' }, 'Sky', pageId, 'sky'),
    spot('rect', { x: 0, y: 112, width: 240, height: 68, 'stroke-width': '0' }, 'Grass', pageId, 'grass'),
    spot('ellipse', { cx: 120, cy: 142, rx: 54, ry: 28 }, "Lucy's body", pageId, 'body'),
    spot('rect', { x: 88, y: 114, width: 64, height: 16, rx: 8 }, "Lucy's collar", pageId, 'collar'),
    spot('ellipse', { cx: 72, cy: 88, rx: 16, ry: 30 }, "Lucy's ear", pageId, 'ear'),
    spot('ellipse', { cx: 168, cy: 88, rx: 16, ry: 30 }, "Lucy's other ear", pageId, 'ear2'),
    spot('circle', { cx: 120, cy: 86, r: 42 }, "Lucy's head", pageId, 'head'),
    svgEl('ellipse', { cx: 120, cy: 102, rx: 22, ry: 16, fill: '#FFE3BF', stroke: INK, 'stroke-width': '2', class: 'color-ink' }),
    svgEl('circle', { cx: 104, cy: 80, r: 5, fill: INK, class: 'color-ink' }),
    svgEl('circle', { cx: 136, cy: 80, r: 5, fill: INK, class: 'color-ink' }),
    svgEl('ellipse', { cx: 120, cy: 94, rx: 7, ry: 5, fill: INK, class: 'color-ink' }),
    svgEl('path', { d: 'M120 100c0 8-8 10-12 6M120 100c0 8 8 10 12 6', fill: 'none', stroke: INK, 'stroke-width': '3', 'stroke-linecap': 'round', class: 'color-ink' }),
  );
}

function letterArt(pageId, letter) {
  return svgEl('svg', {
    class: 'color-art',
    viewBox: '0 0 240 180',
    role: 'img',
    'aria-label': `Letter ${letter} coloring page`,
  },
    spot('rect', { x: 0, y: 0, width: 240, height: 112, 'stroke-width': '0' }, 'Sky', pageId, 'sky'),
    spot('rect', { x: 0, y: 112, width: 240, height: 68, 'stroke-width': '0' }, 'Grass', pageId, 'grass'),
    spot('rect', { x: 62, y: 28, width: 116, height: 116, rx: 28 }, `Letter ${letter}`, pageId, 'badge'),
    spot('polygon', { points: '42,46 50,70 76,70 54,86 62,110 42,94 22,110 30,86 8,70 34,70' }, 'Star', pageId, 'star'),
    spot('ellipse', { cx: 196, cy: 52, rx: 22, ry: 28 }, 'Balloon', pageId, 'balloon'),
    svgEl('path', { d: 'M196 80c0 16 10 22 4 28', fill: 'none', stroke: INK, 'stroke-width': '3', 'stroke-linecap': 'round', class: 'color-ink' }),
  );
}

function pickBoard(ctx, pages) {
  const row = el('div', { class: 'color-picks' });
  pages.forEach((page) => {
    const card = el('button', {
      class: 'pillow color-pick',
      type: 'button',
      'aria-label': page.label,
    },
      el('span', { class: 'color-pick-art', 'aria-hidden': 'true' }, page.letter || '🐾'),
      el('span', { class: 'color-pick-title' }, page.title),
    );
    pressable(card, () => {
      audio.unlock();
      audio.sfx('select');
      ctx.go(page.hash);
    });
    row.append(card);
  });
  return row;
}

function crayonBar() {
  const row = el('div', { class: 'color-crayons', role: 'group', 'aria-label': 'Crayons' });
  CRAYONS.forEach((crayon) => {
    const btn = el('button', {
      class: 'pillow color-crayon',
      type: 'button',
      'aria-label': `${crayon.label} crayon`,
      'aria-pressed': String(crayon.id === crayonId),
      style: { '--face': crayon.hex },
    });
    pressable(btn, () => {
      crayonId = crayon.id;
      audio.unlock();
      audio.sfx('tap');
      row.querySelectorAll('.color-crayon').forEach((node) => {
        const name = node.getAttribute('aria-label') || '';
        node.setAttribute('aria-pressed', String(name === `${crayon.label} crayon`));
      });
    });
    row.append(btn);
  });
  return row;
}

export function render(ctx) {
  const L = startLetter('P');
  const pages = colorPages(L);
  const view = colorView(ctx.params, L);
  const lucyLine = view.kind === 'pick'
    ? 'Pick a page to color!'
    : 'Tap a crayon, then tap a spot!';
  const lucy = createLucy({
    state: 'idle',
    cutout: true,
    line: lucyLine,
  });

  const body = view.kind === 'pick'
    ? pickBoard(ctx, pages)
    : el('div', { class: 'color-stage' },
        view.page.id === 'lucy' ? lucyArt(view.page.id) : letterArt(view.page.id, view.page.letter),
        view.page.letter
          ? el('span', { class: 'color-glyph', 'aria-hidden': 'true' }, view.page.letter)
          : null,
      );

  const nav = el('div', { class: 'color-nav' });
  if (view.kind === 'paint') {
    nav.append(crayonBar());
    const done = el('button', {
      class: 'pillow color-done',
      type: 'button',
      'aria-label': 'Done coloring',
    }, icon('check'), ' Done');
    pressable(done, () => {
      audio.unlock();
      audio.sfx('cheer');
      ctx.go('color');
    });
    nav.append(done);
  }

  return el('div', { class: 'coloring' },
    el('div', { class: 'trail-head' },
      el('h1', {}, icon('crayon'), ' ', 'Coloring Canvas'),
      view.kind === 'paint' ? el('span', { class: 'chip' }, view.page.title) : null,
    ),
    el('div', { class: 'trail-say' }, lucy.stage, lucy.bubble),
    body,
    nav,
  );
}

export function footLeft() {
  return el('span', {}, icon('crayon'), ' Coloring Canvas');
}

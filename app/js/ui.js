/* Tiny DOM helpers + the inline icon set.
   Icons are inline SVG on purpose: an icon font from a CDN would blank out the
   whole chrome the moment the classroom Wi-Fi drops. */

import { pictureArt } from './art.js';

export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'style' && typeof value === 'object') {
      // setProperty, not Object.assign: custom properties (--dx) need it.
      for (const [prop, val] of Object.entries(value)) {
        if (prop.startsWith('--')) node.style.setProperty(prop, val);
        else node.style[prop] = val;
      }
    }
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function clear(node) {
  while (node && node.firstChild) node.removeChild(node.firstChild);
}

/* --------------------------------------------------------------- icons */
const PATHS = {
  paw: '<circle cx="7" cy="7.5" r="2.6"/><circle cx="12" cy="5.6" r="2.7"/><circle cx="17" cy="7.5" r="2.6"/><circle cx="19.6" cy="12.6" r="2.2"/><path d="M12 10.5c3.2 0 5.8 2.6 5.8 5.3 0 2-1.5 3.4-3.4 3.4-1 0-1.7-.4-2.4-.4s-1.4.4-2.4.4c-1.9 0-3.4-1.4-3.4-3.4 0-2.7 2.6-5.3 5.8-5.3z"/>',
  play: '<path d="M8 5.2v13.6c0 .8.9 1.3 1.6.9l10.4-6.8c.6-.4.6-1.4 0-1.8L9.6 4.3c-.7-.4-1.6.1-1.6.9z"/>',
  star: '<path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.1-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z"/>',
  music: '<path d="M19 3.4l-9 2.1v9.9a3.3 3.3 0 1 0 2 3v-8.4l7-1.6v5.5a3.3 3.3 0 1 0 2 3z"/>',
  sfx: '<path d="M4 9.5v5h3.6L12 18.8V5.2L7.6 9.5z"/><path d="M15.4 8.2a5 5 0 0 1 0 7.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18.2 5.6a8.6 8.6 0 0 1 0 12.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  voice: '<rect x="9.2" y="2.4" width="5.6" height="11.2" rx="2.8"/><path d="M5.6 11.4a6.4 6.4 0 0 0 12.8 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 17.8v3.6M8.6 21.4h6.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  lock: '<path d="M7 10V8a5 5 0 0 1 10 0v2" fill="none" stroke="currentColor" stroke-width="2.2"/><rect x="4.6" y="10" width="14.8" height="10.6" rx="3.2"/>',
  cards: '<rect x="2.6" y="6" width="8.2" height="13" rx="2.4"/><rect x="12.4" y="4.4" width="8.2" height="13" rx="2.4" opacity=".55"/>',
  trail: '<path d="M5 20c0-3 3-4 6-4s6-1 6-4-3-4-6-4H5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="1 4.4"/><circle cx="5" cy="8" r="2.6"/><circle cx="19" cy="19" r="2.6"/>',
  pouch: '<path d="M6.6 8h10.8l2.2 9.4a3 3 0 0 1-2.9 3.6H7.3a3 3 0 0 1-2.9-3.6z"/><path d="M8.6 8V6.4a3.4 3.4 0 0 1 6.8 0V8" fill="none" stroke="currentColor" stroke-width="2"/>',
  touch: '<path d="M11 3.4a1.8 1.8 0 0 1 1.8 1.8v6.3l1.9-.5a3 3 0 0 1 3.7 2.3l.5 2.6a4.6 4.6 0 0 1-3.6 5.3l-2.6.5a5 5 0 0 1-5-2l-2.9-4a1.7 1.7 0 0 1 2.4-2.4l1.9 1.6V5.2A1.8 1.8 0 0 1 11 3.4z"/>',
  campaign: '<path d="M4 9.4h3.4L17 5v14l-9.6-4.4H4z"/><path d="M19.6 9.6a3.2 3.2 0 0 1 0 4.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  bulb: '<path d="M12 2.6a6.6 6.6 0 0 0-4 11.9c.6.5.9 1.1.9 1.8v.5h6.2v-.5c0-.7.3-1.3.9-1.8A6.6 6.6 0 0 0 12 2.6z"/><rect x="9.2" y="18.4" width="5.6" height="2.2" rx="1.1"/>',
  party: '<path d="M3.4 20.6l4.8-12 8 8z"/><circle cx="16.4" cy="4.6" r="1.4"/><circle cx="20.4" cy="9" r="1.2"/><circle cx="12.6" cy="3.4" r="1"/><path d="M18.4 14.8l2.6.9M15.6 8.2l3-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  check: '<circle cx="12" cy="12" r="9.4"/><path d="M7.8 12.3l2.9 2.9 5.5-5.9" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  next: '<path d="M4 12h13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M13.4 6.4L19 12l-5.6 5.6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  replay: '<path d="M12 5V2.2L7.6 5.9 12 9.6V6.8a5.4 5.4 0 1 1-5.4 5.4H4.8A7.2 7.2 0 1 0 12 5z"/>',
  flag: '<path d="M6 3.2v17.6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M7.6 4.4h10.2l-2.2 3.8 2.2 3.8H7.6z"/>',
  verified: '<path d="M12 2.4l2.3 1.9 3-.2.9 2.9 2.5 1.6-1.1 2.8 1.1 2.8-2.5 1.6-.9 2.9-3-.2L12 21.4l-2.3-1.9-3 .2-.9-2.9-2.5-1.6L4.4 12 3.3 9.2l2.5-1.6.9-2.9 3 .2z"/><path d="M8.4 12.2l2.5 2.5 4.7-5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  school: '<path d="M12 3.2L1.8 8.4 12 13.6l8.2-4.2v5.2h1.9V8.4z"/><path d="M6 11.4v4.2c0 1.9 2.7 3.4 6 3.4s6-1.5 6-3.4v-4.2l-6 3.1z"/>',
  taskdone: '<circle cx="12" cy="12" r="9.4" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M7.8 12.3l2.9 2.9 5.5-5.9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  chevron: '<path d="M9.4 5.6L15.8 12l-6.4 6.4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  trophy: '<path d="M7 3.4h10v5.2a5 5 0 0 1-10 0z"/><path d="M7 4.6H4.2v1.8A3.4 3.4 0 0 0 7.6 9.8M17 4.6h2.8v1.8a3.4 3.4 0 0 1-3.4 3.4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10.6 13.4h2.8v3.6h-2.8z"/><rect x="7.2" y="17.2" width="9.6" height="3.4" rx="1.6"/>',
  rotate: '<path d="M3.4 12a8.6 8.6 0 0 1 14.7-6.1l1.9-1.9v6h-6l2.2-2.2A6.4 6.4 0 0 0 5.6 12z"/><path d="M20.6 12a8.6 8.6 0 0 1-14.7 6.1L4 20v-6h6l-2.2 2.2A6.4 6.4 0 0 0 18.4 12z"/>',
  home: '<path d="M12 3.2L2.6 11h2.6v9.4h5V15h3.6v5.4h5V11h2.6z"/>',
  sparkle: '<path d="M12 2.6l1.7 5.7 5.7 1.7-5.7 1.7L12 17.4l-1.7-5.7-5.7-1.7 5.7-1.7z"/>',
  cloud: '<ellipse cx="9" cy="14.2" rx="5.6" ry="4.6"/><ellipse cx="15.2" cy="13.2" rx="6.4" ry="5.4"/><ellipse cx="7.6" cy="11.4" rx="4.2" ry="3.6"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 3.2v2.2M12 18.6V21M3.2 12h2.2M18.6 12H21M5.8 5.8l1.6 1.6M16.6 16.6l1.6 1.6M5.8 18.2l1.6-1.6M16.6 7.4l1.6-1.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
};

export function icon(name, { size = null, cls = '' } = {}) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  if (cls) svg.setAttribute('class', cls);
  if (size) { svg.style.width = `${size}px`; svg.style.height = `${size}px`; }
  svg.innerHTML = PATHS[name] || PATHS.sparkle;
  return svg;
}

/* Star row: filled up to `count`, hollow after. */
export function starRow(count, total = 3) {
  const row = el('span', { class: 'stars', 'aria-label': `${count} of ${total} stars` });
  for (let i = 0; i < total; i += 1) {
    const s = icon('star');
    if (i >= count) s.setAttribute('class', 'off');
    row.append(s);
  }
  return row;
}

/* A press that feels instant. Pointerdown paints the press state; click acts. */
export function pressable(node, handler) {
  node.addEventListener('pointerdown', () => node.classList.add('is-pressed'));
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((evt) =>
    node.addEventListener(evt, () => node.classList.remove('is-pressed')));
  if (handler) node.addEventListener('click', handler);
  return node;
}

/* Star burst from an element's centre — the "correct match" particle pop. */
export function sparkBurst(fromEl, n = 8) {
  const box = fromEl.getBoundingClientRect();
  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;
  for (let i = 0; i < n; i += 1) {
    const angle = (Math.PI * 2 * i) / n + Math.random() * 0.4;
    const dist = 70 + Math.random() * 60;
    const s = el('span', {
      class: 'spark',
      style: {
        left: `${cx}px`,
        top: `${cy}px`,
        '--dx': `${Math.cos(angle) * dist}px`,
        '--dy': `${Math.sin(angle) * dist}px`,
      },
    }, icon('star'));
    document.body.append(s);
    setTimeout(() => s.remove(), 760);
  }
}

export function flash(node, cls, ms = 420) {
  node.classList.remove(cls);
  void node.offsetWidth;            // restart the animation
  node.classList.add(cls);
  setTimeout(() => node.classList.remove(cls), ms);
}

/* Picture-card plate: the drawn SVG sticker when js/art.js has one for this
   picture id (all A–Z today), else the plate's own emoji. Every picture in
   data/letters.json carries a unique emoji, so the fallback is never
   ambiguous — two cards on one board can never show the same plate. */
const PIC_TONES = ['#FFEBEE', '#E1F5FE', '#E8F8F1', '#FFF8E1', '#F3EDFC', '#FFE3BF'];
export function picturePlate(picture, { size = 'card' } = {}) {
  const word = (picture && picture.word) || '';
  const emoji = (picture && picture.emoji) || '⭐';
  const letter = (picture && picture.letter) || word.charAt(0) || 'A';
  const tone = PIC_TONES[(letter.charCodeAt(0) + word.length) % PIC_TONES.length];
  const art = picture && pictureArt(picture.id);
  const inner = art
    ? el('span', { class: 'pic pic--svg', html: art })
    : el('span', { class: 'pic' }, emoji);
  return el('span', {
    class: `pic-plate pic-plate--${size}`,
    role: 'img',
    'aria-label': word,
    style: { '--pic-tone': tone },
  }, inner);
}

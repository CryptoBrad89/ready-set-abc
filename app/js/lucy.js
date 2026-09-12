/* Lucy — the golden retriever who talks and moves.
   States: idle · talking · teaching · celebrating.
   Kid-facing Lucy is the Grok Imagine cartoon plates in art/lucy/.
   The SVG is only a fallback if a plate 404s. Stitch's stick-dog is never used.

   Closet outfits pick one pose plate (bone wins over pack over cap, and so
   on) then overlay party-bow PNG layers. Clip is an overlay sprite, not a
   treat. Stitch's stick-dog is never used. */

import { el } from './ui.js';
import { audio } from './audio.js';
import { wornOutfitId } from './closet.js';
import { mountLottie } from './motion.js';

const IDLE_LOOPS = ['tail', 'wave', 'blink'];

const SVG = `
<svg class="lucy" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Lucy the golden retriever">
  <g class="lucy-sparkles" aria-hidden="true">
    <circle cx="28" cy="42" r="5" fill="#FFD54F"/>
    <circle cx="172" cy="38" r="6" fill="#FF5252"/>
    <circle cx="186" cy="78" r="4" fill="#29B6F6"/>
    <circle cx="18" cy="86" r="4" fill="#26C281"/>
  </g>
  <g class="lucy-tail">
    <path d="M140 156c14-4 26-16 26-30 0-6-8-8-11-3-4 7-9 14-19 18z" fill="#E69138"/>
  </g>
  <!-- body -->
  <ellipse cx="100" cy="184" rx="56" ry="34" fill="#E69138"/>
  <ellipse cx="100" cy="192" rx="34" ry="22" fill="#FFE3BF"/>
  <ellipse cx="62" cy="186" rx="15" ry="11" fill="#FFE3BF"/>
  <ellipse cx="138" cy="186" rx="15" ry="11" fill="#FFE3BF"/>
  <!-- collar, never a harness -->
  <path d="M62 168c10 10 28 16 38 16s28-6 38-16" fill="none" stroke="#26C281" stroke-width="7" stroke-linecap="round"/>
  <circle cx="100" cy="182" r="5" fill="#FFB800"/>

  <!-- closet: rainbow collar over the plain one -->
  <g class="lucy-collar-rainbow">
    <path d="M62 168c10 10 28 16 38 16s28-6 38-16" fill="none" stroke="#FF5252" stroke-width="8" stroke-dasharray="18 90"/>
    <path d="M62 168c10 10 28 16 38 16s28-6 38-16" fill="none" stroke="#FFB800" stroke-width="8" stroke-dasharray="18 90" stroke-dashoffset="-18"/>
    <path d="M62 168c10 10 28 16 38 16s28-6 38-16" fill="none" stroke="#26C281" stroke-width="8" stroke-dasharray="18 90" stroke-dashoffset="-36"/>
    <path d="M62 168c10 10 28 16 38 16s28-6 38-16" fill="none" stroke="#29B6F6" stroke-width="8" stroke-dasharray="18 90" stroke-dashoffset="-54"/>
    <path d="M62 168c10 10 28 16 38 16s28-6 38-16" fill="none" stroke="#c48cf0" stroke-width="8" stroke-dasharray="18 90" stroke-dashoffset="-72"/>
    <circle cx="100" cy="182" r="5" fill="#FFB800"/>
  </g>

  <!-- closet: school pack beside her -->
  <g class="lucy-pack">
    <rect x="18" y="150" width="34" height="44" rx="11" fill="#26C281"/>
    <path d="M18 166h34" fill="none" stroke="#1E9C67" stroke-width="5"/>
    <rect x="27" y="172" width="16" height="14" rx="5" fill="#FFF8E1"/>
    <path d="M30 150c0-10 10-10 10 0" fill="none" stroke="#1E9C67" stroke-width="4" stroke-linecap="round"/>
  </g>

  <!-- closet: a big bone to be proud of -->
  <g class="lucy-bone">
    <g transform="translate(160,150) rotate(-18)">
      <rect x="-20" y="-5" width="40" height="10" rx="5" fill="#FFF8E1"/>
      <circle cx="-20" cy="-6" r="7" fill="#FFF8E1"/><circle cx="-20" cy="6" r="7" fill="#FFF8E1"/>
      <circle cx="20" cy="-6" r="7" fill="#FFF8E1"/><circle cx="20" cy="6" r="7" fill="#FFF8E1"/>
    </g>
  </g>

  <g class="lucy-head">
    <g class="lucy-ear-l"><ellipse cx="56" cy="104" rx="19" ry="35" fill="#C26D20"/></g>
    <g class="lucy-ear-r"><ellipse cx="144" cy="104" rx="19" ry="35" fill="#C26D20"/></g>

    <circle cx="100" cy="100" r="54" fill="#E69138"/>
    <path d="M100 46c-24 0-40 12-46 26 10-8 26-12 46-12s36 4 46 12c-6-14-22-26-46-26z" fill="#F4B45F"/>

    <!-- muzzle -->
    <ellipse cx="100" cy="124" rx="36" ry="27" fill="#FFE3BF"/>
    <!-- eyes (blink as a group so idle Lucy is never still) -->
    <g class="lucy-eyes">
      <circle cx="80" cy="96" r="8.5" fill="#3b2d25"/>
      <circle cx="120" cy="96" r="8.5" fill="#3b2d25"/>
      <circle cx="83" cy="93" r="3" fill="#fff"/>
      <circle cx="123" cy="93" r="3" fill="#fff"/>
    </g>
    <!-- nose + smile -->
    <ellipse cx="100" cy="113" rx="11" ry="8" fill="#3b2d25"/>
    <g class="lucy-mouth">
      <path d="M100 121c0 8-8 12-14 8" fill="none" stroke="#3b2d25" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M100 121c0 8 8 12 14 8" fill="none" stroke="#3b2d25" stroke-width="3.5" stroke-linecap="round"/>
      <ellipse cx="100" cy="136" rx="11" ry="8" fill="#D2607A"/>
    </g>

    <!-- teaching spectacles — stay on while she talks -->
    <g class="lucy-glasses">
      <circle cx="80" cy="96" r="20" fill="rgba(41,182,246,.18)" stroke="#0288D1" stroke-width="4.5"/>
      <circle cx="120" cy="96" r="20" fill="rgba(41,182,246,.18)" stroke="#0288D1" stroke-width="4.5"/>
      <path d="M100 96h0" stroke="#0288D1" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M60 94h-16M140 94h16" stroke="#0288D1" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M98 96h4" stroke="#0288D1" stroke-width="4.5" stroke-linecap="round"/>
    </g>

    <!-- closet: ball cap -->
    <g class="lucy-cap">
      <path d="M54 70c2-26 20-40 46-40s44 14 46 40z" fill="#29B6F6"/>
      <path d="M146 70c15 1 25 4 29 10h-33z" fill="#0288D1"/>
      <circle cx="100" cy="31" r="6" fill="#FFB800"/>
      <path d="M56 68h88" fill="none" stroke="#0288D1" stroke-width="5" stroke-linecap="round"/>
    </g>

    <!-- celebration bows on both ears -->
    <g class="lucy-bows">
      <g transform="translate(48,70)">
        <path d="M0 0l-16-10v20zM0 0l16-10v20z" fill="#FF5252"/>
        <circle cx="0" cy="0" r="6" fill="#FFB800"/>
      </g>
      <g transform="translate(152,70)">
        <path d="M0 0l-16-10v20zM0 0l16-10v20z" fill="#29B6F6"/>
        <circle cx="0" cy="0" r="6" fill="#FFB800"/>
      </g>
    </g>
  </g>
</svg>`;

const POSE_BASE = [
  { id: 'bone', src: 'art/lucy/lucy-bone.jpg' },
  { id: 'pack', src: 'art/lucy/lucy-pack.jpg' },
  { id: 'cap', src: 'art/lucy/lucy-cap.jpg' },
  { id: 'rainbow', src: 'art/lucy/lucy-rainbow.jpg' },
  { id: 'specs', src: 'art/lucy/lucy-specs.jpg' },
];

function wearIds(outfit) {
  if (outfit === undefined) return wornOutfitId().split(/[+,\s]+/).filter(Boolean);
  if (Array.isArray(outfit)) return outfit.map(String).filter(Boolean);
  return String(outfit || '').split(/[+,\s]+/).filter(Boolean);
}

export function lucyLook({ outfit, cutout = false, pose = 'idle' } = {}) {
  const ids = wearIds(outfit);
  const set = new Set(ids);
  let src;
  let baseId = '';
  if (pose === 'celebrating') {
    src = 'art/lucy/lucy-celebrate.jpg';
    baseId = 'celebrate';
  } else {
    const hit = POSE_BASE.find((p) => set.has(p.id));
    if (hit) {
      src = hit.src;
      baseId = hit.id;
    } else if (set.has('bows')) {
      src = cutout ? 'art/lucy/lucy-bows-cutout.jpg' : 'art/lucy/lucy-bows.jpg';
      baseId = 'bows';
    } else {
      src = cutout ? 'art/lucy/lucy-cutout.jpg' : 'art/lucy/lucy-default.jpg';
    }
  }
  const layers = [];
  if (set.has('bows') && baseId !== 'bows') {
    layers.push({ id: 'bows', src: 'art/lucy/layer-headband.png' });
  }
  return { src, layers, wear: ids.join(' ') };
}

export function lucySrc(opts = {}) {
  return lucyLook(opts).src;
}

/* A Lucy box = speech bubble + mascot stage + optional paw nudge button. */
function paintLook(well, look, pose) {
  well.dataset.wear = look.wear;
  well.dataset.pose = pose;
  const photo = well.querySelector('img.lucy-photo');
  if (photo) photo.src = look.src;
  well.querySelectorAll('.lucy-layer').forEach((node) => node.remove());
  look.layers.forEach((layer) => {
    well.append(el('img', {
      class: `lucy-layer lucy-layer--${layer.id}`,
      src: layer.src,
      alt: '',
    }));
  });
  const drawn = well.querySelector('svg.lucy');
  if (drawn) {
    drawn.dataset.wear = look.wear;
    drawn.dataset.pose = pose;
  }
}

export function createLucy({ state = 'idle', line = '', paw = null, variant = 'circle', outfit, cutout = false } = {}) {
  const bubble = el('div', { class: 'bubble lucy-prompt' }, el('p', { dataset: { line: '1' } }, line));
  let resting = state;
  let timer = 0;
  const first = lucyLook({ outfit, cutout, pose: state });
  const img = el('img', {
    class: 'lucy-photo',
    alt: 'Lucy the golden retriever',
    src: first.src,
  });
  const well = el('div', { class: 'lucy-well lucy-well--photo' }, img);
  paintLook(well, first, state);
  img.addEventListener('error', () => {
    if (well.querySelector('svg.lucy')) return;
    well.innerHTML = SVG;
    const drawn = well.querySelector('.lucy');
    if (drawn) {
      drawn.dataset.pose = resting;
      drawn.dataset.talking = well.dataset.talking || 'false';
      drawn.dataset.wear = well.dataset.wear || '';
    }
  });
  const slot = el('div', { class: 'lucy-lottie-slot', hidden: true, 'aria-hidden': 'true' });
  const sparkle = el('div', { class: 'lucy-sparkle', 'aria-hidden': 'true' });
  const idleName = IDLE_LOOPS[Math.floor(Math.random() * IDLE_LOOPS.length)];
  const loop = el('video', {
    class: 'lucy-idle-loop',
    muted: true,
    loop: true,
    playsinline: '',
    'aria-hidden': 'true',
  });
  loop.setAttribute('playsinline', '');
  loop.src = `art/lucy/idle-${idleName}.mp4`;
  loop.addEventListener('loadeddata', () => {
    well.classList.add('has-loop');
    loop.play().catch(() => {});
  });
  loop.addEventListener('error', () => { loop.remove(); });
  well.append(loop);
  const stage = el('div', { class: `lucy-stage lucy-stage--${variant === 'card' ? 'card' : 'circle'}` }, well, sparkle, slot);
  stage.dataset.idle = idleName;
  mountLottie(sparkle, 'sparkle', { loop: true });
  /* Callers still read .svg.dataset. The well holds pose/talk/wear. */
  const svg = well;
  svg.dataset.talking = 'false';

  if (paw) {
    const btn = el('button', { class: 'paw-nudge', type: 'button', 'aria-label': 'Lucy paws' });
    btn.innerHTML = SVG_PAW;
    btn.addEventListener('click', paw);
    stage.append(btn);
  }

  const api = {
    bubble,
    stage,
    svg,
    setState(next) {
      resting = next;
      paintLook(well, lucyLook({ outfit, cutout, pose: next }), next);
    },
    setOutfit() {
      paintLook(well, lucyLook({ cutout, pose: resting }), resting);
    },
    getOutfit() { return svg.dataset.wear || ''; },
    /* Say a line: bubble + mouth + voice, all together. Never text alone.
       Talking is an overlay — glasses/bows stay with the resting pose. */
    say(text, { voice = true, hold = 2200 } = {}) {
      const lineEl = bubble.querySelector('[data-line]') || bubble.querySelector('p');
      if (lineEl) lineEl.textContent = text;
      bubble.classList.remove('pulse');
      void bubble.offsetWidth;
      bubble.classList.add('pulse');
      svg.dataset.talking = 'true';
      svg.dataset.pose = resting;
      const photo = well.querySelector('img.lucy-photo');
      if (photo) photo.classList.add('is-talking');
      clearTimeout(timer);
      timer = setTimeout(() => {
        svg.dataset.talking = 'false';
        if (photo) photo.classList.remove('is-talking');
      }, hold);
      if (voice) audio.speak(text);
      api.lastLine = text;
    },
    replay() { if (api.lastLine) api.say(api.lastLine); },
    lastLine: line,
  };
  return api;
}

const SVG_PAW = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  <circle cx="7" cy="7.5" r="2.6"/><circle cx="12" cy="5.6" r="2.7"/><circle cx="17" cy="7.5" r="2.6"/>
  <circle cx="19.6" cy="12.6" r="2.2"/>
  <path d="M12 10.5c3.2 0 5.8 2.6 5.8 5.3 0 2-1.5 3.4-3.4 3.4-1 0-1.7-.4-2.4-.4s-1.4.4-2.4.4c-1.9 0-3.4-1.4-3.4-3.4 0-2.7 2.6-5.3 5.8-5.3z"/>
</svg>`;

/* Lines Lucy rotates through when a kid pokes her on the home screen. */
export const LUCY_HELLOS = [
  "Hi! I'm Lucy! Let's play!",
  'Woof! Tap PLAY to start!',
  "You're doing great, superstar!",
  'I love letter sounds!',
];

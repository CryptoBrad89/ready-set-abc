/* Ready Set ABC — kid shell router and header chrome.

   Two surfaces: the kid shell (tabs Play Cards · ABC Trail · Star Pouch) and
   the Grown-Ups sheet behind a gate. Hash routing, no build step, no framework. */

import { store, applyPresentation } from './store.js';
import { loadData, activeKid, letterByChar, audioClips } from './data.js';
import { el, clear, icon } from './ui.js';
import { audio } from './audio.js';
import * as round from './round.js';
import * as home from './screens/home.js';
import * as faces from './screens/faces.js';
import * as match from './screens/match.js';
import * as bonus from './screens/bonus.js';
import * as celebrate from './screens/celebrate.js';
import * as trail from './screens/trail.js';
import * as pouch from './screens/pouch.js';
import { openGrownUps, isOpen as gateOpen } from './screens/grownups.js';
import { APP_VERSION } from './version.js';

const HOLD_MS = 3000;   // long-press the logo is the other way in

const screenEl = document.getElementById('screen');
const tabsEl = document.getElementById('tabs');
const clusterEl = document.getElementById('audio-cluster');
const whoSlot = document.getElementById('who-slot');
const footLeft = document.getElementById('foot-left');
const brandBtn = document.getElementById('brand');
const gateBtn = document.getElementById('gate-btn');

const TABS = [
  ['home', 'Play Cards', 'cards'],
  ['trail', 'ABC Trail', 'trail'],
  ['pouch', 'Star Pouch', 'pouch'],
];

/* Phase-1 wireframe hashes still show up on cart bookmarks and old README
   copies. Send them to the Stitch screens so nothing 404s into a blank stage. */
const ALIASES = {
  pickme: 'faces',
  pick: 'faces',
  map: 'trail',
  letter: 'play',
  end: 'play',
  teacher: 'grownups',
  'grown-ups': 'grownups',
  grownup: 'grownups',
};

const CHANNELS = [
  ['music', 'Music', 'music'],
  ['sfx', 'Sound effects', 'sfx'],
  ['voice', 'Lucy voice', 'voice'],
];

export function go(path) {
  const next = path.startsWith('#') ? path : `#/${path.replace(/^\/+/, '')}`;
  if (location.hash === next) render();
  else location.hash = next;
}

function parseRoute() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [name, ...params] = raw.split('/').filter(Boolean);
  return { name: name || 'home', params };
}

/* activeKid(), not getKidId(): an id whose child has left the roster must send
   the class back to the face grid, not into a round nobody owns. */
function resolvePlay() {
  const r = round.getRound();
  if (!r) return { name: 'home', params: [] };
  if (store.isClassroom() && !activeKid()) return { name: 'faces', params: [] };
  return { name: 'play', params: [], step: r.step };
}

/* 'play' is a state, not a screen: it resolves to whichever step the round is
   sitting on. A round that isn't running sends the child back home. */
function resolve(route) {
  const name = ALIASES[route.name] || route.name;

  if (name === 'grownups') {
    /* #/grownups/device lands on that tab once the gate is answered. */
    const tab = route.params[0] ? String(route.params[0]).toLowerCase() : null;
    queueMicrotask(() => { if (!gateOpen()) openGrownUps({ onChange: render, tab }); });
    return { name: 'home', params: [] };
  }

  if (name === 'faces') {
    return store.isClassroom() ? { name: 'faces', params: [] } : { name: 'home', params: [] };
  }

  if (name === 'play') {
    if (route.name === 'letter') {
      const at = route.params[0] ? String(route.params[0]).toUpperCase() : null;
      /* Every letter is awake, so #/letter/E opens E. A bookmark that names
         something the content file does not have (a typo, a stale URL) would
         otherwise start letter A with no explanation — land on the trail and
         let Lucy say which letter is up instead. */
      if (at && !letterByChar(at)) return { name: 'trail', params: [], strayLetter: at };
      round.startRound({ startAt: at });
    }
    return resolvePlay();
  }

  return ['home', 'trail', 'pouch'].includes(name) ? { name, params: route.params } : { name: 'home', params: [] };
}

/* 'play' resolves to the step the letter is sitting on: case / picture are
   the same two-tap board, then the rotating bonus, then the stars. */
function moduleFor(route) {
  if (route.name === 'play') {
    if (route.step === 'celebrate') return celebrate;
    if (route.step === 'bonus') return bonus;
    return match;
  }
  if (route.name === 'faces') return faces;
  if (route.name === 'trail') return trail;
  if (route.name === 'pouch') return pouch;
  return home;
}

let currentScreen = null;

function render() {
  const route = resolve(parseRoute());
  const screen = moduleFor(route);
  const kid = activeKid();
  /* ctx.foot() repaints just the footer line. A screen that changes something
     the footer reports (the Star Pouch putting a treat on Lucy) calls it
     instead of re-rendering itself — a full go() would throw the child back
     to the top of the shelf mid-tap. */
  const paintFoot = () => {
    clear(footLeft);
    if (currentScreen && currentScreen.footLeft) footLeft.append(currentScreen.footLeft());
  };
  const ctx = { params: route.params, go, kid, strayLetter: route.strayLetter || null, mode: store.getMode(), foot: paintFoot };

  if (currentScreen && currentScreen.teardown) currentScreen.teardown();
  currentScreen = screen;

  clear(screenEl);
  const node = screen.render(ctx);
  node.classList.add('screen', 'pop-in');
  screenEl.append(node);

  document.body.dataset.screen = route.name === 'play' ? route.step : route.name;
  paintTabs(screen.chrome || {});
  paintWho(screen.chrome || {}, kid);
  paintFoot();
}

/* ------------------------------------------------------------- chrome */
function paintTabs(chrome) {
  clear(tabsEl);
  tabsEl.hidden = chrome.tabs === false;
  if (chrome.tabs === false) return;
  TABS.forEach(([name, label, ico]) => {
    const tab = el('button', {
      class: 'tab',
      type: 'button',
      onclick: () => { audio.sfx('tap'); go(name); },
    }, icon(ico), el('span', { class: 'tab-label' }, label));
    if ((chrome.tab || 'home') === name) tab.setAttribute('aria-current', 'page');
    tabsEl.append(tab);
  });
}

function paintCluster() {
  clear(clusterEl);
  const prefs = store.getAudio();
  CHANNELS.forEach(([key, label, ico]) => {
    const btn = el('button', {
      class: 'audio-toggle',
      type: 'button',
      title: label,
      'aria-label': label,
      'aria-pressed': String(!!prefs[key]),
    }, icon(ico));
    btn.addEventListener('click', () => {
      const on = !store.getAudio()[key];
      store.setAudio(key, on);
      /* Prefs only — unlocking the speaker is PLAY's job. */
      audio.applyMutes();
      if (on && audio.isUnlocked()) audio.sfx('tap');
      paintCluster();
    });
    clusterEl.append(btn);
  });
}

function paintWho(chrome, kid) {
  clear(whoSlot);
  if (!chrome.who || !store.isClassroom() || !kid) return;
  const chip = el('button', {
    class: 'who-chip',
    type: 'button',
    'aria-label': `${kid.name} is playing. Tap to pick a different friend.`,
    onclick: () => { store.clearKid(); go('faces'); },
  },
    el('span', { class: 'who-face', style: { background: kid.color } }, kid.emoji),
    el('span', {}, kid.name),
  );
  whoSlot.append(chip);
}

/* --- gate: the slate button, a 3s logo press, or Shift+T --------------- */
function wireGate() {
  const openIfClosed = () => { if (!gateOpen()) openGrownUps({ onChange: render }); };
  gateBtn.addEventListener('click', openIfClosed);

  let timer = 0;
  const start = () => { clearTimeout(timer); timer = setTimeout(openIfClosed, HOLD_MS); };
  const cancel = () => clearTimeout(timer);
  brandBtn.addEventListener('pointerdown', start);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((evt) => brandBtn.addEventListener(evt, cancel));
  brandBtn.addEventListener('contextmenu', (event) => event.preventDefault());
  brandBtn.addEventListener('click', () => { audio.sfx('tap'); go('home'); });

  document.addEventListener('keydown', (event) => {
    if (event.target && /^(INPUT|TEXTAREA)$/.test(event.target.tagName)) return;
    if (event.shiftKey && (event.key === 'T' || event.key === 't')) openIfClosed();
    if (event.shiftKey && (event.key === 'H' || event.key === 'h')) {
      event.preventDefault();
      store.setHideChrome(!store.getHideChrome());
    }
  });
}

async function boot() {
  applyPresentation();
  document.getElementById('brand-paw').append(icon('paw'));
  document.getElementById('gate-lock-icon').append(icon('lock'));
  document.getElementById('rotate-icon').append(icon('rotate', { size: 96 }));
  const copy = document.getElementById('foot-copy');
  if (copy) copy.textContent = `© Ready Set ABC · Lucy Play Learning Lab · ${APP_VERSION}`;
  paintCluster();
  wireGate();
  window.addEventListener('hashchange', render);

  try {
    const { audio: audioMap } = await loadData();
    audio.setClips((audioMap && audioMap.clips) || audioClips());
  } catch (err) {
    console.error('[boot] content failed to load', err);
    screenEl.append(el('div', { class: 'screen', style: { display: 'grid', placeItems: 'center' } },
      el('div', { class: 'quiet-note' },
        el('h2', {}, 'Let’s try again'),
        el('p', {}, 'Ask a grown-up to reload this page.'),
      ),
    ));
    return;
  }

  render();

  /* updateViaCache: 'none' — the HTTP cache must never hand back a stale
     sw.js, or Get update quietly re-pins the version the cart already has. */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
      .catch((err) => console.warn('[sw] register failed', err));
  }
}

boot();

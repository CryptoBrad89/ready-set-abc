/* Home hub — light pop-art comic layout (Stitch screenshot), five tabs.
   Primary CTAs start the SATPIN four-beat. Storybooks / Arcade are later slots
   that still land on a real phonics beat. Lucy’s tap opens a hello dialog,
   not a practice-deck overlay. */

import { el, icon, pressable, picturePlate } from '../ui.js';
import { createLucy } from '../lucy.js';
import { audio } from '../audio.js';
import { store } from '../store.js';
import { letterByChar, picturesFor } from '../data.js';
import { openCloud, beatsFor, pinInOpenCloud, playStartLetter } from '../clouds.js';
import { nextTreat, starsToNext, TREATS } from '../closet.js';
import { previewLetters, startRound } from '../round.js';

export const chrome = { tabs: true, tab: 'home', who: true };

let helloKey = null;
let helloLayer = null;

export function teardown() {
  if (helloKey) {
    document.removeEventListener('keydown', helloKey);
    helloKey = null;
  }
  if (helloLayer && helloLayer.remove) helloLayer.remove();
  helloLayer = null;
}

function helloPeeks(entry) {
  const pool = picturesFor(entry);
  const picked = [];
  const take = (id, fallback) => {
    if (picked.length >= 2) return;
    const hit = pool.find((p) => p.id === id) || fallback;
    if (hit && !picked.some((p) => p.id === hit.id)) picked.push(hit);
  };
  if (String(entry.letter).toUpperCase() === 'P') {
    take('pan', {
      id: 'pan', word: 'Pan', emoji: '🍳',
      letter: 'P', phoneme: entry.phoneme, say: entry.say,
    });
    take('panda');
  }
  pool.forEach((p) => take(p.id));
  return picked.slice(0, 2);
}

function beginPlay(ctx, { startAt = null, step = 'meet', mode = 'loop' } = {}) {
  audio.unlock();
  audio.sfx('select');
  startRound({ startAt: startAt || playStartLetter(), step, mode });
  ctx.go(store.isClassroom() && !ctx.kid ? 'faces' : 'play');
}

export function render(ctx) {
  const root = el('div', { class: 'hub' });
  const name = ctx.kid ? ctx.kid.name : 'friend';
  const pick = playStartLetter('P');
  const pickEntry = letterByChar(pick) || { letter: pick, word: '', phoneme: '' };
  const cloud = openCloud();
  const preview = previewLetters();
  const pin = pinInOpenCloud();
  const stars = store.totalStars();
  const today = store.starsToday();

  const helloLine = `Hi ${name}! Let's find words that start with ${pick}!`;
  const peeks = helloPeeks(pickEntry);

  const lucy = createLucy({
    state: 'idle',
    variant: 'card',
    cutout: true,
    line: helloLine,
    paw: () => {
      audio.sfx('woof');
      openHello();
    },
  });
  const pawBtn = lucy.stage.querySelector('.paw-nudge');
  if (pawBtn) pawBtn.setAttribute('aria-label', 'Talk with Lucy');
  const well = lucy.stage.querySelector('.lucy-well');
  if (well) well.addEventListener('click', () => openHello());

  const closeBtn = el('button', {
    class: 'lucy-hello-close',
    type: 'button',
    'aria-label': 'Close Lucy',
  }, '×');
  const soundChip = el('button', {
    class: 'lucy-hello-sound',
    type: 'button',
    'aria-label': `Hear the sound of letter ${pick}`,
  },
    el('span', { class: 'lucy-hello-sound-letter' }, pick),
    el('span', { class: 'lucy-hello-sound-copy' },
      el('span', { class: 'lucy-hello-sound-title' }, `Hear the sound of ${pick}`),
      el('span', { class: 'lucy-hello-sound-sub' }, 'Tap to hear'),
    ),
  );
  const playHello = el('button', {
    class: 'pillow play-btn lucy-hello-play',
    type: 'button',
    'aria-label': `Play letter ${pick} with Lucy. Tap to start sound.`,
  },
    el('span', { class: 'play-disc' }, icon('play')),
    el('span', { class: 'play-words' },
      el('span', { class: 'play-kicker' }, 'Lucy says'),
      el('span', { class: 'play-big' }, `Play Letter ${pick}`),
    ),
  );
  const sayLucy = el('button', {
    class: 'chip chip--sky',
    type: 'button',
    'aria-label': 'Say Lucy',
  }, icon('voice'), 'Say "Lucy"');
  sayLucy.addEventListener('click', () => { audio.speak('Lucy!'); lucy.say('Lucy!', { voice: false }); });
  const woofBtn = el('button', {
    class: 'chip chip--gold',
    type: 'button',
    'aria-label': 'Friendly woof',
  }, icon('sfx'), 'Friendly Woof');
  woofBtn.addEventListener('click', () => { audio.sfx('woof'); lucy.say('Woof woof!', { voice: false }); });
  const peekRow = el('div', { class: 'lucy-hello-peeks' });
  peeks.forEach((pic) => {
    const card = el('button', {
      class: 'lucy-hello-peek',
      type: 'button',
      'aria-label': pic.word,
    },
      picturePlate(pic, { size: 'card' }),
      el('span', { class: 'lucy-hello-peek-word' }, pic.word),
    );
    pressable(card, () => {
      audio.sayWord(pic);
      lucy.say(`${pic.word}!`, { voice: false });
    });
    peekRow.append(card);
  });

  const sheet = el('div', {
    class: 'lucy-hello-sheet',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'lucy-hello-title',
  },
    el('div', { class: 'lucy-hello-head' },
      el('h2', { class: 'lucy-hello-title', id: 'lucy-hello-title' }, 'Lucy says'),
      closeBtn,
    ),
    el('p', { class: 'lucy-hello-line' }, helloLine),
    soundChip,
    peekRow,
    el('div', { class: 'home-lucy-row' }, sayLucy, woofBtn),
    playHello,
  );
  const overlay = el('div', {
    class: 'lucy-hello',
    hidden: true,
    'aria-hidden': 'true',
  }, sheet);

  function closeHello() {
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
  }

  function openHello() {
    overlay.hidden = false;
    overlay.removeAttribute('aria-hidden');
    lucy.say(helloLine);
    playHello.focus();
  }

  pressable(closeBtn, closeHello);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeHello(); });
  pressable(soundChip, () => {
    audio.sayPhoneme(pickEntry);
    lucy.say(helloLine, { voice: false });
  });
  pressable(playHello, () => {
    closeHello();
    beginPlay(ctx, { startAt: pick });
  });

  helloKey = (e) => { if (e.key === 'Escape') closeHello(); };
  document.addEventListener('keydown', helloKey);
  helloLayer = overlay;

  const playBtn = el('button', {
    class: 'hub-card hub-card--mission',
    type: 'button',
    id: 'play-btn',
    'aria-label': `Play letter ${pick}. Tap to start sound.`,
  },
    el('span', { class: 'hub-badge' }, "Today's Star Mission"),
    el('span', { class: 'hub-title' }, `Letters ${pick} & M Workshop`),
    el('span', { class: 'hub-sub' }, 'Meet Lucy, choose the letter, listen, then pictures.'),
    el('span', { class: 'hub-card-foot' },
      el('span', { class: 'hub-play-disc', 'aria-hidden': 'true' }, icon('play')),
      el('span', { class: 'hub-xp' }, '+ stars'),
    ),
  );
  pressable(playBtn, () => {
    audio.unlock();
    beginPlay(ctx, { startAt: pick });
  });

  const closetBtn = el('button', {
    class: 'hub-closet-btn',
    type: 'button',
    'aria-label': "Lucy's Closet",
  }, icon('pouch'), ' Puppy Closet', el('span', { class: 'hub-shop' }, 'Shop'));
  pressable(closetBtn, () => ctx.go('pouch'));

  const soundCard = el('button', {
    class: 'hub-card',
    type: 'button',
    'aria-label': `The sound of ${pick}`,
  },
    el('span', { class: 'hub-art hub-art--yellow' },
      el('span', { class: 'hub-letter-stamp' }, pick),
      el('span', { class: 'hub-art-tag' }, '4 beats'),
    ),
    el('span', { class: 'hub-title' }, `The Sound of ${pick}`),
    el('span', { class: 'hub-sub' }, pickEntry.phoneme || `/${String(pick).toLowerCase()}/`),
    el('span', { class: 'hub-cta hub-cta--cyan' }, `Play Letter ${pick}`),
  );
  pressable(soundCard, () => beginPlay(ctx, { startAt: pick, step: 'listen', mode: 'once' }));

  const satCard = el('button', {
    class: 'hub-card',
    type: 'button',
    'aria-label': 'Open cloud letters S, A, T',
  },
    el('span', { class: 'hub-art hub-art--red' },
      el('span', { class: 'hub-sat' },
        el('span', { class: 'hub-tile hub-tile--red' }, 'S'),
        el('span', { class: 'hub-tile hub-tile--cyan' }, 'A'),
        el('span', { class: 'hub-tile hub-tile--gold' }, 'T'),
      ),
      el('span', { class: 'hub-art-tag hub-art-tag--go' }, 'Cloud 1'),
    ),
    el('span', { class: 'hub-title' }, 'Sounds S, A, T'),
    el('span', { class: 'hub-sub' }, 'Blend first sounds on the Letters & Phonics path.'),
    el('span', { class: 'hub-cta' }, 'Continue Stage'),
  );
  pressable(satCard, () => ctx.go('trail'));

  const matchCard = el('button', {
    class: 'hub-card',
    type: 'button',
    'aria-label': 'Start letter match',
  },
    el('span', { class: 'hub-art hub-art--yellow' },
      el('span', { class: 'hub-case' },
        el('span', { class: 'hub-case-big' }, pick),
        el('span', { class: 'hub-case-small' }, String(pick).toLowerCase()),
      ),
      el('span', { class: 'hub-art-tag' }, 'New game'),
    ),
    el('span', { class: 'hub-title' }, 'Case Match Arena'),
    el('span', { class: 'hub-sub' }, `Find ${pick} and ${String(pick).toLowerCase()}.`),
    el('span', { class: 'hub-cta hub-cta--gold' }, 'Start Match'),
  );
  pressable(matchCard, () => beginPlay(ctx, { startAt: pick, step: 'case', mode: 'once' }));

  const later = [
    ['stories', "Lucy's Picnic Day", 'Word pictures for this letter.', 'Open Book', 'hub-art--cyan', 'book'],
    ['listen', 'Rhymes & Songs', 'This letter’s listen beat.', 'Listen & Sing', 'hub-art--yellow', 'music'],
    ['pouch', 'Coloring Canvas', 'Closet dress-up lives here.', 'Open Closet', 'hub-art--red', 'pouch'],
    ['arcade', 'Puppy Treat Match', 'Choose-letter beat in Arcade.', 'Play Memory', 'hub-art--cyan', 'arcade'],
  ];
  const laterRow = el('div', { class: 'hub-row hub-row--later' });
  later.forEach(([kind, title, sub, cta, art, ico]) => {
    const card = el('button', { class: 'hub-card', type: 'button', 'aria-label': title },
      el('span', { class: `hub-art ${art}` }, icon(ico)),
      el('span', { class: 'hub-title' }, title),
      el('span', { class: 'hub-sub' }, sub),
      el('span', { class: 'hub-cta' }, cta),
    );
    pressable(card, () => {
      if (kind === 'listen') beginPlay(ctx, { startAt: pick, step: 'listen', mode: 'once' });
      else if (kind === 'pouch') ctx.go('pouch');
      else if (kind === 'arcade') ctx.go('arcade');
      else ctx.go('stories');
    });
    laterRow.append(card);
  });

  const next = nextTreat(stars);
  const boneNeed = next ? next.need : TREATS.length;
  const boneHave = next ? Math.min(stars, next.need) : boneNeed;
  const boneLeft = starsToNext(stars);
  const bonePct = boneNeed ? Math.round((boneHave / boneNeed) * 100) : 100;
  const level = cloud ? cloud.id : 1;
  const online = audio.isUnlocked();

  const discover = el('button', {
    class: 'hub-discover',
    type: 'button',
    'aria-label': 'Discover more letters',
  }, 'Discover more', icon('next'));
  pressable(discover, () => ctx.go('trail'));
  const discoverStories = el('button', {
    class: 'hub-discover',
    type: 'button',
    'aria-label': 'Open storybooks',
  }, 'Discover more', icon('next'));
  pressable(discoverStories, () => ctx.go('stories'));

  root.append(
    el('section', { class: 'hub-hero-panel' },
      el('span', { class: 'hub-online' },
        el('span', { class: `dot${online ? ' is-on' : ''}` }),
        online ? 'Explorer Station Online' : 'Sound waits for PLAY',
      ),
      el('div', { class: 'hub-hero' },
        el('div', { class: 'hub-lucy-card' },
          lucy.stage,
          el('span', { class: 'hub-lucy-badge' }, pick),
          closetBtn,
        ),
        el('div', { class: 'hub-hero-copy' },
          el('h1', { class: 'hub-welcome' }, `Welcome back, ${name}!`),
          el('div', { class: 'hub-chips' },
            el('span', { class: 'chip chip--sky' }, 'English: Pre-K'),
            el('span', { class: 'chip chip--gold' }, cloud ? cloud.name : 'Cloud 1'),
            pin ? el('span', { class: 'chip' }, icon('flag'), `Today: ${pin}`) : null,
            today ? el('span', { class: 'chip' }, `+${today} today`) : null,
          ),
          el('div', { class: 'hub-stats' },
            el('div', { class: 'hub-stat hub-stat--stars' },
              el('span', { class: 'hub-stat-ico', 'aria-hidden': 'true' }, icon('star')),
              el('span', {},
                el('span', { class: 'hub-stat-num' }, `${stars} Stars`),
                el('span', { class: 'hub-stat-sub' }, 'Golden Star Bank'),
              ),
            ),
            el('div', { class: 'hub-stat hub-stat--level' },
              el('span', { class: 'hub-stat-ico', 'aria-hidden': 'true' }, level),
              el('span', {},
                el('span', { class: 'hub-stat-num' }, `Level ${level}`),
                el('span', { class: 'hub-stat-sub' }, preview.length ? preview.join(' · ') : 'S A T P M I'),
              ),
            ),
          ),
          el('div', { class: 'hub-meter' },
            el('span', { class: 'hub-meter-ico', 'aria-hidden': 'true' }, icon('paw')),
            el('span', { class: 'hub-meter-label' }, 'Daily Bone Treat Meter'),
            el('span', { class: 'hub-meter-copy' },
              boneLeft ? `${boneLeft} more to ${next ? next.name : 'the next treat'}` : 'Every treat is open!',
            ),
            el('span', { class: 'xp-rail' }, el('span', { class: 'xp-fill', style: { width: `${bonePct}%` } })),
            el('span', { class: 'hub-meter-count' }, `${boneHave} / ${boneNeed}`),
          ),
        ),
      ),
    ),
    el('div', { class: 'hub-section-row' },
      el('h2', { class: 'hub-section' },
        el('span', { class: 'hub-section-ico hub-section-ico--gold', 'aria-hidden': 'true' }, icon('flag')),
        'Phonics & Alphabet',
      ),
      discover,
    ),
    el('div', { class: 'hub-row hub-row--phonics' }, playBtn, soundCard, satCard, matchCard),
    el('div', { class: 'hub-section-row' },
      el('h2', { class: 'hub-section' },
        el('span', { class: 'hub-section-ico hub-section-ico--red', 'aria-hidden': 'true' }, icon('book')),
        'Storybooks & Fun Games',
      ),
      discoverStories,
    ),
    laterRow,
  );
  lucy.bubble.classList.add('hub-lucy-bubble');
  root.querySelector('.hub-lucy-card')?.prepend(lucy.bubble);

  const host = document.getElementById('app') || root;
  host.append(overlay);

  return root;
}

export function footLeft() {
  const cloud = openCloud();
  const n = (cloud && cloud.letters || []).reduce((sum, L) => sum + Math.min(4, beatsFor(L)), 0);
  const need = cloud ? cloud.letters.length * 4 : 24;
  return el('span', {}, icon('home'), ` ${cloud ? cloud.name : 'Cloud 1'} · ${n}/${need}`);
}

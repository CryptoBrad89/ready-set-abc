/* Home — Lucy, the giant PLAY button (audio unlock) and the round strip.
   Matches ready_set_abc_home_screen: status row, white hero (title + Lucy +
   Letter Adventure inside one card), trust chips below. */

import { el, icon, starRow, pressable } from '../ui.js';
import { createLucy, LUCY_HELLOS } from '../lucy.js';
import { audio } from '../audio.js';
import { store } from '../store.js';
import { letterByChar } from '../data.js';
import { previewLetters, startRound } from '../round.js';

export const chrome = { tabs: true, tab: 'home', who: true };

const TONES = ['a', 'b', 'c'];

export function render(ctx) {
  const root = el('div', { class: 'home' });

  const lucy = createLucy({
    state: 'idle',
    variant: 'circle',
    line: ctx.kid ? `Hi ${ctx.kid.name}! Let's play!` : "Hi! I'm Lucy! Let's play!",
    paw: () => {
      audio.sfx('pop');
      lucy.say(LUCY_HELLOS[Math.floor(Math.random() * LUCY_HELLOS.length)]);
    },
  });

  const playBtn = el('button', {
    class: 'pillow play-btn breathe',
    type: 'button',
    id: 'play-btn',
    'aria-label': 'Play. Tap to start sound.',
  },
    el('span', { class: 'play-disc' }, icon('play')),
    el('span', { class: 'play-words' },
      el('span', { class: 'play-big' }, 'PLAY!'),
      el('span', { class: 'play-small' }, 'Tap to Start Sound'),
    ),
    el('span', { class: 'play-arrow', 'aria-hidden': 'true' }, icon('next')),
  );

  pressable(playBtn, () => {
    audio.unlock();
    audio.sfx('select');
    lucy.say("Hi! I'm Lucy! Let's play!");
    setTimeout(() => {
      startRound();
      ctx.go(store.isClassroom() && !ctx.kid ? 'faces' : 'play');
    }, 260);
  });

  const status = el('div', { class: 'home-status' },
    el('span', { class: 'chip chip--gold' }, icon('star'), `${store.starsToday()} Stars Today`),
    el('span', { class: 'sound-ready' },
      el('span', { class: 'dot', 'aria-hidden': 'true' }),
      audio.isUnlocked() ? 'Sound Ready' : 'Sound waits for PLAY',
    ),
  );

  const deco = el('div', { class: 'home-deco', 'aria-hidden': 'true' },
    el('span', { class: 'cloud' }, icon('cloud')),
    el('span', { class: 'cloud cloud-2' }, icon('cloud')),
    el('span', { class: 'sun' }, icon('sun')),
  );

  const heroGrid = el('div', { class: 'home-hero-grid' },
    el('div', { class: 'home-left' },
      el('div', { class: 'home-chips' },
        el('span', { class: 'chip chip--gold' }, icon('sparkle'), 'Pre-K Phonics Adventure'),
      ),
      el('h1', { class: 'home-title' }, 'Ready Set ABC!'),
      el('p', { class: 'home-sub' }, 'Tap, listen, and play with letter sounds together!'),
      playBtn,
      el('span', { class: 'play-note' }, icon('sfx'), 'Audio unlocks on first tap'),
    ),
    el('div', { class: 'home-lucy' },
      lucy.bubble,
      lucy.stage,
      el('div', { class: 'home-lucy-row' },
        el('button', { class: 'chip chip--sky', type: 'button', onclick: () => { audio.speak('Lucy!'); lucy.say('Lucy!', { voice: false }); } },
          icon('voice'), 'Say "Lucy"'),
        el('button', { class: 'chip chip--gold', type: 'button', onclick: () => { audio.sfx('woof'); lucy.say('Woof woof!', { voice: false }); } },
          icon('sfx'), 'Friendly Woof'),
      ),
    ),
  );

  const preview = previewLetters();
  const cards = el('div', { class: 'round-cards' });
  preview.forEach((L, i) => {
    const entry = letterByChar(L) || { letter: L, word: '', emoji: '' };
    const last = preview.length - 1;
    const state = i === 0 ? 'ready' : (preview.length > 1 && i === last) ? 'next' : 'current';
    const label = i === 0 ? 'Ready' : (preview.length > 1 && i === last) ? 'Next Up' : `Letter ${i + 1}`;
    const card = el('button', {
      class: 'pillow round-card',
      type: 'button',
      dataset: { tone: TONES[i % TONES.length] },
      'aria-label': `Letter ${L} is for ${entry.word}. Start here.`,
    },
      el('span', { class: `badge badge-${state}` }, label),
      el('span', { class: 'glyph' }, L),
      el('span', { class: 'word' }, entry.word),
      store.progressMode() === 'none' ? null : starRow(store.starsFor(L)),
    );
    pressable(card, () => {
      audio.unlock();
      audio.sayLetterName(L);
      lucy.say(`Letter ${L}. ${entry.word}!`, { voice: false });
      setTimeout(() => {
        startRound({ startAt: L });
        ctx.go(store.isClassroom() && !ctx.kid ? 'faces' : 'play');
      }, 320);
    });
    cards.append(card);
  });

  const strip = el('div', { class: 'round-strip' },
    el('div', { class: 'round-strip-head' },
      el('h2', {}, icon('flag'), 'Letter Adventure'),
      el('span', { class: 'round-of' }, `Round: Letters ${preview.join(' · ')}`),
    ),
    cards,
  );

  const hero = el('div', { class: 'home-hero' }, deco, heroGrid, strip);

  const trust = el('div', { class: 'home-trust' },
    el('div', { class: 'trust-card' },
      el('span', { class: 'trust-ico trust-ico--mint' }, icon('touch')),
      el('div', {},
        el('div', { class: 'trust-title' }, 'Kid-Safe 88px Targets'),
        el('div', { class: 'trust-sub' }, 'Big buttons designed for preschool hands'),
      ),
    ),
    el('div', { class: 'trust-card' },
      el('span', { class: 'trust-ico trust-ico--sky' }, icon('lock')),
      el('div', {},
        el('div', { class: 'trust-title' }, 'Tamper-Proof Gate'),
        el('div', { class: 'trust-sub' }, 'Accidental setting clicks are blocked'),
      ),
    ),
    el('div', { class: 'trust-card' },
      el('span', { class: 'trust-ico trust-ico--gold' }, icon('voice')),
      el('div', {},
        el('div', { class: 'trust-title' }, 'Pure Phonemic Phonics'),
        el('div', { class: 'trust-sub' }, 'Crystal audio with Lucy vocal assistance'),
      ),
    ),
  );

  root.append(status, hero, trust);
  return root;
}

export function footLeft() {
  const stars = store.starsToday();
  return el('span', {}, icon('star'), ` Safe preschool game arena · No ads · ${stars} ${stars === 1 ? 'star' : 'stars'} today`);
}

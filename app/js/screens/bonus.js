/* The bonus step — one rotating game between the picture match and the stars.

   Three boards, same chrome (js/bonus.js decides which one this letter gets):

     Letter Hunt — tap every A and a in the tiles
     Sound Sort  — one picture at a time: does it start with /æ/? Yes / No
     ABC Order   — three letters, tapped in alphabet order

   This step is single-tap on purpose. The two-tap rule guards a MATCH (choice
   then prompt, GAME-FLOW): there is no prompt to match here, so a second tap
   would be ceremony a three-year-old has to learn for one screen. A wrong tap
   wobbles coral, Lucy nudges, nothing is lost — bonus misses never cost a
   star. After two misses (or twenty seconds) a quiet "Skip to stars" appears
   so a stuck child is never parked here. */

import { el, icon, pressable, sparkBurst, flash, picturePlate } from '../ui.js';
import { createLucy } from '../lucy.js';
import { audio } from '../audio.js';
import * as round from '../round.js';

export const chrome = { tabs: true, tab: 'home', who: true };

const SKIP_AFTER_MS = 20000;   // a quiet way out, for the child who is stuck
const SKIP_AFTER_MISSES = 2;

let keyHandler = null;
let skipTimer = 0;
let goTimer = 0;

export function teardown() {
  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  }
  clearTimeout(skipTimer);
  clearTimeout(goTimer);
  skipTimer = 0;
  goTimer = 0;
}

export function render(ctx) {
  teardown();                     // before anything here arms a timer
  const r = round.getRound();
  if (!r) { ctx.go('home'); return el('div'); }

  const entry = round.currentLetter();
  const bonus = round.getBonus() || round.openBonus();
  /* Bonus off (nothing to build), or a board that was already finished and
     came back on a reload: this letter goes straight to the stars. */
  if (!entry || !bonus || round.bonusDone()) {
    round.advance();
    ctx.go('play');
    return el('div');
  }

  const root = el('div', { class: `bonus bonus--${bonus.type}` });

  /* --- header: what this is, and how far in they are -------------------- */
  const pips = el('div', { class: 'bonus-pips' });
  const paintPips = () => {
    pips.textContent = '';
    for (let i = 0; i < bonus.need; i += 1) {
      pips.append(el('span', { class: `bonus-pip${i < bonus.found.length ? ' on' : ''}` }, icon('star')));
    }
  };
  paintPips();

  root.append(el('div', { class: 'bonus-top' },
    el('div', { class: 'bonus-badge' },
      el('span', { class: 'bonus-badge-ico' }, icon('party')),
      el('div', {},
        el('div', { class: 'bonus-kicker' }, `Bonus Round · ${bonus.label}`),
        el('div', { class: 'bonus-title' }, bonus.title),
      ),
    ),
    el('div', { class: 'bonus-progress' },
      el('span', { class: 'chip chip--gold' }, `Letter ${entry.letter}${entry.lower}`),
      pips,
    ),
  ));

  /* --- Lucy asks -------------------------------------------------------- */
  const lucy = createLucy({ state: 'teaching', variant: 'card', cutout: true, line: bonus.lucy });
  const listenBtn = el('button', { class: 'pillow listen-btn', type: 'button' }, icon('sfx'), 'Listen');
  pressable(listenBtn, () => { audio.speak(`${bonus.title} ${bonus.ask}`); lucy.say(bonus.lucy, { voice: false }); });

  root.append(el('div', { class: 'instruction' },
    el('div', { class: 'instruction-left' },
      el('span', { class: 'megaphone' }, icon('campaign')),
      el('p', {}, bonus.ask),
    ),
    listenBtn,
  ));

  /* --- board ------------------------------------------------------------ */
  const boardWrap = el('div', { class: 'bonus-board' });
  const tileFor = new Map();

  const skipBtn = el('button', { class: 'bonus-skip', type: 'button', hidden: true },
    icon('next'), 'Skip to stars');
  pressable(skipBtn, () => {
    audio.sfx('tap');
    round.skipBonus();
    leave(`That’s alright! Here come your stars, ${entry.letter}${entry.lower}.`);
  });

  function offerSkip() {
    if (!skipBtn.hidden) return;
    skipBtn.hidden = false;
    skipBtn.classList.add('is-offered');
  }
  skipTimer = setTimeout(offerSkip, SKIP_AFTER_MS);

  let leaving = false;
  function leave(line) {
    if (leaving) return;
    leaving = true;
    clearTimeout(skipTimer);
    lucy.setState('celebrating');
    lucy.say(line, { voice: false });
    audio.speak(line);
    goTimer = setTimeout(() => { round.advance(); ctx.go('play'); }, 1150);
  }

  function afterTap(result) {
    paintPips();
    if (result === 'wrong' && bonus.misses >= SKIP_AFTER_MISSES) offerSkip();
    if (!round.bonusDone()) return;
    const done = round.bonusSummary();
    audio.sfx('right');
    leave(`${audio.cheer()} Bonus done — ${done.found} of ${done.need}!`);
  }

  /* ---- Letter Hunt / ABC Order: a field of letter tiles ---------------- */
  function letterTiles() {
    const grid = el('div', { class: 'bonus-grid' });
    bonus.items.forEach((item) => {
      const tile = el('button', {
        class: 'pillow bonus-tile',
        type: 'button',
        dataset: { id: item.id },
        'aria-label': bonus.type === 'order'
          ? `Letter ${item.glyph}`
          : `Letter ${item.glyph}, tap it if it is ${bonus.letter}`,
      },
        el('span', { class: 'glyph' }, item.glyph),
        el('span', { class: 'bonus-tick' }, icon('check')),
      );
      /* Coming back to a half-played board (a tab, a reload) keeps the finds. */
      if (bonus.found.includes(item.id)) { tile.classList.add('found'); tile.disabled = true; }
      pressable(tile, () => onTile(item, tile));
      tileFor.set(item.id, tile);
      grid.append(tile);
    });
    return grid;
  }

  function onTile(item, tile) {
    if (leaving) return;
    const result = round.bonusTap(item.id);
    if (result === null) return;
    if (result === 'right') {
      tile.classList.add('found');
      tile.disabled = true;
      sparkBurst(tile, 6);
      audio.sfx('select');
      /* Hunt is a sound game: a letter tap says the SOUND, never the name.
         ABC Order is the alphabet-order game, so there the NAME is the point
         (see README → Sound tab). Two games, two honest channels. */
      if (bonus.type === 'order') audio.sayLetterName(item.letter);
      else audio.sayPhoneme(entry);
      lucy.say(bonus.type === 'order'
        ? `${item.glyph}! Which letter comes next?`
        : `You found ${item.glyph}!`, { voice: false });
    } else {
      audio.sfx('wrong');
      flash(tile, 'wobble');
      lucy.say(audio.nudge(), { voice: false });
    }
    afterTap(result);
  }

  /* ---- Sound Sort: one picture, two giant answers --------------------- */
  const askCard = el('div', { class: 'bonus-ask' });
  function paintAsk() {
    const item = round.bonusCurrent();
    if (!item) return;                 // finished: leave the last picture up
    askCard.textContent = '';
    askCard.append(
      el('span', { class: 'bonus-ask-tag' }, `Picture ${bonus.at + 1} of ${bonus.need}`),
      picturePlate(item.picture, { size: 'pic' }),
      el('span', { class: 'bonus-ask-word' }, item.picture.word),
    );
    audio.sayWord(item.picture);
  }

  function soundAnswers() {
    const yes = el('button', { class: 'pillow bonus-answer bonus-answer--yes', type: 'button' },
      icon('check'),
      el('span', {}, 'Yes!', el('small', {}, `starts with ${entry.phoneme}`)));
    const no = el('button', { class: 'pillow bonus-answer bonus-answer--no', type: 'button' },
      icon('replay'),
      el('span', {}, 'No', el('small', {}, 'different sound')));
    pressable(yes, () => onAnswer('yes', yes));
    pressable(no, () => onAnswer('no', no));
    tileFor.set('yes', yes);
    tileFor.set('no', no);
    return el('div', { class: 'bonus-answers' }, yes, no);
  }

  function onAnswer(id, btn) {
    if (leaving) return;
    const item = round.bonusCurrent();
    const result = round.bonusTap(id);
    if (result === null) return;
    if (result === 'right') {
      audio.sfx('select');
      flash(btn, 'leap', 520);
      lucy.say(item && item.starts
        ? `Yes! ${item.picture.word} starts with ${entry.phoneme}.`
        : `That’s right — ${item ? item.picture.word : 'that one'} does not start with ${entry.phoneme}.`,
      { voice: false });
      paintAsk();
    } else {
      audio.sfx('wrong');
      flash(btn, 'wobble');
      lucy.say(audio.nudge(), { voice: false });
    }
    afterTap(result);
  }

  if (bonus.type === 'sound') {
    boardWrap.append(askCard, soundAnswers());
  } else {
    boardWrap.append(letterTiles());
  }

  root.append(el('div', { class: 'board' },
    el('div', { class: 'board-lucy' }, lucy.bubble, lucy.stage),
    el('div', { class: 'board-main' }, boardWrap, el('div', { class: 'bonus-foot' }, skipBtn)),
  ));

  /* --- keyboard (cart Chromebooks + the whiteboard remote) -------------- */
  keyHandler = (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === 'Escape') { event.preventDefault(); ctx.go('home'); return; }
    if (bonus.type === 'sound') {
      if (event.key === 'y' || event.key === 'Y') { event.preventDefault(); onAnswer('yes', tileFor.get('yes')); }
      if (event.key === 'n' || event.key === 'N') { event.preventDefault(); onAnswer('no', tileFor.get('no')); }
      return;
    }
    const n = parseInt(event.key, 10);
    if (n >= 1 && n <= bonus.items.length) {
      event.preventDefault();
      const item = bonus.items[n - 1];
      onTile(item, tileFor.get(item.id));
    }
  };
  document.addEventListener('keydown', keyHandler);

  if (bonus.type === 'sound') setTimeout(paintAsk, 260);
  else setTimeout(() => audio.sayLetterName(entry.letter), 260);

  return root;
}

export function footLeft() {
  return el('span', {}, icon('star'), ' Bonus round · misses never cost a star');
}

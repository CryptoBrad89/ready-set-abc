/* Framed SATPIN stage: meet → choose → listen → payoff.
   Single tap. Lucy is a corner companion (replay the beat), never a coach overlay.
   Motion: CSS squash/wobble + optional lottie sparkle/check + confetti on payoff. */

import { el, icon, pressable, picturePlate } from '../ui.js';
import { createLucy } from '../lucy.js';
import { audio } from '../audio.js';
import { store } from '../store.js';
import { beatsFor } from '../clouds.js';
import { mountLottie, burstConfetti, squash, wobble, floatGlyph } from '../motion.js';
import * as round from '../round.js';

export const chrome = { tabs: true, tab: 'home', who: true };

let keyHandler = null;
let lottiePlayer = null;

export function teardown() {
  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  }
  if (lottiePlayer && lottiePlayer.destroy) lottiePlayer.destroy();
  lottiePlayer = null;
}

function goPlay(ctx) {
  ctx.go('play');
}

function afterRight(ctx, node, letter) {
  audio.sfx('right');
  floatGlyph(node, letter);
  window.setTimeout(() => {
    const next = round.advance();
    if (next === 'home') { ctx.go('home'); return; }
    if (next === 'celebrate') round.bankLetter();
    goPlay(ctx);
  }, 720);
}

export function render(ctx) {
  const r = round.getRound();
  if (!r) { round.startRound(); return render(ctx); }

  const step = r.step;
  const entry = round.currentLetter();
  if (!r.trial) round.buildTrial();
  const trial = r.trial;
  if (!entry || !trial) {
    ctx.go('home');
    return el('div');
  }

  const root = el('div', { class: `stage-frame stage-frame--${step}` });
  const xp = Math.min(100, (beatsFor(entry.letter) / 4) * 100);
  const line = promptFor(step, entry);

  const lucy = createLucy({
    state: step === 'payoff' ? 'celebrating' : 'teaching',
    variant: 'circle',
    cutout: true,
    line,
    paw: () => {
      audio.sfx('pop');
      replayBeat(entry, step);
      lucy.say(line, { voice: false });
    },
  });

  const frame = el('div', { class: 'stage-board' });
  if (step === 'meet') frame.append(meetBoard(entry, trial, ctx, root, lucy));
  else if (step === 'choose') frame.append(chooseBoard(entry, trial, ctx, root, lucy));
  else if (step === 'listen') frame.append(listenBoard(entry, trial, ctx, root, lucy));
  else frame.append(payoffBoard(entry, trial, ctx, root, lucy));

  const spark = el('div', { class: 'stage-spark', 'aria-hidden': 'true' });
  lottiePlayer = mountLottie(spark, step === 'payoff' ? 'check' : 'sparkle', { loop: true });

  root.append(
    el('div', { class: 'stage-hud' },
      el('span', { class: 'chip chip--gold' }, icon('star'), `${store.starsToday()} today`),
      el('span', { class: 'stage-letter-chip' }, entry.letter),
      el('span', { class: 'chip' }, `${['meet', 'choose', 'listen', 'payoff'].indexOf(step) + 1} / 4`),
    ),
    el('div', { class: 'xp-rail', 'aria-hidden': 'true' },
      el('span', { class: 'xp-fill', style: { width: `${xp}%` } }),
    ),
    frame,
    el('div', { class: 'stage-lucy' }, lucy.stage, lucy.bubble),
    spark,
  );

  replayBeat(entry, step);
  window.setTimeout(() => lucy.say(line, { voice: false }), 80);

  keyHandler = (event) => {
    if (event.key === 'Escape') { round.goHome(); ctx.go('home'); }
  };
  document.addEventListener('keydown', keyHandler);

  return root;
}

function promptFor(step, entry) {
  const sound = entry.phoneme || `/${entry.lower}/`;
  if (step === 'meet') return `This is ${entry.letter}. It says ${sound}.`;
  if (step === 'choose') return `Lucy wants ${entry.letter}! Tap the ${entry.letter}.`;
  if (step === 'listen') return `Find the sound ${sound}.`;
  return `${entry.letter} says ${entry.word}!`;
}

function replayBeat(entry, step) {
  if (step === 'meet') audio.sayLetterName(entry.letter);
  else if (step === 'listen') audio.sayPhoneme(entry);
  else if (step === 'payoff') audio.sayWord({ letter: entry.letter, word: entry.word, id: entry.pictures && entry.pictures[0] && entry.pictures[0].id });
}

function meetBoard(entry, trial, ctx, root, lucy) {
  const card = el('button', {
    class: 'pillow stage-hang stage-hang--hero',
    type: 'button',
    'aria-label': `Letter ${entry.letter}. Continue.`,
  },
    el('span', { class: 'stage-glyph' }, entry.letter),
    el('span', { class: 'stage-sub' }, `${entry.letter}${entry.lower}`),
    el('span', { class: 'badge badge-ready' }, 'Tap to play'),
  );
  pressable(card, () => {
    if (trial.locked) return;
    squash(card);
    audio.unlock();
    audio.sfx('select');
    round.continueBeat();
    lucy.say(`Let's find ${entry.letter}!`, { voice: false });
    afterRight(ctx, root, entry.letter);
  });
  return el('div', { class: 'stage-meet' }, card);
}

function chooseBoard(entry, trial, ctx, root, lucy) {
  const row = el('div', { class: 'stage-hang-row' });
  trial.choices.forEach((choice) => {
    const used = trial.found.filter((L) => L === choice.letter).length;
    const card = el('button', {
      class: 'pillow stage-hang',
      type: 'button',
      'aria-label': `Letter ${choice.letter}`,
    },
      el('span', { class: 'stage-glyph' }, trial.hunt === 'lower' ? choice.lower : choice.letter),
    );
    pressable(card, () => {
      if (trial.locked) return;
      audio.unlock();
      squash(card);
      const result = round.tapChoose(choice.letter);
      if (result === 'wrong') {
        wobble(card);
        audio.sfx('wrong');
        audio.nudge();
        lucy.say('Try another one!', { voice: false });
        return;
      }
      audio.sayPhoneme(entry);
      card.classList.add('is-found');
      if (result === 'right') {
        lucy.setState('celebrating');
        lucy.say('Yes!', { voice: false });
        afterRight(ctx, root, entry.letter);
      }
    });
    if (choice.target && used) card.classList.add('is-found');
    row.append(card);
  });
  return row;
}

function listenBoard(entry, trial, ctx, root, lucy) {
  const row = el('div', { class: 'stage-orb-row' });
  trial.orbs.forEach((orb) => {
    const btn = el('button', {
      class: 'pillow stage-orb',
      type: 'button',
      'aria-label': orb.target ? 'Play this sound' : 'Not this sound',
    }, el('span', { class: 'stage-orb-face' }, icon('sfx')));
    pressable(btn, () => {
      if (trial.locked) return;
      audio.unlock();
      squash(btn);
      const result = round.tapListen(orb.id);
      if (result === 'wrong') {
        wobble(btn);
        audio.sfx('wrong');
        audio.nudge();
        lucy.say('Not that one — try another orb!', { voice: false });
        return;
      }
      audio.sayPhoneme(entry);
      lucy.setState('celebrating');
      lucy.say('You found it!', { voice: false });
      afterRight(ctx, root, entry.letter);
    });
    row.append(btn);
  });
  return row;
}

function payoffBoard(entry, trial, ctx, root, lucy) {
  const plates = el('div', { class: 'stage-payoff' });
  (trial.plates || []).forEach((pic) => {
    const card = el('button', {
      class: 'pillow stage-plate',
      type: 'button',
      'aria-label': `${entry.letter} is for ${pic.word}`,
    },
      picturePlate(pic, { size: 'card' }),
      el('span', { class: 'stage-word' }, pic.word),
    );
    pressable(card, () => {
      audio.unlock();
      audio.sayWord(pic);
      lucy.say(`${pic.word}!`, { voice: false });
    });
    plates.append(card);
  });
  const go = el('button', {
    class: 'pillow play-btn',
    type: 'button',
    'aria-label': 'Hooray, continue',
  }, el('span', { class: 'play-big' }, 'Hooray!'));
  pressable(go, () => {
    if (trial.locked) return;
    squash(go);
    audio.unlock();
    audio.cheer();
    burstConfetti();
    round.continueBeat();
    afterRight(ctx, root, entry.letter);
  });
  return el('div', { class: 'stage-payoff-wrap' }, plates, go);
}

export function footLeft() {
  const r = round.getRound();
  const entry = round.currentLetter();
  if (!r || !entry) return el('span', {}, icon('sparkle'), ' Letters and Sounds');
  return el('span', {}, icon('sparkle'), ` ${entry.letter} · ${r.step}`);
}

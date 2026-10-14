/* Framed SATPIN stage: meet → choose → listen → payoff.
   Single tap. Lucy is a corner companion (replay the beat), never a coach overlay.
   Motion: CSS squash/wobble + optional lottie sparkle/check + confetti on payoff. */

import { el, icon, pressable, picturePlate } from '../ui.js';
import { createLucy } from '../lucy.js';
import { audio } from '../audio.js';
import { store } from '../store.js';
import { beatsFor } from '../clouds.js';
import { letterByChar, soundAtEnd, soundPhrase } from '../data.js';
import { mountLottie, burstConfetti, squash, wobble, floatGlyph } from '../motion.js';
import * as round from '../round.js';

export const chrome = { tabs: true, tab: 'home', who: true };

/* A success holds for SUCCESS_MS so the glyph can float, and waits for the
   sound the child just triggered — X's /ks/ runs over a second — but never
   longer than VOICE_CAP_MS, so a stalled clip cannot strand the board. */
export const SUCCESS_MS = 720;
export const VOICE_CAP_MS = 2600;

let keyHandler = null;
let lottiePlayer = null;
let timers = [];
let screenGen = 0;
let activeLucy = null;

export function teardown() {
  screenGen += 1;
  audio.stopVoice();
  timers.forEach(clearTimeout);
  timers = [];
  if (activeLucy && activeLucy.dispose) activeLucy.dispose();
  activeLucy = null;
  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  }
  if (lottiePlayer && lottiePlayer.destroy) lottiePlayer.destroy();
  lottiePlayer = null;
}

function later(fn, ms) {
  const id = window.setTimeout(() => {
    timers = timers.filter((t) => t !== id);
    fn();
  }, ms);
  timers.push(id);
}

function goPlay(ctx) {
  ctx.go('play');
}

/* Advances only the trial it was scheduled for. Leaving the screen, or a new
   round starting in the gap, turns the pending advance into a no-op. */
export function afterRight(ctx, node, letter, voiced = null) {
  audio.sfx('right');
  floatGlyph(node, letter);
  const gen = screenGen;
  const token = round.trialToken();
  let held = true;
  let speaking = !!voiced;
  let moved = false;
  const move = () => {
    if (moved || held || speaking) return;
    moved = true;
    if (gen !== screenGen || !token || round.trialToken() !== token) return;
    const next = round.advance();
    if (next === 'home') { ctx.go('home'); return; }
    if (next === 'celebrate') round.bankLetter();
    goPlay(ctx);
  };
  later(() => { held = false; move(); }, SUCCESS_MS);
  if (voiced) {
    const heard = () => { speaking = false; move(); };
    later(heard, VOICE_CAP_MS);
    Promise.resolve(voiced).then(heard, heard);
  }
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
  const line = promptFor(step, entry, trial);

  const lucy = createLucy({
    state: step === 'payoff' ? 'celebrating' : 'teaching',
    variant: 'circle',
    cutout: true,
    line: '',
    paw: () => {
      audio.sfx('pop');
      replayBeat(entry, step, trial);
      lucy.say(line, { syncTalk: step !== 'payoff' });
    },
  });
  if (activeLucy && activeLucy.dispose) activeLucy.dispose();
  activeLucy = lucy;

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
    instructionBar(line),
    frame,
    el('div', { class: 'stage-lucy' }, lucy.stage, lucy.bubble),
    spark,
  );

  /* Opening payoff keeps Lucy's line on screen. The picture word waits for a plate tap. */
  if (step !== 'payoff') replayBeat(entry, step, trial);
  later(() => lucy.say(line, { syncTalk: step !== 'payoff' }), 80);

  keyHandler = (event) => {
    if (event.key === 'Escape') { round.goHome(); ctx.go('home'); }
  };
  document.addEventListener('keydown', keyHandler);

  return root;
}

function promptFor(step, entry, trial) {
  const sound = entry.phoneme || `/${entry.lower}/`;
  if (step === 'meet') return `This is ${entry.letter}. It says ${sound}.`;
  if (step === 'choose') {
    return trial && trial.targets && trial.targets.length > 1
      ? `Lucy wants ${entry.letter}! Tap every ${entry.letter}.`
      : `Lucy wants ${entry.letter}! Tap the ${entry.letter}.`;
  }
  if (step === 'listen') return `Find the sound ${sound}.`;
  const pic = (trial && trial.picture) || entry;
  return `${soundPhrase(entry, pic.word)}!`;
}

function instructionBar(line) {
  return el('div', { class: 'instruction stage-instruction' },
    el('div', { class: 'instruction-left' },
      el('span', { class: 'megaphone', role: 'presentation' }, icon('sfx')),
      el('p', {}, line),
    ),
  );
}

function replayBeat(entry, step, trial) {
  if (step === 'payoff') return;
  audio.speakStageBeat(step, entry);
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
    const card = el('button', {
      class: 'pillow stage-hang',
      type: 'button',
      'aria-label': `Letter ${choice.letter}`,
    },
      el('span', { class: 'stage-glyph' }, trial.hunt === 'lower' ? choice.lower : choice.letter),
    );
    pressable(card, () => {
      if (trial.locked || trial.found.includes(choice.id)) return;
      audio.unlock();
      squash(card);
      const result = round.tapChoose(choice.id);
      if (!result) return;
      if (result === 'wrong') {
        wobble(card);
        audio.sfx('wrong');
        const nudge = audio.nudge();
        lucy.say(nudge, { syncTalk: true });
        return;
      }
      const voiced = audio.sayPhoneme(entry);
      card.classList.add('is-found');
      card.setAttribute('aria-disabled', 'true');
      if (result === 'right') {
        lucy.setState('celebrating');
        lucy.say('Yes!', { voice: false });
        afterRight(ctx, root, entry.letter, voiced);
      }
    });
    if (trial.found.includes(choice.id)) {
      card.classList.add('is-found');
      card.setAttribute('aria-disabled', 'true');
    }
    if (round.getRound().hinted && choice.target) card.classList.add('hinted');
    row.append(card);
  });
  return row;
}

function listenSucceeded(ctx, root, entry, lucy) {
  const voiced = audio.sayPhoneme(entry);
  lucy.setState('celebrating');
  lucy.say('You found it!', { voice: false });
  afterRight(ctx, root, entry.letter, voiced);
}

function listenBoard(entry, trial, ctx, root, lucy) {
  return listenPictureBoard(entry, trial, ctx, root, lucy);
}

function listenPictureBoard(entry, trial, ctx, root, lucy) {
  const sound = entry.phoneme || `/${entry.lower}/`;
  const replay = el('button', {
    class: 'pillow stage-listen-replay',
    type: 'button',
    'aria-label': `Hear the sound ${sound} again`,
  }, el('span', { class: 'stage-replay-face' }, icon('sfx', { size: 72 })));
  pressable(replay, () => {
    audio.unlock();
    squash(replay);
    audio.sayPhoneme(entry);
  });

  const pics = el('div', { class: 'stage-listen-pics' });
  let targetBtn = null;
  (trial.pictures || []).forEach((pic) => {
    const btn = el('button', {
      class: 'pillow stage-plate stage-listen-pic',
      type: 'button',
      'aria-label': `${pic.word}, ${soundPhrase(letterByChar(pic.letter) || entry, pic.word)}`,
    },
      picturePlate(pic, { size: 'card' }),
      el('span', { class: 'stage-word' }, pic.word),
    );
    if (round.getRound().hinted && pic.target) btn.classList.add('hinted');
    if (pic.target) targetBtn = btn;
    pressable(btn, () => {
      if (trial.locked) return;
      audio.unlock();
      squash(btn);
      const result = round.tapListen(pic.choiceId);
      if (result === 'wrong') {
        wobble(btn);
        audio.sfx('wrong');
        round.maybeHint();
        if (round.getRound().hinted && targetBtn) targetBtn.classList.add('hinted');
        audio.sayPhoneme(entry).then(() => {
          const nudge = audio.nudge();
          lucy.say(nudge, { syncTalk: true });
        });
        return;
      }
      if (result === 'right') listenSucceeded(ctx, root, entry, lucy);
    });
    pics.append(btn);
  });
  return el('div', { class: 'stage-listen-p' }, replay, pics);
}

function payoffBoard(entry, trial, ctx, root, lucy) {
  const plates = el('div', { class: 'stage-payoff' });
  (trial.plates || []).forEach((pic) => {
    const card = el('button', {
      class: 'pillow stage-plate',
      type: 'button',
      'aria-label': soundPhrase(entry, pic.word),
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

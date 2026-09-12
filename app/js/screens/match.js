/* Step A (case match) and Step B (picture match).

   Both are the same two-tap board, so they are the same module:
     ① tap a choice card  → blue ring + Selected badge, prompt starts pinging
     ② tap the prompt card (or the Match CTA) → submit

   A wrong submit wobbles and clears the selection. It never blocks, never
   scolds, and never ends the trial. */

import { el, icon, pressable, sparkBurst, flash, picturePlate, starRow } from '../ui.js';
import { createLucy } from '../lucy.js';
import { audio } from '../audio.js';
import { store } from '../store.js';
import * as round from '../round.js';

export const chrome = { tabs: true, tab: 'home', who: true };

let keyHandler = null;

export function teardown() {
  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  }
}

export function render(ctx) {
  const r = round.getRound();
  if (!r) { round.startRound(); return render(ctx); }

  const step = r.step;                      // 'case' | 'picture'
  const entry = round.currentLetter();
  if (!r.trial) round.buildTrial();
  const trial = r.trial;
  const settings = store.getSettings();
  if (!entry || !trial) {
    ctx.go('home');
    return el('div');
  }

  /* hunt is frozen on the trial (GAME-FLOW mix is 50/50 per letter). */
  const huntLower = (trial.hunt || 'lower') === 'lower';
  const promptWord = step === 'picture' ? 'Letter Pair' : (huntLower ? 'Big Letter' : 'Little Letter');
  const promptLabel = step === 'picture'
    ? `${entry.letter}${entry.lower}`
    : (huntLower ? entry.letter : entry.lower);

  const stepWords = step === 'picture'
    ? ['Tap a Picture', `Tap ${entry.letter}${entry.lower}`]
    : [huntLower ? 'Tap Little Letter' : 'Tap Big Letter', `Tap ${huntLower ? entry.letter : entry.lower}`];

  const tapTarget = step === 'picture'
    ? `${entry.letter}${entry.lower}`
    : (huntLower ? `Big ${entry.letter}` : `little ${entry.lower}`);
  const instructionText = step === 'picture'
    ? `What starts with the ${entry.phoneme} sound? Tap a picture, then tap ${entry.letter}${entry.lower} to match!`
    : `Find the ${huntLower ? 'little' : 'big'} letter! Tap your answer, then tap ${tapTarget} to match!`;

  const root = el('div', { class: `play play--${step}` });

  const w1 = el('span', { class: 'w1' }, stepWords[0]);
  const w2 = el('span', { class: 'w2' }, stepWords[1]);
  const stepChip = el('div', { class: 'twostep', dataset: { phase: 'pick' } },
    el('span', { class: 'n n1' }, '1'), w1,
    icon('next'),
    el('span', { class: 'n n2' }, '2'), w2,
  );

  const sockets = [0, 1, 2].map((i) =>
    el('span', { class: `socket${i < round.starsEarned() ? ' lit' : ''}` }, icon('star')));
  const socketBar = el('div', { class: 'socket-bar' },
    el('span', {}, `Round ${r.index + 1}/${r.letters.length}`), ...sockets);

  if (step === 'picture') {
    const misses = r.misses || 0;
    root.append(el('div', { class: 'trail-banner' },
      el('div', { class: 'trail-banner-left' },
        el('span', { class: 'trail-banner-ico' }, icon('cards')),
        el('div', {},
          el('h2', {}, `Letter Trail: ${entry.letter}${entry.lower}`),
          el('div', { class: 'sub' }, `Unit 1 · Phoneme Initial ${entry.phoneme}`),
        ),
      ),
      el('div', { class: 'trail-banner-right' },
        el('span', { class: 'star-power' },
          el('span', {}, 'Star Power'),
          starRow(round.starsEarned()),
          el('span', { class: 'miss-pill' }, `${misses} ${misses === 1 ? 'Miss' : 'Misses'}`),
        ),
        el('span', { class: 'chip' }, `Print Labels: ${settings.showWords ? 'ON' : 'OFF'}`),
      ),
    ));
  } else {
    root.append(el('div', { class: 'play-top' }, stepChip, socketBar));
  }

  function lucyPrompt() {
    return step === 'picture'
      ? `What starts with the ${entry.phoneme} sound?`
      : `Find the ${huntLower ? 'little' : 'big'} letter!`;
  }
  const lucy = createLucy({
    state: 'teaching',
    variant: step === 'picture' ? 'circle' : 'card',
    cutout: true,
    line: lucyPrompt(),
  });

  const listenBtn = el('button', { class: 'pillow listen-btn', type: 'button' }, icon('sfx'), 'Listen');
  pressable(listenBtn, () => { audio.speak(instructionText); lucy.say(lucyPrompt(), { voice: false }); });

  const instructionP = step === 'picture'
    ? el('p', {}, 'What starts with the ', el('strong', {}, entry.phoneme), ' sound? Tap a picture, then tap ', el('strong', {}, `${entry.letter}${entry.lower}`), ' to match!')
    : el('p', {}, `Find the ${huntLower ? 'little' : 'big'} letter! Tap your answer, then tap `, el('strong', {}, tapTarget), ' to match!');

  if (step !== 'picture') {
    root.append(el('div', { class: 'instruction' },
      el('div', { class: 'instruction-left' },
        el('span', { class: 'megaphone' }, icon('campaign')),
        instructionP,
      ),
      listenBtn,
    ));
  }

  const soundHint = el('span', { class: 'chip chip--mint sound-hint' },
    el('i', { class: 'hint-dot' }),
    `Sounds like: ${entry.phoneme} as in ${entry.word}`);

  if (step === 'picture') {
    lucy.bubble.classList.add('bubble--asks');
    lucy.bubble.prepend(
      el('div', { class: 'lucy-asks-head' },
        el('span', {}, icon('sparkle'), ' Lucy Asks:'),
        el('button', {
          class: 'pillow listen-btn',
          type: 'button',
          'aria-label': 'Replay Lucy',
          onclick: () => { audio.speak(instructionText); lucy.replay(); },
        }, icon('sfx')),
      ),
    );
    const lineEl = lucy.bubble.querySelector('[data-line]');
    if (lineEl) {
      lineEl.textContent = '';
      lineEl.append('What starts with the ', el('span', { class: 'phoneme' }, entry.phoneme), ' sound?');
    }
  } else {
    lucy.bubble.append(soundHint);
  }

  const mood = el('span', { class: 'lucy-badge-mood' }, step === 'picture' ? 'Listening' : 'Teaching');
  if (step !== 'picture') {
    lucy.stage.append(
      el('div', { class: 'lucy-badge' },
        el('span', { class: 'lucy-badge-name' }, icon('school'), 'Teacher Lucy'),
        mood,
      ),
    );
  }

  const glyph = step === 'picture'
    ? el('span', { class: 'prompt-glyph' },
        el('span', { class: 'up' }, entry.letter),
        el('span', { class: 'low' }, entry.lower))
    : el('span', { class: 'prompt-glyph' }, huntLower ? entry.letter : entry.lower);

  const promptInner = step === 'picture'
    ? [
        el('div', { class: 'prompt-pair-row' },
          el('span', { class: 'prompt-disc prompt-disc--touch' }, icon('touch')),
          glyph,
          el('span', { class: 'prompt-disc prompt-disc--star' }, icon('star')),
        ),
        el('span', { class: 'chip' }, icon('bulb'),
          `Tap a picture that starts with ${entry.letter}, then tap ${entry.letter}${entry.lower} to match!`),
        el('span', { class: 'prompt-cue' }, icon('check'), 'Tap Here to Check Match!'),
      ]
    : [
        el('span', { class: 'prompt-tag' }, promptWord),
        el('span', { class: 'prompt-speak', role: 'presentation' }, icon('sfx')),
        glyph,
        el('span', { class: 'prompt-cue' }, icon('touch'), 'Tap to Match!'),
      ];

  const promptCard = el('button', {
    class: `pillow prompt-card${step === 'picture' ? ' prompt-card--pair' : ''}`,
    type: 'button',
    'aria-label': `${promptWord} ${promptLabel}. Tap here to complete the match.`,
  }, ...promptInner);

  const choicesWrap = el('div', { class: 'choices' });
  const cardFor = new Map();

  trial.choices.forEach((choice) => {
    const isPicture = step === 'picture';
    const pic = choice.picture || { word: choice.word, emoji: choice.emoji, letter: choice.letter };
    const glyphNode = isPicture
      ? picturePlate(pic, { size: 'pic' })
      : el('span', { class: 'glyph' }, huntLower ? choice.lower : choice.letter);

    const printWord = isPicture ? pic.word : choice.word;
    const wordNode = isPicture
      ? (settings.showWords
        ? el('span', { class: 'word-bar' },
            el('span', { class: 'word' },
              el('span', { class: 'lead' }, printWord.charAt(0).toUpperCase()),
              printWord.slice(1).toUpperCase()))
        : null)
      : el('span', { class: 'word' }, choice.word.toLowerCase());

    const card = el('button', {
      class: `pillow choice${isPicture ? ' choice--pic' : ''}`,
      type: 'button',
      'aria-pressed': 'false',
      dataset: { letter: choice.letter },
      'aria-label': isPicture
        ? `${pic.word}, starts with ${choice.phoneme}`
        : `Letter ${huntLower ? choice.lower : choice.letter}, ${choice.phoneme} as in ${choice.word}`,
    },
      isPicture ? el('span', { class: 'choice-speak' }, icon('sfx')) : null,
      isPicture
        ? el('span', { class: 'selected-check' }, icon('check'))
        : el('span', { class: 'selected-badge' }, icon('check'), 'Selected'),
      isPicture ? null : el('span', { class: 'phoneme-chip' }, icon('sfx'), choice.phoneme),
      glyphNode,
      wordNode,
      isPicture ? el('span', { class: 'starts-with' }, `Starts with ${choice.phoneme}`) : null,
    );

    pressable(card, () => onSelect(choice, card));
    cardFor.set(choice.letter, card);
    choicesWrap.append(card);
  });

  const sandbox = el('div', { class: 'sandbox' },
    el('div', { class: 'sandbox-head' },
      step === 'picture'
        ? el('span', { class: 'sandbox-title' }, icon('cards'), 'Pick the Sound Partner')
        : el('span', {}, `Step 1: Pick the matching ${huntLower ? 'little' : 'big'} letter`),
      el('small', {}, `${trial.choices.length} large touch cards`),
    ),
    choicesWrap,
  );

  const hintBtn = el('button', { class: 'pillow hint-btn', type: 'button' }, icon('bulb'), step === 'picture' ? 'Hint' : 'Give Hint');
  const matchBtn = el('button', { class: 'pillow cta', type: 'button' },
    icon('party'),
    step === 'picture' ? `Check ${entry.letter}${entry.lower}` : `Match ${entry.letter} & ${entry.lower}!`);

  pressable(hintBtn, giveHint);
  pressable(matchBtn, doSubmit);
  pressable(promptCard, doSubmit);

  const lucyCol = step === 'picture'
    ? el('div', { class: 'board-lucy' },
        el('div', { class: 'lucy-panel' }, lucy.stage, lucy.bubble))
    : el('div', { class: 'board-lucy' }, lucy.bubble, lucy.stage);

  const boardMain = step === 'picture'
    ? el('div', { class: 'board-main' },
        promptCard)
    : el('div', { class: 'board-main' },
        el('span', { class: 'prompt-label' }, huntLower ? 'Big Letter Target' : 'Little Letter Target'),
        promptCard,
        sandbox,
        el('div', { class: 'action-row' }, hintBtn, matchBtn),
      );

  root.append(el('div', { class: 'board' }, lucyCol, boardMain));

  if (step === 'picture') {
    root.append(sandbox);
    root.append(el('div', { class: 'hint-bar' },
      el('div', { class: 'hint-bar-copy' },
        el('span', { class: 'hint-ico' }, icon('bulb')),
        el('p', {}, 'Need a little hint? Lucy can bark the sound again anytime!'),
      ),
      el('div', { class: 'hint-bar-actions' }, hintBtn, matchBtn),
    ));
  }

  function paintSockets() {
    const lit = round.starsEarned();
    sockets.forEach((s, i) => s.classList.toggle('lit', i < lit));
  }

  function armSecondTap() {
    promptCard.classList.add('armed');
    matchBtn.classList.add('ready');
    w1.classList.add('step-done');
    stepChip.dataset.phase = 'match';
    const count = sandbox.querySelector('small');
    if (step === 'picture' && count) count.textContent = '1 choice selected';
  }

  function clearArm() {
    promptCard.classList.remove('armed');
    matchBtn.classList.remove('ready');
    w1.classList.remove('step-done');
    stepChip.dataset.phase = 'pick';
  }

  function glowAnswer() {
    const card = cardFor.get(trial.answer);
    if (!card) return;
    card.classList.add('hinted');
  }

  function giveHint() {
    const answer = round.useHint();
    glowAnswer();
    lucy.say(`Listen: ${entry.say}… ${entry.word} starts with ${entry.letter}!`, { voice: false });
    paintSockets();
    return answer;
  }

  function onSelect(choice, card) {
    if (trial.locked) return;
    round.select(choice.letter);
    cardFor.forEach((c) => {
      c.setAttribute('aria-pressed', String(c === card));
      c.classList.remove('wrong');
    });
    audio.sfx('select');
    if (step === 'picture') audio.sayWord(choice.picture || choice);
    else audio.sayPhoneme(choice);
    armSecondTap();
    const pickedWord = (choice.picture && choice.picture.word) || choice.word;
    lucy.say(step === 'picture'
      ? `You picked ${pickedWord}! Now tap my ${entry.letter}${entry.lower}!`
      : `You picked ${huntLower ? 'little' : 'big'} ${huntLower ? choice.lower : choice.letter}! Now tap my ${promptWord} ${promptLabel}!`,
    { voice: false });
  }

  function doSubmit() {
    const picked = trial.selected;
    const result = round.submit();
    if (result === null) {
      flash(promptCard, 'wobble');
      lucy.say(step === 'picture' ? 'Pick a picture first!' : 'Pick a card first!');
      return;
    }
    if (result === 'wrong') {
      const missed = cardFor.get(picked) || null;
      audio.sfx('wrong');
      flash(promptCard, 'wobble');
      cardFor.forEach((c) => {
        c.setAttribute('aria-pressed', 'false');
        if (c === missed) { c.classList.add('wrong'); setTimeout(() => c.classList.remove('wrong'), 600); }
      });
      clearArm();
      const nudge = audio.nudge();
      lucy.say(nudge, { voice: false });
      paintSockets();
      if (r.hinted) {
        glowAnswer();
        if (r.misses === (r.hintAfter || store.getSettings().hintAfter)) {
          lucy.say(`Listen: ${entry.say}… ${entry.word} starts with ${entry.letter}!`, { voice: false });
        }
      }
      return;
    }

    const card = cardFor.get(entry.letter);
    audio.sfx('right');
    const cheer = audio.cheer();
    clearArm();
    cardFor.forEach((c) => c.classList.add('locked'));
    if (card) {
      card.classList.add('right');
      flash(card, 'leap', 560);
      sparkBurst(card);
    }
    lucy.setState('celebrating');
    mood.textContent = 'Cheering!';
    const matched = (round.currentPicture() && round.currentPicture().word) || entry.word;
    lucy.say(step === 'picture'
      ? `${cheer} ${entry.letter}${entry.lower} is for ${matched}!`
      : `${cheer} Big ${entry.letter} and little ${entry.lower} make ${entry.say}!`,
    { voice: false });
    paintSockets();
    setTimeout(() => {
      const next = round.advance();
      ctx.go(next === 'home' ? 'home' : 'play');
    }, 1250);
  }

  teardown();
  keyHandler = (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === 'Escape') { event.preventDefault(); ctx.go('home'); return; }
    if (event.key === 'Enter') { event.preventDefault(); doSubmit(); return; }
    const n = parseInt(event.key, 10);
    if (n >= 1 && n <= trial.choices.length) {
      event.preventDefault();
      const choice = trial.choices[n - 1];
      onSelect(choice, cardFor.get(choice.letter));
    }
  };
  document.addEventListener('keydown', keyHandler);

  setTimeout(() => audio.sayLetterName(entry.letter), 260);

  return root;
}

export function footLeft() { return el('span', {}, icon('star'), ' Two taps: choice, then prompt'); }

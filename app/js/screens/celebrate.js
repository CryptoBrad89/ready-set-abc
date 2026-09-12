/* Step C — celebration. Stars land, Lucy puts her bows on, the trophy card
   says "Aa is for Apple", the sticker drops into the Star Pouch, and the
   round rail shows where we are.

   PLAN §Round shape: celebrate is ≤8s and skippable. The juice (confetti,
   balloons, star chimes, Lucy's line) settles itself after CELEBRATE_MS, and
   Skip / a tap on the background / Esc settles it on the spot. The buttons
   are live from the first frame — nothing here ever blocks the next letter. */

import { el, icon, pressable, picturePlate } from '../ui.js';
import { createLucy } from '../lucy.js';
import { audio } from '../audio.js';
import { store } from '../store.js';
import { toggleWear, wornHas, wornOutfitId, nextTreat, nextTreatNudge } from '../closet.js';
import { burstConfetti } from '../motion.js';
import * as round from '../round.js';

export const chrome = { tabs: true, tab: 'home', who: true };

const CONFETTI = ['#FF5252', '#FFB800', '#26C281', '#29B6F6', '#FFD54F'];
const CELEBRATE_MS = 8000;   // hard cap on the party (PLAN: ≤8s, skippable)

let timers = [];
let keyHandler = null;

export function teardown() {
  timers.forEach(clearTimeout);
  timers = [];
  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  }
}

export function render(ctx) {
  const r = round.getRound();
  if (!r) { ctx.go('home'); return el('div'); }

  const entry = round.currentLetter();
  const stars = r.results[entry.letter] !== undefined ? r.results[entry.letter] : round.bankLetter();
  const isLast = r.index >= r.letters.length - 1;
  /* Mid-round this is the next letter in the set; at the end of a round it is
     the ABC cursor (nextAbcIndex) or the pin — so the button names the letter
     that actually opens, instead of a vague "Play again". */
  const nextEntry = round.upNextLetter();
  const pic = round.currentPicture() || { word: entry.word, emoji: entry.emoji, letter: entry.letter };
  const sticker = r.sticker || null;
  const treat = r.unlockedTreat || null;
  const bonus = round.bonusSummary();

  const root = el('div', { class: `celebrate${isLast ? ' celebrate--round' : ''}` });

  /* --- the 8-second cap ------------------------------------------------ */
  teardown();
  const wait = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
  let settled = false;
  function settle() {
    if (settled) return;
    settled = true;
    timers.forEach(clearTimeout);
    timers = [];
    root.classList.add('is-settled');       // confetti + balloons stop, stars stay
    audio.stopVoice();
  }
  wait(settle, CELEBRATE_MS);
  root.addEventListener('pointerdown', (event) => {
    const hit = event.target;
    if (hit && hit.closest && hit.closest('button')) return;   // a control is not a skip
    settle();
  });

  /* festive floaters */
  const floaters = el('div', { class: 'floaters', 'aria-hidden': 'true' },
    el('span', { class: 'balloon balloon-1' }),
    el('span', { class: 'balloon balloon-2' }),
    el('span', { class: 'floater-star s1' }, icon('star')),
    el('span', { class: 'floater-star s2' }, icon('sparkle')),
  );
  for (let i = 0; i < 14; i += 1) {
    floaters.append(el('span', {
      class: 'confetti',
      style: {
        left: `${5 + Math.random() * 90}%`,
        background: CONFETTI[i % CONFETTI.length],
        animationDelay: `${Math.random() * 4}s`,
        animationDuration: `${3.4 + Math.random() * 2.4}s`,
      },
    }));
  }
  root.append(floaters);
  burstConfetti({ y: 0.35, count: 64 });

  /* --- star tray ------------------------------------------------------- */
  const tray = el('div', { class: 'star-tray' });
  for (let i = 0; i < 3; i += 1) {
    const s = el('span', { class: `big-star${i < stars ? '' : ' dim'}` },
      icon('star'),
      i < stars ? el('span', { class: 'star-spark', 'aria-hidden': 'true' }, icon('sparkle')) : null,
    );
    if (i < stars) {
      s.classList.add('pop');
      s.style.animationDelay = `${180 + i * 260}ms`;
      wait(() => audio.sfx('star', i), 200 + i * 260);
    }
    tray.append(s);
  }
  const tagCopy = stars === 3 ? 'Perfect Match! 3 of 3 Stars'
    : stars === 2 ? 'Nice Work! 2 of 3 Stars'
    : 'You Did It! 1 of 3 Stars';
  const tag = el('span', { class: 'chip chip--mint accuracy-tag' }, icon('verified'), ` ${tagCopy}`);

  /* Skip: settles the party without touching the buttons under it. */
  const skipBtn = el('button', { class: 'celebrate-skip', type: 'button', 'aria-label': 'Skip the celebration' },
    icon('next'), 'Skip');
  pressable(skipBtn, () => { settle(); audio.sfx('tap'); });

  const bonusChip = bonus
    ? el('span', {
      class: `chip bonus-chip${bonus.done ? ' chip--mint' : ''}`,
      title: `${bonus.found} of ${bonus.need}${bonus.misses ? ` · ${bonus.misses} bonus ${bonus.misses === 1 ? 'miss' : 'misses'} (free)` : ''}`,
    }, icon(bonus.done ? 'verified' : 'party'),
    ` Bonus: ${bonus.label}${bonus.done ? ' ✓' : ' · skipped'}`)
    : null;

  /* Everything above the buttons shares one scroller. The trophy is a fixed
     lump of a card and on a 768px Chromebook it used to overflow its grid row
     and sit on top of the Star Pouch hand-off underneath it. Now it pushes
     instead of covering, and the Next button never leaves the screen. */
  const scroll = el('div', { class: 'celebrate-scroll' });
  root.append(scroll);

  scroll.append(el('div', { class: 'celebrate-head' },
    skipBtn,
    tray,
    el('div', { class: 'celebrate-tags' }, tag, bonusChip),
  ));

  /* --- Lucy + trophy --------------------------------------------------- */
  const lucy = createLucy({
    state: 'celebrating',
    variant: 'card',
    cutout: true,
    line: `You matched letter ${entry.letter}!`,
    paw: () => {
      audio.sfx('woof');
      lucy.say(`Woohoo! You matched letter ${entry.letter}!`);
    },
  });
  lucy.bubble.prepend(el('p', { class: 'bubble-kicker' }, 'Woohoo! 🎉'));

  const hearAgain = el('button', { class: 'pillow hear-again', type: 'button' }, icon('sfx'), 'Hear Again');
  pressable(hearAgain, () => {
    audio.sayPhoneme(entry);
    setTimeout(() => audio.sayWord(pic), 550);
    lucy.say(`${entry.say}… ${pic.word}!`, { voice: false });
  });

  const trophy = el('div', { class: 'trophy' },
    el('div', { class: 'trophy-ribbon' },
      el('span', {}, icon('trophy'), 'PHONICS TROPHY'),
      el('span', { class: 'trophy-dots' },
        el('i', { style: { background: '#FF5252' } }),
        el('i', { style: { background: '#FFB800' } }),
        el('i', { style: { background: '#26C281' } }),
      ),
    ),
    el('div', { class: 'trophy-body' },
      el('div', { class: 'trophy-pic' },
        el('span', { class: 'tasty-tag' }, 'Tasty Sound'),
        picturePlate(pic, { size: 'trophy' })),
      el('div', { class: 'trophy-words' },
        el('div', { class: 'trophy-letters' },
          el('span', { class: 'up' }, entry.letter),
          el('span', { class: 'low' }, entry.lower),
        ),
        el('p', { class: 'trophy-isfor' }, 'is for ', el('b', {}, pic.word)),
        el('p', { class: 'trophy-sound' }, 'Phonic sound: ',
          el('b', {}, `${entry.phoneme} ${entry.phoneme} ${pic.word}`)),
        hearAgain,
      ),
    ),
    el('div', { class: 'trophy-confetti' }),
  );

  scroll.append(el('div', { class: 'celebrate-body' },
    el('div', { class: 'celebrate-lucy' }, lucy.bubble, lucy.stage),
    trophy,
  ));

  /* --- what went into the Star Pouch ------------------------------------ */
  const pouchRow = el('div', { class: 'pouch-drop' });

  /* Stars off (Grown-Ups → Play → Stars) means nothing is being kept, so
     there is no pouch to drop a sticker into and we do not pretend there is. */
  if (sticker && sticker.picture && store.progressMode() !== 'none') {
    const card = el('button', {
      class: 'pillow drop-card drop-card--sticker',
      type: 'button',
      'aria-label': `${sticker.picture.word} sticker. Tap to hear it.`,
    },
      el('span', { class: 'drop-kicker' }, icon('sparkle'),
        sticker.isNew ? ' New sticker!' : ' Sticker'),
      picturePlate(sticker.picture, { size: 'card' }),
      el('span', { class: 'drop-name' }, sticker.picture.word),
      el('span', { class: 'drop-sub' }, sticker.isNew ? 'Saved in your Star Pouch' : 'Already in your pouch'),
    );
    pressable(card, () => { audio.sayWord(sticker.picture); lucy.say(`${sticker.picture.word}!`, { voice: false }); });
    pouchRow.append(card);
  }

  if (treat) {
    /* The closet hook: stars unlocked a treat, and Lucy can put it on right
       here — the Star Pouch is where it lives afterwards. */
    const wearBtn = el('button', { class: 'pillow drop-wear', type: 'button' });
    const paintWear = () => {
      wearBtn.textContent = '';
      const on = wornHas(treat.id);
      wearBtn.append(icon(on ? 'verified' : 'touch'), on ? 'Lucy is wearing it' : `Put ${treat.name.toLowerCase()} on Lucy`);
      wearBtn.setAttribute('aria-pressed', String(on));
    };
    paintWear();
    pressable(wearBtn, () => {
      const now = toggleWear(treat.id);
      lucy.setOutfit();
      audio.sfx('pop');
      lucy.say(now === treat.id ? treat.line : 'Off it comes! Try another one in the pouch.');
      paintWear();
      if (ctx.foot) ctx.foot();   // the footer names what Lucy has on
    });

    pouchRow.append(el('div', { class: 'pillow drop-card drop-card--treat' },
      el('span', { class: 'drop-kicker' }, icon('pouch'), ' Lucy’s closet'),
      el('span', { class: 'drop-treat' }, treat.pic),
      el('span', { class: 'drop-name' }, treat.name),
      el('span', { class: 'drop-sub' }, `${treat.need} stars opened it`),
      wearBtn,
      el('span', { class: 'drop-foot' }, 'It lives in your Star Pouch now'),
    ));
  } else if (store.progressMode() !== 'none') {
    /* Nothing opened this time. The closet still gets a hand-off: the card
       names how close the next treat is, so the Star Pouch is somewhere the
       child is heading rather than a tab they never think about. */
    const soon = nextTreat();
    const nudge = nextTreatNudge();
    if (soon && nudge) {
      pouchRow.append(el('div', { class: 'pillow drop-card drop-card--soon' },
        el('span', { class: 'drop-kicker' }, icon('pouch'), ' Lucy’s closet'),
        el('span', { class: 'drop-treat' }, soon.pic),
        el('span', { class: 'drop-name' }, nudge),
        el('span', { class: 'drop-sub' }, 'Keep matching with Lucy!'),
      ));
    }
  }

  /* Pinned under the scroller, not inside it: on a 1366x768 cart Chromebook
     the stars and the trophy already fill the box, and a hand-off a four year
     old has to scroll to find is a hand-off that never happens. */
  if (pouchRow.childNodes.length) root.append(pouchRow);

  /* --- actions + round rail -------------------------------------------- */
  const againBtn = el('button', { class: 'pillow cta cta--quiet', type: 'button' },
    icon(isLast ? 'home' : 'replay'), isLast ? 'Home' : `Play ${entry.letter} Again`);
  pressable(againBtn, () => {
    audio.sfx('tap');
    if (isLast) { round.goHome(); ctx.go('home'); }
    else { round.replayLetter(); ctx.go('play'); }
  });

  const nextBtn = el('button', { class: 'pillow cta cta--next', type: 'button' },
    el('span', { class: 'play-disc' }, icon('next')),
    el('span', { class: 'play-words' },
      el('span', { class: 'play-small' }, isLast ? 'Round complete · next on the trail' : 'Next Adventure'),
      el('span', { class: 'play-big' }, `Play Letter ${nextEntry}`),
    ),
  );
  pressable(nextBtn, () => {
    audio.sfx('select');
    if (isLast) {
      round.playAgain();
      ctx.go('play');
    } else if (round.nextLetter()) {
      ctx.go('play');
    } else {
      round.goHome();
      ctx.go('home');
    }
  });

  const rail = el('div', { class: 'progress-rail' });
  round.roundProgress().forEach((p, i) => {
    if (i) rail.append(el('span', { class: 'rail-sep' }, icon('chevron')));
    /* Stitch step_c: the letter we just finished is done; the next one is active. */
    const state = i < r.index ? 'done' : i === r.index ? 'done' : i === r.index + 1 ? 'active' : 'next';
    const badge = el('div', { class: `rail-badge ${state}` }, el('span', {}, p.letter));
    if (state === 'done') badge.append(icon('star'));
    else if (state === 'active') badge.append(el('span', { class: 'dot' }));
    else badge.append(icon('lock'));
    rail.append(badge);
  });

  root.append(el('div', { class: 'celebrate-actions' },
    el('div', { class: 'celebrate-buttons' }, againBtn, nextBtn),
    el('div', { class: 'progress-wrap' },
      el('div', { class: 'progress-copy' },
        el('span', { class: 'progress-ico' }, icon('taskdone')),
        el('div', {},
          el('div', { class: 'progress-title' }, 'Round Progress'),
          el('div', { class: 'progress-sub' }, isLast
            ? `Round of ${r.letters.length} done · the trail carries on at ${nextEntry}`
            : `Letter ${r.index + 1} of ${r.letters.length} completed in this set`),
        ),
      ),
      rail,
    ),
  ));

  wait(() => audio.cheer(), 400);
  wait(() => {
    audio.speak(`${stars} stars! ${entry.letter}${entry.lower} is for ${pic.word}.`);
  }, 1100);
  if (treat) wait(() => lucy.say(`You opened ${treat.name} for me! Put it on?`), 2600);

  keyHandler = (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === 'Escape') { event.preventDefault(); settle(); }
    if (event.key === 'Enter') { event.preventDefault(); settle(); nextBtn.click(); }
  };
  document.addEventListener('keydown', keyHandler);

  return root;
}

export function footLeft() {
  const worn = wornOutfitId();
  return el('span', {}, icon('star'),
    worn ? ' Stars stay on this device · Lucy is dressed from the Star Pouch' : ' Stars stay on this device');
}

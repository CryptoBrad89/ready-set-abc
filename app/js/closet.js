/* Lucy's closet — the Star Pouch reward shelf.

   Stars are the only currency and they are never spent: a treat unlocks at a
   star count and stays unlocked. One treat at a time can be WORN, and Lucy
   really wears it (js/lucy.js draws it) on every screen — that is the whole
   dress-up loop. No store, no coins, no timers (PLAN §research: durable
   dress-ups, not currency shops).

   The worn id lives in rsabc.outfit. store.js only checks that it is a slug —
   the list of real treats is here, so a treat that is renamed or removed just
   falls off Lucy instead of breaking the pouch. */

import { store } from './store.js';

export const TREATS = [
  { id: 'bows',    pic: '🎀', name: 'Party bows',     need: 3,  line: 'Bows on! Do I look fancy?' },
  { id: 'specs',   pic: '👓', name: 'Teacher specs',  need: 6,  line: 'Now I look like a teacher!' },
  { id: 'bone',    pic: '🦴', name: 'Big bone',       need: 9,  line: 'A bone for the best letter helper!' },
  { id: 'cap',     pic: '🧢', name: 'Ball cap',       need: 12, line: 'Cap on! Ready, set, ABC!' },
  { id: 'rainbow', pic: '🌈', name: 'Rainbow collar', need: 18, line: 'A rainbow collar! Every colour!' },
  { id: 'pack',    pic: '🎒', name: 'School pack',    need: 24, line: 'My school pack — let’s go learning!' },
];

export function treatById(id) {
  return TREATS.find((t) => t.id === id) || null;
}

export function isUnlocked(id, total = store.totalStars()) {
  const treat = treatById(id);
  return !!treat && total >= treat.need;
}

export function unlockedTreats(total = store.totalStars()) {
  return TREATS.filter((t) => total >= t.need);
}

/* The nearest treat the child has not opened yet — what the pouch and the
   celebrate card point at. null once all six are open. */
export function nextTreat(total = store.totalStars()) {
  return TREATS.find((t) => total < t.need) || null;
}

export function starsToNext(total = store.totalStars()) {
  const next = nextTreat(total);
  return next ? next.need - total : 0;
}

/* Treats crossed by this round's stars: before < need <= after.
   Celebrate uses it to say "Lucy unlocked Party bows!" exactly once.

   PACING INVARIANT: a letter banks at most 3 stars and no two treats sit
   closer than 3 apart, so one celebrate can only ever cross one treat —
   which is why round.js may safely hand the screen newlyUnlocked()[0].
   _flow.mjs holds the treat list to that gap; widen a gap freely, but
   narrowing one below 3 needs celebrate to show a list instead. */
export function newlyUnlocked(before, after) {
  return TREATS.filter((t) => before < t.need && after >= t.need);
}

/* What Lucy is actually wearing. A stored id the child has not unlocked (or
   that no longer exists) wears nothing — stars off means plain Lucy. */
export function wornTreat(total = store.totalStars()) {
  const treat = treatById(store.getOutfit());
  if (!treat || total < treat.need) return null;
  return treat;
}

export function wornOutfitId(total = store.totalStars()) {
  const treat = wornTreat(total);
  return treat ? treat.id : '';
}

/* Tap an unlocked treat to put it on; tap the worn one to take it off.
   Returns the id Lucy is wearing after the tap ('' = plain Lucy). */
export function toggleWear(id, total = store.totalStars()) {
  if (!isUnlocked(id, total)) return wornOutfitId(total);
  const next = store.getOutfit() === id ? '' : id;
  store.setOutfit(next);
  return wornOutfitId(total);
}

/* --------------------------------------------------------- kid-facing words
   Every word the closet says lives here, so the Star Pouch and the celebrate
   card can never drift apart — and so nothing in it scolds. A treat a child
   has not reached is not "locked" at them: the nearest one counts down ("2
   more stars"), the further ones name their number ("opens at 12 stars").
   The lock only ever exists as an affordance, never as a sentence. */

const plural = (n) => (n === 1 ? 'star' : 'stars');

export function treatStatus(treat, total = store.totalStars(), worn = wornOutfitId(total)) {
  if (!treat) return null;
  if (total >= treat.need) {
    const on = worn === treat.id;
    return {
      state: on ? 'worn' : 'ready',
      open: true,
      remaining: 0,
      label: on ? 'Lucy is wearing it!' : 'Tap to wear',
      aria: on
        ? `${treat.name}. Lucy is wearing this. Tap to take it off.`
        : `${treat.name}. Tap to put it on Lucy.`,
    };
  }
  const remaining = treat.need - total;
  const isNext = nextTreat(total) === treat;
  return {
    state: isNext ? 'next' : 'soon',
    open: false,
    remaining,
    label: isNext ? `${remaining} more ${plural(remaining)}` : `${treat.need} stars opens it`,
    aria: `${treat.name}. ${isNext
      ? `${remaining} more ${plural(remaining)} and it opens.`
      : `Opens at ${treat.need} stars.`} You have ${total} so far.`,
  };
}

/* How far along the run to this treat we are (0–1), measured from the treat
   before it — so the bar under "2 more stars" fills as the child plays
   instead of restarting from nothing at every milestone. */
export function treatProgress(treat, total = store.totalStars()) {
  const i = TREATS.indexOf(treat);
  if (i < 0) return 0;
  if (total >= treat.need) return 1;
  const floor = i > 0 ? TREATS[i - 1].need : 0;
  const span = treat.need - floor;
  return span > 0 ? Math.max(0, Math.min(1, (total - floor) / span)) : 0;
}

/* The one line above the shelf. It always has something true and warm to say,
   including at nought stars and with all six open. */
export function closetLine(total = store.totalStars(), worn = wornTreat(total)) {
  if (worn) return `Lucy is wearing: ${worn.name} · tap it again to take it off`;
  const next = nextTreat(total);
  if (!next) return 'Every treat is open! Tap one to dress Lucy';
  const need = starsToNext(total);
  if (!unlockedTreats(total).length) return `${need} more ${plural(need)} opens ${next.name} for Lucy`;
  return `Tap a treat to dress Lucy · ${need} more ${plural(need)} opens ${next.name}`;
}

/* Celebrate's pull-forward when this letter did not open anything: how close
   the next treat is now. Empty string when there is nothing to point at. */
export function nextTreatNudge(total = store.totalStars()) {
  const next = nextTreat(total);
  if (!next) return '';
  const need = starsToNext(total);
  return `${need} more ${plural(need)} opens ${next.name}`;
}

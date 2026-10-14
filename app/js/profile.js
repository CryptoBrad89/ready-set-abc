/* Who is on the tablet, and which letters they may work.

   Session is login, not a classroom flag. Roster first. A child tap sets a
   child session. The adult tile sets an adult session after the PIN.
   Work mode lives on the child record so Home and the path share one shape.

   nextLetter() is the one answer to "which letter opens next for this
   child". Home, rounds, the trail, Arcade, stories, the Grown-Ups preview,
   the family note and the celebrate CTA all ask it, so they cannot disagree. */

import { store } from './store.js';
import { activeKid, letters } from './data.js';
import { isPlayable, allClouds, isCloudUnlocked, letterCompleted, letterMastered } from './clouds.js';

export const WORK_MODES = ['satpin', 'assigned', 'free'];

export function satpinLetters() {
  const cloud = allClouds().find((c) => Number(c.id) === 1);
  return cloud && Array.isArray(cloud.letters) ? cloud.letters.slice() : ['S', 'A', 'T', 'P', 'I', 'N'];
}

/* SATPIN order through every cloud that is open, Cloud 1 first. The
   Revision cloud repeats earlier letters; each letter is listed once. */
export function cloudOrder() {
  const seen = new Set();
  const out = [];
  allClouds().filter((c) => isCloudUnlocked(c.id)).forEach((c) => {
    c.letters.forEach((L) => {
      if (seen.has(L)) return;
      seen.add(L);
      out.push(L);
    });
  });
  return out.length ? out : satpinLetters();
}

export function alphabet() {
  const list = letters().map((entry) => entry.letter).filter((ch) => /^[A-Z]$/.test(ch));
  return list.length ? list : [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
}

export function workModeOf(kid = activeKid()) {
  const mode = kid && kid.workMode;
  return WORK_MODES.includes(mode) ? mode : 'satpin';
}

export function assignedLettersOf(kid) {
  if (!kid || !Array.isArray(kid.assignedLetters)) return [];
  const seen = new Set();
  const out = [];
  kid.assignedLetters.forEach((ch) => {
    const L = String(ch || '').toUpperCase();
    if (!/^[A-Z]$/.test(L) || seen.has(L)) return;
    seen.add(L);
    out.push(L);
  });
  return out;
}

/* The child's work, in teaching order: cloud order for SATPIN, the
   grown-up's order for assigned letters, A–Z for free play. */
export function workLetters(kid = activeKid()) {
  const mode = workModeOf(kid);
  if (mode === 'free') return alphabet();
  if (mode === 'assigned') {
    const list = assignedLettersOf(kid);
    return list.length ? list : satpinLetters();
  }
  return cloudOrder();
}

export function isLetterOpen(ch, kid = activeKid()) {
  const L = String(ch || '').toUpperCase();
  if (!/^[A-Z]$/.test(L)) return false;
  const mode = workModeOf(kid);
  if (mode === 'free') return true;
  if (mode === 'assigned') return workLetters(kid).includes(L);
  return isPlayable(L);
}

function openWork(kid) {
  return workLetters(kid).filter((L) => isLetterOpen(L, kid));
}

/* The letter of the day only counts when it is part of this child's work. */
export function pinFor(kid = activeKid()) {
  const pin = String(store.getPinnedLetter() || '').toUpperCase();
  return pin && openWork(kid).includes(pin) ? pin : null;
}

export function nextLetter(kid = activeKid(), want = null) {
  const order = openWork(kid);
  if (!order.length) return workLetters(kid)[0] || satpinLetters()[0];
  const asked = String(want || '').toUpperCase();
  if (asked && order.includes(asked)) return asked;
  const pin = pinFor(kid);
  if (pin) return pin;
  return order.find((L) => !letterCompleted(L))
    || order.find((L) => !letterMastered(L))
    || order[0];
}

/* `size` letters of this child's work starting at `first`, wrapping. */
export function roundLetters(first, size, kid = activeKid()) {
  const order = openWork(kid);
  if (!order.length) return [nextLetter(kid)];
  const start = Math.max(0, order.indexOf(String(first || '').toUpperCase()));
  const n = Math.max(1, Math.min(size, order.length));
  const out = [];
  for (let k = 0; k < n; k += 1) out.push(order[(start + k) % order.length]);
  return out;
}

export function startLetter(want, kid = activeKid()) {
  return nextLetter(kid, want);
}

export function isArcadeLocked(kid = activeKid()) {
  return !!(kid && kid.arcadeLocked);
}

export function hasSession() {
  if (store.getSessionRole() === 'adult') return true;
  return !!activeKid();
}

export function needsRoster() {
  return !hasSession();
}

export function enterChild(id) {
  store.setKidId(id);
}

export function enterAdult() {
  store.setAdultSession();
}

export function leaveSession() {
  store.clearSession();
}

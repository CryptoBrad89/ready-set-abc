/* Who is on the tablet, and which letters they may work.

   Session is login, not a classroom flag. Roster first. A child tap sets a
   child session. The adult tile sets an adult session after the PIN.
   Work mode lives on the child record so Home and the path share one shape. */

import { store } from './store.js';
import { activeKid, letters } from './data.js';
import { playStartLetter as cloudStart, isPlayable, allClouds } from './clouds.js';

export const WORK_MODES = ['satpin', 'assigned', 'free'];

export function satpinLetters() {
  const cloud = allClouds().find((c) => Number(c.id) === 1);
  return cloud && Array.isArray(cloud.letters) ? cloud.letters.slice() : ['S', 'A', 'T', 'P', 'I', 'N'];
}

export function alphabet() {
  const list = letters().map((entry) => entry.letter).filter((ch) => /^[A-Z]$/.test(ch));
  return list.length ? list : [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
}

export function workModeOf(kid) {
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

export function workLetters(kid = activeKid()) {
  const mode = workModeOf(kid);
  if (mode === 'free') return alphabet();
  if (mode === 'assigned') {
    const list = assignedLettersOf(kid);
    return list.length ? list : satpinLetters();
  }
  return satpinLetters();
}

export function isLetterOpen(ch, kid = activeKid()) {
  const L = String(ch || '').toUpperCase();
  if (!/^[A-Z]$/.test(L)) return false;
  const mode = workModeOf(kid);
  if (mode === 'free') return true;
  if (mode === 'assigned') return workLetters(kid).includes(L);
  return isPlayable(L);
}

export function startLetter(want, kid = activeKid()) {
  const asked = String(want || '').toUpperCase();
  const allowed = workLetters(kid);
  if (asked && allowed.includes(asked) && isLetterOpen(asked, kid)) return asked;
  const pin = store.getPinnedLetter();
  if (pin && allowed.includes(pin) && isLetterOpen(pin, kid)) return pin;
  const hole = allowed.find((L) => isLetterOpen(L, kid));
  return hole || allowed[0] || cloudStart(want);
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

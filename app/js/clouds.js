/* SATPIN cloud path. Content lists five clouds; only unlocked clouds are
   playable. A letter is "awake" for play when it sits in an unlocked cloud.
   Teacher pin only starts PLAY when that letter is in the open cloud. */

import { store } from './store.js';

const cache = { clouds: [] };

export function setClouds(list) {
  cache.clouds = Array.isArray(list) ? list.filter((c) => c && Array.isArray(c.letters)) : [];
  return cache.clouds;
}

export function allClouds() { return cache.clouds; }

export function cloudById(id) {
  return cache.clouds.find((c) => c.id === Number(id)) || null;
}

export function cloudForLetter(ch) {
  const L = String(ch || '').toUpperCase();
  return cache.clouds.find((c) => c.letters.includes(L)) || null;
}

export function teacherUnlock() {
  const n = Number(store.getSettings().cloudUnlock);
  return Number.isFinite(n) ? Math.max(1, Math.min(5, n)) : 1;
}

export function setTeacherUnlock(id) {
  store.setSetting('cloudUnlock', Math.max(1, Math.min(5, Number(id) || 1)));
}

export function maxUnlockedId() {
  const taught = teacherUnlock();
  let earned = 1;
  for (let i = 0; i < cache.clouds.length - 1; i += 1) {
    const cloud = cache.clouds[i];
    if (!cloudMastered(cloud.id)) break;
    earned = cache.clouds[i + 1] ? cache.clouds[i + 1].id : cloud.id;
  }
  return Math.max(taught, earned);
}

export function isCloudUnlocked(id) {
  return Number(id) <= maxUnlockedId();
}

export function openCloud() {
  const unlocked = cache.clouds.filter((c) => isCloudUnlocked(c.id));
  for (let i = 0; i < unlocked.length; i += 1) {
    if (!cloudMastered(unlocked[i].id)) return unlocked[i];
  }
  return unlocked[unlocked.length - 1] || cache.clouds[0] || null;
}

export function beatsFor(letter) {
  return store.beatsFor(letter);
}

export function setBeats(letter, n) {
  store.setBeats(letter, n);
}

export function markBeat(letter, beatIndex) {
  const next = Math.max(store.beatsFor(letter), beatIndex);
  store.setBeats(letter, next);
  return next;
}

export function letterMastered(ch) {
  return store.beatsFor(ch) >= 4;
}

export function cloudMastered(id) {
  const cloud = cloudById(id);
  if (!cloud || !cloud.letters.length) return false;
  return cloud.letters.every((L) => letterMastered(L));
}

export function cloudProgress(id) {
  const cloud = cloudById(id);
  if (!cloud) return { have: 0, need: 0 };
  const have = cloud.letters.reduce((n, L) => n + Math.min(4, store.beatsFor(L)), 0);
  return { have, need: cloud.letters.length * 4 };
}

export function isPlayable(ch) {
  const L = String(ch || '').toUpperCase();
  const cloud = cloudForLetter(L);
  return !!(cloud && isCloudUnlocked(cloud.id));
}

export function firstIncomplete(cloud = openCloud()) {
  if (!cloud) return 'P';
  const hole = cloud.letters.find((L) => !letterMastered(L));
  return hole || cloud.letters[0];
}

/* Pin is a highlight inside the open cloud. If the pin is outside it, PLAY
   ignores it and starts at the first incomplete letter of the open cloud. */
export function playStartLetter(want = null) {
  const open = openCloud();
  const asked = String(want || '').toUpperCase();
  if (asked && isPlayable(asked)) return asked;
  const pin = store.getPinnedLetter();
  if (pin && open && open.letters.includes(pin)) return pin;
  const cursor = store.getCursor();
  if (cursor && isPlayable(cursor)) return cursor;
  return firstIncomplete(open);
}

export function pinInOpenCloud() {
  const pin = store.getPinnedLetter();
  const open = openCloud();
  return pin && open && open.letters.includes(pin) ? pin : null;
}

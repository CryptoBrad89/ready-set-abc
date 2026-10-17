/* SATPIN cloud path. Content lists five clouds; only unlocked clouds are
   playable. A letter is "awake" for play when it sits in an unlocked cloud.

   Completed is not mastered. A letter is completed the first time a child
   runs all four beats in order. It is mastered after MASTERY_RUNS of those
   runs went without a hint, or when a grown-up marks it mastered. Only
   mastery opens the next cloud; a grown-up can still open clouds by hand. */

import { store, MASTERY_RUNS } from './store.js';

export { MASTERY_RUNS };

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

/* Beats only climb one at a time. A round opened on listen (the Home sound
   card) does not claim that meet and choose happened. */
export function markBeat(letter, beatIndex) {
  const have = store.beatsFor(letter);
  if (beatIndex > have + 1) return have;
  const next = Math.max(have, beatIndex);
  store.setBeats(letter, next);
  return next;
}

export function letterCompleted(ch) {
  return store.beatsFor(ch) >= 4;
}

export function letterMastered(ch) {
  return store.isMastered(ch);
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
  if (!cloud) return 'S';
  return cloud.letters.find((L) => !letterCompleted(L))
    || cloud.letters.find((L) => !letterMastered(L))
    || cloud.letters[0];
}

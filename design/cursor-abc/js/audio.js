/** Approved trim clips, plus optional Lucy lines. No invented letter sounds. */

import { getAudio } from "./store.js";

let book = null;
let generation = 0;
let current = null;
let ctx = null;
const lineReady = {};

export async function loadClips() {
  const res = await fetch("audio/clips.json");
  book = await res.json();
  await Promise.all(["listen", "yes", "again", "did-it"].map(async (name) => {
    try {
      const probe = await fetch(`voice/${name}.mp3`, { method: "HEAD" });
      lineReady[name] = probe.ok;
    } catch (err) {
      lineReady[name] = false;
    }
  }));
}

export function clipCount() {
  return book && Array.isArray(book.items) ? book.items.length : 0;
}

export function hasLine(name) {
  return !!lineReady[name];
}

function urlFor(id) {
  if (!book) return null;
  const item = book.items.find((entry) => entry.id === id);
  if (!item || !item.trimmed) return null;
  return `audio/${item.trimmed.split("/").pop()}`;
}

export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state === "suspended") ctx.resume();
}

function tone(freq, at, dur, gain) {
  if (!ctx || !getAudio().sfx) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.frequency.value = freq;
  osc.type = "sine";
  amp.gain.setValueAtTime(0.0001, at);
  amp.gain.exponentialRampToValueAtTime(gain, at + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

export function sfx(kind) {
  unlock();
  if (!ctx || !getAudio().sfx) return;
  const t = ctx.currentTime;
  if (kind === "tap") tone(520, t, 0.06, 0.04);
  if (kind === "yes") {
    tone(660, t, 0.12, 0.05);
    tone(880, t + 0.09, 0.16, 0.05);
  }
  if (kind === "miss") tone(220, t, 0.14, 0.04);
  if (kind === "star") tone(990, t, 0.18, 0.05);
}

function stop() {
  generation += 1;
  if (current) {
    current.pause();
    current = null;
  }
}

export function playUrls(urls) {
  if (!getAudio().voice) return;
  const mine = ++generation;
  const queue = urls.filter(Boolean);
  const step = (index) => {
    if (mine !== generation) return;
    if (index >= queue.length) {
      current = null;
      return;
    }
    const audio = new Audio(queue[index]);
    current = audio;
    audio.onended = () => step(index + 1);
    audio.onerror = () => step(index + 1);
    audio.play().catch(() => step(index + 1));
  };
  if (current) current.pause();
  step(0);
}

export function nameUrl(letter) {
  return urlFor(`${letter.toLowerCase()}-name`);
}

export function soundUrl(letter) {
  return urlFor(`${letter.toLowerCase()}-sound`);
}

export function playName(letter) {
  playUrls([nameUrl(letter)]);
}

export function playSound(letter) {
  playUrls([soundUrl(letter)]);
}

export function playMeet(letter, withListen) {
  const urls = [];
  if (withListen && lineReady.listen) urls.push("voice/listen.mp3");
  urls.push(nameUrl(letter), soundUrl(letter));
  playUrls(urls);
}

export function playRetry(letter, kind) {
  const urls = [];
  if (lineReady.again) urls.push("voice/again.mp3");
  urls.push(kind === "shape" ? nameUrl(letter) : soundUrl(letter));
  playUrls(urls);
}

export function playLongI() {
  playUrls([urlFor("i-long-extra")]);
}

export function playSoftG() {
  playUrls([urlFor("g-soft-extra")]);
}

export function playLine(name) {
  if (!lineReady[name]) return false;
  playUrls([`voice/${name}.mp3`]);
  return true;
}

export function quiet() {
  stop();
}

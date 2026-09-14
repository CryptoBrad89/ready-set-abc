import { el, icon, pressable } from '../ui.js';
import { createLucy } from '../lucy.js';
import { audio } from '../audio.js';

export const chrome = { tabs: true, tab: 'home', who: true };

export const LINE_MS = 2400;

export function lucyRhyme() {
  return {
    title: 'Rhymes & Songs',
    song: 'Lucy the Pup',
    lines: [
      'Lucy the pup, Lucy the pup,',
      'Wags her tail and looks up, up, up.',
      'Paw on the page, stars in a cup,',
      'Lucy the pup, Lucy the pup!',
    ],
  };
}

export function rhymeBeat(params, lineCount) {
  const raw = String((params && params[0]) || '').toLowerCase();
  if (!raw) return { kind: 'idle', i: -1 };
  if (raw === 'end') return { kind: 'end', i: lineCount - 1 };
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return { kind: 'idle', i: -1 };
  if (n > lineCount) return { kind: 'end', i: lineCount - 1 };
  return { kind: 'sing', i: n - 1 };
}

function hashFor(beat) {
  if (beat.kind === 'idle') return 'rhymes';
  if (beat.kind === 'end') return 'rhymes/end';
  return `rhymes/${beat.i + 1}`;
}

let advanceTimer = 0;

export function teardown() {
  clearTimeout(advanceTimer);
  advanceTimer = 0;
}

function liveShell() {
  return typeof document !== 'undefined' && !!document.getElementById('screen');
}

function scheduleNext(ctx, beat, lineCount) {
  teardown();
  if (!liveShell() || beat.kind !== 'sing') return;
  const next = beat.i + 1 >= lineCount
    ? { kind: 'end', i: lineCount - 1 }
    : { kind: 'sing', i: beat.i + 1 };
  advanceTimer = setTimeout(() => {
    if (next.kind === 'end') audio.sfx('cheer');
    ctx.go(hashFor(next));
  }, LINE_MS);
}

export function render(ctx) {
  const rhyme = lucyRhyme();
  const lines = rhyme.lines;
  const beat = rhymeBeat(ctx.params, lines.length);
  scheduleNext(ctx, beat, lines.length);

  const lucyLine = beat.kind === 'idle'
    ? 'Tap Play to sing with me!'
    : beat.kind === 'end'
      ? 'Sing it again?'
      : lines[beat.i];
  const lucy = createLucy({
    state: beat.kind === 'end' ? 'celebrating' : 'idle',
    cutout: true,
    line: lucyLine,
  });

  const verse = el('div', { class: 'rhyme-verse' });
  lines.forEach((line, i) => {
    const cls = beat.kind !== 'sing'
      ? 'rhyme-line'
      : (i === beat.i ? 'rhyme-line is-on' : 'rhyme-line is-wait');
    verse.append(el('p', { class: cls }, line));
  });

  const nav = el('div', { class: 'rhyme-nav' });
  if (beat.kind === 'sing') {
    nav.append(el('span', { class: 'chip' }, `${beat.i + 1} / ${lines.length}`));
  } else {
    const play = el('button', {
      class: 'pillow rhyme-play',
      type: 'button',
      'aria-label': beat.kind === 'end' ? 'Play song again' : 'Play song',
    }, icon(beat.kind === 'end' ? 'replay' : 'play'), beat.kind === 'end' ? ' Play again' : ' Play song');
    pressable(play, () => {
      audio.unlock();
      audio.sfx('select');
      ctx.go('rhymes/1');
    });
    nav.append(play);
  }

  return el('div', { class: 'rhyme' },
    el('div', { class: 'trail-head' },
      el('h1', {}, icon('music'), ' ', rhyme.title),
      el('span', { class: 'chip' }, rhyme.song),
    ),
    el('div', { class: 'trail-say' }, lucy.stage, lucy.bubble),
    verse,
    nav,
  );
}

export function footLeft() {
  return el('span', {}, icon('music'), ' Rhymes & Songs');
}

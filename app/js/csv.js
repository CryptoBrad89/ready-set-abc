/* Grown-Ups CSV — progress + settings for this tablet.
   Kid-facing screens never touch this. Google Sheets can open the file.
   Format rsabc-csv-v1 round-trips; older name,emoji,color class lists still import. */

import { store } from './store.js';
import { kids } from './data.js';

export const CSV_FORMAT = 'rsabc-csv-v1';

const COLUMNS = [
  'kind', 'key', 'value',
  'id', 'name', 'emoji', 'color',
  'workMode', 'assignedLetters', 'arcadeLocked',
  'letter', 'stars', 'rounds', 'bestStars', 'lastAt', 'notes',
  'stickerId', 'word', 'stickerEmoji',
];

const SETTING_KEYS = [
  'roundSize', 'choiceCount', 'showWords', 'caseMode', 'hintAfter', 'progressMode', 'bonusMode', 'cloudUnlock',
];

const DEVICE = '_device';

export function csvCell(value) {
  const s = String(value ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function serializeCsv(rows) {
  return rows.map((row) => row.map(csvCell).join(',')).join('\n') + '\n';
}

export function parseCsv(text) {
  const src = String(text ?? '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let i = 0;
  let inQuotes = false;
  while (i < src.length) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i += 2; continue; }
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += ch;
      i += 1;
      continue;
    }
    if (ch === '"') { inQuotes = true; i += 1; continue; }
    if (ch === ',') { row.push(cell); cell = ''; i += 1; continue; }
    if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      i += 1;
      continue;
    }
    if (ch === '\r') { i += 1; continue; }
    cell += ch;
    i += 1;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ''));
}

export function detectFormat(rows) {
  if (!rows || !rows.length) return 'empty';
  let i = 0;
  if (/^sep=/i.test(String(rows[0][0] || ''))) i = 1;
  if (!rows[i]) return 'empty';
  const header = rows[i].map((h) => String(h).trim().toLowerCase());
  if (header.includes('kind')) return 'backup';
  if (header.includes('name')) return 'roster';
  const first = String(rows[i][0] || '').trim().toLowerCase();
  if (['meta', 'setting', 'kid', 'letter', 'sticker'].includes(first)) return 'backup';
  return 'unknown';
}

function objectsFrom(rows) {
  if (!rows.length) return [];
  let start = 0;
  if (/^sep=/i.test(String(rows[0][0] || ''))) start = 1;
  const first = rows[start] || [];
  const looksHeader = first.some((c) => COLUMNS.includes(String(c).trim().toLowerCase()))
    || String(first[0] || '').trim().toLowerCase() === 'name';
  const header = looksHeader
    ? first.map((h) => String(h).trim())
    : COLUMNS;
  const body = looksHeader ? rows.slice(start + 1) : rows.slice(start);
  return body.map((r) => {
    const obj = {};
    header.forEach((h, i) => { obj[h] = r[i] ?? ''; });
    return obj;
  });
}

function field(row, ...names) {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== '') return row[name];
    const hit = Object.keys(row).find((k) => k.toLowerCase() === name.toLowerCase());
    if (hit && row[hit] !== '') return row[hit];
  }
  return '';
}

function boolCell(value) {
  return value ? 'true' : 'false';
}

function rowOf(values) {
  return COLUMNS.map((col) => (values[col] == null ? '' : values[col]));
}

function effectiveRoster(snap) {
  if (snap.hasRosterOverride && Array.isArray(snap.roster)) return snap.roster;
  return kids();
}

export function snapshotToCsv(snap) {
  const rows = [COLUMNS.slice()];
  const push = (values) => rows.push(rowOf(values));

  push({ kind: 'meta', key: 'format', value: CSV_FORMAT });
  push({ kind: 'meta', key: 'exportedAt', value: new Date().toISOString() });

  const settings = snap.settings || {};
  SETTING_KEYS.forEach((key) => {
    const value = settings[key];
    push({ kind: 'setting', key, value: value === true || value === false ? boolCell(value) : value });
  });

  const audio = snap.audio || {};
  ['music', 'sfx', 'voice'].forEach((key) => {
    push({ kind: 'setting', key, value: boolCell(!!audio[key]) });
  });

  push({ kind: 'setting', key: 'mode', value: snap.mode || 'center' });
  push({ kind: 'setting', key: 'hideChrome', value: boolCell(!!snap.hideChrome) });
  push({ kind: 'setting', key: 'classroom', value: boolCell(!!snap.classroom) });
  push({ kind: 'setting', key: 'outfit', value: snap.outfit || '' });
  push({ kind: 'setting', key: 'skin', value: snap.skin || 'comic' });
  push({ kind: 'setting', key: 'pinnedLetter', value: snap.pinnedLetter || '' });
  push({ kind: 'setting', key: 'nextAbcIndex', value: snap.nextAbcIndex ?? 0 });
  push({ kind: 'setting', key: 'kidId', value: snap.kidId || '' });
  push({ kind: 'setting', key: 'hasRosterOverride', value: boolCell(!!snap.hasRosterOverride) });
  /* Blank = the importing tablet keeps following its own data/roster.json. */
  push({ kind: 'setting', key: 'className', value: snap.className || '' });

  /* Device-owner lastPlayed has no kid row (we skip _device in the roster
     loop), so park it on a setting or a CSV backup loses "played today". */
  const deviceLastEarly = (snap.progress && snap.progress[DEVICE] && snap.progress[DEVICE].lastPlayed) || '';
  if (deviceLastEarly) {
    push({ kind: 'setting', key: 'deviceLastPlayed', value: deviceLastEarly });
  }

  const roster = effectiveRoster(snap);
  const notes = snap.notes || {};
  const progress = snap.progress || {};
  const stars = snap.stars || {};
  const stickers = snap.stickers || {};

  roster.forEach((kid) => {
    if (!kid || kid.id === DEVICE) return;
    const rec = progress[kid.id] || {};
    push({
      kind: 'kid',
      id: kid.id,
      name: kid.name,
      emoji: kid.emoji,
      color: kid.color,
      workMode: kid.workMode || '',
      assignedLetters: Array.isArray(kid.assignedLetters) ? kid.assignedLetters.join(' ') : '',
      arcadeLocked: boolCell(!!kid.arcadeLocked),
      lastAt: rec.lastPlayed || '',
      notes: notes[kid.id] || '',
    });
  });

  const owners = new Set([
    ...roster.map((k) => k && k.id).filter(Boolean),
    ...Object.keys(stars),
    ...Object.keys(stickers),
    ...Object.keys(progress),
    ...Object.keys(notes),
  ]);

  const lettersOf = (owner) => {
    const set = new Set([
      ...Object.keys(stars[owner] || {}),
      ...Object.keys((progress[owner] && progress[owner].letters) || {}),
    ]);
    return [...set].sort();
  };

  [...owners].sort().forEach((owner) => {
    lettersOf(owner).forEach((letter) => {
      const entry = (progress[owner] && progress[owner].letters && progress[owner].letters[letter]) || {};
      push({
        kind: 'letter',
        id: owner,
        letter,
        stars: stars[owner] && stars[owner][letter] != null ? stars[owner][letter] : '',
        rounds: entry.rounds != null ? entry.rounds : '',
        bestStars: entry.bestStars != null ? entry.bestStars : '',
        lastAt: entry.lastAt || '',
      });
    });
    (stickers[owner] || []).forEach((s) => {
      push({
        kind: 'sticker',
        id: owner,
        letter: s.letter,
        stickerId: s.id,
        word: s.word,
        stickerEmoji: s.emoji,
      });
    });
  });

  return serializeCsv(rows);
}

export function buildCsv() {
  return snapshotToCsv(store.exportSnapshot());
}

export function csvToSnapshot(textOrRows) {
  const rows = typeof textOrRows === 'string' ? parseCsv(textOrRows) : textOrRows;
  const objects = objectsFrom(rows);
  const snap = {
    settings: {},
    audio: {},
    mode: 'center',
    hideChrome: false,
    classroom: false,
    outfit: '',
    skin: 'comic',
    pinnedLetter: null,
    nextAbcIndex: 0,
    kidId: null,
    className: '',
    hasRosterOverride: false,
    roster: [],
    notes: {},
    stars: {},
    stickers: {},
    progress: {},
  };

  const putStar = (owner, letter, count) => {
    if (!owner || !letter) return;
    if (!snap.stars[owner]) snap.stars[owner] = {};
    snap.stars[owner][letter] = count;
  };
  const putProgress = (owner, letter, entry) => {
    if (!owner) return;
    if (!snap.progress[owner]) snap.progress[owner] = { lastPlayed: null, letters: {} };
    if (letter) snap.progress[owner].letters[letter] = entry;
  };

  objects.forEach((row) => {
    const kind = String(field(row, 'kind')).trim().toLowerCase();
    if (!kind) return;
    if (kind === 'meta') return;

    if (kind === 'setting') {
      const key = String(field(row, 'key')).trim();
      const value = field(row, 'value');
      if (SETTING_KEYS.includes(key)) snap.settings[key] = value;
      else if (key === 'music' || key === 'sfx' || key === 'voice') snap.audio[key] = value;
      else if (key === 'mode') snap.mode = String(value || 'center');
      else if (key === 'hideChrome') snap.hideChrome = value;
      else if (key === 'classroom') snap.classroom = value;
      else if (key === 'outfit') snap.outfit = String(value || '').trim();
      else if (key === 'skin') snap.skin = String(value || 'comic').trim();
      else if (key === 'pinnedLetter') snap.pinnedLetter = value || null;
      else if (key === 'nextAbcIndex') snap.nextAbcIndex = value;
      else if (key === 'kidId') snap.kidId = value || null;
      else if (key === 'hasRosterOverride') snap.hasRosterOverride = value;
      else if (key === 'className') snap.className = String(value || '').trim();
      else if (key === 'deviceLastPlayed') {
        const when = String(value || '').trim();
        if (when) {
          if (!snap.progress[DEVICE]) snap.progress[DEVICE] = { lastPlayed: null, letters: {} };
          snap.progress[DEVICE].lastPlayed = when;
        }
      }
      return;
    }

    if (kind === 'kid') {
      const id = String(field(row, 'id')).trim();
      const name = String(field(row, 'name')).trim();
      if (!id || id === DEVICE || !name) return;
      snap.roster.push({
        id,
        name,
        emoji: field(row, 'emoji') || '🐾',
        color: field(row, 'color') || '#5aa9f0',
        workMode: field(row, 'workMode'),
        assignedLetters: field(row, 'assignedLetters'),
        arcadeLocked: field(row, 'arcadeLocked'),
      });
      const notes = field(row, 'notes');
      if (notes) snap.notes[id] = notes;
      const last = field(row, 'lastAt', 'lastPlayed');
      if (last) {
        if (!snap.progress[id]) snap.progress[id] = { lastPlayed: last, letters: {} };
        else snap.progress[id].lastPlayed = snap.progress[id].lastPlayed || last;
      }
      return;
    }

    if (kind === 'letter') {
      const owner = String(field(row, 'id')).trim();
      const letter = String(field(row, 'letter')).trim().toUpperCase();
      if (!owner || !letter) return;
      const stars = field(row, 'stars');
      const rounds = field(row, 'rounds');
      const lastAt = field(row, 'lastAt');
      const bestStars = field(row, 'bestStars');
      if (stars !== '') putStar(owner, letter, stars);
      if (rounds !== '' || lastAt || bestStars !== '') {
        putProgress(owner, letter, {
          rounds: rounds || 0,
          lastAt: lastAt || null,
          bestStars: bestStars !== '' ? bestStars : (stars || 0),
        });
      }
      return;
    }

    if (kind === 'sticker') {
      const owner = String(field(row, 'id')).trim();
      if (!owner) return;
      if (!snap.stickers[owner]) snap.stickers[owner] = [];
      snap.stickers[owner].push({
        letter: field(row, 'letter'),
        id: field(row, 'stickerId'),
        word: field(row, 'word'),
        emoji: field(row, 'stickerEmoji'),
      });
    }
  });

  snap.classroom = ['1', 'true', 'yes', 'on', true].includes(
    typeof snap.classroom === 'string' ? snap.classroom.trim().toLowerCase() : snap.classroom,
  );
  snap.hideChrome = ['1', 'true', 'yes', 'on', true].includes(
    typeof snap.hideChrome === 'string' ? snap.hideChrome.trim().toLowerCase() : snap.hideChrome,
  );
  snap.hasRosterOverride = ['1', 'true', 'yes', 'on', true].includes(
    typeof snap.hasRosterOverride === 'string' ? snap.hasRosterOverride.trim().toLowerCase() : snap.hasRosterOverride,
  );
  if (typeof snap.kidId === 'string') snap.kidId = snap.kidId.trim() || null;
  if (typeof snap.pinnedLetter === 'string') snap.pinnedLetter = snap.pinnedLetter.trim() || null;

  return snap;
}

function applyLegacyRoster(rows) {
  const objects = objectsFrom(rows);
  const current = kids();
  const byName = new Map(current.map((k) => [String(k.name || '').trim().toLowerCase(), k]));
  const used = new Set();
  const next = [];
  objects.forEach((row, i) => {
    const name = String(field(row, 'name')).trim().slice(0, 18);
    if (!name) return;
    const prev = byName.get(name.toLowerCase());
    let id;
    if (prev && !used.has(prev.id)) {
      id = prev.id;
      used.add(prev.id);
    } else {
      id = `csv${i}`;
    }
    next.push({
      id,
      name,
      emoji: String(field(row, 'emoji') || (prev && prev.emoji) || '🐾').trim().slice(0, 8) || '🐾',
      color: String(field(row, 'color') || (prev && prev.color) || '#5aa9f0').trim().slice(0, 32) || '#5aa9f0',
    });
    const notes = field(row, 'notes');
    if (notes) store.setNote(id, notes);
  });
  if (!next.length) return { ok: false, format: 'roster', error: 'No children in that file.' };
  store.setRosterOverride(next);
  return {
    ok: true,
    format: 'roster',
    summary: `Class list is now ${next.length} children. Stars stay with matching names. Settings were not changed.`,
  };
}

function summarize(snap) {
  const nKids = (snap.roster || []).length;
  const nLetters = Object.values(snap.stars || {}).reduce((n, map) => n + Object.keys(map || {}).length, 0);
  const nStickers = Object.values(snap.stickers || {}).reduce((n, list) => n + (list ? list.length : 0), 0);
  const bits = [];
  if (snap.hasRosterOverride) bits.push(`${nKids} children`);
  bits.push(`${nLetters} letter scores`);
  if (nStickers) bits.push(`${nStickers} stickers`);
  bits.push('Grown-Ups settings');
  return `Restored ${bits.join(', ')}.`;
}

export function applyCsv(text) {
  const rows = parseCsv(text);
  const format = detectFormat(rows);
  if (format === 'empty') return { ok: false, error: 'That file is empty.' };
  if (format === 'unknown') return { ok: false, error: 'Not a Ready Set ABC CSV.' };
  if (format === 'roster') return applyLegacyRoster(rows);

  const objects = objectsFrom(rows);
  const kinds = objects.map((r) => String(field(r, 'kind')).trim().toLowerCase());
  const hasPayload = kinds.some((k) => ['setting', 'kid', 'letter', 'sticker'].includes(k));
  if (!hasPayload) return { ok: false, error: 'That CSV has no progress or settings.' };

  const snap = csvToSnapshot(rows);
  store.importSnapshot(snap);
  return { ok: true, format: 'backup', summary: summarize(snap), snapshot: snap };
}

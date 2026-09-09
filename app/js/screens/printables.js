/* Grown-Ups → Print — the day-one paper suite.

   Three printables, all built as plain DOM into #print-root and handed to
   window.print(). No server, no PDF library, no popup window: a cart
   Chromebook with the radio off can still print to the hall printer.

     1. Certificate  — letter + child's name, one per page (landscape).
     2. Small-group sheet — the 6–8 minute script, word bank, turn-taking grid.
     3. Roster cards — cut-apart name cards with an A–Z star strip.

   Geometry lives in css/print.css so the on-screen preview in this panel is
   the same object the printer gets. Nothing here is child-facing. */

import { el, clear } from '../ui.js';
import { store } from '../store.js';
import { kids, letters, letterByChar, picturesFor, className } from '../data.js';
import { phonemeText } from '../audio.js';
import { APP_VERSION } from '../version.js';

const CARDS_PER_PAGE = 8;
const BLANK_GROUP_ROWS = 8;

/* The star strip on a roster card is the whole trail, read off the content
   file — not a hard-coded slice of it. When the file wakes a letter the card
   grows a box for it on the next print, with no edit here. */
function trailLetters() {
  const all = letters().map((l) => l.letter);
  return all.length ? all : ['A'];
}

/* Panel state survives a repaint of the Grown-Ups sheet. */
const state = {
  letter: null,        // null = follow the pinned letter / ABC cursor
  pinSeen: null,       // the pin this panel last synced against
  who: 'class',        // class | today | one | blank
  groupNames: true,    // fill the turn-taking grid from the roster
  cardStars: true,     // print earned stars on the roster cards
  preview: null,       // null | 'cert' | 'group' | 'roster'
};

let notice = {
  text: 'Prints straight from the tablet. Certificates ask for landscape and the other two are upright — a browser that ignores that still fits them on portrait paper.',
  tone: '',
};

/* --------------------------------------------------------------- data */
function letterEntry(ch) {
  const want = String(ch || '').toUpperCase();
  return letterByChar(want)
    || letterByChar(store.getCursor())
    || letters()[0]
    || { letter: 'A', lower: 'a', word: 'Apple', emoji: '🍎', phoneme: '/æ/', say: 'aaa' };
}

/* What actually prints.

   The panel's own pick wins, but only until the teacher moves the room: a pin
   change is the letter of the day changing, and a print override left over
   from last week must not quietly outlive it and send home 24 certificates
   for the wrong letter. Whatever comes out is checked against the content
   file, so the panel heading and the paper can never disagree. */
export function activeLetter() {
  const pinned = store.getPinnedLetter() || null;
  if (state.pinSeen !== pinned) {
    state.pinSeen = pinned;
    state.letter = null;
  }
  const want = String(state.letter || pinned || store.getCursor() || 'A').toUpperCase();
  const entry = letterByChar(want);
  return entry ? entry.letter : store.getCursor();
}

/* The Print panel's one-job override. Picking the letter that is already
   overridden releases it, which is what the picker's second tap means.
   Anything the content file does not have is refused rather than stored, so
   activeLetter() can never hand a sheet a letter that has no entry. */
export function setPrintLetter(ch) {
  activeLetter();                       // sync against the pin before we write
  const want = ch == null ? null : String(ch).toUpperCase();
  if (!want || want === state.letter || !letterByChar(want)) {
    state.letter = null;
    return;
  }
  state.letter = want;
}

function roster() { return kids() || []; }

/* Stars are banked per child only when Class → Face pick before play is on.
   With it off the tablet keeps ONE shared pouch under _device, so a per-child
   number would be a guess printed on paper that goes home. Print hollow boxes
   instead and let the panel say why. */
export function perChildStars() { return store.isClassroom(); }

function starsFor(kid, letter) {
  if (!kid || !perChildStars()) return 0;
  return store.getStars(kid.id)[letter] || 0;
}

function today() {
  return new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

/* Who gets a certificate. An empty list means "say so and print a blank". */
export function certificateTargets(who = state.who) {
  const list = roster();
  if (who === 'blank') return [null];
  /* Without face pick nobody is "playing" and nothing is filed per child, so
     these two can only ever come back empty. Fall back to the whole class
     rather than handing the teacher one blank page. */
  if (!perChildStars() && (who === 'one' || who === 'today')) return list;
  if (who === 'one') {
    const mine = list.find((k) => k.id === store.getKidId());
    return mine ? [mine] : [];
  }
  if (who === 'today') return list.filter((k) => store.playedToday(k.id));
  return list;
}

const EMPTY_NOTE = {
  today: 'Nobody has played today yet — printed one blank certificate.',
  one: 'Nobody is playing right now — printed one blank certificate.',
  class: 'The class list is empty — printed one blank certificate.',
};

/* -------------------------------------------------------- sheet parts */
function starStrip(count) {
  const row = el('div', { class: 'pstars', role: 'img', 'aria-label': `${count || 0} of 3 stars` });
  for (let i = 0; i < 3; i += 1) {
    const earned = i < (count || 0);
    row.append(el('i', { class: earned ? 'on' : '' }, earned ? '★' : '☆'));
  }
  return row;
}

function tile(entry, big) {
  return el('div', { class: `tile${big ? ' tile--big' : ''}` },
    el('b', {}, entry.letter),
    el('i', {}, entry.lower),
  );
}

function sheetHead(title, subtitle) {
  return el('div', { class: 'sheet-head' },
    el('div', { class: 'sheet-brand' }, 'Ready Set ABC', el('span', {}, subtitle || 'Pre-K Phonics with Lucy')),
    el('div', { class: 'sheet-title' }, title),
  );
}

function sheetFoot(right) {
  return el('div', { class: 'sheet-foot' },
    el('span', {}, `${className()} · Ready Set ABC`),
    el('span', {}, right || APP_VERSION),
  );
}

/* --------------------------------------------------------- certificate */
export function certificateSheet({ kid = null, letter } = {}) {
  const L = letterEntry(letter);
  const stars = starsFor(kid, L.letter);
  const name = kid ? kid.name : '';

  return el('div', { class: 'sheet sheet--cert' },
    el('div', { class: 'cert-frame' },
      el('div', { class: 'cert-eyebrow' }, 'Ready Set ABC'),
      el('h1', { class: 'cert-title' }, 'Letter Champion'),
      tile(L, true),
      el('p', { class: 'cert-lede' }, 'This certificate is proudly awarded to'),
      el('div', { class: `cert-name${name ? '' : ' is-blank'}` }, name),
      el('p', { class: 'cert-because' }, `for learning the letter ${L.letter}${L.lower} with Lucy.`),
      el('p', { class: 'cert-sound' },
        `${L.letter} is for ${L.word}. The sound is “${phonemeText(L)}” ${L.phoneme}.`),
      starStrip(stars),
      el('div', { class: 'cert-sign' },
        el('div', {}, el('u'), 'Date'),
        el('div', {}, el('u'), 'Teacher'),
      ),
      el('p', { class: 'cert-sound' }, className()),
    ),
  );
}

export function buildCertificates({ who = state.who, letter = activeLetter() } = {}) {
  const list = certificateTargets(who);
  if (!list.length) {
    return {
      nodes: [certificateSheet({ kid: null, letter })],
      note: EMPTY_NOTE[who] || EMPTY_NOTE.class,
      tone: '',
    };
  }
  return {
    nodes: list.map((kid) => certificateSheet({ kid, letter })),
    note: `${list.length} certificate${list.length === 1 ? '' : 's'} for letter ${String(letter).toUpperCase()}, one per page.`,
    tone: 'ok',
  };
}

/* ---------------------------------------------------- small-group sheet */
export function groupSheet({ letter = activeLetter(), names = true } = {}) {
  const L = letterEntry(letter);
  const sound = phonemeText(L);
  const pool = picturesFor(L.letter);
  /* Every name, not a truncated dozen: a teacher who prints the whole class
     would rather get a second page than quietly lose the back half of it. */
  const seats = names ? roster() : [];
  const rows = seats.length ? seats : new Array(BLANK_GROUP_ROWS).fill(null);

  const bank = el('ul', { class: 'wordbank' });
  pool.forEach((p) => bank.append(el('li', {}, p.word)));

  const table = el('table', { class: 'ptable' },
    el('thead', {}, el('tr', {},
      el('th', {}, 'Child'),
      el('th', {}, 'Case match'),
      el('th', {}, 'Picture match'),
      el('th', {}, `Says “${sound}”`),
      el('th', {}, 'What I noticed'),
    )),
  );
  const body = el('tbody');
  rows.forEach((kid) => {
    body.append(el('tr', {},
      el('td', { class: 'who' }, kid ? kid.name : ''),
      el('td', { class: 'tick' }, '☐'),
      el('td', { class: 'tick' }, '☐'),
      el('td', { class: 'tick' }, '☐'),
      el('td', { class: 'notes' }, ''),
    ));
  });
  table.append(body);

  return el('div', { class: 'sheet sheet--group' },
    sheetHead(`Small group · ${L.letter}${L.lower}`, 'Adult sheet — keep off the table'),
    el('div', { class: 'sheet-meta' },
      el('span', {}, 'Class: ', el('b', {}, className())),
      el('span', {}, 'Date: ', el('span', { class: 'fill' }, today())),
      el('span', {}, 'Adult: ', el('span', { class: 'fill' })),
      el('span', {}, 'Table: ', el('span', { class: 'fill' })),
    ),

    el('div', { class: 'group-hero' },
      tile(L),
      el('dl', {},
        el('dt', {}, 'Name'), el('dd', {}, `“${L.letter}” — say the letter name`),
        el('dt', {}, 'Sound'), el('dd', {}, `“${sound}” ${L.phoneme} — never the name on a card tap`),
        el('dt', {}, 'Anchor'), el('dd', {}, `${L.letter} is for ${L.word}`),
      ),
    ),

    el('div', { class: 'pblock' },
      el('h3', {}, 'Run it ', el('small', {}, '· 6–8 minutes, one tablet, pass it around')),
      el('ol', { class: 'pscript' },
        el('li', {}, el('b', {}, 'Warm up. '), `Everyone says the sound together three times — “${sound}, ${sound}, ${sound}”.`),
        el('li', {}, el('b', {}, 'Case match. '), `“Find the little ${L.lower}.” The child taps a card, then taps the big letter to lock it in.`),
        el('li', {}, el('b', {}, 'Picture match. '), `“Which picture starts with ${sound}?” Tap the picture, then tap ${L.letter}${L.lower}.`),
        el('li', {}, el('b', {}, 'Celebrate. '), 'Count the stars out loud together. 3 = clean, 2 = a wobble, 1 = a hint.'),
        el('li', {}, el('b', {}, 'Pass. '), 'Tap the name chip in the header to switch to the next child.'),
      ),
    ),

    el('div', { class: 'pblock' },
      el('h3', {}, 'Tablet setup ', el('small', {}, '· Grown-Ups, PIN 1234')),
      el('ul', { class: 'pscript' },
        el('li', {}, el('b', {}, 'Play · '), `Letters per round 1 · Answer cards 3 · pin letter ${L.letter}.`),
        el('li', {}, el('b', {}, 'Class · '), 'Face pick before play On, so stars land on the right child.'),
        el('li', {}, el('b', {}, 'Device · '), 'Small group (104px taps). Whiteboard if the group is standing.'),
      ),
    ),

    el('div', { class: 'pblock' },
      el('h3', {}, `Word bank · ${L.letter}`, el('small', {}, ' · tick the ones you heard')),
      bank,
    ),

    /* --flow: a long roster may split across pages rather than being shoved
       whole onto page 2 and leaving half a sheet blank. */
    el('div', { class: 'pblock pblock--flow' },
      el('h3', {}, 'Turn taking'),
      table,
    ),

    sheetFoot(`Letter ${L.letter} · ${pool.length} pictures in the pool`),
  );
}

/* ------------------------------------------------------- roster cards */
function rosterCard(kid, { stars = true } = {}) {
  const boxes = el('div', { class: 'rcard-letters' });
  trailLetters().forEach((ch) => {
    const got = stars ? starsFor(kid, ch) : 0;
    boxes.append(el('span', { class: got ? 'done' : '' }, ch, el('b', {}, got ? '★'.repeat(got) : ' ')));
  });

  /* Face and name on top, the whole alphabet strip underneath: 26 boxes have
     no room beside a 24mm face, and a strip that wraps mid-alphabet is worse
     to read at the cutting table than one that runs A–M / N–Z. */
  return el('div', { class: 'rcard' },
    el('div', { class: 'rcard-top' },
      el('div', { class: 'rcard-face', style: { background: kid.color || '#FFF8E1' } }, kid.emoji || '🐾'),
      el('div', { class: 'rcard-body' },
        el('div', { class: 'rcard-name' }, kid.name),
        el('div', { class: 'rcard-class' }, className()),
      ),
    ),
    boxes,
  );
}

export function rosterCardSheets({ stars = true } = {}) {
  const list = roster();
  if (!list.length) return [];
  /* With face pick off nothing is filed per child, so "show stars" would print
     empty boxes under a caption promising stars. Fold it down to the truth. */
  const showStars = stars && perChildStars();
  const pages = chunk(list, CARDS_PER_PAGE);
  return pages.map((page, i) => {
    const grid = el('div', { class: 'cardgrid' });
    page.forEach((kid) => grid.append(rosterCard(kid, { stars: showStars })));
    return el('div', { class: 'sheet sheet--roster' },
      sheetHead('Roster cards', `Cut along the dashed lines · page ${i + 1} of ${pages.length}`),
      el('div', { class: 'sheet-meta' },
        el('span', {}, 'Class: ', el('b', {}, className())),
        el('span', {}, 'Printed: ', el('b', {}, today())),
        el('span', {}, `${list.length} children`),
      ),
      grid,
      el('p', { class: 'rcard-cut' }, showStars
        ? 'Stars are this tablet’s best result per letter. Blank boxes are letters the child has not finished yet.'
        : 'Blank boxes — colour one star per letter as the child finishes it.'),
      sheetFoot(),
    );
  });
}

/* -------------------------------------------------------------- print */
let wiredAfterPrint = false;

function wireAfterPrint() {
  if (wiredAfterPrint) return;
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;
  wiredAfterPrint = true;
  /* Let the printer finish, then drop the paper DOM so it never lingers. */
  window.addEventListener('afterprint', () => {
    const host = document.getElementById('print-root');
    if (host) clear(host);
  });
}

export function printSheets(nodes) {
  const host = document.getElementById('print-root');
  /* A hole in the list would print as an empty page — every sheet in
     #print-root is a real .sheet or the job does not start. */
  const sheets = (nodes || []).filter(Boolean);
  if (!host || !sheets.length) return false;
  clear(host);
  sheets.forEach((node) => host.append(node));
  if (typeof window === 'undefined' || typeof window.print !== 'function') return false;
  wireAfterPrint();
  window.print();
  return true;
}

/* -------------------------------------------------------------- panel */
function setStatus(text, tone) {
  notice = { text, tone: tone || '' };
  const node = document.getElementById('print-status');
  if (!node) return;
  node.textContent = text;
  node.classList.toggle('is-ok', notice.tone === 'ok');
  node.classList.toggle('is-bad', notice.tone === 'bad');
}

function pseg(options, current, onPick, repaint) {
  const wrap = el('div', { class: 'seg' });
  options.forEach(([value, label]) => {
    const btn = el('button', { type: 'button', 'aria-pressed': String(value === current) }, label);
    btn.addEventListener('click', () => { onPick(value); repaint(); });
    wrap.append(btn);
  });
  return wrap;
}

/* A whole-class certificate run is 24 identical pages; nobody needs to scroll
   them at 42%. Show the first few and say how many are really going out. */
const PREVIEW_MAX = 3;

function previewBox(nodes) {
  const shown = nodes.slice(0, PREVIEW_MAX);
  const box = el('div', { class: 'print-preview' },
    el('p', { class: 'print-count' }, nodes.length > shown.length
      ? `${nodes.length} pages will print · showing the first ${shown.length} at 42%`
      : `${nodes.length} page${nodes.length === 1 ? '' : 's'} · shown at 42%`),
  );
  const scale = el('div', { class: 'sheet-scale' });
  shown.forEach((n) => scale.append(n));
  box.append(scale);
  return box;
}

function printCard({ id, title, note, control, build, repaint }) {
  const card = el('div', { class: 'gu-card' },
    el('h3', {}, title),
    el('p', { class: 'note' }, note),
    control || null,
  );

  const doPrint = () => {
    const { nodes, note: msg, tone } = build();
    if (!nodes.length) {
      setStatus('Nothing to print — the class list is empty. Add children on the Class tab.', 'bad');
      return;
    }
    const ok = printSheets(nodes);
    setStatus(ok ? msg : 'This browser would not open the print dialog.', ok ? (tone || 'ok') : 'bad');
  };

  const togglePreview = () => {
    state.preview = state.preview === id ? null : id;
    repaint();
  };

  card.append(el('div', { class: 'gu-actions' },
    el('button', { class: 'gu-btn gu-btn--primary', type: 'button', onclick: doPrint }, 'Print'),
    el('button', {
      class: 'gu-btn', type: 'button', 'aria-pressed': String(state.preview === id), onclick: togglePreview,
    }, state.preview === id ? 'Hide preview' : 'Preview'),
  ));

  if (state.preview === id) {
    const { nodes } = build();
    card.append(nodes.length
      ? previewBox(nodes)
      : el('p', { class: 'gu-status is-bad' }, 'Nothing to preview — the class list is empty.'));
  }
  return card;
}

export function printPanel({ repaint = () => {} } = {}) {
  const letter = activeLetter();
  const pinned = store.getPinnedLetter();
  const perChild = perChildStars();
  const playedCount = perChild ? roster().filter((k) => store.playedToday(k.id)).length : 0;
  const mine = perChild ? roster().find((k) => k.id === store.getKidId()) : null;
  /* Only offer a "who" the tablet can actually answer. With face pick off,
     Played today and Just this child have nobody to point at. */
  const whoOptions = perChild
    ? [['class', 'Whole class'], ['today', 'Played today'],
       ['one', mine ? `Just ${mine.name}` : 'Just this child'], ['blank', 'Blank name']]
    : [['class', 'Whole class'], ['blank', 'Blank name']];
  if (!whoOptions.some(([v]) => v === state.who)) state.who = 'class';

  const picker = el('div', { class: 'letter-picker' });
  letters().forEach((entry) => {
    const btn = el('button', {
      type: 'button',
      'aria-pressed': String(letter === entry.letter),
      title: `${entry.letter} is for ${entry.word}`,
    }, entry.letter);
    btn.addEventListener('click', () => {
      setPrintLetter(entry.letter);
      repaint();
    });
    picker.append(btn);
  });

  return el('div', { class: 'gu-panel' },
    el('div', { class: 'gu-card' },
      el('h3', {}, `Printing letter ${letter}`),
      el('p', { class: 'note' }, state.letter
        ? 'Print letter picked here. Tap it again to follow the Play tab again.'
        : (pinned
          ? `Following the pinned letter (${pinned}). Tap a letter to print a different one.`
          : `No letter pinned — following the ABC trail (${store.getCursor()}). Tap a letter to override.`)),
      picker,
      el('p', {
        class: `gu-status${notice.tone === 'ok' ? ' is-ok' : notice.tone === 'bad' ? ' is-bad' : ''}`,
        id: 'print-status',
      }, notice.text),
    ),

    printCard({
      id: 'cert',
      title: 'Certificate',
      note: 'One landscape page per child: the letter, the child’s name, the sound, and their stars. Signature and date lines are blank. The page asks the browser for landscape itself — if yours prints it upright, set Layout → Landscape in the dialog.',
      control: el('div', { class: 'gu-row' },
        el('div', {},
          el('div', { class: 'gu-label' }, 'Who'),
          el('div', { class: 'gu-desc' }, perChild
            ? `${roster().length} on the class list · ${playedCount} played today`
            : `${roster().length} on the class list · face pick is off, so this tablet keeps one shared pouch and stars print as empty boxes to colour in`),
        ),
        pseg(whoOptions, state.who, (v) => { state.who = v; }, repaint),
      ),
      build: () => buildCertificates({ who: state.who, letter }),
      repaint,
    }),

    printCard({
      id: 'group',
      title: 'Small-group sheet',
      note: 'One upright page for the adult running the table: the 6–8 minute script, tablet settings, the 15-word bank, and a turn-taking grid.',
      control: el('div', { class: 'gu-row' },
        el('div', {},
          el('div', { class: 'gu-label' }, 'Turn-taking grid'),
          el('div', { class: 'gu-desc' }, 'Roster names, or blank rows for a mixed group'),
        ),
        pseg([[true, 'Roster names'], [false, 'Blank rows']], state.groupNames,
          (v) => { state.groupNames = v; }, repaint),
      ),
      build: () => ({
        nodes: [groupSheet({ letter, names: state.groupNames })],
        note: `Small-group sheet for letter ${String(letter).toUpperCase()}.`,
        tone: 'ok',
      }),
      repaint,
    }),

    printCard({
      id: 'roster',
      title: 'Roster cards',
      note: `Cut-apart name cards, ${CARDS_PER_PAGE} to a page, with a star box for every letter A–Z. Good for centre rotation tokens or cubby labels.`,
      control: el('div', { class: 'gu-row' },
        el('div', {},
          el('div', { class: 'gu-label' }, 'Star boxes'),
          el('div', { class: 'gu-desc' }, perChild
            ? 'Print each child’s stars from this tablet, or leave them blank to colour in'
            : 'Face pick is off, so there are no per-child stars — boxes print blank to colour in either way'),
        ),
        pseg(perChild ? [[true, 'Show stars'], [false, 'Blank boxes']] : [[false, 'Blank boxes']],
          perChild ? state.cardStars : false, (v) => { state.cardStars = v; }, repaint),
      ),
      build: () => {
        const nodes = rosterCardSheets({ stars: state.cardStars });
        return {
          nodes,
          note: `${roster().length} roster cards on ${nodes.length} page${nodes.length === 1 ? '' : 's'}.`,
          tone: 'ok',
        };
      },
      repaint,
    }),

    el('div', { class: 'gu-card' },
      el('h3', {}, 'At the printer'),
      el('p', { class: 'note' }, 'Nothing is uploaded and nothing is saved — the page is built on this tablet and handed to the browser print dialog, so it works with the radio off. In the dialog turn Background graphics ON to keep the star fill and the letter tile, and leave Margins on Default. Certificates ask for landscape and the other two sheets are upright; a browser that ignores that prints everything portrait, which still fits — or set Layout by hand. Save as PDF works the same way.'),
    ),
  );
}

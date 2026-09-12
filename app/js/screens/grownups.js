/* Grown-Ups — the gate and the settings sheet.

   Gate: one keypad that takes EITHER the PIN (1234) or the answer to a small
   sum. Both are in the Stitch spirit — a preschooler taps neither by accident.
   Nothing in here is child-facing, so it is calm, small and scrollable. */

import { el, icon, clear } from '../ui.js';
import { store, applyMode, applySkin } from '../store.js';
import { kids, shippedKids, letters, letterByChar, contentVersion, className, shippedClassName } from '../data.js';
import { previewLetters } from '../round.js';
import { teacherUnlock, setTeacherUnlock } from '../clouds.js';
import { audio } from '../audio.js';
import { APP_VERSION, APP_LABEL } from '../version.js';
import { buildCsv, applyCsv, detectFormat, parseCsv } from '../csv.js';
import { printPanel } from './printables.js';

const PIN = '1234';
const overlay = document.getElementById('overlay');
let onChange = () => {};
let open = false;
let atGate = false;
let gatePress = null;
let afterUnlock = 'sheet';
let onUnlocked = () => {};

export function isOpen() { return open; }

/* `#/grownups/print` opens the gate and lands on that tab. The two panels D5
   is about — Print and Device — are otherwise five taps and a PIN deep, so a
   smoke bookmark could not reach them at all. The gate is still the gate. */
export function openGrownUps(opts = {}) {
  onChange = opts.onChange || (() => {});
  afterUnlock = opts.afterUnlock === 'home' ? 'home' : 'sheet';
  onUnlocked = typeof opts.onUnlocked === 'function' ? opts.onUnlocked : () => {};
  if (opts.tab && TABS.some(([id]) => id === opts.tab)) activeTab = opts.tab;
  open = true;
  overlay.hidden = false;
  renderGate();
  document.addEventListener('keydown', onKey);
}

export function closeGrownUps() {
  open = false;
  atGate = false;
  gatePress = null;
  overlay.hidden = true;
  clear(overlay);
  document.removeEventListener('keydown', onKey);
  onChange();
}

function gateDigit(event) {
  if (event.key >= '0' && event.key <= '9') return event.key;
  const pad = /^Numpad(\d)$/.exec(event.code);
  return pad ? pad[1] : null;
}

function onKey(event) {
  if (event.key === 'Escape') { closeGrownUps(); return; }
  if (!atGate || !gatePress) return;
  if (event.key === 'Backspace') {
    event.preventDefault();
    gatePress('clear');
    return;
  }
  const digit = gateDigit(event);
  if (!digit) return;
  event.preventDefault();
  gatePress(digit);
}

/* ----------------------------------------------------------------- gate */
function renderGate() {
  clear(overlay);
  atGate = true;
  const a = 2 + Math.floor(Math.random() * 6);
  const b = 2 + Math.floor(Math.random() * 6);
  const answer = String(a + b);
  let typed = '';

  const display = el('div', { class: 'gate-display', 'aria-live': 'polite' });
  const pad = el('div', { class: 'gate-pad' });

  const paint = () => { display.textContent = typed.replace(/./g, '•'); };

  const unlock = () => {
    typed = '';
    atGate = false;
    gatePress = null;
    if (afterUnlock === 'home') {
      const done = onUnlocked;
      closeGrownUps();
      done();
      return;
    }
    renderSheet();
  };

  const press = (key, btn) => {
    if (key === 'clear') { typed = typed.slice(0, -1); paint(); return; }
    typed += key;
    paint();
    if (typed === answer || typed === PIN) { unlock(); return; }
    if (typed.length >= PIN.length) {
      const mark = btn || pad;
      mark.classList.add('wrong');
      setTimeout(() => { mark.classList.remove('wrong'); typed = ''; paint(); }, 380);
    }
  };
  gatePress = press;

  ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0'].forEach((key) => {
    const btn = el('button', { class: 'gate-key', type: 'button' }, key === 'clear' ? '⌫' : key);
    btn.addEventListener('click', () => press(key, btn));
    pad.append(btn);
  });

  overlay.append(el('div', { class: 'gate-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Grown-up check' },
    el('div', { class: 'gate-lock' }, icon('lock')),
    el('h2', {}, 'Grown-Up Check'),
    el('p', {}, 'Solve the sum — or type the teacher PIN.'),
    el('div', { class: 'gate-challenge' }, `${a} + ${b} = ?`),
    display,
    pad,
    el('button', { class: 'gate-cancel', type: 'button', onclick: closeGrownUps }, 'Return to Letter Play'),
    el('span', { class: 'gate-hint' }, 'PIN 1234 · Esc closes'),
  ));
}

/* ---------------------------------------------------------------- sheet */
const TABS = [
  ['play', 'Play'],
  ['sound', 'Sound'],
  ['class', 'Class'],
  ['print', 'Print'],
  ['device', 'Device'],
];
let activeTab = 'play';
let csvNotice = {
  text: 'Opens in Google Sheets. Two tablets are two pictures until you import.',
  tone: '',
};

function renderSheet() {
  atGate = false;
  gatePress = null;
  clear(overlay);
  const body = el('div', { class: 'gu-body' });
  const tabsRow = el('div', { class: 'gu-tabs', role: 'tablist' });

  const paint = () => {
    clear(body);
    body.append(({
      play: playPanel,
      sound: soundPanel,
      class: classPanel,
      print: () => printPanel({ repaint }),
      device: devicePanel,
    })[activeTab]());
    tabsRow.querySelectorAll('.gu-tab').forEach((t) =>
      t.setAttribute('aria-selected', String(t.dataset.tab === activeTab)));
    onChange();
  };

  TABS.forEach(([id, label]) => {
    const tab = el('button', { class: 'gu-tab', type: 'button', role: 'tab', dataset: { tab: id } }, label);
    tab.addEventListener('click', () => { activeTab = id; paint(); });
    tabsRow.append(tab);
  });

  overlay.append(el('div', { class: 'gu', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Grown-Ups settings' },
    el('div', { class: 'gu-head' },
      el('div', { class: 'gate-lock', style: { width: '40px', height: '40px' } }, icon('lock')),
      el('h2', {}, 'Grown-Ups'),
      el('span', { class: 'gu-sub' }, className()),
      el('button', { class: 'gu-close', type: 'button', onclick: closeGrownUps }, 'Back to play'),
    ),
    tabsRow,
    body,
  ));
  paint();
}

/* --- small controls ----------------------------------------------------- */
function row(label, desc, control) {
  return el('div', { class: 'gu-row' },
    el('div', {}, el('div', { class: 'gu-label' }, label), desc ? el('div', { class: 'gu-desc' }, desc) : null),
    control,
  );
}

function seg(options, current, onPick) {
  const wrap = el('div', { class: 'seg' });
  options.forEach(([value, label]) => {
    const btn = el('button', { type: 'button', 'aria-pressed': String(value === current) }, label);
    btn.addEventListener('click', () => { onPick(value); repaint(); });
    wrap.append(btn);
  });
  return wrap;
}

function toggle(on, onFlip) {
  const btn = el('button', { class: 'switch', type: 'button', 'aria-pressed': String(!!on) }, el('i'));
  btn.addEventListener('click', () => { onFlip(!on); repaint(); });
  return btn;
}

function repaint() { if (open) renderSheet(); }

/* How many picture plates the content file really ships, so the recording
   checklist below can never quote a number data/letters.json has moved past. */
function pictureCount() {
  return letters().reduce((n, entry) => n + ((entry.pictures || []).length || 1), 0);
}

/* --- panels -------------------------------------------------------------- */
function playPanel() {
  const s = store.getSettings();
  const pinned = store.getPinnedLetter();
  const pinLetter = pinned ? letterByChar(pinned) : null;

  const picker = el('div', { class: 'letter-picker' });
  letters().forEach((entry) => {
    const btn = el('button', {
      type: 'button',
      'aria-pressed': String(pinned === entry.letter),
      title: `${entry.letter} is for ${entry.word}`,
    }, entry.letter);
    btn.addEventListener('click', () => {
      store.setPinnedLetter(pinned === entry.letter ? null : entry.letter);
      repaint();
    });
    picker.append(btn);
  });

  return el('div', { class: 'gu-panel' },
    el('div', { class: 'gu-card' },
      el('h3', {}, 'Round'),
      el('p', { class: 'note' }, 'Each letter runs meet → choose → listen → payoff → celebrate. The celebration settles itself in 8 seconds and can be skipped. (That used to be case match → picture match → bonus → celebrate.)'),
      row('Letters per round', 'Default 3 · applies on the next PLAY, not mid-round', seg([[1, '1'], [2, '2'], [3, '3'], [5, '5'], [8, '8']], s.roundSize, (v) => store.setSetting('roundSize', Number(v)))),
      row('Answer cards', '2–8 choices per step · applies on the next PLAY', seg([[2, '2'], [3, '3'], [4, '4'], [6, '6'], [8, '8']], s.choiceCount, (v) => store.setSetting('choiceCount', Number(v)))),
      row('Case hunt', 'Which case the child looks for (mix is 50/50)', seg([['lower', 'Little'], ['upper', 'Big'], ['both', 'Mix']], s.caseMode, (v) => store.setSetting('caseMode', v))),
      row('Word print', 'Show words under picture cards', toggle(s.showWords, (v) => store.setSetting('showWords', v))),
      row('Bonus round',
        'Third step after the two matches. Rotate walks the three games down the alphabet — A a hunt, B a sound sort, C ABC order, D a hunt again — so a 3-letter round plays all three. Bonus misses never cost a star.',
        seg([['off', 'Off'], ['rotate', 'Rotate'], ['hunt', 'Hunt'], ['sound', 'Sound'], ['order', 'ABC']],
          s.bonusMode || 'rotate', (v) => store.setSetting('bonusMode', v))),
      row('Hint after misses', 'Auto-glow the answer. 0 = off', seg([[0, 'Off'], [2, '2'], [3, '3'], [5, '5']], s.hintAfter, (v) => store.setSetting('hintAfter', Number(v)))),
      row('Stars', 'none · this session · save on this device',
        seg([['none', 'Off'], ['stars', 'Session'], ['stars-save', 'Save']], s.progressMode || 'stars-save',
          (v) => store.setSetting('progressMode', v))),
      row('Open clouds', 'Highest cloud a class may play. Kids still earn the next cloud by finishing 4/4 on every letter.',
        seg([[1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5']], teacherUnlock(),
          (v) => { setTeacherUnlock(Number(v)); repaint(); })),
    ),
    el('div', { class: 'gu-card' },
      el('h3', {}, 'Letter of the day'),
      el('p', { class: 'note' }, pinned
        ? `Pinned: ${pinned} is highlighted inside the open cloud (${pinLetter ? `${pinned} is for ${pinLetter.word}` : pinned}). If that letter is locked, PLAY starts the open cloud instead. Tap it again to unpin.`
        : `Not pinned — next PLAY starts the first unfinished letter in the open cloud (${previewLetters()[0] || 'P'}).`),
      picker,
      familyNoteCard(),
    ),
  );
}

/* --- family note ---------------------------------------------------------
   Take-home copy a grown-up can paste into a newsletter or a class message
   without editing a word of it. Letter AND word, because "we did A today"
   is nothing a family can act on, and the sound spelled out the way Lucy
   says it, because the name of the letter is the thing parents reach for
   first and it is the one thing that does not help. Nothing about pins,
   cursors or trails leaks into the note — that is Grown-Ups language, and
   it is what made the old blurb read like a placeholder. */

/* Whatever PLAY would really open next: the pin if a grown-up set one, else
   the letter previewLetters() says the next round starts on. */
function noteLetter() {
  const pinned = store.getPinnedLetter();
  return letterByChar(pinned)
    || letterByChar(previewLetters()[0])
    || letterByChar(store.getCursor())
    || letters()[0]
    || null;
}

function noteDate() {
  try {
    return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  } catch (err) {
    return new Date().toDateString();
  }
}

export function familyNoteText(letter) {
  const L = (letter && letterByChar(letter)) || noteLetter();
  if (!L) return 'Ready Set ABC · Pre-K Phonics with Lucy';

  /* Three more words off the same letter, in the order the pack lists them,
     so a note copied twice for two families reads the same both times. */
  const hunt = (L.pictures || [])
    .map((p) => p.word)
    .filter((w) => w && w.toLowerCase() !== String(L.word).toLowerCase())
    .slice(0, 3);
  const huntLine = hunt.length ? `${hunt.join(', ')} — say the sound first, then the word.` : 'Say the sound first, then the word.';
  const say = L.say ? `"${L.say}"` : `${L.letter}${L.lower}`;

  return [
    `Ready Set ABC — ${L.letter}${L.lower} · ${noteDate()}`,
    '',
    `Today in ${className()} we played the letter ${L.letter}${L.lower} with Lucy.`,
    `${L.letter} is for ${L.word}. The sound is ${say} ${L.phoneme} — that is the sound the letter makes, not its name.`,
    '',
    'At home tonight:',
    `1. Say the sound together three times: ${L.say || L.letter}, ${L.say || L.letter}, ${L.say || L.letter}.`,
    `2. Hunt for it around the house: ${huntLine}`,
    `3. Draw a big ${L.letter} and a little ${L.lower}, and let your child point to the little one.`,
    '',
    `In class we matched big ${L.letter} to little ${L.lower}, found the pictures that start with ${say}, and collected stars with Lucy.`,
    '',
    'Ready Set ABC · Pre-K Phonics with Lucy',
  ].join('\n');
}

/* The note is on screen before it is on the clipboard. A Chromebook that
   refuses clipboard permission still leaves a teacher a box to select. */
function familyNoteCard() {
  const L = noteLetter();
  const box = el('textarea', {
    class: 'gu-note family-note',
    id: 'family-note',
    readonly: 'readonly',
    rows: '9',
    'aria-label': 'Family note — ready to copy',
  });
  box.value = familyNoteText();
  box.addEventListener('focus', () => { try { box.select(); } catch (err) { /* older webview */ } });

  return el('div', {},
    el('p', { class: 'note' }, 'Ready to paste into a newsletter, a class message or a take-home slip. Paper for the table is on the Print tab.'),
    box,
    el('div', { class: 'gu-actions' },
      el('button', { class: 'gu-btn gu-btn--primary', type: 'button', onclick: copyFamilyNote },
        L ? `Copy family note — ${L.letter} is for ${L.word}` : 'Copy family note'),
    ),
    el('p', { class: 'gu-status', id: 'pin-letter-status' },
      L ? `Written for ${L.letter}${L.lower} — the letter the next PLAY opens.` : 'No letters loaded yet.'),
  );
}

async function copyFamilyNote() {
  const box = document.getElementById('family-note');
  const text = (box && box.value) || familyNoteText();
  const status = document.getElementById('pin-letter-status');
  const say = (msg, tone) => {
    if (!status) return;
    status.textContent = msg;
    status.className = `gu-status${tone ? ` is-${tone}` : ''}`;
  };
  /* The old select-and-execCommand path. A cart Chromebook that refuses the
     async clipboard often still allows this one, so it is the fallback AND
     the retry — a teacher should not have to care which API her tablet has. */
  const legacyCopy = () => {
    if (!box) return false;
    try {
      box.focus();
      box.select();
      return document.execCommand('copy');
    } catch (err) {
      return false;
    }
  };

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else if (!legacyCopy()) {
      throw new Error('this browser has no clipboard');
    }
    say('Copied — paste it into a message or newsletter.', 'ok');
  } catch (err) {
    if (legacyCopy()) {
      say('Copied — paste it into a message or newsletter.', 'ok');
      return;
    }
    say(`Could not reach the clipboard (${err.message}). The note is selected above — press Ctrl+C.`, 'bad');
  }
}

function soundPanel() {
  const a = store.getAudio();
  return el('div', { class: 'gu-panel' },
    el('div', { class: 'gu-card' },
      el('h3', {}, 'Audio channels'),
      el('p', { class: 'note' }, 'Independent mutes. Music ducks while Lucy talks. Sound stays locked until a child taps the giant PLAY button — these Test buttons also unlock, because a grown-up needs to hear the cart.'),
      row('Music', 'Quiet playground wander · ducks under voice', toggle(a.music, (v) => { store.setAudio('music', v); audio.applyMutes(); })),
      row('Sound effects', 'Taps, matches, success chime, star hits — never Lucy\'s speech', toggle(a.sfx, (v) => { store.setAudio('sfx', v); audio.applyMutes(); })),
      row('Voice', 'Lucy\'s recorded names, sounds, and words when clips land. Mute voice does not mute taps or chimes.', toggle(a.voice, (v) => { store.setAudio('voice', v); audio.applyMutes(); })),
      el('div', { class: 'gu-actions' },
        el('button', {
          class: 'gu-btn gu-btn--primary', type: 'button',
          onclick: () => { audio.unlock(); audio.sayLetterName('A'); },
        }, 'Test name'),
        el('button', {
          class: 'gu-btn', type: 'button',
          onclick: () => { audio.unlock(); audio.sayPhoneme({ letter: 'A', say: 'aaa' }); },
        }, 'Test sound'),
        el('button', {
          class: 'gu-btn', type: 'button',
          onclick: () => { audio.unlock(); audio.sayWord({ letter: 'A', id: 'apple', word: 'Apple' }); },
        }, 'Test word'),
        el('button', {
          class: 'gu-btn', type: 'button',
          onclick: () => { audio.unlock(); audio.cheer(); audio.sfx('right'); },
        }, 'Test cheer'),
        el('button', {
          class: 'gu-btn', type: 'button',
          onclick: () => { audio.unlock(); audio.nudge(); audio.sfx('wrong'); },
        }, 'Test nudge'),
        el('button', {
          class: 'gu-btn', type: 'button',
          onclick: () => {
            audio.unlock();
            [0, 1, 2].forEach((i) => setTimeout(() => audio.sfx('star', i), i * 260));
          },
        }, 'Test stars'),
      ),
      el('p', { class: 'gu-status' }, audio.isUnlocked() ? 'Audio unlocked on this device.' : 'Audio still locked — tap Test name or the kid PLAY button.'),
    ),
    el('div', { class: 'gu-card' },
      el('h3', {}, 'Recorded voice'),
      el('p', { class: 'note' }, 'Not recorded yet. Names, letter sounds, and words stay silent until a clip is dropped in. Lucy’s lines still show on screen. Success chimes are sound effects, not speech.'),
      el('p', { class: 'note' }, `data/audio.json lists every clip Lucy still owes, as a silent placeholder: ${letters().length} letter names, ${letters().length} letter sounds, the ${pictureCount()} picture words, 6 cheers and 4 nudges. To ship one, drop the file in app/audio/, move its id into "clips", pin the file in sw.js, and bump the version.`),
      el('p', { class: 'note' }, 'Three separate channels, three separate keys: name-A is the letter NAME (board appear), phoneme-A is the SOUND and never the name (letter-choice tap), word-A-apple is the picture word. A phoneme key pointing at a name recording is thrown away rather than played.'),
      el('p', { class: 'gu-status' }, audio.clipCount() === 0
        ? 'No recorded clips on this tablet — names, sounds, and words stay silent until they land.'
        : `${audio.clipCount()} recorded clip${audio.clipCount() === 1 ? '' : 's'} on this tablet.`),
    ),
  );
}

function classPanel() {
  const classroom = store.isClassroom();
  const list = el('div', { class: 'roster-list' });
  kids().forEach((kid) => {
    const note = el('textarea', {
      class: 'gu-note',
      rows: '2',
      maxlength: '280',
      placeholder: 'Notes (this device only)',
      'aria-label': `Notes for ${kid.name}`,
    });
    note.value = store.getNote(kid.id);
    note.addEventListener('change', () => store.setNote(kid.id, note.value));

    const modePick = el('select', {
      class: 'gu-input',
      'aria-label': `Work mode for ${kid.name}`,
    },
      el('option', { value: 'satpin' }, 'Default SATPIN'),
      el('option', { value: 'assigned' }, 'Assigned letters'),
      el('option', { value: 'free' }, 'Free play'),
    );
    modePick.value = kid.workMode || 'satpin';
    const lettersInput = el('input', {
      class: 'gu-input',
      type: 'text',
      maxlength: '51',
      placeholder: 'S P O J',
      'aria-label': `Assigned letters for ${kid.name}`,
    });
    lettersInput.value = (kid.assignedLetters || []).join(' ');
    lettersInput.hidden = modePick.value !== 'assigned';
    const saveKid = (patch) => {
      store.setRosterOverride(kids().map((k) => (k.id === kid.id ? { ...k, ...patch } : k)));
      repaint();
    };
    modePick.addEventListener('change', () => saveKid({ workMode: modePick.value }));
    lettersInput.addEventListener('change', () => {
      const assignedLetters = lettersInput.value.toUpperCase().split(/[\s,]+/).filter((ch) => /^[A-Z]$/.test(ch));
      saveKid({ assignedLetters });
    });
    const arcadeOn = !kid.arcadeLocked;
    const item = el('div', { class: 'roster-item' },
      el('div', { class: 'roster-item-row' },
        el('span', { class: 'rf', style: { background: kid.color } }, kid.emoji),
        el('span', { class: 'roster-name' }, kid.name),
        store.playedToday(kid.id) ? el('span', { class: 'played' }, '★ today') : null,
        el('button', { class: 'rx', type: 'button', title: `Remove ${kid.name}`, onclick: () => {
          store.setRosterOverride(kids().filter((k) => k.id !== kid.id));
          /* Removing the child who is playing must release the tablet too,
             or the next round banks stars under a name nobody can see. */
          if (store.getKidId() === kid.id) store.clearKid();
          repaint();
        } }, '×'),
      ),
      row('Work', modePick.value === 'satpin' ? 'SATPIN' : modePick.value === 'free' ? 'Any letter' : 'Assigned', modePick),
      lettersInput,
      row('Arcade', arcadeOn ? 'Open' : 'Locked', toggle(arcadeOn, (v) => saveKid({ arcadeLocked: !v }))),
      note,
    );
    list.append(item);
  });

  /* The class name goes on every printed certificate, small-group sheet and
     roster card. Blank follows data/roster.json; anything typed here wins, so
     a tablet that imported another room's roster stops printing the wrong
     class on 24 sheets of paper. */
  const classInput = el('input', {
    class: 'gu-input',
    type: 'text',
    maxlength: '48',
    placeholder: shippedClassName(),
    'aria-label': 'Class name (printed on every sheet)',
  });
  classInput.value = store.getClassNameOverride() || '';
  const saveClassName = () => {
    store.setClassName(classInput.value);
    repaint();
  };
  classInput.addEventListener('change', saveClassName);

  const nameInput = el('input', { class: 'gu-input', type: 'text', placeholder: 'Child name', maxlength: '18' });
  const emojiInput = el('input', { class: 'gu-input', type: 'text', placeholder: '🦊', maxlength: '4', style: { width: '72px' } });

  const addKid = () => {
    const name = nameInput.value.trim();
    if (!name) return;
    const roster = kids().slice();
    roster.push({
      id: `k${Date.now().toString(36)}`,
      name,
      emoji: emojiInput.value.trim() || '🐾',
      color: ['#ff8a5c', '#4ec3a5', '#c48cf0', '#7fd35f', '#ff7fa8', '#5aa9f0'][roster.length % 6],
      workMode: 'satpin',
      assignedLetters: [],
      arcadeLocked: false,
    });
    store.setRosterOverride(roster);
    repaint();
  };

  const fileInput = el('input', {
    type: 'file',
    accept: '.csv,text/csv,text/plain',
    style: { display: 'none' },
    'aria-hidden': 'true',
  });
  fileInput.addEventListener('change', () => importCsvFile(fileInput));

  return el('div', { class: 'gu-panel' },
    el('div', { class: 'gu-card' },
      el('h3', {}, 'This tablet'),
      el('p', { class: 'note' }, 'The roster is always login. Stars stay with the child who is playing. The old classroom switch is still here so a copied CSV can round-trip.'),
      row('Keep per-child stars flag', classroom ? 'On' : 'Off', toggle(classroom, (v) => store.setClassroom(v))),
      row('Who is playing now', (kids().find((k) => k.id === store.getKidId()) || {}).name || 'nobody', el('button', {
        class: 'gu-btn', type: 'button', onclick: () => { store.clearKid(); repaint(); },
      }, 'Clear')),
    ),
    el('div', { class: 'gu-card' },
      el('h3', {}, 'Class name'),
      el('p', { class: 'note' }, `Printed on every certificate, small-group sheet and roster card, and shown above the face grid. Now: ${className()}. Leave it blank to follow the class file (${shippedClassName()}).`),
      el('div', { class: 'gu-actions' }, classInput,
        el('button', { class: 'gu-btn', type: 'button', onclick: saveClassName }, 'Save'),
        el('button', { class: 'gu-btn', type: 'button', onclick: () => { store.setClassName(''); repaint(); } }, 'Use class file')),
    ),
    el('div', { class: 'gu-card' },
      el('h3', {}, `Roster · ${kids().length} children`),
      el('p', { class: 'note' }, 'Edits and notes stay on this tablet; data/roster.json is never written. Notes are not shown to kids.'),
      el('div', { class: 'gu-actions' }, nameInput, emojiInput,
        el('button', { class: 'gu-btn gu-btn--primary', type: 'button', onclick: addKid }, 'Add child')),
      list,
      el('div', { class: 'gu-actions' },
        el('button', { class: 'gu-btn gu-btn--danger', type: 'button', onclick: () => { store.clearRosterOverride(); repaint(); } },
          `Reset to class file (${shippedKids().length})`),
      ),
    ),
    el('div', { class: 'gu-card' },
      el('h3', {}, 'Copy this tablet'),
      el('p', { class: 'note' }, 'CSV of the class list, per-letter stars, stickers, notes, and Grown-Ups settings (round size, mutes, mode, hide chrome, letter pin). Import replaces this tablet. Kids never see this file.'),
      el('div', { class: 'gu-actions' },
        el('button', { class: 'gu-btn gu-btn--primary', type: 'button', onclick: exportCSV }, 'Export CSV'),
        el('button', { class: 'gu-btn', type: 'button', onclick: () => fileInput.click() }, 'Import CSV'),
        fileInput,
      ),
      el('p', {
        class: `gu-status${csvNotice.tone === 'ok' ? ' is-ok' : csvNotice.tone === 'bad' ? ' is-bad' : ''}`,
        id: 'csv-status',
      }, csvNotice.text),
    ),
  );
}

function downloadCsv(filename, text) {
  const blob = new Blob(['\uFEFF' + text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = el('a', { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function setCsvStatus(text, tone) {
  csvNotice = { text, tone: tone || '' };
  const status = document.getElementById('csv-status');
  if (!status) return;
  status.textContent = text;
  status.classList.toggle('is-ok', csvNotice.tone === 'ok');
  status.classList.toggle('is-bad', csvNotice.tone === 'bad');
}

function exportCSV() {
  try {
    downloadCsv('ready-set-abc.csv', buildCsv());
    setCsvStatus('Saved ready-set-abc.csv — class list, stars, notes and settings.', 'ok');
  } catch (err) {
    setCsvStatus(`Could not export: ${err.message}`, 'bad');
  }
}

async function importCsvFile(fileInput) {
  const file = fileInput.files && fileInput.files[0];
  fileInput.value = '';
  if (!file) return;
  let text = '';
  try {
    text = await file.text();
  } catch (err) {
    setCsvStatus(`Could not read that file: ${err.message}`, 'bad');
    return;
  }
  const format = detectFormat(parseCsv(text));
  if (format === 'empty' || format === 'unknown') {
    setCsvStatus(format === 'empty' ? 'That file is empty.' : 'Not a Ready Set ABC CSV.', 'bad');
    return;
  }
  const confirmMsg = format === 'roster'
    ? 'Replace the class list with the names in this file? Stars stay with matching names. Settings stay put.'
    : 'Replace this tablet’s class list, stars, notes, and Grown-Ups settings with this file?';
  if (!window.confirm(confirmMsg)) {
    setCsvStatus('Import cancelled.', '');
    return;
  }
  const result = applyCsv(text);
  if (!result.ok) {
    setCsvStatus(result.error || 'Could not import that CSV.', 'bad');
    return;
  }
  audio.applyMutes();
  applyMode(store.getMode());
  setCsvStatus(result.summary, 'ok');
  repaint();
}

/* Wait for `event`, or give up after ms. Never leaves a teacher on a spinner. */
function raceEvent(target, event, ms) {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(false), ms);
    target.addEventListener(event, () => { clearTimeout(t); resolve(true); }, { once: true });
  });
}

/* Wait for a freshly-found worker to stop being `installing`.
   reg.update() resolves as soon as the new sw.js has been fetched — the worker
   it found is then INSTALLING (precaching the whole shell), and only lands in
   `waiting` when that finishes. A Get update that looked at reg.waiting right
   after reg.update() therefore found nothing, talked to the worker the cart
   already had, and re-pinned the version it was trying to replace. */
function settle(worker, ms) {
  const done = () => worker.state === 'installed' || worker.state === 'activated' || worker.state === 'redundant';
  if (done()) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    const seen = () => {
      if (!done()) return;
      worker.removeEventListener('statechange', seen);
      clearTimeout(timer);
      resolve();
    };
    worker.addEventListener('statechange', seen);
    /* It can land between the check above and this line. Without this the
       teacher waits out the whole ceiling for something already finished. */
    seen();
  });
}

/* Get the worker this page should talk to, handing over to a newer pin if one
   is sitting in `waiting`. sw.js does not skipWaiting on its own — that is the
   whole point of "nothing updates mid-round" — so Get update has to ask.
   Returns { worker, swapped }: `swapped` means a newer shell now controls this
   tablet while the page is still running the modules the old pin served, so
   the teacher is owed a reload before that shell is really what is running. */
async function shellWorker() {
  const reg = await navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' });
  await navigator.serviceWorker.ready;
  try { await reg.update(); } catch (err) { /* offline: keep the pin we have */ }

  /* Installing a new pin means precaching the shell over school Wi-Fi, so give
     it real time — but never forever, or Get update becomes a spinner. */
  if (reg.installing) await settle(reg.installing, 90000);

  let swapped = false;
  if (reg.waiting && navigator.serviceWorker.controller) {
    const handover = raceEvent(navigator.serviceWorker, 'controllerchange', 4000);
    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    swapped = await handover;
  }

  let worker = navigator.serviceWorker.controller || reg.active;
  if (!worker) {
    await raceEvent(navigator.serviceWorker, 'controllerchange', 2500);
    worker = navigator.serviceWorker.controller
      || (await navigator.serviceWorker.getRegistration())?.active;
  }
  return { worker: worker || null, swapped };
}

/* One request/response over a private port. */
function askWorker(worker, message, onProgress, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => reject(new Error('the service worker did not answer')), timeoutMs);
    channel.port1.onmessage = (event) => {
      const msg = event.data || {};
      if (msg.type === 'progress') { if (onProgress) onProgress(msg); return; }
      clearTimeout(timer);
      if (msg.type === 'error') reject(new Error(msg.message || 'unknown error'));
      else resolve(msg);
    };
    worker.postMessage(message, [channel.port2]);
  });
}

/* A failed precache reports every file it could not get. That list is the
   right thing to log and the wrong thing to put on a teacher's screen. */
function short(message, max = 140) {
  const text = String(message || 'unknown error');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function devicePanel() {
  const cache = store.getCache();
  const bar = el('div', { class: 'progress-bar' }, el('i'));
  if (cache && cache.files) bar.firstChild.style.width = '100%';
  const pinnedMatch = cache && cache.version === APP_VERSION;
  /* Either way round — an old cache, or a cache that has already been updated
     while this page still runs the pin it booted on — the fix is one sentence
     and it is the same sentence. Do not claim which one is newer: these are
     names, not numbers, and guessing wrong sends a teacher the wrong way. */
  const status = el('p', { class: 'gu-status' }, cache
    ? (pinnedMatch
      ? `Ready offline · ${cache.files} files · ${new Date(cache.at).toLocaleString()}`
      : `Cached ${cache.version || 'an older pin'} · this page is running ${APP_VERSION}. Tap Get update on Wi-Fi, then reload.`)
    : 'Not set up for offline use yet.');

  /* Only shown after a hand-over actually happened. See shellWorker(). */
  const reload = el('button', { class: 'gu-btn gu-btn--primary', type: 'button', hidden: true }, 'Reload to finish');
  reload.addEventListener('click', () => location.reload());

  const runPrecache = async (label) => {
    reload.hidden = true;
    status.textContent = `${label}…`;
    bar.firstChild.style.width = '0%';
    if (!('serviceWorker' in navigator)) {
      status.textContent = 'This browser cannot cache offline.';
      return;
    }
    /* Every shell fetch is `cache: 'reload'`, so off Wi-Fi this can only fail —
       one clear sentence beats 40 file names. Nothing already cached is lost:
       the worker only ever puts a file it actually got. */
    if (navigator.onLine === false) {
      status.textContent = 'This tablet is offline. Join school Wi-Fi, then tap again — the files it already has are untouched.';
      return;
    }
    try {
      const { worker, swapped } = await shellWorker();
      if (!worker) {
        status.textContent = 'Reload this page once, then tap Set up this device again.';
        return;
      }
      const done = await askWorker(worker, { type: 'PRECACHE' }, (msg) => {
        bar.firstChild.style.width = `${Math.round((msg.done / msg.total) * 100)}%`;
      });
      bar.firstChild.style.width = '100%';
      store.setCache({ at: Date.now(), version: done.version, files: done.count });
      if (swapped) {
        /* The new shell is cached and controlling, but this page is still the
           old modules in memory. Say so, and make finishing one tap. */
        reload.hidden = false;
        status.textContent = `Pinned ${done.version} · ${done.count} files cached. Tap Reload to finish — this tablet is still running ${APP_VERSION} until it does.`;
        return;
      }
      status.textContent = `Pinned ${done.version} · ${done.count} files cached. Radio can go off.`;
    } catch (err) {
      status.textContent = `Could not cache: ${short(err.message)} — stay on Wi-Fi and tap again.`;
    }
  };

  /* Trust the cache, not the note we left ourselves. Chrome can evict storage
     on a full cart Chromebook, and a tablet that claims "Ready offline" when it
     is not is a dead centre rotation. Silent when everything is where it should
     be; loud enough to act on when it is not. */
  const verify = async (loud) => {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      if (loud) status.textContent = 'No offline worker on this page yet — reload, then try again.';
      return;
    }
    try {
      const health = await askWorker(navigator.serviceWorker.controller, { type: 'HEALTH' }, null, 8000);
      if (health.type !== 'health') return;
      if (health.cached === 0) {
        bar.firstChild.style.width = '0%';
        status.textContent = 'Nothing is cached on this tablet — tap Set up this device on Wi-Fi.';
        return;
      }
      const pct = Math.round((health.cached / health.total) * 100);
      bar.firstChild.style.width = `${pct}%`;
      if (health.cached < health.total) {
        status.textContent = `Only ${health.cached} of ${health.total} files are cached (missing ${health.missing.slice(0, 3).join(', ')}${health.missing.length > 3 ? '…' : ''}) — tap Set up this device on Wi-Fi.`;
        return;
      }
      /* A complete cache on a pin this page is not running is what a finished
         Get update looks like before the reload. Reload reconciles it either
         way — the page then boots from the very files just counted. */
      status.textContent = health.version === APP_VERSION
        ? `Checked just now · all ${health.total} files cached · ${health.version}. Radio can go off.`
        : `All ${health.total} files cached on ${health.version}, but this page is running ${APP_VERSION} — reload this tablet to finish.`;
    } catch (err) {
      /* An older pin has no HEALTH handler and will never answer. On a repaint
         leave the note alone; only say so when a grown-up actually asked. */
      if (loud) status.textContent = 'This tablet is on an older shell — tap Get update on Wi-Fi, then check again.';
    }
  };
  verify(false);

  const setup = el('button', { class: 'gu-btn gu-btn--primary', type: 'button' }, 'Set up this device');
  setup.addEventListener('click', () => runPrecache('Caching the shell'));
  const update = el('button', { class: 'gu-btn', type: 'button' }, 'Get update');
  update.addEventListener('click', () => runPrecache('Fetching the pinned shell'));
  const check = el('button', { class: 'gu-btn', type: 'button' }, 'Check offline files');
  check.addEventListener('click', () => {
    status.textContent = 'Checking the cache…';
    verify(true);
  });

  return el('div', { class: 'gu-panel' },
    el('div', { class: 'gu-card' },
      el('h3', {}, 'Device mode'),
      el('p', { class: 'note' }, 'Sets the minimum touch target across the kid shell. Whiteboard is the wall board: 140px taps, high-contrast letters, Lucy’s prompts stay even if you hide the bars.'),
      row('Mode', 'Center 88px · Small group 104px · Whiteboard 140px / 220px cards',
        seg([['center', 'Center'], ['small-group', 'Small group'], ['whiteboard', 'Whiteboard']], store.getMode(),
          (v) => { store.setMode(v); applyMode(v); })),
      row('Kid look', 'Comic is the yellow/blue hub. Cosmic and Violet are the darker Stitch layouts. Same rooms, different paint.',
        seg([['comic', 'Comic'], ['cosmic', 'Cosmic'], ['violet', 'Violet']], store.getSkin(),
          (v) => { store.setSkin(v); applySkin(v); })),
      row('Hide chrome', 'Hides tabs, Grown-Ups, sound dots, and the footer. Lucy’s prompts stay. Shift+H also toggles. Hold the yellow paw for Grown-Ups.',
        toggle(store.getHideChrome(), (v) => store.setHideChrome(v))),
    ),
    el('div', { class: 'gu-card' },
      el('h3', {}, 'Version pin'),
      el('p', { class: 'note' }, 'The cart Chromebooks keep this shell until you tap Get update on school Wi-Fi. Nothing updates mid-round.'),
      el('div', { class: 'version-pin' },
        el('div', {}, el('span', { class: 'gu-desc' }, 'Shell'), el('strong', {}, APP_VERSION)),
        el('div', {}, el('span', { class: 'gu-desc' }, 'Label'), el('strong', {}, APP_LABEL)),
        el('div', {}, el('span', { class: 'gu-desc' }, 'Content'), el('strong', {}, contentVersion())),
        el('div', {}, el('span', { class: 'gu-desc' }, 'Cached'), el('strong', {}, cache && cache.version ? cache.version : '—')),
      ),
    ),
    el('div', { class: 'gu-card' },
      el('h3', {}, 'Offline'),
      el('p', { class: 'note' }, 'Set up this device once on school Wi-Fi. It precaches the full shell listed in sw.js. After that the app opens with the radio off. Check offline files re-reads the cache itself, so a tablet that quietly lost its files says so before a centre rotation does. The letter fonts are part of that shell — they ship in the app, so the tablet looks the same with the radio off as it does on Wi-Fi.'),
      el('div', { class: 'gu-actions' }, setup, update, check, reload),
      bar,
      status,
    ),
    el('div', { class: 'gu-card' },
      el('h3', {}, 'About'),
      el('p', { class: 'note' }, `Stars, notes and progress live in this browser only. Two tablets are two pictures. To copy this tablet, use Class → Export CSV, then Import on the other tablet.`),
      el('div', { class: 'gu-actions' },
        el('button', {
          class: 'gu-btn gu-btn--danger', type: 'button',
          onclick: () => {
            if (!window.confirm('Erase all stars, progress, notes and roster edits on this device?')) return;
            store.reset();
            repaint();
          },
        }, 'Erase this device'),
      ),
    ),
  );
}

/* Dev-only: classroom face-pick → two-tap case/picture/bonus/celebrate on a
   fully awake A–Z, picture pools, ABC cursor, Play again, stars-save.
   Run from app/:  node _flow.mjs   (no dependencies, no browser) */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));

const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => { mem.set(k, String(v)); },
  removeItem: (k) => { mem.delete(k); },
};
/* A pocket DOM: just enough for ui.js `el()` / `icon()` / `clear()` so the
   printable sheets can really be built and read back here. Not a browser. */
function makeText(data) {
  return { nodeType: 3, data: String(data), childNodes: [] };
}
function textOf(node) {
  if (!node) return '';
  if (node.nodeType === 3) return node.data;
  return (node.childNodes || []).map(textOf).join(' ');
}
const rawHtml = new WeakMap();
function makeNode(tag) {
  const style = { setProperty(key, value) { style[key] = value; } };
  const node = {
    nodeType: 1,
    tagName: String(tag).toUpperCase(),
    childNodes: [],
    attributes: {},
    dataset: {},
    style,
    className: '',
    classList: { add() {}, remove() {}, toggle() {} },
    /* `html:` markup is not parsed — but lucy.js reaches back into its own
       inline SVG (stage.querySelector('.lucy')) to set the pose, so a class
       written into that string has to be findable. Stand one stub node up per
       class in the markup: enough for dataset/classList, no text, so nothing
       that reads textContent changes. */
    get innerHTML() { return rawHtml.get(node) || ''; },
    set innerHTML(value) {
      const html = String(value == null ? '' : value);
      rawHtml.set(node, html);
      node.childNodes = [...html.matchAll(/class="([^"]+)"/g)]
        .flatMap((m) => m[1].trim().split(/\s+/))
        .filter((cls, i, all) => all.indexOf(cls) === i)
        .map((cls) => Object.assign(makeNode('span'), { className: cls }));
    },
    get firstChild() { return node.childNodes[0] || null; },
    get textContent() { return textOf(node); },
    set textContent(value) { node.childNodes = [makeText(value)]; },
    append(...kids) { kids.forEach((kid) => node.childNodes.push(kid)); },
    appendChild(kid) { node.childNodes.push(kid); return kid; },
    prepend(...kids) { node.childNodes = [...kids, ...node.childNodes]; },
    removeChild(kid) { node.childNodes = node.childNodes.filter((c) => c !== kid); return kid; },
    setAttribute(key, value) { node.attributes[key] = String(value); },
    getAttribute(key) {
      return Object.prototype.hasOwnProperty.call(node.attributes, key) ? node.attributes[key] : null;
    },
    addEventListener() {},
    removeEventListener() {},
    /* Enough of a selector engine for the three shapes the app really uses:
       '.cls', 'tag' and '[data-attr]'. Anything else finds nothing, which is
       what the old always-empty stub did for every query. */
    querySelectorAll(sel) { return matchIn(node, String(sel)); },
    querySelector(sel) { return matchIn(node, String(sel))[0] || null; },
  };
  return node;
}
function matchIn(root, sel) {
  const found = walk(root).filter((n) => n !== root);
  if (sel.startsWith('.')) {
    const cls = sel.slice(1);
    return found.filter((n) => String(n.className || '').split(/\s+/).includes(cls));
  }
  if (sel.startsWith('[')) {
    const key = sel.slice(1, -1).split('=')[0];
    return found.filter((n) => Object.prototype.hasOwnProperty.call(n.attributes, key));
  }
  if (/^[a-zA-Z]+$/.test(sel)) return found.filter((n) => n.tagName === sel.toUpperCase());
  return [];
}
function walk(node, out = []) {
  if (!node || node.nodeType !== 1) return out;
  out.push(node);
  (node.childNodes || []).forEach((kid) => walk(kid, out));
  return out;
}
function byClass(node, cls) {
  return walk(node).filter((n) => String(n.className || '').split(/\s+/).includes(cls));
}
function byTag(node, tag) {
  return walk(node).filter((n) => n.tagName === tag.toUpperCase());
}

const printRoot = makeNode('div');
let printCalls = 0;

globalThis.document = {
  documentElement: { dataset: {} },
  body: makeNode('body'),
  addEventListener() {},
  removeEventListener() {},
  hidden: false,
  createElement: (tag) => makeNode(tag),
  createElementNS: (ns, tag) => makeNode(tag),
  createTextNode: (data) => makeText(data),
  getElementById: (id) => (id === 'print-root' ? printRoot : null),
};
globalThis.window = globalThis;
globalThis.print = () => { printCalls += 1; };
globalThis.fetch = async (path) => {
  const text = readFileSync(join(root, path), 'utf8');
  return { ok: true, status: 200, json: async () => JSON.parse(text) };
};

const { store } = await import('./js/store.js');
const { loadData, kids, kidById, activeKid, isAwake, letterByChar, picturesFor, pickPicture, awakeLetters, className } = await import('./js/data.js');
const round = await import('./js/round.js');
const bonusMod = await import('./js/bonus.js');
const closet = await import('./js/closet.js');
const { audio, CHEERS, NUDGES, phonemeText, looksLikeLetterName, PHONEME_VOICE, clipId } = await import('./js/audio.js');
const { hasPictureArt } = await import('./js/art.js');
const csv = await import('./js/csv.js');

/* All 26 pools are pinned word-for-word now: every picture has a drawn SVG
   plate keyed by picture id (js/art.js), so a renamed word silently loses
   its art. Rename a word here and in data/letters.json together, and draw
   the plate under the new id. */
const GAME_FLOW_WORDS = {
  A: ['Apple', 'Alligator', 'Astronaut', 'Ant', 'Airplane', 'Acorn', 'Ambulance', 'Avocado', 'Anchor', 'Alpaca', 'Apron', 'Asteroid', 'Alarm', 'Artichoke', 'Axolotl'],
  B: ['Ball', 'Bear', 'Banana', 'Butterfly', 'Bus', 'Bird', 'Boat', 'Book', 'Balloon', 'Bee', 'Bread', 'Bike', 'Bucket', 'Bunny', 'Broccoli'],
  C: ['Cat', 'Car', 'Cake', 'Cow', 'Cup', 'Castle', 'Carrot', 'Cloud', 'Crab', 'Crown', 'Cookie', 'Camera', 'Candle', 'Caterpillar', 'Corn'],
  D: ['Dog', 'Duck', 'Drum', 'Door', 'Donut', 'Dinosaur', 'Dragon', 'Dolphin', 'Desk', 'Daisy', 'Donkey', 'Dice', 'Doll', 'Diamond', 'Deer'],
  E: ['Egg', 'Elephant', 'Eagle', 'Ear', 'Envelope', 'Engine', 'Elf', 'Earth', 'Elbow', 'Eraser', 'Eye', 'Eight', 'Elevator', 'Eleven', 'Evergreen'],
  F: ['Fish', 'Frog', 'Flower', 'Fox', 'Fireworks', 'Fire', 'Fork', 'Feather', 'Flag', 'Foot', 'Fire truck', 'Fairy', 'Fries', 'Flamingo', 'Football'],
  G: ['Goat', 'Grapes', 'Guitar', 'Gift', 'Ghost', 'Girl', 'Glasses', 'Grass', 'Globe', 'Gum', 'Garden', 'Glue', 'Gorilla', 'Grasshopper', 'Game'],
  H: ['Hat', 'House', 'Horse', 'Heart', 'Hand', 'Hammer', 'Helicopter', 'Honey', 'Hippo', 'Hook', 'Hot dog', 'Hen', 'Hug', 'Hamburger', 'Hedgehog'],
  I: ['Igloo', 'Ice cream', 'Island', 'Ink', 'Insect', 'Iguana', 'Invitation', 'Instrument', 'Ice skate', 'Ivy', 'Iceberg', 'Ice hockey', 'Infant', 'Ice pop', 'Inn'],
  J: ['Juice', 'Jar', 'Jacket', 'Jeep', 'Jet', 'Jewel', 'Jungle', 'Jump rope', 'Jingle bell', 'Juggler', 'Jaguar', 'Jug', 'Jelly', 'Jigsaw', 'Jump'],
  K: ['Key', 'Kite', 'King', 'Kitten', 'Kangaroo', 'Kettle', 'Kiwi', 'Koala', 'Kayak', 'Kid', 'Kiss', 'Knee', 'Kick', 'Karate', 'Keyboard'],
  L: ['Leaf', 'Lion', 'Lamp', 'Lemon', 'Ladder', 'Ladybug', 'Lock', 'Lollipop', 'Lamb', 'Log', 'Lunch', 'Lake', 'Lobster', 'Lips', 'Lantern'],
  M: ['Moon', 'Mouse', 'Milk', 'Map', 'Monkey', 'Mitten', 'Mountain', 'Mushroom', 'Magnet', 'Motorcycle', 'Mango', 'Mask', 'Muffin', 'Music', 'Mug'],
  N: ['Nose', 'Nest', 'Nut', 'Net', 'Notebook', 'Nurse', 'Noodle', 'Necklace', 'Night', 'Newspaper', 'Nine', 'Necktie', 'Needle', 'Numbers', 'Notes'],
  O: ['Owl', 'Orange', 'Octopus', 'Ocean', 'Onion', 'Otter', 'Olive', 'Overalls', 'Oatmeal', 'Orbit', 'Ox', 'Orangutan', 'Oyster', 'Office', 'Omelet'],
  P: ['Pig', 'Pizza', 'Pencil', 'Pear', 'Penguin', 'Pumpkin', 'Piano', 'Plane', 'Popcorn', 'Panda', 'Pot', 'Peach', 'Puppy', 'Pineapple', 'Parrot'],
  Q: ['Quilt', 'Queen', 'Question', 'Quail', 'Quarter', 'Quill', 'Quesadilla', 'Quiet', 'Quicksand', 'Quiz', 'Quote', 'Quartz', 'Quiche', 'Quick', 'Quilt square'],
  R: ['Rain', 'Rainbow', 'Robot', 'Rocket', 'Rose', 'Rabbit', 'Ring', 'Raccoon', 'Radio', 'Ruler', 'Rhino', 'Rooster', 'Ribbon', 'Rice', 'Rat'],
  S: ['Sun', 'Snake', 'Star', 'Sock', 'Spoon', 'Seal', 'Sandwich', 'Squirrel', 'Strawberry', 'Ship', 'Spider', 'Shoe', 'Soap', 'Snail', 'Scissors'],
  T: ['Tree', 'Tiger', 'Train', 'Turtle', 'Truck', 'Tomato', 'Tent', 'Tooth', 'Tractor', 'Triangle', 'Turkey', 'Telescope', 'Tulip', 'Trophy', 'Taxi'],
  U: ['Umbrella', 'Unicorn', 'Up', 'Under', 'Ukulele', 'Uncle', 'UFO', 'Underground', 'Universe', 'Unlock', 'Umpire', 'Upside down', 'Utensils', 'Underwater', 'Uniform'],
  V: ['Van', 'Violin', 'Volcano', 'Village', 'Volleyball', 'Violet', 'Vet', 'Vampire', 'Video', 'Vegetables', 'Valentine', 'Vine', 'Vanilla', 'Voice', 'Vault'],
  W: ['Watermelon', 'Wagon', 'Whale', 'Worm', 'Window', 'Wolf', 'Watch', 'Water', 'Wand', 'Waffle', 'Web', 'Wheel', 'Witch', 'Wheat', 'Winter'],
  X: ['Xylophone', 'X-ray', 'X mark', 'Xmas tree', 'Xmas star', 'X-ray fish', 'X-ray glasses', 'X-ray hand', 'X-ray bone', 'X-ray heart', 'Xmas ball', 'Xmas snow', 'Xmas chime', 'Xmas sled', 'Xmas angel'],
  Y: ['Yarn', 'Yo-yo', 'Yak', 'Yellow', 'Yacht', 'Yard', 'Yam', 'Yawn', 'Yoga', 'Yellow bird', 'Yell', 'Yodel', 'Yummy', 'Yolk', 'Yes'],
  Z: ['Zebra', 'Zoo', 'Zipper', 'Zero', 'Zucchini', 'Zigzag', 'Zinnia', 'Zap', 'Zoom', 'Zombie', 'Zzz', 'Zebra crossing', 'Zipper bag', 'Zoo train', 'Zither'],
};

let fail = 0;
function assert(cond, msg) {
  if (!cond) {
    fail += 1;
    console.error(`FAIL  ${msg}`);
  } else {
    console.log(`ok    ${msg}`);
  }
}

/* Play whichever bonus board this letter drew, all correct taps. */
function playBonus(letter) {
  const b = round.getBonus();
  assert(!!b && b.items.length && b.need, `${letter} bonus board built (${b && b.type})`);
  if (!b) return;
  if (b.type === 'sound') {
    for (let i = 0; i < b.need + 2 && !round.bonusDone(); i += 1) {
      const item = round.bonusCurrent();
      if (!item) break;
      round.bonusTap(item.starts ? 'yes' : 'no');
    }
  } else if (b.type === 'order') {
    b.items.slice().sort((x, y) => x.rank - y.rank).forEach((it) => round.bonusTap(it.id));
  } else {
    b.items.filter((it) => it.target).forEach((it) => round.bonusTap(it.id));
  }
  assert(round.bonusDone(), `${letter} bonus completed (${b.type})`);
}

function twoTap(letter, { miss = false, hint = false } = {}) {
  if (miss) {
    const wrong = round.getRound().trial.choices.find((c) => c.letter !== letter).letter;
    round.select(wrong);
    assert(round.submit() === 'wrong', `${letter} miss counted`);
  }
  if (hint) round.useHint();
  round.select(letter);
  assert(round.submit() === 'right', `${letter} case two-tap`);
  assert(round.advance() === 'picture', `${letter} case → picture`);
  const pic = round.getRound().trial.picture;
  assert(pic && pic.word && pic.emoji, `${letter} picture picked from pool (${pic && pic.word})`);
  assert(round.getRound().trial.choices.every((c) => c.picture && c.picture.word), `${letter} every card has a picture`);
  round.select(letter);
  assert(round.submit() === 'right', `${letter} picture two-tap`);
  const step = round.advance();
  if (step === 'bonus') {
    playBonus(letter);
    assert(round.advance() === 'celebrate', `${letter} bonus → celebrate`);
  } else {
    assert(step === 'celebrate', `${letter} picture → celebrate (bonus off)`);
  }
  return round.bankLetter();
}

await loadData();
assert(letterByChar('A') && letterByChar('A').word === 'Apple', 'letter A loaded');
assert(kids().length >= 20, `roster has ${kids().length} kids`);

const ALPHABET_STR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const seenEmoji = new Map();
for (const L of ALPHABET_STR) {
  const pool = picturesFor(L);
  assert(pool.length === 15, `${L} picture pool has ${pool.length} pictures (want 15)`);
  assert(pool.every((p) => p.word && p.emoji && p.letter === L && p.id), `${L} pictures are well-formed`);
  const words = pool.map((p) => p.word);
  assert(new Set(words.map((w) => w.toLowerCase())).size === 15, `${L} picture words are unique`);
  /* Sound Sort asks "does it start with /f/?" and marks a pool picture yes.
     A word that does not start with its own letter makes that answer a lie. */
  assert(words.every((w) => w.charAt(0).toUpperCase() === L), `every ${L} word starts with ${L}`);
  /* Picture match deals one plate per choice letter. Two letters sharing an
     emoji is a board where the child cannot be right. */
  pool.forEach((p) => {
    if (seenEmoji.has(p.emoji)) {
      assert(false, `${p.emoji} is on two plates: ${seenEmoji.get(p.emoji)} and ${L}/${p.word}`);
    }
    seenEmoji.set(p.emoji, `${L}/${p.word}`);
  });
  const want = GAME_FLOW_WORDS[L];
  const missing = want.filter((w) => !words.includes(w));
  assert(missing.length === 0, `${L} matches GAME-FLOW words${missing.length ? ` (missing ${missing.join(', ')})` : ''}`);
  pool.forEach((p) => assert(hasPictureArt(p.id), `${L}/${p.id} has SVG art`));
  /* ui.js falls through to the plate's own emoji whenever art.js has no id.
     Nothing rides on that fallback today, but a picture added without a
     drawing has to land on its emoji, not on a blank card. */
  assert(pool.every((p) => p.emoji.trim().length > 0), `${L} plates all carry a fallback emoji`);
}
assert(seenEmoji.size === 26 * 15, `all ${seenEmoji.size} plates carry their own emoji`);
assert(awakeLetters().map((l) => l.letter).join('') === ALPHABET_STR, 'the whole alphabet is awake');
assert(letterByChar('E') && letterByChar('E').awake === true, 'E is awake');
assert(letterByChar('Z') && letterByChar('Z').awake === true, 'Z is awake');
/* The trail tile and the first board have to be the same picture. */
for (const L of ALPHABET_STR) {
  const entry = letterByChar(L);
  const anchor = picturesFor(L).find((p) => p.word === entry.word);
  assert(anchor && anchor.emoji === entry.emoji, `${L}'s trail stand-in (${entry.word}) is a plate in its own pool`);
}

const seenA = new Set();
for (let i = 0; i < 40; i += 1) seenA.add(pickPicture('A').word);
assert(seenA.size >= 4, `A pool is random (${seenA.size} unique in 40 picks)`);

store.setSetting('roundSize', 3);
store.setSetting('choiceCount', 3);
store.setSetting('caseMode', 'lower');
store.setSetting('hintAfter', 2);
store.setSetting('showWords', true);
store.setSetting('progressMode', 'stars-save');
store.setAudio('sfx', true);
store.setAudio('voice', true);
store.setAudio('music', false);
store.setClassroom(true);
store.clearKid();
store.setCursor('A');
store.setPinnedLetter(null);

const s = store.getSettings();
assert(s.roundSize === 3 && s.choiceCount === 3 && s.hintAfter === 2, 'play settings persist');
assert(s.progressMode === 'stars-save', 'default progress is stars-save');
assert(store.getAudio().sfx === true && store.getAudio().music === false, 'mute channels persist');
store.setAudio('voice', false);
assert(store.getAudio().voice === false && store.getAudio().sfx === true, 'voice mute is independent of sfx');
store.setAudio('music', true);
assert(store.getAudio().music === true && store.getAudio().voice === false, 'music mute is independent of voice');
store.setAudio('voice', true);
store.setAudio('music', false);
assert(store.isClassroom() === true && !store.getKidId(), 'classroom on, nobody playing');

store.setHideChrome(true);
assert(store.getHideChrome() === true, 'hide chrome persists');
assert(document.documentElement.dataset.chrome === 'hidden', 'html data-chrome=hidden');
store.setHideChrome(false);
assert(store.getHideChrome() === false, 'hide chrome off');
assert(document.documentElement.dataset.chrome === 'shown', 'html data-chrome=shown');
store.setMode('whiteboard');
assert(document.documentElement.dataset.mode === 'whiteboard', 'html data-mode=whiteboard');
store.setMode('center');
assert(document.documentElement.dataset.mode === 'center', 'mode back to center');

round.startRound({ startAt: 'A' });
assert(round.isActive(), 'round started at A');
assert(round.getRound().letters.join('') === 'ABC', `default 3-letter round is ABC (got ${round.getRound().letters.join('')})`);
assert(round.getRound().step === 'case', 'step A is case match');
assert(store.isClassroom() && !store.getKidId(), 'still needs a face');

const kid = kids()[0];
store.setKidId(kid.id);
assert(store.getKidId() === kid.id, `picked ${kid.name}`);

assert(round.submit() === null, 'submit with nothing selected is null');
assert(round.getRound().misses === 0, 'empty submit is not a miss');

const trial = round.getRound().trial;
assert(trial.hunt === 'lower', 'caseMode lower hunts little letters');
assert(trial.choices.length === 3, '3 choice cards');
assert(trial.choices.some((c) => c.letter === 'A'), 'correct card is in the mix');

const starsA = twoTap('A', { miss: true });
assert(starsA === 2, `banked ${starsA} stars for A (1 miss, no hint)`);
assert(store.starsFor('A') === 2, 'stars persisted for this kid');
assert(store.getCursor() === 'B', `cursor advanced to B after A (got ${store.getCursor()})`);
assert(store.getNextAbcIndex() === 1, `nextAbcIndex is 1 after A (got ${store.getNextAbcIndex()})`);
assert(JSON.parse(mem.get('rsabc.nextAbcIndex')) === 1, 'nextAbcIndex wrote rsabc.nextAbcIndex');
assert(store.stickers().some((s) => s.letter === 'A' && s.word), 'Star Pouch has an A sticker');

assert(round.nextLetter() === true, 'round continues to B');
assert(round.currentLetter().letter === 'B', 'now on letter B');
assert(round.getRound().step === 'case', 'B starts at case match');
assert(round.getRound().misses === 0, 'misses reset per letter');

const starsB = twoTap('B');
assert(starsB === 3, 'clean B → 3 stars');
assert(store.starsFor('B') === 3, 'B stars saved');
assert(store.getCursor() === 'C', 'cursor at C after B');

assert(round.nextLetter() === true, 'round continues to C');
const starsC = twoTap('C', { hint: true });
assert(starsC === 1, 'hint on C → 1 star');
assert(store.starsFor('C') === 1, 'C stars saved');
assert(store.getCursor() === 'D', 'cursor at D after C');
assert(round.nextLetter() === false, 'round of 3 is over after C');

const saved = JSON.parse(mem.get('rsabc.stars') || '{}');
assert(saved[kid.id] && saved[kid.id].A === 2 && saved[kid.id].B === 3 && saved[kid.id].C === 1,
  'stars-save wrote rsabc.stars in localStorage');

round.playAgain();
assert(round.isActive(), 'Play again started a new round');
assert(round.getRound().letters[0] === 'D', `Play again advances to D (got ${round.getRound().letters.join('')})`);
assert(round.getRound().letters.join('') === 'DEF', `the round carries on into the woken letters (got ${round.getRound().letters.join('')})`);
assert(round.getRound().step === 'case', 'new round starts on case match');

const starsD = twoTap('D');
assert(starsD === 3, 'clean D → 3 stars');
assert(store.starsFor('D') === 3, 'D stars saved');
assert(store.getCursor() === 'E', 'cursor walks on to E after D — nothing is asleep to skip');
assert(store.getNextAbcIndex() === 4, 'nextAbcIndex is 4 (E) after D');

/* The wrap is at the end of the real alphabet now, not at the end of A–D. */
round.goHome();
store.setCursor('Z');
round.startRound();
assert(round.getRound().letters.join('') === 'ZAB', `a round started at Z wraps into A (got ${round.getRound().letters.join('')})`);
round.goHome();
store.setCursor('A');

assert(store.totalStars() === 2 + 3 + 1 + 3, `Star Pouch total is ${store.totalStars()}`);
assert(store.starsFor('E') === 0, 'sleeping E has no stars');
assert(store.stickers().length === 4, `Star Pouch lists ${store.stickers().length} earned stickers (want 4)`);
const savedStickers = JSON.parse(mem.get('rsabc.stickers') || '{}');
assert(savedStickers[kid.id] && savedStickers[kid.id].length === 4, 'stickers-save wrote rsabc.stickers');

assert(typeof audio.sayLetterName === 'function', 'audio name stub');
assert(typeof audio.sayPhoneme === 'function', 'audio phoneme stub');
assert(typeof audio.sayWord === 'function', 'audio word stub');
assert(typeof audio.cheer === 'function', 'audio cheer stub');
assert(CHEERS.length >= 6 && NUDGES.length >= 4, 'cheer/nudge pools');
assert(looksLikeLetterName('A', 'A') && looksLikeLetterName('A!', 'A'), 'letter name detector');
assert(!looksLikeLetterName('ah', 'A') && !looksLikeLetterName('buh', 'B'), 'phoneme strings are not names');
assert(phonemeText({ letter: 'A', say: 'aaa' }) === 'ah', 'A phoneme TTS is ah, not aaa');
assert(phonemeText({ letter: 'A', say: 'A' }) === 'ah', 'A name never ships as the sound');
assert(phonemeText({ letter: 'B', say: 'B!' }) === 'buh', 'B name is rewritten to buh');
assert(phonemeText({ letter: 'C', say: 'kuh' }) === 'kuh', 'C keeps the sound');
assert(Object.keys(PHONEME_VOICE).length === 26, 'phoneme map covers A–Z');
for (const L of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
  const said = phonemeText({ letter: L, say: L });
  assert(said && said.toUpperCase() !== L, `${L} phoneme is not the letter name (got ${said})`);
}
const lettersFile = JSON.parse(readFileSync(join(root, 'data/letters.json'), 'utf8'));
lettersFile.letters.forEach((entry) => {
  assert(entry.say && entry.say.toUpperCase() !== entry.letter, `${entry.letter} say field is not the name`);
  assert(phonemeText(entry).toUpperCase() !== entry.letter, `${entry.letter} phonemeText is not the name`);
});

const audioSrc = readFileSync(join(root, 'js/audio.js'), 'utf8');
assert(/beginDuck/.test(audioSrc) && /setMusicDuck/.test(audioSrc), 'music ducks while voice');
assert(/musicGain/.test(audioSrc) && /sfxGain/.test(audioSrc), 'music and sfx are independent buses');
assert(/kind === 'phoneme'/.test(audioSrc), 'phoneme speak path is distinct from names');
assert(/silentUnlockPulse/.test(audioSrc), 'PLAY unlocks with a silent buffer, not a second music loop');
assert(/CLIP_WATCHDOG_MS/.test(audioSrc), 'a stalled clip cannot leave the music ducked');
assert(/function firstClip/.test(audioSrc), 'clip lookup walks a candidate chain (word-A-apple → word-A)');

/* --- three voice channels, three id namespaces ------------------------- */
const ALPHABET = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
assert(clipId.name('A') === 'name-A' && clipId.phoneme('A') === 'phoneme-A'
  && clipId.word('A', 'apple') === 'word-A-apple' && clipId.word('A') === 'word-A',
  'clip ids are built in one place, never typed at the call site');
assert(clipId.cheer(0) === 'cheer-1' && clipId.nudge(0) === 'nudge-1',
  'cheer/nudge clips are indexed to the line Lucy shows');
const nameIds = new Set(ALPHABET.map((L) => clipId.name(L)));
const phonemeIds = new Set(ALPHABET.map((L) => clipId.phoneme(L)));
const wordIds = new Set(lettersFile.letters.flatMap((e) => (e.pictures || []).map((p) => clipId.word(e.letter, p.id))));
assert(![...phonemeIds, ...wordIds].some((id) => nameIds.has(id)),
  'a phoneme or word tap can never reach a name clip id');
assert(![...wordIds].some((id) => phonemeIds.has(id)), 'word ids never collide with phoneme ids');

/* setClips is the last guard before a mis-mapped file reaches a child. */
audio.setClips({
  'name-A': 'lucy-name-a.m4a',
  'phoneme-A': 'lucy-name-a.m4a',        // same file as the NAME — must be dropped
  'phoneme-B': 'lucy-sound-b.m4a',
  'word-A-apple': null,                  // documented silent placeholder
  'cheer-1': '   ',
});
assert(audio.hasClip('name-A'), 'a real name clip is kept');
assert(!audio.hasClip('phoneme-A'), 'a phoneme clip pointing at the name file is dropped');
assert(audio.hasClip('phoneme-B'), 'an honest phoneme clip is kept');
assert(!audio.hasClip('word-A-apple') && !audio.hasClip('cheer-1'),
  'null / blank placeholders never become clips');

/* --- data/audio.json: silent placeholders, real Lucy later ------------- */
const audioFile = JSON.parse(readFileSync(join(root, 'data/audio.json'), 'utf8'));
const ph = audioFile.placeholders || {};
assert(audioFile.clips && Object.keys(audioFile.clips).length === 0,
  'no Lucy clip is mapped yet — the tablet speech voice stands in');
audio.setClips(audioFile.clips);
assert(audio.clipCount() === 0, 'the shipped audio.json maps zero clips');
assert(['name', 'phoneme', 'word', 'cheer', 'nudge'].every((k) => ph[k] && ph[k].ids && ph[k].say),
  'audio.json documents name / phoneme / word / cheer / nudge, each with what to say');
const phIds = Object.assign({}, ...['name', 'phoneme', 'word', 'cheer', 'nudge'].map((k) => ph[k].ids));
assert(Object.values(phIds).every((v) => v === null),
  `every documented placeholder is silent (${Object.keys(phIds).length} ids, all null)`);
const missingName = ALPHABET.filter((L) => !(clipId.name(L) in ph.name.ids));
assert(missingName.length === 0, `name placeholders cover A–Z (missing ${missingName.join('') || 'none'})`);
const missingPhoneme = ALPHABET.filter((L) => !(clipId.phoneme(L) in ph.phoneme.ids));
assert(missingPhoneme.length === 0, `phoneme placeholders cover A–Z (missing ${missingPhoneme.join('') || 'none'})`);
const awakeWordIds = lettersFile.letters
  .filter((e) => e.awake)
  .flatMap((e) => (e.pictures || []).map((p) => clipId.word(e.letter, p.id)));
const missingWord = awakeWordIds.filter((id) => !(id in ph.word.ids));
assert(awakeWordIds.length === 390 && missingWord.length === 0,
  `word placeholders cover all ${awakeWordIds.length} awake pictures (missing ${missingWord.slice(0, 4).join(', ') || 'none'})`);
const missingWordFallback = ALPHABET.filter((L) => !(clipId.word(L) in ph.word.ids));
assert(missingWordFallback.length === 0,
  `and every letter has a word-<L> fallback for a plate with no clip of its own (missing ${missingWordFallback.join('') || 'none'})`);
const missingCheer = CHEERS.map((_, i) => clipId.cheer(i)).filter((id) => !(id in ph.cheer.ids));
const missingNudge = NUDGES.map((_, i) => clipId.nudge(i)).filter((id) => !(id in ph.nudge.ids));
assert(missingCheer.length === 0 && 'cheer' in ph.cheer.ids,
  `cheer placeholders cover every line plus the catch-all (missing ${missingCheer.join(', ') || 'none'})`);
assert(missingNudge.length === 0 && 'nudge' in ph.nudge.ids,
  `nudge placeholders cover every line plus the catch-all (missing ${missingNudge.join(', ') || 'none'})`);
assert(/never the name/i.test(JSON.stringify(ph.phoneme.say)),
  'the phoneme recording note spells out: the sound, never the name');

store.setNote(kid.id, 'loves letter B');
assert(store.getNote(kid.id) === 'loves letter B', 'roster notes persist on this device');
assert(JSON.parse(mem.get('rsabc.notes'))[kid.id] === 'loves letter B', 'notes live under rsabc.notes');

const src = readFileSync(join(root, 'js/screens/grownups.js'), 'utf8');
assert(/const PIN = '1234'/.test(src), 'Grown-Ups PIN is 1234');
assert(/buildCsv/.test(src) && /applyCsv/.test(src), 'Grown-Ups wires CSV export/import');
assert(/Copy this tablet/.test(src), 'CSV lives on the Grown-Ups Class tab');
assert(/Hide chrome/.test(src) && /Shift\+H/.test(src), 'Grown-Ups Device offers hide chrome');
assert(/Kids never see this file/.test(src), 'CSV copy says kids never see the file');
assert(/familyNoteText/.test(src) && /copyFamilyNote/.test(src), 'Grown-Ups builds and copies a family note');
assert(/execCommand\('copy'\)/.test(src), 'and retries the old select-and-copy path when the async clipboard says no');
assert(/press Ctrl\+C/.test(src), 'a refused clipboard still leaves the teacher the note to select');
assert(/Set up this device/.test(src) && /Get update/.test(src), 'offline setup + get update');
assert(/APP_VERSION/.test(src), 'Grown-Ups shows the version pin');

/* The family note is the thing a grown-up pastes into a newsletter: it has to
   read like a finished note, not like a placeholder with the letter swapped in. */
const gu = await import('./js/screens/grownups.js');
const keepPin = store.getPinnedLetter();

store.setPinnedLetter('A');
const noteA = gu.familyNoteText();
assert(/A is for Apple\./.test(noteA), 'family note carries the letter AND the word');
assert(noteA.includes('aaa') && noteA.includes('/\u00e6/'), 'and the sound Lucy makes, spelled out');
assert(/not its name/.test(noteA), 'and warns the grown-up off the letter name');
assert(noteA.includes(className()), 'and names this class');
assert(/Alligator/.test(noteA) && /Ant/.test(noteA), 'and hands the family more A words to hunt');
assert(!/pinned|cursor|trail|stub|TODO/i.test(noteA), 'no Grown-Ups plumbing leaks into a family note');
assert(noteA.split('\n').every((line) => line === line.trim()), 'every line copies clean — no stray indent');
assert(noteA.trim() === noteA && !/\n{3}/.test(noteA), 'no leading, trailing or double blank lines');
assert(noteA.endsWith('Ready Set ABC \u00b7 Pre-K Phonics with Lucy'), 'and it signs off as the app');

store.setPinnedLetter('B');
assert(/B is for Ball\./.test(gu.familyNoteText()), 'the note follows the pinned letter');

/* Every letter runs now, so a pin anywhere in the alphabet is the letter the
   note is about — including the far end, which used to be asleep. */
store.setPinnedLetter('E');
assert(/E is for Egg\./.test(gu.familyNoteText()), 'a woken pin is the letter the family note talks about');
store.setPinnedLetter('Z');
const noteZ = gu.familyNoteText();
assert(/Z is for Zebra\./.test(noteZ), 'and so is the last letter on the trail');
assert(!/nap|sleep|not yet|coming soon/i.test(noteZ), 'no letter is written up as one that will not open');
assert(gu.familyNoteText('C').includes('C is for Cat.'), 'and a letter can be asked for by name');

store.setPinnedLetter(keepPin);

const app = readFileSync(join(root, 'js/app.js'), 'utf8');
assert(/pickme:\s*'faces'/.test(app) && /map:\s*'trail'/.test(app), 'old hashes aliased');
assert(/name === 'faces'/.test(app), 'faces is a real route');
assert(/setHideChrome/.test(app) && /key === 'H'/.test(app), 'Shift+H toggles hide chrome');

const html = readFileSync(join(root, 'index.html'), 'utf8');
assert(
  ['css/tokens.css', 'css/shell.css', 'css/play.css', 'css/grownups.css']
    .every((href) => html.includes(href)),
  'all four stylesheets linked',
);
assert(html.includes('js/app.js'), 'app module loaded');
assert(/data-chrome="shown"/.test(html), 'html defaults to chrome shown');

const sw = readFileSync(join(root, 'sw.js'), 'utf8');
assert(sw.includes('css/play.css') && sw.includes('js/screens/faces.js'), 'SW precaches stitch shell');
assert(sw.includes('js/version.js'), 'SW precaches the version pin');
const swVer = (sw.match(/const VERSION = '([^']+)'/) || [])[1];
const { APP_VERSION } = await import('./js/version.js');
assert(swVer === APP_VERSION, `shell version pin matches (${APP_VERSION})`);

function parseShell(src) {
  const block = src.match(/const SHELL = \[([\s\S]*?)\];/);
  if (!block) return [];
  const body = block[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  return [...body.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}
function listed(dir, ext) {
  return readdirSync(join(root, dir)).filter((f) => f.endsWith(ext)).map((f) => `${dir}/${f}`);
}
const shellSet = new Set(parseShell(sw));
const runtime = [
  'index.html', 'manifest.webmanifest',
  ...listed('css', '.css'),
  ...listed('js', '.js'),
  ...listed('js/screens', '.js'),
  ...listed('data', '.json'),
  ...listed('icons', '.png'),
  ...listed('icons', '.svg'),
  ...listed('fonts', '.woff2'),
];
const missingShell = runtime.filter((p) => !shellSet.has(p));
assert(missingShell.length === 0, `SW SHELL covers every runtime file${missingShell.length ? ` (missing ${missingShell.join(', ')})` : ''}`);
assert(shellSet.has('./') && shellSet.has('index.html'), "SW SHELL includes './' and index.html");
assert(!['_check.mjs', '_flow.mjs', '_smoke.html', 'sw.js'].some((p) => shellSet.has(p)),
  'SW SHELL does not pin dev files or the worker script');
assert(!/fonts\.googleapis|fonts\.gstatic/.test(sw), 'SW does not pin Google Fonts URLs');
assert(/pathname\.endsWith\('\/sw\.js'\)/.test(sw), 'SW does not cache-first intercept itself');
assert(/precacheInto/.test(sw), 'install and teacher precache share one completeness pass');

const lucy = readFileSync(join(root, 'js/lucy.js'), 'utf8');
assert(/dataset.pose/.test(lucy) && /lucy-glasses/.test(lucy) && /lucy-bows/.test(lucy),
  'Lucy pose + glasses + bows');
assert(/dataset.talking/.test(lucy), 'talking is an overlay on pose');
assert(/lucy-prompt/.test(lucy), 'Lucy bubble is a lucy-prompt');

const playCss = readFileSync(join(root, 'css/play.css'), 'utf8');
assert(/data-mode="whiteboard"/.test(playCss) && /--target-card/.test(playCss),
  'whiteboard scales choice cards');
assert(/aria-pressed="true"/.test(playCss) && /ring-select/.test(playCss), 'sky-blue select ring');
assert(/choice.wrong/.test(playCss) && /choice.right/.test(playCss), 'coral miss + mint correct');
assert(/html:not\(\[data-mode="whiteboard"\]\)/.test(playCss),
  'Lucy hide skips whiteboard mode');
assert(!/html\[data-mode="whiteboard"\][^{]{0,80}\.board-lucy \{[\s\S]{0,40}display:\s*none/.test(playCss),
  'whiteboard never hides the Lucy column');
assert(/data-chrome="hidden"/.test(playCss) && /lucy-prompt/.test(playCss),
  'hide-chrome keeps lucy-prompt visible');

const tokens = readFileSync(join(root, 'css/tokens.css'), 'utf8');
assert(/--lip-idle/.test(tokens) && /--ring-correct/.test(tokens), 'extruded-lip + mint ring tokens');
assert(/data-mode="whiteboard"/.test(tokens) && /140px/.test(tokens), 'whiteboard target tokens');
assert(/--lip-idle: var\(--on-surface\)/.test(tokens), 'whiteboard lips are high-contrast cocoa');
assert(/--ring-select: 0 0 0 6px/.test(tokens), 'whiteboard select ring is 6px');

const shellCss = readFileSync(join(root, 'css/shell.css'), 'utf8');
assert(/data-chrome="hidden"/.test(shellCss) && /\.tabs/.test(shellCss),
  'hide-chrome shell hides tabs');
assert(/lucy-prompt/.test(shellCss) && /display: block !important/.test(shellCss),
  'hide-chrome / whiteboard keep Lucy prompts');
assert(/box-shadow: 0 0 0 4px var\(--on-surface\)/.test(shellCss),
  'whiteboard Lucy prompt is outlined cocoa');

const mf = JSON.parse(readFileSync(join(root, 'manifest.webmanifest'), 'utf8'));
assert(mf.start_url === './' && mf.orientation === 'landscape', 'manifest start_url + landscape');

/* Grown-Ups round size / choice count actually drive the next round, not mid-letter. */
round.goHome();
store.setSetting('roundSize', 1);
store.setSetting('choiceCount', 6);
store.setCursor('B');
round.startRound();
assert(round.getRound().letters.join('') === 'B', `roundSize 1 starts a 1-letter round (got ${round.getRound().letters.join('')})`);
assert(round.getRound().trial.choices.length === 6, `choiceCount 6 deals 6 cards (got ${round.getRound().trial.choices.length})`);
store.setSetting('roundSize', 8);
store.setSetting('choiceCount', 2);
assert(round.getRound().letters.join('') === 'B', 'mid-round roundSize edit does not resize this round');
assert(round.getRound().trial.choices.length === 6, 'mid-round choiceCount edit does not shrink this trial');
round.buildTrial();
assert(round.getRound().trial.choices.length === 6, 'rebuild still uses frozen choiceCount');

round.goHome();
store.setSetting('roundSize', 5);
store.setSetting('choiceCount', 2);
store.setCursor('A');
round.startRound();
assert(round.getRound().letters.join('') === 'ABCDE', `roundSize 5 deals five letters off the woken alphabet (got ${round.getRound().letters.join('')})`);
assert(round.getRound().trial.choices.length === 2, 'choiceCount 2 deals 2 cards');
/* The clamp is the size of the awake pool, wherever that lands. */
round.goHome();
store.setSetting('roundSize', 8);
store.setCursor('W');
round.startRound();
assert(round.getRound().letters.join('') === 'WXYZABCD',
  `a round that runs off the end wraps rather than repeating a letter (got ${round.getRound().letters.join('')})`);
assert(new Set(round.getRound().letters).size === round.getRound().letters.length,
  'and no letter is dealt twice in one round');
round.goHome();
store.setSetting('roundSize', 5);
store.setCursor('A');
round.startRound();

/* Hint after 2 misses flags hinted (and therefore 1 star).
   Bonus Off here also proves the two-step letter Grown-Ups can ask for. */
round.goHome();
store.setSetting('roundSize', 1);
store.setSetting('choiceCount', 3);
store.setSetting('hintAfter', 2);
store.setSetting('bonusMode', 'off');
store.setCursor('A');
round.startRound({ startAt: 'A' });
const wrong = round.getRound().trial.choices.find((c) => c.letter !== 'A').letter;
round.select(wrong);
assert(round.submit() === 'wrong', 'first miss');
assert(round.getRound().hinted === false, 'hint waits for 2 misses');
round.select(wrong);
assert(round.submit() === 'wrong', 'second miss');
assert(round.getRound().hinted === true, 'auto-hint after 2 misses');
round.select('A');
assert(round.submit() === 'right', 'hinted letter still matchable');
assert(round.advance() === 'picture', 'hinted case → picture');
round.select('A');
assert(round.submit() === 'right', 'picture after hint');
assert(round.advance() === 'celebrate', 'Bonus Off: picture → celebrate, no third step');
assert(round.getBonus() === null, 'Bonus Off builds no board at all');
assert(round.bankLetter() === 1, 'hinted letter banks 1 star');
store.setSetting('bonusMode', 'rotate');

const celebrate = readFileSync(join(root, 'js/screens/celebrate.js'), 'utf8');
assert(/playAgain\(/.test(celebrate), 'celebrate round-end calls playAgain');
assert(/upNextLetter\(\)/.test(celebrate), 'celebrate names the next letter from upNextLetter');
assert(/Play Letter \$\{nextEntry\}/.test(celebrate), 'celebrate CTA prints that letter');

const match = readFileSync(join(root, 'js/screens/match.js'), 'utf8');
assert(/sayLetterName/.test(match), 'board appear says letter name');
assert(/sayPhoneme/.test(match), 'letter choice says phoneme');
assert(/sayWord/.test(match), 'picture tap says word');
assert(/cheer\(/.test(match), 'correct match cheers');
assert(/say\(`Listen:[\s\S]*\{ voice: false \}/.test(match), 'hint caption does not speak the sound');
assert(!/else audio\.sayLetterName/.test(match), 'choice tap is not the letter name');

const home = readFileSync(join(root, 'js/screens/home.js'), 'utf8');
assert(/pressable\(playBtn[\s\S]{0,200}audio\.unlock\(\)/.test(home), 'PLAY unlocks audio');
assert(/audio\.speak\('Lucy!'\)/.test(home), 'Say Lucy speaks if already unlocked');
assert(!/audio\.unlock\(\); audio\.speak\('Lucy!'\)/.test(home), 'Say Lucy does not unlock');
assert(!/audio\.unlock\(\); audio\.sfx\('woof'\)/.test(home), 'Friendly Woof does not unlock');

const cluster = app.slice(app.indexOf('function paintCluster'), app.indexOf('function paintWho'));
assert(!/audio\.unlock/.test(cluster), 'header mute dots do not unlock the speaker');
assert(/audio\.applyMutes/.test(cluster), 'header mutes call applyMutes');

const pouchSrc = readFileSync(join(root, 'js/screens/pouch.js'), 'utf8');
assert(!/audio\.unlock/.test(pouchSrc), 'Star Pouch replay does not unlock');

assert(/listen-btn,[\s\S]*hint-btn,[\s\S]*hear-again \{[\s\S]*min-height: var\(--target-min\)/.test(playCss),
  'whiteboard Listen / Hint / Hear again are --target-min');
assert(/play-btn \{[\s\S]*max\(var\(--target-min\), 140px\)/.test(playCss), 'whiteboard PLAY is at least 140px');
assert(/round-card \{ min-height: var\(--target-min\)/.test(playCss), 'whiteboard round cards are --target-min');

assert(existsSync(join(root, 'fonts/README.md')), 'font notes live in fonts/README.md');
assert(/Self-hosted fonts/.test(sw), 'SW says where the self-hosted fonts come from');
const fontsNote = readFileSync(join(root, 'fonts/README.md'), 'utf8');
assert(/woff2/.test(fontsNote) && /SHELL/.test(fontsNote) && /version\.js/.test(fontsNote),
  'fonts/README.md tells how to pin woff2 files');
assert(/fonts\.googleapis/.test(fontsNote), 'fonts/README.md warns not to pin googleapis');

/* --- the Stitch look survives the radio being off ----------------------
   index.html asks googleapis for nothing now, so these six files ARE the
   typography. A face that is missing, unpinned or not declared does not
   break — it silently drops to Trebuchet, which nobody reports. Fail here. */
const FACES = [
  ['fonts/Comfortaa-Medium.woff2', 'Comfortaa', 500],
  ['fonts/Comfortaa-Bold.woff2', 'Comfortaa', 700],
  ['fonts/NunitoSans-SemiBold.woff2', 'Nunito Sans', 600],
  ['fonts/NunitoSans-Bold.woff2', 'Nunito Sans', 700],
  ['fonts/NunitoSans-ExtraBold.woff2', 'Nunito Sans', 800],
  ['fonts/NunitoSans-Black.woff2', 'Nunito Sans', 900],
];
const faceBlocks = [...tokens.matchAll(/@font-face\s*\{([\s\S]*?)\}/g)].map((m) => m[1]);
assert(faceBlocks.length >= FACES.length,
  `tokens.css declares every self-hosted face (${faceBlocks.length} @font-face blocks)`);
FACES.forEach(([path, family, weight]) => {
  const full = join(root, path);
  assert(existsSync(full), `${path} ships in the app`);
  if (existsSync(full)) {
    const buf = readFileSync(full);
    assert(buf.toString('latin1', 0, 4) === 'wOF2' && buf.length > 2000,
      `${path} is a real woff2 (${buf.length}B)`);
  }
  assert(shellSet.has(path), `${path} is pinned in SW SHELL`);
  const block = faceBlocks.find((b) => b.includes(`../${path}`));
  assert(!!block, `tokens.css @font-face points at ../${path}`);
  if (block) {
    assert(new RegExp(`font-family:\\s*"${family}"`).test(block), `${path} is ${family}`);
    assert(new RegExp(`font-weight:\\s*${weight}\\b`).test(block), `${path} is weight ${weight}`);
    assert(/font-display:\s*swap/.test(block), `${path} swaps rather than blocking play`);
  }
});
/* Weights the CSS really asks for have to be weights we really ship. The
   @font-face blocks are the supply side, not the demand side — strip them
   first or Comfortaa 500 reads as a Nunito weight nobody ships. */
const bodyWeights = new Set();
['css/shell.css', 'css/play.css', 'css/grownups.css', 'css/tokens.css', 'css/print.css'].forEach((f) => {
  const src = readFileSync(join(root, f), 'utf8').replace(/@font-face\s*\{[\s\S]*?\}/g, '');
  for (const hit of src.matchAll(/font-weight:\s*(\d{3})/g)) bodyWeights.add(Number(hit[1]));
});
const shippedNunito = new Set(FACES.filter(([, fam]) => fam === 'Nunito Sans').map(([, , w]) => w));
[...bodyWeights].forEach((w) => assert(shippedNunito.has(w),
  `the CSS asks for font-weight ${w} and Nunito Sans ${w} ships`));

const htmlCode = html.replace(/<!--[\s\S]*?-->/g, '');
assert(!/fonts\.googleapis|fonts\.gstatic/.test(htmlCode),
  'index.html links no Google Fonts — first paint never waits on the network');
assert(/rel="preload"[^>]*as="font"[^>]*crossorigin/.test(htmlCode)
  || /rel="preload"[^>]*crossorigin[^>]*as="font"/.test(htmlCode),
  'index.html preloads its first-paint faces with as=font + crossorigin');
[...htmlCode.matchAll(/<link[^>]*rel="preload"[^>]*>/g)].forEach((pre) => {
  const href = (pre[0].match(/href="([^"]+)"/) || [])[1] || '';
  if (!/\.woff2?$/.test(href)) return;
  assert(shellSet.has(href), `preloaded font ${href} is pinned in SHELL`);
});
assert(/"Comfortaa",\s*"Quicksand"/.test(tokens) && /"Nunito Sans",\s*"Nunito"/.test(tokens),
  'and the stacks still fall through to system rounded fonts if a face is evicted');
['fonts/Comfortaa-OFL.txt', 'fonts/NunitoSans-OFL.txt'].forEach((lic) => {
  assert(existsSync(join(root, lic)), `${lic} travels with the fonts`);
  if (existsSync(join(root, lic))) {
    assert(/Open Font License/i.test(readFileSync(join(root, lic), 'utf8')), `${lic} is the OFL`);
  }
});
assert(existsSync(join(root, 'icons/make-icons.py')), 'icon regen script ships');
assert(existsSync(join(root, '_smoke.html')), '_smoke.html ships');
const smoke = readFileSync(join(root, '_smoke.html'), 'utf8');
assert(/location\.replace\('index\.html'/.test(smoke), '_smoke.html bounces into the app');
assert(/classroom/.test(smoke) && /hideChrome/.test(smoke) && /reset/.test(smoke) && /play/.test(smoke),
  '_smoke.html accepts classroom/hideChrome/reset/play');
const readme = readFileSync(join(root, 'README.md'), 'utf8');
assert(/python3 -m http\.server 8000/.test(readme), 'README has the http.server run command');
assert(/node _check\.mjs/.test(readme) && /node _flow\.mjs/.test(readme), 'README has the gate commands');
assert(/_smoke\.html/.test(readme) && /make-icons\.py/.test(readme), 'README has smoke + icon regen');
assert(/1234/.test(readme), 'README documents PIN 1234');
assert(readme.includes(APP_VERSION), `README names the current shell pin (${APP_VERSION})`);

/* Grown-Ups CSV: progress + settings round-trip. Kid chrome stays clean. */
['home.js', 'faces.js', 'match.js', 'bonus.js', 'celebrate.js', 'trail.js', 'pouch.js'].forEach((file) => {
  const body = readFileSync(join(root, `js/screens/${file}`), 'utf8');
  assert(!/Export CSV|Import CSV|buildCsv|applyCsv/.test(body), `${file} does not expose CSV`);
});
assert(sw.includes('js/csv.js'), 'SW precaches csv.js');

assert(JSON.stringify(csv.parseCsv('a,"b,c","d""e"')) === JSON.stringify([['a', 'b,c', 'd"e']]),
  'CSV parser keeps commas and quotes inside fields');
assert(JSON.stringify(csv.parseCsv(csv.serializeCsv([['kind', 'notes'], ['kid', 'loves B, "really"']])))
  === JSON.stringify([['kind', 'notes'], ['kid', 'loves B, "really"']]),
  'CSV serialize → parse round-trips quoted notes');

function bitsOf(snap) {
  return JSON.stringify({
    settings: snap.settings,
    audio: snap.audio,
    mode: snap.mode,
    hideChrome: snap.hideChrome,
    classroom: snap.classroom,
    outfit: snap.outfit,
    pinnedLetter: snap.pinnedLetter,
    nextAbcIndex: snap.nextAbcIndex,
    kidId: snap.kidId,
    hasRosterOverride: snap.hasRosterOverride,
    roster: snap.roster,
    notes: snap.notes,
    stars: snap.stars,
    stickers: snap.stickers,
    progress: snap.progress,
  });
}

store.reset();
store.setClassroom(true);
store.setKidId('k01');
store.setSetting('roundSize', 5);
store.setSetting('choiceCount', 6);
store.setSetting('showWords', false);
store.setSetting('caseMode', 'upper');
store.setSetting('hintAfter', 0);
store.setSetting('progressMode', 'stars-save');
store.setAudio('music', true);
store.setAudio('sfx', false);
store.setAudio('voice', true);
store.setMode('whiteboard');
store.setHideChrome(true);
store.setPinnedLetter('C');
store.setNextAbcIndex(2);
store.setRosterOverride([
  { id: 'k01', name: 'Ava', emoji: '🦊', color: '#ff8a5c' },
  { id: 'k99', name: 'Juniper', emoji: '🌟', color: '#c48cf0' },
]);
store.setNote('k01', 'loves B, "really"');
store.awardStars('A', 3);
store.awardStars('B', 2);
store.recordRound('k01', 'A', 3);
store.recordRound('k01', 'B', 2);
store.awardSticker({ letter: 'A', id: 'apple', word: 'Apple', emoji: '🍎' });
store.awardSticker({ letter: 'B', id: 'ball', word: 'Ball', emoji: '🏀' });

const before = store.exportSnapshot();
const csvText = csv.buildCsv();
assert(csvText.includes(csv.CSV_FORMAT), 'export is rsabc-csv-v1');
assert(/setting,roundSize,5/.test(csvText), 'CSV includes roundSize');
assert(/setting,music,true/.test(csvText), 'CSV includes audio mutes');
assert(/setting,mode,whiteboard/.test(csvText), 'CSV includes device mode');
assert(/setting,hideChrome,true/.test(csvText), 'CSV includes hide chrome');
assert(csvText.includes('"loves B, ""really"""'), 'CSV quotes notes that contain commas and quotes');
assert(csvText.includes('Juniper') && csvText.includes('apple'), 'CSV includes roster + sticker ids');

store.reset();
assert(store.getSettings().roundSize === 3, 'reset returns default roundSize');
assert(store.getHideChrome() === false, 'reset returns hide chrome off');
assert(document.documentElement.dataset.chrome === 'shown', 'reset shows chrome');
assert(Object.keys(store.getStars('k01')).length === 0, 'reset clears stars');

const restored = csv.applyCsv(csvText);
assert(restored.ok === true && restored.format === 'backup', `backup import ok (${restored.summary || restored.error})`);
const after = store.exportSnapshot();
assert(bitsOf(before) === bitsOf(after), 'CSV backup round-trips progress + settings');
assert(store.getSettings().roundSize === 5 && store.getSettings().choiceCount === 6, 'round size/choices restored');
assert(store.getSettings().showWords === false && store.getSettings().caseMode === 'upper', 'play toggles restored');
assert(store.getSettings().hintAfter === 0, 'hintAfter 0 restored');
assert(store.getAudio().music === true && store.getAudio().sfx === false && store.getAudio().voice === true,
  'independent mutes restored');
assert(store.getMode() === 'whiteboard' && store.isClassroom() === true, 'mode + classroom restored');
assert(store.getHideChrome() === true, 'hide chrome restored');
assert(store.getPinnedLetter() === 'C' && store.getNextAbcIndex() === 2, 'pin + ABC cursor restored');
assert(store.getKidId() === 'k01', 'who is playing restored');
assert(store.getNote('k01') === 'loves B, "really"', 'notes with comma/quote restored');
assert(store.getStars('k01').A === 3 && store.getStars('k01').B === 2, 'per-letter stars restored');
assert(store.getStickerMap('k01').some((s) => s.id === 'apple' && s.word === 'Apple'), 'stickers restored');
assert(kids().length === 2 && kids()[1].name === 'Juniper', 'roster override restored');
assert(store.getProgress().k01.letters.A.bestStars === 3, 'progress records restored');

const second = csv.applyCsv(csv.buildCsv());
assert(second.ok === true, 'second import of a re-export succeeds');
assert(bitsOf(before) === bitsOf(store.exportSnapshot()), 'export → import → export → import stays stable');

const keepRound = store.getSettings().roundSize;
const bad = csv.applyCsv('hello,world\nfoo,bar');
assert(bad.ok === false, 'unknown CSV is rejected');
assert(store.getSettings().roundSize === keepRound, 'rejected CSV does not wipe settings');
assert(csv.applyCsv('').ok === false, 'empty CSV is rejected');
assert(csv.applyCsv('kind,key,value\nmeta,format,rsabc-csv-v1\n').ok === false, 'meta-only CSV is rejected');

store.setSetting('roundSize', 8);
store.setAudio('voice', false);
const legacy = csv.applyCsv('name,emoji,color,notes\nAva,🦊,#ff8a5c,hello\nNew Kid,🐾,#5aa9f0,\n');
assert(legacy.ok === true && legacy.format === 'roster', `legacy roster import ok (${legacy.error || 'ok'})`);
assert(store.getSettings().roundSize === 8 && store.getAudio().voice === false, 'legacy roster does not clobber settings');
assert(kids().some((k) => k.id === 'k01' && k.name === 'Ava'), 'legacy import keeps Ava’s id so stars still match');
assert(kids().some((k) => k.name === 'New Kid'), 'legacy import adds new names');
assert(store.getStars('k01').A === 3, 'legacy import does not drop stars for matching names');

store.reset();
store.setClassroom(false);
store.setSetting('roundSize', 1);
store.setMode('small-group');
store.awardStars('D', 1);
store.recordRound(null, 'D', 1);
store.awardSticker({ letter: 'D', id: 'dog', word: 'Dog', emoji: '🐶' });
const deviceCsv = csv.buildCsv();
/* _device is skipped in the roster loop, so it has no kid row to carry
   lastAt. Without the deviceLastPlayed setting a backup quietly forgets
   that this tablet played today, and the streak restarts on restore. */
const deviceLast = store.getProgress()._device.lastPlayed;
assert(typeof deviceLast === 'string' && deviceLast.length > 0,
  'a device round stamps _device lastPlayed');
assert(deviceCsv.includes(`setting,deviceLastPlayed,${deviceLast}`),
  'CSV carries deviceLastPlayed when _device has lastPlayed');
store.reset();
assert(!csv.buildCsv().includes('deviceLastPlayed'),
  'and leaves the setting out when this tablet has never played');
assert(csv.applyCsv(deviceCsv).ok === true, 'device-owner backup imports');
assert(store.getProgress()._device.lastPlayed === deviceLast,
  '_device lastPlayed round-trips through the backup');
assert(store.isClassroom() === false, 'classroom-off restored');
assert(store.getMode() === 'small-group', 'small-group mode restored');
assert(store.getStars('_device').D === 1, '_device stars restored');
assert(store.getStickerMap('_device').some((s) => s.id === 'dog'), '_device stickers restored');
assert(store.getProgress()._device.letters.D.bestStars === 1, '_device progress restored');

/* ---- PASS C1: teacher printables (Grown-Ups → Print) ------------------ */
const printables = await import('./js/screens/printables.js');

store.reset();
store.setClassroom(true);
store.setRosterOverride([
  { id: 'k01', name: 'Ava', emoji: '🦊', color: '#ff8a5c' },
  { id: 'k02', name: 'Marcus', emoji: '🐢', color: '#4ec3a5' },
  { id: 'k03', name: 'Sofia', emoji: '🦋', color: '#c48cf0' },
]);
store.setKidId('k01');
store.awardStars('A', 3);
store.awardStars('B', 2);
store.recordRound('k01', 'A', 3);

store.setPinnedLetter('C');
assert(printables.activeLetter() === 'C', 'print follows the pinned letter');
store.setPinnedLetter(null);
store.setCursor('B');
assert(printables.activeLetter() === 'B', 'no pin → print follows the ABC cursor');
store.setPinnedLetter('A');

assert(printables.certificateTargets('class').length === 3, 'whole class = one certificate per child');
assert(printables.certificateTargets('today').map((k) => k.id).join() === 'k01',
  'played-today certificates only cover children with a round today');
assert(printables.certificateTargets('one').map((k) => k.id).join() === 'k01',
  'just-this-child follows who is playing');
assert(printables.certificateTargets('blank').join() === '', 'blank certificate has no child');

const certs = printables.buildCertificates({ who: 'class', letter: 'A' });
assert(certs.nodes.length === 3, `whole-class print builds ${certs.nodes.length} pages (want 3)`);
assert(certs.nodes.every((n) => String(n.className).includes('sheet') && String(n.className).includes('sheet--cert')),
  'every certificate page is a .sheet .sheet--cert');
const certOne = textOf(certs.nodes[0]);
assert(/Letter Champion/.test(certOne), 'certificate says Letter Champion');
assert(/Ava/.test(certOne), 'certificate prints the child name');
assert(/A is for Apple/.test(certOne), 'certificate names the letter anchor word');
assert(/“ah”/.test(certOne), 'certificate prints the SOUND, not the letter name');
assert(certOne.includes(className()), 'certificate carries the class name');
assert(/Date/.test(certOne) && /Teacher/.test(certOne), 'certificate has date + teacher signature lines');
assert(byClass(certs.nodes[0], 'cert-name')[0].textContent === 'Ava', 'the ruled name line carries the child name');
assert(byClass(certs.nodes[0], 'pstars')[0].childNodes.filter((s) => s.className === 'on').length === 3,
  'Ava earned 3 stars on A, so 3 stars print filled');
const certB = printables.buildCertificates({ who: 'class', letter: 'B' });
assert(byClass(certB.nodes[0], 'pstars')[0].childNodes.filter((s) => s.className === 'on').length === 2,
  'letter B prints Ava’s 2 stars');

const blank = printables.buildCertificates({ who: 'blank', letter: 'A' });
assert(blank.nodes.length === 1, 'blank prints exactly one certificate');
assert(byClass(blank.nodes[0], 'cert-name')[0].textContent === '', 'blank certificate leaves the name line empty');
assert(String(byClass(blank.nodes[0], 'cert-name')[0].className).includes('is-blank'),
  'blank name line is taller for handwriting');
assert(textOf(byClass(blank.nodes[0], 'pstars')[0]).replace(/\s/g, '') === '☆☆☆',
  'unearned stars print as hollow glyphs, so a printer with backgrounds off still shows them');
assert(textOf(byClass(certs.nodes[0], 'pstars')[0]).replace(/\s/g, '') === '★★★',
  'earned stars print as solid glyphs');

store.setRosterOverride([]);
const noKids = printables.buildCertificates({ who: 'class', letter: 'A' });
assert(printables.certificateTargets('class').length === 0, 'an empty class list has no certificate targets');
assert(noKids.nodes.length === 1 && /blank certificate/.test(noKids.note),
  'empty class list still prints one blank certificate and says so');
assert(byClass(noKids.nodes[0], 'cert-name')[0].textContent === '', 'that fallback certificate has an empty name line');
assert(printables.rosterCardSheets({ stars: true }).length === 0, 'empty class list prints no roster cards');
store.setRosterOverride([
  { id: 'k01', name: 'Ava', emoji: '🦊', color: '#ff8a5c' },
  { id: 'k02', name: 'Marcus', emoji: '🐢', color: '#4ec3a5' },
  { id: 'k03', name: 'Sofia', emoji: '🦋', color: '#c48cf0' },
]);

const group = printables.groupSheet({ letter: 'A', names: true });
const groupText = textOf(group);
assert(String(group.className).includes('sheet--group'), 'small-group sheet is a .sheet--group page');
assert(/Small group/.test(groupText), 'small-group sheet is labelled');
assert(/Adult sheet/.test(groupText), 'small-group sheet says it is for the grown-up');
assert(/A is for Apple/.test(groupText), 'small-group sheet carries the anchor word');
assert(/“ah”/.test(groupText), 'small-group script gives the adult the sound');
assert(/say the letter name/.test(groupText), 'small-group script separates the name from the sound');
assert(/PIN 1234/.test(groupText), 'small-group sheet reminds the adult of the gate PIN');
const bankWords = byClass(group, 'wordbank')[0].childNodes.map((li) => li.textContent);
assert(bankWords.length === 15, `word bank prints all ${bankWords.length} pool words (want 15)`);
GAME_FLOW_WORDS.A.forEach((word) => assert(bankWords.includes(word), `word bank has ${word}`));
const groupRows = byTag(byTag(group, 'tbody')[0], 'TR');
assert(groupRows.length === 3, `turn-taking grid fills 3 roster rows (got ${groupRows.length})`);
assert(byClass(group, 'who').map((td) => td.textContent).join() === 'Ava,Marcus,Sofia',
  'turn-taking grid prints the roster names in order');
const groupBlank = printables.groupSheet({ letter: 'A', names: false });
assert(byTag(byTag(groupBlank, 'tbody')[0], 'TR').length === 8, 'blank turn-taking grid is 8 empty rows');
assert(byClass(groupBlank, 'who').every((td) => td.textContent === ''), 'blank grid prints no names');
const groupD = textOf(printables.groupSheet({ letter: 'D', names: true }));
assert(/D is for Dog/.test(groupD) && /“duh”/.test(groupD), 'small-group sheet re-writes itself per letter');

const cards = printables.rosterCardSheets({ stars: true });
assert(cards.length === 1, `3 children fit on ${cards.length} roster-card page`);
assert(String(cards[0].className).includes('sheet--roster'), 'roster cards land on a .sheet--roster page');
assert(byClass(cards[0], 'rcard').length === 3, 'one card per child');
assert(byClass(cards[0], 'rcard-name').map((n) => n.textContent).join() === 'Ava,Marcus,Sofia',
  'roster cards print every name');
assert(byClass(cards[0], 'rcard-letters')[0].childNodes.length === 26,
  'each card has a star box for every letter on the trail, not a hard-coded A–D slice');
assert(byTag(byClass(cards[0], 'rcard-letters')[0], 'B')[0].textContent === '★★★',
  'roster card prints Ava’s 3 stars on A');
const blankCards = printables.rosterCardSheets({ stars: false });
assert(byTag(byClass(blankCards[0], 'rcard-letters')[0], 'B').every((b) => b.textContent.trim() === ''),
  'blank star boxes print empty for colouring in');

const bigRoster = [];
for (let i = 0; i < 17; i += 1) bigRoster.push({ id: `p${i}`, name: `Kid ${i}`, emoji: '🐾', color: '#5aa9f0' });
store.setRosterOverride(bigRoster);
const bigCards = printables.rosterCardSheets({ stars: true });
assert(bigCards.length === 3, `17 children chunk onto ${bigCards.length} pages of 8`);
assert(byClass(bigCards[0], 'rcard').length === 8 && byClass(bigCards[2], 'rcard').length === 1,
  'last roster-card page holds the remainder');
store.clearRosterOverride();

const printsBefore = printCalls;
printRoot.append(makeNode('div'));                 // leftovers from a previous run
const sheetsToPrint = printables.rosterCardSheets({ stars: true });
assert(printables.printSheets(sheetsToPrint) === true, 'printSheets opens the dialog');
assert(printCalls === printsBefore + 1, 'window.print() was called exactly once');
assert(printRoot.childNodes.length === sheetsToPrint.length,
  `print-root holds exactly the built sheets (${printRoot.childNodes.length} vs ${sheetsToPrint.length})`);
assert(printRoot.childNodes.every((n) => String(n.className).includes('sheet')),
  'print-root was cleared of the previous run first');
assert(printables.printSheets([]) === false, 'nothing to print never opens the dialog');
assert(printCalls === printsBefore + 1, 'an empty print does not call window.print()');

const panel = printables.printPanel({ repaint: () => {} });
const panelText = textOf(panel);
assert(/Certificate/.test(panelText), 'Print panel offers the certificate');
assert(/Small-group sheet/.test(panelText), 'Print panel offers the small-group sheet');
assert(/Roster cards/.test(panelText), 'Print panel offers roster cards');
assert(byClass(panel, 'letter-picker').length === 1, 'Print panel has its own letter picker');
assert(byClass(panel, 'letter-picker')[0].childNodes.length === 26, 'Print letter picker covers A–Z');
assert(byClass(panel, 'gu-card').length >= 4, 'Print panel is built from Grown-Ups cards');
assert(walk(panel).some((n) => n.attributes.id === 'print-status'), 'Print panel has a status line');

const printSrc = readFileSync(join(root, 'js/screens/printables.js'), 'utf8');
assert(/window\.print\(\)/.test(printSrc), 'printables uses window.print()');
assert(!/window\.open|XMLHttpRequest|fetch\(/.test(printSrc), 'printables never opens a window or hits the network');
assert(!/document\.write/.test(printSrc), 'printables does not document.write a print frame');

const guSrc = readFileSync(join(root, 'js/screens/grownups.js'), 'utf8');
assert(/printPanel/.test(guSrc) && /from '\.\/printables\.js'/.test(guSrc), 'Grown-Ups imports the Print panel');
assert(/\['print', 'Print'\]/.test(guSrc), 'Grown-Ups has a Print tab');
assert(guSrc.indexOf("['print', 'Print']") > guSrc.indexOf("['class', 'Class']")
  && guSrc.indexOf("['print', 'Print']") < guSrc.indexOf("['device', 'Device']"),
  'Print sits between Class and Device');
assert(/const PIN = '1234'/.test(guSrc), 'PIN is still 1234 after the print pass');

['home.js', 'faces.js', 'match.js', 'bonus.js', 'celebrate.js', 'trail.js', 'pouch.js'].forEach((file) => {
  const body = readFileSync(join(root, `js/screens/${file}`), 'utf8');
  assert(!/window\.print|printables|printSheets/.test(body), `${file} keeps the kid shell free of printing`);
});

const printCss = readFileSync(join(root, 'css/print.css'), 'utf8');
assert(/@page\s*\{[^}]*size:\s*letter/.test(printCss), 'print.css sets a letter page');
assert(/@page rsabc-cert[\s\S]*landscape/.test(printCss), 'certificates ask for a landscape named page');
assert(/#print-root\s*\{\s*display:\s*none/.test(printCss), '#print-root is hidden on screen');
assert(/@media print/.test(printCss), 'print.css has a print block');
assert(/body > \*:not\(#print-root\)\s*\{\s*display:\s*none\s*!important/.test(printCss),
  'printing hides every part of the app except the sheets');
assert(/print-color-adjust:\s*exact/.test(printCss), 'sheets keep their tints at the printer');
assert(/overflow:\s*visible\s*!important/.test(printCss),
  'printing unpins shell.css’s non-scrolling body, so page 2 is not clipped away');
assert(/\.sheet:last-child\s*\{[^}]*break-after:\s*auto/.test(printCss), 'the last sheet does not eject a blank page');
assert(!/https?:\/\//.test(printCss), 'print.css pulls nothing off the network');

assert(html.includes('css/print.css'), 'index.html links the print stylesheet');
assert(/id="print-root"/.test(html), 'index.html has the #print-root paper host');
assert(sw.includes('css/print.css') && sw.includes('js/screens/printables.js'),
  'SW precaches print.css and printables.js');
assert(/Print tab/.test(readme) || /### Print tab/.test(readme), 'README documents the Print tab');
assert(!/printable certificates/.test(readme.split('**Not yet:**')[1] || ''),
  'README no longer lists printable certificates as missing');

/* ---- PASS C2: roster persistence, ABC cursor CTA, trail highlight ------ */

/* Who is playing survives a reload, and dies with the roster row. */
store.reset();
store.setClassroom(true);
store.setRosterOverride([
  { id: 'k01', name: 'Ava', emoji: '🦊', color: '#ff8a5c' },
  { id: 'k02', name: 'Marcus', emoji: '🐢', color: '#4ec3a5' },
]);
store.setKidId('k02');
assert(mem.get('rsabc.kid') === '"k02"', 'who is playing is written to rsabc.kid');
assert(store.getKidId() === 'k02', 'who is playing survives a reload (localStorage)');
assert(activeKid() && activeKid().id === 'k02', 'activeKid resolves the stored id to a roster row');
assert(activeKid().name === 'Marcus', 'activeKid carries the name for the header chip');

store.setKidId('');
assert(store.getKidId() === null, 'an empty kid id is refused, not stored');
store.setKidId('_device');
assert(store.getKidId() === null, 'the shared-device owner is never a kid id');
store.setKidId('  k01  ');
assert(store.getKidId() === 'k01', 'a padded id is trimmed, so it still matches the roster');
assert(activeKid().name === 'Ava', 'trimmed id resolves to Ava');

/* Removing that child (or importing a class without them) must not leave a
   ghost owner banking stars nobody can see. */
store.setRosterOverride([{ id: 'k02', name: 'Marcus', emoji: '🐢', color: '#4ec3a5' }]);
assert(store.getKidId() === 'k01', 'the stale id is still on disk before anyone reads it');
assert(activeKid() === null, 'a kid who left the roster resolves to nobody');
assert(store.getKidId() === null, 'reading it cleared rsabc.kid, so PLAY goes back to the face grid');
assert(kidById('k01') === null, 'and that id is really gone from the roster');

store.setKidId('k02');
store.clearKid();
assert(activeKid() === null && store.getKidId() === null, 'Clear / the name chip releases the tablet');

store.setKidId('k02');
store.setClassroom(false);
assert(store.getKidId() === null, 'turning classroom mode off releases the tablet too');

store.setClassroom(true);
store.setRosterOverride([
  { id: 'k02', name: 'Marcus', emoji: '🐢', color: '#4ec3a5' },
  { id: 'kvisitor', name: 'Rae', emoji: '🐙', color: '#7e8cf0' },   // added on this tablet only
]);
store.setKidId('kvisitor');
assert(activeKid().name === 'Rae', 'a teacher-added child can play');
store.clearRosterOverride();
assert(kids().length >= 20, 'Reset to class file brings the shipped class back');
assert(activeKid() === null, 'and drops the teacher-added child who was playing');
store.setKidId(kids()[0].id);
assert(activeKid().id === kids()[0].id, 'a shipped face can be picked again straight away');

const appSrc = readFileSync(join(root, 'js/app.js'), 'utf8');
assert(/activeKid\(\)/.test(appSrc), 'the router resolves who is playing through activeKid');
assert(!/kidById\(store\.getKidId\(\)\)/.test(appSrc), 'the router no longer trusts a raw stored id');
assert(/isClassroom\(\) && !activeKid\(\)/.test(appSrc), 'classroom with no valid kid routes to the face grid');

const guSrc2 = readFileSync(join(root, 'js/screens/grownups.js'), 'utf8');
assert(/getKidId\(\) === kid\.id\) store\.clearKid\(\)/.test(guSrc2),
  'removing the child who is playing clears rsabc.kid on the spot');

/* Celebrate's next CTA follows nextAbcIndex (or the pin), never a guess. */
store.reset();
store.setPinnedLetter(null);
store.setSetting('roundSize', 3);
round.goHome();
store.setCursor('A');
round.startRound({ startAt: 'A' });
assert(round.getRound().letters.join('') === 'ABC', 'C2 round is ABC');
assert(round.upNextLetter() === 'B', 'mid-round the next CTA is the next letter in the set');
twoTap('A');
round.nextLetter();
assert(round.upNextLetter() === 'C', 'and it moves with the set');
twoTap('B');
round.nextLetter();
twoTap('C');
assert(round.getRound().index === 2, 'sitting on the last letter of the round');
assert(store.getNextAbcIndex() === 3, `nextAbcIndex is 3 (D) after A, B, C (got ${store.getNextAbcIndex()})`);
assert(round.upNextLetter() === 'D', 'round-end CTA reads the letter off nextAbcIndex');
round.playAgain();
assert(round.getRound().letters[0] === 'D', 'and Play again really opens that letter');

/* A pin freezes it, anywhere in the alphabet — there is no letter left that
   the pin could name and PLAY would then refuse to open. */
round.goHome();
store.setPinnedLetter('B');
store.setNextAbcIndex(3);
assert(round.upNextLetter() === 'B', 'a pinned letter of the day wins over the cursor');
store.setPinnedLetter('E');
assert(isAwake('E') === true, 'E is awake');
assert(round.upNextLetter() === 'E', 'a pin on a woken letter is the letter PLAY opens');
assert(round.previewLetters()[0] === 'E', 'and the home strip agrees');
store.setPinnedLetter('Z');
assert(round.upNextLetter() === 'Z' && round.previewLetters()[0] === 'Z',
  'the last letter on the trail can be the letter of the day');
store.setPinnedLetter(null);
store.setNextAbcIndex(25);
assert(round.upNextLetter() === 'Z', 'and a cursor parked on Z names Z, not a fallback');
assert(ALPHABET.every((L) => isAwake(L)), 'every letter A–Z is awake');

/* The ABC Trail marks both facts, and every tile opens a round. */
const trailSrc = readFileSync(join(root, 'js/screens/trail.js'), 'utf8');
assert(/previewLetters\(\)\[0\]/.test(trailSrc), 'trail highlights the letter PLAY really opens');
assert(/getPinnedLetter\(\)/.test(trailSrc), 'trail reads the pinned letter of the day');
assert(/isCurrent \? ' current' : ''/.test(trailSrc) && /isPinned \? ' pinned' : ''/.test(trailSrc),
  'current and pinned are separate tile classes');
assert(/'aria-current': isCurrent/.test(trailSrc), 'the current tile is aria-current for screen readers');
assert(/Letter of the day/.test(trailSrc) && /Next up/.test(trailSrc), 'trail head says which is which');
/* The nap is gone, in the source as well as in the data — a leftover branch
   is a second answer to "what happens when I tap this", and only one of the
   two can be right. */
assert(!/nap|asleep|sleeping/i.test(trailSrc), 'no napping branch is left on the trail');
assert(!/\bawake\b\s*\?/.test(trailSrc), 'and no tile is drawn two different ways');
assert(/startRound\(\{ startAt: entry\.letter \}\)/.test(trailSrc), 'every tile starts that letter');
assert(/All \$\{all\.length\} letters awake/.test(trailSrc),
  'and the chip counts the content file rather than saying A–D');
assert(!/napping/.test(appSrc) && !/isAwake\(at\)/.test(appSrc),
  '#/letter/E opens E instead of being turned away at the router');
assert(/!letterByChar\(at\)/.test(appSrc) && /strayLetter: at/.test(appSrc),
  'and only a bookmark that is not a letter at all lands on the trail');
assert(/ctx\.strayLetter/.test(trailSrc), 'where Lucy names the letter that is up instead');

const trailCss = readFileSync(join(root, 'css/play.css'), 'utf8');
assert(/\.trail-tile\.current \{/.test(trailCss) && /--sunny-yellow/.test(trailCss),
  'current tile wears the sunny-yellow ring');
assert(/\.trail-tile\.pinned \{/.test(trailCss), 'pinned tile has its own ring');
assert(/\.trail-tile\.pinned\.current \{/.test(trailCss), 'a pinned letter that is also current shows both');
assert(/\.trail-tile \.t-flag \{/.test(trailCss), 'the Next up / Today tag is styled');
assert(/\.trail-say \{/.test(trailCss), 'Lucy has a place to speak on the trail');

/* Grown-Ups tells the truth about the pin: it names the word, and with no pin
   it names the letter the cursor is really sitting on. */
assert(!/isAwake/.test(guSrc2), 'Grown-Ups has no sleeping-letter branch left to get wrong');
assert(/previewLetters\(\)\[0\]/.test(guSrc2), 'and the family note still follows what PLAY opens');
assert(/is for \$\{pinLetter\.word\}/.test(guSrc2), 'a pinned letter is shown with its word');
assert(/letters\(\)\.length\} letters are awake/.test(guSrc2),
  'and the unpinned note counts the content file rather than naming A–D');

/* Smoke bookmarks the cart actually uses. */
const smoke2 = readFileSync(join(root, '_smoke.html'), 'utf8');
assert(/clearKid/.test(smoke2) && /clearkid/.test(smoke2), '_smoke.html takes clearKid (and the old spelling)');
assert(/rsabc\.kid'\)/.test(smoke2), 'clearKid removes rsabc.kid');
assert(smoke2.indexOf('clearKid') < smoke2.indexOf("q.get('kid')"), 'clearKid is applied before kid is set');
assert(smoke2.indexOf("flag('reset')") < smoke2.indexOf("q.get('kid')"), 'reset is applied before kid is set');
assert(/pinnedLetter/.test(smoke2) && /unpin/.test(smoke2), '_smoke.html can pin and unpin the letter of the day');
assert(/#\/letter\/\$\{encodeURIComponent\(play\)\}/.test(smoke2), 'play= still bookmarks a letter round');

const readme2 = readFileSync(join(root, 'README.md'), 'utf8');
assert(/clearKid=1/.test(readme2), 'README lists the clear-kid bookmark');
assert(/\?play=E/.test(readme2), 'README lists the sleeping-letter bookmark');
assert(/\?pin=C/.test(readme2), 'README lists the pin bookmark');
assert(/Next up/.test(readme2), 'README explains the trail highlight');
assert(readme2.includes(APP_VERSION), `README names the bumped shell pin (${APP_VERSION})`);

/* ---- PASS C4: bonus activity + celebrate + Lucy's closet -------------- */

/* The bonus rotates by letter, so a 3-letter round plays three games. */
assert(bonusMod.bonusTypeFor('A') === 'hunt' && bonusMod.bonusTypeFor('B') === 'sound'
  && bonusMod.bonusTypeFor('C') === 'order' && bonusMod.bonusTypeFor('D') === 'hunt',
  'rotate deals A hunt · B sound · C order · D hunt');
assert(bonusMod.bonusTypeFor('A', 'off') === null, 'Bonus Off deals no game');
assert(['A', 'B', 'C', 'D'].every((L) => bonusMod.bonusTypeFor(L, 'sound') === 'sound'),
  'a pinned game wins over the rotation for every letter');
assert(bonusMod.BONUS_MODES.join() === 'off,rotate,hunt,sound,order', 'Grown-Ups has five bonus choices');

const huntBoard = bonusMod.buildBonus('A', { type: 'hunt' });
assert(huntBoard.type === 'hunt' && huntBoard.need === 3, 'Letter Hunt wants 3 finds');
assert(huntBoard.items.length === 8, `Letter Hunt deals ${huntBoard.items.length} tiles (want 8)`);
assert(huntBoard.items.filter((i) => i.target).length === 3, 'exactly 3 tiles are the letter');
assert(huntBoard.items.filter((i) => i.target).some((i) => i.glyph === 'A')
  && huntBoard.items.filter((i) => i.target).some((i) => i.glyph === 'a'),
  'the hunt hides both cases — big A and little a');
assert(huntBoard.items.every((i) => i.target || i.letter !== 'A'), 'no filler tile is secretly the answer');

const soundBoard = bonusMod.buildBonus('A', { type: 'sound' });
assert(soundBoard.items.length === 3 && soundBoard.need === 3, 'Sound Sort asks about 3 pictures');
assert(soundBoard.items.filter((i) => i.starts).length === 2, 'two of them start with the sound');
assert(soundBoard.items.every((i) => i.picture && i.picture.word), 'every Sound Sort card has a picture');
assert(soundBoard.items.filter((i) => !i.starts).every((i) => i.picture.letter !== 'A'),
  'the "no" card really is a different letter');
assert(soundBoard.title.includes('/æ/') && !/letter A/.test(soundBoard.title),
  'Sound Sort asks with the sound, not the letter name');

const orderBoard = bonusMod.buildBonus('B', { type: 'order' });
assert(orderBoard.items.length === 3, 'ABC Order deals 3 letters');
assert(orderBoard.items.some((i) => i.letter === 'B'), 'this letter is one of them');
const ranked = orderBoard.items.slice().sort((a, b) => a.rank - b.rank).map((i) => i.letter);
assert(ranked.join('') === ranked.slice().sort().join(''), `ranks really are alphabet order (${ranked.join('')})`);

/* A bonus is a bonus: wrong taps wobble, and stars never move. */
round.goHome();
store.reset();
store.setSetting('roundSize', 1);
store.setSetting('bonusMode', 'hunt');
store.setCursor('A');
round.startRound({ startAt: 'A' });
round.select('A'); round.submit(); round.advance();
round.select('A'); round.submit();
assert(round.advance() === 'bonus', 'a clean letter still gets its bonus');
const board = round.getBonus();
assert(board && board.type === 'hunt', 'Grown-Ups pinned the hunt for every letter');
const dud = board.items.find((i) => !i.target);
assert(round.bonusTap(dud.id) === 'wrong', 'a wrong tile is wrong');
assert(round.bonusTap(dud.id) === 'wrong', 'and it can be tapped again — nothing locks');
assert(round.getRound().misses === 0, 'bonus misses are NOT round misses');
const firstTarget = board.items.find((i) => i.target);
assert(round.bonusTap(firstTarget.id) === 'right', 'a target tile is right');
assert(round.bonusTap(firstTarget.id) === null, 'a found tile does nothing on a second tap');
assert(round.bonusDone() === false, 'one of three is not done');
board.items.filter((i) => i.target && i.id !== firstTarget.id).forEach((i) => round.bonusTap(i.id));
assert(round.bonusDone() === true, 'all three found → bonus done');
const doneSummary = round.bonusSummary();
assert(doneSummary.done === true && doneSummary.skipped === false && doneSummary.misses === 2,
  `celebrate can say Bonus ✓ with ${doneSummary.misses} free misses`);
assert(round.advance() === 'celebrate', 'bonus → celebrate');
assert(round.starsEarned() === 3, 'two bonus misses still leave a clean 3-star letter');
assert(round.bankLetter() === 3, 'and 3 stars are what banks');

/* ABC Order only counts a tap that is next in the alphabet. */
round.goHome();
store.setSetting('bonusMode', 'order');
round.startRound({ startAt: 'A' });
round.select('A'); round.submit(); round.advance();
round.select('A'); round.submit();
assert(round.advance() === 'bonus', 'order letter reaches the bonus');
const ord = round.getBonus();
const byRank = ord.items.slice().sort((a, b) => a.rank - b.rank);
assert(round.bonusTap(byRank[2].id) === 'wrong', 'the last letter first is wrong');
assert(round.bonusTap(byRank[0].id) === 'right', 'the first letter is right');
assert(round.bonusTap(byRank[2].id) === 'wrong', 'still cannot skip the middle one');
assert(round.bonusTap(byRank[1].id) === 'right' && round.bonusTap(byRank[2].id) === 'right',
  'in order, all three land');
assert(round.bonusDone(), 'ABC Order finishes');

/* Sound Sort answers yes / no about one picture at a time. */
round.goHome();
store.setSetting('bonusMode', 'sound');
round.startRound({ startAt: 'A' });
round.select('A'); round.submit(); round.advance();
round.select('A'); round.submit();
round.advance();
const snd = round.getBonus();
assert(snd.type === 'sound', 'pinned Sound Sort');
const first = round.bonusCurrent();
assert(!!first && !!first.picture, 'Sound Sort has a picture on the table');
assert(round.bonusTap(first.starts ? 'no' : 'yes') === 'wrong', 'the wrong answer is wrong');
assert(round.bonusCurrent() === first, 'and the same picture stays up for another go');
assert(round.bonusTap(first.starts ? 'yes' : 'no') === 'right', 'the right answer moves on');
assert(round.bonusCurrent() !== first, 'the next picture comes up');
while (!round.bonusDone()) {
  const item = round.bonusCurrent();
  if (!item) break;
  round.bonusTap(item.starts ? 'yes' : 'no');
}
assert(round.bonusDone(), 'three answers finish Sound Sort');

/* Nobody is ever parked in a bonus: Skip to stars always works. */
round.goHome();
store.setSetting('bonusMode', 'rotate');
round.startRound({ startAt: 'B' });
round.select('B'); round.submit(); round.advance();
round.select('B'); round.submit();
assert(round.advance() === 'bonus', 'B reaches its bonus');
round.skipBonus();
const skipped = round.bonusSummary();
assert(skipped.skipped === true && round.bonusDone(), 'Skip to stars ends the bonus');
assert(round.advance() === 'celebrate', 'a skipped bonus still walks to the stars');
assert(round.bankLetter() === 3, 'and a skipped bonus costs nothing — clean letter, 3 stars');

/* Celebrate hands the sticker and any unlocked treat to the screen. */
store.reset();
round.goHome();
store.setSetting('roundSize', 1);
store.setCursor('A');
round.startRound({ startAt: 'A' });
twoTap('A');
const banked = round.getRound();
assert(banked.sticker && banked.sticker.picture && banked.sticker.isNew === true,
  `celebrate can say "new sticker" (${banked.sticker && banked.sticker.picture.word})`);
assert(store.stickers().length === 1, 'and that sticker is really in the pouch');
assert(banked.unlockedTreat && banked.unlockedTreat.id === 'bows',
  '3 stars unlock Lucy’s party bows on the celebrate card');
assert(store.awardSticker(banked.sticker.picture) === false,
  'the same plate a second time is not a new sticker');

/* Lucy's closet: unlock by stars, wear one at a time, keep it on the tablet. */
assert(closet.TREATS.length === 6 && closet.TREATS[0].need === 3, 'six treats, bows at 3 stars');
assert(closet.unlockedTreats(3).map((t) => t.id).join() === 'bows', '3 stars unlock exactly the bows');
assert(closet.unlockedTreats(12).length === 4, '12 stars unlock four treats');
assert(closet.newlyUnlocked(2, 3).map((t) => t.id).join() === 'bows', 'crossing 3 stars unlocks the bows once');
assert(closet.newlyUnlocked(3, 5).length === 0, 'and never again after that');
assert(closet.nextTreat(3).id === 'specs', 'the pouch can say what is next');
assert(closet.wornTreat() === null, 'Lucy starts undressed');
assert(closet.toggleWear('specs') === '' && store.getOutfit() === '',
  'a locked treat cannot be put on');
assert(closet.toggleWear('bows') === 'bows' && closet.wornOutfitId() === 'bows', 'an unlocked treat goes on');
assert(JSON.parse(mem.get('rsabc.outfit')) === 'bows', 'the outfit is saved as rsabc.outfit');
assert(closet.toggleWear('bows') === '', 'tapping it again takes it off');
closet.toggleWear('bows');
store.setOutfit('nonsense id!!');
assert(store.getOutfit() === 'bows', 'a junk outfit id is refused, not stored');
assert(closet.wornTreat(0) === null,
  'with the stars turned off Lucy wears nothing, whatever is stored');

/* The outfit and the bonus setting ride along in the tablet copy. */
store.setSetting('bonusMode', 'order');
const closetCsv = csv.buildCsv();
assert(/setting,bonusMode,order/.test(closetCsv), 'CSV carries the bonus setting');
assert(/setting,outfit,bows/.test(closetCsv), 'CSV carries what Lucy is wearing');
const beforeCloset = store.exportSnapshot();
store.reset();
assert(store.getOutfit() === '' && store.getSettings().bonusMode === 'rotate',
  'erase this device undresses Lucy and puts the bonus back to rotate');
assert(csv.applyCsv(closetCsv).ok === true, 'closet backup imports');
assert(store.getOutfit() === 'bows', 'Lucy is dressed again after an import');
assert(store.getSettings().bonusMode === 'order', 'the pinned bonus game came back too');
assert(bitsOf(beforeCloset) === bitsOf(store.exportSnapshot()), 'C4 snapshot round-trips through CSV');
csv.applyCsv(closetCsv.replace('setting,outfit,bows', 'setting,outfit,'));
assert(store.getOutfit() === '', 'an import with no outfit really undresses this tablet');

/* Wiring: the router knows the third step, and the shell ships the modules. */
const appC4 = readFileSync(join(root, 'js/app.js'), 'utf8');
assert(/screens\/bonus\.js/.test(appC4) && /route\.step === 'bonus'/.test(appC4),
  'the router sends the bonus step to the bonus screen');
assert(round.STEPS.join() === 'case,picture,bonus,celebrate', 'a letter is case → picture → bonus → celebrate');
assert(shellSet.has('js/bonus.js') && shellSet.has('js/closet.js') && shellSet.has('js/screens/bonus.js'),
  'SW precaches the bonus + closet modules');

const bonusSrc = readFileSync(join(root, 'js/screens/bonus.js'), 'utf8');
assert(/Skip to stars/.test(bonusSrc) && /SKIP_AFTER_MISSES/.test(bonusSrc),
  'the bonus screen offers a way out after a couple of misses');
assert(/sayPhoneme/.test(bonusSrc) && /sayWord/.test(bonusSrc), 'hunt taps say the sound, Sound Sort says the word');
assert(/bonus\.type === 'order'\) audio\.sayLetterName/.test(bonusSrc),
  'only ABC Order says letter names — it is the alphabet game');
assert(/audio\.nudge\(\)/.test(bonusSrc), 'a wrong bonus tap nudges, never scolds');
assert(!/round\.misses/.test(bonusSrc), 'the bonus screen cannot touch the star count');

const celebrateC4 = readFileSync(join(root, 'js/screens/celebrate.js'), 'utf8');
assert(/CELEBRATE_MS = 8000/.test(celebrateC4), 'celebrate settles itself at 8 seconds (PLAN: ≤8s)');
assert(/function settle\(/.test(celebrateC4) && /is-settled/.test(celebrateC4), 'and there is a real settle');
assert(/celebrate-skip/.test(celebrateC4), 'celebrate has a Skip control');
assert(/addEventListener\('pointerdown'/.test(celebrateC4), 'a tap on the background skips it too');
assert(/bonusSummary\(\)/.test(celebrateC4), 'celebrate reports how the bonus went');
assert(/toggleWear/.test(celebrateC4) && /drop-card--treat/.test(celebrateC4),
  'an unlocked treat can be put on Lucy from the celebrate card');
assert(/drop-card--sticker/.test(celebrateC4), 'the sticker that landed in the pouch is shown');

const pouchC4 = readFileSync(join(root, 'js/screens/pouch.js'), 'utf8');
assert(/toggleWear/.test(pouchC4) && /Lucy's closet/.test(pouchC4), 'the Star Pouch is the closet');
assert(/ locked/.test(pouchC4) && /treatStatus/.test(pouchC4),
  'a treat that is not open yet is still marked, and still says how many stars it needs (closet.js)');
assert(!/store\.setOutfit\(/.test(pouchC4), 'the pouch goes through closet.js, not straight at the key');

const lucyC4 = readFileSync(join(root, 'js/lucy.js'), 'utf8');
assert(/dataset\.wear/.test(lucyC4) && /wornOutfitId/.test(lucyC4), 'Lucy really wears the closet treat');
['lucy-cap', 'lucy-collar-rainbow', 'lucy-bone', 'lucy-pack'].forEach((g) =>
  assert(lucyC4.includes(g), `Lucy has a drawn ${g}`));
const shellC4 = readFileSync(join(root, 'css/shell.css'), 'utf8');
assert(/\.lucy\[data-wear="cap"\] \.lucy-cap/.test(shellC4), 'data-wear shows the cap');
assert(/\.lucy\[data-wear="specs"\] \.lucy-glasses/.test(shellC4), 'worn specs are independent of the teaching pose');

const playC4 = readFileSync(join(root, 'css/play.css'), 'utf8');
assert(/\.bonus-tile \{/.test(playC4) && /min-height: var\(--target-min\)/.test(playC4), 'bonus tiles are kid-sized');
assert(/html\[data-mode="whiteboard"\] \.bonus-tile/.test(playC4), 'and grow on the whiteboard');
assert(/\.bonus-answer \{[\s\S]*min-height: var\(--target-min\)/.test(playC4), 'Yes / No are --target-min');
assert(/\.celebrate\.is-settled \.confetti/.test(playC4), 'settling really stops the confetti');
assert(/\.treat--worn \{/.test(playC4), 'the worn treat is marked in the pouch');

const guC4 = readFileSync(join(root, 'js/screens/grownups.js'), 'utf8');
assert(/Bonus round/.test(guC4) && /bonusMode/.test(guC4), 'Grown-Ups → Play sets the bonus');
assert(/case match → picture match → bonus → celebrate/.test(guC4), 'and says what a letter runs');

const smokeC4 = readFileSync(join(root, '_smoke.html'), 'utf8');
assert(/bonusMode/.test(smokeC4) && /outfit/.test(smokeC4), '_smoke.html can pin a bonus game and dress Lucy');
const readmeC4 = readFileSync(join(root, 'README.md'), 'utf8');
assert(/Bonus/.test(readmeC4) && /Letter Hunt/.test(readmeC4) && /Sound Sort/.test(readmeC4) && /ABC Order/.test(readmeC4),
  'README names the three bonus games');
assert(/closet/i.test(readmeC4), 'README explains Lucy’s closet');
assert(/\?bonus=/.test(readmeC4), 'README lists the bonus smoke bookmark');
assert(readmeC4.includes(APP_VERSION), `README names the C4 shell pin (${APP_VERSION})`);

/* ---- PASS C6: offline hardening, smoke index, teacher how-to ---------- */

/* "Nothing updates mid-round" has to be a mechanism, not a sentence in a
   README: the worker installs, waits, and only Get update hands over. */
const swC6 = readFileSync(join(root, 'sw.js'), 'utf8');
const installBlock = (swC6.match(/addEventListener\('install'[\s\S]*?addEventListener\('activate'/) || [''])[0];
assert(!/skipWaiting/.test(installBlock), 'a newer pin installs and waits — install never skipWaiting()s');
assert(/msg\.type === 'SKIP_WAITING'/.test(swC6) && /self\.skipWaiting\(\)/.test(swC6),
  'SKIP_WAITING is the only way to hand over, and Get update sends it');
assert(/clients\.claim\(\)/.test(swC6), 'activate still claims, so the first install needs no reload');

/* A 206 from a ranged <audio> read throws inside cache.put; an opaque body has
   no readable status. Neither belongs in an offline shell. */
assert(/function cacheable\(/.test(swC6) && /status === 200/.test(swC6) && /opaque/.test(swC6),
  'only a same-origin 200 is ever cached');
assert(/attempt < 2/.test(swC6), 'each shell fetch is retried once (school Wi-Fi drops one request)');
assert(/function shellHealth\(/.test(swC6) && /msg\.type === 'HEALTH'/.test(swC6),
  'sw.js can report what is really in the cache, not what we wrote down');
assert(/cached: SHELL\.length - missing\.length/.test(swC6), 'health counts real cache hits against SHELL');
assert(swC6.includes('/\\/_[^/]*$/'),
  'the worker never caches a _-prefixed dev file (smoke always runs the copy on disk)');
assert(/pathname\.endsWith\('\/sw\.js'\)/.test(swC6), 'and still never intercepts itself');

/* The HTTP cache must not hand back a stale sw.js, or Get update silently
   re-pins the version the cart already has. Both registrations say so. */
const appC6 = readFileSync(join(root, 'js/app.js'), 'utf8');
const guC6 = readFileSync(join(root, 'js/screens/grownups.js'), 'utf8');
assert(/updateViaCache: 'none'/.test(appC6), 'boot registers the worker with updateViaCache: none');
assert(/updateViaCache: 'none'/.test(guC6), 'so does Grown-Ups → Device');
assert(/reg\.waiting/.test(guC6) && /SKIP_WAITING/.test(guC6), 'Get update hands over to a waiting pin');
assert(/Check offline files/.test(guC6) && /type: 'HEALTH'/.test(guC6),
  'Device offers a real cache read, not just the note setup day left');
assert(/Nothing is cached on this tablet/.test(guC6) && /files are cached/.test(guC6),
  'and it says plainly what is missing');
assert(/setTimeout\(\(\) => reject/.test(guC6), 'no teacher is left on a spinner if the worker never answers');

/* One URL for the cart: _smoke.html with no query lists every tested bookmark. */
const smokeC6 = readFileSync(join(root, '_smoke.html'), 'utf8');
assert(/const BOOKMARKS = \[/.test(smokeC6), '_smoke.html carries the bookmark index');
assert(/\[\.\.\.q\.keys\(\)\]\.length\) \{\s+location\.replace\('index\.html'/.test(smokeC6),
  'a query still bounces straight into the app');
assert(/document\.body\.append\(frag\)/.test(smokeC6), 'and a bare load renders the index instead');
['bonus=sound', 'mode=whiteboard', 'clearKid=1', 'play=E', 'pin=C', 'unpin=1', 'outfit=', 'reset=1'].forEach((q) =>
  assert(smokeC6.includes(q), `the smoke index lists ${q}`));

const readmeC6 = readFileSync(join(root, 'README.md'), 'utf8');
assert(readmeC6.includes(APP_VERSION), `README names the C6 shell pin (${APP_VERSION})`);
assert(/How to set today's bonus/.test(readmeC6), 'README has a bonus how-to, not just a description');
assert(/Rotate/.test(readmeC6) && /Off\*\* — a letter is two steps again/.test(readmeC6),
  'and it says what each bonus setting does to a round');
assert(/How to print — the three walkthroughs/.test(readmeC6), 'README has a printables how-to');
['Certificates for the whole class', 'Small-group sheet (before you run the table)', 'Roster cards (start of a unit)']
  .forEach((h) => assert(readmeC6.includes(h), `printables how-to covers: ${h}`));
assert(/Background graphics on/.test(readmeC6), 'the print how-to names the one dialog setting that matters');
assert(/Check offline files/.test(readmeC6), 'README documents the cache-health check');
assert(/smoke index/.test(readmeC6), 'README points at the smoke index');
assert(/installs and waits/.test(readmeC6) && /Get update\*\* is the tap that swaps it in/.test(readmeC6),
  'README explains that a newer pin waits for Get update');

/* ---- PASS D3: printables QA ------------------------------------------
   Four things a teacher notices at the printer and nowhere else:
   the certificate asks for landscape and still fits the paper, every sheet
   carries the class the tablet is really running, the letter that prints is
   the letter that is pinned, and no run ever ejects a blank page. */

const d3 = await import('./js/screens/printables.js');
const { shippedClassName } = await import('./js/data.js');

/* --- real class names from roster ------------------------------------- */
store.reset();
store.setClassroom(true);
assert(shippedClassName() === 'Ms. Brandy — Pre-K AM', 'the class file ships a real class name');
assert(className() === shippedClassName(), 'with no override, the app follows data/roster.json');

/* The roster a teacher actually runs is the override in this browser. Import
   another room's list and every sheet used to keep printing the shipped name. */
store.setRosterOverride([
  { id: 'k01', name: 'Ava', emoji: '🦊', color: '#ff8a5c' },
  { id: 'k02', name: 'Marcus', emoji: '🐢', color: '#4ec3a5' },
]);
store.setClassName('Room 4 — Mr. Oyelaran PM');
assert(className() === 'Room 4 — Mr. Oyelaran PM', 'a renamed class wins over the class file');

const d3Cert = d3.certificateSheet({ kid: kids()[0], letter: 'A' });
assert(textOf(d3Cert).includes('Room 4 — Mr. Oyelaran PM'), 'the certificate prints the real class name');
const d3Group = d3.groupSheet({ letter: 'A', names: true });
assert(textOf(d3Group).includes('Room 4 — Mr. Oyelaran PM'), 'the small-group sheet prints the real class name');
const d3Cards = d3.rosterCardSheets({ stars: true });
assert(byClass(d3Cards[0], 'rcard-class').every((n) => n.textContent === 'Room 4 — Mr. Oyelaran PM'),
  'every roster card prints the real class name');
assert(!textOf(d3Cards[0]).includes(shippedClassName()), 'and the shipped name is nowhere on the paper');

store.setClassName('   ');
assert(className() === shippedClassName(), 'a blank name falls back to the class file, never to an empty header');
store.setClassName('  Room  4   PM  ');
assert(className() === 'Room 4 PM', 'the typed name is trimmed and collapsed before it hits the paper');
store.setClassName('x'.repeat(80));
assert(className().length === 48, 'a runaway name is capped so it cannot wrap the sheet head');
store.setClassName('Room 4 — Mr. Oyelaran PM');

/* It has to survive Export CSV → Import on the next tablet, or the second
   tablet in the room prints a different class than the first. */
const d3Csv = csv.buildCsv();
assert(/className/.test(d3Csv) && d3Csv.includes('Room 4 — Mr. Oyelaran PM'), 'Export CSV carries the class name');
store.setClassName('');
csv.applyCsv(d3Csv);
assert(className() === 'Room 4 — Mr. Oyelaran PM', 'Import CSV restores the class name on the next tablet');
/* An old file (no className row) must not silently rename the room to ''. */
const d3Legacy = d3Csv.split('\n').filter((line) => !/^setting,className,/.test(line)).join('\n');
csv.applyCsv(d3Legacy);
assert(className() === shippedClassName(), 'a pre-D3 CSV imports cleanly and falls back to the class file');
store.setClassName('Room 4 — Mr. Oyelaran PM');

/* --- pinned letter ----------------------------------------------------- */
store.setPinnedLetter('C');
assert(d3.activeLetter() === 'C', 'print follows the pinned letter');
assert(textOf(d3.groupSheet({ letter: d3.activeLetter() })).includes('C is for Cat'),
  'and the pinned letter is what the paper says');

/* A print-panel override is for one job, not for the rest of the term: the
   moment the room moves to a new letter of the day, the override is dropped. */
const d3Panel = () => d3.printPanel({ repaint: () => {} });
assert(byClass(d3Panel(), 'letter-picker')[0].childNodes.length === 26,
  'the Print panel picker still covers A–Z');

d3.setPrintLetter('Q');
assert(d3.activeLetter() === 'Q', 'a letter picked in the Print panel overrides the pin for this job');
store.setPinnedLetter('D');
assert(d3.activeLetter() === 'D', 'moving the pin drops last week’s print override');
d3.setPrintLetter('Q');
d3.setPrintLetter('Q');
assert(d3.activeLetter() === 'D', 'tapping the same letter again releases it back to the pin');

store.setPinnedLetter(null);
store.setCursor('B');
assert(d3.activeLetter() === 'B', 'no pin → print follows the ABC trail cursor');
store.setPinnedLetter('E');
assert(d3.activeLetter() === 'E', 'pinning again takes the print panel with it');

/* Whatever comes out is a letter the content file really has, so the panel
   heading and the printed sheet can never name different letters. */
d3.setPrintLetter('«');
assert(letterByChar(d3.activeLetter()), 'activeLetter always resolves to a real letter entry');
d3.setPrintLetter(null);

/* --- no blank sheets --------------------------------------------------- */
store.setPinnedLetter('A');
const d3Pages = (out) => out.nodes.filter((n) => String(n.className).includes('sheet'));

['class', 'today', 'one', 'blank'].forEach((who) => {
  const out = d3.buildCertificates({ who, letter: 'A' });
  assert(out.nodes.length > 0, `certificates (${who}) never print an empty job`);
  assert(d3Pages(out).length === out.nodes.length, `every certificate page (${who}) is a real .sheet`);
  assert(out.nodes.every((n) => byClass(n, 'cert-frame').length === 1),
    `every certificate page (${who}) carries a frame, not an empty sheet`);
});

/* Face pick off = one shared pouch under _device. "Played today" and "just
   this child" have nobody to point at, so they used to hand back a single
   blank page; per-child stars would be a guess printed on paper going home. */
store.setClassroom(false);
assert(d3.perChildStars() === false, 'with face pick off there are no per-child stars');
store.recordRound(null, 'A', 3);           // the tablet played; no child owns it
assert(store.playedToday('k01') === false, 'and no child has a play record of their own');
['today', 'one'].forEach((who) => {
  const out = d3.buildCertificates({ who, letter: 'A' });
  assert(out.nodes.length === kids().length,
    `certificates (${who}) fall back to the whole class instead of one blank page`);
});
assert(byTag(byClass(d3.rosterCardSheets({ stars: true })[0], 'rcard-letters')[0], 'B')
  .every((b) => b.textContent.trim() === ''),
  'roster cards fold "show stars" down to blank boxes when there are no per-child stars');
assert(/colour one star per letter/.test(textOf(d3.rosterCardSheets({ stars: true })[0])),
  'and the printed caption tells the truth about them');
const d3Shared = d3.buildCertificates({ who: 'class', letter: 'A' });
assert(textOf(byClass(d3Shared.nodes[0], 'pstars')[0]).replace(/\s/g, '') === '☆☆☆',
  'the shared pouch never prints as a child’s earned stars');
const d3OffPanel = textOf(d3Panel());
assert(!/Played today/.test(d3OffPanel) && !/Just this/.test(d3OffPanel),
  'the panel does not offer a "who" the tablet cannot answer');
assert(/face pick is off/.test(d3OffPanel), 'and it says why the star boxes come out empty');
assert(/colour in/.test(d3OffPanel), 'and what the teacher should do with them');

store.setClassroom(true);
store.setKidId('k01');
assert(/Played today/.test(textOf(d3Panel())), 'turning face pick back on restores the per-child options');

/* An empty class list prints one honest blank certificate and no cards at all
   — never a stack of empty sheets. */
store.setRosterOverride([]);
const d3Empty = d3.buildCertificates({ who: 'class', letter: 'A' });
assert(d3Empty.nodes.length === 1 && byClass(d3Empty.nodes[0], 'cert-frame').length === 1,
  'an empty class list still prints one usable blank certificate');
assert(d3.rosterCardSheets({ stars: true }).length === 0, 'and no roster-card pages at all');
assert(byTag(byTag(d3.groupSheet({ letter: 'A', names: true }), 'tbody')[0], 'TR').length === 8,
  'the small-group grid falls back to blank rows rather than a nameless table');
store.setRosterOverride([
  { id: 'k01', name: 'Ava', emoji: '🦊', color: '#ff8a5c' },
  { id: 'k02', name: 'Marcus', emoji: '🐢', color: '#4ec3a5' },
]);
store.setKidId('k01');

/* A hole in the list would land in #print-root as an empty page. */
const d3Before = printCalls;
assert(d3.printSheets([null, undefined]) === false, 'a list of holes never opens the print dialog');
assert(printCalls === d3Before, 'and never calls window.print()');
assert(d3.printSheets([d3.certificateSheet({ kid: kids()[0], letter: 'A' }), null]) === true,
  'a real sheet still prints');
assert(printRoot.childNodes.length === 1, 'and the hole is dropped, not printed as a blank page');
assert(printRoot.childNodes.every((n) => String(n.className).includes('sheet')),
  'print-root holds nothing but sheets');

/* Exactly 8 cards per page: a 16-child class must be 2 full pages, not 3. */
[[8, 1], [16, 2], [17, 3], [24, 3]].forEach(([count, pages]) => {
  const list = [];
  for (let i = 0; i < count; i += 1) list.push({ id: `d${i}`, name: `Kid ${i}`, emoji: '🐾', color: '#5aa9f0' });
  store.setRosterOverride(list);
  const sheets = d3.rosterCardSheets({ stars: true });
  assert(sheets.length === pages, `${count} children print on ${sheets.length} card pages (want ${pages})`);
  assert(sheets.every((sheet) => byClass(sheet, 'rcard').length > 0), `no empty card page at ${count} children`);
  assert(byClass(sheets[sheets.length - 1], 'rcard').length === count - (pages - 1) * 8,
    `the last page at ${count} children holds the remainder`);
});
store.clearRosterOverride();

/* --- landscape-safe print CSS ------------------------------------------ */
const d3Css = readFileSync(join(root, 'css/print.css'), 'utf8');
/* The file's header comment mentions "@media print" too — split on the real
   at-rule, or these checks read the on-screen geometry and pass by accident. */
const d3AtPrint = d3Css.search(/@media print\s*\{/);
assert(d3AtPrint > 0, 'print.css has a real @media print block');
const d3ScreenBlock = d3Css.slice(0, d3AtPrint);
const d3PrintBlock = d3Css.slice(d3AtPrint);

assert(/@page rsabc-cert \{[^}]*landscape/.test(d3Css), 'certificates ask for a landscape named page');
assert(/@page rsabc-cert \{[^}]*size: 11in 8\.5in/.test(d3Css),
  'and give explicit dimensions for engines that skip the landscape keyword');
assert(/\.sheet--cert \{[^}]*page: rsabc-cert/.test(d3Css), 'only the certificate claims that page');
assert(/@page \{[^}]*portrait/.test(d3Css), 'the other two sheets stay upright');

/* Named pages are Chrome 110+ / Safari 18+. Everywhere else the certificate
   lands on portrait letter, so nothing on it may need 11in of width. */
const d3CertGeom = d3ScreenBlock.slice(d3ScreenBlock.indexOf('.cert-frame'));
assert(d3CertGeom.includes('.cert-sign'), 'the certificate rules were found on the screen side');
assert(!/(^|[^-\w])width:\s*\d+(\.\d+)?in/m.test(d3CertGeom),
  'no certificate part is pinned to an inch width, so the portrait fallback still fits');
assert(/\.sheet \{[\s\S]*?width: auto/.test(d3PrintBlock), 'at the printer the sheet takes the page width it is given');

/* The old 7.1in frame overflowed any driver that enforced margins wider than
   the 10mm we ask for — one extra near-blank sheet per child. */
const d3FrameMin = (d3PrintBlock.match(/\.cert-frame \{[^}]*min-height:\s*([\d.]+)in/) || [])[1];
assert(d3FrameMin, 'the print block sizes the certificate frame');
assert(Number(d3FrameMin) <= 7.0,
  `the printed certificate frame is ${d3FrameMin}in — it must fit a 0.75in-margin landscape page (7.0in)`);
assert(Number(d3FrameMin) >= 6.5, `${d3FrameMin}in would leave the certificate floating on the page`);

assert(/\.sheet:last-child \{[^}]*break-after: auto/.test(d3PrintBlock),
  'the last sheet does not eject a trailing blank page');
assert(/page-break-after: always/.test(d3PrintBlock) && /break-after: page/.test(d3PrintBlock),
  'and the ones before it each get their own page, old and new property');
assert(!/\.cardgrid \{[^}]*break-inside:\s*avoid/.test(d3PrintBlock),
  'the card grid may split rather than pushing a whole page of white');

/* 4 rows of cards plus head, meta, cut note and foot have to clear a portrait
   letter page (11in − 2×12mm ≈ 255mm) or every card page drags a stub. */
const d3CardH = Number((d3Css.match(/\.rcard \{[^}]*height:\s*([\d.]+)mm/) || [])[1]);
const d3Gap = Number((d3Css.match(/\.cardgrid \{[^}]*gap:\s*([\d.]+)mm/) || [])[1]);
assert(d3CardH && d3Gap, 'roster card geometry is readable');
const d3GridMm = 4 * d3CardH + 3 * d3Gap;
assert(d3GridMm + 45 <= 255,
  `8 cards need ${Math.round(d3GridMm)}mm + ~45mm of chrome, which must fit 255mm of portrait letter`);

assert(/print-color-adjust: exact/.test(d3Css), 'the sheets keep their tints at the printer');
assert(!/https?:\/\//.test(d3Css), 'print.css pulls nothing off the network');

const d3Src = readFileSync(join(root, 'js/screens/printables.js'), 'utf8');
assert(/setPrintLetter/.test(d3Src), 'the print letter override is drivable from outside the panel');
assert(!/window\.open|document\.write/.test(d3Src), 'printables still never opens a window');

const d3Readme = readFileSync(join(root, 'README.md'), 'utf8');
assert(/Class name/.test(d3Readme), 'README documents the class-name field');
assert(/Layout/.test(d3Readme) && /Landscape/.test(d3Readme),
  'README tells a teacher what to do if their browser prints certificates upright');

/* ---- PASS D4: Lucy's closet + Star Pouch feel ------------------------
   Unlock pacing, wear/unwear, the pouch's empty rooms, and the hand-off from
   the celebrate card to the Star Pouch. Every word here is read by a four
   year old, so the language is gated too. */

store.reset();

/* --- pacing: one letter can only ever open one treat ------------------- */
const D4_MAX_STARS_PER_LETTER = 3;
const d4Gaps = closet.TREATS.map((t, i) => t.need - (i ? closet.TREATS[i - 1].need : 0));
assert(d4Gaps.every((g) => g >= D4_MAX_STARS_PER_LETTER),
  `no two treats sit closer than ${D4_MAX_STARS_PER_LETTER} stars (gaps ${d4Gaps.join('/')})`);
assert(closet.TREATS.every((t, i) => i === 0 || t.need > closet.TREATS[i - 1].need),
  'the treat ladder only ever climbs');
/* That gap is exactly what lets round.js hand the celebrate card
   newlyUnlocked()[0] and be sure nothing was silently skipped. */
for (let before = 0; before <= 24; before += 1) {
  for (let gain = 1; gain <= D4_MAX_STARS_PER_LETTER; gain += 1) {
    assert(closet.newlyUnlocked(before, before + gain).length <= 1,
      `${before} + ${gain} stars can never cross two treats at once`);
  }
}
const d4RoundSrc = readFileSync(join(root, 'js/round.js'), 'utf8');
assert(/newlyUnlocked\(starsBefore, store\.totalStars\(\)\)\[0\]/.test(d4RoundSrc),
  'and the round takes the single crossed treat');
const d4ClosetSrc = readFileSync(join(root, 'js/closet.js'), 'utf8');
assert(/PACING INVARIANT/.test(d4ClosetSrc), 'closet.js writes that invariant down where it can be broken');

/* --- what the pouch points at next ------------------------------------- */
assert(closet.nextTreat(0).id === 'bows' && closet.starsToNext(0) === 3,
  'an empty pouch already has something to aim at');
assert(closet.nextTreat(3).id === 'specs' && closet.starsToNext(3) === 3, 'the next treat moves along the ladder');
assert(closet.nextTreat(23).id === 'pack' && closet.starsToNext(23) === 1, 'one star short is one star short');
assert(closet.nextTreat(24) === null && closet.starsToNext(24) === 0 && closet.nextTreatNudge(24) === '',
  'a finished closet stops nagging for more');
assert(closet.nextTreat(99) === null, 'and stays finished past the last rung');

/* --- kid-safe words ----------------------------------------------------- */
const d4Copy = [];
[0, 1, 3, 5, 12, 24].forEach((total) => {
  closet.TREATS.forEach((t) => {
    const st = closet.treatStatus(t, total, '');
    d4Copy.push(st.label, st.aria);
  });
  d4Copy.push(closet.closetLine(total, null), closet.nextTreatNudge(total));
});
d4Copy.push(closet.treatStatus(closet.TREATS[0], 24, 'bows').label);
d4Copy.push(closet.treatStatus(closet.TREATS[0], 24, 'bows').aria);
assert(d4Copy.every((line) => typeof line === 'string'), 'every closet string is a string');
assert(!d4Copy.some((line) => /lock|can't|cannot|not allowed|no,|fail|sorry/i.test(line)),
  'nothing the closet says to a child locks them out or scolds');
assert(!d4Copy.some((line) => /\bundefined\b|\bNaN\b|\bnull\b/.test(line)), 'and no debris leaks into the copy');
assert(!d4Copy.some((line) => /\b1 stars\b|\b1 more stars\b/.test(line)), 'one star is a star, not "1 stars"');

const d4Zero = closet.treatStatus(closet.TREATS[0], 0, '');
assert(d4Zero.state === 'next' && d4Zero.label === '3 more stars', 'the nearest treat counts down');
assert(/You have 0 so far/.test(d4Zero.aria), 'and reads out where the child actually is');
const d4Far = closet.treatStatus(closet.TREATS[5], 0, '');
assert(d4Far.state === 'soon' && d4Far.label === '24 stars opens it',
  'a far treat names its number without a padlock in the sentence');
const d4One = closet.treatStatus(closet.TREATS[5], 23, '');
assert(d4One.label === '1 more star', 'one to go says star, singular');
const d4Ready = closet.treatStatus(closet.TREATS[0], 3, '');
assert(d4Ready.state === 'ready' && d4Ready.open === true && d4Ready.label === 'Tap to wear',
  'an open treat asks to be tapped');
const d4Worn = closet.treatStatus(closet.TREATS[0], 3, 'bows');
assert(d4Worn.state === 'worn' && /take it off/.test(d4Worn.aria), 'and says how to take it off again');

assert(/opens Party bows/.test(closet.closetLine(0, null)),
  'at nought stars the shelf still names the goal, not "tap a treat" with nothing tappable');
assert(/Tap a treat/.test(closet.closetLine(3, null)), 'once something is open it invites the tap');
assert(/Every treat is open/.test(closet.closetLine(24, null)), 'a finished closet gets its own line');
assert(/tap it again to take it off/.test(closet.closetLine(3, closet.TREATS[0])),
  'a worn treat says how to undo it');

/* --- the meter under the nearest treat ---------------------------------- */
assert(closet.treatProgress(closet.TREATS[0], 0) === 0, 'the first meter starts empty');
assert(closet.treatProgress(closet.TREATS[1], 3) === 0,
  'and each meter restarts from the treat before it, not from zero stars');
assert(closet.treatProgress(closet.TREATS[1], 5) > 0.6, 'five stars is most of the way to six');
assert(closet.treatProgress(closet.TREATS[1], 9) === 1, 'a passed treat is full');
assert(closet.treatProgress({ id: 'ghost', need: 5 }, 3) === 0, 'a treat that is not on the ladder does not throw');

/* --- pacing, played for real ------------------------------------------- */
store.reset();
round.goHome();
store.setSetting('roundSize', 1);
const d4Opened = [];
'ABCD'.split('').forEach((L) => {
  store.setCursor(L);
  round.startRound({ startAt: L });
  twoTap(L);
  const t = round.getRound().unlockedTreat;
  if (t) d4Opened.push(`${L}:${t.id}`);
  round.goHome();
});
assert(d4Opened.join(' ') === 'A:bows B:specs C:bone D:cap',
  `a clean A–D run opens one treat per letter (${d4Opened.join(' ') || 'none'})`);
assert(store.totalStars() === 12 && closet.unlockedTreats().length === 4,
  '12 stars, four treats open — the pouch and the run agree');
assert(closet.nextTreat().id === 'rainbow' && closet.starsToNext() === 6,
  'the fifth treat is a longer reach on purpose');

/* Replaying a letter you already aced must not re-open the same treat. */
store.setCursor('A');
round.startRound({ startAt: 'A' });
twoTap('A');
assert(round.getRound().unlockedTreat === null, 'a replay never re-opens a treat that is already open');
round.goHome();

/* --- wear / unwear ------------------------------------------------------ */
assert(closet.toggleWear('bows') === 'bows' && closet.wornOutfitId() === 'bows', 'a treat goes on');
assert(closet.toggleWear('cap') === 'cap', 'a second treat replaces the first — one at a time');
assert(closet.wornTreat().id === 'cap' && store.getOutfit() === 'cap', 'and that is what is stored');
assert(closet.toggleWear('cap') === '', 'tapping the worn one takes it off');
assert(closet.toggleWear('rainbow') === '', 'a treat that is not open yet stays off Lucy');
assert(store.getOutfit() === '', 'and a refused tap writes nothing');

const d4Pouch = readFileSync(join(root, 'js/screens/pouch.js'), 'utf8');
assert(!/ctx\.go\(/.test(d4Pouch),
  'a wear tap repaints in place — a re-render would throw the child back to the top of the shelf');
assert(/painters\.forEach/.test(d4Pouch) && /closetChip\.textContent/.test(d4Pouch),
  'in place means the cards and the shelf line both catch up');
assert(/ctx\.foot/.test(d4Pouch), 'and the footer line that names the outfit catches up too');
const d4App = readFileSync(join(root, 'js/app.js'), 'utf8');
assert(/foot: paintFoot/.test(d4App), 'the shell hands screens a footer repaint');
assert(/const paintFoot = \(\)/.test(d4App) && !/if \(screen\.footLeft\) footLeft\.append/.test(d4App),
  'and paints the footer through that one path');

/* --- the pouch has no dead rooms ---------------------------------------- */
assert(/progressMode\(\) === 'none'/.test(d4Pouch),
  'with stars off the pouch says so instead of promising a child it will fill');
assert(/note-grown/.test(d4Pouch), 'and leaves the how-to-fix line for the grown-up, quietly');
assert(/Stickers you earned/.test(d4Pouch) && /Match a picture with Lucy/.test(d4Pouch),
  'stars but no stickers yet is its own shelf, not a missing section');
assert(/tap Play Cards and match a letter/.test(d4Pouch), 'a brand-new pouch says what to go and do');
assert(/treatProgress/.test(d4Pouch) && /treat-meter/.test(d4Pouch), 'the nearest treat carries the meter');
assert(/first\.open \? 'button' : 'div'/.test(d4Pouch),
  'a treat that cannot be tapped is not a button — no tap can be refused');

/* --- celebrate hands off to the pouch ----------------------------------- */
const d4Cel = readFileSync(join(root, 'js/screens/celebrate.js'), 'utf8');
assert(/drop-card--soon/.test(d4Cel) && /nextTreatNudge/.test(d4Cel),
  'a letter that opened nothing still points at the next treat');
assert(/lives in your Star Pouch now/.test(d4Cel), 'and an opened treat says where it went');
assert(/\} else if \(store\.progressMode\(\) !== 'none'\)/.test(d4Cel),
  'neither hand-off appears when stars are off');
assert(!/unlocked \$\{treat\.name\}/.test(d4Cel), 'Lucy does not say "unlocked" at a four year old');
assert(/You opened \$\{treat\.name\} for me/.test(d4Cel), 'she says she opened it, and asks to wear it');
assert(/if \(ctx\.foot\) ctx\.foot\(\)/.test(d4Cel), 'wearing it from the celebrate card updates the footer');
/* The hand-off has to be on the screen a cart Chromebook actually has. The
   trophy does not shrink, so the stars + trophy scroll and the pouch row and
   the buttons are pinned under them — never covered, never below the fold. */
assert(/celebrate-scroll/.test(d4Cel), 'the celebration art has its own scroller');
assert(/scroll\.append\(el\('div', \{ class: 'celebrate-head'/.test(d4Cel)
  && /scroll\.append\(el\('div', \{ class: 'celebrate-body'/.test(d4Cel),
  'the stars and the trophy are what scrolls');
assert(/if \(pouchRow\.childNodes\.length\) root\.append\(pouchRow\)/.test(d4Cel),
  'and the Star Pouch hand-off is pinned outside it');
/* --- the shelf is one scroller ------------------------------------------ */
const d4Css = readFileSync(join(root, 'css/play.css'), 'utf8');
const d4PouchRule = (d4Css.match(/\.pouch \{[^}]*\}/) || [''])[0];
assert(/overflow-y: auto/.test(d4PouchRule), 'the pouch page scrolls as one');
const d4GridRule = (d4Css.match(/\.pouch-grid \{[^}]*\}/) || [''])[0];
assert(!/overflow-y: auto/.test(d4GridRule),
  'and the two grids inside it do not each become their own letterbox');
assert(/\.treat--next\.locked \{/.test(d4Css) && /\.treat-meter \{/.test(d4Css),
  'the nearest treat is styled as the goal, with a meter');
assert(/\.treat--next\.locked \.treat-pic \{ filter: none/.test(d4Css),
  'the goal treat keeps its colour — and outranks the greying rule, not just follows it');
assert(/\.treat--next\.locked \{/.test(d4Css), 'same for its sunny face');
assert(!/state: total >= 3 \? 'celebrating'/.test(d4Pouch),
  'pouch Lucy never wears the celebrating pose — those bows are a closet treat, not a mood');
assert(/\.drop-card--soon \{/.test(d4Css) && /\.note-grown \{/.test(d4Css),
  'the celebrate nudge and the grown-up note are styled');
assert(/\.pouch-lucy \{/.test(d4Css), 'pouch Lucy is laid out in CSS, not inline styles');
assert(!/style: \{ marginLeft: 'auto'/.test(d4Pouch), 'so the screen carries no inline layout');

const d4CelRule = (d4Css.match(/\.celebrate \{[^}]*\}/) || [''])[0];
assert(!/grid-template-rows/.test(d4CelRule),
  'no fixed row template — that is what let the trophy overflow onto the hand-off');
assert(/\.celebrate-scroll > \* \{ flex: 0 0 auto/.test(d4Css),
  'and the scroller does not squash its children back into overlapping');
assert(/\.pouch-drop \{[^}]*flex: 0 0 auto/.test(d4Css), 'the pinned row keeps its height');
assert(/@media \(max-height: 820px\) \{\s*\.pouch-drop/.test(d4Css),
  'on a short cart screen the pinned row goes to a strip so pinning it costs little');
const d4WearIdx = d4Css.indexOf('.drop-wear {');
assert(d4WearIdx > 0 && d4Css.indexOf('@media (max-height: 820px)', d4WearIdx) > d4WearIdx,
  'and that strip is written after the cards it overrides, or it silently loses');

const d4Readme = readFileSync(join(root, 'README.md'), 'utf8');
assert(/Star Pouch/.test(d4Readme) && /never spent/.test(d4Readme), 'README still explains the closet rule');
assert(/stars are off/i.test(d4Readme), 'and tells a teacher what the pouch looks like with stars off');
assert(d4Readme.includes(APP_VERSION), `README names the D4 shell pin (${APP_VERSION})`);

/* ---- PASS D5: offline, the update path, and the smoke index ----------
   Three things that only ever fail on someone else's cart: a module that
   shipped but was never pinned, a Get update that quietly did nothing, and a
   bookmark for a screen you can no longer reach. */

const d5Sw = readFileSync(join(root, 'sw.js'), 'utf8');
const d5Gu = readFileSync(join(root, 'js/screens/grownups.js'), 'utf8');
const d5App = readFileSync(join(root, 'js/app.js'), 'utf8');
const d5Smoke = readFileSync(join(root, '_smoke.html'), 'utf8');
const d5Check = readFileSync(join(root, '_check.mjs'), 'utf8');
const d5Readme = readFileSync(join(root, 'README.md'), 'utf8');

/* --- precache really covers what ships --------------------------------- */
const d5Shell = [...(d5Sw.match(/const SHELL = \[([\s\S]*?)\];/) || ['', ''])[1]
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  .matchAll(/'([^']+)'/g)].map((m) => m[1]);
assert(d5Shell.length === new Set(d5Shell).size, 'no file is pinned twice');

/* Walk the import graph the way the browser does, not the way a directory
   listing does — js/games/hunt.js would pass a scan of js/ and js/screens/. */
const d5Seen = new Set();
const d5Queue = ['js/app.js'];
const d5Unpinned = [];
while (d5Queue.length) {
  const file = d5Queue.shift();
  if (d5Seen.has(file)) continue;
  d5Seen.add(file);
  if (!existsSync(join(root, file))) { d5Unpinned.push(`${file} (missing)`); continue; }
  if (!d5Shell.includes(file)) d5Unpinned.push(file);
  const dir = file.slice(0, file.lastIndexOf('/'));
  [...readFileSync(join(root, file), 'utf8').matchAll(/from\s*'(\.[^']+)'/g)].forEach((m) => {
    const out = [];
    `${dir}/${m[1]}`.split('/').forEach((part) => {
      if (part === '.' || part === '') return;
      if (part === '..') out.pop(); else out.push(part);
    });
    d5Queue.push(out.join('/'));
  });
}
assert(d5Unpinned.length === 0, `every module index.html loads is pinned (${d5Seen.size} walked)`);
assert(d5Seen.size >= 18, 'and the walk actually reached the whole app, not just app.js');
assert(/imported module is not in SW SHELL/.test(d5Check),
  'the check gate walks that graph too, so the next new module cannot skip it');
assert(/loads a local file that is not in SHELL/.test(d5Check),
  'and resolves local url() in the stylesheets the same way');

/* --- Get update actually gets the update -------------------------------- */
assert(/reg\.installing/.test(d5Gu),
  'Get update waits out reg.installing — reg.update() resolves before the new pin is `waiting`');
const d5Settle = d5Gu.indexOf('if (reg.installing)');
const d5Waiting = d5Gu.indexOf('if (reg.waiting');
assert(d5Settle > 0 && d5Waiting > d5Settle,
  'and it waits BEFORE it looks at reg.waiting, or it hands back the pin the cart already had');
assert(/statechange/.test(d5Gu), 'it waits on the worker, not on a guessed delay');
assert(/settle\(reg\.installing, \d{4,}\)/.test(d5Gu),
  'with a real ceiling — installing a pin means precaching the shell over school Wi-Fi');
assert(/redundant/.test(d5Gu), 'a pin that fails to install releases the wait instead of hanging on it');
const d5Listen = d5Gu.indexOf("worker.addEventListener('statechange', seen)");
assert(d5Listen > 0 && /^\s*seen\(\);/m.test(d5Gu.slice(d5Listen, d5Listen + 260)),
  'and it re-checks after subscribing — a state that lands in that gap must not cost the whole ceiling');

/* A hand-over swaps the shell under a page still running the old modules.
   Saying "Pinned" and stopping there is how a tablet ends up half-updated. */
assert(/swapped/.test(d5Gu) && /return \{ worker: worker \|\| null, swapped \}/.test(d5Gu),
  'shellWorker reports whether a hand-over happened');
assert(/Reload to finish/.test(d5Gu), 'and a hand-over offers the reload that finishes it');
assert(/location\.reload\(\)/.test(d5Gu), 'which is a real reload');
assert(/reload\.hidden = true/.test(d5Gu) && /reload\.hidden = false/.test(d5Gu),
  'shown only when it is owed, not sitting there every time');
assert(/\.gu-btn\[hidden\] \{ display: none; \}/.test(readFileSync(join(root, 'css/grownups.css'), 'utf8')),
  'and hiding it is spelled out, not left to the UA sheet inside a flex row');
assert(/still running \$\{APP_VERSION\}/.test(d5Gu),
  'and it says plainly that the tablet is not running the new pin yet');

/* Off Wi-Fi every shell fetch is cache: 'reload', so a precache can only fail.
   One sentence beats forty file names. */
assert(/navigator\.onLine === false/.test(d5Gu), 'both cache buttons stop when the tablet is offline');
assert(/files it already has are untouched/.test(d5Gu),
  'and say the cache was not harmed, because tapping it in a dead zone must be safe');
assert(/cache\.put\(url, await fetchShellFile\(url\)\)/.test(d5Sw),
  'which is true: the worker only ever puts a file it actually got');
assert(/function short\(/.test(d5Gu) && /short\(err\.message\)/.test(d5Gu),
  'a failure list is truncated for the screen');

/* Neither version note may claim which pin is newer — these are names. */
assert(!/tap Get update to pin/.test(d5Gu), 'the cached-version note no longer guesses a direction');
assert(/this page is running \$\{APP_VERSION\}/.test(d5Gu), 'it states both and names one fix');
assert(/reload this tablet to finish/i.test(d5Gu),
  'and a complete cache on another pin reads as a finished update, not a broken one');
assert(!/skipWaiting/.test((d5Sw.match(/addEventListener\('install'[\s\S]*?addEventListener\('activate'/) || [''])[0]),
  'the worker still installs and waits — D5 changed who asks, not the rule');

/* --- the smoke index is complete --------------------------------------- */
const d5Keys = ['classroom', 'kid', 'clearKid', 'mode', 'hideChrome', 'reset', 'play',
  'pin', 'unpin', 'bonus', 'outfit', 'stars', 'progress', 'to', 'gu'];
const d5Book = [...d5Smoke.matchAll(/\['([a-zA-Z]+=[^']*)'/g)].map((m) => m[1]);
d5Keys.forEach((key) => {
  assert(d5Smoke.includes(`q.get('${key}')`) || d5Smoke.includes(`q.has('${key}')`) || d5Smoke.includes(`flag('${key}')`),
    `_smoke.html implements ${key}`);
  assert(d5Book.some((b) => new RegExp(`(^|&)${key}=`).test(b)), `and the index lists a ${key}= bookmark`);
});
assert(/_smoke\.html missing query key/.test(d5Check) && /index lists no bookmark using/.test(d5Check),
  'the check gate holds the index to both halves of that');

/* Print and Device were unreachable by URL: five taps and a PIN deep. */
const d5Tabs = [...(d5Gu.match(/const TABS = \[([\s\S]*?)\];/) || ['', ''])[1]
  .matchAll(/\['([a-z-]+)',/g)].map((m) => m[1]);
assert(d5Tabs.length === 5, 'Grown-Ups still has five tabs');
d5Tabs.forEach((tab) => assert(d5Smoke.includes(`gu=${tab}`), `the index can open the ${tab} tab`));
assert(/opts\.tab/.test(d5Gu) && /TABS\.some/.test(d5Gu),
  'openGrownUps takes a tab, and only a tab that exists');
assert(/#\/grownups\/\$\{encodeURIComponent\(gu\)\}/.test(d5Smoke), 'gu= maps onto the route');
assert(/openGrownUps\(\{ onChange: render, tab \}\)/.test(d5App), 'and app.js passes it through');
assert(/if \(!gateOpen\(\)\)/.test(d5App), 'the gate is still the gate — a deep link does not skip the PIN');

/* --- and the paper trail ------------------------------------------------ */
assert(d5Readme.includes(APP_VERSION), `README names the D5 shell pin (${APP_VERSION})`);
assert(/Reload to finish/.test(d5Readme), 'README walks a teacher through the reload step');
assert(/If step 3 never appears/.test(d5Readme), 'and says what it means when there was nothing to get');
assert(/Off Wi-Fi, \*\*Get update\*\*/.test(d5Readme), 'and what the two cache buttons do in a dead zone');
assert(/gu=device/.test(d5Readme), 'README lists the Grown-Ups bookmarks');

/* ---- PASS D6: the teacher README ------------------------------------
   The README is the only thing in this repo a teacher reads, and it is the
   one file no gate could ever catch drifting. These hold the parts a morning
   actually rests on: the way in, the numbers, and every link in the nav. */

const d6Readme = readFileSync(join(root, 'README.md'), 'utf8');
const d6Gu = readFileSync(join(root, 'js/screens/grownups.js'), 'utf8');
const d6Sw = readFileSync(join(root, 'sw.js'), 'utf8');

/* --- the way in, before anything else ---------------------------------- */
const d6Head = d6Readme.slice(0, 1400);
assert(/\*\*The PIN is `1234`\.\*\*/.test(d6Head),
  'README says the PIN in the first screenful, not only in the Grown-Ups section');
assert(new RegExp(`const PIN = '1234'`).test(d6Gu), 'and that is really the PIN the keypad takes');
assert(/## Start here/.test(d6Head), 'README opens with a Start here nav');

/* Every anchor in that nav has to land on a real heading, or the one section
   a teacher clicks into is the one that scrolls nowhere. */
/* GitHub's own slug: lowercase, drop punctuation, then one hyphen per space —
   it does NOT collapse the double space an em dash leaves behind. */
const d6Slugs = new Set([...d6Readme.matchAll(/^#{1,6} (.+)$/gm)].map((m) => m[1]
  .toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s/g, '-')));
const d6Links = [...d6Readme.matchAll(/\]\(#([^)]+)\)/g)].map((m) => m[1]);
assert(d6Links.length >= 10, 'the nav actually links the sections out');
const d6Dead = d6Links.filter((a) => !d6Slugs.has(a));
assert(d6Dead.length === 0, `every README anchor resolves to a heading (${d6Dead.join(', ') || 'none dead'})`);

/* --- the eight things D6 promised Brandy -------------------------------- */
[
  [/## A normal morning/, 'a morning walkthrough'],
  [/PIN \*\*`1234`\*\*/, 'the PIN on the sticky note too'],
  [/### Print tab — paper for the table/, 'the printables'],
  [/#### How to set today.s bonus \(30 seconds\)/, 'how to set the bonus round'],
  [/#### Back up a tablet \(and put it back\)/, 'a CSV backup walkthrough'],
  [/### The wall board \(whiteboard mode\)/, 'the wall board'],
  [/## First morning: Set up this device \(offline\)/, 'the offline setup'],
  [/_smoke\.html\?mode=whiteboard&hideChrome=1/, 'the smoke bookmarks'],
].forEach(([re, what]) => assert(re.test(d6Readme), `README covers ${what}`));

/* --- the backup section has to be true --------------------------------- */
assert(/`ready-set-abc\.csv`/.test(d6Readme), 'README names the file Export CSV writes');
assert(/downloadCsv\('ready-set-abc\.csv'/.test(d6Gu), 'and that is the filename the button really writes');
assert(/\*\*import replaces, it never merges\*\*/.test(d6Readme),
  'README warns that Import replaces the tablet');
assert(/Replace this tablet.s class list, stars, notes, and Grown-Ups settings/.test(d6Gu),
  'and the tablet asks that before it does it');
assert(/A backup that only exists on the tablet you are about to wipe is not a backup/.test(d6Readme),
  'and tells a teacher to get the file off the tablet');

/* --- the wall board section matches the tokens -------------------------- */
const d6Board = d6Readme.slice(d6Readme.indexOf('### The wall board'), d6Readme.indexOf('## A normal morning'));
assert(/140px/.test(d6Board) && /220px/.test(d6Board), 'the wall-board section names the real tap sizes');
const d6Tokens = readFileSync(join(root, 'css/tokens.css'), 'utf8');
assert(/--target-min: 140px;/.test(d6Tokens) && /--target-card-board: 220px;/.test(d6Tokens),
  'and those are the sizes whiteboard mode really sets');
assert(/Lucy's speech bubble stays/.test(d6Board), 'and that hide chrome keeps Lucy talking');
assert(/hold the yellow paw logo for 3 seconds/.test(d6Board), 'and how to get back in with the bars hidden');
assert(/const HOLD_MS = 3000;/.test(readFileSync(join(root, 'js/app.js'), 'utf8')),
  'which is the hold the app actually waits out');

/* --- the tear-off card -------------------------------------------------- */
const d6Card = d6Readme.slice(d6Readme.indexOf('## Tape this to the cart'), d6Readme.indexOf('## PIN, versions, storage'));
assert(d6Card.length > 600, 'the tape-to-the-cart card is a real card');
[
  [/PIN `1234`/, 'the PIN'],
  [/Check offline files/, 'the dead-zone check'],
  [/Background graphics on/, 'the print dialog setting'],
  [/Export CSV/, 'the backup'],
  [/Every letter A–Z opens/, 'that the whole alphabet runs'],
  [/Skip to stars/, 'the stuck-on-bonus escape'],
].forEach(([re, what]) => assert(re.test(d6Card), `the card carries ${what}`));

/* --- and the one number in it that can drift ---------------------------- */
const d6Shell = [...(d6Sw.match(/const SHELL = \[([\s\S]*?)\];/) || ['', ''])[1]
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  .matchAll(/'([^']+)'/g)].map((m) => m[1]);
assert(new RegExp(`of ${d6Shell.length} files are cached`).test(d6Readme),
  `README's cache-health example counts the real shell (${d6Shell.length} files)`);
assert(d6Readme.includes(APP_VERSION), `README names the D6 shell pin (${APP_VERSION})`);

/* --- SHIP.md: Bradley's copy-it-to-the-host card ------------------------
   It lives a folder up and carries the same two numbers the README does. A
   ship note that names last month's pin is worse than no ship note. */
const shipPath = join(root, '..', 'SHIP.md');
assert(existsSync(shipPath), 'SHIP.md ships beside app/');
const ship = readFileSync(shipPath, 'utf8');
assert(ship.includes(APP_VERSION), `SHIP.md names the current shell pin (${APP_VERSION})`);
assert(new RegExp(`all \\*\\*${d6Shell.length}\\*\\* files`).test(ship),
  `SHIP.md's offline-check count is the real shell (${d6Shell.length} files)`);
assert(new RegExp(`of ${d6Shell.length} files are cached`).test(ship),
  "SHIP.md's troubleshooting row quotes the real cache-health line");
[
  [/https/, 'that https is required'],
  [/Set up this device/, 'the first-load step'],
  [/Get update/, 'how a later version reaches the tablets'],
  [/`1234`/, 'the PIN'],
  [/_smoke\.html/, 'the smoke URLs'],
  [/What NOT to do/, 'the do-not list'],
  [/fonts\//, 'that the font folder has to travel'],
].forEach(([re, what]) => assert(re.test(ship), `SHIP.md carries ${what}`));


/* ---- PASS E2: the whole alphabet, played for real ---------------------
   Waking a letter is a one-character edit in data/letters.json and it is the
   kind of edit that looks finished long before it is. These play every letter
   the way a child does — case match, picture match, bonus, celebrate, sticker
   — because the only proof that E–Z are awake is that E–Z bank stars. */

store.reset();
round.goHome();
store.setClassroom(true);
store.setKidId('k01');
store.setSetting('roundSize', 1);
store.setSetting('choiceCount', 3);
store.setSetting('caseMode', 'both');
store.setSetting('hintAfter', 0);
store.setSetting('bonusMode', 'rotate');
store.setPinnedLetter(null);

const e2Steps = new Set();
const e2Bonus = new Map();
const e2Stuck = [];
const e2Words = new Map();
for (const L of ALPHABET) {
  store.setCursor(L);
  round.startRound({ startAt: L });
  const opened = round.getRound();
  if (!opened || opened.letters[0] !== L) { e2Stuck.push(`${L} did not open`); continue; }
  if (opened.step !== 'case') { e2Stuck.push(`${L} did not start on the case match`); continue; }

  round.select(L);
  if (round.submit() !== 'right') { e2Stuck.push(`${L} case match refused the answer`); continue; }
  e2Steps.add(opened.step);
  if (round.advance() !== 'picture') { e2Stuck.push(`${L} case did not lead to a picture`); continue; }
  e2Steps.add('picture');

  const pic = round.getRound().trial.picture;
  if (!pic || !pic.word || !pic.emoji) { e2Stuck.push(`${L} dealt no picture`); continue; }
  e2Words.set(L, pic.word);
  /* Every card on the board carries a plate, and no two carry the same one —
     with 26 letters live this is the board a child sees, not a corner case. */
  const plates = round.getRound().trial.choices.map((c) => c.picture && c.picture.emoji);
  if (plates.some((e) => !e)) { e2Stuck.push(`${L} dealt a card with no plate`); continue; }
  if (new Set(plates).size !== plates.length) { e2Stuck.push(`${L} dealt the same plate twice`); continue; }

  round.select(L);
  if (round.submit() !== 'right') { e2Stuck.push(`${L} picture match refused the answer`); continue; }
  const step = round.advance();
  if (step === 'bonus') {
    e2Steps.add('bonus');
    const board = round.getBonus();
    e2Bonus.set(L, board && board.type);
    playBonus(L);
    if (round.advance() !== 'celebrate') { e2Stuck.push(`${L} bonus did not reach celebrate`); continue; }
  } else if (step !== 'celebrate') {
    e2Stuck.push(`${L} went to ${step} after the picture`);
    continue;
  }
  e2Steps.add('celebrate');

  if (round.bankLetter() !== 3) { e2Stuck.push(`${L} did not bank a clean 3`); continue; }
  round.goHome();
}
assert(e2Stuck.length === 0, `every letter A–Z plays a full round (${e2Stuck.slice(0, 3).join(' · ') || 'no letter got stuck'})`);
assert(round.STEPS.every((st) => e2Steps.has(st)),
  `and a round really walks ${round.STEPS.join(' → ')}`);
assert(e2Bonus.size === 26, `all 26 letters built a bonus board (${e2Bonus.size})`);
assert(new Set(e2Bonus.values()).size === 3,
  `the rotation deals all three games across the alphabet (${[...new Set(e2Bonus.values())].join('/')})`);
assert(ALPHABET.every((L) => store.starsFor(L) === 3),
  'and every letter banked its 3 stars');
assert(store.totalStars() === 78, `26 clean letters is ${store.totalStars()} stars (want 78)`);
assert(store.stickers().length === 26, `one sticker per letter in the pouch (${store.stickers().length})`);
assert(new Set(store.stickers().map((st) => st.letter)).size === 26,
  'and no letter is missing from the Star Pouch');
assert(ALPHABET.every((L) => (e2Words.get(L) || '').charAt(0).toUpperCase() === L),
  'every picture a child matched really starts with its letter');
assert(closet.unlockedTreats().length === closet.TREATS.length,
  'a clean run of the alphabet opens every treat in Lucy’s closet');

/* Twenty-six awake letters is also twenty-six distractors to draw from, so a
   full board of 8 can be dealt without repeating a letter. */
round.goHome();
store.setSetting('choiceCount', 8);
store.setCursor('Q');
round.startRound({ startAt: 'Q' });
const e2Cards = round.getRound().trial.choices;
assert(e2Cards.length === 8, `a full board deals 8 cards (${e2Cards.length})`);
assert(new Set(e2Cards.map((c) => c.letter)).size === 8, 'and no letter is on it twice');
assert(e2Cards.some((c) => c.letter === 'Q'), 'the answer is on the board');
assert(e2Cards.filter((c) => c.letter > 'D').length > 0,
  'the woken letters are real distractors now, not just filler behind A–D');

/* Sound Sort was the one board that could quietly lie: its "yes" cards come
   out of the letter's own pool, so a pool word that does not start with the
   letter makes the right answer wrong. Ask every letter. */
const e2Sound = [];
for (const L of ALPHABET) {
  const board = bonusMod.buildBonus(L, { type: 'sound' });
  if (!board) { e2Sound.push(`${L}: no board`); continue; }
  board.items.filter((it) => it.starts).forEach((it) => {
    if (it.picture.letter !== L) e2Sound.push(`${L}: "${it.picture.word}" marked yes`);
  });
  board.items.filter((it) => !it.starts).forEach((it) => {
    if (it.picture.letter === L) e2Sound.push(`${L}: "${it.picture.word}" marked no`);
  });
  if (!board.title.includes(letterByChar(L).phoneme)) e2Sound.push(`${L}: asks without its sound`);
}
assert(e2Sound.length === 0, `Sound Sort is honest for all 26 letters (${e2Sound.slice(0, 3).join(' · ') || 'clean'})`);

/* And ABC Order has 25 other letters to draw from now, in every direction. */
for (const L of ['A', 'M', 'Z']) {
  const board = bonusMod.buildBonus(L, { type: 'order' });
  const ranked = board.items.slice().sort((a, b) => a.rank - b.rank).map((i) => i.letter);
  assert(ranked.join('') === ranked.slice().sort().join(''), `ABC Order round ${L} really is alphabet order (${ranked.join('')})`);
  assert(board.items.some((i) => i.letter === L), `and ${L} is one of the letters on it`);
}

/* The content rules that only bite at the table live in _check.mjs, where a
   content edit is checked without running a round. Hold that gate to them, or
   the next pass can wake a letter past all of this. */
const e2Check = readFileSync(join(root, '_check.mjs'), 'utf8');
[
  [/is not awake — every letter ships awake/, 'every letter ships awake'],
  [/does not start with \$\{L\}/, 'a pool word starts with its own letter'],
  [/is on two plates/, 'no two plates share an emoji'],
  [/is not in its own pool/, "a letter's stand-in is a plate in its own pool"],
  [/is a recent emoji/, 'a stand-in is a glyph an older tablet can draw'],
  [/has no placeholder for word-/, 'every plate is on Lucy’s recording list'],
].forEach(([re, what]) => assert(re.test(e2Check), `_check.mjs holds the content rule: ${what}`));

/* --- every letter really paints, on every step -------------------------
   round.js can hand back a perfect round for a letter whose screens throw the
   moment they try to draw it. These render the real screens for all 26 —
   the case board, the picture board, the bonus and the celebration — because
   a woken letter that cannot paint is not awake, it is broken.

   teardown() between screens is what app.js does on every route change; here
   it doubles as the proof that the 8-second celebrate timer is really let go
   of, and does not sit in the loop after the child has moved on. */
const e2Match = await import('./js/screens/match.js');
const e2BonusScreen = await import('./js/screens/bonus.js');
const e2Celebrate = await import('./js/screens/celebrate.js');
const e2Ctx = { go: () => {}, kid: null, foot: () => {}, params: [], mode: 'center' };
const e2Paint = [];
const labelsOf = (node) => walk(node).map((n) => n.getAttribute('aria-label') || '').join(' ');

store.reset();
store.setSetting('roundSize', 1);
for (const L of ALPHABET) {
  store.setCursor(L);
  round.startRound({ startAt: L });
  try {
    const caseBoard = e2Match.render(e2Ctx);
    if (!textOf(caseBoard).includes(L)) e2Paint.push(`${L}: case board never shows the letter`);
    e2Match.teardown();

    round.select(L); round.submit(); round.advance();
    const picBoard = e2Match.render(e2Ctx);
    const pic = round.getRound().trial.picture;
    if (!`${textOf(picBoard)} ${labelsOf(picBoard)}`.includes(pic.word)) {
      e2Paint.push(`${L}: picture board never names ${pic.word}`);
    }
    const plates = walk(picBoard).filter((n) => String(n.className || '').includes('pic-plate'));
    if (plates.length < round.getRound().trial.choices.length) {
      e2Paint.push(`${L}: ${plates.length} plates for ${round.getRound().trial.choices.length} cards`);
    }
    e2Match.teardown();

    round.select(L); round.submit();
    if (round.advance() === 'bonus') {
      const board = e2BonusScreen.render(e2Ctx);
      if (!textOf(board).trim()) e2Paint.push(`${L}: bonus screen painted nothing`);
      e2BonusScreen.teardown();
      playBonus(L);
      round.advance();
    }
    round.bankLetter();
    const party = e2Celebrate.render(e2Ctx);
    if (!textOf(party).includes('★') && !byClass(party, 'pstars').length && !textOf(party).trim()) {
      e2Paint.push(`${L}: celebrate painted nothing`);
    }
    e2Celebrate.teardown();
    round.goHome();
  } catch (err) {
    e2Paint.push(`${L}: ${err.message}`);
  }
}
assert(e2Paint.length === 0,
  `every letter paints case, picture, bonus and celebrate (${e2Paint.slice(0, 3).join(' · ') || 'all 26 clean'})`);

/* The trail draws all 26 the same way — no tile is a dead end. */
store.reset();
store.setClassroom(false);
const e2Trail = await import('./js/screens/trail.js');
const e2Node = e2Trail.render({ go: () => {}, kid: null, foot: () => {} });
const e2Tiles = byClass(e2Node, 'trail-tile');
assert(e2Tiles.length === 26, `the trail draws all 26 tiles (${e2Tiles.length})`);
assert(e2Tiles.every((t) => !String(t.className).includes('asleep')), 'and not one of them is drawn asleep');
assert(e2Tiles.every((t) => byClass(t, 't-word')[0].textContent !== '—'),
  'every tile names its word instead of a dash');
assert(e2Tiles.every((t) => byClass(t, 't-pic')[0].textContent.trim().length > 0),
  'and every tile carries its picture');
assert(e2Tiles.every((t) => /Play this letter\./.test(t.getAttribute('aria-label') || '')),
  'and every tile tells a screen reader it can be played');
assert(!/nap|sleep|asleep/i.test(textOf(e2Node)),
  'and nothing the rendered trail says mentions a sleeping letter');

/* The printed roster card grew with the trail rather than staying at A–D. */
store.setClassroom(true);
store.setRosterOverride([{ id: 'k01', name: 'Ava', emoji: '🦊', color: '#ff8a5c' }]);
store.setKidId('k01');
store.awardStars('Z', 3);
const e2Card = printables.rosterCardSheets({ stars: true })[0];
const e2Boxes = byClass(e2Card, 'rcard-letters')[0].childNodes;
assert(e2Boxes.length === 26, `the roster card has a box per letter (${e2Boxes.length})`);
assert(textOf(e2Boxes[25]).includes('Z') && byTag(e2Boxes[25], 'B')[0].textContent === '★★★',
  'and Z is one of them, with the stars a child earned on it');
assert(byClass(e2Card, 'rcard-top').length === 1,
  'the face and name sit in their own row so the strip can span the card');
const e2PrintCss = readFileSync(join(root, 'css/print.css'), 'utf8');
assert(/\.rcard-letters \{[^}]*grid-template-columns: repeat\(13, 1fr\)/.test(e2PrintCss),
  'the strip prints as two rows of 13, not one row that runs off the card');
store.clearRosterOverride();

/* Certificates and the small-group script re-write themselves for a letter
   that was asleep last week. */
store.setPinnedLetter('W');
const e2Group = textOf(printables.groupSheet({ letter: 'W', names: false }));
assert(/W is for Watermelon/.test(e2Group), 'the small-group sheet carries a woken letter’s anchor word');
assert(/“wuh”/.test(e2Group), 'and gives the adult its sound');
assert(byClass(printables.groupSheet({ letter: 'W' }), 'wordbank')[0].childNodes.length === 15,
  'and prints all 15 of its pool words');
const e2Cert = textOf(printables.buildCertificates({ who: 'blank', letter: 'X' }).nodes[0]);
assert(/X is for Xylophone/.test(e2Cert), 'a certificate can be printed for any letter on the trail');
store.setPinnedLetter(null);

store.reset();

console.log(fail ? `${fail} problem(s)` : 'ALL-OK');
process.exit(fail ? 1 : 0);

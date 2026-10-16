/** Cookie Table letters. One clear sound each. C and K share /k/. X is the ending sound. */

export const SATPIN = ["S", "A", "T", "P", "I", "N"];

export const LETTERS = [
  { letter: "S", word: "Sun", emoji: "☀️", phoneme: "/s/", say: "sss", sound: "s", pictures: [{ word: "Sun", emoji: "☀️" }, { word: "Sock", emoji: "🧦" }] },
  { letter: "A", word: "Apple", emoji: "🍎", phoneme: "/æ/", say: "aaa", sound: "a", pictures: [{ word: "Apple", emoji: "🍎" }, { word: "Ant", emoji: "🐜" }] },
  { letter: "T", word: "Tiger", emoji: "🐯", phoneme: "/t/", say: "tuh", sound: "t", pictures: [{ word: "Tiger", emoji: "🐯" }, { word: "Turtle", emoji: "🐢" }] },
  { letter: "P", word: "Pig", emoji: "🐷", phoneme: "/p/", say: "puh", sound: "p", pictures: [{ word: "Pig", emoji: "🐷" }, { word: "Pizza", emoji: "🍕" }] },
  { letter: "I", word: "Igloo", emoji: "🧊", phoneme: "/ɪ/", say: "ih", sound: "i", pictures: [{ word: "Igloo", emoji: "🧊" }, { word: "Iguana", emoji: "🦎" }] },
  { letter: "N", word: "Nest", emoji: "🪺", phoneme: "/n/", say: "nnn", sound: "n", pictures: [{ word: "Nest", emoji: "🪺" }, { word: "Nose", emoji: "👃" }] },
  { letter: "B", word: "Ball", emoji: "⚽", phoneme: "/b/", say: "buh", sound: "b", pictures: [{ word: "Ball", emoji: "⚽" }, { word: "Bear", emoji: "🐻" }] },
  { letter: "C", word: "Cat", emoji: "🐱", phoneme: "/k/", say: "kuh", sound: "k", pictures: [{ word: "Cat", emoji: "🐱" }, { word: "Cookie", emoji: "🍪" }] },
  { letter: "D", word: "Dog", emoji: "🐶", phoneme: "/d/", say: "duh", sound: "d", pictures: [{ word: "Dog", emoji: "🐶" }, { word: "Duck", emoji: "🦆" }] },
  { letter: "E", word: "Egg", emoji: "🥚", phoneme: "/ɛ/", say: "eh", sound: "e", pictures: [{ word: "Egg", emoji: "🥚" }, { word: "Elephant", emoji: "🐘" }] },
  { letter: "F", word: "Fish", emoji: "🐟", phoneme: "/f/", say: "fff", sound: "f", pictures: [{ word: "Fish", emoji: "🐟" }, { word: "Frog", emoji: "🐸" }] },
  { letter: "G", word: "Goat", emoji: "🐐", phoneme: "/g/", say: "guh", sound: "g", pictures: [{ word: "Goat", emoji: "🐐" }, { word: "Grapes", emoji: "🍇" }] },
  { letter: "H", word: "Hat", emoji: "🎩", phoneme: "/h/", say: "huh", sound: "h", pictures: [{ word: "Hat", emoji: "🎩" }, { word: "Horse", emoji: "🐴" }] },
  { letter: "J", word: "Juice", emoji: "🧃", phoneme: "/dʒ/", say: "juh", sound: "j", pictures: [{ word: "Juice", emoji: "🧃" }, { word: "Jellyfish", emoji: "🪼" }] },
  { letter: "K", word: "Kite", emoji: "🪁", phoneme: "/k/", say: "kuh", sound: "k", pictures: [{ word: "Kite", emoji: "🪁" }, { word: "Key", emoji: "🔑" }] },
  { letter: "L", word: "Lion", emoji: "🦁", phoneme: "/l/", say: "lll", sound: "l", pictures: [{ word: "Lion", emoji: "🦁" }, { word: "Leaf", emoji: "🍃" }] },
  { letter: "M", word: "Moon", emoji: "🌙", phoneme: "/m/", say: "mmm", sound: "m", pictures: [{ word: "Moon", emoji: "🌙" }, { word: "Mouse", emoji: "🐭" }] },
  { letter: "O", word: "Octopus", emoji: "🐙", phoneme: "/ɒ/", say: "aw", sound: "o", pictures: [{ word: "Octopus", emoji: "🐙" }, { word: "Otter", emoji: "🦦" }] },
  { letter: "Q", word: "Queen", emoji: "👑", phoneme: "/kw/", say: "kwuh", sound: "q", pictures: [{ word: "Queen", emoji: "👑" }] },
  { letter: "R", word: "Rabbit", emoji: "🐰", phoneme: "/r/", say: "rrr", sound: "r", pictures: [{ word: "Rabbit", emoji: "🐰" }, { word: "Rainbow", emoji: "🌈" }] },
  { letter: "U", word: "Umbrella", emoji: "☂️", phoneme: "/ʌ/", say: "uh", sound: "u", pictures: [{ word: "Umbrella", emoji: "☂️" }, { word: "Up", emoji: "⬆️" }] },
  { letter: "V", word: "Van", emoji: "🚐", phoneme: "/v/", say: "vvv", sound: "v", pictures: [{ word: "Van", emoji: "🚐" }, { word: "Violin", emoji: "🎻" }] },
  { letter: "W", word: "Worm", emoji: "🪱", phoneme: "/w/", say: "wuh", sound: "w", pictures: [{ word: "Worm", emoji: "🪱" }, { word: "Watch", emoji: "⌚" }] },
  { letter: "X", word: "Fox", emoji: "🦊", phoneme: "/ks/", say: "ks", sound: "x", spot: "end", pictures: [{ word: "Fox", emoji: "🦊" }, { word: "Box", emoji: "📦" }] },
  { letter: "Y", word: "Yo-yo", emoji: "🪀", phoneme: "/j/", say: "yuh", sound: "y", pictures: [{ word: "Yo-yo", emoji: "🪀" }, { word: "Yarn", emoji: "🧶" }] },
  { letter: "Z", word: "Zebra", emoji: "🦓", phoneme: "/z/", say: "zzz", sound: "z", pictures: [{ word: "Zebra", emoji: "🦓" }, { word: "Zipper", emoji: "🤐" }] },
];

const BY = new Map(LETTERS.map((item) => [item.letter, item]));

export function letterBy(ch) {
  return BY.get(String(ch || "").toUpperCase()) || null;
}

export function teachingOrder() {
  const rest = LETTERS.map((item) => item.letter).filter((ch) => !SATPIN.includes(ch));
  return [...SATPIN, ...rest];
}

export function lowerOf(ch) {
  return String(ch || "").toLowerCase();
}

function shuffle(list, rng) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Picture cards for one sound. Distractors never share the target sound group. */
export function pictureChoices(target, count, rng = Math.random) {
  const correct = target.pictures[Math.floor(rng() * target.pictures.length)];
  const pool = [];
  LETTERS.forEach((item) => {
    if (item.sound === target.sound) return;
    item.pictures.forEach((pic) => {
      pool.push({ word: pic.word, emoji: pic.emoji, ok: false });
    });
  });
  const need = Math.max(1, count) - 1;
  const cards = [
    { word: correct.word, emoji: correct.emoji, ok: true },
    ...shuffle(pool, rng).slice(0, need),
  ];
  return shuffle(cards, rng);
}

/** Letter-shape cards. The sample glyph is the shape to find. */
export function letterChoices(target, count, caseMode, rng = Math.random) {
  const mode = caseMode === "upper" || caseMode === "lower" ? caseMode : "both";
  const sampleCase = mode === "both" ? (rng() < 0.5 ? "upper" : "lower") : mode;
  const sample = sampleCase === "upper" ? target.letter : lowerOf(target.letter);
  const others = shuffle(LETTERS.filter((item) => item.letter !== target.letter), rng);
  const need = Math.max(1, count) - 1;
  const cards = [
    { glyph: sample, ok: true },
    ...others.slice(0, need).map((item) => {
      const itemCase = mode === "both" ? (rng() < 0.5 ? "upper" : "lower") : mode;
      return {
        glyph: itemCase === "upper" ? item.letter : lowerOf(item.letter),
        ok: false,
      };
    }),
  ];
  return { sample, cards: shuffle(cards, rng) };
}

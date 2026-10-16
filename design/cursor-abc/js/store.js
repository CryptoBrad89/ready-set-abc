/** Device-local table. One key, so a wipe really clears the tin. */

const KEY = "cursorabc.state";

export const ROSTER = [
  { id: "k01", name: "Ava", emoji: "🦊" },
  { id: "k02", name: "Marcus", emoji: "🐢" },
  { id: "k03", name: "Sofia", emoji: "🦋" },
  { id: "k04", name: "Eli", emoji: "🐸" },
  { id: "k05", name: "Nia", emoji: "🦄" },
  { id: "k06", name: "Jonah", emoji: "🐳" },
  { id: "k07", name: "Lily", emoji: "🌻" },
  { id: "k08", name: "Diego", emoji: "🦖" },
  { id: "k09", name: "Zara", emoji: "🦜" },
  { id: "k10", name: "Owen", emoji: "🐻" },
  { id: "k11", name: "Maya", emoji: "🐝" },
  { id: "k12", name: "Theo", emoji: "🦁" },
  { id: "k13", name: "Iris", emoji: "🌈" },
  { id: "k14", name: "Kai", emoji: "🦈" },
  { id: "k15", name: "Rosa", emoji: "🌹" },
  { id: "k16", name: "Amir", emoji: "🚀" },
  { id: "k17", name: "Ellie", emoji: "🐘" },
  { id: "k18", name: "Hank", emoji: "🐶" },
  { id: "k19", name: "Priya", emoji: "🦩" },
  { id: "k20", name: "Sam", emoji: "🐧" },
  { id: "k21", name: "Nora", emoji: "🍓" },
  { id: "k22", name: "Beau", emoji: "🐮" },
  { id: "k23", name: "Tessa", emoji: "🦋" },
  { id: "k24", name: "Miles", emoji: "🎺" },
];

const SETTINGS = {
  roundSize: 3,
  choiceCount: 4,
  showWords: true,
  caseMode: "both",
  hintAfter: 2,
  progressMode: "stars-save",
};

const AUDIO = { music: false, sfx: true, voice: true };

function blank() {
  return {
    theme: "light",
    mode: "center",
    hideChrome: false,
    childId: null,
    className: "Ms. Brandy — Pre-K AM",
    pinned: null,
    cursor: "S",
    audio: { ...AUDIO },
    settings: { ...SETTINGS },
    kids: ROSTER.map((kid) => ({ ...kid, workMode: "satpin", assigned: [] })),
    stars: {},
    cookies: {},
  };
}

let state = load();
const sessionStars = {};
const sessionCookies = {};

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!raw || typeof raw !== "object") return blank();
    const next = blank();
    next.theme = raw.theme === "dark" ? "dark" : "light";
    next.mode = ["center", "small-group", "whiteboard"].includes(raw.mode) ? raw.mode : "center";
    next.hideChrome = raw.hideChrome === true;
    next.childId = typeof raw.childId === "string" ? raw.childId : null;
    next.className = typeof raw.className === "string" && raw.className.trim() ? raw.className.trim().slice(0, 48) : next.className;
    next.pinned = /^[A-Z]$/.test(raw.pinned || "") ? raw.pinned : null;
    next.cursor = /^[A-Z]$/.test(raw.cursor || "") ? raw.cursor : "S";
    next.audio = { ...AUDIO, ...(raw.audio || {}) };
    next.settings = sanitizeSettings(raw.settings || {});
    if (Array.isArray(raw.kids) && raw.kids.length) next.kids = raw.kids.map(sanitizeKid).filter(Boolean);
    next.stars = raw.stars && typeof raw.stars === "object" ? raw.stars : {};
    next.cookies = raw.cookies && typeof raw.cookies === "object" ? raw.cookies : {};
    return next;
  } catch (err) {
    return blank();
  }
}

function sanitizeSettings(src) {
  const choice = [2, 3, 4, 6, 8].includes(Number(src.choiceCount)) ? Number(src.choiceCount) : SETTINGS.choiceCount;
  const round = [1, 2, 3, 5, 8].includes(Number(src.roundSize)) ? Number(src.roundSize) : SETTINGS.roundSize;
  const hint = [0, 2, 3, 5].includes(Number(src.hintAfter)) ? Number(src.hintAfter) : SETTINGS.hintAfter;
  return {
    roundSize: round,
    choiceCount: choice,
    showWords: src.showWords !== false,
    caseMode: ["lower", "upper", "both"].includes(src.caseMode) ? src.caseMode : "both",
    hintAfter: hint,
    progressMode: ["none", "stars", "stars-save"].includes(src.progressMode) ? src.progressMode : "stars-save",
  };
}

function sanitizeKid(raw) {
  if (!raw || typeof raw.name !== "string" || !raw.name.trim()) return null;
  const assigned = Array.isArray(raw.assigned) ? raw.assigned.filter((ch) => /^[A-Z]$/.test(ch)) : [];
  return {
    id: String(raw.id || `k${Math.random().toString(36).slice(2, 7)}`),
    name: raw.name.trim().replace(/\s+/g, " ").slice(0, 24),
    emoji: typeof raw.emoji === "string" && raw.emoji ? raw.emoji : "🍪",
    workMode: ["satpin", "assigned", "free"].includes(raw.workMode) ? raw.workMode : "satpin",
    assigned,
  };
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
  apply();
}

export function apply() {
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.dataset.mode = state.mode;
  document.documentElement.classList.toggle("is-bare", state.hideChrome);
}

export function getState() { return state; }
export function getSettings() { return { ...state.settings }; }
export function getAudio() { return { ...state.audio }; }
export function getKids() { return state.kids.slice(); }
export function getChild() { return state.kids.find((kid) => kid.id === state.childId) || null; }
export function className() { return state.className; }

export function setTheme(theme) {
  state.theme = theme === "dark" ? "dark" : "light";
  save();
}
export function setMode(mode) {
  if (!["center", "small-group", "whiteboard"].includes(mode)) return;
  state.mode = mode;
  save();
}
export function setHideChrome(on) {
  state.hideChrome = !!on;
  save();
}
export function setChild(id) {
  state.childId = id;
  save();
}
export function setClassName(name) {
  state.className = String(name || "").trim().replace(/\s+/g, " ").slice(0, 48) || "Ms. Brandy — Pre-K AM";
  save();
}
export function setPinned(letter) {
  state.pinned = letter;
  save();
}
export function setCursor(letter) {
  state.cursor = letter;
  save();
}
export function setSetting(key, value) {
  state.settings = sanitizeSettings({ ...state.settings, [key]: value });
  save();
}
export function setAudioChannel(channel, on) {
  if (!["music", "sfx", "voice"].includes(channel)) return;
  state.audio[channel] = !!on;
  save();
}
export function updateKid(id, patch) {
  state.kids = state.kids.map((kid) => (kid.id === id ? sanitizeKid({ ...kid, ...patch }) : kid));
  save();
}
export function addKid(name) {
  const kid = sanitizeKid({ id: `k${Date.now().toString(36)}`, name, emoji: "🍪", workMode: "satpin", assigned: [] });
  if (!kid) return;
  state.kids.push(kid);
  save();
}

function bucket(map, id) {
  if (!map[id]) map[id] = {};
  return map[id];
}

export function progressMode() { return state.settings.progressMode; }

export function starsFor(letter) {
  const child = getChild();
  if (!child || state.settings.progressMode === "none") return 0;
  const bag = state.settings.progressMode === "stars" ? (sessionStars[child.id] || {}) : (state.stars[child.id] || {});
  return bag[letter] || 0;
}

export function cookiesForChild() {
  const child = getChild();
  if (!child || state.settings.progressMode === "none") return {};
  if (state.settings.progressMode === "stars") return { ...(sessionCookies[child.id] || {}) };
  return { ...(state.cookies[child.id] || {}) };
}

export function saveResult(letter, stars) {
  const child = getChild();
  if (!child || state.settings.progressMode === "none") return;
  const best = Math.max(starsFor(letter), stars);
  if (state.settings.progressMode === "stars") {
    bucket(sessionStars, child.id)[letter] = best;
    bucket(sessionCookies, child.id)[letter] = true;
    return;
  }
  bucket(state.stars, child.id)[letter] = best;
  bucket(state.cookies, child.id)[letter] = true;
  save();
}

export function resetAll() {
  state = blank();
  save();
}

apply();

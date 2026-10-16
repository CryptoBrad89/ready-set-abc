/** Cookie Table. Hear a letter, find its sound, keep the cookie. */

import { letterBy, letterChoices, lowerOf, pictureChoices, SATPIN, teachingOrder } from "./letters.js";
import {
  apply, cookiesForChild, getChild, getKids, getSettings, getState, progressMode,
  saveResult, setAudioChannel, setChild, setCursor, setHideChrome, setTheme, starsFor,
} from "./store.js";
import { loadClips, playLine, playLongI, playMeet, playName, playRetry, playSoftG, playSound, quiet, sfx, unlock } from "./audio.js";
import { closeGrownUps, openGrownUps } from "./grown.js";

const stage = document.getElementById("stage");
const grownHost = document.getElementById("grown-host");
let screen = "who";
let round = [];
let index = 0;
let misses = 0;
let settleTimer = 0;

const themeBtn = document.getElementById("theme");
const grownBtn = document.getElementById("grown");
const whoChip = document.getElementById("who");

function childOrder() {
  const child = getChild();
  const all = teachingOrder();
  if (!child || child.workMode === "free") return all;
  if (child.workMode === "assigned") {
    const picked = all.filter((ch) => child.assigned.includes(ch));
    return picked.length ? picked : SATPIN;
  }
  return SATPIN;
}

function buildRound() {
  const order = childOrder();
  const pin = getState().pinned;
  let start = 0;
  if (pin && order.includes(pin)) start = order.indexOf(pin);
  else {
    const at = order.indexOf(getState().cursor);
    start = at >= 0 ? at : 0;
  }
  const size = Math.min(getSettings().roundSize, order.length);
  return Array.from({ length: size }, (_, i) => order[(start + i) % order.length]);
}

function show(next) {
  screen = next;
  window.clearTimeout(settleTimer);
  quiet();
  paintChrome();
  if (next === "who") paintWho();
  else if (next === "home") paintHome();
  else if (next === "meet") paintMeet();
  else if (next === "shape") paintShape();
  else if (next === "picture") paintPicture();
  else if (next === "cookie") paintCookie();
  else if (next === "tin") paintTin();
}

function paintChrome() {
  const state = getState();
  themeBtn.textContent = state.theme === "dark" ? "Light" : "Dark";
  themeBtn.setAttribute("aria-pressed", String(state.theme === "dark"));
  const child = getChild();
  whoChip.hidden = !child || screen === "who";
  whoChip.textContent = child ? `${child.emoji} ${child.name}` : "";
  document.querySelectorAll("[data-channel]").forEach((btn) => {
    const on = getState().audio[btn.dataset.channel];
    btn.setAttribute("aria-pressed", String(!!on));
  });
  apply();
}

function paintWho() {
  const grid = el("div", { class: "faces" });
  getKids().forEach((kid) => {
    grid.append(el("button", {
      class: "face",
      type: "button",
      onclick: () => { unlock(); sfx("tap"); setChild(kid.id); show("home"); },
    }, el("span", { class: "face-emoji", "aria-hidden": "true" }, kid.emoji), el("span", {}, kid.name)));
  });
  stage.innerHTML = "";
  stage.append(el("section", { class: "who" },
    el("p", { class: "kicker" }, getState().className),
    el("h1", {}, "Who is playing?"),
    grid,
  ));
}

function paintHome() {
  const order = childOrder();
  const child = getChild();
  const cookies = cookiesForChild();
  const beads = el("div", { class: "beads", "aria-label": "Letters" });
  order.forEach((ch) => {
    const hot = ch === (getState().pinned || roundStart());
    beads.append(el("button", {
      class: `bead${hot ? " is-now" : ""}${cookies[ch] ? " is-baked" : ""}`,
      type: "button",
      onclick: () => { unlock(); sfx("tap"); playName(ch); },
    }, ch));
  });
  const count = Object.keys(cookies).length;
  stage.innerHTML = "";
  stage.append(el("section", { class: "home" },
    el("div", { class: "home-copy" },
      el("p", { class: "kicker" }, child ? child.name : ""),
      el("h1", {}, "Cookie Table"),
      el("p", { class: "lede" }, "Lucy saved you a seat. Tap Play. Listen for the sound."),
      el("button", {
        class: "play",
        type: "button",
        onclick: () => { unlock(); sfx("tap"); startRound(); },
      }, "Play"),
      beads,
      progressMode() === "none" ? null : el("button", {
        class: "tin-btn",
        type: "button",
        onclick: () => show("tin"),
      }, `Cookie tin · ${count}`),
    ),
    lucyButton("art/lucy-hello.jpg", "Lucy at the table", () => {
      const first = roundStart();
      playMeet(first);
    }),
  ));
}

function roundStart() {
  const order = childOrder();
  const pin = getState().pinned;
  if (pin && order.includes(pin)) return pin;
  if (order.includes(getState().cursor)) return getState().cursor;
  return order[0] || "S";
}

function startRound() {
  round = buildRound();
  index = 0;
  misses = 0;
  show("meet");
}

function current() {
  return letterBy(round[index]);
}

function paintMeet() {
  const item = current();
  const ears = el("div", { class: "ears" });
  ears.append(el("button", {
    class: "ear",
    type: "button",
    "aria-label": "Hear the sound",
    onclick: () => { unlock(); sfx("tap"); playSound(item.letter); },
  }, "Hear"));
  if (item.letter === "I") {
    ears.append(el("button", {
      class: "ear",
      type: "button",
      "aria-label": "Hear the long I sound",
      onclick: () => { unlock(); sfx("tap"); playLongI(); },
    }, "Long"));
  }
  if (item.letter === "G") {
    ears.append(el("button", {
      class: "ear",
      type: "button",
      "aria-label": "Hear the soft G sound",
      onclick: () => { unlock(); sfx("tap"); playSoftG(); },
    }, "Soft"));
  }
  stage.innerHTML = "";
  stage.append(el("section", { class: "meet" },
    el("button", {
      class: "glyph-btn",
      type: "button",
      "aria-label": `${item.letter} ${lowerOf(item.letter)}`,
      onclick: () => { unlock(); sfx("tap"); playMeet(item.letter); },
    }, el("span", { class: "pair" }, el("b", {}, item.letter), el("b", {}, lowerOf(item.letter)))),
    ears,
    el("button", { class: "play", type: "button", onclick: () => { unlock(); sfx("tap"); show("picture"); } }, "Next"),
    lucyButton("art/lucy-teach.jpg", "Lucy with her glasses", () => playMeet(item.letter)),
  ));
  unlock();
  playMeet(item.letter, true);
}

function paintPicture() {
  const item = current();
  const settings = getSettings();
  const cards = pictureChoices(item, settings.choiceCount);
  const grid = el("div", { class: "choices" });
  cards.forEach((card) => {
    const btn = el("button", { class: "choice", type: "button" },
      el("span", { class: "pic", "aria-hidden": "true" }, card.emoji),
      settings.showWords ? el("strong", {}, card.word) : el("span", { class: "sr" }, card.word),
    );
    btn.addEventListener("click", () => pick(btn, card.ok, () => show("shape")));
    grid.append(btn);
  });
  stage.innerHTML = "";
  stage.append(el("section", { class: "task" },
    el("button", { class: "ear ear-lg", type: "button", onclick: () => { unlock(); playSound(item.letter); } }, "Hear"),
    el("p", { class: "lede" }, item.spot === "end" ? "Which picture has the sound at the end?" : "Which picture starts with the sound?"),
    grid,
    lucyButton("art/lucy-teach.jpg", "Lucy listening", () => playSound(item.letter)),
  ));
  unlock();
  playSound(item.letter);
}

function paintShape() {
  const item = current();
  const settings = getSettings();
  const deal = letterChoices(item, settings.choiceCount, settings.caseMode);
  const grid = el("div", { class: "choices" });
  deal.cards.forEach((card) => {
    const btn = el("button", { class: "choice glyph-choice", type: "button" }, card.glyph);
    btn.addEventListener("click", () => pick(btn, card.ok, () => finishLetter()));
    grid.append(btn);
  });
  stage.innerHTML = "";
  stage.append(el("section", { class: "task" },
    el("p", { class: "sample", "aria-hidden": "true" }, deal.sample),
    el("button", { class: "ear", type: "button", onclick: () => { unlock(); playName(item.letter); } }, "Hear"),
    grid,
    lucyButton("art/lucy-teach.jpg", "Lucy watching the letters", () => playName(item.letter)),
  ));
  unlock();
  playName(item.letter);
}

function pick(btn, ok, next) {
  unlock();
  if (btn.disabled) return;
  if (ok) {
    sfx("yes");
    btn.classList.add("is-yes");
    if (!playLine("yes")) playSound(current().letter);
    stage.querySelectorAll(".choice").forEach((node) => { node.disabled = true; });
    window.setTimeout(next, 650);
    return;
  }
  misses += 1;
  sfx("miss");
  btn.disabled = true;
  btn.classList.add("is-no");
  window.setTimeout(() => btn.classList.remove("is-no"), 450);
  playRetry(current().letter, screen === "shape" ? "shape" : "picture");
  const hintAfter = getSettings().hintAfter;
  if (hintAfter && misses >= hintAfter) markHint();
}

function markHint() {
  const buttons = [...stage.querySelectorAll(".choice")];
  buttons.forEach((node) => node.classList.remove("is-hint"));
  const item = current();
  buttons.forEach((node) => {
    const word = node.querySelector("strong, .sr");
    const text = (word ? word.textContent : node.textContent).trim();
    const pictureHit = item.pictures.some((pic) => pic.word === text);
    const shapeHit = text === item.letter || text === lowerOf(item.letter);
    if ((screen === "picture" && pictureHit) || (screen === "shape" && shapeHit)) node.classList.add("is-hint");
  });
}

function finishLetter() {
  const item = current();
  const stars = misses <= 0 ? 3 : misses === 1 ? 2 : 1;
  saveResult(item.letter, stars);
  const order = childOrder();
  const at = order.indexOf(item.letter);
  if (at >= 0) setCursor(order[(at + 1) % order.length]);
  show("cookie");
}

function paintCookie() {
  const item = current();
  const stars = starsFor(item.letter) || (misses <= 0 ? 3 : misses === 1 ? 2 : 1);
  const last = index >= round.length - 1;
  stage.innerHTML = "";
  stage.append(el("section", { class: "cookie" },
    el("p", { class: "stars", "aria-label": `${stars} stars` }, "★".repeat(stars) + "☆".repeat(3 - stars)),
    el("p", { class: "cookie-face", "aria-hidden": "true" }, item.emoji),
    el("h2", {}, `${item.letter} is for ${item.word}`),
    el("button", { class: "ear", type: "button", onclick: () => { unlock(); playSound(item.letter); } }, "Hear again"),
    el("button", {
      class: "play",
      type: "button",
      onclick: () => advance(last),
    }, last ? "Table" : "Next letter"),
    lucyButton("art/lucy-cheer.jpg", "Lucy celebrating", () => playSound(item.letter)),
  ));
  burst();
  sfx("star");
  if (!playLine("did-it")) playName(item.letter);
  settleTimer = window.setTimeout(() => {
    if (screen === "cookie") advance(last);
  }, 8000);
}

function advance(last) {
  window.clearTimeout(settleTimer);
  if (last) show("home");
  else {
    index += 1;
    misses = 0;
    show("meet");
  }
}

function paintTin() {
  const order = childOrder();
  const cookies = cookiesForChild();
  const grid = el("div", { class: "tin-grid" });
  order.forEach((ch) => {
    const item = letterBy(ch);
    const baked = !!cookies[ch];
    grid.append(el("button", {
      class: `cookie-bit${baked ? " is-baked" : ""}`,
      type: "button",
      disabled: baked ? null : "disabled",
      onclick: () => { if (baked) { unlock(); playSound(ch); } },
    }, el("span", {}, baked ? item.emoji : ""), el("b", {}, ch)));
  });
  stage.innerHTML = "";
  stage.append(el("section", { class: "tin" },
    el("h1", {}, "Cookie tin"),
    el("p", { class: "lede" }, "Every letter you finish bakes a cookie."),
    grid,
    el("button", { class: "play", type: "button", onclick: () => show("home") }, "Table"),
    lucyButton("art/lucy-hello.jpg", "Lucy beside the tin", () => playName(roundStart())),
  ));
}

function lucyButton(src, alt, onTap) {
  const img = el("img", { src, alt });
  img.addEventListener("error", () => img.closest(".lucy").classList.add("is-quiet"));
  return el("button", {
    class: "lucy",
    type: "button",
    onclick: () => { unlock(); sfx("tap"); onTap(); },
  }, img);
}

function burst() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const layer = el("div", { class: "burst", "aria-hidden": "true" });
  for (let i = 0; i < 18; i += 1) {
    const bit = el("i", {});
    bit.style.setProperty("--x", `${(Math.random() * 80 - 40).toFixed(0)}px`);
    bit.style.setProperty("--r", `${(Math.random() * 80 - 40).toFixed(0)}deg`);
    bit.style.background = ["#FFB800", "#29B6F6", "#26C281", "#FF5252", "#fff"][i % 5];
    layer.append(bit);
  }
  stage.append(layer);
}

function el(tag, attrs, ...kids) {
  const node = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([key, value]) => {
    if (value == null) return;
    if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  });
  kids.flat().forEach((kid) => {
    if (kid == null) return;
    node.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  });
  return node;
}

themeBtn.addEventListener("click", () => {
  setTheme(getState().theme === "dark" ? "light" : "dark");
  paintChrome();
});

document.querySelectorAll("[data-channel]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const channel = btn.dataset.channel;
    setAudioChannel(channel, !getState().audio[channel]);
    paintChrome();
  });
});

grownBtn.addEventListener("click", () => openSheet());
document.getElementById("brand").addEventListener("pointerdown", () => {
  const timer = window.setTimeout(() => openSheet(), 700);
  const up = () => window.clearTimeout(timer);
  window.addEventListener("pointerup", up, { once: true });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeGrownUps();
  if (event.key.toLowerCase() === "h" && event.shiftKey) {
    setHideChrome(!getState().hideChrome);
    paintChrome();
  }
});

whoChip.addEventListener("click", () => show("who"));

function openSheet() {
  openGrownUps(grownHost, { onClose: () => show(getChild() ? screen : "who") });
}

loadClips().then(() => {
  show(getChild() ? "home" : "who");
}).catch(() => {
  show(getChild() ? "home" : "who");
});

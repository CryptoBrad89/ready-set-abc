/** Grown-Ups: PIN or a sum, then the same jobs the tablet already has. */

import { letterBy, LETTERS, teachingOrder } from "./letters.js";
import {
  addKid, className, getAudio, getChild, getKids, getSettings, getState,
  resetAll, setAudioChannel, setClassName, setHideChrome, setMode, setPinned,
  setSetting, setTheme, updateKid,
} from "./store.js";
import { playMeet, playSound, sfx, unlock } from "./audio.js";

const PIN = "1234";
let host = null;
let onClose = null;
let typed = "";
let sum = 12;
let tab = "play";

export function openGrownUps(target, hooks) {
  host = target;
  onClose = hooks.onClose;
  typed = "";
  const a = 6 + Math.floor(Math.random() * 4);
  const b = 6 + Math.floor(Math.random() * 4);
  sum = a + b;
  host.hidden = false;
  paintGate(a, b);
}

export function closeGrownUps() {
  if (!host) return;
  host.hidden = true;
  host.innerHTML = "";
  if (onClose) onClose();
}

function paintGate(a, b) {
  host.innerHTML = "";
  const sheet = el("section", { class: "gate", role: "dialog", "aria-label": "Grown-up check" });
  sheet.append(
    el("h2", {}, "Grown-Up Check"),
    el("p", {}, "Solve the sum, or type the teacher PIN."),
    el("p", { class: "sum" }, `${a} + ${b}`),
    el("p", { class: "dots", id: "gate-dots" }, "····"),
    pad(),
    el("button", { class: "texty", type: "button", onclick: closeGrownUps }, "Return to the table"),
  );
  host.append(sheet);
}

function pad() {
  const grid = el("div", { class: "pad" });
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].forEach((key) => {
    if (!key) {
      grid.append(el("span", {}));
      return;
    }
    grid.append(el("button", {
      type: "button",
      onclick: () => press(key),
    }, key));
  });
  return grid;
}

function press(key) {
  if (key === "⌫") typed = typed.slice(0, -1);
  else typed += key;
  const dots = document.getElementById("gate-dots");
  if (dots) dots.textContent = typed ? "•".repeat(typed.length) : "····";
  if (typed === String(sum) || typed === PIN) {
    tab = "play";
    paintSheet();
    return;
  }
  if (typed.length >= 4) {
    typed = "";
    if (dots) {
      dots.textContent = "····";
      dots.classList.add("is-shake");
      setTimeout(() => dots.classList.remove("is-shake"), 280);
    }
  }
}

function paintSheet() {
  host.innerHTML = "";
  const sheet = el("section", { class: "sheet", role: "dialog", "aria-label": "Grown-Ups" });
  const tabs = el("div", { class: "tabs" });
  [["play", "Play"], ["sound", "Sound"], ["class", "Class"], ["device", "Device"]].forEach(([id, label]) => {
    tabs.append(el("button", {
      type: "button",
      "aria-current": tab === id ? "page" : "false",
      onclick: () => { tab = id; paintSheet(); },
    }, label));
  });
  const body = el("div", { class: "sheet-body" });
  if (tab === "play") body.append(playPanel());
  if (tab === "sound") body.append(soundPanel());
  if (tab === "class") body.append(classPanel());
  if (tab === "device") body.append(devicePanel());
  sheet.append(
    el("header", { class: "sheet-top" }, el("h2", {}, "Grown-Ups"), el("button", { class: "texty", type: "button", onclick: closeGrownUps }, "Done")),
    tabs,
    body,
  );
  host.append(sheet);
}

function playPanel() {
  const s = getSettings();
  const pinned = getState().pinned;
  const picker = el("div", { class: "letter-picker" });
  LETTERS.forEach((item) => {
    picker.append(el("button", {
      type: "button",
      "aria-pressed": String(pinned === item.letter),
      onclick: () => { setPinned(pinned === item.letter ? null : item.letter); paintSheet(); },
    }, item.letter));
  });
  const note = el("textarea", { readonly: "readonly", rows: "8", id: "family-note" });
  note.value = familyNote();
  return el("div", {},
    card("Round",
      row("Letters per round", seg([[1, "1"], [2, "2"], [3, "3"], [5, "5"], [8, "8"]], s.roundSize, (v) => { setSetting("roundSize", Number(v)); paintSheet(); })),
      row("Answer cards", seg([[2, "2"], [3, "3"], [4, "4"], [6, "6"], [8, "8"]], s.choiceCount, (v) => { setSetting("choiceCount", Number(v)); paintSheet(); })),
      row("Case hunt", seg([["lower", "Little"], ["upper", "Big"], ["both", "Mix"]], s.caseMode, (v) => { setSetting("caseMode", v); paintSheet(); })),
      row("Word print", toggle(s.showWords, (v) => { setSetting("showWords", v); paintSheet(); })),
      row("Hint after misses", seg([[0, "Off"], [2, "2"], [3, "3"], [5, "5"]], s.hintAfter, (v) => { setSetting("hintAfter", Number(v)); paintSheet(); })),
      row("Stars", seg([["none", "Off"], ["stars", "Session"], ["stars-save", "Save"]], s.progressMode, (v) => { setSetting("progressMode", v); paintSheet(); })),
    ),
    card("Letter of the day",
      el("p", { class: "fine" }, pinned ? `${pinned} leads the next Play.` : "No pin. Play follows the table."),
      picker,
      note,
      el("button", { class: "pill", type: "button", onclick: copyNote }, "Copy family note"),
      el("p", { class: "fine", id: "note-status" }, ""),
    ),
  );
}

function familyNote() {
  const pin = getState().pinned;
  const child = getChild();
  const order = teachingOrder();
  const letter = letterBy(pin) || letterBy(getState().cursor) || letterBy(order[0]);
  const hunt = letter.pictures.map((pic) => pic.word).slice(0, 3).join(", ");
  const spot = letter.spot === "end" ? "at the end" : "at the start";
  return [
    `Ready Set ABC — ${letter.letter}${letter.letter.toLowerCase()}`,
    "",
    `Today in ${className()} we played ${letter.letter} with Lucy${child ? ` and ${child.name}` : ""}.`,
    `${letter.letter} is for ${letter.word}. The sound is "${letter.say}" ${letter.phoneme}. That is the sound, not the letter's name. Listen for it ${spot}.`,
    "",
    "At home tonight:",
    `1. Say the sound three times: ${letter.say}, ${letter.say}, ${letter.say}.`,
    `2. Hunt for it: ${hunt}.`,
    `3. Point to a big ${letter.letter} and a little ${letter.letter.toLowerCase()}.`,
    "",
    "Ready Set ABC · Pre-K Phonics with Lucy",
  ].join("\n");
}

async function copyNote() {
  const box = document.getElementById("family-note");
  const status = document.getElementById("note-status");
  const text = box ? box.value : familyNote();
  try {
    await navigator.clipboard.writeText(text);
    if (status) status.textContent = "Copied.";
  } catch (err) {
    if (box) {
      box.focus();
      box.select();
    }
    if (status) status.textContent = "Selected. Press Ctrl+C.";
  }
}

function soundPanel() {
  const a = getAudio();
  return card("Audio channels",
    row("Music", toggle(a.music, (v) => { setAudioChannel("music", v); paintSheet(); })),
    el("p", { class: "fine" }, "Music stays quiet. No music clip is in this table."),
    row("Sound effects", toggle(a.sfx, (v) => { setAudioChannel("sfx", v); paintSheet(); })),
    row("Voice", toggle(a.voice, (v) => { setAudioChannel("voice", v); paintSheet(); })),
    el("div", { class: "row-actions" },
      el("button", { class: "pill", type: "button", onclick: () => { unlock(); playMeet("A"); } }, "Test name and sound"),
      el("button", { class: "pill", type: "button", onclick: () => { unlock(); playSound("A"); sfx("yes"); } }, "Test sound"),
    ),
    el("p", { class: "fine" }, "Letter names and sounds are the approved Lucy clips. Voice mute leaves the taps and chimes."),
  );
}

function classPanel() {
  const list = el("div", { class: "roster" });
  getKids().forEach((kid) => {
    const mode = el("select", {
      "aria-label": `${kid.name} work`,
      onchange: (event) => { updateKid(kid.id, { workMode: event.target.value }); paintSheet(); },
    });
    [["satpin", "SATPIN"], ["assigned", "Assigned"], ["free", "Any letter"]].forEach(([value, label]) => {
      const opt = el("option", { value }, label);
      if (kid.workMode === value) opt.selected = true;
      mode.append(opt);
    });
    const block = el("div", { class: "kid-row" },
      el("strong", {}, `${kid.emoji} ${kid.name}`),
      mode,
    );
    if (kid.workMode === "assigned") {
      const picks = el("div", { class: "letter-picker" });
      LETTERS.forEach((item) => {
        picks.append(el("button", {
          type: "button",
          "aria-pressed": String(kid.assigned.includes(item.letter)),
          onclick: () => {
            const assigned = kid.assigned.includes(item.letter)
              ? kid.assigned.filter((ch) => ch !== item.letter)
              : [...kid.assigned, item.letter];
            updateKid(kid.id, { assigned });
            paintSheet();
          },
        }, item.letter));
      });
      block.append(picks);
    }
    list.append(block);
  });
  const name = el("input", { value: className(), maxlength: "48", "aria-label": "Class name" });
  name.addEventListener("change", () => setClassName(name.value));
  const add = el("input", { placeholder: "New child", maxlength: "24", "aria-label": "New child" });
  return el("div", {},
    card("Class name", name),
    card("Roster", list,
      el("div", { class: "row-actions" },
        add,
        el("button", { class: "pill", type: "button", onclick: () => { if (add.value.trim()) { addKid(add.value); paintSheet(); } } }, "Add"),
      ),
    ),
  );
}

function devicePanel() {
  const state = getState();
  return el("div", {},
    card("Kid look",
      row("Light or dark", seg([["light", "Light"], ["dark", "Dark"]], state.theme, (v) => { setTheme(v); paintSheet(); })),
      row("Touch size", seg([["center", "Center"], ["small-group", "Small group"], ["whiteboard", "Whiteboard"]], state.mode, (v) => { setMode(v); paintSheet(); })),
      row("Hide chrome", toggle(state.hideChrome, (v) => { setHideChrome(v); paintSheet(); })),
      el("p", { class: "fine" }, "Hide chrome puts away the sound dots, the look toggle, and Grown-Ups. Shift+H brings them back. Hold the title for the PIN."),
    ),
    card("This tablet",
      el("p", { class: "fine" }, "Stars and the cookie tin live in this browser only. Offline copy stays off. The table plays when the page can load."),
      el("button", {
        class: "pill danger",
        type: "button",
        onclick: () => {
          if (!window.confirm("Erase stars, cookies, and roster edits on this device?")) return;
          resetAll();
          closeGrownUps();
          location.reload();
        },
      }, "Erase this device"),
    ),
  );
}

function card(title, ...nodes) {
  return el("section", { class: "card" }, el("h3", {}, title), ...nodes);
}

function row(label, control) {
  return el("div", { class: "set-row" }, el("span", {}, label), control);
}

function seg(options, current, onPick) {
  const wrap = el("div", { class: "seg" });
  options.forEach(([value, label]) => {
    wrap.append(el("button", {
      type: "button",
      "aria-pressed": String(String(current) === String(value)),
      onclick: () => onPick(value),
    }, label));
  });
  return wrap;
}

function toggle(on, onFlip) {
  return el("button", {
    class: "switch",
    type: "button",
    "aria-pressed": String(!!on),
    onclick: (event) => onFlip(event.currentTarget.getAttribute("aria-pressed") !== "true"),
  }, el("i"));
}

function el(tag, attrs, ...kids) {
  const node = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([key, value]) => {
    if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value);
    else if (value != null) node.setAttribute(key, value);
  });
  kids.flat().forEach((kid) => {
    if (kid == null) return;
    node.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  });
  return node;
}

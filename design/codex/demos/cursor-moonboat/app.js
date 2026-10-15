(() => {
'use strict';
const C = window.CONCEPT;
const $ = (s) => document.querySelector(s);
const main = $('#main');
const letters = [['S', 'sun', '/s/'], ['A', 'apple', '/ă/'], ['T', 'tiger', '/t/'], ['P', 'pig', '/p/'], ['I', 'insect', '/ĭ/'], ['M', 'moon', '/m/']].map(([letter, word, sound]) => ({ letter, word, sound }));
const q = new URLSearchParams(location.search);
const shot = q.get('shot') === '1';
const demo = q.get('demo') === '1';
const key = 'cursor-funpass-' + C.kind + '-theme';
const MAX_PARTICLES = 12;
let theme = 0;
let storageOK = true;
let muted = false;
let state = 'home';
let current = letters[0];
const visited = new Set();
let misses = 0;
let choices = [];
let busy = false;
let epoch = 0;
let voiceToken = 0;
let player = null;
let resolveClip = null;
let introduced = false;
let idled = false;
let idleTimer = 0;
let arming = false;
const timers = new Set();
let audioCtx = null;
const liveSfx = new Set();

try {
  const saved = Number(localStorage.getItem(key));
  if (Number.isInteger(saved) && saved >= 0 && saved < C.themes.length) theme = saved;
} catch (e) {
  storageOK = false;
}
if (q.has('theme')) {
  const n = Number(q.get('theme'));
  if (Number.isInteger(n) && n >= 0 && n < C.themes.length) theme = n;
}
if (q.get('visited')) {
  q.get('visited').split(',').forEach((ch) => {
    if (letters.some((l) => l.letter === ch)) visited.add(ch);
  });
}
if (q.get('letter')) {
  const hit = letters.find((l) => l.letter === q.get('letter').toUpperCase());
  if (hit) current = hit;
}
if (shot) document.body.classList.add('shot');

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const post = () => C.kind === 'post';
const space = () => C.kind === 'space';

function setTheme(value) {
  theme = value;
  document.body.dataset.theme = String(value);
  try {
    localStorage.setItem(key, String(value));
  } catch (e) {
    storageOK = false;
    const note = $('#storage');
    if (note) note.textContent = 'Theme saved for this visit only.';
  }
}
function announce(text) {
  $('#announcer').textContent = text;
}
function clearTimers() {
  timers.forEach((t) => clearTimeout(t));
  timers.clear();
}
function sleep(ms) {
  const e = epoch;
  return new Promise((resolve) => {
    const t = setTimeout(() => {
      timers.delete(t);
      resolve(e === epoch);
    }, ms);
    timers.add(t);
  });
}
const rest = (ms) => new Promise((r) => setTimeout(r, ms));

function clearFx() {
  $('#confetti').replaceChildren();
  document.querySelectorAll('.flecks').forEach((el) => el.remove());
  document.querySelectorAll('.weather-once').forEach((el) => el.classList.remove('weather-once'));
}
function stopSfx() {
  liveSfx.forEach((node) => {
    try { node.stop(); } catch (e) { /* already ended */ }
  });
  liveSfx.clear();
}
function stopVoice() {
  voiceToken++;
  if (player) {
    player.pause();
    player.onended = null;
    player.onerror = null;
    player = null;
  }
  if (resolveClip) {
    resolveClip(false);
    resolveClip = null;
  }
  document.body.classList.remove('talking');
}
function ac() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function sfxAllowed() {
  return !muted && !document.body.classList.contains('talking') && !!ac();
}
function tone(freq, dur, type, peak, delay, toFreq) {
  const c = sfxAllowed() ? ac() : null;
  if (!c) return;
  const t0 = c.currentTime + (delay || 0);
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, t0);
  if (toFreq) o.frequency.exponentialRampToValueAtTime(Math.max(40, toFreq), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.03);
  liveSfx.add(o);
  o.onended = () => liveSfx.delete(o);
}
function rustle() {
  const c = sfxAllowed() ? ac() : null;
  if (!c) return;
  const t0 = c.currentTime;
  const frames = Math.floor(c.sampleRate * 0.16);
  const buf = c.createBuffer(1, frames, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1600;
  filter.Q.value = 0.6;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.045, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
  src.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  src.start(t0);
  src.stop(t0 + 0.18);
  liveSfx.add(src);
  src.onended = () => liveSfx.delete(src);
}
const sfx = {
  flap: rustle,
  pom() { tone(170, 0.12, 'sine', 0.07, 0, 80); },
  chime() { tone(659, 0.16, 'sine', 0.045, 0); tone(880, 0.2, 'sine', 0.04, 0.11); },
  boop() { tone(494, 0.11, 'sine', 0.06, 0, 330); },
  ping() { tone(988, 0.15, 'sine', 0.045, 0, 1480); },
  chord() { tone(392, 0.32, 'triangle', 0.04); tone(494, 0.32, 'triangle', 0.032); tone(587, 0.36, 'sine', 0.028); }
};

function spawnFlecks(anchor) {
  if (reduce() || shot || !anchor) return;
  const layer = document.createElement('div');
  layer.className = 'flecks';
  layer.setAttribute('aria-hidden', 'true');
  const n = Math.min(8, MAX_PARTICLES);
  for (let i = 0; i < n; i++) {
    const el = document.createElement('i');
    el.className = 'fleck';
    const angle = (i / n) * Math.PI * 2;
    el.style.setProperty('--dx', Math.round(Math.cos(angle) * 72) + 'px');
    el.style.setProperty('--dy', Math.round(Math.sin(angle) * 46 - 8) + 'px');
    el.style.setProperty('--r', (i * 40) + 'deg');
    el.style.left = (36 + (i % 4) * 8) + '%';
    layer.appendChild(el);
  }
  anchor.appendChild(layer);
}

function glintOnce() {
  if (reduce() || !space()) return;
  document.querySelectorAll('.visor').forEach((el) => {
    el.classList.remove('glint');
    void el.offsetWidth;
    el.classList.add('glint');
  });
}

async function voice(files) {
  stopSfx();
  stopVoice();
  const mine = voiceToken;
  if (muted || shot) return true;
  document.body.classList.add('talking');
  glintOnce();
  for (const file of files) {
    if (mine !== voiceToken) return false;
    const ok = await new Promise((resolve) => {
      const a = new Audio('assets/' + file + '.mp3');
      player = a;
      resolveClip = resolve;
      a.onended = () => {
        if (mine === voiceToken) resolveClip = null;
        resolve(true);
      };
      a.onerror = () => {
        if (mine === voiceToken) {
          resolveClip = null;
          announce('Audio could not play. You can still match the pictures.');
        }
        resolve(false);
      };
      a.play().catch(() => {
        if (mine === voiceToken) {
          resolveClip = null;
          announce('Tap the speaker to hear the sound.');
        }
        resolve(false);
      });
    });
    if (!ok || mine !== voiceToken) {
      if (mine === voiceToken) document.body.classList.remove('talking');
      return false;
    }
  }
  if (mine === voiceToken) {
    player = null;
    document.body.classList.remove('talking');
  }
  return true;
}

function letterAudio() {
  return ['lucy-name-' + current.letter.toLowerCase(), 'lucy-phoneme-' + current.letter.toLowerCase()];
}
function wordAudio(l) {
  return 'lucy-word-' + l.letter.toLowerCase() + '-' + l.word;
}
function cheerFile() {
  return 'lucy-cheer-' + ((visited.size % 2) + 1);
}
function shuffle(list) {
  return list.map((x) => ({ x, r: Math.random() })).sort((a, b) => a.r - b.r).map((o) => o.x);
}
function decoys(target) {
  const rest = letters.filter((l) => l !== target);
  if (shot || demo) return [rest[0], target, rest[1]];
  return shuffle([target, ...shuffle(rest).slice(0, 2)]);
}
function wave() {
  return '<span class="sound-wave" aria-hidden="true">' + Array.from({ length: 5 }, (_, i) => `<i style="--i:${i}"></i>`).join('') + '</span>';
}
function pic(mood, line) {
  const visor = space() ? '<span class="visor" aria-hidden="true"></span>' : '';
  const salute = space() ? `<span class="salute" aria-hidden="true">${ico('paw')}</span>` : '';
  return `<figure class="lucy ${mood === 'celebrate' ? 'mood-celebrate' : ''}">${line ? `<div class="speech">${line}</div>` : ''}<div class="lucy-portrait">${visor}<img src="assets/lucy-${mood}.jpg" alt="Lucy the golden retriever${mood === 'celebrate' ? ', celebrating' : ''}" draggable="false"></div>${salute}<figcaption>${ico('paw')} LUCY</figcaption><span class="spark one" aria-hidden="true">✦</span><span class="spark two" aria-hidden="true">✦</span></figure>`;
}

function header() {
  $('#header').innerHTML = `<a class="brand" href="../index.html" aria-label="Fun pass, both worlds"><span class="brand-mark">${ico(space() ? 'star' : 'paw')}</span><span>Little Woof<small>Little sounds. Big discoveries.</small></span></a><div class="controls"><button class="tool" id="mute" type="button" aria-label="Mute sound" aria-pressed="false">${ico('sound')}</button><div class="theme-control"><label for="theme">${ico('palette')}</label><select id="theme" aria-label="Color theme">${C.themes.map((t, i) => `<option value="${i}">${t}</option>`).join('')}</select></div></div>`;
  $('#theme').value = String(theme);
  $('#theme').addEventListener('change', (e) => {
    setTheme(Number(e.target.value));
    announce(C.themes[theme] + ' theme');
    poke();
  });
  $('#mute').onclick = () => {
    muted = !muted;
    stopVoice();
    stopSfx();
    $('#mute').innerHTML = ico(muted ? 'mute' : 'sound');
    $('#mute').setAttribute('aria-pressed', String(muted));
    $('#mute').setAttribute('aria-label', muted ? 'Turn sound on' : 'Mute sound');
    announce(muted ? 'Sound off. Follow the pictures.' : 'Sound on. Tap a speaker to listen.');
    poke();
  };
  $('#footer').innerHTML = `<span class="footer-note">${ico('paw')} Made for little explorers · ages 3–4</span><span id="storage" class="storage-notice">${storageOK ? 'Six sounds. Take your time.' : 'Theme saved for this visit only.'}</span><a href="../index.html">Both fun passes ↗</a>`;
  setTheme(theme);
}

function badges(l) {
  return visited.has(l.letter) ? `<span class="visited" aria-label="played this visit">${ico('check')}</span>` : '';
}
function pickers() {
  const type = post() ? 'envelopes' : 'planets';
  return `<div class="letter-list ${type}" aria-label="Choose a letter">${letters.map((l, i) => `<button class="paper" type="button" data-letter="${l.letter}" aria-label="Play letter ${l.letter}" style="--i:${i};--tilt:${[-5, 3, -2, 4, -3, 5][i]}deg"><span class="brackets" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="letter-decoration" aria-hidden="true"></span><span class="reveal-card" aria-hidden="true"></span><span class="planet-core"><span class="pick-glyph">${l.letter}<small>${l.letter.toLowerCase()}</small></span><span class="pick-caption">${post() ? 'OPEN ME' : 'explore'}</span></span>${badges(l)}</button>`).join('')}</div>`;
}
function deliveries() {
  return `<div class="deliveries"><p>Today’s deliveries</p><ol>${letters.map((l) => {
    const got = visited.has(l.letter);
    return `<li class="${got ? 'filled' : ''}" aria-label="${got ? l.word + ' delivered' : 'empty slot'}">${got ? draw(l.word, 'stamp-art') : ''}</li>`;
  }).join('')}</ol></div>`;
}
function constellation() {
  const complete = visited.size === 6;
  return `<div class="constellation ${complete ? 'complete' : ''}" role="img" aria-label="Sound constellation, ${visited.size} of 6 worlds"><ol>${letters.map((l, i) => {
    const prev = i > 0 && visited.has(letters[i - 1].letter) && visited.has(l.letter);
    return `<li class="${visited.has(l.letter) ? 'lit' : ''} ${prev ? 'link' : ''}"><i></i></li>`;
  }).join('')}</ol>${complete ? `<p class="constellation-name">${ico('paw')} Little Woof</p>` : ''}</div>`;
}

function home() {
  if (post()) {
    return `<section class="screen home post-home"><div class="post-intro"><p class="eyebrow"><span class="tiny-star">✳</span> A special delivery of sounds</p><h1>Lucy’s<br>Letter <em>Post.</em></h1><p class="lead">Little letters.<br>Very big adventures.</p><div class="post-sticker" aria-hidden="true">SOUND<br>MAIL ${ico('paw')}</div><div class="route-card"><span>YOUR LITTLE MISSION</span><p>${ico('sound')} Listen <b>→</b> ${ico('star')} Find <b>→</b> ${ico('check')} Deliver</p></div>${deliveries()}</div><div class="post-office"><div class="office-top"><div class="open-sign">OPEN FOR<br><strong>WOOFS!</strong></div>${pic('default', 'A letter for you!')}<span class="office-number" aria-hidden="true">№ 01<br>✳</span></div><div class="sorting-shelf"><div class="airmail-edge" aria-hidden="true"></div><div class="shelf-title"><span>Pick a letter to open</span>${ico('back')}</div>${pickers()}</div></div><div class="post-bottom"><span>THE LITTLE WOOF POSTAL SERVICE</span><span>Every sound goes somewhere lovely. ${ico('star')}</span></div></section>`;
  }
  return `<section class="screen home space-home"><div class="captain-panel"><p class="eyebrow">Small steps. Cosmic discoveries.</p><h1>Lucy’s<br><em>Moonboat</em></h1><p class="lead">A whole sky<br>of little sounds.</p><div class="captain">${pic('default', 'Ready, little explorer?')}<span class="captain-label">CAPTAIN LUCY · READY TO GO</span></div></div><div class="star-map"><div class="rocket-fly" aria-hidden="true">${draw('rocket')}</div><div class="map-heading"><span>THE SOUND CONSTELLATION</span><span class="map-mark">✦</span><span>06 LITTLE WORLDS</span></div>${constellation()}<div class="map-orbit" aria-hidden="true"></div><div class="map-orbit second" aria-hidden="true"></div><div class="map-caption">Tap a world. Find its sound.</div>${pickers()}<div class="map-ship" aria-hidden="true">${draw('rocket')}<span>One tiny adventure at a time.</span></div></div></section>`;
}
function stepbar(n) {
  const back = state === 'match' ? 'listen' : 'home';
  const backLabel = state === 'match' ? 'Listen' : 'Home';
  return `<div class="stepbar"><button class="back" type="button" data-action="${back}">${ico('back')} ${backLabel}</button><span class="steps-label">${['', 'Listen', 'Find', 'Hooray'][n]}</span><div class="steps" aria-label="Step ${n} of 3">${[1, 2, 3].map((i) => `<span class="${i <= n ? 'done' : ''}"></span>`).join('')}</div></div>`;
}
function soundCard() {
  const corner = post() ? 'SOUND MAIL' : 'SOUND SIGNAL';
  return `<button class="listen-letter paper" type="button" data-action="replay" aria-label="Hear letter ${current.letter} and its sound"><span class="letter-corner" aria-hidden="true">${corner}</span><span class="glyph">${current.letter}<small>${current.letter.toLowerCase()}</small></span><span class="sound-label">${ico('sound')} Hear ${current.sound}</span>${wave()}</button>`;
}
function listen() {
  const wording = post()
    ? ['You’ve got sound mail!', 'Open your ears. Listen with Lucy.', 'Find its picture']
    : ['A sound from the stars.', 'Listen closely, little explorer.', 'Find its picture'];
  const eyebrow = post() ? 'SPECIAL DELIVERY' : 'INCOMING TRANSMISSION';
  return `<section class="screen play listen">${stepbar(1)}<div class="listen-layout"><div class="listen-intro"><p class="eyebrow">${eyebrow}</p><h1 class="play-title">${wording[0]}</h1><p class="play-copy">${wording[1]}</p><div class="guide-lucy">${pic('specs', current.letter + ' says ' + current.sound)}</div></div><div class="listen-work">${soundCard()}<button class="primary paper continue" type="button" data-action="match">${wording[2]} ${ico('arrow')}</button><p class="small-note">Tap the letter to hear it again.</p></div></div></section>`;
}
function match() {
  const eyebrow = post() ? 'SORT THE SOUND MAIL' : 'LOOK THROUGH THE TELESCOPE';
  const prompt = post() ? 'Which picture belongs in this letter?' : 'Which picture has our little sound?';
  return `<section class="screen play match">${stepbar(2)}<div class="match-layout"><div class="match-prompt"><div><p class="eyebrow">${eyebrow}</p><h1 class="play-title">What starts<br>with ${current.sound}?</h1><p class="play-copy">Tap a picture.</p></div><div class="match-sound">${soundCard()}</div><div class="match-lucy">${pic('specs')}</div></div><div class="match-work"><div class="choices">${choices.map((l) => `<button class="choice paper" type="button" data-answer="${l.letter}" aria-label="${l.word}"><span class="beacon" aria-hidden="true"></span>${draw(l.word)}<span class="word">${l.word} ${ico('sound')}</span><span class="hint-tag">Try this picture</span></button>`).join('')}</div><svg class="postal-route" aria-hidden="true"></svg><p class="feedback" role="status">${prompt}</p><button class="replay-prompt paper" type="button" data-action="replay">${ico('sound')} Hear the sound again</button></div></div></section>`;
}
function celebrate() {
  if (post()) {
    return `<section class="screen celebration">${stepbar(3)}<div class="celebration-layout"><div class="reward-art delivery"><div class="envelope"><div class="envelope-pocket" aria-hidden="true"></div><div class="postcard">${draw(current.word)}<span class="reward-letter">${current.letter}<small>${current.letter.toLowerCase()}</small></span></div><div class="envelope-flap" aria-hidden="true"></div><div class="paw-stamp" aria-hidden="true">${ico('paw')}<span>Delivered</span></div></div><span class="burst-label">ONE HAPPY DELIVERY</span></div><div class="celebration-copy"><p class="eyebrow">Sound mail, delivered.</p><h1 class="finish-title">Delivered with love!</h1><p class="word-line">${current.letter} is for ${current.word}.</p>${deliveries()}<div class="finish-actions"><button class="primary paper" type="button" data-action="next">Another sound ${ico('arrow')}</button><button class="secondary paper" type="button" data-action="home">${ico('home')} Home</button></div><button class="replay-prompt paper reward-replay" type="button" data-action="reward-replay">${ico('sound')} Hear ${current.word} again</button></div><div class="celebration-lucy">${pic('celebrate', 'We did it!')}</div></div></section>`;
  }
  const pts = [[78, -86], [112, -18], [96, 58], [8, 86], [-78, 42], [-104, -40]];
  const stars = pts.map(([x, y], i) => `<i style="--x:${x}px;--y:${y}px;--i:${i}"></i>`).join('');
  return `<section class="screen celebration">${stepbar(3)}<div class="celebration-layout"><div class="reward-art planet-reward"><div class="reward-ring" aria-hidden="true"></div><div class="rim-light" aria-hidden="true"></div><div class="settled">${draw(current.word)}</div><span class="reward-letter">${current.letter}<small>${current.letter.toLowerCase()}</small></span><div class="stars" aria-hidden="true">${stars}</div><span class="burst-label">A NEW STAR IS SHINING</span></div><div class="celebration-copy"><p class="eyebrow">A little sound. A big discovery.</p><h1 class="finish-title">You lit up the sky!</h1><p class="word-line">${current.letter} is for ${current.word}.</p><div class="finish-actions"><button class="primary paper" type="button" data-action="next">Another sound ${ico('arrow')}</button><button class="secondary paper" type="button" data-action="home">${ico('home')} Home</button></div><button class="replay-prompt paper reward-replay" type="button" data-action="reward-replay">${ico('sound')} Hear ${current.word} again</button></div><div class="celebration-lucy">${pic('celebrate', 'We did it!')}</div></div></section>`;
}

function cancelFlight() {
  epoch++;
  clearTimers();
  stopVoice();
  stopSfx();
  clearFx();
  busy = false;
  arming = false;
}
function go(next, opts) {
  const focus = !opts || opts.focus !== false;
  cancelFlight();
  state = next;
  if (next !== 'listen') delete document.body.dataset.planet;
  main.innerHTML = next === 'home' ? home() : next === 'listen' ? listen() : next === 'match' ? match() : celebrate();
  document.body.dataset.screen = next;
  if (focus) {
    main.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  if (next === 'home') greet();
  armIdle();
}
function greet() {
  const instant = reduce() || shot;
  if (!introduced) {
    introduced = true;
    if (instant) return;
    if (post()) {
      $('.open-sign')?.classList.add('swing-once');
      $('.office-top .lucy')?.classList.add('hello');
    } else {
      $('.star-map')?.classList.add('intro');
      $('.captain .lucy-portrait')?.classList.add('helmet-tilt');
    }
    return;
  }
  themeWeather();
}
function themeWeather() {
  if (reduce() || shot || state !== 'home' || !space()) return;
  const world = $('.world');
  if (!world) return;
  world.classList.remove('weather-once');
  void world.offsetWidth;
  world.classList.add('weather-once');
}
function armIdle() {
  clearTimeout(idleTimer);
  idleTimer = 0;
  if (idled || document.hidden || shot || demo || reduce() || state !== 'home') return;
  idleTimer = setTimeout(() => {
    idleTimer = 0;
    if (document.hidden || state !== 'home' || idled) return;
    idled = true;
    const lucy = post() ? $('.office-top .lucy-portrait') : $('.captain .lucy-portrait');
    if (lucy) lucy.classList.add('idle-wiggle');
    if (space()) $('.map-mark')?.classList.add('bright');
  }, 11000);
}
function poke() {
  if (!idled && state === 'home') armIdle();
}
function inkRing(button) {
  if (!button || reduce() || shot) return;
  const ring = document.createElement('span');
  ring.className = post() ? 'ink-ring' : 'signal-ring';
  ring.setAttribute('aria-hidden', 'true');
  button.appendChild(ring);
  ring.addEventListener('animationend', () => ring.remove());
}
function tiltReplay() {
  if (reduce() || shot) return;
  if (post()) {
    document.querySelectorAll('.lucy-portrait').forEach((el) => {
      el.classList.remove('head-tilt');
      void el.offsetWidth;
      el.classList.add('head-tilt');
    });
  }
  if (space()) sfx.ping();
}

async function arm(letter, button) {
  if (arming) return;
  arming = true;
  const e = epoch;
  try {
    if (!reduce() && !shot) {
      button.classList.add(post() ? 'opening' : 'sent');
      if (post()) sfx.flap();
      else sfx.boop();
      const ok = await sleep(post() ? 500 : 420);
      if (!ok || e !== epoch) return;
    }
    begin(letter, { tint: space() });
  } finally {
    arming = false;
  }
}
function begin(letter, opts) {
  const tint = !!(opts && opts.tint);
  current = letters.find((l) => l.letter === letter) || letters[0];
  misses = 0;
  choices = decoys(current);
  go('listen');
  if (tint) document.body.dataset.planet = current.letter;
  playListen(tint);
}
async function playListen(tint) {
  if (shot) return;
  if (tint && !reduce()) {
    const ok = await sleep(450);
    if (!ok || state !== 'listen') return;
  }
  voice(letterAudio());
}
async function runReward() {
  const line = (post() ? 'Delivered. ' : 'The picture landed. ') + current.letter + ' is for ' + current.word + '.';
  announce(line);
  if (shot || reduce()) {
    (post() ? $('.delivery') : $('.planet-reward'))?.classList.add('done');
    if (space()) $('.celebration .lucy')?.classList.add('saluting');
    if (!shot) voice([cheerFile()]);
    return;
  }
  if (post()) {
    const stage = $('.delivery');
    requestAnimationFrame(() => stage && stage.classList.add('slip'));
    if (!(await sleep(620))) return;
    stage?.classList.add('stamped');
    spawnFlecks(stage);
    sfx.pom();
    if (!(await sleep(260))) return;
    sfx.chime();
    $('.celebration .lucy-portrait')?.classList.add('proud-nod');
    if (!(await sleep(380))) return;
    if (state !== 'celebrate') return;
    voice([cheerFile()]);
    return;
  }
  $('.planet-reward')?.classList.add('play');
  if (!(await sleep(720))) return;
  sfx.chord();
  $('.celebration .lucy')?.classList.add('saluting');
  if (!(await sleep(380))) return;
  if (state !== 'celebrate') return;
  voice([cheerFile()]);
}
function showHint() {
  const correct = $(`[data-answer="${current.letter}"]`);
  if (!correct) return;
  correct.classList.add('hint');
  if (space()) correct.classList.add('beacon');
  const feedback = $('.feedback');
  if (feedback) feedback.textContent = `${current.word} starts with ${current.sound}. Try the outlined picture.`;
  if (post()) drawRoute();
}
function drawRoute() {
  const host = $('.match-layout');
  const from = $('.match-prompt');
  const to = $(`[data-answer="${current.letter}"]`);
  const svg = $('.postal-route');
  if (!host || !from || !to || !svg) return;
  const hb = host.getBoundingClientRect();
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  const x1 = a.left + a.width * 0.55 - hb.left;
  const y1 = Math.max(12, a.top + a.height * 0.62 - hb.top);
  const x2 = b.left + b.width * 0.5 - hb.left;
  const y2 = b.top + 22 - hb.top;
  const mid = (y1 + y2) / 2;
  svg.setAttribute('viewBox', `0 0 ${Math.max(hb.width, 1)} ${Math.max(hb.height, 1)}`);
  svg.innerHTML = `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${x1.toFixed(1)} ${mid.toFixed(1)}, ${x2.toFixed(1)} ${mid.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}" />`;
  svg.classList.add('show');
}

async function answer(button) {
  if (busy || arming) return;
  busy = true;
  const mine = epoch;
  const selected = letters.find((l) => l.letter === button.dataset.answer);
  if (space()) button.classList.add('scanning');
  document.querySelectorAll('.choice').forEach((b) => b.setAttribute('aria-disabled', 'true'));
  await voice([wordAudio(selected)]);
  if (mine !== epoch || state !== 'match') return;
  if (selected === current) {
    visited.add(current.letter);
    go('celebrate');
    runReward();
    return;
  }
  misses += 1;
  if (post() && !reduce()) {
    button.classList.remove('settle');
    void button.offsetWidth;
    button.classList.add('settle');
  }
  const feedback = $('.feedback');
  if (feedback) feedback.textContent = `That’s ${selected.word}. Listen for ${current.sound}. Try another picture.`;
  if (misses >= 2) showHint();
  const hint = misses >= 2 ? [...letterAudio(), wordAudio(current)] : ['lucy-phoneme-' + current.letter.toLowerCase()];
  await voice(hint);
  if (mine !== epoch || state !== 'match') return;
  busy = false;
  document.querySelectorAll('.choice').forEach((b) => b.removeAttribute('aria-disabled'));
}

main.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b || b.getAttribute('aria-disabled') === 'true') return;
  poke();
  if (b.dataset.letter) {
    arm(b.dataset.letter, b);
    return;
  }
  if (b.dataset.answer) {
    answer(b);
    return;
  }
  const action = b.dataset.action;
  if (action === 'home') go('home');
  if (action === 'listen') {
    go('listen');
    if (space()) document.body.dataset.planet = current.letter;
    playListen(space());
  }
  if (action === 'match') {
    go('match');
    if (!shot) voice(['lucy-phoneme-' + current.letter.toLowerCase()]);
  }
  if (action === 'replay') {
    inkRing(b);
    tiltReplay();
    voice(letterAudio());
  }
  if (action === 'next') {
    const next = letters[(letters.indexOf(current) + 1) % letters.length];
    begin(next.letter, { tint: space() });
  }
  if (action === 'reward-replay') {
    inkRing(b);
    tiltReplay();
    voice([wordAudio(current)]);
  }
});
main.addEventListener('keydown', (e) => {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
  const group = e.target.closest('.letter-list,.choices');
  if (!group) return;
  const buttons = [...group.querySelectorAll('button')];
  const i = buttons.indexOf(e.target);
  if (i < 0) return;
  e.preventDefault();
  const jump = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1;
  buttons[(i + jump + buttons.length) % buttons.length].focus();
  poke();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state !== 'home') go('home');
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopVoice();
    stopSfx();
    clearTimeout(idleTimer);
    idleTimer = 0;
    document.body.classList.add('paused');
  } else {
    document.body.classList.remove('paused');
    armIdle();
  }
});
window.addEventListener('resize', () => {
  if (state === 'match' && misses >= 2 && post()) drawRoute();
});

header();
const screen = q.get('screen');
if (screen === 'listen' || screen === 'match' || screen === 'celebrate') {
  misses = q.get('hint') === '1' ? 2 : 0;
  choices = decoys(current);
  if (screen === 'celebrate') visited.add(current.letter);
  go(screen, { focus: false });
  if (screen === 'listen' && space()) document.body.dataset.planet = current.letter;
  if (screen === 'match' && misses >= 2) document.fonts.ready.then(() => requestAnimationFrame(() => showHint()));
  if (screen === 'celebrate') runReward();
} else {
  go('home', { focus: false });
}

window.__FUNPASS = {
  get state() { return state; },
  get busy() { return busy; },
  get misses() { return misses; },
  get visited() { return visited.size; },
  get muted() { return muted; },
  get epoch() { return epoch; },
  kind: C.kind,
  particles() { return document.querySelectorAll('.fleck').length; }
};

if (demo) {
  const waitFor = async (fn, ms) => {
    const start = performance.now();
    while (performance.now() - start < ms) {
      if (fn()) return true;
      await rest(80);
    }
    return false;
  };
  (async () => {
    await rest(1500);
    document.querySelector('[data-letter="S"]')?.click();
    await waitFor(() => state === 'listen' && !document.body.classList.contains('talking'), 8000);
    await rest(350);
    document.querySelector('[data-action="match"]')?.click();
    await waitFor(() => state === 'match', 4000);
    await rest(500);
    const wrongs = [...document.querySelectorAll('[data-answer]')].filter((b) => b.dataset.answer !== 'S');
    wrongs[0]?.click();
    await waitFor(() => !busy && misses >= 1, 8000);
    await rest(400);
    wrongs[1]?.click();
    await waitFor(() => !busy && misses >= 2, 8000);
    await rest(700);
    document.querySelector('[data-answer="S"]')?.click();
    await waitFor(() => state === 'celebrate', 8000);
    await rest(2600);
    document.querySelector('[data-action="home"]')?.click();
    await rest(1200);
    document.body.dataset.demo = 'done';
  })();
}
})();

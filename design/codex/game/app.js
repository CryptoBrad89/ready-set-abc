(() => {
'use strict';
const D = window.GAME_DATA, M = window.GameModel;
const $ = s => document.querySelector(s), main = $('#main'), gate = $('#gate');
const KEY = 'ready-set-abc-game-v1';
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const dark = matchMedia('(prefers-color-scheme: dark)');
const byLetter = Object.fromEntries(D.letters.map(l => [l.upper, l]));
let state, storageOK = true, screen = 'home', teacherTab = 'progress', teacherChild = '';
let current = null, choices = [], misses = 0, solved = false, teacherOpen = false;
let tried = new Set();
let voiceEpoch = 0, player = null, finishClip = null, voiceTimer = 0, captionTimer = 0;
let effectTimer = 0, context = null, oscillator = null, teacherTimer = 0, gateFailures = 0;
const missingAudio = new Set();
try { state = M.clean(JSON.parse(localStorage.getItem(KEY))); } catch { state = M.fresh(); storageOK = false; }
const kid = () => M.child(state);
const session = () => kid().session;
const e = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons = {
 home:'<path d="m3 11 9-8 9 8M6 9v12h12V9m-8 12v-7h4v7"/>',
 map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zm6-2v16m6-14v16"/>',
 star:'<path d="m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>',
 closet:'<path d="M9 6a3 3 0 1 1 3 3v3L2 19q-1 2 2 2h16q3 0 2-2l-10-7"/>',
 sound:'<path d="M3 9v6h5l5 4V5L8 9zm13-2q7 5 0 10m3-13q10 8 0 16"/>',
 mute:'<path d="M3 9v6h5l5 4V5L8 9zm14 0 5 6m0-6-5 6"/>',
 back:'<path d="M20 12H4m6-6-6 6 6 6"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
 lock:'<rect x="5" y="10" width="14" height="12" rx="3"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v3"/>',
 key:'<circle cx="8" cy="8" r="5"/><path d="m12 12 9 9m-5-5 3-3m-1 5 3-3"/>',
 moon:'<path d="M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
 paw:'<ellipse cx="12" cy="16" rx="6" ry="5"/><ellipse cx="4" cy="9" rx="2" ry="3"/><ellipse cx="9" cy="5" rx="2" ry="3"/><ellipse cx="16" cy="5" rx="2" ry="3"/><ellipse cx="21" cy="10" rx="2" ry="3"/>',
 people:'<circle cx="9" cy="7" r="4"/><path d="M2 22v-5a7 7 0 0 1 14 0v5m1-19a4 4 0 0 1 0 8m2 3q4 1 4 6v2"/>',
 check:'<path d="m4 12 5 6L21 5"/>', envelope:'<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m3 6 9 7 9-7"/>',
 rocket:'<path d="M9 16Q4 9 12 2q8 7 3 14zm0-3-5 7 6-2m5-5 5 7-6-2m-4 0 2 5 2-5"/><circle cx="12" cy="9" r="2"/>'
};
const ico = (id, big = false) => `<svg class="icon${big ? ' big' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[id] || icons.star}</svg>`;
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); storageOK = true; }
  catch { storageOK = false; }
  updateStorageNotice();
}
function updateStorageNotice() {
  const existing = $('.storage-banner');
  if (storageOK) existing?.remove();
  else if (!existing) {
    const el = document.createElement('p'); el.className = 'storage-banner'; el.setAttribute('role','status');
    el.textContent = 'Progress lasts for this visit only. Device storage is unavailable.';
    main.prepend(el);
  }
}
function applySettings() {
  document.body.dataset.theme = state.settings.theme;
  document.body.dataset.dark = String(state.settings.dark === 'dark' || (state.settings.dark === 'system' && dark.matches));
  document.body.dataset.motion = state.settings.motion && !reduce.matches ? 'on' : 'off';
  document.querySelector('meta[name="theme-color"]').content = getComputedStyle(document.body).getPropertyValue('--bg').trim();
}
function shell() {
  applySettings();
  $('#header').innerHTML = `<button class="brand" data-route="home" aria-label="Ready Set ABC home"><span class="logo">${ico('envelope')}</span><span>ready set abc<small>Lucy’s little adventures</small></span></button><div class="controls"><button class="child-chip" data-route="profiles" aria-label="Choose child, ${e(kid().name)}"><span aria-hidden="true">${kid().avatar}</span><span>${e(kid().name)}</span></button><button data-action="mute" aria-label="${state.settings.muted ? 'Turn sound on' : 'Mute sound'}" aria-pressed="${state.settings.muted}">${ico(state.settings.muted ? 'mute' : 'sound')}</button><button data-action="theme" aria-label="Switch to ${state.settings.theme === 'post' ? 'Moonboat' : 'Letter Post'}">${ico(state.settings.theme === 'post' ? 'rocket' : 'envelope')}</button><button data-action="dark" aria-label="${document.body.dataset.dark === 'true' ? 'Use light colors' : 'Use dark colors'}">${ico(document.body.dataset.dark === 'true' ? 'sun' : 'moon')}</button><button data-action="teacher" aria-label="Grown-ups, enter PIN">${ico('key')}</button></div>`;
  $('#kid-nav').hidden = screen === 'teacher';
  $('#kid-nav').innerHTML = [['home','home','Home'],['map','map','Letters'],['stickers','star','Stickers'],['closet','closet','Lucy'],['profiles','people','Me']].map(([route,icon,label]) => `<button data-route="${route}" aria-label="${label}" ${screen === route ? 'aria-current="page"' : ''}>${ico(icon)}<span>${label}</span></button>`).join('');
}
function stopVoice() {
  voiceEpoch++; clearTimeout(voiceTimer);
  if (player) { player.pause(); player.onended = null; player.onerror = null; player = null; }
  if (finishClip) { finishClip(false); finishClip = null; }
  document.body.classList.remove('speaking');
}
function caption(text) {
  clearTimeout(captionTimer); $('#spoken').textContent = text;
  captionTimer = setTimeout(() => { $('#spoken').textContent = ''; }, 4200);
}
async function speak(files, text = '') {
  stopVoice(); hush();
  const mine = voiceEpoch;
  if (text) caption(text);
  if (state.settings.muted || document.hidden) return;
  document.body.classList.add('speaking');
  for (const file of files.filter(Boolean)) {
    if (mine !== voiceEpoch) return;
    if (!text && D.voiceText[file]) caption(D.voiceText[file]);
    if (missingAudio.has(file)) { if(screen === 'bonus' && $('.mystery-cue')) $('.mystery-cue').hidden=false; continue; }
    await new Promise(resolve => {
      const a = new Audio(file); player = a;
      let finished = false;
      const done = ok => {
        if (finished) return;
        finished = true;
        clearTimeout(voiceTimer); a.onended = null; a.onerror = null;
        if (finishClip === done) finishClip = null;
        if (!ok) a.pause();
        resolve(ok);
      };
      finishClip = done;
      a.onended = () => done(true);
      a.onerror = () => { missingAudio.add(file); if(screen === 'bonus' && $('.mystery-cue')) $('.mystery-cue').hidden=false; done(false); };
      voiceTimer = setTimeout(() => done(false), 12000);
      a.play().catch(() => { if(screen === 'bonus' && $('.mystery-cue')) $('.mystery-cue').hidden=false; done(false); });
    });
  }
  if (mine === voiceEpoch) { player = null; document.body.classList.remove('speaking'); }
}
function line(id, after = [], text = '') { return speak([D.lines[id], ...after], text || D.voiceText[D.lines[id]]); }
function hush() { if (oscillator) { try { oscillator.stop(); } catch {} oscillator = null; } }
function chime() {
  if (state.settings.muted || !state.settings.effects || document.hidden || player) return;
  try {
    context ||= new (window.AudioContext || window.webkitAudioContext)();
    if (context.state === 'suspended') context.resume().catch(() => {});
    hush(); const o = context.createOscillator(), g = context.createGain(), t = context.currentTime;
    oscillator = o; o.type = 'sine'; o.frequency.setValueAtTime(523, t); o.frequency.setValueAtTime(659, t + .1);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.04, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .25);
    o.connect(g); g.connect(context.destination); o.start(); o.stop(t + .26);
    o.onended = () => { o.disconnect(); g.disconnect(); if (oscillator === o) oscillator = null; };
  } catch { /* Matching always works without audio output. */ }
}
function clearEffects() { clearTimeout(effectTimer); $('#effects').replaceChildren(); document.getAnimations?.().forEach(a => a.cancel()); }
function rewardEffect() {
  clearEffects();
  if (reduce.matches || !state.settings.motion || document.hidden) return;
  for (let i = 0; i < 8; i++) {
    const s = document.createElement('span'); s.className = 'spark'; s.textContent = i % 2 ? '✦' : '●';
    const angle = i * Math.PI / 4; s.style.setProperty('--x', Math.cos(angle) * 250 + 'px');
    s.style.setProperty('--y', Math.sin(angle) * 180 + 'px'); $('#effects').append(s);
  }
  effectTimer = setTimeout(() => $('#effects').replaceChildren(), 850);
}
const portrait = (file, label = 'Lucy the golden puppy') => `<figure class="portrait"><img src="${file}" alt="${e(label)}" draggable="false"></figure>`;
function outfit() { return D.outfits.find(o => o.id === kid().outfit && o.stars <= M.stars(kid())) || D.outfits[0]; }
function scene() {
  return `<div class="lucy-scene"><span class="speech">${ico('paw')} Hello, little explorer!</span><span class="scene-letter left" aria-hidden="true">A</span>${portrait(outfit().image)}<span class="scene-letter right" aria-hidden="true">a</span><span class="scene-badge">${ico(state.settings.theme === 'post' ? 'envelope' : 'rocket')} LUCY · READY TO PLAY</span></div>`;
}
function heading(title, icon = 'star') { return `<div class="screen-heading"><div><p class="eyebrow">Your little world</p><h1>${title}</h1></div><div class="counter" aria-label="${M.stars(kid())} of 26 stickers">${ico(icon)} ${M.stars(kid())}<small>/ 26</small></div></div>`; }
function home() {
  const s = session(), next = s && state.settings.unlocked.includes(s.letter) ? s.letter : M.nextLetter(state);
  const moon = state.settings.theme === 'moon';
  return `<section class="screen ${moon ? 'moon-world' : ''}"><div class="home-grid"><div class="home-copy"><p class="eyebrow"><span class="dot"></span>${moon ? 'Small steps. Cosmic discoveries.' : 'A special delivery of sounds'}</p><h1>Lucy’s<br>${moon ? '<em>Moonboat.</em>' : 'Letter <em>Post.</em>'}</h1><div class="postmark" aria-hidden="true">${ico(moon ? 'star' : 'paw')}<br>LET’S PLAY</div><p class="intro">${moon ? 'A whole sky of little sounds.' : 'Little letters.<br>Very big adventures.'}</p><button class="launch" data-action="play" aria-label="${s && next === s.letter ? 'Continue' : 'Play'} letter ${next || 'map'}"><span class="play" aria-hidden="true">▶</span><span>${s && next === s.letter ? 'Keep playing' : 'Let’s play'}<small>${next ? next + ' ' + next.toLowerCase() + ' · a little adventure' : 'Choose a letter with a grown-up'}</small></span>${ico('arrow')}</button><div class="preview-row" aria-label="${M.stars(kid())} stickers collected">${state.settings.order.slice(0,4).map(l => `<span class="mini-letter ${kid().progress[l]?.completions ? 'done' : ''}">${kid().progress[l]?.completions ? '✓' : l}</span>`).join('')}<p>One little sound<br>at a time.</p></div></div>${scene()}</div></section>`;
}
function map() {
  return `<section class="screen">${heading('A world of letters', 'map')}<div class="map-grid" aria-label="Choose a letter">${state.settings.order.map(l => {
    const locked = !state.settings.unlocked.includes(l), done = kid().progress[l]?.completions;
    return `<button class="letter-tile ${locked ? 'locked' : ''}" data-letter="${l}" aria-label="${l}, ${locked ? 'locked, ask a grown-up' : done ? 'sticker collected, play again' : 'ready to play'}" ${locked ? 'aria-disabled="true"' : ''}><span>${l} <small>${l.toLowerCase()}</small></span>${done ? '<span class="seal" aria-hidden="true">✓</span>' : ''}${locked ? `<span class="lock">${ico('lock')}</span>` : ''}</button>`;
  }).join('')}</div></section>`;
}
function stickers() {
  return `<section class="screen">${heading('Your sticker book')}<div class="stickers-grid">${D.letters.map(l => {
    const done = kid().progress[l.upper]?.completions;
    return done ? `<button class="sticker collected" data-word="${l.upper}" aria-label="Hear ${l.word}, letter ${l.upper}"><img src="${l.image}" alt="${l.word}"><b>${l.upper}</b></button>` : `<div class="sticker empty-slot" aria-label="${l.upper}, sticker waiting"><span aria-hidden="true">${ico('star', true)}</span><b>${l.upper}</b></div>`;
  }).join('')}</div><p class="caption" style="margin-top:20px">${M.stars(kid()) ? 'Tap a sticker to hear its word.' : 'Every little letter adventure brings a sticker.'}</p></section>`;
}
function closet() {
  const stars = M.stars(kid());
  return `<section class="screen">${heading('Lucy’s dress-up box', 'closet')}<div class="closet">${scene()}<div><div class="outfits">${D.outfits.map(o => `<button class="outfit ${stars < o.stars ? 'locked' : ''}" data-outfit="${o.id}" aria-label="${o.label}${stars < o.stars ? ', collect ' + o.stars + ' stickers to open' : ''}" aria-pressed="${outfit().id === o.id}" ${stars < o.stars ? 'aria-disabled="true"' : ''}><img src="${o.image}" alt="Lucy wearing ${o.label}"><span>${stars < o.stars ? ico('lock') + ' ' + o.stars + ' ★' : e(o.label)}</span></button>`).join('')}</div><p class="caption" style="margin-top:20px">${ico('star')} A new letter, a new sticker. More stickers, more dress-up!</p></div></div></section>`;
}
function profiles() {
  return `<section class="screen"><div class="screen-heading"><div><p class="eyebrow">Hello, little explorer</p><h1>Who’s playing?</h1></div>${ico('people', true)}</div><div class="profiles">${state.children.map(c => `<button class="profile" data-child="${e(c.id)}" aria-pressed="${c.id === state.active}" aria-label="Play as ${e(c.name)}"><span aria-hidden="true">${c.avatar}</span><strong>${e(c.name)}</strong></button>`).join('')}</div><p class="caption">${ico('key')} Grown-ups can add explorers in the teacher room.</p></section>`;
}
function stepbar(index, title) {
  return `<div class="stepbar"><button data-route="map" aria-label="Back to letter map">${ico('back')}${ico('map')}</button><span class="step-title">${title}</span><div class="steps" role="img" aria-label="Step ${index + 1} of 5">${Array.from({length:5},(_,i) => `<span class="${i <= index ? 'done' : ''}"></span>`).join('')}</div><button data-action="instruction" aria-label="Hear instructions">${ico('sound')}</button></div>`;
}
const guide = (title, copy) => `<aside class="guide"><div class="guide-copy"><p class="eyebrow">${current.upper} ${current.lower} · ${current.word}</p><h1>${title}</h1><p>${copy}</p></div><div class="guide-lucy">${portrait(outfit().image)}</div></aside>`;
function listen() {
  const s = session();
  return `<section class="screen">${stepbar(0,'Listen & say')}<div class="activity">${guide('A little letter.<br>A little sound.', 'Tap both cards. Say it with Lucy.')}<div class="work"><div class="listen-pair"><button class="listen-button ${s.heardName ? 'heard' : ''}" data-listen="name" aria-label="Hear letter ${current.upper} name"><span>${current.upper}</span>${ico('sound')}${s.heardName ? '<span class="heard-check" aria-hidden="true">✓</span>' : ''}</button><button class="listen-button ${s.heardSound ? 'heard' : ''}" data-listen="sound" aria-label="Hear letter ${current.upper} sound"><span>${current.lower}</span>${ico('sound')}${s.heardSound ? '<span class="heard-check" aria-hidden="true">✓</span>' : ''}</button></div><div class="next-row"><button class="primary" data-action="advance" ${s.heardName && s.heardSound ? '' : 'disabled'} aria-label="Next, match the letters">${ico('check')} ${ico('arrow')}</button></div></div></div></section>`;
}
function choiceCards(kind, lower = false) {
  return `<div class="choices" aria-label="Choose a ${kind === 'picture' ? 'picture' : 'letter'}">${choices.map(l => `<button class="choice ${lower ? 'lower' : ''} ${tried.has(l.upper)?'tried':''} ${solved&&l===current?'correct':''} ${misses>=2&&!solved&&l===current?'hint':''}" data-answer="${l.upper}" ${solved||tried.has(l.upper)?'aria-disabled="true"':''} aria-label="${kind === 'picture' ? l.word : lower ? 'Lowercase ' + l.lower : 'Uppercase ' + l.upper}">${kind === 'picture' ? `<img src="${l.image}" alt="${l.word}" draggable="false"><span class="word">${l.word}</span>` : lower ? l.lower : l.upper}</button>`).join('')}</div>`;
}
function nextRow() { return `<p class="feedback" role="status">${solved?'✓ You found it!':misses>=2?'Try the glowing card.':misses?'Let’s try another one.':ico('paw')+' Take your time.'}</p><div class="next-row"><button class="replay" data-action="instruction" aria-label="Hear the prompt again">${ico('sound')}</button><button class="primary" data-action="advance" aria-label="Next activity" ${solved?'':'hidden'}>${ico('check')} ${ico('arrow')}</button></div>`; }
function caseMatch() {
  const lower = session().caseRound === 0;
  return `<section class="screen">${stepbar(1,'Big & little friends')}<div class="activity">${guide('Two letters.<br>One friend.', lower ? 'Find the little letter that matches.' : 'Now find its big letter.')}<div class="work"><div class="cue"><span class="target ${lower ? '' : 'lower'}" aria-label="Match ${lower ? current.upper : current.lower}">${lower ? current.upper : current.lower}</span>${ico('arrow',true)}</div>${choiceCards('case',lower)}${nextRow()}</div></div></section>`;
}
function pictureMatch() {
  const isX = current.upper === 'X';
  return `<section class="screen">${stepbar(2,'Find the picture')}<div class="activity">${guide('A sound.<br>A picture.', isX ? 'Hear /ks/ at the end of fox.' : 'Which picture starts with this sound?')}<div class="work"><button class="replay" data-action="sound" aria-label="Hear the sound to match">${ico('sound',true)}<span class="target">${current.upper}<small>${current.lower}</small></span></button>${choiceCards('picture')}${nextRow()}</div></div></section>`;
}
function bonus() {
  const sound = session().bonusRound === 1;
  return `<section class="screen">${stepbar(3,'A little bonus')}<div class="activity">${guide('Little ears.<br>Big discovery.', sound ? 'Listen for the sound. Find its little letter.' : 'Listen for the name. Find its big letter.')}<div class="work"><button class="replay" data-action="bonus-replay" aria-label="Hear the mystery ${sound ? 'sound' : 'letter name'}">${ico('sound',true)} ${ico('star',true)}<span class="mystery-cue" ${state.settings.muted?'':'hidden'}>${sound?current.lower:current.upper}</span></button>${choiceCards('bonus',sound)}${nextRow()}</div></div></section>`;
}
function celebrate() {
  return `<section class="screen">${stepbar(4,'Hooray!')}<div class="celebrate-grid"><div class="reward"><span class="reward-seal">${ico('star')} ONE HAPPY DISCOVERY</span><img src="${current.image}" alt="Your ${current.word} sticker"><span class="reward-letter">${current.upper}<small>${current.lower}</small></span></div><div class="celebrate-copy"><img class="finish-lucy" src="${D.lucyCelebrate}" alt="Lucy celebrating"><p class="eyebrow">${state.settings.theme === 'post' ? 'Delivered with love' : 'You lit up the sky'}</p><h1>You did it!</h1><p>${current.upper} · ${current.word}<br>${M.stars(kid())} happy little ${M.stars(kid()) === 1 ? 'sticker' : 'stickers'}.</p><div class="finish-actions"><button class="primary" data-action="next-letter" aria-label="Play another letter">${ico('arrow')} Let’s play</button><button class="secondary" data-route="stickers" aria-label="See your sticker book">${ico('star')}</button><button class="secondary" data-route="closet" aria-label="Dress Lucy">${ico('closet')}</button></div></div></div></section>`;
}
function shuffle(items) {
  const a = [...items];
  for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function choose() {
  // Mix all letters to keep an alphabet-wide vocabulary; every choice is voiced/labeled.
  choices = shuffle([current, ...shuffle(D.letters.filter(l => l !== current)).slice(0,2)]);
  misses = 0; solved = false; tried = new Set();
}
function go(route, { prompt = false, focus = true } = {}) {
  if (route === 'teacher' && !teacherOpen) { openGate(); return; }
  if (['listen','case','picture','bonus'].includes(route) && (!session() || !current)) route = 'home';
  if (screen === 'teacher' && route !== 'teacher') { teacherOpen = false; clearTimeout(teacherTimer); }
  stopVoice(); hush(); clearEffects(); clearTimeout(captionTimer); $('#spoken').textContent = '';
  screen = route;
  shell();
  const render = {home,map,stickers,closet,profiles,listen,case:caseMatch,picture:pictureMatch,bonus,celebrate,teacher};
  main.innerHTML = (render[screen] || home)(); document.body.dataset.screen = screen;
  updateStorageNotice();
  if (focus) { main.focus({preventScroll:true}); window.scrollTo({top:0,behavior:'instant'}); }
  if (screen === 'celebrate') rewardEffect();
  if (prompt) instruction();
}
function start(letter, resume = false) {
  if (!byLetter[letter] || !state.settings.unlocked.includes(letter)) { line('locked'); return; }
  current = byLetter[letter];
  if (!resume || session()?.letter !== letter) kid().session = { letter, stage:'listen', caseRound:0, bonusRound:0, heardName:false, heardSound:false };
  choose(); save(); go(session().stage,{prompt:true});
}
function instruction() {
  if (screen === 'listen') line('listen');
  else if (screen === 'case') line(session().caseRound === 0 ? 'case-lower' : 'case-upper',[current.name]);
  else if (screen === 'picture') line(current.upper === 'X' ? 'picture-x' : 'picture',[current.sound]);
  else if (screen === 'bonus') line(session().bonusRound === 0 ? 'bonus-name' : 'bonus-sound',[session().bonusRound === 0 ? current.name : current.sound]);
  else if (screen === 'celebrate') line('celebrate',[current.wordAudio,D.cheers[M.stars(kid())%2]]);
  else if (screen === 'home') line('welcome');
  else if (['map','stickers','closet','profiles'].includes(screen)) line(screen);
}
function advance() {
  const s = session(); if (!s) return;
  if (screen === 'listen') {
    if (!s.heardName || !s.heardSound) return;
    s.stage='case';
  } else {
    if (!solved) return;
    if (screen === 'case') { if (s.caseRound === 0) s.caseRound=1; else s.stage='picture'; }
    else if (screen === 'picture') s.stage='bonus';
    else if (screen === 'bonus') {
      if (s.bonusRound === 0) s.bonusRound=1;
      else { M.complete(state,current.upper); save(); go('celebrate',{prompt:true}); return; }
    }
  }
  choose(); save(); go(s.stage,{prompt:true});
}
function answer(button) {
  if (solved || button.getAttribute('aria-disabled') === 'true' || !['case','picture','bonus'].includes(screen)) return;
  const selected = byLetter[button.dataset.answer], correct = selected === current;
  M.answer(kid(),current.upper,screen,correct); save();
  if (correct) {
    solved=true; $('.feedback').textContent='✓ You found it!';
    button.classList.add('correct');
    document.querySelectorAll('[data-answer]').forEach(b => b.setAttribute('aria-disabled','true'));
    $('[data-action="advance"]').hidden=false;
    chime(); speak([screen === 'picture' ? current.wordAudio : current.name,D.cheers[0]],'You found it!');
  } else {
    misses++; tried.add(selected.upper); button.classList.add('tried'); button.setAttribute('aria-disabled','true');
    $('.feedback').textContent='Let’s try another one.';
    if (misses >= 2) {
      const hint=$(`[data-answer="${current.upper}"]`); hint.classList.add('hint');
      $('.feedback').textContent='Try the glowing card.'; M.progress(kid(),current.upper).hints++; save();
      line('hint',[screen === 'picture' ? current.wordAudio : current.name]);
    } else {
      line('again',[screen === 'picture' ? selected.wordAudio : selected.name]);
    }
  }
}
function teacher() {
  const tabs=[['progress','Progress'],['children','Explorers'],['letters','Letters & order'],['settings','Settings']];
  return `<section class="screen teacher"><div class="screen-heading"><div><p class="eyebrow">Grown-ups only · saved on this device</p><h1>Teacher room</h1></div><button class="secondary" data-route="home">${ico('lock')} Lock & play</button></div><nav class="teacher-tabs" aria-label="Teacher tools">${tabs.map(([tab,label]) => `<button data-tab="${tab}" ${tab===teacherTab ? 'aria-current="page"' : ''}>${label}</button>`).join('')}</nav>${({progress:teacherProgress,children:teacherChildren,letters:teacherLetters,settings:teacherSettings})[teacherTab]()}</section>`;
}
function teacherProgress() {
  const c=state.children.find(c=>c.id===teacherChild) || kid(); teacherChild=c.id;
  const p=Object.values(c.progress), attempts=p.reduce((n,r)=>n+r.case.attempts+r.picture.attempts+r.bonus.attempts,0);
  const correct=p.reduce((n,r)=>n+r.case.correct+r.picture.correct+r.bonus.correct,0);
  return `<div class="panel"><label for="progress-child">Explorer</label><select id="progress-child">${state.children.map(c=>`<option value="${e(c.id)}" ${c.id===teacherChild?'selected':''}>${e(c.name)} ${c.avatar}</option>`).join('')}</select><div class="progress-summary"><span>${M.stars(c)} / 26 letters completed</span><span>${correct} / ${attempts} choices matched</span><span>${p.reduce((n,r)=>n+r.hints,0)} hints</span></div><div class="form-actions"><button data-action="export">Export all children · CSV</button><button class="danger" data-reset-child="${e(c.id)}">Reset this child’s progress</button></div><p class="caption">Counts include retries and repeat play. These activities are practice, not an assessment. A completion earns one unique sticker; repeats keep the sticker.</p></div><div class="table-scroll"><table><caption>${e(c.name)} · progress by letter. Case = upper/lower; bonus = name/sound recognition. Counts show correct / attempts.</caption><thead><tr><th>Letter</th><th>Access</th><th>Listens<br>name / sound</th><th>Case</th><th>Picture</th><th>Bonus</th><th>Hints</th><th>Finishes</th><th>Last played</th></tr></thead><tbody>${state.settings.order.map(l=>{
    const p=c.progress[l]||M.stats();
    return `<tr><td>${l} ${l.toLowerCase()}</td><td>${state.settings.unlocked.includes(l)?'Open':'Locked'}</td><td>${p.nameListens} / ${p.soundListens}</td><td>${p.case.correct} / ${p.case.attempts}</td><td>${p.picture.correct} / ${p.picture.attempts}</td><td>${p.bonus.correct} / ${p.bonus.attempts}</td><td>${p.hints}</td><td>${p.completions}</td><td>${p.lastPlayed?e(new Date(p.lastPlayed).toLocaleString()):'—'}</td></tr>`;
  }).join('')}</tbody></table></div>`;
}
function teacherChildren() {
  return `<div class="teacher-grid"><div class="panel"><h2>Your explorers</h2>${state.children.map(c=>`<div class="child-admin"><strong>${c.avatar} ${e(c.name)} ${c.id===state.active?'· playing':''}</strong><button data-edit-child="${e(c.id)}" aria-label="Edit ${e(c.name)}">Edit</button><button class="danger" data-delete-child="${e(c.id)}" ${state.children.length===1?'disabled':''} aria-label="Delete ${e(c.name)}">Delete</button></div>`).join('')}<p class="caption">Children choose their picture on the Me screen. Up to 24 profiles. Names stay on this device.</p></div><div class="panel"><h2>Add an explorer</h2><form id="child-add"><label>Display name<input name="name" maxlength="32" required autocomplete="off" placeholder="Little explorer"></label><label>Picture<select name="avatar">${M.AVATARS.map(a=>`<option>${a}</option>`).join('')}</select></label><button class="primary" ${state.children.length>=24?'disabled':''}>Add explorer</button><p class="error" id="child-error" role="status"></p></form></div></div>`;
}
function teacherLetters() {
  return `<div class="panel"><h2>Make their little path</h2><p>Open or lock letters for all explorers. Move letters with the arrows. Play follows this order; children can choose any open letter.</p><div class="form-actions"><button data-action="unlock-all">Open A–Z</button><button data-action="starter-set">Open first six only</button><button data-action="alphabet-order">A–Z order</button><button data-action="sound-order">S A T P I M first</button></div><label class="check-label"><input type="checkbox" data-setting="autoUnlock" ${state.settings.autoUnlock?'checked':''}>Finishing a letter opens the next letter in this order</label></div><div class="letter-settings">${state.settings.order.map((l,i)=>`<div class="order-row"><span class="caption">${i+1}.</span><strong>${l} ${l.toLowerCase()}</strong><label><input type="checkbox" data-unlock="${l}" ${state.settings.unlocked.includes(l)?'checked':''} aria-label="Open letter ${l}">Open</label><button data-move="${l}" data-direction="-1" aria-label="Move ${l} earlier" ${i===0?'disabled':''}>↑</button><button data-move="${l}" data-direction="1" aria-label="Move ${l} later" ${i===25?'disabled':''}>↓</button></div>`).join('')}</div>`;
}
function teacherSettings() {
  const s=state.settings;
  return `<div class="teacher-grid"><div class="panel"><h2>Play settings</h2><label>World<select data-setting="theme"><option value="post" ${s.theme==='post'?'selected':''}>Lucy’s Letter Post</option><option value="moon" ${s.theme==='moon'?'selected':''}>Lucy’s Moonboat</option></select></label><label>Colors<select data-setting="dark"><option value="system" ${s.dark==='system'?'selected':''}>Follow device</option><option value="light" ${s.dark==='light'?'selected':''}>Light</option><option value="dark" ${s.dark==='dark'?'selected':''}>Dark</option></select></label><label class="check-label"><input type="checkbox" data-setting="muted" ${s.muted?'checked':''}>Mute all audio</label><label class="check-label"><input type="checkbox" data-setting="effects" ${s.effects?'checked':''}>Gentle sound effects</label><label class="check-label"><input type="checkbox" data-setting="motion" ${s.motion?'checked':''}>Light animations</label><p class="caption">The device’s Reduce Motion setting always wins. No timers, ads, links out, microphone, or network services in play.</p><p class="notice">${e($('#offline-status').textContent)}</p><button data-action="cache-retry">Refresh offline files</button></div><div><div class="panel"><h2>Grown-up PIN</h2><form id="pin-change"><label>Current PIN<input name="current" type="password" inputmode="numeric" pattern="[0-9]{4,8}" minlength="4" maxlength="8" required autocomplete="off"></label><label>New PIN · 4–8 numbers<input name="pin" type="password" inputmode="numeric" pattern="[0-9]{4,8}" minlength="4" maxlength="8" required autocomplete="new-password"></label><label>Repeat new PIN<input name="repeat" type="password" inputmode="numeric" pattern="[0-9]{4,8}" minlength="4" maxlength="8" required autocomplete="new-password"></label><button>Save PIN</button><p class="error" id="pin-message" role="status"></p></form></div><div class="panel"><h2>Start fresh</h2><p>Export CSV before a reset if you want to keep a progress record.</p><button data-action="export">Export CSV</button><button class="danger" data-action="reset-all">Reset this device</button></div></div></div>`;
}
function closeGate() { if(gate.open)gate.close(); }
function modal(html) {
  stopVoice(); hush(); clearEffects(); gate.innerHTML=html;
  if(!gate.open)gate.showModal();
  gate.querySelector('input,button')?.focus();
}
function openGate() {
  if(teacherOpen && screen==='teacher')return;
  modal(`<h2 id="gate-title">Hello, grown-up</h2><p>Enter your PIN to open the teacher room.</p><form id="pin-gate"><label>Grown-up PIN<input name="pin" type="password" inputmode="numeric" pattern="[0-9]{4,8}" minlength="4" maxlength="8" required autocomplete="off" aria-describedby="gate-error"></label><p id="gate-error" class="error" role="status"></p><div class="form-actions"><button class="primary">Open teacher room</button><button type="button" data-action="close-gate">Back to play</button></div></form>`);
}
function refreshTeacher() { save(); go('teacher',{focus:false}); }
function confirmReset(childId=null,remove=false) {
  if(!teacherOpen)return;
  const c=state.children.find(c=>c.id===childId);
  if(childId&&!c)return;
  const title=remove?'Delete explorer':childId?'Reset progress':'Reset this device';
  modal(`<h2 id="gate-title">${title}</h2><p>${childId?`${remove?'Delete':'Clear progress, stickers and outfits for'} ${e(c.name)}?`:'Clear every child, all progress, outfits, settings and the PIN? The offline files stay installed.'} This cannot be undone.</p><form id="reset-confirm" data-child-id="${e(childId||'')}" data-remove="${remove}"><label>Type RESET to confirm<input name="confirm" required pattern="RESET" autocomplete="off"></label><div class="form-actions"><button class="danger">${title}</button><button type="button" data-action="close-gate">Cancel</button></div></form>`);
}
function editChild(id) {
  const c=state.children.find(c=>c.id===id);if(!teacherOpen||!c)return;
  modal(`<h2 id="gate-title">Edit explorer</h2><form id="child-edit" data-child-id="${e(id)}"><label>Display name<input name="name" value="${e(c.name)}" maxlength="32" required autocomplete="off"></label><label>Picture<select name="avatar">${M.AVATARS.map(a=>`<option ${a===c.avatar?'selected':''}>${a}</option>`).join('')}</select></label><div class="form-actions"><button class="primary">Save</button><button type="button" data-action="close-gate">Cancel</button></div></form>`);
}
function exportCSV() {
  if(!teacherOpen)return;
  const url=URL.createObjectURL(new Blob([M.csv(state)],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='ready-set-abc-progress-'+new Date().toISOString().slice(0,10)+'.csv';a.hidden=true;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);caption('Progress CSV exported.');
}
function armTeacherLock() {
  clearTimeout(teacherTimer);
  if(teacherOpen)teacherTimer=setTimeout(()=>{teacherOpen=false;closeGate();go('home');},5*60*1000);
}
function routeAction(b) {
  if(b.dataset.route) { go(b.dataset.route,{prompt:true});return; }
  if(b.dataset.letter) { start(b.dataset.letter,session()?.letter===b.dataset.letter);return; }
  if(b.dataset.child) {
    if(!state.children.some(c=>c.id===b.dataset.child))return;
    state.active=b.dataset.child;current=null;save();go('home',{prompt:true});return;
  }
  if(b.dataset.word) { const l=byLetter[b.dataset.word];speak([l.wordAudio,l.name],l.word);return; }
  if(b.dataset.outfit) {
    const o=D.outfits.find(o=>o.id===b.dataset.outfit);
    if(!o||M.stars(kid())<o.stars){caption('★ '+(o?.stars||0)+' stickers');return;}
    kid().outfit=o.id;save();go('closet');chime();return;
  }
  if(b.dataset.listen) {
    if(screen!=='listen')return;
    const kind=b.dataset.listen,p=M.progress(kid(),current.upper);
    if(kind==='name'){session().heardName=true;p.nameListens++;}else{session().heardSound=true;p.soundListens++;}
    p.lastPlayed=new Date().toISOString();save();
    b.classList.add('heard');if(!b.querySelector('.heard-check'))b.insertAdjacentHTML('beforeend','<span class="heard-check" aria-hidden="true">✓</span>');
    $('[data-action="advance"]').disabled=!(session().heardName&&session().heardSound);
    speak([current[kind]],kind==='name'?current.upper:D.voiceText[current.sound]);return;
  }
  if(b.dataset.answer){answer(b);return;}
  if(b.dataset.tab&&teacherOpen){teacherTab=b.dataset.tab;go('teacher');return;}
  if(b.dataset.move&&teacherOpen){
    const order=state.settings.order,i=order.indexOf(b.dataset.move),j=i+Number(b.dataset.direction);
    if(j<0||j>=26)return;[order[i],order[j]]=[order[j],order[i]];refreshTeacher();
    document.querySelector(`[data-move="${b.dataset.move}"][data-direction="${b.dataset.direction}"]`)?.focus();return;
  }
  if(b.dataset.resetChild&&teacherOpen){confirmReset(b.dataset.resetChild);return;}
  if(b.dataset.deleteChild&&teacherOpen){if(state.children.length>1)confirmReset(b.dataset.deleteChild,true);return;}
  if(b.dataset.editChild&&teacherOpen){editChild(b.dataset.editChild);return;}
  const action=b.dataset.action;
  if(action==='close-gate'){closeGate();return;}
  if(action==='play'){
    const s=session();const next=s&&state.settings.unlocked.includes(s.letter)?s.letter:M.nextLetter(state);
    if(next)start(next,s?.letter===next);else go('map',{prompt:true});
  }
  if(action==='next-letter'){const l=M.nextLetter(state);if(l)start(l);else go('map',{prompt:true});}
  if(action==='advance')advance();
  if(action==='instruction')instruction();
  if(action==='sound')speak([current.sound]);
  if(action==='bonus-replay')speak([session().bonusRound===0?current.name:current.sound]);
  if(action==='mute'){state.settings.muted=!state.settings.muted;stopVoice();hush();save();go(screen,{focus:false});caption(state.settings.muted?'Sound off. Follow the pictures.':'Sound on.');}
  if(action==='theme'){state.settings.theme=state.settings.theme==='post'?'moon':'post';save();go(screen,{focus:false});}
  if(action==='dark'){state.settings.dark=document.body.dataset.dark==='true'?'light':'dark';save();go(screen,{focus:false});}
  if(action==='teacher')openGate();
  if(!teacherOpen)return;
  if(action==='export')exportCSV();
  if(action==='reset-all')confirmReset();
  if(action==='unlock-all'){state.settings.unlocked=[...M.ALPHABET];refreshTeacher();}
  if(action==='starter-set'){state.settings.unlocked=state.settings.order.slice(0,6);invalidateLockedSessions();refreshTeacher();}
  if(action==='alphabet-order'){state.settings.order=[...M.ALPHABET];refreshTeacher();}
  if(action==='sound-order'){state.settings.order=M.defaults().order;refreshTeacher();}
  if(action==='cache-retry')registerOffline(true);
}
function invalidateLockedSessions() {
  for(const c of state.children)if(c.session&&!state.settings.unlocked.includes(c.session.letter))c.session=null;
}
document.addEventListener('click',ev=>{
  const b=ev.target.closest('button');if(!b||b.disabled)return;
  if(b.getAttribute('aria-disabled')==='true'){
    if(b.dataset.letter)line('locked');else if(b.dataset.outfit)caption('★ '+D.outfits.find(o=>o.id===b.dataset.outfit).stars+' stickers');return;
  }
  if(teacherOpen)armTeacherLock();routeAction(b);
});
document.addEventListener('change',ev=>{
  if(!teacherOpen||screen!=='teacher')return;
  armTeacherLock();const t=ev.target;
  if(t.id==='progress-child'){teacherChild=t.value;go('teacher',{focus:false});}
  if(t.dataset.setting){
    const k=t.dataset.setting;
    if(!['theme','dark','muted','effects','motion','autoUnlock'].includes(k))return;
    state.settings[k]=t.type==='checkbox'?t.checked:t.value;stopVoice();hush();clearEffects();save();applySettings();shell();
  }
  if(t.dataset.unlock){
    const l=t.dataset.unlock;state.settings.unlocked=state.settings.unlocked.filter(v=>v!==l);
    if(t.checked)state.settings.unlocked.push(l);invalidateLockedSessions();save();
  }
});
document.addEventListener('submit',ev=>{
  const f=ev.target;if(!(f instanceof HTMLFormElement))return;ev.preventDefault();
  const form=new FormData(f);
  if(f.id==='pin-gate'){
    if(String(form.get('pin'))!==state.settings.pin){gateFailures++;$('#gate-error').textContent='That PIN didn’t match. Please try again.';f.elements.pin.value='';f.elements.pin.focus();return;}
    gateFailures=0;teacherOpen=true;armTeacherLock();closeGate();go('teacher');return;
  }
  if(!teacherOpen)return;armTeacherLock();
  if(f.id==='child-add'){
    const name=String(form.get('name')).trim();
    if(!name||state.children.length>=24){$('#child-error').textContent='Enter a name. Up to 24 explorers can play.';return;}
    const id='child-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
    state.children.push(M.newChild(id,name.slice(0,32),String(form.get('avatar'))));refreshTeacher();
  }
  if(f.id==='child-edit'){
    const c=state.children.find(c=>c.id===f.dataset.childId),name=String(form.get('name')).trim();
    if(!c||!name)return;c.name=name.slice(0,32);c.avatar=String(form.get('avatar'));closeGate();refreshTeacher();
  }
  if(f.id==='pin-change'){
    const pin=String(form.get('pin'));
    if(String(form.get('current'))!==state.settings.pin){$('#pin-message').textContent='Current PIN did not match.';return;}
    if(!/^\d{4,8}$/.test(pin)||pin!==String(form.get('repeat'))){$('#pin-message').textContent='Enter the same 4–8 numbers in both new PIN fields.';return;}
    state.settings.pin=pin;save();f.reset();$('#pin-message').textContent='PIN saved.';
  }
  if(f.id==='reset-confirm'){
    if(form.get('confirm')!=='RESET')return;
    const id=f.dataset.childId;
    if(id){
      if(f.dataset.remove==='true'){
        if(state.children.length<2)return;state.children=state.children.filter(c=>c.id!==id);
        if(state.active===id)state.active=state.children[0].id;
      }else{const c=state.children.find(c=>c.id===id);if(c){c.progress={};c.session=null;c.outfit='default';}}
      current=null;closeGate();refreshTeacher();
    }else{state=M.fresh();teacherOpen=false;clearTimeout(teacherTimer);current=null;save();closeGate();go('home');}
  }
});
gate.addEventListener('close',()=>{gate.innerHTML='';});
main.addEventListener('keydown',ev=>{
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(ev.key))return;
  const group=ev.target.closest('.choices,.map-grid,.profiles,.outfits,.stickers-grid');if(!group)return;
  const all=[...group.querySelectorAll('button:not(:disabled):not([aria-disabled="true"])')],i=all.indexOf(ev.target);if(i<0)return;
  ev.preventDefault();all[(i+(['ArrowLeft','ArrowUp'].includes(ev.key)?-1:1)+all.length)%all.length].focus();
});
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&!gate.open&&screen!=='home')go('home');});
document.addEventListener('error',ev=>{
  if(!(ev.target instanceof HTMLImageElement))return;
  const img=ev.target,alt=document.createElement('span');alt.className='image-fallback';alt.textContent=img.alt||'★';alt.setAttribute('role','img');alt.setAttribute('aria-label',img.alt);img.replaceWith(alt);
},true);
reduce.addEventListener('change',()=>{clearEffects();applySettings();});
dark.addEventListener('change',applySettings);
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){stopVoice();hush();clearEffects();if(teacherOpen){teacherOpen=false;clearTimeout(teacherTimer);closeGate();go('home');}}
});
window.addEventListener('pagehide',()=>{stopVoice();hush();clearEffects();save();});
async function registerOffline(force=false) {
  const status=$('#offline-status');
  if(!('serviceWorker' in navigator)||location.protocol==='file:'){status.textContent='Local play · serve on localhost to install offline';return;}
  status.textContent='Saving for offline play…';
  try{
    const registration=await navigator.serviceWorker.register('sw.js',{scope:'./'});
    if(force)await registration.update();
    await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Offline install timed out')),15000))]);
    const worker=registration.active||navigator.serviceWorker.controller;
    if(worker){
      const channel=new MessageChannel();
      channel.port1.onmessage=ev=>{if(ev.data.type==='CACHE_STATUS')status.textContent=ev.data.ready?'Offline ready · all available files saved':'Offline files incomplete · refresh in teacher settings';};
      worker.postMessage({type:force?'REFRESH_CACHE':'CACHE_STATUS'},[channel.port2]);
    }
  }catch{status.textContent='Offline setup unavailable · play is ready';}
}
invalidateLockedSessions();go('home',{focus:false});registerOffline();
})();

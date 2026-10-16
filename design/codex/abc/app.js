(() => {
'use strict';
const D=window.SoundGarden,M=window.GameModel;
const $=s=>document.querySelector(s),main=$('#main'),gate=$('#gate');
const KEY='ready-set-abc-sound-garden-v1';
const reduce=matchMedia('(prefers-reduced-motion: reduce)'),dark=matchMedia('(prefers-color-scheme: dark)');
const byLetter=Object.fromEntries(D.letters.map(l=>[l.upper,l]));
let state,storageOK=true,screen='home',teacherTab='progress',teacherChild='';
let current=null,choices=[],solved=false,misses=0,tried=new Set(),teacherOpen=false,bonusCueShown=false;
let voiceEpoch=0,player=null,finishClip=null,voiceTimer=0,captionTimer=0,teacherTimer=0,gateFailures=0;
let oscillator=null,context=null,effectTimer=0;
const missingAudio=new Set(),missingImages=new Set();
try{state=M.clean(JSON.parse(localStorage.getItem(KEY)));}catch{state=M.fresh();storageOK=false;}
const kid=()=>M.child(state),session=()=>kid().session;
const e=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={
 paw:'<ellipse cx="12" cy="16" rx="6" ry="5"/><ellipse cx="4" cy="8" rx="2" ry="3"/><ellipse cx="9" cy="4" rx="2" ry="3"/><ellipse cx="16" cy="4" rx="2" ry="3"/><ellipse cx="21" cy="9" rx="2" ry="3"/>',
 home:'<path d="m3 11 9-8 9 8M6 9v12h12V9m-8 12v-7h4v7"/>',
 leaf:'<path d="M4 20Q1 3 21 3q1 18-17 17Zm-1 2L16 9m-7 7-1-5m5 1 5 1"/>',
 map:'<path d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z"/>',
 sound:'<path d="M3 9v6h5l5 4V5L8 9zm13-2q7 5 0 10m3-13q10 8 0 16"/>',
 mute:'<path d="M3 9v6h5l5 4V5L8 9zm14 0 5 6m0-6-5 6"/>',
 moon:'<path d="M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
 lock:'<rect x="5" y="10" width="14" height="12" rx="3"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v3"/>',
 key:'<circle cx="8" cy="8" r="5"/><path d="m12 12 9 9m-5-5 3-3m-1 5 3-3"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',back:'<path d="M20 12H4m6-6-6 6 6 6"/>',
 check:'<path d="m4 12 5 6L21 5"/>',star:'<path d="m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>'
};
const ico=id=>`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[id]||icons.star}</svg>`;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}updateStorageNotice();}
function updateStorageNotice(){const old=$('.storage-banner');if(storageOK)old?.remove();else if(!old){const p=document.createElement('p');p.className='storage-banner';p.setAttribute('role','status');p.textContent='Progress lasts for this visit only. Device storage is unavailable.';main.prepend(p);}}
function applySettings(){
 document.body.dataset.theme=state.settings.theme;
 document.body.dataset.dark=String(state.settings.dark==='dark'||(state.settings.dark==='system'&&dark.matches));
 document.body.dataset.motion=state.settings.motion&&!reduce.matches?'on':'off';
 document.querySelector('meta[name="theme-color"]').content=getComputedStyle(document.body).getPropertyValue('--bg').trim();
}
function shell(){
 applySettings();
 $('#header').innerHTML=`<button class="brand" data-route="home" aria-label="Ready Set ABC home"><span class="logo">${ico('paw')}</span><span>ready set abc<small>Little letters. Lovely sounds.</small></span></button><div class="controls"><button class="child-chip" data-route="profiles" aria-label="Choose child, ${e(kid().name)}"><span aria-hidden="true">${kid().avatar}</span><span>${e(kid().name)}</span></button><button data-action="mute" aria-label="${state.settings.muted?'Turn sound on':'Mute sound'}" aria-pressed="${state.settings.muted}">${ico(state.settings.muted?'mute':'sound')}</button><button data-action="dark" aria-label="${document.body.dataset.dark==='true'?'Use light colors':'Use dark colors'}">${ico(document.body.dataset.dark==='true'?'sun':'moon')}</button><button class="teacher-header" data-action="teacher" aria-label="Grown-ups, enter PIN">${ico('key')}</button></div>`;
 $('#kid-nav').hidden=screen==='teacher';
 $('#kid-nav').innerHTML=[['home','home','Play'],['garden','leaf','My garden'],['map','map','Letters']].map(([route,icon,label])=>`<button data-route="${route}" ${screen===route?'aria-current="page"':''}>${ico(icon)}<span>${label}</span></button>`).join('');
}
function stopVoice(){voiceEpoch++;clearTimeout(voiceTimer);if(player){player.pause();player.onended=null;player.onerror=null;player=null;}if(finishClip){finishClip(false);finishClip=null;}document.body.classList.remove('speaking');}
function caption(text){clearTimeout(captionTimer);$('#spoken').textContent=text;captionTimer=setTimeout(()=>{$('#spoken').textContent='';},5000);}
function revealCue(){if(screen==='bonus'&&$('.mystery-cue')){bonusCueShown=true;$('.mystery-cue').hidden=false;}}
async function speak(files,text=''){
 stopVoice();hush();const mine=voiceEpoch;if(text)caption(text);
 if(state.settings.muted||document.hidden){revealCue();return;}
 document.body.classList.add('speaking');
 for(const file of files.filter(Boolean)){
  if(mine!==voiceEpoch)return;
  if(missingAudio.has(file)){revealCue();continue;}
  await new Promise(resolve=>{
   const a=new Audio(file);player=a;let finished=false;
   const done=ok=>{if(finished)return;finished=true;clearTimeout(voiceTimer);a.onended=null;a.onerror=null;if(finishClip===done)finishClip=null;if(!ok){a.pause();revealCue();}resolve(ok);};
   finishClip=done;a.onended=()=>done(true);a.onerror=()=>{missingAudio.add(file);done(false);};voiceTimer=setTimeout(()=>done(false),12000);a.play().catch(()=>done(false));
  });
 }
 if(mine===voiceEpoch){player=null;document.body.classList.remove('speaking');}
}
function line(id,after=[],text=''){return speak([D.lines[id],...after],text);}
function hush(){if(oscillator){try{oscillator.stop();}catch{}oscillator=null;}}
function chime(){
 if(state.settings.muted||!state.settings.effects||document.hidden||player)return;
 try{context||=new(window.AudioContext||window.webkitAudioContext)();context.resume().catch(()=>{});hush();const o=context.createOscillator(),g=context.createGain(),t=context.currentTime;oscillator=o;o.type='sine';o.frequency.setValueAtTime(523,t);o.frequency.setValueAtTime(659,t+.12);g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(.035,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+.32);o.connect(g);g.connect(context.destination);o.start();o.stop(t+.33);o.onended=()=>{o.disconnect();g.disconnect();if(oscillator===o)oscillator=null;};}catch{}
}
function clearEffects(){clearTimeout(effectTimer);$('#effects').replaceChildren();}
function rewardEffect(){clearEffects();if(reduce.matches||!state.settings.motion||document.hidden)return;for(let i=0;i<10;i++){const s=document.createElement('span');s.className='spark';s.textContent=i%2?'✦':'●';s.style.setProperty('--x',Math.cos(i*Math.PI/5)*230+'px');s.style.setProperty('--y',Math.sin(i*Math.PI/5)*180+'px');$('#effects').append(s);}effectTimer=setTimeout(clearEffects,1000);}
function lucy(pose){const file=D.lucy[pose];return `<div class="lucy"><div class="lucy-fallback"><span class="paw-badge">${ico('paw')}</span><b>Lucy</b><small>Your sound garden friend</small></div>${missingImages.has(file)?'':`<img src="${file}" alt="Lucy ${pose==='cheer'?'celebrating':pose==='guide'?'listening in her teaching glasses':'welcoming you to her garden'}">`}</div>`;}
function flower(letter){return `<span class="flower" aria-hidden="true"><span class="petals"></span><b>${letter.toLowerCase()}</b></span>`;}
function home(){
 const s=session(),next=s&&state.settings.unlocked.includes(s.letter)?s.letter:M.nextLetter(state);
 return `<section class="screen"><div class="hero"><div class="hero-copy"><span class="tag">A little play. A lot of growing.</span><h1>Lucy’s<br> <em>Sound Garden.</em></h1><p class="intro">Hear a little sound.<br>Grow something wonderful.</p><button class="primary launch" data-action="play"><span class="play-disc" aria-hidden="true">▶</span><span>${s?'Keep growing':'Let’s play'}<small>${next?`${next} ${next.toLowerCase()} · a little sound adventure`:'Choose a letter together'}</small></span>${ico('arrow')}</button><p class="hero-note">${ico('leaf')} ${M.stars(kid())?`${M.stars(kid())} flowers in ${e(kid().name)}’s garden`:'One happy discovery at a time'}</p></div><div class="scene"><span class="bubble">Come grow with me!</span>${lucy('welcome')}<span class="floating-letter" aria-hidden="true">${next||'S'}</span><span class="floating-letter right" aria-hidden="true">${(next||'S').toLowerCase()}</span><span class="scene-label">LUCY’S LITTLE PATCH</span></div></div><div class="journey" aria-label="Hear it, find it, grow it"><div class="journey-item"><span class="journey-icon" aria-hidden="true">S s</span><div><h3>1. Hear it</h3><p>A name and a sound</p></div></div><div class="journey-item"><span class="journey-icon"><img src="art/sun.svg" alt=""></span><div><h3>2. Find it</h3><p>A matching sound friend</p></div></div><div class="journey-item"><span class="journey-icon">${ico('leaf')}</span><div><h3>3. Grow it</h3><p>A flower just for you</p></div></div></div></section>`;
}
function map(){return `<section class="screen"><div class="screen-heading"><div><p class="eyebrow">Pick a little adventure</p><h1>A garden of sounds</h1></div><span class="counter">${M.stars(kid())} / 26 ${ico('leaf')}</span></div><div class="map-grid">${state.settings.order.map(l=>{const locked=!state.settings.unlocked.includes(l),done=kid().progress[l]?.completions;return `<button class="letter-tile ${locked?'locked':''}" data-letter="${l}" aria-label="${l}, ${locked?'locked, ask a grown-up':done?'flower grown, play again':'ready to play'}" ${locked?'aria-disabled="true"':''}>${l}<small>${l.toLowerCase()}</small>${done?'<span class="seal" aria-hidden="true">✿</span>':''}${locked?`<span class="lock">${ico('lock')}</span>`:''}</button>`;}).join('')}</div></section>`;}
function garden(){return `<section class="screen"><div class="screen-heading"><div><p class="eyebrow">Look what you grew, ${e(kid().name)}</p><h1>My sound garden</h1></div><span class="counter">${M.stars(kid())} ${ico('leaf')}</span></div><p class="garden-intro">${ico('sound')} ${M.stars(kid())?'Tap a flower to hear its sound again.':'Your first flower is waiting to grow. Let’s play!'} </p>${!M.stars(kid())?'<div class="next-row"><button class="primary" data-action="play">Grow my first flower '+ico('arrow')+'</button></div>':''}<div class="flower-grid">${state.settings.order.map(l=>kid().progress[l]?.completions?`<button class="flower-tile" data-flower="${l}" aria-label="Hear ${l} and ${byLetter[l].word}">${flower(l)}<small>${byLetter[l].word}</small></button>`:`<button class="flower-tile empty-flower" data-letter="${l}" ${state.settings.unlocked.includes(l)?'':'aria-disabled="true"'} aria-label="${l}, ${state.settings.unlocked.includes(l)?'grow this flower':'locked'}"><span class="seed" aria-hidden="true"></span><span>${l.toLowerCase()}</span></button>`).join('')}</div></section>`;}
function profiles(){return `<section class="screen"><div class="screen-heading"><div><p class="eyebrow">A little garden of your own</p><h1>Who’s growing today?</h1></div></div><div class="profiles">${state.children.map(c=>`<button class="profile" data-child="${e(c.id)}" aria-pressed="${state.active===c.id}"><span aria-hidden="true">${c.avatar}</span><strong>${e(c.name)}</strong></button>`).join('')}</div><p class="notice">Grown-ups can add explorers in the teacher room.</p></section>`;}
const stageIndex={listen:0,case:1,picture:2,bonus:3};
function stepbar(){return `<div class="stepbar"><button data-route="home" aria-label="Back home, save this adventure">${ico('back')} Back to garden</button><div class="steps" aria-label="Step ${stageIndex[screen]+1} of 4">${[0,1,2,3].map(i=>`<span class="${i<stageIndex[screen]?'done':i===stageIndex[screen]?'active':''}"></span>`).join('')}</div><span class="step-title">${current.upper} ${current.lower} · ${['Meet','Pair','Find','Plant'][stageIndex[screen]]}</span></div>`;}
function activity(title,description,body){return `<section class="screen">${stepbar()}<div class="activity-grid"><aside class="guide"><div><p class="eyebrow">Lucy says…</p><h1>${title}</h1><p>${description}</p></div>${lucy('guide')}</aside><div class="work">${body}</div></div></section>`;}
function nextButton(){return `<div class="next-row"><button class="primary" data-action="advance" ${solved?'':'hidden'}>${screen==='bonus'?'Plant my flower':'Keep growing'} ${ico(screen==='bonus'?'leaf':'arrow')}</button></div>`;}
function listen(){const s=session();return activity('Meet a little sound','Tap each card. Hear the difference.',`<div class="listen-pair"><button class="listen-button ${s.heardName?'heard':''}" data-listen="name" aria-label="Hear letter ${current.upper} name"><span class="glyph">${current.upper}</span><small>${ico('sound')} Letter name</small>${s.heardName?'<span class="heard-check">✓</span>':''}</button><button class="listen-button ${s.heardSound?'heard':''}" data-listen="sound" aria-label="Hear letter ${current.upper} sound"><span class="glyph">${current.lower}</span><small>${ico('sound')} Letter sound</small>${s.heardSound?'<span class="heard-check">✓</span>':''}</button></div><p class="activity-caption">Big ${current.upper} and little ${current.lower} share a sound.</p><div class="next-row"><button class="primary" data-action="advance" ${s.heardName&&s.heardSound?'':'disabled'}>Let’s find it ${ico('arrow')}</button></div>`);}
function answerCards(kind){return `<div class="choices" style="--count:${choices.length}">${choices.map(l=>`<button class="choice ${solved&&l===current?'correct':''} ${tried.has(l.upper)?'tried':''} ${misses>=2&&l===current&&!solved?'hint':''}" data-answer="${l.upper}" ${solved?'aria-disabled="true"':''} aria-label="${kind==='picture'?l.word:kind==='case'?'little '+l.lower:l.upper}">${kind==='picture'?`<img src="${l.image}" alt=""><span class="word">${l.word}</span>`:`<span class="glyph">${kind==='case'?l.lower:l.upper}</span>`}</button>`).join('')}</div>`;}
function feedback(){return `<p class="feedback" role="status">${solved?'✓ You found it!':misses>=2?'Try the sunny card.':misses?'Let’s try another one.':'Take your time.'}</p>`;}
function caseMatch(){return activity('Who’s my little letter?','Big and little. A happy pair.',`<div class="cue"><button class="target" data-action="replay-name" aria-label="Hear ${current.upper}">${current.upper}</button></div>${answerCards('case')}${feedback()}${nextButton()}`);}
function pictureMatch(){return activity('Find a sound friend',current.upper==='X'?'Listen for the sound at the end.':'Which picture starts with this sound?',`<div class="cue"><span class="target">${current.upper}${current.lower}</span><button class="replay" data-action="instruction">${ico('sound')} Hear sound</button></div>${answerCards('picture')}${feedback()}${nextButton()}`);}
function bonus(){return activity('One sound to grow','Listen. Which letter did you hear?',`<div class="cue"><button class="replay" data-action="instruction">${ico('sound')} Hear again</button><span class="mystery-cue" ${state.settings.muted||bonusCueShown?'':'hidden'} aria-label="Visual sound clue">${current.upper}${current.lower}</span></div>${answerCards('bonus')}${feedback()}${nextButton()}`);}
function celebrate(){return `<section class="screen"><div class="celebrate-grid"><div class="scene celebrate-scene"><span class="bubble">Look what you grew!</span>${lucy('cheer')}<span class="scene-label">A HAPPY LITTLE DISCOVERY</span></div><div class="celebrate-copy"><p class="eyebrow">A new sound in your garden</p><h1>Hip, hip, hooray!</h1><p>${flower(current.upper)} ${current.upper} ${current.lower} · ${current.word}<br>${M.stars(kid())} lovely ${M.stars(kid())===1?'flower':'flowers'} and growing.</p><div class="finish-actions"><button class="primary" data-action="next-letter">Grow another ${ico('arrow')}</button><button class="secondary" data-route="garden">${ico('leaf')} My garden</button></div></div></div></section>`;}
function choose(){choices=D.options(current,M.stars(kid())>=6?3:2);solved=false;misses=0;tried=new Set();bonusCueShown=false;}
function go(route,{prompt=false,focus=true}={}){
 if(route==='teacher'&&!teacherOpen){openGate();return;}
 if(['listen','case','picture','bonus'].includes(route)&&(!current||!session()))route='home';
 if(screen==='teacher'&&route!=='teacher'){teacherOpen=false;clearTimeout(teacherTimer);}
 stopVoice();hush();clearEffects();clearTimeout(captionTimer);$('#spoken').textContent='';screen=route;shell();
 main.innerHTML=({home,map,garden,profiles,listen,case:caseMatch,picture:pictureMatch,bonus,celebrate,teacher}[screen]||home)();document.body.dataset.screen=screen;updateStorageNotice();
 if(focus){main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
 if(screen==='celebrate')rewardEffect();if(prompt)instruction();
}
function start(letter,resume=false){if(!byLetter[letter]||!state.settings.unlocked.includes(letter)){line('locked',[],'Ask your grown-up to open this letter.');return;}current=byLetter[letter];if(!resume||session()?.letter!==letter)kid().session={letter,stage:'listen',caseRound:0,bonusRound:0,heardName:false,heardSound:false};choose();save();go(session().stage,{prompt:true});}
function instruction(){
 if(screen==='home')line('welcome-garden',[],'Come grow a sound with me!');
 if(screen==='listen')line('meet',[],'Tap to hear the letter’s name. Tap to hear its sound.');
 if(screen==='case')line('case-lower',[current.name],'Find the matching little letter.');
 if(screen==='picture')line(current.upper==='X'?'picture-x':'picture',[current.sound],current.upper==='X'?'Listen for this sound at the end.':'Which picture starts with this sound?');
 if(screen==='bonus')line('bonus-sound',[current.sound],'Listen. Find this sound.');
 if(screen==='celebrate')line('plant',[current.wordAudio],'You did it! Let’s plant your flower!');
 if(screen==='garden')line('garden',[],'Tap a flower to hear its sound again.');
 if(screen==='profiles')line('profiles',[],'Tap your picture.');
}
function advance(){const s=session();if(!s)return;if(screen==='listen'){if(!s.heardName||!s.heardSound)return;s.stage='case';}else{if(!solved)return;if(screen==='case')s.stage='picture';else if(screen==='picture')s.stage='bonus';else if(screen==='bonus'){M.complete(state,current.upper);save();go('celebrate',{prompt:true});return;}}choose();save();go(s.stage,{prompt:true});}
function answer(b){
 if(solved||!['case','picture','bonus'].includes(screen)||!choices.some(l=>l.upper===b.dataset.answer))return;
 const selected=byLetter[b.dataset.answer],correct=selected===current;M.answer(kid(),current.upper,screen,correct);save();
 if(correct){solved=true;b.classList.add('correct');document.querySelectorAll('[data-answer]').forEach(x=>x.setAttribute('aria-disabled','true'));$('.feedback').textContent='✓ You found it!';$('[data-action="advance"]').hidden=false;line('cheer-1',[screen==='picture'?current.wordAudio:current.sound],'You found it!');}
 else{misses++;tried.add(selected.upper);b.classList.add('tried');$('.feedback').textContent=misses>=2?'Try the sunny card.':'Let’s try another one.';if(misses>=2){$(`[data-answer="${current.upper}"]`).classList.add('hint');M.progress(kid(),current.upper).hints++;save();line('hint',[],'Try the glowing card.');}else line('again',[],'Let’s try another one.');}
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

function invalidateLockedSessions(){for(const c of state.children)if(c.session&&!state.settings.unlocked.includes(c.session.letter))c.session=null;}
function routeAction(b){
 if(b.dataset.route){go(b.dataset.route,{prompt:true});return;}
 if(b.dataset.letter){start(b.dataset.letter,session()?.letter===b.dataset.letter);return;}
 if(b.dataset.answer){answer(b);return;}
 if(b.dataset.flower){const l=byLetter[b.dataset.flower];speak([l.sound,l.wordAudio],l.upper+' · '+l.word);return;}
 if(b.dataset.child){if(!state.children.some(c=>c.id===b.dataset.child))return;state.active=b.dataset.child;current=null;save();go('home',{prompt:true});return;}
 if(b.dataset.listen){if(screen!=='listen')return;const k=b.dataset.listen,p=M.progress(kid(),current.upper);if(k==='name'){session().heardName=true;p.nameListens++;}else{session().heardSound=true;p.soundListens++;}p.lastPlayed=new Date().toISOString();save();go('listen',{focus:false});speak([current[k]],k==='name'?'Letter name: '+current.upper:'The sound of '+current.upper);$(`[data-listen="${k}"]`)?.focus();return;}
 if(b.dataset.tab&&teacherOpen){teacherTab=b.dataset.tab;go('teacher');return;}
 if(b.dataset.resetChild&&teacherOpen){confirmReset(b.dataset.resetChild);return;}
 if(b.dataset.deleteChild&&teacherOpen){confirmReset(b.dataset.deleteChild,true);return;}
 if(b.dataset.editChild&&teacherOpen){editChild(b.dataset.editChild);return;}
 if(b.dataset.move&&teacherOpen){const i=state.settings.order.indexOf(b.dataset.move),j=i+Number(b.dataset.direction);if(i>=0&&j>=0&&j<26){[state.settings.order[i],state.settings.order[j]]=[state.settings.order[j],state.settings.order[i]];refreshTeacher();}return;}
 const action=b.dataset.action;
 if(action==='close-gate'){closeGate();return;}
 if(action==='play'){const s=session(),next=s&&state.settings.unlocked.includes(s.letter)?s.letter:M.nextLetter(state);if(next)start(next,s?.letter===next);else go('map');}
 if(action==='next-letter'){const l=M.nextLetter(state);if(l)start(l);else go('map');}
 if(action==='advance')advance();
 if(action==='instruction')instruction();
 if(action==='replay-name')speak([current.name],current.upper);
 if(action==='mute'){state.settings.muted=!state.settings.muted;if(state.settings.muted)revealCue();stopVoice();hush();save();go(screen,{focus:false});caption(state.settings.muted?'Sound off. Follow the pictures.':'Sound on.');}
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
 const group=ev.target.closest('.choices,.map-grid,.profiles,.flower-grid');if(!group)return;
 const all=[...group.querySelectorAll('button:not(:disabled):not([aria-disabled="true"])')],i=all.indexOf(ev.target);if(i<0)return;
 ev.preventDefault();all[(i+(['ArrowLeft','ArrowUp'].includes(ev.key)?-1:1)+all.length)%all.length].focus();
});
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&!gate.open&&screen!=='home')go('home');});
document.addEventListener('load',ev=>{if(ev.target instanceof HTMLImageElement){const fallback=ev.target.closest('.lucy')?.querySelector('.lucy-fallback');if(fallback)fallback.hidden=true;}},true);
document.addEventListener('error',ev=>{if(!(ev.target instanceof HTMLImageElement))return;const img=ev.target;missingImages.add(img.getAttribute('src'));img.hidden=true;},true);
reduce.addEventListener('change',()=>{clearEffects();applySettings();});dark.addEventListener('change',shell);
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopVoice();hush();clearEffects();if(teacherOpen){teacherOpen=false;clearTimeout(teacherTimer);closeGate();go('home');}}});
window.addEventListener('pagehide',()=>{stopVoice();hush();clearEffects();save();});
async function registerOffline(force=false){
 const status=$('#offline-status');
 if(!('serviceWorker'in navigator)||location.protocol==='file:'){status.textContent='Local play · serve on localhost to save offline';return;}
 status.textContent='Saving your garden for offline play…';
 try{
  const registration=await navigator.serviceWorker.register('sw.js',{scope:'./'});if(force)await registration.update();
  await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('Install timed out')),15000))]);
  const worker=registration.active||navigator.serviceWorker.controller;if(!worker)return;
  const channel=new MessageChannel();channel.port1.onmessage=ev=>{if(ev.data.type==='CACHE_STATUS')status.textContent=ev.data.ready?'Offline garden ready':'Offline files incomplete · refresh in teacher settings';};
  worker.postMessage({type:force?'REFRESH_CACHE':'CACHE_STATUS'},[channel.port2]);
 }catch{status.textContent='Play is ready · offline saving unavailable';}
}
invalidateLockedSessions();go('home',{focus:false});registerOffline();
})();

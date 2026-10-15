import {chromium} from 'playwright';import fs from 'node:fs/promises';import path from 'node:path';
process.env.TMPDIR=path.resolve('out/_qa/tmp');const b=await chromium.launch({headless:true,args:['--no-sandbox']});const reports=[];
const assert=(v,m)=>{if(!v)throw Error(m);};
const idle=async p=>p.waitForFunction(()=>!document.querySelector('.choice[aria-disabled]'));
const finishEffects=async p=>p.waitForFunction(()=>window.Fun.evidence.active===0&&!document.body.dataset.effect);
try{for(const dir of ['v1-letter-post','v3-moonboat']){
 const ctx=await b.newContext({viewport:{width:1366,height:768}}),p=await ctx.newPage();const errors=[],remote=[],consoleErrors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});p.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url())});
 await p.addInitScript(()=>{
  window.audioEvents=[];const Base=window.Audio;window.Audio=class extends Base{constructor(src){super(src);this.addEventListener('playing',()=>audioEvents.push({type:'voice',src:this.src,sources:window.Fun.evidence.sources}));this.addEventListener('ended',()=>audioEvents.push({type:'voice-ended',src:this.src}));}};
  const AC=window.AudioContext||window.webkitAudioContext;
  for(const method of ['createOscillator','createBufferSource']){const original=AC.prototype[method];AC.prototype[method]=function(...args){const node=original.apply(this,args),start=node.start.bind(node);node.start=(...a)=>{audioEvents.push({type:'sfx',muted:window.Fun.evidence.muted,speaking:window.Fun.evidence.speaking});return start(...a);};return node;};}
  window.effectSamples=[];window.particleSamples=[];
  function sample(){effectSamples.push(document.getAnimations().filter(a=>a.playState==='running').length);particleSamples.push(document.querySelectorAll('[data-particle]').length);requestAnimationFrame(sample)}requestAnimationFrame(sample);
 });
 await p.goto('file://'+path.resolve('out',dir,'index.html'));await finishEffects(p);
 assert(await p.locator('[data-letter]').count()===6,'All letters available');
 // Lazy WebAudio stays locked on load; the first real interaction unlocks it.
 assert((await p.evaluate(()=>audioEvents.filter(x=>x.type==='sfx').length))===0,'No autoplay SFX');
 await p.locator('[data-letter="S"]').click();await p.waitForFunction(()=>audioEvents.filter(x=>x.type==='voice-ended').length>=2);
 assert(await p.evaluate(()=>audioEvents.some(x=>x.type==='sfx')),'Synthesized cue exercised');
 assert(await p.evaluate(()=>audioEvents.filter(x=>x.type==='voice').every(x=>x.sources===0)),'SFX fully stopped before voice');
 // Replay with real voice active: two simultaneous replays leave only one voice sequence.
 await p.locator('[data-action="replay"]').click();await p.locator('[data-action="replay"]').click();await p.keyboard.press('Escape');await finishEffects(p);
 const voiceBefore=await p.evaluate(()=>audioEvents.filter(x=>x.type==='voice').length);await p.waitForTimeout(600);
 assert((await p.evaluate(()=>audioEvents.filter(x=>x.type==='voice').length))===voiceBefore,'No stale replay on home');
 // Muted flow includes actual WebAudio instrumentation, not just visible icon state.
 await p.locator('#mute').click();const sfxBefore=await p.evaluate(()=>audioEvents.filter(x=>x.type==='sfx').length), voicesBefore=await p.evaluate(()=>audioEvents.filter(x=>x.type==='voice').length);
 await p.locator('[data-letter="S"]').click();await p.locator('[data-action="match"]').click();await p.waitForSelector('.choices');
 // A burst in the same task must count as one miss and leave a correct answer usable.
 await p.locator('.choice:not([data-answer="S"])').first().evaluate(el=>{for(let i=0;i<12;i++)el.click()});await idle(p);
 assert(await p.locator('.choice.hint').count()===0,'Rapid miss counts once');
 await p.locator('.choice:not([data-answer="S"])').first().click();await idle(p);assert(await p.locator('.choice.hint').getAttribute('data-answer')==='S','Second miss reveals helpful hint');
 await p.locator('[data-answer="S"]').evaluate(el=>{for(let i=0;i<12;i++)el.click()});await p.waitForSelector('.celebration');await finishEffects(p);
 assert(await p.locator('.collection-slot.collected').count()===1,'Correct burst earns only one collectible');
 await p.selectOption('#theme','1');await p.waitForTimeout(30);assert(await p.locator('[data-particle]').count()===(dir==='v3-moonboat'?12:6),'Reward plus theme remains within 12');await finishEffects(p);await p.locator('[data-action="reward-replay"]').click();await finishEffects(p);await p.keyboard.press('Escape');
 for(let t=0;t<3;t++){await p.selectOption('#theme',String(t));await p.waitForTimeout(30);const n=await p.locator('[data-particle]').count();assert(n===6,'Theme emits six particles');await p.keyboard.press('Escape');await p.locator('[data-letter="A"]').click();assert(await p.locator('[data-particle]').count()===0,'Navigation removes all particles');await p.keyboard.press('Escape');}
 await finishEffects(p);
 assert((await p.evaluate(()=>audioEvents.filter(x=>x.type==='sfx').length))===sfxBefore,'Mute suppresses oscillator and noise starts');assert((await p.evaluate(()=>audioEvents.filter(x=>x.type==='voice').length))===voicesBefore,'Mute suppresses recorded voice');
 // One finite home idle pauses and resumes while hidden; never free-runs off-tab.
 await p.keyboard.press('Escape');await p.locator('.brand').click();
 await p.evaluate(()=>{window.hiddenForTest=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>hiddenForTest});hiddenForTest=true;document.dispatchEvent(new Event('visibilitychange'))});
 const paused=await p.evaluate(()=>document.getAnimations().map(a=>({state:a.playState,time:a.currentTime})));await p.waitForTimeout(300);const pausedAfter=await p.evaluate(()=>document.getAnimations().map(a=>({state:a.playState,time:a.currentTime})));
 assert(paused.length===1&&paused.every(x=>x.state==='paused'),'Hidden idle pauses');assert(Math.abs(paused[0].time-pausedAfter[0].time)<1,'Hidden idle clock does not advance');await p.evaluate(()=>{hiddenForTest=false;document.dispatchEvent(new Event('visibilitychange'))});await finishEffects(p);
 // Every theme uses the same cap, including interruptions and rapid theme changes.
 await p.selectOption('#theme','1');await p.selectOption('#theme','2');await p.selectOption('#theme','0');await finishEffects(p);
 const evidence=await p.evaluate(()=>({runtime:Fun.evidence,maxRunning:Math.max(...effectSamples),maxParticles:Math.max(...particleSamples),sfxWhileMuted:audioEvents.filter(x=>x.type==='sfx'&&x.muted).length,sfxDuringVoice:audioEvents.filter(x=>x.type==='sfx'&&x.speaking).length}));
 assert(evidence.maxRunning<=1,'Only one main effect runs');assert(evidence.maxParticles<=12,'Total particle cap');assert(!evidence.sfxWhileMuted&&!evidence.sfxDuringVoice,'No forbidden audio starts');assert(!errors.length&&!consoleErrors.length&&!remote.length,'No console errors or network');
 // Reload clears visit collection. Reduced motion creates no animations OR particles.
 await p.reload();assert(await p.locator('.collection-slot.collected').count()===0,'Collection resets on reload');
 await p.emulateMedia({reducedMotion:'reduce'});await p.locator('#mute').click();await p.locator('[data-letter="P"]').click();await p.locator('[data-action="match"]').click();await p.waitForSelector('.choices');await p.locator('[data-answer="P"]').click();await p.waitForSelector('.celebration');await p.selectOption('#theme','1');
 assert(await p.evaluate(()=>document.getAnimations().length===0&&document.querySelectorAll('[data-particle]').length===0),'Reduced motion final states without WAAPI/particles');
 assert(await p.locator('.collection-slot.collected').count()===1,'Reduced motion retains reward');
 // Check Lucy's image box is spatially clear of every choice in the size matrix.
 const intersections=[];for(const [width,height] of [[1920,1080],[1366,768],[820,1180],[1180,820],[390,844],[844,390],[280,480],[320,568],[568,320],[1000,1000],[2560,1440]]){
  await p.keyboard.press('Escape');await p.setViewportSize({width,height});await p.locator('[data-letter="T"]').click();await p.locator('[data-action="match"]').click();await p.waitForSelector('.choices');
  const hit=await p.evaluate(()=>{const l=document.querySelector('.match-lucy');if(!l||getComputedStyle(l).display==='none')return false;const a=l.getBoundingClientRect();return [...document.querySelectorAll('.choice')].some(el=>{const r=el.getBoundingClientRect();return a.left<r.right&&a.right>r.left&&a.top<r.bottom&&a.bottom>r.top})});if(hit)intersections.push({width,height});}
 assert(!intersections.length,'Lucy remains clear of choices');
 reports.push({dir,passed:true,evidence,errors,consoleErrors,remote,checks:['No autoplay','Real WebAudio oscillator and noise instrumentation','Recorded voice has zero SFX sources','Rapid replay cancellation','Muted complete loop starts zero SFX/voice','12 rapid misses count once','12 rapid correct taps collect once','Useful two-miss hint','6 theme particles plus 6 reward stars = 12 max; all removed on navigation','Single WAAPI channel sampled each frame','Hidden idle pauses and clock stays still','Visit collection resets on reload','Reduced motion uses final states with zero animations/particles','Lucy clear of choices at 11 sizes']});
 await ctx.close();console.log('Fun checks passed',dir);
}}finally{await b.close();await fs.writeFile('out/_qa/fun-report.json',JSON.stringify(reports,null,2));}

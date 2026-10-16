/* Offline integration checks with Node built-ins. The DOM harness exercises logic;
   a real tablet/browser still needs the manual checks in README. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),M=require('../model.js');
const data=JSON.parse(fs.readFileSync(path.join(ROOT,'data.js'),'utf8').replace(/^window.GAME_DATA = /,'').replace(/;\s*$/,''));
function modelChecks(){
  const state=M.fresh(),c=M.child(state);assert.equal(M.stars(c),0);assert.equal(M.nextLetter(state),'S');
  state.settings.unlocked=['S'];
  M.answer(c,'S','case',false);M.answer(c,'S','case',true);M.complete(state,'S');
  assert.deepEqual(c.progress.S.case,{attempts:2,correct:1});assert.equal(c.session,null);
  assert.equal(M.stars(c),1);assert.deepEqual(state.settings.unlocked,['S','A']);
  M.complete(state,'S');assert.equal(M.stars(c),1);assert.equal(c.progress.S.completions,2);
  const other=M.newChild('other','=HYPERLINK("bad")','🚀');state.children.push(other);state.active=other.id;
  assert.equal(M.stars(M.child(state)),0);M.answer(other,'A','picture',true);M.complete(state,'A');
  assert.equal(c.progress.A,undefined);assert.equal(other.progress.A.completions,1);
  assert.match(M.csv(state),/"'=HYPERLINK\(""bad""\)"/);assert.equal(M.csv(state).split('\r\n').length,53);
  const saved=M.clean(JSON.parse(JSON.stringify(state)));assert.deepEqual(saved,state);
  const bad=M.fresh();bad.settings.order=['A'];bad.settings.pin='x';bad.settings.unlocked=['A','A','bad'];
  bad.children[0].progress.A={completions:-1,case:{correct:100,attempts:2}};
  bad.children[0].session={letter:'Q',stage:'oops'};
  const clean=M.clean(bad);assert.equal(clean.settings.order.length,26);assert.equal(clean.settings.pin,'2468');
  assert.deepEqual(clean.settings.unlocked,['A']);assert.equal(clean.children[0].progress.A.completions,0);
  assert.equal(clean.children[0].progress.A.case.correct,2);assert.equal(clean.children[0].session,null);
  state.settings.autoUnlock=false;state.settings.unlocked=[];assert.equal(M.nextLetter(state),null);
  M.complete(state,'Z');assert.deepEqual(state.settings.unlocked,[]);
}

// A deliberately small HTML DOM, sufficient for the app's own click/submit paths.
class Element {
  constructor(tag='div',attrs={}){this.tagName=tag.toUpperCase();this.attrs={...attrs};this.children=[];this.parentElement=null;this.dataset={};this.style={setProperty(){}};this._text='';this._html='';this.listeners={};this.hidden=false;this.disabled=false;this.open=false;this.classList={add:(...v)=>{this.attrs.class=[...new Set([...(this.attrs.class||'').split(' '),...v])].join(' ');},remove:(...v)=>{this.attrs.class=(this.attrs.class||'').split(' ').filter(c=>!v.includes(c)).join(' ');}};for(const[k,v]of Object.entries(attrs))this.setAttribute(k,v);}
  setAttribute(k,v){this.attrs[k]=String(v);if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(v);if(['hidden','disabled','checked'].includes(k))this[k]=true;if(k==='value')this.value=String(v);if(k==='name')this.name=String(v);if(k==='type')this.type=String(v);if(k==='src')this.src=String(v);if(k==='alt')this.alt=String(v);if(k==='id')this.id=String(v);}
  getAttribute(k){return this.attrs[k]??null;}
  removeAttribute(k){delete this.attrs[k];}
  set textContent(v){this._text=String(v);this.children=[];this._html='';}
  get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
  set innerHTML(html){this._html=html;this._text='';this.children=[];parseHTML(html,this);}
  get innerHTML(){return this._html;}
  append(el){el.parentElement=this;this.children.push(el);}
  prepend(el){el.parentElement=this;this.children.unshift(el);}
  replaceChildren(){this.children=[];}
  remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(c=>c!==this);}
  replaceWith(el){const p=this.parentElement;if(p){p.children[p.children.indexOf(this)]=el;el.parentElement=p;}}
  insertAdjacentHTML(_position,html){parseHTML(html,this);}
  focus(){}
  click(){this.clicked=true;}
  reset(){for(const el of Object.values(this.elements))el.value='';}
  set className(v){this.attrs.class=v;}
  get className(){return this.attrs.class||'';}
  addEventListener(type,fn){(this.listeners[type]||=[]).push(fn);}
  showModal(){this.open=true;}
  close(){this.open=false;for(const fn of this.listeners.close||[])fn({target:this});}
  matches(selector){
    if(selector.includes(','))return selector.split(',').some(s=>this.matches(s.trim()));
    const nots=[...selector.matchAll(/:not\(([^)]+)\)/g)].map(m=>m[1]);selector=selector.replace(/:not\([^)]+\)/g,'');
    if(nots.some(s=>this.matches(s)))return false;
    const tag=selector.match(/^[a-z][a-z0-9-]*/i)?.[0];if(tag&&this.tagName!==tag.toUpperCase())return false;
    for(const m of selector.matchAll(/#([\w-]+)/g))if(this.attrs.id!==m[1])return false;
    for(const m of selector.matchAll(/\.([\w-]+)/g))if(!(this.attrs.class||'').split(' ').includes(m[1]))return false;
    for(const m of selector.matchAll(/\[([\w-]+)(?:=["']?([^\]"']*)["']?)?\]/g))if(!(m[1]in this.attrs)||(m[2]!==undefined&&this.attrs[m[1]]!==m[2]))return false;
    return true;
  }
  closest(s){for(let el=this;el;el=el.parentElement)if(el.matches(s))return el;return null;}
  querySelectorAll(s){return this.children.flatMap(c=>[...(c.matches(s)?[c]:[]),...c.querySelectorAll(s)]);}
  querySelector(s){return this.querySelectorAll(s)[0]||null;}
  get elements(){return Object.fromEntries(this.querySelectorAll('[name]').map(n=>[n.name,n]));}
}
function parseHTML(html,root){
  const stack=[root],voids=new Set(['IMG','INPUT','META','LINK','BR','HR','SOURCE']);
  const regex=/<\/?[a-z][^>]*>|[^<]+/gi;let token;
  while((token=regex.exec(html))){const t=token[0];if(!t.startsWith('<')){stack.at(-1)._text+=t;continue;}
    if(t.startsWith('</')){if(stack.length>1)stack.pop();continue;}
    const tag=t.match(/^<([\w-]+)/)[1],attrs={};for(const m of t.slice(tag.length+1,-1).matchAll(/([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))attrs[m[1]]=m[2]??m[3]??m[4]??'';
    const el=new Element(tag,attrs);stack.at(-1).append(el);if(!voids.has(el.tagName)&&!t.endsWith('/>'))stack.push(el);
  }
}
function appHarness(saved=null,storageFail=false,reduced=false){
  const document=new Element('document');document.hidden=false;document.body=new Element('body');document.append(document.body);
  document.body.innerHTML='<meta name="theme-color"><header id="header"></header><main id="main"></main><nav id="kid-nav"></nav><div id="spoken"></div><div id="effects"></div><dialog id="gate"></dialog><span id="offline-status"></span>';
  document.createElement=tag=>new Element(tag);document.getAnimations=()=>[];
  const savedData={};if(saved)savedData['ready-set-abc-game-v1']=JSON.stringify(saved);
  const timers=new Map();let timer=0;
  const media={};for(const query of ['(prefers-reduced-motion: reduce)','(prefers-color-scheme: dark)'])media[query]={matches:query.includes('motion')&&reduced,listeners:[],addEventListener(_k,fn){this.listeners.push(fn);}};
  const sandbox={console,document,HTMLFormElement:Element,HTMLImageElement:class {},GameModel:M,GAME_DATA:data,location:{protocol:'file:'},navigator:{},
    matchMedia:q=>media[q],getComputedStyle:()=>({getPropertyValue:()=> '#faf1df'}),
    localStorage:{getItem:k=>{if(storageFail)throw Error('blocked');return savedData[k]||null;},setItem:(k,v)=>{if(storageFail)throw Error('blocked');savedData[k]=v;}},
    Audio:class {play(){return Promise.reject(Error('unavailable'));}pause(){}},setTimeout:fn=>{timers.set(++timer,fn);return timer;},clearTimeout:id=>timers.delete(id),
    FormData:class {constructor(form){this.form=form;}get(k){return this.form.elements[k]?.value??null;}},
    Blob,URL,crypto:require('node:crypto').webcrypto,addEventListener(){},scrollTo(){},
  };sandbox.window=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT,'app.js'),'utf8'),sandbox);
  const $=s=>document.querySelector(s);
  function click(selector){const b=typeof selector==='string'?$(selector):selector;assert.ok(b,'Missing button '+selector);assert.equal(b.disabled,false,'Disabled button '+selector);for(const fn of document.listeners.click||[])fn({target:b});}
  function submit(id,values){const f=$('#'+id);assert.ok(f,'Missing form '+id);for(const[k,v]of Object.entries(values))f.elements[k].value=v;for(const fn of document.listeners.submit||[])fn({target:f,preventDefault(){}});}
  function change(selector,value){const t=$(selector);if(t.type==='checkbox')t.checked=value;else t.value=value;for(const fn of document.listeners.change||[])fn({target:t});}
  return {$,click,submit,change,document,saved:()=>JSON.parse(savedData['ready-set-abc-game-v1']||'null'),sandbox,timers,media};
}
function appChecks(){
  const h=appHarness(),click=h.click;assert.equal(h.document.body.dataset.screen,'home');
  click('[data-route="map"]');assert.equal(h.$('.map-grid').children.length,26);
  click('[data-letter="A"]');assert.equal(h.document.body.dataset.screen,'listen');assert.equal(h.$('[data-action="advance"]').disabled,true);
  click('[data-listen="name"]');click('[data-listen="sound"]');click('[data-action="advance"]');
  assert.equal(h.document.body.dataset.screen,'case');
  const wrong=h.$('.choices').children.filter(c=>c.dataset.answer!=='A');click(wrong[0]);click(wrong[1]);
  assert.ok(h.$('[data-answer="A"]').attrs.class.includes('hint'));assert.equal(h.saved().children[0].progress.A.hints,1);
  click('[data-answer="A"]');assert.equal(h.$('[data-action="advance"]').hidden,false);
  // Changing world after a correct choice must preserve the next button and answer state.
  click('[data-action="theme"]');assert.equal(h.$('[data-action="advance"]').hidden,false);
  click('[data-action="advance"]');assert.equal(h.saved().children[0].session.caseRound,1);
  // Reload resumes at the same stage, not the start of the letter.
  const resumed=appHarness(h.saved());resumed.click('[data-action="play"]');assert.equal(resumed.document.body.dataset.screen,'case');assert.ok(resumed.$('.target').attrs.class.includes('lower'));
  click('[data-answer="A"]');click('[data-action="advance"]');assert.equal(h.document.body.dataset.screen,'picture');
  click('[data-answer="A"]');click('[data-action="advance"]');assert.equal(h.document.body.dataset.screen,'bonus');
  click('[data-action="mute"]');assert.equal(h.$('.mystery-cue').hidden,false);
  click('[data-answer="A"]');click('[data-action="advance"]');click('[data-answer="A"]');click('[data-action="advance"]');
  assert.equal(h.document.body.dataset.screen,'celebrate');assert.equal(h.saved().children[0].progress.A.completions,1);assert.equal(h.saved().children[0].session,null);
  click('[data-route="closet"]');assert.ok(h.$('[data-outfit="bows"]'));click('[data-outfit="bows"]');assert.equal(h.saved().children[0].outfit,'bows');
  click('[data-action="teacher"]');assert.equal(h.$('#gate').open,true);h.submit('pin-gate',{pin:'0000'});assert.match(h.$('#gate-error').textContent,/didn’t match/);
  h.submit('pin-gate',{pin:'2468'});assert.equal(h.document.body.dataset.screen,'teacher');
  click('[data-tab="children"]');h.submit('child-add',{name:'Second explorer',avatar:'🚀'});assert.equal(h.saved().children.length,2);
  const second=h.saved().children[1].id;
  click('[data-tab="letters"]');click('[data-action="starter-set"]');assert.equal(h.saved().settings.unlocked.length,6);
  h.change('[data-unlock="Z"]',true);assert.ok(h.saved().settings.unlocked.includes('Z'));
  click('[data-route="home"]');click('[data-route="profiles"]');click(`[data-child="${second}"]`);
  assert.equal(h.saved().active,second);assert.deepEqual(h.saved().children[1].progress,{});
  click('[data-action="teacher"]');h.submit('pin-gate',{pin:'2468'});click('[data-tab="settings"]');
  h.submit('pin-change',{current:'2468',pin:'8642',repeat:'8642'});assert.equal(h.saved().settings.pin,'8642');
  click('[data-tab="progress"]');click('[data-action="export"]');assert.match(h.$('#spoken').textContent,/CSV exported/);const reset=h.$('[data-reset-child]');click(reset);h.submit('reset-confirm',{confirm:'RESET'});assert.equal(h.saved().children[1].session,null);
  // Complete every letter through the same real activity handlers.
  const allState=M.fresh();allState.settings.muted=true;const all=appHarness(allState);
  for(const l of M.ALPHABET){
    all.click('[data-route="map"]');all.click(`[data-letter="${l}"]`);all.click('[data-listen="name"]');all.click('[data-listen="sound"]');all.click('[data-action="advance"]');
    for(let i=0;i<5;i++){assert.ok(['case','picture','bonus'].includes(all.document.body.dataset.screen));all.click(`[data-answer="${l}"]`);all.click('[data-action="advance"]');}
    assert.equal(all.document.body.dataset.screen,'celebrate');
  }
  const finished=all.saved();assert.equal(M.stars(finished.children[0]),26);all.click('[data-route="closet"]');assert.equal(all.$('[data-outfit="rainbow"]').getAttribute('aria-disabled'),null);
  all.click('[data-action="teacher"]');all.submit('pin-gate',{pin:'2468'});all.click('[data-tab="settings"]');all.click('[data-action="reset-all"]');all.submit('reset-confirm',{confirm:'RESET'});assert.equal(all.saved().children.length,1);assert.equal(M.stars(all.saved().children[0]),0);assert.equal(all.document.body.dataset.screen,'home');
  const noStorage=appHarness(null,true);assert.ok(noStorage.$('.storage-banner'));noStorage.click('[data-action="play"]');assert.equal(noStorage.document.body.dataset.screen,'listen');
  // The system setting cancels particles immediately and overrides the app toggle.
  const motion=appHarness(allState);motion.click('[data-action="play"]');motion.click('[data-listen="name"]');motion.click('[data-listen="sound"]');motion.click('[data-action="advance"]');
  for(let i=0;i<5;i++){motion.click('[data-answer="S"]');motion.click('[data-action="advance"]');}
  assert.equal(motion.$('#effects').children.length,8);
  const preference=motion.media['(prefers-reduced-motion: reduce)'];preference.matches=true;preference.listeners.forEach(fn=>fn());
  assert.equal(motion.$('#effects').children.length,0);assert.equal(motion.document.body.dataset.motion,'off');
  motion.click('[data-action="theme"]');assert.equal(motion.document.body.dataset.motion,'off');
  const initiallyReduced=appHarness(allState,false,true);assert.equal(initiallyReduced.document.body.dataset.motion,'off');
}
async function audioChecks(){
  const initial=M.fresh();initial.children[0].session={letter:'A',stage:'case',caseRound:0,bonusRound:0,heardName:true,heardSound:true};
  const h=appHarness(initial),clips=[];
  h.sandbox.Audio=class {
    constructor(file){this.file=file;this.paused=false;clips.push(this);}
    play(){return new Promise((resolve,reject)=>{this.resolve=resolve;this.reject=reject;});}
    pause(){this.paused=true;}
  };
  h.click('[data-action="play"]');assert.equal(clips[0].file,'audio/lines/case-lower.mp3');
  clips[0].onerror();await Promise.resolve();await Promise.resolve();
  assert.equal(clips[1].file,'audio/letters/a-name-trim.mp3');
  const timerCount=h.timers.size;
  // Browsers can emit both an error event and a rejected play promise.
  // The second notification must not cancel the next clip's timeout.
  clips[0].reject(Error('same failed clip'));await Promise.resolve();await Promise.resolve();
  assert.equal(h.timers.size,timerCount);assert.equal(typeof clips[1].onended,'function');
  clips[1].onended();await Promise.resolve();await Promise.resolve();
  assert.ok(!(h.document.body.attrs.class||'').includes('speaking'));
  h.click('[data-action="instruction"]');const playing=clips.at(-1);h.click('[data-route="home"]');
  assert.equal(playing.paused,true);playing.reject(Error('interrupted'));await Promise.resolve();await Promise.resolve();
  assert.equal(h.document.body.dataset.screen,'home');const greeting=clips.at(-1);assert.equal(greeting.file,'audio/lines/welcome.mp3');assert.equal(typeof greeting.onended,'function');
  greeting.onended();await Promise.resolve();await Promise.resolve();assert.ok(!(h.document.body.attrs.class||'').includes('speaking'));
}
async function serviceWorkerChecks(){
  const scope='http://offline.test/game/',events={},cacheStore=new Map();let network=true,failRequired=false,claimed=0,skipped=0;
  class Cache{
    constructor(){this.map=new Map();}
    async addAll(urls){const pairs=await Promise.all(urls.map(async u=>{const r=await fetcher(u);if(!r.ok)throw Error('missing required');return[u,r];}));for(const[u,r]of pairs)this.map.set(typeof u==='string'?u:u.url,r);}
    async put(u,r){this.map.set(typeof u==='string'?u:u.url,r);}
    async keys(){return [...this.map.keys()].map(url=>({url}));}
    async match(u,opts={}){const url=typeof u==='string'?u:u.url;for(const[k,r]of this.map){const a=new URL(k),b=new URL(url);if(opts.ignoreSearch){a.search='';b.search='';}if(a.href===b.href)return r.clone();}return undefined;}
  }
  async function fetcher(req){if(!network)throw Error('offline');const url=new URL(typeof req==='string'?req:req.url),file=decodeURIComponent(url.pathname.replace('/game/',''))||'index.html';if(failRequired&&file==='app.js')return new Response('',{status:404});return new Response('asset:'+file,{status:fs.existsSync(path.join(ROOT,file))?200:404});}
  const caches={open:async k=>{if(!cacheStore.has(k))cacheStore.set(k,new Cache());return cacheStore.get(k);},keys:async()=>[...cacheStore.keys()],delete:async k=>cacheStore.delete(k)};
  const self={registration:{scope},location:new URL(scope+'sw.js'),clients:{claim:async()=>{claimed++;}},skipWaiting:async()=>{skipped++;},addEventListener:(k,v)=>events[k]=v};
  const sandbox={self,caches,URL,Request,Response,fetch:fetcher};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(ROOT,'sw.js'),'utf8'),sandbox);
  async function trigger(type,event={}){let work;events[type]({...event,waitUntil:p=>work=p,respondWith:p=>work=p});return await work;}
  await trigger('install');assert.equal(skipped,1);
  cacheStore.set('ready-set-abc-game-old',new Cache());cacheStore.set('unrelated-site',new Cache());
  await trigger('activate');assert.equal(claimed,1);assert.ok(cacheStore.has('unrelated-site'));assert.ok(!cacheStore.has('ready-set-abc-game-old'));
  let status;const statusEvent={data:{type:'CACHE_STATUS'},ports:[{postMessage:v=>status=v}]};await trigger('message',statusEvent);assert.equal(status.ready,true);assert.equal(status.pending,Object.values(JSON.parse(fs.readFileSync(path.join(ROOT,'needs/needs.json')))).flat().filter(i=>!fs.existsSync(path.join(ROOT,i.file))).length);
  network=false;
  const audio=await trigger('fetch',{request:{url:scope+'audio/letters/z-sound-trim.mp3',method:'GET',mode:'cors'}});assert.equal(audio.status,200);
  const nav=await trigger('fetch',{request:{url:scope+'some-route',method:'GET',mode:'navigate'}});assert.equal(nav.status,200);
  const missing=await trigger('fetch',{request:{url:scope+'art/unlisted-missing.svg',method:'GET',mode:'cors'}});assert.equal(missing.status,404);
  const query=await trigger('fetch',{request:{url:scope+'index.html?home=1',method:'GET',mode:'navigate'}});assert.equal(query.status,200);
  const gameCache=[...cacheStore.entries()].find(([k])=>k.startsWith('ready-set-abc-game-'))[1];gameCache.map.delete(scope+'app.js');
  await trigger('message',statusEvent);assert.equal(status.ready,false);
  network=true;await trigger('message',{...statusEvent,data:{type:'REFRESH_CACHE'}});assert.equal(status.ready,true);
  cacheStore.clear();failRequired=true;await assert.rejects(trigger('install'),/missing required/);assert.equal(skipped,1);
}
(async()=>{modelChecks();appChecks();await audioChecks();await serviceWorkerChecks();console.log('model, A–Z gameplay, resume/hints/mute/audio, teacher tools and offline cache behavior passed');})().catch(err=>{console.error(err);process.exitCode=1;});

/* Offline integration checks with Node built-ins. The DOM harness exercises logic;
   a real tablet/browser still needs the manual checks in README. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),M=require('../model.js');
const data=require('../content.js');
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
  const savedData={},played=[];if(saved)savedData['ready-set-abc-sound-garden-v1']=JSON.stringify(saved);
  const timers=new Map();let timer=0;
  const media={};for(const query of ['(prefers-reduced-motion: reduce)','(prefers-color-scheme: dark)'])media[query]={matches:query.includes('motion')&&reduced,listeners:[],addEventListener(_k,fn){this.listeners.push(fn);}};
  const sandbox={console,document,HTMLFormElement:Element,HTMLImageElement:class {},GameModel:M,SoundGarden:data,location:{protocol:'file:'},navigator:{},
    matchMedia:q=>media[q],getComputedStyle:()=>({getPropertyValue:()=> '#faf1df'}),
    localStorage:{getItem:k=>{if(storageFail)throw Error('blocked');return savedData[k]||null;},setItem:(k,v)=>{if(storageFail)throw Error('blocked');savedData[k]=v;}},
    Audio:class {constructor(file){played.push(file);}play(){return Promise.reject(Error('unavailable'));}pause(){}},setTimeout:fn=>{timers.set(++timer,fn);return timer;},clearTimeout:id=>timers.delete(id),
    FormData:class {constructor(form){this.form=form;}get(k){return this.form.elements[k]?.value??null;}},
    Blob,URL,crypto:require('node:crypto').webcrypto,addEventListener(){},scrollTo(){},
  };sandbox.window=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT,'app.js'),'utf8'),sandbox);
  const $=s=>document.querySelector(s);
  function click(selector){const b=typeof selector==='string'?$(selector):selector;assert.ok(b,'Missing button '+selector);assert.equal(b.disabled,false,'Disabled button '+selector);for(const fn of document.listeners.click||[])fn({target:b});}
  function submit(id,values){const f=$('#'+id);assert.ok(f,'Missing form '+id);for(const[k,v]of Object.entries(values))f.elements[k].value=v;for(const fn of document.listeners.submit||[])fn({target:f,preventDefault(){}});}
  function change(selector,value){const t=$(selector);if(t.type==='checkbox')t.checked=value;else t.value=value;for(const fn of document.listeners.change||[])fn({target:t});}
  return {$,click,submit,change,document,saved:()=>JSON.parse(savedData['ready-set-abc-sound-garden-v1']||'null'),sandbox,timers,media,played};
}
function contentChecks(){
 assert.equal(data.letters.length,26);
 for(const l of data.letters){
  assert.equal(l.name,`audio/letters/${l.lower}-name-trim.mp3`);assert.equal(l.sound,`audio/letters/${l.lower}-sound-trim.mp3`);
  for(let i=0;i<30;i++){const choices=data.options(l,i%2?2:3);assert.ok(choices.includes(l));assert.equal(new Set(choices).size,choices.length);assert.ok(choices.filter(x=>x!==l).every(x=>x.soundGroup!==l.soundGroup));}
 }
 assert.equal(data.letters[23].word,'fox');
}
async function appChecks(){
 const h=appHarness(),click=h.click;
 assert.equal(h.document.body.dataset.screen,'home');click('[data-route="map"]');assert.equal(h.$('.map-grid').children.length,26);
 click('[data-letter="A"]');assert.equal(h.$('[data-action="advance"]').disabled,true);
 click('[data-listen="name"]');assert.ok(h.played.includes('audio/letters/a-name-trim.mp3'));
 click('[data-listen="sound"]');assert.ok(h.played.includes('audio/letters/a-sound-trim.mp3'));
 click('[data-action="advance"]');assert.equal(h.document.body.dataset.screen,'case');
 const wrong=h.$('.choices').children.find(b=>b.dataset.answer!=='A');click(wrong);click(wrong);
 assert.ok(h.$('[data-answer="A"]').className.includes('hint'));assert.equal(h.saved().children[0].progress.A.hints,1);
 click('[data-answer="A"]');const attempts=h.saved().children[0].progress.A.case.attempts;click('[data-answer="A"]');assert.equal(h.saved().children[0].progress.A.case.attempts,attempts);
 click('[data-action="dark"]');assert.equal(h.document.body.dataset.dark,'true');assert.equal(h.$('[data-action="advance"]').hidden,false);
 click('[data-action="advance"]');assert.equal(h.document.body.dataset.screen,'picture');
 const resumed=appHarness(h.saved());resumed.click('[data-action="play"]');assert.equal(resumed.document.body.dataset.screen,'picture');
 click('[data-answer="A"]');click('[data-action="advance"]');assert.equal(h.document.body.dataset.screen,'bonus');
 await new Promise(resolve=>setImmediate(resolve));assert.equal(h.$('.mystery-cue').hidden,false,'Failed audio must show visual clue');
 click('[data-action="mute"]');assert.equal(h.$('.mystery-cue').hidden,false);
 click('[data-answer="A"]');click('[data-action="advance"]');assert.equal(h.document.body.dataset.screen,'celebrate');assert.equal(h.saved().children[0].progress.A.completions,1);assert.equal(h.saved().children[0].session,null);
 click('[data-route="garden"]');assert.ok(h.$('[data-flower="A"]'));click('[data-flower="A"]');assert.match(h.$('#spoken').textContent,/apple/);
 click('[data-action="teacher"]');h.submit('pin-gate',{pin:'0000'});assert.match(h.$('#gate-error').textContent,/didn’t match/);h.submit('pin-gate',{pin:'2468'});assert.equal(h.document.body.dataset.screen,'teacher');
 click('[data-tab="children"]');h.submit('child-add',{name:'Second <explorer>',avatar:'🚀'});assert.equal(h.saved().children.length,2);const second=h.saved().children[1].id;
 click('[data-tab="letters"]');click('[data-action="starter-set"]');assert.equal(h.saved().settings.unlocked.length,6);h.change('[data-unlock="Z"]',true);assert.ok(h.saved().settings.unlocked.includes('Z'));
 click('[data-move="A"][data-direction="-1"]');assert.equal(h.saved().settings.order[0],'A');
 click('[data-tab="settings"]');h.change('[data-setting="dark"]','system');assert.equal(h.saved().settings.dark,'system');
 h.submit('pin-change',{current:'2468',pin:'8642',repeat:'8642'});assert.equal(h.saved().settings.pin,'8642');
 click('[data-tab="progress"]');click('[data-action="export"]');assert.match(h.$('#spoken').textContent,/CSV exported/);
 click('[data-route="home"]');click('[data-route="profiles"]');click(`[data-child="${second}"]`);assert.equal(h.saved().active,second);assert.deepEqual(h.saved().children[1].progress,{});
 click('[data-action="teacher"]');h.submit('pin-gate',{pin:'2468'});assert.equal(h.$('#gate').open,true,'Changed PIN must reject old PIN');h.submit('pin-gate',{pin:'8642'});click('[data-tab="progress"]');click('[data-reset-child]');h.submit('reset-confirm',{confirm:'RESET'});assert.equal(h.saved().children[1].session,null);
 // Complete all 26 letters through the actual event handlers, including repeated play.
 const allState=M.fresh();allState.settings.muted=true;const all=appHarness(allState);
 for(const l of M.ALPHABET){all.click('[data-route="map"]');all.click(`[data-letter="${l}"]`);all.click('[data-listen="name"]');all.click('[data-listen="sound"]');all.click('[data-action="advance"]');for(const stage of ['case','picture','bonus']){assert.equal(all.document.body.dataset.screen,stage);all.click(`[data-answer="${l}"]`);all.click('[data-action="advance"]');}assert.equal(all.document.body.dataset.screen,'celebrate');}
 assert.equal(M.stars(all.saved().children[0]),26);all.click('[data-route="garden"]');assert.equal(all.document.querySelectorAll('[data-flower]').length,26);
 all.click('[data-action="teacher"]');all.submit('pin-gate',{pin:'2468'});all.click('[data-tab="settings"]');all.click('[data-action="reset-all"]');all.submit('reset-confirm',{confirm:'RESET'});assert.equal(M.stars(all.saved().children[0]),0);assert.equal(all.document.body.dataset.screen,'home');
 const blocked=appHarness(null,true);assert.ok(blocked.$('.storage-banner'));blocked.click('[data-action="play"]');assert.equal(blocked.document.body.dataset.screen,'listen');
 const reduced=appHarness(null,false,true);assert.equal(reduced.document.body.dataset.motion,'off');
 const idle=appHarness();idle.click('[data-action="teacher"]');idle.submit('pin-gate',{pin:'2468'});idle.document.hidden=true;for(const fn of idle.document.listeners.visibilitychange)fn();assert.equal(idle.document.body.dataset.screen,'home');idle.click('[data-action="teacher"]');assert.equal(idle.$('#gate').open,true);
}
async function serviceWorkerChecks(){
 const events={},cacheStore=new Map(),scope='https://local.test/design/codex/abc/';let network=true,fail=false,skips=0;
 class Cache{constructor(){this.map=new Map();}async put(key,value){this.map.set(typeof key==='string'?key:key.url,value.clone());}async match(key){return this.map.get(typeof key==='string'?key:key.url)?.clone();}}
 const caches={open:async key=>{if(!cacheStore.has(key))cacheStore.set(key,new Cache());return cacheStore.get(key);},keys:async()=>[...cacheStore.keys()],delete:async key=>cacheStore.delete(key)};
 const fetcher=async input=>{if(!network)throw Error('offline');const u=typeof input==='string'?input:input.url;const name=decodeURI(new URL(u).pathname).slice(new URL(scope).pathname.length);const p=path.join(ROOT,name);if((fail&&name==='app.js')||!fs.existsSync(p))return new Response('',{status:404});return new Response(fs.readFileSync(p),{headers:{'Content-Type':name.endsWith('.mp3')?'audio/mpeg':'application/octet-stream'}});};
 const self={registration:{scope},location:new URL(scope+'sw.js'),clients:{claim:async()=>{}},skipWaiting:async()=>{skips++;},addEventListener:(k,v)=>events[k]=v};
 const sandbox={self,caches,URL,Request,Response,fetch:fetcher};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(ROOT,'sw.js'),'utf8'),sandbox);
 async function trigger(type,event={}){let work;events[type]({...event,waitUntil:p=>work=p,respondWith:p=>work=p});return await work;}
 await trigger('install');assert.equal(skips,1);const prefix='rsabc-sound-garden-'+encodeURIComponent(scope)+'-';cacheStore.set(prefix+'old',new Cache());cacheStore.set('rsabc-sound-garden-other-scope',new Cache());await trigger('activate');assert.ok(!cacheStore.has(prefix+'old'));assert.ok(cacheStore.has('rsabc-sound-garden-other-scope'));
 let result;const message={data:{type:'CACHE_STATUS'},ports:[{postMessage:v=>result=v}]};await trigger('message',message);assert.equal(result.ready,true);assert.equal(result.pending,Object.values(JSON.parse(fs.readFileSync(path.join(ROOT,'needs/needs.json')))).flat().filter(n=>!fs.existsSync(path.join(ROOT,n.file))).length);
 network=false;
 const request=(file,headers={})=>new Request(scope+file,{headers});
 const audio=await trigger('fetch',{request:request('audio/letters/z-sound-trim.mp3')});assert.equal(audio.status,200);assert.deepEqual(Buffer.from(await audio.arrayBuffer()),fs.readFileSync(path.join(ROOT,'audio/letters/z-sound-trim.mp3')));
 const partial=await trigger('fetch',{request:request('audio/letters/z-sound-trim.mp3',{Range:'bytes=10-29'})});assert.equal(partial.status,206);assert.equal((await partial.arrayBuffer()).byteLength,20);
 const suffix=await trigger('fetch',{request:request('audio/letters/z-sound-trim.mp3',{Range:'bytes=-20'})});assert.equal(suffix.status,206);assert.equal((await suffix.arrayBuffer()).byteLength,20);
 const bad=await trigger('fetch',{request:request('audio/letters/z-sound-trim.mp3',{Range:'bytes=99999999-'})});assert.equal(bad.status,416);
 assert.equal((await trigger('fetch',{request:request('index.html?home=1')})).status,200);
 assert.equal((await trigger('fetch',{request:request('art/missing.png')})).status,404);
 const cache=cacheStore.get([...cacheStore.keys()].find(k=>k.startsWith(prefix)));cache.map.delete(scope+'app.js');await trigger('message',message);assert.equal(result.ready,false);
 network=true;await trigger('message',{...message,data:{type:'REFRESH_CACHE'}});assert.equal(result.ready,true);
 fail=true;cacheStore.clear();await assert.rejects(trigger('install'),/Missing cache asset/);
}
if(process.argv.includes('--assets')){
 console.log(JSON.stringify([...new Set([...data.letters.flatMap(l=>[l.image,l.name,l.sound,l.wordAudio]),...Object.values(data.lucy),...Object.values(data.lines)])]));
}else{(async()=>{modelChecks();contentChecks();await appChecks();await serviceWorkerChecks();console.log('PASS Node runtime: A–Z play, audio wiring/fallbacks, hints/resume, rewards, teacher/PIN/profiles/CSV/reset, dark mode, storage, reduced motion, PWA cache/ranges/isolation');})().catch(err=>{console.error(err);process.exitCode=1;});}

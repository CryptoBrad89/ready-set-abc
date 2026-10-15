/* One visual channel. All finite effects are owned by the current route. */
(() => {
'use strict';
const post=window.CONCEPT.kind==='post', $=s=>document.querySelector(s);
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
let active=null, epoch=0, muted=false, speaking=false, audio=null;
const sources=new Set(), gains=new Set();
const stats={effects:0,maxEffects:0,maxParticles:0,sfxStarted:0,sfxWhileMuted:0,sfxDuringVoice:0};
function hush(){for(const s of sources){try{s.stop();}catch{}s.disconnect();}sources.clear();for(const g of gains)g.disconnect();gains.clear();}
function unlock(){if(muted)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{ /* Visual play remains available. */ }}
document.addEventListener('pointerdown',unlock,{capture:true});
document.addEventListener('keydown',e=>{if(['Enter',' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))unlock();},{capture:true});
function sound(kind){
 if(muted||speaking||document.hidden||!audio||audio.state!=='running')return;
 hush();
 const now=audio.currentTime, gain=audio.createGain();gain.connect(audio.destination);gains.add(gain);
 const sequence=kind==='reward'?[392,494,587]:kind==='weather'?[440,554]:kind==='open'?[post?170:360,post?230:540]:[post?250:620];
 gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.035,now+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+.19);
 sequence.forEach((hz,i)=>{const s=audio.createOscillator();s.type=post?'triangle':'sine';s.frequency.setValueAtTime(hz,now);if(kind==='open'&&post)s.frequency.exponentialRampToValueAtTime(hz*.55,now+.16);s.connect(gain);sources.add(s);s.onended=()=>{sources.delete(s);s.disconnect();if(!sources.size){gain.disconnect();gains.delete(gain);}};s.start(now+i*.028);s.stop(now+.2);});
 if(post&&kind==='open'){
  const buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*.15),audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.6;
  const noise=audio.createBufferSource();noise.buffer=buffer;const filter=audio.createBiquadFilter();filter.type='bandpass';filter.frequency.value=1500;noise.connect(filter);filter.connect(gain);sources.add(noise);noise.onended=()=>{sources.delete(noise);noise.disconnect();filter.disconnect();};noise.start(now);noise.stop(now+.15);
 }
 stats.sfxStarted++; // Read-only evidence for the QA harness; no child data.
}
function cancel(){epoch++;if(active){active.cancel();active=null;}stats.effects=0;document.body.removeAttribute('data-effect');$('#confetti').replaceChildren();hush();}
async function moment(el,frames,{duration=440,name='moment',cue=null,particles=false}={}){
 cancel();const mine=epoch;
 if(reduce.matches||!el||document.hidden)return true;
 if(cue)sound(cue);
 stats.maxParticles=Math.max(stats.maxParticles,document.querySelectorAll('[data-particle]').length);stats.effects=1;stats.maxEffects=Math.max(stats.maxEffects,stats.effects);document.body.dataset.effect=name;
 const animation=el.animate(frames,{duration,easing:'cubic-bezier(.22,.75,.25,1)',fill:'none'});active=animation;
 let complete=true;try{await animation.finished;}catch{complete=false;}
 if(epoch!==mine)return false;
 active=null;stats.effects=0;document.body.removeAttribute('data-effect');if(particles)$('#confetti').replaceChildren();
 return complete;
}
function particles(theme){
 const host=$('#confetti');host.replaceChildren();if(reduce.matches||document.hidden)return null;
 const group=document.createElement('div');group.className=`theme-weather weather-${theme}`;
 // These are the ONLY temporary decorative particle nodes: six, as one effect.
 for(let i=0;i<6;i++){const p=document.createElement('i');p.dataset.particle='';p.style.setProperty('--n',i);group.append(p);}host.append(group);
 stats.maxParticles=Math.max(stats.maxParticles,document.querySelectorAll('[data-particle]').length);return group;
}
async function lucy(pose){const el=(pose==='paw'||pose==='salute')?$('.lucy-paw'):pose==='glint'?$('.visor-glint'):$('.lucy-portrait');const transform=(pose==='paw'||pose==='salute')?['rotate(-15deg) translateY(10px)','rotate(0) translateY(-5px)','rotate(-15deg) translateY(0)']:pose==='tilt'?['rotate(0)','rotate(-5deg)','rotate(0)']:pose==='glint'?['translateX(-8px)','translateX(14px)','translateX(0)']:['rotate(0)','rotate(4deg) translateY(3px)','rotate(0)'];return moment(el,transform.map(transform=>({transform})),{duration:380,name:'lucy-'+pose});}
async function home(){
 const mine=epoch;
 if(!await moment($(post?'.open-sign':'.map-ship .art'),post?[{transform:'rotate(-15deg)'},{transform:'rotate(-4deg)'},{transform:'rotate(-7deg)'}]:[{transform:'translate(-28px,14px) rotate(2deg)'},{transform:'translate(-8px,-8px) rotate(15deg)'},{transform:'rotate(22deg)'}],{duration:650,name:'intro'}))return;
 // Each route gets one finite idle greeting, never a repeating timer.
 if(document.body.dataset.screen!=='home'||epoch!==mine+1)return;
 if(!await lucy(post?'paw':'salute'))return;
 if(!post&&!await lucy('glint'))return;
 if(!await lucy('tilt'))return;
 await moment($(post?'.open-sign':'.map-mark'),post?[{transform:'rotate(-7deg)'},{transform:'rotate(-3deg)'},{transform:'rotate(-7deg)'}]:[{transform:'scale(1)'},{transform:'scale(1.16)'},{transform:'scale(1)'}],{duration:500,name:'idle-once'});
}
window.Fun={cancel,home,lucy,
 mute(value){muted=value;hush();},
 voice(value){speaking=value;if(value)hush();},
 press(button){return moment(button,[{transform:'scale(1)'},{transform:'scale(.96)'},{transform:'scale(1)'}],{duration:160,name:post?'paper-press':'orbit-squish'});},
 open(){return post?moment($('.listen .mail-flap'),[{transform:'rotateX(0)'},{transform:'rotateX(160deg)'}],{duration:500,name:'envelope-open',cue:'open'}):moment($('.listen .signal-orbit'),[{transform:'rotate(-55deg) scale(.87)',borderColor:'#777aa8'},{transform:'rotate(0) scale(1)',borderColor:'#6c9ca0'}],{duration:500,name:'orbit-tune',cue:'open'});},
 replay(){return moment($('.listen-letter')||$('.reward-art'),[{outline:'3px solid transparent',outlineOffset:'0px'},{outline:'3px solid var(--focus)',outlineOffset:'7px'},{outline:'3px solid transparent',outlineOffset:'12px'}],{duration:330,name:post?'ink-ring':'signal-ring',cue:'tap'});},
 hint(button,correct){return moment(correct||button,[{outlineOffset:'1px'},{outlineOffset:'6px'},{outlineOffset:'3px'}],{duration:350,name:correct?'hint-beacon':post?'gentle-miss':'scanner-outline',cue:'tap'});},
 reward(){return moment($(post?'.reward-stamp':'.reward-art'),post?[{transform:'translateY(-16px) rotate(-8deg) scale(1.2)'},{transform:'translateY(0) rotate(12deg) scale(1)'}]:[{boxShadow:'inset 0 0 0 0px transparent',transform:'scale(.96)'},{boxShadow:'inset 0 0 0 5px var(--focus)',transform:'scale(1)'}],{duration:600,name:post?'delivery-stamp':'world-awakens',cue:'reward'});},
 get evidence(){return {...stats,particles:document.querySelectorAll('[data-particle]').length,active:active?1:0,sources:sources.size,muted,speaking,reduced:reduce.matches};}
};
// Theme particles must be created after moment clears the preceding effect.
window.Fun.weather=async theme=>{cancel();if(reduce.matches||document.hidden)return true;const group=particles(theme);const mine=epoch;document.body.dataset.effect='theme-weather';sound('weather');stats.maxParticles=Math.max(stats.maxParticles,document.querySelectorAll('[data-particle]').length);stats.effects=1;stats.maxEffects=Math.max(stats.maxEffects,1);const a=group.animate([{transform:'translateY(-12px)',opacity:0},{transform:'translateY(0)',opacity:1,offset:.25},{transform:'translateY(22px)',opacity:0}],{duration:650,easing:'ease-out'});active=a;try{await a.finished;}catch{return false;}if(epoch!==mine)return false;active=null;stats.effects=0;document.body.removeAttribute('data-effect');$('#confetti').replaceChildren();return true;};
reduce.addEventListener('change',()=>{cancel();if(reduce.matches)document.querySelectorAll('[data-particle]').forEach(p=>p.remove());});
document.addEventListener('visibilitychange',()=>{if(document.hidden){active?.pause();hush();}else if(active?.playState==='paused')active.play();});
window.addEventListener('pagehide',cancel);
})();

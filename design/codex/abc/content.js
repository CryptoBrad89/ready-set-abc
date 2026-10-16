/* Small, explicit teaching vocabulary. X teaches the final /ks/ in fox. */
(function(scope){
'use strict';
const words = ['apple','ball','cat','duck','egg','fish','goat','hat','insect','jellyfish','kite','leaf','moon','nest','octopus','pig','quilt','rabbit','sun','tiger','umbrella','van','web','fox','yak','zebra'];
const sounds = ['a','b','k','d','e','f','g','h','i','j','k','l','m','n','o','p','kw','r','s','t','u','v','w','ks','y','z'];
const letters = words.map((word,i)=>{
 const upper=String.fromCharCode(65+i), lower=upper.toLowerCase();
 return {upper,lower,word,soundGroup:sounds[i],image:`art/${word}.svg`,name:`audio/letters/${lower}-name-trim.mp3`,sound:`audio/letters/${lower}-sound-trim.mp3`,wordAudio:`audio/lines/word-${word}.mp3`};
});
function shuffle(items,random=Math.random){ const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a; }
function options(current,count=2,random=Math.random){
 const pool=letters.filter(l=>l!==current&&l.soundGroup!==current.soundGroup);
 return shuffle([current,...shuffle(pool,random).slice(0,count-1)],random);
}
const lucy={welcome:'art/lucy-welcome.png',guide:'art/lucy-guide.png',cheer:'art/lucy-cheer.png'};
const lines=Object.fromEntries(['welcome-garden','meet','plant','garden','case-lower','picture','picture-x','bonus-sound','hint','again','next','profiles','locked','cheer-1','cheer-2'].map(id=>[id,`audio/lines/${id}.mp3`]));
const api={letters,options,shuffle,lucy,lines};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else scope.SoundGarden=api;
})(typeof window!=='undefined'?window:globalThis);

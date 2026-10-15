import {chromium} from 'playwright';import fs from 'node:fs/promises';
const b=await chromium.launch({headless:true,args:['--no-sandbox']});const p=await b.newPage();
for(const [w,h] of [[1366,768],[390,844]]){await p.setViewportSize({width:w,height:h});await p.goto('file:///tmp/rsabc-reinvent/out/index.html');await p.evaluate(()=>document.fonts.ready);const bad=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,missing:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)}));if(bad.overflow||bad.missing.length)throw Error(JSON.stringify(bad));await p.screenshot({path:`out/_qa/gallery-${w}.png`,fullPage:true});}
await b.close();

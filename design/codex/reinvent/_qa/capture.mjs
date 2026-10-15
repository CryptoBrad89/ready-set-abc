import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('out');
const dirs=['v1-letter-post','v2-sound-garden','v3-moonboat'];
const sizes=[[1920,1080],[1366,768],[820,1180],[1180,820],[390,844],[844,390]];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
let report=[];
try{
for(const dir of dirs){
 const context=await browser.newContext({viewport:{width:1366,height:768},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+path.join(root,dir,'index.html'));await page.evaluate(()=>document.fonts.ready);await page.locator('#mute').click();
 for(const [width,height] of sizes){
  await page.setViewportSize({width,height});
  await page.reload(); await page.evaluate(()=>document.fonts.ready); await page.locator('#mute').click();
  for(const screen of ['home','listen','match','celebrate']){
   if(screen==='listen')await page.locator('[data-letter="S"]').click();
   if(screen==='match')await page.locator('[data-action="match"]').click();
   if(screen==='celebrate'){await page.locator('[data-answer="S"]').click();await page.waitForSelector('.celebration');}
   await page.waitForTimeout(60);
   await page.screenshot({path:path.join(root,dir,'stills',`${screen}-${width}x${height}.png`)});
   if(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight+1)) await page.screenshot({path:path.join(root,dir,'stills',`${screen}-${width}x${height}-fullpage.png`),fullPage:true}); else await fs.rm(path.join(root,dir,'stills',`${screen}-${width}x${height}-fullpage.png`),{force:true});
   const checks=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,height:document.documentElement.scrollHeight,buttons:[...document.querySelectorAll('button')].map(b=>{let r=b.getBoundingClientRect();return{label:b.getAttribute('aria-label')||b.textContent.trim(),w:r.width,h:r.height,left:r.left,right:r.right};}).filter(b=>b.w<44||b.h<44||b.left<0||b.right>innerWidth)}));
   report.push({dir,width,viewportHeight:height,screen,...checks});
  }
 }
 await page.setViewportSize({width:1366,height:768});await page.locator('[data-action="home"]').first().click();
 for(let theme=0;theme<3;theme++){await page.selectOption('#theme',String(theme));await page.screenshot({path:path.join(root,dir,'stills',`theme-${theme}-home.png`),fullPage:true});await page.reload();if(await page.locator('#theme').inputValue()!==String(theme))throw Error('Theme did not persist');}
 report.push({dir,errors});await context.close();console.log('Captured',dir);
}
}finally{await browser.close();await fs.writeFile(path.join(root,'_qa/layout-report.json'),JSON.stringify(report,null,2));}

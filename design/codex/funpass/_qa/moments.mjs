import {chromium} from 'playwright';import fs from 'node:fs/promises';import path from 'node:path';
process.env.TMPDIR=path.resolve('out/_qa/tmp');const b=await chromium.launch({headless:true,args:['--no-sandbox']});const report=[];
const settle=async p=>p.waitForFunction(()=>Fun.evidence.active===0);
try{for(const dir of ['v1-letter-post','v3-moonboat']){const c=await b.newContext({viewport:{width:1366,height:768}}),p=await c.newPage();await p.goto('file://'+path.resolve('out',dir,'index.html'));await p.evaluate(()=>document.fonts.ready);await p.locator('#mute').click();
 await p.locator('[data-letter="S"]').click();await settle(p);await p.screenshot({path:`out/${dir}/stills/moment-open-1366x768.png`});
 await p.locator('[data-action="match"]').click();await p.waitForSelector('.choices');await p.locator('[data-answer="S"]').click();await p.waitForSelector('.celebration');await settle(p);await p.screenshot({path:`out/${dir}/stills/moment-reward-1366x768.png`,fullPage:true});
 await p.selectOption('#theme','1');await p.waitForTimeout(140);await p.screenshot({path:`out/${dir}/stills/moment-weather-1366x768.png`,fullPage:true});await settle(p);await p.selectOption('#theme','0');await p.keyboard.press('Escape');
 // Fully populated home collections demonstrate all six distinct, session-only discoveries.
 await p.emulateMedia({reducedMotion:'reduce'});for(const letter of ['A','T','P','I','M']){await p.locator(`[data-letter="${letter}"]`).click();await p.locator('[data-action="match"]').click();await p.waitForSelector('.choices');await p.locator(`[data-answer="${letter}"]`).click();await p.waitForSelector('.celebration');await p.keyboard.press('Escape');}
 for(const [width,height] of [[1366,768],[390,844]]){await p.setViewportSize({width,height});await p.screenshot({path:`out/${dir}/stills/collection-full-${width}x${height}.png`,fullPage:true});}
 report.push({dir,collection:await p.locator('.collection-slot.collected').count(),normalMotionRewardCaptured:true,themeWeatherCaptured:true});await c.close();console.log('Moments captured',dir);}}finally{await b.close();await fs.writeFile('out/_qa/moments-report.json',JSON.stringify(report,null,2));}

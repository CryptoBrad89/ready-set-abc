import {chromium} from 'playwright';import fs from 'node:fs/promises';import path from 'node:path';import {execFileSync} from 'node:child_process';
process.env.TMPDIR=path.resolve('out/_qa/tmp');await fs.mkdir(process.env.TMPDIR,{recursive:true});
const b=await chromium.launch({headless:true,args:['--no-sandbox']});const clips=[];
try{for(const dir of (process.argv.length>2?process.argv.slice(2):['v1-letter-post','v3-moonboat'])){
 const temp=path.resolve('out/_qa/video-'+dir);await fs.mkdir(temp,{recursive:true});const c=await b.newContext({viewport:{width:1180,height:820},recordVideo:{dir:temp,size:{width:1180,height:820}}});const p=await c.newPage();
 await p.goto('file://'+path.resolve('out',dir,'index.html'));await p.evaluate(()=>document.fonts.ready);
 await p.waitForTimeout(2700);await p.locator('[data-letter="S"]').click();await p.waitForTimeout(2600);
 await p.locator('#mute').click();await p.locator('[data-action="match"]').click();await p.waitForTimeout(650);
 const wrong=p.locator('.choice:not([data-answer="S"])').first();await wrong.click();await p.waitForFunction(()=>!document.querySelector('.choice[aria-disabled]'));await p.waitForTimeout(400);
 await wrong.click();await p.waitForFunction(()=>!document.querySelector('.choice[aria-disabled]'));await p.waitForTimeout(1300);
 await p.locator('[data-answer="S"]').click();await p.waitForSelector('.celebration');await p.waitForTimeout(2600);
 await p.locator('[data-action="home"]').first().click();await p.waitForTimeout(1700);
 await p.selectOption('#theme',dir==='v3-moonboat'?'1':'2');await p.waitForTimeout(2300);
 const video=p.video();await c.close();const src=await video.path();const output=path.resolve('out',dir,'motion.mp4');
 execFileSync('ffmpeg',['-v','error','-y','-i',src,'-an','-c:v','libx264','-pix_fmt','yuv420p','-crf','24','-preset','medium','-movflags','+faststart','-r','30',output]);
 const probe=JSON.parse(execFileSync('ffprobe',['-v','quiet','-show_format','-show_streams','-of','json',output]));clips.push({dir,source:'Playwright recordVideo on file://',moments:['intro','letter pick','miss','two-miss hint','correct','celebration','collection','theme switch'],size:(await fs.stat(output)).size,duration:probe.format.duration,codec:probe.streams[0].codec_name,pixelFormat:probe.streams[0].pix_fmt,faststart:true,silent:true});await fs.rm(temp,{recursive:true});console.log('Recorded',dir,clips.at(-1));
}}finally{await b.close();await fs.writeFile('out/_qa/video-report.json',JSON.stringify(clips,null,2));}

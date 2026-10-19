'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const root = path.resolve(__dirname, '..');
const shots = '/workspace/rsabc-grownups';
const alphabet = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
let playwright;
try { playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright'); }
catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
  playwright = require('/usr/local/lib/pnpm/5/.pnpm/node_modules/playwright');
}
const url = world => pathToFileURL(path.join(root, world, 'index.html')).href;
const screen = (page, value) => page.waitForFunction(value => document.body.dataset.screen === value, value);
const shelf = page => page.locator('[data-letter]').evaluateAll(nodes => nodes.map(node => node.dataset.letter));
async function enter(page) {
  await page.locator('#grownups-entry').click();
  await page.locator('#grownups-answer').waitFor({state:'visible'});
  const words = ['zero','one','two','three','four','five','six','seven','eight','nine'];
  const prompt = await page.locator('#grownups-challenge strong').textContent();
  const answer = prompt.split(' · ').map(word => words.indexOf(word)).join('');
  await page.locator('#grownups-answer').fill(answer);
  await page.getByRole('button', {name:'Continue',exact:true}).click();
  await page.locator('#grownups-settings').waitFor({state:'visible'});
}
async function selectOne(page, letter) {
  await page.getByRole('button', {name:'Clear selection',exact:true}).click();
  await page.locator(`[name="grownups-letter"][value="${letter}"]`).check();
}
async function save(page) {
  await page.getByRole('button', {name:'Save and return',exact:true}).click();
  await page.locator('#grownups-dialog').waitFor({state:'hidden'});
}
async function run() {
  fs.mkdirSync(shots, {recursive:true});
  const browser = await playwright.chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE || '/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
  try {
    const context = await browser.newContext({viewport:{width:320,height:640},reducedMotion:'reduce'});
    const page = await context.newPage(), errors=[];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url('v1-letter-post')); await enter(page);
    assert(await page.locator('.grownups-letters label').evaluateAll(nodes => nodes.every(node => {
      const box=node.getBoundingClientRect(); return box.width>=44 && box.height>=44;
    })), 'Narrow-screen letter targets stay at least 44px');
    await page.screenshot({path:path.join(shots,'narrow-320-settings.png')});
    await selectOne(page,'Q'); await page.locator('#grownups-sound').uncheck(); await save(page);
    await page.locator('[data-letter="Q"]').click(); await screen(page,'listen');
    await page.locator('[data-action="match"]').click(); await screen(page,'match');
    await page.locator('[data-answer="Q"]').click(); await screen(page,'celebrate');
    await page.locator('[data-action="next"]').click(); await screen(page,'listen');
    assert.match(await page.locator('.listen-letter').getAttribute('aria-label'), /letter Q /);
    await page.goto(url('v3-moonboat')); assert.deepEqual(await shelf(page),alphabet);
    assert.equal(await page.locator('#mute').getAttribute('aria-pressed'),'false');
    await page.goto(url('v4-silk-thread')); assert.deepEqual(await shelf(page),alphabet);
    await page.goto(url('v1-letter-post')); assert.deepEqual(await shelf(page),['Q']);
    await page.locator('#mute').click();
    await page.reload(); assert.equal(await page.locator('#mute').getAttribute('aria-pressed'),'false');
    await enter(page); await selectOne(page,'Z'); await page.keyboard.press('Escape');
    await enter(page); assert.equal(await page.locator('[name="grownups-letter"][value="Q"]').isChecked(),true);
    assert.equal(await page.locator('[name="grownups-letter"][value="Z"]').isChecked(),false);
    await page.getByRole('button',{name:'Close',exact:true}).click();
    assert.deepEqual(errors,[]); await context.close();
    console.log('PASS narrow layout, one-letter wrap, per-world isolation, child mute persistence and Escape draft cancellation');

    for (const value of [null, {}, {version:1,letters:[],sound:true}, {version:1,letters:['A','A'],sound:true}, {version:1,letters:['?'],sound:true}, {version:1,letters:['A'],sound:'yes'}]) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.addInitScript(value => localStorage.setItem('little-woof-post-settings',JSON.stringify(value)),value);
      await page.goto(url('v1-letter-post')); assert.deepEqual(await shelf(page),alphabet);
      await context.close();
    }
    console.log('PASS invalid stored settings fall back to the full alphabet');

    for (const world of ['v1-letter-post','v3-moonboat','v4-silk-thread']) {
      const context=await browser.newContext({reducedMotion:'no-preference'}), page=await context.newPage(), errors=[];
      page.on('pageerror', error=>errors.push(error.message));
      await page.goto(url(world));
      await page.locator('[data-letter="B"]').click(); await screen(page,'listen');
      await page.waitForFunction(()=>document.body.classList.contains('talking'));
      await enter(page);
      assert.equal(await page.locator('body').evaluate(node=>node.classList.contains('talking')),false);
      await page.getByRole('button',{name:'Close',exact:true}).click();
      await page.locator('#mute').click();
      await page.locator('[data-letter="B"]').click(); await screen(page,'listen');
      await page.waitForFunction(()=>!document.body.dataset.effect);
      await page.locator('[data-action="match"]').click(); await screen(page,'match');
      await page.waitForFunction(()=>!document.body.dataset.effect);
      await page.locator('[data-answer="B"]').click();
      await enter(page);
      await page.waitForFunction(()=>!document.body.dataset.effect);
      assert.equal(await page.locator('body').getAttribute('data-screen'),'home');
      await page.getByRole('button',{name:'Close',exact:true}).click();
      await page.locator('[data-letter="X"]').click(); await screen(page,'listen');
      await page.waitForFunction(()=>!document.body.dataset.effect);
      await page.locator('[data-action="match"]').click(); await screen(page,'match');
      await page.waitForFunction(()=>!document.body.dataset.effect);
      await page.locator('[data-answer="X"]').click(); await screen(page,'celebrate');
      assert.deepEqual(errors,[]); await context.close();
      console.log(`PASS ${world}: opening during voice and answer animation cancels pending work; play resumes`);
    }
  } finally {await browser.close();}
}
run().catch(error=>{console.error(error);process.exitCode=1;});

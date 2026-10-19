'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const root = path.resolve(__dirname, '..');
const shots = '/workspace/rsabc-grownups';
const alphabet = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
const worlds = [['v1-letter-post', 'post'], ['v3-moonboat', 'space'], ['v4-silk-thread', 'silk']];
const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
function playwright() {
  if (process.env.PLAYWRIGHT_MODULE) return require(process.env.PLAYWRIGHT_MODULE);
  try { return require('playwright'); } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
    return require('/usr/local/lib/pnpm/5/.pnpm/node_modules/playwright');
  }
}
const screen = (page, value) => page.waitForFunction(value => document.body.dataset.screen === value, value);
async function open(page) {
  await page.locator('#grownups-entry').click();
  await page.locator('#grownups-answer').waitFor({state: 'visible'});
}
async function unlock(page) {
  const prompt = (await page.locator('#grownups-challenge strong').textContent()).toLowerCase();
  const digits = (prompt.match(/\b(zero|one|two|three|four|five|six|seven|eight|nine)\b/g) || []).map(word => words.indexOf(word)).join('');
  assert.equal(digits.length, 3, 'Gate has three readable number words');
  await page.locator('#grownups-answer').fill(digits);
  await page.getByRole('button', {name: 'Continue', exact: true}).click();
  await page.locator('#grownups-settings').waitFor({state: 'visible'});
}
async function choose(page, letters) {
  await page.getByRole('button', {name: 'Clear selection', exact: true}).click();
  for (const letter of letters) await page.locator(`input[name="grownups-letter"][value="${letter}"]`).check();
}
async function save(page) {
  await page.getByRole('button', {name: 'Save and return', exact: true}).click();
  await page.locator('#grownups-dialog').waitFor({state: 'hidden'});
  await screen(page, 'home');
}
async function shelf(page, expected) {
  assert.deepEqual(await page.locator('[data-letter]').evaluateAll(nodes => nodes.map(node => node.dataset.letter)), expected);
}
async function fits(page) {
  assert.deepEqual(await page.evaluate(() => {
    const issues = [];
    const dialog = document.querySelector('#grownups-dialog');
    const box = dialog.getBoundingClientRect();
    if (box.left < -1 || box.right > innerWidth + 1) issues.push('Dialog exceeds viewport');
    if (dialog.scrollWidth > dialog.clientWidth + 1) issues.push('Dialog content overflows horizontally');
    for (const node of dialog.querySelectorAll('button, select, input:not([type=checkbox]), .grownups-letters label, .grownups-sound')) {
      if (!node.getClientRects().length) continue;
      const rect = node.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) issues.push('Small control: ' + (node.id || node.textContent));
    }
    return issues;
  }), []);
}
async function match(page, letter) {
  await page.locator(`[data-letter="${letter}"]`).click();
  await screen(page, 'listen');
  await page.locator('[data-action="match"]').click();
  await screen(page, 'match');
  await page.locator(`[data-answer="${letter}"]`).click();
  await screen(page, 'celebrate');
}
async function run() {
  fs.mkdirSync(shots, {recursive: true});
  const browser = await playwright().chromium.launch({headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE || '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-dev-shm-usage']});
  try {
    for (const [world, kind] of worlds) {
      for (const width of [390, 768, 1440]) {
        const context = await browser.newContext({viewport: {width, height: width === 390 ? 844 : 1024}, reducedMotion: 'reduce'});
        const page = await context.newPage(), errors = [], network = [];
        page.on('pageerror', error => errors.push(error.message));
        await context.route(/^https?:/, route => { network.push(route.request().url()); return route.abort(); });
        const prefix = `${world}-${width}`;
        await page.goto(pathToFileURL(path.join(root, world, 'index.html')).href);
        await screen(page, 'home');
        await open(page);
        await fits(page);
        await page.screenshot({path: path.join(shots, `${prefix}-gate.png`), fullPage: false});
        await page.locator('#grownups-answer').fill('000');
        await page.getByRole('button', {name: 'Continue', exact: true}).click();
        assert(await page.locator('#grownups-gate-error').textContent(), 'Wrong answer has a written error');
        assert.equal(await page.locator('#grownups-settings').isVisible(), false);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#grownups-dialog').isVisible(), false);
        assert.equal(await page.locator('#grownups-entry').evaluate(node => node === document.activeElement), true);
        await open(page); await unlock(page); await fits(page);
        await page.screenshot({path: path.join(shots, `${prefix}-settings.png`), fullPage: false});
        for (let i = 0; i < 35; i++) {
          await page.keyboard.press('Tab');
          assert(await page.evaluate(() => document.activeElement === document.body || document.querySelector('#grownups-dialog').contains(document.activeElement)), 'Background controls cannot receive focus while modal is open');
        }
        await choose(page, []);
        await page.getByRole('button', {name: 'Save and return', exact: true}).click();
        assert(await page.locator('#grownups-letters-error').textContent(), 'Empty letter selection is rejected');
        for (const letter of ['B', 'X']) await page.locator(`input[name="grownups-letter"][value="${letter}"]`).check();
        await page.locator('#grownups-sound').uncheck();
        await page.locator('#grownups-theme').selectOption('2');
        await page.screenshot({path: path.join(shots, `${prefix}-selection.png`), fullPage: false});
        await save(page); await shelf(page, ['B', 'X']);
        assert.equal(await page.locator('#mute').getAttribute('aria-pressed'), 'true');
        assert.equal(await page.locator('#theme').inputValue(), '2');
        await page.reload(); await screen(page, 'home'); await shelf(page, ['B', 'X']);
        assert.equal(await page.locator('#mute').getAttribute('aria-pressed'), 'true');
        assert.equal(await page.locator('#theme').inputValue(), '2');
        await open(page); await unlock(page);
        await choose(page, ['Z']); await page.locator('#grownups-sound').check();
        await page.getByRole('button', {name: 'Cancel', exact: true}).click();
        await shelf(page, ['B', 'X']);
        assert.equal(await page.locator('#mute').getAttribute('aria-pressed'), 'true');
        await match(page, 'B');
        assert.match(await page.locator('.collection-heading').textContent(), /1 of 26/);
        await page.locator('[data-action="next"]').click(); await screen(page, 'listen');
        assert.match(await page.locator('.listen-letter').getAttribute('aria-label'), /letter X /);
        await page.locator('[data-action="match"]').click(); await screen(page, 'match');
        await page.locator('[data-answer="X"]').click(); await screen(page, 'celebrate');
        await page.locator('[data-action="next"]').click(); await screen(page, 'listen');
        assert.match(await page.locator('.listen-letter').getAttribute('aria-label'), /letter B /);
        await open(page); await screen(page, 'home'); await unlock(page);
        assert.match(await page.locator('.grownups-visit strong').textContent(), /^2 of 26/);
        await page.locator('.grownups-visit').scrollIntoViewIfNeeded();
        await page.screenshot({path: path.join(shots, `${prefix}-visit.png`), fullPage: false});
        await page.getByRole('button', {name: 'All letters', exact: true}).click();
        await save(page); await shelf(page, alphabet);
        await page.screenshot({path: path.join(shots, `${prefix}-home.png`), fullPage: false});
        assert.deepEqual(errors, [], prefix + ' has no browser errors');
        assert.deepEqual(network, [], prefix + ' requires no network');
        await context.close();
        console.log(`PASS ${prefix}: gate, focus, validation, save/cancel, reload, selection cycle, collection, offline and layout`);
      }
    }
    for (const mode of ['denied', 'corrupt']) {
      const context = await browser.newContext({reducedMotion: 'reduce'});
      const page = await context.newPage();
      await page.addInitScript(mode => {
        if (mode === 'denied') {
          Storage.prototype.getItem = () => { throw new DOMException('Storage blocked', 'SecurityError'); };
          Storage.prototype.setItem = () => { throw new DOMException('Storage blocked', 'SecurityError'); };
        } else {
          localStorage.setItem('little-woof-post-settings', '{broken');
        }
      }, mode);
      await page.goto(pathToFileURL(path.join(root, 'v1-letter-post/index.html')).href);
      await screen(page, 'home'); await shelf(page, alphabet);
      await open(page); await unlock(page); await choose(page, ['Q']);
      await page.locator('#grownups-sound').uncheck(); await save(page); await shelf(page, ['Q']);
      if (mode === 'denied') assert.match(await page.locator('#storage').textContent(), /visit/i);
      await page.screenshot({path: path.join(shots, `storage-${mode}.png`), fullPage: false});
      await context.close();
      console.log(`PASS storage ${mode}: usable defaults and current-visit settings`);
    }
  } finally { await browser.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });

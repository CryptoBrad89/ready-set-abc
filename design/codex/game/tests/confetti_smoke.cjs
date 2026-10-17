'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
function playwright() {
  if (process.env.PLAYWRIGHT_MODULE) return require(process.env.PLAYWRIGHT_MODULE);
  try {return require('playwright');} catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
    return require('/usr/local/lib/pnpm/5/.pnpm/node_modules/playwright');
  }
}
(async () => {
  const shots = '/tmp/rsabc-confetti';
  fs.mkdirSync(shots, {recursive: true});
  const browser = await playwright().chromium.launch({headless: true,
    executablePath: process.env.CHROMIUM_EXECUTABLE || '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage']});
  let cases = 0;
  try {
    for (const game of ['v1-letter-post', 'v3-moonboat']) {
      for (const viewport of [{width: 390, height: 844}, {width: 1920, height: 1080}]) {
        for (let theme = 0; theme < 3; theme++) {
          const context = await browser.newContext({viewport, reducedMotion: 'no-preference'});
          const errors = [], network = [];
          await context.route(/^https?:/, route => {network.push(route.request().url()); return route.abort();});
          const page = await context.newPage();
          page.on('pageerror', error => errors.push(error.message));
          const screen = value => page.waitForFunction(value => document.body.dataset.screen === value, value);
          const settled = () => page.waitForFunction(() => !document.body.dataset.effect && !document.body.classList.contains('talking'));
          const prefix = `${game}-${viewport.width}-theme${theme}`;
          try {
            await page.goto(pathToFileURL(path.resolve(__dirname, '..', game, 'index.html')).href);
            await screen('home');
            await page.selectOption('#theme', String(theme)); await settled();
            await page.locator('#mute').click();
            await page.locator('[data-letter="B"]').click(); await screen('listen'); await settled();
            await page.locator('[data-action="match"]').click(); await screen('match');
            await page.locator('[data-answer="B"]').click(); await screen('celebrate');
            await page.waitForFunction(() => {
              const group = document.querySelector('#confetti>div');
              return group && Number(getComputedStyle(group).opacity) >= .95;
            });
            const pieces = await page.locator('#confetti i').evaluateAll(nodes => nodes.map(node => {
              const style = getComputedStyle(node), rect = node.getBoundingClientRect();
              let opacity = 1;
              for (let parent = node; parent; parent = parent.parentElement) opacity *= Number(getComputedStyle(parent).opacity);
              return {background: style.backgroundColor, image: style.backgroundImage, opacity,
                painted: style.display !== 'none' && style.visibility === 'visible',
                x: rect.x, y: rect.y, width: rect.width, height: rect.height};
            }));
            assert.equal(pieces.length, 6, `${prefix}: six reward confetti pieces`);
            for (const piece of pieces) {
              assert(piece.background !== 'rgba(0, 0, 0, 0)' || piece.image !== 'none', `${prefix}: confetti must have painted color`);
              assert(piece.painted && piece.opacity >= .9, `${prefix}: confetti must be visible`);
              assert(piece.width >= 18 && piece.height >= 18, `${prefix}: confetti must be large enough to notice`);
              assert(piece.x >= 0 && piece.x + piece.width <= viewport.width && piece.y >= 0 && piece.y + piece.height <= viewport.height,
                `${prefix}: confetti must be inside the viewport`);
            }
            await page.screenshot({path: path.join(shots, `${prefix}-visible.png`)});
            if (theme === 0) {
              await page.waitForFunction(() => !document.querySelector('#confetti i'));
              assert.equal(await page.locator('#confetti i').count(), 0, 'Finished confetti is removed');
            } else {
              await page.emulateMedia({reducedMotion: 'reduce'});
              await page.waitForFunction(() => !document.querySelector('#confetti i'));
              assert.equal(await page.locator('#confetti i').count(), 0, 'Reduced motion clears confetti');
            }
            await page.locator('[data-action="next"]').click(); await screen('listen');
            assert.equal(await page.locator('#confetti i').count(), 0, 'Confetti never leaks to the next route');
            assert.deepEqual(errors, [], `${prefix}: browser errors`);
            assert.deepEqual(network, [], `${prefix}: unexpected network requests`);
            cases++;
            console.log(`PASS ${prefix}: painted on-screen confetti, screenshot, cleanup and navigation`);
          } finally {await context.close();}
        }
      }
    }
    console.log(`PASS ${cases} confetti cases; screenshots: ${shots}`);
  } finally {await browser.close();}
})().catch(error => {console.error(error); process.exitCode = 1;});

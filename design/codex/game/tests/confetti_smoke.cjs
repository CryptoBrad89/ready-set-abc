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
  const shots = '/workspace/rsabc-confetti/v2';
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
            await page.waitForFunction(() => [...document.querySelectorAll('#confetti [data-paper]')].filter(node => {
              const rect = node.getBoundingClientRect();
              return Number(getComputedStyle(node).opacity) >= .85 && rect.width >= 14 && rect.height >= 14 &&
                rect.x >= 0 && rect.right <= innerWidth && rect.y >= 0 && rect.bottom <= innerHeight;
            }).length >= 8);
            const sample = () => page.locator('#confetti [data-paper]').evaluateAll(nodes => nodes.map(node => {
              const rect = node.getBoundingClientRect(), svg = node.querySelector('svg');
              const painted = svg && [...svg.querySelectorAll('path,rect,circle,ellipse,polygon')].some(part => {
                const style = getComputedStyle(part);
                return (style.fill !== 'none' && style.fill !== 'rgba(0, 0, 0, 0)') ||
                  (style.stroke !== 'none' && style.stroke !== 'rgba(0, 0, 0, 0)');
              });
              return {shape: node.dataset.paper, painted: Boolean(painted), x: rect.x, y: rect.y,
                width: rect.width, height: rect.height, opacity: Number(getComputedStyle(node).opacity)};
            }));
            const first = await sample();
            assert.equal(first.length, 12, `${prefix}: bounded paper confetti pieces`);
            assert(new Set(first.map(piece => piece.shape)).size >= 3, `${prefix}: world-themed shape variety`);
            assert(first.every(piece => piece.painted), `${prefix}: SVG paper must have painted color`);
            await page.waitForTimeout(120);
            const second = await sample();
            const falling = second.map((piece, index) => ({dx: piece.x - first[index].x, dy: piece.y - first[index].y}));
            assert(falling.filter(delta => delta.dy > 1).length >= 8, `${prefix}: paper falls visibly`);
            assert(new Set(falling.map(delta => Math.round(delta.dx))).size >= 4, `${prefix}: pieces flutter independently`);
            const fades = await page.locator('#confetti [data-paper]').evaluateAll(nodes => nodes.every(node =>
              node.getAnimations().some(animation => {
                const frames = animation.effect.getKeyframes();
                return frames[0].opacity === '0' && frames.at(-1).opacity === '0' && animation.effect.getTiming().iterations === 1;
              })));
            assert(fades, `${prefix}: every piece has a finite entry and exit`);
            await page.waitForTimeout(250);
            await page.screenshot({path: path.join(shots, `${prefix}-mid-fall.png`)});
            if (theme === 0) {
              await page.waitForFunction(() => !document.querySelector('#confetti [data-particle]'));
              assert.equal(await page.locator('#confetti [data-particle]').count(), 0, 'Finished confetti is removed');
            } else if (theme === 1) {
              await page.emulateMedia({reducedMotion: 'reduce'});
              await page.waitForFunction(() => !document.querySelector('#confetti [data-particle]'));
              assert.equal(await page.locator('#confetti [data-particle]').count(), 0, 'Reduced motion clears confetti');
            }
            await page.locator('[data-action="next"]').click(); await screen('listen');
            assert.equal(await page.locator('#confetti [data-particle]').count(), 0, 'Confetti never leaks to the next route');
            assert.deepEqual(errors, [], `${prefix}: browser errors`);
            assert.deepEqual(network, [], `${prefix}: unexpected network requests`);
            cases++;
            console.log(`PASS ${prefix}: themed paper, independent fall/flutter, entry/exit, screenshot and cleanup`);
          } finally {await context.close();}
        }
      }
    }
    console.log(`PASS ${cases} confetti cases; screenshots: ${shots}`);
  } finally {await browser.close();}
})().catch(error => {console.error(error); process.exitCode = 1;});

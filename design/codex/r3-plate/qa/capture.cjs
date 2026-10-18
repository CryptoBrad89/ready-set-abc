const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/usr/local/lib/pnpm/5/.pnpm/playwright-core@1.59.1/node_modules/playwright-core');
const root = path.resolve(__dirname, '..');
const routes = ['home', 'trail', 'listen', 'celebrate', 'grownups'];
const themes = ['pink', 'purple', 'yellow'];
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const issues = [], errors = [], requests = [];
  for (const [width, height, tag] of [[1180,820,'tablet-1180x820'],[390,844,'phone-390x844'],[1920,1080,'whiteboard-1920x1080']]) {
    const page = await browser.newPage({ viewport: {width,height} });
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => { if (/^https?:/.test(r.url())) requests.push(r.url()); });
    await page.goto(pathToFileURL(path.join(root,'index.html')).href);
    await page.evaluate(() => document.fonts.ready);
    for (const theme of themes) {
      await page.locator(`[data-theme-choice="${theme}"]`).click();
      for (const route of routes) {
        await page.evaluate(route => location.hash = route, route);
        await page.waitForFunction(route => document.body.dataset.current === route, route);
        await page.waitForTimeout(1200);
        const findings = await page.evaluate(() => {
          const bad = [];
          const nav = document.querySelector('.proto').getBoundingClientRect();
          const visible = e => e.getClientRects().length > 0;
          for (const e of [...document.querySelectorAll('button')].filter(visible)) {
            const r = e.getBoundingClientRect();
            const label = e.textContent.trim() || e.getAttribute('aria-label');
            if (r.width < 59.5 || r.height < 59.5) bad.push(`small control ${label}: ${r.width} x ${r.height}`);
            if (r.left < -1 || r.right > innerWidth+1 || r.top < -1 || r.bottom > innerHeight+1) bad.push(`outside viewport ${label}`);
            if(e.closest('.screen') && r.bottom > nav.top - 3) bad.push(`control overlaps nav ${label}: ${r.bottom} > ${nav.top}`);
          }
          for (const e of [...document.querySelectorAll('.screen.is-on h1,.screen.is-on h2,.screen.is-on p,.screen.is-on .lucy-float,.screen.is-on .portrait,.screen.is-on .reward-label')].filter(visible)) {
            const r=e.getBoundingClientRect();
            if(r.bottom > nav.top-2 || r.right > innerWidth+1 || r.left < -1) bad.push(`content boundary ${e.className}: bottom ${r.bottom}, nav ${nav.top}`);
          }
          if(document.documentElement.scrollWidth > innerWidth) bad.push('horizontal overflow');
          return bad;
        });
        issues.push(...findings.map(f=>`${theme}/${route}/${tag}: ${f}`));
        if(width !== 1920 || route === 'home') await page.screenshot({path:path.join(root,'stills',`${theme}-${route}-${tag}.png`)});
      }
    }
    await page.close();
  }
  await browser.close();
  const report = {compositionsChecked:45, requiredStills:30, extraWhiteboardHomeStills:3, issues, errors, networkRequests:requests};
  fs.writeFileSync(path.join(__dirname,'layout-report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
  if(issues.length || errors.length || requests.length) process.exitCode=1;
})();

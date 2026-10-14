#!/usr/bin/env node
/* One-off screenshots for Codex re-check. Run from repo: node app/scripts/codex-recheck-shots.mjs */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const APP = join(__dirname, '..');
const STORE = '/Users/bradley/Library/Application Support/Cursor/AgentStores/cursor_agent_stores/bc-69cca2ee-086d-4958-861f-572ca096de17/files/media/codex-recheck';
mkdirSync(STORE, { recursive: true });

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4', '.wav': 'audio/wav', '.ico': 'image/x-icon',
};

function serve(port) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const path = join(APP, decodeURIComponent((req.url || '/').split('?')[0]));
      if (!path.startsWith(APP) || !existsSync(path)) {
        res.writeHead(404); res.end(); return;
      }
      const body = readFileSync(path);
      res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' });
      res.end(body);
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function smoke(page, port, query) {
  await page.goto(`http://127.0.0.1:${port}/_smoke.html?${query}`);
  await page.waitForURL(/index\.html/, { timeout: 15000 });
  await page.waitForSelector('.app', { timeout: 15000 });
}

async function seedFreeTrail(page, port) {
  await page.goto(`http://127.0.0.1:${port}/_smoke.html?reset=1&kid=k01`);
  await page.waitForFunction(() => location.pathname.endsWith('index.html'));
  await page.evaluate(async () => {
    const res = await fetch('/data/roster.json');
    const data = await res.json();
    const kids = data.kids.map((k) => (k.id === 'k01' ? { ...k, workMode: 'free' } : k));
    localStorage.setItem('rsabc.roster', JSON.stringify(kids));
    const s = JSON.parse(localStorage.getItem('rsabc.settings') || '{}') || {};
    s.cloudUnlock = 5;
    localStorage.setItem('rsabc.settings', JSON.stringify(s));
    localStorage.setItem('rsabc.kid', JSON.stringify('k01'));
    localStorage.setItem('rsabc.session', JSON.stringify('child'));
  });
  await page.goto(`http://127.0.0.1:${port}/index.html#/trail`);
  await page.waitForSelector('.trail-board.cloud-letters', { timeout: 15000 });
}

async function runCelebrate(page, port) {
  await smoke(page, port, 'classroom=1&kid=k01&play=A');
  await page.waitForFunction(() => location.hash.includes('letter/A'), { timeout: 10000 });
  await page.evaluate(async () => {
    const round = await import('/js/round.js');
    const advanceToCelebrate = () => {
      const r = round.getRound();
      if (!r || r.step === 'celebrate') return;
      if (!r.trial) round.buildTrial();
      if (r.step === 'meet') {
        round.continueBeat();
        round.advance();
        return advanceToCelebrate();
      }
      if (r.step === 'choose') {
        const targets = (r.trial.choices || []).filter((c) => c.target);
        targets.forEach((c) => {
          if (!r.trial.found.includes(c.id)) round.tapChoose(c.id);
        });
        if (r.trial.locked) round.advance();
        return advanceToCelebrate();
      }
      if (r.step === 'listen') {
        const pic = (r.trial.pictures || []).find((p) => p.target);
        if (pic) round.tapListen(pic.choiceId);
        if (r.trial.locked) round.advance();
        return advanceToCelebrate();
      }
      if (r.step === 'payoff') {
        round.continueBeat();
        round.advance();
      }
    };
    advanceToCelebrate();
    location.hash = '#/play';
  });
  await page.waitForSelector('body[data-screen="celebrate"]', { timeout: 12000 });
  await page.waitForSelector('.celebrate .trophy', { timeout: 8000 });
  await page.waitForTimeout(500);
}

async function openGrownupsDevice(page, port) {
  await smoke(page, port, 'gu=device');
  await page.waitForSelector('.gate-sheet, .gate-pad', { timeout: 8000 });
  for (const d of ['1', '2', '3', '4']) {
    await page.getByRole('button', { name: d, exact: true }).click();
  }
  await page.waitForSelector('.gu-tab', { timeout: 8000 });
  await page.getByRole('tab', { name: /Device/i }).click();
  await page.waitForSelector('.gu-panel', { timeout: 8000 });
}

const port = 4174;
const server = await serve(port);
const browser = await chromium.launch();
try {
  const shotsOnly = process.env.SHOTS?.split(',').map((s) => s.trim()).filter(Boolean);
  const shots = [
    {
      name: '01-trail-freeplay-1180x820.png',
      w: 1180, h: 820,
      run: async (page) => {
        await seedFreeTrail(page, port);
        await page.waitForTimeout(400);
      },
    },
    {
      name: '02-home-landscape-844x390.png',
      w: 844, h: 390,
      run: async (page) => { await smoke(page, port, 'kid=k01'); },
    },
    {
      name: '03-home-phone-390x844.png',
      w: 390, h: 844,
      run: async (page) => {
        await page.goto(`http://127.0.0.1:${port}/_smoke.html?reset=1&kid=k01`);
        await page.waitForURL(/index\.html/);
        await page.evaluate(() => sessionStorage.setItem('rsabc.rotateHint', '1'));
        await page.reload();
        await page.waitForSelector('.hub-row--phonics', { timeout: 10000 });
      },
    },
    {
      name: '04-grownups-device-844x390.png',
      w: 844, h: 390,
      run: async (page) => { await openGrownupsDevice(page, port); },
    },
    {
      name: '05-celebrate-1180x820.png',
      w: 1180, h: 820,
      run: async (page) => { await runCelebrate(page, port); await page.waitForTimeout(600); },
    },
  ];

  const list = shotsOnly?.length
    ? shots.filter((s) => shotsOnly.some((k) => s.name.includes(k)))
    : shots;
  for (const shot of list) {
    const context = await browser.newContext({ viewport: { width: shot.w, height: shot.h } });
    const page = await context.newPage();
    await shot.run(page);
    await page.screenshot({ path: join(STORE, shot.name), fullPage: false });
    await context.close();
    console.log('wrote', join(STORE, shot.name));
  }
} finally {
  await browser.close();
  server.close();
}

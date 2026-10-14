#!/usr/bin/env node
/* Codex pass 2 screenshots → agent store media/codex-recheck3/ */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const APP = join(__dirname, '..');
const STORE = '/Users/bradley/Library/Application Support/Cursor/AgentStores/cursor_agent_stores/bc-69cca2ee-086d-4958-861f-572ca096de17/files/media/codex-recheck3';
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
}

async function advanceToListenS(page) {
  await page.evaluate(async () => {
    const round = await import('/js/round.js');
    round.startRound({ startAt: 'S', step: 'listen', mode: 'once' });
    if (!round.getRound().trial) round.buildTrial();
    location.hash = '#/play';
  });
  await page.waitForSelector('body[data-screen="listen"]', { timeout: 12000 });
  await page.waitForSelector('.stage-listen-pic', { timeout: 8000 });
  await page.waitForTimeout(400);
}

async function openMeetS(page, port) {
  await smoke(page, port, 'kid=k01');
  await page.evaluate(() => {
    const round = window.__rsabcRound || null;
  });
  await page.evaluate(async () => {
    const round = await import('/js/round.js');
    round.startRound({ startAt: 'S', step: 'meet', mode: 'once' });
    location.hash = '#/play';
  });
  await page.waitForSelector('body[data-screen="meet"]', { timeout: 12000 });
  await page.waitForSelector('.stage-hang--hero', { timeout: 8000 });
  await page.waitForTimeout(300);
}

async function runCelebrate(page, port) {
  await smoke(page, port, 'classroom=1&kid=k01&play=S');
  await page.waitForFunction(() => location.hash.includes('letter/S'), { timeout: 10000 });
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
  await page.waitForSelector('.cta--next', { timeout: 8000 });
  await page.waitForTimeout(500);
}

const port = 4175;
const server = await serve(port);
const browser = await chromium.launch();
try {
  const shots = [
    {
      name: '01-listen-390x844.png',
      w: 390, h: 844,
      run: async (page) => {
        await seedFreeTrail(page, port);
        await advanceToListenS(page);
      },
    },
    {
      name: '02-meet-844x390.png',
      w: 844, h: 390,
      run: async (page) => { await openMeetS(page, port); },
    },
    {
      name: '03-trail-free-phone-390x844.png',
      w: 390, h: 844,
      run: async (page) => {
        await seedFreeTrail(page, port);
        await page.goto(`http://127.0.0.1:${port}/index.html#/trail`);
        await page.waitForSelector('.trail-board.cloud-letters', { timeout: 15000 });
        await page.locator('.trail-board.cloud-letters').evaluate((el) => {
          el.scrollTop = el.scrollHeight;
        });
        await page.waitForTimeout(400);
      },
    },
    {
      name: '04-trail-free-landscape-844x390.png',
      w: 844, h: 390,
      run: async (page) => {
        await seedFreeTrail(page, port);
        await page.goto(`http://127.0.0.1:${port}/index.html#/trail`);
        await page.waitForSelector('.trail-board.cloud-letters', { timeout: 15000 });
        await page.locator('.trail-board.cloud-letters').evaluate((el) => {
          el.scrollTop = el.scrollHeight;
        });
        await page.waitForTimeout(400);
      },
    },
    {
      name: '05-celebrate-phone-390x844.png',
      w: 390, h: 844,
      run: async (page) => { await runCelebrate(page, port); },
    },
    {
      name: '06-celebrate-landscape-844x390.png',
      w: 844, h: 390,
      run: async (page) => { await runCelebrate(page, port); },
    },
  ];

  for (const shot of shots) {
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

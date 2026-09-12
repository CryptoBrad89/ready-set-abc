/* Dev-only gate. Parses every module as ESM and every data file as JSON.
   Run from app/:  node _check.mjs   (no dependencies, no network) */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync, existsSync } from 'node:fs';

const modules = [
  ...readdirSync('js').filter((f) => f.endsWith('.js')).map((f) => `js/${f}`),
  ...readdirSync('js/screens').filter((f) => f.endsWith('.js')).map((f) => `js/screens/${f}`),
  'sw.js',
];
const data = ['data/letters.json', 'data/roster.json', 'data/audio.json', 'data/clouds.json', 'manifest.webmanifest'];

let fail = 0;
function problem(msg) {
  fail += 1;
  console.error(msg);
}

mkdirSync('.check', { recursive: true });
for (const file of modules) {
  const tmp = `.check/${file.replace(/\//g, '_')}.mjs`;
  writeFileSync(tmp, readFileSync(file));
  try {
    execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' });
  } catch (err) {
    problem(`FAIL ${file}\n${err.stderr.toString()}`);
  }
}
rmSync('.check', { recursive: true, force: true });

for (const file of data) {
  try {
    JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    problem(`JSON FAIL ${file}: ${err.message}`);
  }
}

/* --- data/letters.json is the content, so gate the content ---------------
   Every letter is awake now, which means every one of these plates can turn
   up on a real board. The two failures that only show at the table are a
   picture whose word does not start with its own letter (the Sound Sort asks
   "does it start with /f/?" and the honest answer is no) and two letters
   sharing an emoji (a picture-match board deals the same plate twice and the
   child cannot be right). Neither is visible reading the file. */
const ALPHABET26 = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
const lettersJson = JSON.parse(readFileSync('data/letters.json', 'utf8'));
const letterList = lettersJson.letters || [];
if (letterList.map((l) => l.letter).join('') !== ALPHABET26.join('')) {
  problem(`data/letters.json must list A–Z in order (got ${letterList.map((l) => l.letter).join('')})`);
}
const emojiOwner = new Map();
const pictureIdOwner = new Map();
for (const entry of letterList) {
  const L = entry.letter;
  if (!entry.awake) problem(`${L} is not awake — every letter ships awake`);
  if (!entry.lower || entry.lower !== String(L).toLowerCase()) problem(`${L} has no matching lower case`);
  if (!entry.phoneme) problem(`${L} has no phoneme chip for the grown-up`);
  /* The one thing that must never reach a child's ear on a choice tap. */
  if (!entry.say || String(entry.say).toUpperCase() === L) {
    problem(`${L} say field is the letter name (${entry.say}) — say is the SOUND`);
  }
  const pool = entry.pictures || [];
  if (pool.length !== 15) problem(`${L} picture pool has ${pool.length} pictures (want 15)`);
  const words = new Set();
  for (const pic of pool) {
    if (!pic.id || !pic.word || !pic.emoji) {
      problem(`${L} has an incomplete picture: ${JSON.stringify(pic)}`);
      continue;
    }
    if (!/^[a-z0-9-]+$/.test(pic.id)) problem(`${L}/${pic.id} is not a plain lower-case id`);
    if (pic.word.charAt(0).toUpperCase() !== L) {
      problem(`${L} pool has "${pic.word}", which does not start with ${L}`);
    }
    if (words.has(pic.word.toLowerCase())) problem(`${L} pool lists "${pic.word}" twice`);
    words.add(pic.word.toLowerCase());
    if (pictureIdOwner.has(pic.id)) {
      problem(`picture id ${pic.id} is used by ${pictureIdOwner.get(pic.id)} and ${L}`);
    }
    pictureIdOwner.set(pic.id, L);
    if (emojiOwner.has(pic.emoji)) {
      problem(`${pic.emoji} is on two plates: ${emojiOwner.get(pic.emoji)} and ${L}/${pic.word}`);
    }
    emojiOwner.set(pic.emoji, `${L}/${pic.word}`);
  }
  /* The trail tile and the round have to show the same picture, or a child
     taps a moon and meets a mug. */
  const anchor = pool.find((pic) => pic.word === entry.word);
  if (!anchor) problem(`${L} stand-in word "${entry.word}" is not in its own pool`);
  else if (anchor.emoji !== entry.emoji) {
    problem(`${L} stand-in emoji ${entry.emoji} does not match ${anchor.word} ${anchor.emoji}`);
  }
  /* The stand-in is this letter's face: it is on the trail tile, the home
     strip, the certificate and the family note. The app's JS floor is around
     Chrome 80, but the emoji added in 2020-2023 (U+1FA70–1FAFF, U+1F6D5–1F6FF)
     need a font a good bit newer than that — on an older cart Chromebook they
     paint an empty box. One plate in a pool of fifteen is a shrug; a letter
     whose whole face is a box is not. Keep the stand-ins on old glyphs. */
  for (const cp of [...String(entry.emoji)].map((ch) => ch.codePointAt(0))) {
    if ((cp >= 0x1FA70 && cp <= 0x1FAFF) || (cp >= 0x1F6D5 && cp <= 0x1F6FF)) {
      problem(`${L}'s stand-in ${entry.emoji} (U+${cp.toString(16).toUpperCase()}) is a recent emoji — pick one an older tablet can draw`);
    }
  }
}

/* data/audio.json is the recording checklist, so it has to list every plate
   that can now come up — a woken letter with no placeholder is a picture
   Lucy is never asked to record. */
const audioPlaceholders = JSON.parse(readFileSync('data/audio.json', 'utf8')).placeholders || {};
const wordIds = (audioPlaceholders.word && audioPlaceholders.word.ids) || {};
for (const entry of letterList) {
  if (!(`word-${entry.letter}` in wordIds)) {
    problem(`data/audio.json has no word-${entry.letter} fallback placeholder`);
  }
  for (const pic of entry.pictures || []) {
    if (!(`word-${entry.letter}-${pic.id}` in wordIds)) {
      problem(`data/audio.json has no placeholder for word-${entry.letter}-${pic.id}`);
    }
  }
}
for (const key of ['name', 'phoneme']) {
  const ids = (audioPlaceholders[key] && audioPlaceholders[key].ids) || {};
  const missing = ALPHABET26.filter((L) => !(`${key}-${L}` in ids));
  if (missing.length) problem(`data/audio.json ${key} placeholders miss ${missing.join('')}`);
}

function listed(dir, ext) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(ext)).map((f) => `${dir}/${f}`);
}

function parseShell(src) {
  const block = src.match(/const SHELL = \[([\s\S]*?)\];/);
  if (!block) return null;
  const body = block[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  return [...body.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

const swSrc = readFileSync('sw.js', 'utf8');
const shell = parseShell(swSrc);
if (!shell) {
  problem('sw.js has no parseable SHELL list');
} else {
  const shellSet = new Set(shell);
  for (const path of shell) {
    if (!path || path === './') continue;
    if (!existsSync(path)) problem(`SW lists a missing file: ${path}`);
  }

  const required = [
    'index.html',
    'manifest.webmanifest',
    ...listed('css', '.css'),
    ...listed('js', '.js'),
    ...listed('js/screens', '.js'),
    ...listed('data', '.json'),
    /* Empty until Lucy is recorded (data/audio.json is a placeholder list).
       The day clips land they have to be pinned, or the cart goes quiet
       offline while the tablet says it is set up. */
    ...listed('audio', '.m4a'),
    ...listed('audio', '.mp3'),
    ...listed('audio', '.ogg'),
    ...listed('audio', '.wav'),
    ...listed('icons', '.png'),
    ...listed('icons', '.svg'),
    ...listed('fonts', '.woff'),
    ...listed('fonts', '.woff2'),
    ...listed('fonts', '.ttf'),
    ...listed('fonts', '.otf'),
    ...listed('vendor', '.js'),
    ...listed('lottie', '.json'),
    ...listed('art/stage', '.png'),
    ...listed('art/words', '.png'),
    ...listed('art/lucy', '.jpg'),
    ...listed('art/lucy', '.png'),
  ];
  for (const path of required) {
    if (!shellSet.has(path)) problem(`SW SHELL is missing runtime file: ${path}`);
  }
  if (!shellSet.has('./')) problem("SW SHELL is missing './' (offline navigation)");
  if (!shellSet.has('index.html')) problem('SW SHELL is missing index.html');
  for (const path of ['_check.mjs', '_flow.mjs', '_smoke.html', 'README.md', 'icons/make-icons.py', 'sw.js']) {
    if (shellSet.has(path)) problem(`SW SHELL should not pin ${path}`);
  }

  const swCode = swSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  if (/fonts\.googleapis|fonts\.gstatic/.test(swCode)) {
    problem('SW must not pin Google Fonts URLs — offline uses system fallbacks');
  }

  if (shell.length !== shellSet.size) {
    const seen = new Set();
    shell.filter((p) => (seen.has(p) ? true : (seen.add(p), false)))
      .forEach((p) => problem(`SW SHELL lists ${p} twice`));
  }

  /* The `required` list above is built by reading js/ and js/screens/. That
     catches a new module in a folder we already scan and misses one in a
     folder we do not — the exact shape of a C/D pass that adds js/games/.
     So walk what index.html actually loads instead: every module reachable
     from js/app.js has to exist and has to be pinned, wherever it lives. */
  const seenMod = new Set();
  const queue = ['js/app.js'];
  while (queue.length) {
    const file = queue.shift();
    if (seenMod.has(file)) continue;
    seenMod.add(file);
    if (!existsSync(file)) {
      problem(`imported module does not exist: ${file}`);
      continue;
    }
    if (!shellSet.has(file)) problem(`imported module is not in SW SHELL: ${file}`);
    const src = readFileSync(file, 'utf8');
    const dir = file.slice(0, file.lastIndexOf('/'));
    const specs = [
      ...src.matchAll(/(?:^|[\s;])(?:import|export)[\s\S]{0,200}?from\s*'([^']+)'/g),
      ...src.matchAll(/\bimport\s*\(\s*'([^']+)'\s*\)/g),
    ].map((m) => m[1]).filter((s) => s.startsWith('.'));
    for (const spec of specs) {
      const parts = `${dir}/${spec}`.split('/');
      const out = [];
      for (const part of parts) {
        if (part === '.' || part === '') continue;
        if (part === '..') out.pop();
        else out.push(part);
      }
      queue.push(out.join('/'));
    }
  }

  /* Same trap, one layer down: a stylesheet that reaches for a local file
     (a background, a woff2) offline-breaks just as quietly as a module. */
  for (const css of listed('css', '.css')) {
    for (const hit of readFileSync(css, 'utf8').matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
      const ref = hit[1].trim();
      if (/^(https?:)?\/\//.test(ref) || ref.startsWith('data:') || ref.startsWith('#')) continue;
      const parts = `css/${ref}`.split('/');
      const out = [];
      for (const part of parts) {
        if (part === '.' || part === '') continue;
        if (part === '..') out.pop();
        else out.push(part);
      }
      const path = out.join('/').split('?')[0];
      if (!shellSet.has(path)) problem(`${css} loads a local file that is not in SHELL: ${path}`);
    }
  }
}

const swVer = (swSrc.match(/const VERSION = '([^']+)'/) || [])[1];
const appVer = (readFileSync('js/version.js', 'utf8').match(/APP_VERSION = '([^']+)'/) || [])[1];
if (!swVer || swVer !== appVer) {
  problem(`Version pin drift: sw.js ${swVer} vs js/version.js ${appVer}`);
}

const html = readFileSync('index.html', 'utf8');
/* Comments are allowed to say "do not link fonts.googleapis" — markup is not.
   Strip <!-- --> before any no-network-font rule, or the warning trips it. */
const htmlCode = html.replace(/<!--[\s\S]*?-->/g, '');
for (const attr of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
  const href = attr[1];
  if (/^(https?:)?\/\//.test(href) || href.startsWith('data:')) continue;
  if (!shell || !shell.includes(href)) problem(`index.html local asset not in SHELL: ${href}`);
}

const manifest = JSON.parse(readFileSync('manifest.webmanifest', 'utf8'));
for (const icon of manifest.icons || []) {
  if (!icon.src) continue;
  if (!shell || !shell.includes(icon.src)) problem(`manifest icon not in SHELL: ${icon.src}`);
}

for (const icon of listed('icons', '.png')) {
  const buf = readFileSync(icon);
  if (buf.length < 8 || buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) {
    problem(`Not a PNG: ${icon}`);
  }
}

if (!existsSync('icons/make-icons.py')) problem('missing icons/make-icons.py');
if (!existsSync('fonts/README.md')) problem('missing fonts/README.md');
if (!existsSync('audio/README.md')) problem('missing audio/README.md (Lucy recording checklist)');
if (!existsSync('_smoke.html')) problem('missing _smoke.html');

const fontsNote = existsSync('fonts/README.md') ? readFileSync('fonts/README.md', 'utf8') : '';
if (fontsNote && (!/woff2/i.test(fontsNote) || !/SHELL/.test(fontsNote) || !/version\.js/.test(fontsNote))) {
  problem('fonts/README.md must tell how to pin woff2 files (SHELL + version.js)');
}

const tokens = readFileSync('css/tokens.css', 'utf8');
if (!/--font-display:\s*"Comfortaa"/.test(tokens) || !/Quicksand/.test(tokens) || !/Trebuchet MS/.test(tokens)) {
  problem('tokens.css display stack is missing offline system fallbacks');
}
if (!/--font-body:\s*"Nunito Sans"/.test(tokens) || !/Segoe UI/.test(tokens)) {
  problem('tokens.css body stack is missing offline system fallbacks');
}

/* --- self-hosted faces are the offline Stitch look ----------------------
   index.html no longer asks googleapis for anything, so a face that is
   missing, corrupt, undeclared or unpinned does not degrade loudly — the
   tablet just quietly paints Trebuchet and nobody files a bug. Fail here
   instead. Every face below has to be four things at once: on disk, a real
   woff2, named by an @font-face in tokens.css, and pinned in SHELL. */
const FACES = [
  ['fonts/Comfortaa-Medium.woff2', 'Comfortaa', 500],
  ['fonts/Comfortaa-Bold.woff2', 'Comfortaa', 700],
  ['fonts/NunitoSans-SemiBold.woff2', 'Nunito Sans', 600],
  ['fonts/NunitoSans-Bold.woff2', 'Nunito Sans', 700],
  ['fonts/NunitoSans-ExtraBold.woff2', 'Nunito Sans', 800],
  ['fonts/NunitoSans-Black.woff2', 'Nunito Sans', 900],
];
const faceBlocks = [...tokens.matchAll(/@font-face\s*\{([\s\S]*?)\}/g)].map((m) => m[1]);
for (const [path, family, weight] of FACES) {
  if (!existsSync(path)) {
    problem(`missing self-hosted font: ${path} (fonts/README.md)`);
    continue;
  }
  /* woff2 files start 'wOF2'. A git-lfs pointer, an HTML error page saved by a
     browser, or a .ttf renamed all sail past a filename check and 404-shaped
     fail only on the tablet. */
  const buf = readFileSync(path);
  if (buf.length < 4 || buf.toString('latin1', 0, 4) !== 'wOF2') {
    problem(`Not a woff2: ${path}`);
  }
  if (buf.length < 2000) problem(`Suspiciously small font file: ${path} (${buf.length}B)`);
  const rel = `../${path}`;
  const block = faceBlocks.find((b) => b.includes(rel));
  if (!block) {
    problem(`font is on disk but no @font-face in tokens.css points at ${rel}`);
    continue;
  }
  if (!new RegExp(`font-family:\\s*"${family}"`).test(block)) {
    problem(`@font-face for ${path} must declare font-family: "${family}"`);
  }
  if (!new RegExp(`font-weight:\\s*${weight}\\b`).test(block)) {
    problem(`@font-face for ${path} must declare font-weight: ${weight}`);
  }
  /* swap, not block: a child never waits on a face, and an evicted woff2
     falls through to the system stack instead of painting nothing. */
  if (!/font-display:\s*swap/.test(block)) {
    problem(`@font-face for ${path} must set font-display: swap`);
  }
}
/* And the other direction: an @font-face pointing at a file we do not ship. */
for (const block of faceBlocks) {
  for (const hit of block.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
    const ref = hit[1].trim();
    if (/^(https?:)?\/\//.test(ref)) {
      problem(`tokens.css @font-face loads a network font: ${ref}`);
      continue;
    }
    const path = ref.replace(/^\.\.\//, '').split('?')[0];
    if (!existsSync(path)) problem(`tokens.css @font-face points at a missing file: ${ref}`);
  }
}

/* index.html must not reintroduce a render-blocking Google Fonts stylesheet:
   offline that request hangs until it fails, and first paint hangs with it. */
if (/fonts\.googleapis|fonts\.gstatic/.test(htmlCode)) {
  problem('index.html must not link Google Fonts — first paint would wait on the network');
}
/* A preload only helps if it names a file we actually pin. */
for (const pre of htmlCode.matchAll(/<link[^>]*rel="preload"[^>]*>/g)) {
  const href = (pre[0].match(/href="([^"]+)"/) || [])[1];
  if (!href || !/\.woff2?$/.test(href)) continue;
  if (!existsSync(href)) problem(`index.html preloads a missing font: ${href}`);
  if (shell && !shell.includes(href)) problem(`index.html preloads a font that is not in SHELL: ${href}`);
  if (!/crossorigin/.test(pre[0])) problem(`font preload needs crossorigin: ${href}`);
  if (!/as="font"/.test(pre[0])) problem(`font preload needs as="font": ${href}`);
}
/* The licence has to travel with the font. */
for (const licence of ['fonts/Comfortaa-OFL.txt', 'fonts/NunitoSans-OFL.txt']) {
  if (!existsSync(licence)) problem(`missing font licence: ${licence}`);
  else if (!/Open Font License/i.test(readFileSync(licence, 'utf8'))) {
    problem(`${licence} does not look like the OFL`);
  }
}

const readme = readFileSync('README.md', 'utf8');
for (const needle of [
  'python3 -m http.server 8000',
  'node _check.mjs',
  'node _flow.mjs',
  '_smoke.html',
  'fonts/README.md',
  'make-icons.py',
  '1234',
  'clearKid=1',
  '?play=E',
  '?play=9',
  '?bonus=',
  'data/audio.json',
]) {
  if (!readme.includes(needle)) problem(`README.md is missing run note: ${needle}`);
}

/* data/audio.json is the recording checklist. Until Lucy is in the folder it
   must stay all-silent: a mapped clip with no file 404s on every tap. */
const audioJson = JSON.parse(readFileSync('data/audio.json', 'utf8'));
const mapped = Object.entries(audioJson.clips || {}).filter(([, f]) => typeof f === 'string' && f.trim());
for (const [id, file] of mapped) {
  const path = `audio/${file}`;
  if (!existsSync(path)) problem(`data/audio.json maps ${id} to a missing file: ${path}`);
  if (shell && !shell.includes(path)) problem(`mapped clip not in SHELL: ${path}`);
}
if (!audioJson.placeholders || !audioJson.placeholders.phoneme) {
  problem('data/audio.json must document the silent placeholder ids');
}

const smoke = readFileSync('_smoke.html', 'utf8');
if (!/location\.replace\('index\.html'/.test(smoke)) problem('_smoke.html must bounce into index.html');
for (const key of ['classroom', 'kid', 'clearKid', 'mode', 'hideChrome', 'reset', 'play',
  'pin', 'unpin', 'bonus', 'outfit', 'stars', 'progress', 'to', 'gu']) {
  if (!smoke.includes(key)) problem(`_smoke.html missing query key: ${key}`);
}

/* Every key the harness implements has to be reachable from the index, or it
   is a bookmark only whoever wrote it knows about. */
const bookmarks = [...smoke.matchAll(/\['([a-zA-Z]+=[^']*)'/g)].map((m) => m[1]);
for (const key of ['classroom', 'kid', 'clearKid', 'mode', 'hideChrome', 'reset', 'play',
  'pin', 'unpin', 'bonus', 'outfit', 'stars', 'progress', 'to', 'gu']) {
  const shown = bookmarks.some((b) => new RegExp(`(^|&)${key}=`).test(b));
  if (!shown) problem(`_smoke.html index lists no bookmark using ${key}=`);
}

/* gu=<tab> is only a bookmark if grownups.js still has that tab. */
const guSrc = readFileSync('js/screens/grownups.js', 'utf8');
const guTabs = (guSrc.match(/const TABS = \[([\s\S]*?)\];/) || ['', ''])[1];
const tabIds = [...guTabs.matchAll(/\['([a-z-]+)',/g)].map((m) => m[1]);
if (!tabIds.length) problem('grownups.js has no parseable TABS list');
for (const tab of tabIds) {
  if (!smoke.includes(`gu=${tab}`)) problem(`_smoke.html index has no bookmark for Grown-Ups tab: ${tab}`);
}
if (!/opts\.tab/.test(guSrc)) problem('grownups.js must honour openGrownUps({ tab }) for #/grownups/<tab>');
const appSrc = readFileSync('js/app.js', 'utf8');
if (!/openGrownUps\(\{[^}]*tab/.test(appSrc)) problem('app.js must pass the #/grownups/<tab> param through');
/* reset must wipe before clearKid/kid write, or ?reset=1&kid=k01 loses the kid. */
if (smoke.indexOf("flag('reset')") > smoke.indexOf("q.get('kid')")) {
  problem('_smoke.html must apply reset before it sets a kid');
}
if (smoke.indexOf("clearKid") > smoke.indexOf("q.get('kid')")) {
  problem('_smoke.html must apply clearKid before it sets a kid');
}

if (!/Self-hosted fonts/.test(swSrc) || !/fonts\/README\.md/.test(swSrc)) {
  problem('sw.js must note where the self-hosted fonts come from (fonts/README.md)');
}
if (!/pathname\.endsWith\('\/sw\.js'\)/.test(swSrc)) {
  problem('sw.js must not cache-first intercept itself (Get update)');
}

console.log(fail ? `${fail} problem(s)` : 'ALL-OK');
process.exit(fail ? 1 : 0);

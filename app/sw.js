/* Ready Set ABC service worker.
   Precaches the whole shell — no lazy caching, no unresolvable spinners.
   The teacher's "Set up this device" button drives a re-cache with progress
   over a MessageChannel. Updates never happen mid-session: a newer worker
   installs, then waits. Only Grown-Ups → Device → Get update sends
   SKIP_WAITING, so the pin never swaps under a child mid-round. */

const VERSION = 'rsabc-shell-v25-az-art';
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/tokens.css',
  'css/shell.css',
  'css/play.css',
  'css/grownups.css',
  'css/print.css',
  'js/app.js',
  'js/ui.js',
  'js/store.js',
  'js/data.js',
  'js/csv.js',
  'js/audio.js',
  'js/art.js',
  'js/lucy.js',
  'js/round.js',
  'js/bonus.js',
  'js/closet.js',
  'js/version.js',
  'js/screens/home.js',
  'js/screens/faces.js',
  'js/screens/match.js',
  'js/screens/bonus.js',
  'js/screens/celebrate.js',
  'js/screens/trail.js',
  'js/screens/pouch.js',
  'js/screens/grownups.js',
  'js/screens/printables.js',
  'data/roster.json',
  'data/letters.json',
  'data/audio.json',
  'icons/icon.svg',
  'icons/icon-maskable.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  // Self-hosted fonts (OFL, see fonts/README.md). These are the Stitch look
  // offline: index.html asks for no googleapis stylesheet, so if one of these
  // is not pinned here the tablet silently drops to a system font. Adding or
  // renaming a face means bumping VERSION here and APP_VERSION in
  // js/version.js together. `node _check.mjs` fails if you forget.
  'fonts/Comfortaa-Medium.woff2',
  'fonts/Comfortaa-Bold.woff2',
  'fonts/NunitoSans-SemiBold.woff2',
  'fonts/NunitoSans-Bold.woff2',
  'fonts/NunitoSans-ExtraBold.woff2',
  'fonts/NunitoSans-Black.woff2',
  // Recorded Lucy clips. Nothing to pin yet — data/audio.json ships every id
  // as a silent placeholder. Add each file here as it is recorded (see
  // audio/README.md) and bump VERSION, or the cart goes quiet offline while
  // the tablet still says it is set up. `node _check.mjs` enforces this.
];
/* Self-hosted fonts (fonts/README.md) are pinned above, never fetched from
   googleapis — an offline cart has no network to swap a face in from. The
   @font-face rules that name them live at the top of css/tokens.css, and the
   system fallback stacks there are what a child reads if one is ever evicted. */

function shellUrl(path) {
  return new URL(path, self.registration.scope);
}

/* Only a complete, same-origin 200 belongs in the offline shell. A 206 from a
   ranged <audio> read throws inside cache.put, and an opaque cross-origin body
   would cache a response we cannot even read the status of. */
function cacheable(response) {
  return !!response
    && response.status === 200
    && response.type !== 'opaque'
    && response.type !== 'opaqueredirect';
}

/* One shell file, retried once. School Wi-Fi drops a single request far more
   often than it stays down, and a half-cached shell is the failure teachers
   cannot diagnose — better to spend one extra request here. */
async function fetchShellFile(url) {
  let last = 'failed';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, { cache: 'reload', credentials: 'same-origin' });
      if (cacheable(response)) return response;
      last = `HTTP ${response.status}`;
    } catch (err) {
      last = err.message || String(err);
    }
  }
  throw new Error(last);
}

async function precacheInto(cache, onProgress) {
  const missing = [];
  let done = 0;
  for (const path of SHELL) {
    const url = shellUrl(path);
    try {
      await cache.put(url, await fetchShellFile(url));
    } catch (err) {
      missing.push(`${path} → ${err.message || err}`);
    }
    done += 1;
    if (onProgress) onProgress(done, SHELL.length);
  }
  if (missing.length) throw new Error(missing.join('; '));
  return SHELL.length;
}

/* What is really in the cache right now — not what we wrote down last time.
   Chrome evicts storage on a full cart Chromebook without telling anyone, and
   a tablet that says "Ready offline" but is not is the worst Monday. */
async function shellHealth() {
  const cache = await caches.open(VERSION);
  const missing = [];
  for (const path of SHELL) {
    const hit = await cache.match(shellUrl(path), { ignoreSearch: true });
    if (!hit) missing.push(path);
  }
  return { version: VERSION, total: SHELL.length, cached: SHELL.length - missing.length, missing };
}

self.addEventListener('install', (event) => {
  /* No hand-over here — a newer pin installs quietly and then waits, until
     Grown-Ups → Device → Get update asks for it. */
  event.waitUntil(caches.open(VERSION).then((cache) => precacheInto(cache)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n !== VERSION).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

/* Cache-first: the cart Chromebook is often offline on purpose.
   Never intercept sw.js — Get update must be able to fetch a new pin.
   Dev files (_check.mjs, _flow.mjs, _smoke.html) are never cached either, so a
   smoke bookmark always runs the file on disk. */
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/sw.js')) return;
  if (/\/_[^/]*$/.test(url.pathname)) return;

  event.respondWith((async () => {
    const hit = await caches.match(request, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const response = await fetch(request);
      if (cacheable(response)) {
        const copy = response.clone();
        caches.open(VERSION)
          .then((cache) => cache.put(request, copy))
          .catch(() => {});
      }
      return response;
    } catch (err) {
      // Navigations fall back to the shell so the app still opens offline.
      if (request.mode === 'navigate') {
        const shell = await caches.match(shellUrl('index.html'))
          || await caches.match('index.html')
          || await caches.match(shellUrl('./'));
        if (shell) return shell;
      }
      return new Response('offline', { status: 503, statusText: 'offline' });
    }
  })());
});

/* Teacher-driven precache with progress, plus a real cache-health read.
   SKIP_WAITING is what Get update sends to hand over to a newer pin. */
self.addEventListener('message', (event) => {
  const msg = event.data || {};
  const port = event.ports && event.ports[0];

  if (msg.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
    return;
  }

  if (msg.type === 'HEALTH') {
    if (!port) return;
    event.waitUntil(shellHealth().then(
      (health) => port.postMessage({ type: 'health', ...health }),
      (err) => port.postMessage({ type: 'error', message: String(err.message || err) }),
    ));
    return;
  }

  if (msg.type !== 'PRECACHE') return;
  if (!port) return;

  event.waitUntil((async () => {
    try {
      const cache = await caches.open(VERSION);
      const count = await precacheInto(cache, (done, total) => {
        port.postMessage({ type: 'progress', done, total });
      });
      port.postMessage({ type: 'done', count, version: VERSION });
    } catch (err) {
      port.postMessage({ type: 'error', message: String(err.message || err) });
    }
  })());
});

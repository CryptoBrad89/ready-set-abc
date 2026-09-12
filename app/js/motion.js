/* Motion stack: vendored lottie-web + canvas-confetti, plus CSS juice.
   Players load as classic scripts (index.html) so the cart never hits a CDN.
   Lottie JSON lives in lottie/ — swap files without touching this module.
   Lucy photos / cinematic clips are a later slot (see lucy.js + LOCAL-BUILD). */

const LOTTIE_DIR = 'lottie';
const CONFETTI_COLORS = ['#FF5252', '#FFB800', '#26C281', '#29B6F6', '#FFD54F', '#c48cf0'];

export function hasLottie() {
  return typeof window !== 'undefined' && typeof window.lottie === 'object' && !!window.lottie.loadAnimation;
}

export function hasConfetti() {
  return typeof window !== 'undefined' && typeof window.confetti === 'function';
}

export function mountLottie(container, name, { loop = true, autoplay = true } = {}) {
  if (!container || !hasLottie() || !name) return null;
  try {
    return window.lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: !!loop,
      autoplay: autoplay !== false,
      path: `${LOTTIE_DIR}/${name}.json`,
    });
  } catch (err) {
    console.warn('[motion] lottie failed', name, err);
    return null;
  }
}

export function burstConfetti({ x = 0.5, y = 0.45, count = 72 } = {}) {
  if (!hasConfetti()) return false;
  try {
    window.confetti({
      particleCount: count,
      spread: 68,
      startVelocity: 34,
      origin: { x, y },
      colors: CONFETTI_COLORS,
      disableForReducedMotion: true,
    });
    return true;
  } catch (err) {
    return false;
  }
}

export function squash(node) {
  if (!node || !node.classList) return;
  node.classList.add('is-pressed');
  window.setTimeout(() => node.classList.remove('is-pressed'), 120);
}

export function wobble(node) {
  if (!node || !node.classList) return;
  node.classList.remove('wobble');
  void node.offsetWidth;
  node.classList.add('wobble');
  window.setTimeout(() => node.classList.remove('wobble'), 420);
}

export function floatGlyph(host, letter) {
  if (!host) return;
  const chip = document.createElement('span');
  chip.className = 'float-glyph';
  chip.textContent = letter;
  host.append(chip);
  window.setTimeout(() => chip.remove(), 1200);
}

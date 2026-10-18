(() => {
  'use strict';

  const THEMES = {
    pink: {
      name: 'Pink',
      particles: ['•', '○'],
      palette: { ink: '#432045', primary: '#b41468', accent: '#61ead7', secondary: '#ffb83f', base: '#ffd2eb', wash: '#ee6bbd', lip: '#72083d', paper: '#fff5fb' }
    },
    purple: {
      name: 'Purple',
      particles: ['✦', '✧'],
      palette: { ink: '#342466', primary: '#653bce', accent: '#ffba52', secondary: '#ac79ef', base: '#e3d4ff', wash: '#9485ef', lip: '#3e2193', paper: '#faf6ff' }
    },
    yellow: {
      name: 'Yellow',
      particles: ['☀', '✦', '•'],
      palette: { ink: '#202752', primary: '#235fe9', accent: '#ffcd38', secondary: '#f34e6b', base: '#fff1a6', wash: '#83c4ff', lip: '#12378b', paper: '#fffdf4' }
    }
  };
  const storageKey = 'rsabc-r3-theme';

  function applyTheme(choice, persist = true) {
    const key = Object.hasOwn(THEMES, choice) ? choice : 'pink';
    const theme = THEMES[key];
    document.documentElement.dataset.theme = key;
    for (const [name, color] of Object.entries(theme.palette)) {
      document.documentElement.style.setProperty(`--${name}`, color);
    }
    if (persist) {
      try { localStorage.setItem(storageKey, key); } catch {}
    }
    document.dispatchEvent(new CustomEvent('themechange', { detail: { key, theme } }));
  }

  let initial = 'pink';
  try { initial = localStorage.getItem(storageKey) || initial; } catch {}
  window.THEMES = THEMES;
  window.applyTheme = applyTheme;
  applyTheme(initial, false);
})();

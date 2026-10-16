/* Pure, versioned local progress model. Also usable by the offline Node tests. */
(function (scope) {
  'use strict';
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const ORDER = 'SATPIM' + [...ALPHABET].filter(l => !'SATPIM'.includes(l)).join('');
  const AVATARS = ['🌻', '🚀', '🍓', '🐢', '🌈', '🐳', '🦋', '🍀'];
  const defaults = () => ({ theme: 'post', dark: 'system', muted: false, effects: true,
    motion: true, autoUnlock: true, order: [...ORDER], unlocked: [...ALPHABET], pin: '2468' });
  const newChild = (id, name, avatar) => ({ id, name, avatar, outfit: 'default',
    progress: {}, session: null });
  function fresh() {
    return { version: 1, settings: defaults(), active: 'child-1',
      children: [newChild('child-1', 'Little explorer', AVATARS[0])] };
  }
  function clean(raw) {
    const state = fresh();
    if (!raw || raw.version !== 1 || !Array.isArray(raw.children)) return state;
    const s = raw.settings || {};
    for (const k of ['muted', 'effects', 'motion', 'autoUnlock'])
      if (typeof s[k] === 'boolean') state.settings[k] = s[k];
    if (['post', 'moon'].includes(s.theme)) state.settings.theme = s.theme;
    if (['system', 'light', 'dark'].includes(s.dark)) state.settings.dark = s.dark;
    if (/^\d{4,8}$/.test(s.pin)) state.settings.pin = s.pin;
    if (Array.isArray(s.order) && s.order.length === 26 && new Set(s.order).size === 26 && s.order.every(l => ALPHABET.includes(l) && l.length === 1)) state.settings.order = s.order;
    if (Array.isArray(s.unlocked)) state.settings.unlocked = [...new Set(s.unlocked.filter(l => ALPHABET.includes(l) && l.length === 1))];
    const ids = new Set();
    const children = raw.children.slice(0, 24).filter(c => c && typeof c.id === 'string' && c.id.length < 100 && !ids.has(c.id) && ids.add(c.id)).map(c => {
      const child = newChild(c.id, String(c.name || 'Explorer').slice(0, 32), AVATARS.includes(c.avatar) ? c.avatar : AVATARS[0]);
      if (['default','bows','specs','cap','clip','bone','pack','rainbow'].includes(c.outfit)) child.outfit = c.outfit;
      for (const letter of ALPHABET) {
        const p = c.progress?.[letter];
        if (!p || typeof p !== 'object') continue;
        const result = stats();
        for (const k of ['nameListens','soundListens','completions','hints']) result[k] = count(p[k]);
        result.lastPlayed = typeof p.lastPlayed === 'string' && Number.isFinite(Date.parse(p.lastPlayed)) ? p.lastPlayed : '';
        for (const k of ['case','picture','bonus']) {
          result[k].attempts = count(p[k]?.attempts);
          result[k].correct = Math.min(result[k].attempts, count(p[k]?.correct));
        }
        child.progress[letter] = result;
      }
      const v = c.session;
      if (v && ALPHABET.includes(v.letter) && v.letter.length === 1 && ['listen','case','picture','bonus'].includes(v.stage))
        child.session = { letter: v.letter, stage: v.stage, caseRound: v.caseRound === 1 ? 1 : 0,
          bonusRound: v.bonusRound === 1 ? 1 : 0, heardName: !!v.heardName, heardSound: !!v.heardSound };
      return child;
    });
    if (children.length) state.children = children;
    state.active = state.children.some(c => c.id === raw.active) ? raw.active : state.children[0].id;
    return state;
  }
  function count(n) { return Number.isSafeInteger(n) && n >= 0 ? n : 0; }
  function stats() { return { nameListens: 0, soundListens: 0, completions: 0, hints: 0,
    case: { attempts: 0, correct: 0 }, picture: { attempts: 0, correct: 0 },
    bonus: { attempts: 0, correct: 0 }, lastPlayed: '' }; }
  const child = state => state.children.find(c => c.id === state.active) || state.children[0];
  const progress = (c, letter) => c.progress[letter] || (c.progress[letter] = stats());
  const stars = c => Object.values(c.progress).filter(p => p.completions > 0).length;
  function answer(c, letter, stage, correct) {
    if (!['case','picture','bonus'].includes(stage)) throw new Error('Unknown activity');
    const p = progress(c, letter);
    p[stage].attempts++;
    if (correct) p[stage].correct++;
    p.lastPlayed = new Date().toISOString();
  }
  function complete(state, letter) {
    const c = child(state), p = progress(c, letter);
    p.completions++;
    p.lastPlayed = new Date().toISOString();
    c.session = null;
    if (state.settings.autoUnlock) {
      const next = state.settings.order[state.settings.order.indexOf(letter) + 1];
      if (next && !state.settings.unlocked.includes(next)) state.settings.unlocked.push(next);
    }
  }
  function nextLetter(state) {
    const c = child(state), s = state.settings;
    return s.order.find(l => s.unlocked.includes(l) && !c.progress[l]?.completions)
      || s.order.find(l => s.unlocked.includes(l)) || null;
  }
  function csv(state) {
    // A leading apostrophe prevents spreadsheet formulas from child names.
    const cell = v => '"' + String(/^[=+@\-\t\r]/.test(String(v)) ? "'" + v : v).replaceAll('"', '""') + '"';
    const rows = [['child_id','child','letter','unlocked','name_listens','sound_listens',
      'case_correct','case_attempts','picture_correct','picture_attempts','bonus_correct','bonus_attempts','hints','completions','last_played']];
    for (const c of state.children) for (const l of state.settings.order) {
      const p = c.progress[l] || stats();
      rows.push([c.id,c.name,l,state.settings.unlocked.includes(l),p.nameListens,p.soundListens,
        p.case.correct,p.case.attempts,p.picture.correct,p.picture.attempts,p.bonus.correct,p.bonus.attempts,p.hints,p.completions,p.lastPlayed]);
    }
    return '\uFEFF' + rows.map(r => r.map(cell).join(',')).join('\r\n');
  }
  const api = { ALPHABET, AVATARS, defaults, fresh, clean, newChild, child, progress, stars, stats, answer, complete, nextLetter, csv };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else scope.GameModel = api;
})(typeof window !== 'undefined' ? window : globalThis);

/* Shared comparison behavior; no remote services or build dependencies. */
(() => {
  'use strict';
  const KEY = 'rsabc-phoneme-test-ratings';
  const $ = id => document.getElementById(id);
  const audioRoot = new URL('../audio/', location.href);
  const manifestURL = new URL('../clips.json', location.href);
  let manifest = window.PHONEME_CLIPS;
  let letters = manifest.letters;
  let selected = 0;
  let states = new Map();
  let ratings = {};
  let persistent = true;
  let scanning = false;
  let bridge;
  let bridgeReady = false;
  const pendingRatings = [];
  const player = new Audio(); // Reuse one element for gesture-authorized chaining.
  let playbackID = 0;
  let playbackTimer;
  const buttons = [];

  function cleanRatings(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([letter, rating]) =>
      /^[A-Z]$/.test(letter) && ['pass', 'fail'].includes(rating)));
  }

  function readRatings() {
    try {
      ratings = cleanRatings(JSON.parse(localStorage.getItem(KEY) || '{}'));
      persistent = true;
    } catch { persistent = false; }
  }

  function setupStorage() {
    if (location.protocol !== 'file:') {
      readRatings();
      addEventListener('storage', event => {
        if (event.key === KEY || event.key === null) {
          readRatings();
          renderRatings();
        }
      });
      return;
    }
    bridge = document.createElement('iframe');
    bridge.hidden = true;
    bridge.title = 'Shared local ratings storage';
    bridge.src = '../ratings-store.html';
    bridge.addEventListener('load', () => {
      bridgeReady = true;
      bridge.contentWindow.postMessage({type: 'phoneme-ratings-request'}, '*');
      for (const update of pendingRatings.splice(0)) sendRating(update);
    });
    addEventListener('message', event => {
      if (event.source !== bridge.contentWindow || event.data?.type !== 'phoneme-ratings-response') return;
      ratings = cleanRatings(event.data.ratings);
      persistent = event.data.saved;
      renderRatings();
    });
    document.body.append(bridge);
  }

  function sendRating(update) {
    bridge.contentWindow.postMessage({type: 'phoneme-ratings-request', ...update}, '*');
  }

  function rate(value) {
    const letter = letters[selected].letter;
    if (bridge) {
      ratings[letter] = value;
      if (bridgeReady) sendRating({letter, rating: value});
      else pendingRatings.push({letter, rating: value});
    } else {
      // Merge fresh storage so another open layout's ratings are retained.
      readRatings();
      ratings[letter] = value;
      try {
        localStorage.setItem(KEY, JSON.stringify(ratings));
        persistent = true;
      } catch { persistent = false; }
    }
    renderRatings();
    announce(`${letter}: ${value}.${persistent ? ' Rating saved.' : ' Storage unavailable; kept for this page only.'}`);
  }

  function renderRatings() {
    const rating = ratings[letters[selected].letter];
    $('pass').setAttribute('aria-pressed', String(rating === 'pass'));
    $('fail').setAttribute('aria-pressed', String(rating === 'fail'));
    $('rating-status').textContent = rating ? `Rated ${rating}` : 'Not rated yet';
    $('storage-note').textContent = persistent ? 'Ratings saved on this browser.' : 'Storage unavailable — ratings last for this page only.';
    let pass = 0, fail = 0;
    letters.forEach((entry, index) => {
      const value = ratings[entry.letter];
      if (value === 'pass') pass++;
      if (value === 'fail') fail++;
      buttons[index].querySelector('.rating-mark').textContent = value === 'pass' ? '✓ Pass' : value === 'fail' ? '× Fail' : '';
      updateTile(index);
    });
    $('progress').textContent = `${pass + fail} / 26 rated · ${pass} pass · ${fail} fail`;
  }

  function clipURL(folder, filename) {
    // Filenames always come from the supplied manifest.
    return new URL(`${folder}/${filename}`, audioRoot).href;
  }

  function probe(url) {
    return new Promise(resolve => {
      const audio = new Audio();
      let done = false;
      const finish = available => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        audio.onloadedmetadata = audio.onerror = null;
        audio.removeAttribute('src');
        audio.load();
        resolve(available);
      };
      const timer = setTimeout(() => finish(false), 5000);
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => finish(Number.isFinite(audio.duration) && audio.duration > 0);
      audio.onerror = () => finish(false);
      audio.src = url;
      audio.load();
    });
  }

  async function selectPhoneme(entry) {
    if (entry.phoneme.chosen_filename) {
      const filename = entry.phoneme.chosen_filename;
      return {filename, chosen: true, available: await probe(clipURL('v4', filename))};
    }
    const attempts = [...entry.phoneme.attempts].sort((a, b) => {
      const number = file => Number(file.match(/-try(\d+)\.mp3$/)?.[1] || 99);
      return number(a.filename) - number(b.filename);
    });
    for (const attempt of attempts) {
      if (await probe(clipURL('v4', attempt.filename))) {
        return {filename: attempt.filename, chosen: false, available: true};
      }
    }
    return {filename: null, chosen: false, available: false};
  }

  async function inspect(entry) {
    const starfall = `lucy-phoneme-${entry.letter.toLowerCase()}.mp3`;
    const [name, word, reference, phoneme] = await Promise.all([
      probe(clipURL('v4', entry.name.filename)),
      probe(clipURL('v4', entry.word_clip.filename)),
      probe(clipURL('starfall', starfall)),
      selectPhoneme(entry)
    ]);
    return {name, word, reference, phoneme, starfall, chain: name && word && phoneme.available};
  }

  function updateTile(index) {
    const entry = letters[index];
    const state = states.get(entry.letter);
    const button = buttons[index];
    const readiness = !state ? 'Checking…' : state.chain ? '▶ Play' : 'Missing';
    button.querySelector('.tile-state').textContent = readiness;
    button.setAttribute('aria-label', `${entry.letter}, ${entry.word}, ${entry.phoneme_ipa}. ${!state ? 'Checking audio.' : state.chain ? 'Play name, phoneme, word.' : 'Full sequence missing; select to compare available clips.'} ${ratings[entry.letter] ? 'Rated ' + ratings[entry.letter] + '.' : 'Not rated.'}`);
  }

  function renderSelection() {
    const entry = letters[selected];
    const state = states.get(entry.letter);
    $('inspector').setAttribute('aria-label', `${entry.letter} comparison`);
    $('selected-letter').textContent = entry.letter;
    $('selected-lower').textContent = entry.letter.toLowerCase();
    $('selected-word').textContent = entry.word;
    $('selected-ipa').textContent = entry.phoneme_ipa;
    $('play-chain').disabled = !state?.chain;
    $('play-v4').disabled = !state?.phoneme.available;
    $('play-starfall').disabled = !state?.reference;
    $('play-chain').textContent = state?.chain ? '▶ Play name → sound → word' : !state ? 'Checking audio…' : 'Sequence missing';
    const missing = state ? [!state.name && 'name', !state.phoneme.available && 'phoneme', !state.word && 'word'].filter(Boolean) : [];
    $('chain-note').textContent = !state ? 'Looking for local audio files.' : missing.length ? `Missing: ${missing.join(', ')}. Check for new clips as audio arrives.` : 'Emma · name → phoneme → word';
    $('v4-file').textContent = !state ? 'Checking…' : state.phoneme.available ? `${state.phoneme.chosen ? 'Chosen' : 'Fallback'}: ${state.phoneme.filename}` : `Missing${state.phoneme.filename ? ': ' + state.phoneme.filename : ': tries 1–3'}`;
    $('starfall-file').textContent = !state ? 'Checking…' : state.reference ? state.starfall : 'Missing reference';
    buttons.forEach((button, index) => {
      button.tabIndex = index === selected ? 0 : -1;
      if (index === selected) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    renderRatings();
  }

  function announce(message) { $('status').textContent = message; }

  function stop() {
    playbackID++;
    clearTimeout(playbackTimer);
    player.onended = player.onerror = null;
    player.pause();
    player.removeAttribute('src');
    player.load();
    $('stop').disabled = true;
  }

  function choose(index) {
    if (selected !== index) {
      stop();
      selected = index;
      announce(`${letters[index].letter} selected. Play the sequence or compare each sound.`);
    }
    renderSelection();
  }

  function play(clips) {
    stop();
    const id = playbackID;
    const letter = letters[selected].letter;
    let index = 0;
    $('stop').disabled = false;
    function next() {
      if (id !== playbackID) return;
      clearTimeout(playbackTimer);
      if (index === clips.length) {
        stop();
        announce(`${letter}: finished. Compare or rate this sound.`);
        return;
      }
      const clip = clips[index++];
      announce(`${letter}: playing ${clip.label} (${index}/${clips.length}).`);
      player.onended = next;
      player.onerror = () => {
        if (id !== playbackID) return;
        stop();
        const state = states.get(letter);
        // A file may disappear or be incomplete while generation is running.
        if (state) {
          if (clip.kind === 'phoneme') state.phoneme.available = false;
          else state[clip.kind] = false;
          state.chain = state.name && state.word && state.phoneme.available;
          updateTile(selected);
          renderSelection();
        }
        announce(`${letter}: audio missing or unreadable. Check for new clips to retry.`);
      };
      player.src = clip.url;
      const promise = player.play();
      if (promise) promise.catch(error => {
        if (id !== playbackID) return;
        stop();
        announce(`${letter}: playback could not start${error.name === 'NotAllowedError' ? '; tap Play again to allow audio' : '; check for new clips and retry'}.`);
      });
      playbackTimer = setTimeout(() => {
        if (id !== playbackID) return;
        stop();
        announce(`${letter}: audio timed out. Check for new clips and retry.`);
      }, 20000);
    }
    next(); // First play happens directly inside the user's click/keypress.
  }

  function playChain() {
    const entry = letters[selected];
    const state = states.get(entry.letter);
    if (!state?.chain) {
      announce(`${entry.letter}: sequence ${state ? 'missing' : 'still checking'}. Compare any available sounds or check for new clips.`);
      return;
    }
    play([
      {kind: 'name', label: 'Emma letter name', url: clipURL('v4', entry.name.filename)},
      {kind: 'phoneme', label: 'Emma phoneme', url: clipURL('v4', state.phoneme.filename)},
      {kind: 'word', label: `Emma word: ${entry.word}`, url: clipURL('v4', entry.word_clip.filename)}
    ]);
  }

  function buildGrid() {
    letters.forEach((entry, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'letter';
      button.innerHTML = '<span class="glyph"></span><span class="word"></span><span class="tile-state"></span><span class="rating-mark" aria-hidden="true"></span>';
      const glyph = button.querySelector('.glyph');
      glyph.textContent = entry.letter;
      const lower = document.createElement('small');
      lower.textContent = entry.letter.toLowerCase();
      glyph.append(lower);
      button.querySelector('.word').textContent = entry.word;
      button.addEventListener('focus', () => choose(index));
      button.addEventListener('click', () => { choose(index); playChain(); });
      button.addEventListener('keydown', event => {
        const columns = getComputedStyle($('letters')).gridTemplateColumns.split(' ').length;
        const steps = {ArrowRight: 1, ArrowLeft: -1, ArrowUp: -columns, ArrowDown: columns};
        if (!(event.key in steps) && !['Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        let target = Math.max(0, Math.min(letters.length - 1, index + (steps[event.key] || 0)));
        if (event.key === 'Home') target = 0;
        if (event.key === 'End') target = letters.length - 1;
        choose(target);
        buttons[target].focus();
      });
      buttons.push(button);
      $('letters').append(button);
    });
  }

  async function scan() {
    if (scanning) return;
    scanning = true;
    stop();
    $('refresh').disabled = true;
    $('refresh').textContent = 'Checking clips…';
    announce('Checking local audio. Missing clips stay disabled until they arrive.');
    if (location.protocol !== 'file:') {
      try {
        const response = await fetch(manifestURL, {cache: 'no-store'});
        if (!response.ok) throw new Error('Manifest unavailable');
        const data = await response.json();
        // Preserve the fixed A–Z grid and update clip choices/metadata in place.
        if (data.letters?.length === 26 && data.letters.every((entry, i) => entry.letter === letters[i].letter)) {
          manifest = data;
          letters = data.letters;
        }
      } catch { /* The bundled manifest supports offline use. */ }
    }
    states.clear();
    renderSelection();
    let cursor = 0;
    async function worker() {
      while (cursor < letters.length) {
        const index = cursor++;
        const entry = letters[index];
        const state = await inspect(entry);
        states.set(entry.letter, state);
        updateTile(index);
        if (index === selected) renderSelection();
      }
    }
    await Promise.all(Array.from({length: 4}, worker));
    scanning = false;
    $('refresh').disabled = false;
    $('refresh').textContent = 'Check for new clips';
    const count = [...states.values()].filter(state => state.chain).length;
    $('availability').textContent = `${count} / 26 sequences ready`;
    // Do not overwrite playback feedback if someone started an already checked clip.
    if ($('stop').disabled) announce(`Ready: ${count} of 26 full sequences. Individual comparison sounds can be played as they arrive.`);
  }

  buildGrid();
  setupStorage();
  renderSelection();
  $('play-chain').addEventListener('click', playChain);
  $('play-v4').addEventListener('click', () => {
    const state = states.get(letters[selected].letter);
    if (state?.phoneme.available) play([{kind: 'phoneme', label: 'ElevenLabs v4 phoneme', url: clipURL('v4', state.phoneme.filename)}]);
  });
  $('play-starfall').addEventListener('click', () => {
    const state = states.get(letters[selected].letter);
    if (state?.reference) play([{kind: 'reference', label: 'Starfall reference phoneme', url: clipURL('starfall', state.starfall)}]);
  });
  $('pass').addEventListener('click', () => rate('pass'));
  $('fail').addEventListener('click', () => rate('fail'));
  $('refresh').addEventListener('click', scan);
  $('stop').addEventListener('click', () => { stop(); announce('Playback stopped.'); });
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
    if (event.key === '1' || event.key === '0') {
      event.preventDefault();
      rate(event.key === '1' ? 'pass' : 'fail');
    }
    if (event.key === 'Escape') { stop(); announce('Playback stopped.'); }
  });
  addEventListener('pagehide', stop);
  scan();
})();

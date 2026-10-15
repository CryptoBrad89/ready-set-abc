/* Phoneme bench shared by Letter Post and Moonboat. */
(function () {
  const KEY = 'cursor-phoneme-test-verdicts';
  const audio = new Audio();
  audio.preload = 'none';
  let pack = null;
  let selected = 'A';
  let token = 0;
  let playing = '';
  let playedNote = '';

  const picker = document.getElementById('picker');
  const bench = document.getElementById('bench');
  const tally = document.getElementById('tally');
  const live = document.getElementById('announcer');

  function verdicts() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch (e) { return {}; }
  }

  function save(map) {
    localStorage.setItem(KEY, JSON.stringify(map));
  }

  function say(text) {
    if (live) live.textContent = text;
  }

  function letterOf(ch) {
    return pack.letters.find((item) => item.letter === ch);
  }

  function stopAudio() {
    token += 1;
    audio.pause();
    audio.removeAttribute('src');
    playing = '';
  }

  function playUrl(url, label) {
    const mine = token;
    playing = label;
    return new Promise((resolve) => {
      const done = () => {
        audio.onended = null;
        audio.onerror = null;
        if (mine === token) playing = '';
        resolve(mine === token);
      };
      audio.onended = done;
      audio.onerror = done;
      audio.src = url;
      const started = audio.play();
      if (started && started.catch) started.catch(done);
    });
  }

  async function playKinds(item, kinds) {
    stopAudio();
    const mine = token;
    for (const kind of kinds) {
      if (mine !== token) return;
      const file = item.files[kind];
      playing = item.letter + ' ' + kind;
      say(item.letter + ', ' + kind);
      render();
      const ok = await playUrl('../' + file, playing);
      if (!ok) return;
    }
    playedNote = 'Played ' + kinds.join(', ') + '.';
    render();
  }

  function setVerdict(letter, value) {
    const map = verdicts();
    if (map[letter] === value) delete map[letter];
    else map[letter] = value;
    save(map);
    say(letter + (map[letter] ? ' marked ' + map[letter] : ' mark cleared'));
    render();
  }

  function select(letter) {
    playedNote = '';
    selected = letter;
    if (location.hash !== '#' + letter) history.replaceState(null, '', '#' + letter);
    render();
    const button = picker.querySelector('[data-letter="' + letter + '"]');
    if (button) button.focus();
  }

  function renderPicker() {
    const map = verdicts();
    picker.innerHTML = '';
    pack.letters.forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.letter = item.letter;
      button.textContent = item.letter;
      button.setAttribute('aria-label', 'Letter ' + item.letter + (map[item.letter] ? ', ' + map[item.letter] : ''));
      if (item.letter === selected) button.setAttribute('aria-current', 'true');
      if (map[item.letter]) button.classList.add(map[item.letter]);
      button.addEventListener('click', () => select(item.letter));
      picker.appendChild(button);
    });
  }

  function renderTally() {
    const map = verdicts();
    let pass = 0;
    let fail = 0;
    pack.letters.forEach((item) => {
      if (map[item.letter] === 'pass') pass += 1;
      if (map[item.letter] === 'fail') fail += 1;
    });
    const open = pack.letters.length - pass - fail;
    tally.textContent = pass + ' pass, ' + fail + ' fail, ' + open + ' still open. Saved on this browser.';
  }

  function button(label, className, onClick) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = className;
    el.textContent = label;
    el.addEventListener('click', onClick);
    return el;
  }

  function renderBench() {
    const item = letterOf(selected);
    const map = verdicts();
    const verdict = map[item.letter] || '';
    bench.innerHTML = '';

    const head = document.createElement('div');
    head.className = 'bench-head';
    const title = document.createElement('h2');
    title.className = 'glyph';
    title.innerHTML = item.letter + '<small>' + item.lower + '</small>';
    const meta = document.createElement('p');
    meta.className = 'meta';
    const flag = item.phoneme_status === 'failed' ? ' <span class="failed-flag">v4 phoneme failed</span>' : '';
    meta.innerHTML = '<b>' + item.word + '</b> · sound ' + item.ipa + flag;
    head.append(title, meta);
    bench.appendChild(head);

    const note = document.createElement('p');
    note.className = 'prompt-note';
    note.textContent = 'Name “' + item.name_prompt + '” · sound “' + item.phoneme_prompt + '” · word “' + item.word_prompt + '”.';
    bench.appendChild(note);

    const plays = document.createElement('div');
    plays.className = 'plays';
    plays.append(
      button('Name, sound, word', 'primary', () => playKinds(item, ['name', 'phoneme', 'word'])),
      button('1 Name', '', () => playKinds(item, ['name'])),
      button('2 Sound', '', () => playKinds(item, ['phoneme'])),
      button('3 Word', '', () => playKinds(item, ['word'])),
      button('4 Starfall', '', () => playKinds(item, ['reference']))
    );
    bench.appendChild(plays);

    const marks = document.createElement('div');
    marks.className = 'marks';
    const pass = button('Pass', 'pass', () => setVerdict(item.letter, 'pass'));
    const fail = button('Fail', 'fail', () => setVerdict(item.letter, 'fail'));
    pass.setAttribute('aria-pressed', verdict === 'pass' ? 'true' : 'false');
    fail.setAttribute('aria-pressed', verdict === 'fail' ? 'true' : 'false');
    const clear = button('Clear this letter', 'ghost', () => {
      const next = verdicts();
      delete next[item.letter];
      save(next);
      say(item.letter + ' mark cleared');
      render();
    });
    marks.append(pass, fail, clear);
    bench.appendChild(marks);

    const status = document.createElement('p');
    status.className = 'status-line';
    status.setAttribute('role', 'status');
    status.textContent = playing ? 'Playing ' + playing + '.' : (playedNote || (verdict ? 'Marked ' + verdict + '.' : 'No mark yet.'));
    bench.appendChild(status);
  }

  function render() {
    renderPicker();
    renderTally();
    renderBench();
  }

  document.addEventListener('keydown', (event) => {
    if (!pack || event.metaKey || event.ctrlKey || event.altKey) return;
    const item = letterOf(selected);
    const index = pack.letters.findIndex((entry) => entry.letter === selected);
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      select(pack.letters[(index + 1) % pack.letters.length].letter);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      select(pack.letters[(index + pack.letters.length - 1) % pack.letters.length].letter);
    } else if (event.key === '1') {
      playKinds(item, ['name']);
    } else if (event.key === '2') {
      playKinds(item, ['phoneme']);
    } else if (event.key === '3') {
      playKinds(item, ['word']);
    } else if (event.key === '4') {
      playKinds(item, ['reference']);
    } else if (event.key === '0' || event.key === 'Enter' && event.target === document.body) {
      playKinds(item, ['name', 'phoneme', 'word']);
    } else if (event.key === 'p' || event.key === 'P') {
      setVerdict(item.letter, 'pass');
    } else if (event.key === 'f' || event.key === 'F') {
      setVerdict(item.letter, 'fail');
    }
  });

  const clearAll = document.getElementById('clear-all');
  if (clearAll) {
    clearAll.addEventListener('click', () => {
      save({});
      say('All marks cleared');
      render();
    });
  }

  fetch('../clips.json')
    .then((response) => response.json())
    .then((data) => {
      pack = data;
      const fromHash = (location.hash || '').replace('#', '').toUpperCase();
      if (letterOf(fromHash)) selected = fromHash;
      render();
    })
    .catch(() => {
      bench.textContent = 'The clip list did not load.';
    });
})();

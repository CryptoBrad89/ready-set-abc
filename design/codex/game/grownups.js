(() => {
'use strict';
const alphabet = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
const numberWords = ['zero','one','two','three','four','five','six','seven','eight','nine'];
window.Grownups = {
  create({kind, title, themes}) {
    const key = `little-woof-${kind}-settings`;
    let settings = {version:1, letters:[...alphabet], sound:true};
    let storage = 'saved', adapter, dialog, answer = '', previousAnswer = '';
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const value = JSON.parse(raw);
        if (!value || value.version !== 1 || typeof value.sound !== 'boolean' || !Array.isArray(value.letters) || !value.letters.length || value.letters.some(letter => !alphabet.includes(letter)) || new Set(value.letters).size !== value.letters.length) throw new Error('Invalid settings');
        settings = {version:1, letters:alphabet.filter(letter => value.letters.includes(letter)), sound:value.sound};
      }
    } catch (error) {
      storage = error instanceof SyntaxError || error.message === 'Invalid settings' ? 'invalid' : 'unavailable';
    }
    function notice(themeOK = true) {
      if (storage === 'unavailable' || !themeOK) return 'Some settings are saved for this visit only. Browser storage is unavailable.';
      if (storage === 'invalid') return 'Saved settings could not be read. Default letters and sound are in use until you save.';
      return 'Settings stay in this browser, for this world only.';
    }
    function persist() {
      try { localStorage.setItem(key, JSON.stringify(settings)); storage = 'saved'; }
      catch (error) { storage = 'unavailable'; }
      if (adapter) adapter.refreshNotice();
    }
    function close() { dialog.close(); }
    function panel() {
      const visited = adapter.getVisited();
      dialog.innerHTML = `<div class="grownups-top"><p class="grownups-kicker">${title}</p><button type="button" data-close>Close</button></div>
        <h2 id="grownups-title" tabindex="-1">A little room for grown-ups</h2>
        <p class="grownups-intro">Choose what fits today. Play will return to the letter picker.</p>
        <form id="grownups-settings" novalidate>
          <fieldset><legend>Letters to explore</legend><p id="grownups-letters-hint">Choose one or more letters for the picker and “Another sound”. Picture choices may include other letters.</p>
          <div class="grownups-selection"><span id="grownups-letter-count" role="status"></span><div><button type="button" id="grownups-all">All letters</button><button type="button" id="grownups-clear">Clear selection</button></div></div>
          <div class="grownups-letters">${alphabet.map(letter => `<label><input type="checkbox" name="grownups-letter" value="${letter}" ${settings.letters.includes(letter)?'checked':''} aria-describedby="grownups-letters-hint grownups-letters-error"><span>${letter}</span></label>`).join('')}</div>
          <p id="grownups-letters-error" class="grownups-error" role="alert"></p></fieldset>
          <div class="grownups-options"><label class="grownups-sound"><input type="checkbox" id="grownups-sound" ${settings.sound?'checked':''}><span>Play sound<small>Lucy’s voice and game sounds. The speaker button can change this during play.</small></span></label>
          <label class="grownups-theme" for="grownups-theme">Color theme<select id="grownups-theme">${themes.map((name,index)=>`<option value="${index}" ${adapter.getTheme()===index?'selected':''}>${name}</option>`).join('')}</select></label></div>
          <section class="grownups-visit" aria-labelledby="grownups-visit-title"><h3 id="grownups-visit-title">This visit</h3><p><strong>${visited.length} of 26 letters explored</strong>${visited.length ? ` · ${visited.join(', ')}` : '. Pick a letter together to begin.'}</p><p>The collection records pictures found this visit, not mastery. It starts fresh when the page reloads.</p></section>
          <details class="grownups-help"><summary>Playing together</summary><p>Listen to a letter and its sound, then find its picture. Tap the speaker to hear it again. For X, listen for the ending sound in “fox”.</p><p>No account is needed. Letter and sound settings stay in this browser for this world. Collections last only for this visit.</p></details>
          <p class="grownups-storage">${notice(adapter.themeStorageOK())}</p>
          <div class="grownups-actions"><p>Changes apply when you save. Cancel, Close or Escape discards them.</p><div><button type="button" data-close>Cancel</button><button type="submit" class="grownups-primary">Save and return</button></div></div>
        </form>`;
      const boxes = [...dialog.querySelectorAll('[name="grownups-letter"]')];
      const updateCount = () => { dialog.querySelector('#grownups-letter-count').textContent = `${boxes.filter(box=>box.checked).length} of 26 selected`; dialog.querySelector('#grownups-letters-error').textContent = ''; };
      boxes.forEach(box => box.onchange = updateCount);
      dialog.querySelector('#grownups-all').onclick = () => { boxes.forEach(box=>box.checked=true); updateCount(); };
      dialog.querySelector('#grownups-clear').onclick = () => { boxes.forEach(box=>box.checked=false); updateCount(); };
      updateCount();
      dialog.querySelector('form').onsubmit = async event => {
        event.preventDefault();
        const selected = boxes.filter(box=>box.checked).map(box=>box.value);
        if (!selected.length) {
          dialog.querySelector('#grownups-letters-error').textContent = 'Choose at least one letter so there is a sound to explore.';
          boxes[0].focus();
          return;
        }
        settings = {version:1, letters:selected, sound:dialog.querySelector('#grownups-sound').checked};
        persist();
        adapter.setSound(settings.sound);
        adapter.setTheme(Number(dialog.querySelector('#grownups-theme').value));
        adapter.refreshNotice();
        await adapter.goHome();
        close();
        adapter.announce(storage === 'unavailable' || !adapter.themeStorageOK() ? 'Changes applied for this visit. Browser storage is unavailable.' : 'Settings saved. Choose a letter to play.');
      };
      dialog.querySelector('#grownups-title').focus();
      dialog.scrollTop = 0;
    }
    return {
      get settings() { return settings; },
      notice,
      setSound(sound) { settings = {...settings, sound}; persist(); },
      isOpen() { return Boolean(dialog && dialog.open); },
      mount(value) {
        adapter = value;
        dialog = document.createElement('dialog');
        dialog.id = 'grownups-dialog';
        dialog.className = 'grownups-dialog';
        dialog.setAttribute('aria-labelledby', 'grownups-title');
        document.body.append(dialog);
        dialog.addEventListener('click', event => { if(event.target.closest('[data-close]')) close(); });
        dialog.addEventListener('close', () => { dialog.innerHTML = ''; document.querySelector('#grownups-entry').focus({preventScroll:true}); });
      },
      async open(trigger) {
        if (dialog.open || trigger.disabled) return;
        trigger.disabled = true;
        const ready = await adapter.goHome();
        trigger.disabled = false;
        if (!ready) return;
        answer = String(100 + Math.floor(Math.random()*900));
        if (answer === previousAnswer) answer = String(100 + (Number(answer) - 99) % 900);
        previousAnswer = answer;
        dialog.innerHTML = `<div class="grownups-top"><p class="grownups-kicker">A moment for grown-ups</p><button type="button" data-close>Close</button></div>
          <h2 id="grownups-title">Before you come in</h2><p>Play has returned to the letter picker. This reading check helps keep little explorers in the game.</p>
          <form id="grownups-gate" novalidate><label for="grownups-answer" id="grownups-challenge">Type these three digits in order<br><strong>${[...answer].map(digit=>numberWords[Number(digit)]).join(' · ')}</strong></label>
          <input id="grownups-answer" type="text" inputmode="numeric" autocomplete="off" maxlength="3" pattern="[0-9]{3}" aria-describedby="grownups-gate-error" autofocus>
          <p id="grownups-gate-error" class="grownups-error" role="alert"></p><div class="grownups-gate-actions"><button type="button" data-close>Back to play</button><button type="submit" class="grownups-primary">Continue</button></div></form>`;
        dialog.querySelector('form').onsubmit = event => {
          event.preventDefault();
          const input = dialog.querySelector('#grownups-answer');
          if(input.value.trim() === answer) panel();
          else { dialog.querySelector('#grownups-gate-error').textContent = 'Those digits don’t match yet. Read the words above and try again.'; input.setAttribute('aria-invalid','true'); input.select(); }
        };
        dialog.showModal();
        dialog.scrollTop = 0;
      }
    };
  }
};
})();

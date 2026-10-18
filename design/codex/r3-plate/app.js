(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const routes = ['home', 'trail', 'listen', 'celebrate', 'grownups'];
  const pictures = {
    sun: { name: 'Sun', voice: 'lucy-word-s-sun' },
    apple: { name: 'Apple', voice: 'lucy-word-a-apple' },
    cat: { name: 'Cat', voice: 'lucy-word-c-cat' }
  };
  const sound = { music: true, sfx: true, voice: true };
  let current = '';
  let selected = '';
  let pin = '';
  let unlocked = false;
  let round = 3;
  let audioCtx;
  let musicTimer;
  let voicePlayer;
  let started = false;
  let transition = 0;
  let confetti = [];
  let raf = 0;
  let drip = 0;

  try {
    const saved = JSON.parse(localStorage.getItem('rsabc-r3-audio') || '{}');
    for (const key of Object.keys(sound)) {
      if (typeof saved?.[key] === 'boolean') sound[key] = saved[key];
    }
    const savedRound = Number(localStorage.getItem('rsabc-r3-round'));
    if (Number.isInteger(savedRound) && savedRound >= 1 && savedRound <= 6) round = savedRound;
  } catch {}

  function store() {
    try {
      localStorage.setItem('rsabc-r3-audio', JSON.stringify(sound));
      localStorage.setItem('rsabc-r3-round', String(round));
    } catch {}
  }

  $('#eyebrow').textContent = 'LITTLE SOUNDS. BIG DISCOVERIES.';
  $('#home-line').textContent = 'A little sound. A happy discovery. Let’s play!';
  $('#lucy-line').textContent = 'Ready? Let’s find a sound!';
  $('#mascot-caption').textContent = 'Your little learning friend.';
  ['Hello,', 'little S!'].forEach((line, row) => {
    const lineNode = document.createElement('span');
    lineNode.className = 'line';
    lineNode.setAttribute('aria-hidden', 'true');
    [...line].forEach((letter, index) => {
      const glyph = document.createElement('span');
      glyph.className = 'glyph';
      glyph.style.setProperty('--i', index + row * 4);
      glyph.textContent = letter === ' ' ? '\u00a0' : letter;
      lineNode.append(glyph);
    });
    $('#hello').append(lineNode);
  });
  $('#hello').setAttribute('aria-label', 'Hello, little S!');
  document.querySelectorAll('.beads b').forEach((bead, index) => bead.style.setProperty('--i', index));

  const ambient = $('.ambient');
  for (let index = 0; index < 16; index++) {
    const particle = document.createElement('i');
    particle.style.cssText = `left:${(index * 47 + 9) % 97}%;top:${(index * 31 + 13) % 92}%;--delay:${-index * .7}s;font-size:${15 + index % 4 * 10}px`;
    ambient.append(particle);
  }

  function themeChanged(announce = true) {
    const key = document.documentElement.dataset.theme;
    const theme = window.THEMES[key];
    document.querySelectorAll('[data-theme-choice]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.themeChoice === key));
    });
    [...ambient.children].forEach((particle, index) => {
      particle.textContent = theme.particles[index % theme.particles.length];
    });
    const colors = [theme.palette.primary, theme.palette.accent, theme.palette.secondary, theme.palette.paper];
    confetti.forEach((piece, index) => { piece.color = colors[index % colors.length]; });
    if (announce) $('#theme-status').textContent = `${theme.name} colors are on.`;
  }
  document.addEventListener('themechange', () => themeChanged());
  themeChanged(false);

  function voice(name) {
    if (!sound.voice) return;
    voicePlayer?.pause();
    voicePlayer = new Audio(`assets/${name}.mp3`);
    document.body.classList.add('speaking');
    const settle = () => document.body.classList.remove('speaking');
    voicePlayer.onended = settle;
    voicePlayer.onerror = settle;
    voicePlayer.play().catch(settle);
  }

  function tone(frequency, duration = .12, gain = .07) {
    if (!audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const volume = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    volume.gain.setValueAtTime(gain, audioCtx.currentTime);
    volume.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + duration);
    oscillator.connect(volume);
    volume.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }

  function sfx(win = false) {
    if (!sound.sfx) return;
    tone(win ? 523 : 330);
    if (win) {
      setTimeout(() => { if (sound.sfx) tone(659, .12); }, 100);
      setTimeout(() => { if (sound.sfx) tone(784, .22); }, 200);
    }
  }

  function music() {
    clearInterval(musicTimer);
    if (!sound.music || !started) return;
    let index = 0;
    const notes = [261.6, 329.6, 392, 329.6, 293.7, 349.2, 440, 349.2];
    musicTimer = setInterval(() => tone(notes[index++ % notes.length], .7, .012), 720);
  }

  function unlockAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    audioCtx?.resume().catch(() => {});
    if (!started) {
      started = true;
      music();
    }
  }

  function audioButtons() {
    document.querySelectorAll('[data-audio]').forEach(button => {
      button.setAttribute('aria-pressed', String(sound[button.dataset.audio]));
    });
    $('#round').innerHTML = `${round} letters <span>↻</span>`;
  }
  audioButtons();

  const canvas = $('#confetti');
  const ctx = canvas.getContext('2d');
  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }
  resize();
  addEventListener('resize', resize);

  function star(x, y, radius) {
    ctx.beginPath();
    for (let index = 0; index < 10; index++) {
      const angle = index * Math.PI / 5 - Math.PI / 2;
      const distance = index % 2 ? radius * .45 : radius;
      ctx.lineTo(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance);
    }
    ctx.closePath();
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const piece of confetti) {
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.vy += .13;
      piece.rotation += piece.spin;
      piece.life--;
      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.rotate(piece.rotation);
      ctx.globalAlpha = Math.min(1, piece.life / 25);
      ctx.fillStyle = piece.color;
      if (piece.shape === 0) star(0, 0, piece.size);
      else if (piece.shape === 1) ctx.fillRect(-piece.size / 2, -piece.size, piece.size, piece.size * 1.6);
      else {
        ctx.beginPath();
        ctx.arc(0, 0, piece.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    confetti = confetti.filter(piece => piece.life > 0 && piece.y < innerHeight + 30);
    if (confetti.length) raf = requestAnimationFrame(draw);
    else {
      raf = 0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function burst(count = 120, top = false) {
    if (reduced.matches) return;
    const palette = window.THEMES[document.documentElement.dataset.theme].palette;
    const colors = [palette.primary, palette.accent, palette.secondary, palette.paper];
    for (let index = 0; index < count; index++) {
      confetti.push({
        x: top ? Math.random() * innerWidth : innerWidth * (.25 + Math.random() * .5),
        y: top ? -10 : innerHeight * .38,
        vx: (Math.random() - .5) * (top ? 2 : 15),
        vy: top ? 1 + Math.random() * 2 : -6 - Math.random() * 9,
        size: 4 + Math.random() * 7,
        color: colors[index % colors.length],
        rotation: Math.random() * 6,
        spin: (Math.random() - .5) * .2,
        life: 110 + Math.random() * 70,
        shape: index % 3
      });
    }
    confetti = confetti.slice(-260);
    if (!raf) draw();
  }

  function clearConfetti() {
    clearInterval(drip);
    cancelAnimationFrame(raf);
    raf = 0;
    confetti = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function selectPicture(choice) {
    selected = choice;
    document.querySelectorAll('.choice').forEach(button => {
      const picked = button.dataset.choice === choice;
      button.classList.toggle('is-picked', picked);
      button.setAttribute('aria-pressed', String(picked));
    });
  }

  function applyRoute(name, first) {
    current = name;
    document.body.dataset.current = name;
    document.querySelectorAll('.screen').forEach(screen => {
      const active = screen.dataset.screen === name;
      screen.classList.toggle('is-on', active);
      screen.setAttribute('aria-hidden', String(!active));
      screen.inert = !active;
    });
    document.querySelectorAll('.proto [data-go]').forEach(button => {
      const active = button.dataset.go === name;
      button.classList.toggle('is-here', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    clearConfetti();
    if (name === 'celebrate') {
      burst(160);
      if (!reduced.matches) drip = setInterval(() => burst(8, true), 300);
      if (started) voice('lucy-cheer-1');
    }
    if (name === 'listen') {
      selectPicture('');
      $('#feedback').textContent = '① Pick a picture. ② Tap S to match.';
      if (started) voice('lucy-phoneme-s');
    }
    if (!first) {
      const heading = $(`[data-screen="${name}"] h1, [data-screen="${name}"] h2`);
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  }

  async function route(name, first = false) {
    if (!routes.includes(name)) name = 'home';
    const token = ++transition;
    if (name === current) {
      document.body.classList.remove('is-transitioning');
      return;
    }
    if (!first && !reduced.matches) {
      document.body.classList.add('is-transitioning');
      await new Promise(resolve => setTimeout(resolve, 430));
      if (token !== transition) return;
    }
    applyRoute(name, first);
    document.body.classList.remove('is-transitioning');
  }

  function go(name) {
    if (location.hash.slice(1) === name) route(name);
    else location.hash = name;
  }
  addEventListener('hashchange', () => route(location.hash.slice(1)));
  route(location.hash.slice(1) || 'home', true);

  function tap(event, button) {
    if (reduced.matches) return;
    button.animate([
      { transform: 'scale(.94,1.04)' },
      { transform: 'scale(1.055,.96)' },
      { transform: 'scale(1)' }
    ], { duration: 370, easing: 'cubic-bezier(.2,.8,.3,1)' });
    const ripple = document.createElement('span');
    ripple.className = 'tap-pop tap-ripple';
    ripple.setAttribute('aria-hidden', 'true');
    const rect = button.getBoundingClientRect();
    ripple.style.left = `${event.clientX || rect.x + rect.width / 2}px`;
    ripple.style.top = `${event.clientY || rect.y + rect.height / 2}px`;
    document.body.append(ripple);
    setTimeout(() => ripple.remove(), 700);
  }

  function enterPin(key) {
    if (unlocked) return;
    pin += key;
    document.querySelectorAll('.pin i').forEach((dot, index) => { dot.textContent = pin[index] ? '●' : '○'; });
    if (pin.length !== 4) return;
    if (pin === '1234') {
      unlocked = true;
      $('#pin-note').textContent = 'You’re in. Tap round size to adjust your next play.';
      $('#round').disabled = false;
    } else {
      $('#pin-note').textContent = 'Try 1 · 2 · 3 · 4. A little grown-up check.';
      pin = '';
      setTimeout(() => {
        document.querySelectorAll('.pin i').forEach((dot, index) => { dot.textContent = pin[index] ? '●' : '○'; });
      }, 450);
    }
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    tap(event, button);
    if (button.dataset.themeChoice) {
      window.applyTheme(button.dataset.themeChoice);
      return;
    }
    if (button.hasAttribute('data-start')) {
      unlockAudio();
      voice('lucy-name-s');
    }
    if (button.dataset.go) go(button.dataset.go);
    if (button.dataset.audio) {
      const key = button.dataset.audio;
      sound[key] = !sound[key];
      if (key === 'voice' && !sound.voice) {
        voicePlayer?.pause();
        document.body.classList.remove('speaking');
      }
      if (key === 'music') music();
      audioButtons();
      store();
    }
    if (button.dataset.letter) {
      unlockAudio();
      sfx();
      go('listen');
    }
    if (button.dataset.choice) {
      selectPicture(button.dataset.choice);
      const picture = pictures[selected];
      $('#feedback').textContent = `You picked ${picture.name}. Now tap S!`;
      voice(picture.voice);
      sfx();
    }
    if (button.id === 'hear') {
      unlockAudio();
      voice('lucy-phoneme-s');
    }
    if (button.id === 'check') {
      unlockAudio();
      if (!selected) {
        $('#feedback').textContent = 'Pick a picture first. Lucy is listening!';
        voice('lucy-phoneme-s');
      } else if (selected === 'sun') {
        sfx(true);
        burst(40);
        go('celebrate');
      } else {
        voice('lucy-nudge-1');
        $('#feedback').textContent = 'Almost! Listen for /s/ and try again.';
        selectPicture('');
      }
    }
    if (button.id === 'cheer') {
      unlockAudio();
      voice('lucy-cheer-1');
      burst(45);
    }
    if (button.dataset.key) enterPin(button.dataset.key);
    if (button.id === 'round' && unlocked) {
      round = round % 6 + 1;
      audioButtons();
      store();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') go('home');
    if (current === 'listen') {
      if (['1', '2', '3'].includes(event.key)) {
        event.preventDefault();
        document.querySelectorAll('.choice')[Number(event.key) - 1].click();
      }
      if (event.key === 'Enter' && !event.target.closest('button')) $('#check').click();
    }
    if (current === 'grownups' && /^[1-9]$/.test(event.key)) {
      event.preventDefault();
      enterPin(event.key);
    }
  });

  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      clearConfetti();
      document.querySelectorAll('.tap-pop').forEach(ripple => ripple.remove());
      route(location.hash.slice(1) || 'home');
    } else if (current === 'celebrate') {
      burst(80);
      drip = setInterval(() => burst(8, true), 300);
    }
  });
})();

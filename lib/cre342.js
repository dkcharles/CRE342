// CRE342 deck helpers: section label, countdown timers, cue timers.
// Load after reveal.js and call CRE342.init() after Reveal.initialize().
(function () {
  const fmt = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  // Short beep through Web Audio; used by cue timers when sound is on.
  let audio = null;
  function beep(freq = 880, ms = 160) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = freq; o.connect(g); g.connect(audio.destination);
      g.gain.setValueAtTime(0.15, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + ms / 1000);
      o.start(); o.stop(audio.currentTime + ms / 1000);
    } catch (e) { /* no audio available */ }
  }

  // Section label in the corner, hidden on title and divider slides
  function initChrome() {
    const chrome = document.getElementById('chrome');
    const label = document.getElementById('chrome-section');
    if (!chrome) return;
    const update = slide => {
      label.textContent = slide.dataset.section || '';
      chrome.classList.toggle('hide', slide.dataset.chrome === 'off');
    };
    Reveal.on('ready', e => update(e.currentSlide));
    Reveal.on('slidechanged', e => update(e.currentSlide));
  }

  // <span class="timer" data-seconds="30">: click to start a countdown
  function initCountdowns() {
    document.querySelectorAll('.timer').forEach(t => {
      const total = +t.dataset.seconds; let id = null;
      t.textContent = fmt(total);
      t.addEventListener('click', () => {
        clearInterval(id); t.classList.remove('done');
        let left = total; t.textContent = fmt(left);
        id = setInterval(() => {
          left--; t.textContent = fmt(left);
          if (left <= 0) { clearInterval(id); t.classList.add('done'); t.textContent = 'Time'; beep(660, 400); }
        }, 1000);
      });
    });
  }

  // <div class="cue-timer" data-duration="180"> with <li data-at="45"> cues.
  // Button or the T key starts/pauses; R resets. Cues light up as they come due.
  const cueTimers = [];
  function initCueTimers() {
    document.querySelectorAll('.cue-timer').forEach(el => {
      const dur = +el.dataset.duration;
      const clock = el.querySelector('.ct-clock');
      const bar = el.querySelector('.ct-bar i');
      const btn = el.querySelector('.ct-start');
      const reset = el.querySelector('.ct-reset');
      const sound = el.querySelector('.ct-sound');
      const cues = [...el.querySelectorAll('[data-at]')].map(li => ({ li, at: +li.dataset.at, fired: false }));
      const st = { running: false, elapsed: 0, last: 0, id: null, soundOn: false };
      const render = () => {
        const e = st.elapsed;
        clock.textContent = fmt(e);
        bar.style.width = Math.min(100, e / dur * 100) + '%';
        cues.forEach(c => {
          c.li.classList.toggle('soon', e >= c.at - 5 && e < c.at);
          c.li.classList.toggle('now', e >= c.at && e < c.at + 8);
          c.li.classList.toggle('done', e >= c.at + 8);
          if (!c.fired && e >= c.at && st.running) { c.fired = true; if (st.soundOn) beep(); }
        });
        el.classList.toggle('over', e >= dur);
      };
      const tick = () => {
        const now = performance.now(); st.elapsed += (now - st.last) / 1000; st.last = now;
        if (st.elapsed >= dur) { st.elapsed = dur; stop(); if (st.soundOn) beep(520, 700); btn.textContent = 'Done'; }
        render();
      };
      const start = () => { if (st.elapsed >= dur) return; st.running = true; st.last = performance.now(); st.id = setInterval(tick, 200); btn.textContent = 'Pause'; el.classList.add('running'); };
      const stop = () => { st.running = false; clearInterval(st.id); btn.textContent = 'Resume'; el.classList.remove('running'); };
      const toggle = () => st.running ? stop() : start();
      const doReset = () => { stop(); st.elapsed = 0; cues.forEach(c => c.fired = false); btn.textContent = 'Start'; render(); };
      btn.addEventListener('click', toggle);
      reset && reset.addEventListener('click', doReset);
      sound && sound.addEventListener('click', () => { st.soundOn = !st.soundOn; sound.textContent = st.soundOn ? 'Sound on' : 'Sound off'; if (st.soundOn) beep(); });
      el.querySelector('.ct-total').textContent = '/ ' + fmt(dur);
      render();
      cueTimers.push({ el, toggle, doReset });
    });
  }
  const currentCueTimer = () => cueTimers.find(t => Reveal.getCurrentSlide().contains(t.el));

  window.CRE342 = {
    init() {
      initChrome(); initCountdowns(); initCueTimers();
      Reveal.addKeyBinding({ keyCode: 84, key: 'T', description: 'Start/pause cue timer' }, () => { const t = currentCueTimer(); t && t.toggle(); });
      Reveal.addKeyBinding({ keyCode: 82, key: 'R', description: 'Reset cue timer' }, () => { const t = currentCueTimer(); t && t.doReset(); });
    }
  };
})();

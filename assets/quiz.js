// Self-marking quiz. Reads window.QUIZ = {title, questions: [{q, a: [...], correct, why}]}.
// Nothing leaves the browser; the best score is remembered in localStorage when available.
(function () {
  const quiz = window.QUIZ;
  const root = document.getElementById('quiz');
  const KEY = 'cre342-quiz-best-week-' + quiz.week;
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };
  let order, i, score, answers, locked;

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function shuffle(a) { for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; }

  function start() {
    order = shuffle(quiz.questions.map((q, n) => n));
    i = 0; score = 0; answers = []; show();
  }

  function show() {
    locked = false;
    const q = quiz.questions[order[i]];
    // shuffle answer positions each attempt, remembering where the right one went
    const opts = shuffle(q.a.map((text, n) => ({ text, right: n === q.correct })));
    root.innerHTML = `
      <div class="progress" aria-hidden="true"><i style="width:${(i / order.length) * 100}%"></i></div>
      <div class="qnum">Question ${i + 1} of ${order.length}</div>
      <h2 class="question" id="qtext" tabindex="-1">${esc(q.q)}</h2>
      <div class="answers" role="group" aria-labelledby="qtext">
        ${opts.map((o, n) => `<button class="answer" data-right="${o.right}"><span class="k">${n + 1}</span><span>${esc(o.text)}</span></button>`).join('')}
      </div>
      <div class="feedback" role="status" aria-live="polite"></div>
      <div class="next"></div>`;
    root.querySelectorAll('.answer').forEach(b => b.addEventListener('click', () => pick(b, q)));
    if (i > 0) root.querySelector("#qtext").focus({ preventScroll: true });
  }

  function pick(btn, q) {
    if (locked) return; locked = true;
    const right = btn.dataset.right === 'true';
    if (right) score++;
    answers.push({ q: q.q, right, correct: q.a[q.correct] });
    root.querySelectorAll('.answer').forEach(b => {
      b.disabled = true;
      if (b.dataset.right === 'true') b.classList.add('right');
    });
    if (!right) btn.classList.add('wrong');
    const fb = root.querySelector('.feedback');
    fb.innerHTML = `<strong class="${right ? 'ok' : 'no'}">${right ? 'Correct.' : 'Not quite.'}</strong> ${esc(q.why)}`;
    fb.classList.add('show');
    const last = i === order.length - 1;
    root.querySelector('.next').innerHTML = `<button class="btn primary">${last ? 'See my score' : 'Next question'} →</button>`;
    const nb = root.querySelector('.next button');
    nb.addEventListener('click', () => { if (last) finish(); else { i++; show(); } });
    nb.focus({ preventScroll: true });
  }

  function finish() {
    const best = store.get();
    if (!best || score > best.score) store.set({ score, of: order.length });
    const pct = Math.round((score / order.length) * 100);
    const msg = pct === 100 ? 'Perfect.' : pct >= 70 ? 'Solid. Check the ones you missed.' : 'Worth another look at the slides, then try again.';
    root.innerHTML = `
      <div class="progress" aria-hidden="true"><i style="width:100%"></i></div>
      <div class="qnum">Your score</div>
      <div class="score">${score} / ${order.length}</div>
      <p class="lead">${msg}${best ? ` <span class="muted">Your best so far: ${Math.max(best.score, score)} / ${order.length}.</span>` : ''}</p>
      <h2>Review</h2>
      <ol class="review">${answers.map(a => `<li><span class="${a.right ? 'ok' : 'no'}">${a.right ? '✓' : '✗'}</span> ${esc(a.q)}${a.right ? '' : `<br><span class="muted">Answer: ${esc(a.correct)}</span>`}</li>`).join('')}</ol>
      <p><button class="btn primary" id="again">Try again</button></p>`;
    document.getElementById('again').addEventListener('click', start);
  }

  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 4 && !locked) { const b = root.querySelectorAll('.answer')[n - 1]; if (b) b.click(); }
  });

  start();
})();

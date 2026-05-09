/* =========================================================
   SBTI GAME ENGINE
   ========================================================= */

const $ = id => document.getElementById(id);

let state = {
  qIndex: 0,
  scores: {},      // dim → cumulative score
  counts: {},      // dim → number of questions answered
  answers: [],
};

function initState() {
  state.qIndex = 0;
  state.scores = {};
  state.counts = {};
  state.answers = [];
  DIMS.forEach(d => { state.scores[d.id] = 0; state.counts[d.id] = 0; });
}

/* ── Screens ── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo(0, 0);
}

/* ── Render question ── */
function renderQuestion() {
  const q = QUESTIONS[state.qIndex];
  const dim = DIMS.find(d => d.id === q.dim);

  $('qNumText').textContent = state.qIndex + 1;
  $('modelText').textContent = dim.model;
  $('dimText').textContent = dim.id;
  $('qLabel').textContent = `Q${state.qIndex + 1}`;
  $('qText').textContent = q.text;
  $('progressBar').style.width = `${(state.qIndex / QUESTIONS.length) * 100}%`;

  const body = $('qBody');
  body.innerHTML = '';

  if (q.type === 'scale5') {
    const labels = document.createElement('div');
    labels.className = 'scale-labels';
    labels.innerHTML = '<span>非常不同意</span><span>非常同意</span>';
    body.appendChild(labels);

    const row = document.createElement('div');
    row.className = 'scale-row';
    const vals = [-2, -1, 0, 1, 2];
    const labelTexts = ['1', '2', '3', '4', '5'];
    vals.forEach((v, i) => {
      const btn = document.createElement('button');
      btn.className = 'scale-btn';
      btn.textContent = labelTexts[i];
      btn.dataset.score = v;
      btn.addEventListener('click', () => handleAnswer(q, v, btn, row));
      row.appendChild(btn);
    });
    body.appendChild(row);
  } else {
    const grid = document.createElement('div');
    grid.className = 'options-grid';
    q.choices.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'opt-btn';
      btn.textContent = c.text;
      btn.addEventListener('click', () => handleAnswer(q, c.score, btn, grid));
      grid.appendChild(btn);
    });
    body.appendChild(grid);
  }
}

function handleAnswer(q, score, btnEl, container) {
  /* visual feedback */
  container.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
  btnEl.classList.add('selected');
  container.querySelectorAll('button').forEach(b => b.disabled = true);

  /* record */
  const actualScore = score * q.dir;
  state.scores[q.dim] = (state.scores[q.dim] || 0) + actualScore;
  state.counts[q.dim] = (state.counts[q.dim] || 0) + 1;
  state.answers.push({ dim: q.dim, score: actualScore });

  setTimeout(nextQuestion, 350);
}

function nextQuestion() {
  state.qIndex++;
  if (state.qIndex >= QUESTIONS.length) {
    calcResult();
  } else {
    renderQuestion();
  }
}

/* ── Scoring ── */
function normalizeDim(dim) {
  const raw = state.scores[dim];
  const cnt = state.counts[dim] || 1;
  /* each question contributes -2 to +2, max abs sum = cnt*2 */
  const norm = raw / (cnt * 2);   /* -1 to +1 */
  if (norm < -0.25) return -1;    /* L */
  if (norm > 0.25)  return  1;    /* H */
  return 0;                       /* M */
}

function euclidean(typeProfile) {
  let sum = 0;
  DIMS.forEach(d => {
    const userVal = normalizeDim(d.id);
    const typeVal = typeProfile[d.id] !== undefined ? typeProfile[d.id] : 0;
    sum += Math.pow(userVal - typeVal, 2);
  });
  return Math.sqrt(sum);
}

function calcResult() {
  showScreen('loading-screen');

  setTimeout(() => {
    /* find closest type */
    let best = null, bestDist = Infinity;
    TYPES.forEach(t => {
      const d = euclidean(t.profile);
      if (d < bestDist) { bestDist = d; best = t; }
    });
    showResult(best);
  }, 1800);
}

/* ── Result ── */
function showResult(type) {
  $('resultType').textContent = type.emoji + ' ' + type.code;
  $('resultName').textContent = type.name + (type.hidden ? ' 🔒 隐藏类型' : '');
  $('resultTagline').textContent = type.tagline;
  $('resultDesc').textContent = type.desc;

  /* dimension bars */
  const grid = $('dimGrid');
  grid.innerHTML = '';
  DIMS.forEach(d => {
    const val = normalizeDim(d.id);
    const pct = ((val + 1) / 2) * 100;
    const levelLabel = val === -1 ? 'L' : val === 1 ? 'H' : 'M';
    const colors = ['#60a5fa', '#a78bfa', '#34d399'];
    const color = val === -1 ? colors[0] : val === 1 ? colors[2] : colors[1];

    const item = document.createElement('div');
    item.className = 'dim-item';
    item.innerHTML = `
      <div class="dim-label">${d.model} · ${d.id}</div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:12px;color:#aaa">${d.label}</span>
        <span class="dim-value" style="color:${color}">${levelLabel}</span>
      </div>
      <div class="dim-bar-wrap">
        <div class="dim-bar" style="width:${pct}%;background:${color}"></div>
      </div>
    `;
    grid.appendChild(item);
  });

  showScreen('result-screen');
}

/* ── Share ── */
$('shareBtn').addEventListener('click', () => {
  const typeCode = $('resultType').textContent;
  const typeName = $('resultName').textContent;
  const tagline  = $('resultTagline').textContent;
  const text = `我的 SBTI 测试结果是：${typeCode} ${typeName}\n"${tagline}"\n\n快来测测你是什么类型！`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      const btn = $('shareBtn');
      const orig = btn.textContent;
      btn.textContent = '已复制 ✓';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    });
  }
});

/* ── Init ── */
$('startBtn').addEventListener('click', () => {
  initState();
  showScreen('test-screen');
  renderQuestion();
});

$('retestBtn').addEventListener('click', () => {
  initState();
  showScreen('intro-screen');
});

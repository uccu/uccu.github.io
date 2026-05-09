/* =============================================================
   明日方舟 博士人格测试 — GAME ENGINE
   ============================================================= */

const $ = id => document.getElementById(id);

/* ── State ── */
let state = {
  qIndex: 0,
  scores: {},
  counts: {},
  mode: 'battle',       /* 'battle' | 'daily' */
  sampledDaily: [],     /* random subset for daily mode */
};

function initState() {
  state.qIndex = 0;
  state.scores = {};
  state.counts = {};
  DIMS.forEach(d => { state.scores[d.id] = 0; state.counts[d.id] = 0; });
}

/* ── Sample 20-30 daily questions ensuring all 15 dims covered ── */
function sampleDailyQuestions() {
  const TARGET_MIN = 20, TARGET_MAX = 30;
  const target = TARGET_MIN + Math.floor(Math.random() * (TARGET_MAX - TARGET_MIN + 1));
  const dimIds = DIMS.map(d => d.id);

  /* Fisher-Yates shuffle a copy */
  const pool = QUESTIONS_DAILY.slice().sort(() => Math.random() - 0.5);

  /* Guarantee one question per dimension first */
  const mandatory = [];
  const used = new Set();
  dimIds.forEach(dim => {
    const idx = pool.findIndex((q, i) => q.dim === dim && !used.has(i));
    if (idx !== -1) { mandatory.push(pool[idx]); used.add(idx); }
  });

  /* Fill remainder randomly up to target */
  const extras = pool.filter((_, i) => !used.has(i));
  const extra = extras.slice(0, target - mandatory.length);

  /* Combine and shuffle again */
  state.sampledDaily = mandatory.concat(extra).sort(() => Math.random() - 0.5);
}

function activeQuestions() {
  return state.mode === 'daily' ? state.sampledDaily : QUESTIONS;
}

/* ── Mode selection ── */
['modeBattle','modeDaily'].forEach(id => {
  $(id).addEventListener('click', () => {
    $(id === 'modeBattle' ? 'modeDaily' : 'modeBattle').classList.remove('selected');
    $(id).classList.add('selected');
    state.mode = id === 'modeDaily' ? 'daily' : 'battle';
    const btn = $('startBtn');
    btn.disabled = false;
    btn.style.opacity = '1';
    if (state.mode === 'daily') {
      btn.style.background = 'linear-gradient(135deg,#4cad7e 0%,#369a62 100%)';
      btn.style.boxShadow  = '0 4px 20px rgba(76,173,126,0.35)';
      btn.textContent = '▶ 开始日常互动测试';
    } else {
      btn.style.background = 'linear-gradient(135deg,#e07b39 0%,#c4622a 100%)';
      btn.style.boxShadow  = '0 4px 20px rgba(224,123,57,0.35)';
      btn.textContent = '▶ 开始决策维度测试';
    }
  });
});

/* ── Screen management ── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Render a question ── */
function renderQuestion() {
  const qs  = activeQuestions();
  const q   = qs[state.qIndex];
  const dim = DIMS.find(d => d.id === q.dim);

  /* HUD */
  const numStr = String(state.qIndex + 1).padStart(2, '0');
  $('qNum').innerHTML = `${numStr} <span>/ ${qs.length}</span>`;
  $('modelLabel').textContent = dim.model;
  $('dimLabel').textContent   = dim.id;
  $('progressBar').style.width = `${(state.qIndex / qs.length) * 100}%`;

  /* Scene tag */
  const sceneTag = $('sceneTag');
  sceneTag.textContent = q.scene;
  if (state.mode === 'daily') {
    sceneTag.classList.add('mode-daily');
  } else {
    sceneTag.classList.remove('mode-daily');
  }

  /* Operator involved badge (daily only) */
  const opWrap = $('opInvolved');
  if (state.mode === 'daily' && q.op) {
    $('opInvolvedImg').src  = AVATAR_BASE + q.op.charId + '.png';
    $('opInvolvedImg').alt  = q.op.name;
    $('opInvolvedName').textContent = q.op.name;
    $('opInvolvedSub').textContent  = q.op.role || '';
    opWrap.style.display = 'flex';
  } else {
    opWrap.style.display = 'none';
  }

  /* Question text */
  $('qText').textContent = q.text;

  /* Choices */
  const grid = $('choicesGrid');
  grid.innerHTML = '';
  const idxLabels = ['A', 'B', 'C', 'D'];
  q.choices.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.setAttribute('data-idx', idxLabels[i]);
    btn.innerHTML = `<span>${c.text}</span>`;
    btn.addEventListener('click', () => handleAnswer(q, c.score, btn));
    grid.appendChild(btn);
  });
}

/* ── Handle answer selection ── */
function handleAnswer(q, rawScore, btnEl) {
  const grid = $('choicesGrid');
  /* Prevent double-click */
  grid.querySelectorAll('.choice-btn').forEach(b => {
    b.disabled = true;
    b.classList.remove('selected');
  });
  btnEl.classList.add('selected');

  /* Record score (apply direction) */
  const actualScore = rawScore * q.dir;
  state.scores[q.dim] = (state.scores[q.dim] || 0) + actualScore;
  state.counts[q.dim] = (state.counts[q.dim] || 0) + 1;

  /* Advance after brief pause */
  setTimeout(nextQuestion, 400);
}

/* ── Next question or finish ── */
function nextQuestion() {
  state.qIndex++;
  if (state.qIndex >= activeQuestions().length) {
    calcResult();
  } else {
    renderQuestion();
  }
}

/* ── Scoring ── */
function normalizeDim(dimId) {
  const raw = state.scores[dimId] || 0;
  const cnt = state.counts[dimId] || 1;
  const norm = raw / (cnt * 2); /* −1 … +1 */
  if (norm < -0.25) return -1;  /* L */
  if (norm >  0.25) return  1;  /* H */
  return 0;                     /* M */
}

function euclidean(factionProfile) {
  let sum = 0;
  DIMS.forEach(d => {
    const uv = normalizeDim(d.id);
    const fv = factionProfile[d.id] !== undefined ? factionProfile[d.id] : 0;
    sum += (uv - fv) ** 2;
  });
  return Math.sqrt(sum);
}

function calcResult() {
  /* Update loading text by mode */
  const loadingP = document.querySelector('#loading-screen p');
  if (loadingP) loadingP.textContent = state.mode === 'daily'
    ? '正在分析博士的日常行为模式…'
    : '正在比对博士的决策档案…';
  showScreen('loading-screen');
  setTimeout(() => {
    let best = null, bestDist = Infinity;
    FACTIONS.forEach(f => {
      const d = euclidean(f.profile);
      if (d < bestDist) { bestDist = d; best = f; }
    });
    renderResult(best);
  }, 2000);
}

/* ── Render result ── */
function renderResult(faction) {
  /* Banner CSS variable for faction color */
  const banner = $('factionBanner');
  banner.style.setProperty('--faction-color', faction.color);

  /* Logo */
  const logoImg = $('factionLogoImg');
  const logoFb  = $('factionLogoFallback');
  const logoUrl = LOGO_BASE + faction.logoFile;
  logoImg.src = logoUrl;
  logoImg.style.display = 'block';
  logoFb.style.display  = 'none';
  logoImg.onerror = () => {
    logoImg.style.display = 'none';
    logoFb.textContent     = faction.emoji;
    logoFb.style.display   = 'block';
  };

  /* Eyebrow label by mode */
  $('resultEyebrow').textContent = state.mode === 'daily'
    ? '博士日常档案 · 阵营评测'
    : '博士决策档案 · 阵营评测';

  /* Code / name / tagline */
  $('resultCode').textContent     = faction.code;
  $('resultCode').style.color     = faction.color;
  $('resultFullname').textContent = faction.fullname;
  $('resultTagline').textContent  = faction.tagline;

  /* Representative operators */
  const opsRow = $('opsRow');
  opsRow.innerHTML = '';
  faction.operators.forEach(op => {
    const wrap = document.createElement('div');
    wrap.className = 'op-avatar';
    const img = document.createElement('img');
    img.src = AVATAR_BASE + op.charId + '.png';
    img.alt = op.name;
    img.onerror = () => { wrap.style.display = 'none'; };
    const nameTag = document.createElement('div');
    nameTag.className = 'op-name';
    nameTag.textContent = op.name;
    wrap.appendChild(img);
    wrap.appendChild(nameTag);
    opsRow.appendChild(wrap);
  });

  /* Apply faction color to result desc border via CSS var on result-wrap */
  document.querySelector('.result-wrap').style.setProperty('--faction-color', faction.color);

  /* Traits */
  const traitsRow = $('traitsRow');
  traitsRow.innerHTML = '';
  faction.traits.forEach(t => {
    const pill = document.createElement('span');
    pill.className = 'trait-pill';
    pill.textContent = t;
    traitsRow.appendChild(pill);
  });

  /* Description */
  $('resultDesc').textContent = faction.desc;

  /* Dimension bars */
  const dimGrid = $('dimGrid');
  dimGrid.innerHTML = '';
  const dimColors = { '-1': '#4a9cc8', '0': '#c4a85a', '1': '#4cad7e' };
  const dimLabels = { '-1': 'L', '0': 'M', '1': 'H' };
  DIMS.forEach(d => {
    const val  = normalizeDim(d.id);
    const pct  = ((val + 1) / 2) * 100;
    const color = dimColors[String(val)];
    const lv    = dimLabels[String(val)];

    const card = document.createElement('div');
    card.className = 'dim-card';
    card.innerHTML = `
      <div class="dim-id">${d.id} · ${d.model}</div>
      <div class="dim-top">
        <span class="dim-name">${d.label}</span>
        <span class="dim-lv" style="color:${color}">${lv}</span>
      </div>
      <div class="dim-bar-track">
        <div class="dim-bar-fill" style="width:${pct}%;background:${color}"></div>
      </div>
    `;
    dimGrid.appendChild(card);
  });

  showScreen('result-screen');
}

/* ── Share ── */
$('shareBtn').addEventListener('click', () => {
  const code     = $('resultCode').textContent;
  const fullname = $('resultFullname').textContent;
  const tagline  = $('resultTagline').textContent;
  const modeLabel = state.mode === 'daily' ? '（日常互动版）' : '（决策维度版）';
  const text = `我的明日方舟博士人格测试结果是：\n${code} · ${fullname}${modeLabel}\n${tagline}\n\n快来测测你属于哪个阵营！`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      const btn = $('shareBtn');
      const orig = btn.textContent;
      btn.textContent = '已复制 ✓';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    }).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
});

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity  = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  const btn = $('shareBtn');
  btn.textContent = '已复制 ✓';
  setTimeout(() => { btn.textContent = '复制结果分享'; }, 2000);
}

/* ── Init ── */
$('startBtn').addEventListener('click', () => {
  if ($('startBtn').disabled) return;
  initState();
  if (state.mode === 'daily') sampleDailyQuestions();
  showScreen('test-screen');
  renderQuestion();
});

$('retestBtn').addEventListener('click', () => {
  initState();
  showScreen('intro-screen');
});

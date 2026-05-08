(function () {
    'use strict';

    const TOTAL_ROUNDS = 18;
    const PLATE_SIZE = 520;
    const DOT_COUNT = 980;
    const AXES = {
        control: { name: '控制图版', base: [212, 18, 70], target: [212, 18, 34] },
        protan: { name: '红-绿轴', base: [38, 46, 58], target: [8, 48, 56] },
        deutan: { name: '绿-红轴', base: [35, 42, 58], target: [118, 32, 54] },
        tritan: { name: '蓝-黄轴', base: [52, 42, 60], target: [214, 36, 58] },
        lowSat: { name: '低饱和轴', base: [190, 16, 66], target: [300, 14, 55] },
    };

    const QUESTIONS = [
        { type: 'digit', axis: 'control', answer: '8', choices: ['8', '3', '看不清', '6'], level: 1 },
        { type: 'digit', axis: 'protan', answer: '6', choices: ['6', '8', '看不清', '5'], level: 1 },
        { type: 'digit', axis: 'deutan', answer: '3', choices: ['3', '5', '看不清', '8'], level: 1 },
        { type: 'direction', axis: 'tritan', answer: '右上', choices: ['右上', '左上', '看不清', '右下'], level: 1 },
        { type: 'shape', axis: 'lowSat', answer: '圆形', choices: ['圆形', '三角形', '看不清', '方形'], level: 1 },
        { type: 'digit', axis: 'protan', answer: '2', choices: ['2', '7', '看不清', '4'], level: 2 },
        { type: 'digit', axis: 'deutan', answer: '9', choices: ['9', '6', '看不清', '8'], level: 2 },
        { type: 'direction', axis: 'protan', answer: '左下', choices: ['左下', '右下', '看不清', '左上'], level: 2 },
        { type: 'shape', axis: 'tritan', answer: '三角形', choices: ['三角形', '圆形', '看不清', '菱形'], level: 2 },
        { type: 'digit', axis: 'control', answer: '4', choices: ['4', '9', '看不清', '1'], level: 2 },
        { type: 'digit', axis: 'protan', answer: '5', choices: ['5', '6', '看不清', '9'], level: 3 },
        { type: 'digit', axis: 'deutan', answer: '7', choices: ['7', '1', '看不清', '2'], level: 3 },
        { type: 'direction', axis: 'deutan', answer: '右下', choices: ['右下', '左下', '看不清', '右上'], level: 3 },
        { type: 'shape', axis: 'lowSat', answer: '方形', choices: ['方形', '圆形', '看不清', '三角形'], level: 3 },
        { type: 'digit', axis: 'tritan', answer: '1', choices: ['1', '7', '看不清', '4'], level: 3 },
        { type: 'digit', axis: 'protan', answer: '9', choices: ['9', '5', '看不清', '6'], level: 4 },
        { type: 'digit', axis: 'deutan', answer: '8', choices: ['8', '3', '看不清', '0'], level: 4 },
        { type: 'direction', axis: 'tritan', answer: '左上', choices: ['左上', '右上', '看不清', '左下'], level: 4 },
    ];
    const SCREENING_BLUEPRINT = [
        ['control', 1], ['control', 2],
        ['protan', 1], ['protan', 2], ['protan', 3], ['protan', 4],
        ['deutan', 1], ['deutan', 2], ['deutan', 3], ['deutan', 4],
        ['tritan', 1], ['tritan', 2], ['tritan', 3], ['tritan', 4],
        ['lowSat', 1], ['lowSat', 2], ['lowSat', 3], ['lowSat', 4],
    ];
    const DEEP_TOTAL_ROUNDS = 12;
    const DEEP_TYPES = ['digit', 'direction', 'shape'];
    const DEEP_ANSWERS = {
        digit: ['2', '3', '5', '6', '7', '8', '9'],
        direction: ['右上', '左上', '右下', '左下'],
        shape: ['圆形', '三角形', '方形', '菱形'],
    };

    const DIGIT_SEGMENTS = {
        0: ['a', 'b', 'c', 'd', 'e', 'f'],
        1: ['b', 'c'],
        2: ['a', 'b', 'g', 'e', 'd'],
        3: ['a', 'b', 'c', 'd', 'g'],
        4: ['f', 'g', 'b', 'c'],
        5: ['a', 'f', 'g', 'c', 'd'],
        6: ['a', 'f', 'e', 'd', 'c', 'g'],
        7: ['a', 'b', 'c'],
        8: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
        9: ['a', 'b', 'c', 'd', 'f', 'g'],
    };

    const state = {
        round: 0,
        answers: [],
        questions: QUESTIONS,
        mode: 'screening',
        deepAxis: null,
        locked: false,
        seed: 1,
    };

    const el = {};

    function init() {
        bindElements();
        bindEvents();
    }

    function bindElements() {
        el.intro = document.getElementById('intro-screen');
        el.test = document.getElementById('test-screen');
        el.result = document.getElementById('result-screen');
        el.startBtn = document.getElementById('startBtn');
        el.againBtn = document.getElementById('againBtn');
        el.skipBtn = document.getElementById('skipBtn');
        el.progressText = document.getElementById('progressText');
        el.axisText = document.getElementById('axisText');
        el.scoreText = document.getElementById('scoreText');
        el.barFill = document.getElementById('barFill');
        el.promptText = document.getElementById('promptText');
        el.hintText = document.getElementById('hintText');
        el.options = document.getElementById('options');
        el.canvas = document.getElementById('plate');
        el.ctx = el.canvas.getContext('2d');
        el.resultTitle = document.getElementById('resultTitle');
        el.resultLead = document.getElementById('resultLead');
        el.summaryGrid = document.getElementById('summaryGrid');
        el.axisReport = document.getElementById('axisReport');
        el.recommendation = document.getElementById('recommendation');
    }

    function bindEvents() {
        el.startBtn.addEventListener('click', start);
        el.againBtn.addEventListener('click', start);
        el.skipBtn.addEventListener('click', () => submit('看不清'));
    }

    function show(name) {
        el.intro.classList.toggle('active', name === 'intro');
        el.test.classList.toggle('active', name === 'test');
        el.result.classList.toggle('active', name === 'result');
    }

    function start() {
        state.round = 0;
        state.answers = [];
        state.mode = 'screening';
        state.deepAxis = null;
        state.locked = false;
        state.seed = Math.floor(Math.random() * 100000) + 1;
        state.questions = buildScreeningQuestions(state.seed);
        show('test');
        renderQuestion();
    }

    function startDeep(axis) {
        state.round = 0;
        state.answers = [];
        state.questions = buildDeepQuestions(axis);
        state.mode = 'deep';
        state.deepAxis = axis;
        state.locked = false;
        state.seed = Math.floor(Math.random() * 100000) + 1;
        show('test');
        renderQuestion();
    }

    function currentQuestion() {
        return state.questions[state.round];
    }

    function renderQuestion() {
        const q = currentQuestion();
        const total = state.questions.length;
        state.locked = false;
        el.progressText.textContent = `${state.round + 1}/${total}`;
        el.axisText.textContent = AXES[q.axis].name;
        el.scoreText.textContent = reliableScore();
        el.barFill.style.width = `${state.round / total * 100}%`;
        el.promptText.textContent = q.type === 'digit' ? '图中显示的是哪个数字?' : q.type === 'direction' ? '图中路径指向哪里?' : '图中隐藏了哪种形状?';
        el.hintText.textContent = difficultyText(q.level);
        el.options.innerHTML = '';
        shuffle(q.choices.slice(), state.seed + state.round).forEach(choice => {
            const button = document.createElement('button');
            button.className = 'option';
            button.textContent = choice;
            button.addEventListener('click', () => submit(choice, button));
            el.options.appendChild(button);
        });
        drawPlate(q);
    }

    function difficultyText(level) {
        if (level === 1) return '热身图版：用于确认屏幕和操作可靠性。';
        if (level === 2) return '标准图版：色差适中，请凭第一印象选择。';
        if (level === 3) return '精细图版：请避免长时间盯视或反复猜测。';
        return '高难图版：用于区分轻微色弱倾向。';
    }

    function submit(choice, button) {
        if (state.locked) return;
        state.locked = true;
        const q = currentQuestion();
        const correct = choice === q.answer;
        state.answers.push({ ...q, choice, correct, skipped: choice === '看不清' });
        [...el.options.children].forEach(item => {
            if (item.textContent === q.answer) item.classList.add('correct');
            if (button && item === button && !correct) item.classList.add('wrong');
        });
        setTimeout(() => {
            state.round += 1;
            if (state.round >= state.questions.length) finish();
            else renderQuestion();
        }, 560);
    }

    function buildDeepQuestions(axis) {
        const questions = [];
        for (let i = 0; i < DEEP_TOTAL_ROUNDS; i++) {
            const type = DEEP_TYPES[i % DEEP_TYPES.length];
            const answers = DEEP_ANSWERS[type];
            const answer = answers[(i * 2 + axis.length) % answers.length];
            questions.push({
                type,
                axis,
                answer,
                choices: buildChoices(type, answer, state.seed + i),
                level: Math.min(5, 2 + Math.floor(i / 3)),
                deep: true,
            });
        }
        return questions;
    }

    function buildScreeningQuestions(seed) {
        const rng = mulberry32(seed + 31337);
        const questions = SCREENING_BLUEPRINT.map(([axis, level], index) => {
            const type = DEEP_TYPES[Math.floor(rng() * DEEP_TYPES.length)];
            const answers = DEEP_ANSWERS[type];
            const answer = answers[Math.floor(rng() * answers.length)];
            return {
                type,
                axis,
                answer,
                choices: buildChoices(type, answer, seed + index),
                level,
                order: index,
            };
        });
        return shuffle(questions, seed + 2718);
    }

    function buildChoices(type, answer, salt) {
        const pool = shuffle(DEEP_ANSWERS[type].filter(item => item !== answer), salt + answer.charCodeAt(0));
        return [answer, pool[0], '看不清', pool[1] || pool[0]];
    }

    function reliableScore() {
        if (state.answers.length === 0) return 0;
        return Math.round(state.answers.filter(item => item.correct).length / state.answers.length * 100);
    }

    function drawPlate(q) {
        const ctx = el.ctx;
        ctx.clearRect(0, 0, PLATE_SIZE, PLATE_SIZE);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, PLATE_SIZE, PLATE_SIZE);
        const rng = mulberry32(state.seed + state.round * 9973);
        const radius = PLATE_SIZE * 0.45;
        const center = PLATE_SIZE / 2;
        for (let i = 0; i < DOT_COUNT; i++) {
            const angle = rng() * Math.PI * 2;
            const distance = Math.sqrt(rng()) * radius;
            const x = center + Math.cos(angle) * distance;
            const y = center + Math.sin(angle) * distance;
            const target = inTarget(q, x, y);
            const color = dotColor(q, target, rng);
            const size = 6 + rng() * 11;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(center, center, radius + 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.14)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function dotColor(q, target, rng) {
        const axis = AXES[q.axis];
        const levelFactor = [0, 1, 0.72, 0.48, 0.34, 0.24][q.level];
        const source = target ? axis.target : axis.base;
        const base = target && q.axis !== 'control'
            ? mixHsl(axis.base, axis.target, levelFactor)
            : source;
        const h = base[0] + (rng() - 0.5) * 18;
        const s = base[1] + (rng() - 0.5) * 14;
        const l = base[2] + (rng() - 0.5) * 16;
        return `hsl(${wrapHue(h)} ${clamp(s, 8, 78)}% ${clamp(l, 28, 82)}%)`;
    }

    function mixHsl(a, b, t) {
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    }

    function inTarget(q, x, y) {
        const nx = (x - PLATE_SIZE / 2) / 180;
        const ny = (y - PLATE_SIZE / 2) / 180;
        if (q.type === 'digit') return inDigit(q.answer, nx, ny);
        if (q.type === 'direction') return inDirection(q.answer, nx, ny);
        return inShape(q.answer, nx, ny);
    }

    function inDigit(value, x, y) {
        const segments = DIGIT_SEGMENTS[value] || [];
        return segments.some(segment => inSegment(segment, x, y));
    }

    function inSegment(segment, x, y) {
        const thick = 0.17;
        const regions = {
            a: Math.abs(y + 0.78) < thick && Math.abs(x) < 0.52,
            b: Math.abs(x - 0.58) < thick && y > -0.78 && y < -0.04,
            c: Math.abs(x - 0.58) < thick && y > 0.04 && y < 0.78,
            d: Math.abs(y - 0.78) < thick && Math.abs(x) < 0.52,
            e: Math.abs(x + 0.58) < thick && y > 0.04 && y < 0.78,
            f: Math.abs(x + 0.58) < thick && y > -0.78 && y < -0.04,
            g: Math.abs(y) < thick && Math.abs(x) < 0.52,
        };
        return regions[segment];
    }

    function inDirection(answer, x, y) {
        const vectors = {
            '右上': [0.72, -0.72],
            '左上': [-0.72, -0.72],
            '右下': [0.72, 0.72],
            '左下': [-0.72, 0.72],
        };
        const vector = vectors[answer];
        const body = distanceToSegment(x, y, -vector[0] * 0.55, -vector[1] * 0.55, vector[0], vector[1]) < 0.14;
        const head = Math.hypot(x - vector[0], y - vector[1]) < 0.28;
        return body || head;
    }

    function inShape(answer, x, y) {
        if (answer === '圆形') return Math.abs(Math.hypot(x, y) - 0.62) < 0.16;
        if (answer === '方形') return Math.max(Math.abs(x), Math.abs(y)) > 0.45 && Math.max(Math.abs(x), Math.abs(y)) < 0.72;
        if (answer === '三角形') return Math.abs(y - (Math.abs(x) * 1.2 - 0.36)) < 0.16 && y < 0.68;
        return Math.abs(Math.abs(x) + Math.abs(y) - 0.72) < 0.16;
    }

    function distanceToSegment(px, py, ax, ay, bx, by) {
        const dx = bx - ax;
        const dy = by - ay;
        const t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy), 0, 1);
        return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
    }

    function finish() {
        show('result');
        el.barFill.style.width = '100%';
        const stats = buildStats();
        const overall = state.mode === 'deep' ? classifyDeep(stats) : classify(stats);
        el.resultTitle.textContent = overall.title;
        el.resultLead.textContent = overall.lead;
        renderSummary(stats, overall);
        renderAxisReport(stats);
        el.recommendation.textContent = overall.recommendation;
    }

    function buildStats() {
        const axes = ['control', 'protan', 'deutan', 'tritan', 'lowSat'].map(axis => {
            const list = state.answers.filter(item => item.axis === axis);
            const correct = list.filter(item => item.correct).length;
            const skipped = list.filter(item => item.skipped).length;
            const score = list.length ? Math.round(correct / list.length * 100) : 0;
            return { axis, name: AXES[axis].name, total: list.length, correct, skipped, score };
        });
        const totalCorrect = state.answers.filter(item => item.correct).length;
        return {
            axes,
            totalScore: Math.round(totalCorrect / state.answers.length * 100),
            controlScore: axes.find(item => item.axis === 'control').score,
            redGreenScore: Math.round((axes.find(item => item.axis === 'protan').score + axes.find(item => item.axis === 'deutan').score) / 2),
            tritanScore: axes.find(item => item.axis === 'tritan').score,
            lowSatScore: axes.find(item => item.axis === 'lowSat').score,
            skipped: state.answers.filter(item => item.skipped).length,
        };
    }

    function classify(stats) {
        if (stats.controlScore < 80) {
            return {
                title: '结果可靠性不足',
                lead: '控制图版识别率偏低，可能受到屏幕、亮度、距离、反光或操作理解影响。',
                risk: '需复测',
                recommendation: '请调高屏幕亮度、关闭护眼/夜间模式，在稳定光照下重新测试。若复测仍难以识别控制图版，建议改用纸质标准图版或专业检查。',
            };
        }
        if (stats.redGreenScore < 55 || stats.tritanScore < 50) {
            return {
                title: '色觉异常风险较高',
                lead: '筛查结果显示某一混淆轴上的伪同色图版识别明显困难。',
                risk: '较高风险',
                recommendation: '建议在不同设备和光照下复测。若日常存在红绿灯、地图、线缆、药品标签等颜色混淆，请进行正规色觉检查。本测试不能作为医学诊断或职业体检依据。',
            };
        }
        if (stats.redGreenScore < 75 || stats.tritanScore < 70 || stats.lowSatScore < 67) {
            return {
                title: '疑似轻度色弱倾向',
                lead: '部分高难伪同色图版识别不稳定，可能存在轻度色彩辨识弱项。',
                risk: '中等风险',
                recommendation: '建议至少复测 2 次，并在报告中重点关注分数最低的轴向。若结果稳定偏低，可考虑使用标准 Ishihara、HRR 或 Farnsworth D-15 等专业测试进一步确认。',
            };
        }
        return {
            title: '未见明显异常倾向',
            lead: '本次程序生成伪同色图版筛查中，主要混淆轴表现处于良好范围。',
            risk: '低风险',
            recommendation: '结果仅代表当前屏幕和环境下的娱乐/自测筛查表现。若职业、驾驶或体检场景需要结论，请以专业机构标准测试为准。',
        };
    }

    function renderSummary(stats, overall) {
        el.summaryGrid.innerHTML = '';
        [
            ['综合正确率', `${stats.totalScore}%`],
            ['筛查结论', overall.risk],
            ['跳过题数', `${stats.skipped} 题`],
            state.mode === 'deep' ? ['测试模式', '轴向深测'] : ['测试模式', '初筛'],
        ].forEach(([label, value]) => {
            const item = document.createElement('article');
            item.innerHTML = `<b>${value}</b><span>${label}</span>`;
            el.summaryGrid.appendChild(item);
        });
    }

    function renderAxisReport(stats) {
        el.axisReport.innerHTML = '';
        stats.axes.forEach(item => {
            if (state.mode === 'deep' && item.axis !== state.deepAxis) return;
            const row = document.createElement('div');
            row.className = 'axis-row';
            const shouldDeepTest = state.mode === 'screening' && item.axis !== 'control' && item.total > 0 && item.correct < item.total;
            row.innerHTML = `
                <strong>${item.name}</strong>
                <div class="axis-bar"><div class="axis-fill" style="width:${item.score}%"></div></div>
                <div class="axis-score">${item.correct}/${item.total}</div>
            `;
            if (shouldDeepTest) {
                const button = document.createElement('button');
                button.className = 'deep-btn';
                button.textContent = `进一步测试${item.name}`;
                button.addEventListener('click', () => startDeep(item.axis));
                row.appendChild(button);
            }
            el.axisReport.appendChild(row);
        });
    }

    function classifyDeep(stats) {
        const item = stats.axes.find(axis => axis.axis === state.deepAxis);
        if (item.score < 50) {
            return {
                title: `${item.name}深测风险较高`,
                lead: `在 ${DEEP_TOTAL_ROUNDS} 题专项伪同色图版中，该轴识别率明显偏低。`,
                risk: '专项较高风险',
                recommendation: `建议重点复核${item.name}相关色彩混淆。请在不同屏幕和稳定光照下再次测试；若仍偏低，建议使用标准 Ishihara、HRR 或 Farnsworth D-15 等专业测试确认。`,
            };
        }
        if (item.score < 75) {
            return {
                title: `${item.name}存在轻度弱项`,
                lead: `专项深测显示该轴在高难图版中识别不稳定。`,
                risk: '专项中等风险',
                recommendation: `可以隔天复测${item.name}专项，避免疲劳和屏幕偏色影响。如果日常确实有类似颜色混淆，再考虑专业检查。`,
            };
        }
        return {
            title: `${item.name}深测通过`,
            lead: `专项深测中该轴识别表现较好，初筛低分可能与注意力、随机猜测或单次屏幕条件有关。`,
            risk: '专项低风险',
            recommendation: '结果仍只作为屏幕自测参考，不能替代医学诊断或职业体检。',
        };
    }

    function shuffle(items, seed) {
        const rng = mulberry32(seed);
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }
        return items;
    }

    function mulberry32(seed) {
        return function () {
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    function wrapHue(value) {
        return ((value % 360) + 360) % 360;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    init();
})();

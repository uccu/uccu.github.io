// 设计空间 980 x 560
// 板子: { x, y, w, h, angle, color, z }   z 越大越上层（视觉前面+遮挡判定）
// 螺丝: { boardId, localX, localY, color }
// 颜色字符: r=red, b=blue, y=yellow, g=green
window.SCREW_DESIGN = { width: 980, height: 560 };
window.SCREW_LEVELS = [];

(function () {
  const BC = ['#92400e', '#475569', '#7c3aed', '#0f766e', '#a16207', '#0e7490', '#9f1239', '#1e40af', '#65a30d', '#dc2626', '#9333ea', '#0d9488'];
  const COLOR_KEYS = ['r', 'b', 'y', 'g'];
  const CM = { r: 'red', b: 'blue', y: 'yellow', g: 'green' };

  function L(name, boards, screws) {
    const idx = window.SCREW_LEVELS.length;
    const levelData = {
      id: 'lv-' + (idx + 1), name: name,
      boards: boards.map(function (b, i) {
        return {
          id: 'b' + i, x: b[0], y: b[1], w: b[2], h: b[3],
          angle: b[4] || 0, color: b[5] || BC[i % BC.length], z: b[6] || 1,
          shape: b[7] || 'rect'
        };
      }),
      screws: screws.map(function (s, i) {
        return { id: 's' + i, boardId: 'b' + s[0], localX: s[1], localY: s[2], color: CM[s[3]] };
      }),
      boxes: null
    };
    // 生成箱子数据：模拟游戏流程保证有解
    levelData.boxes = generateBoxes(levelData);
    window.SCREW_LEVELS.push(levelData);
  }

  function generateBoxes(level) {
    var colorCount = {};
    level.screws.forEach(function (s) {
      colorCount[s.color] = (colorCount[s.color] || 0) + 1;
    });

    // 把每色螺丝拆成 1-3 颗一组的箱子。
    // N === 1 必须生成 1 槽箱（不能预设 2 槽），否则工具箱 1/2 永远满不了；
    // 运行时 main.js 还会用 effectiveCapacity 再次按场上剩余螺丝数动态裁剪。
    var allBoxes = [];
    Object.keys(colorCount).sort().forEach(function (color) {
      var n = colorCount[color];
      if (n === 1) {
        allBoxes.push({ color: color, capacity: 1 });
        return;
      }
      while (n > 0) {
        if (n <= 3) {
          allBoxes.push({ color: color, capacity: n });
          n = 0;
        } else if (n === 4) {
          allBoxes.push({ color: color, capacity: 2 });
          allBoxes.push({ color: color, capacity: 2 });
          n = 0;
        } else if (n === 5) {
          allBoxes.push({ color: color, capacity: 3 });
          allBoxes.push({ color: color, capacity: 2 });
          n = 0;
        } else {
          allBoxes.push({ color: color, capacity: 3 });
          n -= 3;
        }
      }
    });
    return allBoxes;
  }

  // 简单确定性伪随机
  function rng(seed) {
    let s = (seed * 16807) % 2147483647;
    return function () {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
  }

  // 板子几何形状池
  const SHAPES = ['rect', 'square', 'diamond', 'pentagon', 'hexagon', 'triangle', 'octagon'];
  // 某些形状不适合极端长宽比（三角/五边/六边等需要接近正方形）
  function pickShape(r, w, h) {
    const ratio = w / h;
    // 严重长条：仅适矩形或菱形
    if (ratio > 3 || ratio < 1 / 3) {
      return r() < 0.7 ? 'rect' : 'diamond';
    }
    // 接近正方形：全部形状池
    if (ratio > 0.7 && ratio < 1.4) {
      const pool = ['rect', 'square', 'diamond', 'pentagon', 'hexagon', 'triangle', 'octagon'];
      return pool[Math.floor(r() * pool.length)];
    }
    // 中等长宽比：除去三角/五边
    const pool = ['rect', 'diamond', 'hexagon', 'octagon'];
    return pool[Math.floor(r() * pool.length)];
  }

  function boardLocalPolygon(shape, w, h) {
    const halfW = w / 2, halfH = h / 2;
    if (shape === 'rect' || shape === 'square') return null;
    if (shape === 'diamond') return [{ x: 0, y: halfH }, { x: halfW, y: 0 }, { x: 0, y: -halfH }, { x: -halfW, y: 0 }];
    const regular = function (n, rot) {
      const points = [];
      for (let i = 0; i < n; i++) {
        const a = rot + (i / n) * Math.PI * 2;
        points.push({ x: Math.cos(a) * halfW, y: Math.sin(a) * halfH });
      }
      return points;
    };
    if (shape === 'triangle') return regular(3, Math.PI / 2);
    if (shape === 'pentagon') return regular(5, Math.PI / 2);
    if (shape === 'hexagon') return regular(6, 0);
    if (shape === 'octagon') return regular(8, Math.PI / 8);
    return null;
  }

  function pointInsidePolygon(p, points) {
    let inside = false;
    const eps = 0.0001;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const a = points[i], b = points[j];
      const cross = (p.y - a.y) * (b.x - a.x) - (p.x - a.x) * (b.y - a.y);
      const minX = Math.min(a.x, b.x) - eps, maxX = Math.max(a.x, b.x) + eps;
      const minY = Math.min(a.y, b.y) - eps, maxY = Math.max(a.y, b.y) + eps;
      if (Math.abs(cross) <= eps && p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY) return true;
      const intersect = ((a.y > p.y) !== (b.y > p.y)) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function pointInsideBoardLocal(shape, w, h, x, y) {
    const halfW = w / 2, halfH = h / 2;
    if (Math.abs(x) > halfW || Math.abs(y) > halfH) return false;
    const points = boardLocalPolygon(shape, w, h);
    return points ? pointInsidePolygon({ x, y }, points) : true;
  }

  // 在给定区域内生成 N 个板子的塔结构
  // params:
  //   layers: 板子层数
  //   shape: 'pyramid' | 'inverted' | 'twin' | 'sway' | 'random'
  //   colors: 螺丝颜色子集（默认 4 色）
  //   seed: 随机种子
  //   cy: 塔基 y（默认按 layers 联动，让塔的算术中心落在 design center 280）
  //   screwsPerBoard: 每板基础螺丝数
  function buildTower(name, layers, opts) {
    opts = opts || {};
    const r = rng(opts.seed || (name.charCodeAt(0) * 31 + layers));
    const boards = [];
    const screws = [];
    const cx = opts.cx || 490;
    // 默认让"塔的算术中心"落在 design 中心 y=280。
    // 塔从 cy 起向上叠（y = cy + i*step），step ≈ 5，塔顶 ≈ cy + (layers-1)*5。
    // 中心 = cy + (layers-1)*2.5 → 设为 280 → cy = 280 - (layers-1)*2.5。
    // 这样短塔（lv-1~5）不会全挤在 design 下半（之前 cy=235 让 lv-1 平均 y=240，明显偏下）。
    const cy = opts.cy != null ? opts.cy : Math.round(280 - (layers - 1) * 2.5);
    const colors = opts.colors || COLOR_KEYS;
    const shape = opts.shape || 'pyramid';
    // 板子整体要够大：默认更宽更厚，min 不低于 baseW 的 86%
    const baseW = opts.baseW || 620;
    const baseH = opts.baseH || 112;
    const minW = opts.minW || Math.round(baseW * 0.86);
    const minH = opts.minH || Math.round(baseH * 0.88);
    const screwsPerBoard = opts.screwsPerBoard || 2; // 每板基础螺丝数（2-3 个）
    const sway = opts.sway || 18;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const multiChance = opts.multiChance == null
      ? clamp(0.25 + layers * 0.022, 0.28, 0.72)
      : opts.multiChance;

    for (let i = 0; i < layers; i++) {
      const z = i + 1;
      let w, h, x, y, angle;
      const t = layers > 1 ? i / (layers - 1) : 0;

      if (shape === 'pyramid') {
        // 上窄下宽
        w = baseW - (baseW - minW) * t;
        h = baseH - (baseH - minH) * t;
        x = cx + Math.sin(i * 0.55 + r() * 1.5) * sway;
        y = cy + i * 5 + r() * 4;
        angle = ((i % 2) ? 1 : -1) * (0.03 + r() * 0.08) * Math.min(1, i / 4);
      } else if (shape === 'inverted') {
        // 上宽下窄（倒金字塔，下层小）
        w = minW + (baseW - minW) * t;
        h = minH + (baseH - minH) * t;
        x = cx + Math.cos(i * 0.6) * sway;
        y = cy + i * 5;
        angle = ((i % 2) ? -1 : 1) * (r() * 0.12);
      } else if (shape === 'twin') {
        // 双塔交替（一半在左一半在右）
        const onLeft = i % 2 === 0;
        const w0 = baseW * 0.72 - t * (baseW * 0.72 - minW) * 0.35;
        w = w0;
        h = baseH - (baseH - minH) * t;
        x = (onLeft ? cx - 95 : cx + 95) + r() * 20 - 10;
        y = cy + (i >> 1) * 9 + r() * 4;
        angle = (onLeft ? 1 : -1) * (0.05 + r() * 0.1);
      } else if (shape === 'sway') {
        // 板子大小相近，但位置左右摆动
        w = baseW * 0.82 + r() * baseW * 0.16;
        h = baseH - t * (baseH - minH) * 0.4;
        x = cx + Math.sin(i * 0.9) * (sway * 5);
        y = cy + i * 6;
        angle = Math.sin(i * 0.7) * 0.15;
      } else {
        // random：尺寸和位置都更随机
        w = minW + r() * (baseW - minW);
        h = minH + r() * (baseH - minH);
        x = cx + (r() - 0.5) * (baseW * 0.4);
        y = cy + i * 4 + r() * 8;
        angle = (r() - 0.5) * 0.4;
      }

      w = Math.max(minW, Math.min(baseW, w));
      h = Math.max(minH, Math.min(baseH, h));

      let pieces = 1;
      if (i > 0 && r() < multiChance) pieces = r() < 0.68 ? 2 : 3;
      if (shape === 'twin') pieces = Math.max(2, pieces);
      const offsets = pieces === 1
        ? [0]
        : (pieces === 2 ? [-185, 185] : [-300, 0, 300]);

      for (let p = 0; p < pieces; p++) {
        let bw = pieces === 1 ? w : w * (pieces === 2 ? 0.62 : 0.43);
        let bh = h * (0.92 + r() * 0.16);
        bw = clamp(bw, pieces === 1 ? minW : 260, pieces === 1 ? baseW : (pieces === 2 ? 430 : 340));
        bh = clamp(bh, minH * 0.88, baseH * 1.08);

        if (r() < 0.45) {
          const side = Math.max(bh * 2.2, Math.min(bw, bh * (2.8 + r() * 1.8)));
          bw = side; bh = side * (0.85 + r() * 0.3);
          // 方块化分支会把板子拉成「大正方形」，不限制会让 bh 冲到 560+ 超出设计高度。
          // 钳到设计区域内（design = 980 × 560），留 40 px 视觉边距。
          bw = Math.min(bw, 760);
          bh = Math.min(bh, 480);
        }

        const px = clamp(x + offsets[p] + (r() - 0.5) * 34, bw / 2 + 24, 980 - bw / 2 - 24);
        // py 也按竖向边界 clamp，对齐 px 的处理；避免板子顶部/底部出 design.height 边界
        const py = clamp(y + (r() - 0.5) * 18, bh / 2 + 12, 560 - bh / 2 - 12);
        const pa = angle + (r() - 0.5) * 0.18;
        const polyShape = pickShape(r, bw, bh);
        const boardIndex = boards.length;
        boards.push([px, py, bw, bh, pa, BC[(i + p) % BC.length], z, polyShape]);

        const sCount = screwsPerBoard + (r() < 0.35 ? 1 : 0);
        const cells = sCount;
        for (let j = 0; j < sCount; j++) {
          const isPoly = polyShape !== 'rect' && polyShape !== 'square';
          const margin = isPoly ? Math.max(40, Math.min(bw, bh) * 0.24) : 34;
          const usableW = Math.max(0, bw - margin * 2);
          const usableH = Math.max(0, bh - margin * 2);
          const cellW = cells > 1 ? usableW / cells : 0;
          const cellLeft = -usableW / 2 + j * cellW;
          let lx = 0, ly = 0;
          for (let attempt = 0; attempt < 24; attempt++) {
            lx = cells === 1 ? (r() - 0.5) * usableW : cellLeft + cellW * (0.25 + r() * 0.5);
            ly = (r() - 0.5) * usableH;
            if (pointInsideBoardLocal(polyShape, bw, bh, lx, ly)) break;
            if (attempt === 23) {
              lx = (j - (sCount - 1) / 2) * Math.min(bw, bh) * 0.18;
              ly = 0;
              if (!pointInsideBoardLocal(polyShape, bw, bh, lx, ly)) lx = 0;
            }
          }
          const ci = (i * 3 + p * 2 + j * 5 + Math.floor(r() * colors.length)) % colors.length;
          screws.push([boardIndex, lx, ly, colors[ci]]);
        }
      }
    }
    L(name, boards, screws);
  }

  // ========= 50 关 =========
  // 1-5: 教学（少量层）
  buildTower('起步', 2, { screwsPerBoard: 2, colors: ['r', 'b'], seed: 1, multiChance: 0.12 });
  buildTower('三叠', 3, { screwsPerBoard: 2, colors: ['r', 'b'], seed: 2, multiChance: 0.16 });
  buildTower('四叠', 4, { screwsPerBoard: 2, colors: ['r', 'b', 'y'], seed: 3, multiChance: 0.2 });
  buildTower('斜塔', 5, { screwsPerBoard: 2, shape: 'sway', seed: 4, sway: 12, multiChance: 0.24 });
  buildTower('倒塔', 5, { screwsPerBoard: 2, shape: 'inverted', seed: 5, multiChance: 0.28 });

  // 6-15: 中级（开始出现双塔、摆塔和更明显形状变化）
  const midShapes = ['pyramid', 'sway', 'twin', 'inverted', 'random', 'pyramid'];
  for (let i = 6; i <= 15; i++) {
    const layers = 6 + Math.floor((i - 6) * 0.5);
    const shape = midShapes[(i - 6) % midShapes.length];
    buildTower('关' + i, layers, {
      screwsPerBoard: 2, shape: shape, seed: i * 13,
      sway: 12 + (i % 4) * 4,
      multiChance: 0.28 + (i - 6) * 0.025,
      baseW: 600 + (i % 3) * 18,
      baseH: 106 + (i % 2) * 8
    });
  }

  // 16-30: 中高（交替提升层数、碎片数和横向摆动）
  const hiShapes = ['pyramid', 'twin', 'sway', 'random', 'inverted', 'twin', 'sway', 'random'];
  for (let i = 16; i <= 30; i++) {
    const layers = 10 + Math.floor((i - 16) * 0.55);
    const shape = hiShapes[(i - 16) % hiShapes.length];
    buildTower('关' + i, layers, {
      screwsPerBoard: i % 7 === 0 ? 3 : 2, shape: shape, seed: i * 17,
      sway: 14 + (i % 5) * 4,
      multiChance: 0.38 + (i - 16) * 0.018,
      baseW: 620 + (i % 4) * 14,
      baseH: 110 + (i % 3) * 6
    });
  }

  // 31-45: 高级（更多多片板和更密集的颜色节奏）
  for (let i = 31; i <= 45; i++) {
    const layers = 15 + Math.floor((i - 31) * 0.55);
    const shape = hiShapes[(i * 3) % hiShapes.length];
    buildTower('关' + i, layers, {
      screwsPerBoard: i % 5 === 0 ? 3 : 2, shape: shape, seed: i * 19,
      sway: 16 + (i % 4) * 5,
      multiChance: 0.48 + (i - 31) * 0.016,
      baseW: 630 + (i % 5) * 12,
      baseH: 112 + (i % 4) * 5
    });
  }

  // 46-50: 终极（每关强调一种记忆点，而不是只堆层数）
  buildTower('巨塔Ⅰ', 22, { screwsPerBoard: 2, shape: 'pyramid', seed: 101, baseW: 660, baseH: 118, sway: 12, multiChance: 0.58 });
  buildTower('摆动巨塔', 24, { screwsPerBoard: 2, shape: 'sway', seed: 102, baseW: 670, baseH: 120, sway: 24, multiChance: 0.62 });
  buildTower('双巨塔', 26, { screwsPerBoard: 2, shape: 'twin', seed: 103, baseW: 650, baseH: 118, sway: 18, multiChance: 0.68 });
  buildTower('迷形塔', 28, { screwsPerBoard: 2, shape: 'random', seed: 104, baseW: 670, baseH: 120, sway: 22, multiChance: 0.72 });
  buildTower('终极塔', 30, { screwsPerBoard: 2, shape: 'pyramid', seed: 105, baseW: 690, baseH: 124, sway: 16, multiChance: 0.68 });
})();

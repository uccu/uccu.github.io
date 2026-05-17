/* Screw puzzle game.
 *
 * Rendering:  Three.js with an orthographic camera. World units = design pixels.
 *             Origin is bottom-left, Y is up. Higher z meshes are drawn on top.
 *
 * Physics:    Rapier 2D (compat build, WASM inlined). Gravity is in -Y. Boards
 *             stay Fixed while any of their screws remain. Removing the last
 *             screw flips the body to Dynamic and the engine handles gravity
 *             and rotation. Boards never collide with each other, so they fall
 *             through lower layers without piling up.
 *
 * Collision filtering uses two membership bits:
 *     - BOARD_MEMBER: boards collide with walls only (not with other boards)
 *     - WALL_MEMBER:  walls collide with boards
 *     - screws have collision groups = 0 and don't collide with anything;
 *                    they only act as click targets and pivot joint anchors.
 *
 * Render-order / occlusion still uses board.cfg.z; physics ignores z entirely.
 */
(function () {
  'use strict';

  const COLORS = { red: '#ef4444', blue: '#2563eb', yellow: '#f59e0b', green: '#16a34a' };
  const BOARD_OPACITY = 0.94;

  // 物理用固定步长（Rapier World 默认 1/60s），用累加器从渲染帧时间里切出固定步数。
  // 这样 30fps 设备会每帧跑 2 步，60fps 跑 1 步，物理速度独立于渲染帧率。
  const FIXED_DT = 1 / 60;
  // 单帧最大补偿：切 tab / 卡顿后回来时，允许的最大 frame delta，
  // 超过会被截断以防一次塞进数十步把游戏卡死。
  const MAX_FRAME_DT = 1 / 15;
  // 单帧最多跑几步，避免追赶累积时画面长时间无响应。
  const MAX_STEPS_PER_FRAME = 5;

  // 简化的 collision filter：z 仅作渲染深度/遮挡判断，不再用于物理。
  // 板子之间不互相碰撞（防止上层板子卡在下层板子或螺丝头上）。
  // 板子只与墙壁碰撞；螺丝不参与碰撞（仅用作 pivot joint 锚点）。
  const BOARD_MEMBER = 1;
  const WALL_MEMBER = 2;
  const boardGroups = () => (BOARD_MEMBER << 16) | WALL_MEMBER;
  const wallGroups = () => (WALL_MEMBER << 16) | BOARD_MEMBER;

  const state = {
    rapier: null,
    world: null,
    eventQueue: null,
    renderer: null,
    scene: null,
    camera: null,
    designW: 980,
    designH: 560,
    canvasW: 0,
    canvasH: 0,
    level: null,
    levelIndex: 0,
    boards: new Map(),
    screws: new Map(),
    toolboxes: [],
    flyers: new Set(),
    raf: 0,
    ended: false,
    topZ: 0,
    visibleMinZ: 0,
    lastTime: 0,
    dtAccum: 0,
    hintTimer: 0,
    hintedScrew: null,
    hintNode: null,
    hintToken: 0,
    moveCount: 0,
    // 所有会触碰 state（如改 boxPool/toolboxes）的延时回调都要登记在这里，
    // cleanup 时一次性清空，避免上一关的 setTimeout 在新关启动后偷改 state。
    pendingTimers: new Set(),
    // isCovered 的 Fixed 板子部分缓存到 screw._coveredByFixed；
    // 只有板子位姿/状态变化（pivot / cleared / 新关）时把这个 flag 置 true，重新 build 缓存。
    fixedCoverageDirty: true
  };

  function scheduleTimer(fn, ms) {
    const id = setTimeout(() => {
      state.pendingTimers.delete(id);
      fn();
    }, ms);
    state.pendingTimers.add(id);
    return id;
  }

  function clearAllTimers() {
    state.pendingTimers.forEach((id) => clearTimeout(id));
    state.pendingTimers.clear();
  }

  function loadLevelIndex() {
    const saved = parseInt(localStorage.getItem('screw-puzzle-level') || '0', 10);
    const max = (window.SCREW_LEVELS || []).length;
    return Math.min(Math.max(saved, 0), Math.max(max - 1, 0));
  }

  function saveLevelIndex() {
    try { localStorage.setItem('screw-puzzle-level', String(state.levelIndex)); } catch (e) {}
  }

  const els = {};

  function $(id) { return document.getElementById(id); }

  function hasValidLevelData() {
    if (!Array.isArray(window.SCREW_LEVELS) || window.SCREW_LEVELS.length === 0) return false;
    return window.SCREW_LEVELS.every((level) => {
      return level && Array.isArray(level.boards) && level.boards.length && Array.isArray(level.screws) && level.screws.length;
    });
  }

  // ━━━ Boot & lifecycle ━━━

  async function boot() {
    els.stage = $('stage');
    els.stageWrap = els.stage.parentElement;
    els.toast = $('toast');
    els.modal = $('modal');
    els.modalTitle = $('modalTitle');
    els.modalText = $('modalText');
    els.modalBtn = $('modalBtn');
    els.boardsLeft = $('boardsLeft');
    els.screwsLeft = $('screwsLeft');
    els.restartBtn = $('restartBtn');
    els.hintBtn = $('hintBtn');
    els.toolboxes = $('toolboxes');
    els.levelLabel = $('levelLabel');
    els.prevBtn = $('prevLevelBtn');
    els.nextBtn = $('nextLevelBtn');

    els.restartBtn.addEventListener('click', start);
    if (els.hintBtn) els.hintBtn.addEventListener('click', () => showHint(true));
    els.modalBtn.addEventListener('click', onModalBtn);
    if (els.prevBtn) els.prevBtn.addEventListener('click', () => gotoLevel(state.levelIndex - 1));
    if (els.nextBtn) els.nextBtn.addEventListener('click', () => gotoLevel(state.levelIndex + 1));
    window.addEventListener('resize', onResize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);

    if (!window.THREE || typeof window.THREE.WebGLRenderer !== 'function') {
      showToast('Three.js 加载失败');
      return;
    }
    if (!window.RAPIER || typeof window.RAPIER.init !== 'function') {
      showToast('Rapier 加载失败');
      return;
    }
    if (!hasValidLevelData()) {
      showToast('关卡数据加载失败');
      return;
    }
    await window.RAPIER.init();
    state.rapier = window.RAPIER;

    setupThree();
    state.levelIndex = loadLevelIndex();
    start();
  }

  function onModalBtn() {
    // 通关 → 下一关；卡住 → 重玩当前关
    if (state.modalNext) {
      gotoLevel(state.levelIndex + 1);
    } else {
      start();
    }
  }

  function gotoLevel(idx) {
    const max = window.SCREW_LEVELS.length;
    if (!max) {
      showToast('没有可用关卡');
      return;
    }
    state.levelIndex = ((idx % max) + max) % max;
    saveLevelIndex();
    start();
  }

  // ━━━ Three.js setup & canvas ━━━

  function setupThree() {
    const { width, height } = stageSize();
    state.canvasW = width;
    state.canvasH = height;
    state.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    state.renderer.setSize(width, height, false);
    state.renderer.setClearColor(0x000000, 0);
    state.renderer.domElement.style.position = 'absolute';
    state.renderer.domElement.style.inset = '0';
    state.renderer.domElement.style.zIndex = '1';
    state.renderer.domElement.style.display = 'block';
    state.renderer.domElement.style.touchAction = 'manipulation';
    state.renderer.domElement.addEventListener('pointerdown', onCanvasPointerDown);
    els.stage.insertBefore(state.renderer.domElement, els.stage.firstChild);

    state.scene = new THREE.Scene();
    // Orthographic camera that maps world (0..designW, 0..designH) to the canvas.
    // We re-fit the camera in onResize().
    state.camera = new THREE.OrthographicCamera(0, state.designW, state.designH, 0, -10, 10);
    state.camera.position.set(0, 0, 5);
    fitCamera();
  }

  function fitCamera() {
    const aspect = state.canvasW / state.canvasH;
    const bounds = levelViewBounds();
    const boundsW = Math.max(1, bounds.maxX - bounds.minX);
    const boundsH = Math.max(1, bounds.maxY - bounds.minY);
    const boundsAspect = boundsW / boundsH;
    let viewW, viewH;
    if (aspect > boundsAspect) {
      viewH = boundsH;
      viewW = viewH * aspect;
    } else {
      viewW = boundsW;
      viewH = viewW / aspect;
    }
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    state.camera.left = cx - viewW / 2;
    state.camera.right = cx + viewW / 2;
    state.camera.top = cy + viewH / 2;
    state.camera.bottom = cy - viewH / 2;
    state.camera.updateProjectionMatrix();
  }

  function levelViewBounds() {
    if (!state.level || !state.level.boards || !state.level.boards.length) {
      return { minX: 0, maxX: state.designW, minY: 0, maxY: state.designH };
    }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    state.level.boards.forEach((cfg) => {
      const c = Math.cos(cfg.angle);
      const s = Math.sin(cfg.angle);
      const dx = Math.abs(c) * cfg.w / 2 + Math.abs(s) * cfg.h / 2;
      const dy = Math.abs(s) * cfg.w / 2 + Math.abs(c) * cfg.h / 2;
      minX = Math.min(minX, cfg.x - dx);
      maxX = Math.max(maxX, cfg.x + dx);
      minY = Math.min(minY, cfg.y - dy);
      maxY = Math.max(maxY, cfg.y + dy);
    });
    const boardById = new Map(state.level.boards.map((cfg) => [cfg.id, cfg]));
    state.level.screws.forEach((cfg) => {
      const board = boardById.get(cfg.boardId);
      if (!board) return;
      const c = Math.cos(board.angle);
      const s = Math.sin(board.angle);
      const x = board.x + cfg.localX * c - cfg.localY * s;
      const y = board.y + cfg.localX * s + cfg.localY * c;
      minX = Math.min(minX, x - SCREW_R * 2);
      maxX = Math.max(maxX, x + SCREW_R * 2);
      minY = Math.min(minY, y - SCREW_R * 2);
      maxY = Math.max(maxY, y + SCREW_R * 2);
    });
    const margin = 28;
    return { minX: minX - margin, maxX: maxX + margin, minY: minY - margin, maxY: maxY + margin };
  }

  function stageSize() {
    fitStageElement();
    return { width: Math.max(1, els.stage.clientWidth || 0), height: Math.max(1, els.stage.clientHeight || 0) };
  }

  function fitStageElement() {
    if (!els.stage || !els.stageWrap) return;
    const portraitPhone = window.matchMedia && window.matchMedia('(max-width: 720px) and (orientation: portrait)').matches;
    if (!portraitPhone) {
      els.stage.style.width = '';
      els.stage.style.height = '';
      return;
    }
    const r = els.stageWrap.getBoundingClientRect();
    const aspect = state.designW / state.designH;
    let width = Math.max(1, r.width);
    let height = width / aspect;
    if (height > r.height) {
      height = Math.max(1, r.height);
      width = height * aspect;
    }
    els.stage.style.width = `${Math.floor(width)}px`;
    els.stage.style.height = `${Math.floor(height)}px`;
  }

  function onResize() {
    if (!state.renderer) return;
    syncRendererSize(true);
  }

  function syncRendererSize(force) {
    if (!state.renderer) return false;
    const { width, height } = stageSize();
    if (!force && Math.abs(width - state.canvasW) < 1 && Math.abs(height - state.canvasH) < 1) return false;
    state.canvasW = width;
    state.canvasH = height;
    state.renderer.setSize(width, height, false);
    fitCamera();
    refreshScrewPositions();
    return true;
  }

  function start() {
    cleanup();
    state.level = window.SCREW_LEVELS[state.levelIndex];
    if (!state.level) {
      showToast('关卡不存在');
      return;
    }
    if (els.levelLabel) {
      els.levelLabel.textContent = `${state.levelIndex + 1}/${window.SCREW_LEVELS.length}`;
    }
    state.designW = (window.SCREW_DESIGN && window.SCREW_DESIGN.width) || 980;
    state.designH = (window.SCREW_DESIGN && window.SCREW_DESIGN.height) || 560;
    fitCamera();

    state.world = new state.rapier.World({ x: 0, y: -1200 });
    state.eventQueue = new state.rapier.EventQueue(true);
    addBounds();
    createBoards();
    createScrews();
    updateVisibility();
    setupToolboxes();
    refreshScrewPositions();
    updateStats();
    els.modal.classList.add('hidden');
    state.ended = false;
    state.moveCount = 0;
    state.lastTime = performance.now();
    state.dtAccum = 0;
    resetIdleHint();
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = requestAnimationFrame(tick);
  }

  // ━━━ Cleanup ━━━

  function disposeObject(o) {
    const materials = new Set();
    if (typeof o.traverse === 'function') {
      o.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach((m) => materials.add(m));
          else materials.add(child.material);
        }
      });
    } else {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => materials.add(m));
        else materials.add(o.material);
      }
    }
    materials.forEach((m) => m.dispose());
  }

  function cleanup() {
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
    if (state.scene) {
      const objs = [...state.scene.children];
      objs.forEach((o) => {
        state.scene.remove(o);
        disposeObject(o);
      });
    }
    if (state.world) {
      state.world.free();
      state.world = null;
    }
    if (state.eventQueue) {
      state.eventQueue.free();
      state.eventQueue = null;
    }
    state.boards.clear();
    state.screws.clear();
    state.toolboxes = [];
    state.boxPool = [];
    // 新关会创建全新 boards / screws，覆盖缓存必须重建。
    state.fixedCoverageDirty = true;
    clearTimeout(state.hintTimer);
    clearAllTimers();
    clearHint();
    state.flyers.forEach((node) => node.remove());
    state.flyers.clear();
    els.toolboxes.innerHTML = '';
    state.ended = false;
  }

  // ━━━ Boards & screws (creation, geometry) ━━━

  function addBounds() {
    // Just side walls + ceiling so boards can't escape sideways. No floor —
    // we want fallen boards to drop off the bottom and be "cleared".
    const t = 100;
    const w = state.designW;
    const h = state.designH;
    const make = (cx, cy, halfW, halfH) => {
      const rb = state.world.createRigidBody(state.rapier.RigidBodyDesc.fixed().setTranslation(cx, cy));
      const col = state.rapier.ColliderDesc.cuboid(halfW, halfH);
      col.setCollisionGroups(wallGroups());
      state.world.createCollider(col, rb);
    };
    make(-t / 2, h / 2, t / 2, h);                 // left
    make(w + t / 2, h / 2, t / 2, h);              // right
    make(w / 2, h + t / 2, w, t / 2);              // ceiling
  }

  function boardLocalPolygon(cfg) {
    const shape = cfg.shape || 'rect';
    const halfW = cfg.w / 2, halfH = cfg.h / 2;
    if (shape === 'rect' || shape === 'square') return null;
    if (shape === 'diamond') return [{ x: 0, y: halfH }, { x: halfW, y: 0 }, { x: 0, y: -halfH }, { x: -halfW, y: 0 }];
    const regular = (n, rot) => {
      rot = rot || 0;
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

  function createBoardGeometry(cfg) {
    const points = boardLocalPolygon(cfg);
    if (!points) return new THREE.PlaneGeometry(cfg.w, cfg.h);
    const path = new THREE.Shape();
    points.forEach((point, i) => {
      if (i === 0) path.moveTo(point.x, point.y);
      else path.lineTo(point.x, point.y);
    });
    path.closePath();
    return new THREE.ShapeGeometry(path);
  }

  function createBoards() {
    state.level.boards.forEach((cfg) => {
      const rbDesc = state.rapier.RigidBodyDesc.fixed().setTranslation(cfg.x, cfg.y).setRotation(cfg.angle);
      const rb = state.world.createRigidBody(rbDesc);
      // 物理用外接矩形 cuboid（板子不互相碰撞，精确形状不重要）
      const cDesc = state.rapier.ColliderDesc.cuboid(cfg.w / 2, cfg.h / 2)
        .setFriction(0.7)
        .setRestitution(0.05)
        .setDensity(1.0);
      cDesc.setCollisionGroups(boardGroups());
      const collider = state.world.createCollider(cDesc, rb);

      const geo = createBoardGeometry(cfg);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(cfg.color),
        transparent: true,
        opacity: BOARD_OPACITY,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(cfg.x, cfg.y, 0.01 * cfg.z);
      mesh.rotation.z = cfg.angle;
      mesh.renderOrder = cfg.z * 10;
      state.scene.add(mesh);

      // 外轮廓描边：多边形形状用 EdgesGeometry 也能正确生成
      const edges = new THREE.EdgesGeometry(geo);
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, depthWrite: false }));
      line.renderOrder = cfg.z * 10 + 0.2;
      mesh.add(line);

      state.boards.set(cfg.id, {
        cfg,
        body: rb,
        collider,
        mesh,
        cleared: false,
        totalScrews: 0,
        removedScrews: 0,
        joint: null
      });
    });
  }

  // 用 Three.js 绘制螺丝：外圈白边 + 主圆 + 十字纹
  const SCREW_R = 18; // 螺丝半径（设计像素）
  function createScrewMesh(color) {
    const group = new THREE.Group();
    // 白色外圈
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(SCREW_R - 1.5, SCREW_R + 0.5, 28),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, depthWrite: false })
    );
    ring.position.z = 0.0;
    group.add(ring);
    // 主圆（彩色）
    const body = new THREE.Mesh(
      new THREE.CircleGeometry(SCREW_R - 1.5, 28),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(COLORS[color] || '#999'), transparent: true, opacity: 1, depthWrite: false })
    );
    body.position.z = 0.001;
    group.add(body);
    // 十字螺丝纹
    const crossMat = new THREE.MeshBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 1, depthWrite: false });
    const armW = SCREW_R * 1.4, armH = SCREW_R * 0.4;
    const h = new THREE.Mesh(new THREE.PlaneGeometry(armW, armH), crossMat);
    h.position.z = 0.002;
    group.add(h);
    const v = new THREE.Mesh(new THREE.PlaneGeometry(armH, armW), crossMat);
    v.position.z = 0.002;
    group.add(v);
    return group;
  }

  function createScrews() {
    state.level.screws.forEach((cfg) => {
      const board = state.boards.get(cfg.boardId);
      board.totalScrews += 1;

      const local = { x: cfg.localX, y: cfg.localY };
      const world = transformLocalToWorld(board.body, local);

      const rbDesc = state.rapier.RigidBodyDesc.fixed().setTranslation(world.x, world.y);
      const rb = state.world.createRigidBody(rbDesc);
      // 螺丝不参与物理碰撞（groups=0），仅用作 pivot joint 锚点
      const cDesc = state.rapier.ColliderDesc.ball(8)
        .setFriction(0.4)
        .setRestitution(0.0)
        .setCollisionGroups(0);
      const collider = state.world.createCollider(cDesc, rb);

      // Three.js 螺丝 mesh，z 略大于板子（确保渲染在板子前面）
      const mesh = createScrewMesh(cfg.color);
      mesh.position.set(world.x, world.y, 0.01 * board.cfg.z + 0.005);
      mesh.renderOrder = board.cfg.z * 10 + 1;
      mesh.traverse((child) => { child.renderOrder = board.cfg.z * 10 + 1; });
      state.scene.add(mesh);

      state.screws.set(cfg.id, {
        cfg,
        boardId: cfg.boardId,
        color: cfg.color,
        body: rb,
        collider,
        mesh,
        removed: false,
        worldX: world.x,
        worldY: world.y,
        _covered: false,
        _hidden: false,
        _status: ''
      });
    });
  }

  function transformLocalToWorld(body, local) {
    const pos = body.translation();
    const ang = body.rotation();
    const c = Math.cos(ang), s = Math.sin(ang);
    return { x: pos.x + local.x * c - local.y * s, y: pos.y + local.x * s + local.y * c };
  }

  function refreshScrewPositions() {
    // 螺丝固定不动（板子 Fixed，screw 跟随 board）。covered 只用于点击判定，视觉交给透明板子覆盖。
    state.screws.forEach((screw) => {
      if (screw.removed) return;
      const board = state.boards.get(screw.boardId);
      const hidden = board && board.cfg.z < state.visibleMinZ;
      screw._hidden = hidden;
      if (hidden) {
        if (screw.mesh) screw.mesh.visible = false;
        return;
      }
      if (screw.mesh) screw.mesh.visible = true;
      const status = getScrewStatus(screw);
      if (status !== screw._status) {
        screw._status = status;
        screw._covered = status === 'covered';
        setScrewStatusVisual(screw, status);
      }
    });
  }

  function getScrewStatus(screw) {
    if (isCovered(screw)) return 'covered';
    if (findToolbox(screw.color)) return 'ready';
    if (findLockedToolbox(screw.color)) return 'locked';
    if (findFullToolbox(screw.color)) return 'waiting';
    return 'blocked';
  }

  function setScrewStatusVisual(screw, status) {
    if (!screw.mesh) return;
    const opacity = { ready: 1, covered: 0.3, locked: 1, waiting: 1, blocked: 1 }[status] || 1;
    screw.mesh.traverse((child) => {
      if (!child.material) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((mat) => {
        mat.opacity = opacity;
        mat.transparent = true;
        mat.depthWrite = false;
      });
    });
  }

  // ━━━ Input & idle hints ━━━

  // 屏幕坐标 → 世界坐标，找最近可点螺丝
  function onCanvasPointerDown(ev) {
    if (state.ended) return;
    syncRendererSize(false);
    clearHint();
    resetIdleHint();
    const rect = state.renderer.domElement.getBoundingClientRect();
    const px = ev.clientX - rect.left;
    const py = ev.clientY - rect.top;
    const wx = state.camera.left + (px / rect.width) * (state.camera.right - state.camera.left);
    const wy = state.camera.top - (py / rect.height) * (state.camera.top - state.camera.bottom);
    // 命中半径稍大于视觉半径，提升点击容错
    const worldPerPixel = (state.camera.right - state.camera.left) / rect.width;
    const HIT_R = Math.max(SCREW_R + 4, worldPerPixel * 26);
    let best = null, bestDist = HIT_R;
    state.screws.forEach((s) => {
      if (s.removed || s._covered || isCovered(s) || s._hidden) return;
      const d = Math.hypot(wx - s.worldX, wy - s.worldY);
      if (d < bestDist) { bestDist = d; best = s; }
    });
    if (best) tryRemoveScrew(best.cfg.id);
  }

  function resetIdleHint() {
    clearTimeout(state.hintTimer);
    if (state.ended) return;
    state.hintTimer = setTimeout(() => showHint(false), 6500);
  }

  function clearHint() {
    if (state.hintedScrew && state.hintedScrew.mesh) state.hintedScrew.mesh.scale.setScalar(1);
    state.hintedScrew = null;
    if (state.hintNode) {
      state.flyers.delete(state.hintNode);
      state.hintNode.remove();
      state.hintNode = null;
    }
  }

  function chooseHintScrew() {
    const candidates = [];
    state.screws.forEach((screw) => {
      if (screw.removed || screw._hidden || isCovered(screw)) return;
      const status = getScrewStatus(screw);
      if (status !== 'ready' && status !== 'locked') return;
      const board = state.boards.get(screw.boardId);
      if (!board || board.cleared) return;
      const remaining = board.totalScrews - board.removedScrews;
      const score = board.cfg.z * 100 + (status === 'ready' ? 40 : 10) + (remaining <= 1 ? 12 : 0);
      candidates.push({ screw, status, score });
    });
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0] || null;
  }

  function showHint(manual) {
    if (state.ended) return;
    clearHint();
    const pick = chooseHintScrew();
    if (!pick) {
      const locked = state.toolboxes.find((tb) => !tb.unlocked);
      if (locked) {
        pulseToolbox(locked);
        showToast('先点击底部锁定工具箱，打开更多收纳');
        resetIdleHint();
        return;
      }
      showToast(manual ? '暂时没有可推进的螺丝' : '观察上层遮挡，等工具箱整理完成');
      resetIdleHint();
      return;
    }
    const screw = pick.screw;
    const pt = worldToClient(screw.worldX, screw.worldY);
    state.hintedScrew = screw;
    state.hintToken += 1;
    const token = state.hintToken;
    if (screw.mesh) screw.mesh.scale.setScalar(1.24);
    if (pt) {
      const node = document.createElement('div');
      node.className = 'hint-ring';
      node.style.left = `${pt.x}px`;
      node.style.top = `${pt.y}px`;
      document.body.appendChild(node);
      state.flyers.add(node);
      state.hintNode = node;
    }
    if (pick.status === 'locked') {
      const box = findLockedToolbox(screw.color);
      if (box) pulseToolbox(box);
      showToast(`先解锁${colorName(screw.color)}工具箱，再拆这里`);
    } else {
      showToast(manual ? `试试这颗${colorName(screw.color)}螺丝` : '这里有一步可推进');
    }
    scheduleTimer(() => {
      if (state.hintToken === token) clearHint();
    }, 2600);
    resetIdleHint();
  }

  // ━━━ Toolboxes (setup, refill, render) ━━━

  function setupToolboxes() {
    state.toolboxes = [];
    // boxPool 的本质就是「关卡里出现的所有颜色 + 每色的容量提示」，
    // 不再当成「有限消耗资源」。每次 refill / ensureSlot 直接按场上还需要的颜色挑色，
    // capacity 由 effectiveCapacity 在运行时按场上剩余螺丝数算。
    // 这样 lv-2 这种 boxPool 总数 ≤ 4，或 lv-8 这种 effectiveCapacity 让 entry 浪费容量
    // 的情况都不会再卡死——只要场上还有颜色 X 的螺丝，就能持续开 X 色新箱。
    state.boxPool = (state.level.boxes || []).map((b) => ({ color: b.color, capacity: b.capacity }));

    const availableColors = getTopAvailableColors();
    const colorSet = new Set(availableColors);

    // 选 4 个 boxPool entry 作为 4 个槽位的颜色提示，优先 availableColors 中的颜色。
    const topBoxes = [];
    const otherBoxes = [];
    state.boxPool.forEach((b, i) => {
      if (colorSet.has(b.color) && topBoxes.length < 4) topBoxes.push(i);
      else otherBoxes.push(i);
    });
    while (topBoxes.length < 4 && otherBoxes.length > 0) topBoxes.push(otherBoxes.shift());

    // 前 2 解锁，后 2 锁定。id 是槽位稳定身份，跨 refill / unlock 都不变。
    topBoxes.forEach((poolIdx, i) => {
      const color = state.boxPool[poolIdx].color;
      const presetCap = state.boxPool[poolIdx].capacity;
      const unlocked = i < 2;
      state.toolboxes.push({
        id: 'tb' + i,
        color,
        count: 0,
        // locked 槽 capacity 是 placeholder（UI 不画进度条），解锁时由 refillToolbox 重算。
        capacity: unlocked ? effectiveCapacity(color, presetCap) : presetCap,
        unlocked
      });
    });

    els.toolboxes.innerHTML = '';
    renderToolboxes();
  }

  // boxPool 中该色的预设 capacity（任意一个 entry，没有则给 2）。
  // 仅作为 effectiveCapacity 的上限提示——实际容量永远按场上剩余裁剪。
  function presetCapacityForColor(color) {
    const entry = state.boxPool.find((b) => b.color === color);
    return entry ? entry.capacity : 2;
  }

  function getTopAvailableColors() {
    // 找当前未被遮挡的螺丝颜色（优先高层）
    const colors = new Set();
    const screwList = [...state.screws.values()].filter(s => !s.removed);
    // 按板子z排序
    screwList.sort((a, b) => {
      const az = state.boards.get(a.boardId).cfg.z;
      const bz = state.boards.get(b.boardId).cfg.z;
      return bz - az;
    });
    for (const s of screwList) {
      if (isCovered(s)) continue;
      colors.add(s.color);
      if (colors.size >= 4) break;
    }
    return [...colors];
  }

  function unlockToolbox(box) {
    if (box.unlocked) return;
    // 优先 refillToolbox 智能换成「当前还需要 ∧ 没被其他槽占着」的颜色。
    if (refillToolbox(box)) {
      showToast(`${colorName(box.color)}工具箱已解锁`);
      vibrate('success');
      renderToolboxes();
      return;
    }
    // 极端情况：场上所有颜色都被其他槽占着 / 都拆完了。
    // 如果原色还有未拆螺丝就保留原色解锁；否则槽位无意义，移除。
    if (remainingScrewsOfColor(box.color) > 0) {
      box.capacity = effectiveCapacity(box.color, presetCapacityForColor(box.color), box);
      box.count = 0;
      box.unlocked = true;
      showToast(`${colorName(box.color)}工具箱已解锁`);
      vibrate('success');
      renderToolboxes();
      return;
    }
    const idx = state.toolboxes.indexOf(box);
    if (idx !== -1) state.toolboxes.splice(idx, 1);
    showToast('暂无可解锁的箱子');
    renderToolboxes();
  }

  function refillToolbox(box) {
    // 选「当前还需要 ∧ 没被其他解锁同色槽占着」的颜色。
    // boxPool 不再消耗——只用 presetCapacityForColor 提供 capacity 提示，
    // capacity 永远按 effectiveCapacity 在运行时按场上剩余螺丝数算。
    const prevColor = box.color;
    const availableColors = getTopAvailableColors();

    let newColor = null;
    for (const color of availableColors) {
      const duplicate = state.toolboxes.some((tb) => tb !== box && tb.unlocked && tb.color === color && tb.count < tb.capacity);
      if (!duplicate) { newColor = color; break; }
    }
    // availableColors 全被其他槽占着 → 退一步用原色（如果还有剩）
    if (!newColor && remainingScrewsOfColor(prevColor) > 0) {
      newColor = prevColor;
    }
    // 还不行就从 availableColors 里挑第一个（即使会和别的槽同色）
    if (!newColor && availableColors.length) {
      newColor = availableColors[0];
    }
    if (!newColor) return false;

    box.color = newColor;
    box.count = 0;
    box.capacity = effectiveCapacity(newColor, presetCapacityForColor(newColor), box);
    box.unlocked = true;
    return true;
  }

  function ensureToolboxForColor(color) {
    if (findToolbox(color) || findLockedToolbox(color)) return false;
    // 只复用「锁定槽位」或「解锁但还没收集任何螺丝的空槽」。
    // 绝不能覆盖一个 count > 0 的解锁箱——那会把玩家已经收集的螺丝悄悄丢掉。
    // 没空槽时返回 false，调用方会走 checkStuck/提示路径。
    let box = state.toolboxes.find((tb) => !tb.unlocked);
    if (!box) box = state.toolboxes.find((tb) => tb.unlocked && tb.count === 0);
    if (!box) return false;
    box.color = color;
    box.count = 0;
    box.capacity = effectiveCapacity(color, presetCapacityForColor(color), box);
    box.unlocked = true;
    renderToolboxes();
    pulseToolbox(box);
    return true;
  }

  function renderToolboxes() {
    els.toolboxes.innerHTML = '';
    state.toolboxes.forEach((tb) => {
      const node = document.createElement('div');
      node.dataset.toolboxId = tb.id;
      node.dataset.toolboxColor = tb.color;

      if (!tb.unlocked) {
        // 锁定状态：点击工具箱解锁
        node.className = 'toolbox locked';
        node.title = `点击解锁${colorName(tb.color)}工具箱`;
        node.addEventListener('click', () => unlockToolbox(tb));

        const lockIcon = document.createElement('div');
        lockIcon.className = 'lock-icon';
        lockIcon.textContent = '🔒';
        node.appendChild(lockIcon);

        const unlockBtn = document.createElement('div');
        unlockBtn.className = 'unlock-btn';
        unlockBtn.textContent = '点击解锁';
        node.appendChild(unlockBtn);

        els.toolboxes.appendChild(node);
        return;
      }

      node.className = `toolbox ${tb.color}`;
      node.title = `${colorName(tb.color)} (${tb.count}/${tb.capacity})`;

      // 工具箱头部：颜色标识 + 计数
      const head = document.createElement('div');
      head.className = 'toolbox-head';
      const dot = document.createElement('span');
      dot.className = 'toolbox-color';
      dot.style.setProperty('--box-color', COLORS[tb.color] || '#999');
      const label = document.createElement('span');
      label.className = 'toolbox-label';
      label.textContent = colorName(tb.color);
      head.appendChild(dot);
      head.appendChild(label);
      node.appendChild(head);

      // 进度条
      const progress = document.createElement('div');
      progress.className = 'progress-bar';
      for (let i = 0; i < tb.capacity; i++) {
        const seg = document.createElement('div');
        seg.className = 'progress-segment';
        if (i < tb.count) {
          seg.classList.add('filled');
          seg.style.background = COLORS[tb.color] || '#999';
        }
        progress.appendChild(seg);
      }
      node.appendChild(progress);

      // 计数文字
      const count = document.createElement('div');
      count.className = 'toolbox-count';
      count.textContent = `${tb.count}/${tb.capacity}`;
      node.appendChild(count);

      els.toolboxes.appendChild(node);
    });
  }

  function colorName(c) {
    return { red: '红色', blue: '蓝色', yellow: '黄色', green: '绿色' }[c] || c;
  }

  function remainingScrewsOfColor(color) {
    let n = 0;
    state.screws.forEach((s) => { if (!s.removed && s.color === color) n++; });
    return n;
  }

  // 计算一个新打开的工具箱实际应有的格子数：
  //   min(boxPool 预设容量, 场上还没拆 ∧ 没被其他同色解锁箱预占的螺丝数)
  // 这样进度条画几格就一定能装满几格，避免「卡 1/2 永远满不了」的错位。
  // excludeBox: 调用方正在改的那个 box 自己，避免把自己的旧 capacity 算进 allocated。
  function effectiveCapacity(color, presetCap, excludeBox) {
    const remaining = remainingScrewsOfColor(color);
    let allocated = 0;
    state.toolboxes.forEach((tb) => {
      if (tb === excludeBox) return;
      if (!tb.unlocked) return;
      if (tb.color !== color) return;
      allocated += Math.max(0, tb.capacity - tb.count);
    });
    const free = Math.max(0, remaining - allocated);
    // 退化到至少 1 槽：避免出现 0 容量的怪箱（满箱判定立即触发，行为上等价于"没开"）。
    return Math.max(1, Math.min(presetCap, free));
  }

  function findToolbox(color) {
    return state.toolboxes.find((tb) => tb.unlocked && tb.color === color && tb.count < tb.capacity);
  }

  function findLockedToolbox(color) {
    return state.toolboxes.find((tb) => !tb.unlocked && tb.color === color && tb.count < tb.capacity);
  }

  function findFullToolbox(color) {
    return state.toolboxes.find((tb) => tb.unlocked && tb.color === color && tb.count >= tb.capacity);
  }

  // ━━━ Screw removal & board state machine ━━━

  function tryRemoveScrew(id) {
    if (state.ended) return;
    const screw = state.screws.get(id);
    if (!screw || screw.removed) return;
    if (isCovered(screw)) {
      showToast('被上层板子挡住了');
      vibrate('error');
      flashScrew(screw);
      return;
    }
    let box = findToolbox(screw.color);
    if (!box && ensureToolboxForColor(screw.color)) {
      box = findToolbox(screw.color);
      showToast(`${colorName(screw.color)}工具箱已补上`);
    }
    if (!box) {
      const lockedBox = findLockedToolbox(screw.color);
      const fullBox = findFullToolbox(screw.color);
      if (lockedBox) {
        pulseToolbox(lockedBox);
        showToast(`请先解锁${colorName(screw.color)}工具箱`);
      } else if (fullBox) {
        pulseToolbox(fullBox);
        showToast(`${colorName(screw.color)}工具箱正在整理，请稍等`);
      } else {
        showToast(`没有可用的${colorName(screw.color)}工具箱`);
      }
      vibrate(fullBox ? 'tap' : 'error');
      shakeScrew(screw);
      if (!fullBox) checkStuck();
      return;
    }

    const flyFrom = worldToClient(screw.worldX, screw.worldY);
    const board = state.boards.get(screw.boardId);
    clearHint();
    state.moveCount += 1;
    createScreenBurst(flyFrom, screw.color);
    board.removedScrews += 1;
    const remaining = board.totalScrews - board.removedScrews;

    // 拧掉前先移除 joint（因为 joint 锚定的就是这个最后的 pivot 螺丝）
    if (remaining === 0 && board.joint) {
      state.world.removeImpulseJoint(board.joint, true);
      board.joint = null;
    }

    screw.removed = true;
    if (screw.mesh) {
      state.scene.remove(screw.mesh);
      disposeObject(screw.mesh);
      screw.mesh = null;
    }
    state.world.removeCollider(screw.collider, true);
    state.world.removeRigidBody(screw.body);
    screw.collider = null;
    screw.body = null;
    screw._flyFrom = flyFrom;

    collectScrew(screw, box);

    if (remaining === 1) {
      pivotBoard(board);
    } else if (remaining === 0) {
      releaseBoard(board);
    }
    refreshScrewPositions();
    updateStats();
    resetIdleHint();
  }

  function pivotBoard(board) {
    // 找到该板子上唯一剩下的螺丝作为旋转支点
    let pivot = null;
    for (const s of state.screws.values()) {
      if (s.boardId === board.cfg.id && !s.removed) { pivot = s; break; }
    }
    if (!pivot) return;

    // 板子转为 Dynamic（带正常密度的质量+转动惯量），重力会让重的一侧下坠
    board.body.setBodyType(state.rapier.RigidBodyType.Dynamic, true);
    // 这块板子从 Fixed 变 Dynamic，被它覆盖的螺丝 _coveredByFixed 缓存需要重算。
    state.fixedCoverageDirty = true;
    // 角阻尼让单点支撑的板子摆动后逐渐趋于停止，避免永久晃动
    board.body.setAngularDamping(1.6);
    board.body.setLinearDamping(0.2);

    // 在板子局部坐标的 pivot 位置创建 Revolute Joint，连接到 Fixed 的螺丝
    const jointParams = state.rapier.JointData.revolute(
      { x: pivot.cfg.localX, y: pivot.cfg.localY },
      { x: 0, y: 0 }
    );
    board.joint = state.world.createImpulseJoint(jointParams, board.body, pivot.body, true);
    flashScrew(pivot);
    pulseBoard(board, 'pivot');
  }

  function releaseBoard(board) {
    // 最后一个螺丝拧掉：板子完全自由落体
    if (board.body.bodyType() !== state.rapier.RigidBodyType.Dynamic) {
      board.body.setBodyType(state.rapier.RigidBodyType.Dynamic, true);
    }
    // 释放后让阻尼回归到较低值，保留自然掉落手感
    board.body.setAngularDamping(0.3);
    board.body.setLinearDamping(0);
    // A tiny initial wake-up impulse so it doesn't appear stuck.
    board.body.applyImpulse({ x: (Math.random() - 0.5) * 2, y: -3 }, true);
    if (typeof board.body.applyTorqueImpulse === 'function') {
      board.body.applyTorqueImpulse((Math.random() - 0.5) * 80, true);
    }
    pulseBoard(board, 'release');
    createScreenBurst(worldToClient(board.body.translation().x, board.body.translation().y), 'yellow');
  }

  // ━━━ Coverage / occlusion / geometry ━━━

  function isBoardFixed(board) {
    return board.body && board.body.bodyType() === state.rapier.RigidBodyType.Fixed;
  }

  function ensureFixedCoverageCache() {
    if (!state.fixedCoverageDirty) return;
    state.fixedCoverageDirty = false;
    state.screws.forEach((screw) => {
      if (screw.removed) { screw._coveredByFixed = false; return; }
      const screwZ = state.boards.get(screw.boardId).cfg.z;
      let covered = false;
      for (const other of state.boards.values()) {
        if (other.cleared) continue;
        if (other.cfg.z <= screwZ) continue;
        if (!isBoardFixed(other)) continue;
        if (pointInsideBoard({ x: screw.worldX, y: screw.worldY }, other)) {
          covered = true;
          break;
        }
      }
      screw._coveredByFixed = covered;
    });
  }

  function isCovered(screw) {
    // Fixed 板子位姿不变，cache 命中就能省一次多边形扫描；
    // Dynamic 板子（pivot / 自由下落中）每帧位姿都不一样，必须实时检测。
    ensureFixedCoverageCache();
    if (screw._coveredByFixed) return true;
    const screwZ = state.boards.get(screw.boardId).cfg.z;
    for (const other of state.boards.values()) {
      if (other.cleared) continue;
      if (other.cfg.z <= screwZ) continue;
      if (isBoardFixed(other)) continue;
      if (pointInsideBoard({ x: screw.worldX, y: screw.worldY }, other)) return true;
    }
    return false;
  }

  function pointInsideBoard(p, board) {
    const t = board.body.translation();
    const a = board.body.rotation();
    const c = Math.cos(-a), s = Math.sin(-a);
    const dx = p.x - t.x, dy = p.y - t.y;
    const lx = dx * c - dy * s;
    const ly = dx * s + dy * c;
    const halfW = board.cfg.w / 2, halfH = board.cfg.h / 2;
    if (Math.abs(lx) > halfW || Math.abs(ly) > halfH) return false;
    const points = boardLocalPolygon(board.cfg);
    if (!points) return true;
    return pointInsidePolygon({ x: lx, y: ly }, points);
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

  // ━━━ Animations & DOM effects ━━━

  function worldToClient(x, y) {
    if (!state.renderer || !state.camera) return null;
    const rect = state.renderer.domElement.getBoundingClientRect();
    const nx = (x - state.camera.left) / (state.camera.right - state.camera.left);
    const ny = (state.camera.top - y) / (state.camera.top - state.camera.bottom);
    return { x: rect.left + nx * rect.width, y: rect.top + ny * rect.height };
  }

  function createScreenBurst(pt, color) {
    if (!pt) return;
    const node = document.createElement('div');
    node.className = 'screen-burst';
    node.style.left = `${pt.x}px`;
    node.style.top = `${pt.y}px`;
    node.style.setProperty('--burst-color', COLORS[color] || color || '#f8fafc');
    for (let i = 0; i < 8; i++) {
      const dot = document.createElement('span');
      const a = (i / 8) * Math.PI * 2;
      const d = 26 + (i % 3) * 7;
      dot.style.setProperty('--dx', `${Math.cos(a) * d}px`);
      dot.style.setProperty('--dy', `${Math.sin(a) * d}px`);
      node.appendChild(dot);
    }
    document.body.appendChild(node);
    state.flyers.add(node);
    requestAnimationFrame(() => node.classList.add('show'));
    setTimeout(() => {
      state.flyers.delete(node);
      node.remove();
    }, 620);
  }

  function pulseBoard(board, type) {
    if (!board || !board.mesh) return;
    clearTimeout(board._pulseTimer);
    const scale = type === 'release' ? 1.04 : 1.02;
    board.mesh.scale.setScalar(scale);
    if (board.mesh.material) board.mesh.material.opacity = 1;
    board._pulseTimer = setTimeout(() => {
      if (!board.cleared && board.mesh) {
        board.mesh.scale.setScalar(1);
        if (board.mesh.material) board.mesh.material.opacity = BOARD_OPACITY;
      }
    }, 180);
  }

  function toolboxNode(box) {
    if (!els.toolboxes || !box) return null;
    return els.toolboxes.querySelector(`[data-toolbox-id="${box.id}"]`);
  }

  function toolboxTarget(box) {
    const node = toolboxNode(box);
    if (!node) return null;
    const filled = node.querySelectorAll('.progress-segment.filled');
    const target = filled.length ? filled[filled.length - 1] : node;
    const rect = target.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function animateScrewToToolbox(screw, box) {
    const from = screw._flyFrom;
    const to = toolboxTarget(box);
    if (!from || !to) return;
    const node = document.createElement('div');
    node.className = 'screw-fly';
    node.style.left = `${from.x}px`;
    node.style.top = `${from.y}px`;
    node.style.background = COLORS[screw.color] || '#999';
    document.body.appendChild(node);
    state.flyers.add(node);
    requestAnimationFrame(() => {
      node.style.transform = `translate(${to.x - from.x}px, ${to.y - from.y}px) scale(0.35)`;
      node.style.opacity = '0';
    });
    const done = () => {
      state.flyers.delete(node);
      node.remove();
    };
    node.addEventListener('transitionend', done, { once: true });
    setTimeout(done, 520);
  }

  function pulseToolbox(box) {
    const node = toolboxNode(box);
    if (!node) return;
    node.classList.add('accept');
    setTimeout(() => node.classList.remove('accept'), 220);
  }

  function markToolboxDelivering(box) {
    const node = toolboxNode(box);
    if (node) node.classList.add('delivering');
  }

  function markToolboxFull(box) {
    const node = toolboxNode(box);
    if (!node) return;
    node.classList.add('full-pop');
    setTimeout(() => node.classList.remove('full-pop'), 360);
  }

  function collectScrew(screw, box) {
    box.count += 1;
    renderToolboxes();
    pulseToolbox(box);
    animateScrewToToolbox(screw, box);
    vibrate('tap');
    if (box.count >= box.capacity) {
      showToast(`${colorName(screw.color)}工具箱已装满`);
      vibrate('success');
      markToolboxFull(box);
      scheduleTimer(() => markToolboxDelivering(box), 240);
      scheduleTimer(() => {
        // 交付后从场上还需要的颜色中随机选一个填回；如果没有可选颜色则移除槽位。
        if (!refillToolbox(box)) {
          const idx = state.toolboxes.indexOf(box);
          if (idx !== -1) state.toolboxes.splice(idx, 1);
        }
        renderToolboxes();
      }, 780);
    }
  }

  // ━━━ Main loop, sync, culling ━━━

  function tick(now) {
    state.raf = requestAnimationFrame(tick);
    if (state.ended) return;
    syncRendererSize(false);

    // 把渲染帧时间切成固定 1/60 的物理步，让物理速度独立于显示帧率。
    const last = state.lastTime || now;
    const frameDt = Math.min((now - last) / 1000, MAX_FRAME_DT);
    state.lastTime = now;
    state.dtAccum += frameDt;

    let steps = 0;
    while (state.dtAccum >= FIXED_DT && steps < MAX_STEPS_PER_FRAME) {
      state.world.step(state.eventQueue);
      state.dtAccum -= FIXED_DT;
      steps++;
    }
    // 卡顿后丢弃多余累计，避免物理一直追赶产生雪崩。
    if (steps === MAX_STEPS_PER_FRAME) state.dtAccum = 0;

    syncMeshes();
    updateVisibility();
    refreshScrewPositions();
    cullFallenBoards();
    state.renderer.render(state.scene, state.camera);
  }

  function syncMeshes() {
    state.boards.forEach((board) => {
      if (board.cleared) return;
      const t = board.body.translation();
      const r = board.body.rotation();
      board.mesh.position.x = t.x;
      board.mesh.position.y = t.y;
      board.mesh.rotation.z = r;
    });
  }

  function cullFallenBoards() {
    state.boards.forEach((board) => {
      if (board.cleared) return;
      const t = board.body.translation();
      if (t.y < -200 || t.x < -400 || t.x > state.designW + 400) {
        board.cleared = true;
        // 板子离场，所有把它当 cover 的下层螺丝缓存都要重算（实际几乎都是 Dynamic 板子才会触发，
        // 但保险起见仍然 dirty 一次，避免少数 Fixed 板子被边界吞掉时漏掉缓存失效）。
        state.fixedCoverageDirty = true;
        state.world.removeCollider(board.collider, true);
        state.world.removeRigidBody(board.body);
        state.scene.remove(board.mesh);
        updateStats();
      }
    });
    if (!state.ended && [...state.boards.values()].every((b) => b.cleared)) {
      endGame(true);
    }
  }

  function updateVisibility() {
    let maxZ = 0;
    state.boards.forEach((board) => {
      if (!board.cleared && board.cfg.z > maxZ) maxZ = board.cfg.z;
    });
    state.topZ = maxZ;
    state.visibleMinZ = maxZ - 2;

    state.boards.forEach((board) => {
      if (board.cleared) return;
      const visible = board.cfg.z >= state.visibleMinZ;
      const mat = board.mesh.material;
      if (visible) {
        mat.color.set(board.cfg.color);
        mat.opacity = BOARD_OPACITY;
      } else {
        mat.color.set('#6b7280');
        mat.opacity = 0.5;
      }
      if (board.mesh.children.length) {
        const outline = board.mesh.children[0];
        if (outline && outline.material) {
          outline.material.opacity = visible ? 0.45 : 0.15;
        }
      }
    });
  }

  // ━━━ Stats, end game, feedback ━━━

  function updateStats() {
    const boardsLeft = [...state.boards.values()].filter((b) => !b.cleared).length;
    const screwsLeft = [...state.screws.values()].filter((s) => !s.removed).length;
    els.boardsLeft.textContent = boardsLeft;
    els.screwsLeft.textContent = screwsLeft;
  }

  function checkStuck() {
    const canProgress = [...state.screws.values()].some((screw) => {
      if (screw.removed) return false;
      if (isCovered(screw)) return false;
      return !!findToolbox(screw.color) || !!findLockedToolbox(screw.color);
    });
    if (!canProgress) {
      const locked = state.toolboxes.find((tb) => !tb.unlocked);
      const hasPool = state.boxPool.some((b) => !b.used);
      if (locked) {
        pulseToolbox(locked);
        showToast('先解锁底部工具箱，打开新的收纳机会');
        return;
      }
      if (hasPool) {
        showToast('工具箱正在补货，稍等一下');
        return;
      }
    }
    if (!canProgress) endGame(false);
  }

  function endGame(win) {
    if (state.ended) return;
    state.ended = true;
    clearTimeout(state.hintTimer);
    clearHint();
    vibrate(win ? 'success' : 'error');
    els.modal.classList.remove('hidden');
    const isLast = state.levelIndex >= window.SCREW_LEVELS.length - 1;
    if (win) {
      createScreenBurst(worldToClient(state.designW / 2, state.designH / 2), 'yellow');
      els.modalTitle.textContent = isLast ? '全部通关！' : '通关！';
      els.modalText.textContent = isLast
        ? `恭喜！你已完成全部 ${window.SCREW_LEVELS.length} 关，本关用了 ${state.moveCount} 步。`
        : `第 ${state.levelIndex + 1} 关完成，用了 ${state.moveCount} 步。`;
      els.modalBtn.textContent = isLast ? '从头再来' : '下一关';
      state.modalNext = !isLast;
    } else {
      els.modalTitle.textContent = '卡住了';
      els.modalText.textContent = '没有可推进的螺丝或可用工具箱，请重开再试。';
      els.modalBtn.textContent = '再玩一次';
      state.modalNext = false;
    }
  }

  let toastTimer = 0;
  function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 1500);
  }

  function flashScrew(screw) {
    if (!screw || !screw.mesh) return;
    screw.mesh.scale.setScalar(1.25);
    clearTimeout(screw._flashTimer);
    screw._flashTimer = setTimeout(() => {
      if (!screw.removed && screw.mesh) screw.mesh.scale.setScalar(1);
    }, 120);
  }

  function shakeScrew(screw) {
    if (!screw || !screw.mesh) return;
    clearTimeout(screw._shakeTimer);
    const mesh = screw.mesh;
    const origX = mesh.position.x;
    const steps = [4, -4, 3, -3, 2, -1, 0];
    let i = 0;
    function step() {
      if (screw.removed || !screw.mesh) return;
      mesh.position.x = origX + (steps[i] || 0);
      i++;
      if (i < steps.length) {
        screw._shakeTimer = setTimeout(step, 40);
      }
    }
    step();
  }

  function vibrate(type) {
    if (!navigator.vibrate) return;
    const pattern = {
      tap: 12,
      success: [18, 30, 18],
      error: [28, 35, 28]
    }[type] || 10;
    navigator.vibrate(pattern);
  }

  boot().catch((err) => {
    console.error('boot failed', err);
    showToast('启动失败：' + (err && err.message ? err.message : err));
  });
})();

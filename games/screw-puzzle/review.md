# 拧螺丝物理小游戏 代码评审

本文件记录一次完整的代码评审结论，覆盖 `index.html`、`css/style.css`、`js/main.js`、`js/levels.js`、`scripts/validate-levels.js`、`verify-levels.js` 与两份 plan md。

## 整体观感

`screw-puzzle` 是一个相对完整、可直接静态部署的 H5 物理小游戏（Three.js + Rapier 2D），核心玩法、关卡生成、UI 反馈、本地校验都已经齐备。最大的几个问题集中在：

- `js/main.js` 单文件 1259 行，没有模块拆分；
- 少量死代码与过期注释；
- 根目录留有重复的临时脚本与 plan 文档。

## 主要优点

- **静态可部署**：`index.html` 仅靠本地 `vendor/three.min.js` 与 `vendor/rapier2d-compat.js`，无构建、无 CDN，符合 H5 小游戏发布场景。
- **物理与渲染解耦干净**：正交相机把世界单位等同于设计像素；`Fixed → Pivot Joint → Dynamic` 三段式板子状态机清晰。
- **遮挡判定与几何一致**：多边形 local polygon 与点包含判定在 `main.js` 和 `levels.js` 共用同一套规则，避免视觉/逻辑错位。
- **关卡生成有可复现性**：确定性 PRNG + seed，50 关按教学/中/高/终极分段，自动生成箱池并保证每箱 ≥ 2 槽。
- **本地校验脚本完善**：`scripts/validate-levels.js` 检查关卡数量、ID、形状、螺丝是否落在板内并给出 warnings。
- **反馈层细节到位**：toast、震动、`screen-burst` 粒子、`screw-fly` 动画、hint ring、idle 6.5s 自动提示、`waiting/locked/ready/blocked` 等多状态可视化。

## 问题与风险

### P0 真实 bug

#### 1. `ensureToolboxForColor` 可能静默丢失玩家进度

`js/main.js:715-734` 的第三个 fallback 会在所有解锁箱都已有进度时，挑 `count` 最小的解锁箱直接重写 `color` 并 `count = 0`：

```js
if (!box) {
  const unlocked = state.toolboxes.filter((tb) => tb.unlocked);
  unlocked.sort((a, b) => a.count - b.count);
  box = unlocked[0];          // 即使 count > 0 也会被选中
}
// ...
box.color = poolIdx === -1 ? color : state.boxPool[poolIdx].color;
box.count = 0;                // 玩家已收集的螺丝在此被丢弃
```

**修复方向**：去掉第三个 fallback，只允许 reuse "锁定槽位" 或 "解锁但空" 的槽位。无槽可用时返回 `false`，让 `tryRemoveScrew` 走 `lockedBox/fullBox` 提示分支。

#### 2. `cleanup()` 没清理 `collectScrew` 的 setTimeout

`js/main.js:1067-1086` 在工具箱装满后挂了两个 `setTimeout`（240ms / 780ms），其中 780ms 那个会调用 `refillToolbox(box)`，并消耗 `state.boxPool` 的资源。`cleanup()` 当前只 `clearTimeout(state.hintTimer)`，切关切得快时残留 setTimeout 会修改新关的 `state.boxPool`，导致新关被偷走若干箱子。

**修复方向**：维护 `state.pendingTimers: Set`，提供 `scheduleTimer / clearAllTimers` 工具，`collectScrew` 与 `showHint` 这类会触碰 state 的 setTimeout 走这套，`cleanup()` 时一次性清空。

### P1 维护性

- **`main.js:11-15` 头注释过期**：仍写"每层一个 bit"的复杂 layered collision，但实际代码只用 `BOARD_MEMBER / WALL_MEMBER` 两个 bit，且螺丝直接 `setCollisionGroups(0)`。
- **死代码 / 未声明状态**：
  - `state.maxCapacity` 只写不读（`main.js:52`、`:600`、`:711`）。
  - `state.queue` 只清不用（`main.js:46`、`:278`）。
  - `state.boxPool` 在 `cleanup` 才被赋空数组，顶部 `state` 对象未声明。
- **根目录有临时/重复文件**：
  - `verify-levels.js` 是 ad-hoc 调试脚本，与 `scripts/validate-levels.js` 职责重叠（一个验结构、一个模拟可解性），建议挪进 `scripts/` 并改名 `solvability-check.js`。
  - `PLAN-d86881.md`、`screw-puzzle-fun-iteration-52a628.md` 是规划稿，可以挪到 `docs/` 或合并进 `README`。

### P2 性能 / 体验

- **物理 step 没有 dt 补偿**：`tick()` 直接 `world.step(eventQueue)`，低帧率设备物理速度会变成一半。建议用时间累加器固定 60Hz 步进。
- **`isCovered` 每帧 O(boards × screws)**：后期 30 层 + 多片板的关卡会跑到数千次多边形点检测/帧。可以仅在板位姿/螺丝集合变化时重算，或按 z 层只检查更上层的板子。
- **同色重复槽位时 `pulseToolbox` 选错节点**：`querySelector('[data-toolbox-color]')` 只取第一个匹配。建议给每个槽位一个 `data-toolbox-id` 稳定 id。
- **`index.html` Rapier shim 污染全局**：加载完后建议 `delete window.module; delete window.exports;` 收尾。

### P3 工程结构

- **`main.js` 1259 行单文件**：建议按 `physics / render / level / toolbox / hint / ui` 拆 6 个文件。
- **`css/style.css` 全压缩成 14 行**：维护痛苦，建议保留展开源码，发布前再压缩。

## 改进建议优先级

- **P0（已完成）**：修 `ensureToolboxForColor` 数据丢失 + `cleanup` setTimeout 残留。
- **P1（已完成）**：清死代码（`state.maxCapacity / state.queue / state.deliveries`）、同步 `main.js` 头部碰撞过滤注释、`verify-levels.js` 迁到 `scripts/solvability-check.js` 并接入 CI 退出码、两份 plan md 收进 `docs/`、README 同步。
- **P2（已完成）**：`index.html` Rapier shim 加载后清理 `window.module / window.exports`；工具箱用 `data-toolbox-id` 稳定 id 取代 `data-toolbox-color`，封装 `toolboxNode(box)` helper；`tick` 改成固定 60Hz 步长累加器（`FIXED_DT / MAX_FRAME_DT / MAX_STEPS_PER_FRAME`），物理速度独立于显示帧率；`isCovered` 拆成"Fixed 板子结果缓存（`screw._coveredByFixed`）+ Dynamic 板子实时检测"，`pivotBoard / cullFallenBoards / cleanup` 触发 `state.fixedCoverageDirty`。
- **P3（部分完成）**：CSS 反压缩——`css/style.css` 从 13 行 6730 字节展开成 400 行 9374 字节，按 base / layout / stage / toast / toolbox / modal / hint / animations / media queries 9 块分组并加中文注释，所有规则与原版完全一致；`main.js` 加 11 个 `━━━` 分节 banner（Boot / Three.js / Cleanup / Boards & screws / Input & idle hints / Toolboxes / Screw removal / Coverage / Animations / Main loop / Stats）方便定位。**真正拆文件按用户要求暂缓**（保留 ~1400 行单文件，不引入 ES Modules / window.Game 命名空间这种 invasive 改造）。

## 后续修复：lv-2 无解 + boxPool 资源化设计错误

用户反馈 lv-2 无解。根因排查：

- **lv-2** boxPool 只有 3 个箱（`[blue(3), red(2), red(2)]`），原 `setupToolboxes` 把 3 个箱全部 `mark used`（含 locked 槽）。满交付时 `refillToolbox` 找不到 spare → splice 槽位；玩家解锁 locked 槽时 `refillToolbox` 同样失败 → 又 splice。剩余红螺丝无家可归。
- **lv-8 / lv-29 等中后期关**：`boxPool` 总容量 = 总螺丝数（边缘紧贴），`effectiveCapacity` 按"剩余 < 预设"裁剪 capacity 时让某些 entry"浪费"了未用的容量，加上 `ensureToolboxForColor` 复用空槽也吃 entry，最终 pool 不够装完所有螺丝。

更深层的 root cause 是 **`boxPool` 被错误地设计成"有限消耗资源"**，但 README 描述的玩法本身没有这个限制（"从场上还需要的颜色中随机选一个填回"）。

### 落地修复

- **`boxPool` 取消 `used` 概念**：变成纯粹的"颜色 + 容量提示"。`setupToolboxes / refillToolbox / ensureToolboxForColor / unlockToolbox` 都不再消耗 pool；每次开新箱时 `presetCapacityForColor` 给 capacity 上限提示，`effectiveCapacity` 按场上剩余螺丝数裁剪。
- **`generateBoxes` 修 `n === 1` 分支**：N=1 颜色生成 `capacity=1` 的箱（之前硬编码 2，工具箱永远卡 1/2 装不满）。
- **`unlockToolbox`**：`refillToolbox` 失败时如果原色还有未拆螺丝就直接解锁原色（不消耗任何资源），而不是 splice。

### 新增 `scripts/playthrough-check.js`

严格按 main.js 工具箱逻辑模拟玩家通关（不带 `solvability-check` 的宽松 fallback），50 关全部通过。和 `solvability-check` 互补：

- `solvability-check`：宽松策略验证**关卡数据本身可解**。
- `playthrough-check`：严格策略验证**真实游戏逻辑下能玩到通关**。

`boxPool` 取消 `used` 概念后，simulator 的"覆盖 count > 0 的解锁箱"fallback 实际上不再被触发（因为 main.js 现在永远能开同色新箱），两个 simulator 的行为差异已经收敛。

## 后续修复：14 条板子越界 warning

`validate-levels.js` 之前一直警告 14 个关卡的某些板子 `extends beyond vertical design bounds`。根因在 `buildTower` 的"方块化分支"（`r() < 0.45` 把板子拉成大正方形）：`side = bh * (2.8~4.6)`，没有上限，最严重 lv-41 b6 把 `bh` 拉到 623（超出 design.height=560），加上最终 `py` 没有像 `px` 那样 clamp，导致板子顶部/底部出界。

修复：方块化分支后加 `bw / bh` clamp（≤ 760 / ≤ 480，留 40 px 边距），并对齐 `px` 的写法给 `py` 也加 clamp（`bh/2 + 12, 560 - bh/2 - 12`）。修复后 validate-levels 0 warning。

副作用：`pickShape` 走哪个分支由 `ratio = w/h` 决定，clamp bw/bh 后某些板的 ratio 变了 → 走不同形状分支 → 后续 `pointInsideBoardLocal` 检查的 PRNG 消耗模式变化，连锁导致全部 50 关 boards/screws 总数从 1284 / 3181 → 1280 / 3173（少 4 块板、8 颗螺丝）。但这些原本越界的板就有视觉/物理问题，调整后 solvability-check / playthrough-check 仍全 50 关通过。

## 后续修复：手机端"看不到板子，板子在主屏幕下方"

用户报告手机上打开页面时舞台板子消失/被推到屏幕下方。

根因：`.app` 是 `display: grid + grid-template-rows: auto 1fr auto + height: 100vh`，但 `.stage` 设了 `min-height: 400px`。手机竖屏下：

- topbar `flex-direction: column` + stats 多元素折行 ≈ 200~250 px
- toolbox-panel 4 列工具箱 ≈ 150 px
- 加上各 padding/gap，外围占 400+ px，剩给 1fr 的 stage 仅剩 100~250 px。
- 但 `.stage { min-height: 400px }` 强行让 stage 高 400 px，超出 grid track → stage 下半部分溢出 1fr 单元被 toolbox 覆盖、再叠加 100vh 限制和 body `overflow: hidden`，板子（design 中心 y=280）就被挤到 viewport 下方/被裁掉。

修复（仅改 `css/style.css`）：

- `body / .app` 同时声明 `100vh` + `100dvh`（手机浏览器地址栏隐藏/出现时正确反映可视高度）。
- `@media (max-width: 720px)`：移除 `.stage { min-height }`（关键），紧凑化 topbar（隐藏副标题 `<p>`、缩小 padding 和字号）、stats 按钮缩小、toolbox-panel/toolbox 缩小 min-height 到 78 px、progress-bar 18 px。
- 新增 `@media (max-width: 380px)`：极小屏（iPhone SE 等）工具箱网格从 4 列改成 2 列，进一步压缩 padding。

修复后 stage 跟随 grid `1fr` 自适应，design 980×560 通过 `fitCamera` 的 letterbox 缩放完整显示在 stage 内，手机端可见。

## 后续修复：关卡板子整体偏下（用户报告"40 关板子都在下面"）

`buildTower` 默认 `cy = 235`，塔从 cy 起向上叠（`y = cy + i*step`），但 design 中心是 y=280。统计 50 关平均 y：

- 短塔（lv-1~10, layers=2~7）avg y=240~250（明显偏下）
- 中塔（lv-20~30, layers=12~17）avg y=270~285（接近中心）
- 长塔（lv-46~50, layers=22~30）avg y=285~306（偏上）

`cy=235` 是固定值不随 layers 调整，导致短塔挤在 design 下半。

修复（`js/levels.js`）：默认 `cy` 改成 layers-aware：

```js
const cy = opts.cy != null ? opts.cy : Math.round(280 - (layers - 1) * 2.5);
```

这样塔的算术中心 `cy + (layers-1)*2.5 ≈ 280` 永远落在 design 中心。

效果：所有 50 关 avg y 全部收敛到 278~286（居中）。lv-40 (avg 283 → 283) 不变，但 lv-1 (240 → 283)、lv-5 (245 → 278)、lv-50 (306 → 280) 都修正回中心。

校验：validate / solvability / playthrough 全过。boards / screws 总数仍为 1280 / 3173（PRNG 序列不受影响，只整体偏移 y 坐标）。

## 后续修复：430×932 竖屏设计区没有视觉居中

用户继续反馈 430×932 手机上所有板子都不在屏幕中间。

根因不是关卡坐标，而是移动端舞台比例：上一版为了避免 `min-height: 400px` 溢出，把 `.stage` 交给 grid 的 `1fr` 高度自适应。以 430×932 估算，`.stage` 约为 414×703，宽高比 0.59；`fitCamera()` 为保证 980 宽完整显示，会把相机世界视野扩成约 980×1664，导致真正的 design 980×560 只占舞台中间约 237px 高。板子在 design 中是居中的，但视觉上落在一个很高空画布的中间小条里，用户感知为“不在屏幕中间”。

修复：

- 手机端 `.stage-wrap` 改成 grid，并 `align-items: center`。
- 手机端 `.stage` 固定 `aspect-ratio: 980 / 560; height: auto; max-height: 100%; min-height: 0;`，让 design 区域本身按 980:560 比例居中显示。
- `main.js stageSize()` 去掉 `Math.max(320, ...)`，改为真实 DOM 尺寸 `Math.max(1, ...)`。否则 430 宽时 stage 真实高度约 237px，但 JS 会按 320px 算相机，造成画面和点击坐标再次错位。

430×932 估算结果：stage 从约 414×703 改为约 414×237，比例正好 1.75，design 980×560 填满 stage，不再被压成 703px 高空画布中的小条。校验脚本全过。

## 后续修复：手机端不可点击 + 大板/旋转板仍有溢出

用户继续反馈手机端“无法点击，没有完整展示所有板子，板子溢出很多”。

上一版只把 `.stage` 交给 CSS `aspect-ratio`，在移动端仍有两个风险：

- 部分移动浏览器对 `height:auto + aspect-ratio + max-height` 的实际计算不稳定，可能导致 DOM 尺寸、canvas 尺寸和 Three.js 相机尺寸不一致。
- 相机仍主要围绕 design 区域，而关卡中存在大板/旋转板。比如 lv-50 某块板旋转后实际 AABB 到 y=577.5，已经超出 design height 560；只检查 `y ± h/2` 不足以保证旋转后完整可见。
- 手机宽度 430 时缩放后原点击半径约 6px，手指很难点中，表现为“无法点击”。

最终修复：

- `css/style.css`：手机端 `.stage-wrap` 用 flex 居中 `.stage`，不再只靠 CSS 自动推断高宽。
- `main.js`：新增 `fitStageElement()`，在 `stageSize()` 前按 `.stage-wrap` 真实尺寸显式设置 `.stage` 为最大可容纳的 980:560 矩形（430×932 下约 414×236）。
- `main.js`：`fitCamera()` 改为按当前关卡所有板子的**旋转后 AABB**加 28px margin 来 fit，而不是只看固定 design 区；lv-40/lv-50 这类大板关能完整显示。
- `main.js`：点击命中半径改为 `Math.max(SCREW_R + 4, worldPerPixel * 26)`，保证手机端至少 26px 触控容错。

430×932 估算：lv-40 相机视野约 1043×596，lv-50 约 1105×632，均覆盖旋转后所有板子；触控半径稳定为 26px。validate / solvability / playthrough 全过。

## 后续修复：canvas 真实尺寸不同步导致显示裁切/点击错位

用户继续反馈“仍然没有在画板中完整展示板子，螺丝和点击螺丝位置不一致”。

继续排查后，关键风险点是移动端浏览器地址栏/visual viewport 变化、CSS 重排、border/content-box 差异会让 canvas 的真实 DOM 尺寸和 `state.canvasW/H`、renderer drawing buffer、camera 参数不同步。一旦 canvas 被 CSS 拉伸或裁切，视觉螺丝位置和点击反算坐标就会分离。

修复：

- `.stage canvas` 显式加 `width: 100%; height: 100%;`，避免 canvas 使用默认 CSS 尺寸。
- 新增 `syncRendererSize(force)`：用 `stage.clientWidth/clientHeight` 同步 renderer size、`state.canvasW/H`、camera 和螺丝状态。
- `window.visualViewport.resize` 也触发同步，覆盖手机地址栏收起/展开导致的可视区变化。
- `tick()` 每帧渲染前、`onCanvasPointerDown()` 点击前都调用 `syncRendererSize(false)`，防止移动端布局变化但未触发常规 resize。
- 点击坐标换算从 `state.canvasW/H` 改为当前 `renderer.domElement.getBoundingClientRect().width/height`，确保按用户实际看到的 canvas 反算世界坐标。
- `levelViewBounds()` 进一步纳入螺丝 mesh 的视觉半径，避免边缘螺丝被相机边界裁掉。

校验：`node --check`、`validate-levels`、`solvability-check`、`playthrough-check` 全过。lv-40 bounds 约 972.5×596.1，lv-50 bounds 约 995.3×631.6，均由相机完整覆盖。

## 后续优化：手机版横屏充分利用空间

用户确认移动端显示/点击修复后，反馈“手机版用横屏，手机有太多空间浪费，板子又变得很小，让下面两部分充分利用起来”。

根因：横屏（如 932×430）仍沿用原先上中下三段布局，topbar 和 toolbox-panel 继续占用纵向空间，stage 被压矮，板子显得小。

优化：

- 新增 `@media (max-height: 520px) and (orientation: landscape)` 横屏专用布局。
- `.app` 改成两列：左侧 `stage-wrap` 跨两行占满高度，右侧窄栏放 topbar + toolbox-panel。
- topbar 横屏侧栏化：隐藏说明文案、压缩按钮/padding。
- toolbox 横屏侧栏化：2 列网格、更低 toolbox/progress-bar，右栏可滚动。
- `fitStageElement()` 只在**竖屏手机**强制 980:560，横屏交给 CSS 左侧舞台填满高度，避免横屏仍被限制成小矩形。

932×430 估算：右栏约 260px，左侧舞台约 648×414，明显大于之前竖屏式 414×236；validate / solvability / playthrough 全过。

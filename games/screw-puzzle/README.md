# 拧螺丝物理小游戏

一个纯静态 H5 拧螺丝物理小游戏，基于本地 `Three.js + Rapier 2D` 实现，无构建步骤、无外部网络依赖。玩家需要拆除未被遮挡、且能进入同色工具箱的螺丝；当某块板子的全部螺丝被拆掉后，板子会从固定状态切换为动态刚体，在重力作用下旋转、下落，离开舞台后被判定为清除。清除所有板子即可通关。

## 项目特性

- **静态部署**：直接通过任意静态 HTTP 服务打开 `index.html` 即可运行。
- **本地依赖**：`Three.js` 和 `Rapier 2D compat` 已放在 `vendor/`，不依赖 CDN。
- **物理反馈**：板子失去螺丝约束后由 Rapier 2D 接管，下落、旋转、离场。
- **50 关程序化生成**：`js/levels.js` 在 `980 × 560` 设计空间内生成 50 关。
- **多形状板子**：支持矩形、方形、菱形、三角形、五边形、六边形、八边形等板子形状。
- **遮挡判定**：上层板子覆盖的螺丝不可点击，拆解顺序需要考虑层级。
- **工具箱收纳规则**：螺丝必须进入同色工具箱；工具箱容量按剩余螺丝动态裁剪。
- **移动端适配**：支持手机竖屏和横屏；横屏下舞台占左侧大区域，工具箱与操作信息放在右侧。
- **可验证关卡**：提供结构校验、宽松可解性模拟、严格真实逻辑通关模拟三类脚本。

## 目录结构

```text
screw-puzzle/
├── index.html                         # 页面入口，加载样式、vendor 和游戏脚本
├── README.md                          # 项目说明
├── review.md                          # 代码评审、修复记录和后续改进记录
├── css/
│   └── style.css                      # 全部样式与响应式布局
├── js/
│   ├── levels.js                      # 50 关程序化生成与关卡数据
│   └── main.js                        # 游戏主逻辑、渲染、物理、输入、工具箱、胜负判定
├── scripts/
│   ├── validate-levels.js             # 关卡结构与几何校验
│   ├── solvability-check.js           # 宽松策略可解性检查
│   └── playthrough-check.js           # 严格模拟 main.js 逻辑的通关检查
├── docs/
│   ├── PLAN-d86881.md                 # 早期项目计划文档
│   └── screw-puzzle-fun-iteration-52a628.md
│                                      # 趣味性迭代计划
└── vendor/
    ├── three.min.js                   # Three.js 本地构建
    └── rapier2d-compat.js             # Rapier 2D compat 本地构建
```

## 玩法规则

### 基础目标

- 点击可见、可收纳的螺丝进行拆除。
- 拆掉板子上的全部螺丝后，该板子释放为动态刚体。
- 板子掉出舞台后计为清除。
- 所有板子清除后通关。
- 如果没有任何可点击且可收纳的螺丝，则判定卡住。

### 螺丝可点击条件

一个螺丝需要同时满足：

- **未被移除**：已经收纳的螺丝不会再参与判定。
- **未被上层板子遮挡**：更高 `z` 的板子覆盖该点时不可点。
- **所在层可见**：游戏会根据当前最高层控制可见范围。
- **有可用收纳位置**：必须存在同色且未满的工具箱，或可通过解锁/补位获得位置。

### 工具箱规则

- 工具箱按颜色收纳螺丝，颜色包括红、蓝、黄、绿。
- 每个工具箱只接收同色螺丝。
- 关卡开始时会按关卡实际出现的颜色预设工具箱。
- 前 2 个工具箱默认解锁，其余工具箱显示为锁定状态。
- 锁定工具箱可点击解锁，相当于增加并行收纳槽位。
- 工具箱装满后会播放交付动画，并从场上仍需要收纳的颜色中补位。
- 容量不是固定死值，会通过运行时 `effectiveCapacity` 按当前剩余螺丝数动态裁剪，避免出现 “1/2 永远满不了” 之类状态。

### 操作按钮

- **上一关 / 下一关**：快速切换关卡。
- **提示**：高亮当前可拆且可收纳的螺丝。
- **重开**：重置当前关。
- **弹窗按钮**：通关后进入下一关；失败或最后一关后根据状态重试/继续。

## 技术架构

### 渲染层

- 使用 `Three.js` 的 `WebGLRenderer` 渲染板子和螺丝。
- 使用正交相机，世界单位等于设计像素。
- 设计空间默认是 `980 × 560`。
- 相机通过 `fitCamera()` 根据当前关卡内容自适应：
  - 统计所有板子的旋转后 AABB。
  - 纳入螺丝视觉半径。
  - 加安全边距，避免大板、旋转板或边缘螺丝被裁切。

### 物理层

- 使用 `Rapier 2D compat`。
- 板子初始为 `Fixed` 刚体。
- 当板子最后一颗螺丝被拆掉后，切换为 `Dynamic` 刚体。
- 重力方向为负 Y。
- 板子不互相碰撞，避免下落时卡在其他板子或螺丝上。
- 板子只与左右墙和顶部边界碰撞；底部没有地板，方便板子离场。
- 螺丝不参与物理碰撞，只作为 pivot/视觉对象和点击目标。

### 物理步进

`main.js` 使用固定时间步：

- `FIXED_DT = 1 / 60`
- `MAX_FRAME_DT = 1 / 15`
- `MAX_STEPS_PER_FRAME = 5`

这样物理速度不会依赖显示器帧率，也能避免页面卡顿后一次性追赶过多物理步导致雪崩。

### 输入映射

移动端曾出现过 canvas 真实尺寸、renderer 尺寸和点击反算尺寸不同步的问题，因此现在输入逻辑做了几层保护：

- `syncRendererSize()` 会同步 `.stage` 真实尺寸、renderer size、`state.canvasW/H` 和 camera。
- 常规 `resize` 与 `visualViewport.resize` 都会触发同步。
- 每帧渲染前和点击前也会同步一次，覆盖手机地址栏收起/展开等场景。
- 点击坐标使用当前 `renderer.domElement.getBoundingClientRect()` 的真实宽高反算世界坐标。
- 移动端点击半径按屏幕像素兜底，保证手指点击容错。

### 遮挡判定

- 每颗螺丝会检查是否被更高 `z` 的板子覆盖。
- 固定板子的遮挡结果做缓存，避免每帧重复计算全部固定板子。
- 动态板子仍实时判断，因为它们会下落和旋转。
- 当板子释放、清除、切关时会标记缓存失效并重建。

## 关卡生成

`js/levels.js` 负责生成全部 50 关，并挂载到：

```js
window.SCREW_LEVELS
```

设计空间：

```js
window.SCREW_DESIGN = { width: 980, height: 560 }
```

### 关卡阶段

- **1-5**：教学关，层数少、颜色少、节奏简单。
- **6-15**：中级关，开始出现双塔、摆塔、随机形状和多片板。
- **16-30**：中高级关，提高层数、碎片率和形状复杂度。
- **31-45**：高级关，更多多片板和更密集的颜色节奏。
- **46-50**：终极关，每关强调一种结构记忆点，例如巨塔、摆动巨塔、双巨塔、迷形塔、终极塔。

### 板子生成

`buildTower()` 支持多种结构：

- `pyramid`：上窄下宽。
- `inverted`：上宽下窄。
- `twin`：双塔交替。
- `sway`：左右摆动。
- `random`：尺寸与位置更随机。

生成逻辑会控制：

- 板子宽高上下限。
- 多片板概率。
- 横向位置边界。
- 竖向位置边界。
- 旋转角度。
- 可用形状池。
- 螺丝局部坐标是否落在对应板子形状内部。

当前关卡校验输出为：

```text
Level validation passed: 50 levels, 1280 boards, 3173 screws.
```

## 响应式布局

### 桌面端

- 页面为上方信息栏、中间舞台、底部工具箱三段布局。
- 舞台宽度最大 `980px`。
- 工具箱最多 4 列展示。

### 手机竖屏

- 顶部 UI 压缩，隐藏说明文案。
- 工具箱压缩高度。
- `.stage` 由 JS 根据 `.stage-wrap` 的真实尺寸设置为最大可容纳的 `980:560` 矩形。
- 相机 fit 当前关卡内容，避免板子或螺丝溢出。

### 手机横屏

手机横屏会启用专用布局：

```css
@media (max-height: 520px) and (orientation: landscape)
```

布局变为：

```text
┌──────────────────────────────┬──────────────┐
│                              │ 关卡/按钮信息 │
│                              ├──────────────┤
│            舞台              │              │
│        占满左侧高度          │    工具箱     │
│                              │   2 列网格    │
│                              │              │
└──────────────────────────────┴──────────────┘
```

这样横屏下不会让顶部和底部 UI 挤压舞台高度。以 `932 × 430` 横屏估算，舞台约为 `648 × 414`，明显大于竖屏式布局。

## 运行方式

推荐使用本地 HTTP 服务运行，不建议直接用 `file://` 打开。

### Python

```bash
python3 -m http.server 5173
```

然后打开：

```text
http://localhost:5173
```

### VS Code Live Server

也可以使用 VS Code 的 Live Server 插件打开项目根目录。

### 测试移动端

可以使用浏览器 DevTools 设备模拟：

- 竖屏：`430 × 932`
- 横屏：`932 × 430`

如果手机浏览器缓存旧资源，可以加版本参数强制刷新：

```text
http://localhost:5173/?v=mobile-test
```

## 本地校验

完整校验命令：

```bash
node --check js/main.js
node --check js/levels.js
node --check scripts/validate-levels.js
node --check scripts/solvability-check.js
node --check scripts/playthrough-check.js
node scripts/validate-levels.js
node scripts/solvability-check.js
node scripts/playthrough-check.js
```

也可以一行执行：

```bash
node --check js/main.js \
  && node --check js/levels.js \
  && node --check scripts/validate-levels.js \
  && node --check scripts/solvability-check.js \
  && node --check scripts/playthrough-check.js \
  && node scripts/validate-levels.js \
  && node scripts/solvability-check.js \
  && node scripts/playthrough-check.js
```

### 校验脚本说明

- **`scripts/validate-levels.js`**
  - 检查 50 关数量和 ID。
  - 检查板子/螺丝引用是否正确。
  - 检查螺丝颜色是否合法。
  - 检查螺丝是否落在对应板子形状内部。
  - 检查板子是否超出基础设计边界。
  - 输出基础难度统计。

- **`scripts/solvability-check.js`**
  - 使用“贪心拆最高 z”的宽松策略模拟通关。
  - 带容错 fallback。
  - 目标是验证关卡数据本身是否可解。

- **`scripts/playthrough-check.js`**
  - 严格按 `main.js` 当前工具箱逻辑模拟通关。
  - 不依赖宽松 fallback。
  - 目标是验证 50 关在真实游戏规则下能否走到通关。
  - 任一关卡死都会以非零退出码失败，方便接入 CI。

## 重要实现细节

### Rapier compat shim

`vendor/rapier2d-compat.js` 是 CommonJS 风格构建。`index.html` 会先声明临时 `module / exports` shim，加载后把 `module.exports` 暴露为 `window.RAPIER`，随后清理 shim，避免污染全局命名空间。

### 工具箱不是有限资源池

`boxPool` 只作为颜色/容量提示，不再作为会被消耗的有限资源。实际工具箱容量会根据场上剩余螺丝动态计算，避免某些关卡因为 boxPool 被耗尽而无解。

### 单螺丝颜色容量

如果某个颜色只有 1 颗螺丝，`generateBoxes()` 会生成容量为 1 的工具箱，而不是容量 2。运行时还会再通过 `effectiveCapacity` 裁剪容量。

### 关卡视觉边界

生成大正方形板子时会限制最大宽高，并对板子 `y` 做 clamp，避免板子顶/底超出设计边界。渲染时相机还会根据旋转后的真实 AABB 再次 fit，确保视觉完整。

### 移动端点击一致性

移动端点击问题主要来自 canvas DOM 尺寸、renderer 尺寸和 camera 参数不同步。当前实现会在 resize、visual viewport 变化、每帧渲染前、点击前同步尺寸，并使用真实 DOM rect 做点击反算。

## 已知取舍

- 当前仍保持 `main.js` 单文件结构，只通过分节 banner 改善可读性；尚未拆成 ES Modules 或命名空间模块。
- 物理碰撞使用板子的外接矩形 collider，不做复杂多边形物理碰撞；由于板子之间不互相碰撞，这足以满足当前玩法。
- 手机竖屏为保证完整展示横向设计区，板子视觉尺寸会受屏幕宽度限制；推荐横屏获得更大舞台。

## 后续可改进方向

- 将 `main.js` 拆分为渲染、物理、输入、工具箱、关卡流程等模块。
- 为移动端增加更明确的横屏提示。
- 增加关卡选择界面和通关进度记录。
- 增加音效、震动反馈、更多拆解动效。
- 将验证脚本接入 CI。

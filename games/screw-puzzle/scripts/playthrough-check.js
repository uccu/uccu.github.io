'use strict';

// 严格按 main.js 当前的工具箱逻辑模拟玩家通关，验证 50 关全部可解。
//
// 与 scripts/solvability-check.js 的差异：
//   - 不带「覆盖 count > 0 的解锁箱」fallback（main.js P0-a 已移除）。
//   - setupToolboxes 只 mark unlocked 槽消耗 boxPool（locked 槽不消耗）。
//   - unlockToolbox 在 refillToolbox 失败时，只要原色还有未拆螺丝就直接解锁原色。
//   - capacity 走 effectiveCapacity 按场上剩余螺丝数动态裁剪。
//
// 玩家策略：每步选「未被遮挡 ∧ 当前有合法收纳路径」的最高 z 螺丝。
// 如果该步无法立即收纳，会尝试主动解锁 locked 槽。

const path = require('path');

const root = path.resolve(__dirname, '..');
global.window = {};
require(path.join(root, 'js', 'levels.js'));

let allOk = true;

window.SCREW_LEVELS.forEach((lv) => {
  const boardZ = {};
  lv.boards.forEach((b) => { boardZ[b.id] = b.z; });

  function getWorld(s) {
    const b = lv.boards.find((x) => x.id === s.boardId);
    const c = Math.cos(b.angle);
    const sn = Math.sin(b.angle);
    return { x: b.x + s.localX * c - s.localY * sn, y: b.y + s.localX * sn + s.localY * c };
  }
  function ptInBoard(px, py, b) {
    const c = Math.cos(-b.angle);
    const s = Math.sin(-b.angle);
    const dx = px - b.x;
    const dy = py - b.y;
    const lx = dx * c - dy * s;
    const ly = dx * s + dy * c;
    return Math.abs(lx) <= b.w / 2 && Math.abs(ly) <= b.h / 2;
  }

  const screwWorld = lv.screws.map(getWorld);
  const removedS = new Set();
  const removedB = new Set();

  function isCovered(si) {
    const s = lv.screws[si];
    const sz = boardZ[s.boardId];
    const wp = screwWorld[si];
    for (const b of lv.boards) {
      if (removedB.has(b.id)) continue;
      if (boardZ[b.id] <= sz) continue;
      if (ptInBoard(wp.x, wp.y, b)) return true;
    }
    return false;
  }
  function boardScrews(bid) {
    let c = 0;
    lv.screws.forEach((s, i) => { if (!removedS.has(i) && s.boardId === bid) c++; });
    return c;
  }
  function remainingScrews(color) {
    let n = 0;
    lv.screws.forEach((s, i) => { if (!removedS.has(i) && s.color === color) n++; });
    return n;
  }

  // boxPool 不再当成有限资源，只作「颜色 + 容量提示」（与 main.js 同步）。
  const boxPool = lv.boxes.map((b) => ({ color: b.color, capacity: b.capacity }));
  const slots = [];

  function presetCapacityForColor(color) {
    const entry = boxPool.find((b) => b.color === color);
    return entry ? entry.capacity : 2;
  }

  function effectiveCapacity(color, presetCap, excludeSlot) {
    const remaining = remainingScrews(color);
    let allocated = 0;
    slots.forEach((sl) => {
      if (sl === excludeSlot) return;
      if (!sl.unlocked) return;
      if (sl.color !== color) return;
      allocated += Math.max(0, sl.cap - sl.count);
    });
    const free = Math.max(0, remaining - allocated);
    return Math.max(1, Math.min(presetCap, free));
  }

  function getTopAvailableColors() {
    const colors = new Set();
    const screwList = lv.screws
      .map((s, i) => ({ ...s, idx: i }))
      .filter((s) => !removedS.has(s.idx));
    screwList.sort((a, b) => (boardZ[b.boardId] || 0) - (boardZ[a.boardId] || 0));
    for (const s of screwList) {
      if (isCovered(s.idx)) continue;
      colors.add(s.color);
      if (colors.size >= 4) break;
    }
    return [...colors];
  }

  // setupToolboxes
  (() => {
    const availableColors = getTopAvailableColors();
    const colorSet = new Set(availableColors);
    const topBoxes = [];
    const otherBoxes = [];
    boxPool.forEach((b, i) => {
      if (colorSet.has(b.color) && topBoxes.length < 4) topBoxes.push(i);
      else otherBoxes.push(i);
    });
    while (topBoxes.length < 4 && otherBoxes.length > 0) topBoxes.push(otherBoxes.shift());

    topBoxes.forEach((poolIdx, i) => {
      const color = boxPool[poolIdx].color;
      const presetCap = boxPool[poolIdx].capacity;
      const unlocked = i < 2;
      const slot = { id: 'tb' + i, color, count: 0, cap: presetCap, unlocked };
      slots.push(slot);
      slot.cap = unlocked ? effectiveCapacity(color, presetCap, slot) : presetCap;
    });
  })();

  function refillSlot(slot) {
    const prevColor = slot.color;
    const availColors = getTopAvailableColors();
    let newColor = null;
    for (const color of availColors) {
      const dup = slots.some((sl) => sl !== slot && sl.unlocked && sl.color === color && sl.count < sl.cap);
      if (!dup) { newColor = color; break; }
    }
    if (!newColor && remainingScrews(prevColor) > 0) newColor = prevColor;
    if (!newColor && availColors.length) newColor = availColors[0];
    if (!newColor) return false;
    slot.color = newColor;
    slot.count = 0;
    slot.cap = effectiveCapacity(newColor, presetCapacityForColor(newColor), slot);
    slot.unlocked = true;
    return true;
  }

  function unlockSlot(slot) {
    if (slot.unlocked) return true;
    if (refillSlot(slot)) return true;
    if (remainingScrews(slot.color) > 0) {
      slot.cap = effectiveCapacity(slot.color, presetCapacityForColor(slot.color), slot);
      slot.count = 0;
      slot.unlocked = true;
      return true;
    }
    const idx = slots.indexOf(slot);
    if (idx !== -1) slots.splice(idx, 1);
    return false;
  }

  function ensureSlotForColor(color) {
    if (slots.some((sl) => sl.unlocked && sl.color === color && sl.count < sl.cap)) return true;
    if (slots.some((sl) => !sl.unlocked && sl.color === color && sl.count < sl.cap)) return true;
    let slot = slots.find((sl) => !sl.unlocked);
    if (!slot) slot = slots.find((sl) => sl.unlocked && sl.count === 0);
    if (!slot) return false;
    slot.color = color;
    slot.count = 0;
    slot.cap = effectiveCapacity(color, presetCapacityForColor(color), slot);
    slot.unlocked = true;
    return true;
  }

  // canRemove：纯只读检查这颗螺丝当前是否有「立即可达」的收纳路径。
  // 真实玩家会先拆有箱可装的颜色，让槽位满交付腾出空间，而不是闷着头按 z 顺序拆。
  function canRemove(si) {
    const s = lv.screws[si];
    if (isCovered(si)) return false;
    // 1. 已有匹配解锁箱 + 未满
    if (slots.some((sl) => sl.unlocked && sl.color === s.color && sl.count < sl.cap)) return true;
    // 2. 有匹配 locked 槽（玩家解锁后直接收）
    if (slots.some((sl) => !sl.unlocked && sl.color === s.color)) return true;
    // 3. 任一 locked 槽 → unlock 后 refill 会换成 s.color
    //    （条件 1 不成立时 s.color 不会被任何 unlocked 槽 dup，refill 会选它）
    if (slots.some((sl) => !sl.unlocked)) return true;
    // 4. 任一 unlocked 空槽 → ensureSlotForColor 直接换色
    if (slots.some((sl) => sl.unlocked && sl.count === 0)) return true;
    return false;
  }

  function tryRemove(si) {
    const s = lv.screws[si];
    if (isCovered(si)) return false;

    let slot = slots.find((sl) => sl.unlocked && sl.color === s.color && sl.count < sl.cap);
    if (!slot) {
      ensureSlotForColor(s.color);
      slot = slots.find((sl) => sl.unlocked && sl.color === s.color && sl.count < sl.cap);
    }
    if (!slot) {
      const lockedSame = slots.find((sl) => !sl.unlocked && sl.color === s.color);
      if (lockedSame) {
        unlockSlot(lockedSame);
        slot = slots.find((sl) => sl.unlocked && sl.color === s.color && sl.count < sl.cap);
      }
    }
    if (!slot) {
      const anyLocked = slots.find((sl) => !sl.unlocked);
      if (anyLocked) {
        unlockSlot(anyLocked);
        slot = slots.find((sl) => sl.unlocked && sl.color === s.color && sl.count < sl.cap);
      }
    }
    if (!slot) return false;

    removedS.add(si);
    slot.count++;
    if (slot.count >= slot.cap) {
      if (!refillSlot(slot)) {
        const idx = slots.indexOf(slot);
        if (idx !== -1) slots.splice(idx, 1);
      }
    }

    lv.boards.forEach((b) => {
      if (removedB.has(b.id)) return;
      if (boardScrews(b.id) === 0) removedB.add(b.id);
    });
    return true;
  }

  let steps = 0;
  while (removedS.size < lv.screws.length && steps < 2000) {
    // 候选 = 未拆 ∧ 未被遮挡 ∧ 当前能立即收纳的螺丝；按 z 降序
    const candidates = [];
    lv.screws.forEach((s, i) => {
      if (removedS.has(i)) return;
      if (!canRemove(i)) return;
      candidates.push({ idx: i, z: boardZ[s.boardId] });
    });
    candidates.sort((a, b) => b.z - a.z);

    if (candidates.length === 0) {
      // 没有立刻可拆的螺丝。检查是否真的卡死还是只是 simulator 策略不够灵活。
      const anyAccessible = lv.screws.some((s, i) => !removedS.has(i) && !isCovered(i));
      if (!anyAccessible) {
        console.log('STUCK', lv.id, lv.name, 'no accessible screw', removedS.size + '/' + lv.screws.length);
      } else {
        console.log('NO PATH', lv.id, lv.name, 'no immediate playable screw, step', steps);
        const colors = ['red', 'blue', 'yellow', 'green'];
        console.log('  Slots:', JSON.stringify(slots.map((sl) => ({ c: sl.color, n: sl.count, cap: sl.cap, u: sl.unlocked }))));
        console.log('  Pool spare by color:', JSON.stringify(colors.map((c) => [c, boxPool.filter((b) => !b.used && b.color === c).length])));
        console.log('  Remaining:', JSON.stringify(colors.map((c) => [c, remainingScrews(c)])));
      }
      allOk = false;
      return;
    }

    const best = candidates[0].idx;
    if (!tryRemove(best)) {
      console.log('UNEXPECTED', lv.id, 'canRemove said yes but tryRemove failed for screw', best);
      allOk = false;
      return;
    }
    steps++;
  }
  if (removedS.size < lv.screws.length) {
    console.log('TIMEOUT', lv.id, lv.name, removedS.size + '/' + lv.screws.length);
    allOk = false;
  }
});

if (allOk) {
  console.log('All ' + window.SCREW_LEVELS.length + ' levels playable under main.js logic');
} else {
  console.error('Some levels are NOT playable under main.js logic');
  process.exit(1);
}

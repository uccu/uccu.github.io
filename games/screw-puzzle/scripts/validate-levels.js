'use strict';

const path = require('path');

const root = path.resolve(__dirname, '..');
global.window = {};
require(path.join(root, 'js', 'levels.js'));

const design = window.SCREW_DESIGN;
const levels = window.SCREW_LEVELS;
const colors = new Set(['red', 'blue', 'yellow', 'green']);
const shapes = new Set(['rect', 'square', 'diamond', 'pentagon', 'hexagon', 'triangle', 'octagon']);
const errors = [];
const warnings = [];

function fail(level, msg) {
  errors.push(`${level ? level.id || level.name || 'unknown level' : 'global'}: ${msg}`);
}

function warn(level, msg) {
  warnings.push(`${level ? level.id || level.name || 'unknown level' : 'global'}: ${msg}`);
}

function boardLocalPolygon(board) {
  const shape = board.shape || 'rect';
  const halfW = board.w / 2;
  const halfH = board.h / 2;
  if (shape === 'rect' || shape === 'square') return null;
  if (shape === 'diamond') return [{ x: 0, y: halfH }, { x: halfW, y: 0 }, { x: 0, y: -halfH }, { x: -halfW, y: 0 }];
  const regular = (n, rot) => {
    const points = [];
    for (let i = 0; i < n; i += 1) {
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
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const a = points[i];
    const b = points[j];
    const cross = (p.y - a.y) * (b.x - a.x) - (p.x - a.x) * (b.y - a.y);
    const minX = Math.min(a.x, b.x) - eps;
    const maxX = Math.max(a.x, b.x) + eps;
    const minY = Math.min(a.y, b.y) - eps;
    const maxY = Math.max(a.y, b.y) + eps;
    if (Math.abs(cross) <= eps && p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY) return true;
    const intersect = ((a.y > p.y) !== (b.y > p.y)) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInsideBoardLocal(p, board) {
  const halfW = board.w / 2;
  const halfH = board.h / 2;
  if (Math.abs(p.x) > halfW || Math.abs(p.y) > halfH) return false;
  const polygon = boardLocalPolygon(board);
  return polygon ? pointInsidePolygon(p, polygon) : true;
}

if (!design || design.width !== 980 || design.height !== 560) {
  fail(null, 'SCREW_DESIGN should be 980 x 560');
}

if (!Array.isArray(levels) || levels.length !== 50) {
  fail(null, `expected 50 levels, got ${Array.isArray(levels) ? levels.length : 'invalid'}`);
}

(levels || []).forEach((level, index) => {
  const label = index + 1;
  const boardIds = new Set();
  const screwIds = new Set();
  const screwColorCounts = {};

  if (level.id !== `lv-${label}`) fail(level, `expected id lv-${label}, got ${level.id}`);
  if (!level.name) fail(level, 'missing name');
  if (!Array.isArray(level.boards) || !level.boards.length) fail(level, 'missing boards');
  if (!Array.isArray(level.screws) || !level.screws.length) fail(level, 'missing screws');

  (level.boards || []).forEach((board) => {
    if (boardIds.has(board.id)) fail(level, `duplicate board id ${board.id}`);
    boardIds.add(board.id);
    if (!Number.isFinite(board.x) || !Number.isFinite(board.y)) fail(level, `${board.id} has invalid position`);
    if (!Number.isFinite(board.w) || !Number.isFinite(board.h) || board.w <= 0 || board.h <= 0) fail(level, `${board.id} has invalid size`);
    if (!Number.isFinite(board.z) || board.z <= 0) fail(level, `${board.id} has invalid z`);
    if (!shapes.has(board.shape || 'rect')) fail(level, `${board.id} has invalid shape ${board.shape}`);
    if (board.x - board.w / 2 < 0 || board.x + board.w / 2 > design.width) warn(level, `${board.id} extends beyond horizontal design bounds`);
    if (board.y - board.h / 2 < 0 || board.y + board.h / 2 > design.height) warn(level, `${board.id} extends beyond vertical design bounds`);
  });

  (level.screws || []).forEach((screw) => {
    if (screwIds.has(screw.id)) fail(level, `duplicate screw id ${screw.id}`);
    screwIds.add(screw.id);
    const board = (level.boards || []).find((b) => b.id === screw.boardId);
    if (!board) {
      fail(level, `${screw.id} references missing board ${screw.boardId}`);
      return;
    }
    if (!colors.has(screw.color)) fail(level, `${screw.id} has invalid color ${screw.color}`);
    screwColorCounts[screw.color] = (screwColorCounts[screw.color] || 0) + 1;
    if (!Number.isFinite(screw.localX) || !Number.isFinite(screw.localY)) fail(level, `${screw.id} has invalid local position`);
    if (!pointInsideBoardLocal({ x: screw.localX, y: screw.localY }, board)) fail(level, `${screw.id} is outside ${board.id} local shape`);
  });

  const boards = (level.boards || []).length;
  const screws = (level.screws || []).length;
  const colorCount = Object.keys(screwColorCounts).length;
  if (boards && screws < boards * 2) warn(level, `low screw count: ${screws} screws for ${boards} boards`);
  if (label <= 5 && colorCount > 4) warn(level, `tutorial level has too many colors: ${colorCount}`);
  if (label >= 46 && screws < 50) warn(level, `final level has fewer than 50 screws: ${screws}`);
});

if (warnings.length) {
  console.log(`Level validation warnings (${warnings.length}):`);
  warnings.forEach((item) => console.log(`- ${item}`));
}

if (errors.length) {
  console.error(`Level validation failed (${errors.length}):`);
  errors.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

const totalBoards = levels.reduce((sum, level) => sum + level.boards.length, 0);
const totalScrews = levels.reduce((sum, level) => sum + level.screws.length, 0);
console.log(`Level validation passed: ${levels.length} levels, ${totalBoards} boards, ${totalScrews} screws.`);

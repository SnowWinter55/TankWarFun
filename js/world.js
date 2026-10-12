// ================= world.js — map, va chạm, di chuyển, tầm nhìn =================
function cellAt(px, py) { return { c: Math.floor(px / TILE), r: Math.floor(py / TILE) }; }
function inMap(c, r) { return c >= 0 && r >= 0 && c < COLS && r < ROWS; }
function tileWalk(c, r) {
  if (!inMap(c, r)) return false;
  if (map[r][c] === 'B') return false;
  if (crates.some(k => k.c === c && k.r === r)) return false;
  if (c === base.c && r === base.r) return false;
  return true;
}
function baseRect() { return { x: base.x - 16, y: base.y - 16, w: 32, h: 32 }; }
function hitBase(x, y) { const b = baseRect(); return x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h; }

function buildMap(def) {
  map = [];
  for (let r = 0; r < ROWS; r++) {
    map[r] = [];
    for (let c = 0; c < COLS; c++) {
      if (r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1) { map[r][c] = 'B'; continue; }
      const n = Math.random();
      map[r][c] = n < 0.6 ? 'G' : n < 0.85 ? 'D' : 'Y';
    }
  }
  const bc = Math.floor(COLS / 2);
  base = { c: bc, r: 1, x: bc * TILE + TILE / 2, y: 1 * TILE + TILE / 2,
    hp: def.baseHP, max: def.baseHP, blocks: [def.baseHP], bhp: [def.baseHP],
    burn: { stacks: 0, dur: 0, tick: 0 }, notFlammable: true }; // base INotFlammable
  map[1][bc - 2] = 'B'; map[1][bc + 2] = 'B'; map[2][bc - 2] = 'B'; map[2][bc + 2] = 'B';
  for (let i = 0; i < def.bricks; i++) {
    const c = 2 + Math.floor(Math.random() * (COLS - 4)), r = 3 + Math.floor(Math.random() * (ROWS - 6));
    if (Math.abs(c - bc) < 3 && r < 5) continue;
    map[r][c] = 'B';
  }
  crates = [];
  for (let i = 0; i < def.crates * 3 && crates.length < def.crates; i++) {
    const c = 1 + Math.floor(Math.random() * (COLS - 2)), r = 2 + Math.floor(Math.random() * (ROWS - 4));
    if (map[r][c] === 'B') continue;
    if ((c >= bc - 2 && c <= bc + 2 && r <= 3) || (r >= ROWS - 3 && Math.abs(c - bc) <= 2)) continue;
    if (crates.some(k => k.c === c && k.r === r)) continue;
    crates.push({ c, r, hp: 2, max: 2, blocks: [1, 1], bhp: [1, 1], hit: 0,
      burn: { stacks: 0, dur: 0, tick: 0 }, notFlammable: true }); // crate INotFlammable
  }
  mines = []; // đã xóa mìn tự nhiên — chỉ elite đặt
  claymores = [];
}
function dropMine(c, r) {
  if (!inMap(c, r) || map[r][c] === 'B') return false;
  if (crates.some(k => k.c === c && k.r === r)) return false;
  if (mines.some(m => m.c === c && m.r === r)) return false;
  if (mines.length >= 10) return false;
  mines.push({ c, r, x: c * TILE + TILE / 2, y: r * TILE + TILE / 2,
    t: rnd(0, 1), armedAt: time + 2.0, warned: false });
  return true;
}

// Di chuyển mượt tự do + trượt tường (tách trục X/Y).
function solidPx(x, y) {
  const { c, r } = cellAt(x, y);
  if (!inMap(c, r)) return true;
  if (map[r][c] === 'B') return true;
  if (crates.some(k => x > k.c * TILE && x < (k.c + 1) * TILE && y > k.r * TILE && y < (k.r + 1) * TILE)) return true;
  if (hitBase(x, y)) return true;
  return false;
}
function moveSmooth(o, vx, vy, dt, fly = false) {
  const s = 11;
  if (!fly) {
    const nx = o.x + vx * dt;
    if (![[nx - s, o.y - s], [nx + s, o.y - s], [nx - s, o.y + s], [nx + s, o.y + s]].some(([px, py]) => solidPx(px, py)))
      o.x = Math.max(16, Math.min(W - 16, nx));
    const ny = o.y + vy * dt;
    if (![[o.x - s, ny - s], [o.x + s, ny - s], [o.x - s, ny + s], [o.x + s, ny + s]].some(([px, py]) => solidPx(px, py)))
      o.y = Math.max(16, Math.min(H - 16, ny));
  } else {
    o.x = Math.max(14, Math.min(W - 14, o.x + vx * dt));
    o.y = Math.max(14, Math.min(H - 14, o.y + vy * dt));
  }
  o.cx = Math.floor(o.x / TILE); o.cy = Math.floor(o.y / TILE);
}
// Xoay nòng mượt về hướng target (asset vẽ hướng Bắc).
function turnTo(o, target, rate, dt) {
  const diff = ((target - o.ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  const mx = rate * dt;
  o.ang += Math.max(-mx, Math.min(mx, diff));
}
// Bot chỉ bắn khi nhìn thấy mục tiêu (không bị tường/thùng che).
function hasLOS(x1, y1, x2, y2) {
  const d = Math.hypot(x2 - x1, y2 - y1), steps = Math.ceil(d / (TILE / 3));
  for (let i = 1; i < steps; i++) {
    const px = x1 + (x2 - x1) * i / steps, py = y1 + (y2 - y1) * i / steps;
    const { c, r } = cellAt(px, py);
    if (inMap(c, r) && (map[r][c] === 'B')) return false;
    if (crates.some(k => px > k.c * TILE && px < (k.c + 1) * TILE && py > k.r * TILE && py < (k.r + 1) * TILE)) return false;
  }
  return true;
}

// ================= levels.js — level flow, spawn, unlock =================
function lvlDef(i) {
  if (i < LEVELS.length) return LEVELS[i];
  const k = i - LEVELS.length + 1; // màn vô tận: mix all + scale
  const comp = { N: 5 + k, E: 3 + k, T: 2 + k, S: 2 + k, W: 1 + k, H: 1 + k,
    F: 2 + k, M: 1 + k, C: 1 + k, G: 1 + k, V: Math.floor(k / 2), R: 1 + k };
  return { name: 'Vô tận +' + k, baseHP: 12 + 2 * k, maxAlive: 12, spawn: [1.2, 2.2],
    comp, crates: 50, bricks: 16, bonus: 380 + 60 * k };
}
function resetAll() {
  up = defUp(); ammo = defAmmo(); gold = 0; score = 0; kills = 0; level = 0;
  ammo.mis.stock = MIS_LOAD; ammo.mini.load = MINI.load; ammo.tesla.charge = 0;
  oldMissileLvl = -1;
}
function defUp() {
  return { multi: false, cnt: 0, dmg: 0, rel: 0, rail: false, pierce: 0, charge: 0, bpierce: false,
    mini: true, caliber: 0, ignit: 0, mag: 0, rapid: 0, clay: false, clair: 0, fatal: 0, shrap: 0, psi: 0,
    flame: false, napalm: 0, cold: false, chem: 0, tesla: false, high: 0, malcond: 0, ball: 0,
    hp: 0, stor: 0, frate: 0, crate: 0, cdmg: 0, rld: 0 };
}
function defAmmo() {
  return {
    mis: { load: MIS_LOAD, stock: MIS_LOAD, rel: 0 },
    mini: { load: MINI.load, stock: 0, rel: 0 },
    clay: { load: 0, stock: 0, rel: 0 },
    flame: { fuel: 0, tanks: 0, rel: 0 },
    tesla: { charge: RAIL_BAT, stock: 0, rel: 0 },
    rail: { charge: 0, stock: 0, rel: 0 } };
}
function startLevel(i) {
  level = i;
  const def = lvlDef(i);
  buildMap(def);
  bullets = []; flames = []; beams = []; balls = []; shieldReact = []; foes = []; drones = [];
  parts = []; floats = []; pickups = []; warnings = []; booms = [];
  // giữ form hiện tại nếu còn unlock, không thì về MINIGUN
  const keepForm = (typeof player !== 'undefined' && player) ? player.form : 'MINI';
  player = new Player(W / 2, H - 64);
  if (keepForm === 'MIS' || (keepForm === 'CLAY' && up.clay) || (keepForm === 'FLAME' && up.flame) || (keepForm === 'TESLA' && up.tesla) || (keepForm === 'RAIL' && up.rail)) player.form = keepForm;
  else player.form = 'MINI';
  refillLoads();
  queue = [];
  Object.keys(def.comp).forEach(k => { for (let j = 0; j < def.comp[k]; j++) queue.push(k); });
  for (let j = queue.length - 1; j > 0; j--) { const t = Math.floor(Math.random() * (j + 1));[queue[j], queue[t]] = [queue[t], queue[j]]; }
  spawnT = 1.5; time = 0; shake = 0;
  cam.x = player.x; cam.y = player.y; // snap camera đầu màn (giữ zoom)
  spawnFoe('N'); spawnFoe('N');
  levelTotal = queue.length + foes.length; endlessT = 0; // tổng địch màn (cho enrage + endless)
  updateHUD(); refreshSlots();
  log('Màn ' + (i + 1) + ' ' + def.name + ': base ' + def.baseHP + 'hp, địch ' + queue.length + '+2 con.');
}
function checkEnrage() { // base <50%hp mà địch còn >25% tổng (màn 8+): burst 2 medic + 1 shield, buff medic/shield
  if (!base || base.hp <= 0 || base.enraged || level < ENRAGE.lvl) return;
  if (base.hp >= base.max * ENRAGE.hpFrac) return;
  if ((foes.length + queue.length) <= levelTotal * ENRAGE.foeFrac) return;
  base.enraged = true;
  spawnFoe('M'); spawnFoe('M'); spawnFoe('H');
  addFloat(base.x, base.y - 34, 'BASE ENRAGE!', '#ff6b6b');
  log('🔥 Base địch enrage: +2 medic +1 shield, medic/shield nạp ×0.1, heal/khiên ×4!');
  beep(220, 0.4, 'sawtooth', 0.13);
  updateHUD();
}
function tickEndless(dt) { // endless: hết sạch địch ban đầu -> mỗi 3s đẻ ngẫu nhiên 1 tank (vô hạn)
  if (level < LEVELS.length || !base || base.hp <= 0) return;
  if (queue.length > 0 || foes.length > 0) { endlessT = 0; return; }
  endlessT += dt;
  if (endlessT >= ENDLESS_RESPAWN) {
    endlessT = 0;
    const def = lvlDef(level), bag = [];
    for (const k of Object.keys(def.comp)) for (let j = 0; j < def.comp[k]; j++) bag.push(k);
    if (!bag.length) return;
    if (spawnFoe(bag[Math.floor(Math.random() * bag.length)])) {
      log('🌀 Endless: base đẻ thêm 1 tank!');
      updateHUD();
    } else endlessT = ENDLESS_RESPAWN - 1; // kẹt cửa -> thử lại sau 1s
  }
}
function spawnFoe(kind) { // đẻ từ base xanh
  const mk = (x, y) => {
    foes.push(Foe.create(kind, x, y));
    beep(150, 0.12, 'sawtooth', 0.06); updateHUD();
  };
  const opts = [{ c: base.c - 1, r: base.r + 1 }, { c: base.c + 1, r: base.r + 1 }, { c: base.c, r: base.r + 2 }];
  for (const o of opts) {
    if (!tileWalk(o.c, o.r)) continue;
    const x = o.c * TILE + TILE / 2, y = o.r * TILE + TILE / 2;
    if (foes.some(f => Math.hypot(f.x - x, f.y - y) < 36)) continue;
    if (Math.hypot(player.x - x, player.y - y) < 120) continue;
    mk(x, y); return true;
  }
  for (let t = 0; t < 16; t++) { // cửa base kẹt -> đẻ bừa nửa trên map
    const c = 1 + Math.floor(Math.random() * (COLS - 2)), r = 1 + Math.floor(Math.random() * 6);
    if (!tileWalk(c, r)) continue;
    const x = c * TILE + TILE / 2, y = r * TILE + TILE / 2;
    if (foes.some(f => Math.hypot(f.x - x, f.y - y) < 40)) continue;
    if (Math.hypot(player.x - x, player.y - y) < 160) continue;
    mk(x, y); return true;
  }
  return false;
}
function levelClear() {
  const def = lvlDef(level);
  gold += def.bonus; score += 200;
  explode(base.x, base.y, 40); updateHUD();
  let unlock = '';
  if (level === UNLOCK_LEVEL.clay && !up.clay) { up.clay = true; ammo.clay.stock++; ammo.clay.load = 1; unlock += ' 🔓 MỞ KHÓA ' + UNLOCK_NAME.clay + '!'; }
  if (level === UNLOCK_LEVEL.flame && !up.flame) { up.flame = true; ammo.flame.tanks++; ammo.flame.fuel = FLAME_TANK; unlock += ' 🔓 MỞ KHÓA ' + UNLOCK_NAME.flame + '!'; }
  if (level === UNLOCK_LEVEL.tesla && !up.tesla) { up.tesla = true; ammo.rail.stock += RAIL_BAT; ammo.tesla.charge = RAIL_BAT; unlock += ' 🔓 MỞ KHÓA ' + UNLOCK_NAME.tesla + '!'; }
  if (level === UNLOCK_LEVEL.rail && !up.rail) { up.rail = true; ammo.rail.stock += RAIL_BAT; ammo.rail.charge = RAIL_BAT; unlock += ' 🔓 MỞ KHÓA ' + UNLOCK_NAME.rail + '!'; }
  log('Phá base màn ' + (level + 1) + '! +' + def.bonus + ' vàng.' + unlock);
  beep(660, 0.2, 'square', 0.1); setTimeout(() => beep(880, 0.25, 'square', 0.1), 180);
  refreshSlots();
  openShop(true, unlock);
}
function gameOver() {
  state = 'dead';
  $('ovTitle').textContent = '💥 TANK ĐỎ NÁT RỒI (màn ' + (level + 1) + ')';
  $('ovText').innerHTML = `Điểm <b>${score}</b> • hạ <b>${kills}</b> tank • vàng <b>${gold}</b> + upgrade + đạn giữ nguyên.<br><kbd>R</kbd> chơi lại màn này`;
  $('overlay').classList.remove('hidden'); $('btnStart').textContent = '↻ Chơi lại màn';
}
function retryLevel() { startLevel(level); state = 'play'; hideAll(); } // giữ upgrade + đạn
function startGame() { resetAll(); startLevel(0); state = 'play'; hideAll(); beep(440, 0.1); }

// ================= weapons.js — vũ khí player + đạn địch =================
// ---- derived stats ----
function misCount() { return !up.multi ? 1 : (2 + up.cnt); }
function misDmg() { return MIS_COUNT_DMG[misCount()] * MIS_DMG_MUL[up.dmg]; }
function misRate() {
  if (oldMissileLvl === level) return MIS_FIRERATE[8] * FRATE_MULT[up.frate]; // cheat oldmissile: max 0.07 trong 1 màn
  return MIS_FIRERATE[Math.min(up.rel, MIS_REL_MAX)] * FRATE_MULT[up.frate];
}
function miniMag() { return MINI_MAG[up.mag || 0] || MINI.load; }
function miniRate() { return (RAPID_RATE[up.rapid || 0] || MINI.rate) * FRATE_MULT[up.frate]; }
function teslaChainLimit() { return TESLA.chainBase + (up.high || 0); } // 2/3/4/5
function teslaFalloff() { return TESLA_FALL[up.malcond || 0]; }
function railDmg() { return 1 * RAIL_MUL[up.charge]; }
function railRate() { return LASER_RELOAD * FRATE_MULT[up.frate]; }
function relMul() { return RELOAD_MULT[up.rld]; }
function playerMaxHp() { let s = 0; for (const v of PLAYER_HPB[up.hp]) s += v; return Math.round(s * 100) / 100; }
function capMis() { return STOR.mis[up.stor]; }
function capClay() { return STOR.clay[up.stor]; }
function capGas() { return STOR.gas[up.stor]; }
function capBatU() { return STOR.bat[up.stor] * RAIL_BAT; } // rail tính bằng đơn vị ⚡
function addStock(kind, n) { // nạp kho có kẹp trần
  const A = ammo;
  if (kind === 'mis') A.mis.stock = Math.min(capMis(), A.mis.stock + n);
  if (kind === 'clay') A.clay.stock = Math.min(capClay(), A.clay.stock + n);
  if (kind === 'gas') A.flame.tanks = Math.min(capGas(), A.flame.tanks + n);
  if (kind === 'bat') A.rail.stock = Math.min(capBatU(), A.rail.stock + n);
}
function refillLoads() { // đầu màn: nạp đầy load từ stock (free)
  const A = ammo;
  if (A.mis.load < MIS_LOAD && A.mis.stock > 0) { const t = Math.min(MIS_LOAD - A.mis.load, A.mis.stock); A.mis.load += t; A.mis.stock -= t; }
  if (A.mini.load < miniMag() && A.mis.stock > 0) { const need = miniMag() - A.mini.load, take = Math.min(Math.ceil(need / MINI_PER_MIS), Math.floor(A.mis.stock)); A.mini.load += Math.min(need, take * MINI_PER_MIS); A.mis.stock -= take; }
  if (A.clay.load < 1 && A.clay.stock > 0) { A.clay.stock--; A.clay.load = 1; }
  if (A.flame.fuel <= 0 && A.flame.tanks > 0) { A.flame.tanks--; A.flame.fuel = FLAME_TANK; }
  if (A.rail.charge < RAIL_BAT && A.rail.stock > 0) { const t = Math.min(RAIL_BAT - A.rail.charge, A.rail.stock); A.rail.charge += t; A.rail.stock -= t; }
  if (A.tesla.charge < RAIL_BAT && A.rail.stock > 0) { const t = Math.min(RAIL_BAT - A.tesla.charge, A.rail.stock); A.tesla.charge += t; A.rail.stock -= t; }
}
function dryHint(txt) {
  if (player.dryT > 0) return; player.dryT = 1.2;
  beep(150, 0.1); log(txt + ' — mua/nhặt thêm, mở shop [T].');
}

// ---- player fire ----
function firePress() {
  if (!player.alive) return;
  if (player.form === 'MINI') fireMinigun();
  else if (player.form === 'MIS') fireMissiles();
  else if (player.form === 'CLAY') placeClaymore();
  else if (player.form === 'TESLA') fireTesla();
  else if (player.form === 'RAIL') fireLaser(player.x, player.y, player.ang, false);
}
function startReload(k) {
  const A = ammo, m = relMul();
  if (k === 'mis' && A.mis.rel <= 0 && A.mis.stock > 0) A.mis.rel = MIS_RELOAD * m;
  if (k === 'mini' && A.mini.rel <= 0 && A.mis.stock > 0) A.mini.rel = MINI.reload * m;
  if (k === 'clay' && A.clay.rel <= 0 && A.clay.stock > 0) A.clay.rel = CLAY_RELOAD * m;
  if (k === 'flame' && A.flame.rel <= 0 && A.flame.tanks > 0) A.flame.rel = FLAME_RELOAD * m;
  if (k === 'rail' && A.rail.rel <= 0 && A.rail.stock > 0) A.rail.rel = RAIL_RELOAD * m;
  if (k === 'tesla' && A.tesla.rel <= 0 && A.rail.stock > 0) A.tesla.rel = TESLA.reload * m;
}
function tickReloads(dt) { // nạp đạn tự động, kẹp rel về 0
  const A = ammo;
  let dirty = false;
  if (A.mis.rel > 0) { A.mis.rel -= dt; if (A.mis.rel <= 0) { A.mis.rel = 0; const t = Math.min(MIS_LOAD, A.mis.stock); A.mis.load += t; A.mis.stock -= t; dirty = true; } }
  if (A.mini.rel > 0) { A.mini.rel -= dt; if (A.mini.rel <= 0) { A.mini.rel = 0; const need = miniMag() - A.mini.load, take = Math.min(Math.ceil(need / MINI_PER_MIS), Math.floor(A.mis.stock)); A.mini.load += Math.min(need, take * MINI_PER_MIS); A.mis.stock -= take; dirty = true; } }
  if (A.clay.rel > 0) { A.clay.rel -= dt; if (A.clay.rel <= 0) { A.clay.rel = 0; if (A.clay.stock > 0) { A.clay.stock--; A.clay.load = 1; dirty = true; } } }
  if (A.flame.rel > 0) { A.flame.rel -= dt; if (A.flame.rel <= 0) { A.flame.rel = 0; if (A.flame.tanks > 0) { A.flame.tanks--; A.flame.fuel = FLAME_TANK; dirty = true; } } }
  if (A.rail.rel > 0) { A.rail.rel -= dt; if (A.rail.rel <= 0) { A.rail.rel = 0; const t = Math.min(RAIL_BAT - A.rail.charge, A.rail.stock); A.rail.charge += t; A.rail.stock -= t; dirty = true; } }
  if (A.tesla.rel > 0) { A.tesla.rel -= dt; if (A.tesla.rel <= 0) { A.tesla.rel = 0; const t = Math.min(RAIL_BAT - A.tesla.charge, A.rail.stock); A.tesla.charge += t; A.rail.stock -= t; dirty = true; } }
  if (dirty) updateHUD();
}
function fireMissiles() {
  const A = ammo.mis;
  if (player.cd > 0 || A.rel > 0) return;
  if (A.load <= 0) { startReload('mis'); if (A.stock <= 0) dryHint('Hết đạn missile!'); return; }
  player.cd = misRate();
  A.load--; // 1 đạn/phát dù multimissile
  if (A.load <= 0) startReload('mis');
  const n = misCount(), a = player.ang, dmg = misDmg();
  const sprKind = n >= 3 ? 'bSmall' : 'bMis';
  for (let i = 0; i < n; i++) {
    const off = n === 1 ? 0 : (i / (n - 1) - 0.5) * 0.28;
    const ang = a + off;
    bullets.push({ kind: 'mis', img: sprKind, x: player.x + Math.sin(ang) * 20, y: player.y - Math.cos(ang) * 20,
      vx: Math.sin(ang) * MIS_PX, vy: -Math.cos(ang) * MIS_PX, ang, speed: MIS_PX, dmg,
      chasing: false, life: 6, foe: false, size: n >= 3 ? 10 : 14 });
  }
  beep(700, 0.07, 'square', 0.08); updateHUD();
}
// Claymore cơ chế (không upgrade dmg): nón Clairvoyance + tầm Psionic.
function clayHalf() { return (CLAIR_DEG[up.clair] / 2) * Math.PI / 180; }
function clayRange() { return CLAY.range + up.psi * TILE; }
function placeClaymore() {
  const A = ammo.clay;  if (A.rel > 0) return;
  if (A.load <= 0) { startReload('clay'); if (A.stock <= 0) dryHint('Hết claymore!'); return; }
  if (claymores.length >= CLAY.max) { beep(180, 0.07); log('Tối đa ' + CLAY.max + ' claymore.'); return; }
  player.clayCd = 0.5 * FRATE_MULT[up.frate];
  A.load--;
  if (A.load <= 0) startReload('clay');
  const a = player.ang;
  claymores.push({ x: player.x + Math.sin(a) * 26, y: player.y - Math.cos(a) * 26, ang: a, t: 0 });
  beep(400, 0.1, 'square', 0.08); updateHUD();
}
// Minigun: hitscan 1 đường thẳng, ray vàng 1px, chặn bởi crate/tường, không xuyên mặc định.
function fireMinigun() {
  const A = ammo.mini;
  if (player.cd > 0 || A.rel > 0) return;
  if (A.load <= 0) { startReload('mini'); if (ammo.mis.stock <= 0) dryHint('Hết đạn minigun (chung missile)!'); return; }
  player.cd = miniRate();
  A.load--;
  if (A.load <= 0) startReload('mini');
  player.miniHold = (player.miniHold || 0) + player.cd; // tích giờ xả liên tục (xấp xỉ)
  player.miniGap = 0;
  const a = player.ang, dx = Math.sin(a), dy = -Math.cos(a);
  const pierceRoll = Math.random() < (CALIBER_PIERCE[up.caliber || 0] || 0);
  let hitD = 2600;
  if (!pierceRoll) {
    for (let d = 20; d < 2600; d += 8) {
      const px = player.x + dx * d, py = player.y + dy * d;
      if (px < 0 || py < 0 || px > W || py > H) { hitD = d; break; }
      const { c, r } = cellAt(px, py);
      if (inMap(c, r) && map[r][c] === 'B') { hitD = d - 8; break; }
      if (crates.some(k => px > k.c * TILE && px < (k.c + 1) * TILE && py > k.r * TILE && py < (k.r + 1) * TILE)) { hitD = d - 8; break; }
    }
  }
  const dmgAt = (px, py) => Math.abs((px - player.x) * dy - (py - player.y) * dx) < 13 && ((px - player.x) * dx + (py - player.y) * dy) > 0 && ((px - player.x) * dx + (py - player.y) * dy) < hitD;
  // viên gần nhất trên đường thẳng (không xuyên tank mặc định, trừ khi pierce)
  const tg = foes.concat(drones).filter(f => dmgAt(f.x, f.y))
    .sort((p, q) => Math.hypot(p.x - player.x, p.y - player.y) - Math.hypot(q.x - player.x, q.y - player.y));
  const targets = pierceRoll ? tg : tg.slice(0, 1);
  // visual: chỉ xuyên tank khi logic xuyên; nếu không thì ray dừng ngay tại tank đầu tiên
  let visD = hitD;
  if (!pierceRoll && targets.length) {
    const f0 = targets[0];
    visD = Math.min(hitD, (f0.x - player.x) * dx + (f0.y - player.y) * dy);
  }
  beams.push({ x1: player.x + dx * 20, y1: player.y + dy * 20, x2: player.x + dx * visD, y2: player.y + dy * visD, t: 0, life: 0.12, mini: true });
  beep(950, 0.04, 'square', 0.05);
  const ignitOn = (up.ignit || 0) > 0 && (player.miniHold || 0) >= IGNIT_TIME[up.ignit];
  const dbl = Math.random() < (RAPID_CHANCE[up.rapid || 0] || 0); // Rapid Fire: double dmg
  const baseDmg = (MINI.dmg + (ignitOn ? IGNIT_DMG[up.ignit] : 0)) * (dbl ? 2 : 1);
  for (const f of targets) {
    const dmg = baseDmg;
    damageFoe(f, dmg, pierceRoll ? 'pierce' : 'block');
    if (dbl && f.hp > 0) addFloat(f.x, f.y - 30, 'x2!', '#ffe45e');
    if (ignitOn && f.hp > 0) { // 1 stack burn (kẹp INotFlammable còn 1)
      f.burn = f.burn || { stacks: 0, dur: 0, tick: 0 };
      const cap = f.notFlammable ? 1 : BURN.max;
      if (f.burn.stacks <= 0) { f.burn.stacks = 1; f.burn.dur = burnDur(); f.burn.tick = burnInterval(1); }
      else { f.burn.stacks = Math.min(cap, f.burn.stacks + 1); f.burn.dur = burnDur(); }
    }
    explode(f.x, f.y, 4, ['#ffe45e', '#fff']);
  }
  // trúng crate trên đường (50%? không — minigun gây full lên crate nhưng chặn)
  if (!pierceRoll) {
    for (let i = crates.length - 1; i >= 0; i--) {
      const k = crates[i];
      if (dmgAt(k.c * TILE + 16, k.r * TILE + 16)) {
        deplete(k, Math.min(baseDmg, blockRemain(k))); k.hit = 1; explode(k.c * TILE + 16, k.r * TILE + 16, 4);
        if (k.hp <= 0) { const idx = crates.indexOf(k); if (idx >= 0) breakCrate(idx); }
        break;
      }
    }
    if (dmgAt(base.x, base.y)) hurtBase(baseDmg);
  } else {
    for (let i = crates.length - 1; i >= 0; i--) {
      const k = crates[i];
      if (dmgAt(k.c * TILE + 16, k.r * TILE + 16)) {
        deplete(k, baseDmg); k.hit = 1;
        if (k.hp <= 0) { const idx = crates.indexOf(k); if (idx >= 0) breakCrate(idx); }
      }
    }
    if (dmgAt(base.x, base.y)) hurtBase(baseDmg, 'pierce');
  }
  updateHUD();
}
// Tesla: chain sét, tầm 5 tile, 5⚡/tase, tick liên tục, chain trong 3 ô.
function fireTesla() {
  const A = ammo.tesla;
  if (player.teslaCd > 0 || A.rel > 0) return;
  if (A.charge < TESLA.cost) { startReload('tesla'); if (ammo.rail.stock <= 0) dryHint('Hết pin tesla (chung railgun)!'); return; }
  player.teslaCd = TESLA.tick; // không firerate upgrade
  A.charge -= TESLA.cost;
  if (A.charge <= 0) startReload('tesla');
  const allF = foes.concat(drones);
  // nạn nhân đầu: gần nhất trong tầm 5 tile (bất kể hướng — tesla tự tìm)
  let first = null, bd = TESLA.range;
  for (const f of allF) { const d = Math.hypot(f.x - player.x, f.y - player.y); if (d < bd) { bd = d; first = f; } }
  if (!first) { beep(180, 0.05, 'sawtooth', 0.04); updateHUD(); return; }
  const chainN = teslaChainLimit(), fall = teslaFalloff();
  const chained = [first];
  let cur = first;
  for (let i = 1; i < chainN; i++) {
    let best = null, bdd = TESLA.chainR;
    for (const f of allF) {
      if (chained.includes(f)) continue;
      const d = Math.hypot(f.x - cur.x, f.y - cur.y);
      if (d < bdd) { bdd = d; best = f; }
    }
    if (!best) break;
    chained.push(best); cur = best;
  }
  const pts = [{ x: player.x, y: player.y }];
  chained.forEach((f, i) => {
    const mult = Math.max(0.1, 1 - fall * i);
    const dmg = TESLA.dmg * mult;
    const before = f.hp;
    damageFoe(f, dmg, 'block');
    pts.push({ x: f.x, y: f.y });
    explode(f.x, f.y, 6, ['#7df9ff', '#fff', '#c9a7ff']);
    teslaHitReact(f, dmg, before);
    if (f.hp <= 0) maybeDropBall(f.x, f.y);
  });
  beams.push({ pts, t: 0, life: 0.18, tesla: true });
  beep(1400, 0.08, 'sawtooth', 0.07); shake = Math.min(10, shake + 1);
  updateHUD();
}
function teslaHitReact(f, dmg, before) {
  // Shielder bị tesla/sét hòn giật -> 0.2s sau khiên all đồng minh (trừ base)
  if (f.kind === 'H' && foes.includes(f)) {
    shieldReact.push({ t: 0.2 });
    addFloat(f.x, f.y - 26, 'NHIỄM ĐIỆN!', '#7df9ff');
  }
}
function maybeDropBall(x, y) {
  const lvl = up.ball || 0;
  if (lvl <= 0) return;
  if (Math.random() < BALL.chance[lvl]) {
    balls.push({ x, y, t: 0, dur: BALL.dur[lvl], r: BALL.radius[lvl], max: BALL.max[lvl], tick: BALL.tick[lvl], cd: 0 });
    addFloat(x, y - 18, 'SÉT HÒN!', '#c9a7ff');
  }
}
function fireLaser(x, y, ang, foe) {
  if (!foe) {
    const A = ammo.rail;
    if (player.laserCd > 0 || A.rel > 0) return;
    if (A.charge < RAIL_COST) { startReload('rail'); if (A.stock <= 0) dryHint('Hết pin!'); return; }
    player.laserCd = railRate();
    A.charge -= RAIL_COST;
  }
  const dx = Math.sin(ang), dy = -Math.cos(ang);
  const pierce = RAIL_PIERCE[up.pierce];
  let hitD = 2600;
  for (let d = 20; d < 2600; d += 8) {
    const px = x + dx * d, py = y + dy * d;
    if (px < 0 || py < 0 || px > W || py > H) { hitD = d; break; }
    const { c, r } = cellAt(px, py);
    if (inMap(c, r) && map[r][c] === 'B') {
      if (!foe && Math.random() < pierce) continue; // xuyên, KHÔNG phá tường
      hitD = d - 8; break;
    }
  }
  beams.push({ x1: x + dx * 20, y1: y + dy * 20, x2: x + dx * hitD, y2: y + dy * hitD, t: 0, life: 0.3 });
  beep(1200, 0.22, 'sawtooth', 0.11); shake = Math.min(10, shake + 3);
  const dmg = railDmg();
  const dmgAt = (px, py) => Math.abs((px - x) * dy - (py - y) * dx) < 16 && ((px - x) * dx + (py - y) * dy) > 0 && ((px - x) * dx + (py - y) * dy) < hitD;
  let hit = 0;
  const allF = foes.concat(drones);
  for (let i = allF.length - 1; i >= 0; i--) {
    const f = allF[i];
    if (dmgAt(f.x, f.y)) { damageFoe(f, dmg, up.bpierce ? 'pierce' : 'block'); hit++; explode(f.x, f.y, 10, ['#7df9ff', '#fff', '#ffd75e']); }
  }
  for (let i = crates.length - 1; i >= 0; i--) {
    const k = crates[i];
    if (dmgAt(k.c * TILE + TILE / 2, k.r * TILE + TILE / 2)) {
      // railgun lên static obstacle chỉ nhận 50% (trả one-shot base cho maxed railgun)
      const half = dmg * 0.5;
      deplete(k, up.bpierce ? half : Math.min(half, blockRemain(k)));
      explode(k.c * TILE + 16, k.r * TILE + 16, 8);
      if (k.hp <= 0) { crates.splice(i, 1); score += 10; }
    }
  }
  if (dmgAt(base.x, base.y)) hurtBase(dmg * 0.5, up.bpierce ? 'pierce' : 'block');
  if (hit > 1) log('lazer xuyên ' + hit + ' mục tiêu');
  updateHUD();
}
function spewFlame() {
  const a = player.ang;
  // pi = z-order: particle1 z=n ... particle5 z=n-4 (p1 vẽ trên cùng)
  FLAME.parts.forEach((pt, idx) => {
    const off = rnd(-1, 1) * pt.spr * Math.PI; // xòe theo % trong md
    const ang = a + off, sp = pt.dist / FLAME.life;
    flames.push({ img: pt.img, pi: idx + 1, cold: player.cold,
      x: player.x + Math.sin(a) * 18, y: player.y - Math.cos(a) * 18,
      vx: Math.sin(ang) * sp, vy: -Math.cos(ang) * sp, ang, life: FLAME.life });
  });
  beep(rnd(180, 240), 0.05, 'sawtooth', 0.04);
}

// ---- đạn địch ----
function foeShoot(f) {
  const aim = Math.atan2(player.x - f.x, -(player.y - f.y));
  const mk = (ang, sp, dmg) => ({ kind: 'norm', img: 'bNorm', x: f.x + Math.sin(ang) * 18, y: f.y - Math.cos(ang) * 18,
    vx: Math.sin(ang) * sp, vy: -Math.cos(ang) * sp, ang, foe: true, life: 6, dmg, size: 11 });
  if (f.kind === 'E') { // elite: burst 2 phát liên tiếp, tốc 3x
    const a = aim + rnd(-FOE_SPREAD, FOE_SPREAD);
    bullets.push(mk(a, FOE_BULLET * TWIN_MULT, 1));
    f.burst = 1; f.burstT = 0.25;
    f.cd = FOE_CD.E + rnd(0, 1);
  } else if (f.kind === 'T') { // twinbarrel: 2 đạn song song, angle=0, nhanh ×3
    const px = Math.cos(aim), py = Math.sin(aim);
    for (const s of [-1, 1]) {
      const b = mk(aim, FOE_BULLET * TWIN_MULT, TWIN_DMG); b.x += px * 7 * s; b.y += py * 7 * s; bullets.push(b);
    }
    f.cd = FOE_CD.T + rnd(0, 0.8);
  } else if (f.kind === 'S') { // shotgun: 4 đạn 125°, mỗi 3 loạt cường hóa 7 đạn 135°
    f.volley++;
    const emp = (f.volley % 3 === 0);
    const n = emp ? 7 : 4, tot = (emp ? 135 : 125) * Math.PI / 180, dmg = emp ? EMP_DMG : SHOT_DMG;
    for (let i = 0; i < n; i++) {
      const a = aim + (n === 1 ? 0 : (i / (n - 1) - 0.5) * tot) + rnd(-0.03, 0.03);
      bullets.push(mk(a, FOE_BULLET * 0.8, dmg));
    }
    if (emp) addFloat(f.x, f.y - 22, 'CƯỜNG HÓA!', '#ff6b6b');
    f.cd = FOE_CD.S + rnd(0, 1);
  } else { // N, F, W bắn thường
    const a = aim + rnd(-FOE_SPREAD, FOE_SPREAD);
    bullets.push(mk(a, FOE_BULLET, 1));
    f.cd = (FOE_CD[f.kind] || FOE_CD.N) + rnd(0, 1);
  }
  beep(200, 0.06, 'sawtooth', 0.05);
}
// Railgun địch: hitscan xuyên địa hình 100%. Elite (V): dmg ×2 + xuyên block player.
function foeRailFire(f) {
  const elite = f.kind === 'V';
  const dx = Math.sin(f.ang), dy = -Math.cos(f.ang);
  let hitD = 2600; // range vô hạn như lazer player
  for (let d = 20; d < 2600; d += 8) {
    const px = f.x + dx * d, py = f.y + dy * d;
    if (px < 0 || py < 0 || px > W || py > H) { hitD = d; break; }
  }
  beams.push({ x1: f.x + dx * 18, y1: f.y + dy * 18, x2: f.x + dx * hitD, y2: f.y + dy * hitD,
    t: 0, life: 0.4, thermal: true, wide: elite });
  beep(300, 0.3, 'sawtooth', 0.12); shake = Math.min(10, shake + 4);
  const dmgAt = (px, py) => Math.abs((px - f.x) * dy - (py - f.y) * dx) < 12 && ((px - f.x) * dx + (py - f.y) * dy) > 0 && ((px - f.x) * dx + (py - f.y) * dy) < hitD;
  if (player.alive && dmgAt(player.x, player.y)) { hurtPlayer(FOE_RAIL.dmg * (elite ? 2 : 1), elite); explode(player.x, player.y, 12); }
  f.cd = FOE_RAIL.cd;
}
function nearBasePlayer() { // player trong 5 tiles gần base
  if (!player || !player.alive || !base || base.hp <= 0) return false;
  return Math.hypot(player.x - base.x, player.y - base.y) < TILE * 5;
}
function fireHealOrb(f, target) { // medic: đạn hồi máu homing 15 tile/s (base focus + 25% nạp)
  const a = Math.atan2(target.x - f.x, -(target.y - f.y));
  const isBase = target === base;
  bullets.push({ kind: 'heal', img: 'bNorm', tint: 'hue-rotate(90deg)', x: f.x + Math.sin(a) * 18, y: f.y - Math.cos(a) * 18,
    vx: Math.sin(a) * MEDIC.orbSpeed, vy: -Math.cos(a) * MEDIC.orbSpeed, ang: a, foe: false, healer: true, target, isBase, life: 6, size: 12 });
  const mult = (isBase && nearBasePlayer()) ? 0.25 : 1;
  f.cd = (MEDIC.cd + rnd(0, 1)) * mult; beep(520, 0.1, 'sine', 0.07);
}
function fireShieldOrb(f, target) { // shielder: orb khiên homing (base focus + 25% nạp)
  const a = Math.atan2(target.x - f.x, -(target.y - f.y));
  const isBase = target === base;
  bullets.push({ kind: 'shield', img: 'bNorm', tint: 'hue-rotate(200deg) saturate(2)', x: f.x + Math.sin(a) * 18, y: f.y - Math.cos(a) * 18,
    vx: Math.sin(a) * TILE * 3.5, vy: -Math.cos(a) * TILE * 3.5, ang: a, foe: false, healer: true, target, isBase, life: 7, size: 13 });
  const mult = (isBase && nearBasePlayer()) ? 0.25 : 1;
  f.cd = (SHIELD.cd + rnd(0, 1)) * mult; beep(440, 0.1, 'sine', 0.07);
}
function callStrike(f) { // caller: không kích 5 ô quanh player, cảnh báo 1.5s
  const pc = cellAt(player.x, player.y);
  const cells = [{ c: pc.c, r: pc.r }];
  for (let t = 0; t < 20 && cells.length < AIR.tiles; t++) {
    const c = pc.c + Math.floor(rnd(-2, 3)), r = pc.r + Math.floor(rnd(-2, 3));
    if (!inMap(c, r) || map[r][c] === 'B') continue;
    if (cells.some(k => k.c === c && k.r === r)) continue;
    cells.push({ c, r });
  }
  warnings.push({ cells, t: AIR.warn, total: AIR.warn });
  addFloat(f.x, f.y - 22, 'KHÔNG KÍCH!', '#ff6b6b');
  beep(240, 0.3, 'sawtooth', 0.1);
  f.cd = AIR.cd + rnd(0, 2);
}

// ================= main.js — input, update, draw, loop =================
const FOE_IMG = { N: 'grn', E: 'grnE', T: 'foeT', S: 'foeS', W: 'foeW', C: 'foeC',
  F: 'foeF', M: 'foeM', G: 'foeG', H: 'foeH', V: 'foeV', R: 'foeR' };
const FOE_TAG = { N: '', E: 'ELITE', T: 'TWIN', S: 'SHOTGUN', W: 'WEAVER', C: 'CALLER',
  F: 'F.RESIST', M: 'MEDIC', G: 'RAILGUN', H: 'SHIELD', V: 'RAILGUN+', R: 'MISSILE' };
const PICK_IMG = { medbox: 'med', gold: 'gold', a_mis: 'ammMis', a_clay: 'ammClay', a_gas: 'ammGas', a_bat: 'ammBat' };

// ---------- input ----------
const keys = {};
const cheatBuf = [];
function feedCheatKey(k) { // cheat ẩn: "vjp67" +3667 vàng; "noob69" 9999999dmg base; "oldmissile" max firerate 1 màn
  cheatBuf.push(k); if (cheatBuf.length > 12) cheatBuf.shift();
  const s = cheatBuf.join('');
  if (s.endsWith('vjp67') && typeof gold === 'number') {
    cheatBuf.length = 0;
    gold += 3667;
    updateHUD(); if (state === 'shop') refreshShop();
    return true;
  }
  if (s.endsWith('noob69') && state === 'play' && base && base.hp > 0) {
    cheatBuf.length = 0;
    base.shield = 0; base.saved = true; // cheat xuyên qua khiên cứu base
    hurtBase(9999999, true);
    return true;
  }
  if (s.endsWith('oldmissile') && state === 'play') {
    cheatBuf.length = 0;
    oldMissileLvl = level;
    log('⚡ Cheat oldmissile: missile đạt tốc bắn max 0.07s trong màn ' + (level + 1) + '!');
    beep(880, 0.15, 'square', 0.1);
    return true;
  }
  return false;
}
function onKeyDown(e) {
  const k = (e.key || '').toLowerCase();
  keys[k] = true;
  feedCheatKey(k);
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  if (state !== 'play') {
    if (k === 'r') retryLevel();
    if (k === 't' && state === 'shop') closeShop();
    if (k === 'p' && state === 'pause') { state = 'play'; hideAll(); }
    return;
  }
  if (k === '1') { player.form = 'MINI'; refreshSlots(); beep(500, 0.06); }
  if (k === '2') { player.form = 'MIS'; refreshSlots(); beep(500, 0.06); }
  if (k === '3') { if (up.clay) { player.form = 'CLAY'; refreshSlots(); beep(500, 0.06); } else { beep(160, 0.1); log('Claymore khóa — phá màn ' + (UNLOCK_LEVEL.clay + 1) + ' (Elite) để mở.'); } }
  if (k === '4') { if (up.flame) { player.form = 'FLAME'; refreshSlots(); beep(500, 0.06); } else { beep(160, 0.1); log('Flame khóa — phá màn ' + (UNLOCK_LEVEL.flame + 1) + ' để mở.'); } }
  if (k === '5') { if (up.tesla) { player.form = 'TESLA'; refreshSlots(); beep(900, 0.1); } else { beep(160, 0.1); log('Tesla khóa — phá màn ' + (UNLOCK_LEVEL.tesla + 1) + ' để mở.'); } }
  if (k === '6') { if (up.rail) { player.form = 'RAIL'; refreshSlots(); beep(900, 0.1); } else { beep(160, 0.1); log('Lazer khóa — phá màn ' + (UNLOCK_LEVEL.rail + 1) + ' (Railgun) để mở.'); } }
  if (k === ' ' || k === 'k') firePress();
  if (k === 'f') {
    if (player.form !== 'FLAME') log('Vào dạng flamethrower [3] rồi mới bật/tắt ColdFlame [F].');
    else if (!up.cold) { beep(160, 0.1); log('ColdFlame chưa mua — mở shop [T].'); }
    else {
      player.cold = !player.cold; beep(player.cold ? 300 : 520, 0.09);
      log(player.cold ? '❄ ColdFlame ON — frost thay burn' : '🔥 Hot flame — burn trở lại'); refreshSlots();
    }
  }
  if (k === 't') openShop(false);
  if (k === 'z') cycleZoom(); // Z đổi nấc zoom
  if (k === 'h') toggleHelp(); // H ẩn/hiện hướng dẫn
  if (k === 'p') { state = 'pause'; showPause(); }
  else if (k === 'r') retryLevel();
}
addEventListener('keydown', onKeyDown, true); // capture: chạy trước mọi thứ, IME không nuốt được
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

// ---------- camera 16x9 + zoom + fullscreen ----------
function viewScale() { // px world -> px màn hình, 32x18 tile vừa khít × zoom
  return Math.max(cv.width / (32 * TILE), cv.height / (18 * TILE)) * cam.zoom;
}
function adjustZoom(f) {
  cam.zoom = Math.max(0.5, Math.min(2.5, cam.zoom * f));
  updateHUD();
}
function cycleZoom() { // Z đổi nấc 1x/1.5x/2x
  cam.zidx = (cam.zidx + 1) % ZOOMS.length;
  cam.zoom = ZOOMS[cam.zidx];
  log('🔍 Zoom ' + Math.round(cam.zoom * 100) + '%');
  updateHUD();
}
function updateCamera(dt) {
  const s = viewScale();
  const vw = cv.width / s, vh = cv.height / s; // khung nhìn (world px)
  let tx = player.x, ty = player.y;
  tx = vw >= W ? W / 2 : Math.max(vw / 2, Math.min(W - vw / 2, tx));
  ty = vh >= H ? H / 2 : Math.max(vh / 2, Math.min(H - vh / 2, ty));
  const k = Math.min(1, dt * 5); // bám mượt
  cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
}
function screenToWorld(sx, sy) { // touch/chuột (client px) -> world px
  const r = cv.getBoundingClientRect(), s = viewScale();
  const bx = (sx - r.left) * (cv.width / r.width), by = (sy - r.top) * (cv.height / r.height);
  return { x: cam.x + (bx - cv.width / 2) / s, y: cam.y + (by - cv.height / 2) / s };
}
function fitCanvas() { // wrap fullscreen -> canvas bằng viewport
  const r = $('wrap').getBoundingClientRect();
  cv.width = Math.max(320, Math.floor(r.width));
  cv.height = Math.max(240, Math.floor(r.height));
}
addEventListener('resize', fitCanvas);
cv.addEventListener('wheel', e => { // lăn chuột zoom
  e.preventDefault();
  adjustZoom(e.deltaY > 0 ? 1 / 1.15 : 1.15);
}, { passive: false });
// touch: 1 ngón chạy tới điểm chạm, 2 ngón bắn (tọa độ đã qua camera)
let touchMove = null, touchFire = false;
cv.addEventListener('touchstart', e => {
  e.preventDefault();
  const t = [...e.touches];
  if (t.length >= 2) touchFire = true;
  else { const w = screenToWorld(t[0].clientX, t[0].clientY); touchMove = w; }
}, { passive: false });
cv.addEventListener('touchmove', e => {
  e.preventDefault();
  const w = screenToWorld(e.touches[0].clientX, e.touches[0].clientY);
  touchMove = w;
}, { passive: false });
cv.addEventListener('touchend', e => {
  if (e.touches.length === 0) { touchMove = null; touchFire = false; }
}, { passive: false });

// ---------- update ----------
function breakCrate(k) {
  const cc = crates[k]; crates.splice(k, 1); score += 10;
  addFloat(cc.c * TILE + 16, cc.r * TILE, '+10');
  const x = cc.c * TILE + 16, y = cc.r * TILE + 16, r = Math.random();
  if (r < 0.20) pickups.push({ kind: 'gold', val: 10 + Math.floor(Math.random() * 11), x, y, t: 0 });
  else if (r < 0.30) pickups.push({ kind: 'medbox', x, y, t: 0 });
  else if (r < 0.44) {
    // chỉ rớt đạn của vũ khí đã mở khóa (missile/mini luôn có, tesla/rail chung pin)
    const pool = [['a_mis', 30]];
    if (up.clay) pool.push(['a_clay', 1]);
    if (up.flame) pool.push(['a_gas', 1]);
    if (up.rail || up.tesla) pool.push(['a_bat', 120]);
    const [kind, n] = pool[Math.floor(Math.random() * pool.length)];
    pickups.push({ kind, n, x, y, t: 0 });
  }
  beep(300, 0.1, 'square', 0.1); updateHUD();
}
function update(dt) {
  time += dt;
  if (player.cd > 0) player.cd -= dt;
  if (player.laserCd > 0) player.laserCd -= dt;
  if (player.teslaCd > 0) player.teslaCd -= dt;
  if (player.clayCd > 0) player.clayCd -= dt;
  if (player.inv > 0) player.inv -= dt;
  if (player.dryT > 0) player.dryT -= dt;
  if (base && base.shield > 0) base.shield -= dt;
  tickReloads(dt);
  // minigun: dừng bắn >0.3s thì tích lại từ đầu
  if (player.miniGap !== undefined) {
    player.miniGap += dt;
    if (player.miniGap > 0.3) player.miniHold = 0;
  }

  // --- player di chuyển mượt ---
  if (player.alive) {
    let dx = 0, dy = 0;
    if (keys['a']) dx -= 1; if (keys['d']) dx += 1;
    if (keys['w']) dy -= 1; if (keys['s']) dy += 1;
    if (touchMove) { // touch: chạy về điểm chạm (world coords đã qua camera)
      dx = touchMove.x - player.x; dy = touchMove.y - player.y;
      const tl = Math.hypot(dx, dy);
      if (tl > 12) { dx /= tl; dy /= tl; } else { dx = 0; dy = 0; }
    }
    const l = Math.hypot(dx, dy);
    if (l > 0) {
      dx /= l; dy /= l;
      moveSmooth(player, dx * player.speed, dy * player.speed, dt);
      turnTo(player, Math.atan2(dx, -dy), 14, dt); player.mvx = dx; player.mvy = dy;
    } else { player.mvx = 0; player.mvy = 0; }
  }
  const A = ammo;
  const firing = (keys[' '] || keys['k'] || touchFire) && player.alive;
  if (firing) {
    if (player.form === 'MINI') fireMinigun();
    else if (player.form === 'MIS') fireMissiles();
    else if (player.form === 'TESLA') fireTesla();
    else if (player.form === 'FLAME') {
      if (A.flame.fuel > 0 && A.flame.rel <= 0) {
        A.flame.fuel -= dt;
        player.flameT -= dt;
        if (player.flameT <= 0) { player.flameT = FLAME.tick; spewFlame(); }
        if (A.flame.fuel <= 0) { A.flame.fuel = 0; startReload('flame'); if (A.flame.tanks <= 0) dryHint('Hết gas!'); }
      } else { startReload('flame'); if (A.flame.tanks <= 0 && A.flame.rel <= 0) dryHint('Hết gas!'); }
    }
  }

  // --- spawn theo queue của màn ---
  const def = lvlDef(level);
  spawnT -= dt;
  if (spawnT <= 0 && queue.length && foes.length < def.maxAlive) {
    if (spawnFoe(queue.shift())) spawnT = rnd(def.spawn[0], def.spawn[1]);
    else { queue.push(queue.shift()); spawnT = 1; }
    updateHUD();
  }
  checkEnrage(); // base <50%hp + địch còn >25% (màn 8+): enrage 1 lần/màn
  tickEndless(dt); // endless hết địch: mỗi 3s đẻ 1 tank

  // --- AI địch (OOP: mỗi subclass tự behavior) ---
  for (const f of foes) f.update(dt);
  for (let i = drones.length - 1; i >= 0; i--) {
    const o = drones[i];
    if (drones.indexOf(o) < 0) continue;
    o.update(dt);
  }

  // --- đạn (thường/missile/heal/shield) ---
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    if (b.kind === 'mis' && !b.foe) {
      let best = null, bd = MIS_LOCK_R;
      const tg = foes.concat(drones);
      for (const f of tg) { const d = Math.hypot(f.x - b.x, f.y - b.y); if (d < bd) { bd = d; best = f; } }
      if (best) {
        const want = Math.atan2(best.x - b.x, -(best.y - b.y));
        const diff = ((want - b.ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        b.ang += Math.max(-6 * dt, Math.min(6 * dt, diff));
        b.chasing = true; b.speed = MIS_CHASE_PX;
      } else { b.chasing = false; b.speed = MIS_PX; }
      b.vx = Math.sin(b.ang) * b.speed; b.vy = -Math.cos(b.ang) * b.speed;
    } else if (b.kind === 'arti' && b.foe) { // đạn đạo: bay xuyên địa hình tới đích rồi nổ 3x3
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (Math.hypot(b.tx - b.x, b.ty - b.y) < 14 || b.life <= 0) { bullets.splice(i, 1); artiImpact(b); }
      continue;
    } else if ((b.kind === 'heal' || b.kind === 'shield') && b.target) {
      const t = b.target;
      const isBase = b.isBase || t === base;
      const aliveT = isBase ? (base.hp > 0) : (foes.indexOf(t) >= 0 || drones.indexOf(t) >= 0);
      if (!aliveT) { bullets.splice(i, 1); continue; }
      const want = Math.atan2(t.x - b.x, -(t.y - b.y));
      const diff = ((want - b.ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      b.ang += Math.max(-4 * dt, Math.min(4 * dt, diff));
      const sp = b.kind === 'heal' ? TILE * 4 : TILE * 3.5;
      b.vx = Math.sin(b.ang) * sp; b.vy = -Math.cos(b.ang) * sp;
      if (Math.hypot(t.x - b.x, t.y - b.y) < 20) {
        bullets.splice(i, 1);
        if (b.kind === 'heal') {
          const hv = medicHeal(), tag = base && base.enraged ? '+4' : '+1';
          if (isBase) { healAlly(base, hv); addFloat(base.x, base.y - 24, tag + ' BASE', '#7CFC00'); }
          else {
            let n = 0;
            const tg = foes.concat(drones);
            for (const f of tg) {
              if (Math.hypot(f.x - t.x, f.y - t.y) < MEDIC.radius) { healAlly(f, hv); n++; addFloat(f.x, f.y - 20, tag, '#7CFC00'); }
            }
            if (n === 0) healAlly(t, hv);
          }
          explode(t.x, t.y, 10, ['#7CFC00', '#fff']); beep(700, 0.15, 'sine', 0.08);
        } else {
          if (isBase) { base.shield = shieldDur(); addFloat(base.x, base.y - 28, 'BASE SHIELD!', '#7df9ff'); }
          else { t.shield = shieldDur(); t.hit = 1; addFloat(t.x, t.y - 22, 'SHIELD!', '#7df9ff'); }
          explode(t.x, t.y, 10, ['#7df9ff', '#fff']); beep(600, 0.15, 'sine', 0.08);
        }
        updateHUD(); continue;
      }
    }
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    let dead = b.life <= 0 || b.x < 0 || b.y < 0 || b.x > W || b.y > H;
    if ((b.kind === 'heal' || b.kind === 'shield') && !dead) {
      const { c, r } = cellAt(b.x, b.y);
      if (inMap(c, r) && map[r][c] === 'B') { explode(b.x, b.y, 5); dead = true; }
    }
    if (dead) { bullets.splice(i, 1); continue; }
    if (b.healer) continue; // orb chỉ tương tác đồng đội
    const { c, r } = cellAt(b.x, b.y);
    if (inMap(c, r) && map[r][c] === 'B') { explode(b.x, b.y, 5); dead = true; }
    if (!dead) {
      const k = crates.findIndex(k => b.x > k.c * TILE && b.x < (k.c + 1) * TILE && b.y > k.r * TILE && b.y < (k.r + 1) * TILE);
      if (k >= 0) { // đạn thường kẹt block thùng
        deplete(crates[k], Math.min(b.dmg != null ? b.dmg : 1, blockRemain(crates[k])));
        crates[k].hit = 1; explode(b.x, b.y, 6); dead = true;
        if (crates[k].hp <= 0) breakCrate(k);
      }
    }
    if (!dead && hitBase(b.x, b.y)) { dead = true; if (!b.foe) { hurtBase(b.dmg != null ? b.dmg : 1); score += 25; updateHUD(); } }
    if (!dead) {
      if (b.foe) {
        if (player.alive && Math.hypot(b.x - player.x, b.y - player.y) < 16) { hurtPlayer(b.dmg || 1); explode(b.x, b.y, 9); dead = true; }
      } else {
        const tg = foes.concat(drones);
        for (let j = tg.length - 1; j >= 0; j--) {
          const f = tg[j];
          if (Math.hypot(b.x - f.x, b.y - f.y) < 18) {
            explode(b.x, b.y, 8); dead = true; damageFoe(f, b.dmg != null ? b.dmg : 1); updateHUD(); break;
          }
        }
      }
    }
    if (dead) bullets.splice(i, 1);
  }

  // --- lửa: first-contact 0.05 + châm burn (không gây dmg base) ---
  for (let i = flames.length - 1; i >= 0; i--) {
    const p = flames[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    let dead = p.life <= 0 || p.x < 0 || p.y < 0 || p.x > W || p.y > H;
    const { c, r } = cellAt(p.x, p.y);
    if (!dead && inMap(c, r) && map[r][c] === 'B') dead = true;
    if (!dead) {
      const tg = foes.concat(drones);
      for (let j = tg.length - 1; j >= 0; j--) {
        const f = tg[j];
        if (Math.hypot(p.x - f.x, p.y - f.y) < 16) { touchFlame(f); updateHUD(); dead = true; break; }
      }
    }
    if (!dead && !p.cold) { // lửa NÓNG đốt cả công trình (lạnh bỏ qua)
      const kc = crates.findIndex(k => p.x > k.c * TILE && p.x < (k.c + 1) * TILE && p.y > k.r * TILE && p.y < (k.r + 1) * TILE);
      if (kc >= 0) {
        dead = true;
        if (touchStruct(crates[kc], () => breakCrate(kc))) updateHUD();
        else { crates[kc].hit = 1; updateHUD(); }
      } else if (hitBase(p.x, p.y)) {
        dead = true;
        if (!(base.shield > 0)) touchStruct(base, () => { hurtBase(9999, 'pierce'); });
        updateHUD();
      }
    }
    if (dead) { parts.push({ x: p.x, y: p.y, vx: rnd(-30, 30), vy: rnd(-40, -5), life: 0.3, t: 0, c: '#ff8c42', s: 3 }); flames.splice(i, 1); }
  }

  // --- burn + frost (method trên từng entity) ---
  for (const f of foes.concat(drones)) { f.tickBurn(dt); f.tickFrost(dt); }
  // --- burn công trình (kháng lửa 0.04) ---
  for (let i = crates.length - 1; i >= 0; i--) {
    const c = crates[i], b = c.burn;
    if (b && b.stacks > 0) {
      b.dur -= dt;
      if (b.dur <= 0) { b.stacks = 0; b.tick = 0; }
      else {
        b.tick -= dt;
        if (b.tick <= 0) {
          b.tick = burnInterval(b.stacks);
          deplete(c, burnTickDmg(c)); c.hit = 1; updateHUD();
          if (c.hp <= 0) breakCrate(i);
        }
      }
    }
  }
  if (base.burn && base.burn.stacks > 0) {
    const b = base.burn;
    b.dur -= dt;
    if (b.dur <= 0) { b.stacks = 0; b.tick = 0; }
    else {
      b.tick -= dt;
      if (b.tick <= 0) {
        b.tick = burnInterval(b.stacks);
        if (!(base.shield > 0)) {
          deplete(base, burnTickDmg(base)); updateHUD();
          if (base.hp <= 0) { base.hp = 0; levelClear(); }
        }
      }
    }
  }

  // --- claymore: nổ khi địch lọt nón Clairvoyance, tầm Psionic ---
  for (let i = claymores.length - 1; i >= 0; i--) {
    const cm = claymores[i]; cm.t += dt;
    const half = clayHalf(), range = clayRange();
    let boom = false;
    const tg = foes.concat(drones);
    for (const f of tg) {
      const dx = f.x - cm.x, dy = f.y - cm.y, d = Math.hypot(dx, dy);
      if (d < range) {
        const want = Math.atan2(dx, -dy);
        const diff = Math.abs(((want - cm.ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        if (diff < half) { boom = true; break; }
      }
    }
    if (boom) {
      claymores.splice(i, 1);
      beams.push({ x1: cm.x, y1: cm.y, x2: cm.x + Math.sin(cm.ang) * range, y2: cm.y - Math.cos(cm.ang) * range, t: 0, life: 0.25, clay: true });
      explode(cm.x, cm.y, 20); beep(120, 0.3, 'sawtooth', 0.13);
      const frate = FATAL_RATE[up.fatal];
      for (let j = tg.length - 1; j >= 0; j--) {
        const f = tg[j];
        const dx = f.x - cm.x, dy = f.y - cm.y, d = Math.hypot(dx, dy);
        if (d < range) {
          const want = Math.atan2(dx, -dy);
          const diff = Math.abs(((want - cm.ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
          if (diff < half + 0.2) {
            if (frate > 0 && Math.random() < frate) { // Fatality: 999999999 xuyên block
              damageFoe(f, 999999999, 'pierce');
              addFloat(f.x, f.y - 30, 'FATALITY!', '#ff00ff');
            } else damageFoe(f, CLAY.dmg);
          }
        }
      }
      const ns = SHRAP_N[up.shrap]; // mảnh vỡ 0.8dmg bay 1-5 tile trong 40s
      for (let s = 0; s < ns; s++) {
        const a = rnd(0, Math.PI * 2), sp = rnd(1, 5) * TILE / SHRAP_LIFE;
        bullets.push({ kind: 'shrap', img: 'bNorm', tint: 'hue-rotate(-40deg) saturate(3)',
          x: cm.x, y: cm.y, vx: Math.sin(a) * sp, vy: Math.cos(a) * sp,
          ang: a, foe: false, life: SHRAP_LIFE, dmg: SHRAP_DMG, size: 8 });
      }
      updateHUD();
    }
  }

  // --- sét hòn (Ball Lightning): giật tối đa N địch trong r mỗi tick ---
  for (let i = balls.length - 1; i >= 0; i--) {
    const bl = balls[i]; bl.t += dt; bl.cd -= dt;
    if (bl.t >= bl.dur) { balls.splice(i, 1); continue; }
    if (bl.cd <= 0) {
      bl.cd = bl.tick;
      const inR = foes.concat(drones).filter(f => Math.hypot(f.x - bl.x, f.y - bl.y) < bl.r).slice(0, bl.max);
      for (const f of inR) {
        damageFoe(f, BALL.dmg, 'block');
        beams.push({ pts: [{ x: bl.x, y: bl.y }, { x: f.x, y: f.y }], t: 0, life: 0.15, tesla: true });
        teslaHitReact(f, BALL.dmg, f.hp + BALL.dmg);
        if (f.hp <= 0) maybeDropBall(f.x, f.y);
      }
      if (inR.length) { beep(1200, 0.06, 'sawtooth', 0.05); explode(bl.x, bl.y, 5, ['#c9a7ff', '#fff']); }
    }
  }
  // --- shielder phản ứng tesla: 0.2s sau khiên all đồng minh (trừ base) ---
  for (let i = shieldReact.length - 1; i >= 0; i--) {
    shieldReact[i].t -= dt;
    if (shieldReact[i].t <= 0) {
      shieldReact.splice(i, 1);
      for (const f of foes.concat(drones)) { f.shield = Math.max(f.shield, shieldDur()); f.hit = 1; }
      addFloat(player.x, player.y - 30, 'SHIELD WALL!', '#7df9ff');
      beep(500, 0.2, 'sine', 0.09);
    }
  }

  // --- không kích caller (static: báo rồi nổ cross) + missile foe (lock bám -> freeze nháy -> đạn đạo) ---
  for (let i = warnings.length - 1; i >= 0; i--) {
    const w = warnings[i]; w.t -= dt;
    if (w.phase === 'lock') {
      if (player.alive) { // warning bám theo player trong lúc lock
        const pc = cellAt(player.x, player.y);
        w.centers = w.offsets.map(o => ({ c: pc.c + o.dc, r: pc.r + o.dr })).filter(k => inMap(k.c, k.r));
        if (!w.centers.length) w.centers = [{ c: pc.c, r: pc.r }];
        w.cells = expandCells(w.centers, w.cross);
      }
      if (w.t <= 0) { w.phase = 'flash'; w.t = MISL.flash; w.total = MISL.flash; beep(980, 0.12); } // lock xong: freeze, nháy
      continue;
    }
    if (w.phase === 'flash') {
      if (w.t <= 0) { // nháy xong -> phóng 1 missile đạn đạo tới tâm
        warnings.splice(i, 1);
        const ctr = w.centers[0] || { c: 0, r: 0 };
        fireArti(w.sx, w.sy, ctr.c * TILE + 16, ctr.r * TILE + 16);
      }
      continue;
    }
    if (w.t <= 0) { // static (caller): hết báo -> nổ cross tức thì
      warnings.splice(i, 1);
      booms.push({ cells: w.cells, t: 0.8, total: 0.8 });
      explode(w.cells[0].c * TILE + 16, w.cells[0].r * TILE + 16, 20);
      beep(70, 0.4, 'sawtooth', 0.15);
      const pc = cellAt(player.x, player.y);
      if (player.alive && w.cells.some(k => k.c === pc.c && k.r === pc.r)) hurtPlayer(AIR.dmg);
      for (let j = crates.length - 1; j >= 0; j--) {
        if (w.cells.some(k => k.c === crates[j].c && k.r === crates[j].r)) { explode(crates[j].c * TILE + 16, crates[j].r * TILE + 16, 10); crates.splice(j, 1); }
      }
      updateHUD();
    }
  }
  for (let i = booms.length - 1; i >= 0; i--) { booms[i].t -= dt; if (booms[i].t <= 0) booms.splice(i, 1); }

  // --- mìn elite (đã xóa mìn tự nhiên) ---
  if (player.alive) {
    for (let i = mines.length - 1; i >= 0; i--) {
      const m = mines[i];
      if (time < m.armedAt) continue;
      const d = Math.hypot(player.x - m.x, player.y - m.y);
      if (d < TILE * 2.2 && !m.warned) { m.warned = true; beep(980, 0.09); setTimeout(() => beep(980, 0.09), 140); addFloat(m.x, m.y - 18, '⚠️ mìn!', '#ff6b6b'); }
      if (d < 18) { mines.splice(i, 1); explode(m.x, m.y, 24); hurtPlayer(1); }
    }
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i]; p.t += dt;
      if (Math.hypot(player.x - p.x, player.y - p.y) < 20) {
        pickups.splice(i, 1);
        if (p.kind === 'medbox') { healAlly(player, 1); score += 15; addFloat(player.x, player.y - 24, '+1 ❤️', '#7CFC00'); }
        else if (p.kind === 'gold') { gold += p.val; score += 5; addFloat(player.x, player.y - 24, '+' + p.val, '#ffd75e', 'gold'); }
        else if (p.kind === 'a_mis') { addStock('mis', p.n); addFloat(player.x, player.y - 24, '+' + p.n + ' đạn', '#ffd75e'); }
        else if (p.kind === 'a_clay') { addStock('clay', p.n); addFloat(player.x, player.y - 24, '+' + p.n + ' claymore', '#ffd75e'); }
        else if (p.kind === 'a_gas') { addStock('gas', p.n); addFloat(player.x, player.y - 24, '+' + p.n + ' gas', '#ffd75e'); }
        else if (p.kind === 'a_bat') { addStock('bat', p.n); addFloat(player.x, player.y - 24, '+' + p.n + '⚡', '#7df9ff'); }
        beep(660, 0.12, 'sine', 0.09); updateHUD(); refreshSlots();
      } else if (p.t > 25) pickups.splice(i, 1);
    }
  }

  for (let i = beams.length - 1; i >= 0; i--) { beams[i].t += dt; if (beams[i].t > beams[i].life) beams.splice(i, 1); }
  for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96; if (p.t > p.life) parts.splice(i, 1); }
  for (let i = floats.length - 1; i >= 0; i--) { const f = floats[i]; f.t += dt; f.y -= 26 * dt; if (f.t > 1.3) floats.splice(i, 1); }
  crates.forEach(k => k.hit = Math.max(0, k.hit - dt * 4));
  shake = Math.max(0, shake - dt * 22);
  updateCamera(dt); // camera bám player (draw dùng ngay frame này)
  if (Math.floor(time * 10) !== Math.floor((time - dt) * 10)) updateHUD(); // refresh đạn mỗi 0.1s
}

// ================= DRAW =================
function drawFoeStatus(f) {
  if (FOE_TAG[f.kind]) {
    ctx.fillStyle = f.kind === 'E' ? '#ffd75e' : (f.kind === 'V' ? '#ff9d5b' : '#ffb3b3');
    ctx.font = 'bold 9px sans-serif'; ctx.fillText(FOE_TAG[f.kind], f.x - 16, f.y - 22);
  }
  if (f.hp < f.maxhp) {
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(f.x - 14, f.y - 18, 28, 4);
    ctx.fillStyle = '#7CFC00'; ctx.fillRect(f.x - 14, f.y - 18, 28 * Math.max(0, f.hp / f.maxhp), 4);
  }
  if (f.shield > 0 && spr.shieldFx) {
    ctx.save(); ctx.globalAlpha = 0.5 + 0.4 * Math.sin(time * 10);
    ctx.drawImage(spr.shieldFx, f.x - 20, f.y - 20, 40, 40); ctx.restore();
  }
  if (f.burn && f.burn.stacks > 0) {
    ctx.save(); ctx.globalAlpha = Math.min(1, 0.2 * f.burn.stacks + 0.1 * Math.sin(time * 14));
    if (spr.burn) ctx.drawImage(spr.burn, f.x - 9, f.y - 40, 18, 18);
    else { ctx.fillStyle = '#ff6a00'; ctx.beginPath(); ctx.arc(f.x, f.y - 31, 7, 0, 7); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = '#ffb35b'; ctx.font = 'bold 9px sans-serif';
    ctx.fillText('x' + f.burn.stacks, f.x + 10, f.y - 28);
  }
  if (f.frost && f.frost.stacks > 0) {
    ctx.save(); ctx.globalAlpha = 0.9;
    if (spr.frost) ctx.drawImage(spr.frost, f.x - 9, f.y - 40, 18, 18);
    else { ctx.fillStyle = '#7df9ff'; ctx.font = 'bold 11px sans-serif'; ctx.fillText('❄', f.x - 6, f.y - 26); }
    ctx.restore();
    ctx.fillStyle = '#7df9ff'; ctx.font = 'bold 9px sans-serif';
    ctx.fillText('x' + f.frost.stacks, f.x + 10, f.y - 28);
  }
}
function draw() {
  ctx.save();
  const s = viewScale(); // camera 32x18 tile
  let shx = 0, shy = 0;
  if (shake > 0 && settings.shake) { shx = rnd(-shake, shake) * 0.4; shy = rnd(-shake, shake) * 0.4; }
  ctx.setTransform(s, 0, 0, s, cv.width / 2 - (cam.x + shx) * s, cv.height / 2 - (cam.y + shy) * s);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const x = c * TILE, y = r * TILE, t = map[r][c];
    const img = t === 'B' ? spr.brick : t === 'D' ? spr.dirt : t === 'Y' ? spr.mud : spr.grass;
    if (img) ctx.drawImage(img, x, y, TILE, TILE);
    else { ctx.fillStyle = t === 'B' ? '#999' : '#5a7d3c'; ctx.fillRect(x, y, TILE, TILE); }
  }
  // base XANH (tint từ ảnh base đỏ)
  drawSpr(spr.base, base.x, base.y, 32, 32, 0, 'hue-rotate(110deg) saturate(1.6)');
  ctx.fillStyle = '#7CFC00'; ctx.font = 'bold 10px sans-serif'; ctx.fillText('BASE XANH', base.x - 28, base.y - 24);
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(base.x - 16, base.y - 9, 32, 5);
  ctx.fillStyle = '#7CFC00'; ctx.fillRect(base.x - 16, base.y - 9, 32 * (base.hp / base.max), 5);
  if (base.burn && base.burn.stacks > 0 && spr.burn) {
    ctx.save(); ctx.globalAlpha = Math.min(1, 0.2 * base.burn.stacks + 0.1 * Math.sin(time * 14));
    ctx.drawImage(spr.burn, base.x - 9, base.y - 34, 18, 18); ctx.restore();
  }
  if (base.shield > 0 && spr.shieldFx) {
    ctx.save(); ctx.globalAlpha = 0.5 + 0.4 * Math.sin(time * 10);
    ctx.drawImage(spr.shieldFx, base.x - 22, base.y - 22, 44, 44); ctx.restore();
  }
  // sét hòn
  for (const bl of (balls || [])) {
    ctx.save();
    ctx.globalAlpha = 0.7 + 0.3 * Math.sin(time * 12);
    ctx.strokeStyle = '#c9a7ff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(bl.x, bl.y, 10 + 2 * Math.sin(time * 9), 0, 7); ctx.stroke();
    ctx.fillStyle = '#e8dcff';
    ctx.beginPath(); ctx.arc(bl.x, bl.y, 5, 0, 7); ctx.fill();
    ctx.globalAlpha = 0.25; ctx.strokeStyle = '#c9a7ff'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(bl.x, bl.y, bl.r, 0, 7); ctx.stroke();
    ctx.restore();
  }

  for (const k of crates) {
    const x = k.c * TILE, y = k.r * TILE;
    if (spr.crate) ctx.drawImage(spr.crate, x, y, TILE, TILE);
    if (k.hp <= 1 && k.hp > 0) { ctx.fillStyle = '#ff6b6b'; ctx.font = 'bold 9px sans-serif'; ctx.fillText('nứt!', x + 4, y + 12); }
    if (k.hit > 0) { ctx.strokeStyle = `rgba(255,255,255,${k.hit})`; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2); }
    if (k.burn && k.burn.stacks > 0 && spr.burn) {
      ctx.save(); ctx.globalAlpha = Math.min(1, 0.2 * k.burn.stacks + 0.1 * Math.sin(time * 14));
      ctx.drawImage(spr.burn, x + TILE - 14, y - 4, 14, 14); ctx.restore();
    }
  }
  // cảnh báo không kích + vụ nổ
  for (const w of warnings) {
    const blink = Math.floor(time * 4) % 2 === 0;
    ctx.save(); ctx.globalAlpha = blink ? 0.85 : 0.4;
    for (const k of w.cells) if (spr.warnT) ctx.drawImage(spr.warnT, k.c * TILE, k.r * TILE, TILE, TILE);
    ctx.restore();
    ctx.fillStyle = '#ff6b6b'; ctx.font = 'bold 11px sans-serif';
    ctx.fillText(w.phase === 'lock' ? '🔒' + w.t.toFixed(1) : w.t.toFixed(1), w.cells[0].c * TILE + 6, w.cells[0].r * TILE + 14);
  }
  for (const b of booms) {
    ctx.save(); ctx.globalAlpha = Math.max(0, b.t / b.total);
    for (const k of b.cells) if (spr.boomT) ctx.drawImage(spr.boomT, k.c * TILE - 8, k.r * TILE - 8, TILE + 16, TILE + 16);
    ctx.restore();
  }
  // mìn elite chớp 0.5s
  const blink = Math.floor(time / MINE_BLINK) % 2 === 0;
  for (const m of mines) {
    drawSpr(blink ? spr.mine1 : spr.mine2, m.x, m.y, 26, 26, 0);
    if (time < m.armedAt) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = '9px sans-serif'; ctx.fillText('...', m.x - 5, m.y - 15); }
    else if (player.alive && Math.hypot(player.x - m.x, player.y - m.y) < TILE * 2.2) {
      ctx.strokeStyle = `rgba(255,60,60,${0.5 + 0.4 * Math.sin(time * 10)})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(m.x, m.y, 20, 0, 7); ctx.stroke();
    }
  }
  for (const cm of claymores) {
    drawSpr(Math.floor(cm.t / MINE_BLINK) % 2 === 0 ? spr.clay1 : spr.clay2, cm.x, cm.y, 24, 24, cm.ang);
    const ch = clayHalf(), cr = clayRange();
    ctx.save(); ctx.globalAlpha = 0.13; ctx.fillStyle = '#ff5b5b';
    ctx.beginPath(); ctx.moveTo(cm.x, cm.y);
    ctx.arc(cm.x, cm.y, cr, cm.ang - ch - Math.PI / 2, cm.ang + ch - Math.PI / 2);
    ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.save(); ctx.globalAlpha = 0.15; ctx.strokeStyle = '#ff5b5b'; ctx.lineWidth = 2;
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(cm.x, cm.y);
      ctx.lineTo(cm.x + Math.sin(cm.ang + s * ch) * cr, cm.y - Math.cos(cm.ang + s * ch) * cr); ctx.stroke();
    }
    ctx.restore();
  }
  for (const p of pickups) {
    const bob = Math.sin(time * 5 + p.x) * 2;
    if (p.kind === 'heart') {
      ctx.save(); ctx.translate(p.x, p.y + bob);
      ctx.fillStyle = '#228b22'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(-2, -6, 4, 12); ctx.fillRect(-6, -2, 12, 4);
      ctx.restore();
    } else if (spr[PICK_IMG[p.kind]]) ctx.drawImage(spr[PICK_IMG[p.kind]], p.x - 10, p.y - 10 + bob, 20, 20);
  }
  for (const f of foes) {
    if (f.aiming > 0 && spr.warnT) {
      // foreswing railgun: hướng đã lock — chỉ hiện warning tile trên ray, KHÔNG vẽ ray bám player
      const dx = Math.sin(f.ang), dy = -Math.cos(f.ang);
      ctx.save(); ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 12);
      for (let dd = 32; dd < FOE_RAIL.range; dd += 64) {
        const px = f.x + dx * dd, py = f.y + dy * dd;
        if (px < 0 || py < 0 || px > W || py > H) break;
        ctx.drawImage(spr.warnT, px - 12, py - 12, 24, 24);
      }
      ctx.restore();
    } else if (f.cd < 0.6 && player.alive && f.kind !== 'M' && f.kind !== 'H' && hasLOS(f.x, f.y, player.x, player.y)) {
      // telegraph bắn thường: ray đứt (đạn bay có tốc độ nên vẫn né được)
      ctx.save(); ctx.globalAlpha = 0.3; ctx.strokeStyle = '#ff6b6b';
      ctx.setLineDash([5, 5]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(player.x, player.y); ctx.stroke(); ctx.restore();
    }
    if (f.hit > 0) ctx.globalAlpha = 0.55 + 0.4 * Math.sin(time * 30);
    drawSpr(spr[FOE_IMG[f.kind]], f.x, f.y, 34, 34, f.ang);
    ctx.globalAlpha = 1;
    drawFoeStatus(f);
  }
  for (const o of drones) {
    const near = player.alive && Math.hypot(player.x - o.x, player.y - o.y) < 60;
    if (near && Math.floor(time * 8) % 2 === 0) ctx.globalAlpha = 0.5;
    drawSpr(spr.drone, o.x, o.y, 24, 24, o.ang);
    ctx.globalAlpha = 1;
    if (o.hp < o.maxhp) {
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(o.x - 12, o.y - 16, 24, 3);
      ctx.fillStyle = '#ff8c42'; ctx.fillRect(o.x - 12, o.y - 16, 24 * Math.max(0, o.hp / o.maxhp), 3);
    }
    if (o.shield > 0 && spr.shieldFx) {
      ctx.save(); ctx.globalAlpha = 0.6; ctx.drawImage(spr.shieldFx, o.x - 15, o.y - 15, 30, 30); ctx.restore();
    }
    if (o.burn && o.burn.stacks > 0) {
      ctx.save(); ctx.globalAlpha = Math.min(1, 0.2 * o.burn.stacks + 0.1 * Math.sin(time * 14));
      if (spr.burn) ctx.drawImage(spr.burn, o.x - 8, o.y - 36, 16, 16);
      else { ctx.fillStyle = '#ff6a00'; ctx.beginPath(); ctx.arc(o.x, o.y - 28, 6, 0, 7); ctx.fill(); }
      ctx.restore();
    }
    if (o.frost && o.frost.stacks > 0) {
      if (spr.frost) ctx.drawImage(spr.frost, o.x - 8, o.y - 36, 16, 16);
      else { ctx.fillStyle = '#7df9ff'; ctx.font = 'bold 10px sans-serif'; ctx.fillText('❄', o.x - 5, o.y - 24); }
    }
  }
  // player đỏ 6 dạng (xoay mượt, bất tử nhấp nháy)
  if (player.alive && !(player.inv > 0 && Math.floor(time * 10) % 2 === 0)) {
    const PI = { MINI: 'redMini', MIS: 'redMis', CLAY: 'redClay', FLAME: 'redFlame', TESLA: 'redTesla', RAIL: 'redRail' };
    drawSpr(spr[PI[player.form]] || spr.redRail, player.x, player.y, 36, 36, player.ang);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif';
    ctx.fillText({ MINI: 'MINI [1]', MIS: 'MIS [2]', CLAY: 'CLAY [3]', FLAME: 'FLAME [4]', TESLA: 'TESLA [5]', RAIL: 'LAZER [6]' }[player.form], player.x - 24, player.y - 22);
    // HPBar player chia vạch theo block
    const bw = 46, bh = 7, bx = player.x - bw / 2, by = player.y - 32;
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    const n = player.blocks.length;
    let acc = 0;
    for (let i = 0; i < n; i++) {
      const frac = player.blocks[i] > 0 ? Math.max(0, player.bhp[i] / player.blocks[i]) : 0;
      const wseg = bw / n;
      ctx.fillStyle = frac > 0.5 ? '#ff5b5b' : frac > 0 ? '#ff8c42' : '#333';
      if (frac > 0) ctx.fillRect(bx + acc, by, wseg * frac, bh);
      acc += wseg;
    }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
    for (let i = 1; i < n; i++) {
      const lx = bx + bw * i / n;
      ctx.beginPath(); ctx.moveTo(lx, by); ctx.lineTo(lx, by + bh); ctx.stroke();
    }
  }
  for (const b of bullets) {
    drawSpr(spr[b.img] || spr.bNorm, b.x, b.y, b.size || 12, b.size || 12, b.ang, b.tint || null);
    if (b.chasing) { ctx.strokeStyle = '#7df9ff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(b.x, b.y, 10 + 2 * Math.sin(time * 12), 0, 7); ctx.stroke(); }
  }
  // lửa vẽ theo z: particle5 trước ... particle1 trên cùng; lửa lạnh tint xanh
  flames.slice().sort((a, b) => (b.pi || 0) - (a.pi || 0))
    .forEach(p => drawSpr(spr[p.img], p.x, p.y, 12, 12, p.ang, p.cold ? 'hue-rotate(170deg) saturate(2)' : null));
  for (const bm of beams) {
    ctx.globalAlpha = 1 - bm.t / bm.life;
    if (bm.mini) {
      // minigun: ray yellow 1px (CSS vẽ 1px)
      ctx.strokeStyle = '#ffe45e'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(bm.x1, bm.y1); ctx.lineTo(bm.x2, bm.y2); ctx.stroke();
    } else if (bm.tesla && bm.pts) {
      // tesla chain: zigzag điện xanh-trắng
      ctx.strokeStyle = '#7df9ff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(bm.pts[0].x, bm.pts[0].y);
      for (let i = 1; i < bm.pts.length; i++) {
        const px = bm.pts[i - 1], q = bm.pts[i];
        const mx = (px.x + q.x) / 2 + rnd(-6, 6), my = (px.y + q.y) / 2 + rnd(-6, 6);
        ctx.lineTo(mx, my); ctx.lineTo(q.x, q.y);
      }
      ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(bm.pts[0].x, bm.pts[0].y);
      for (let i = 1; i < bm.pts.length; i++) ctx.lineTo(bm.pts[i].x, bm.pts[i].y);
      ctx.stroke();
    } else if (bm.clay) {
      ctx.strokeStyle = '#ffb35b'; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.moveTo(bm.x1, bm.y1); ctx.lineTo(bm.x2, bm.y2); ctx.stroke();
    } else if (bm.thermal) {
      if (spr.bTherm) ctx.drawImage(spr.bTherm, (bm.x1 + bm.x2) / 2 - 10, (bm.y1 + bm.y2) / 2 - 10, 20, 20);
      ctx.strokeStyle = '#ff7a1a'; ctx.lineWidth = bm.wide ? 9 : 6;
      ctx.beginPath(); ctx.moveTo(bm.x1, bm.y1); ctx.lineTo(bm.x2, bm.y2); ctx.stroke();
      ctx.strokeStyle = '#ffd75e'; ctx.lineWidth = bm.wide ? 3 : 2;
      ctx.beginPath(); ctx.moveTo(bm.x1, bm.y1); ctx.lineTo(bm.x2, bm.y2); ctx.stroke();
    } else {
      ctx.strokeStyle = '#7df9ff'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(bm.x1, bm.y1); ctx.lineTo(bm.x2, bm.y2); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bm.x1, bm.y1); ctx.lineTo(bm.x2, bm.y2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  for (const p of parts) { ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.c; ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); }
  ctx.globalAlpha = 1; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
  for (const f of floats) {
    ctx.globalAlpha = 1 - f.t / 1.3; ctx.fillStyle = f.c; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineWidth = 3;
    if (f.img && spr[f.img]) { const w = ctx.measureText(f.txt).width; ctx.drawImage(spr[f.img], f.x - w / 2 - 18, f.y - 12, 14, 14); }
    ctx.strokeText(f.txt, f.x, f.y); ctx.fillText(f.txt, f.x, f.y);
  }
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
  drawMinimap(); // minimap góc phải (tọa độ màn hình)
  ctx.restore();
}
// ---------- minimap ----------
function drawMinimap() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const mw = 168, mh = Math.round(mw * H / W);
  const x0 = cv.width - mw - 10, y0 = 10;
  const tw = mw / COLS, th = mh / ROWS;
  ctx.save();
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = 'rgba(5,8,5,.72)'; ctx.fillRect(x0 - 3, y0 - 3, mw + 6, mh + 6);
  const MCOL = { B: '#8a8a8a', G: '#4a6b34', D: '#7a5a30', Y: '#6b5a44' };
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++)
    { ctx.fillStyle = MCOL[map[r][c]] || '#222'; ctx.fillRect(x0 + c * tw, y0 + r * th, tw + 0.5, th + 0.5); }
  ctx.fillStyle = '#a06a2c';
  for (const k of crates) ctx.fillRect(x0 + k.c * tw, y0 + k.r * th, tw, th);
  ctx.fillStyle = '#ff3b3b'; // cảnh báo không kích
  for (const w of warnings) for (const k of w.cells) ctx.fillRect(x0 + k.c * tw, y0 + k.r * th, tw, th);
  const dot = (x, y, s, col) => { ctx.fillStyle = col; ctx.fillRect(x0 + x / W * mw - s / 2, y0 + y / H * mh - s / 2, s, s); };
  dot(base.x, base.y, 5, '#7CFC00');
  for (const f of foes) dot(f.x, f.y, 3, '#7CFC00');
  for (const o of drones) dot(o.x, o.y, 2, '#ff8c42');
  dot(player.x, player.y, 4, '#ff5b5b');
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
  ctx.strokeRect(x0 + player.x / W * mw - 2, y0 + player.y / H * mh - 2, 4, 4);
  // khung khung nhìn camera
  const s = viewScale();
  const vx = x0 + (cam.x - cv.width / s / 2) / W * mw, vy = y0 + (cam.y - cv.height / s / 2) / H * mh;
  ctx.strokeStyle = 'rgba(255,255,255,.8)';
  ctx.strokeRect(vx, vy, cv.width / s / W * mw, cv.height / s / H * mh);
  ctx.restore();
}

// ---------- loop + boot ----------
let last = 0;
function loop(ts) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.033, (ts - last) / 1000 || 0.016); last = ts;
  if (state === 'play') update(dt);
  draw();
}
$('btnStart').onclick = () => {
  if (state === 'pause') { state = 'play'; hideAll(); }
  else if (state === 'dead') retryLevel();
  else startGame();
};
$('overlay').classList.remove('hidden');
$('ovText').innerHTML = `Bạn là <b style="color:#ff6b6b">tank đỏ</b>, phá <b style="color:#7CFC00">base xanh</b> qua 11 màn (mỗi màn 1 loại địch mới), nhặt <b>vàng + đạn</b> mua đồ.<br><br>
  <kbd>WASD</kbd> chạy • <kbd>1</kbd> minigun <kbd>2</kbd> missile <kbd>3</kbd>/<kbd>4</kbd>/<kbd>5</kbd>/<kbd>6</kbd> mở dần theo màn • <kbd>Space</kbd> bắn/đặt • <kbd>T</kbd> shop • <kbd>R</kbd> chơi lại màn`;
loadAll().then(() => { resetAll(); startLevel(0); loadSettings(); refreshShakeBtn(); fitCanvas(); requestAnimationFrame(loop); });

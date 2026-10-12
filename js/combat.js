// ================= combat.js — health block, sát thương, burn/frost =================
// Sát thương ăn từ block CUỐI còn máu. Burn đốt mọi block. Railgun tràn (cần upgrade).
function hpSum(f) { let s = 0; for (const v of f.bhp) s += v; return s; }
function syncHp(f) { f.hp = Math.round(hpSum(f) * 1000) / 1000; }
function blockRemain(f) {
  for (let i = f.bhp.length - 1; i >= 0; i--) if (f.bhp[i] > 1e-9) return f.bhp[i];
  return 0;
}
function activeBlocks(f) { let n = 0; for (const v of f.bhp) if (v > 1e-9) n++; return n; }
function deplete(f, amount) { // trừ từ block cuối còn máu, trả về số gây được
  let left = amount, dealt = 0;
  for (let i = f.bhp.length - 1; i >= 0 && left > 1e-9; i--) {
    const t = Math.min(f.bhp[i], left); f.bhp[i] -= t; left -= t; dealt += t;
  }
  syncHp(f); return dealt;
}
function healAlly(f, amount) { // +hp chia đều mọi block (medic, medbox)
  const per = amount / f.blocks.length;
  for (let i = 0; i < f.bhp.length; i++) f.bhp[i] = Math.min(f.blocks[i], f.bhp[i] + per);
  syncHp(f);
}

// Sát thương lên foe/drone. mode: block (kẹt) | pierce (tràn, railgun + upgrade) | raw (burn tự tính).
// Crit + frost-vuln áp cho mọi dmg của player (hàm này chỉ player gọi).
function damageFoe(f, dmg, mode) {
  mode = mode || 'block';
  if (f.shield > 0) { f.hit = 1; return 0; } // khiên chặn mọi sát thương
  if (f.frost && f.frost.stacks > 0) dmg *= 1 + FROST.vuln * f.frost.stacks;
  let crit = false;
  if (up.crate > 0 && Math.random() < CRIT_RATE[up.crate]) { dmg *= CRIT_MULT[up.cdmg]; crit = true; }
  let dealt = dmg;
  if (mode === 'block') dealt = Math.min(dmg, blockRemain(f));
  deplete(f, dealt); f.hit = 1;
  if (crit && dealt > 0) addFloat(f.x, f.y - 30, 'CRIT!', '#ffd75e');
  if (f.hp <= 0) {
    if (f.isDrone) {
      const i = drones.indexOf(f); if (i >= 0) drones.splice(i, 1);
      gold += GOLD_VAL.drone; score += SCORE_VAL.drone; kills++;
      addFloat(f.x, f.y, '+' + GOLD_VAL.drone, '#ffd75e', 'gold'); explode(f.x, f.y, 18);
    } else {
      const i = foes.indexOf(f); if (i >= 0) foes.splice(i, 1);
      const g = GOLD_VAL[f.kind] || 10, sc = SCORE_VAL[f.kind] || 50;
      gold += g; score += sc; kills++;
      addFloat(f.x, f.y, '+' + g, '#ffd75e', 'gold'); explode(f.x, f.y, 22);
      if (Math.random() < 0.12) pickups.push({ kind: 'medbox', x: f.x, y: f.y, t: 0 });
    }
    updateHUD();
  }
  return dealt;
}
// Đốt burn: gây dmg lên MỌI block còn máu CÙNG LÚC.
// INotFlammable (F.resist/crate/base): burn giảm 80% (0.2 -> 0.04).
function burnTickDmg(f) { return (f.notFlammable ? 0.04 : BURN.dmg) * activeBlocks(f); }
function burnInterval(stacks) { return Math.max(0.1, (BURN.interval - 0.1 * (stacks - 1)) * NAPALM_MULT[up.napalm]); }
function burnDur() { return BURN.dur * CHEM_MULT[up.chem]; }
function frostDur() { return FROST.dur * CHEM_MULT[up.chem]; }
function slowMul(o) { return (o.frost && o.frost.stacks > 0) ? 1 - FROST.slow[Math.min(5, o.frost.stacks) - 1] : 1; }

// Va chạm flamethrower.
// Nóng: chưa cháy -> 0.05 first-contact (block) + châm 1 tầng; đang cháy -> refill + thêm tầng.
// Lạnh (ColdFlame [F]): mất burn; chưa frost -> 0.85 (block) + frost 1 tầng;
//   đang frost -> refill + thêm tầng (KHÔNG gate), contact dmg 0.85 gate 1s (KHÔNG xuyên block).
function touchFlame(f) {
  f.burn = f.burn || { stacks: 0, dur: 0, tick: 0 }; // phòng foe cũ thiếu field
  f.frost = f.frost || { stacks: 0, dur: 0, cd: 0 };
  if (player.cold && up.cold) {
    f.burn.stacks = 0; f.burn.dur = 0; f.burn.tick = 0;
    if (f.frost.stacks > 0) {
      f.frost.dur = frostDur();
      if (f.frost.cd <= 0) { damageFoe(f, FROST.first, 'block'); f.frost.cd = 1.0; }
      f.frost.stacks = Math.min(5, f.frost.stacks + 1);
    } else {
      damageFoe(f, FROST.first, 'block');
      if (f.hp > 0) { f.frost.stacks = 1; f.frost.dur = frostDur(); f.frost.cd = 1.0; }
    }
  } else {
    f.frost.stacks = 0; f.frost.dur = 0;
    const cap = f.notFlammable ? 1 : BURN.max;
    if (f.burn.stacks > 0) {
      f.burn.stacks = Math.min(cap, f.burn.stacks + 1);
      f.burn.dur = burnDur();
    } else {
      damageFoe(f, FLAME.dmg, 'block');
      if (f.hp > 0) { f.burn.stacks = 1; f.burn.dur = burnDur(); f.burn.tick = burnInterval(1); }
    }
  }
}

// Lửa NÓNG lên công trình (crate/base đều INotFlammable): first-contact 0.05 + châm burn, kẹp 1 stack.
function touchStruct(s, onDeath) {
  s.burn = s.burn || { stacks: 0, dur: 0, tick: 0 };
  if (s.burn.stacks > 0) {
    s.burn.stacks = Math.min(1, s.burn.stacks + 1);
    s.burn.dur = burnDur();
  } else {
    deplete(s, Math.min(FLAME.dmg, blockRemain(s)));
    if (s.hp > 0) { s.burn.stacks = 1; s.burn.dur = burnDur(); s.burn.tick = burnInterval(1); }
  }
  if (s.hp <= 0) { onDeath(); return true; }
  return false;
}

// ---------- fx ----------
function explode(x, y, n = 14, cols = ['#ffd75e', '#ff8c42', '#ff3b3b', '#fff']) {
  for (let i = 0; i < n; i++) parts.push({ x, y, vx: rnd(-150, 150), vy: rnd(-150, 150), life: rnd(.3, .8), t: 0, c: cols[i % cols.length], s: rnd(2, 5) });
  shake = Math.min(10, shake + 3); beep(85, 0.2, 'sawtooth', 0.11);
}
function addFloat(x, y, txt, c = '#ffd75e', img = null) { floats.push({ x, y, txt, t: 0, c, img }); }

// Đạn địch vào player cũng kẹt block (vd 2dmg vào [1,1,1] chỉ mất 1).
function hurtPlayer(d = 1, pierce = false) {
  if (player.inv > 0 || !player.alive) return;
  const dealt = pierce ? d : Math.min(d, blockRemain(player));
  deplete(player, dealt);
  player.inv = 2.0; explode(player.x, player.y, 18);
  addFloat(player.x, player.y - 24, '-' + fmt(dealt) + ' ❤️', '#ff6b6b');
  if (player.hp <= 0) { player.hp = 0; player.alive = false; gameOver(); }
  updateHUD();
}
function hurtBase(d = 1, mode = 'block') { // base có block + kháng lửa + khiên + cứu 1 lần/màn
  if (!base || base.hp <= 0) return;
  if (base.shield > 0) { addFloat(base.x, base.y - 26, 'BLOCK!', '#7df9ff'); return; } // khiên negate
  const dealt = mode === 'block' ? Math.min(d, blockRemain(base)) : d;
  const lethal = base.hp - dealt <= 1e-9;
  if (lethal && !base.saved && level >= 6) {
    // triệu hồi shielder cứu base 1 lần/màn (từ sau màn xuất hiện shielder)
    base.saved = true;
    try {
      const sx = base.x + 40, sy = base.y + 50;
      foes.push(Foe.create('H', sx, sy));
    } catch (e) { foes.push(Foe.create('H', base.x, base.y + 60)); }
    base.shield = SHIELD.dur;
    addFloat(base.x, base.y - 30, 'BASE SAVED!', '#7df9ff');
    explode(base.x, base.y, 24, ['#7df9ff', '#fff']);
    log('🛡️ Base chí tử được shielder cứu (1 lần/màn)!');
    beep(600, 0.3, 'sine', 0.12);
    updateHUD();
    return; // negate dmg chí tử
  }
  deplete(base, dealt);
  explode(base.x, base.y, 16);
  addFloat(base.x, base.y - 26, 'BASE -' + fmt(d), '#7CFC00'); beep(70, 0.3, 'square', 0.12);
  updateHUD();
  if (base.hp <= 0) { base.hp = 0; levelClear(); }
}

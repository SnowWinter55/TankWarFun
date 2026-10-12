// ================= entities.js — OOP: Tank / Player / Drone / Foe =================
function makeTank(x, y, ang, speed) {
  return { x, y, ang, speed, cx: Math.floor(x / TILE), cy: Math.floor(y / TILE), hit: 0 };
}

// Tank: mọi đơn vị có HP block + burn/frost/shield.
class Tank {
  constructor(x, y, ang, speed, blocks) {
    const t = makeTank(x, y, ang, speed);
    Object.assign(this, t);
    this.blocks = blocks.slice();
    this.bhp = blocks.slice();
    this.burn = { stacks: 0, dur: 0, tick: 0 };
    this.frost = { stacks: 0, dur: 0, cd: 0 };
    this.shield = 0;
    syncHp(this); this.maxhp = this.hp;
  }
  get alive() { return this.hp > 0; }
  takeHit(dmg, mode) { return damageFoe(this, dmg, mode); } // cần upgrade pierce thì truyền 'pierce'
  heal(amount) { healAlly(this, amount); }
  tickBurn(dt) {
    const b = this.burn;
    if (!b || b.stacks <= 0) return;
    b.dur -= dt;
    if (b.dur <= 0) { b.stacks = 0; b.tick = 0; return; } // cháy hết -> chạm lửa sau tính first-contact
    b.tick -= dt;
    if (b.tick <= 0) {
      b.tick = burnInterval(b.stacks);
      damageFoe(this, burnTickDmg(this), 'raw');
      updateHUD();
    }
  }
  tickFrost(dt) {
    const fz = this.frost;
    if (!fz || fz.stacks <= 0) return;
    fz.dur -= dt;
    if (fz.cd > 0) fz.cd -= dt;
    if (fz.dur <= 0) { fz.stacks = 0; fz.dur = 0; fz.cd = 0; }
  }
  moveToward(tx, ty, mult, dt, fly = false) { // đi về phía điểm, trả về khoảng cách
    const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy) || 1;
    moveSmooth(this, dx / d * this.speed * mult, dy / d * this.speed * mult, dt, fly);
    turnTo(this, Math.atan2(dx / d, -(dy / d)), 6, dt);
    return d;
  }
}

// Player: tank đỏ 4 dạng vũ khí.
class Player extends Tank {
  constructor(x, y) {
    super(x, y, 0, PLAYER_SPEED, PLAYER_HPB[up.hp]);
    this.form = 'MIS';
    this.cd = 0; this.laserCd = 0; this.clayCd = 0; this.flameT = 0;
    this.cold = false; this.dryT = 0;
    this.mvx = 0; this.mvy = 0;
  }
  ammoText() { // chuỗi đạn cho HUD pill
    const A = ammo;
    if (this.form === 'MIS') return A.mis.rel > 0 ? ('NẠP ' + A.mis.rel.toFixed(1) + 's') : (A.mis.load + '/' + A.mis.stock + ' đạn');
    if (this.form === 'CLAY') return A.clay.rel > 0 ? ('NẠP ' + A.clay.rel.toFixed(1) + 's') : ('CLAY ' + A.clay.load + ' (+' + A.clay.stock + ')');
    if (this.form === 'FLAME') return A.flame.rel > 0 ? ('NẠP ' + A.flame.rel.toFixed(1) + 's') : ('GAS ' + A.flame.fuel.toFixed(0) + 's (+' + A.flame.tanks + '⛽)');
    if (this.form === 'RAIL') return A.rail.rel > 0 ? ('NẠP ' + A.rail.rel.toFixed(1) + 's') : (A.rail.charge + '/' + A.rail.stock + '⚡');
    return '-';
  }
}

// Drone kamikaze của weaver: bay xuyên tường, ngửi 15 tile, nổ 1 dmg.
class Drone extends Tank {
  constructor(owner, x, y) {
    super(x, y, 0, DRONE_SPEED, DRONE_HP);
    this.isDrone = true;
    this.owner = owner;
    this.wx = rnd(-1, 1); this.wy = rnd(-1, 1); this.wt = 0;
  }
  update(dt) {
    this.hit = Math.max(0, this.hit - dt * 4); this.wt -= dt;
    const osp = this.speed * slowMul(this);
    const dx = player.x - this.x, dy = player.y - this.y, d = Math.hypot(dx, dy) || 1;
    if (player.alive && d < DRONE_SIGHT) {
      moveSmooth(this, dx / d * osp, dy / d * osp, dt, true);
      turnTo(this, Math.atan2(dx, -dy), 10, dt);
      if (d < 20) { // kamikaze!
        const i = drones.indexOf(this); if (i >= 0) drones.splice(i, 1);
        explode(this.x, this.y, 24); hurtPlayer(1);
      }
    } else {
      if (this.wt <= 0) { this.wt = rnd(1, 2); const a = rnd(0, Math.PI * 2); this.wx = Math.sin(a); this.wy = Math.cos(a); }
      moveSmooth(this, this.wx * osp * 0.4, this.wy * osp * 0.4, dt, true);
    }
  }
}

// Foe base: AI chung (timers + tách nhau) + dispatch hành vi theo subclass.
class Foe extends Tank {
  constructor(kind, x, y) {
    super(x, y, Math.PI, FOE_SPEED.N, [1]);
    this.applyKind(kind);
    const cd0 = { N: rnd(2, 3), E: rnd(2, 3.5), T: rnd(1.5, 2.5), S: rnd(2.5, 3.5), W: rnd(2, 3),
      C: rnd(4, 6), F: rnd(2, 3), M: rnd(4, 6), G: rnd(3, 4), H: rnd(3, 4), V: rnd(3, 4) };
    this.cd = cd0[kind] || 2;
    this.mineCd = rnd(9, 13); this.droneCd = rnd(3, 5);
    this.airCd = rnd(6, 9); this.burst = 0; this.burstT = 0;
    this.volley = 0; this.aiming = 0;
    this.wanderT = 0; this.wx = 0; this.wy = 1; this.pauseT = 0;
  }
  applyKind(kind) { // (re)gán stat theo loại — subclass dùng để đổi loại sau super
    this.kind = kind;
    this.speed = FOE_SPEED[kind] || FOE_SPEED.N;
    const st = FOE_STATS[kind] || FOE_STATS.N;
    this.blocks = st.blocks.slice(); this.bhp = st.blocks.slice();
    this.notFlammable = (kind === 'F'); // interface INotFlammable: kháng burn
    syncHp(this); this.maxhp = this.hp;
  }
  static create(kind, x, y) { // factory: new Foe.create('E', x, y)
    const Cls = Foe.TYPES[kind] || NormalFoe;
    return new Cls(x, y);
  }
  get effSpeed() { return this.speed * slowMul(this); } // frost làm chậm
  update(dt) {
    this.cd -= dt; this.mineCd -= dt; this.droneCd -= dt;
    this.hit = Math.max(0, this.hit - dt * 4);
    if (this.shield > 0) this.shield -= dt;
    if (this.burst > 0) { // elite trả nốt viên burst thứ 2
      this.burstT -= dt;
      if (this.burstT <= 0) {
        this.burst--;
        const a = Math.atan2(player.x - this.x, -(player.y - this.y)) + rnd(-FOE_SPREAD, FOE_SPREAD);
        bullets.push({ kind: 'norm', img: 'bNorm', x: this.x + Math.sin(a) * 18, y: this.y - Math.cos(a) * 18,
          vx: Math.sin(a) * FOE_BULLET * TWIN_MULT, vy: -Math.cos(a) * FOE_BULLET * TWIN_MULT,
          ang: a, foe: true, life: 6, dmg: 1, size: 11 });
        beep(200, 0.06, 'sawtooth', 0.05);
      }
    }
    this.wanderT -= dt; this.pauseT -= dt;
    if (this.wanderT <= 0) {
      this.wanderT = rnd(1.5, 3);
      const a = rnd(0, Math.PI * 2); this.wx = Math.sin(a); this.wy = Math.cos(a);
      if (Math.random() < 0.3) this.pauseT = rnd(0.4, 1.0); // đứng ngáo cho player thở
    }
    this.behavior(dt);
  }
  behavior(dt) { /* subclass override */ }
  canSeePlayer(maxD) {
    if (!player.alive) return 0;
    const d = Math.hypot(player.x - this.x, player.y - this.y);
    return (d < (maxD || FOE_RANGE) && hasLOS(this.x, this.y, player.x, player.y)) ? d : 0;
  }
  aimAtPlayer() { this.ang = Math.atan2(player.x - this.x, -(player.y - this.y)); }
  // dí player kiểu orbit + tách đàn (dùng cho N/E/T/S/F).
  chasePlayer(dt, engage = 170) {
    const dx = player.x - this.x, dy = player.y - this.y, d = Math.hypot(dx, dy) || 1;
    if (this.pauseT > 0 || !player.alive) return d;
    let mx, my;
    if (d > engage) { mx = dx / d * 0.8 + this.wx * 0.35; my = dy / d * 0.8 + this.wy * 0.35; }
    else if (d < 110) { mx = -dx / d * 0.5 + this.wx * 0.4; my = -dy / d * 0.5 + this.wy * 0.4; }
    else { mx = -dy / d * 0.55 + this.wx * 0.3; my = dx / d * 0.55 + this.wy * 0.3; }
    const ml = Math.hypot(mx, my);
    if (ml > 0.05) {
      mx /= ml; my /= ml;
      for (const o of foes) {
        if (o === this) continue;
        const sx = this.x - o.x, sy = this.y - o.y, sd = Math.hypot(sx, sy);
        if (sd > 0 && sd < 40) { mx += sx / sd * 0.7; my += sy / sd * 0.7; }
      }
      const m2 = Math.hypot(mx, my) || 1;
      moveSmooth(this, mx / m2 * this.effSpeed, my / m2 * this.effSpeed, dt);
      turnTo(this, Math.atan2(mx / m2, -(my / m2)), 6, dt);
    }
    return d;
  }
  tryShoot() {
    const d = this.canSeePlayer();
    if (this.cd <= 0 && d) { this.aimAtPlayer(); foeShoot(this); }
    return d;
  }
}
Foe.TYPES = {}; // subclass tự đăng ký ở foes.js

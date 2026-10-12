// ================= foes.js — 12 subclass địch, mỗi loại 1 behavior =================
function weakestAlly(f) { // đồng đội yếu máu nhất (medic tìm)
  let best = null, bs = 2;
  for (const o of foes) {
    if (o === f) continue;
    const s = o.hp / o.maxhp;
    if (s < bs) { bs = s; best = o; }
  }
  return best;
}

class NormalFoe extends Foe {
  constructor(x, y) { super('N', x, y); }
  behavior(dt) {
    this.chasePlayer(dt);
    this.tryShoot();
    if (this.kind === 'E' && this.mineCd <= 0) this.layMine();
  }
  layMine() {
    if (dropMine(this.cx, this.cy)) { this.mineCd = rnd(9, 13); addFloat(this.x, this.y - 22, 'đặt mìn!', '#ffb3b3'); }
    else this.mineCd = 2;
  }
}
class EliteFoe extends NormalFoe {
  constructor(x, y) { super(x, y); this.applyKind('E'); this.cd = rnd(2, 3.5); }
}
class TwinFoe extends Foe {
  constructor(x, y) { super('T', x, y); }
  behavior(dt) { this.chasePlayer(dt); this.tryShoot(); }
}
class ShotgunFoe extends Foe {
  constructor(x, y) { super('S', x, y); }
  behavior(dt) { this.chasePlayer(dt, 200); this.tryShoot(); } // shotgun thích áp sát hơn
}
class FireResistFoe extends Foe { // tank thường nhưng chỉ 1 block -> kháng lửa
  constructor(x, y) { super('F', x, y); }
  behavior(dt) { this.chasePlayer(dt); this.tryShoot(); }
}
class WeaverFoe extends Foe { // giữ khoảng cách + né missile + thả drone (tối đa 2)
  constructor(x, y) { super('W', x, y); }
  behavior(dt) {
    const dx = player.x - this.x, dy = player.y - this.y, d = Math.hypot(dx, dy) || 1;
    let mx = 0, my = 0;
    if (this.pauseT <= 0 && player.alive) {
      if (d < TILE * 6) { mx = -dx / d; my = -dy / d; }                    // chạy trốn tank đỏ
      else if (d > TILE * 10) { mx = dx / d * 0.6; my = dy / d * 0.6; }    // xa quá thì lại gần tí
      else { mx = -dy / d * 0.5 + this.wx * 0.4; my = dx / d * 0.5 + this.wy * 0.4; }
      for (const b of bullets) { // né đạn dí
        if (b.kind === 'mis' && !b.foe && b.chasing && Math.hypot(b.x - this.x, b.y - this.y) < TILE * 2.5) {
          const px = -(b.vy), py = b.vx, pl = Math.hypot(px, py) || 1;
          const s = ((this.x - b.x) * px + (this.y - b.y) * py) > 0 ? 1 : -1;
          mx += px / pl * 1.4 * s; my += py / pl * 1.4 * s;
        }
      }
      const ml = Math.hypot(mx, my);
      if (ml > 0.05) {
        mx /= ml; my /= ml;
        moveSmooth(this, mx * this.effSpeed, my * this.effSpeed, dt);
        turnTo(this, Math.atan2(mx, -my), 6, dt);
      }
    }
    if (this.droneCd <= 0) {
      const mine = drones.filter(o => o.owner === this).length;
      if (mine < 2) {
        drones.push(new Drone(this, this.x, this.y));
        addFloat(this.x, this.y - 20, 'thả drone!', '#ffb3b3'); beep(300, 0.1, 'sine', 0.06);
      }
      this.droneCd = rnd(5, 7);
    }
    this.tryShoot();
  }
}
class CallerFoe extends Foe { // giữ khoảng cách, gọi không kích 5 ô
  constructor(x, y) { super('C', x, y); }
  behavior(dt) {
    const dx = player.x - this.x, dy = player.y - this.y, d = Math.hypot(dx, dy) || 1;
    if (this.pauseT <= 0 && player.alive) {
      let mx = this.wx * 0.4, my = this.wy * 0.4;
      if (d < TILE * 6) { mx += -dx / d; my += -dy / d; }
      else if (d > TILE * 12) { mx += dx / d * 0.6; my += dy / d * 0.6; }
      else { mx += -dy / d * 0.4; my += dx / d * 0.4; }
      const ml = Math.hypot(mx, my);
      if (ml > 0.05) {
        mx /= ml; my /= ml;
        moveSmooth(this, mx * this.effSpeed, my * this.effSpeed, dt);
        turnTo(this, Math.atan2(mx, -my), 6, dt);
      }
    }
    if (this.cd <= 0 && player.alive && d < TILE * 16) callStrike(this);
  }
}
class MedicFoe extends Foe { // bám đồng đội yếu nhất, bắn heal 3x3, không bắn thường
  constructor(x, y) { super('M', x, y); }
  behavior(dt) {
    const tgt = weakestAlly(this);
    if (tgt) {
      const tx = tgt.x - this.x, ty = tgt.y - this.y, td = Math.hypot(tx, ty) || 1;
      if (this.pauseT <= 0) {
        let mx = 0, my = 0;
        if (td > TILE * 5) { mx = tx / td; my = ty / td; }
        else { mx = -ty / td * 0.4 + this.wx * 0.4; my = tx / td * 0.4 + this.wy * 0.4; }
        const ml = Math.hypot(mx, my);
        if (ml > 0.05) {
          mx /= ml; my /= ml;
          moveSmooth(this, mx * this.effSpeed, my * this.effSpeed, dt);
          turnTo(this, Math.atan2(mx, -my), 6, dt);
        }
      }
      if (this.cd <= 0 && td < TILE * 13) { this.ang = Math.atan2(tx, -ty); fireHealOrb(this, tgt); }
    } else if (player.alive && this.pauseT <= 0) { // không còn đồng đội: lảng ra xa
      const dx = player.x - this.x, dy = player.y - this.y, d = Math.hypot(dx, dy) || 1;
      if (d < TILE * 6) moveSmooth(this, -dx / d * this.effSpeed, -dy / d * this.effSpeed, dt);
    }
  }
}
class ShielderFoe extends Foe { // chỗ an toàn, buff khiên 2.5s cho đồng đội gần player nhất
  constructor(x, y) { super('H', x, y); }
  behavior(dt) {
    let ally = null, bd = 1e9;
    for (const o of foes) {
      if (o === this) continue;
      const dd = Math.hypot(player.x - o.x, player.y - o.y);
      if (dd < bd) { bd = dd; ally = o; }
    }
    if (!ally) ally = this;
    if (this.pauseT <= 0 && player.alive) {
      const dx = player.x - this.x, dy = player.y - this.y, d = Math.hypot(dx, dy) || 1;
      let mx = this.wx * 0.5, my = this.wy * 0.5;
      if (d < TILE * 6) { mx += -dx / d; my += -dy / d; }
      const ax = ally.x - this.x, ay = ally.y - this.y, ad = Math.hypot(ax, ay) || 1;
      if (ad > TILE * 6) { mx += ax / ad * 0.6; my += ay / ad * 0.6; }
      const ml = Math.hypot(mx, my);
      if (ml > 0.05) {
        mx /= ml; my /= ml;
        moveSmooth(this, mx * this.effSpeed, my * this.effSpeed, dt);
        turnTo(this, Math.atan2(mx, -my), 6, dt);
      }
    }
    const ad2 = Math.hypot(ally.x - this.x, ally.y - this.y);
    if (this.cd <= 0 && ad2 < TILE * 14) {
      this.ang = Math.atan2(ally.x - this.x, -(ally.y - this.y));
      fireShieldOrb(this, ally);
    }
  }
}
class RailgunFoe extends Foe { // tìm chỗ an toàn, foreswing 1s hiện aim, bắn xuyên tường
  constructor(x, y) { super('G', x, y); }
  behavior(dt) {
    const dx = player.x - this.x, dy = player.y - this.y, d = Math.hypot(dx, dy) || 1;
    if (this.aiming > 0) { // đang ngắm: đứng yên, hướng LOCK từ lúc bắt đầu (không bám player)
      this.aiming -= dt;
      if (this.aiming <= 0) foeRailFire(this);
    } else {
      if (this.pauseT <= 0 && player.alive) {
        let mx = this.wx * 0.4, my = this.wy * 0.4;
        if (d < TILE * 7) { mx += -dx / d; my += -dy / d; }
        else if (d > TILE * 14 || !hasLOS(this.x, this.y, player.x, player.y)) { mx += dx / d * 0.7; my += dy / d * 0.7; }
        else { mx += -dy / d * 0.5; my += dx / d * 0.5; }
        const ml = Math.hypot(mx, my);
        if (ml > 0.05) {
          mx /= ml; my /= ml;
          moveSmooth(this, mx * this.effSpeed, my * this.effSpeed, dt);
          turnTo(this, Math.atan2(mx, -my), 5, dt);
        }
      }
      if (this.cd <= 0 && player.alive && d > TILE * 5 && d < FOE_RAIL.range && hasLOS(this.x, this.y, player.x, player.y)) {
        this.aiming = FOE_RAIL.aim; this.ang = Math.atan2(dx, -dy);
        beep(880, 0.4, 'sawtooth', 0.08); addFloat(this.x, this.y - 22, 'NGẮM!', '#ff6b6b');
      }
    }
  }
}
class RailgunEliteFoe extends RailgunFoe { // như railgun + xuyên block player + dmg ×2 + máu elite
  constructor(x, y) { super(x, y); this.applyKind('V'); }
}
Foe.TYPES = { N: NormalFoe, E: EliteFoe, T: TwinFoe, S: ShotgunFoe, W: WeaverFoe,
  C: CallerFoe, F: FireResistFoe, M: MedicFoe, G: RailgunFoe, H: ShielderFoe, V: RailgunEliteFoe };

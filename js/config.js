// ================= config.js — mọi hằng số game chỉnh ở đây =================
const TILE = 32, COLS = 42, ROWS = 28, W = COLS * TILE, H = ROWS * TILE;

// Tốc độ (tile/s quy ra px). Player nhanh gấp đôi bot để dễ thở.
const PLAYER_SPEED = TILE * 3.4;
const FOE_SPEED = { N: TILE * 1.25, E: TILE * 1.55, T: TILE * 1.4, S: TILE * 1.1,
  W: TILE * 1.7, C: TILE * 1.3, F: TILE * 1.25, M: TILE * 1.2, G: TILE * 1.0,
  H: TILE * 1.4, V: TILE * 1.0 };
const DRONE_SPEED = TILE * 2.6 * 1.35; // weaver drone nhanh hơn 35%
const DRONE_SIGHT = TILE * 15;   // drone ngửi thấy bạn trong 15 tile

// Missile: bay thẳng 4 tile/s, dí còn nửa (2 tile/s), khóa trong 2 tile.
const MIS_PX = TILE * 4, MIS_CHASE_PX = TILE * 2, MIS_LOCK_R = TILE * 2;
// Railgun player: firerate 5s, 1 bắn 80⚡, pin 300, nạp 0.5s.
const LASER_RELOAD = 5.0, RAIL_COST = 80, RAIL_BAT = 300, RAIL_RELOAD = 0.5;
// Minigun: ray vàng 1px, 0.1dmg/đạn, firerate 0.1s, mag 60, chung kho missile (1 đạn missile = 20 viên minigun), nạp 3s.
const MINI = { dmg: 0.1, rate: 0.1, load: 60, reload: 3.0 };
const MINI_PER_MIS = 20;
const MINI_MAG = [60, 80, 100, 120, 140]; // Monstrous Magazine lvl0-4
const RAPID_CHANCE = [0, 0.1, 0.2, 0.3, 0.4, 0.5]; // Rapid Fire: tỉ lệ double dmg lvl0-5
const RAPID_RATE = [0.1, 0.09, 0.08, 0.07, 0.06, 0.05]; // Rapid Fire: tốc đánh lvl0-5
const CALIBER_PIERCE = [0, 0.1, 0.2, 0.3, 0.4, 0.5]; // Massive Caliber lvl0-5
const IGNIT_TIME = [1e9, 4, 3.5, 3, 2.5]; // Ignitous Acceleration: giữ cò liên tục
const IGNIT_DMG = [0, 0.1, 0.15, 0.2, 0.25];
// Tesla: tầm 5 tile, 5⚡/tase, 0.4dmg, không firerate (tick cố định), nạp 3s.
const TESLA = { dmg: 0.4, range: TILE * 5, cost: 5, reload: 3.0, tick: 0.15, chainR: TILE * 3, chainBase: 2 };
const TESLA_FALL = [0.30, 0.25, 0.20, 0.15, 0.10]; // Malconductive: hao phí chain mỗi nấc
const BALL = { chance: [0, 0.24, 0.36, 0.48], dur: [0, 3, 4, 5], radius: [0, TILE * 2, TILE * 2.5, TILE * 3],
  max: [0, 1, 2, 3], tick: [0.4, 0.4, 0.3, 0.2], dmg: 0.4 };
// Đạn dược: missile 1 đạn/phát, load 80, nạp 3s • clay 1/load nạp 4s • gas 20s nạp 5s.
const MIS_LOAD = 80, MIS_RELOAD = 3.0, CLAY_RELOAD = 4.0;
const FLAME_TANK = 20, FLAME_RELOAD = 5.0;
const MINE_BLINK = 0.5;          // mìn chớp 2 ảnh mỗi 0.5s

// Bot bắn: tầm, cooldown, độ lệch, tốc đạn.
const FOE_RANGE = TILE * 11;
const FOE_CD = { N: 3.0, E: 3.4, T: 2.2, S: 3.8, W: 2.5, F: 3.0 };
const FOE_SPREAD = 0.22, FOE_BULLET = TILE * 2.8;
const TWIN_MULT = 3;             // twinbarrel nhanh gấp 3 đạn thường
const TWIN_DMG = 0.8, SHOT_DMG = 0.5, EMP_DMG = 0.6;
const MAX_FOES = 12, ELITE_CHANCE = 0.22;

// Claymore: nón trước mặt (Clairvoyance), R=2 tile, nổ mặc định 3dmg, tối đa 4 cái.
// KHÔNG có upgrade tăng dmg — chỉ upgrade cơ chế.
const CLAY = { max: 4, range: TILE * 2, dmg: 3.0 };
const CLAIR_DEG = [75, 90, 110, 140, 180, 220]; // tổng góc nón theo lvl
const FATAL_RATE = [0, 0.005, 0.01, 0.015, 0.02, 0.025]; // tỉ lệ 999999999dmg xuyên block
const SHRAP_N = [0, 2, 4, 6, 9]; // số mảnh vỡ mỗi lần nổ
const SHRAP_DMG = 0.8, SHRAP_LIFE = 40; // mảnh bay 1-5 tile trong 40s rồi despawn
// Flamethrower theo flamethrower.md: size 12px, xa dần, xòe dần. 0.05/first-contact.
const FLAME = { dmg: 0.05, tick: 0.05, life: 0.45,
  parts: [{ img: 'flame1', dist: 30, spr: 0.00 }, { img: 'flame2', dist: 36, spr: 0.01 },
          { img: 'flame3', dist: 125, spr: 0.03 }, { img: 'flame4', dist: 175, spr: 0.07 },
          { img: 'flame5', dist: 250, spr: 0.10 }] };
// Burn: 0.2/tick/0.5s trong 3s, stack tối đa 5, mỗi tầng -0.1s interval (min 0.1s).
const BURN = { dmg: 0.2, interval: 0.5, dur: 3.0, max: 5 };
const NAPALM_MULT = [1, 0.85, 0.70, 0.50, 0.25];
const CHEM_MULT = [1, 1.25, 1.5, 1.75, 2.0, 2.5];
// ColdFlame: frost 5 stack, slow/tầng, 7s, first-contact 0.85 gate 1s, vuln 10%/tầng.
const FROST = { dur: 7.0, first: 0.85, slow: [0.35, 0.5, 0.65, 0.8, 0.95], vuln: 0.1 };

// Health block từng loại địch: mảng hp mỗi block.
// Sát thương thường kẹt ở block cuối còn máu; burn đốt mọi block; railgun xuyên (cần upgrade).
const FOE_STATS = {
  N: { blocks: [1, 1, 1] }, E: { blocks: [3, 2, 2] }, T: { blocks: [1, 1, 1] },
  S: { blocks: [2, 1, 1] }, W: { blocks: [1, 1, 1] }, C: { blocks: [1, 1, 1] },
  F: { blocks: [3] }, M: { blocks: [1, 1, 1] }, G: { blocks: [2, 2, 1] },
  H: { blocks: [1, 1, 1] }, V: { blocks: [3, 2, 2] }, // railgun elite = archetype elite
};
const DRONE_HP = [1, 1];
const GOLD_VAL = { N: 15, E: 25, T: 30, S: 35, W: 50, C: 30, F: 20, M: 40,
  G: 45, H: 35, V: 60, drone: 10 };
const SCORE_VAL = { N: 50, E: 80, T: 60, S: 60, W: 100, C: 60, F: 40, M: 100,
  G: 90, H: 70, V: 120, drone: 20 };

// Caller không kích: 5 ô, cảnh báo 1.5s, nổ = 1 dmg (bằng landmine), nạp 5s.
const AIR = { tiles: 5, warn: 1.5, cd: 5, dmg: 1 };
// Medic: hồi 1hp chia đều block cho 3x3 tile, nạp 4s, đạn bay 15 tile/s.
const MEDIC = { cd: 4.0, heal: 1, radius: TILE * 1.5, orbSpeed: TILE * 15 };
// Railgun địch: nạp 6s, xuyên địa hình 100%, range vô hạn (như player), foreswing 1s.
const FOE_RAIL = { cd: 6.0, aim: 1.0, dmg: 1.5, range: 2600 };
// Shielder: nạp 5s, khiên chặn mọi dmg 2.5s.
const SHIELD = { cd: 5.0, dur: 2.5 };

// Level: mỗi màn debut 1 loại địch (fireresist sau shielder).
const LEVELS = [
  { name: 'Làm quen',     baseHP: 4,  maxAlive: 4,  spawn: [2.5, 4],   comp: { N: 6 },                                                    crates: 40, bricks: 12, bonus: 100 },
  { name: 'Elite',        baseHP: 5,  maxAlive: 6,  spawn: [2, 3.5],   comp: { N: 6, E: 3 },                                              crates: 42, bricks: 13, bonus: 130 },
  { name: 'Nòng đôi',     baseHP: 5,  maxAlive: 8,  spawn: [2, 3.5],   comp: { N: 6, E: 3, T: 3 },                                        crates: 44, bricks: 14, bonus: 150 },
  { name: 'Shotgun',      baseHP: 6,  maxAlive: 8,  spawn: [2, 3],     comp: { N: 6, E: 3, T: 2, S: 2 },                                  crates: 44, bricks: 14, bonus: 170 },
  { name: 'Thợ dệt',      baseHP: 6,  maxAlive: 9,  spawn: [1.8, 3],   comp: { N: 6, E: 3, T: 2, S: 2, W: 2 },                             crates: 46, bricks: 15, bonus: 190 },
  { name: 'Khiên',        baseHP: 7,  maxAlive: 10, spawn: [1.8, 3],   comp: { N: 6, E: 3, T: 2, S: 2, W: 1, H: 2 },                       crates: 46, bricks: 15, bonus: 210 },
  { name: 'Chống cháy',   baseHP: 7,  maxAlive: 10, spawn: [1.6, 2.8], comp: { N: 5, E: 3, T: 2, S: 2, W: 1, H: 1, F: 3 },                 crates: 48, bricks: 16, bonus: 230 },
  { name: 'Quân y',       baseHP: 8,  maxAlive: 11, spawn: [1.6, 2.8], comp: { N: 5, E: 3, T: 2, S: 2, W: 1, H: 1, F: 2, M: 2 },           crates: 48, bricks: 16, bonus: 250 },
  { name: 'Không kích',   baseHP: 8,  maxAlive: 11, spawn: [1.5, 2.6], comp: { N: 5, E: 3, T: 2, S: 2, W: 1, H: 1, F: 2, M: 1, C: 2 },     crates: 48, bricks: 16, bonus: 270 },
  { name: 'Railgun địch', baseHP: 10, maxAlive: 12, spawn: [1.4, 2.4], comp: { N: 5, E: 3, T: 2, S: 2, W: 1, H: 1, F: 2, M: 1, C: 1, G: 2 }, crates: 50, bricks: 16, bonus: 320 },
  { name: 'Railgun Elite', baseHP: 12, maxAlive: 12, spawn: [1.2, 2.2], comp: { N: 5, E: 3, T: 2, S: 2, W: 1, H: 1, F: 2, M: 1, C: 1, G: 1, V: 2 }, crates: 50, bricks: 16, bonus: 380 },
];
const UNLOCK_LEVEL = { mini: -1, clay: 1, flame: 5, tesla: 7, rail: 9 }; // mini starter; tesla phá màn 8 mở
const UNLOCK_NAME = { mini: '🔫 MINIGUN [1]', clay: '💥 CLAYMORE [3]', flame: '🔥 FLAMETHROWER [4]', tesla: '⚡ TESLA [5]', rail: '🔆 LAZER [6]' };

// Missile upgrade: số lượng -> dmg/quả; firerate; railgun charge/pierce.
const MIS_COUNT_DMG = { 1: 1.0, 2: 0.5, 3: 0.33, 4: 0.25 };
const MIS_DMG_MUL = [1, 1.25, 1.5, 1.75];
const MIS_FIRERATE = [1.0, 0.9, 0.8, 0.7, 0.6, 0.47, 0.33, 0.2, 0.07]; // idx6=0.33 lock, idx8 chỉ cheat oldmissile
const MIS_REL_MAX = 6;
const RAIL_PIERCE = [0, 0.5, 0.75, 1.0];
const RAIL_MUL = [1, 3, 6, 10, 17, 28, 40]; // Electrocharged lvl0-6

// Characteristic: base player [0.5,0.5]=1hp.
const PLAYER_HPB = [[0.5, 0.5], [1, 1], [1, 1, 1], [1.5, 1.5, 1], [2, 2, 1]];
const FRATE_MULT = [1, 0.9, 0.85, 0.8, 0.75];
const CRIT_RATE = [0, 0.1, 0.2, 0.3];
const CRIT_MULT = [2, 2.5, 3, 3.5, 4, 5];
const RELOAD_MULT = [1, 0.9, 0.8, 0.7, 0.6, 0.5];
const STOR = { // kho đạn [lvl0..4]: missile / clay / gas / pin (bình 300⚡)
  mis: [300, 700, 1200, 1800, 2500],
  clay: [12, 25, 50, 80, 120],
  gas: [4, 8, 15, 40, 70],
  bat: [4, 8, 15, 35, 60] };

// Đường dẫn asset.
const P = p => encodeURI(p);
const IMG = {
  grass:  P('asset/tank/grasstile2.png'),
  dirt:   P('asset/dirt and crate/dirttile.png'),
  mud:    P('asset/tank/mudtile.png'),
  crate:  P('asset/dirt and crate/crate.png'),
  brick:  P('asset/tank/palebricktile(veryUninterested).png'),
  base:   P('asset/tank/redbaseonpalebricktile.png'), // tint xanh lúc vẽ
  redMis: P('asset/tank/redtankmissile.png'),
  redMini: P('asset/tank/redtankminigun.png'),
  redTesla: P('asset/tank/redtanktesla.png'),
  redRail: P('asset/tank/redtankrailgun.png'),
  redClay: P('asset/tank/redtankclaymore.png'),
  redFlame: P('asset/tank/redtankflamethrower.png'),
  grn:    P('asset/tank/greentank.png'),
  grnE:   P('asset/tank/greentankelite.png'),
  foeT:   P('asset/tank/greentanktwinbarrel.png'),
  foeS:   P('asset/tank/greentankshotgun.png'),
  foeW:   P('asset/tank/greentankweaver.png'),
  foeC:   P('asset/tank/greentankcaller.png'),
  foeF:   P('asset/tank/greentankfireresist.png'),
  foeM:   P('asset/tank/greentankmedic.png'),
  foeG:   P('asset/tank/greentankrailgun.png'),
  foeV:   P('asset/tank/greentankrailgunelite.png'),
  foeH:   P('asset/tank/greentankshielder.png'),
  drone:  P('asset/tank/drone.png'),
  bNorm:  P('asset/tank/normalbullet.png'),
  bMis:   P('asset/tank/missilebullet.png'),
  bSmall: P('asset/tank/missilesmall.png'),
  bRail:  P('asset/tank/plasmarailbullet.png'),
  bTherm: P('asset/tank/thermalrailgunbullet.png'),
  mine1:  P('asset/tank/landmine1.png'),
  mine2:  P('asset/tank/landmine2.png'),
  clay1:  P('asset/tank/claymore1.png'),
  clay2:  P('asset/tank/claymore2.png'),
  flame1: P('asset/tank/flameparticle1.png'),
  flame2: P('asset/tank/flameparticle2.png'),
  flame3: P('asset/tank/flameparticle3.png'),
  flame4: P('asset/tank/flameparticle4.png'),
  flame5: P('asset/tank/flameparticle5.png'),
  burn:   P('asset/tank/burneffect.png'),
  frost:  P('asset/tank/frostburneffect.png'),
  gold:   P('asset/tank/gold.png'),
  med:    P('asset/tank/allymedbox.png'),
  ammMis: P('asset/tank/allyammobox.png'),
  ammClay: P('asset/tank/allyclaymorebox.png'),
  ammGas: P('asset/tank/allyfuelbox.png'),
  ammBat: P('asset/tank/allychargebox.png'),
  warnT:  P('asset/tank/warningtileoverlay_nobg.png'),
  boomT:  P('asset/tank/explosionoverlaytile_nobg.png'),
  shieldFx: P('asset/tank/shielding_nobg.png'),
  upIcon: P('asset/tank/upgradeicon.png'),
};

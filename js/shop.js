// ================= shop.js — 3 tab: vũ khí + đặc tính + đạn dược =================
const SHOP = [
  { id: 'caliber', tab: 'W', cat: '🔫 MINIGUN [1]', name: 'Massive Caliber', desc: 'Xuyên wall/tank/crate: 0 → 10% → 20% → 30% → 40% → 50%.', cost: () => [150, 220, 300, 400, 500][up.caliber],
    avail: () => (up.caliber || 0) < 5, buy: () => { up.caliber++; }, pips: () => [up.caliber, 5] },
  { id: 'ignit', tab: 'W', cat: '🔫 MINIGUN [1]', name: 'Ignitous Acceleration', desc: 'Xả liên tục 4s/3.5s/3s/2.5s (dừng là tích lại): mỗi hit +1 burn stack kèm +0.1/0.15/0.2/0.25dmg on-hit.', cost: () => [180, 260, 360, 480][up.ignit],
    avail: () => (up.ignit || 0) < 4, buy: () => { up.ignit++; }, pips: () => [up.ignit, 4] },
  { id: 'mag', tab: 'W', cat: '🔫 MINIGUN [1]', name: 'Monstrous Magazine', desc: 'Magazine: 60 → 80 → 100 → 120 → 140 viên (1 đạn missile = 20 viên).', cost: () => [160, 240, 340, 460][up.mag],
    avail: () => (up.mag || 0) < 4, buy: () => { up.mag++; ammo.mini.load = Math.min(miniMag(), ammo.mini.load + 20); }, pips: () => [up.mag, 4] },
  { id: 'rapid', tab: 'W', cat: '🔫 MINIGUN [1]', name: 'Rapid Fire', desc: 'Tỉ lệ double dmg 10%/20%/30%/40%/50%, tốc đánh 0.09s/0.08s/0.07s/0.06s/0.05s.', cost: () => [170, 250, 350, 470, 600][up.rapid],
    avail: () => (up.rapid || 0) < 5, buy: () => { up.rapid++; }, pips: () => [up.rapid, 5] },
  { id: 'multi', tab: 'W', cat: '🚀 MISSILE [2]', name: 'Multimissile', desc: '1 quả ×1.0 → 2 quả ×0.5 mỗi quả, firerate 1s. Mở khóa nhánh nâng cấp.', cost: () => 80,
    avail: () => !up.multi, buy: () => { up.multi = true; } },
  { id: 'cnt', tab: 'W', cat: '🚀 MISSILE [2]', name: 'Multimissile+', desc: '3 quả ×0.33 → 4 quả ×0.25 (tối đa). Mỗi phát chỉ tốn 1 đạn.', cost: () => [120, 200][up.cnt],
    avail: () => up.multi && up.cnt < 2, buy: () => { up.cnt++; }, pips: () => [up.cnt, 2] },
  { id: 'mdmg', tab: 'W', cat: '🚀 MISSILE [2]', name: 'Compound Explosive', desc: '+25% → +50% → +75% dmg mỗi quả.', cost: () => [100, 160, 240][up.dmg],
    avail: () => up.multi && up.dmg < 3, buy: () => { up.dmg++; }, pips: () => [up.dmg, 3] },
  { id: 'rel', tab: 'W', cat: '🚀 MISSILE [2]', name: 'Tactical Launchpad', desc: 'Firerate 1.0 → … → 0.33s/phát.', cost: () => [60, 90, 120, 160, 220, 300][up.rel],
    avail: () => up.rel < MIS_REL_MAX, buy: () => { up.rel++; }, pips: () => [up.rel, MIS_REL_MAX] },
  { id: 'clair', tab: 'W', cat: '💥 CLAYMORE [3]', name: 'Clairvoyance', desc: 'Nón tìm địch: 75° → 90° → 110° → 140° → 180° → 220°.', cost: () => [120, 180, 260, 360, 500][up.clair],
    avail: () => up.clay && up.clair < 5, buy: () => { up.clair++; }, pips: () => [up.clair, 5] },
  { id: 'fatal', tab: 'W', cat: '💥 CLAYMORE [3]', name: 'Fatality', desc: 'Tỉ lệ gây 999999999 xuyên block: 0 → 0.5% → 1% → 1.5% → 2% → 2.5%.', cost: () => [150, 220, 300, 400, 500][up.fatal],
    avail: () => up.clay && up.fatal < 5, buy: () => { up.fatal++; }, pips: () => [up.fatal, 5] },
  { id: 'shrap', tab: 'W', cat: '💥 CLAYMORE [3]', name: 'Shrapnel', desc: 'Nổ văng mảnh 0.8dmg: 0 → 2 → 4 → 6 → 9 mảnh, bay 1-5 tile, tồn tại 40s.', cost: () => [130, 200, 290, 400][up.shrap],
    avail: () => up.clay && up.shrap < 4, buy: () => { up.shrap++; }, pips: () => [up.shrap, 4] },
  { id: 'psi', tab: 'W', cat: '💥 CLAYMORE [3]', name: 'Psionic Amplify', desc: 'Tăng tầm nổ: +0 → +1 → +2 tile.', cost: () => [140, 220][up.psi],
    avail: () => up.clay && up.psi < 2, buy: () => { up.psi++; }, pips: () => [up.psi, 2] },
  { id: 'napalm', tab: 'W', cat: '🔥 FLAME [4]', name: 'Napalm', desc: 'Burn tick nhanh hơn: interval -15% → -30% → -50% → -75%.', cost: () => [150, 220, 300, 420][up.napalm],
    avail: () => up.flame && up.napalm < 4, buy: () => { up.napalm++; }, pips: () => [up.napalm, 4] },
  { id: 'cold', tab: 'W', cat: '🔥 FLAME [4]', name: 'ColdFlame', desc: 'Bật/tắt bằng [F] trong dạng flame: mất burn, gây frostburn (chậm tới 95%, địch chịu +50% dmg).', cost: () => 250,
    avail: () => up.flame && !up.cold, buy: () => { up.cold = true; } },
  { id: 'chem', tab: 'W', cat: '🔥 FLAME [4]', name: 'Ignitious Chemical', desc: 'Effect lâu hơn: +25% → +50% → +75% → +100% → +150% thời lượng.', cost: () => [100, 150, 200, 280, 380][up.chem],
    avail: () => up.flame && up.chem < 5, buy: () => { up.chem++; }, pips: () => [up.chem, 5] },
  { id: 'high', tab: 'W', cat: '⚡ TESLA [5]', name: 'High Current', desc: 'Chain limit: 2 → 3 → 4 → 5 kẻ địch (trong 3 ô, mỗi nấc -30%/falloff).', cost: () => [150, 240, 350][up.high],
    avail: () => up.tesla && (up.high || 0) < 3, buy: () => { up.high++; }, pips: () => [up.high, 3] },
  { id: 'malcond', tab: 'W', cat: '⚡ TESLA [5]', name: 'Malconductive Current', desc: 'Giảm hao phí chain: mỗi nấc -30% → -25% → -20% → -15% → -10% dmg.', cost: () => [120, 180, 260, 360][up.malcond],
    avail: () => up.tesla && (up.malcond || 0) < 4, buy: () => { up.malcond++; }, pips: () => [up.malcond, 4] },
  { id: 'ball', tab: 'W', cat: '⚡ TESLA [5]', name: 'Ball Lightning', desc: 'Địch chết bởi tesla: 24%/36%/48% để lại sét hòn 3s/4s/5s, r=2/2.5/3 tile, giật 1/2/3 địch 0.4dmg mỗi 0.4s/0.3s/0.2s.', cost: () => [200, 320, 480][up.ball],
    avail: () => up.tesla && (up.ball || 0) < 3, buy: () => { up.ball++; }, pips: () => [up.ball, 3] },
  { id: 'smart', tab: 'W', cat: '⚡ TESLA [5]', name: 'Smart Targeting', desc: 'Primary target bỏ qua Shielder (ưu tiên: địch khác > shielder > obstacle). Chain vẫn có thể lan dính shielder.', cost: () => 250,
    avail: () => up.tesla && !up.smart, buy: () => { up.smart = true; } },
  { id: 'pierce', tab: 'W', cat: '🔆 LAZER [6]', name: 'High Frequency', desc: '50% → 75% → 100% bắn xuyên tường gạch (không phá tường).', cost: () => [120, 200, 300][up.pierce],
    avail: () => up.rail && up.pierce < 3, buy: () => { up.pierce++; }, pips: () => [up.pierce, 3] },
  { id: 'charge', tab: 'W', cat: '🔆 LAZER [6]', name: 'Electrocharged', desc: 'Dmg 1 → 3 → 6 → 10 → 17 → 28 → 40 (lên static chỉ 50%, base có thể one-shot). 1 bắn tốn 80⚡.', cost: () => [120, 200, 300, 420, 560, 700][up.charge],
    avail: () => up.rail && up.charge < 6, buy: () => { up.charge++; }, pips: () => [up.charge, 6] },
  { id: 'bpierce', tab: 'W', cat: '🔆 LAZER [6]', name: 'Phased Frequency', desc: 'Lazer tràn qua các block (vd 10dmg vào 4|4|4|4|4 còn 4|4|2|0|0). Chưa mua thì kẹt block như đạn thường.', cost: () => 200,
    avail: () => up.rail && !up.bpierce, buy: () => { up.bpierce = true; } },
  { id: 'hp', tab: 'C', cat: '🧬 ĐẶC TÍNH', name: 'Tactical Armor', desc: 'Block máu: [0.5,0.5] → [1,1] → [1,1,1] → [1.5,1.5,1] → [2,2,1] (tổng 1→2→3→4→5hp). Mua là morph block + hồi phần tăng thêm.', cost: () => [100, 180, 280, 400][up.hp],
    avail: () => up.hp < 4,
    buy: () => {
      const oldMax = player.maxhp, oldHp = player.hp;
      up.hp++;
      const nb = PLAYER_HPB[up.hp], nm = playerMaxHp();
      player.blocks = nb.slice(); player.bhp = nb.slice(); player.maxhp = nm;
      deplete(player, Math.max(0, nm - Math.min(nm, oldHp + (nm - oldMax)))); // giữ máu cũ + hồi phần tăng
    }, pips: () => [up.hp, 4] },
  { id: 'stor', tab: 'C', cat: '🧬 ĐẶC TÍNH', name: 'Ammunition Supply', desc: 'Trần kho missile/clay/gas/pin: 300/12/4/4 → 700/25/8/8 → 1200/50/15/15 → 1800/80/40/35 → 2500/120/70/60 (pin tính theo bình 300⚡).', cost: () => [150, 250, 400, 600][up.stor],
    avail: () => up.stor < 4, buy: () => { up.stor++; }, pips: () => [up.stor, 4] },
  { id: 'frate', tab: 'C', cat: '🧬 ĐẶC TÍNH', name: 'Compound Turret', desc: 'Missile/lazer/claymore bắn nhanh hơn 10% → 15% → 20% → 25%.', cost: () => [120, 200, 300, 420][up.frate],
    avail: () => up.frate < 4, buy: () => { up.frate++; }, pips: () => [up.frate, 4] },
  { id: 'crate', tab: 'C', cat: '🧬 ĐẶC TÍNH', name: 'Effective Callout', desc: 'Mọi dmg của bạn có 10% → 20% → 30% crit.', cost: () => [100, 180, 280][up.crate],
    avail: () => up.crate < 3, buy: () => { up.crate++; }, pips: () => [up.crate, 3] },
  { id: 'cdmg', tab: 'C', cat: '🧬 ĐẶC TÍNH', name: 'Tactical Effectiveness', desc: 'Crit gốc ×200% → ×250% → ×300% → ×350% → ×400% → ×500%.', cost: () => [120, 180, 260, 360, 480][up.cdmg],
    avail: () => up.cdmg < 5, buy: () => { up.cdmg++; }, pips: () => [up.cdmg, 5] },
  { id: 'rld', tab: 'C', cat: '🧬 ĐẶC TÍNH', name: 'Optimized Reload', desc: 'Mọi loại nạp nhanh hơn 10% → 20% → 30% → 40% → 50%.', cost: () => [100, 160, 240, 340, 460][up.rld],
    avail: () => up.rld < 5, buy: () => { up.rld++; }, pips: () => [up.rld, 5] },
];
// Tab đạn dược: thẻ card lớn — trái ô ảnh, phải số lượng + slider + nút mua.
// Kho đầy (rail/pin, missile...) hoặc đầy máu (heal kit) thì khóa nút mua.
const AMMO_SHOP = [
  { id: 'a_mis', img: 'ammMis', name: 'Đạn missile/minigun', desc: 'Kho chung (1 đạn missile = 20 viên minigun).',
    unit: 'đạn', step: 10, min: 10, locked: () => null,
    stock: () => 'Kho ' + ammo.mis.stock + '/' + capMis(),
    maxQty: () => { const free = capMis() - ammo.mis.stock; return free <= 0 ? 0 : Math.max(10, Math.floor(free / 10) * 10); },
    price: q => Math.ceil(q * 60 / 80), buy: q => { addStock('mis', q); } },
  { id: 'a_clay', img: 'ammClay', name: 'Claymore', desc: 'Thêm claymore vào kho.',
    unit: 'quả', step: 1, min: 1, locked: () => up.clay ? null : ('Phá màn ' + (UNLOCK_LEVEL.clay + 1) + ' mở Claymore'),
    stock: () => 'Kho ' + ammo.clay.stock + '/' + capClay(),
    maxQty: () => Math.max(0, capClay() - ammo.clay.stock),
    price: q => q * 50, buy: q => { addStock('clay', q); } },
  { id: 'a_gas', img: 'ammGas', name: 'Gastank', desc: 'Thêm bình gas (20s phun).',
    unit: 'bình', step: 1, min: 1, locked: () => up.flame ? null : ('Phá màn ' + (UNLOCK_LEVEL.flame + 1) + ' mở Flamethrower'),
    stock: () => 'Kho ' + ammo.flame.tanks + '/' + capGas(),
    maxQty: () => Math.max(0, capGas() - ammo.flame.tanks),
    price: q => q * 80, buy: q => { addStock('gas', q); } },
  { id: 'a_bat', img: 'ammBat', name: 'Pin railgun/tesla', desc: 'Kho chung (tesla 5⚡/tase, rail 80⚡/bắn).',
    unit: '⚡', step: 15, min: 15, locked: () => (up.rail || up.tesla) ? null : ('Phá màn ' + (UNLOCK_LEVEL.tesla + 1) + ' mở Tesla'),
    stock: () => 'Kho ' + ammo.rail.stock + '/' + capBatU() + '⚡',
    maxQty: () => { const free = capBatU() - ammo.rail.stock; return free <= 0 ? 0 : Math.max(15, Math.floor(free / 15) * 15); },
    price: q => Math.ceil(q * 70 / 150), buy: q => { addStock('bat', q); } },
  { id: 'heal', img: 'med', name: 'Heal kit', desc: 'Hồi máu ngay lập tức cho tank đỏ.',
    unit: '❤️', step: 1, min: 1, locked: () => null,
    stock: () => 'Máu ' + fmt(Math.max(0, player.hp)) + '/' + player.maxhp,
    maxQty: () => player.maxhp - player.hp <= 0 ? 0 : Math.max(1, Math.ceil(player.maxhp - player.hp - 1e-9)),
    price: q => q * 40, buy: q => { healAlly(player, q); log('❤️ Heal kit +' + q + ' máu.'); } },
];
function renderAmmoCards(box) {
  const h = document.createElement('div');
  h.style.cssText = 'font-weight:700;margin-top:6px;opacity:.85'; h.textContent = '🎒 ĐẠN DƯỢC';
  box.appendChild(h);
  for (const g of AMMO_SHOP) {
    const lockMsg = g.locked();
    const max = lockMsg ? 0 : g.maxQty();
    const full = !lockMsg && max <= 0;
    const card = document.createElement('div'); card.className = 'ammoCard';
    card.innerHTML =
      `<div class="thumb"><img src="${IMG[g.img]}" alt=""></div>` +
      `<div class="info"><b>${g.name}</b><small>${g.desc}</small>` +
      `<small class="stk">${lockMsg ? ('🔒 ' + lockMsg) : g.stock()}</small>` +
      `<div class="buyrow"><input type="range" min="${g.min}" max="${Math.max(g.min, max)}" step="${g.step}" value="${g.min}" ${lockMsg || full ? 'disabled' : ''}>` +
      `<span class="qty"></span><button></button></div></div>`;
    const slider = card.querySelector('input'), qty = card.querySelector('.qty'), btn = card.querySelector('button');
    const sync = () => {
      const q = +slider.value, c = g.price(q);
      qty.textContent = q + ' ' + g.unit;
      btn.innerHTML = full ? 'FULL' : (lockMsg ? '🔒' : ('Mua ' + c + ' <img class="coin" src="' + IMG.gold + '">'));
      btn.disabled = !!(lockMsg || full || gold < c);
    };
    slider.oninput = sync; sync();
    if (!lockMsg && !full) btn.onclick = () => {
      const q = +slider.value, c = g.price(q);
      if (gold < c) return;
      gold -= c; g.buy(q); beep(660, 0.1);
      refreshShop(); updateHUD(); refreshSlots();
    };
    box.appendChild(card);
  }
}
function openShop(canNext, unlockMsg) {
  state = 'shop';
  $('shop').classList.remove('hidden');
  $('btnNext').style.display = canNext ? '' : 'none';
  // shop sau khi thắng: bắt buộc qua màn (ẩn nút Đóng, base đã nổ nên đóng là kẹt game)
  $('btnCloseShop').style.display = canNext ? 'none' : '';
  $('shopSub').textContent = (canNext ? ('Màn ' + (level + 1) + ' xong! Mua đồ rồi quẩy tiếp.') : ('Shop (màn ' + (level + 1) + ').')) + (unlockMsg || '');
  $('goldIcon').src = IMG.gold;
  refreshShop(); updateHUD(); refreshSlots();
}
function closeShop() {
  if (state !== 'shop') return;
  if (base.hp <= 0) return; // đã thắng thì không cho đóng (tránh kẹt ở state shop)
  $('shop').classList.add('hidden');
  if (player.alive) state = 'play';
}
function refreshShop() {
  $('shopGoldN').textContent = gold;
  const box = $('shopItems'); box.innerHTML = '';
  if (shopTab === 'A') { renderAmmoCards(box); return; }
  let lastCat = '';
  for (const it of SHOP) {
    if (it.tab !== shopTab) continue;
    if (it.cat !== lastCat) {
      lastCat = it.cat;
      const h = document.createElement('div');
      h.style.cssText = 'font-weight:700;margin-top:6px;opacity:.85'; h.textContent = it.cat;
      box.appendChild(h);
    }
    const ok = it.avail(), cost = ok ? it.cost() : 0, afford = ok && gold >= cost;
    const row = document.createElement('div'); row.className = 'shopRow';
    const pips = it.pips ? it.pips() : null;
    row.innerHTML = `<div class="nm"><b>${it.name}</b><small>${it.desc}</small></div>
      <span class="pips">${pips ? ('●'.repeat(pips[0]) + '○'.repeat(pips[1] - pips[0])) : ''}</span>`;
    const b = document.createElement('button');
    b.innerHTML = !ok ? 'MAX' : (cost + ' <img class="coin" src="' + IMG.gold + '">');
    b.disabled = !afford;
    if (ok) b.onclick = () => { if (gold >= it.cost()) { gold -= it.cost(); it.buy(); beep(660, 0.1); refreshShop(); updateHUD(); refreshSlots(); } };
    row.appendChild(b); box.appendChild(row);
  }
}
$('tabW').onclick = () => { shopTab = 'W'; refreshShop(); };
$('tabC').onclick = () => { shopTab = 'C'; refreshShop(); };
$('tabA').onclick = () => { shopTab = 'A'; refreshShop(); };
$('btnNext').onclick = () => { $('shop').classList.add('hidden'); startLevel(level + 1); state = 'play'; };
$('btnCloseShop').onclick = closeShop;

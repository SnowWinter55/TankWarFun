// ================= shop.js — 2 tab: vũ khí + đặc tính =================
const SHOP = [
  { id: 'multi', tab: 'W', cat: '🚀 MISSILE', name: 'Multimissile', desc: '1 quả ×1.0 → 2 quả ×0.5 mỗi quả, firerate 1s. Mở khóa nhánh nâng cấp.', cost: () => 80,
    avail: () => !up.multi, buy: () => { up.multi = true; } },
  { id: 'cnt', tab: 'W', cat: '🚀 MISSILE', name: 'Multimissile+', desc: '3 quả ×0.33 → 4 quả ×0.25 (tối đa). Mỗi phát chỉ tốn 1 đạn.', cost: () => [120, 200][up.cnt],
    avail: () => up.multi && up.cnt < 2, buy: () => { up.cnt++; }, pips: () => [up.cnt, 2] },
  { id: 'mdmg', tab: 'W', cat: '🚀 MISSILE', name: 'Compound Explosive', desc: '+25% → +50% → +75% dmg mỗi quả.', cost: () => [100, 160, 240][up.dmg],
    avail: () => up.multi && up.dmg < 3, buy: () => { up.dmg++; }, pips: () => [up.dmg, 3] },
  { id: 'rel', tab: 'W', cat: '🚀 MISSILE', name: 'Tactical Launchpad', desc: 'Firerate 1.0 → … → 0.33 → 0.2 → 0.07s/phát. Nạp cả load 3s.', cost: () => [60, 90, 120, 160, 220, 300, 420, 550][up.rel],
    avail: () => up.rel < 8, buy: () => { up.rel++; }, pips: () => [up.rel, 8] },
  { id: 'clair', tab: 'W', cat: '💥 CLAYMORE [2]', name: 'Clairvoyance', desc: 'Nón tìm địch: 75° → 90° → 110° → 140° → 180° → 220°.', cost: () => [120, 180, 260, 360, 500][up.clair],
    avail: () => up.clay && up.clair < 5, buy: () => { up.clair++; }, pips: () => [up.clair, 5] },
  { id: 'fatal', tab: 'W', cat: '💥 CLAYMORE [2]', name: 'Fatality', desc: 'Tỉ lệ gây 999999999 xuyên block: 0 → 0.5% → 1% → 1.5% → 2% → 2.5%.', cost: () => [150, 220, 300, 400, 500][up.fatal],
    avail: () => up.clay && up.fatal < 5, buy: () => { up.fatal++; }, pips: () => [up.fatal, 5] },
  { id: 'shrap', tab: 'W', cat: '💥 CLAYMORE [2]', name: 'Shrapnel', desc: 'Nổ văng mảnh 0.8dmg: 0 → 2 → 4 → 6 → 9 mảnh, bay 1-5 tile, tồn tại 40s.', cost: () => [130, 200, 290, 400][up.shrap],
    avail: () => up.clay && up.shrap < 4, buy: () => { up.shrap++; }, pips: () => [up.shrap, 4] },
  { id: 'psi', tab: 'W', cat: '💥 CLAYMORE [2]', name: 'Psionic Amplify', desc: 'Tăng tầm nổ: +0 → +1 → +2 tile.', cost: () => [140, 220][up.psi],
    avail: () => up.clay && up.psi < 2, buy: () => { up.psi++; }, pips: () => [up.psi, 2] },
  { id: 'napalm', tab: 'W', cat: '🔥 FLAME [3]', name: 'Napalm', desc: 'Burn tick nhanh hơn: interval -15% → -30% → -50% → -75%.', cost: () => [150, 220, 300, 420][up.napalm],
    avail: () => up.flame && up.napalm < 4, buy: () => { up.napalm++; }, pips: () => [up.napalm, 4] },
  { id: 'cold', tab: 'W', cat: '🔥 FLAME [3]', name: 'ColdFlame', desc: 'Bật/tắt bằng [F] trong dạng flame: mất burn, gây frostburn (chậm tới 95%, địch chịu +50% dmg).', cost: () => 250,
    avail: () => up.flame && !up.cold, buy: () => { up.cold = true; } },
  { id: 'chem', tab: 'W', cat: '🔥 FLAME [3]', name: 'Ignitious Chemical', desc: 'Effect lâu hơn: +25% → +50% → +75% → +100% → +150% thời lượng.', cost: () => [100, 150, 200, 280, 380][up.chem],
    avail: () => up.flame && up.chem < 5, buy: () => { up.chem++; }, pips: () => [up.chem, 5] },
  { id: 'a_mis', tab: 'W', cat: '🎒 ĐẠN DƯỢC', name: 'Đạn missile +80', desc: 'Nạp vào kho (trần theo storage). 1 phát bắn tốn 1 đạn.', cost: () => 60,
    avail: () => true, buy: () => { addStock('mis', 80); } },
  { id: 'a_clay', tab: 'W', cat: '🎒 ĐẠN DƯỢC', name: 'Claymore +1', desc: 'Thêm 1 claymore vào kho.', cost: () => 50,
    avail: () => up.clay, buy: () => { addStock('clay', 1); } },
  { id: 'a_gas', tab: 'W', cat: '🎒 ĐẠN DƯỢC', name: 'Gastank +1', desc: 'Thêm 1 bình gas (20s phun).', cost: () => 80,
    avail: () => up.flame, buy: () => { addStock('gas', 1); } },
  { id: 'a_bat', tab: 'W', cat: '🎒 ĐẠN DƯỢC', name: 'Pin +150⚡', desc: 'Nạp điện vào kho (1 bắn tốn 80).', cost: () => 70,
    avail: () => up.rail, buy: () => { addStock('bat', 150); } },
  { id: 'pierce', tab: 'W', cat: '🔆 LAZER [4]', name: 'High Frequency', desc: '50% → 75% → 100% bắn xuyên tường gạch (không phá tường).', cost: () => [120, 200, 300][up.pierce],
    avail: () => up.rail && up.pierce < 3, buy: () => { up.pierce++; }, pips: () => [up.pierce, 3] },
  { id: 'charge', tab: 'W', cat: '🔆 LAZER [4]', name: 'Electrocharged', desc: 'Dmg 1 → 3 → 6 → 10 → 17 → 28 → 40. 1 bắn tốn 80⚡.', cost: () => [120, 200, 300, 420, 560, 700][up.charge],
    avail: () => up.rail && up.charge < 6, buy: () => { up.charge++; }, pips: () => [up.charge, 6] },
  { id: 'bpierce', tab: 'W', cat: '🔆 LAZER [4]', name: 'Phased Frequency', desc: 'Lazer tràn qua các block (vd 10dmg vào 4|4|4|4|4 còn 4|4|2|0|0). Chưa mua thì kẹt block như đạn thường.', cost: () => 200,
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
function openShop(canNext, unlockMsg) {
  state = 'shop';
  $('shop').classList.remove('hidden');
  $('btnNext').style.display = canNext ? '' : 'none';
  $('shopSub').textContent = (canNext ? ('Màn ' + (level + 1) + ' xong! Mua đồ rồi quẩy tiếp.') : ('Shop (màn ' + (level + 1) + ').')) + (unlockMsg || '');
  $('goldIcon').src = IMG.gold;
  refreshShop(); updateHUD(); refreshSlots();
}
function closeShop() {
  if (state !== 'shop') return;
  $('shop').classList.add('hidden');
  if (player.alive && base.hp > 0) state = 'play';
}
function refreshShop() {
  $('shopGoldN').textContent = gold;
  const box = $('shopItems'); box.innerHTML = '';
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
    b.textContent = !ok ? 'MAX' : (cost + ' 🪙');
    b.disabled = !afford;
    if (ok) b.onclick = () => { if (gold >= it.cost()) { gold -= it.cost(); it.buy(); beep(660, 0.1); refreshShop(); updateHUD(); refreshSlots(); } };
    row.appendChild(b); box.appendChild(row);
  }
}
$('tabW').onclick = () => { shopTab = 'W'; refreshShop(); };
$('tabC').onclick = () => { shopTab = 'C'; refreshShop(); };
$('btnNext').onclick = () => { $('shop').classList.add('hidden'); startLevel(level + 1); state = 'play'; };
$('btnCloseShop').onclick = closeShop;

// ================= ui.js — HUD, slots, overlay =================
function updateHUD() {
  $('level').textContent = (level + 1) + ' ' + lvlDef(level).name;
  $('hp').textContent = fmt(Math.max(0, player ? player.hp : 1)) + '/' + (player ? player.maxhp : 1);
  $('gold').textContent = gold;
  $('reload').textContent = player ? player.ammoText() : '-';
  $('score').textContent = score;
  $('foes').textContent = foes.length + (drones.length ? ' (+' + drones.length + '🛸)' : '');
  $('basehp').textContent = fmt(Math.max(0, base ? base.hp : 0)) + '/' + (base ? base.max : 0);
  $('zoom').textContent = Math.round(cam.zoom * 100) + '%';
}
function refreshSlots() {
  const A = ammo || { mis: { load: 0 }, clay: { load: 0 }, flame: { fuel: 0 }, rail: { charge: 0 } };
  const flameNm = !up.cold ? '🔥 Flame' : (player && player.cold ? '❄ Cold [F]' : '🔥 Flame [F]');
  const defs = [
    ['MIS', '1', '🚀' + A.mis.load + ' Missile', true],
    ['CLAY', '2', '💥' + A.clay.load + ' Claymore', up.clay],
    ['FLAME', '3', flameNm + ' ' + Math.ceil(A.flame.fuel) + 's', up.flame],
    ['RAIL', '4', '🔆' + A.rail.charge + ' Lazer', up.rail]];
  $('slots').innerHTML = defs.map(([f, k, nm, ok]) =>
    `<span class="slot${ok ? ' on' : ''}${player && player.form === f ? ' cur' : ''}">${ok ? `<kbd>${k}</kbd> ${nm}` : `<kbd>${k}</kbd> 🔒`}</span>`).join('');
}
function showPause() {
  $('ovTitle').textContent = '⏸ Nghỉ tí';
  $('ovText').innerHTML = 'Đang pause. <kbd>P</kbd> tiếp tục, <kbd>R</kbd> chơi lại màn, <kbd>T</kbd> shop.';
  $('overlay').classList.remove('hidden'); $('btnStart').textContent = '▶ Tiếp tục';
}
function hideAll() { $('overlay').classList.add('hidden'); $('shop').classList.add('hidden'); }
function toggleHelp() { // H ẩn/hiện panel hướng dẫn (overlay trên canvas)
  $('helpPanel').classList.toggle('hidden');
}
$('btnHelp').onclick = toggleHelp;
$('btnHelpClose').onclick = toggleHelp;

// ---------- setting screenshake ----------
function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem('tankSettings'));
    if (s && typeof s.shake === 'boolean') settings.shake = s.shake;
  } catch (e) {} // file:// hoặc ẩn danh không có storage thì thôi
}
function saveSettings() {
  try { localStorage.setItem('tankSettings', JSON.stringify(settings)); } catch (e) {}
}
function refreshShakeBtn() {
  $('btnShake').textContent = settings.shake ? '📳 Rung: BẬT' : '📳 Rung: TẮT';
}
$('btnShake').onclick = () => {
  settings.shake = !settings.shake;
  saveSettings(); refreshShakeBtn();
  log('Screenshake ' + (settings.shake ? 'BẬT' : 'TẮT'));
};


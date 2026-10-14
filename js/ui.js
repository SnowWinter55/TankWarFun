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
function keyName(k) { return k === ' ' ? 'Space' : String(k || '').toUpperCase(); } // hiện tên phím đẹp
function refreshSlots() {
  const A = ammo || { mis: { load: 0 }, mini: { load: 0 }, clay: { load: 0 }, flame: { fuel: 0 }, tesla: { charge: 0 }, rail: { charge: 0 } };
  const K = (typeof settings !== 'undefined' && settings.keys) || DEFAULT_KEYS;
  const flameNm = !up.cold ? '🔥 Flame' : (player && player.cold ? '❄ Cold [F]' : '🔥 Flame [F]');
  const defs = [
    ['MINI', keyName(K.s1), '🔫' + A.mini.load + ' Minigun', up.mini],
    ['MIS', keyName(K.s2), '🚀' + A.mis.load + ' Missile', true],
    ['CLAY', keyName(K.s3), '💥' + A.clay.load + ' Claymore', up.clay],
    ['FLAME', keyName(K.s4), flameNm + ' ' + Math.ceil(A.flame.fuel) + 's', up.flame],
    ['TESLA', keyName(K.s5), '⚡' + A.tesla.charge + ' Tesla', up.tesla],
    ['RAIL', keyName(K.s6), '🔆' + A.rail.charge + ' Lazer', up.rail]];
  $('slots').innerHTML = defs.map(([f, k, nm, ok]) =>
    `<span class="slot${ok ? ' on' : ''}${player && player.form === f ? ' cur' : ''}">${ok ? `<kbd>${k}</kbd> ${nm}` : `<kbd>${k}</kbd> 🔒`}</span>`).join('');
}
function showPause() {
  const K = settings.keys;
  $('ovTitle').textContent = '⏸ Nghỉ tí';
  let h = `Đang pause. <kbd>${keyName(K.pause)}</kbd> tiếp tục, <kbd>${keyName(K.retry)}</kbd> chơi lại màn, <kbd>${keyName(K.shop)}</kbd> shop.<br>`;
  h += '<div style="margin-top:10px;max-width:560px;text-align:left;"><b>⌨️ Đổi phím</b> ' +
    '<button id="btnKeyReset" style="padding:4px 12px;font-size:12px;">Mặc định</button>' +
    '<div id="keyList" style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:6px;max-height:26vh;overflow-y:auto;"></div></div>';
  h += '<div style="margin-top:10px;max-width:560px;text-align:left;"><b>🗺️ Chọn màn</b><div id="lvlGrid" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;"></div></div>';
  $('ovText').innerHTML = h;
  $('overlay').classList.remove('hidden');
  $('btnStart').textContent = '▶ Tiếp tục';
  $('btnStart').onclick = () => { state = 'play'; hideAll(); };
  $('btnNew').style.display = 'none';
  renderKeyList(); renderLvlGrid();
  $('btnKeyReset').onclick = () => {
    settings.keys = Object.assign({}, DEFAULT_KEYS);
    saveAll(); renderKeyList(); refreshSlots(); renderHelp();
    log('⌨️ Phím về mặc định.'); beep(500, 0.08);
  };
}
function renderKeyList() { // vẽ danh sách phím trong pause, bấm để gán lại
  const box = $('keyList');
  if (!box) return;
  const K = settings.keys;
  box.innerHTML = '';
  for (const act of Object.keys(KEY_LABELS)) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;background:#1d241b;border:1px solid #46543f;border-radius:8px;padding:4px 8px;font-size:12px;';
    const capturing = rebindKey === act;
    row.innerHTML = `<span style="flex:1;">${KEY_LABELS[act]}</span>`;
    const b = document.createElement('button');
    b.style.cssText = 'padding:4px 12px;font-size:12px;min-width:64px;';
    b.innerHTML = capturing ? '<b>...</b>' : `<kbd>${keyName(K[act])}</kbd>`;
    b.onclick = () => {
      rebindKey = act;
      if (document.activeElement) document.activeElement.blur();
      renderKeyList(); beep(700, 0.06);
    };
    row.appendChild(b); box.appendChild(row);
  }
}
function assignKey(act, k) { // gán phím mới, trùng thì swap
  const K = settings.keys;
  for (const o of Object.keys(K)) {
    if (o !== act && K[o] === k) K[o] = K[act]; // swap với action đang giữ phím này
  }
  K[act] = k;
  rebindKey = null;
  saveAll(); renderKeyList(); refreshSlots(); renderHelp();
  log('⌨️ ' + KEY_LABELS[act] + ' → ' + keyName(k)); beep(660, 0.08);
}
function renderLvlGrid() { // chọn màn: lock đến khi phá đảo 11 màn
  const box = $('lvlGrid');
  if (!box) return;
  box.innerHTML = '';
  if (maxUnlock < LEVELS.length) {
    const d = document.createElement('div');
    d.style.cssText = 'font-size:12px;opacity:.7;';
    d.textContent = '🔒 Phá đảo 11 màn để mở (đang tới màn ' + (maxUnlock + 1) + ')';
    box.appendChild(d);
    return;
  }
  for (let i = 0; i < LEVELS.length; i++) {
    const b = document.createElement('button');
    b.style.cssText = 'padding:6px 12px;font-size:12px;';
    b.textContent = (i + 1);
    b.title = lvlDef(i).name;
    b.onclick = () => jumpLevel(i);
    box.appendChild(b);
  }
  const be = document.createElement('button');
  be.style.cssText = 'padding:6px 12px;font-size:12px;';
  be.textContent = '∞'; be.title = 'Endless';
  be.onclick = () => jumpLevel(LEVELS.length);
  box.appendChild(be);
}
function hideAll() { $('overlay').classList.add('hidden'); $('shop').classList.add('hidden'); }
function renderHelp() { // vẽ lại dòng điều khiển trong help theo phím hiện tại
  const el = $('helpKeys');
  if (!el) return;
  const K = settings.keys, kn = k => '<kbd>' + keyName(k) + '</kbd>';
  el.innerHTML =
    `📷 <b>Camera 32×18</b> theo player • <b>lăn chuột / ${kn(K.zoom)}</b> zoom • minimap góc phải • thanh máu chia vạch trên đầu player • HUD đè lên canvas • ${kn(K.help)} panel này.<br>` +
    `🕹️ <b>Di chuyển mượt:</b> giữ ${kn(K.up)}${kn(K.down)}${kn(K.left)}${kn(K.right)} (mobile chạm 1 ngón, 2 ngón bắn), cạ tường tự trượt. Bạn <b>3.4 tile/s</b>. ` +
    `${kn(K.s1)} minigun • ${kn(K.s2)} missile • ${kn(K.s3)}/${kn(K.s4)}/${kn(K.s5)}/${kn(K.s6)} mở dần • ${kn(K.fire)} bắn • ${kn(K.shop)} shop • ${kn(K.retry)} chơi lại màn • ${kn(K.pause)} pause (đổi phím + chọn màn trong pause).`;
}
function toggleHelp() { // H ẩn/hiện panel hướng dẫn (overlay trên canvas)
  renderHelp();
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
  saveAll(); refreshShakeBtn();
  log('Screenshake ' + (settings.shake ? 'BẬT' : 'TẮT'));
};


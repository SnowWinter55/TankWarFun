// ================= core.js — utils, âm thanh, asset, vẽ =================
const $ = id => document.getElementById(id);
const fmt = n => { const r = Math.round(n * 10) / 10; return Number.isInteger(r) ? String(r) : r.toFixed(1); };
function rnd(a, b) { return a + Math.random() * (b - a); }
function log(m) { const el = $('log'); el.textContent = (m + '\n' + el.textContent).slice(0, 800); }

let AC = null;
function beep(f = 440, d = 0.08, type = 'square', v = 0.09) {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.value = f; g.gain.value = v;
    o.connect(g); g.connect(AC.destination); o.start();
    g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + d); o.stop(AC.currentTime + d);
  } catch (e) {}
}

const cv = document.getElementById('game'), ctx = cv.getContext('2d');

const spr = {};
function loadAll() {
  return Promise.all(Object.keys(IMG).map(k => new Promise(res => {
    const im = new Image();
    im.onload = () => { spr[k] = im; res(1); };
    im.onerror = () => { console.warn('missing', IMG[k]); spr[k] = null; res(0); };
    im.src = IMG[k];
  })));
}
function drawSpr(img, x, y, w, h, ang = 0, filter = null) {
  if (!img) { ctx.fillStyle = '#f0f'; ctx.fillRect(x - w / 2, y - h / 2, w, h); return; }
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  if (filter) ctx.filter = filter;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore(); ctx.filter = 'none';
}

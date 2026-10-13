// ================= state.js — state toàn cục của game =================
let state = 'menu'; // menu | play | pause | shop | dead
let map, crates, mines, claymores, bullets, flames, beams, balls, shieldReact;
let foes, drones, parts, floats, pickups, warnings, booms;
let player, base, score, gold, kills, level, spawnT, time, shake, queue;
let up, ammo, oldMissileLvl = -1;
let levelTotal = 0, endlessT = 0;
let shopTab = 'W';
let settings = { shake: true }; // setting: rung màn hình on/off (lưu localStorage)
let cam = { x: 0, y: 0, zoom: 1, zidx: 0 }; // camera theo player
const ZOOMS = [1, 1.5, 2]; // Z đổi nấc zoom

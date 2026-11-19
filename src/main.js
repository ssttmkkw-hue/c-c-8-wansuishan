import * as THREE from 'three';
import { createKeyboard, createPointer, createTouch } from './input.js';
import { createAudio } from './audio.js';
import { applyDom, getLang, onLang, setLang, t, toggleLang } from './i18n.js';
import { createPerson, posePerson, setPeopleShadows } from './people.js';
import { createShows } from './shows.js';
import { blocked, buildWorld, pullCamera } from './world.js';

function detectSoftwareEarly() {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
    return /swiftshader|llvmpipe|softpipe|software/i.test(String(name));
  } catch {
    return false;
  }
}

const canvas = document.querySelector('#view');
const softwareGuess = detectSoftwareEarly();
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !softwareGuess, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const world = buildWorld();
const { scene, colliders, sun, ground, board } = world;
const showsApi = createShows(scene);
const audio = createAudio();

const player = createPerson({
  id: 'you',
  player: true,
  name: { zh: '你', en: 'You' },
  color: 0x3f4e9a,
  dark: 0x2c356e,
  skin: 0xf0c7a0,
  hair: 0x3e2723,
  belt: 0xe6c36a,
  seed: 0.2,
});
player.root.position.set(0, 0, 18);
player.root.rotation.y = Math.PI;
scene.add(player.root);

const camera = new THREE.PerspectiveCamera(52, 1, 0.12, 120);
const desired = new THREE.Vector3();
const look = new THREE.Vector3();
const lookSm = new THREE.Vector3();
const head = new THREE.Vector3();
let camYaw = 0;
let pitch = 0.42;
let dist = 6.2;
let camReady = false;

const spot = new THREE.SpotLight(0xffe2b0, 6, 16, 0.55, 0.55, 1);
spot.position.set(-12, 4.5, 8);
spot.castShadow = false;
scene.add(spot);
scene.add(spot.target);

const keyboard = createKeyboard();
const pointer = createPointer(canvas);
const touch = createTouch(document.querySelector('#stick'), document.querySelector('#knob'));
const clock = new THREE.Clock();

let sim = 0;
let watching = null;
let helpLock = false;
let quality = 'auto';
let software = false;
let fps = 0;
let fpsFrames = 0;
let fpsStamp = performance.now();
const scheduleSig = { value: '' };
const labelObjs = [];
const tmp4 = new THREE.Vector4();

const playerRadius = 0.42;
const ORDER = ['plaza', 'stage', 'street', 'parade', 'story', 'puppet', 'martial'];

function showById(id) {
  return showsApi.shows.find((show) => show.id === id) || null;
}

function detectSoftware() {
  const gl = renderer.getContext();
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
  software = /swiftshader|llvmpipe|softpipe|software/i.test(String(name));
  applyQuality();
}

function applyQuality() {
  const mode = quality === 'auto' ? (software ? 'low' : 'high') : quality;
  const low = mode === 'low';
  const ratio = low ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(ratio);
  renderer.shadowMap.enabled = !low;
  sun.castShadow = !low;
  ground.receiveShadow = !low;
  setPeopleShadows(!low);
  resize();
}

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / Math.max(1, h);
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

function nearestShow(maxDist) {
  const p = player.root.position;
  let best = null;
  let bestD = maxDist;
  for (const show of showsApi.shows) {
    const d = Math.hypot(show.x - p.x, show.z - p.z);
    const zone = Math.hypot(show.stand.x - p.x, show.stand.z - p.z);
    const score = Math.min(d, zone);
    if (score < bestD) {
      bestD = score;
      best = { show, dist: d, zone };
    }
  }
  return best;
}

function place(x, z, faceX, faceZ, snap) {
  player.root.position.set(x, 0, z);
  player.root.rotation.y = Math.atan2(faceX - x, faceZ - z);
  camYaw = player.root.rotation.y + Math.PI;
  if (snap) {
    camReady = false;
    applyCamera(1, true);
  }
}

function enterWatch(id, snap) {
  const show = showById(id);
  if (!show) return false;
  watching = id;
  player.root.position.set(show.stand.x, 0, show.stand.z);
  player.root.rotation.y = Math.atan2(show.x - show.stand.x, show.z - show.stand.z);
  if (snap) applyCamera(1, true);
  return true;
}

function leaveWatch(snap) {
  watching = null;
  if (snap) applyCamera(1, true);
}

function applyCamera(dt, snap) {
  const pos = player.root.position;
  head.set(pos.x, 1.25, pos.z);
  if (watching) {
    const show = showById(watching);
    if (show) {
      desired.copy(show.cam);
      look.copy(show.look);
    }
  } else {
    const cosP = Math.cos(pitch);
    desired.set(
      pos.x + Math.sin(camYaw) * dist * cosP,
      1.15 + Math.sin(pitch) * dist,
      pos.z + Math.cos(camYaw) * dist * cosP,
    );
    look.set(pos.x, 1.2, pos.z);
    pullCamera(head, desired, colliders);
  }
  if (!camReady || snap) {
    camera.position.copy(desired);
    lookSm.copy(look);
    camReady = true;
  } else {
    const k = 1 - Math.exp(-(watching ? 4.2 : 6) * dt);
    camera.position.lerp(desired, k);
    lookSm.lerp(look, 1 - Math.exp(-5 * dt));
  }
  camera.lookAt(lookSm);
}

function movePlayer(dt) {
  if (helpLock || watching) {
    posePerson(player, sim, { gesture: 'idle', walk: 0, lookAt: watching ? showById(watching)?.speakerPos : null });
    return;
  }
  let ix = 0;
  let iz = 0;
  ix += touch.vector.x;
  iz += touch.vector.y;
  if (keyboard.heldAny('KeyA', 'ArrowLeft')) ix -= 1;
  if (keyboard.heldAny('KeyD', 'ArrowRight')) ix += 1;
  if (keyboard.heldAny('KeyW', 'ArrowUp')) iz -= 1;
  if (keyboard.heldAny('KeyS', 'ArrowDown')) iz += 1;
  const len = Math.hypot(ix, iz);
  const run = keyboard.heldAny('ShiftLeft', 'ShiftRight');
  if (len > 0.001) {
    const nx = ix / len;
    const nz = iz / len;
    const sin = Math.sin(camYaw);
    const cos = Math.cos(camYaw);
    const moveX = nx * cos + nz * sin;
    const moveZ = -nx * sin + nz * cos;
    const step = (run ? 7.2 : 4.4) * dt;
    const px = player.root.position.x;
    const pz = player.root.position.z;
    const bodies = showsApi.bodies;
    const nextX = px + (moveX / Math.hypot(moveX, moveZ)) * step;
    const nextZ = pz + (moveZ / Math.hypot(moveX, moveZ)) * step;
    if (!blocked(nextX, pz, playerRadius, colliders, bodies)) player.root.position.x = nextX;
    if (!blocked(player.root.position.x, nextZ, playerRadius, colliders, bodies)) player.root.position.z = nextZ;
    player.root.rotation.y = Math.atan2(moveX, moveZ);
    posePerson(player, sim, { gesture: 'walk', walk: run ? 1.35 : 1 });
  } else {
    const near = nearestShow(10);
    posePerson(player, sim, {
      gesture: 'idle',
      walk: 0,
      lookAt: near ? near.show.speakerPos : null,
    });
  }
}

function present() {
  world.update(sim);
  const pp = player.root.position;
  showsApi.update(sim, pp.x, pp.z, watching);
  const watchBtn = document.querySelector('#btn-watch');
  if (watchBtn) watchBtn.textContent = watching ? t('leaveShort') : t('watchShort');
  const active = watching ? showById(watching) : (nearestShow(16)?.show || showsApi.shows[0]);
  if (active) {
    spot.position.set(active.speakerPos.x + 0.4, 4.4, active.speakerPos.z + 1.1);
    spot.target.position.set(active.speakerPos.x, 1.2, active.speakerPos.z);
    spot.intensity = watching ? 10 : 5.5;
  }
  const lang = getLang();
  paintBoard(lang);
  paintSchedule(lang);
  paintSubtitle(lang);
  paintPrompt();
  paintWhere(lang);
  updateLabels();
  const distMap = {};
  const p = player.root.position;
  for (const show of showsApi.shows) {
    distMap[show.id] = Math.hypot(show.x - p.x, show.z - p.z);
  }
  audio.update(sim, distMap, watching);
  drawMap();
}

function paintBoard(lang) {
  const rows = showsApi.shows.map((show) => ({
    title: `${show.title[lang]} · ${show.area[lang]}`,
    now: `${t('now')}  ${show.blurbNow ? show.blurbNow[lang] : ''}`,
    next: `${t('next')}  ${show.blurbNext ? show.blurbNext[lang] : ''}`,
    accent: show.id === watching ? '#c4893a' : '#9a2e32',
  }));
  const sig = rows.map((row) => row.title + row.now + row.next).join('|') + lang;
  if (sig === scheduleSig.board) return;
  scheduleSig.board = sig;
  board.paint(t('schedule'), t('tag'), rows);
}

function paintSchedule(lang) {
  const list = document.querySelector('#schedule-list');
  const sig = showsApi.shows.map((show) => `${show.id}:${show.blurbNow ? show.blurbNow[lang] : ''}:${show.blurbNext ? show.blurbNext[lang] : ''}`).join('|') + lang + (watching || '');
  if (sig === scheduleSig.hud) return;
  scheduleSig.hud = sig;
  list.replaceChildren();
  for (const show of showsApi.shows) {
    const li = document.createElement('li');
    if (show.id === watching) li.classList.add('on');
    const title = document.createElement('strong');
    title.textContent = show.title[lang];
    const area = document.createElement('em');
    area.textContent = show.area[lang];
    const now = document.createElement('p');
    now.textContent = `${t('now')} · ${show.blurbNow ? show.blurbNow[lang] : ''}`;
    const next = document.createElement('p');
    next.className = 'next';
    next.textContent = `${t('next')} · ${show.blurbNext ? show.blurbNext[lang] : ''}`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = t('go');
    btn.addEventListener('click', () => enterWatch(show.id, true));
    li.append(title, area, now, next, btn);
    list.appendChild(li);
  }
}

function paintSubtitle(lang) {
  const bar = document.querySelector('#subtitle');
  const near = watching ? showById(watching) : nearestShow(12)?.show;
  const hear = near && (watching === near.id || Math.hypot(near.x - player.root.position.x, near.z - player.root.position.z) < near.hear || Math.hypot(near.stand.x - player.root.position.x, near.stand.z - player.root.position.z) < near.radius + 1);
  const line = hear ? near.line : null;
  if (!line || line.quiet || !(line[lang] || line.zh || line.en)) {
    bar.hidden = true;
    return;
  }
  bar.hidden = false;
  const other = lang === 'zh' ? 'en' : 'zh';
  document.querySelector('#sub-who').textContent = near.speakerName[lang] || '';
  document.querySelector('#sub-main').textContent = line[lang] || '';
  document.querySelector('#sub-alt').textContent = line[other] || '';
}

function paintPrompt() {
  const el = document.querySelector('#prompt');
  if (helpLock) {
    el.hidden = true;
    return;
  }
  if (watching) {
    el.hidden = false;
    el.textContent = t('leave');
    return;
  }
  const near = nearestShow(8);
  if (near && near.zone < near.show.radius) {
    el.hidden = false;
    el.textContent = `${t('watch')} · ${near.show.title[getLang()]}`;
    return;
  }
  el.hidden = true;
}

function paintWhere(lang) {
  const el = document.querySelector('#where');
  const p = player.root.position;
  const near = nearestShow(14);
  if (watching) el.textContent = showById(watching).title[lang];
  else if (near && near.dist < 14) el.textContent = `${near.show.area[lang]} · ${near.show.title[lang]}`;
  else if (p.z > 16) el.textContent = t('whereGate');
  else el.textContent = t('wherePath');
}

function ensureLabels() {
  const layer = document.querySelector('#labels');
  const specs = [
    { text: () => (getLang() === 'zh' ? '万岁山' : 'Wansuishan'), pos: new THREE.Vector3(0, 5.7, 26.2), big: true },
    ...showsApi.shows.map((show) => ({
      text: () => show.title[getLang()],
      pos: new THREE.Vector3(show.x, show.kind === 'parade' ? 3.4 : 2.8, show.z),
      big: false,
    })),
  ];
  for (const spec of specs) {
    const el = document.createElement('div');
    el.className = spec.big ? 'wlabel big' : 'wlabel';
    layer.appendChild(el);
    labelObjs.push({ el, pos: spec.pos, text: spec.text });
  }
}

function updateLabels() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.updateMatrixWorld();
  for (const item of labelObjs) {
    item.el.textContent = item.text();
    tmp4.set(item.pos.x, item.pos.y, item.pos.z, 1);
    tmp4.applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);
    if (tmp4.w <= 0.05) {
      item.el.style.display = 'none';
      continue;
    }
    const x = (tmp4.x / tmp4.w) * 0.5 + 0.5;
    const y = (-tmp4.y / tmp4.w) * 0.5 + 0.5;
    if (x < -0.1 || x > 1.1 || y < -0.1 || y > 1.1) {
      item.el.style.display = 'none';
      continue;
    }
    item.el.style.display = 'block';
    item.el.style.transform = `translate(-50%, -100%) translate(${x * w}px, ${y * h}px)`;
  }
}

function drawMap() {
  const map = document.querySelector('#minimap');
  const ctx = map.getContext('2d');
  const w = map.width;
  const h = map.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(246, 230, 207, 0.92)';
  ctx.fillRect(0, 0, w, h);
  const toX = (x) => ((x + 36) / 72) * w;
  const toY = (z) => ((z + 32) / 64) * h;
  ctx.strokeStyle = '#c4b08a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(toX(0), toY(24));
  ctx.lineTo(toX(0), toY(-8));
  ctx.moveTo(toX(0), toY(8));
  ctx.lineTo(toX(-16), toY(8));
  ctx.moveTo(toX(0), toY(12));
  ctx.lineTo(toX(16), toY(12));
  ctx.stroke();
  ctx.strokeStyle = '#d8c4a0';
  ctx.beginPath();
  ctx.ellipse(toX(0), toY(-16), (14 / 72) * w, (6 / 64) * h, 0, 0, Math.PI * 2);
  ctx.stroke();
  const colors = { plaza: '#c4564a', stage: '#8d3a44', street: '#d3542c', parade: '#c4893a', story: '#6a4a8a', puppet: '#3d4f86', martial: '#9a3a2a' };
  const popular = nearestShow(30);
  for (const show of showsApi.shows) {
    const hot = show.id === watching || (popular && popular.show === show);
    ctx.fillStyle = colors[show.id] || '#333';
    ctx.beginPath();
    ctx.arc(toX(show.x), toY(show.z), hot ? 6.5 : 4, 0, Math.PI * 2);
    ctx.fill();
    if (hot) {
      ctx.strokeStyle = '#e6c36a';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  const p = player.root.position;
  ctx.save();
  ctx.translate(toX(p.x), toY(p.z));
  ctx.rotate(-player.root.rotation.y);
  ctx.fillStyle = '#3f4e9a';
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(5, 6);
  ctx.lineTo(-5, 6);
  ctx.fill();
  ctx.restore();
}

function syncMuteButton() {
  const btn = document.querySelector('#btn-mute');
  btn.textContent = audio.isMuted() ? t('muteOn') : t('muteOff');
  btn.setAttribute('aria-pressed', audio.isMuted() ? 'true' : 'false');
}

function bindUi() {
  document.querySelector('#btn-lang').addEventListener('click', () => {
    toggleLang();
    scheduleSig.board = '';
    scheduleSig.hud = '';
    present();
  });
  document.querySelector('#btn-mute').addEventListener('click', () => {
    audio.unlock();
    audio.setMuted(!audio.isMuted());
    syncMuteButton();
  });
  document.querySelector('#btn-help').addEventListener('click', () => openHelp());
  document.querySelector('#help-dismiss').addEventListener('click', () => closeHelp());
  document.querySelector('#btn-fold').addEventListener('click', () => {
    document.querySelector('#schedule').classList.toggle('collapsed');
  });
  document.querySelector('#btn-watch').addEventListener('click', () => {
    if (helpLock) return;
    if (watching) {
      leaveWatch(false);
      return;
    }
    const near = nearestShow(18);
    if (near) enterWatch(near.show.id, false);
  });
  document.querySelector('#quality').addEventListener('change', (event) => {
    quality = event.target.value;
    applyQuality();
  });
  const map = document.querySelector('#minimap');
  map.addEventListener('click', (event) => {
    const rect = map.getBoundingClientRect();
    const u = (event.clientX - rect.left) / rect.width;
    const v = (event.clientY - rect.top) / rect.height;
    const x = u * 72 - 36;
    const z = v * 64 - 32;
    watching = null;
    place(x, z, x, z - 1, true);
  });
  onLang((lang) => {
    applyDom();
    document.querySelector('#btn-lang').textContent = lang === 'zh' ? 'EN' : '中文';
    syncMuteButton();
    scheduleSig.board = '';
    scheduleSig.hud = '';
  });
}

function openHelp() {
  helpLock = true;
  document.querySelector('#help').hidden = false;
}

function closeHelp() {
  helpLock = false;
  document.querySelector('#help').hidden = true;
  try { localStorage.setItem('wansui-help-dismissed', '1'); } catch { /* ignore */ }
}

function bootHelp() {
  let seen = false;
  try { seen = localStorage.getItem('wansui-help-dismissed') === '1'; } catch { seen = false; }
  if (!seen) openHelp();
}

window.addEventListener('pointerdown', () => audio.unlock(), { passive: true });
window.addEventListener('keydown', () => audio.unlock());

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  sim += dt;
  fpsFrames += 1;
  const nowMs = performance.now();
  if (nowMs - fpsStamp > 500) {
    fps = (fpsFrames * 1000) / (nowMs - fpsStamp);
    fpsFrames = 0;
    fpsStamp = nowMs;
  }
  const lookInput = pointer.read();
  if (!helpLock && !watching) {
    camYaw -= lookInput.dx * 0.005;
    pitch = Math.max(0.22, Math.min(1.05, pitch + lookInput.dy * 0.003));
    dist = Math.max(3.4, Math.min(9, dist + lookInput.wheel * 0.4));
    if (keyboard.held('KeyQ')) camYaw += dt * 1.5;
    if (keyboard.held('KeyR')) camYaw -= dt * 1.5;
  }
  if (keyboard.consume('Escape')) {
    if (helpLock) closeHelp();
    else if (watching) leaveWatch(false);
  }
  if (!helpLock && keyboard.consume('KeyE')) {
    if (watching) leaveWatch(false);
    else {
      const near = nearestShow(8);
      if (near && near.zone < near.show.radius) enterWatch(near.show.id, false);
    }
  }
  if (!helpLock && keyboard.consume('KeyH')) openHelp();
  if (!helpLock && keyboard.consume('KeyL')) {
    toggleLang();
    scheduleSig.board = '';
    scheduleSig.hud = '';
  }
  if (!helpLock && keyboard.consume('KeyM')) document.querySelector('#schedule').classList.toggle('collapsed');
  if (!helpLock) {
    ORDER.forEach((id, index) => {
      if (keyboard.consume(`Digit${index + 1}`)) {
        const show = showById(id);
        player.root.position.set(show.stand.x, 0, show.stand.z);
        enterWatch(id, true);
      }
    });
  }
  movePlayer(dt);
  present();
  applyCamera(dt, false);
  renderer.render(scene, camera);
}

function nearbyList() {
  const p = player.root.position;
  const lang = getLang();
  return showsApi.shows.map((show) => ({
    id: show.id,
    dist: +Math.min(
      Math.hypot(show.x - p.x, show.z - p.z),
      Math.hypot(show.stand.x - p.x, show.stand.z - p.z),
    ).toFixed(2),
    title: show.title[lang],
  })).filter((item) => item.dist < 16).sort((a, b) => a.dist - b.dist);
}

window.__wansui = {
  getState() {
    const p = player.root.position;
    return {
      x: +p.x.toFixed(3),
      y: +p.y.toFixed(3),
      z: +p.z.toFixed(3),
      yaw: camYaw,
      facing: player.root.rotation.y,
      watching,
      lang: getLang(),
      muted: audio.isMuted(),
      nearby: nearbyList(),
      fps: Math.round(fps),
      time: sim,
      quality,
      software,
    };
  },
  listShows() {
    return showsApi.list();
  },
  goTo(target) {
    if (typeof target === 'string') {
      const show = showById(target);
      if (!show) return false;
      watching = null;
      place(show.stand.x, show.stand.z, show.x, show.z, true);
      return true;
    }
    if (target && Number.isFinite(target.x) && Number.isFinite(target.z)) {
      watching = null;
      const faceX = Number.isFinite(target.faceX) ? target.faceX : target.x;
      const faceZ = Number.isFinite(target.faceZ) ? target.faceZ : target.z - 1;
      place(target.x, target.z, faceX, faceZ, true);
      return true;
    }
    return false;
  },
  watch(id, opts) {
    const snap = opts === true || !!(opts && opts.snap);
    return enterWatch(id, snap);
  },
  leave(opts) {
    const snap = !opts || opts.snap !== false;
    leaveWatch(snap);
  },
  setLang(next) {
    const value = setLang(next);
    scheduleSig.board = '';
    scheduleSig.hud = '';
    present();
    return value;
  },
  setMuted(value) {
    audio.setMuted(!!value);
    syncMuteButton();
  },
  advance(ms) {
    sim += Math.max(0, Number(ms) || 0) / 1000;
    present();
    applyCamera(0.2, false);
  },
  setTime(ms) {
    sim = Math.max(0, Number(ms) || 0) / 1000;
    present();
    applyCamera(0.2, true);
  },
  setQuality(mode) {
    if (mode === 'low' || mode === 'high' || mode === 'auto') {
      quality = mode;
      const select = document.querySelector('#quality');
      if (select) select.value = mode;
      applyQuality();
    }
    return quality;
  },
  dismissHelp() {
    closeHelp();
  },
};

detectSoftware();
bindUi();
applyDom();
setLang(getLang());
ensureLabels();
syncMuteButton();
bootHelp();
resize();
window.addEventListener('resize', resize);
present();
applyCamera(1, true);
renderer.render(scene, camera);
requestAnimationFrame(frame);

import * as THREE from 'three';

/**
 * Stylized original park. Not a map of any real garden.
 * Paths are guides; the lawn is walkable. Colliders are walls, water, trunks, and the stage back.
 */

const grassMat = new THREE.MeshLambertMaterial({ color: 0x7ea36b });
const pathMat = new THREE.MeshLambertMaterial({ color: 0xe3d2b0 });
const waterMat = new THREE.MeshLambertMaterial({ color: 0x3e8f9c });
const woodMat = new THREE.MeshLambertMaterial({ color: 0x7a4b2e });
const roofMat = new THREE.MeshLambertMaterial({ color: 0x9a2e32 });
const wallMat = new THREE.MeshLambertMaterial({ color: 0xc45a4a });
const stoneMat = new THREE.MeshLambertMaterial({ color: 0xb7aa9a });
const goldMat = new THREE.MeshLambertMaterial({ color: 0xe6c36a, emissive: 0x8a6a2a, emissiveIntensity: 0.25 });
const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4630 });
const leafMat = new THREE.MeshLambertMaterial({ color: 0x3f7d45 });
const leafMat2 = new THREE.MeshLambertMaterial({ color: 0x4e8d4a });
const pineMat = new THREE.MeshLambertMaterial({ color: 0x2f6a4a });
const lanternMat = new THREE.MeshLambertMaterial({ color: 0xffb347, emissive: 0xff5a24, emissiveIntensity: 0.8 });
const darkMat = new THREE.MeshLambertMaterial({ color: 0x4a3028 });

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const trunkGeo = new THREE.CylinderGeometry(0.12, 0.16, 1.3, 6);
const crownGeo = new THREE.SphereGeometry(0.85, 8, 6);
const pineGeo = new THREE.ConeGeometry(0.7, 1.8, 7);
const lanternGeo = new THREE.SphereGeometry(0.16, 8, 6);
const capGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.08, 6);
const poleGeo = new THREE.CylinderGeometry(0.04, 0.045, 1.7, 5);
const tileGeo = new THREE.BoxGeometry(2.5, 0.06, 1.55);

function box(scene, w, h, d, x, y, z, material, colliders, collide) {
  const mesh = new THREE.Mesh(boxGeo, material);
  mesh.scale.set(w, h, d);
  mesh.position.set(x, y, z);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  scene.add(mesh);
  if (collide && colliders) {
    colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, h });
  }
  return mesh;
}

function lantern(scene, x, z, y = 1.7) {
  const pole = new THREE.Mesh(poleGeo, darkMat);
  pole.position.set(x, y * 0.5, z);
  pole.scale.y = y / 1.7;
  const ball = new THREE.Mesh(lanternGeo, lanternMat);
  ball.position.set(x, y + 0.15, z);
  const cap = new THREE.Mesh(capGeo, roofMat);
  cap.position.set(x, y + 0.32, z);
  scene.add(pole, ball, cap);
}

export function buildWorld() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf6e6cf);
  scene.fog = new THREE.Fog(0xf6e6cf, 24, 72);
  const colliders = [];

  const hemi = new THREE.HemisphereLight(0xfff4e2, 0x8d6a45, 0.85);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1d6, 1.15);
  sun.position.set(18, 28, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -40;
  sun.shadow.camera.right = 40;
  sun.shadow.camera.top = 40;
  sun.shadow.camera.bottom = -40;
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 70;
  sun.shadow.bias = -0.0008;
  scene.add(sun);
  scene.add(sun.target);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(110, 110), grassMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  box(scene, 3.4, 0.06, 34, 0, 0.03, 8, pathMat);
  box(scene, 16, 0.06, 2.6, -9, 0.035, 8, pathMat);
  box(scene, 16, 0.06, 2.6, 10, 0.035, 12, pathMat);
  box(scene, 3.4, 0.06, 12, 0, 0.03, -4, pathMat);

  // Perimeter with a south gate gap.
  const wallH = 2.15;
  box(scene, 72, wallH, 0.7, 0, wallH / 2, -30.4, wallMat, colliders, true);
  box(scene, 0.7, wallH, 56, -35.6, wallH / 2, -2, wallMat, colliders, true);
  box(scene, 0.7, wallH, 56, 35.6, wallH / 2, -2, wallMat, colliders, true);
  box(scene, 30, wallH, 0.7, -19.2, wallH / 2, 26.2, wallMat, colliders, true);
  box(scene, 30, wallH, 0.7, 19.2, wallH / 2, 26.2, wallMat, colliders, true);

  buildGate(scene, colliders);
  buildStage(scene, colliders);
  buildPlaza(scene);
  buildPond(scene, colliders);
  buildStall(scene, colliders);
  buildHouse(scene, colliders);

  const trees = [];
  const spots = [
    [-28, 18, 1.15, 'round'], [-30, 2, 1, 'pine'], [-26, -18, 1.2, 'round'],
    [28, 18, 1.1, 'pine'], [30, 4, 1.25, 'round'], [22, -22, 1, 'pine'],
    [-16, 20, 0.95, 'round'], [12, 22, 1.05, 'round'], [-6, 22, 0.8, 'pine'],
    [20, 20, 0.9, 'round'], [-32, -12, 1.1, 'round'], [32, -16, 1, 'pine'],
    [-20, 14, 0.75, 'round'], [14, -2, 0.85, 'pine'], [-4, -24, 1, 'round'],
  ];
  for (const [x, z, sc, kind] of spots) {
    trees.push(addTree(scene, colliders, x, z, sc, kind));
  }

  for (let z = 24; z >= -6; z -= 4) lantern(scene, -2.3, z);
  for (let z = 22; z >= -4; z -= 4) lantern(scene, 2.3, z, 1.65);
  lantern(scene, -12, 11.2, 1.8);
  lantern(scene, -16, 5, 1.8);
  lantern(scene, 16, 14.2, 1.8);
  lantern(scene, 20, 8, 1.7);

  // Parade road.
  for (let i = 0; i < 40; i += 1) {
    const a = (i / 40) * Math.PI * 2;
    const x = Math.cos(a) * 14;
    const z = -16 + Math.sin(a) * 6;
    const tile = new THREE.Mesh(tileGeo, pathMat);
    tile.position.set(x, 0.04, z);
    const dx = -Math.sin(a) * 14;
    const dz = Math.cos(a) * 6;
    tile.rotation.y = Math.atan2(dx, dz);
    tile.receiveShadow = true;
    scene.add(tile);
  }

  const flowers = [];
  const flowerGeo = new THREE.SphereGeometry(0.1, 5, 4);
  const flowerCols = [0xe25b6a, 0xf2d16b, 0xfff6ea, 0xee8ab0].map((c) => new THREE.MeshLambertMaterial({ color: c }));
  const flowerSpots = [
    [-6, 16], [-8, 18], [5, 20], [8, 16], [-18, 6], [-14, -1],
    [22, 8], [24, 14], [6, -8], [-8, -12], [10, -22], [-18, 18],
  ];
  flowerSpots.forEach(([x, z], i) => {
    const mesh = new THREE.Mesh(flowerGeo, flowerCols[i % flowerCols.length]);
    mesh.position.set(x, 0.12, z);
    scene.add(mesh);
    flowers.push(mesh);
  });

  const kois = [0, 1, 2].map((i) => {
    const mesh = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: i === 2 ? 0xf2f2f2 : 0xe07a3a }));
    mesh.scale.set(0.28, 0.08, 0.12);
    scene.add(mesh);
    return { mesh, phase: i * 2.1, speed: 0.35 + i * 0.05 };
  });

  const board = createBoard(scene, colliders);

  return {
    scene,
    colliders,
    sun,
    ground,
    board,
    update(time) {
      lanternMat.emissiveIntensity = 0.72 + Math.sin(time * 2.6) * 0.12;
      for (let i = 0; i < trees.length; i += 1) {
        trees[i].rotation.z = Math.sin(time * 0.6 + i) * 0.018;
      }
      for (let i = 0; i < flowers.length; i += 1) {
        flowers[i].position.y = 0.12 + Math.sin(time * 1.4 + i) * 0.02;
      }
      for (const koi of kois) {
        const a = time * koi.speed + koi.phase;
        koi.mesh.position.set(24 + Math.cos(a) * 1.5, 0.1, -6 + Math.sin(a) * 1.15);
        koi.mesh.rotation.y = -a;
      }
    },
  };
}

function buildGate(scene, colliders) {
  const z = 26.2;
  box(scene, 0.7, 5.6, 0.7, -4.1, 2.8, z, roofMat, colliders, true);
  box(scene, 0.7, 5.6, 0.7, 4.1, 2.8, z, roofMat, colliders, true);
  box(scene, 9.4, 0.38, 0.85, 0, 4.85, z, roofMat);
  box(scene, 10.2, 0.28, 1.05, 0, 5.25, z, goldMat);
  box(scene, 8.2, 0.45, 1.3, 0, 4.45, z, wallMat);
  // Small roof planes leaning.
  const roofL = new THREE.Mesh(boxGeo, roofMat);
  roofL.scale.set(5.2, 0.16, 1.5);
  roofL.position.set(-2.2, 5.55, z);
  roofL.rotation.z = 0.18;
  const roofR = new THREE.Mesh(boxGeo, roofMat);
  roofR.scale.set(5.2, 0.16, 1.5);
  roofR.position.set(2.2, 5.55, z);
  roofR.rotation.z = -0.18;
  scene.add(roofL, roofR);
  lantern(scene, -4.1, z + 0.2, 3.3);
  lantern(scene, 4.1, z - 0.2, 3.3);
}

function buildStage(scene, colliders) {
  box(scene, 7.2, 0.22, 5.2, -22, 0.12, -8.2, new THREE.MeshLambertMaterial({ color: 0x8c2f34 }));
  box(scene, 7.4, 2.4, 0.28, -22, 1.3, -10.7, wallMat, colliders, true);
  box(scene, 0.28, 2.4, 4.4, -25.5, 1.3, -8.4, wallMat, colliders, true);
  box(scene, 0.28, 2.4, 4.4, -18.5, 1.3, -8.4, woodMat, colliders, true);
  const posts = [[-25.2, -10.4], [-18.8, -10.4], [-25.2, -6.2], [-18.8, -6.2]];
  for (const [x, z] of posts) box(scene, 0.22, 3.1, 0.22, x, 1.55, z, woodMat);
  box(scene, 7.6, 0.18, 5.4, -22, 3.2, -8.4, roofMat);
  const lip = new THREE.Mesh(boxGeo, roofMat);
  lip.scale.set(8.2, 0.14, 1.2);
  lip.position.set(-22, 3.15, -5.7);
  lip.rotation.x = -0.35;
  scene.add(lip);
  // Benches.
  for (const x of [-24.2, -22.4, -20.6, -18.9]) {
    box(scene, 1.5, 0.22, 0.42, x, 0.18, -3.9, woodMat);
  }
}

function buildPlaza(scene) {
  const mat = new THREE.MeshLambertMaterial({ color: 0xd8c4a0 });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(4.2, 20), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(-12, 0.04, 8);
  mesh.receiveShadow = true;
  scene.add(mesh);
  box(scene, 0.7, 0.12, 0.7, -12, 0.08, 8, stoneMat);
}

function buildPond(scene, colliders) {
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(3.3, 18), waterMat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(24, 0.045, -6);
  scene.add(mesh);
  const rim = new THREE.Mesh(new THREE.RingGeometry(3.2, 3.7, 18), stoneMat);
  rim.rotation.x = -Math.PI / 2;
  rim.position.set(24, 0.05, -6);
  scene.add(rim);
  colliders.push({ minX: 21.2, maxX: 26.8, minZ: -8.8, maxZ: -3.2, h: 0.4 });
}

function buildStall(scene, colliders) {
  box(scene, 2.4, 1.3, 1.4, 18, 0.7, 6.4, woodMat, colliders, true);
  box(scene, 2.8, 0.12, 1.8, 18, 1.7, 6.4, roofMat);
  const awning = new THREE.Mesh(boxGeo, goldMat);
  awning.scale.set(2.2, 0.08, 0.8);
  awning.position.set(18, 1.45, 7.3);
  awning.rotation.x = 0.4;
  scene.add(awning);
}

function buildHouse(scene, colliders) {
  box(scene, 4.2, 2.2, 3.4, 26, 1.1, 18, wallMat, colliders, true);
  box(scene, 5, 0.28, 4.2, 26, 2.35, 18, roofMat);
  box(scene, 3.2, 0.9, 2.4, -28, 0.5, 8, woodMat, colliders, true);
  box(scene, 3.8, 0.18, 3, -28, 1.15, 8, roofMat);
}

function addTree(scene, colliders, x, z, scale, kind) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 0.7;
  const crown = new THREE.Mesh(kind === 'pine' ? pineGeo : crownGeo, kind === 'pine' ? pineMat : (x > 0 ? leafMat : leafMat2));
  crown.position.y = kind === 'pine' ? 1.9 : 1.7;
  group.add(trunk, crown);
  if (kind !== 'pine') {
    const puff = new THREE.Mesh(crownGeo, leafMat2);
    puff.position.set(0.35, 1.85, 0.1);
    puff.scale.setScalar(0.72);
    group.add(puff);
  }
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  scene.add(group);
  const r = 0.28 * scale;
  colliders.push({ minX: x - r, maxX: x + r, minZ: z - r, maxZ: z + r, h: 2 });
  return group;
}

function createBoard(scene, colliders) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1280;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new THREE.MeshBasicMaterial({ map: tex });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 3.125), mat);
  plane.position.set(7.4, 1.85, 14.6);
  scene.add(plane);
  box(scene, 2.7, 3.3, 0.12, 7.4, 1.85, 14.42, woodMat, colliders, true);
  box(scene, 0.16, 1.2, 0.16, 6.5, 0.6, 14.5, woodMat);
  box(scene, 0.16, 1.2, 0.16, 8.3, 0.6, 14.5, woodMat);

  function paint(heading, sub, rows) {
    ctx.fillStyle = '#f6efe2';
    ctx.fillRect(0, 0, 1024, 1280);
    ctx.fillStyle = '#8d2a30';
    ctx.fillRect(0, 0, 28, 1280);
    ctx.fillRect(0, 0, 1024, 28);
    ctx.fillRect(996, 0, 28, 1280);
    ctx.fillRect(0, 1252, 1024, 28);
    ctx.fillStyle = '#6b221f';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    fit(ctx, heading, 64, 48, 900, 72, '700');
    ctx.fillStyle = '#8a5a3a';
    fit(ctx, sub, 64, 140, 900, 36, '500');
    rows.forEach((row, i) => {
      const y = 230 + i * 250;
      ctx.fillStyle = '#efe2cb';
      ctx.fillRect(56, y, 920, 220);
      ctx.fillStyle = row.accent || '#9a2e32';
      ctx.fillRect(56, y, 16, 220);
      ctx.fillStyle = '#3a241c';
      fit(ctx, row.title, 96, y + 18, 860, 48, '700');
      ctx.fillStyle = '#6b221f';
      fit(ctx, row.now, 96, y + 84, 860, 36, '600');
      ctx.fillStyle = '#6d5a48';
      fit(ctx, row.next, 96, y + 146, 860, 30, '500');
    });
    tex.needsUpdate = true;
  }

  paint('节目单', '…', []);
  return { paint };
}

function fit(ctx, text, x, y, maxW, px, weight) {
  let size = px;
  const family = '"Noto Sans CJK SC", "Noto Sans CJK TC", sans-serif';
  ctx.font = `${weight} ${size}px ${family}`;
  const content = text || '';
  while (size > 18 && ctx.measureText(content).width > maxW) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  ctx.fillText(content, x, y);
}

export function blocked(x, z, radius, boxes, bodies) {
  if (x < -34.6 || x > 34.6 || z > 25.6 || z < -29.4) {
    const inGate = z > 24.8 && z < 27.2 && Math.abs(x) < 3.35;
    if (!inGate) return true;
  }
  for (let i = 0; i < boxes.length; i += 1) {
    const b = boxes[i];
    const cx = Math.max(b.minX, Math.min(x, b.maxX));
    const cz = Math.max(b.minZ, Math.min(z, b.maxZ));
    const dx = x - cx;
    const dz = z - cz;
    if (dx * dx + dz * dz < radius * radius) return true;
  }
  if (bodies) {
    for (let i = 0; i < bodies.length; i += 1) {
      const body = bodies[i];
      const dx = x - body.x;
      const dz = z - body.z;
      const rr = radius + body.r;
      if (dx * dx + dz * dz < rr * rr) return true;
    }
  }
  return false;
}

const _pull = new THREE.Vector3();

export function pullCamera(target, desired, boxes) {
  const dx = desired.x - target.x;
  const dy = desired.y - target.y;
  const dz = desired.z - target.z;
  let keep = 1;
  for (let i = 1; i <= 8; i += 1) {
    const s = i / 8;
    const x = target.x + dx * s;
    const y = target.y + dy * s;
    const z = target.z + dz * s;
    if (y < 3.4 && pointHits(x, z, boxes)) {
      keep = (i - 1) / 8;
      break;
    }
  }
  _pull.set(target.x + dx * Math.max(0.18, keep), target.y + dy * Math.max(0.18, keep), target.z + dz * Math.max(0.18, keep));
  if (keep < 0.35) _pull.y = Math.max(_pull.y, target.y + 1.4);
  desired.copy(_pull);
}

function pointHits(x, z, boxes) {
  for (let i = 0; i < boxes.length; i += 1) {
    const b = boxes[i];
    if (x > b.minX - 0.25 && x < b.maxX + 0.25 && z > b.minZ - 0.25 && z < b.maxZ + 0.25) return true;
  }
  return false;
}

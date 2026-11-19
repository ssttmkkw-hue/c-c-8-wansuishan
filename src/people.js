import * as THREE from 'three';

/**
 * Jointed chibi. Adapted from the owner's procedural rig
 * (c-c-5-ai-theater): pelvis, spine, head, jaw, shoulders, elbows, hips, knees.
 * Faces local +Z. rotation.y = atan2(dx, dz) looks toward a world point.
 */

const GEO = {
  pelvis: new THREE.BoxGeometry(0.28, 0.16, 0.16),
  chest: new THREE.BoxGeometry(0.38, 0.36, 0.2),
  head: new THREE.SphereGeometry(0.2, 10, 8),
  hair: new THREE.SphereGeometry(0.21, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.58),
  nose: new THREE.SphereGeometry(0.04, 6, 5),
  bun: new THREE.SphereGeometry(0.08, 6, 6),
  upper: new THREE.CapsuleGeometry(0.055, 0.18, 1, 5),
  fore: new THREE.CapsuleGeometry(0.045, 0.16, 1, 5),
  hand: new THREE.SphereGeometry(0.048, 6, 5),
  thigh: new THREE.CapsuleGeometry(0.07, 0.2, 1, 5),
  shin: new THREE.CapsuleGeometry(0.055, 0.18, 1, 5),
  foot: new THREE.BoxGeometry(0.09, 0.05, 0.16),
  eye: new THREE.SphereGeometry(0.034, 6, 5),
  mouth: new THREE.BoxGeometry(0.08, 0.028, 0.02),
  lid: new THREE.BoxGeometry(0.078, 0.07, 0.02),
  belt: new THREE.BoxGeometry(0.3, 0.06, 0.18),
  hatBrim: new THREE.CylinderGeometry(0.26, 0.26, 0.03, 8),
  hatTop: new THREE.CylinderGeometry(0.14, 0.16, 0.14, 8),
  skirt: new THREE.ConeGeometry(0.3, 0.48, 8),
  blob: new THREE.CircleGeometry(0.32, 12),
  ring: new THREE.RingGeometry(0.34, 0.46, 20),
};

const mats = new Map();
const casters = [];

function mat(color, emissive = 0) {
  const key = `${color}:${emissive}`;
  let material = mats.get(key);
  if (!material) {
    material = new THREE.MeshLambertMaterial({
      color,
      emissive,
      emissiveIntensity: emissive ? 0.45 : 0,
    });
    mats.set(key, material);
  }
  return material;
}

const BLOB = new THREE.MeshBasicMaterial({
  color: 0x3a2a22,
  transparent: true,
  opacity: 0.22,
  depthWrite: false,
});
const RING = new THREE.MeshBasicMaterial({
  color: 0xe6c36a,
  transparent: true,
  opacity: 0.85,
  side: THREE.DoubleSide,
  depthWrite: false,
});

function addMesh(geo, material, parent, x, y, z, cast) {
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  if (cast) casters.push(mesh);
  return mesh;
}

function joint(parent, bag, name, x, y, z) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x, y, z);
  if (name.startsWith('shoulder')) group.rotation.order = 'YXZ';
  parent.add(group);
  bag[name] = group;
  return group;
}

export function setPeopleShadows(on) {
  for (const mesh of casters) mesh.castShadow = !!on;
}

export function createPerson(opts = {}) {
  const joints = {};
  const root = new THREE.Group();
  root.name = opts.id || 'person';
  const cloth = mat(opts.color ?? 0x8d4a3a);
  const clothDark = mat(opts.dark ?? shade(opts.color ?? 0x8d4a3a, 0.72));
  const skin = mat(opts.skin ?? 0xf0c7a0);
  const hair = mat(opts.hair ?? 0x2a2118);
  const shoe = mat(0x2a211c);
  const mouthMat = mat(0x9a3d48);
  const eyeMat = mat(0x1a120c);

  const pelvis = joint(root, joints, 'pelvis', 0, 0.78, 0);
  addMesh(GEO.pelvis, clothDark, pelvis, 0, 0, 0, true);
  const chest = joint(pelvis, joints, 'chest', 0, 0.28, 0);
  addMesh(GEO.chest, cloth, chest, 0, 0.02, 0, true);
  addMesh(GEO.belt, mat(opts.belt ?? 0xd4b483), chest, 0, -0.16, 0.01, false);

  const head = joint(chest, joints, 'head', 0, 0.36, 0);
  addMesh(GEO.head, skin, head, 0, 0.08, 0, true);
  addMesh(GEO.nose, skin, head, 0, 0.05, 0.18, false);
  const hairMesh = addMesh(GEO.hair, hair, head, 0, 0.16, 0.02, false);
  if (opts.bun) addMesh(GEO.bun, hair, head, 0, 0.28, -0.02, false);
  if (opts.skirt) {
    const skirt = addMesh(GEO.skirt, mat(opts.skirt), pelvis, 0, -0.22, 0, false);
    skirt.castShadow = false;
  }
  if (opts.hat) {
    const hatMat = mat(opts.hat);
    addMesh(GEO.hatBrim, hatMat, head, 0, 0.3, 0, false);
    addMesh(GEO.hatTop, hatMat, head, 0, 0.4, 0, false);
    hairMesh.scale.set(0.72, 0.45, 0.72);
  }

  const eyeL = addMesh(GEO.eye, eyeMat, head, -0.07, 0.1, 0.16, false);
  const eyeR = addMesh(GEO.eye, eyeMat, head, 0.07, 0.1, 0.16, false);
  const lidL = addMesh(GEO.lid, skin, head, -0.07, 0.145, 0.175, false);
  const lidR = addMesh(GEO.lid, skin, head, 0.07, 0.145, 0.175, false);
  lidL.scale.y = 0.16;
  lidR.scale.y = 0.16;
  const jaw = joint(head, joints, 'jaw', 0, -0.02, 0.12);
  const mouth = addMesh(GEO.mouth, mouthMat, jaw, 0, 0, 0.06, false);
  joints.lidL = lidL;
  joints.lidR = lidR;
  joints.mouth = mouth;
  joints.eyeL = eyeL;
  joints.eyeR = eyeR;

  const arm = (side) => {
    const s = side === 'L' ? -1 : 1;
    const shoulder = joint(chest, joints, `shoulder${side}`, s * 0.22, 0.12, 0);
    addMesh(GEO.upper, cloth, shoulder, 0, -0.16, 0, false);
    const elbow = joint(shoulder, joints, `elbow${side}`, 0, -0.32, 0);
    addMesh(GEO.fore, skin, elbow, 0, -0.14, 0, false);
    joint(elbow, joints, `wrist${side}`, 0, -0.28, 0);
    addMesh(GEO.hand, skin, joints[`wrist${side}`], 0, 0, 0, false);
  };
  arm('L');
  arm('R');

  const leg = (side) => {
    const s = side === 'L' ? -1 : 1;
    const hip = joint(pelvis, joints, `hip${side}`, s * 0.09, -0.08, 0);
    addMesh(GEO.thigh, clothDark, hip, 0, -0.16, 0, false);
    const knee = joint(hip, joints, `knee${side}`, 0, -0.34, 0);
    addMesh(GEO.shin, clothDark, knee, 0, -0.14, 0, false);
    const ankle = joint(knee, joints, `ankle${side}`, 0, -0.28, 0);
    addMesh(GEO.foot, shoe, ankle, 0, -0.02, 0.04, false);
  };
  leg('L');
  leg('R');

  if (opts.player) {
    const ring = new THREE.Mesh(GEO.ring, RING);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    root.add(ring);
  } else {
    const blob = new THREE.Mesh(GEO.blob, BLOB);
    blob.rotation.x = -Math.PI / 2;
    blob.position.y = 0.025;
    root.add(blob);
  }

  const base = opts.scale ?? 1;
  root.scale.setScalar(base);
  return {
    root,
    joints,
    id: opts.id || '',
    name: opts.name || { zh: '', en: '' },
    seed: opts.seed ?? Math.random() * 8,
    base,
    sit: !!opts.sit,
  };
}

function shade(hex, amount) {
  const color = new THREE.Color(hex);
  color.multiplyScalar(amount);
  return color.getHex();
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

const _look = { yaw: 0, pitch: 0 };

export function lookAngles(person, target) {
  if (!target) {
    _look.yaw = 0;
    _look.pitch = 0;
    return _look;
  }
  const dx = target.x - person.root.position.x;
  const dy = (target.y ?? 1.3) - (person.root.position.y + (person.sit ? 1.05 : 1.45));
  const dz = target.z - person.root.position.z;
  let yaw = Math.atan2(dx, dz) - person.root.rotation.y;
  while (yaw > Math.PI) yaw -= Math.PI * 2;
  while (yaw < -Math.PI) yaw += Math.PI * 2;
  _look.yaw = clamp(yaw, -1.15, 1.15);
  _look.pitch = clamp(-dy / (Math.hypot(dx, dz) + 0.001) * 0.85, -0.45, 0.5);
  return _look;
}

/** Absolute pose. No per-frame allocation. */
export function posePerson(person, time, pose = {}) {
  const j = person.joints;
  const seed = person.seed;
  const breathe = Math.sin(time * 1.7 + seed) * 0.03;
  const walk = pose.walk || 0;
  const phase = time * (5.2 + walk * 3) + seed;
  const swing = walk > 0.08 ? Math.sin(phase) * 0.62 * Math.min(1.2, walk) : Math.sin(time * 1.1 + seed) * 0.045;
  const sit = !!(pose.sit ?? person.sit);

  j.pelvis.position.y = (sit ? 0.5 : 0.78) + Math.sin(time * 1.7 + seed) * 0.012;
  j.pelvis.rotation.set(0, 0, Math.sin(time * 0.8 + seed) * 0.035);
  j.chest.rotation.set((pose.gesture === 'bow' ? 0.55 : 0.04) + breathe, 0, 0);
  j.chest.position.y = 0.28;

  j.hipL.rotation.set(sit ? -1.2 : swing, 0, 0.05);
  j.hipR.rotation.set(sit ? -1.2 : -swing, 0, -0.05);
  j.kneeL.rotation.set(sit ? 1.35 : Math.max(0, -swing) * 0.55, 0, 0);
  j.kneeR.rotation.set(sit ? 1.35 : Math.max(0, swing) * 0.55, 0, 0);

  const g = pose.gesture || (walk > 0.08 ? 'walk' : 'idle');
  const s = Math.sin(time * (g === 'talk' || g === 'juggle' ? 5.5 : 2.2) + seed);
  let lX = -0.22;
  let rX = -0.22;
  let lZ = 0.16;
  let rZ = -0.16;
  let lE = 0.18;
  let rE = 0.18;
  if (walk > 0.08 && g === 'walk') {
    lX = -swing * 0.85;
    rX = swing * 0.85;
  }
  if (g === 'talk') { rX = -1.05 + s * 0.28; rE = -0.55; rZ = -0.18; lZ = 0.22; }
  if (g === 'point') { rX = -1.55; rE = -0.15; rZ = -0.1; }
  if (g === 'wave') { rX = -2.45; rZ = -0.25; rE = -0.2 + s * 0.45; }
  if (g === 'bow') { lX = 0.35; rX = 0.35; lE = 0.2; rE = 0.2; }
  if (g === 'clap') {
    const c = Math.abs(Math.sin(time * 10 + seed));
    lX = -1.15; rX = -1.15; lE = -0.85; rE = -0.85;
    lZ = 0.55 - c * 0.4; rZ = -0.55 + c * 0.4;
  }
  if (g === 'laugh') {
    j.chest.rotation.x = 0.28 + Math.abs(s) * 0.08;
    lX = -0.7; rX = -0.7; lE = -0.9; rE = -0.9; lZ = 0.15; rZ = -0.15;
  }
  if (g === 'juggle') {
    lX = -2.35 + Math.sin(time * 6 + seed) * 0.15;
    rX = -2.35 + Math.sin(time * 6 + seed + 1) * 0.15;
    lZ = 0.35; rZ = -0.35; lE = -0.35; rE = -0.35;
  }
  if (g === 'drum') {
    lX = -0.95 + Math.sin(time * 9) * 0.35;
    rX = -0.95 + Math.sin(time * 9 + 1.4) * 0.35;
    lE = -0.8; rE = -0.8; lZ = 0.25; rZ = -0.25;
  }
  if (g === 'listen') { lX = 0.22; rX = 0.05; lZ = 0.18; rZ = -0.12; }
  if (g === 'walk') { /* already applied */ }
  j.shoulderL.rotation.set(lX, 0, lZ);
  j.shoulderR.rotation.set(rX, 0, rZ);
  j.elbowL.rotation.set(lE, 0, 0);
  j.elbowR.rotation.set(rE, 0, 0);

  const blink = ((time + person.seed) % 3.8) > 3.62;
  j.lidL.scale.y = blink ? 1 : 0.14;
  j.lidR.scale.y = blink ? 1 : 0.14;
  if (pose.speak) {
    j.jaw.rotation.x = Math.abs(Math.sin(time * 14 + seed)) * 0.45;
    j.mouth.scale.y = 0.7 + Math.abs(Math.sin(time * 14 + seed)) * 1.6;
  } else {
    j.jaw.rotation.x = 0;
    j.mouth.scale.y = 0.55;
  }

  const look = lookAngles(person, pose.lookAt || null);
  let nod = 0;
  if (pose.nod) nod = Math.sin(time * 4.2 + seed) * 0.12;
  j.head.rotation.set(look.pitch + nod + (g === 'bow' ? 0.35 : 0), look.yaw, Math.sin(time * 0.6 + seed) * 0.03);

  const focus = pose.focus ? 1.12 : 1;
  const s0 = person.base * focus;
  if (person.root.scale.x !== s0) person.root.scale.setScalar(s0);
}

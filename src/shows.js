import * as THREE from 'three';
import { createPerson, posePerson } from './people.js';

/**
 * Always-on corners. Time is absolute seconds, so advance() and the render
 * loop share one clock. One speaker at a time for dialogue, same idea as
 * the English-sim scene director.
 */

const PERIOD = 28;

const PLAZA_LINES = [
  { who: 'alan', g: 'talk', sec: 3.3, react: 'nod', zh: '灯笼今天亮得早。', en: 'The lanterns are lit early today.' },
  { who: 'shan', g: 'point', sec: 3.5, react: 'nod', zh: '北路的鼓已经响了。', en: 'The drum on the north road has started.' },
  { who: 'mei', g: 'talk', sec: 3.6, react: 'laugh', zh: '我本想看花车，这圈子更暖。', en: 'I came for the parade. This circle is warmer.' },
  { who: 'zhou', g: 'talk', sec: 3.8, react: 'clap', zh: '站着别动。整座园子都在演。', en: 'Stand still. The whole park is performing.' },
  { who: 'alan', g: 'wave', sec: 3.2, react: 'laugh', zh: '那就把脚步放轻一点。', en: 'Then we should step a little softer.' },
  { who: 'mei', g: 'talk', sec: 3.4, react: 'nod', zh: '戏台那两位，又在说月亮。', en: 'Those two on the stage are talking about the moon again.' },
  { who: 'shan', g: 'point', sec: 3.3, react: 'clap', zh: '东边还有人抛球，别眨眼。', en: 'Someone is juggling to the east. Don\'t blink.' },
  { who: 'zhou', g: 'bow', sec: 3.2, react: 'clap', zh: '看完记得把帽子里的安静留下。', en: 'When you leave, leave a little quiet in the hat.' },
];

const STAGE_LINES = [
  { who: 'he', g: 'talk', sec: 3.6, react: 'nod', zh: '池子把月亮留着，云过去也不还。', en: 'The pond keeps the moon, even after the clouds pass.' },
  { who: 'wan', g: 'point', sec: 3.4, react: 'nod', zh: '那我把匆忙放在这级石头上。', en: 'Then I will set my hurry down on this step.' },
  { who: 'he', g: 'talk', sec: 3.5, react: null, zh: '灯只照到手能够到的地方。', en: 'A lamp only lights what a hand can reach.' },
  { who: 'wan', g: 'wave', sec: 3.3, react: 'laugh', zh: '够不到的，就交给花车。', en: 'What we cannot reach, we leave to the parade.' },
  { who: 'he', g: 'bow', sec: 3.2, react: 'clap', zh: '你若再来，我还在这根柱子下。', en: 'If you come again, I will still be under this post.' },
  { who: 'wan', g: 'talk', sec: 3.6, react: 'nod', zh: '我听见鼓了。月亮先替我等一会儿。', en: 'I hear the drum. The moon can wait a moment for me.' },
];

const STREET_LINES = [
  { who: 'shi', g: 'juggle', sec: 3.2, react: 'clap', zh: '三只球，一双手。', en: 'Three balls, two hands.' },
  { who: 'shi', g: 'juggle', sec: 2.8, react: null, zh: '别眨眼。', en: 'Don\'t blink.' },
  { who: 'shi', g: 'wave', sec: 3.0, react: 'laugh', zh: '下一只是给后排的。', en: 'The next one is for the back row.' },
  { who: 'shi', g: 'bow', sec: 3.3, react: 'clap', zh: '帽子在这儿，喜欢就留下一枚安静。', en: 'The hat is here. Leave a little quiet if you liked it.' },
];

const PARADE_LINES = [
  { who: 'drum', g: 'wave', sec: 3.2, react: 'clap', zh: '让一让，花车来了。', en: 'Make way — the lantern float is coming.' },
  { who: 'drum', g: 'drum', sec: 5.5, quiet: true, react: null, zh: '', en: '' },
  { who: 'banner', g: 'wave', sec: 3.4, react: 'clap', zh: '红的是灯，金的是路。', en: 'Red is the lantern, gold is the road.' },
  { who: 'drum', g: 'drum', sec: 5.2, quiet: true, react: null, zh: '', en: '' },
];

function phaseOf(lines, time) {
  let total = 0;
  for (let i = 0; i < lines.length; i += 1) total += lines[i].sec;
  let t = time % total;
  if (t < 0) t += total;
  for (let i = 0; i < lines.length; i += 1) {
    if (t < lines[i].sec) {
      return { i, local: t, line: lines[i], next: lines[(i + 1) % lines.length], total };
    }
    t -= lines[i].sec;
  }
  return { i: 0, local: 0, line: lines[0], next: lines[1] || lines[0], total };
}

function ellipse(u, cx, cz, rx, rz) {
  const a = u * Math.PI * 2;
  const x = cx + Math.cos(a) * rx;
  const z = cz + Math.sin(a) * rz;
  const dx = -Math.sin(a) * rx;
  const dz = Math.cos(a) * rz;
  return { x, z, yaw: Math.atan2(dx, dz) };
}

export function createShows(scene) {
  const shows = [];
  const bodies = [];
  const discs = [];

  const discGeo = new THREE.CircleGeometry(0.62, 18);
  function makeDisc(color) {
    const mesh = new THREE.Mesh(discGeo, new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.06;
    scene.add(mesh);
    discs.push(mesh);
    return mesh;
  }

  const ringGeo = new THREE.RingGeometry(0.85, 1.15, 28);
  function watchRing(x, z) {
    const mesh = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
      color: 0xe6c36a,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
    }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.055, z);
    scene.add(mesh);
    return mesh;
  }

  const plaza = buildDialogue(scene, {
    id: 'plaza',
    kind: 'talk',
    title: { zh: '广场闲谈', en: 'Plaza Talk' },
    area: { zh: '西广场', en: 'West Plaza' },
    x: -12,
    z: 8,
    stand: { x: -12, z: 13.4 },
    radius: 5.6,
    hear: 12,
    cam: new THREE.Vector3(-6.4, 2.45, 11.4),
    look: new THREE.Vector3(-12, 1.3, 8),
    face: { x: -12, z: 8 },
    lines: PLAZA_LINES,
    cast: [
      person({ id: 'alan', name: { zh: '阿兰', en: 'Alan' }, color: 0xc4564a, skin: 0xf0c7a0, hair: 0x2a2118, x: -13.3, z: 7.1, seed: 1 }),
      person({ id: 'shan', name: { zh: '小山', en: 'Shan' }, color: 0x3d7a62, skin: 0xd9a07a, hair: 0x1a120c, x: -10.6, z: 7.2, seed: 2 }),
      person({ id: 'mei', name: { zh: '小梅', en: 'Mei' }, color: 0xd46a8a, skin: 0xf3d2b5, hair: 0x4a3428, bun: true, skirt: 0xf0d0dc, x: -13.1, z: 9.1, seed: 3 }),
      person({ id: 'zhou', name: { zh: '老周', en: 'Zhou' }, color: 0xc4893a, skin: 0xc4845a, hair: 0x3a3028, hat: 0x4a3428, x: -10.7, z: 9.0, seed: 4 }),
    ],
    crowd: crowd(scene, -12, 8, 3.35, 5, 0.4),
    disc: makeDisc(0xffe08a),
  });
  watchRing(-12, 13.4);
  shows.push(plaza);

  const stageCast = [
    person({ id: 'he', name: { zh: '阿禾', en: 'He' }, color: 0x8d3a44, skin: 0xf0c7a0, hair: 0x241810, x: -23.15, z: -8.5, seed: 5, rot: 0 }),
    person({ id: 'wan', name: { zh: '江晚', en: 'Wan' }, color: 0x3d4f86, skin: 0xf3d2b5, hair: 0x2a2118, bun: true, skirt: 0xd7c4e8, x: -20.85, z: -8.5, seed: 6, rot: 0 }),
  ];
  const stageCrowd = [
    person({ id: 'a1', name: { zh: '观众', en: 'Guest' }, color: 0x6a5344, skin: 0xf0c7a0, x: -24.2, z: -3.55, seed: 7, sit: true, rot: Math.PI }),
    person({ id: 'a2', name: { zh: '观众', en: 'Guest' }, color: 0x355e78, skin: 0xd9a07a, x: -22.5, z: -3.5, seed: 8, sit: true, rot: Math.PI }),
    person({ id: 'a3', name: { zh: '观众', en: 'Guest' }, color: 0xa35b6a, skin: 0xf3d2b5, hair: 0x3a241c, bun: true, x: -20.7, z: -3.55, seed: 9, sit: true, rot: Math.PI }),
    person({ id: 'a4', name: { zh: '观众', en: 'Guest' }, color: 0x8a6a3a, skin: 0xc4845a, x: -19.0, z: -3.6, seed: 10, sit: true, rot: Math.PI }),
    person({ id: 'a5', name: { zh: '观众', en: 'Guest' }, color: 0x4a6741, skin: 0xf0c7a0, x: -17.2, z: -5.2, seed: 11, rot: Math.PI * 0.85 }),
  ];
  const stage = buildDialogue(scene, {
    id: 'stage',
    kind: 'stage',
    title: { zh: '灯与月', en: 'Lamp and Moon' },
    area: { zh: '戏台', en: 'Pavilion' },
    x: -22,
    z: -8.2,
    stand: { x: -22, z: -1.15 },
    radius: 5.8,
    hear: 13,
    cam: new THREE.Vector3(-20.4, 2.55, 0.85),
    look: new THREE.Vector3(-22, 1.45, -8.3),
    lines: STAGE_LINES,
    cast: stageCast,
    crowd: stageCrowd,
    disc: makeDisc(0xfff1c2),
  });
  watchRing(-22, -1.15);
  shows.push(stage);

  const juggler = person({
    id: 'shi',
    name: { zh: '小石', en: 'Shi' },
    color: 0xd3542c,
    skin: 0xf0c7a0,
    hair: 0x1c140f,
    hat: 0x2c3a55,
    x: 18,
    z: 10.2,
    seed: 12,
    rot: 0,
  });
  const balls = [0xe6c36a, 0xde4d4d, 0x4aa3c7].map((color) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 8, 6),
      new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.18 }),
    );
    juggler.root.add(mesh);
    return mesh;
  });
  const hat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.18, 0.1, 8),
    new THREE.MeshLambertMaterial({ color: 0x2c3a55 }),
  );
  hat.position.set(0.15, 0.06, 0.7);
  juggler.root.add(hat);
  const street = buildDialogue(scene, {
    id: 'street',
    kind: 'street',
    title: { zh: '路边杂耍', en: 'Street Juggler' },
    area: { zh: '东市', en: 'East Court' },
    x: 18,
    z: 10.2,
    stand: { x: 18, z: 15.2 },
    radius: 5.4,
    hear: 12,
    cam: new THREE.Vector3(21.4, 2.55, 14.4),
    look: new THREE.Vector3(18, 1.4, 10.2),
    lines: STREET_LINES,
    cast: [juggler],
    crowd: crowd(scene, 18, 10.2, 2.7, 4, 1.2, { arc: Math.PI * 0.7, face: 0 }),
    disc: makeDisc(0xffc48a),
    after(time) {
      for (let i = 0; i < balls.length; i += 1) {
        const a = time * 3.4 + i * ((Math.PI * 2) / 3);
        balls[i].position.set(Math.sin(a) * 0.34, 1.55 + Math.abs(Math.cos(a)) * 0.72, 0.28);
      }
    },
  });
  watchRing(18, 15.2);
  shows.push(street);

  const parade = buildParade(scene, makeDisc(0xffb070));
  watchRing(0, -7.1);
  shows.push(parade);

  shows.push(buildStory(scene, makeDisc(0xe7d2ff), watchRing));
  shows.push(buildPuppet(scene, makeDisc(0xd7e4ff), watchRing));
  shows.push(buildMartial(scene, makeDisc(0xffc2b0), watchRing));

  const guests = buildGuests(scene);

  function addBody(p, r) {
    bodies.push({ person: p, r, x: 0, z: 0 });
  }
  for (const show of shows) {
    for (const p of show.cast) addBody(p, 0.38);
    for (const p of show.crowd) addBody(p, 0.34);
  }
  for (const p of guests) addBody(p, 0.34);

  for (const show of shows) {
    for (const p of show.cast) if (p.root.parent !== parade.float) scene.add(p.root);
    for (const p of show.crowd) scene.add(p.root);
  }
  for (const p of guests) scene.add(p.root);
  scene.add(parade.float);

  function update(time) {
    for (const show of shows) show.update(time);
    updateGuests(guests, time, shows);
    for (let i = 0; i < bodies.length; i += 1) {
      const b = bodies[i];
      b.x = b.person.root.position.x;
      b.z = b.person.root.position.z;
    }
  }

  function list() {
    return shows.map(describe);
  }

  return { shows, update, list, bodies, describe };
}

function person(opts) {
  const p = createPerson(opts);
  p.root.position.set(opts.x, 0, opts.z);
  if (opts.rot != null) p.root.rotation.y = opts.rot;
  return p;
}

function crowd(scene, cx, cz, radius, count, seed, opt = {}) {
  const colors = [0x6d7a86, 0x8d5a6a, 0x4f6b4a, 0xb08958, 0x5c4a78, 0xa34b3c];
  const people = [];
  const arc = opt.arc ?? Math.PI * 1.15;
  const face = opt.face ?? -Math.PI / 2;
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const a = face - arc / 2 + arc * t;
    const p = createPerson({
      id: `c${seed}${i}`,
      name: { zh: '游客', en: 'Visitor' },
      color: colors[i % colors.length],
      skin: i % 2 ? 0xf0c7a0 : 0xd9a07a,
      hair: 0x2a2118,
      scale: i === count - 1 ? 0.78 : 1,
      seed: seed + i,
    });
    p.root.position.set(cx + Math.sin(a) * radius, 0, cz + Math.cos(a) * radius);
    p.root.rotation.y = Math.atan2(cx - p.root.position.x, cz - p.root.position.z);
    people.push(p);
  }
  return people;
}

function buildDialogue(scene, def) {
  const byId = new Map(def.cast.map((p) => [p.id, p]));
  const show = {
    id: def.id,
    kind: def.kind,
    title: def.title,
    area: def.area,
    x: def.x,
    z: def.z,
    stand: def.stand,
    radius: def.radius,
    hear: def.hear,
    cam: def.cam,
    look: def.look,
    cast: def.cast,
    crowd: def.crowd,
    speakerPos: { x: def.x, y: 1.4, z: def.z },
    speakerName: { zh: '', en: '' },
    line: null,
    update(time) {
      const ph = phaseOf(def.lines, time);
      show.line = ph.line;
      show.blurbNow = ph.line;
      show.blurbNext = ph.next;
      const speaker = byId.get(ph.line.who) || def.cast[0];
      show.speakerPos.x = speaker.root.position.x;
      show.speakerPos.y = 1.45;
      show.speakerPos.z = speaker.root.position.z;
      show.speakerName = speaker.name;
      const reacting = !!(ph.line.react && ph.local > ph.line.sec * 0.62);
      const lookTarget = { x: speaker.root.position.x, y: 1.4, z: speaker.root.position.z };
      for (const p of def.cast) {
        const mine = p === speaker;
        posePerson(p, time, {
          gesture: mine ? ph.line.g : (reacting ? (ph.line.react === 'laugh' ? 'laugh' : ph.line.react === 'nod' ? 'listen' : 'clap') : 'listen'),
          speak: mine && !ph.line.quiet,
          focus: mine,
          lookAt: mine ? { x: def.stand.x, y: 1.2, z: def.stand.z } : lookTarget,
          nod: !mine && ph.line.react === 'nod' && reacting,
          walk: 0,
        });
        const face = mine ? (def.face || def.stand) : { x: speaker.root.position.x, z: speaker.root.position.z };
        p.root.rotation.y = Math.atan2(face.x - p.root.position.x, face.z - p.root.position.z);
      }
      for (const p of def.crowd) {
        posePerson(p, time, {
          gesture: reacting ? (ph.line.react === 'laugh' ? 'laugh' : 'clap') : 'listen',
          speak: false,
          lookAt: lookTarget,
          nod: ph.line.react === 'nod' && reacting,
          sit: p.sit,
          walk: 0,
        });
      }
      if (def.disc) {
        def.disc.position.x = speaker.root.position.x;
        def.disc.position.z = speaker.root.position.z;
        def.disc.material.opacity = 0.28 + (ph.line.quiet ? 0 : 0.28);
      }
      if (def.kind === 'talk') show.look.set(def.x, 1.28, def.z);
      else if (def.kind === 'puppet') show.look.set(def.x + 0.8, 1.45, def.z);
      else if (def.kind === 'ring') show.look.set(def.x, 1.25, def.z);
      else if (def.kind === 'booth') show.look.set(speaker.root.position.x, 1.35, speaker.root.position.z);
      else show.look.set(speaker.root.position.x, 1.45, speaker.root.position.z);
      if (def.after) def.after(time, ph);
    },
  };
  return show;
}

function buildParade(scene, disc) {
  const drum = person({ id: 'drum', name: { zh: '鼓手', en: 'Drummer' }, color: 0x9a2e32, skin: 0xf0c7a0, hair: 0x241810, x: 0, z: -10, seed: 20 });
  const banner = person({ id: 'banner', name: { zh: '旗手', en: 'Banner' }, color: 0xc4893a, skin: 0xd9a07a, hair: 0x1a120c, x: 0, z: -10, seed: 21 });
  const dancer = person({ id: 'dancer', name: { zh: '花旦', en: 'Dancer' }, color: 0xd46a8a, skin: 0xf3d2b5, hair: 0x4a3428, bun: true, skirt: 0xf0d5dc, x: 0, z: -10, seed: 22 });
  const drumMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.1, 8),
    new THREE.MeshLambertMaterial({ color: 0x6b221f }),
  );
  drumMesh.position.set(0, -0.02, 0.24);
  drum.joints.chest.add(drumMesh);
  const flag = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.5, 5), new THREE.MeshLambertMaterial({ color: 0x4a3028 }));
  pole.position.y = 0.5;
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), new THREE.MeshLambertMaterial({ color: 0xb43338, side: THREE.DoubleSide }));
  cloth.position.set(0.4, 0.85, 0);
  const dot = new THREE.Mesh(new THREE.CircleGeometry(0.1, 8), new THREE.MeshLambertMaterial({ color: 0xe6c36a, side: THREE.DoubleSide }));
  dot.position.set(0.4, 0.85, 0.02);
  flag.add(pole, cloth, dot);
  banner.joints.wristR.add(flag);

  const float = new THREE.Group();
  const bed = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 1.25), new THREE.MeshLambertMaterial({ color: 0x8d2a30 }));
  bed.position.y = 0.4;
  const trim = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.12, 1.4), new THREE.MeshLambertMaterial({ color: 0xe6c36a, emissive: 0x8a6a2a, emissiveIntensity: 0.35 }));
  trim.position.y = 0.66;
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 1.3), new THREE.MeshLambertMaterial({ color: 0xc4564a }));
  canopy.position.y = 1.85;
  float.add(bed, trim, canopy);
  for (const x of [-0.7, 0.7]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 5), new THREE.MeshLambertMaterial({ color: 0x4a3028 }));
    post.position.set(x, 1.2, 0);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), new THREE.MeshLambertMaterial({ color: 0xffb347, emissive: 0xff5a24, emissiveIntensity: 0.8 }));
    lamp.position.set(x, 1.85, 0.55);
    float.add(post, lamp);
  }
  const rider = person({ id: 'rider', name: { zh: '花车', en: 'Float' }, color: 0xf2f0ea, skin: 0xf0c7a0, hair: 0x2a2118, x: 0, z: 0, seed: 23 });
  rider.root.position.y = 0.62;
  float.add(rider.root);

  const cast = [drum, banner, dancer];
  const show = {
    id: 'parade',
    kind: 'parade',
    title: { zh: '花车巡游', en: 'Lantern Parade' },
    area: { zh: '北路', en: 'North Loop' },
    x: 0,
    z: -16,
    stand: { x: 0, z: -7.1 },
    radius: 6.2,
    hear: 14,
    cam: new THREE.Vector3(0.4, 7.6, -1.6),
    look: new THREE.Vector3(0, 1.1, -12),
    cast,
    crowd: [],
    float,
    speakerPos: { x: 0, y: 1.5, z: -10 },
    speakerName: drum.name,
    line: PARADE_LINES[0],
    update(time) {
      const ph = phaseOf(PARADE_LINES, time);
      show.line = ph.line;
      show.blurbNow = ph.line.quiet ? { zh: '花车正经过北路', en: 'The float is on the north loop', g: 'drum', who: 'drum' } : ph.line;
      show.blurbNext = ph.next.quiet ? { zh: '鼓点继续', en: 'The drum keeps going' } : ph.next;
      const base = ((time / PERIOD) + 0.25) % 1;
      const slots = [
        { p: drum, u: 0.03, g: 'drum' },
        { p: banner, u: 0.0, g: 'wave' },
        { p: dancer, u: -0.03, g: 'wave' },
      ];
      let leader = null;
      for (const slot of slots) {
        const pose = ellipse((base + slot.u + 1) % 1, 0, -16, 14, 6);
        slot.p.root.position.set(pose.x, 0, pose.z);
        slot.p.root.rotation.y = pose.yaw;
        const speaking = ph.line.who === slot.p.id && !ph.line.quiet;
        posePerson(slot.p, time, {
          gesture: speaking ? ph.line.g : slot.g,
          speak: speaking,
          focus: speaking,
          walk: 1,
          lookAt: null,
        });
        if (!leader) leader = pose;
      }
      const fp = ellipse((base - 0.085 + 1) % 1, 0, -16, 14, 6);
      float.position.set(fp.x, 0, fp.z);
      float.rotation.y = fp.yaw;
      posePerson(rider, time, { gesture: 'wave', walk: 0, speak: false });
      const speaker = cast.find((p) => p.id === ph.line.who) || drum;
      show.speakerPos.x = speaker.root.position.x;
      show.speakerPos.y = 1.5;
      show.speakerPos.z = speaker.root.position.z;
      show.speakerName = speaker.name;
      const gx = (drum.root.position.x + banner.root.position.x + dancer.root.position.x + float.position.x) / 4;
      const gz = (drum.root.position.z + banner.root.position.z + dancer.root.position.z + float.position.z) / 4;
      show.cam.set(gx + 0.8, 5.1, gz + 11);
      show.look.set(gx, 1.15, gz);
      disc.position.set(speaker.root.position.x, 0.07, speaker.root.position.z);
    },
  };
  return show;
}

const STORY_LINES = [
  { who: 'shu', g: 'story', sec: 3.6, react: 'nod', zh: '从前园门一开，灯就自己亮了。', en: 'Once the gate opened, the lanterns lit themselves.' },
  { who: 'shu', g: 'point', sec: 3.4, react: 'nod', zh: '不是火。是有人在等。', en: 'Not fire. Someone was waiting.' },
  { who: 'shu', g: 'story', sec: 3.8, react: 'laugh', zh: '等的人后来去看花车，把故事留在凳子上。', en: 'The one who waited went to see the parade, and left the story on the bench.' },
  { who: 'shu', g: 'bow', sec: 3.0, react: 'clap', zh: '你们坐着，我再讲一寸。', en: 'Stay seated. I will tell one more inch.' },
];

const PUPPET_LINES = [
  { who: 'narr', g: 'talk', sec: 3.2, react: 'nod', zh: '灯一亮，影子就有了名字。', en: 'When the lamp comes up, a shadow gets a name.' },
  { who: 'narr', g: 'point', sec: 3.0, react: 'laugh', zh: '左边是月亮，右边是着急。', en: 'On the left, the moon. On the right, a hurry.' },
  { who: 'narr', g: 'talk', sec: 3.4, react: 'clap', zh: '它们打一架，其实是在鞠躬。', en: 'They fight, which is really a bow.' },
  { who: 'narr', g: 'bow', sec: 2.8, react: 'clap', zh: '幕落。下一折还是这两位。', en: 'Curtain. The next fold is the same two.' },
];

const MARTIAL_LINES = [
  { who: 'feng', g: 'strike', sec: 2.4, react: 'clap', zh: '看步，不看手。', en: 'Watch the step, not the hand.' },
  { who: 'lin', g: 'guard', sec: 2.2, react: 'nod', zh: '手已经到了。', en: 'The hand is already here.' },
  { who: 'feng', g: 'strike', sec: 2.6, react: 'clap', zh: '再慢一点，给后排。', en: 'Slower. The back row is still arriving.' },
  { who: 'lin', g: 'bow', sec: 2.4, react: 'clap', zh: '这一式叫做让路。', en: 'This form is called making way.' },
];

function buildStory(scene, disc, watchRing) {
  const teller = person({
    id: 'shu', name: { zh: '说书人', en: 'Teller' }, color: 0x6a4a8a, skin: 0xf0c7a0, hair: 0x2a2118, hat: 0x3a2a22,
    x: -18, z: 18.2, seed: 40, rot: 0, sit: true,
  });
  const bench = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 0.4), new THREE.MeshLambertMaterial({ color: 0x7a4b2e }));
  bench.position.set(-18, 0.2, 18.1);
  scene.add(bench);
  const listeners = [-1.15, 0, 1.15].map((dx, i) => person({
    id: `sl${i}`, name: { zh: '听众', en: 'Listener' }, color: [0x8d5a6a, 0x4f6b4a, 0x5c4a78][i],
    skin: i === 1 ? 0xd9a07a : 0xf0c7a0, x: -18 + dx, z: 15.4, seed: 41 + i, sit: true, rot: Math.PI,
  }));
  for (const x of [-19.2, -16.8]) {
    const stool = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.16, 0.42), new THREE.MeshLambertMaterial({ color: 0x6b4226 }));
    stool.position.set(x, 0.16, 15.5);
    scene.add(stool);
  }
  watchRing(-18, 13.6);
  return buildDialogue(scene, {
    id: 'story',
    kind: 'booth',
    title: { zh: '说书', en: 'Story Booth' },
    area: { zh: '西北棚', en: 'Northwest Shed' },
    x: -18, z: 18.2,
    stand: { x: -18, z: 13.6 },
    radius: 4.4,
    hear: 9,
    cam: new THREE.Vector3(-15.1, 1.9, 14.6),
    look: new THREE.Vector3(-18, 1.3, 17.6),
    face: { x: -18, z: 13.6 },
    lines: STORY_LINES,
    cast: [teller],
    crowd: listeners,
    disc,
  });
}

function buildPuppet(scene, disc, watchRing) {
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.45),
    new THREE.MeshLambertMaterial({ color: 0xf6e7c2, emissive: 0xd7b56a, emissiveIntensity: 0.45, side: THREE.DoubleSide }),
  );
  screen.position.set(-30.2, 1.55, -14);
  screen.rotation.y = Math.PI / 2;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.7, 2.7), new THREE.MeshLambertMaterial({ color: 0x5a3828 }));
  frame.position.set(-30.35, 1.5, -14);
  scene.add(frame, screen);
  const puppets = [0x2a241c, 0x6a2430].map((color, i) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.55), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    const head = new THREE.Mesh(new THREE.CircleGeometry(0.12, 8), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    head.position.y = 0.38;
    g.add(body, head);
    g.position.set(0, 0.15, 0.08);
    screen.add(g);
    return g;
  });
  const narr = person({
    id: 'narr', name: { zh: '讲幕人', en: 'Narrator' }, color: 0x3d4f86, skin: 0xf3d2b5, hair: 0x241810,
    x: -27.6, z: -14.8, seed: 50, rot: Math.PI / 2,
  });
  const ops = [0.7, -0.7].map((z, i) => person({
    id: `op${i}`, name: { zh: '操偶', en: 'Operator' }, color: i ? 0x8d3a44 : 0x355e78, skin: 0xf0c7a0,
    x: -31.3, z: -14 + z, seed: 51 + i, rot: Math.PI / 2,
  }));
  watchRing(-25.2, -14);
  const show = buildDialogue(scene, {
    id: 'puppet',
    kind: 'puppet',
    title: { zh: '皮影', en: 'Shadow Play' },
    area: { zh: '西棚', en: 'West Shed' },
    x: -30.2, z: -14,
    stand: { x: -25.2, z: -14 },
    radius: 5.2,
    hear: 11,
    cam: new THREE.Vector3(-24.4, 2.05, -12.1),
    look: new THREE.Vector3(-29.4, 1.45, -14),
    face: { x: -25, z: -14 },
    lines: PUPPET_LINES,
    cast: [narr, ...ops],
    crowd: crowd(scene, -27.2, -14, 1.8, 3, 3.2, { arc: 1.2, face: Math.PI / 2 }),
    disc,
    after(time) {
      puppets.forEach((puppet, i) => {
        const a = time * 1.6 + i * 1.4;
        puppet.position.x = (i === 0 ? -0.35 : 0.35) + Math.sin(a) * 0.18;
        puppet.position.y = 0.15 + Math.abs(Math.sin(a * 2)) * 0.12;
        puppet.rotation.z = Math.sin(a * 1.3) * 0.25;
      });
      for (const op of ops) {
        posePerson(op, time, { gesture: 'wave', walk: 0, lookAt: { x: -30, y: 1.5, z: -14 } });
        op.root.rotation.y = Math.PI / 2;
      }
    },
  });
  return show;
}

function buildMartial(scene, disc, watchRing) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.1, 2.45, 28),
    new THREE.MeshBasicMaterial({ color: 0xe6c36a, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(28, 0.05, -14);
  const mat = new THREE.Mesh(
    new THREE.CircleGeometry(2.05, 24),
    new THREE.MeshLambertMaterial({ color: 0xd8c4a0 }),
  );
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(28, 0.04, -14);
  scene.add(mat, ring);
  const feng = person({
    id: 'feng', name: { zh: '阿风', en: 'Feng' }, color: 0x9a3a2a, skin: 0xf0c7a0, hair: 0x1a120c,
    x: 27.2, z: -14, seed: 60, rot: Math.PI / 2,
  });
  const lin = person({
    id: 'lin', name: { zh: '阿林', en: 'Lin' }, color: 0xf2f0ea, skin: 0xd9a07a, hair: 0x3a3028,
    x: 28.8, z: -14, seed: 61, rot: -Math.PI / 2,
  });
  watchRing(24.2, -11.2);
  return buildDialogue(scene, {
    id: 'martial',
    kind: 'ring',
    title: { zh: '把式', en: 'Martial Ring' },
    area: { zh: '东南场', en: 'Southeast Ring' },
    x: 28, z: -14,
    stand: { x: 24.2, z: -11.2 },
    radius: 6,
    hear: 13,
    cam: new THREE.Vector3(24.6, 3.4, -9.4),
    look: new THREE.Vector3(28, 1.2, -14),
    face: { x: 28, z: -14 },
    lines: MARTIAL_LINES,
    cast: [feng, lin],
    crowd: crowd(scene, 28, -14, 3.3, 5, 4.4, { arc: Math.PI * 1.3, face: -0.4 }),
    disc,
  });
}

function buildGuests(scene) {
  return [
    person({ id: 'g1', name: { zh: '游客', en: 'Visitor' }, color: 0x5c6b8a, skin: 0xf0c7a0, x: 4, z: 12, seed: 30 }),
    person({ id: 'g2', name: { zh: '游客', en: 'Visitor' }, color: 0xa36b5a, skin: 0xd9a07a, bun: true, x: -4, z: 6, seed: 31 }),
    person({ id: 'g3', name: { zh: '游客', en: 'Visitor' }, color: 0x6a8f62, skin: 0xf3d2b5, x: 3.2, z: 0, seed: 32, scale: 0.86 }),
  ];
}

function updateGuests(guests, time, shows) {
  const paths = [
    { x: 4.1, z0: 16, z1: 1, speed: 0.22, phase: 0 },
    { x: -4.1, z0: 15, z1: -1, speed: 0.18, phase: 1.4 },
    { x: 3.4, z0: 4, z1: -6, speed: 0.16, phase: 0.6 },
  ];
  guests.forEach((p, i) => {
    const path = paths[i];
    const span = path.z0 - path.z1;
    const u = ((time * path.speed + path.phase) % 2 + 2) % 2;
    const going = u < 1;
    const z = going ? path.z0 - u * span : path.z1 + (u - 1) * span;
    p.root.position.set(path.x, 0, z);
    p.root.rotation.y = going ? Math.PI : 0;
    let look = null;
    let best = 12;
    for (const show of shows) {
      const dx = show.speakerPos.x - p.root.position.x;
      const dz = show.speakerPos.z - p.root.position.z;
      const d = Math.hypot(dx, dz);
      if (d < best) {
        best = d;
        look = show.speakerPos;
      }
    }
    posePerson(p, time, { gesture: look && best < 8 ? 'listen' : 'walk', walk: 0.85, lookAt: best < 8 ? look : null });
  });
}

function describe(show) {
  const now = show.blurbNow || show.line || { zh: '', en: '' };
  const next = show.blurbNext || { zh: '', en: '' };
  return {
    id: show.id,
    title: { zh: show.title.zh, en: show.title.en },
    kind: show.kind,
    area: { zh: show.area.zh, en: show.area.en },
    position: { x: show.x, z: show.z },
    stand: { x: show.stand.x, z: show.stand.z },
    now: { zh: now.zh || show.title.zh, en: now.en || show.title.en },
    next: { zh: next.zh || '', en: next.en || '' },
  };
}

export { describe };

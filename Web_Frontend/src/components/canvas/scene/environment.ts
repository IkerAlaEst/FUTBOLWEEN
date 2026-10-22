import * as THREE from 'three';
import { bar } from './textures';

export interface WalkerEntity {
  g: THREE.Group;
  ax: number;
  az: number;
  bx: number;
  bz: number;
  speed: number;
  t: number;
  dir: number;
  len: number;
  seed: number;
}

export function createHalloweenMaterials() {
  const pumpkinBodyMat = new THREE.MeshStandardMaterial({
    color: 0xff5e00,
    roughness: 0.35,
    emissive: 0xaa2200,
    emissiveIntensity: 0.8
  });
  const glowingEyesMat = new THREE.MeshBasicMaterial({ color: 0xffe600 });
  const glowingOrangeMat = new THREE.MeshBasicMaterial({ color: 0xff5e00 });
  const orangeNeonMat = new THREE.MeshBasicMaterial({ color: 0xff7a00 });
  const glowingPurpleMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });
  const glowingGreenMat = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
  const glowingCyanMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const skullBoneMat = new THREE.MeshStandardMaterial({ color: 0xf1ece1, roughness: 0.5, emissive: 0x332e24, emissiveIntensity: 0.3 });
  const gravestoneMat = new THREE.MeshStandardMaterial({ color: 0x4a4e58, roughness: 0.9 });
  const cliffRockMat = new THREE.MeshStandardMaterial({ color: 0x5a544c, roughness: 0.96, flatShading: true });
  const pineGreenMat = new THREE.MeshStandardMaterial({ color: 0x223d1e, roughness: 0.9, flatShading: true });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x453020, roughness: 0.95 });
  const goldMetalMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.25, metalness: 0.85, emissive: 0x78350f, emissiveIntensity: 0.3 });
  const steelMetalMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.85 });
  const burnishedSteelMat = new THREE.MeshStandardMaterial({ color: 0x71717a, roughness: 0.25, metalness: 0.8, emissive: 0x27272a, emissiveIntensity: 0.2 });
  const darkIronMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.4, metalness: 0.7 });
  const woodPlankMat = new THREE.MeshStandardMaterial({ color: 0x543d2b, roughness: 0.85 });
  const crimsonClothMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6, side: THREE.DoubleSide, emissive: 0x450a0a, emissiveIntensity: 0.3 });
  const royalPurpleMat = new THREE.MeshStandardMaterial({ color: 0x7e22ce, roughness: 0.45, side: THREE.DoubleSide, emissive: 0x3b0764, emissiveIntensity: 0.5 });
  const blkMat = new THREE.MeshBasicMaterial({ color: 0x07080e });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf6d3b3, roughness: 0.65 });
  const hairDarkMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.85 });
  const whiteCoatMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
  const medicalRedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const footballBlueMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4 });

  return {
    pumpkinBodyMat,
    glowingEyesMat,
    glowingOrangeMat,
    orangeNeonMat,
    glowingPurpleMat,
    glowingGreenMat,
    glowingCyanMat,
    skullBoneMat,
    gravestoneMat,
    cliffRockMat,
    pineGreenMat,
    trunkMat,
    goldMetalMat,
    steelMetalMat,
    burnishedSteelMat,
    darkIronMat,
    woodPlankMat,
    crimsonClothMat,
    royalPurpleMat,
    blkMat,
    skinMat,
    hairDarkMat,
    whiteCoatMat,
    medicalRedMat,
    footballBlueMat
  };
}

export function createDetailedPumpkin(scale = 1): THREE.Group {
  const mats = createHalloweenMaterials();
  const g = new THREE.Group();
  for (let r = 0; r < 6; r++) {
    const seg = new THREE.Mesh(new THREE.SphereGeometry(0.44, 12, 12), mats.pumpkinBodyMat);
    seg.scale.set(0.68, 0.92, 1.15);
    seg.rotation.y = (r * Math.PI) / 6;
    g.add(seg);
  }
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.26, 6), mats.pineGreenMat);
  stem.position.y = 0.46;
  stem.rotation.z = 0.25;
  g.add(stem);

  // Ojos brillantes triangulares
  const eyeGeo = new THREE.ConeGeometry(0.12, 0.16, 3);
  const eyeL = new THREE.Mesh(eyeGeo, mats.glowingEyesMat);
  eyeL.position.set(-0.16, 0.1, 0.44);
  eyeL.rotation.x = Math.PI / 2;
  eyeL.rotation.z = 0.2;
  const eyeR = new THREE.Mesh(eyeGeo, mats.glowingEyesMat);
  eyeR.position.set(0.16, 0.1, 0.44);
  eyeR.rotation.x = Math.PI / 2;
  eyeR.rotation.z = -0.2;

  // Boca en zigzag con colmillos
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.1), mats.glowingEyesMat);
  mouth.position.set(0, -0.12, 0.44);
  g.add(eyeL, eyeR, mouth);
  g.scale.setScalar(scale);
  return g;
}

export function createGhost(s = 1): THREE.Group {
  const mats = createHalloweenMaterials();
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xf0f6ff,
    emissive: 0x818cf8,
    emissiveIntensity: 0.7,
    transparent: true,
    opacity: 0.85,
    roughness: 0.35,
    side: THREE.DoubleSide
  });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 12), mat);
  head.position.y = 0.75;
  g.add(head);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 0.95, 14, 1, true), mat);
  body.position.y = 0.3;
  g.add(body);

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), mat);
    w.position.set(Math.cos(a) * 0.5, -0.15, Math.sin(a) * 0.5);
    g.add(w);
  }

  const eL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), mats.blkMat);
  eL.scale.set(1, 1.5, 0.6);
  eL.position.set(-0.18, 0.82, 0.44);
  const eR = eL.clone();
  eR.position.x = 0.18;

  const mo = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), mats.blkMat);
  mo.scale.set(1, 1.3, 0.6);
  mo.position.set(0, 0.58, 0.47);
  g.add(eL, eR, mo);
  g.scale.setScalar(s);
  return g;
}

export function makeTomb(): THREE.Group {
  const mats = createHalloweenMaterials();
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.25, 0.25), mats.gravestoneMat);
  b.position.y = 0.625;
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.25, 12), mats.gravestoneMat);
  t.rotation.x = Math.PI / 2;
  t.position.y = 1.25;
  b.castShadow = t.castShadow = true;
  g.add(b, t);
  return g;
}

export function makeSkull(): THREE.Group {
  const mats = createHalloweenMaterials();
  const g = new THREE.Group();
  const s = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), mats.skullBoneMat);
  s.position.y = 0.35;
  const j = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.26), mats.skullBoneMat);
  j.position.set(0, 0.1, 0.08);
  const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), mats.blkMat);
  e1.position.set(-0.11, 0.36, 0.26);
  const e2 = e1.clone();
  e2.position.x = 0.11;
  g.add(s, j, e1, e2);
  return g;
}

export function makeDeadTree(): THREE.Group {
  const mats = createHalloweenMaterials();
  const g = new THREE.Group();
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.18, 2.5, 6), mats.trunkMat);
  t.position.y = 1.25;
  g.add(t);
  [[0.9, 1.5, 0.6], [-1.1, 1.9, -0.8], [0.4, 2.1, 0.9]].forEach(([x, y, z]) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.07, 1.2, 5), mats.trunkMat);
    b.position.set(x * 0.4, y, z * 0.3);
    b.rotation.z = -x * 0.8;
    b.rotation.x = z * 0.5;
    g.add(b);
  });
  return g;
}

export function makeRock(r: number): THREE.Mesh {
  const mats = createHalloweenMaterials();
  const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), mats.cliffRockMat);
  m.scale.set(1 + Math.random() * 0.5, 0.6 + Math.random() * 0.5, 1 + Math.random() * 0.5);
  m.rotation.set(Math.random() * 3, Math.random() * 3, 0);
  m.castShadow = true;
  return m;
}

export function makeIsland(_k = 0): THREE.Group {
  const mats = createHalloweenMaterials();
  const g = new THREE.Group();
  const r = 2.15; // Tamaño perfecto y seguro para evitar cualquier colisión con la escalera
  const top = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.82, 0.75, 10), mats.cliffRockMat);
  top.position.y = -0.38;
  top.receiveShadow = true;
  g.add(top);
  const under = new THREE.Mesh(new THREE.ConeGeometry(r * 0.85, r * 2.2, 10), mats.cliffRockMat);
  under.rotation.x = Math.PI;
  under.position.y = -1.85;
  g.add(under);
  return g;
}

// ========================================================
// PERSONAJES ÉPICOS Y VISTOSOS DE LAS PIEDRAS (NPCs)
// ========================================================

/**
 * 🎮 1. EL GAMER NORMAL (Piedra Inferior - Explica las Normas)
 * Chico gamer humano y carismático, con cascos RGB con micro, sudadera gamer moderna,
 * mando de competición en las manos con LEDs y pantalla táctica holográfica.
 */
export function createGamerCharacter(): THREE.Group {
  const mats = createHalloweenMaterials();
  const g = new THREE.Group();

  // Pedestal Rúnico Tecnológico
  const runeRing = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.3, 24), mats.glowingGreenMat);
  runeRing.rotation.x = -Math.PI / 2;
  runeRing.position.y = 0.02;
  const innerDisc = new THREE.Mesh(new THREE.CircleGeometry(0.88, 24), new THREE.MeshBasicMaterial({ color: 0x052e16 }));
  innerDisc.rotation.x = -Math.PI / 2;
  innerDisc.position.y = 0.01;
  g.add(runeRing, innerDisc);

  // Torso con sudadera gamer moderna
  const hoodieMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.88, 0.44), hoodieMat);
  torso.position.y = 1.25;
  torso.castShadow = true;

  // Franjas neón verdes en la sudadera
  const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.78, 0.46), mats.glowingGreenMat);
  stripeL.position.set(-0.25, 1.25, 0);
  const stripeR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.78, 0.46), mats.glowingGreenMat);
  stripeR.position.set(0.25, 1.25, 0);
  g.add(torso, stripeL, stripeR);

  // Cabeza humana de gamer normal
  const headGroup = new THREE.Group();
  headGroup.position.y = 2.05;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 14), mats.skinMat);
  headGroup.add(head);

  // Pelo moderno
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 12), mats.hairDarkMat);
  hair.scale.set(1.02, 0.72, 1.05);
  hair.position.set(0, 0.08, -0.04);
  headGroup.add(hair);

  // Ojos y sonrisa
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), mats.blkMat);
  eyeL.position.set(-0.12, 0.06, 0.34);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.12;
  const smile = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.04), new THREE.MeshBasicMaterial({ color: 0x991b1b }));
  smile.position.set(0, -0.08, 0.34);
  headGroup.add(eyeL, eyeR, smile);

  // Cascos Gaming RGB con micrófono
  const headsetArch = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.05, 8, 20, Math.PI), mats.darkIronMat);
  headsetArch.position.set(0, 0.18, 0);
  headsetArch.rotation.z = Math.PI;

  const earL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 14), mats.glowingCyanMat);
  earL.position.set(-0.42, 0.02, 0);
  earL.rotation.z = Math.PI / 2;

  const earR = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 14), mats.glowingGreenMat);
  earR.position.set(0.42, 0.02, 0);
  earR.rotation.z = Math.PI / 2;

  const micBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.32, 6), mats.darkIronMat);
  micBoom.position.set(-0.32, -0.12, 0.2);
  micBoom.rotation.set(0.8, -0.4, 0);
  const micTip = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), mats.glowingGreenMat);
  micTip.position.set(-0.22, -0.24, 0.34);
  headGroup.add(headsetArch, earL, earR, micBoom, micTip);
  g.add(headGroup);

  // Piernas y zapatillas deportivas
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.85, 0.24), pantsMat);
  legL.position.set(-0.19, 0.45, 0);
  const legR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.85, 0.24), pantsMat);
  legR.position.set(0.19, 0.45, 0);
  const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.42), mats.glowingGreenMat);
  shoeL.position.set(-0.19, 0.09, 0.08);
  const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.42), mats.glowingGreenMat);
  shoeR.position.set(0.19, 0.09, 0.08);
  g.add(legL, legR, shoeL, shoeR);

  // Brazos y manos con mando
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.2), hoodieMat);
  armL.position.set(-0.46, 1.15, 0.2);
  armL.rotation.x = -0.7;
  armL.rotation.z = -0.15;
  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.2), hoodieMat);
  armR.position.set(0.46, 1.15, 0.2);
  armR.rotation.x = -0.7;
  armR.rotation.z = 0.15;
  g.add(armL, armR);

  // Mando de competición en las manos
  const padGroup = new THREE.Group();
  padGroup.position.set(0, 1.05, 0.45);
  const padBody = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.16, 0.28), mats.darkIronMat);
  const padBar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.05), mats.glowingCyanMat);
  padBar.position.set(0, 0.09, 0.12);
  const stickL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 10), mats.glowingGreenMat);
  stickL.position.set(-0.13, 0.1, -0.04);
  const stickR = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 10), mats.glowingGreenMat);
  stickR.position.set(0.13, 0.1, 0.04);
  padGroup.add(padBody, padBar, stickL, stickR);
  g.add(padGroup);

  // Mini pantalla holográfica flotante
  const holoMonitor = new THREE.Group();
  holoMonitor.position.set(-0.9, 1.6, 0.2);
  const hScreen = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.3, 0.04), new THREE.MeshBasicMaterial({ color: 0x0284c7 }));
  const hGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.25), mats.glowingCyanMat);
  hGlow.position.z = 0.025;
  holoMonitor.add(hScreen, hGlow);
  g.add(holoMonitor);

  // Foco de iluminación para el Gamer
  const gamerLight = new THREE.PointLight(0x22c55e, 3.5, 20);
  gamerLight.position.set(0, 2.2, 1.0);
  g.add(gamerLight);

  g.scale.setScalar(1.65);

  g.userData = {
    npcKey: 'normas',
    name: 'El Gamer',
    anim: (time: number) => {
      padGroup.position.y = 1.05 + Math.sin(time * 3) * 0.03;
      padGroup.rotation.z = Math.sin(time * 2) * 0.06;
      runeRing.rotation.z = time * 0.8;
      holoMonitor.position.y = 1.6 + Math.sin(time * 2.5) * 0.06;
      holoMonitor.rotation.y = Math.sin(time * 1.5) * 0.2;
    }
  };

  return g;
}

/**
 * 🩺 2. EL MÉDICO (Piedra Intermedia - Setup PC y Mandos)
 * Doctor oficial del torneo con bata blanca, estetoscopio al cuello,
 * portapapeles de certificación médica y técnica ("APTO") y maletín con cruz roja.
 */
export function createMedicCharacter(): THREE.Group {
  const mats = createHalloweenMaterials();
  const g = new THREE.Group();

  // Pedestal Clínico Deportivo
  const clinicRing = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.45, 24), mats.glowingCyanMat);
  clinicRing.rotation.x = -Math.PI / 2;
  clinicRing.position.y = 0.02;
  const innerDisc = new THREE.Mesh(new THREE.CircleGeometry(0.98, 24), new THREE.MeshBasicMaterial({ color: 0x082f49 }));
  innerDisc.rotation.x = -Math.PI / 2;
  innerDisc.position.y = 0.01;
  g.add(clinicRing, innerDisc);

  // Torso con bata blanca de médico
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.88, 0.44), mats.whiteCoatMat);
  torso.position.y = 1.25;
  torso.castShadow = true;

  // Cuello de camisa y corbata azul debajo de la bata
  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.46), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
  shirt.position.set(0, 1.48, 0.01);
  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.48), new THREE.MeshStandardMaterial({ color: 0x1e3a8a }));
  tie.position.set(0, 1.35, 0.02);

  // Bolsillo con bolígrafo y cruz roja en la bata
  const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.46), mats.whiteCoatMat);
  pocket.position.set(0.22, 1.35, 0.02);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.48), mats.medicalRedMat);
  crossH.position.set(0.22, 1.35, 0.03);
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, 0.48), mats.medicalRedMat);
  crossV.position.set(0.22, 1.35, 0.03);
  g.add(torso, shirt, tie, pocket, crossH, crossV);

  // Cabeza humana del Médico
  const headGroup = new THREE.Group();
  headGroup.position.y = 2.05;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 14), mats.skinMat);
  headGroup.add(head);

  // Pelo profesional castaño/oscuro
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 12), mats.hairDarkMat);
  hair.scale.set(1.02, 0.7, 1.05);
  hair.position.set(0, 0.08, -0.04);
  headGroup.add(hair);

  // Gafas profesionales
  const glasses = new THREE.Group();
  const frameL = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.015, 6, 12), mats.darkIronMat);
  frameL.position.set(-0.13, 0.06, 0.35);
  const frameR = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.015, 6, 12), mats.darkIronMat);
  frameR.position.set(0.13, 0.06, 0.35);
  const bridgeG = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.02), mats.darkIronMat);
  bridgeG.position.set(0, 0.06, 0.35);
  glasses.add(frameL, frameR, bridgeG);
  headGroup.add(glasses);

  // Ojos y sonrisa
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), mats.blkMat);
  eyeL.position.set(-0.13, 0.06, 0.34);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.13;
  const smile = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.04), new THREE.MeshBasicMaterial({ color: 0x991b1b }));
  smile.position.set(0, -0.08, 0.34);
  headGroup.add(eyeL, eyeR, smile);

  // Estetoscopio alrededor del cuello
  const stethLoop = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 8, 16), mats.darkIronMat);
  stethLoop.position.set(0, -0.32, 0.12);
  stethLoop.rotation.x = Math.PI / 2.2;

  const stethTube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 6), mats.darkIronMat);
  stethTube.position.set(0, -0.5, 0.26);

  const stethBell = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12), mats.steelMetalMat);
  stethBell.position.set(0, -0.72, 0.26);
  stethBell.rotation.x = Math.PI / 2;
  headGroup.add(stethLoop, stethTube, stethBell);
  g.add(headGroup);

  // Piernas y zapatos de médico
  const scrubsPants = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 });
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.85, 0.24), scrubsPants);
  legL.position.set(-0.19, 0.45, 0);
  const legR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.85, 0.24), scrubsPants);
  legR.position.set(0.19, 0.45, 0);
  const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.42), mats.whiteCoatMat);
  shoeL.position.set(-0.19, 0.08, 0.08);
  const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.42), mats.whiteCoatMat);
  shoeR.position.set(0.19, 0.08, 0.08);
  g.add(legL, legR, shoeL, shoeR);

  // Brazos con bata blanca
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.65, 0.22), mats.whiteCoatMat);
  armL.position.set(-0.48, 1.18, 0.18);
  armL.rotation.set(-0.55, 0.2, -0.2);

  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.65, 0.22), mats.whiteCoatMat);
  armR.position.set(0.48, 1.18, 0.18);
  armR.rotation.set(-0.55, -0.2, 0.2);
  g.add(armL, armR);

  // Portapapeles con certificado médico oficial en mano izquierda
  const clipboardGroup = new THREE.Group();
  clipboardGroup.position.set(-0.55, 1.25, 0.45);
  clipboardGroup.rotation.set(0.3, 0.25, -0.15);
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.56, 0.04), mats.woodPlankMat);
  const sheet = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.5, 0.02), mats.whiteCoatMat);
  sheet.position.z = 0.025;
  const clip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.06), mats.steelMetalMat);
  clip.position.set(0, 0.24, 0.04);
  const redCrossDoc = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.01), mats.medicalRedMat);
  redCrossDoc.position.set(0, 0.15, 0.04);
  clipboardGroup.add(board, sheet, clip, redCrossDoc);
  g.add(clipboardGroup);

  // Maletín médico de emergencias al lado
  const medKit = new THREE.Group();
  medKit.position.set(0.72, 0.45, 0.15);
  const kitBody = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.36, 0.24), mats.whiteCoatMat);
  const kitHandle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 12, Math.PI), mats.medicalRedMat);
  kitHandle.position.set(0, 0.2, 0);
  const kitCrossH = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.26), mats.medicalRedMat);
  const kitCrossV = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.26), mats.medicalRedMat);
  medKit.add(kitBody, kitHandle, kitCrossH, kitCrossV);
  g.add(medKit);

  // Luz clínica
  const medicLight = new THREE.PointLight(0x38bdf8, 4.5, 20);
  medicLight.position.set(0, 2.2, 1.0);
  g.add(medicLight);

  g.scale.setScalar(1.65);

  g.userData = {
    npcKey: 'setup_mandos',
    name: 'El Médico',
    anim: (time: number) => {
      clipboardGroup.position.y = 1.25 + Math.sin(time * 2.2) * 0.03;
      clinicRing.rotation.z = time * 0.5;
    }
  };

  return g;
}

/**
 * 🔮 2B. EL MAGO (Piedra Intermedia - Modo Halloween)
 * Gran Archimago de Footballween: Túnica púrpura real con ribetes dorados,
 * cabeza de calabaza mágica iluminada, sombrero puntiagudo y báculo arcano resplandeciente.
 */
export function createWizardCharacter(): THREE.Group {
  const mats = createHalloweenMaterials();
  const g = new THREE.Group();

  // Círculo Rúnico Arcano Violeta
  const runeRing = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.55, 24), mats.glowingPurpleMat);
  runeRing.rotation.x = -Math.PI / 2;
  runeRing.position.y = 0.02;
  const innerDisc = new THREE.Mesh(new THREE.CircleGeometry(1.08, 24), new THREE.MeshBasicMaterial({ color: 0x3b0764 }));
  innerDisc.rotation.x = -Math.PI / 2;
  innerDisc.position.y = 0.01;
  g.add(runeRing, innerDisc);

  // Túnica grandiosa con manto púrpura brillante y ribetes dorados
  const robeSkirt = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.82, 1.45, 14), mats.royalPurpleMat);
  robeSkirt.position.y = 0.72;
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.82, 0.45), mats.royalPurpleMat);
  torso.position.y = 1.38;

  // Franja frontal y cinto mágico dorado
  const robeStripe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.4, 0.46), mats.goldMetalMat);
  robeStripe.position.set(0, 0.9, 0.01);
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.14, 0.48), mats.glowingOrangeMat);
  belt.position.set(0, 1.15, 0);

  // Capa mágica violeta
  const cape = new THREE.Mesh(new THREE.BoxGeometry(0.88, 1.5, 0.06), mats.royalPurpleMat);
  cape.position.set(0, 1.1, -0.28);
  g.add(robeSkirt, torso, robeStripe, belt, cape);

  // Cuello dorado del manto
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.07, 8, 16), mats.goldMetalMat);
  collar.position.set(0, 1.76, 0);
  collar.rotation.x = Math.PI / 2;
  g.add(collar);

  // Cabeza: Gran Calabaza de Halloween Iluminada
  const head = createDetailedPumpkin(0.86);
  head.position.y = 2.12;
  g.add(head);

  // Sombrero de archimago púrpura real con ala ancha y hebilla dorada
  const hatGroup = new THREE.Group();
  hatGroup.position.set(0, 2.45, -0.05);

  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 0.06, 20), mats.royalPurpleMat);
  hatBrim.position.y = 0.02;

  const hatCone = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.25, 16), mats.royalPurpleMat);
  hatCone.position.set(0, 0.62, -0.08);
  hatCone.rotation.x = -0.25;

  const hatBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.52), mats.goldMetalMat);
  hatBuckle.position.set(0, 0.15, 0.02);

  hatGroup.add(hatBrim, hatCone, hatBuckle);
  g.add(hatGroup);

  // Báculo Arcano Resplandeciente (Staff)
  const staffGroup = new THREE.Group();
  staffGroup.position.set(0.68, 0, 0.35);

  const staffShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 2.6, 8), mats.trunkMat);
  staffShaft.position.y = 1.3;

  const staffHead = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 8, 16), mats.goldMetalMat);
  staffHead.position.y = 2.6;

  const staffOrb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), mats.glowingPurpleMat);
  staffOrb.position.y = 2.6;

  const staffLight = new THREE.PointLight(0xa855f7, 3.5, 12);
  staffLight.position.y = 2.6;

  staffGroup.add(staffShaft, staffHead, staffOrb, staffLight);
  g.add(staffGroup);

  // Brazos y mangas acampanadas del mago
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.65, 0.24), mats.royalPurpleMat);
  armL.position.set(-0.52, 1.25, 0.1);
  armL.rotation.set(-0.35, 0.1, -0.15);
  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.65, 0.24), mats.royalPurpleMat);
  armR.position.set(0.52, 1.25, 0.2);
  armR.rotation.set(-0.5, -0.1, 0.15);
  g.add(armL, armR);

  // Luz frontal mágica
  const wizardLight = new THREE.PointLight(0xc084fc, 4.0, 18);
  wizardLight.position.set(0, 2.0, 1.2);
  g.add(wizardLight);

  g.scale.setScalar(1.65);

  g.userData = {
    npcKey: 'setup_mandos',
    name: 'El Mago',
    anim: (time: number) => {
      staffOrb.position.y = 2.6 + Math.sin(time * 3) * 0.08;
      staffLight.intensity = 3.5 + Math.sin(time * 6) * 1.0;
      runeRing.rotation.z = time * 0.5;
      cape.rotation.x = 0.05 + Math.sin(time * 2) * 0.04;
    }
  };

  return g;
}

/**
 * ⚽ 3. EL FUTBOLISTA (Piedra Superior - Clasificación y Cuadro)
 * Atleta profesional de fútbol: Equipación oficial con el dorsal 10, brazalete de capitán,
 * botas de tacos, balón oficial del torneo a sus pies y la Gran Copa Dorada de Campeones.
 */
export function createFootballerCharacter(): THREE.Group {
  const mats = createHalloweenMaterials();
  const g = new THREE.Group();

  // Mini césped circular de estadio de fútbol con marcas de cal blanca
  const pitchRing = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.35, 0.16, 28), new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 }));
  pitchRing.position.y = 0.08;
  const chalkCircle = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.85, 24), mats.whiteCoatMat);
  chalkCircle.rotation.x = -Math.PI / 2;
  chalkCircle.position.y = 0.17;
  g.add(pitchRing, chalkCircle);

  // Piernas: Medias altas de fútbol (azul real), rodillas atléticas y botas de tacos
  const sockL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.55, 0.24), mats.footballBlueMat);
  sockL.position.set(-0.24, 0.45, 0);
  const kneeL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.22), mats.skinMat);
  kneeL.position.set(-0.24, 0.8, 0);

  const sockR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.55, 0.24), mats.footballBlueMat);
  sockR.position.set(0.24, 0.5, 0.18);
  sockR.rotation.x = -0.22;
  const kneeR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.22), mats.skinMat);
  kneeR.position.set(0.24, 0.82, 0.1);

  // Botas de fútbol (cleats)
  const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.42), mats.darkIronMat);
  bootL.position.set(-0.24, 0.09, 0.06);
  const bootStripeL = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.04, 0.2), mats.orangeNeonMat);
  bootStripeL.position.set(-0.24, 0.1, 0.06);

  const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.42), mats.darkIronMat);
  bootR.position.set(0.24, 0.2, 0.24);
  bootR.rotation.x = -0.22;
  const bootStripeR = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.04, 0.2), mats.orangeNeonMat);
  bootStripeR.position.set(0.24, 0.21, 0.24);
  bootStripeR.rotation.x = -0.22;

  g.add(sockL, kneeL, sockR, kneeR, bootL, bootStripeL, bootR, bootStripeR);

  // Pantalones cortos oficiales (blancos con franja lateral azul)
  const shortsL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.42, 0.28), mats.whiteCoatMat);
  shortsL.position.set(-0.22, 1.05, 0);
  const shortsR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.42, 0.28), mats.whiteCoatMat);
  shortsR.position.set(0.22, 1.05, 0.05);
  const waist = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.22, 0.38), mats.whiteCoatMat);
  waist.position.y = 1.25;
  g.add(shortsL, shortsR, waist);

  // Torso: Camiseta de fútbol azul real con cuello blanco y dorsal 10
  const jersey = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.78, 0.42), mats.footballBlueMat);
  jersey.position.y = 1.7;
  jersey.castShadow = true;

  // Franja central blanca de la camiseta
  const stripeCenter = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.79, 0.43), mats.whiteCoatMat);
  stripeCenter.position.set(0, 1.7, 0);

  // Escudo dorado del torneo en el pecho
  const chestBadge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.02), mats.goldMetalMat);
  chestBadge.position.set(-0.2, 1.85, 0.22);

  // Dorsal 10 en la espalda
  const dorsalNumber = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.36, 0.02), mats.goldMetalMat);
  dorsalNumber.position.set(0, 1.72, -0.22);

  g.add(jersey, stripeCenter, chestBadge, dorsalNumber);

  // Cabeza humana del futbolista con pelo moderno y cinta deportiva
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.2, 10), mats.skinMat);
  neck.position.y = 2.15;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.48, 0.42), mats.skinMat);
  head.position.y = 2.45;

  // Pelo moderno con tupé
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.28, 0.46), mats.hairDarkMat);
  hair.position.set(0, 2.65, -0.02);
  const hairTuft = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.24), mats.hairDarkMat);
  hairTuft.position.set(0, 2.76, 0.12);

  // Cinta deportiva elástica en el pelo
  const headband = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.44), mats.orangeNeonMat);
  headband.position.set(0, 2.58, 0.01);

  // Ojos decididos
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.02), mats.darkIronMat);
  eyeL.position.set(-0.12, 2.44, 0.22);
  const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.02), mats.darkIronMat);
  eyeR.position.set(0.12, 2.44, 0.22);

  g.add(neck, head, hair, hairTuft, headband, eyeL, eyeR);

  // Brazos atléticos con brazalete de Capitán en brazo izquierdo
  const armL = new THREE.Group();
  armL.position.set(-0.48, 1.95, 0);
  const sleeveL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.24), mats.footballBlueMat);
  sleeveL.position.y = -0.12;
  const bicepL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.48, 0.18), mats.skinMat);
  bicepL.position.y = -0.42;
  // Brazalete de capitán amarillo oro con la 'C'
  const armBand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.2), mats.goldMetalMat);
  armBand.position.y = -0.32;
  armL.add(sleeveL, bicepL, armBand);
  armL.rotation.z = 0.2;
  armL.rotation.x = -0.3;

  const armR = new THREE.Group();
  armR.position.set(0.48, 1.95, 0);
  const sleeveR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.24), mats.footballBlueMat);
  sleeveR.position.y = -0.12;
  const bicepR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.48, 0.18), mats.skinMat);
  bicepR.position.y = -0.42;
  armR.add(sleeveR, bicepR);
  armR.rotation.z = -0.2;
  armR.rotation.x = 0.2;

  g.add(armL, armR);

  // Balón de fútbol oficial (bajo el pie derecho del futbolista)
  const soccerBall = new THREE.Group();
  soccerBall.position.set(0.24, 0.26, 0.48);
  const ballSphere = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16), mats.whiteCoatMat);
  // Parches negros del balón
  const patch1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.02), mats.blkMat);
  patch1.position.set(0, 0, 0.25);
  const patch2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.02), mats.blkMat);
  patch2.position.set(0, 0.25, 0);
  patch2.rotation.x = Math.PI / 2;
  const patch3 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.02), mats.blkMat);
  patch3.position.set(0.24, 0, 0);
  patch3.rotation.y = Math.PI / 2;
  soccerBall.add(ballSphere, patch1, patch2, patch3);
  g.add(soccerBall);

  // Gran Copa Dorada de Campeones sobre pedestal al lado
  const trophyGroup = new THREE.Group();
  trophyGroup.position.set(-0.75, 0.35, 0.2);
  const trophyBase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.2, 12), mats.darkIronMat);
  trophyBase.position.y = 0.1;
  const trophyStem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.35, 10), mats.goldMetalMat);
  trophyStem.position.y = 0.35;
  const trophyCup = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.14, 0.48, 14), mats.goldMetalMat);
  trophyCup.position.y = 0.72;
  const trophyHandleL = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 12, Math.PI), mats.goldMetalMat);
  trophyHandleL.position.set(-0.28, 0.72, 0);
  trophyHandleL.rotation.y = Math.PI / 2;
  const trophyHandleR = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 12, Math.PI), mats.goldMetalMat);
  trophyHandleR.position.set(0.28, 0.72, 0);
  trophyHandleR.rotation.y = -Math.PI / 2;
  const trophyGlow = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.45, 16), mats.orangeNeonMat);
  trophyGlow.position.set(0, 1.05, 0);
  trophyGlow.rotation.x = -Math.PI / 2;

  trophyGroup.add(trophyBase, trophyStem, trophyCup, trophyHandleL, trophyHandleR, trophyGlow);
  g.add(trophyGroup);

  // Foco de iluminación de estadio deportivo
  const stadiumLight = new THREE.PointLight(0x38bdf8, 4.5, 20);
  stadiumLight.position.set(0, 2.2, 1.2);
  g.add(stadiumLight);

  g.scale.setScalar(1.65);

  g.userData = {
    npcKey: 'cuadro_guerrero',
    name: 'El Futbolista',
    anim: (time: number) => {
      soccerBall.rotation.y = time * 1.5;
      trophyGlow.rotation.z = time * 0.8;
      trophyGlow.position.y = 1.05 + Math.sin(time * 2.5) * 0.05;
    }
  };

  return g;
}
/**
 * ⚔️ 3B. EL GUERRERO / GUARDIÁN (Piedra Superior - Modo Halloween)
 * Imponente Guerrero de la Noche de las Ánimas:
 * Placas pesadas de acero oscuro bruñido con remaches de oro, hombreras con pinchos,
 * capa roja carmesí ondeando al viento, cabeza de calabaza guerrera con ojos ígneos
 * y mandoble colosal llameante con runas de fuego incandescentes.
 */
export function createWarriorCharacter(): THREE.Group {
  const mats = createHalloweenMaterials();
  const g = new THREE.Group();

  // Pedestal de roca volcánica oscura con círculo rúnico de fuego
  const rockBase = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.4, 0.22, 20), mats.cliffRockMat);
  rockBase.position.y = 0.11;
  const fireCircle = new THREE.Mesh(new THREE.RingGeometry(0.85, 1.2, 24), mats.orangeNeonMat);
  fireCircle.rotation.x = -Math.PI / 2;
  fireCircle.position.y = 0.23;
  g.add(rockBase, fireCircle);

  // Piernas con grebas de placas de acero oscuro y rodilleras de pincho
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.95, 0.28), mats.darkIronMat);
  legL.position.set(-0.24, 0.5, 0);
  const kneeL = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 5), mats.goldMetalMat);
  kneeL.rotation.x = Math.PI / 2;
  kneeL.position.set(-0.24, 0.6, 0.18);
  const footL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.42), mats.burnishedSteelMat);
  footL.position.set(-0.24, 0.1, 0.08);

  const legR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.95, 0.28), mats.darkIronMat);
  legR.position.set(0.24, 0.5, 0);
  const kneeR = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 5), mats.goldMetalMat);
  kneeR.rotation.x = Math.PI / 2;
  kneeR.position.set(0.24, 0.6, 0.18);
  const footR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.42), mats.burnishedSteelMat);
  footR.position.set(0.24, 0.1, 0.08);

  g.add(legL, kneeL, footL, legR, kneeR, footR);

  // Cinturón de combate con hebilla de oro y faldar de cota de malla / placas
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.2, 0.48), mats.darkIronMat);
  belt.position.y = 1.05;
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.5), mats.goldMetalMat);
  buckle.position.y = 1.05;
  const faulds = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.35, 0.44), mats.burnishedSteelMat);
  faulds.position.y = 0.88;
  g.add(belt, buckle, faulds);

  // Torso: Coraza de placas pesadas con gorguera y emblema de cruz de guerra
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.82, 0.48), mats.darkIronMat);
  chest.position.y = 1.55;
  const plateFront = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.72, 0.1), mats.burnishedSteelMat);
  plateFront.position.set(0, 1.56, 0.22);
  const crossEmblem = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.04), mats.goldMetalMat);
  crossEmblem.position.set(0, 1.6, 0.28);
  const crossBar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.04), mats.goldMetalMat);
  crossBar.position.set(0, 1.68, 0.28);
  g.add(chest, plateFront, crossEmblem, crossBar);

  // Hombreras macizas con púas
  const pauldronL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.42), mats.burnishedSteelMat);
  pauldronL.position.set(-0.58, 1.88, 0);
  const spikeL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 6), mats.goldMetalMat);
  spikeL.position.set(-0.58, 2.18, 0);

  const pauldronR = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.42), mats.burnishedSteelMat);
  pauldronR.position.set(0.58, 1.88, 0);
  const spikeR = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 6), mats.goldMetalMat);
  spikeR.position.set(0.58, 2.18, 0);
  g.add(pauldronL, spikeL, pauldronR, spikeR);

  // Capa carmesí desgarrada ondeando
  const cape = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.65, 0.06), mats.crimsonClothMat);
  cape.position.set(0, 1.25, -0.28);
  cape.rotation.x = 0.15;
  g.add(cape);

  // Cabeza: Calabaza de Halloween tenebrosa con yelmo de combate
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 2.25, 0);

  const pumpkinHead = createDetailedPumpkin(0.95);
  pumpkinHead.scale.set(0.9, 0.9, 0.9);
  headGroup.add(pumpkinHead);

  // Yelmo de combate con cuernos
  const helmBand = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.52, 0.16, 12), mats.burnishedSteelMat);
  helmBand.position.y = 0.22;
  const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.45, 6), mats.goldMetalMat);
  hornL.position.set(-0.46, 0.38, 0);
  hornL.rotation.z = 0.6;
  hornL.rotation.x = -0.2;
  const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.45, 6), mats.goldMetalMat);
  hornR.position.set(0.46, 0.38, 0);
  hornR.rotation.z = -0.6;
  hornR.rotation.x = -0.2;
  headGroup.add(helmBand, hornL, hornR);

  // Ojos ardientes
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.04), mats.glowingEyesMat);
  eyeL.position.set(-0.16, 0.02, 0.4);
  const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.04), mats.glowingEyesMat);
  eyeR.position.set(0.16, 0.02, 0.4);
  headGroup.add(eyeL, eyeR);

  g.add(headGroup);

  // Brazos acorazados sosteniendo el colosal mandoble
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.68, 0.24), mats.darkIronMat);
  armL.position.set(-0.44, 1.48, 0.24);
  armL.rotation.set(-0.6, 0.2, 0.3);

  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.68, 0.24), mats.darkIronMat);
  armR.position.set(0.44, 1.48, 0.24);
  armR.rotation.set(-0.6, -0.2, -0.3);
  g.add(armL, armR);

  // Colosal Mandoble Llameante (Greatsword) de dos manos
  const swordGroup = new THREE.Group();
  swordGroup.position.set(0, 0, 0.65);

  // Hoja clavada en el suelo o apoyada firmemente
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.2, 0.04), mats.burnishedSteelMat);
  blade.position.y = 1.1;

  // Filo incandescente de fuego naranja
  const bladeGlow = new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.1, 0.02), mats.orangeNeonMat);
  bladeGlow.position.y = 1.1;

  // Guarda y cruceta de oro con grabado
  const crossguard = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.12, 0.16), mats.goldMetalMat);
  crossguard.position.y = 2.22;

  // Empuñadura envuelta en cuero negro
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.55, 8), mats.darkIronMat);
  grip.position.y = 2.52;

  // Pomo con calavera / gema de fuego
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), mats.goldMetalMat);
  pommel.position.y = 2.82;

  // Luz de fuego de la espada
  const swordLight = new THREE.PointLight(0xff5500, 3.8, 12);
  swordLight.position.set(0, 1.4, 0.2);

  swordGroup.add(blade, bladeGlow, crossguard, grip, pommel, swordLight);
  g.add(swordGroup);

  // Luz frontal cálida
  const warriorLight = new THREE.PointLight(0xff7700, 4.0, 16);
  warriorLight.position.set(0, 2.0, 1.3);
  g.add(warriorLight);

  g.scale.setScalar(1.65);

  g.userData = {
    npcKey: 'cuadro_guerrero',
    name: 'El Guardián',
    anim: (time: number) => {
      bladeGlow.scale.x = 1.0 + Math.sin(time * 5.0) * 0.08;
      swordLight.intensity = 3.8 + Math.sin(time * 6.0) * 1.2;
      fireCircle.rotation.z = time * 0.6;
      cape.rotation.x = 0.15 + Math.sin(time * 2.5) * 0.05;
    }
  };

  return g;
}

/**
 * 🏰 4. LOS GUARDIANES DEL CASTILLO (Puerta de la Fortaleza de Xàtiva - Gran Final y Premio)
 * Centinelas Reales de Honor: Armadura completa de acero bruñido, yelmo con visera de gala y penacho púrpura,
 * capa señorial, alabarda ceremonial de 3.8m con hoja de plata y pebetero señorial.
 */
export function createGuardianCharacter(isLeft = true): THREE.Group {
  const mats = createHalloweenMaterials();
  const g = new THREE.Group();

  // Pedestal de piedra de cantería de Xàtiva con aro dorado
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.45, 12), mats.cliffRockMat);
  pedestal.position.y = 0.22;
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.65, 0.85, 16), mats.goldMetalMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.46;
  g.add(pedestal, ring);

  // Piernas con grebas de gala de acero bruñido y rodilleras de oro
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.9, 0.26), mats.burnishedSteelMat);
  legL.position.set(-0.2, 0.45, 0);
  const legR = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.9, 0.26), mats.burnishedSteelMat);
  legR.position.set(0.2, 0.45, 0);
  const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.42), mats.darkIronMat);
  bootL.position.set(-0.2, 0.1, 0.08);
  const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.42), mats.darkIronMat);
  bootR.position.set(0.2, 0.1, 0.08);
  g.add(legL, legR, bootL, bootR);

  // Torso con peto acorazado de acero y blasón real
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.96, 0.5), mats.burnishedSteelMat);
  torso.position.y = 1.38;
  torso.castShadow = true;

  // Tabardo real de gala (púrpura y oro de Xàtiva)
  const tabard = new THREE.Mesh(new THREE.BoxGeometry(0.44, 1.35, 0.52), mats.goldMetalMat);
  tabard.position.set(0, 1.15, 0.01);
  const tabardInsignia = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.8, 0.54), mats.royalPurpleMat);
  tabardInsignia.position.set(0, 1.15, 0.02);

  // Cinturón de caballero con hebilla de castillo
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.14, 0.52), mats.goldMetalMat);
  belt.position.set(0, 0.95, 0);
  g.add(torso, tabard, tabardInsignia, belt);

  // Capa señorial de terciopelo púrpura con ribetes dorados
  const cape = new THREE.Mesh(new THREE.BoxGeometry(0.86, 1.55, 0.06), mats.royalPurpleMat);
  cape.position.set(0, 1.15, -0.3);
  g.add(cape);

  // Hombreras de caballero de gala con bordes dorados
  const pauldronL = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.28, 0.42), mats.goldMetalMat);
  pauldronL.position.set(-0.55, 1.7, 0);
  const pauldronR = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.28, 0.42), mats.goldMetalMat);
  pauldronR.position.set(0.55, 1.7, 0);
  g.add(pauldronL, pauldronR);

  // Brazos y guanteletes de armadura
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.65, 0.22), mats.burnishedSteelMat);
  armL.position.set(-0.52, 1.25, 0.15);
  armL.rotation.set(-0.35, 0.1, -0.1);
  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.65, 0.22), mats.burnishedSteelMat);
  armR.position.set(0.52, 1.25, 0.15);
  armR.rotation.set(-0.35, -0.1, 0.1);
  g.add(armL, armR);

  // Cabeza: Yelmo de caballero real de acero pulido con visera de rejilla dorada (sin cabeza de monstruo)
  const helmet = new THREE.Group();
  helmet.position.y = 2.15;
  const helmBase = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.65, 14), mats.burnishedSteelMat);
  const helmVisor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.28), mats.goldMetalMat);
  helmVisor.position.set(0, 0.05, 0.24);
  const visorSlit = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.3), mats.blkMat);
  visorSlit.position.set(0, 0.06, 0.25);
  const plume = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.65, 0.48), mats.royalPurpleMat);
  plume.position.set(0, 0.45, -0.08);
  const plumeTip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.5), mats.goldMetalMat);
  plumeTip.position.set(0, 0.75, -0.08);
  helmet.add(helmBase, helmVisor, visorSlit, plume, plumeTip);
  g.add(helmet);

  // Alabarda Gigante Ceremonial (3.8 metros de altura con hoja pulida)
  const halberdGroup = new THREE.Group();
  const poleX = isLeft ? -0.68 : 0.68;
  halberdGroup.position.set(poleX, 0, 0.25);

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 3.8, 8), mats.trunkMat);
  shaft.position.y = 1.9;

  const axeBlade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.48), mats.steelMetalMat);
  axeBlade.position.set(isLeft ? 0.22 : -0.22, 3.2, 0);

  const spearTip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.75, 6), mats.goldMetalMat);
  spearTip.position.y = 3.9;

  halberdGroup.add(shaft, axeBlade, spearTip);
  g.add(halberdGroup);

  // Pebetero de piedra señorial
  const brazierGroup = new THREE.Group();
  brazierGroup.position.set(isLeft ? 0.95 : -0.95, 0.4, 0.25);
  const brazierBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 0.55, 8), mats.cliffRockMat);
  brazierBowl.position.y = 0.25;
  const brazierFlame = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.75, 7), mats.glowingOrangeMat);
  brazierFlame.position.y = 0.8;
  brazierGroup.add(brazierBowl, brazierFlame);
  g.add(brazierGroup);

  // Luz noble que ilumina la entrada del castillo
  const torchLight = new THREE.PointLight(0xf59e0b, 5.0, 22);
  torchLight.position.set(0, 2.4, 1.2);
  g.add(torchLight);

  g.scale.setScalar(1.6);

  g.userData = {
    npcKey: 'gran_final',
    name: 'Los Guardianes',
    brazierFlame,
    anim: (time: number) => {
      cape.rotation.x = 0.08 + Math.sin(time * 2) * 0.04;
      if (brazierFlame.visible) {
        brazierFlame.scale.y = 0.85 + Math.sin(time * 12 + (isLeft ? 0 : 3)) * 0.25;
      }
    }
  };

  return g;
}

/**
 * Decoración atmosférica de Halloween para las demás islas flotantes (sin muñecos extraños)
 */
export function createHalloweenIslandDecor(typeIndex: number): THREE.Group {
  const mats = createHalloweenMaterials();
  const g = new THREE.Group();
  const type = typeIndex % 3;

  if (type === 0) {
    // Trío de calabazas de Halloween resplandecientes (pequeño altar)
    const p1 = createDetailedPumpkin(1.1);
    p1.position.set(0, 0.45, 0);
    p1.rotation.y = 0.2;

    const p2 = createDetailedPumpkin(0.68);
    p2.position.set(0.65, 0.28, 0.25);
    p2.rotation.y = -0.5;

    const p3 = createDetailedPumpkin(0.48);
    p3.position.set(-0.55, 0.2, 0.2);
    p3.rotation.y = 0.8;

    const light = new THREE.PointLight(0xff7700, 2.2, 10);
    light.position.set(0, 0.8, 0.4);

    g.add(p1, p2, p3, light);
  } else if (type === 1) {
    // Lápida gótica antigua con calavera tallada y calabaza
    const tomb = makeTomb();
    tomb.position.set(0, 0, -0.1);

    const skull = makeSkull();
    skull.position.set(0.35, 0.15, 0.35);

    const p = createDetailedPumpkin(0.55);
    p.position.set(-0.45, 0.22, 0.3);

    const light = new THREE.PointLight(0xff5500, 1.8, 8);
    light.position.set(0, 0.9, 0.5);

    g.add(tomb, skull, p, light);
  } else {
    // Árbol retorcido espectral con calabaza iluminada a sus pies
    const tree = makeDeadTree();
    tree.position.set(0, 0, 0);

    const p = createDetailedPumpkin(0.75);
    p.position.set(0.4, 0.3, 0.2);

    const light = new THREE.PointLight(0xff6e14, 2.0, 9);
    light.position.set(0.4, 0.7, 0.4);

    g.add(tree, p, light);
  }

  g.scale.setScalar(1.2);
  return g;
}

// Compatibilidad retroactiva
export const createHalloweenIslandCreature = createHalloweenIslandDecor;

/**
 * 📚 Decoraciones escolares para el modo claro en las escaleras del IES Simarro
 */
export function createSchoolBooksProp(scale = 1): THREE.Group {
  const g = new THREE.Group();

  // Libro 1 (base - azul marino)
  const book1Cover = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.07, 0.36),
    new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4 })
  );
  book1Cover.position.y = 0.035;
  const book1Pages = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.05, 0.33),
    new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.8 })
  );
  book1Pages.position.set(0.01, 0.035, 0);

  // Libro 2 (medio - verde bosque, ligeramente girado)
  const book2Cover = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.06, 0.32),
    new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 })
  );
  book2Cover.position.set(0, 0.1, 0);
  book2Cover.rotation.y = 0.15;
  const book2Pages = new THREE.Mesh(
    new THREE.BoxGeometry(0.41, 0.045, 0.29),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 })
  );
  book2Pages.position.set(0.01, 0.1, 0);
  book2Pages.rotation.y = 0.15;

  // Libreta de espiral (arriba - roja con anillas metálicas)
  const notebook = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.04, 0.28),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 })
  );
  notebook.position.set(-0.02, 0.15, 0.02);
  notebook.rotation.y = -0.2;

  // Anillas metálicas de la libreta
  const spiralRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.26, 6),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 })
  );
  spiralRing.position.set(-0.2, 0.16, 0.02);
  spiralRing.rotation.z = Math.PI / 2;
  spiralRing.rotation.y = -0.2;

  // Bolígrafo azul encima de la libreta
  const pen = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.009, 0.24, 6),
    new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3 })
  );
  pen.position.set(0, 0.18, 0);
  pen.rotation.z = Math.PI / 2;
  pen.rotation.y = 0.4;

  g.add(book1Cover, book1Pages, book2Cover, book2Pages, notebook, spiralRing, pen);
  g.scale.setScalar(scale);
  return g;
}

export function createOpenBackpackProp(scale = 1): THREE.Group {
  const g = new THREE.Group();

  // Cuerpo principal de la mochila (de tela azul cielo / naranja)
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.75 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.6 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.58, 0.32), bodyMat);
  body.position.set(0, 0.25, 0);
  body.rotation.x = -0.25;
  body.rotation.z = 0.12;

  // Bolsillo delantero con cremallera
  const frontPocket = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.14), accentMat);
  frontPocket.position.set(0, 0.18, 0.2);
  frontPocket.rotation.x = -0.25;
  frontPocket.rotation.z = 0.12;

  // Cremallera metálica
  const zipper = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.025, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85 })
  );
  zipper.position.set(0, 0.31, 0.26);
  zipper.rotation.x = -0.25;
  zipper.rotation.z = 0.12;

  // Tirantes de la mochila caídos en el suelo
  const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.02), trimMat);
  strapL.position.set(-0.22, 0.08, -0.16);
  strapL.rotation.set(Math.PI / 2.3, 0, 0.2);

  const strapR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.48, 0.02), trimMat);
  strapR.position.set(0.2, 0.08, -0.16);
  strapR.rotation.set(Math.PI / 2.3, 0, -0.18);

  // Estuche escolar tubular salido de la mochila
  const pencilCase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.28, 8),
    new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.6 })
  );
  pencilCase.position.set(0.32, 0.06, 0.18);
  pencilCase.rotation.z = Math.PI / 2;
  pencilCase.rotation.y = 0.6;

  g.add(body, frontPocket, zipper, strapL, strapR, pencilCase);
  g.scale.setScalar(scale);
  return g;
}

export function createSandwichProp(scale = 1): THREE.Group {
  const g = new THREE.Group();

  // Servilleta de papel doblada
  const napkin = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.01, 0.36),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 })
  );
  napkin.position.y = 0.005;

  // Papel de aluminio plateado brillante envolviendo la mitad
  const foilMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.9,
    roughness: 0.25
  });
  const foilBase = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.22), foilMat);
  foilBase.position.set(-0.04, 0.06, 0);

  // Sándwich de pan de molde con corte diagonal
  const breadMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.8 });
  const fillingMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 });

  // Rebanada inferior
  const breadBottom = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.035, 0.22), breadMat);
  breadBottom.position.set(0.05, 0.035, 0);

  // Relleno de jamón y queso asomando
  const filling = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.03, 0.24), fillingMat);
  filling.position.set(0.05, 0.065, 0);

  // Rebanada superior
  const breadTop = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.035, 0.22), breadMat);
  breadTop.position.set(0.05, 0.095, 0);

  g.add(napkin, foilBase, breadBottom, filling, breadTop);
  g.scale.setScalar(scale);
  return g;
}

export function createSoccerBallProp(scale = 1): THREE.Group {
  const g = new THREE.Group();

  const ballMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
  const patchMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });

  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 14), ballMat);
  ball.position.y = 0.22;
  g.add(ball);

  // Manchas pentagonales del balón de fútbol
  [
    [0, 0.43, 0],
    [0.18, 0.32, 0.08],
    [-0.18, 0.32, -0.08],
    [0.08, 0.28, 0.17],
    [-0.08, 0.28, -0.17],
    [0.17, 0.12, -0.1]
  ].forEach(([px, py, pz]) => {
    const patch = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 5), patchMat);
    patch.position.set(px, py, pz);
    patch.lookAt(0, 0.22, 0);
    g.add(patch);
  });

  g.scale.setScalar(scale);
  return g;
}

export function createWaterBottleAndNotesProp(scale = 1): THREE.Group {
  const g = new THREE.Group();

  // Botella de agua translúcida deportiva
  const bottleBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.065, 0.28, 12),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85
    })
  );
  bottleBody.position.set(-0.16, 0.14, 0);

  const bottleCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.07, 10),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
  );
  bottleCap.position.set(-0.16, 0.31, 0);

  // Cuaderno abierto al lado
  const openPageMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
  const pageL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.3), openPageMat);
  pageL.position.set(0.08, 0.01, 0);
  pageL.rotation.z = 0.05;

  const pageR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.3), openPageMat);
  pageR.position.set(0.28, 0.01, 0);
  pageR.rotation.z = -0.05;

  // Lápiz escolar de madera amarillo
  const pencil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.22, 6),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 })
  );
  pencil.position.set(0.18, 0.03, 0.05);
  pencil.rotation.z = Math.PI / 2;
  pencil.rotation.y = 0.3;

  g.add(bottleBody, bottleCap, pageL, pageR, pencil);
  g.scale.setScalar(scale);
  return g;
}

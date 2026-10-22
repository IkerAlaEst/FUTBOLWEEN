import * as THREE from 'three';
import { createStoneTexture } from './textures';
import {
  createDetailedPumpkin,
  createGhost,
  makeTomb,
  makeDeadTree,
  makeRock,
  createHalloweenMaterials,
  createGuardianCharacter
} from './environment';
import { createGiant3DScreen } from './screens';

export function buildCastle(scene: THREE.Scene) {
  const mats = createHalloweenMaterials();
  const castleStoneTex = createStoneTexture('#d8be94', '#9c825b');
  castleStoneTex.repeat.set(3, 3);

  const castleWallMat = new THREE.MeshStandardMaterial({ map: castleStoneTex, roughness: 0.88 });
  const castleDarkStoneMat = new THREE.MeshStandardMaterial({ color: 0xb69970, roughness: 0.9 });
  const roofTileMat = new THREE.MeshStandardMaterial({ color: 0x7d4e38, roughness: 0.85 });
  const glowWinMat = new THREE.MeshBasicMaterial({ color: 0xffa030 });
  const bannerOrange = new THREE.MeshStandardMaterial({ color: 0xff5e00, side: THREE.DoubleSide, roughness: 0.7 });
  const bannerPurple = new THREE.MeshStandardMaterial({ color: 0x7e22ce, side: THREE.DoubleSide, roughness: 0.7 });

  // 🛡️ Textura y Material oficial del Escudo de Xàtiva
  const texLoader = new THREE.TextureLoader();
  const escudoTex = texLoader.load('/escudo.png');
  escudoTex.colorSpace = THREE.SRGBColorSpace;
  const escudoMat = new THREE.MeshStandardMaterial({
    map: escudoTex,
    transparent: true,
    roughness: 0.35,
    side: THREE.DoubleSide
  });

  const castlePumpkins: THREE.Group[] = [];

  // Función para crear Estandartes Reales con el Escudo de Xàtiva
  function makeEscudoBanner(w: number, h: number): THREE.Group {
    const bg = new THREE.Group();

    // Mástil horizontal con remates de lanza dorados
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, w + 0.35, 8), mats.goldMetalMat);
    pole.rotation.z = Math.PI / 2;
    bg.add(pole);

    const tipL = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 6), mats.goldMetalMat);
    tipL.position.x = -(w + 0.35) / 2;
    tipL.rotation.z = Math.PI / 2;
    const tipR = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 6), mats.goldMetalMat);
    tipR.position.x = (w + 0.35) / 2;
    tipR.rotation.z = -Math.PI / 2;
    bg.add(tipL, tipR);

    // Tela de terciopelo carmesí heráldico
    const clothBack = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.65, side: THREE.DoubleSide })
    );
    clothBack.position.y = -h / 2;
    bg.add(clothBack);

    // Ribete perimetral dorado
    const goldTrim = new THREE.Mesh(
      new THREE.PlaneGeometry(w + 0.04, h + 0.04),
      mats.goldMetalMat
    );
    goldTrim.position.set(0, -h / 2, -0.01);
    bg.add(goldTrim);

    // Placa frontal con el Escudo oficial de Xàtiva
    const shieldPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.85, h * 0.82),
      escudoMat
    );
    shieldPlane.position.set(0, -h / 2, 0.02);
    bg.add(shieldPlane);

    // Doble corte inferior heráldico en punta
    const bottomPeak = new THREE.Mesh(
      new THREE.ConeGeometry(w / 2, h * 0.28, 3),
      new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.65, side: THREE.DoubleSide })
    );
    bottomPeak.rotation.x = Math.PI;
    bottomPeak.position.set(0, -h - (h * 0.28) / 2 + 0.02, 0);
    bg.add(bottomPeak);

    return bg;
  }

  const castleGroup = new THREE.Group();
  castleGroup.position.set(0, 30, -38);
  scene.add(castleGroup);

  const cragPositions = [
    [0, 3.5, -11, 13, 19, 8],
    [-7.5, 1.0, -9, 8.5, 14, 7],
    [7.2, 1.5, -9.5, 9, 15, 7],
    [-3.5, 6.0, -10, 7, 11, 6],
    [4.0, 5.5, -10, 7.5, 11, 6]
  ];
  cragPositions.forEach(([x, y, z, r, h, seg]) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mats.cliffRockMat);
    cone.position.set(x, y, z);
    cone.rotation.y = Math.random() * Math.PI;
    castleGroup.add(cone);
  });

  const summitKeep = new THREE.Mesh(new THREE.BoxGeometry(6.8, 4.6, 5.0), castleWallMat);
  summitKeep.position.set(0, 12.6, -10.5);
  summitKeep.castShadow = true;
  castleGroup.add(summitKeep);

  for (let mx = -3.0; mx <= 3.0; mx += 0.75) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.65, 0.45), castleWallMat);
    m.position.set(mx, 15.2, -8.2);
    castleGroup.add(m);
  }

  const keepWin = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.4), mats.orangeNeonMat);
  keepWin.position.set(0.8, 12.6, -7.95);
  castleGroup.add(keepWin);

  const summitPine = new THREE.Group();
  summitPine.position.set(-4.5, 11.4, -10.8);
  const pTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 3.2, 7), mats.trunkMat);
  summitPine.add(pTrunk);
  [
    [0, 2.0, 0, 2.2],
    [0.9, 2.4, 0.3, 1.6],
    [-0.8, 2.2, -0.2, 1.5]
  ].forEach(([px, py, pz, rad]) => {
    const crown = new THREE.Mesh(new THREE.SphereGeometry(rad, 8, 7), mats.pineGreenMat);
    crown.scale.set(1.35, 0.62, 1.15);
    crown.position.set(px, py, pz);
    summitPine.add(crown);
  });
  castleGroup.add(summitPine);

  const plazaMesh = new THREE.Mesh(
    new THREE.BoxGeometry(22, 1.6, 8.9),
    new THREE.MeshStandardMaterial({ color: 0x3b3e47, roughness: 0.85 })
  );
  plazaMesh.position.set(0, -3.31, 3.45);
  plazaMesh.receiveShadow = true;
  castleGroup.add(plazaMesh);

  // Pasillo / puente de conexión entre castillo y escalinata
  const bridgeGroup = new THREE.Group();
  bridgeGroup.position.set(0, 27.0, -14.7);
  const bridgeMesh = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.8, 30.9), castleWallMat);
  bridgeMesh.castShadow = true;
  bridgeMesh.receiveShadow = true;
  bridgeGroup.add(bridgeMesh);

  for (let bz = -14; bz <= 14; bz += 4) {
    const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.2, 3.2), castleDarkStoneMat);
    wallL.position.set(-2.0, 0.8, bz);
    const wallR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.2, 3.2), castleDarkStoneMat);
    wallR.position.set(2.0, 0.8, bz);
    bridgeGroup.add(wallL, wallR);
  }
  scene.add(bridgeGroup);

  for (let bz = -14; bz <= 14; bz += 7) {
    [-1, 1].forEach(s => {
      const p = createDetailedPumpkin(0.6);
      p.position.set(s * 2.0, 1.65, bz);
      p.rotation.y = -s * 0.4;
      bridgeGroup.add(p);
      castlePumpkins.push(p);
    });
  }

  function addMerlons(g: THREE.Group, w: number, y: number, z: number, n: number) {
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry((w / n) * 0.55, 0.55, 0.45), castleWallMat);
      m.position.set(-w / 2 + ((i + 0.5) * w) / n, y, z);
      g.add(m);
    }
  }

  function makeWall(x: number, y: number, z: number, w: number, h: number, d: number, ry = 0) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = ry;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), castleWallMat);
    b.position.y = h / 2;
    b.castShadow = true;
    g.add(b);
    const n = Math.max(2, Math.round(w / 0.9));
    addMerlons(g, w, h + 0.27, d / 2 - 0.22, n);
    addMerlons(g, w, h + 0.27, -d / 2 + 0.22, n);
    castleGroup.add(g);
    return g;
  }

  function makeTower(x: number, y: number, z: number, r: number, h: number, roof: boolean) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.1, h, 14), castleWallMat);
    b.position.y = h / 2;
    b.castShadow = true;
    g.add(b);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.12, r * 1.12, 0.35, 14), castleDarkStoneMat);
    band.position.y = h;
    g.add(band);
    if (roof) {
      const c = new THREE.Mesh(new THREE.ConeGeometry(r * 1.3, r * 2.4, 14), roofTileMat);
      c.position.y = h + r * 1.2 + 0.1;
      c.castShadow = true;
      g.add(c);
      const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 5), mats.darkIronMat);
      sp.position.y = h + r * 2.4 + 0.6;
      g.add(sp);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), Math.random() > 0.5 ? bannerOrange : bannerPurple);
      fl.position.set(0.45, h + r * 2.4 + 1.0, 0);
      g.add(fl);
    } else {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const m = new THREE.Mesh(new THREE.BoxGeometry(r * 0.4, 0.6, 0.4), castleWallMat);
        m.position.set(Math.sin(a) * r * 1.05, h + 0.5, Math.cos(a) * r * 1.05);
        m.rotation.y = a;
        g.add(m);
      }
    }
    [0.45, 0.8].forEach(k => {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.8), glowWinMat);
      w.position.set(0, h * k, r * (1.1 - 0.1 * k) + 0.03);
      g.add(w);
    });
    castleGroup.add(g);
    return g;
  }

  // Torres del keep y roca
  makeTower(0, 14.9, -10.5, 2.0, 5.5, true);
  makeTower(-3.6, 14.9, -8.6, 1.0, 2.6, true);
  makeTower(3.6, 14.9, -8.6, 1.0, 2.6, true);
  makeTower(-5.4, 8.6, -8, 1.3, 3.4, true);
  makeTower(5.4, 8.2, -8, 1.3, 3.4, true);

  // Recinto de la plaza (muros frontales divididos a izquierda y derecha dejando el gran portal abierto)
  makeWall(-6.6, -2.5, -0.4, 6.4, 4, 1.2);
  makeWall(6.6, -2.5, -0.4, 6.4, 4, 1.2);
  makeWall(-10.2, -2.5, 3.45, 1.2, 4, 6.9);
  makeWall(10.2, -2.5, 3.45, 1.2, 4, 6.9);
  [
    [-10.2, 7.2, 5.5],
    [10.2, 7.2, 5.5],
    [-10.2, -0.3, 6.8],
    [10.2, -0.3, 6.8]
  ].forEach(([x, z, h], i) => makeTower(x, -2.5, z, 1.5, h, i >= 2));

  const castleFlames: THREE.Mesh[] = [];

  // ==========================================
  // 🏰 GRAN PORTAL GÓTICO DEL CASTILLO DE XÀTIVA
  // ==========================================
  // Torres de defensa flanqueando el portal
  makeTower(-3.8, -2.5, -0.3, 1.35, 8.2, true);
  makeTower(3.8, -2.5, -0.3, 1.35, 8.2, true);

  // 📺 PANTALLAS GIGANTES 3D CON EL LOGO DEL TORNEO (En las torres exteriores de los lados)
  const screenTowerL = createGiant3DScreen({
    width: 2.3,
    height: 2.3,
    gifUrl: '/logo.gif',
    depth: 0.22,
    bevelColor: 0x111116,
    neonColor: 0xa855f7,
    bracketLength: 0.35
  });
  screenTowerL.screenGroup.position.set(-10.2, 0.55, 8.85);
  screenTowerL.screenGroup.rotation.y = 0;
  castleGroup.add(screenTowerL.screenGroup);

  const screenTowerR = createGiant3DScreen({
    width: 2.3,
    height: 2.3,
    gifUrl: '/logo.gif',
    depth: 0.22,
    bevelColor: 0x111116,
    neonColor: 0xa855f7,
    bracketLength: 0.35
  });
  screenTowerR.screenGroup.position.set(10.2, 0.55, 8.85);
  screenTowerR.screenGroup.rotation.y = 0;
  castleGroup.add(screenTowerR.screenGroup);

  const screenUpdaters = [
    (timeMs: number) => screenTowerL.updateGif(timeMs),
    (timeMs: number) => screenTowerR.updateGif(timeMs)
  ];

  const grandPortalGroup = new THREE.Group();
  grandPortalGroup.position.set(0, -2.5, 0.0);

  // Rampa / umbral de losas de piedra
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.35, 2.6), castleDarkStoneMat);
  ramp.position.set(0, 0.17, 0.8);
  ramp.receiveShadow = true;
  grandPortalGroup.add(ramp);

  // Jambas y dintel de piedra tallada del arco
  const archJambL = new THREE.Mesh(new THREE.BoxGeometry(0.75, 4.8, 1.4), castleDarkStoneMat);
  archJambL.position.set(-2.15, 2.4, 0);
  const archJambR = new THREE.Mesh(new THREE.BoxGeometry(0.75, 4.8, 1.4), castleDarkStoneMat);
  archJambR.position.set(2.15, 2.4, 0);

  const archLintel = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.0, 1.6), castleWallMat);
  archLintel.position.set(0, 4.9, 0);

  // Almenas sobre el portal
  for (let mx = -2.0; mx <= 2.0; mx += 1.0) {
    const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.5), castleDarkStoneMat);
    merlon.position.set(mx, 5.7, 0);
    grandPortalGroup.add(merlon);
  }

  // Doble Portón Fortificado de Madera Noble con bandas de hierro forjado
  const doorGroup = new THREE.Group();
  doorGroup.position.set(0, 0, -0.15);

  const doorLeafL = new THREE.Mesh(new THREE.BoxGeometry(1.7, 4.2, 0.22), mats.woodPlankMat);
  doorLeafL.position.set(-0.9, 2.1, 0);
  const doorLeafR = new THREE.Mesh(new THREE.BoxGeometry(1.7, 4.2, 0.22), mats.woodPlankMat);
  doorLeafR.position.set(0.9, 2.1, 0);

  // Bandas horizontales de hierro forjado con remaches
  [-1.4, -0.4, 0.6, 1.6].forEach(yOff => {
    const ironBandL = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.12, 0.25), mats.darkIronMat);
    ironBandL.position.set(-0.9, 2.1 + yOff, 0.01);
    const ironBandR = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.12, 0.25), mats.darkIronMat);
    ironBandR.position.set(0.9, 2.1 + yOff, 0.01);
    doorGroup.add(ironBandL, ironBandR);
  });

  // Aldabas / tiradores circulares de bronce
  const ringL = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 8, 16), mats.goldMetalMat);
  ringL.position.set(-0.35, 2.0, 0.14);
  const ringR = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 8, 16), mats.goldMetalMat);
  ringR.position.set(0.35, 2.0, 0.14);
  doorGroup.add(doorLeafL, doorLeafR, ringL, ringR);
  grandPortalGroup.add(doorGroup);

  // Rastrillo gótico de hierro forjado (Portcullis con púas)
  const portcullisGroup = new THREE.Group();
  portcullisGroup.position.set(0, 3.5, 0.15);
  for (let px = -1.5; px <= 1.5; px += 0.5) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), mats.darkIronMat);
    bar.position.set(px, 0, 0);
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.35, 6), mats.darkIronMat);
    spike.position.set(px, -1.25, 0);
    spike.rotation.x = Math.PI;
    portcullisGroup.add(bar, spike);
  }
  const crossbar1 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 0.08), mats.darkIronMat);
  crossbar1.position.y = 0.5;
  const crossbar2 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 0.08), mats.darkIronMat);
  crossbar2.position.y = -0.5;
  portcullisGroup.add(crossbar1, crossbar2);
  grandPortalGroup.add(portcullisGroup);

  // Antorchas del portal en las jambas de piedra con fuego crepitante
  const torchL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.75, 6), mats.darkIronMat);
  torchL.position.set(-2.15, 2.4, 0.75);
  const flameL = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 7), mats.orangeNeonMat);
  flameL.position.set(-2.15, 2.9, 0.75);
  flameL.userData = { baseY: 2.9, seed: 1 };
  castleFlames.push(flameL);

  const torchR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.75, 6), mats.darkIronMat);
  torchR.position.set(2.15, 2.4, 0.75);
  const flameR = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 7), mats.orangeNeonMat);
  flameR.position.set(2.15, 2.9, 0.75);
  flameR.userData = { baseY: 2.9, seed: 2 };
  castleFlames.push(flameR);
  grandPortalGroup.add(torchL, flameL, torchR, flameR);

  // 🏰 GRAN ESTANDARTE OFICIAL CON EL ESCUDO DE XÀTIVA SOBRE EL PORTAL
  const mainPortalBanner = makeEscudoBanner(2.8, 3.4);
  mainPortalBanner.position.set(0, 6.2, 0.86);
  grandPortalGroup.add(mainPortalBanner);

  // Estandartes laterales en las dos torres del portal
  const bannerTowerL = makeEscudoBanner(1.5, 2.4);
  bannerTowerL.position.set(-3.8, 4.2, 0.9);
  castleGroup.add(bannerTowerL);

  const bannerTowerR = makeEscudoBanner(1.5, 2.4);
  bannerTowerR.position.set(3.8, 4.2, 0.9);
  castleGroup.add(bannerTowerR);

  // Estandarte en la Torre Mayor del Homenaje (Summit Keep)
  const summitBanner = makeEscudoBanner(2.2, 3.2);
  summitBanner.position.set(0, 19.5, -8.3);
  castleGroup.add(summitBanner);

  // Luz dorada emanando del interior del portal hacia el exterior
  const portalInnerLight = new THREE.PointLight(0xffb84d, 5.0, 26);
  portalInnerLight.position.set(0, 2.2, 0.8);
  grandPortalGroup.add(portalInnerLight);

  grandPortalGroup.add(archJambL, archJambR, archLintel);
  castleGroup.add(grandPortalGroup);

  // ==========================================
  // 🏰 GUARDIANES DEL CASTILLO EN LA PUERTA (A los flancos del portal)
  // ==========================================
  const interactiveNpcs: THREE.Group[] = [];

  const leftGuardian = createGuardianCharacter(true);
  leftGuardian.position.set(-3.6, -2.5, 1.2);
  leftGuardian.rotation.y = 0.35;
  castleGroup.add(leftGuardian);
  interactiveNpcs.push(leftGuardian);

  const rightGuardian = createGuardianCharacter(false);
  rightGuardian.position.set(3.6, -2.5, 1.2);
  rightGuardian.rotation.y = -0.35;
  castleGroup.add(rightGuardian);
  interactiveNpcs.push(rightGuardian);

  // Murallas escalonadas
  [-1, 1].forEach(s => {
    for (let k = 0; k < 4; k++) {
      makeWall(s * (10 - k * 1.9), -1.0 + k * 3.2, -3.2 - k * 1.7, 3.4, 3, 1.1, s * 0.5);
      if (k % 2 === 1) makeTower(s * (10 - k * 1.9) - s * 1.8, -1.0 + k * 3.2, -3.2 - k * 1.7, 0.9, 4.2, true);
    }
  });

  [-6, -3, 3, 6].forEach(x => {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.45, 7), mats.orangeNeonMat);
    f.position.set(x, 2.3, 0.45);
    f.userData = { baseY: 2.3, seed: x * 3 };
    castleGroup.add(f);
    castleFlames.push(f);
  });

  const castleLight = new THREE.PointLight(0xff7a1a, 3.5, 32);
  castleLight.position.set(0, 3, 3);
  castleGroup.add(castleLight);

  // Decoración plaza
  [
    [-6, 4.5, 1.5],
    [-4.4, 6.6, 1.1],
    [5.2, 5.5, 1.7],
    [7, 3.4, 1.2],
    [-8, 2, 1.3],
    [3.8, 1.6, 1.0]
  ].forEach(([x, z, s]) => {
    const p = createDetailedPumpkin(s);
    p.position.set(x, -2.5 + 0.42 * s, z);
    p.rotation.y = (Math.random() - 0.5) * 0.8;
    castleGroup.add(p);
  });

  [
    [-7.4, 6.8],
    [-5.8, 1.2],
    [6.2, 1.0],
    [8.0, 6.6],
    [3.6, 6.9],
    [-3.4, 7.1]
  ].forEach(([x, z]) => {
    const t = makeTomb();
    t.position.set(x, -2.5, z);
    t.rotation.y = (Math.random() - 0.5) * 0.6;
    t.rotation.z = (Math.random() - 0.5) * 0.15;
    castleGroup.add(t);
  });

  [
    [-7.5, 5.2],
    [7.5, 5.2]
  ].forEach(([x, z]) => {
    const t = makeDeadTree();
    t.position.set(x, -2.5, z);
    castleGroup.add(t);
  });

  for (let i = 0; i < 14; i++) {
    const side = i % 2 ? 1 : -1;
    const r = makeRock(0.5 + Math.random() * 0.9);
    r.position.set(side * (3.3 + Math.random() * 7.2), -2.4, -0.2 + Math.random() * 7.6);
    castleGroup.add(r);
  }

  const castleGhosts: THREE.Group[] = [];
  [
    [-6, 1.2, 4.5, 1.5],
    [6.5, 2, 3, 1.3],
    [0, 6.5, -5.5, 1.8],
    [-9, 6, -2, 1.1]
  ].forEach(([x, y, z, s]) => {
    const g = createGhost(s);
    g.position.set(x, y, z);
    g.userData = { y0: y, s: Math.random() * 6 };
    castleGroup.add(g);
    castleGhosts.push(g);
  });

  return {
    castleGroup,
    bridgeGroup,
    castleFlames,
    castleGhosts,
    castlePumpkins,
    interactiveNpcs,
    screenUpdaters
  };
}

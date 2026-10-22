import * as THREE from 'three';
import {
  createSimarroSignTexture,
  createPaveTex,
  createPosterTex,
  createPosterHTex,
  bar
} from './textures';
import {
  createDetailedPumpkin,
  createGhost,
  makeRock,
  createHalloweenMaterials,
  WalkerEntity
} from './environment';
import { createGiant3DScreen } from './screens';
import { buildEasterEggGamingSetup } from './easterEggSetup';

export function buildSimarro(scene: THREE.Scene, finalStepPos: THREE.Vector3, END_Y: number) {
  const mats = createHalloweenMaterials();
  const WALK_LEN = 26;
  const DX = -3.4;

  const simarroGroup = new THREE.Group();
  simarroGroup.position.set(finalStepPos.x + 3.4, END_Y, finalStepPos.z - WALK_LEN + 1.6);
  scene.add(simarroGroup);

  const simarroConcreteMat = new THREE.MeshStandardMaterial({ color: 0xc8c6c2, roughness: 0.72 });
  const louverMetalMat = new THREE.MeshStandardMaterial({ color: 0x434850, roughness: 0.45, metalness: 0.4 });
  const blackMullionMat = new THREE.MeshStandardMaterial({ color: 0x16181d, roughness: 0.35 });
  const warmWindowMat = new THREE.MeshBasicMaterial({ color: 0xffe0a3 });
  const pathMat = new THREE.MeshStandardMaterial({ map: createPaveTex(3, 18), roughness: 0.7 });
  const plantMat = new THREE.MeshStandardMaterial({ color: 0x3f6b2a, roughness: 0.9, flatShading: true });
  const wallWhite = new THREE.MeshStandardMaterial({ color: 0xe6e4df, roughness: 0.7 });
  const bannerOrange = new THREE.MeshStandardMaterial({ color: 0xff5e00, side: THREE.DoubleSide, roughness: 0.7 });
  const bannerPurple = new THREE.MeshStandardMaterial({ color: 0x7e22ce, side: THREE.DoubleSide, roughness: 0.7 });
  const purpleNeonMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });

  const yardFloor = new THREE.Mesh(
    new THREE.BoxGeometry(46, 1.2, 40),
    new THREE.MeshStandardMaterial({ map: createPaveTex(15, 13), roughness: 0.85 })
  );
  yardFloor.position.set(0, -0.65, 12);
  yardFloor.receiveShadow = true;
  simarroGroup.add(yardFloor);

  // Planta baja completa del edificio: cierra todo el hueco de x = -10.75 a +10.75
  const groundFloorBody = new THREE.Mesh(new THREE.BoxGeometry(21.5, 3.4, 5.8), simarroConcreteMat);
  groundFloorBody.position.set(0, 1.7, -4.6);
  groundFloorBody.receiveShadow = true;
  simarroGroup.add(groundFloorBody);

  // Cajas de luz cálida interior para las aulas de la planta baja
  const groundWindows = [
    { x: -5.8, w: 7.2 },
    { x: 5.8, w: 7.2 }
  ];
  groundWindows.forEach(({ x, w }) => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(w, 2.1, 0.15), warmWindowMat);
    win.position.set(x, 1.7, -1.68);
    simarroGroup.add(win);

    // Marcos y montantes verticales de aluminio oscuro
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.08, 0.2), blackMullionMat);
    frameTop.position.set(x, 2.76, -1.65);
    const frameBot = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.08, 0.2), blackMullionMat);
    frameBot.position.set(x, 0.64, -1.65);
    simarroGroup.add(frameTop, frameBot);

    for (let mx = -w / 2; mx <= w / 2 + 0.01; mx += 1.2) {
      const mu = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.12, 0.2), blackMullionMat);
      mu.position.set(x + mx, 1.7, -1.65);
      simarroGroup.add(mu);
    }
  });

  // Pilares arquitectónicos estructurales de hormigón a lo largo de toda la fachada
  const pillarXPositions = [-10.2, -7.5, -4.8, -2.1, 2.1, 4.8, 7.5, 10.2];
  pillarXPositions.forEach(px => {
    // Fuste del pilar
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.4, 0.5), simarroConcreteMat);
    col.position.set(px, 1.7, -1.62);
    col.castShadow = true;
    col.receiveShadow = true;

    // Plinto/base
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.24, 0.66), simarroConcreteMat);
    base.position.set(px, 0.12, -1.62);

    // Capitel de unión con la planta superior
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.2, 0.64), simarroConcreteMat);
    cap.position.set(px, 3.3, -1.62);

    simarroGroup.add(col, base, cap);
  });

  const louverCore = new THREE.Mesh(new THREE.BoxGeometry(21.5, 6.4, 5.8), louverMetalMat);
  louverCore.position.set(0, 6.3, -4.6);
  simarroGroup.add(louverCore);

  for (let ly = 3.35; ly <= 7.95; ly += 0.26) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(21.6, 0.12, 0.3), louverMetalMat);
    blade.position.set(0, ly, -1.68);
    simarroGroup.add(blade);
  }

  const simarroSignTex = createSimarroSignTexture();
  const topFascia = new THREE.Mesh(
    new THREE.BoxGeometry(21.65, 1.9, 5.9),
    [
      simarroConcreteMat,
      simarroConcreteMat,
      simarroConcreteMat,
      simarroConcreteMat,
      new THREE.MeshStandardMaterial({ map: simarroSignTex, roughness: 0.6 }),
      simarroConcreteMat
    ]
  );
  topFascia.position.set(0, 9.95, -4.6);
  simarroGroup.add(topFascia);

  // Pasillo de entrada caminable
  const walkway = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.14, 28.5), pathMat);
  walkway.position.set(DX, -0.08, 10.65);
  walkway.receiveShadow = true;
  simarroGroup.add(walkway);

  for (let z = 21, n = 0; z > 0; z -= 4.6, n++) {
    [-1, 1].forEach(s => {
      const pl = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.9), simarroConcreteMat);
      pl.position.set(DX + s * 2.6, 0.27, z);
      simarroGroup.add(pl);
      if ((n + (s > 0 ? 1 : 0)) % 2) {
        const bush = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 7), plantMat);
        bush.position.set(DX + s * 2.6, 0.75, z);
        simarroGroup.add(bush);
      } else {
        const pk = createDetailedPumpkin(0.9);
        pk.position.set(DX + s * 2.6, 0.9, z);
        pk.rotation.y = -s * 0.5;
        simarroGroup.add(pk);
      }
    });
  }

  for (let z = 20; z > 0; z -= 9.2) {
    [-1, 1].forEach(s => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 3.4, 6), mats.darkIronMat);
      pole.position.set(DX + s * 3.3, 1.7, z);
      simarroGroup.add(pole);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffb040 }));
      bulb.position.set(DX + s * 3.3, 3.5, z);
      simarroGroup.add(bulb);
    });
  }

  // Pórtico y puerta de cristal
  const slab = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.4, 5.6), simarroConcreteMat);
  slab.position.set(DX, 4.1, 1.1);
  slab.castShadow = true;
  simarroGroup.add(slab);

  [-1, 1].forEach(s => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.9, 0.5), simarroConcreteMat);
    c.position.set(DX + s * 3, 1.95, 3.5);
    simarroGroup.add(c);
  });

  [-1.9, -0.65, 0.65, 1.9].forEach(x => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.1, 0.1), blackMullionMat);
    m.position.set(DX + x, 1.5, -3.0);
    simarroGroup.add(m);
  });

  const doorTop = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.1, 0.1), blackMullionMat);
  doorTop.position.set(DX, 3.05, -3.0);
  simarroGroup.add(doorTop);

  [-1, 1].forEach(s => {
    const pk = createDetailedPumpkin(1.7);
    pk.position.set(DX + s * 2.4, 0.7, -1.0);
    simarroGroup.add(pk);
  });

  const doorLight = new THREE.PointLight(0xffd9a0, 1.2, 16);
  doorLight.position.set(DX, 3, 0.5);
  simarroGroup.add(doorLight);

  // Árboles del patio
  [[DX + 8, 8], [DX - 9, 15], [DX + 10, 20]].forEach(([x, z]) => {
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, 3.4, 7), mats.trunkMat);
    tr.position.set(x, 1.7, z);
    simarroGroup.add(tr);
    [[0, 4, 0, 1.8], [0.9, 3.5, 0.4, 1.3], [-0.8, 3.7, -0.3, 1.4]].forEach(([a, b, c, r]) => {
      const f = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 7), plantMat);
      f.position.set(x + a, b, z + c);
      simarroGroup.add(f);
    });
  });

  // Rocas decorativas fijas junto a la base de los 3 árboles y en los bordes perimetrales (sin cortar pasillos)
  const rockCoords: [number, number, number][] = [
    [DX + 7.2, 0.25, 7.5],
    [DX + 8.8, 0.22, 8.6],
    [DX - 9.8, 0.25, 14.4],
    [DX - 8.3, 0.22, 15.6],
    [DX + 9.2, 0.25, 19.3],
    [DX + 10.8, 0.22, 20.6],
    [DX + 18.5, 0.28, 6.0],
    [DX - 18.5, 0.28, 8.0]
  ];
  rockCoords.forEach(([rx, ry, rz], i) => {
    const r = makeRock(0.45 + (i % 3) * 0.15);
    r.position.set(rx, ry, rz);
    simarroGroup.add(r);
  });

  const simarroGhosts: THREE.Group[] = [];
  [
    [DX + 5, 2.2, 8, 1.4],
    [DX - 6, 2.6, 14, 1.2],
    [DX + 1.5, 5.5, 3, 1.1]
  ].forEach(([x, y, z, s]) => {
    const gh = createGhost(s);
    gh.position.set(x, y, z);
    gh.userData = { y0: y, s: Math.random() * 6 };
    simarroGroup.add(gh);
    simarroGhosts.push(gh);
  });

  // Ventanas y alas
  [[-5.7, 9], [2.9, 4.6], [8.5, 3.4]].forEach(([cx, w]) => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(w, 1.2, 0.12), warmWindowMat);
    win.position.set(cx, 7.6, -1.45);
    simarroGroup.add(win);
    for (let m = -w / 2; m <= w / 2 + 0.01; m += 1.15) {
      const mu = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.3, 0.16), blackMullionMat);
      mu.position.set(cx + m, 7.6, -1.4);
      simarroGroup.add(mu);
    }
  });

  const wingR = new THREE.Mesh(new THREE.BoxGeometry(9, 4.4, 6), wallWhite);
  wingR.position.set(15.2, 2.2, -4.6);
  wingR.castShadow = true;
  simarroGroup.add(wingR);

  const wingL = new THREE.Mesh(new THREE.BoxGeometry(9, 4.4, 6), wallWhite);
  wingL.position.set(-15.2, 2.2, -4.6);
  wingL.castShadow = true;
  simarroGroup.add(wingL);

  const roofCap = new THREE.Mesh(new THREE.BoxGeometry(21.9, 0.3, 6.1), louverMetalMat);
  roofCap.position.set(0, 11.05, -4.6);
  simarroGroup.add(roofCap);

  const facadeLight = new THREE.PointLight(0xfff0d0, 1.2, 34);
  facadeLight.position.set(DX + 2, 6.5, 6);
  simarroGroup.add(facadeLight);

  // Posters
  const POSTERS = [
    [['GRAN', 'FINAL', '31 OCT'], ['#ff5e00', '#7a1d00'], '#fff4e0', 'CF'],
    [['CLASH', 'XÀTIVA', '2026'], ['#6b21a8', '#1e0a3c'], '#ffd9a0', 'XTV'],
    [['EA FC', '26', 'SIMARRO'], ['#111827', '#3b0764'], '#ff8a1f', 'FC'],
    [['20:00 H', 'AULA', 'INFORMÁTICA'], ['#14532d', '#052e16'], '#d9f99d', 'IES'],
    [['16 CRACKS', '1v1', 'MODO 95'], ['#1d4ed8', '#1e1b4b'], '#fde68a', '95'],
    [['CASTELL', 'DE XÀTIVA', '310 M'], ['#ff5e00', '#3b0764'], '#ffffff', '310']
  ];

  const posterMesh = (i: number, w: number, h: number, x: number, y: number, z: number) => {
    const p = POSTERS[i % POSTERS.length];
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: createPosterTex(p[0] as string[], p[1] as string[], p[2] as string, p[3] as string) })
    );
    m.position.set(x, y, z);
    simarroGroup.add(m);
    return m;
  };

  [-9.3, 9.0].forEach((x, i) => {
    posterMesh(i + 1, 2.1, 2.95, x, 5.4, -1.3);
    const rod = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.08, 0.1), blackMullionMat);
    rod.position.set(x, 6.92, -1.3);
    simarroGroup.add(rod);
  });

  for (let i = 0; i < 15; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), i % 2 ? mats.orangeNeonMat : purpleNeonMat);
    b.position.set(DX - 3.1 + i * 0.44, 3.7 - Math.sin((i / 14) * Math.PI) * 0.18, 3.95);
    simarroGroup.add(b);
  }

  [DX + 11, DX + 13, DX + 15].forEach((x, i) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 8, 6), mats.darkIronMat);
    pole.position.set(x, 4, 3);
    simarroGroup.add(pole);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), i % 2 ? bannerPurple : bannerOrange);
    fl.position.set(x + 0.8, 7.3, 3);
    simarroGroup.add(fl);
  });

  // Bicis y coches (las bicis se pueden coger con un clic y se montan en la ruta)
  const bikes: THREE.Group[] = [];

  function makeBike(color: number) {
    const g = new THREE.Group();
    const fm = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.5 });
    const V = (y: number, z: number) => new THREE.Vector3(0, y, z);
    const wheels: THREE.Group[] = [];
    const spokeMat = new THREE.MeshStandardMaterial({ color: 0xb9c0cc, roughness: 0.35, metalness: 0.7 });
    [-0.55, 0.55].forEach(z => {
      const wheel = new THREE.Group();
      wheel.position.set(0, 0.33, z);
      wheel.rotation.y = Math.PI / 2;

      // Grupo interior: gira sobre su propio eje al pedalear
      const spinner = new THREE.Group();
      spinner.add(new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.03, 6, 16), mats.darkIronMat));
      [0, Math.PI / 2].forEach(a => {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.62, 0.022), spokeMat);
        spoke.rotation.z = a;
        spinner.add(spoke);
      });
      wheel.add(spinner);

      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.09, 8), mats.darkIronMat);
      hub.rotation.x = Math.PI / 2;
      wheel.add(hub);

      g.add(wheel);
      wheels.push(spinner);
    });
    [
      [V(0.33, -0.55), V(0.3, -0.05)],
      [V(0.33, -0.55), V(0.75, -0.25)],
      [V(0.3, -0.05), V(0.75, -0.25)],
      [V(0.75, -0.25), V(0.72, 0.35)],
      [V(0.3, -0.05), V(0.72, 0.35)],
      [V(0.72, 0.35), V(0.33, 0.55)]
    ].forEach(([a, b]) => g.add(bar(a, b, 0.022, fm)));
    const hb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.03), mats.darkIronMat);
    hb.position.set(0, 0.8, 0.38);
    const sd = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.22), mats.darkIronMat);
    sd.position.set(0, 0.78, -0.3);
    g.add(hb, sd);

    // Zona de pulsación generosa (invisible) para poder coger la bici cómodamente
    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.9, 2.5),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.set(0, 0.95, 0);
    g.add(hitbox);

    g.userData = { isBike: true, wheels, hitbox };
    return g;
  }

  [[0, 0xdc2626], [2, 0x2563eb], [4, 0x16a34a]].forEach(([i, c], n) => {
    const b = makeBike(c);
    b.position.set(DX - 13 + i * 0.5, 0, 4 + (n % 2 ? 0.1 : -0.1));
    b.rotation.y = (n - 1) * 0.08;
    simarroGroup.add(b);
    bikes.push(b);
  });

  function makeCar(color: number) {
    const g = new THREE.Group();
    const body = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.5 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x10131a, roughness: 0.1, metalness: 0.8 });
    const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      g.add(m);
      return m;
    };
    add(new THREE.BoxGeometry(1.9, 0.6, 4.2), body, 0, 0.6, 0);
    add(new THREE.BoxGeometry(1.7, 0.6, 2.3), glass, 0, 1.2, -0.2);
    add(new THREE.BoxGeometry(1.72, 0.08, 1.9), body, 0, 1.52, -0.2);
    [-1, 1].forEach(sx =>
      [-1.35, 1.35].forEach(sz => {
        const w = add(new THREE.CylinderGeometry(0.38, 0.38, 0.28, 14), mats.darkIronMat, sx * 0.95, 0.38, sz);
        w.rotation.z = Math.PI / 2;
      })
    );
    [-0.6, 0.6].forEach(x => {
      add(new THREE.BoxGeometry(0.35, 0.15, 0.05), new THREE.MeshBasicMaterial({ color: 0xffe9a0 }), x, 0.65, 2.11);
      add(new THREE.BoxGeometry(0.35, 0.15, 0.05), new THREE.MeshBasicMaterial({ color: 0xff2020 }), x, 0.65, -2.11);
    });
    return g;
  }

  [[DX + 24, 8, 0xd9480f], [DX + 24, 15, 0x1f2937], [DX + 24, 22, 0x7e22ce]].forEach(([x, z, c], i) => {
    const car = makeCar(c);
    car.position.set(x, 0, z);
    car.rotation.y = Math.PI + (i - 1) * 0.05;
    simarroGroup.add(car);
  });

  const posterHMesh = (tex: THREE.CanvasTexture, w: number, h: number, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
    m.position.set(x, y, z);
    simarroGroup.add(m);
    return m;
  };

  posterHMesh(
    createPosterHTex([['FOOTBALLWEEN', 36], ['GRAN FINAL · 31 OCT', 22]], ['#ff5e00', '#7a1d00'], '#fff4e0', 'CF', '26'),
    4.4, 1.6, 4.2, 5.5, -1.3
  );
  posterHMesh(
    createPosterHTex([['CLASH XÀTIVA 2026', 26], ['EA FC · 20:00 H', 24]], ['#14532d', '#052e16'], '#d9f99d', 'XTV', 'IES'),
    3.6, 1.27, 15.2, 2.4, -1.57
  );
  // 📺 PANTALLA GIGANTE 3D (PARED IZQUIERDA - Reemplaza 'NOCHE DE GOLES' con gif1.gif)
  const screenLeft = createGiant3DScreen({
    width: 4.8,
    height: 2.7,
    gifUrl: '/gif1.gif',
    depth: 0.26,
    bevelColor: 0x111116,
    neonColor: 0x38bdf8,
    bracketLength: 0.28
  });
  screenLeft.screenGroup.position.set(-15.2, 2.4, -1.45);
  simarroGroup.add(screenLeft.screenGroup);

  // 📺 PANTALLA GIGANTE 3D (FACHADA CENTRAL - Ubicada perfectamente centrada sobre el porche sin tapar ventanas)
  const screenCenter = createGiant3DScreen({
    width: 3.82,
    height: 2.15,
    gifUrl: '/gif2.gif',
    depth: 0.24,
    bevelColor: 0x111116,
    neonColor: 0xff5e00,
    bracketLength: 0.32
  });
  screenCenter.screenGroup.position.set(DX, 5.58, -1.35);
  simarroGroup.add(screenCenter.screenGroup);

  // Patas de soporte estructural industrial que fijan la pantalla al tejado del porche
  [-1.2, 1.2].forEach(sx => {
    const footPost = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.12), blackMullionMat);
    footPost.position.set(DX + sx, 4.38, -1.35);
    const footPlate = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.24), blackMullionMat);
    footPlate.position.set(DX + sx, 4.31, -1.35);
    simarroGroup.add(footPost, footPlate);
  });

  posterHMesh(
    createPosterHTex([['GRAN FINAL · 31 OCT · 20:00 H', 30]], ['#ff5e00', '#4c1d95'], '#ffffff', 'CF', '310', 768, 128),
    5.4, 0.9, DX, 3.35, 4.1
  );

  // Setup Gaming Easter Egg en la azotea del Simarro al fondo
  const easterEgg = buildEasterEggGamingSetup();
  easterEgg.group.position.set(0, 11.2, -5.5);
  simarroGroup.add(easterEgg.group);

  const screenUpdaters = [
    (timeMs: number) => screenLeft.updateGif(timeMs),
    (timeMs: number) => screenCenter.updateGif(timeMs),
    (timeMs: number) => easterEgg.update(timeMs)
  ];

  return {
    simarroGroup,
    simarroGhosts,
    screenUpdaters,
    easterEgg,
    bikes,
    DX,
    WALK_LEN
  };
}


import * as THREE from 'three';
import { bar } from './textures';
import { createDetailedPumpkin, createHalloweenMaterials, WalkerEntity } from './environment';

export function setupBats(scene: THREE.Scene, startY: number) {
  const batsList: THREE.Group[] = [];
  const batMat = new THREE.MeshBasicMaterial({ color: 0x12091c, side: THREE.DoubleSide });
  const birdMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, side: THREE.DoubleSide });

  for (let b = 0; b < 28; b++) {
    const bat = new THREE.Group();
    const wingL = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.22), batMat);
    wingL.position.x = -0.26;
    const wingR = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.22), batMat);
    wingR.position.x = 0.26;
    bat.add(wingL, wingR);

    // Pequeño pico/cuerpo para modo pájaro diurno
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 4), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0, 0.16);
    beak.visible = false;
    bat.add(beak);

    const yHeight = startY + 8 - Math.random() * 68;
    const radius = 5 + Math.random() * 9;
    const speed = 0.6 + Math.random() * 1.2;
    bat.userData = {
      wingL,
      wingR,
      beak,
      batMat,
      birdMat,
      yHeight,
      radius,
      speed,
      angle: Math.random() * Math.PI * 2,
      setThemeMode: (isLight: boolean) => {
        wingL.material = isLight ? birdMat : batMat;
        wingR.material = isLight ? birdMat : batMat;
        beak.visible = isLight;
      }
    };
    scene.add(bat);
    batsList.push(bat);
  }

  return batsList;
}

export function setupWalkers(simarroGroup: THREE.Group, DX: number) {
  const mats = createHalloweenMaterials();
  const walkers: WalkerEntity[] = [];

  const glowEye = (c: number) => new THREE.MeshBasicMaterial({ color: c });

  const ANIMALS = {
    spider: (_seed: number) => {
      const g = new THREE.Group();
      const m = new THREE.MeshStandardMaterial({ color: 0x15101c, roughness: 0.5 });
      const ab = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 9), m);
      ab.scale.set(1, 0.85, 1.2);
      ab.position.set(0, 0.5, -0.35);
      const hd = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 9), m);
      hd.position.set(0, 0.45, 0.1);
      const mk = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), mats.orangeNeonMat);
      mk.position.set(0, 0.82, -0.4);
      g.add(ab, hd, mk);
      [-0.1, 0.1].forEach(x => {
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), glowEye(0xff2a2a));
        e.position.set(x, 0.52, 0.3);
        g.add(e);
      });
      const legs: THREE.Group[] = [];
      const base: number[] = [];
      for (let i = 0; i < 8; i++) {
        const side = i < 4 ? -1 : 1;
        const k = i % 4;
        const p = new THREE.Group();
        p.position.set(0, 0.45, 0);
        p.add(
          bar(new THREE.Vector3(0, 0, 0.15), new THREE.Vector3(0, 0.3, 0.55), 0.025, m),
          bar(new THREE.Vector3(0, 0.3, 0.55), new THREE.Vector3(0, -0.45, 0.95), 0.02, m)
        );
        base.push(side * (Math.PI / 2 + (k - 1.5) * 0.45));
        p.rotation.y = base[i];
        g.add(p);
        legs.push(p);
      }
      g.scale.setScalar(1.3);
      g.userData = {
        anim: (ph: number) =>
          legs.forEach((p, i) => {
            p.rotation.y = base[i] + Math.sin(ph * 1.5 + i * 1.3) * 0.22;
          })
      };
      return g;
    },
    wolf: (seed: number) => {
      const g = new THREE.Group();
      const furColors = [0x4a4d55, 0x2b2d33, 0x6b6458];
      const fur = new THREE.MeshStandardMaterial({
        color: furColors[seed % 3],
        roughness: 0.95,
        flatShading: true
      });
      const add = (geo: THREE.BufferGeometry, x: number, y: number, z: number, rx = 0) => {
        const m = new THREE.Mesh(geo, fur);
        m.position.set(x, y, z);
        m.rotation.x = rx;
        m.castShadow = true;
        g.add(m);
        return m;
      };
      add(new THREE.BoxGeometry(0.5, 0.5, 1.1), 0, 0.85, 0);
      add(new THREE.BoxGeometry(0.38, 0.42, 0.45), 0, 1.05, 0.55, -0.4);
      add(new THREE.BoxGeometry(0.34, 0.32, 0.4), 0, 1.2, 0.88);
      add(new THREE.BoxGeometry(0.2, 0.18, 0.32), 0, 1.12, 1.14);
      [-0.1, 0.1].forEach(x => {
        add(new THREE.ConeGeometry(0.07, 0.2, 4), x, 1.42, 0.8);
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), glowEye(0xffd23a));
        e.position.set(x, 1.25, 1.06);
        g.add(e);
      });
      g.add(bar(new THREE.Vector3(0, 0.95, -0.55), new THREE.Vector3(0, 0.6, -1.05), 0.07, fur));
      const legs = [
        [-0.17, 0.4],
        [0.17, 0.4],
        [-0.17, -0.4],
        [0.17, -0.4]
      ].map(([x, z]) => {
        const p = new THREE.Group();
        p.position.set(x, 0.65, z);
        const l = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.65, 0.12), fur);
        l.position.y = -0.325;
        p.add(l);
        g.add(p);
        return p;
      });
      g.scale.setScalar(1.1);
      g.userData = {
        anim: (ph: number) => {
          const s = Math.sin(ph) * 0.6;
          legs[0].rotation.x = legs[3].rotation.x = s;
          legs[1].rotation.x = legs[2].rotation.x = -s;
        }
      };
      return g;
    },
    cat: (seed: number) => {
      const g = new THREE.Group();
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x0d0d12, roughness: 0.8 });
      const lightMat = new THREE.MeshStandardMaterial({ color: seed % 2 === 0 ? 0xd97706 : 0xf8fafc, roughness: 0.7 });
      const currentMat = darkMat;
      const catMeshes: THREE.Mesh[] = [];

      const add = (geo: THREE.BufferGeometry, x: number, y: number, z: number) => {
        const m = new THREE.Mesh(geo, currentMat);
        m.position.set(x, y, z);
        g.add(m);
        catMeshes.push(m);
        return m;
      };
      add(new THREE.BoxGeometry(0.24, 0.24, 0.6), 0, 0.42, 0);
      add(new THREE.SphereGeometry(0.14, 8, 8), 0, 0.55, 0.38);
      const eyes: THREE.Mesh[] = [];
      [-0.07, 0.07].forEach(x => {
        add(new THREE.ConeGeometry(0.05, 0.12, 4), x, 0.7, 0.38);
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), glowEye(0x66ff44));
        e.position.set(x, 0.58, 0.5);
        g.add(e);
        eyes.push(e);
      });
      const tail = bar(new THREE.Vector3(0, 0.5, -0.3), new THREE.Vector3(0, 0.95, -0.45), 0.03, currentMat);
      g.add(tail);
      if (tail instanceof THREE.Mesh) catMeshes.push(tail);

      const legs = [
        [-0.08, 0.2],
        [0.08, 0.2],
        [-0.08, -0.2],
        [0.08, -0.2]
      ].map(([x, z]) => {
        const p = new THREE.Group();
        p.position.set(x, 0.3, z);
        const l = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.3, 0.07), currentMat);
        l.position.y = -0.15;
        p.add(l);
        catMeshes.push(l);
        g.add(p);
        return p;
      });
      g.userData = {
        anim: (ph: number) => {
          const s = Math.sin(ph) * 0.7;
          legs[0].rotation.x = legs[3].rotation.x = s;
          legs[1].rotation.x = legs[2].rotation.x = -s;
        },
        updateCatTheme: (isLight: boolean) => {
          const m = isLight ? lightMat : darkMat;
          catMeshes.forEach(mesh => { mesh.material = m; });
          eyes.forEach(e => {
            e.material = isLight ? new THREE.MeshBasicMaterial({ color: 0x1e293b }) : glowEye(0x66ff44);
          });
        }
      };
      return g;
    },
    dog: (seed: number) => {
      // Perro amigable de compañía
      const g = new THREE.Group();
      const dogColors = [0xd97706, 0xb45309, 0xca8a04, 0x78350f];
      const fur = new THREE.MeshStandardMaterial({ color: dogColors[seed % dogColors.length], roughness: 0.75 });
      const snoutMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
      const noseMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.75), fur);
      body.position.set(0, 0.5, 0);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.32), fur);
      head.position.set(0, 0.75, 0.42);
      const snout = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.2), snoutMat);
      snout.position.set(0, 0.68, 0.6);
      const nose = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.04), noseMat);
      nose.position.set(0, 0.72, 0.71);

      // Orejas caídas simpáticas
      const earL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.12), fur);
      earL.position.set(-0.18, 0.72, 0.4);
      const earR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.12), fur);
      earR.position.set(0.18, 0.72, 0.4);

      // Cola alegre
      const tail = new THREE.Group();
      tail.position.set(0, 0.6, -0.38);
      const tailMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.08), fur);
      tailMesh.position.y = 0.13;
      tailMesh.rotation.x = -0.55;
      tail.add(tailMesh);

      const legs = [
        [-0.14, 0.25],
        [0.14, 0.25],
        [-0.14, -0.25],
        [0.14, -0.25]
      ].map(([x, z]) => {
        const p = new THREE.Group();
        p.position.set(x, 0.35, z);
        const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.38, 0.1), fur);
        l.position.y = -0.19;
        p.add(l);
        g.add(p);
        return p;
      });

      g.add(body, head, snout, nose, earL, earR, tail);
      g.userData = {
        anim: (ph: number) => {
          const s = Math.sin(ph) * 0.65;
          legs[0].rotation.x = legs[3].rotation.x = s;
          legs[1].rotation.x = legs[2].rotation.x = -s;
          tail.rotation.y = Math.sin(ph * 4.5) * 0.6;
        }
      };
      return g;
    },
    sheep: (_seed: number) => {
      // Oveja de granja
      const g = new THREE.Group();
      const wool = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.95 });
      const skin = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.52, 0.8), wool);
      body.position.set(0, 0.55, 0);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.28, 0.32), skin);
      head.position.set(0, 0.72, 0.44);
      const earL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.08), skin);
      earL.position.set(-0.18, 0.74, 0.4);
      const earR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.08), skin);
      earR.position.set(0.18, 0.74, 0.4);

      const legs = [
        [-0.18, 0.25],
        [0.18, 0.25],
        [-0.18, -0.25],
        [0.18, -0.25]
      ].map(([x, z]) => {
        const p = new THREE.Group();
        p.position.set(x, 0.35, z);
        const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.38, 0.1), skin);
        l.position.y = -0.19;
        p.add(l);
        g.add(p);
        return p;
      });

      g.add(body, head, earL, earR);
      g.userData = {
        anim: (ph: number) => {
          const s = Math.sin(ph) * 0.5;
          legs[0].rotation.x = legs[3].rotation.x = s;
          legs[1].rotation.x = legs[2].rotation.x = -s;
        }
      };
      return g;
    },
    pig: (_seed: number) => {
      // Cerdito de granja
      const g = new THREE.Group();
      const pink = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.7 });
      const darkPink = new THREE.MeshStandardMaterial({ color: 0xdb2777, roughness: 0.7 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.72), pink);
      body.position.set(0, 0.45, 0);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.3), pink);
      head.position.set(0, 0.52, 0.42);
      const snout = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.12), darkPink);
      snout.position.set(0, 0.48, 0.6);
      const earL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.06), darkPink);
      earL.position.set(-0.16, 0.68, 0.42);
      const earR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.06), darkPink);
      earR.position.set(0.16, 0.68, 0.42);

      const legs = [
        [-0.16, 0.22],
        [0.16, 0.22],
        [-0.16, -0.22],
        [0.16, -0.22]
      ].map(([x, z]) => {
        const p = new THREE.Group();
        p.position.set(x, 0.26, z);
        const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.1), pink);
        l.position.y = -0.14;
        p.add(l);
        g.add(p);
        return p;
      });

      g.add(body, head, snout, earL, earR);
      g.userData = {
        anim: (ph: number) => {
          const s = Math.sin(ph) * 0.5;
          legs[0].rotation.x = legs[3].rotation.x = s;
          legs[1].rotation.x = legs[2].rotation.x = -s;
        }
      };
      return g;
    },
    cow: (_seed: number) => {
      // Vaca lechera de granja
      const g = new THREE.Group();
      const white = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 });
      const black = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
      const muzzle = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.7 });
      const horn = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 1.15), white);
      body.position.set(0, 0.72, 0);
      const spot1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.4), black);
      spot1.position.set(0.2, 0.95, 0.15);
      const spot2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.35), black);
      spot2.position.set(-0.2, 0.95, -0.25);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.38, 0.42), white);
      head.position.set(0, 0.92, 0.68);
      const snout = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.22), muzzle);
      snout.position.set(0, 0.8, 0.88);
      const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 5), horn);
      hornL.position.set(-0.18, 1.15, 0.65);
      hornL.rotation.z = 0.3;
      const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 5), horn);
      hornR.position.set(0.18, 1.15, 0.65);
      hornR.rotation.z = -0.3;

      const legs = [
        [-0.22, 0.35],
        [0.22, 0.35],
        [-0.22, -0.35],
        [0.22, -0.35]
      ].map(([x, z]) => {
        const p = new THREE.Group();
        p.position.set(x, 0.45, z);
        const l = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.14), white);
        l.position.y = -0.25;
        const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.15), black);
        hoof.position.y = -0.48;
        p.add(l, hoof);
        g.add(p);
        return p;
      });

      g.add(body, spot1, spot2, head, snout, hornL, hornR);
      g.userData = {
        anim: (ph: number) => {
          const s = Math.sin(ph) * 0.45;
          legs[0].rotation.x = legs[3].rotation.x = s;
          legs[1].rotation.x = legs[2].rotation.x = -s;
        }
      };
      return g;
    }
  };

  const COSTUME_BY_SEED = [
    '',
    'witch',
    '',
    'vampire',
    'pumpkin',
    '',
    'ghost',
    'santa',
    '',
    'skeleton',
    '',
    'mummy',
    'santa',
    '',
    'witch',
    '',
    'vampire',
    ''
  ];

  function dress(g: THREE.Group, c: string) {
    if (!c) return;
    const costumeParts: THREE.Object3D[] = [];
    const M = (col: number, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: col, roughness: 0.8 }, o));
    const torso = g.children[0] as THREE.Mesh;
    const head = g.children[1] as THREE.Mesh;
    const hair = g.children[2] as THREE.Mesh;
    const origTorsoMat = torso.material;
    const origHeadMat = head.material;
    const black = M(0x0d0d12);

    const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      g.add(m);
      costumeParts.push(m);
      return m;
    };
    const limbs = (ma: THREE.Material, ml: THREE.Material) => {
      if (ma && g.userData.arms) (g.userData.arms as THREE.Group[]).forEach(a => ((a.children[0] as THREE.Mesh).material = ma));
      if (ml && g.userData.legs) (g.userData.legs as THREE.Group[]).forEach(l => ((l.children[0] as THREE.Mesh).material = ml));
    };

    if (c === 'witch') {
      add(new THREE.CylinderGeometry(0.3, 0.4, 0.9, 10), M(0x4c1d95), 0, 0.9, 0);
      add(new THREE.ConeGeometry(0.22, 0.6, 10), black, 0, 2.18, 0);
      add(new THREE.CylinderGeometry(0.36, 0.36, 0.03, 12), black, 0, 1.92, 0);
      head.material = M(0x9bc27a);
    } else if (c === 'vampire') {
      head.material = M(0xe9e2da);
      torso.material = black;
      add(new THREE.BoxGeometry(0.6, 0.95, 0.04), M(0x7f1d1d, { side: THREE.DoubleSide }), 0, 1.1, -0.33);
      add(new THREE.BoxGeometry(0.62, 0.3, 0.05), black, 0, 1.5, -0.3);
    } else if (c === 'ghost') {
      const sh = M(0xf4f6ff, { emissive: 0x8899ff, emissiveIntensity: 0.35 });
      add(new THREE.CylinderGeometry(0.3, 0.5, 1.5, 12), sh, 0, 1.05, 0);
      add(new THREE.SphereGeometry(0.31, 12, 10), sh, 0, 1.82, 0);
      [-0.1, 0.1].forEach(x => add(new THREE.SphereGeometry(0.05, 6, 6), black, x, 1.85, 0.27));
      add(new THREE.SphereGeometry(0.06, 6, 6), black, 0, 1.7, 0.28);
      head.visible = false;
      if (hair) hair.visible = false;
      if (g.userData.arms) (g.userData.arms as THREE.Group[]).forEach(a => (a.visible = false));
    } else if (c === 'skeleton') {
      const bone = M(0xece7d8);
      torso.material = black;
      head.material = bone;
      limbs(bone, M(0x1a1a20));
      [1.3, 1.15, 1.0].forEach(y => add(new THREE.BoxGeometry(0.4, 0.04, 0.02), bone, 0, y, 0.15));
      [-0.07, 0.07].forEach(x => add(new THREE.SphereGeometry(0.04, 6, 6), black, x, 1.75, 0.18));
      if (hair) hair.visible = false;
    } else if (c === 'pumpkin') {
      head.visible = false;
      if (hair) hair.visible = false;
      const p = createDetailedPumpkin(0.62);
      p.position.set(0, 1.76, 0);
      g.add(p);
      costumeParts.push(p);
    }

    g.userData.costumeParts = costumeParts;
    g.userData.origTorsoMat = origTorsoMat;
    g.userData.origHeadMat = origHeadMat;
    g.userData.costumeName = c;
  }

  function makePerson(zombie: boolean, seed: number) {
    const g = new THREE.Group();
    const shirts = [0xc0392b, 0x2e86c1, 0x27ae60, 0xf1c40f, 0x8e44ad, 0xecf0f1];
    const pants = [0x2c3e50, 0x1b2631, 0x5d4037];
    const sk = new THREE.MeshStandardMaterial({
      color: zombie ? 0x86a86a : [0xf1c9a5, 0xd9a47c, 0xb67b55][seed % 3],
      roughness: 0.8
    });
    const sh = new THREE.MeshStandardMaterial({ color: zombie ? 0x3b3f2e : shirts[seed % 6], roughness: 0.8 });
    const pa = new THREE.MeshStandardMaterial({ color: zombie ? 0x26282c : pants[seed % 3], roughness: 0.8 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.28), sh);
    torso.position.y = 1.15;
    g.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 9), sk);
    head.position.y = 1.72;
    g.add(head);

    let hair: THREE.Mesh | null = null;
    if (zombie) {
      head.rotation.z = 0.3;
      head.position.x = 0.05;
      [-0.07, 0.07].forEach(x => {
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff2a2a }));
        e.position.set(x + 0.05, 1.75, 0.17);
        g.add(e);
      });
      const rag = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.18, 0.3), pa);
      rag.position.y = 0.92;
      g.add(rag);
    } else {
      hair = new THREE.Mesh(
        new THREE.SphereGeometry(0.21, 10, 8),
        new THREE.MeshStandardMaterial({ color: [0x2b1d14, 0x6b4423, 0xd4a017][seed % 3] })
      );
      hair.scale.set(1, 0.6, 1);
      hair.position.y = 1.83;
      g.add(hair);
    }

    const limb = (w: number, h: number, mat: THREE.Material, x: number, y: number) => {
      const p = new THREE.Group();
      p.position.set(x, y, 0);
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mat);
      m.position.y = -h / 2;
      p.add(m);
      g.add(p);
      return p;
    };

    const arms = [limb(0.12, 0.6, zombie ? sk : sh, -0.32, 1.45), limb(0.12, 0.6, zombie ? sk : sh, 0.32, 1.45)];
    const legs = [limb(0.15, 0.8, pa, -0.13, 0.8), limb(0.15, 0.8, pa, 0.13, 0.8)];
    if (zombie) arms.forEach(a => (a.rotation.x = -1.4));

    g.userData = {
      arms,
      legs,
      zombie,
      headMesh: head,
      torsoMesh: torso,
      hairMesh: hair,
      anim: (ph: number) => {
        const sw = Math.sin(ph) * (zombie ? 0.35 : 0.6);
        legs[0].rotation.x = sw;
        legs[1].rotation.x = -sw;
        if (!zombie) {
          arms[0].rotation.x = -sw * 0.8;
          arms[1].rotation.x = sw * 0.8;
        }
      }
    };
    return g;
  }

  function addWalker(
    ax: number,
    az: number,
    bx: number,
    bz: number,
    speed: number,
    kind: boolean | 'spider' | 'wolf' | 'cat' | 'dog' | 'sheep' | 'pig' | 'cow',
    seed: number
  ) {
    const g =
      typeof kind === 'string'
        ? ANIMALS[kind](seed)
        : makePerson(kind, seed);

    if (kind === false) dress(g, COSTUME_BY_SEED[seed] || '');
    g.position.set(ax, -0.05, az);

    // Configurar modo claro/oscuro:
    // En modo día: zombies, arañas y lobos DESAPARECEN.
    // Animales de granja (ovejas, cerdos, vacas) y perros APARECEN.
    // Personas normales se quitan los disfraces de Halloween.
    g.userData.kind = kind;
    g.userData.setThemeMode = (isLight: boolean) => {
      if (kind === true || kind === 'spider' || kind === 'wolf') {
        g.visible = !isLight;
      } else if (kind === 'dog' || kind === 'sheep' || kind === 'pig' || kind === 'cow') {
        g.visible = isLight;
      } else if (kind === 'cat') {
        g.visible = true;
        if (g.userData.updateCatTheme) g.userData.updateCatTheme(isLight);
      } else if (kind === false) {
        // Persona normal
        if (g.userData.costumeParts) {
          g.userData.costumeParts.forEach((cp: THREE.Object3D) => {
            cp.visible = !isLight;
          });
        }
        if (g.userData.headMesh) {
          const cName = g.userData.costumeName;
          g.userData.headMesh.visible = isLight || (!['ghost', 'pumpkin'].includes(cName));
          if (isLight && g.userData.origHeadMat) {
            g.userData.headMesh.material = g.userData.origHeadMat;
          }
        }
        if (g.userData.torsoMesh && isLight && g.userData.origTorsoMat) {
          g.userData.torsoMesh.material = g.userData.origTorsoMat;
        }
        if (g.userData.hairMesh) {
          const cName = g.userData.costumeName;
          g.userData.hairMesh.visible = isLight || (!['ghost', 'skeleton', 'pumpkin'].includes(cName));
        }
        if (g.userData.arms) {
          g.userData.arms.forEach((a: THREE.Group) => { a.visible = true; });
        }
      }
    };

    // Estado inicial de visibilidad (por defecto oscuro al cargar la escena)
    if (kind === 'dog' || kind === 'sheep' || kind === 'pig' || kind === 'cow') {
      g.visible = false;
    }

    simarroGroup.add(g);
    walkers.push({
      g,
      ax,
      az,
      bx,
      bz,
      speed,
      t: Math.random(),
      dir: 1,
      len: Math.hypot(bx - ax, bz - az),
      seed
    });
  }

  const walkerData: [boolean | 'spider' | 'wolf' | 'cat' | 'dog' | 'sheep' | 'pig' | 'cow', number, number[][]][] = [
    [
      // Personas normales (vestidas de Halloween en noche / ropa normal en día)
      false,
      0,
      [
        [0.9, 4, 0.9, 23, 1.2],
        [-0.9, 22, -0.9, 5, 1.3],
        [0.9, 14, 0.9, 2, 1.1],
        [-0.9, 7, -0.9, 24, 1.25],
        [5.2, 3, 5.2, 18, 1.15],
        [5.2, 23, 5.2, 8, 1.2],
        [15.0, 4, 15.0, 22, 1.1],
        [15.0, 24, 15.0, 9, 1.05],
        [-5.2, 3, -5.2, 19, 1.15],
        [-5.2, 24, -5.2, 7, 1.2],
        [-15.0, 4, -15.0, 21, 1.1],
        [-15.0, 23, -15.0, 6, 1.05],
        [5.2, 1.8, 15.0, 1.8, 1.2],
        [-5.2, 1.8, -15.0, 1.8, 1.2],
        [5.2, 14.0, 15.0, 14.0, 1.1],
        [-5.2, 7.0, -15.0, 7.0, 1.15],
        [-5.2, 22.0, -15.0, 22.0, 1.05],
        [5.2, 25.0, 15.0, 25.0, 1.1]
      ]
    ],
    [
      // Zombies (solo en modo Halloween)
      true,
      0,
      [
        [5.2, 6, 5.2, 16, 0.4],
        [-5.2, 8, -5.2, 19, 0.38],
        [15.0, 5, 15.0, 17, 0.42],
        [-15.0, 7, -15.0, 20, 0.35],
        [5.2, 14.0, 14.0, 14.0, 0.4],
        [-5.2, 7.0, -14.0, 7.0, 0.38],
        [0.9, 8, 0.9, 18, 0.36]
      ]
    ],
    [
      // Arañas gigantes (solo en modo Halloween)
      'spider',
      0,
      [
        [5.2, 3, 5.2, 12, 0.7],
        [-5.2, 11, -5.2, 23, 0.75],
        [15.0, 8, 15.0, 21, 0.8],
        [-15.0, 3, -15.0, 13, 0.7],
        [6.0, 1.8, 14.0, 1.8, 0.75],
        [-6.0, 22.0, -14.0, 22.0, 0.7]
      ]
    ],
    [
      // Lobos (solo en modo Halloween)
      'wolf',
      0,
      [
        [15.0, 3, 15.0, 24, 1.6],
        [-15.0, 24, -15.0, 4, 1.5],
        [5.2, 4, 5.2, 22, 1.55],
        [-5.2, 23, -5.2, 5, 1.5]
      ]
    ],
    [
      // Gatos (visibles en ambos modos, cambian pelaje)
      'cat',
      0,
      [
        [0.9, 5, 0.9, 16, 0.85],
        [-0.9, 21, -0.9, 10, 0.8],
        [5.2, 7, 5.2, 18, 0.9],
        [-5.2, 17, -5.2, 6, 0.85]
      ]
    ],
    [
      // Perros leales (solo en modo Día)
      'dog',
      0,
      [
        [15.0, 3, 15.0, 24, 1.4],
        [-15.0, 24, -15.0, 4, 1.35],
        [5.2, 4, 5.2, 22, 1.45],
        [-5.2, 23, -5.2, 5, 1.4]
      ]
    ],
    [
      // Ovejas de granja (solo en modo Día)
      'sheep',
      0,
      [
        [15.0, 6, 15.0, 18, 0.65],
        [5.2, 14.0, 14.0, 14.0, 0.7],
        [5.2, 9, 5.2, 20, 0.6]
      ]
    ],
    [
      // Cerditos de granja (solo en modo Día)
      'pig',
      0,
      [
        [-15.0, 6, -15.0, 17, 0.75],
        [-5.2, 7.0, -14.0, 7.0, 0.7]
      ]
    ],
    [
      // Vacas lecheras (solo en modo Día)
      'cow',
      0,
      [
        [15.0, 10, 15.0, 23, 0.5],
        [-15.0, 10, -15.0, 23, 0.48]
      ]
    ]
  ];

  walkerData.forEach(([kind, off, arr]) =>
    arr.forEach(([x, z, x2, z2, v], i) => addWalker(DX + x, z, DX + x2, z2, v, kind, i + off))
  );

  return walkers;
}


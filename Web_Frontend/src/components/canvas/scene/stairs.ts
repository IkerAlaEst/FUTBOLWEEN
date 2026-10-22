import * as THREE from 'three';
import { createStoneTexture } from './textures';
import {
  createDetailedPumpkin,
  createGhost,
  makeIsland,
  createHalloweenMaterials,
  createGamerCharacter,
  createWizardCharacter,
  createWarriorCharacter,
  createMedicCharacter,
  createFootballerCharacter,
  createHalloweenIslandCreature,
  createSchoolBooksProp,
  createOpenBackpackProp,
  createSandwichProp,
  createSoccerBallProp,
  createWaterBottleAndNotesProp
} from './environment';

export interface StepDataPoint {
  pos: THREE.Vector3;
  tangent: THREE.Vector3;
  angleY: number;
}

export function buildStairs(scene: THREE.Scene) {
  const mats = createHalloweenMaterials();
  const castleStoneTex = createStoneTexture('#d8be94', '#9c825b');
  castleStoneTex.repeat.set(3, 3);
  const castleWallMat = new THREE.MeshStandardMaterial({ map: castleStoneTex, roughness: 0.88 });
  const castleDarkStoneMat = new THREE.MeshStandardMaterial({ color: 0xb69970, roughness: 0.9 });

  const START_Y = 27.5;
  const END_Y = -42.0;
  const TOTAL_STEPS = 96;

  const curveControlPoints: THREE.Vector3[] = [];
  const turns = 3.2;
  const spiralRadius = 6.0;
  const numPoints = 24;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const y = START_Y + t * (END_Y - START_Y);
    const angle = t * turns * Math.PI * 2;
    const x = Math.sin(angle) * spiralRadius;
    const z = -9.0 + Math.cos(angle) * spiralRadius;
    curveControlPoints.push(new THREE.Vector3(x, y, z));
  }
  const stairCurve = new THREE.CatmullRomCurve3(curveControlPoints);

  const stepData: StepDataPoint[] = [];
  const stairsGroup = new THREE.Group();
  scene.add(stairsGroup);

  const torchFlames: THREE.Mesh[] = [];
  const floatingGhosts: THREE.Group[] = [];
  const interactiveNpcs: THREE.Group[] = [];
  const stairPumpkins: THREE.Group[] = [];
  const stairSchoolProps: THREE.Group[] = [];

  for (let i = 0; i <= TOTAL_STEPS; i++) {
    const t = i / TOTAL_STEPS;
    const pos = stairCurve.getPointAt(t);
    const tangent = stairCurve.getTangentAt(t).normalize();
    const angleY = Math.atan2(tangent.x, tangent.z);
    stepData.push({ pos, tangent, angleY });

    const stepHolder = new THREE.Group();
    stepHolder.position.copy(pos);
    stepHolder.rotation.y = angleY;

    const isNearSchool = t > 0.82;
    const treadMat = isNearSchool
      ? new THREE.MeshStandardMaterial({ color: 0xbdbab2, roughness: 0.6 })
      : castleWallMat;

    const tread = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.28, 1.15), treadMat);
    tread.position.y = -0.14;
    tread.castShadow = true;
    tread.receiveShadow = true;
    stepHolder.add(tread);

    const riserBlock = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.95, 0.9), castleDarkStoneMat);
    riserBlock.position.set(0, -0.62, -0.1);
    stepHolder.add(riserBlock);

    if (i % 4 === 0 && i < TOTAL_STEPS - 2) {
      const postL = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.15, 0.34), castleWallMat);
      postL.position.set(-1.65, 0.55, 0);
      const postR = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.15, 0.34), castleWallMat);
      postR.position.set(1.65, 0.55, 0);
      stepHolder.add(postL, postR);

      if (i % 8 === 0) {
        const torchStick = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.7, 6), mats.darkIronMat);
        torchStick.position.set(-1.65, 1.35, 0);
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 7), mats.orangeNeonMat);
        flame.position.set(-1.65, 1.8, 0);
        flame.userData = { baseY: 1.8, seed: i };
        torchFlames.push(flame);
        stepHolder.add(torchStick, flame);

        // Modo Halloween: Calabaza en el poste
        const pmp = createDetailedPumpkin(0.62);
        pmp.position.set(1.65, 1.38, 0);
        pmp.rotation.y = -0.3;
        stepHolder.add(pmp);
        stairPumpkins.push(pmp);

        // Modo Claro: Vida escolar y deportiva (libros, mochilas, sandwiches, balones)
        let schoolProp: THREE.Group;
        const propType = Math.floor(i / 8) % 5;
        if (propType === 0) {
          schoolProp = createSchoolBooksProp(1.15);
          schoolProp.position.set(1.65, 1.15, 0);
        } else if (propType === 1) {
          schoolProp = createSoccerBallProp(1.2);
          schoolProp.position.set(1.15, 0.02, 0.1);
        } else if (propType === 2) {
          schoolProp = createSandwichProp(1.2);
          schoolProp.position.set(1.65, 1.15, 0);
        } else if (propType === 3) {
          schoolProp = createOpenBackpackProp(1.05);
          schoolProp.position.set(1.05, 0.02, 0.05);
        } else {
          schoolProp = createWaterBottleAndNotesProp(1.15);
          schoolProp.position.set(1.65, 1.15, 0);
        }
        schoolProp.visible = false; // Modo Halloween por defecto
        stepHolder.add(schoolProp);
        stairSchoolProps.push(schoolProp);
      } else if (i % 8 === 4) {
        // Objetos dispersos en escalones alternos (balones y libretas)
        const extraProp = (i % 16 === 4) ? createSoccerBallProp(0.95) : createSchoolBooksProp(0.95);
        extraProp.position.set(-1.15, 0.02, 0.1);
        extraProp.visible = false;
        stepHolder.add(extraProp);
        stairSchoolProps.push(extraProp);
      }
    }
    stairsGroup.add(stepHolder);
  }

  // ========================================================
  // ÚNICAMENTE LAS 3 PIEDRAS FLOTANTES CON PERSONAJES (GAMER, MAGO, GUERRERO)
  // Con distancia de seguridad out = 11.8 para evitar cualquier colisión con la escalera
  // ========================================================
  // 1. Isla Gamer (abajo, t = 0.85)
  const qGamer = stairCurve.getPointAt(0.85);
  const dxG = qGamer.x;
  const dzG = qGamer.z + 9;
  const lG = Math.hypot(dxG, dzG) || 1;
  const outG = 11.8;
  const islGamer = makeIsland();
  islGamer.position.set((dxG / lG) * outG, qGamer.y, -9 + (dzG / lG) * outG);
  const faceAngleG = Math.atan2(-dxG, -dzG);
  const gamerChar = createGamerCharacter();
  gamerChar.position.set(0, 0.1, 0);
  gamerChar.rotation.y = faceAngleG;
  islGamer.add(gamerChar);
  interactiveNpcs.push(gamerChar);
  scene.add(islGamer);

  // 2. Isla Intermedia (Mago en Halloween / Médico en Modo Claro, t = 0.52)
  const qMid = stairCurve.getPointAt(0.52);
  const dxM = qMid.x;
  const dzM = qMid.z + 9;
  const lM = Math.hypot(dxM, dzM) || 1;
  const outM = 11.8;
  const islMid = makeIsland();
  islMid.position.set((dxM / lM) * outM, qMid.y, -9 + (dzM / lM) * outM);
  const faceAngleM = Math.atan2(-dxM, -dzM);

  const wizardChar = createWizardCharacter();
  wizardChar.position.set(0, 0.1, 0);
  wizardChar.rotation.y = faceAngleM;
  wizardChar.visible = true; // Por defecto modo Halloween

  const medicChar = createMedicCharacter();
  medicChar.position.set(0, 0.1, 0);
  medicChar.rotation.y = faceAngleM;
  medicChar.visible = false;

  islMid.add(wizardChar, medicChar);
  interactiveNpcs.push(wizardChar, medicChar);
  scene.add(islMid);

  // 3. Isla Superior (Guerrero en Halloween / Futbolista en Modo Claro, t = 0.22)
  const qTop = stairCurve.getPointAt(0.22);
  const dxT = qTop.x;
  const dzT = qTop.z + 9;
  const lT = Math.hypot(dxT, dzT) || 1;
  const outT = 11.8;
  const islTop = makeIsland();
  islTop.position.set((dxT / lT) * outT, qTop.y, -9 + (dzT / lT) * outT);
  const faceAngleT = Math.atan2(-dxT, -dzT);

  const warriorChar = createWarriorCharacter();
  warriorChar.position.set(0, 0.1, 0);
  warriorChar.rotation.y = faceAngleT;
  warriorChar.visible = true; // Por defecto modo Halloween

  const footballerChar = createFootballerCharacter();
  footballerChar.position.set(0, 0.1, 0);
  footballerChar.rotation.y = faceAngleT;
  footballerChar.visible = false;

  islTop.add(warriorChar, footballerChar);
  interactiveNpcs.push(warriorChar, footballerChar);
  scene.add(islTop);

  const setIslandThemeMode = (isLight: boolean) => {
    wizardChar.visible = !isLight;
    medicChar.visible = isLight;
    warriorChar.visible = !isLight;
    footballerChar.visible = isLight;
    stairSchoolProps.forEach(sp => (sp.visible = isLight));
  };

  // Fantasmas flotantes colocados de forma segura (NUNCA chocan con personajes ni escaleras):
  // unos en el núcleo interior vacío de la espiral y otros en el cielo exterior lejano
  const safeGhostCoords = [
    { r: 2.2, y: 8, angle: 0.5 },
    { r: 2.5, y: 16, angle: 2.5 },
    { r: 2.2, y: 24, angle: 4.8 },
    { r: 17.0, y: 12, angle: 1.2 },
    { r: 18.0, y: 20, angle: 3.4 },
    { r: 16.5, y: 28, angle: 5.2 }
  ];

  safeGhostCoords.forEach((gc, idx) => {
    const gh = createGhost(1.0 + (idx % 2) * 0.3);
    const gx = Math.cos(gc.angle) * gc.r;
    const gz = -9 + Math.sin(gc.angle) * gc.r;
    gh.position.set(gx, gc.y, gz);
    gh.userData = { y0: gc.y, s: idx * 1.5 };
    scene.add(gh);
    floatingGhosts.push(gh);
  });

  return {
    stairCurve,
    stepData,
    stairsGroup,
    torchFlames,
    floatingGhosts,
    stairPumpkins,
    stairSchoolProps,
    interactiveNpcs,
    setIslandThemeMode,
    START_Y,
    END_Y,
    TOTAL_STEPS
  };
}

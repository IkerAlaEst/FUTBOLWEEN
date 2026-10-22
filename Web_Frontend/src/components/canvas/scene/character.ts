import * as THREE from 'three';
import { createDetailedPumpkin, createHalloweenMaterials } from './environment';

export interface ArmRig {
  shoulderPivot: THREE.Group;
  elbowPivot: THREE.Group;
}

export interface LegRig {
  hipPivot: THREE.Group;
  kneePivot: THREE.Group;
}

export interface CharacterRig {
  characterGroup: THREE.Group;
  torsoGroup: THREE.Group;
  capePivot: THREE.Group;
  leftArmRig: ArmRig;
  rightArmRig: ArmRig;
  leftLegRig: LegRig;
  rightLegRig: LegRig;
  soccerBall: THREE.Mesh;
  setThemeMode: (isLight: boolean) => void;
}

export function buildCharacter(scene: THREE.Scene): CharacterRig {
  const mats = createHalloweenMaterials();
  const characterGroup = new THREE.Group();
  scene.add(characterGroup);

  // Materiales de Indumentaria
  const kitOrangeMat = new THREE.MeshStandardMaterial({ color: 0xff5e00, roughness: 0.35 });
  const kitDayMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
  const kitDarkMat = new THREE.MeshStandardMaterial({ color: 0x16132b, roughness: 0.45 });
  const capeMat = new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.6, side: THREE.DoubleSide });

  // Materiales de Persona Normal (Modo Día)
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf6d3b3, roughness: 0.65 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x2a1d17, roughness: 0.85 });
  const capMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.45 });
  const capVisorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
  const backpackMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
  const backpackAccentMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
  const zipperMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.8 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

  // 1. Torso
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 1.05;
  characterGroup.add(torsoGroup);

  const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.82, 0.42), kitOrangeMat);
  chestMesh.castShadow = true;
  torsoGroup.add(chestMesh);

  // 2. Capa de Halloween (Modo Noche)
  const capePivot = new THREE.Group();
  capePivot.position.set(0, 0.36, -0.22);
  const capeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.76, 1.15, 0.06), capeMat);
  capeMesh.position.set(0, -0.55, -0.08);
  capePivot.add(capeMesh);
  torsoGroup.add(capePivot);

  // 3. Mochila Deportiva ("Mochila" - Modo Día / Persona Normal)
  const backpackGroup = new THREE.Group();
  backpackGroup.position.set(0, 0.02, -0.24);
  backpackGroup.visible = false;

  // Cuerpo principal de la mochila
  const packBody = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.72, 0.26), backpackMat);
  packBody.position.set(0, 0, -0.12);
  packBody.castShadow = true;

  // Bolsillo frontal con cremallera
  const frontPocket = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.1), backpackAccentMat);
  frontPocket.position.set(0, -0.12, -0.28);

  // Tiradores y detalles de cremallera metálica
  const zipLine = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.025, 0.015), zipperMat);
  zipLine.position.set(0, 0.08, -0.33);

  // Asa superior de transporte
  const topHandle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 6, 12, Math.PI), backpackMat);
  topHandle.position.set(0, 0.38, -0.12);
  topHandle.rotation.x = -Math.PI / 2;

  // Botella de agua deportiva en bolsillo lateral
  const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.28, 10), new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 }));
  bottle.position.set(0.3, -0.05, -0.12);

  // Correas acolchadas envolventes sobre los hombros hacia el pecho
  const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.74, 0.04), backpackAccentMat);
  strapL.position.set(-0.22, 0.02, 0.44);
  const strapR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.74, 0.04), backpackAccentMat);
  strapR.position.set(0.22, 0.02, 0.44);

  backpackGroup.add(packBody, frontPocket, zipLine, topHandle, bottle, strapL, strapR);
  torsoGroup.add(backpackGroup);

  // 4. Cabeza: Conmutación Calabaza (Oscuro) vs Persona Normal con Gorra Deportiva (Modo Día)
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.72;
  torsoGroup.add(headGroup);

  // Cabeza de Calabaza Halloween
  const pumpkinHead = createDetailedPumpkin(0.88);
  headGroup.add(pumpkinHead);

  // Cabeza de Persona Normal (Chico/Chica estudiante con gorra deportiva)
  const humanHeadGroup = new THREE.Group();
  humanHeadGroup.visible = false;

  const humanHeadMesh = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 14), skinMat);
  humanHeadMesh.position.y = 0.05;
  humanHeadGroup.add(humanHeadMesh);

  // Pelo moderno
  const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 12), hairMat);
  hairMesh.scale.set(1.02, 0.7, 1.05);
  hairMesh.position.set(0, 0.08, -0.04);
  humanHeadGroup.add(hairMesh);

  // Gorra deportiva con visera
  const capCrown = new THREE.Mesh(
    new THREE.SphereGeometry(0.37, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
    capMat
  );
  capCrown.position.set(0, 0.1, 0);
  const capVisor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.34), capVisorMat);
  capVisor.position.set(0, 0.12, 0.34);
  capVisor.rotation.x = 0.12;
  const capButton = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), zipperMat);
  capButton.position.set(0, 0.47, 0);
  humanHeadGroup.add(capCrown, capVisor, capButton);

  // Ojos simpáticos
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeMat);
  eyeL.position.set(-0.12, 0.06, 0.33);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.12;

  // Sonrisa amigable
  const smile = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.04), new THREE.MeshBasicMaterial({ color: 0x991b1b }));
  smile.position.set(0, -0.08, 0.33);

  humanHeadGroup.add(eyeL, eyeR, smile);
  headGroup.add(humanHeadGroup);

  // 5. Brazos
  let axeObj: THREE.Group | null = null;
  let lanObj: THREE.Group | null = null;
  let handRightNormal: THREE.Mesh | null = null;
  let handLeftNormal: THREE.Mesh | null = null;

  function createArm(isRight: boolean): ArmRig {
    const shoulderPivot = new THREE.Group();
    shoulderPivot.position.set(isRight ? 0.46 : -0.46, 0.32, 0);

    const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 0.22), kitOrangeMat);
    upperArm.position.y = -0.18;
    shoulderPivot.add(upperArm);

    const elbowPivot = new THREE.Group();
    elbowPivot.position.set(0, -0.38, 0);

    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.38, 0.19), kitDarkMat);
    forearm.position.y = -0.17;
    elbowPivot.add(forearm);

    if (isRight) {
      // Hacha de Halloween (Modo Noche)
      const axe = new THREE.Group();
      axe.position.set(0, -0.36, 0.04);
      axe.rotation.x = 1.0;
      const haft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 1.15, 7), mats.trunkMat);
      haft.position.y = 0.38;
      axe.add(haft);
      const steel = new THREE.MeshStandardMaterial({ color: 0xaab4c4, roughness: 0.25, metalness: 0.85 });
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.14), mats.darkIronMat);
      eye.position.y = 0.88;
      axe.add(eye);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.3), steel);
      blade.position.set(0, 0.88, 0.2);
      axe.add(blade);
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.5, 0.03), mats.orangeNeonMat);
      edge.position.set(0, 0.88, 0.36);
      axe.add(edge);
      const spike = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.14), steel);
      spike.position.set(0, 0.88, -0.13);
      axe.add(spike);
      elbowPivot.add(axe);
      axeObj = axe;

      // Mano normal (Modo Día)
      const handR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), skinMat);
      handR.position.set(0, -0.36, 0);
      handR.visible = false;
      elbowPivot.add(handR);
      handRightNormal = handR;
    } else {
      // Farol de calabaza (Modo Noche)
      const lan = new THREE.Group();
      lan.position.set(0, -0.5, 0.12);
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 4), mats.darkIronMat);
      cord.position.y = 0.2;
      lan.add(cord);
      const jl = createDetailedPumpkin(0.6);
      jl.position.y = -0.05;
      lan.add(jl);
      lan.add(new THREE.PointLight(0xff8a20, 1.3, 9));
      elbowPivot.add(lan);
      lanObj = lan;

      // Mano normal (Modo Día)
      const handL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), skinMat);
      handL.position.set(0, -0.36, 0);
      handL.visible = false;
      elbowPivot.add(handL);
      handLeftNormal = handL;
    }

    shoulderPivot.add(elbowPivot);
    torsoGroup.add(shoulderPivot);
    return { shoulderPivot, elbowPivot };
  }

  const leftArmRig = createArm(false);
  const rightArmRig = createArm(true);

  // 6. Piernas
  function createLeg(isRight: boolean): LegRig {
    const hipPivot = new THREE.Group();
    hipPivot.position.set(isRight ? 0.19 : -0.19, 0.64, 0);

    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.38, 0.26), kitDarkMat);
    thigh.position.y = -0.17;
    hipPivot.add(thigh);

    const kneePivot = new THREE.Group();
    kneePivot.position.set(0, -0.34, 0);

    const shin = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.34, 0.21), kitOrangeMat);
    shin.position.y = -0.16;
    kneePivot.add(shin);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.38), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    boot.position.set(0, -0.32, 0.07);
    kneePivot.add(boot);

    hipPivot.add(kneePivot);
    characterGroup.add(hipPivot);
    return { hipPivot, kneePivot };
  }

  const leftLegRig = createLeg(false);
  const rightLegRig = createLeg(true);

  // 7. Balón de Fútbol
  const halloweenBallMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xff5e00, emissiveIntensity: 0.75 });
  const classicBallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.1 });

  const soccerBall = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.26, 1),
    halloweenBallMat
  );
  soccerBall.visible = false;
  characterGroup.add(soccerBall);

  // Luz aura del personaje
  const heroLight = new THREE.PointLight(0xff7a1a, 1.6, 11);
  heroLight.position.set(0, 1.6, 0.8);
  characterGroup.add(heroLight);

  // Método para alternar entre Modo Noche (Halloween) y Modo Día (Persona normal con mochila)
  const setThemeMode = (isLight: boolean) => {
    // Cabeza
    pumpkinHead.visible = !isLight;
    humanHeadGroup.visible = isLight;

    // Espalda (Capa vs Mochila)
    capePivot.visible = !isLight;
    backpackGroup.visible = isLight;

    // Manos y accesorios
    if (axeObj) axeObj.visible = !isLight;
    if (handRightNormal) handRightNormal.visible = isLight;
    if (lanObj) lanObj.visible = !isLight;
    if (handLeftNormal) handLeftNormal.visible = isLight;

    // Ropa
    chestMesh.material = isLight ? kitDayMat : kitOrangeMat;
    soccerBall.material = isLight ? classicBallMat : halloweenBallMat;
    heroLight.visible = !isLight;
  };

  return {
    characterGroup,
    torsoGroup,
    capePivot,
    leftArmRig,
    rightArmRig,
    leftLegRig,
    rightLegRig,
    soccerBall,
    setThemeMode
  };
}

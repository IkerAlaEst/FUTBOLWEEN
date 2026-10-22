import * as THREE from 'three';
import { loadAnimatedGifTexture } from './screens';

export interface EasterEggSetupResult {
  group: THREE.Group;
  screenMesh: THREE.Mesh;
  interactiveObjects: THREE.Object3D[];
  update: (timeMs: number) => void;
  destroy: () => void;
  getScreenWorldPosition: () => THREE.Vector3;
  getScreenFocusPosition: () => { camPos: THREE.Vector3; targetPos: THREE.Vector3 };
}

/**
 * Construye el Setup Gaming de competición en el tejado del IES Simarro:
 * - Mesa Gaming de fibra de carbono con tira LED RGB
 * - PC Gaming de cristal templado con GPU, refrigeración líquida y ventiladores RGB
 * - Silla Gaming ergonómica de competición con arneses y almohadilla
 * - Pantalla Gaming ultra-ancha reproduciendo en bucle `partido.gif` en tiempo real
 * - Periféricos (teclado mecánico RGB, ratón gaming, alfombrilla XXL, auriculares)
 */
export function buildEasterEggGamingSetup(): EasterEggSetupResult {
  const group = new THREE.Group();
  group.name = 'EasterEggGamingSetup';

  const interactiveObjects: THREE.Object3D[] = [];

  // Materiales principales del setup
  const carbonDeskMat = new THREE.MeshStandardMaterial({
    color: 0x181a20,
    roughness: 0.45,
    metalness: 0.6
  });

  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x111317,
    roughness: 0.5,
    metalness: 0.85
  });

  const neonOrangeMat = new THREE.MeshBasicMaterial({ color: 0xff5e00 });
  const neonPurpleMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
  const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

  const leatherBlackMat = new THREE.MeshStandardMaterial({
    color: 0x14161d,
    roughness: 0.65,
    metalness: 0.2
  });

  const leatherOrangeMat = new THREE.MeshStandardMaterial({
    color: 0xff5e00,
    roughness: 0.5,
    metalness: 0.3
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.35,
    roughness: 0.1,
    transmission: 0.6,
    thickness: 0.5
  });

  // ==========================================
  // 1. MESA GAMING PROFESIONAL (DESK)
  // ==========================================
  const deskGroup = new THREE.Group();
  group.add(deskGroup);

  // Tablero de la mesa (con chaflán ergonómico)
  const deskTop = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.1, 1.8),
    carbonDeskMat
  );
  deskTop.position.set(0, 1.45, 0);
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  deskGroup.add(deskTop);

  // Tira de LED RGB frontal y lateral bajo el tablero
  const rgbStrip = new THREE.Mesh(
    new THREE.BoxGeometry(3.62, 0.025, 1.82),
    neonOrangeMat
  );
  rgbStrip.position.set(0, 1.4, 0);
  deskGroup.add(rgbStrip);

  // Patas en "Z" de acero reforzado (lado izquierdo y derecho)
  [-1.6, 1.6].forEach(legX => {
    // Pie inferior en el suelo
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 1.6), darkSteelMat);
    foot.position.set(legX, 0.04, 0);
    foot.castShadow = true;
    deskGroup.add(foot);

    // Barra diagonal estilo "Z-Frame"
    const diag = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.5, 0.14), darkSteelMat);
    diag.position.set(legX, 0.72, -0.15);
    diag.rotation.x = -0.35;
    diag.castShadow = true;
    deskGroup.add(diag);

    // Soporte superior bajo el tablero
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 1.4), darkSteelMat);
    topBar.position.set(legX, 1.38, 0);
    deskGroup.add(topBar);

    // Embellecedor lateral con resplandor neón
    const legBadge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.4), neonPurpleMat);
    legBadge.position.set(legX + (legX > 0 ? 0.08 : -0.08), 0.75, -0.15);
    deskGroup.add(legBadge);
  });

  // Travesaño trasero de unión estructural
  const crossBar = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.08, 0.08), darkSteelMat);
  crossBar.position.set(0, 0.8, -0.4);
  deskGroup.add(crossBar);

  // Alfombrilla XXL para teclado y ratón
  const mousepad = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.015, 0.85),
    new THREE.MeshStandardMaterial({
      color: 0x12141c,
      roughness: 0.9
    })
  );
  mousepad.position.set(0, 1.51, 0.18);
  deskGroup.add(mousepad);

  // Borde iluminado de la alfombrilla
  const mousepadRim = new THREE.Mesh(
    new THREE.BoxGeometry(2.42, 0.012, 0.87),
    neonPurpleMat
  );
  mousepadRim.position.set(0, 1.505, 0.18);
  deskGroup.add(mousepadRim);

  // Teclado mecánico Gaming RGB
  const keyboardBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.035, 0.28),
    darkSteelMat
  );
  keyboardBody.position.set(-0.25, 1.53, 0.25);
  deskGroup.add(keyboardBody);

  // Teclas iluminadas
  const keycaps = new THREE.Mesh(
    new THREE.BoxGeometry(0.81, 0.02, 0.24),
    neonCyanMat
  );
  keycaps.position.set(-0.25, 1.555, 0.25);
  deskGroup.add(keycaps);

  // Ratón Gaming ergonómico con luz
  const mouse = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.04, 0.19),
    darkSteelMat
  );
  mouse.position.set(0.65, 1.535, 0.25);
  deskGroup.add(mouse);

  const mouseWheel = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.015, 0.05),
    neonOrangeMat
  );
  mouseWheel.position.set(0.65, 1.56, 0.22);
  deskGroup.add(mouseWheel);

  // Soporte de auriculares y headset gaming
  const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.03, 16), darkSteelMat);
  standBase.position.set(-1.4, 1.515, -0.3);
  deskGroup.add(standBase);

  const standPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), darkSteelMat);
  standPole.position.set(-1.4, 1.765, -0.3);
  deskGroup.add(standPole);

  const headphoneBand = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.025, 8, 16, Math.PI),
    leatherOrangeMat
  );
  headphoneBand.position.set(-1.4, 2.02, -0.3);
  headphoneBand.rotation.z = Math.PI;
  deskGroup.add(headphoneBand);

  // Lata de bebida energética Gaming
  const can = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.2, 14),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.3, metalness: 0.8 })
  );
  can.position.set(1.4, 1.6, 0.4);
  deskGroup.add(can);

  // ==========================================
  // 2. TORRE PC GAMING CUSTOM (RGB & CRISTAL)
  // ==========================================
  const pcGroup = new THREE.Group();
  pcGroup.position.set(1.35, 1.95, -0.2);
  deskGroup.add(pcGroup);

  // Chasis negro
  const pcCase = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.88, 0.82),
    darkSteelMat
  );
  pcCase.castShadow = true;
  pcGroup.add(pcCase);

  // Panel lateral de cristal templado
  const glassPanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.82, 0.76),
    glassMat
  );
  glassPanel.position.set(-0.225, 0, 0);
  pcGroup.add(glassPanel);

  // Tarjeta gráfica GPU interna con RGB
  const gpu = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.09, 0.42),
    new THREE.MeshStandardMaterial({ color: 0x2b2d35, metalness: 0.8 })
  );
  gpu.position.set(-0.06, -0.08, 0.05);
  pcGroup.add(gpu);

  const gpuRgb = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.04, 0.38),
    neonOrangeMat
  );
  gpuRgb.position.set(-0.13, -0.08, 0.05);
  pcGroup.add(gpuRgb);

  // Bomba de refrigeración líquida AIO (con anillo RGB)
  const aioPump = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.05, 16),
    neonPurpleMat
  );
  aioPump.position.set(-0.06, 0.16, -0.05);
  aioPump.rotation.z = Math.PI / 2;
  pcGroup.add(aioPump);

  // Ventiladores frontales duales con aros de luz
  [-0.2, 0.2].forEach(fanY => {
    const fanRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.018, 8, 18),
      neonOrangeMat
    );
    fanRing.position.set(0, fanY, 0.415);
    pcGroup.add(fanRing);
  });

  // Luz interna de la torre
  const pcLight = new THREE.PointLight(0xff5e00, 1.4, 2.5);
  pcLight.position.set(-0.05, 0.1, 0);
  pcGroup.add(pcLight);

  // ==========================================
  // 3. SILLA GAMING DE COMPETICIÓN (BUCKET SEAT)
  // ==========================================
  const chairGroup = new THREE.Group();
  chairGroup.position.set(0, 0, 1.25);
  // La silla mira hacia la mesa/pantalla (-Z relativo, por lo que rotamos 180 grados si es necesario)
  chairGroup.rotation.y = Math.PI;
  group.add(chairGroup);

  // Base de 5 ruedas en estrella
  const baseCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.08, 12), darkSteelMat);
  baseCenter.position.y = 0.12;
  chairGroup.add(baseCenter);

  for (let c = 0; c < 5; c++) {
    const angle = (c / 5) * Math.PI * 2;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.45), darkSteelMat);
    arm.position.set(Math.sin(angle) * 0.22, 0.1, Math.cos(angle) * 0.22);
    arm.rotation.y = angle;
    chairGroup.add(arm);

    // Rueda al extremo
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 8), darkSteelMat);
    wheel.position.set(Math.sin(angle) * 0.42, 0.04, Math.cos(angle) * 0.42);
    wheel.rotation.z = Math.PI / 2;
    chairGroup.add(wheel);
  }

  // Pistón hidráulico central
  const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.45, 10), darkSteelMat);
  piston.position.y = 0.35;
  chairGroup.add(piston);

  // Asiento acolchado
  const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.12, 0.64), leatherBlackMat);
  seatBase.position.y = 0.62;
  seatBase.castShadow = true;
  chairGroup.add(seatBase);

  // Bordes laterales elevados del asiento
  [-0.32, 0.32].forEach(bx => {
    const seatWing = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.62), leatherOrangeMat);
    seatWing.position.set(bx, 0.7, 0);
    seatWing.rotation.z = bx > 0 ? 0.3 : -0.3;
    chairGroup.add(seatWing);
  });

  // Respaldo alto de carreras
  const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.15, 0.12), leatherBlackMat);
  backrest.position.set(0, 1.25, -0.28);
  backrest.rotation.x = -0.08;
  backrest.castShadow = true;
  chairGroup.add(backrest);

  // Franjas de competición naranjas en el respaldo
  [-0.18, 0.18].forEach(fx => {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.12, 0.02), leatherOrangeMat);
    stripe.position.set(fx, 1.25, -0.215);
    stripe.rotation.x = -0.08;
    chairGroup.add(stripe);
  });

  // Almohadilla reposacabezas
  const headPillow = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.1), leatherOrangeMat);
  headPillow.position.set(0, 1.68, -0.22);
  headPillow.rotation.x = -0.08;
  chairGroup.add(headPillow);

  // Agujeros de arnés estilo deportivo
  [-0.12, 0.12].forEach(hx => {
    const harnessBezel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.14), darkSteelMat);
    harnessBezel.position.set(hx, 1.54, -0.28);
    chairGroup.add(harnessBezel);
  });

  // Reposabrazos 4D
  [-0.38, 0.38].forEach(ax => {
    const armPole = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.28, 0.06), darkSteelMat);
    armPole.position.set(ax, 0.78, 0.02);
    const armRest = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.04, 0.32), leatherBlackMat);
    armRest.position.set(ax, 0.94, 0.04);
    chairGroup.add(armPole, armRest);
  });

  // ==========================================
  // 4. PANTALLA GAMING CON PARTIDO.GIF EN DIRECTO
  // ==========================================
  const monitorGroup = new THREE.Group();
  monitorGroup.position.set(0, 1.5, -0.35);
  deskGroup.add(monitorGroup);

  // Brazo articulado y soporte del monitor anclado a la mesa
  const armBase = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.04, 16), darkSteelMat);
  armBase.position.set(0, 0.02, 0);
  monitorGroup.add(armBase);

  const armPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.55, 12), darkSteelMat);
  armPillar.position.set(0, 0.28, 0);
  monitorGroup.add(armPillar);

  const armJoint = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.18), darkSteelMat);
  armJoint.position.set(0, 0.52, 0.05);
  monitorGroup.add(armJoint);

  // Chasis trasero y marco del monitor
  const screenWidth = 2.4;
  const screenHeight = 1.25;
  const screenDepth = 0.09;

  const monitorCasing = new THREE.Mesh(
    new THREE.BoxGeometry(screenWidth + 0.08, screenHeight + 0.08, screenDepth),
    new THREE.MeshStandardMaterial({
      color: 0x0f1118,
      roughness: 0.5,
      metalness: 0.8
    })
  );
  monitorCasing.position.set(0, 0.76, 0.14);
  monitorCasing.castShadow = true;
  monitorGroup.add(monitorCasing);

  // Aro de luz RGB ambiental trasero (Bias Lighting)
  const biasLightStrip = new THREE.Mesh(
    new THREE.BoxGeometry(screenWidth + 0.02, screenHeight + 0.02, 0.015),
    neonOrangeMat
  );
  biasLightStrip.position.set(0, 0.76, 0.09);
  monitorGroup.add(biasLightStrip);

  // Cargar el GIF animado de 'partido.gif'
  const gifController = loadAnimatedGifTexture('/partido.gif');

  // Malla de la pantalla LED frontal donde se reproduce el GIF
  const screenMat = new THREE.MeshBasicMaterial({
    map: gifController.texture,
    side: THREE.FrontSide
  });

  const screenMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(screenWidth, screenHeight),
    screenMat
  );
  // Mirando hacia +Z (hacia el jugador y la cámara que se aproxima)
  screenMesh.position.set(0, 0.76, 0.14 + screenDepth / 2 + 0.005);
  screenMesh.name = 'EasterEggScreenMesh';
  screenMesh.userData = {
    isEasterEggScreen: true,
    npcKey: 'game',
    title: 'Pantalla Gaming Easter Egg'
  };
  monitorGroup.add(screenMesh);

  // Marcar todos los elementos del setup para interactividad por doble clic
  [screenMesh, monitorCasing, deskTop, keyboardBody, pcCase, seatBase, backrest, mousepad].forEach(obj => {
    obj.userData = { isEasterEgg: true, npcKey: 'game' };
  });

  interactiveObjects.push(screenMesh, monitorCasing, deskTop, keyboardBody, pcCase, seatBase, backrest, mousepad);

  // Luz frontal emitida por la pantalla hacia la mesa y silla
  const screenGlowLight = new THREE.PointLight(0xff7722, 1.8, 5.5);
  screenGlowLight.position.set(0, 0.76, 0.75);
  monitorGroup.add(screenGlowLight);

  return {
    group,
    screenMesh,
    interactiveObjects,
    update: (timeMs: number) => {
      gifController.update(timeMs);

      // Sutil oscilación de color y brillo en las luces de la torre
      const pulse = 0.5 + Math.sin(timeMs * 0.004) * 0.5;
      pcLight.intensity = 1.2 + pulse * 0.8;
      screenGlowLight.intensity = 1.6 + pulse * 0.4;
      rgbStrip.scale.x = 1.0 + Math.sin(timeMs * 0.002) * 0.005;
    },
    destroy: () => {
      gifController.destroy();
    },
    getScreenWorldPosition: () => {
      const worldPos = new THREE.Vector3();
      screenMesh.getWorldPosition(worldPos);
      return worldPos;
    },
    getScreenFocusPosition: () => {
      const screenWorldPos = new THREE.Vector3();
      screenMesh.getWorldPosition(screenWorldPos);

      // Posición de la cámara para entrar a la pantalla (justo frente a la pantalla a 0.45 de distancia)
      const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(screenMesh.getWorldQuaternion(new THREE.Quaternion())).normalize();
      const camPos = screenWorldPos.clone().addScaledVector(forward, 0.48);

      return {
        camPos,
        targetPos: screenWorldPos
      };
    }
  };
}


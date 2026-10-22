import * as THREE from 'three';
import { buildCastle } from './castle';
import { buildStairs } from './stairs';
import { buildSimarro } from './simarro';
import { buildCharacter } from './character';
import { setupBats, setupWalkers } from './walkers';
import { getNpcDefinitions, projectNpcTags, ProjectedNpcTag } from './hotspots';
import { CharacterNpcData, ModalKey } from '../../../types/common';
import { EasterEggSetupResult } from './easterEggSetup';

export interface SceneManagerOptions {
  canvas: HTMLCanvasElement;
  onNpcsUpdate?: (npcs: ProjectedNpcTag[]) => void;
  onSelectModal?: (key: ModalKey) => void;
}

export class SceneManager {
  private canvas: HTMLCanvasElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private animFrameId: number | null = null;
  private onNpcsUpdate?: (npcs: ProjectedNpcTag[]) => void;
  private onSelectModal?: (key: ModalKey) => void;

  // Interaction & Scroll state
  private targetScrollProgress = 0;
  private smoothProgress = 0;
  private userYawOffset = 0;
  private userPitchOffset = 0.15;
  private isDragging = false;
  private prevX = 0;
  private prevY = 0;
  private dragDistance = 0;

  // Raycaster for clicking directly on 3D characters
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  // Stride animation trackers
  private characterUp = false;
  private characterFace = 0;
  private strideAcc = 0;
  private stridePrev: number | null = null;
  private lastTime = 0;

  // Scene entities
  private npcDefs: CharacterNpcData[] = [];
  private interactiveNpcGroups: THREE.Group[] = [];
  private stepData: { pos: THREE.Vector3; tangent: THREE.Vector3; angleY: number }[] = [];
  private torchFlames: THREE.Mesh[] = [];
  private castleFlames: THREE.Mesh[] = [];
  private floatingGhosts: THREE.Group[] = [];
  private batsList: THREE.Group[] = [];
  private walkers: ReturnType<typeof setupWalkers> = [];
  private bikesList: THREE.Group[] = [];
  private allPumpkins: THREE.Group[] = [];
  private stairCurve!: THREE.CatmullRomCurve3;
  private castlePos!: THREE.Vector3;
  private castleScreenUpdaters: Array<(timeMs: number) => void> = [];
  private simarroScreenUpdaters: Array<(timeMs: number) => void> = [];
  private setIslandThemeMode?: (isLight: boolean) => void;
  private cachedNpcElements: Record<string, HTMLElement | null> = {};

  // Reusable vectors, eulers and quaternions to eliminate GC allocations during 60/120fps render loop
  private readonly _reusableLookAt = new THREE.Vector3();
  private readonly _reusableNormalCam = new THREE.Vector3();
  private readonly _reusableTargetPos = new THREE.Vector3();
  private readonly _reusableTargetQuat = new THREE.Quaternion();
  private readonly _reusableEuler = new THREE.Euler();
  private readonly _reusableYawQuat = new THREE.Quaternion();
  private readonly _reusableTiltQuat = new THREE.Quaternion();
  private readonly _reusableTiltFull = new THREE.Quaternion();
  private readonly _reusablePivot = new THREE.Vector3(0, 0.33, -0.55);
  private readonly _reusablePivotBefore = new THREE.Vector3();
  private readonly _reusablePivotAfter = new THREE.Vector3();
  private readonly _reusableCurrentLook = new THREE.Vector3();
  private readonly _reusableCamDir = new THREE.Vector3();
  private readonly _reusableProjVector = new THREE.Vector3();

  // Theme & Lighting elements
  private ambientLight!: THREE.AmbientLight;
  private mainDirLight!: THREE.DirectionalLight;
  private moonMesh!: THREE.Mesh;
  private particles!: THREE.Points;
  private isModalOpen = false;
  private frozenScrollProgress = 0;
  private modalJustClosedUntil = 0;
  private isLightMode = false;

  // Character Rig
  private charRig!: ReturnType<typeof buildCharacter>;

  // Bici: montar / desmontar sin cortes
  private rideBike: THREE.Group | null = null;
  private rideBikeParent: THREE.Object3D | null = null;
  private rideBikeLocalPos = new THREE.Vector3();
  private rideBikeLocalQuat = new THREE.Quaternion();
  private rideBikeHome: { position: THREE.Vector3; quaternion: THREE.Quaternion } | null = null;
  private mountPhase: 'parked' | 'summoning' | 'riding' | 'returning' = 'parked';
  private mountStartTime = 0;
  private mountFromPos = new THREE.Vector3();
  private mountFromQuat = new THREE.Quaternion();
  private rideBlend = 0;
  private rideWheelSpin = 0;
  private lastRidePos = new THREE.Vector3();

  // Bailes (W / E / R)
  private danceIndex = 0;
  private lastDanceIndex = 1;
  private danceBlend = 0;
  private dancePhase = 0;
  private lastScrollValue = -1;

  // Salto (Espacio), toques de balón (1) y caballito en bici (W/E/R montado)
  private jumpY = 0;
  private jumpVelocity = 0;
  private ballTrickUntil = 0;
  private wheelieUntil = 0;
  private readonly SUMMON_MS = 520;
  private readonly RETURN_MS = 620;
  private readonly WHEELIE_MS = 1200;

  // Easter Egg Setup & Camera Zoom Animation
  private easterEgg?: EasterEggSetupResult;
  private isZoomingToEasterEgg = false;
  private isZoomingOutFromEasterEgg = false;
  private isInsideEasterEgg = false;
  private zoomStartTime = 0;
  private readonly ZOOM_DURATION = 1250;
  private readonly ZOOM_DURATION_OUT = 900;
  private zoomStartCamPos = new THREE.Vector3();
  private zoomStartLookAt = new THREE.Vector3();
  private zoomTargetCamPos = new THREE.Vector3();
  private zoomTargetLookAt = new THREE.Vector3();
  private zoomCompleteCallback: (() => void) | null = null;
  private lastTapTime = 0;
  private lastTapX = 0;
  private lastTapY = 0;

  // Constants
  private readonly TOTAL_STEPS = 96;
  private readonly WALK_LEN = 26;

  constructor(options: SceneManagerOptions) {
    this.canvas = options.canvas;
    this.onNpcsUpdate = options.onNpcsUpdate;
    this.onSelectModal = options.onSelectModal;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x06070c, 0.0095);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 400);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.35);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x06070c, 1);

    this.clock = new THREE.Clock();

    this.initLights();
    this.initSceneObjects();
    this.initEventListeners();
  }

  private initLights() {
    this.ambientLight = new THREE.AmbientLight(0x3b2d54, 1.4);
    this.scene.add(this.ambientLight);

    this.mainDirLight = new THREE.DirectionalLight(0xff8c3b, 2.0);
    this.mainDirLight.position.set(35, 75, 30);
    this.mainDirLight.castShadow = true;
    this.mainDirLight.shadow.mapSize.width = 1024;
    this.mainDirLight.shadow.mapSize.height = 1024;
    this.mainDirLight.shadow.bias = -0.0004;
    this.mainDirLight.shadow.camera.near = 10;
    this.mainDirLight.shadow.camera.far = 160;
    this.mainDirLight.shadow.camera.left = -30;
    this.mainDirLight.shadow.camera.right = 30;
    this.mainDirLight.shadow.camera.top = 30;
    this.mainDirLight.shadow.camera.bottom = -30;
    this.scene.add(this.mainDirLight);

    // Luna naranja (se vuelve sol en modo claro)
    this.moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(12, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xff4500 })
    );
    this.moonMesh.position.set(22, 48, -65);
    this.scene.add(this.moonMesh);

    // Partículas de brasas flotantes
    this.particles = new THREE.Points(
      new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(320 * 3).map(() => (Math.random() - 0.5) * 42), 3)
      ),
      new THREE.PointsMaterial({ color: 0xff6a00, size: 0.24, transparent: true, opacity: 0.8 })
    );
    this.scene.add(this.particles);
  }

  private initSceneObjects() {
    const castleResult = buildCastle(this.scene);
    this.castleFlames = castleResult.castleFlames;
    this.floatingGhosts.push(...castleResult.castleGhosts);
    this.interactiveNpcGroups.push(...castleResult.interactiveNpcs);
    this.allPumpkins.push(...castleResult.castlePumpkins);
    if (castleResult.screenUpdaters) {
      this.castleScreenUpdaters = castleResult.screenUpdaters;
    }

    const stairsResult = buildStairs(this.scene);
    this.stepData = stairsResult.stepData;
    this.torchFlames = stairsResult.torchFlames;
    this.floatingGhosts.push(...stairsResult.floatingGhosts);
    this.interactiveNpcGroups.push(...stairsResult.interactiveNpcs);
    this.allPumpkins.push(...stairsResult.stairPumpkins);
    this.setIslandThemeMode = stairsResult.setIslandThemeMode;

    const finalStep = this.stepData[this.stepData.length - 1].pos;
    const simarroResult = buildSimarro(this.scene, finalStep, stairsResult.END_Y);
    this.floatingGhosts.push(...simarroResult.simarroGhosts);
    if (simarroResult.screenUpdaters) {
      this.simarroScreenUpdaters = simarroResult.screenUpdaters;
    }
    this.easterEgg = simarroResult.easterEgg;
    if (this.easterEgg) {
      this.interactiveNpcGroups.push(...(this.easterEgg.interactiveObjects as unknown as THREE.Group[]));
    }

    this.charRig = buildCharacter(this.scene);

    this.batsList = setupBats(this.scene, stairsResult.START_Y);
    this.walkers = setupWalkers(simarroResult.simarroGroup, simarroResult.DX);
    this.bikesList = simarroResult.bikes;

    this.stairCurve = stairsResult.stairCurve;
    this.castlePos = castleResult.castleGroup.position;
    this.npcDefs = getNpcDefinitions(
      this.stairCurve,
      this.castlePos,
      this.isLightMode
    );
  }

  private initEventListeners() {
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onDoubleClick = this.onDoubleClick.bind(this);
    this.onWindowScroll = this.onWindowScroll.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);

    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('dblclick', this.onDoubleClick);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('scroll', this.onWindowScroll, { passive: true });
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('keydown', this.onKeyDown);

    this.onWindowScroll();
  }

  private onPointerDown(e: PointerEvent) {
    this.isDragging = true;
    this.prevX = e.clientX;
    this.prevY = e.clientY;
    this.dragDistance = 0;
  }

  private onPointerMove(e: PointerEvent) {
    if (!this.isDragging) return;
    const dx = e.clientX - this.prevX;
    const dy = e.clientY - this.prevY;
    this.dragDistance += Math.hypot(dx, dy);

    this.userYawOffset -= dx * 0.0085;
    const minPitch = this.smoothProgress > 0.65 ? 0.04 : -0.15;
    this.userPitchOffset = Math.max(minPitch, Math.min(1.15, this.userPitchOffset + dy * 0.006));
    this.prevX = e.clientX;
    this.prevY = e.clientY;
  }

  private onDoubleClick(e: MouseEvent) {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const setupObjects = this.easterEgg ? (this.easterEgg.interactiveObjects as unknown as THREE.Object3D[]) : [];
    const intersects = this.raycaster.intersectObjects(setupObjects, true);
    if (intersects.length > 0) {
      this.triggerEasterEggZoom(() => {
        if (this.onSelectModal) this.onSelectModal('game');
      });
    }
  }

  private onPointerUp(e: PointerEvent) {
    const wasDragging = this.dragDistance > 6;
    this.isDragging = false;

    // Detectar doble toque rápido (para soporte táctil y doble clic rápido)
    const now = performance.now();
    const isDoubleTap = now - this.lastTapTime < 380 && Math.hypot(e.clientX - this.lastTapX, e.clientY - this.lastTapY) < 25;
    this.lastTapTime = now;
    this.lastTapX = e.clientX;
    this.lastTapY = e.clientY;

    if (isDoubleTap && !wasDragging) {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);

      const setupObjects = this.easterEgg ? (this.easterEgg.interactiveObjects as unknown as THREE.Object3D[]) : [];
      const intersects = this.raycaster.intersectObjects(setupObjects, true);
      if (intersects.length > 0) {
        this.triggerEasterEggZoom(() => {
          if (this.onSelectModal) this.onSelectModal('game');
        });
        return;
      }
    }

    // Clic sobre una bici: el personaje se la lleva y sigue la misma ruta montado
    if (!wasDragging && !this.isModalOpen && this.mountPhase === 'parked' && this.bikesList.length > 0) {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);

      const bikeHits = this.raycaster.intersectObjects(this.bikesList, true);
      if (bikeHits.length > 0) {
        let hitObj: THREE.Object3D | null = bikeHits[0].object;
        while (hitObj && !hitObj.userData?.isBike) hitObj = hitObj.parent;
        if (hitObj) {
          this.mountBike(hitObj as THREE.Group);
          return;
        }
      }
    }

    // Si fue un click intencional y no un arrastre de cámara, hacer raycasting a los personajes normales
    if (!wasDragging && this.onSelectModal) {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);

      // Comprobar intersecciones con los personajes interactivos
      const intersects = this.raycaster.intersectObjects(this.interactiveNpcGroups, true);
      if (intersects.length > 0) {
        let currentObj: THREE.Object3D | null = intersects[0].object;
        while (currentObj) {
          if (currentObj.userData && currentObj.userData.npcKey) {
            const key = currentObj.userData.npcKey as ModalKey;
            // El setup del juego sólo responde a doble clic, no a un clic simple
            if (key !== 'game') {
              this.onSelectModal(key);
            }
            break;
          }
          currentObj = currentObj.parent;
        }
      }
    }
  }

  private onKeyDown(e: KeyboardEvent) {
    if (e.repeat || this.isModalOpen) return;
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)
    ) {
      return;
    }

    const key = e.key.toLowerCase();
    const isActionKey =
      [' ', '1', 'w', 'e', 'r', 'z'].includes(key) ||
      e.code === 'Space' ||
      e.code === 'Numpad1';

    // Si el foco quedó en un botón (ej: tras hacer clic en el Navbar),
    // desenfocarlo para que las teclas de acción no lo cliquen repetidamente ni se pierdan
    if (target && target.tagName === 'BUTTON' && isActionKey) {
      target.blur();
    }

    // Espacio: pequeño salto (tanto en bici como a pie)
    if (key === ' ' || e.code === 'Space') {
      e.preventDefault();
      this.startJump();
      return;
    }

    // 1: toques con el balón
    if (key === '1' || e.code === 'Numpad1') {
      e.preventDefault();
      this.startBallTrick();
      return;
    }

    if (key === 'z') {
      this.dismountBike();
      return;
    }

    // W = baile 1, E = baile 2, R = baile 3 (pulsar de nuevo el mismo los para)
    const danceIdx = key === 'w' ? 1 : key === 'e' ? 2 : key === 'r' ? 3 : 0;
    if (!danceIdx) return;

    // Montado en bici: los botones de baile hacen que se plante a una rueda (caballito / wheelie)
    if (this.mountPhase === 'riding') {
      this.wheelieUntil = performance.now() + this.WHEELIE_MS;
      return;
    }
    if (this.mountPhase === 'summoning') return;

    if (this.danceIndex === danceIdx) {
      this.danceIndex = 0;
    } else {
      this.danceIndex = danceIdx;
      this.lastDanceIndex = danceIdx;
      this.dancePhase = 0;
    }
  }

  /** Salto corto con física sencilla (en bici y a pie). */
  public startJump() {
    if (this.jumpY > 0.001 || this.jumpVelocity > 0) return;
    this.jumpVelocity = 3.6;
  }

  /** Toques con el balón durante unos segundos (tecla 1). */
  public startBallTrick() {
    if (this.mountPhase !== 'parked') return;
    this.ballTrickUntil = performance.now() + 3400;
  }

  /** El personaje recoge la bici indicada y se monta en marcha, sin cortes. */
  public mountBike(bike: THREE.Group) {
    if (this.mountPhase !== 'parked') return;

    this.scene.updateMatrixWorld(true);
    const homeWorldPos = new THREE.Vector3();
    const homeWorldQuat = new THREE.Quaternion();
    bike.getWorldPosition(homeWorldPos);
    bike.getWorldQuaternion(homeWorldQuat);

    this.rideBikeParent = bike.parent;
    this.rideBikeLocalPos.copy(bike.position);
    this.rideBikeLocalQuat.copy(bike.quaternion);

    this.rideBike = bike;
    this.rideBikeHome = { position: homeWorldPos, quaternion: homeWorldQuat };
    this.mountFromPos.copy(homeWorldPos);
    this.mountFromQuat.copy(homeWorldQuat);
    this.lastRidePos.copy(homeWorldPos);
    this.rideWheelSpin = 0;
    this.mountStartTime = performance.now();
    this.mountPhase = 'summoning';

    // Pasar la bici a la escena conservando su posición para animarla en el mundo
    this.scene.attach(bike);
  }

  /** Baja de la bici y la devuelve volando a su sitio original, sin cortes. */
  public dismountBike() {
    if (!this.rideBike || !this.rideBikeHome) return;
    if (this.mountPhase !== 'riding' && this.mountPhase !== 'summoning') return;

    this.mountFromPos.copy(this.rideBike.position);
    this.mountFromQuat.copy(this.rideBike.quaternion);
    this.mountStartTime = performance.now();
    this.mountPhase = 'returning';
  }

  private finishBikeReturn() {
    const bike = this.rideBike;
    if (bike && this.rideBikeParent) {
      this.rideBikeParent.add(bike);
      bike.position.copy(this.rideBikeLocalPos);
      bike.quaternion.copy(this.rideBikeLocalQuat);
    }
    this.rideBike = null;
    this.rideBikeParent = null;
    this.rideBikeHome = null;
    this.mountPhase = 'parked';
  }

  /**
   * Curva suave 0 → 1 → 0 del caballito, para que la bici no dé un tirón
   * al pulsar los botones de baile montado.
   */
  private getWheelieAmount(now: number): number {
    if (this.mountPhase !== 'riding' || now >= this.wheelieUntil) return 0;
    const elapsed = this.WHEELIE_MS - (this.wheelieUntil - now);
    if (elapsed <= 0 || elapsed >= this.WHEELIE_MS) return 0;
    return Math.sin((elapsed / this.WHEELIE_MS) * Math.PI);
  }

  private updateRideBike(
    now: number,
    charX: number,
    baseY: number,
    charZ: number,
    yaw: number,
    wheelie: number
  ) {
    const bike = this.rideBike;
    if (!bike) return;

    this._reusableTargetPos.set(
      charX + Math.sin(yaw) * 0.15,
      baseY,
      charZ + Math.cos(yaw) * 0.15
    );
    this._reusableEuler.set(0, yaw, 0);
    this._reusableTargetQuat.setFromEuler(this._reusableEuler);
    const prevX = bike.position.x;
    const prevZ = bike.position.z;

    if (this.mountPhase === 'riding') {
      bike.position.copy(this._reusableTargetPos);
      bike.quaternion.copy(this._reusableTargetQuat);

      // Caballito: se planta a una rueda (rueda trasera en el suelo, delantera levantada ~53°)
      if (wheelie > 0.001) {
        const angle = wheelie * 0.92;
        this._reusableEuler.set(0, yaw, 0);
        this._reusableYawQuat.setFromEuler(this._reusableEuler);
        this._reusableEuler.set(-angle, 0, 0);
        this._reusableTiltQuat.setFromEuler(this._reusableEuler);
        this._reusableTiltFull.copy(this._reusableYawQuat).multiply(this._reusableTiltQuat);

        // Pivote en el centro de la rueda trasera (z = -0.55, y = 0.33)
        this._reusablePivot.set(0, 0.33, -0.55);
        this._reusablePivotBefore.copy(this._reusablePivot).applyQuaternion(this._reusableYawQuat);
        this._reusablePivotAfter.copy(this._reusablePivot).applyQuaternion(this._reusableTiltFull);

        bike.quaternion.copy(this._reusableTiltFull);
        bike.position.add(this._reusablePivotBefore.sub(this._reusablePivotAfter));
      }
    } else if (this.mountPhase === 'summoning' || this.mountPhase === 'returning') {
      const isSummon = this.mountPhase === 'summoning';
      const duration = isSummon ? this.SUMMON_MS : this.RETURN_MS;
      const t = Math.min(1, (now - this.mountStartTime) / duration);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const toPos = isSummon ? this._reusableTargetPos : this.rideBikeHome ? this.rideBikeHome.position : this._reusableTargetPos;
      const toQuat = isSummon ? this._reusableTargetQuat : this.rideBikeHome ? this.rideBikeHome.quaternion : this._reusableTargetQuat;

      bike.position.lerpVectors(this.mountFromPos, toPos, eased);
      bike.quaternion.slerpQuaternions(this.mountFromQuat, toQuat, eased);
      // Pequeño arco vertical para que el desplazamiento se sienta fluido
      bike.position.y += Math.sin(eased * Math.PI) * (isSummon ? 1.1 : 0.8);

      if (t >= 1) {
        if (isSummon) {
          this.mountPhase = 'riding';
        } else {
          this.finishBikeReturn();
          return;
        }
      }
    }

    // Giro de ruedas proporcional al desplazamiento real
    const dist = Math.hypot(bike.position.x - prevX, bike.position.z - prevZ);
    if (dist > 0.0001) {
      this.rideWheelSpin -= dist / 0.33;
      const wheels = bike.userData.wheels as THREE.Group[] | undefined;
      if (wheels) {
        for (let i = 0; i < wheels.length; i++) {
          wheels[i].rotation.z = this.rideWheelSpin;
        }
      }
    }
  }

  public triggerEasterEggZoom(onComplete?: () => void) {
    if (!this.easterEgg || this.isZoomingToEasterEgg) return;

    const focus = this.easterEgg.getScreenFocusPosition();
    this.zoomStartCamPos.copy(this.camera.position);

    // Calcular vector actual hacia donde mira la cámara sin instanciar objetos
    this.camera.getWorldDirection(this._reusableCamDir);
    this.zoomStartLookAt.copy(this.camera.position).addScaledVector(this._reusableCamDir, 10);

    this.zoomTargetCamPos.copy(focus.camPos);
    this.zoomTargetLookAt.copy(focus.targetPos);

    this.zoomStartTime = performance.now();
    this.isZoomingToEasterEgg = true;
    this.isZoomingOutFromEasterEgg = false;
    this.zoomCompleteCallback = onComplete || null;
  }

  public exitEasterEggZoom() {
    if (!this.isInsideEasterEgg && !this.isZoomingToEasterEgg) return;
    this.isZoomingToEasterEgg = false;
    this.isInsideEasterEgg = false;
    this.isZoomingOutFromEasterEgg = true;
    this.zoomStartTime = performance.now();
  }

  public setModalOpen(isOpen: boolean) {
    if (isOpen) {
      this.isModalOpen = true;
      this.frozenScrollProgress = this.smoothProgress;
      this.targetScrollProgress = this.smoothProgress;
    } else {
      this.isModalOpen = false;
      this.modalJustClosedUntil = performance.now() + 800;
      this.targetScrollProgress = this.frozenScrollProgress;
      this.smoothProgress = this.frozenScrollProgress;

      // Si estábamos dentro del easter egg, iniciar zoom out fluido de vuelta a la escena
      if (this.isInsideEasterEgg || this.isZoomingToEasterEgg) {
        this.exitEasterEggZoom();
      }
    }
  }

  private onWindowScroll() {
    if (this.isModalOpen || performance.now() < this.modalJustClosedUntil || (window as any).__isModalOpen) {
      return;
    }
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) return;
    const computed = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    // Proteger contra saltos anómalos a 0 al salir del modal
    if (computed === 0 && this.smoothProgress > 0.05 && performance.now() < this.modalJustClosedUntil + 600) {
      return;
    }
    // Al moverse por la ruta el personaje deja de bailar y vuelve a andar
    if (this.danceIndex !== 0 && this.lastScrollValue >= 0 && Math.abs(computed - this.lastScrollValue) > 0.0004) {
      this.danceIndex = 0;
    }
    this.lastScrollValue = computed;
    this.targetScrollProgress = computed;
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.35);
    this.renderer.setPixelRatio(pixelRatio);
  }

  public startAnimation() {
    const renderLoop = () => {
      this.animFrameId = requestAnimationFrame(renderLoop);
      this.update();
    };
    renderLoop();
  }

  private update() {
    const elapsed = this.clock.getElapsedTime();
    const dt = Math.min(0.05, elapsed - (this.lastTime || elapsed));
    this.lastTime = elapsed;
    const now = performance.now();
    const wheelie = this.getWheelieAmount(now);

    // Física del salto (Espacio)
    if (this.jumpY > 0 || this.jumpVelocity !== 0) {
      this.jumpVelocity -= 9.8 * dt;
      this.jumpY = Math.max(0, this.jumpY + this.jumpVelocity * dt);
      if (this.jumpY === 0 && this.jumpVelocity < 0) this.jumpVelocity = 0;
    }

    // Bloqueo total durante y tras el cierre del modal para impedir cualquier salto o movimiento rápido
    if (this.isModalOpen || performance.now() < this.modalJustClosedUntil) {
      this.targetScrollProgress = this.frozenScrollProgress;
      this.smoothProgress = this.frozenScrollProgress;
    } else {
      this.smoothProgress += (this.targetScrollProgress - this.smoothProgress) * 0.075;
    }

    const scrollSpeed = Math.abs(this.targetScrollProgress - this.smoothProgress);

    const BR_END = 0.2;
    const STAIR_END = 0.8;
    const BR_Z0 = -35.5;

    const bp = Math.min(1, this.smoothProgress / BR_END);
    const sp = Math.min(1, Math.max(0, (this.smoothProgress - BR_END) / (STAIR_END - BR_END)));
    const wp = Math.max(0, (this.smoothProgress - STAIR_END) / (1 - STAIR_END));

    const exactStep = sp * this.TOTAL_STEPS;
    const stepIdx = Math.min(this.TOTAL_STEPS - 1, Math.floor(exactStep));
    const fract = exactStep - stepIdx;

    const currStep = this.stepData[stepIdx];
    const nextStep = this.stepData[stepIdx + 1] || currStep;
    const BR_LEN = this.stepData[0].pos.z - BR_Z0;

    const charX = THREE.MathUtils.lerp(currStep.pos.x, nextStep.pos.x, fract);
    let charZ = THREE.MathUtils.lerp(currStep.pos.z, nextStep.pos.z, fract);
    const baseStepY = THREE.MathUtils.lerp(currStep.pos.y, nextStep.pos.y, fract);
    let hop = Math.sin(fract * Math.PI) * 0.34;
    let rotY = THREE.MathUtils.lerp(0, currStep.angleY, Math.min(1, sp * 25));

    if (sp <= 0) {
      charZ = THREE.MathUtils.lerp(BR_Z0, this.stepData[0].pos.z, bp);
      hop = Math.abs(Math.sin(bp * BR_LEN * 1.1 * Math.PI)) * 0.1;
      rotY = 0;
    }
    if (wp > 0) {
      charZ -= wp * this.WALK_LEN;
      hop = Math.abs(Math.sin(wp * this.WALK_LEN * 1.1 * Math.PI)) * 0.1;
      rotY = THREE.MathUtils.lerp(currStep.angleY, Math.PI, Math.min(1, wp * 8));
    }

    // Orientación si sube el scroll
    const dirDiff = this.targetScrollProgress - this.smoothProgress;
    if (Math.abs(dirDiff) > 0.0015) {
      this.characterUp = dirDiff < 0;
    }
    this.characterFace += ((this.characterUp ? Math.PI : 0) - this.characterFace) * 0.12;

    const yaw = rotY + this.characterFace;

    // Montaje suave: durante el "vuelo" de la bici el personaje sigue andando;
    // al llegar, se sienta en el sillín y la zancada se convierte en pedaleo.
    const rideTargetBlend = this.mountPhase === 'riding' ? 1 : 0;
    this.rideBlend += (rideTargetBlend - this.rideBlend) * Math.min(1, dt * 9);
    if (this.rideBlend < 0.002) this.rideBlend = 0;
    const ride = this.rideBlend;

    // Bailes W / E / R: se mezclan con la pose de caminar/pedalear, sin saltos
    let danceTarget = this.danceIndex !== 0 && this.mountPhase === 'parked' ? 1 : 0;
    if (this.isModalOpen) danceTarget = 0;
    this.danceBlend += (danceTarget - this.danceBlend) * Math.min(1, dt * 9);
    if (this.danceBlend < 0.002) this.danceBlend = 0;
    const dance = this.danceBlend;
    if (this.danceIndex !== 0) this.dancePhase += dt;

    // Pose concreta del baile activo
    let dHipL = 0, dHipR = 0, dKneeL = 0, dKneeR = 0;
    let dShoulderL = 0, dShoulderR = 0, dElbowL = 0, dElbowR = 0;
    let dArmOutL = 0, dArmOutR = 0;
    let dTorsoY = 0, dTorsoZ = 0;
    let dBounce = 0, dYaw = 0;

    // Mientras el baile se desvanece se mantiene su última pose (sin saltos)
    const poseDance = this.danceIndex !== 0 ? this.danceIndex : this.lastDanceIndex;
    if (dance > 0) {
      const dp = this.dancePhase;
      if (poseDance === 1) {
        // Baile 1 (W): rebote con brazos arriba alternos
        const s = Math.sin(dp * 7);
        dBounce = Math.abs(Math.sin(dp * 7)) * 0.18;
        dHipL = -0.55 + s * 0.4;
        dHipR = -0.55 - s * 0.4;
        dKneeL = 0.95 + Math.max(0, s) * 0.55;
        dKneeR = 0.95 + Math.max(0, -s) * 0.55;
        dShoulderL = -2.2 + s * 0.55;
        dShoulderR = -2.2 - s * 0.55;
        dElbowL = 0.35;
        dElbowR = 0.35;
        dTorsoY = s * 0.35;
        dTorsoZ = s * 0.12;
      } else if (poseDance === 2) {
        // Baile 2 (E): twist de cintura con brazos cruzando el pecho
        const s = Math.sin(dp * 6);
        dBounce = Math.abs(s) * 0.05;
        dTorsoY = s * 0.75;
        dTorsoZ = -s * 0.1;
        dHipL = -0.18 + s * 0.22;
        dHipR = -0.18 - s * 0.22;
        dKneeL = 0.5;
        dKneeR = 0.5;
        dShoulderL = -0.85 - s * 0.55;
        dShoulderR = -0.85 + s * 0.55;
        dElbowL = 1.25;
        dElbowR = 1.25;
        dArmOutL = 0.35;
        dArmOutR = -0.35;
      } else {
        // Baile 3 (R): saltos con medio giro y patadas alternas
        const s = Math.sin(dp * 5);
        dBounce = Math.abs(Math.sin(dp * 5)) * 0.5;
        dYaw = Math.sin(dp * 2.6) * Math.PI;
        dHipL = -1.0 + s * 0.5;
        dHipR = -1.0 - s * 0.5;
        dKneeL = 1.3 - s * 0.4;
        dKneeR = 1.3 + s * 0.4;
        dShoulderL = -2.7;
        dShoulderR = -2.7;
        dElbowL = 0.2;
        dElbowR = 0.2;
        dTorsoZ = s * 0.15;
      }
    }

    const charWheelieAngle = 0.88 * wheelie;
    this.charRig.characterGroup.position.set(
      charX - Math.sin(yaw) * (1 - Math.cos(charWheelieAngle)) * 0.45,
      baseStepY + this.jumpY + hop * (1 - ride) * (1 - dance) + ride * 0.16 + dance * dBounce + Math.sin(charWheelieAngle) * 0.42,
      charZ - Math.cos(yaw) * (1 - Math.cos(charWheelieAngle)) * 0.45
    );
    this.charRig.characterGroup.rotation.y = yaw + dance * dYaw;
    // En caballito el cuerpo se planta hacia atrás acompañando a la inclinación de la bici
    this.charRig.characterGroup.rotation.x = -charWheelieAngle;

    // Pasos y zancadas
    const strideRaw = bp * BR_LEN * 1.1 + exactStep + wp * this.WALK_LEN * 1.1;
    this.strideAcc += Math.abs(strideRaw - (this.stridePrev === null ? strideRaw : this.stridePrev));
    this.stridePrev = strideRaw;

    const stridePhase = this.strideAcc * Math.PI;
    const strideIntensity = Math.min(1.15, 0.35 + scrollSpeed * 22);
    const leftHipAngle = Math.sin(stridePhase) * 0.65 * strideIntensity;
    const rightHipAngle = -Math.sin(stridePhase) * 0.65 * strideIntensity;

    // Pedaleo: las piernas giran con el avance real por la ruta
    const pedalPhase = this.strideAcc * Math.PI * 1.35;
    const pedalL = Math.sin(pedalPhase);
    const pedalR = -pedalL;
    const lerp = THREE.MathUtils.lerp;
    const rideHipL = -1.18 + pedalL * 0.32;
    const rideHipR = -1.18 + pedalR * 0.32;
    const rideKneeL = 1.12 - pedalL * 0.34;
    const rideKneeR = 1.12 - pedalR * 0.34;
    const walkKneeL = Math.max(0, -leftHipAngle * 1.15 + 0.25);
    const walkKneeR = Math.max(0, -rightHipAngle * 1.15 + 0.25);
    const mixPose = (walk: number, ridePose: number, dancePose: number) =>
      lerp(lerp(walk, ridePose, ride), dancePose, dance);

    this.charRig.leftLegRig.hipPivot.rotation.x = mixPose(leftHipAngle, rideHipL, dHipL);
    this.charRig.rightLegRig.hipPivot.rotation.x = mixPose(rightHipAngle, rideHipR, dHipR);
    this.charRig.leftLegRig.kneePivot.rotation.x = mixPose(walkKneeL, rideKneeL, dKneeL);
    this.charRig.rightLegRig.kneePivot.rotation.x = mixPose(walkKneeR, rideKneeR, dKneeR);

    this.charRig.leftArmRig.shoulderPivot.rotation.x = mixPose(-leftHipAngle * 0.85, -0.78 - 0.2 * wheelie, dShoulderL);
    this.charRig.rightArmRig.shoulderPivot.rotation.x = mixPose(-rightHipAngle * 0.65 - 0.35, -0.78 - 0.2 * wheelie, dShoulderR);
    this.charRig.leftArmRig.elbowPivot.rotation.x = mixPose(0, 0.42, dElbowL);
    this.charRig.rightArmRig.elbowPivot.rotation.x = mixPose(0, 0.42, dElbowR);
    this.charRig.leftArmRig.shoulderPivot.rotation.z = 0.22 * ride + dArmOutL * dance;
    this.charRig.rightArmRig.shoulderPivot.rotation.z = -0.22 * ride + dArmOutR * dance;
    this.charRig.torsoGroup.rotation.x = 0.14 * ride;
    this.charRig.torsoGroup.rotation.y = dTorsoY * dance;
    this.charRig.torsoGroup.rotation.z = dTorsoZ * dance;
    this.charRig.capePivot.rotation.x = 0.22 + scrollSpeed * 8;

    // Toques con el balón (tecla 1): toques alternos pie derecho y pie izquierdo
    const trickActive = now < this.ballTrickUntil && this.mountPhase === 'parked';
    this.charRig.soccerBall.visible = trickActive;
    if (trickActive) {
      const t = now / 1000;
      const freq = 7.4;
      const sinWave = Math.sin(t * freq);
      const isRight = sinWave >= 0;
      const kick = Math.abs(sinWave);
      const bounce = Math.abs(Math.cos(t * freq));

      if (isRight) {
        this.charRig.rightLegRig.hipPivot.rotation.x = -0.6 - kick * 0.65;
        this.charRig.rightLegRig.kneePivot.rotation.x = 0.7 + kick * 0.4;
        this.charRig.leftLegRig.hipPivot.rotation.x = 0.16;
        this.charRig.leftLegRig.kneePivot.rotation.x = 0.28;
      } else {
        this.charRig.leftLegRig.hipPivot.rotation.x = -0.6 - kick * 0.65;
        this.charRig.leftLegRig.kneePivot.rotation.x = 0.7 + kick * 0.4;
        this.charRig.rightLegRig.hipPivot.rotation.x = 0.16;
        this.charRig.rightLegRig.kneePivot.rotation.x = 0.28;
      }

      this.charRig.leftArmRig.shoulderPivot.rotation.x = -0.5;
      this.charRig.rightArmRig.shoulderPivot.rotation.x = -0.5;
      this.charRig.leftArmRig.shoulderPivot.rotation.z = 0.45 + sinWave * 0.12;
      this.charRig.rightArmRig.shoulderPivot.rotation.z = -0.45 - sinWave * 0.12;
      this.charRig.leftArmRig.elbowPivot.rotation.x = 0.55;
      this.charRig.rightArmRig.elbowPivot.rotation.x = 0.55;
      this.charRig.torsoGroup.rotation.x = 0.12;
      this.charRig.torsoGroup.rotation.y = sinWave * 0.14;

      const ballX = (isRight ? 0.22 : -0.22) * (1 - bounce * 0.45);
      const ballY = 0.28 + bounce * 0.88;
      this.charRig.soccerBall.position.set(ballX, ballY, 0.68);
      this.charRig.soccerBall.rotation.x += dt * 8;
      this.charRig.soccerBall.rotation.y += dt * 5;
    } else {
      this.charRig.soccerBall.position.set(
        0.35,
        0.26 + Math.abs(Math.cos((exactStep + wp * this.WALK_LEN * 1.1) * Math.PI)) * 0.55,
        0.78
      );
    }

    // Animar NPCs interactivos solo si están cerca de la altura del personaje o en el easter egg
    for (let i = 0; i < this.interactiveNpcGroups.length; i++) {
      const npc = this.interactiveNpcGroups[i];
      if (npc.userData && npc.userData.anim) {
        if (Math.abs(npc.position.y - baseStepY) < 32 || this.isInsideEasterEgg) {
          npc.userData.anim(elapsed);
        }
      }
    }

    // Animar pantallas gigantes 3D con GIF con culling de distancia para ahorrar GPU
    const timeMs = elapsed * 1000;
    if (this.smoothProgress < 0.45) {
      for (let i = 0; i < this.castleScreenUpdaters.length; i++) {
        this.castleScreenUpdaters[i](timeMs);
      }
    }
    if (this.smoothProgress > 0.55 || this.isInsideEasterEgg || this.isZoomingToEasterEgg) {
      for (let i = 0; i < this.simarroScreenUpdaters.length; i++) {
        this.simarroScreenUpdaters[i](timeMs);
      }
    }

    // Parpadeo antorchas y fuego (solo en Modo Halloween nocturno y cerca de la cámara)
    if (!this.isLightMode) {
      const flameTime12 = elapsed * 12;
      const flameRot = elapsed * 3;
      for (let i = 0; i < this.torchFlames.length; i++) {
        const fl = this.torchFlames[i];
        if (Math.abs(fl.position.y - baseStepY) < 35) {
          fl.scale.y = 0.85 + Math.sin(flameTime12 + fl.userData.seed) * 0.25;
          fl.rotation.y = flameRot;
        }
      }
      if (this.smoothProgress < 0.4) {
        for (let i = 0; i < this.castleFlames.length; i++) {
          const f = this.castleFlames[i];
          f.scale.y = 0.85 + Math.sin(flameTime12 + f.userData.seed) * 0.25;
        }
      }

      // Fantasmas flotando
      for (let i = 0; i < this.floatingGhosts.length; i++) {
        const g = this.floatingGhosts[i];
        if (g.visible && Math.abs(g.position.y - baseStepY) < 36) {
          g.position.y = g.userData.y0 + Math.sin(elapsed * 1.6 + g.userData.s) * 0.4;
          g.rotation.y = Math.sin(elapsed * 0.7 + g.userData.s) * 0.5;
        }
      }
    }

    // Murciélagos: actualizar solo los que están en rango visible
    const batStep = dt * 1.1;
    for (let i = 0; i < this.batsList.length; i++) {
      const b = this.batsList[i];
      b.userData.angle += b.userData.speed * batStep;
      if (Math.abs(b.userData.yHeight - baseStepY) < 42) {
        b.position.x = Math.cos(b.userData.angle) * b.userData.radius;
        b.position.z = Math.sin(b.userData.angle) * b.userData.radius - 2;
        b.position.y = b.userData.yHeight + Math.sin(elapsed * 4 + b.userData.angle) * 0.6;
        b.rotation.y = -b.userData.angle;
        const flap = Math.sin(elapsed * 18 + b.userData.angle) * 0.65;
        b.userData.wingL.rotation.z = flap;
        b.userData.wingR.rotation.z = -flap;
      }
    }

    // Bici montada: sigue exactamente la ruta del personaje (subida y bajada).
    // Al pulsar un baile montado, hace un caballito sobre la rueda trasera.
    this.updateRideBike(now, charX, baseStepY + this.jumpY, charZ, yaw, wheelie);

    // Caminantes (solo simulan en Simarro cuando están en rango de visibilidad)
    if (this.smoothProgress > 0.45) {
      const walkerElapsed = elapsed * 3.2;
      for (let i = 0; i < this.walkers.length; i++) {
        const w = this.walkers[i];
        if (!w.g.visible) continue;
        w.t += (w.dir * w.speed * dt) / w.len;
        if (w.t > 1) {
          w.t = 1;
          w.dir = -1;
        } else if (w.t < 0) {
          w.t = 0;
          w.dir = 1;
        }
        w.g.position.set(THREE.MathUtils.lerp(w.ax, w.bx, w.t), -0.05, THREE.MathUtils.lerp(w.az, w.bz, w.t));
        w.g.rotation.y = Math.atan2((w.bx - w.ax) * w.dir, (w.bz - w.az) * w.dir);
        if (w.g.userData.anim) {
          w.g.userData.anim(walkerElapsed * w.speed + w.seed);
        }
      }
    }

    // Cámara (sin allocaciones de objetos en el bucle)
    let orbitRadius = 12.8;
    this._reusableLookAt.set(charX, baseStepY + 1.4, charZ);

    if (this.smoothProgress < 0.2) {
      const topBlend = 1 - this.smoothProgress / 0.2;
      orbitRadius = THREE.MathUtils.lerp(12.8, 30, topBlend);
      this._reusableLookAt.y += topBlend * 7;
      this._reusableLookAt.z -= topBlend * 8;
    } else if (this.smoothProgress > 0.7) {
      const botBlend = Math.min(1, (this.smoothProgress - 0.7) / 0.25);
      orbitRadius = THREE.MathUtils.lerp(12.8, 20, botBlend);
      this._reusableLookAt.y += botBlend * 3.2;
      this._reusableLookAt.z -= botBlend * 7;
    }

    const cosPitch = Math.cos(this.userPitchOffset);
    const camX = this._reusableLookAt.x + Math.sin(this.userYawOffset) * cosPitch * orbitRadius;
    let camY = this._reusableLookAt.y + Math.sin(this.userPitchOffset) * orbitRadius + 2.2;
    const camZ = this._reusableLookAt.z + Math.cos(this.userYawOffset) * cosPitch * orbitRadius;

    // Límite de cámara: nunca descender bajo el suelo
    const floorLimit = this.smoothProgress > 0.65 ? (baseStepY + 1.35) : (baseStepY + 0.9);
    if (camY < floorLimit) {
      camY = floorLimit;
    }

    this._reusableNormalCam.set(camX, camY, camZ);

    if (this.isZoomingToEasterEgg) {
      const elapsedZoom = now - this.zoomStartTime;
      const progress = Math.min(1, elapsedZoom / this.ZOOM_DURATION);
      const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      this.camera.position.lerpVectors(this.zoomStartCamPos, this.zoomTargetCamPos, eased);
      this._reusableCurrentLook.lerpVectors(this.zoomStartLookAt, this.zoomTargetLookAt, eased);
      this.camera.lookAt(this._reusableCurrentLook);

      if (progress >= 1) {
        this.isZoomingToEasterEgg = false;
        this.isInsideEasterEgg = true;
        if (this.zoomCompleteCallback) {
          const cb = this.zoomCompleteCallback;
          this.zoomCompleteCallback = null;
          cb();
        }
      }
    } else if (this.isZoomingOutFromEasterEgg) {
      const elapsedZoom = now - this.zoomStartTime;
      const progress = Math.min(1, elapsedZoom / this.ZOOM_DURATION_OUT);
      const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      this.camera.position.lerpVectors(this.zoomTargetCamPos, this._reusableNormalCam, eased);
      this._reusableCurrentLook.lerpVectors(this.zoomTargetLookAt, this._reusableLookAt, eased);
      this.camera.lookAt(this._reusableCurrentLook);

      if (progress >= 1) {
        this.isZoomingOutFromEasterEgg = false;
        this.isInsideEasterEgg = false;
      }
    } else if (this.isInsideEasterEgg) {
      this.camera.position.copy(this.zoomTargetCamPos);
      this.camera.lookAt(this.zoomTargetLookAt);
    } else {
      this.camera.position.lerp(this._reusableNormalCam, 0.08);
      this.camera.lookAt(this._reusableLookAt);
    }

    // Actualizar etiquetas flotantes de NPCs directamente en el DOM (GPU translate3d)
    this.updateNpcTags(baseStepY);

    if (this.onNpcsUpdate) {
      const projected = projectNpcTags(
        this.npcDefs,
        this.camera,
        baseStepY,
        window.innerWidth,
        window.innerHeight
      );
      this.onNpcsUpdate(projected);
    }

    this.renderer.render(this.scene, this.camera);
  }

  private updateNpcTags(charY: number) {
    const halfW = window.innerWidth * 0.5;
    const halfH = window.innerHeight * 0.5;

    for (let i = 0; i < this.npcDefs.length; i++) {
      const npc = this.npcDefs[i];
      let el = this.cachedNpcElements[npc.key];
      if (el === undefined) {
        el = document.getElementById(`npc-tag-${npc.key}`);
        this.cachedNpcElements[npc.key] = el;
      }
      if (!el) continue;

      this._reusableProjVector.set(npc.position.x, npc.position.y + 1.2, npc.position.z);
      this._reusableProjVector.project(this.camera);

      const d = Math.abs(npc.position.y - charY);
      const op = this._reusableProjVector.z > 1 ? 0 : Math.max(0, Math.min(1, 1 - (d - 14) / 10));

      if (op <= 0.04) {
        if (el.style.opacity !== '0') {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
        }
      } else {
        const screenX = this._reusableProjVector.x * halfW + halfW;
        const screenY = -this._reusableProjVector.y * halfH + halfH;
        el.style.transform = `translate3d(${screenX}px, ${screenY}px, 0) translate(-50%, -100%)`;
        el.style.opacity = op.toFixed(2);
        el.style.pointerEvents = op > 0.25 ? 'auto' : 'none';
      }
    }
  }

  public setThemeMode(isLight: boolean) {
    this.isLightMode = isLight;
    if (isLight) {
      // Cielo mediterráneo de Xàtiva brillante y niebla suave de día
      this.renderer.setClearColor(0x7dc3f7, 1);
      this.scene.fog = new THREE.FogExp2(0xcce6ff, 0.0035);
      this.ambientLight.color.setHex(0xffffff);
      this.ambientLight.intensity = 1.8;
      this.mainDirLight.color.setHex(0xfff4d6);
      this.mainDirLight.intensity = 2.6;
      (this.moonMesh.material as THREE.MeshBasicMaterial).color.setHex(0xfffae6);
      this.particles.visible = false;
      this.torchFlames.forEach(f => (f.visible = false));
      this.castleFlames.forEach(f => (f.visible = false));
      this.floatingGhosts.forEach(g => (g.visible = false));
    } else {
      // Noche misteriosa de Halloween
      this.renderer.setClearColor(0x06070c, 1);
      this.scene.fog = new THREE.FogExp2(0x06070c, 0.0095);
      this.ambientLight.color.setHex(0x3b2d54);
      this.ambientLight.intensity = 1.4;
      this.mainDirLight.color.setHex(0xff8c3b);
      this.mainDirLight.intensity = 2.0;
      (this.moonMesh.material as THREE.MeshBasicMaterial).color.setHex(0xff4500);
      this.particles.visible = true;
      this.torchFlames.forEach(f => (f.visible = true));
      this.castleFlames.forEach(f => (f.visible = true));
      this.floatingGhosts.forEach(g => (g.visible = true));
    }

    // Transformar murciélagos a golondrinas/pájaros diurnos
    this.batsList.forEach(b => {
      if (b.userData && b.userData.setThemeMode) {
        b.userData.setThemeMode(isLight);
      }
    });

    // Ocultar calabazas de escaleras y puente en modo día (cero halloween en modo día)
    this.allPumpkins.forEach(p => {
      p.visible = !isLight;
    });

    // Ocultar llamas de los pebeteros de guardianes en modo día
    this.interactiveNpcGroups.forEach(g => {
      if (g.userData && g.userData.brazierFlame) {
        g.userData.brazierFlame.visible = !isLight;
      }
    });

    // Ocultar arañas y zombies en modo día / mostrar perros y granja
    this.walkers.forEach(w => {
      if (w.g.userData && w.g.userData.setThemeMode) {
        w.g.userData.setThemeMode(isLight);
      }
    });

    // Cambiar rig del personaje principal (persona normal con mochila vs héroe calabaza)
    if (this.charRig && this.charRig.setThemeMode) {
      this.charRig.setThemeMode(isLight);
    }

    // Actualizar personajes de las islas flotantes (El Médico / El Futbolista en Claro vs El Mago / El Guerrero en Halloween)
    if (this.setIslandThemeMode) {
      this.setIslandThemeMode(isLight);
    }

    // Actualizar etiquetas flotantes de los personajes según el modo (El Médico / El Futbolista vs El Mago / El Guerrero)
    if (this.stairCurve && this.castlePos) {
      this.npcDefs = getNpcDefinitions(this.stairCurve, this.castlePos, isLight);
    }
    this.cachedNpcElements = {};
  }

  public destroy() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.easterEgg) {
      this.easterEgg.destroy();
    }
    this.cachedNpcElements = {};
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('dblclick', this.onDoubleClick);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('scroll', this.onWindowScroll);
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('keydown', this.onKeyDown);
    this.renderer.dispose();
  }
}

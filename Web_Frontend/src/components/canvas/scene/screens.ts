import * as THREE from 'three';
import { parseGIF, decompressFrames, ParsedFrame } from 'gifuct-js';

export interface AnimatedGifController {
  texture: THREE.CanvasTexture;
  update: (timeMs: number) => void;
  destroy: () => void;
}

/**
 * Carga y anima un archivo GIF sobre una textura de Three.js
 */
export function loadAnimatedGifTexture(url: string): AnimatedGifController {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Placeholder inicial con fondo de marca
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#3b0764');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = '#c084fc';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CLASH XÀTIVA', 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  let composedFrames: HTMLCanvasElement[] = [];
  let frameDelays: number[] = [];
  let totalDuration = 0;
  let currentFrameIndex = -1;
  let isDisposed = false;

  fetch(url)
    .then(res => res.arrayBuffer())
    .then(buffer => {
      if (isDisposed) return;
      const gif = parseGIF(buffer);
      const frames = decompressFrames(gif, true);
      if (!frames.length) return;

      const gifWidth = gif.lsd.width || frames[0].dims.width;
      const gifHeight = gif.lsd.height || frames[0].dims.height;

      // Canvas acumulador para componer cada frame según las especificaciones GIF
      const accumCanvas = document.createElement('canvas');
      accumCanvas.width = gifWidth;
      accumCanvas.height = gifHeight;
      const accumCtx = accumCanvas.getContext('2d')!;

      // Mini canvas auxiliar para colocar los patches respetando la transparencia
      const patchCanvas = document.createElement('canvas');
      const patchCtx = patchCanvas.getContext('2d')!;

      composedFrames = [];
      frameDelays = [];
      totalDuration = 0;

      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        const delay = frame.delay || 80;
        frameDelays.push(delay);
        totalDuration += delay;

        if (i === 0) {
          accumCtx.clearRect(0, 0, gifWidth, gifHeight);
        }

        // Crear el patch con sus dimensiones exactas
        patchCanvas.width = frame.dims.width;
        patchCanvas.height = frame.dims.height;
        const patchData = patchCtx.createImageData(frame.dims.width, frame.dims.height);
        patchData.data.set(frame.patch);
        patchCtx.putImageData(patchData, 0, 0);

        // Alpha-composite the patch onto the accumulator
        accumCtx.drawImage(patchCanvas, frame.dims.left, frame.dims.top);

        // Guardar snapshot del frame completamente renderizado
        const snapshot = document.createElement('canvas');
        snapshot.width = gifWidth;
        snapshot.height = gifHeight;
        const snapCtx = snapshot.getContext('2d')!;
        snapCtx.drawImage(accumCanvas, 0, 0);
        composedFrames.push(snapshot);

        // Si el frame pide disposal 2 (restaurar a fondo), limpiar ese trozo del acumulador
        if (frame.disposalType === 2) {
          accumCtx.clearRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height);
        }
      }

      // Dibujar inmediatamente el primer frame sin alterar las dimensiones del canvas WebGL
      if (composedFrames.length > 0) {
        currentFrameIndex = 0;
        ctx.clearRect(0, 0, 512, 512);
        if (url.includes('logo')) {
          // Centrar y escalar para que el logo ocupe toda la pantalla
          ctx.drawImage(composedFrames[0], 75, 75, 330, 330, 0, 0, 512, 512);
        } else {
          ctx.drawImage(composedFrames[0], 0, 0, 512, 512);
        }
        texture.needsUpdate = true;
      }
    })
    .catch(err => {
      console.warn('Error loading animated GIF:', url, err);
      const fallback = new THREE.TextureLoader().load(url);
      texture.image = fallback.image;
      texture.needsUpdate = true;
    });

  const update = (timeMs: number) => {
    if (!composedFrames.length || totalDuration <= 0) return;

    const loopTime = timeMs % totalDuration;
    let accumulated = 0;
    let targetIndex = 0;

    for (let i = 0; i < frameDelays.length; i++) {
      accumulated += frameDelays[i];
      if (accumulated >= loopTime) {
        targetIndex = i;
        break;
      }
    }

    if (targetIndex !== currentFrameIndex && composedFrames[targetIndex]) {
      currentFrameIndex = targetIndex;
      ctx.clearRect(0, 0, 512, 512);
      if (url.includes('logo')) {
        // Centrar y escalar para que el logo se vea grande, nítido y completo
        ctx.drawImage(composedFrames[targetIndex], 75, 75, 330, 330, 0, 0, 512, 512);
      } else {
        ctx.drawImage(composedFrames[targetIndex], 0, 0, 512, 512);
      }
      texture.needsUpdate = true;
    }
  };

  const destroy = () => {
    isDisposed = true;
    composedFrames = [];
    texture.dispose();
  };

  return { texture, update, destroy };
}

export interface GiantScreenOptions {
  width: number;
  height: number;
  gifUrl: string;
  depth?: number;
  bevelColor?: number;
  neonColor?: number;
  bracketLength?: number;
}

/**
 * Crea una pantalla gigante 3D (Jumbotron / Billboard de eSports) con marco biselado,
 * remaches, barras de soporte estructural y pantalla iluminada con GIF animado.
 */
export function createGiant3DScreen(options: GiantScreenOptions): {
  screenGroup: THREE.Group;
  updateGif: (timeMs: number) => void;
  destroy: () => void;
} {
  const {
    width,
    height,
    gifUrl,
    depth = 0.22,
    bevelColor = 0x181a20,
    neonColor = 0xff5e00,
    bracketLength = 0.4
  } = options;

  const screenGroup = new THREE.Group();
  const gifCtrl = loadAnimatedGifTexture(gifUrl);

  // 1. Chasis / Caja posterior de la pantalla (metal industrial negro mate)
  const casingMat = new THREE.MeshStandardMaterial({
    color: bevelColor,
    roughness: 0.6,
    metalness: 0.8
  });
  const casing = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.35, height + 0.35, depth),
    casingMat
  );
  casing.castShadow = true;
  screenGroup.add(casing);

  // 2. Bisel / Marco exterior de pantalla LED gigante con grosor 3D
  const borderThick = 0.12;
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x0f1117,
    roughness: 0.4,
    metalness: 0.9
  });

  // Marco superior e inferior
  [-1, 1].forEach(s => {
    const horizontalBar = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.4, borderThick, depth + 0.04),
      frameMat
    );
    horizontalBar.position.set(0, s * ((height + 0.35) / 2), 0.01);
    screenGroup.add(horizontalBar);
  });

  // Marco izquierdo y derecho
  [-1, 1].forEach(s => {
    const verticalBar = new THREE.Mesh(
      new THREE.BoxGeometry(borderThick, height + 0.35, depth + 0.04),
      frameMat
    );
    verticalBar.position.set(s * ((width + 0.35) / 2), 0, 0.01);
    screenGroup.add(verticalBar);
  });

  // 3. Tira de LED perimetral con resplandor neón
  const neonMat = new THREE.MeshBasicMaterial({ color: neonColor });
  const neonRim = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.08, height + 0.08, 0.02),
    neonMat
  );
  neonRim.position.z = depth / 2 + 0.005;
  screenGroup.add(neonRim);

  // 4. Panel de pantalla frontal LED que reproduce el GIF (MeshBasicMaterial para que brille siempre como pantalla LED real)
  const screenMat = new THREE.MeshBasicMaterial({
    map: gifCtrl.texture,
    side: THREE.FrontSide
  });

  const displayMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    screenMat
  );
  displayMesh.position.z = depth / 2 + 0.02;
  screenGroup.add(displayMesh);

  // 5. Brackets / Soportes de anclaje de acero a la pared
  if (bracketLength > 0) {
    const bracketMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.8,
      metalness: 0.7
    });
    const bW = width * 0.75;
    [-bW / 2, bW / 2].forEach(bx => {
      [-height * 0.3, height * 0.3].forEach(by => {
        const strut = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.12, bracketLength),
          bracketMat
        );
        strut.position.set(bx, by, -depth / 2 - bracketLength / 2);
        const wallFlange = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.24, 0.04),
          bracketMat
        );
        wallFlange.position.set(bx, by, -depth / 2 - bracketLength);
        screenGroup.add(strut, wallFlange);
      });
    });
  }

  // Pequeña luz de proyección frontal de la pantalla
  const screenLight = new THREE.PointLight(neonColor, 1.2, width * 2.8);
  screenLight.position.set(0, 0, depth / 2 + 0.8);
  screenGroup.add(screenLight);

  return {
    screenGroup,
    updateGif: (timeMs: number) => {
      gifCtrl.update(timeMs);
    },
    destroy: () => {
      gifCtrl.destroy();
    }
  };
}


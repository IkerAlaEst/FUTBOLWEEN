import * as THREE from 'three';

export function createStoneTexture(baseHex: string, mortarHex: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = mortarHex;
  ctx.lineWidth = 3;
  for (let y = 0; y < 256; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
    const offset = (y / 32) % 2 === 0 ? 0 : 32;
    for (let x = offset; x < 256; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 32);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createSimarroSignTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 160;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#c9c7c3';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = '#969490';
  ctx.lineWidth = 4;
  [256, 512, 768].forEach(x => {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, c.height);
    ctx.stroke();
  });
  ctx.fillStyle = '#252930';
  ctx.font = "bold 54px 'Space Grotesk', sans-serif";
  ctx.fillText('IES DR. LLUÍS SIMARRO', 285, 98);
  return new THREE.CanvasTexture(c);
}

export function createPaveTex(rx: number, ry: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#c9c6bf';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#a5a29a';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 128, 128);
  ctx.beginPath();
  ctx.moveTo(64, 0);
  ctx.lineTo(64, 128);
  ctx.stroke();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  return t;
}

export function createPosterTex(lines: string[], bg: string[], fg: string, emoji: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 360;
  const ctx = c.getContext('2d')!;
  const gr = ctx.createLinearGradient(0, 0, 0, 360);
  gr.addColorStop(0, bg[0]);
  gr.addColorStop(1, bg[1]);
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, 256, 360);
  ctx.strokeStyle = fg;
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 236, 340);
  ctx.textAlign = 'center';
  ctx.font = '84px serif';
  ctx.fillText(emoji, 128, 115);
  ctx.fillStyle = fg;
  ctx.font = "bold 36px 'Space Grotesk', sans-serif";
  lines.forEach((l, i) => ctx.fillText(l, 128, 185 + i * 48));
  return new THREE.CanvasTexture(c);
}

export function createPosterHTex(
  lines: [string, number][],
  bg: string[],
  fg: string,
  e1: string,
  e2: string,
  w = 512,
  h = 180
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  const gr = ctx.createLinearGradient(0, 0, w, 0);
  gr.addColorStop(0, bg[0]);
  gr.addColorStop(0.5, bg[1]);
  gr.addColorStop(1, bg[0]);
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(0,0,0,.4)';
  for (let i = 0; i < w; i += 34) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 17, 22 + (i % 3) * 9);
    ctx.lineTo(i + 34, 0);
    ctx.fill();
  }
  ctx.strokeStyle = fg;
  ctx.lineWidth = 6;
  ctx.setLineDash([18, 10]);
  ctx.strokeRect(8, 8, w - 16, h - 16);
  ctx.setLineDash([]);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = Math.round(h * 0.4) + 'px serif';
  ctx.fillText(e1, h * 0.42, h * 0.54);
  ctx.fillText(e2, w - h * 0.42, h * 0.54);
  ctx.fillStyle = fg;
  const n = lines.length;
  lines.forEach(([t, s], i) => {
    ctx.font = 'bold ' + s + "px 'Space Grotesk', sans-serif";
    ctx.fillText(t, w / 2, h / 2 + 4 + (i - (n - 1) / 2) * s * 1.15, w - h * 1.0);
  });
  return new THREE.CanvasTexture(c);
}

export function bar(a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material): THREE.Mesh {
  const d = new THREE.Vector3().subVectors(b, a);
  const len = d.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 5), mat);
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}


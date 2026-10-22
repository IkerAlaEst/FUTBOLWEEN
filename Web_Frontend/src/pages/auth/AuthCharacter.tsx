import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { buildCharacter, CharacterRig } from '../../components/canvas/scene/character';
import { createDetailedPumpkin } from '../../components/canvas/scene/environment';
import { useTheme } from '../../context/ThemeContext';

interface AuthCharacterProps {
  className?: string;
}

interface SceneLights {
  ambient: THREE.AmbientLight;
  key: THREE.DirectionalLight;
  rim: THREE.PointLight;
  fill: THREE.PointLight;
  platform: THREE.MeshBasicMaterial;
  ring: THREE.MeshBasicMaterial;
}

/**
 * El protagonista del torneo (calabaza de noche / estudiante de día) saludando
 * en su pequeño escenario. Se usa como reclamo visual en registro y login.
 */
export const AuthCharacter: React.FC<AuthCharacterProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rigRef = useRef<CharacterRig | null>(null);
  const lightsRef = useRef<SceneLights | null>(null);
  const { isLight } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
    camera.position.set(0, 1.55, 4.8);
    camera.lookAt(0, 1.02, 0);

    const ambient = new THREE.AmbientLight(0x5b4a78, 1.15);
    const key = new THREE.DirectionalLight(0xff8c3b, 2.1);
    key.position.set(2.6, 5.2, 4.2);
    const rim = new THREE.PointLight(0x9333ea, 7, 14);
    rim.position.set(-2.6, 2.4, -2.2);
    const fill = new THREE.PointLight(0xffb066, 3.2, 12);
    fill.position.set(0.4, 1.4, 3.4);
    scene.add(ambient, key, rim, fill);

    const rig = buildCharacter(scene);
    rig.soccerBall.visible = false;
    rigRef.current = rig;

    // Escenario: plataforma y aro mágico
    const platformMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.42 });
    const platform = new THREE.Mesh(new THREE.CircleGeometry(1.9, 48), platformMat);
    platform.rotation.x = -Math.PI / 2;
    platform.position.y = 0.002;
    scene.add(platform);

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff5e00,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.6, 1.92, 56), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    scene.add(ring);

    // Calabazas decorativas junto a los pies
    const pumpkins = [-1.5, 1.58].map((x, i) => {
      const pumpkin = createDetailedPumpkin(i === 0 ? 0.36 : 0.3);
      pumpkin.position.set(x, i === 0 ? 0.3 : 0.25, 0.7);
      pumpkin.rotation.y = i === 0 ? 0.4 : -0.5;
      scene.add(pumpkin);
      return pumpkin;
    });

    lightsRef.current = { ambient, key, rim, fill, platform: platformMat, ring: ringMat };

    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = camera.aspect < 0.9 ? 6.1 : 4.8;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    const clock = new THREE.Clock();
    let frameId = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Balanceo suave + saludo con el brazo derecho
      rig.characterGroup.position.y = Math.sin(t * 1.7) * 0.03;
      rig.characterGroup.rotation.y = Math.sin(t * 0.8) * 0.12;
      rig.torsoGroup.rotation.y = Math.sin(t * 0.9) * 0.07;
      rig.torsoGroup.rotation.z = Math.sin(t * 1.3) * 0.02;

      rig.rightArmRig.shoulderPivot.rotation.x = -0.18;
      rig.rightArmRig.shoulderPivot.rotation.z = 2.0 + Math.sin(t * 5.4) * 0.32;
      rig.rightArmRig.elbowPivot.rotation.x = 0.22;
      rig.rightArmRig.elbowPivot.rotation.z = -0.38 + Math.sin(t * 5.4 + 0.6) * 0.3;

      rig.leftArmRig.shoulderPivot.rotation.x = 0.06;
      rig.leftArmRig.shoulderPivot.rotation.z = -0.06;

      rig.leftLegRig.hipPivot.rotation.x = 0;
      rig.rightLegRig.hipPivot.rotation.x = 0;
      rig.leftLegRig.kneePivot.rotation.x = 0;
      rig.rightLegRig.kneePivot.rotation.x = 0;
      rig.capePivot.rotation.x = 0.24 + Math.sin(t * 1.6) * 0.05;

      ring.rotation.z = t * 0.22;
      ringMat.opacity = 0.36 + Math.sin(t * 1.8) * 0.14;
      pumpkins.forEach((pumpkin, index) => {
        pumpkin.rotation.y = t * 0.45 + index * 1.7;
        pumpkin.position.y = (index === 0 ? 0.3 : 0.25) + Math.sin(t * 1.5 + index) * 0.03;
      });

      // El personaje mira ligeramente hacia la cámara
      rig.rightArmRig.shoulderPivot.rotation.y = -0.12;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      rigRef.current = null;
      lightsRef.current = null;
      scene.traverse(object => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) material.forEach(item => item.dispose());
        else material?.dispose();
      });
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const rig = rigRef.current;
    const lights = lightsRef.current;
    if (!rig || !lights) return;

    rig.setThemeMode(isLight);

    if (isLight) {
      lights.ambient.color.setHex(0xffffff);
      lights.ambient.intensity = 1.9;
      lights.key.color.setHex(0xffe6b8);
      lights.key.intensity = 2.5;
      lights.rim.color.setHex(0xf59e0b);
      lights.rim.intensity = 4;
      lights.fill.color.setHex(0xffffff);
      lights.fill.intensity = 1.6;
      lights.platform.opacity = 0.14;
      lights.ring.color.setHex(0xea580c);
    } else {
      lights.ambient.color.setHex(0x5b4a78);
      lights.ambient.intensity = 1.15;
      lights.key.color.setHex(0xff8c3b);
      lights.key.intensity = 2.1;
      lights.rim.color.setHex(0x9333ea);
      lights.rim.intensity = 7;
      lights.fill.color.setHex(0xffb066);
      lights.fill.intensity = 3.2;
      lights.platform.opacity = 0.42;
      lights.ring.color.setHex(0xff5e00);
    }
  }, [isLight]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
};

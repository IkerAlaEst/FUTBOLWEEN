import * as THREE from 'three';
import { CharacterNpcData } from '../../../types/common';

export function getNpcDefinitions(
  stairCurve: THREE.CatmullRomCurve3,
  castleGroupPos: THREE.Vector3,
  isLight = false,
  easterEggPos?: THREE.Vector3
): CharacterNpcData[] {
  // Island 1 (bottom - Gamer, t = 0.85)
  const qGamer = stairCurve.getPointAt(0.85);
  const dxG = qGamer.x;
  const dzG = qGamer.z + 9;
  const lG = Math.hypot(dxG, dzG) || 1;
  const outG = 11.8;
  const gamerX = (dxG / lG) * outG;
  const gamerY = qGamer.y + 3.2;
  const gamerZ = -9 + (dzG / lG) * outG;

  // Island 2 (mid - Wizard / Médico, t = 0.52)
  const qWiz = stairCurve.getPointAt(0.52);
  const dxW = qWiz.x;
  const dzW = qWiz.z + 9;
  const lW = Math.hypot(dxW, dzW) || 1;
  const outW = 11.8;
  const wizX = (dxW / lW) * outW;
  const wizY = qWiz.y + 3.2;
  const wizZ = -9 + (dzW / lW) * outW;

  // Island 3 (high - Warrior / Futbolista, t = 0.22)
  const qWar = stairCurve.getPointAt(0.22);
  const dxR = qWar.x;
  const dzR = qWar.z + 9;
  const lR = Math.hypot(dxR, dzR) || 1;
  const outR = 11.8;
  const warX = (dxR / lR) * outR;
  const warY = qWar.y + 3.2;
  const warZ = -9 + (dzR / lR) * outR;

  // Castle Gate (top - Guardians)
  const guardX = castleGroupPos.x;
  const guardY = castleGroupPos.y - 2.5 + 4.2;
  const guardZ = castleGroupPos.z + 1.2;

  return [
    {
      key: 'normas',
      type: 'gamer',
      title: 'El Gamer',
      subtitle: 'Normas Oficiales del Torneo',
      badge: 'NORMAS',
      position: { x: gamerX, y: gamerY, z: gamerZ }
    },
    {
      key: 'setup_mandos',
      type: isLight ? 'medico' : 'mago',
      title: isLight ? 'El Médico' : 'El Mago',
      subtitle: isLight ? 'Setup PC & Elección de Mandos' : 'Setup PC & Elección de Mandos',
      badge: isLight ? 'SETUP & MANDOS' : 'MANDOS & PC',
      position: { x: wizX, y: wizY, z: wizZ }
    },
    {
      key: 'cuadro_guerrero',
      type: isLight ? 'futbolista' : 'guerrero',
      title: isLight ? 'El Futbolista' : 'El Guerrero',
      subtitle: 'Cuadro Eliminatorio & Clasificación',
      badge: isLight ? 'CLASIFICACIÓN' : 'CUADRO',
      position: { x: warX, y: warY, z: warZ }
    },
    {
      key: 'gran_final',
      type: 'guardianes',
      title: 'Los Guardianes',
      subtitle: isLight ? 'La Gran Final & Estandarte de Honor' : 'La Gran Final & Estandarte Legendario',
      badge: 'GRAN FINAL',
      position: { x: guardX, y: guardY, z: guardZ }
    }
  ];
}

const _projVector = new THREE.Vector3();

export interface ProjectedNpcTag extends CharacterNpcData {
  screenX: number;
  screenY: number;
  opacity: number;
  visible: boolean;
}

export function projectNpcTags(
  npcs: CharacterNpcData[],
  camera: THREE.Camera,
  charY: number,
  width: number,
  height: number
): ProjectedNpcTag[] {
  return npcs.map(npc => {
    _projVector.set(npc.position.x, npc.position.y + 1.2, npc.position.z);
    _projVector.project(camera);

    const d = Math.abs(npc.position.y - charY);
    // Mostrar si el jugador está en la misma cota de altura (distancia vertical razonable)
    const op = _projVector.z > 1 ? 0 : Math.max(0, Math.min(1, 1 - (d - 14) / 10));

    const screenX = (_projVector.x * 0.5 + 0.5) * width;
    const screenY = (-_projVector.y * 0.5 + 0.5) * height;

    return {
      ...npc,
      screenX,
      screenY,
      opacity: op,
      visible: op > 0.05
    };
  });
}

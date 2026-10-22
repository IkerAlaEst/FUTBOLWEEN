export type ModalKey =
  | 'castillo'
  | 'torneo'
  | 'partido'
  | 'insti'
  | 'bracket'
  | 'jugadores'
  | 'directo'
  | 'perfil'
  | 'acta'
  | 'normas'
  | 'setup_mandos'
  | 'cuadro_guerrero'
  | 'gran_final'
  | 'acceso_rapido'
  | 'ubicaciones'
  | 'ubicacion_torneo'
  | 'ubicacion_final'
  | 'game';

export type CharacterNpcType = 'gamer' | 'mago' | 'guerrero' | 'guardianes' | 'medico' | 'futbolista';

export interface CharacterNpcData {
  key: ModalKey;
  type: CharacterNpcType;
  title: string;
  subtitle: string;
  badge: string;
  position: { x: number; y: number; z: number };
}

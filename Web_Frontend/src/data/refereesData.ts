export interface RefereeProfile {
  id: string;
  slot: number;
  gamertag: string;
  fullName: string;
  avatar: string;
  zona: 'Aula de informática' | 'Castillo';
  playerNumber?: number;
}

/**
 * Respaldo local de los 3 árbitros ficticios (los mismos que inserta
 * `continuar.sql`). El 4º árbitro es la cuenta que se registre.
 */
export const STATIC_REFEREES: RefereeProfile[] = [
  {
    id: '00000000-0000-4000-8000-000000000101',
    slot: 1,
    gamertag: 'Juez_Simarro',
    fullName: 'Andrés Simarro',
    avatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    zona: 'Aula de informática',
    playerNumber: 1
  },
  {
    id: '00000000-0000-4000-8000-000000000102',
    slot: 2,
    gamertag: 'Juez_Aula2',
    fullName: 'Lucía Ferrer',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    zona: 'Aula de informática',
    playerNumber: 2
  },
  {
    id: '00000000-0000-4000-8000-000000000103',
    slot: 3,
    gamertag: 'Juez_Castell',
    fullName: 'Pau Bellver',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    zona: 'Castillo',
    playerNumber: 3
  }
];

export const REFEREE_SLOTS = 4;

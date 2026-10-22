import React, { useEffect, useState, useMemo } from 'react';
import {
  getExtendedPlayers,
  ExtendedPlayer,
  ControllerType
} from '../../data/tournamentPlayersExtended';
import {
  BracketMatch,
  INITIAL_BRACKET_MATCHES
} from '../../data/tournamentBracketData';
import { getMergedBracket, getMergedPlayers } from '../../services/tournamentService';
import { PlayerCard } from '../players/PlayerCard';
import { PlayerDetailModal } from '../players/PlayerDetailModal';
import { useAuth } from '../../context/AuthContext';
import { navigateTo } from '../../hooks/useHashRoute';
import {
  Search,
  Gamepad2,
  Radio,
  ArrowUpDown,
  Users,
  Trophy,
  Skull
} from 'lucide-react';
import { CustomDropdown, DropdownOption } from '../players/CustomDropdown';
import '../../pages/players/players.css';

const controllerOptions: DropdownOption<'all' | ControllerType>[] = [
  { value: 'all', label: 'Todos los Mandos', icon: <Users size={14} /> },
  { value: 'ps5', label: 'PS5 DualSense', thumbImg: '/ps4_mando.png' },
  { value: 'xbox', label: 'Xbox Series X', thumbImg: '/xbox_mando.png' },
  { value: 'centro', label: 'Mando Simarro', thumbImg: '/pc_1.png' },
];

const statusOptions: DropdownOption<'all' | 'clasificado' | 'en_curso' | 'eliminado'>[] = [
  { value: 'all', label: 'Todos los Estados', icon: <Users size={14} /> },
  { value: 'en_curso', label: 'En Directo', icon: <Radio size={14} className="live-pulsing" /> },
  { value: 'clasificado', label: 'Clasificados', icon: <Trophy size={14} style={{ color: '#fbbf24' }} /> },
  { value: 'eliminado', label: 'Octavos', icon: <Skull size={14} style={{ color: '#f87171' }} /> },
];

const sortOptions: DropdownOption<'seed-asc' | 'seed-desc' | 'name-asc'>[] = [
  { value: 'seed-asc', label: 'Seed (#01 al #16)' },
  { value: 'seed-desc', label: 'Seed (#16 al #01)' },
  { value: 'name-asc', label: 'Nombre (A - Z)' },
];

export const PlayersModal: React.FC = () => {
  const { user } = useAuth();
  const [allPlayers, setAllPlayers] = useState<ExtendedPlayer[]>(() => getExtendedPlayers());
  const [matches, setMatches] = useState<BracketMatch[]>(INITIAL_BRACKET_MATCHES);
  const [selectedPlayer, setSelectedPlayer] = useState<ExtendedPlayer | null>(null);
  const [search, setSearch] = useState('');
  const [controllerFilter, setControllerFilter] = useState<'all' | ControllerType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'en_curso' | 'clasificado' | 'eliminado'>('all');
  const [sortOrder, setSortOrder] = useState<'seed-asc' | 'seed-desc' | 'name-asc'>('seed-asc');

  useEffect(() => {
    let alive = true;
    Promise.all([getMergedPlayers(), getMergedBracket()]).then(([players, bracket]) => {
      if (!alive) return;
      setAllPlayers(players);
      setMatches(bracket);
    });
    return () => {
      alive = false;
    };
  }, []);

  const filteredAndSorted = useMemo(() => {
    let result = allPlayers.filter(p => {
      const matchText =
        p.gamertag.toLowerCase().includes(search.toLowerCase()) ||
        p.fullName.toLowerCase().includes(search.toLowerCase()) ||
        p.club.name.toLowerCase().includes(search.toLowerCase());
      const matchCtrl = controllerFilter === 'all' || p.tipoMando === controllerFilter;
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchText && matchCtrl && matchStatus;
    });

    result = [...result].sort((a, b) => {
      if (sortOrder === 'seed-asc') return a.seed - b.seed;
      if (sortOrder === 'seed-desc') return b.seed - a.seed;
      if (sortOrder === 'name-asc') return a.gamertag.localeCompare(b.gamertag);
      return 0;
    });

    return result;
  }, [allPlayers, search, controllerFilter, statusFilter, sortOrder]);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>
            Jugadores Oficiales <span style={{ color: 'var(--neon-orange)' }}>({allPlayers.length}/16)</span>
          </h2>
          <span style={{ fontSize: '12px', opacity: 0.7 }}>
            Haz clic en cualquier tarjeta vertical para consultar sus horarios, rivales y estadísticas
          </span>
        </div>
        {!user && (
          <button
            type="button"
            className="btn-primary-neon"
            onClick={() => navigateTo('register')}
          >
            Inscribirme
          </button>
        )}
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        <div className="p-search-input-wrap">
          <Search size={16} className="p-search-icon" />
          <input
            type="text"
            placeholder="Buscar por jugador, gamertag o club..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="p-search-input"
          />
        </div>

        {/* Barra de 3 Desplegables Estilizados (Mando, Estado y Orden) */}
        <div className="p-dropdowns-bar">
          {/* 1. Desplegable Mando */}
          <CustomDropdown
            label="Mando"
            leadingIcon={<Gamepad2 size={16} />}
            value={controllerFilter}
            onChange={setControllerFilter}
            options={controllerOptions}
            activeFilter={controllerFilter !== 'all'}
          />

          {/* 2. Desplegable Estado */}
          <CustomDropdown
            label="Estado"
            leadingIcon={
              <Radio
                size={16}
                className={statusFilter === 'en_curso' ? 'live-pulsing' : ''}
              />
            }
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            activeFilter={statusFilter !== 'all'}
          />

          {/* 3. Desplegable Orden (Al lado de los dos) */}
          <CustomDropdown
            label="Ordenar por"
            leadingIcon={<ArrowUpDown size={16} />}
            value={sortOrder}
            onChange={setSortOrder}
            options={sortOptions}
            activeFilter={false}
          />
        </div>
      </div>

      {/* Grid de Tarjetas Verticales Ordenadas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: '14px',
          maxHeight: '62vh',
          overflowY: 'auto',
          paddingRight: '4px'
        }}
      >
        {filteredAndSorted.map(p => (
          <PlayerCard key={p.id} player={p} onSelect={setSelectedPlayer} />
        ))}
      </div>

      {/* Modal de Detalle de Jugador si está seleccionado */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          matches={matches}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
};

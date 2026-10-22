import React, { useEffect, useState, useMemo } from 'react';
import {
  ExtendedPlayer,
  ControllerType,
  getExtendedPlayers
} from '../../data/tournamentPlayersExtended';
import {
  BracketMatch,
  INITIAL_BRACKET_MATCHES
} from '../../data/tournamentBracketData';
import {
  getMergedBracket,
  getMergedPlayers,
  TOURNAMENT_SLOTS,
  EMPTY_SLOT_SEED
} from '../../services/tournamentService';
import { PlayerCard } from '../../components/players/PlayerCard';
import { PlayerDetailModal } from '../../components/players/PlayerDetailModal';
import { useTheme } from '../../context/ThemeContext';
import { navigateTo } from '../../hooks/useHashRoute';
import {
  Search,
  Trophy,
  Users,
  Radio,
  Skull,
  Clock,
  ArrowUpDown,
  Gamepad2,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { CustomDropdown, DropdownOption } from '../../components/players/CustomDropdown';
import './players.css';

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

export const PlayersPage: React.FC = () => {
  const { isLight } = useTheme();
  const [allPlayers, setAllPlayers] = useState<ExtendedPlayer[]>(() => getExtendedPlayers());
  const [matches, setMatches] = useState<BracketMatch[]>(INITIAL_BRACKET_MATCHES);
  const [selectedPlayer, setSelectedPlayer] = useState<ExtendedPlayer | null>(null);
  const [search, setSearch] = useState('');
  const [controllerFilter, setControllerFilter] = useState<'all' | ControllerType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'clasificado' | 'en_curso' | 'eliminado'>('all');
  const [sortOrder, setSortOrder] = useState<'seed-asc' | 'seed-desc' | 'name-asc'>('seed-asc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    Promise.all([getMergedPlayers(), getMergedBracket()])
      .then(([players, bracket]) => {
        if (!alive) return;
        setAllPlayers(players);
        setMatches(bracket);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const filteredAndSortedPlayers = useMemo(() => {
    const list = allPlayers.filter(p => {
      const matchesSearch =
        p.gamertag.toLowerCase().includes(search.toLowerCase()) ||
        p.fullName.toLowerCase().includes(search.toLowerCase()) ||
        p.club.name.toLowerCase().includes(search.toLowerCase());

      const matchesController = controllerFilter === 'all' || p.tipoMando === controllerFilter;
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

      return matchesSearch && matchesController && matchesStatus;
    });

    return list.sort((a, b) => {
      if (sortOrder === 'seed-asc') return a.seed - b.seed;
      if (sortOrder === 'seed-desc') return b.seed - a.seed;
      if (sortOrder === 'name-asc') return a.gamertag.localeCompare(b.gamertag);
      return 0;
    });
  }, [allPlayers, search, controllerFilter, statusFilter, sortOrder]);

  const hasEmptySlot = allPlayers.length < TOURNAMENT_SLOTS;

  return (
    <div className={`players-screen ${isLight ? 'light-mode' : 'dark-mode'}`}>
      <div className="players-container">
        {/* Cabecera Principal */}
        <header className="players-header">
          <div className="p-header-top-pill">
            <Trophy size={13} style={{ color: '#fbbf24' }} />
            <span>Torneo Oficial · IES Dr. Lluís Simarro & Castell de Xàtiva</span>
          </div>
          <h1 className="players-main-title">
            Los {allPlayers.length} Jugadores Clasificados
          </h1>
          <p className="players-subtitle">
            {loading
              ? 'Cargando inscripciones desde la base de datos…'
              : hasEmptySlot
                ? `Queda 1 plaza libre (seed #${EMPTY_SLOT_SEED}) reservada al próximo jugador que se registre.`
                : 'Cuadro completo: los 16 jugadores ya tienen su plaza en el torneo.'}
          </p>
        </header>

        {/* Barra de Búsqueda y Filtros */}
        <section className="players-toolbar" aria-label="Búsqueda y filtros">
          <div className="p-search-input-wrap">
            <Search size={16} className="p-search-icon" />
            <input
              type="text"
              placeholder="Buscar por gamertag, nombre o club de fútbol..."
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
        </section>

        {/* Grid de Tarjetas Verticales Ordenadas (15 jugadores + hueco libre) */}
        <main className="players-grid">
          {filteredAndSortedPlayers.length === 0 && !hasEmptySlot ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', opacity: 0.6 }}>
              <p>No se han encontrado jugadores con los filtros seleccionados.</p>
            </div>
          ) : (
            <>
              {filteredAndSortedPlayers.map(player => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onSelect={setSelectedPlayer}
                />
              ))}

              {/* Hueco libre: seed 11, reservado al usuario que se registre */}
              {hasEmptySlot && search.trim() === '' && (
                <button
                  type="button"
                  className={`player-v-card programado ${isLight ? 'light-card' : 'dark-card'}`}
                  onClick={() => navigateTo('register')}
                  style={{
                    borderStyle: 'dashed',
                    cursor: 'pointer',
                    textAlign: 'left',
                    font: 'inherit',
                    color: 'inherit'
                  }}
                  title="Inscribirte y ocupar la plaza libre"
                >
                  <div className="p-card-top-bar">
                    <span className="p-seed-badge">
                      <b>SEED #{String(EMPTY_SLOT_SEED).padStart(2, '0')}</b>
                    </span>
                    <span className="p-status-chip is-pending">
                      <Clock size={11} />
                      <span>PLAZA LIBRE</span>
                    </span>
                  </div>

                  <div className="p-avatar-wrapper">
                    <div className="p-avatar-halo" style={{ borderColor: '#ff5e00' }} />
                    <div
                      className="p-avatar-circle"
                      style={{
                        display: 'grid',
                        placeItems: 'center',
                        background: 'linear-gradient(135deg, rgba(255,94,0,.25) 0%, #0d0614 100%)',
                        color: '#ff8a1f'
                      }}
                    >
                      <UserPlus size={40} />
                    </div>
                  </div>

                  <div className="p-identity-section">
                    <h3 className="p-gamertag-title">Tu gamertag</h3>
                    <span className="p-fullname-subtitle">Reservada al 16º jugador</span>
                  </div>

                  <div className="p-duo-horizontal-bar">
                    <div className="p-duo-slot shield-slot" style={{ opacity: 0.45 }}>
                      <Trophy size={44} />
                    </div>
                    <div className="p-duo-mini-divider" />
                    <div className="p-duo-slot mando-slot" style={{ opacity: 0.45 }}>
                      <Gamepad2 size={44} />
                    </div>
                  </div>

                  <div className="p-card-footer-cta">
                    <span>Inscribirme ahora</span>
                    <ChevronRight size={13} className="p-arrow-cta" />
                  </div>
                </button>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modal de Detalle al pulsar un jugador */}
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

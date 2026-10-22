import React, { useEffect, useMemo, useState } from 'react';
import { RefereeProfile, REFEREE_SLOTS, STATIC_REFEREES } from '../../data/refereesData';
import { BracketMatch, INITIAL_BRACKET_MATCHES } from '../../data/tournamentBracketData';
import { getMergedBracket } from '../../services/tournamentService';
import { refereeService } from '../../services/refereeService';
import { RefereeCard } from '../../components/referees/RefereeCard';
import { RefereeDetailModal } from '../../components/referees/RefereeDetailModal';
import { useTheme } from '../../context/ThemeContext';
import { navigateTo } from '../../hooks/useHashRoute';
import {
  Scale,
  Search,
  ShieldCheck,
  UserPlus,
  ChevronRight,
  MapPin,
  Users,
  Trophy,
  Clock,
  ArrowUpDown
} from 'lucide-react';
import { CustomDropdown, DropdownOption } from '../../components/players/CustomDropdown';
import '../players/players.css';

const zonaOptions: DropdownOption<'all' | 'Aula de informática' | 'Castillo'>[] = [
  { value: 'all', label: 'Todas las Zonas', icon: <MapPin size={14} /> },
  { value: 'Aula de informática', label: 'Aula de informática', icon: <MapPin size={14} style={{ color: '#0284c7' }} /> },
  { value: 'Castillo', label: 'Castillo de Xàtiva', icon: <MapPin size={14} style={{ color: '#ff8a1f' }} /> }
];

const statusOptions: DropdownOption<'all' | 'con_partidos' | 'sin_partidos'>[] = [
  { value: 'all', label: 'Todos los Árbitros', icon: <Users size={14} /> },
  { value: 'con_partidos', label: 'Con Partidos', icon: <Trophy size={14} style={{ color: '#fbbf24' }} /> },
  { value: 'sin_partidos', label: 'Por Asignar', icon: <Clock size={14} style={{ color: '#b69cff' }} /> }
];

const sortOptions: DropdownOption<'slot-asc' | 'slot-desc' | 'name-asc'>[] = [
  { value: 'slot-asc', label: 'Plaza (#01 al #04)' },
  { value: 'slot-desc', label: 'Plaza (#04 al #01)' },
  { value: 'name-asc', label: 'Nombre (A - Z)' }
];

export const RefereesPage: React.FC = () => {
  const { isLight } = useTheme();
  const [referees, setReferees] = useState<RefereeProfile[]>(STATIC_REFEREES);
  const [matches, setMatches] = useState<BracketMatch[]>(INITIAL_BRACKET_MATCHES);
  const [search, setSearch] = useState('');
  const [zonaFilter, setZonaFilter] = useState<'all' | 'Aula de informática' | 'Castillo'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'con_partidos' | 'sin_partidos'>('all');
  const [sortOrder, setSortOrder] = useState<'slot-asc' | 'slot-desc' | 'name-asc'>('slot-asc');
  const [selected, setSelected] = useState<RefereeProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    Promise.all([refereeService.getReferees(), getMergedBracket()])
      .then(([loadedReferees, bracket]) => {
        if (!alive) return;
        setReferees(loadedReferees);
        setMatches(bracket);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const assignedCount = (referee: RefereeProfile) =>
    matches.filter(
      match => match.referee === referee.fullName || match.referee === referee.gamertag
    ).length;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = referees.filter(referee => {
      const matchesSearch =
        !term ||
        referee.gamertag.toLowerCase().includes(term) ||
        referee.fullName.toLowerCase().includes(term) ||
        referee.zona.toLowerCase().includes(term);

      const matchesZona = zonaFilter === 'all' || referee.zona === zonaFilter;
      const count = assignedCount(referee);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'con_partidos' ? count > 0 : count === 0);

      return matchesSearch && matchesZona && matchesStatus;
    });

    return list.sort((a, b) => {
      if (sortOrder === 'slot-asc') return a.slot - b.slot;
      if (sortOrder === 'slot-desc') return b.slot - a.slot;
      if (sortOrder === 'name-asc') return a.fullName.localeCompare(b.fullName);
      return 0;
    });
  }, [referees, search, zonaFilter, statusFilter, sortOrder, matches]);

  const hasEmptySlot = referees.length < REFEREE_SLOTS;

  return (
    <div className={`players-screen ${isLight ? 'light-mode' : 'dark-mode'}`}>
      <div className="players-container">
        <header className="players-header">
          <div className="p-header-top-pill">
            <ShieldCheck size={13} style={{ color: '#b69cff' }} />
            <span>Cuerpo Oficial de Árbitros · IES Dr. Lluís Simarro & Castell de Xàtiva</span>
          </div>
          <h1 className="players-main-title">
            Los {referees.length} Árbitros Oficiales
          </h1>
          <p className="players-subtitle">
            {loading
              ? 'Cargando árbitros desde la base de datos…'
              : hasEmptySlot
                ? `Queda 1 plaza de árbitro libre. El árbitro que se registre recibirá los partidos sin asignar.`
                : 'Los 4 árbitros del torneo ya están registrados.'}
          </p>
        </header>

        <section className="players-toolbar" aria-label="Búsqueda de árbitros">
          <div className="p-search-input-wrap">
            <Search size={16} className="p-search-icon" />
            <input
              type="text"
              placeholder="Buscar por gamertag, nombre o zona..."
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="p-search-input"
            />
          </div>

          <div className="p-dropdowns-bar">
            <CustomDropdown
              label="Zona"
              leadingIcon={<MapPin size={16} />}
              value={zonaFilter}
              onChange={setZonaFilter}
              options={zonaOptions}
              activeFilter={zonaFilter !== 'all'}
            />

            <CustomDropdown
              label="Partidos"
              leadingIcon={<Scale size={16} />}
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              activeFilter={statusFilter !== 'all'}
            />

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

        <main className="players-grid">
          {filtered.map(referee => (
            <RefereeCard
              key={referee.id}
              referee={referee}
              assignedCount={assignedCount(referee)}
              onSelect={setSelected}
            />
          ))}

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
              title="Registrarte como 4º árbitro"
            >
              <div className="p-card-top-bar">
                <span className="p-seed-badge">
                  <b>ÁRBITRO #0{REFEREE_SLOTS}</b>
                </span>
                <span className="p-status-chip is-pending">
                  <Scale size={11} />
                  <span>PLAZA LIBRE</span>
                </span>
              </div>

              <div className="p-avatar-wrapper">
                <div className="p-avatar-halo" style={{ borderColor: '#b69cff' }} />
                <div
                  className="p-avatar-circle"
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    background: 'linear-gradient(135deg, rgba(182,156,255,.28) 0%, #0d0614 100%)',
                    color: '#c4b5fd'
                  }}
                >
                  <UserPlus size={40} />
                </div>
              </div>

              <div className="p-identity-section">
                <h3 className="p-gamertag-title">Tu cuenta de árbitro</h3>
                <span className="p-fullname-subtitle">Sin PIN. Solo nombre y foto.</span>
              </div>

              <div className="p-duo-horizontal-bar">
                <div className="p-duo-slot shield-slot" style={{ opacity: 0.45 }}>
                  <Scale size={48} />
                </div>
                <div className="p-duo-mini-divider" />
                <div className="p-duo-slot mando-slot" style={{ opacity: 0.45 }}>
                  <MapPin size={44} />
                </div>
              </div>

              <div className="p-card-footer-cta">
                <span>Registrarme como árbitro</span>
                <ChevronRight size={13} className="p-arrow-cta" />
              </div>
            </button>
          )}
        </main>
      </div>

      {selected && (
        <RefereeDetailModal
          referee={selected}
          matches={matches}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
};

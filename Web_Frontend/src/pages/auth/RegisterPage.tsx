import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  AtSign,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Gamepad2,
  Ghost,
  Home,
  KeyRound,
  Lock,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Moon,
  PartyPopper,
  RefreshCw,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
  Sun,
  Trophy,
  User,
  UserRound,
  Users,
  WifiOff
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { authService } from '../../services/authService';
import { ControllerType, UserProfile } from '../../types/user';
import { navigateTo } from '../../hooks/useHashRoute';

/* ════════════════════════════════════════════════════════════════
   1 · DATOS DE LIGAS Y EQUIPOS (TheSportsDB + respaldo local)
   ════════════════════════════════════════════════════════════════ */

const SPORTSDB_KEY = import.meta.env.VITE_SPORTSDB_KEY || '123';
const SPORTSDB_BASE = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}`;
const CACHE_TTL_MS = 30 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 9000;

interface LeagueOption {
  id: string;
  apiName: string;
  name: string;
  country: string;
}

interface TeamOption {
  id: string;
  name: string;
  shortName: string;
  badge?: string;
  stadium?: string;
  league: string;
  color: string;
  color2: string;
  description?: string;
}

const LEAGUES: LeagueOption[] = [
  { id: '4335', apiName: 'Spanish La Liga', name: 'LaLiga EA Sports', country: 'España' },
  { id: '4328', apiName: 'English Premier League', name: 'Premier League', country: 'Inglaterra' },
  { id: '4332', apiName: 'Italian Serie A', name: 'Serie A', country: 'Italia' },
  { id: '4331', apiName: 'German Bundesliga', name: 'Bundesliga', country: 'Alemania' },
  { id: '4334', apiName: 'French Ligue 1', name: 'Ligue 1', country: 'Francia' },
  { id: '4344', apiName: 'Portuguese Primeira Liga', name: 'Primeira Liga', country: 'Portugal' }
];

const FALLBACK_RAW: Record<string, Array<[string, string, string]>> = {
  '4335': [
    ['Real Madrid', 'RMA', '#febe10'],
    ['FC Barcelona', 'BAR', '#a50044'],
    ['Atlético de Madrid', 'ATM', '#cb3524'],
    ['Valencia CF', 'VAL', '#f18e00'],
    ['Sevilla FC', 'SEV', '#d81920'],
    ['Real Betis', 'BET', '#0bb363'],
    ['Villarreal CF', 'VIL', '#ffe667'],
    ['Athletic Club', 'ATH', '#ee2523']
  ],
  '4328': [
    ['Arsenal', 'ARS', '#ef0107'],
    ['Manchester City', 'MCI', '#6cabdd'],
    ['Liverpool', 'LIV', '#c8102e'],
    ['Manchester United', 'MUN', '#da291c'],
    ['Chelsea', 'CHE', '#034694'],
    ['Tottenham Hotspur', 'TOT', '#132257'],
    ['Newcastle United', 'NEW', '#241f20'],
    ['Aston Villa', 'AVL', '#95bfe5']
  ],
  '4332': [
    ['AC Milan', 'MIL', '#fb090b'],
    ['Inter Milan', 'INT', '#0068a8'],
    ['Juventus', 'JUV', '#000000'],
    ['Napoli', 'NAP', '#12a0d7'],
    ['AS Roma', 'ROM', '#8e1f2f'],
    ['Lazio', 'LAZ', '#87d8f7'],
    ['Atalanta', 'ATA', '#1e71b8'],
    ['Fiorentina', 'FIO', '#6a2c91']
  ],
  '4331': [
    ['Bayern Munich', 'FCB', '#dc052d'],
    ['Borussia Dortmund', 'BVB', '#fde100'],
    ['RB Leipzig', 'RBL', '#dd0741'],
    ['Bayer Leverkusen', 'B04', '#e32221'],
    ['Eintracht Frankfurt', 'SGE', '#e1000f'],
    ['VfB Stuttgart', 'VFB', '#e32219'],
    ['Werder Bremen', 'SVW', '#1d9053'],
    ['VfL Wolfsburg', 'WOB', '#65b32e']
  ],
  '4334': [
    ['Paris Saint-Germain', 'PSG', '#004170'],
    ['Olympique de Marseille', 'OM', '#2faee0'],
    ['Olympique Lyonnais', 'OL', '#1f4e9b'],
    ['AS Monaco', 'ASM', '#e51b22'],
    ['LOSC Lille', 'LIL', '#e01e13'],
    ['OGC Nice', 'NIC', '#c8102e'],
    ['Stade Rennais', 'REN', '#e13238'],
    ['RC Lens', 'RCL', '#ffe500']
  ],
  '4344': [
    ['SL Benfica', 'BEN', '#e00000'],
    ['FC Porto', 'POR', '#00428c'],
    ['Sporting CP', 'SCP', '#008057'],
    ['SC Braga', 'BRA', '#c4002f'],
    ['Vitória SC', 'VSC', '#ffffff'],
    ['Boavista', 'BOA', '#111111']
  ]
};

function buildFallback(league: LeagueOption): TeamOption[] {
  const rows = FALLBACK_RAW[league.id] ?? FALLBACK_RAW['4335'];
  return rows.map(([name, shortName, color]) => ({
    id: `local-${league.id}-${shortName}`,
    name,
    shortName,
    league: league.apiName,
    color,
    color2: '#ffffff'
  }));
}

interface CacheEntry {
  teams: TeamOption[];
  at: number;
}
const teamsCache = new Map<string, CacheEntry>();

function normalizeColor(raw?: string | null): string {
  if (!raw) return '#ff5e00';
  const value = raw.trim();
  if (!value) return '#ff5e00';
  return value.startsWith('#') ? value : `#${value}`;
}

function initials(name: string): string {
  return name
    .replace(/[^a-zA-ZÀ-ÿ0-9 ]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}

function mapTeam(raw: Record<string, unknown>): TeamOption {
  const name = String(raw.strTeam ?? 'Equipo');
  const badge = (raw.strTeamBadge || raw.strBadge || raw.strLogo || raw.strBanner || undefined) as string | undefined;
  return {
    id: String(raw.idTeam ?? name),
    name,
    shortName: String(raw.strTeamShort || initials(name)).toUpperCase().slice(0, 4),
    badge,
    stadium: (raw.strStadium as string) || undefined,
    league: String(raw.strLeague ?? ''),
    color: normalizeColor((raw.strColour1 as string) || undefined),
    color2: normalizeColor((raw.strColour2 as string) || undefined),
    description: raw.strDescriptionEN ? String(raw.strDescriptionEN).split('\n')[0].slice(0, 150) : undefined
  };
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`TheSportsDB ${response.status}`);
    const text = await response.text();
    if (!text.trim().startsWith('{')) throw new Error('Respuesta no JSON (rate limit)');
    return JSON.parse(text);
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchTeamsByLeague(
  league: LeagueOption,
  force = false
): Promise<{ teams: TeamOption[]; source: 'api' | 'fallback' }> {
  const cached = teamsCache.get(league.id);
  if (!force && cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return { teams: cached.teams, source: 'api' };
  }

  try {
    const data = (await fetchJson(
      `${SPORTSDB_BASE}/search_all_teams.php?l=${encodeURIComponent(league.apiName)}`
    )) as { teams?: Record<string, unknown>[] | null };

    const teams = (data.teams ?? [])
      .filter(team => !team.strSport || String(team.strSport).toLowerCase() === 'soccer')
      .map(mapTeam)
      .filter(team => team.name && team.name !== 'null')
      .sort((a, b) => a.name.localeCompare(b.name));

    if (!teams.length) throw new Error('Sin equipos para esta liga');

    const unique = Array.from(new Map(teams.map(team => [team.name, team])).values());
    teamsCache.set(league.id, { teams: unique, at: Date.now() });
    return { teams: unique, source: 'api' };
  } catch {
    // El respaldo no se cachea: así "Reintentar" vuelve a consultar la API.
    return { teams: buildFallback(league), source: 'fallback' };
  }
}

/* Utilidades de color para las tarjetas de equipo */
function hexToRgb(hex: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const n = parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function luminance(rgb: [number, number, number]): number {
  return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
}
/** Color del equipo en formato "r,g,b"; si es demasiado oscuro usamos el naranja del torneo. */
function teamTone(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb || luminance(rgb) < 0.3) return '255,138,31';
  return rgb.join(',');
}
function inkOn(hex: string): string {
  const rgb = hexToRgb(hex);
  return rgb && luminance(rgb) > 0.6 ? '#1a0a00' : '#ffffff';
}

/* ════════════════════════════════════════════════════════════════
   2 · TIPOS Y CONSTANTES DEL REGISTRO
   ════════════════════════════════════════════════════════════════ */

type Role = 'jugador' | 'arbitro' | 'usuario';
type Phase = 1 | 2 | 3 | 4 | 5;
type Zona = 'Aula de informática' | 'Castillo';
type FieldStatus = 'idle' | 'ok' | 'bad';

interface StepDef {
  phase: Phase;
  label: string;
  icon: LucideIcon;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MANDOS: Array<{ id: ControllerType; name: string; sub: string; label: string; image: string }> = [
  { id: 'ps5', name: 'PlayStation', sub: 'PS5 · PS4', label: 'PlayStation PS5 / PS4', image: '/ps4_mando.png' },
  { id: 'xbox', name: 'Xbox', sub: 'Series · One', label: 'Xbox Series / One', image: '/xbox_mando.png' },
  { id: 'centro', name: 'Del centro', sub: 'Mando del instituto', label: 'Mando del centro', image: '/pc_1.png' }
];
type Mando = (typeof MANDOS)[number];

const ROLES: Array<{ id: Role; title: string; desc: string; icon: LucideIcon; tone: string }> = [
  { id: 'jugador', title: 'Jugador', desc: 'Compite por el título', icon: Gamepad2, tone: '#ff9a2e' },
  { id: 'arbitro', title: 'Árbitro', desc: 'Dirige los partidos', icon: Scale, tone: '#b69cff' },
  { id: 'usuario', title: 'Aficionado', desc: 'Vive el torneo en la grada', icon: Sparkles, tone: '#ff8fc3' }
];

const ZONAS: Array<{ id: Zona; desc: string; icon: LucideIcon; tone: string }> = [
  { id: 'Aula de informática', desc: 'Rondas previas', icon: MapPin, tone: '#ff9a2e' },
  { id: 'Castillo', desc: 'Gran final', icon: Trophy, tone: '#b69cff' }
];

/* ════════════════════════════════════════════════════════════════
   3 · PERSONAJE (Calabaza saludando)
   ════════════════════════════════════════════════════════════════ */

const Calabaza: React.FC = () => (
  <svg className="rg-pumpkin" viewBox="-14 0 228 218" role="img" aria-label="Calabaza saludando">
    <ellipse cx="100" cy="206" rx="54" ry="8" fill="rgba(0,0,0,.32)" />
    <g className="rg-pk-body">
      {/* pies */}
      <ellipse cx="72" cy="194" rx="18" ry="10" fill="#d9560a" />
      <ellipse cx="128" cy="194" rx="18" ry="10" fill="#d9560a" />

      {/* brazo izquierdo */}
      <path d="M24 130 C6 142 6 160 12 170" fill="none" stroke="#ec6a0c" strokeWidth="13" strokeLinecap="round" />
      <circle cx="12" cy="172" r="9" fill="#ffa23a" />

      {/* cuerpo */}
      <ellipse cx="52" cy="122" rx="40" ry="66" fill="#f2700f" />
      <ellipse cx="148" cy="122" rx="40" ry="66" fill="#f2700f" />
      <ellipse cx="100" cy="122" rx="46" ry="70" fill="#ffa23a" />
      <path d="M74 60 C58 100 58 146 74 184" fill="none" stroke="#d9560a" strokeWidth="3" strokeLinecap="round" opacity=".5" />
      <path d="M126 60 C142 100 142 146 126 184" fill="none" stroke="#d9560a" strokeWidth="3" strokeLinecap="round" opacity=".5" />
      <ellipse cx="78" cy="88" rx="12" ry="24" fill="rgba(255,255,255,.3)" transform="rotate(18 78 88)" />

      {/* tallo y hoja */}
      <path d="M90 58 C90 44 98 32 112 26 L121 36 C114 42 112 48 112 60 Z" fill="#6f9a2a" />
      <path d="M114 40 C132 24 154 30 156 44 C140 52 124 50 114 40Z" fill="#52c46b" />
      <path d="M118 40 C130 36 142 38 150 42" fill="none" stroke="#2f9150" strokeWidth="2" strokeLinecap="round" />

      {/* cara */}
      <g transform="translate(100 98)">
        <g className="rg-pk-eyes">
          <g transform="translate(-100 -98)">
            <polygon points="66,106 94,106 80,80" fill="#ffe27a" stroke="#3b0a5c" strokeWidth="5" strokeLinejoin="round" />
            <polygon points="106,106 134,106 120,80" fill="#ffe27a" stroke="#3b0a5c" strokeWidth="5" strokeLinejoin="round" />
            <circle cx="80" cy="99" r="4.5" fill="#3b0a5c" />
            <circle cx="120" cy="99" r="4.5" fill="#3b0a5c" />
          </g>
        </g>
      </g>
      <path d="M100 114 L93 126 L107 126 Z" fill="#3b0a5c" stroke="#3b0a5c" strokeWidth="3" strokeLinejoin="round" />
      <path d="M64 136 Q100 176 136 136 Q100 150 64 136 Z" fill="#3b0a5c" stroke="#3b0a5c" strokeWidth="3" strokeLinejoin="round" />
      <path d="M84 143 L94 145 L89 152 Z M106 145 L116 143 L111 152 Z" fill="#ffe27a" />
      <circle cx="54" cy="130" r="9" fill="rgba(255,100,140,.45)" />
      <circle cx="146" cy="130" r="9" fill="rgba(255,100,140,.45)" />

      {/* brazo derecho saludando */}
      <g transform="translate(176 128)">
        <g className="rg-pk-wave">
          <g transform="translate(-176 -128)">
            <path d="M174 128 C198 122 208 100 202 80" fill="none" stroke="#ec6a0c" strokeWidth="13" strokeLinecap="round" />
            <path d="M195 68 L192 59 M202 65 L202 55 M209 68 L212 59" fill="none" stroke="#ffa23a" strokeWidth="5" strokeLinecap="round" />
            <circle cx="202" cy="75" r="11" fill="#ffa23a" />
          </g>
        </g>
      </g>
    </g>
  </svg>
);

/* ════════════════════════════════════════════════════════════════
   4 · COMPONENTES PEQUEÑOS
   ════════════════════════════════════════════════════════════════ */

interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> {
  id: string;
  label: string;
  icon: LucideIcon;
  status?: FieldStatus;
  message?: string;
  right?: React.ReactNode;
}

const TextField: React.FC<TextFieldProps> = ({ id, label, icon: Icon, status = 'idle', message, right, ...input }) => (
  <div className={`rg-field ${status === 'bad' ? 'is-bad' : status === 'ok' ? 'is-ok' : ''}`}>
    <label className="rg-label" htmlFor={id}>
      {label}
    </label>
    <div className="rg-input-wrap">
      <Icon size={17} className="rg-input-icon" />
      <input id={id} className="rg-input" {...input} />
      <span className="rg-input-end">
        {right}
        {!right && status === 'ok' && <Check size={17} />}
        {!right && status === 'bad' && <AlertCircle size={17} />}
      </span>
    </div>
    <span className="rg-msg" role={status === 'bad' ? 'alert' : undefined}>
      {status === 'bad' ? message : ''}
    </span>
  </div>
);

interface OptionCardProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  tone: string;
  selected: boolean;
  onClick: () => void;
}

const OptionCard: React.FC<OptionCardProps> = ({ icon: Icon, title, desc, tone, selected, onClick }) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    className={`rg-option ${selected ? 'is-selected' : ''}`}
    style={{ '--tone': tone } as React.CSSProperties}
    onClick={onClick}
  >
    <span className="rg-option-icon">
      <Icon size={24} />
    </span>
    <span className="rg-option-text">
      <strong>{title}</strong>
      <small>{desc}</small>
    </span>
    <span className="rg-option-check">
      <Check size={14} />
    </span>
  </button>
);

const MandoCard: React.FC<{ mando: Mando; selected: boolean; onClick: () => void }> = ({ mando, selected, onClick }) => {
  const [broken, setBroken] = useState(false);
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={mando.label}
      className={`rg-option rg-mando ${selected ? 'is-selected' : ''}`}
      onClick={onClick}
    >
      <span className="rg-mando-stage">
        {broken ? (
          <Gamepad2 size={42} />
        ) : (
          <img src={mando.image} alt="" draggable={false} onError={() => setBroken(true)} />
        )}
      </span>
      <span className="rg-mando-name">{mando.name}</span>
      <span className="rg-mando-sub">{mando.sub}</span>
      <span className="rg-option-check">
        <Check size={14} />
      </span>
    </button>
  );
};

const TeamBadge: React.FC<{ team: TeamOption }> = ({ team }) => {
  const [broken, setBroken] = useState(false);
  if (team.badge && !broken) {
    return (
      <img
        className="rg-tbadge"
        src={team.badge}
        alt={team.name}
        loading="lazy"
        draggable={false}
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <span className="rg-tbadge rg-tbadge--initials" style={{ background: team.color, color: inkOn(team.color) }}>
      <b>{team.shortName}</b>
    </span>
  );
};

/* ════════════════════════════════════════════════════════════════
   5 · SELECTOR DE LIGA Y EQUIPO
   ════════════════════════════════════════════════════════════════ */

interface TeamCarouselProps {
  leagueId: string;
  onLeagueChange: (id: string) => void;
  selected: TeamOption | null;
  onSelect: (team: TeamOption | null) => void;
}

const TeamCarousel: React.FC<TeamCarouselProps> = ({ leagueId, onLeagueChange, selected, onSelect }) => {
  const league = useMemo<LeagueOption>(() => LEAGUES.find(item => item.id === leagueId) ?? LEAGUES[0], [leagueId]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [source, setSource] = useState<'api' | 'fallback'>('api');
  const [idx, setIdx] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const forceRef = useRef(false);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const startX = useRef<number | null>(null);
  const swiped = useRef(false);

  useEffect(() => {
    let alive = true;
    const force = forceRef.current;
    forceRef.current = false;
    setStatus('loading');

    fetchTeamsByLeague(league, force)
      .then(result => {
        if (!alive) return;
        setSource(result.source);
        if (result.teams.length === 0) {
          setTeams([]);
          setStatus('error');
          return;
        }
        const current = selectedRef.current;
        const found = current ? result.teams.findIndex(item => item.id === current.id) : -1;
        setTeams(result.teams);
        setIdx(found >= 0 ? found : 0);
        setStatus('ready');
      })
      .catch(() => {
        if (!alive) return;
        setTeams([]);
        setStatus('error');
      });

    return () => {
      alive = false;
    };
  }, [league, reloadKey]);

  const n = teams.length;
  const current = status === 'ready' ? teams[idx] : undefined;
  const isSelected = Boolean(current && selected && selected.id === current.id);

  const go = (dir: number) => {
    if (n > 1) setIdx(value => (value + dir + n) % n);
  };

  const toggle = () => {
    if (!current) return;
    onSelect(isSelected ? null : current);
  };

  const reload = () => {
    forceRef.current = true;
    setReloadKey(value => value + 1);
  };

  const handleKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
    }
  };

  return (
    <>
      <div className="rg-league-dropdown-wrap">
        <label htmlFor="rg-league-select" className="rg-league-dropdown-label">
          <Trophy size={15} /> Competición:
        </label>
        <div className="rg-league-select-wrapper">
          <select
            id="rg-league-select"
            className="rg-league-select"
            value={leagueId}
            onChange={e => onLeagueChange(e.target.value)}
          >
            {LEAGUES.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.country})
              </option>
            ))}
          </select>
          <ChevronDown size={18} className="rg-league-select-icon" />
        </div>
      </div>

      <div
        className={`rg-stage rg-stage--single ${isSelected ? 'is-team-selected' : ''}`}
        tabIndex={0}
        role="region"
        aria-label={`Equipo: ${current?.name ?? 'Cargando'}`}
        onKeyDown={handleKey}
        onPointerDown={event => {
          startX.current = event.clientX;
          swiped.current = false;
        }}
        onPointerUp={event => {
          if (startX.current === null) return;
          const dx = event.clientX - startX.current;
          startX.current = null;
          if (Math.abs(dx) > 35) {
            swiped.current = true;
            go(dx < 0 ? 1 : -1);
          }
        }}
        onPointerCancel={() => {
          startX.current = null;
        }}
      >
        {status === 'loading' && (
          <div className="rg-single-card rg-skel" />
        )}

        {status === 'error' && (
          <div className="rg-stage-msg">
            <AlertCircle size={28} />
            <span>No hay equipos disponibles en esta liga.</span>
            <button type="button" className="rg-btn rg-btn--ghost rg-btn--sm" onClick={reload}>
              <RefreshCw size={15} /> Reintentar
            </button>
          </div>
        )}

        {status === 'ready' && current && (
          <button
            key={current.id}
            type="button"
            className={`rg-single-card ${isSelected ? 'is-picked' : ''}`}
            style={{
              '--tc': teamTone(current.color)
            } as React.CSSProperties}
            onClick={() => {
              if (swiped.current) {
                swiped.current = false;
                return;
              }
              toggle();
            }}
            aria-label={`${current.name}${isSelected ? ' (Seleccionado)' : ''}`}
          >
            {isSelected && (
              <span className="rg-tcheck-pill">
                <Check size={12} /> Elegido
              </span>
            )}
            <div className="rg-single-badge-wrap">
              <TeamBadge team={current} />
            </div>
            <span className="rg-single-name">{current.name}</span>
          </button>
        )}

        {status === 'ready' && n > 1 && (
          <>
            <button
              type="button"
              className="rg-arrow rg-arrow--l"
              aria-label="Equipo anterior"
              onClick={(e) => { e.stopPropagation(); go(-1); }}
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              className="rg-arrow rg-arrow--r"
              aria-label="Equipo siguiente"
              onClick={(e) => { e.stopPropagation(); go(1); }}
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      <p className="rg-caption">
        {current && (
          <>
            <MapPin size={14} /> {current.stadium ? `${current.stadium} · ` : ''}
            {league.country}
          </>
        )}
      </p>

      <div className="rg-pickrow">
        <span className="rg-counter" aria-live="polite">
          {status === 'ready' ? (
            <>
              {String(idx + 1).padStart(2, '0')}
              <i>/</i>
              {String(n).padStart(2, '0')}
            </>
          ) : (
            '--'
          )}
        </span>
        <button type="button" className={`rg-pick ${isSelected ? 'is-on' : ''}`} disabled={!current} onClick={toggle}>
          {isSelected ? (
            <>
              <Check size={17} /> Equipo elegido
            </>
          ) : (
            <>
              <Shield size={17} /> Elegir equipo
            </>
          )}
        </button>
        <button
          type="button"
          className={`rg-iconbtn ${source === 'fallback' ? 'is-warn' : ''}`}
          onClick={reload}
          aria-label="Recargar equipos"
          title={
            source === 'fallback'
              ? 'TheSportsDB no responde: equipos de respaldo. Pulsa para reintentar.'
              : 'Recargar equipos'
          }
        >
          {source === 'fallback' ? <WifiOff size={16} /> : <RefreshCw size={16} />}
        </button>
      </div>
    </>
  );
};

/** Botón de modo oscuro / claro: interruptor con luna y sol. */
const ThemeToggle: React.FC<{ theme: string; onToggle: () => void }> = ({ theme, onToggle }) => (
  <button
    type="button"
    className="rg-theme"
    role="switch"
    aria-checked={theme === 'dark'}
    aria-label="Modo oscuro"
    title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    onClick={onToggle}
  >
    <span className="rg-theme-thumb" aria-hidden="true" />
    <span className={`rg-theme-opt ${theme === 'dark' ? 'is-on' : ''}`}>
      <Moon size={16} />
    </span>
    <span className={`rg-theme-opt ${theme === 'light' ? 'is-on' : ''}`}>
      <Sun size={16} />
    </span>
  </button>
);

/* ════════════════════════════════════════════════════════════════
   6 · PÁGINA DE REGISTRO
   ════════════════════════════════════════════════════════════════ */

export const RegisterPage: React.FC = () => {
  const { user, logout, registerJugador, registerArbitro, registerUsuario } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [phase, setPhase] = useState<Phase>(1);
  const [role, setRole] = useState<Role | null>(null);

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [gamertag, setGamertag] = useState('');
  const [tipoMando, setTipoMando] = useState<ControllerType | null>(null);
  const [zona] = useState<Zona>('Aula de informática');
  const [bio, setBio] = useState('');

  const [leagueId, setLeagueId] = useState(LEAGUES[0].id);
  const [team, setTeam] = useState<TeamOption | null>(null);

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<UserProfile | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  // Foto de perfil
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  // Disponibilidad comprobada contra la BBDD (asíncrona)
  const [emailTaken, setEmailTaken] = useState(false);
  const [gamertagTaken, setGamertagTaken] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingTag, setCheckingTag] = useState(false);

  // Bloquea el scroll de la página de fondo mientras el registro está abierto.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const league = LEAGUES.find(item => item.id === leagueId) ?? LEAGUES[0];

  const emailOk = EMAIL_RE.test(email.trim());
  const passOk = pass.length >= 6;
  const pass2Ok = pass2.length > 0 && pass2 === pass;
  const nameOk = nombre.trim().length >= 3;

  // Comprueba el correo contra Supabase (o localStorage) con un pequeño debounce.
  useEffect(() => {
    if (!emailOk) {
      setEmailTaken(false);
      setCheckingEmail(false);
      return;
    }

    let alive = true;
    setCheckingEmail(true);
    const timer = window.setTimeout(() => {
      authService
        .isEmailTaken(email)
        .then(taken => {
          if (alive) setEmailTaken(taken);
        })
        .finally(() => {
          if (alive) setCheckingEmail(false);
        });
    }, 450);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [email, emailOk]);

  // Comprueba el gamertag contra Supabase (o localStorage).
  useEffect(() => {
    const tag = gamertag.trim();
    if (tag.length < 3) {
      setGamertagTaken(false);
      setCheckingTag(false);
      return;
    }

    let alive = true;
    setCheckingTag(true);
    const timer = window.setTimeout(() => {
      authService
        .isGamertagTaken(tag)
        .then(taken => {
          if (alive) setGamertagTaken(taken);
        })
        .finally(() => {
          if (alive) setCheckingTag(false);
        });
    }, 450);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [gamertag]);

  const phase1Valid =
    nameOk && emailOk && !emailTaken && !checkingEmail && passOk && pass2Ok;
  const gamertagOk =
    gamertag.trim().length >= 3 && !gamertagTaken && !checkingTag;

  const steps = useMemo<StepDef[]>(() => {
    const list: StepDef[] = [
      { phase: 1, label: 'Cuenta', icon: User },
      { phase: 2, label: 'Rol', icon: Users },
      {
        phase: 3,
        label: role === 'arbitro' ? 'Árbitro' : role === 'usuario' ? 'Perfil' : 'Jugador',
        icon: role === 'arbitro' ? Scale : role === 'usuario' ? Sparkles : UserRound
      }
    ];
    if (role === 'jugador') list.push({ phase: 4, label: 'Club', icon: Trophy });
    list.push({ phase: 5, label: 'Listo', icon: PartyPopper });
    return list;
  }, [role]);

  const canContinue = (() => {
    if (phase === 1) return phase1Valid;
    if (phase === 2) return role !== null;
    if (phase === 3) {
      if (role === 'jugador') return gamertagOk && tipoMando !== null;
      // Ni árbitro ni aficionado eligen club ni mando
      if (role === 'arbitro' || role === 'usuario') return true;
      return true;
    }
    if (phase === 4) return Boolean(team);
    return false;
  })();

  const submit = async () => {
    if (!role) return;
    setSaving(true);
    setError('');
    try {
      let outcome;

      if (role === 'jugador') {
        outcome = await registerJugador({
          email: email.trim(),
          pass,
          nombre_completo: nombre.trim(),
          gamertag: gamertag.trim(),
          club_elegido: team?.name ?? '',
          club_badge: team?.badge,
          club_short: team?.shortName,
          club_color: team?.color,
          club_color2: team?.color2,
          club_stadium: team?.stadium,
          liga: league.name,
          tipo_mando: tipoMando as ControllerType,
          avatar_file: avatarFile
        });
      } else if (role === 'arbitro') {
        outcome = await registerArbitro({
          email: email.trim(),
          pass,
          nombre_completo: nombre.trim(),
          zona,
          avatar_file: avatarFile
        });
      } else {
        // Aficionado no tiene equipo ni mando asignado
        outcome = await registerUsuario({
          email: email.trim(),
          pass,
          nombre_completo: nombre.trim(),
          bio: bio.trim() || undefined,
          avatar_file: avatarFile
        });
      }

      setResult(outcome.user);
      setNeedsConfirmation(outcome.requiresEmailConfirmation);
      setPhase(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se ha podido completar el registro.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('La foto de perfil debe ser un archivo de imagen.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('La foto de perfil no puede superar los 2 MB.');
      return;
    }

    setError('');
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const clearAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
  };

  const goNext = () => {
    setError('');
    if (!canContinue) return;

    if (phase === 1) {
      setPhase(2);
      return;
    }
    if (phase === 2) {
      setPhase(3);
      return;
    }
    if (phase === 3) {
      if (role === 'arbitro' || role === 'usuario') {
        void submit();
        return;
      }
      setPhase(4);
      return;
    }
    if (phase === 4) {
      void submit();
    }
  };

  const goBack = () => {
    setError('');
    if (phase === 5) {
      navigateTo('home');
      return;
    }
    if (phase === 4) {
      setPhase(3);
      return;
    }
    if (phase === 3) {
      setPhase(2);
      return;
    }
    if (phase === 2) {
      setPhase(1);
      return;
    }
    navigateTo('home');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (phase === 5 || saving) return;
    goNext();
  };

  const handleLeagueChange = (id: string) => {
    setLeagueId(id);
    setTeam(null);
  };

  const roleLabel = role === 'jugador' ? 'Jugador' : role === 'arbitro' ? 'Árbitro' : 'Aficionado';
  const playerNumber = result?.player_number ?? (role === 'arbitro' ? 4 : role === 'jugador' ? 16 : 1);
  const stepNumber = steps.findIndex(item => item.phase === phase) + 1;
  const ActiveIcon = steps.find(item => item.phase === phase)?.icon ?? User;
  const RoleIcon = ROLES.find(item => item.id === role)?.icon ?? User;
  const showTeam = role === 'jugador' && Boolean(team);
  const finishLabel = (phase === 3 && (role === 'arbitro' || role === 'usuario')) || phase === 4 ? 'Completar registro' : 'Continuar';

  const head = (() => {
    if (phase === 1) return { title: 'Crea tu cuenta', sub: 'Apúntate al torneo con tus datos de acceso.' };
    if (phase === 2) return { title: 'Elige tu rol', sub: '¿Cómo quieres vivir el Clash Footballween?' };
    if (phase === 3) {
      if (role === 'arbitro') return { title: 'Tu plaza de árbitro', sub: 'Solo necesitamos tu nombre y tu foto. La organización te asignará los partidos.' };
      if (role === 'usuario') return { title: 'Tu perfil de aficionado', sub: 'Cuéntanos qué te hace vibrar del torneo.' };
      return { title: 'Tu ficha de jugador', sub: 'Elige tu gamertag y el mando con el que vas a jugar.' };
    }
    return {
      title: 'Elige tu club',
      sub: role === 'usuario' ? 'Elige tu equipo favorito para animar desde la grada.' : 'Elige el equipo con el que disputarás el torneo.'
    };
  })();

  const bubble = (() => {
    if (phase === 5) return '¡Estás dentro! Nos vemos el 31 de octubre.';
    if (phase === 4) return role === 'usuario' ? '¿A qué equipo vas a animar?' : 'Elige el equipo con el que disputarás el torneo.';
    if (phase === 3) {
      if (role === 'arbitro') return 'El colegiado también juega en casa. Te asignaremos tus partidos.';
      if (role === 'usuario') return 'La grada también gana partidos.';
      return 'Elige tu gamertag y tu mando. ¡Que se note quién manda!';
    }
    if (phase === 2) return '¿Con qué papel entras al torneo?';
    return '¡Hola! Soy Calabaza. Vamos a apuntarte al Clash.';
  })();

  const ui = (
    <div className="rg-root" data-theme={theme}>
      <style>{STYLES}</style>

      <div className="rg-bg" aria-hidden="true">
        <span className="rg-orb rg-orb-a" />
        <span className="rg-orb rg-orb-b" />
        <span className="rg-orb rg-orb-c" />
        <span className="rg-gridlines" />
      </div>

      <div className="rg-card">
        <span className="rg-card-spin" aria-hidden="true" />
        <div className="rg-card-inner">
          <aside className="rg-aside">
            <div className="rg-brand">
              <img src="/emblema.png" alt="Emblema Clash Footballween" className="rg-logo-img" />
              <span className="rg-brand-text">
                <strong>Clash Footballween</strong>
                <small>Xàtiva 2026</small>
              </span>
            </div>

            <ol className="rg-steps" aria-label="Progreso del registro">
              {steps.map(step => {
                const Icon = step.icon;
                const done = phase === 5 || step.phase < phase;
                const active = phase !== 5 && step.phase === phase;
                return (
                  <li
                    key={step.phase}
                    className={`rg-step ${done ? 'is-done' : active ? 'is-active' : ''}`}
                    aria-current={active ? 'step' : undefined}
                  >
                    <span className="rg-step-dot">{done ? <Check size={16} /> : <Icon size={16} />}</span>
                    <span className="rg-step-label">{step.label}</span>
                  </li>
                );
              })}
            </ol>

            <div className="rg-hero">
              <div className="rg-bubble" key={bubble}>
                {bubble}
              </div>
              <div className="rg-hero-art">
                <Calabaza />
              </div>
            </div>
          </aside>

          <div className="rg-panel">
            <div className="rg-top">
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
              <button type="button" className="rg-home" onClick={() => navigateTo('home')} aria-label="Volver al inicio">
                <Home size={18} />
              </button>
            </div>

            {user && phase !== 5 ? (
              <div className="rg-final">
                <span className="rg-chip">
                  <Ghost size={15} /> Sesión activa
                </span>
                <div className="rg-final-number">{user.player_number ? user.player_number : <RoleIcon size={38} />}</div>
                <h2 className="rg-final-title">Ya estás registrado</h2>
                <p style={{ color: 'var(--mut)', maxWidth: '440px', margin: '0 auto', fontSize: '14.5px', lineHeight: 1.5 }}>
                  Actualmente tienes la sesión iniciada como <strong>{user.gamertag || user.nombre_completo}</strong> ({user.rol}). Si deseas registrar una nueva cuenta, cierra sesión primero.
                </p>
                <div className="rg-final-actions" style={{ marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="rg-btn rg-btn--ghost"
                    onClick={() => logout()}
                  >
                    <LogOut size={17} /> Cerrar sesión
                  </button>
                  <button type="button" className="rg-btn" onClick={() => navigateTo('home')}>
                    Entrar al torneo <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate style={{ display: 'contents' }}>

            {phase !== 5 && (
              <div className="rg-head rg-fade" key={`head-${phase}`}>
                <span className="rg-kicker">
                  <ActiveIcon size={15} /> Paso {stepNumber} de {steps.length}
                </span>
                <h2>{head.title}</h2>
                <p>{head.sub}</p>
              </div>
            )}

            {phase === 5 ? (
              <div className="rg-final">
                <div className="rg-confetti" aria-hidden="true">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <span
                      key={i}
                      style={{
                        left: `${(i * 37 + 6) % 96}%`,
                        animationDelay: `${(i % 7) * 0.45}s`,
                        animationDuration: `${3.6 + (i % 4) * 0.5}s`
                      }}
                    />
                  ))}
                </div>

                <span className="rg-chip">
                  <PartyPopper size={15} /> Registro completado
                </span>
                {needsConfirmation && (
                  <div className="rg-error" role="alert" style={{ maxWidth: '480px' }}>
                    <AlertCircle size={17} />
                    Te hemos enviado un correo de confirmación. Confírmalo y después inicia
                    sesión para entrar al torneo.
                  </div>
                )}
                <div className="rg-final-number">{playerNumber}</div>
                <h2 className="rg-final-title">
                  Eres el {roleLabel.toLowerCase()} número {playerNumber}
                </h2>
                <span className="rg-chip rg-chip--soft">
                  <CalendarDays size={15} /> 31 oct · 20:00
                </span>

                <div className="rg-summary">
                  <div className="rg-tile">
                    <span className="rg-tile-icon">
                      <Mail size={16} />
                    </span>
                    <span className="rg-tile-text">
                      <small>Cuenta</small>
                      <strong>{email.trim()}</strong>
                    </span>
                  </div>
                  <div className="rg-tile">
                    <span className="rg-tile-icon">
                      <RoleIcon size={16} />
                    </span>
                    <span className="rg-tile-text">
                      <small>Rol</small>
                      <strong>{roleLabel}</strong>
                    </span>
                  </div>
                  {role === 'jugador' && (
                    <div className="rg-tile">
                      <span className="rg-tile-icon">
                        <AtSign size={16} />
                      </span>
                      <span className="rg-tile-text">
                        <small>Gamertag</small>
                        <strong>{gamertag.trim()}</strong>
                      </span>
                    </div>
                  )}
                  {showTeam && team && (
                    <div className="rg-tile">
                      <span className="rg-tile-icon">
                        <Trophy size={16} />
                      </span>
                      <span className="rg-tile-text">
                        <small>Club</small>
                        <strong>
                          {team.badge && (
                            <img
                              src={team.badge}
                              alt=""
                              onError={event => {
                                event.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          {team.name}
                        </strong>
                      </span>
                    </div>
                  )}
                  {role === 'jugador' && tipoMando && (
                    <div className="rg-tile">
                      <span className="rg-tile-icon">
                        <Gamepad2 size={16} />
                      </span>
                      <span className="rg-tile-text">
                        <small>Mando</small>
                        <strong>{MANDOS.find(item => item.id === tipoMando)?.label}</strong>
                      </span>
                    </div>
                  )}
                  {role === 'arbitro' && (
                    <div className="rg-tile">
                      <span className="rg-tile-icon">
                        <MapPin size={16} />
                      </span>
                      <span className="rg-tile-text">
                        <small>Pista</small>
                        <strong>{zona}</strong>
                      </span>
                    </div>
                  )}
                  {role === 'usuario' && bio && (
                    <div className="rg-tile">
                      <span className="rg-tile-icon">
                        <Sparkles size={16} />
                      </span>
                      <span className="rg-tile-text">
                        <small>Lema de grada</small>
                        <strong>{bio}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <button type="button" className="rg-btn" onClick={() => navigateTo('home')}>
                  Entrar al torneo <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <>
                <div className="rg-body rg-fade" key={`body-${phase}`}>
                  {phase === 1 && (
                    <div className="rg-grid-2">
                      <TextField
                        id="reg-name"
                        label="Nombre completo"
                        icon={User}
                        type="text"
                        autoComplete="name"
                        placeholder="Nombre y apellidos"
                        value={nombre}
                        onChange={event => setNombre(event.target.value)}
                        status={nombre ? (nameOk ? 'ok' : 'bad') : 'idle'}
                        message="Mínimo 3 caracteres"
                      />
                      <TextField
                        id="reg-email"
                        label="Correo electrónico"
                        icon={Mail}
                        type="email"
                        autoComplete="email"
                        placeholder="tucorreo@alu.edu.gva.es"
                        value={email}
                        onChange={event => setEmail(event.target.value)}
                        status={email ? (emailOk && !emailTaken ? 'ok' : 'bad') : 'idle'}
                        message={
                          checkingEmail
                            ? 'Comprobando disponibilidad…'
                            : emailTaken
                              ? 'Ese correo ya tiene cuenta'
                              : 'Introduce un correo válido'
                        }
                      />
                      <TextField
                        id="reg-pass"
                        label="Contraseña"
                        icon={Lock}
                        type={showPass ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Mínimo 6 caracteres"
                        value={pass}
                        onChange={event => setPass(event.target.value)}
                        status={pass ? (passOk ? 'ok' : 'bad') : 'idle'}
                        message="Mínimo 6 caracteres"
                        right={
                          <button
                            type="button"
                            className="rg-eye"
                            onClick={() => setShowPass(value => !value)}
                            aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          >
                            {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                          </button>
                        }
                      />
                      <TextField
                        id="reg-pass2"
                        label="Repite la contraseña"
                        icon={ShieldCheck}
                        type={showPass ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Otra vez"
                        value={pass2}
                        onChange={event => setPass2(event.target.value)}
                        status={pass2 ? (pass2Ok ? 'ok' : 'bad') : 'idle'}
                        message="Las contraseñas no coinciden"
                      />

                      <div className="rg-field" style={{ gridColumn: '1 / -1' }}>
                        <span className="rg-label">Foto de perfil (opcional)</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '52px',
                              height: '52px',
                              flex: 'none',
                              borderRadius: '50%',
                              overflow: 'hidden',
                              display: 'grid',
                              placeItems: 'center',
                              background: 'var(--tile-bg)',
                              border: '1.5px solid var(--line)'
                            }}
                          >
                            {avatarPreview ? (
                              <img
                                src={avatarPreview}
                                alt="Foto de perfil seleccionada"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <UserRound size={22} style={{ opacity: 0.6 }} />
                            )}
                          </div>

                          <label
                            className="rg-btn rg-btn--ghost"
                            style={{ height: '40px', padding: '0 16px', cursor: 'pointer' }}
                          >
                            <Camera size={16} />
                            {avatarFile ? 'Cambiar foto' : 'Subir foto'}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/gif"
                              onChange={handleAvatarFile}
                              style={{ display: 'none' }}
                            />
                          </label>

                          {avatarFile && (
                            <button type="button" className="rg-link" onClick={clearAvatar}>
                              Quitar
                            </button>
                          )}
                        </div>
                        <span className="rg-msg">JPG, PNG o WEBP · máximo 2 MB</span>
                      </div>
                    </div>
                  )}

                  {phase === 2 && (
                    <div className="rg-roles" role="radiogroup" aria-label="Tipo de cuenta">
                      {ROLES.map(option => (
                        <OptionCard
                          key={option.id}
                          icon={option.icon}
                          title={option.title}
                          desc={option.desc}
                          tone={option.tone}
                          selected={role === option.id}
                          onClick={() => {
                            setRole(option.id);
                            setError('');
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {phase === 3 && role === 'jugador' && (
                    <>
                      <TextField
                        id="reg-gamertag"
                        label="Gamertag de EA FC"
                        icon={AtSign}
                        type="text"
                        placeholder="Tu apodo en el cuadro"
                        value={gamertag}
                        onChange={event => setGamertag(event.target.value)}
                        status={gamertag ? (gamertagOk ? 'ok' : 'bad') : 'idle'}
                        message={
                          checkingTag
                            ? 'Comprobando disponibilidad…'
                            : gamertagTaken
                              ? 'Ese gamertag ya está en uso'
                              : 'Mínimo 3 caracteres'
                        }
                      />
                      <div className="rg-group">
                        <span className="rg-group-label">Tipo de mando</span>
                        <div className="rg-mandos" role="radiogroup" aria-label="Tipo de mando">
                          {MANDOS.map(mando => (
                            <MandoCard
                              key={mando.id}
                              mando={mando}
                              selected={tipoMando === mando.id}
                              onClick={() => setTipoMando(mando.id)}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {phase === 3 && role === 'arbitro' && (
                    <div className="rg-roles rg-roles--2" style={{ gridTemplateColumns: '1fr' }}>
                      <div className="rg-field">
                        <span className="rg-label">Alta directa de árbitro</span>
                        <p style={{ color: 'var(--mut)', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                          No necesitas PIN ni elegir club. Al completar el registro se te
                          asigna una de las 4 plazas de árbitro y los partidos que aún no
                          tengan colegiado. Podrás arbitrarlos desde la clasificación.
                        </p>
                      </div>
                    </div>
                  )}

                  {phase === 3 && role === 'usuario' && (
                    <div className="rg-field">
                      <label className="rg-label" htmlFor="reg-bio">
                        Tu lema de grada (opcional)
                      </label>
                      <div className="rg-ta">
                        <textarea
                          id="reg-bio"
                          className="rg-textarea"
                          maxLength={140}
                          placeholder="Ej: Vengo por el castillo y me quedo por los penaltis"
                          value={bio}
                          onChange={event => setBio(event.target.value)}
                        />
                        <span className="rg-ta-count">{bio.length}/140</span>
                      </div>
                    </div>
                  )}

                  {phase === 4 && (
                    <TeamCarousel leagueId={leagueId} onLeagueChange={handleLeagueChange} selected={team} onSelect={setTeam} />
                  )}
                </div>

                {error && (
                  <div className="rg-error" role="alert">
                    <AlertCircle size={17} /> {error}
                  </div>
                )}

                <div className="rg-foot">
                  {phase === 1 ? (
                    <button type="button" className="rg-link" onClick={() => navigateTo('login')}>
                      <LogIn size={16} /> Ya tengo cuenta
                    </button>
                  ) : (
                    <button type="button" className="rg-btn rg-btn--ghost" onClick={goBack} disabled={saving}>
                      <ArrowLeft size={17} /> Atrás
                    </button>
                  )}

                  <button type="submit" className="rg-btn" disabled={!canContinue || saving}>
                    {saving ? (
                      <>
                        <span className="rg-spin" /> Procesando…
                      </>
                    ) : (
                      <>
                        {finishLabel} <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Se pinta en <body> para que ningún contenedor padre (transform, overflow…) pueda recortarlo.
  return createPortal(ui, document.body);
};

export default RegisterPage;

/* ════════════════════════════════════════════════════════════════
   7 · ESTILOS
   ════════════════════════════════════════════════════════════════ */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Manrope:wght@500;600;700;800&display=swap');

/* ── Tema oscuro (Halloween Clash) ── */
.rg-root{
  --txt:#f8fafc; --mut:#94a3b8;
  --line:rgba(255,94,0,.28); --line-2:rgba(255,255,255,.16);
  --acc:#ff5e00; --acc-2:#eab308; --ink:#05060a; --ok:#22c55e; --bad:#ef4444;
  --grad:linear-gradient(135deg,#ff7a1a 0%,#ff5e00 50%,#d94800 100%);
  --root-bg:
    radial-gradient(70% 60% at 12% 0%,rgba(147,51,234,.32) 0%,transparent 62%),
    radial-gradient(70% 60% at 100% 100%,rgba(255,94,0,.36) 0%,transparent 62%),
    #05060a;
  --card-bg:linear-gradient(160deg,rgba(26,12,6,.98) 0%,rgba(16,10,24,.98) 55%,rgba(12,8,22,.98) 100%);
  --card-shadow:0 30px 90px -20px rgba(0,0,0,.9),0 0 60px -10px rgba(255,94,0,.45),0 0 100px -20px rgba(147,51,234,.3);
  --aside-bg:linear-gradient(180deg,rgba(255,94,0,.2),rgba(147,51,234,.08) 75%);
  --field-bg:rgba(8,10,16,.85); --field-bg-f:rgba(15,18,28,.95);
  --ph:#64748b; --autofill:#160d26;
  --ghost-bg:rgba(255,255,255,.08); --tile-bg:rgba(255,255,255,.06); --tile-icon-bg:rgba(255,94,0,.25);
  --chip-bg:rgba(255,94,0,.2); --chip-bd:rgba(234,179,8,.55);
  --err-bg:rgba(239,68,68,.18); --err-bd:rgba(239,68,68,.6); --err-txt:#fca5a5;
  --bubble-bg:#fff7ea; --bubble-txt:#1c0a03; --bubble-bd:transparent;
  --orb-o:.5; --grid:rgba(255,94,0,.08);
  --f-head:'Space Grotesk','Bricolage Grotesque','Segoe UI',system-ui,sans-serif;
  --f-body:'Space Grotesk','Manrope','Segoe UI',system-ui,-apple-system,sans-serif;
  --ease:cubic-bezier(.22,1,.36,1);
  position:fixed; top:0; left:0; right:0; bottom:0; height:100vh; height:100dvh; z-index:9999;
  display:flex; align-items:center; justify-content:center;
  padding:clamp(8px,2.2vmin,24px); overflow:hidden; color:var(--txt);
  background:var(--root-bg);
  font-family:var(--f-body); -webkit-font-smoothing:antialiased; text-align:left;
}

/* ── Tema claro (Día / Mediterráneo Xàtiva) ── */
.rg-root[data-theme='light']{
  --txt:#0f172a; --mut:#475569;
  --line:rgba(2,132,199,.22); --line-2:rgba(15,23,42,.14);
  --acc:#0284c7; --acc-2:#ea580c; --ink:#ffffff; --ok:#16a34a; --bad:#dc2626;
  --grad:linear-gradient(135deg,#0284c7 0%,#0369a1 100%);
  --root-bg:
    radial-gradient(70% 60% at 12% 0%,rgba(2,132,199,.18) 0%,transparent 62%),
    radial-gradient(70% 60% at 100% 100%,rgba(234,88,12,.18) 0%,transparent 62%),
    #f0f7ff;
  --card-bg:linear-gradient(160deg,#ffffff 0%,#f8fafc 55%,#f1f5f9 100%);
  --card-shadow:0 30px 80px -25px rgba(15,23,42,.18),0 0 50px -20px rgba(2,132,199,.3);
  --aside-bg:linear-gradient(180deg,rgba(2,132,199,.12),rgba(234,88,12,.06) 75%);
  --field-bg:#ffffff; --field-bg-f:#ffffff;
  --ph:#94a3b8; --autofill:#f0f7ff;
  --ghost-bg:rgba(2,132,199,.08); --tile-bg:rgba(2,132,199,.06); --tile-icon-bg:rgba(2,132,199,.18);
  --chip-bg:rgba(2,132,199,.12); --chip-bd:rgba(2,132,199,.4);
  --err-bg:rgba(220,38,38,.1); --err-bd:rgba(220,38,38,.4); --err-txt:#991b1b;
  --bubble-bg:#ffffff; --bubble-txt:#0f172a; --bubble-bd:rgba(2,132,199,.25);
  --orb-o:.25; --grid:rgba(2,132,199,.06);
}

:where(.rg-root) *,:where(.rg-root) *::before,:where(.rg-root) *::after{box-sizing:border-box}
:where(.rg-root) button{font:inherit;color:inherit;cursor:pointer;border:0;background:none;padding:0;margin:0}
:where(.rg-root) button:disabled{cursor:not-allowed}
:where(.rg-root) h2,:where(.rg-root) p,:where(.rg-root) ol,:where(.rg-root) li{margin:0;padding:0}
.rg-root :focus-visible{outline:2px solid var(--acc-2);outline-offset:2px}

/* Fondo */
.rg-bg{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.rg-orb{position:absolute;border-radius:50%;filter:blur(80px);opacity:var(--orb-o);animation:rg-float 16s ease-in-out infinite alternate}
.rg-orb-a{width:46vmax;height:46vmax;left:-14vmax;top:-18vmax;background:radial-gradient(circle,#ff5e00,transparent 65%)}
.rg-orb-b{width:42vmax;height:42vmax;right:-14vmax;bottom:-16vmax;background:radial-gradient(circle,#9333ea,transparent 65%);animation-delay:-6s}
.rg-orb-c{width:24vmax;height:24vmax;right:14%;top:-9vmax;background:radial-gradient(circle,#eab308,transparent 65%);opacity:.3;animation-delay:-10s}
.rg-root[data-theme='light'] .rg-orb-a{background:radial-gradient(circle,#0284c7,transparent 65%)}
.rg-root[data-theme='light'] .rg-orb-b{background:radial-gradient(circle,#ea580c,transparent 65%)}
.rg-root[data-theme='light'] .rg-orb-c{background:radial-gradient(circle,#38bdf8,transparent 65%)}
.rg-gridlines{position:absolute;inset:0;opacity:.4;
  background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);
  background-size:46px 46px;
  -webkit-mask-image:radial-gradient(ellipse at center,#000 15%,transparent 72%);
  mask-image:radial-gradient(ellipse at center,#000 15%,transparent 72%)}

/* Tarjeta con borde animado */
.rg-card{position:relative;width:min(100%,980px);height:min(100%,640px);border-radius:34px;padding:2px;overflow:hidden;
  box-shadow:var(--card-shadow);animation:rg-pop .8s var(--ease) both}
.rg-card-spin{position:absolute;left:50%;top:50%;width:max(220%,1500px);aspect-ratio:1;
  background:conic-gradient(from 0deg,transparent 0 55%,rgba(255,94,0,1) 76%,rgba(147,51,234,.95) 90%,transparent 100%);
  animation:rg-spin 8s linear infinite}
.rg-root[data-theme='light'] .rg-card-spin{
  background:conic-gradient(from 0deg,transparent 0 55%,rgba(2,132,199,1) 76%,rgba(234,88,12,.95) 90%,transparent 100%);
}
.rg-card-inner{position:relative;height:100%;border-radius:32px;overflow:hidden;
  display:grid;grid-template-columns:272px minmax(0,1fr);
  background:var(--card-bg)}

/* Lateral */
.rg-aside{position:relative;min-height:0;display:flex;flex-direction:column;gap:clamp(16px,3.4vh,30px);
  padding:clamp(18px,3.2vh,28px) 22px 12px;border-right:1.5px solid var(--line);
  background:var(--aside-bg);overflow:hidden}
.rg-brand{display:flex;align-items:center;gap:12px}
.rg-logo-img{width:auto;height:48px;max-width:64px;object-fit:contain;filter:drop-shadow(0 2px 10px rgba(255,94,0,.55));animation:rg-bob 4s ease-in-out infinite}
.rg-root[data-theme='light'] .rg-logo-img{filter:drop-shadow(0 2px 10px rgba(2,132,199,.45))}
.rg-brand-text{display:flex;flex-direction:column;min-width:0}
.rg-brand-text strong{font-family:var(--f-head);font-size:17px;font-weight:800;line-height:1.1;letter-spacing:-.01em}
.rg-brand-text small{margin-top:3px;color:var(--mut);font-size:13px;font-weight:700}

.rg-steps{--sg:clamp(10px,2.2vh,20px);list-style:none;display:flex;flex-direction:column;gap:var(--sg)}
.rg-step{position:relative;display:flex;align-items:center;gap:12px;color:var(--mut);transition:color .4s}
.rg-step-dot{flex:none;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;border:2px solid var(--line-2);
  background:var(--ghost-bg);color:var(--mut);transition:background .45s var(--ease),border-color .45s,box-shadow .45s,color .45s,transform .45s var(--ease)}
.rg-step-label{font-size:14.5px;font-weight:700}
.rg-step:not(:last-child)::after{content:'';position:absolute;left:16px;top:38px;width:2px;height:calc(var(--sg) - 8px);border-radius:2px;background:var(--line);transition:background .5s}
.rg-step.is-active{color:var(--txt)}
.rg-step.is-active .rg-step-dot{border-color:var(--acc);background:rgba(255,94,0,.28);color:#fff;transform:scale(1.06);
  box-shadow:0 0 0 5px rgba(255,94,0,.2),0 0 24px rgba(255,94,0,.6)}
.rg-root[data-theme='light'] .rg-step.is-active .rg-step-dot{border-color:var(--acc);background:rgba(2,132,199,.18);color:#0284c7;
  box-shadow:0 0 0 5px rgba(2,132,199,.2),0 0 24px rgba(2,132,199,.4)}
.rg-step.is-done{color:var(--txt)}
.rg-step.is-done .rg-step-dot{background:var(--grad);border-color:transparent;color:var(--ink)}
.rg-step.is-done::after{background:var(--acc-2)}

/* Personaje */
.rg-hero{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:flex-end;align-items:stretch;gap:12px}
.rg-bubble{position:relative;flex:none;padding:11px 14px;border-radius:20px;background:var(--bubble-bg);color:var(--bubble-txt);
  border:1.5px solid var(--bubble-bd);font-size:13.5px;font-weight:800;line-height:1.35;text-align:center;
  box-shadow:0 12px 26px -10px rgba(10,0,40,.45);animation:rg-bubble .5s var(--ease) both}
.rg-bubble::after{content:'';position:absolute;left:50%;bottom:-9px;margin-left:-10px;border:10px solid transparent;border-top-color:var(--bubble-bg);border-bottom:0}
.rg-hero-art{flex:1 1 0;min-height:0;max-height:210px;display:flex;justify-content:center}
.rg-pumpkin{height:100%;width:auto;max-width:100%;overflow:visible;filter:drop-shadow(0 12px 18px rgba(10,0,40,.35))}
.rg-pk-body{animation:rg-bob 3.6s ease-in-out infinite}
.rg-pk-wave{animation:rg-wave 1.1s ease-in-out infinite}
.rg-pk-eyes{animation:rg-blink 5s ease-in-out infinite}

/* Panel */
.rg-panel{position:relative;min-width:0;min-height:0;display:flex;flex-direction:column;gap:clamp(8px,1.8vh,16px);
  padding:clamp(16px,3.2vh,30px) clamp(18px,3.2vw,38px) clamp(14px,2.6vh,24px)}

/* Barra superior: modo oscuro/claro + inicio */
.rg-top{position:absolute;top:clamp(14px,2.6vh,22px);right:clamp(14px,2.4vw,22px);z-index:5;display:flex;align-items:center;gap:10px}
.rg-home{width:40px;height:40px;border-radius:14px;display:grid;place-items:center;color:var(--txt);background:var(--ghost-bg);border:1.5px solid var(--line-2);
  transition:color .25s,border-color .25s,background .25s,transform .35s var(--ease)}
.rg-home:hover{color:var(--ink);background:var(--grad);border-color:transparent;transform:translateY(-2px)}

.rg-theme{position:relative;display:inline-flex;align-items:center;height:40px;padding:0 4px;border-radius:999px;
  background:var(--ghost-bg);border:1.5px solid var(--line-2);transition:border-color .25s,background .3s}
.rg-theme:hover{border-color:var(--acc-2)}
.rg-theme-thumb{position:absolute;top:3px;left:4px;width:34px;height:30px;border-radius:999px;background:var(--grad);
  box-shadow:0 6px 16px -6px rgba(255,94,0,.95);transition:transform .45s var(--ease)}
.rg-root[data-theme='light'] .rg-theme-thumb{box-shadow:0 6px 16px -6px rgba(2,132,199,.7)}
.rg-theme[aria-checked='false'] .rg-theme-thumb{transform:translateX(34px)}
.rg-theme-opt{position:relative;z-index:1;width:34px;height:30px;display:grid;place-items:center;color:var(--mut);transition:color .3s}
.rg-theme-opt.is-on{color:var(--ink)}

.rg-fade{animation:rg-in .45s var(--ease) both}
.rg-head{flex:none;padding-right:150px}
.rg-kicker{display:inline-flex;align-items:center;gap:7px;color:var(--acc-2);font-size:13.5px;font-weight:800}
.rg-head h2{margin-top:6px;font-family:var(--f-head);font-size:clamp(24px,3.9vh,32px);font-weight:800;letter-spacing:-.025em;line-height:1.1;color:var(--txt)}
.rg-head p{margin-top:6px;color:var(--mut);font-size:14.5px;font-weight:600;line-height:1.4}
.rg-body{flex:1;min-height:0;display:flex;flex-direction:column;gap:clamp(8px,1.5vh,14px);overflow:hidden}
.rg-body > :first-child{margin-top:auto}
.rg-body > :last-child{margin-bottom:auto}

/* Campos */
.rg-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:0 16px}
.rg-field{display:flex;flex-direction:column;gap:6px;min-width:0}
.rg-label{font-size:13px;font-weight:800;color:var(--mut)}
.rg-input-wrap{position:relative;display:flex;align-items:center}
.rg-input-icon{position:absolute;left:15px;color:var(--mut);pointer-events:none;transition:color .3s}
.rg-input-wrap:focus-within .rg-input-icon{color:var(--acc-2)}
.rg-input{width:100%;height:clamp(44px,6.3vh,52px);padding:0 46px 0 44px;border-radius:18px;border:1.5px solid var(--line-2);
  background:var(--field-bg);color:var(--txt);font:inherit;font-size:15px;font-weight:700;
  transition:border-color .25s,box-shadow .25s,background .25s,color .25s}
.rg-input::placeholder{color:var(--ph);font-weight:600}
.rg-input:focus{border-color:var(--acc);background:var(--field-bg-f);box-shadow:0 0 0 4px rgba(255,94,0,.25)}
.rg-root[data-theme='light'] .rg-input:focus{box-shadow:0 0 0 4px rgba(2,132,199,.25)}
.rg-input:focus-visible{outline:none}
.rg-input:-webkit-autofill{-webkit-text-fill-color:var(--txt);box-shadow:0 0 0 100px var(--autofill) inset;caret-color:var(--txt)}
.rg-input-end{position:absolute;right:12px;display:flex;align-items:center;color:var(--mut)}
.rg-field.is-ok .rg-input{border-color:var(--ok)}
.rg-field.is-ok .rg-input-end{color:var(--ok)}
.rg-field.is-bad .rg-input{border-color:var(--bad)}
.rg-field.is-bad .rg-input-end{color:var(--bad)}
.rg-msg{display:block;min-height:15px;font-size:12.5px;font-weight:700;line-height:15px;color:var(--bad)}
.rg-eye{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;color:var(--mut);transition:color .2s,background .2s}
.rg-eye:hover{color:var(--txt);background:var(--ghost-bg)}

.rg-ta{position:relative}
.rg-textarea{width:100%;height:clamp(100px,20vh,160px);resize:none;padding:14px 16px 32px;border-radius:20px;border:1.5px solid var(--line-2);
  background:var(--field-bg);color:var(--txt);font:inherit;font-size:15px;font-weight:700;line-height:1.45;
  transition:border-color .25s,box-shadow .25s,background .25s,color .25s}
.rg-textarea::placeholder{color:var(--ph);font-weight:600}
.rg-textarea:focus{outline:none;border-color:var(--acc);background:var(--field-bg-f);box-shadow:0 0 0 4px rgba(255,94,0,.25)}
.rg-root[data-theme='light'] .rg-textarea:focus{box-shadow:0 0 0 4px rgba(2,132,199,.25)}
.rg-ta-count{position:absolute;right:14px;bottom:10px;font-size:12px;font-weight:800;color:var(--mut)}

.rg-group{display:flex;flex-direction:column;gap:8px}
.rg-group-label{font-size:13px;font-weight:800;color:var(--mut)}

/* Tarjetas de opción (roles, pistas, mandos) */
.rg-roles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.rg-roles--2{grid-template-columns:repeat(2,minmax(0,1fr))}
.rg-option{--tone:#ff5e00;position:relative;overflow:hidden;min-width:0;border-radius:24px;border:2px solid var(--line-2);text-align:left;
  background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.03));
  transition:transform .4s var(--ease),border-color .3s,box-shadow .35s,background .35s}
.rg-root[data-theme='light'] .rg-option{--tone:#0284c7;background:linear-gradient(180deg,rgba(255,255,255,.9),rgba(241,245,249,.8));color:#0f172a}
.rg-option::after{content:'';position:absolute;top:-10%;bottom:-10%;left:-70%;width:40%;pointer-events:none;
  background:linear-gradient(100deg,transparent,rgba(255,255,255,.3),transparent);transform:skewX(-20deg);transition:left .85s var(--ease)}
.rg-option:hover::after{left:140%}
.rg-option:hover{transform:translateY(-3px);border-color:var(--tone)}
.rg-option.is-selected{border-color:var(--tone);background:linear-gradient(180deg,rgba(255,94,0,.2),rgba(147,51,234,.1));
  box-shadow:0 0 0 2px var(--tone),0 18px 38px -14px var(--tone)}
.rg-root[data-theme='light'] .rg-option.is-selected{
  background:linear-gradient(180deg,rgba(2,132,199,.15),rgba(255,255,255,.95));
  box-shadow:0 0 0 2px #0284c7,0 18px 38px -14px rgba(2,132,199,.5);
}
.rg-option-check{position:absolute;top:12px;right:12px;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;
  background:var(--tone);color:var(--ink);transform:scale(0);transition:transform .4s var(--ease)}
.rg-option.is-selected .rg-option-check{transform:scale(1)}

.rg-roles .rg-option{display:flex;flex-direction:column;justify-content:space-between;gap:16px;min-height:clamp(130px,26vh,190px);padding:18px}
.rg-option-icon{width:50px;height:50px;border-radius:18px;display:grid;place-items:center;background:var(--ghost-bg);color:var(--tone);
  transition:background .35s,color .35s,transform .5s var(--ease)}
.rg-root[data-theme='light'] .rg-option-icon{background:rgba(2,132,199,.12);color:#0284c7}
.rg-option:hover .rg-option-icon{transform:scale(1.08) rotate(-5deg)}
.rg-option.is-selected .rg-option-icon{background:var(--tone);color:var(--ink)}
.rg-option-text strong{display:block;font-family:var(--f-head);font-size:18px;font-weight:800;letter-spacing:-.01em;color:var(--txt)}
.rg-root[data-theme='light'] .rg-option-text strong{color:#0f172a}
.rg-option-text small{display:block;margin-top:3px;color:var(--mut);font-size:13.5px;font-weight:600}

.rg-mandos{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.rg-mando{display:flex;flex-direction:column;align-items:center;text-align:center;gap:2px;padding:12px 12px 14px}
.rg-mando-stage{position:relative;width:100%;height:clamp(78px,17vh,124px);margin-bottom:8px;border-radius:18px;overflow:hidden;
  display:grid;place-items:center;color:var(--mut);background:radial-gradient(circle at 50% 40%,rgba(255,255,255,.14),rgba(255,255,255,.03) 70%)}
.rg-root[data-theme='light'] .rg-mando-stage{background:radial-gradient(circle at 50% 40%,rgba(2,132,199,.12),rgba(241,245,249,.6) 70%)}
.rg-mando-stage img{position:absolute;inset:6px;width:calc(100% - 12px);height:calc(100% - 12px);object-fit:contain;
  filter:drop-shadow(0 8px 10px rgba(10,0,40,.45));transition:transform .6s var(--ease)}
.rg-mando:hover .rg-mando-stage img,.rg-mando.is-selected .rg-mando-stage img{transform:scale(1.08) rotate(-3deg)}
.rg-mando-name{position:relative;font-family:var(--f-head);font-size:16px;font-weight:800;color:var(--txt)}
.rg-root[data-theme='light'] .rg-mando-name{color:#0f172a}
.rg-mando-sub{position:relative;color:var(--mut);font-size:13px;font-weight:600}

/* Selector de ligas (desplegable) y equipos (escudo único) */
.rg-league-dropdown-wrap{
  display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;margin-bottom:2px
}
.rg-league-dropdown-label{
  display:flex;align-items:center;gap:7px;font-size:13.5px;font-weight:800;color:var(--mut);white-space:nowrap
}
.rg-league-select-wrapper{
  position:relative;flex:1;max-width:320px;display:flex;align-items:center
}
.rg-league-select{
  width:100%;height:40px;padding:0 36px 0 14px;border-radius:14px;border:1.5px solid var(--line-2);
  background:var(--field-bg);color:var(--txt);font-family:var(--f-body);font-size:13.5px;font-weight:700;
  appearance:none;-webkit-appearance:none;cursor:pointer;
  transition:border-color .25s,box-shadow .25s,background .25s
}
.rg-league-select:focus{
  outline:none;border-color:var(--acc);background:var(--field-bg-f);box-shadow:0 0 0 4px rgba(255,94,0,.25)
}
.rg-root[data-theme='light'] .rg-league-select:focus{
  box-shadow:0 0 0 4px rgba(2,132,199,.25)
}
.rg-league-select option{
  background:#080a10;color:#f8fafc;font-weight:600
}
.rg-root[data-theme='light'] .rg-league-select option{
  background:#ffffff;color:#0f172a
}
.rg-league-select-icon{
  position:absolute;right:12px;color:var(--acc);pointer-events:none
}

/* Escenario de selección: Solo un escudo a la vez */
.rg-stage{
  position:relative;height:205px;min-height:195px;overflow:hidden;border-radius:24px;
  touch-action:pan-y;user-select:none;-webkit-user-select:none;
  background:rgba(0,0,0,.22);border:1.5px solid var(--line);
  display:flex;align-items:center;justify-content:center;
  transition:border-color .25s ease,box-shadow .25s ease
}
.rg-root[data-theme='light'] .rg-stage{
  background:rgba(2,132,199,.04);border-color:rgba(2,132,199,.2)
}
.rg-stage::before{
  content:'';position:absolute;left:50%;top:50%;width:55%;height:65%;transform:translate(-50%,-50%);
  pointer-events:none;background:radial-gradient(ellipse,rgba(255,94,0,.25),transparent 70%);filter:blur(14px)
}
.rg-root[data-theme='light'] .rg-stage::before{
  background:radial-gradient(ellipse,rgba(2,132,199,.18),transparent 70%)
}
.rg-stage.is-team-selected{
  border-color:rgba(34,197,94,.7);box-shadow:0 0 20px rgba(34,197,94,.25)
}
.rg-root[data-theme='light'] .rg-stage.is-team-selected{
  border-color:#22c55e;box-shadow:0 0 18px rgba(34,197,94,.25)
}
.rg-stage:focus-visible{
  outline:2px solid var(--acc-2);outline-offset:2px
}

/* Escudo y Nombre sin contenedor blanco ni negro */
.rg-single-card{
  position:relative;height:100%;width:100%;max-width:320px;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:6px;padding:8px 16px;background:transparent !important;border:none !important;box-shadow:none !important;
  cursor:pointer;animation:rg-pop .3s var(--ease) both;user-select:none
}
.rg-root[data-theme='light'] .rg-single-card{
  background:transparent !important;border:none !important;box-shadow:none !important
}
.rg-single-badge-wrap{
  height:115px;width:100%;display:flex;align-items:center;justify-content:center;position:relative
}
.rg-single-badge-wrap img{
  max-height:110px;max-width:140px;width:auto;height:auto;object-fit:contain;
  filter:drop-shadow(0 4px 10px rgba(0,0,0,.22));transition:transform .25s ease,filter .25s ease
}
.rg-single-card:hover .rg-single-badge-wrap img{
  transform:scale(1.06)
}
.rg-single-card.is-picked .rg-single-badge-wrap img{
  transform:scale(1.05);filter:drop-shadow(0 0 16px rgba(34,197,94,.65))
}
.rg-single-name{
  font-family:var(--f-head);font-size:16px;font-weight:800;text-align:center;
  color:var(--txt);line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px;margin:0
}
.rg-root[data-theme='light'] .rg-single-name{
  color:#0f172a
}
.rg-tcheck-pill{
  display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:999px;
  background:rgba(34,197,94,.18);border:1px solid #22c55e;color:#22c55e;
  font-family:var(--f-head);font-size:10.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;
  animation:rg-pop .25s var(--ease) both
}
.rg-root[data-theme='light'] .rg-tcheck-pill{
  background:rgba(34,197,94,.12);color:#15803d;border-color:#22c55e
}

.rg-skel{background:linear-gradient(100deg,rgba(255,255,255,.1) 30%,rgba(255,255,255,.28) 50%,rgba(255,255,255,.1) 70%) 0 0/220% 100%;
  animation:rg-shimmer 1.5s linear infinite}
.rg-stage-msg{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;
  color:var(--mut);font-size:14px;font-weight:700;text-align:center}

.rg-arrow{position:absolute;top:50%;z-index:30;width:42px;height:42px;border-radius:50%;display:grid;place-items:center;color:var(--txt);
  background:rgba(12,8,22,.85);border:1.5px solid var(--line-2);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  transform:translateY(-50%);transition:transform .35s var(--ease),background .25s,color .25s,box-shadow .3s,border-color .25s}
.rg-root[data-theme='light'] .rg-arrow{background:rgba(255,255,255,.85);color:#0f172a;border-color:rgba(15,23,42,.14)}
.rg-arrow--l{left:8px}
.rg-arrow--r{right:8px}
.rg-arrow:hover{background:var(--grad);color:var(--ink);border-color:transparent;box-shadow:0 0 26px rgba(255,94,0,.8);transform:translateY(-50%) scale(1.1)}
.rg-root[data-theme='light'] .rg-arrow:hover{box-shadow:0 0 26px rgba(2,132,199,.6)}
.rg-arrow:active{transform:translateY(-50%) scale(.94)}

.rg-caption{flex:none;min-height:20px;display:flex;align-items:center;justify-content:center;gap:6px;color:var(--mut);font-size:13.5px;font-weight:700;text-align:center}
.rg-caption svg{flex:none}
.rg-pickrow{display:flex;align-items:center;justify-content:center;gap:12px}
.rg-counter{min-width:58px;font-variant-numeric:tabular-nums;font-size:14px;font-weight:800;color:var(--mut);text-align:right}
.rg-counter i{font-style:normal;opacity:.5;margin:0 3px}
.rg-pick{position:relative;overflow:hidden;display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 26px;border-radius:999px;
  border:2px solid var(--line-2);background:var(--ghost-bg);font-size:14.5px;font-weight:800;color:var(--txt);
  transition:transform .35s var(--ease),background .3s,border-color .3s,color .3s,box-shadow .35s}
.rg-pick:hover:not(:disabled){transform:translateY(-2px);border-color:var(--acc)}
.rg-pick:disabled{opacity:.5}
.rg-pick.is-on{background:var(--grad);color:var(--ink);border-color:transparent;box-shadow:0 12px 28px -10px rgba(255,94,0,1)}
.rg-root[data-theme='light'] .rg-pick.is-on{box-shadow:0 12px 28px -10px rgba(2,132,199,.8)}
.rg-iconbtn{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;color:var(--txt);background:var(--ghost-bg);border:1.5px solid var(--line-2);
  transition:transform .35s var(--ease),background .25s,border-color .25s}
.rg-iconbtn:hover{transform:rotate(90deg);border-color:var(--acc)}
.rg-iconbtn.is-warn{color:var(--acc-2);border-color:var(--acc-2)}

/* Botones */
.rg-foot{flex:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:clamp(10px,1.8vh,16px);border-top:1.5px solid var(--line)}
.rg-btn{position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:48px;padding:0 26px;border-radius:18px;
  color:var(--ink);background:var(--grad);font-size:15px;font-weight:800;
  box-shadow:0 14px 30px -12px rgba(255,94,0,.95),inset 0 1px 0 rgba(255,255,255,.5);
  transition:transform .35s var(--ease),box-shadow .35s,opacity .3s,filter .3s}
.rg-root[data-theme='light'] .rg-btn{box-shadow:0 14px 30px -12px rgba(2,132,199,.7),inset 0 1px 0 rgba(255,255,255,.5)}
.rg-btn::after{content:'';position:absolute;top:0;bottom:0;left:-60%;width:40%;pointer-events:none;
  background:linear-gradient(100deg,transparent,rgba(255,255,255,.6),transparent);transform:skewX(-20deg);transition:left .75s var(--ease)}
.rg-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 18px 36px -12px rgba(255,94,0,1),inset 0 1px 0 rgba(255,255,255,.55)}
.rg-root[data-theme='light'] .rg-btn:hover:not(:disabled){box-shadow:0 18px 36px -12px rgba(2,132,199,.8),inset 0 1px 0 rgba(255,255,255,.55)}
.rg-btn:hover:not(:disabled)::after{left:140%}
.rg-btn:active:not(:disabled){transform:translateY(0) scale(.98)}
.rg-btn:disabled{opacity:.45;filter:grayscale(.4);box-shadow:none}
.rg-btn--ghost{color:var(--txt);background:var(--ghost-bg);border:2px solid var(--line-2);box-shadow:none}
.rg-btn--ghost::after{display:none}
.rg-btn--ghost:hover:not(:disabled){border-color:var(--acc-2);box-shadow:none}
.rg-btn--sm{height:40px;padding:0 18px;font-size:14px}
.rg-link{display:inline-flex;align-items:center;gap:8px;color:var(--mut);font-size:14.5px;font-weight:800;transition:color .2s}
.rg-link:hover{color:var(--acc-2)}
.rg-spin{width:17px;height:17px;border-radius:50%;border:2px solid rgba(42,17,0,.28);border-top-color:var(--ink);animation:rg-rot .7s linear infinite}

.rg-error{flex:none;display:flex;align-items:center;gap:8px;padding:11px 14px;border-radius:16px;color:var(--err-txt);font-size:13.5px;font-weight:700;
  background:var(--err-bg);border:1.5px solid var(--err-bd);animation:rg-shake .4s}

/* Pantalla final */
.rg-final{position:relative;flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:clamp(6px,1.5vh,14px);text-align:center;animation:rg-in .6s var(--ease) both}
.rg-confetti{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.rg-confetti span{position:absolute;top:-14px;width:8px;height:14px;border-radius:2px;opacity:0;animation:rg-fall 4s linear infinite}
.rg-confetti span:nth-child(3n){background:#ff5e00}
.rg-confetti span:nth-child(3n+1){background:#9333ea}
.rg-confetti span:nth-child(3n+2){background:#eab308}
.rg-root[data-theme='light'] .rg-confetti span:nth-child(3n){background:#0284c7}
.rg-root[data-theme='light'] .rg-confetti span:nth-child(3n+1){background:#ea580c}
.rg-root[data-theme='light'] .rg-confetti span:nth-child(3n+2){background:#38bdf8}
.rg-chip{display:inline-flex;align-items:center;gap:7px;height:32px;padding:0 14px;border-radius:999px;color:var(--acc-2);font-size:13.5px;font-weight:800;
  background:var(--chip-bg);border:1.5px solid var(--chip-bd)}
.rg-chip--soft{color:var(--txt);background:var(--ghost-bg);border-color:var(--line-2)}
.rg-final-number{position:relative;width:clamp(72px,14vh,104px);aspect-ratio:1;border-radius:50%;display:grid;place-items:center;
  font-family:var(--f-head);font-size:clamp(34px,7vh,52px);font-weight:800;color:var(--ink);background:var(--grad);
  box-shadow:0 0 0 8px rgba(255,94,0,.22),0 0 54px rgba(255,94,0,.7)}
.rg-root[data-theme='light'] .rg-final-number{box-shadow:0 0 0 8px rgba(2,132,199,.2),0 0 54px rgba(2,132,199,.5)}
.rg-final-number::before{content:'';position:absolute;inset:-8px;border-radius:50%;border:2px solid var(--acc-2);animation:rg-ring 2.2s ease-out infinite}
.rg-final-title{font-family:var(--f-head);font-size:clamp(21px,3.8vh,29px);font-weight:800;letter-spacing:-.02em;line-height:1.15;color:var(--txt)}
.rg-summary{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%;max-width:540px}
.rg-tile{display:flex;align-items:center;gap:10px;min-width:0;padding:9px 12px;border-radius:18px;text-align:left;
  background:var(--tile-bg);border:1.5px solid var(--line);color:var(--txt)}
.rg-tile-icon{flex:none;width:34px;height:34px;border-radius:12px;display:grid;place-items:center;background:var(--tile-icon-bg);color:var(--acc-2)}
.rg-tile-text{min-width:0;display:flex;flex-direction:column}
.rg-tile-text small{color:var(--mut);font-size:12px;font-weight:800}
.rg-tile-text strong{display:flex;align-items:center;gap:6px;white-space:normal;font-size:14px;font-weight:800;color:var(--txt);word-break:break-word}
.rg-tile-text img{flex:none;width:18px;height:18px;object-fit:contain}

/* Animaciones */
@keyframes rg-pop{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:none}}
@keyframes rg-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes rg-bubble{from{opacity:0;transform:translateY(8px) scale(.92)}to{opacity:1;transform:none}}
@keyframes rg-spin{from{transform:translate(-50%,-50%) rotate(0)}to{transform:translate(-50%,-50%) rotate(360deg)}}
@keyframes rg-rot{to{transform:rotate(360deg)}}
@keyframes rg-float{to{transform:translate3d(4vmax,3vmax,0) scale(1.12)}}
@keyframes rg-pulse{0%,100%{box-shadow:0 10px 26px -8px rgba(255,94,0,.85),inset 0 1px 0 rgba(255,255,255,.55)}50%{box-shadow:0 10px 40px -2px rgba(255,94,0,1),inset 0 1px 0 rgba(255,255,255,.55)}}
@keyframes rg-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes rg-wave{0%,100%{transform:rotate(-14deg)}50%{transform:rotate(20deg)}}
@keyframes rg-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
@keyframes rg-shine{0%{left:-70%}55%,100%{left:150%}}
@keyframes rg-shimmer{to{background-position:-220% 0}}
@keyframes rg-ring{0%{transform:scale(.9);opacity:.9}100%{transform:scale(1.5);opacity:0}}
@keyframes rg-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
@keyframes rg-fall{0%{transform:translateY(0) rotate(0);opacity:0}10%{opacity:1}100%{transform:translateY(720px) rotate(540deg);opacity:0}}

/* Responsive */
@media (max-height:700px){
  .rg-hero-art{max-height:150px}
  .rg-brand-text small{display:none}
}
@media (max-height:600px){
  .rg-hero{display:none}
}
@media (max-width:860px){
  .rg-card{width:min(100%,600px);height:min(100%,760px)}
  .rg-card-inner{grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr)}
  .rg-aside{flex-direction:row;align-items:center;gap:14px;padding:12px 16px;border-right:0;border-bottom:1.5px solid var(--line)}
  .rg-brand-text,.rg-hero{display:none}
  .rg-logo-img{height:40px}
  .rg-steps{flex:1;flex-direction:row;gap:0}
  .rg-step{flex:1;justify-content:center}
  .rg-step-label{display:none}
  .rg-step:not(:last-child)::after{left:calc(50% + 22px);right:calc(-50% + 22px);top:50%;width:auto;height:2px;transform:translateY(-1px)}
}
@media (max-width:600px){
  .rg-head{padding-right:104px}
  .rg-grid-2{grid-template-columns:1fr}
  .rg-roles,.rg-roles--2{grid-template-columns:1fr}
  .rg-roles .rg-option{flex-direction:row;align-items:center;justify-content:flex-start;min-height:0;padding:12px 16px;gap:14px}
  .rg-option-icon{width:44px;height:44px;flex:none}
  .rg-option-check{top:50%;right:14px;margin-top:-12px}
  .rg-mandos{gap:8px}
  .rg-mando{padding:10px 6px 12px}
  .rg-mando-name{font-size:14px}
  .rg-mando-sub{font-size:12px}
  .rg-league-dropdown-wrap{flex-direction:column;align-items:flex-start;gap:6px}
  .rg-league-select-wrapper{max-width:100%}
  .rg-btn{padding:0 18px}
  .rg-summary{gap:6px}
  .rg-tile{padding:8px 10px;gap:8px}
  .rg-tile-icon{width:30px;height:30px}
}
@media (max-height:720px){
  .rg-head p{font-size:13.5px}
}
@media (max-width:600px) and (max-height:720px){
  .rg-head p{display:none}
  .rg-grid-2 .rg-label{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
  .rg-grid-2 .rg-field{gap:0}
}
@media (max-height:480px){
  .rg-head{display:none}
  .rg-aside{padding-top:8px;padding-bottom:8px}
  .rg-panel{padding-top:12px;padding-bottom:12px}
  .rg-body{overflow-y:auto;scrollbar-width:none}
  .rg-body::-webkit-scrollbar{display:none}
  .rg-stage{height:clamp(110px,34dvh,170px)}
}
@media (prefers-reduced-motion:reduce){
  .rg-root *,.rg-root *::before,.rg-root *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
}
`;
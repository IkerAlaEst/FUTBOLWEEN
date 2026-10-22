import React, { useEffect, useState, useRef } from 'react';
import {
  INITIAL_BRACKET_MATCHES,
  BracketMatch
} from '../../data/tournamentBracketData';
import { getMergedBracket } from '../../services/tournamentService';
import { MatchCard } from '../../components/bracket/MatchCard';
import { MatchDetailsModal } from '../../components/bracket/MatchDetailsModal';
import { SimulationModal } from '../../components/bracket/SimulationModal';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Trophy } from 'lucide-react';
import './classification.css';

export const ClassificationPage: React.FC = () => {
  const { isLight } = useTheme();
  const { user, isReferee } = useAuth();
  const [matches, setMatches] = useState<BracketMatch[]>(INITIAL_BRACKET_MATCHES);
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
  const [simulatingMatch, setSimulatingMatch] = useState<BracketMatch | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const boardRef = useRef<HTMLDivElement>(null);

  const handleArbitrate = (match: BracketMatch) => {
    if (match.status === 'finalizado') return;
    setSimulatingMatch(match);
  };

  // Mitad izquierda estática + mitad derecha desde Supabase (si está configurado).
  const loadBracket = async () => {
    const bracket = await getMergedBracket();
    setMatches(bracket);
  };

  useEffect(() => {
    let alive = true;
    getMergedBracket().then(bracket => {
      if (alive) setMatches(bracket);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Segmentación por rondas y alas
  const octavosLeft = matches.filter(m => m.round === 'octavos' && m.branch === 'left');
  const octavosRight = matches.filter(m => m.round === 'octavos' && m.branch === 'right');
  const cuartosLeft = matches.filter(m => m.round === 'cuartos' && m.branch === 'left');
  const cuartosRight = matches.filter(m => m.round === 'cuartos' && m.branch === 'right');
  const semiLeft = matches.find(m => m.round === 'semis' && m.branch === 'left')!;
  const semiRight = matches.find(m => m.round === 'semis' && m.branch === 'right')!;
  const finalMatch = matches.find(m => m.round === 'final')!;

  const handleScrollToCol = (colId: string, tabKey: string) => {
    setActiveTab(tabKey);
    if (tabKey === 'all') {
      boardRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(colId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  return (
    <div className={`classification-screen ${isLight ? 'light-mode' : 'dark-mode'}`}>
      {/* Selector de ronda interactivo para móviles y tablets */}
      <div className="clf-mobile-nav-bar">
        <button
          type="button"
          className={`clf-round-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleScrollToCol('', 'all')}
        >
          Árbol Completo
        </button>
        <button
          type="button"
          className={`clf-round-tab ${activeTab === 'octavos-left' ? 'active' : ''}`}
          onClick={() => handleScrollToCol('col-octavos-left', 'octavos-left')}
        >
          Octavos A
        </button>
        <button
          type="button"
          className={`clf-round-tab ${activeTab === 'cuartos-left' ? 'active' : ''}`}
          onClick={() => handleScrollToCol('col-cuartos-left', 'cuartos-left')}
        >
          Cuartos A
        </button>
        <button
          type="button"
          className={`clf-round-tab final-tab ${activeTab === 'final' ? 'active' : ''}`}
          onClick={() => handleScrollToCol('col-center-final', 'final')}
        >
          <Trophy size={11} style={{ marginRight: 3, verticalAlign: 'middle', color: '#fbbf24' }} />
          Final (20:00h)
        </button>
        <button
          type="button"
          className={`clf-round-tab ${activeTab === 'cuartos-right' ? 'active' : ''}`}
          onClick={() => handleScrollToCol('col-cuartos-right', 'cuartos-right')}
        >
          Cuartos B
        </button>
        <button
          type="button"
          className={`clf-round-tab ${activeTab === 'octavos-right' ? 'active' : ''}`}
          onClick={() => handleScrollToCol('col-octavos-right', 'octavos-right')}
        >
          Octavos B
        </button>
      </div>

      {/* Tablero completo en árbol simétrico (100% visible en una sola pantalla en Desktop) */}
      <div className="clf-fit-board" ref={boardRef}>
        {/* ========================================================= */}
        {/* LADO IZQUIERDO: OCTAVOS -> CUARTOS -> SEMIFINAL           */}
        {/* Sede: IES Dr. Lluís Simarro                               */}
        {/* ========================================================= */}
        <div className="bracket-col col-octavos left" id="col-octavos-left">
          <div className="col-header-group">
            <span className="col-title">OCTAVOS</span>
            <span className="col-venue-chip">IES Simarro</span>
          </div>
          <div className="col-cards-4">
            <MatchCard match={octavosLeft[0]} onSelect={setSelectedMatch}  onArbitrate={isReferee ? handleArbitrate : undefined} />
            <MatchCard match={octavosLeft[1]} onSelect={setSelectedMatch}  onArbitrate={isReferee ? handleArbitrate : undefined} />
            <MatchCard match={octavosLeft[2]} onSelect={setSelectedMatch}  onArbitrate={isReferee ? handleArbitrate : undefined} />
            <MatchCard match={octavosLeft[3]} onSelect={setSelectedMatch}  onArbitrate={isReferee ? handleArbitrate : undefined} />
          </div>
        </div>

        {/* Conector Octavos -> Cuartos (Izq) */}
        <div className="bracket-connector conn-left-1">
          <div className="conn-header-spacer" />
          <svg className="conn-svg" viewBox="0 0 30 100" preserveAspectRatio="none">
            {/* 1. Resplandor difuso de fondo */}
            <g className="conn-glow-group">
              <path d="M 0 12.5 H 15 V 25 H 30" className="conn-line-glow" vectorEffect="non-scaling-stroke" />
              <path d="M 0 37.5 H 15" className="conn-line-glow" vectorEffect="non-scaling-stroke" />
              <path d="M 0 62.5 H 15 V 75 H 30" className="conn-line-glow" vectorEffect="non-scaling-stroke" />
              <path d="M 0 87.5 H 15" className="conn-line-glow" vectorEffect="non-scaling-stroke" />
            </g>
            {/* 2. Circuito principal nítido */}
            <g className="conn-core-group">
              <path d="M 0 12.5 H 15 V 25 H 30" className="conn-line" vectorEffect="non-scaling-stroke" />
              <path d="M 0 37.5 H 15" className="conn-line" vectorEffect="non-scaling-stroke" />
              <path d="M 0 62.5 H 15 V 75 H 30" className="conn-line" vectorEffect="non-scaling-stroke" />
              <path d="M 0 87.5 H 15" className="conn-line" vectorEffect="non-scaling-stroke" />
            </g>
            {/* 3. Pulso animado de flujo de energía */}
            <g className="conn-pulse-group">
              <path d="M 0 12.5 H 15 V 25 H 30" className="conn-pulse" vectorEffect="non-scaling-stroke" />
              <path d="M 0 37.5 H 15 V 25" className="conn-pulse" vectorEffect="non-scaling-stroke" />
              <path d="M 0 62.5 H 15 V 75 H 30" className="conn-pulse" vectorEffect="non-scaling-stroke" />
              <path d="M 0 87.5 H 15 V 75" className="conn-pulse" vectorEffect="non-scaling-stroke" />
            </g>
            {/* 4. Nodos nexus de conexión circular perfecta */}
            <path d="M 15 25 L 15 25" className="conn-node-dot" vectorEffect="non-scaling-stroke" />
            <path d="M 15 75 L 15 75" className="conn-node-dot" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>

        <div className="bracket-col col-cuartos left" id="col-cuartos-left">
          <div className="col-header-group">
            <span className="col-title">CUARTOS</span>
            <span className="col-venue-chip">IES Simarro</span>
          </div>
          <div className="col-cards-2">
            <MatchCard match={cuartosLeft[0]} onSelect={setSelectedMatch}  onArbitrate={isReferee ? handleArbitrate : undefined} />
            <MatchCard match={cuartosLeft[1]} onSelect={setSelectedMatch}  onArbitrate={isReferee ? handleArbitrate : undefined} />
          </div>
        </div>

        {/* Conector Cuartos -> Semis (Izq) */}
        <div className="bracket-connector conn-left-2">
          <div className="conn-header-spacer" />
          <svg className="conn-svg" viewBox="0 0 30 100" preserveAspectRatio="none">
            <g className="conn-glow-group">
              <path d="M 0 25 H 15 V 50 H 30" className="conn-line-glow" vectorEffect="non-scaling-stroke" />
              <path d="M 0 75 H 15 V 50" className="conn-line-glow" vectorEffect="non-scaling-stroke" />
            </g>
            <g className="conn-core-group">
              <path d="M 0 25 H 15 V 50 H 30" className="conn-line" vectorEffect="non-scaling-stroke" />
              <path d="M 0 75 H 15 V 50" className="conn-line" vectorEffect="non-scaling-stroke" />
            </g>
            <g className="conn-pulse-group">
              <path d="M 0 25 H 15 V 50 H 30" className="conn-pulse" vectorEffect="non-scaling-stroke" />
              <path d="M 0 75 H 15 V 50" className="conn-pulse" vectorEffect="non-scaling-stroke" />
            </g>
            <path d="M 15 50 L 15 50" className="conn-node-dot" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>

        <div className="bracket-col col-semis left" id="col-semis-left">
          <div className="col-header-group">
            <span className="col-title">SEMIFINAL</span>
            <span className="col-venue-chip">IES Simarro</span>
          </div>
          <div className="col-cards-1">
            <MatchCard match={semiLeft} onSelect={setSelectedMatch}  onArbitrate={isReferee ? handleArbitrate : undefined} />
          </div>
        </div>

        {/* Conector Semis -> Gran Final (Izq) */}
        <div className="bracket-connector conn-center-left">
          <div className="conn-header-spacer" />
          <svg className="conn-svg" viewBox="0 0 30 100" preserveAspectRatio="none">
            <path d="M 0 50 H 30" className="conn-line-glow" vectorEffect="non-scaling-stroke" />
            <path d="M 0 50 H 30" className="conn-line" vectorEffect="non-scaling-stroke" />
            <path d="M 0 50 H 30" className="conn-pulse" vectorEffect="non-scaling-stroke" />
            <path d="M 30 50 L 30 50" className="conn-node-dot" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>

        {/* ========================================================= */}
        {/* CENTRO: LA GRAN FINAL Y TROFEO DE XÀTIVA                  */}
        {/* Sede: Castell de Xàtiva · 20:00 h                         */}
        {/* ========================================================= */}
        <div className="bracket-center-trophy-stage" id="col-center-final">
          <div className="center-crest-glow-wrap">
            <div className="center-crest-halo" />
            <img
              src="/emblema.png"
              alt="Trofeo Oficial Clash Footballween"
              className="center-trophy-img"
            />
            <div className="center-trophy-titles">
              <div className="trophy-pill-tag">
                <Trophy size={12} style={{ color: '#fbbf24' }} />
                <span>LA GRAN FINAL</span>
              </div>
              <strong className="center-venue-text">CASTELL DE XÀTIVA</strong>
              <span className="center-time-text">31 de Octubre · 20:00 h</span>
            </div>
          </div>

          <div className="center-final-card-box">
            <MatchCard match={finalMatch} onSelect={setSelectedMatch} isCenterFinal  onArbitrate={isReferee ? handleArbitrate : undefined} />
          </div>
        </div>

        {/* Conector Gran Final -> Semis (Der) */}
        <div className="bracket-connector conn-center-right">
          <div className="conn-header-spacer" />
          <svg className="conn-svg" viewBox="0 0 30 100" preserveAspectRatio="none">
            <path d="M 30 50 H 0" className="conn-line-glow" vectorEffect="non-scaling-stroke" />
            <path d="M 30 50 H 0" className="conn-line" vectorEffect="non-scaling-stroke" />
            <path d="M 30 50 H 0" className="conn-pulse" vectorEffect="non-scaling-stroke" />
            <path d="M 0 50 L 0 50" className="conn-node-dot" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>

        {/* ========================================================= */}
        {/* LADO DERECHO: SEMIFINAL <- CUARTOS <- OCTAVOS             */}
        {/* Sede: IES Dr. Lluís Simarro                               */}
        {/* ========================================================= */}
        <div className="bracket-col col-semis right" id="col-semis-right">
          <div className="col-header-group">
            <span className="col-title">SEMIFINAL</span>
            <span className="col-venue-chip">IES Simarro</span>
          </div>
          <div className="col-cards-1">
            <MatchCard match={semiRight} onSelect={setSelectedMatch}  onArbitrate={isReferee ? handleArbitrate : undefined} />
          </div>
        </div>

        {/* Conector Semis -> Cuartos (Der) */}
        <div className="bracket-connector conn-right-2">
          <div className="conn-header-spacer" />
          <svg className="conn-svg" viewBox="0 0 30 100" preserveAspectRatio="none">
            <g className="conn-glow-group">
              <path d="M 30 25 H 15 V 50 H 0" className="conn-line-glow" vectorEffect="non-scaling-stroke" />
              <path d="M 30 75 H 15 V 50" className="conn-line-glow" vectorEffect="non-scaling-stroke" />
            </g>
            <g className="conn-core-group">
              <path d="M 30 25 H 15 V 50 H 0" className="conn-line" vectorEffect="non-scaling-stroke" />
              <path d="M 30 75 H 15 V 50" className="conn-line" vectorEffect="non-scaling-stroke" />
            </g>
            <g className="conn-pulse-group">
              <path d="M 30 25 H 15 V 50 H 0" className="conn-pulse" vectorEffect="non-scaling-stroke" />
              <path d="M 30 75 H 15 V 50" className="conn-pulse" vectorEffect="non-scaling-stroke" />
            </g>
            <path d="M 15 50 L 15 50" className="conn-node-dot" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>

        <div className="bracket-col col-cuartos right" id="col-cuartos-right">
          <div className="col-header-group">
            <span className="col-title">CUARTOS</span>
            <span className="col-venue-chip">IES Simarro</span>
          </div>
          <div className="col-cards-2">
            <MatchCard match={cuartosRight[0]} onSelect={setSelectedMatch}  onArbitrate={isReferee ? handleArbitrate : undefined} />
            <MatchCard match={cuartosRight[1]} onSelect={setSelectedMatch}  onArbitrate={isReferee ? handleArbitrate : undefined} />
          </div>
        </div>

        {/* Conector Cuartos -> Octavos (Der) */}
        <div className="bracket-connector conn-right-1">
          <div className="conn-header-spacer" />
          <svg className="conn-svg" viewBox="0 0 30 100" preserveAspectRatio="none">
            <g className="conn-glow-group">
              <path d="M 30 12.5 H 15 V 25 H 0" className="conn-line-glow" vectorEffect="non-scaling-stroke" />
              <path d="M 30 37.5 H 15" className="conn-line-glow" vectorEffect="non-scaling-stroke" />
              <path d="M 30 62.5 H 15 V 75 H 0" className="conn-line-glow" vectorEffect="non-scaling-stroke" />
              <path d="M 30 87.5 H 15" className="conn-line-glow" vectorEffect="non-scaling-stroke" />
            </g>
            <g className="conn-core-group">
              <path d="M 30 12.5 H 15 V 25 H 0" className="conn-line" vectorEffect="non-scaling-stroke" />
              <path d="M 30 37.5 H 15" className="conn-line" vectorEffect="non-scaling-stroke" />
              <path d="M 30 62.5 H 15 V 75 H 0" className="conn-line" vectorEffect="non-scaling-stroke" />
              <path d="M 30 87.5 H 15" className="conn-line" vectorEffect="non-scaling-stroke" />
            </g>
            <g className="conn-pulse-group">
              <path d="M 30 12.5 H 15 V 25 H 0" className="conn-pulse" vectorEffect="non-scaling-stroke" />
              <path d="M 30 37.5 H 15 V 25" className="conn-pulse" vectorEffect="non-scaling-stroke" />
              <path d="M 30 62.5 H 15 V 75 H 0" className="conn-pulse" vectorEffect="non-scaling-stroke" />
              <path d="M 30 87.5 H 15 V 75" className="conn-pulse" vectorEffect="non-scaling-stroke" />
            </g>
            <path d="M 15 25 L 15 25" className="conn-node-dot" vectorEffect="non-scaling-stroke" />
            <path d="M 15 75 L 15 75" className="conn-node-dot" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>

        <div className="bracket-col col-octavos right" id="col-octavos-right">
          <div className="col-header-group">
            <span className="col-title">OCTAVOS</span>
            <span className="col-venue-chip">IES Simarro</span>
          </div>
          <div className="col-cards-4">
            <MatchCard match={octavosRight[0]} onSelect={setSelectedMatch}  onArbitrate={isReferee ? handleArbitrate : undefined} />
            <MatchCard match={octavosRight[1]} onSelect={setSelectedMatch}  onArbitrate={isReferee ? handleArbitrate : undefined} />
            <MatchCard match={octavosRight[2]} onSelect={setSelectedMatch}  onArbitrate={isReferee ? handleArbitrate : undefined} />
            <MatchCard match={octavosRight[3]} onSelect={setSelectedMatch}  onArbitrate={isReferee ? handleArbitrate : undefined} />
          </div>
        </div>
      </div>

      {/* 3. Modal de Estadísticas del Partido (Imagen 2) */}
      {selectedMatch && (
        <MatchDetailsModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}

      {/* 4. Acta oficial del árbitro: simulación en directo y guardado en Supabase */}
      {simulatingMatch && (
        <SimulationModal
          key={simulatingMatch.id}
          match={simulatingMatch}
          onClose={() => setSimulatingMatch(null)}
          onFinished={async () => {
            await loadBracket();
          }}
        />
      )}
    </div>
  );
};

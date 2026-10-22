import React from 'react';

interface ClubShieldSvgProps {
  clubId?: string;
  size?: number;
  className?: string;
}

export const ClubShieldSvg: React.FC<ClubShieldSvgProps> = ({
  clubId = '',
  size = 24,
  className = ''
}) => {
  const s = size;

  switch (clubId.toLowerCase()) {
    // 1. VALENCIA CF (Murciélago, franjas senyera y balón)
    case 'valencia':
    case 'val':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100" className={className} style={{ flexShrink: 0 }}>
          <defs>
            <linearGradient id="vcf-gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          {/* Murciélago negro en la corona */}
          <path d="M 50 14 Q 38 6 22 18 Q 30 22 36 28 Q 44 26 50 30 Q 56 26 64 28 Q 70 22 78 18 Q 62 6 50 14 Z" fill="#0f172a" />
          {/* Cuerpo del escudo */}
          <path d="M 24 28 L 76 28 L 76 60 Q 76 88 50 96 Q 24 88 24 60 Z" fill="url(#vcf-gold)" stroke="#0f172a" strokeWidth="3" />
          {/* Franjas rojas */}
          <rect x="34" y="28" width="8" height="50" fill="#dc2626" />
          <rect x="58" y="28" width="8" height="50" fill="#dc2626" />
          {/* Franja azul superior */}
          <rect x="24" y="28" width="52" height="12" fill="#0284c7" />
          {/* Balón central */}
          <circle cx="50" cy="62" r="14" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
          <path d="M 50 56 L 55 60 L 53 66 L 47 66 L 45 60 Z" fill="#0f172a" />
        </svg>
      );

    // 2. REAL MADRID (Corona real, círculo dorado y banda diagonal morada)
    case 'madrid':
    case 'rma':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100" className={className} style={{ flexShrink: 0 }}>
          {/* Corona Real */}
          <path d="M 32 24 L 38 12 L 50 20 L 62 12 L 68 24 Q 50 20 32 24 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />
          <circle cx="38" cy="11" r="2.5" fill="#ef4444" />
          <circle cx="50" cy="19" r="3" fill="#ffffff" />
          <circle cx="62" cy="11" r="2.5" fill="#ef4444" />
          {/* Círculo base blanco y oro */}
          <circle cx="50" cy="58" r="34" fill="#ffffff" stroke="#f59e0b" strokeWidth="4.5" />
          {/* Banda diagonal morada */}
          <clipPath id="rma-clip">
            <circle cx="50" cy="58" r="31" />
          </clipPath>
          <g clipPath="url(#rma-clip)">
            <polygon points="20 40, 80 84, 70 94, 10 50" fill="#7c3aed" />
            {/* Letras MFC entrelazadas */}
            <circle cx="50" cy="58" r="16" fill="none" stroke="#f59e0b" strokeWidth="3" />
            <text x="50" y="63" textAnchor="middle" fill="#f59e0b" fontSize="14" fontWeight="900" fontFamily="Space Grotesk, sans-serif">M</text>
          </g>
        </svg>
      );

    // 3. FC BARCELONA (Cruz de Sant Jordi, Senyera y barras blaugranas)
    case 'barcelona':
    case 'bar':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100" className={className} style={{ flexShrink: 0 }}>
          {/* Silueta escudo Barça */}
          <path d="M 22 22 L 78 22 Q 80 45 74 65 Q 64 88 50 96 Q 36 88 26 65 Q 20 45 22 22 Z" fill="#ffffff" stroke="#f59e0b" strokeWidth="3.5" />
          <clipPath id="fcb-clip">
            <path d="M 22 22 L 78 22 Q 80 45 74 65 Q 64 88 50 96 Q 36 88 26 65 Q 20 45 22 22 Z" />
          </clipPath>
          <g clipPath="url(#fcb-clip)">
            {/* Cruz Sant Jordi (arriba izquierda) */}
            <rect x="22" y="22" width="28" height="26" fill="#ffffff" />
            <rect x="33" y="22" width="6" height="26" fill="#dc2626" />
            <rect x="22" y="32" width="28" height="6" fill="#dc2626" />
            {/* Senyera (arriba derecha) */}
            <rect x="50" y="22" width="28" height="26" fill="#fbbf24" />
            <rect x="56" y="22" width="4" height="26" fill="#dc2626" />
            <rect x="66" y="22" width="4" height="26" fill="#dc2626" />
            {/* Franja dorada separadora */}
            <rect x="22" y="46" width="56" height="4" fill="#f59e0b" />
            {/* Franjas blaugranas inferiores */}
            <rect x="22" y="50" width="56" height="46" fill="#004d98" />
            <rect x="32" y="50" width="9" height="46" fill="#a50044" />
            <rect x="51" y="50" width="9" height="46" fill="#a50044" />
            <rect x="69" y="50" width="9" height="46" fill="#a50044" />
            {/* Balón dorado central */}
            <circle cx="50" cy="70" r="10" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
          </g>
        </svg>
      );

    // 4. ATLÉTICO DE MADRID (Oso y Madroño, 7 estrellas y franjas rojiblancas)
    case 'atletico':
    case 'atm':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100" className={className} style={{ flexShrink: 0 }}>
          <path d="M 22 20 L 78 20 L 78 55 Q 78 88 50 96 Q 22 88 22 55 Z" fill="#ffffff" stroke="#0284c7" strokeWidth="3" />
          <clipPath id="atm-clip">
            <path d="M 22 20 L 78 20 L 78 55 Q 78 88 50 96 Q 22 88 22 55 Z" />
          </clipPath>
          <g clipPath="url(#atm-clip)">
            {/* Franjas rojiblancas */}
            <rect x="22" y="44" width="56" height="52" fill="#ffffff" />
            <rect x="30" y="44" width="8" height="52" fill="#ef4444" />
            <rect x="46" y="44" width="8" height="52" fill="#ef4444" />
            <rect x="62" y="44" width="8" height="52" fill="#ef4444" />
            {/* Parte superior azul con oso y madroño */}
            <path d="M 22 20 L 50 20 L 50 44 L 22 44 Z" fill="#0369a1" />
            <circle cx="36" cy="32" r="6" fill="#22c55e" />
            <path d="M 33 34 L 38 34 L 38 42 L 33 42 Z" fill="#78350f" />
            {/* Estrellas */}
            <rect x="50" y="20" width="28" height="24" fill="#0369a1" />
            <circle cx="56" cy="26" r="1.8" fill="#ffffff" />
            <circle cx="64" cy="26" r="1.8" fill="#ffffff" />
            <circle cx="72" cy="26" r="1.8" fill="#ffffff" />
            <circle cx="60" cy="36" r="1.8" fill="#ffffff" />
            <circle cx="68" cy="36" r="1.8" fill="#ffffff" />
          </g>
        </svg>
      );

    // 5. MANCHESTER CITY (Barco navegante y Rosa Roja en círculo azul cielo)
    case 'mancity':
    case 'mci':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100" className={className} style={{ flexShrink: 0 }}>
          <circle cx="50" cy="50" r="44" fill="#ffffff" stroke="#6cabdd" strokeWidth="6" />
          <circle cx="50" cy="50" r="35" fill="#6cabdd" />
          {/* Escudo interior */}
          <path d="M 34 32 L 66 32 L 66 54 Q 66 70 50 76 Q 34 70 34 54 Z" fill="#ffffff" stroke="#1c2c5b" strokeWidth="2" />
          {/* Barco dorado */}
          <path d="M 40 44 L 60 44 L 56 49 L 44 49 Z" fill="#fbbf24" />
          <path d="M 49 36 L 55 42 L 49 42 Z" fill="#ffffff" stroke="#1c2c5b" strokeWidth="1" />
          {/* Rosa roja Lancashire */}
          <circle cx="50" cy="62" r="5" fill="#ef4444" stroke="#1c2c5b" strokeWidth="1" />
        </svg>
      );

    // 6. ARSENAL (Cañón dorado histórico en escudo rojo carmesí)
    case 'arsenal':
    case 'ars':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100" className={className} style={{ flexShrink: 0 }}>
          <path d="M 24 18 L 76 18 Q 80 50 74 72 Q 62 92 50 96 Q 38 92 26 72 Q 20 50 24 18 Z" fill="#dc2626" stroke="#023474" strokeWidth="4" />
          {/* Cañón dorado apuntando al este */}
          <ellipse cx="40" cy="62" rx="10" ry="10" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
          <circle cx="40" cy="62" r="4" fill="#ffffff" />
          {/* Tubo del cañón */}
          <polygon points="36 54, 74 48, 73 54, 38 58" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
          {/* Rueda frontal */}
          <ellipse cx="62" cy="64" rx="7" ry="7" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
        </svg>
      );

    // 7. BAYERN MÜNCHEN (Rombo bávaro azul/blanco y anillo rojo)
    case 'bayern':
    case 'bay':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100" className={className} style={{ flexShrink: 0 }}>
          <circle cx="50" cy="50" r="44" fill="#dc2626" stroke="#ffffff" strokeWidth="3" />
          <circle cx="50" cy="50" r="32" fill="#0066b2" stroke="#ffffff" strokeWidth="3" />
          <clipPath id="bayern-clip">
            <circle cx="50" cy="50" r="29" />
          </clipPath>
          <g clipPath="url(#bayern-clip)">
            {/* Rombos bávaros en diagonal */}
            <rect x="15" y="15" width="70" height="70" fill="#0284c7" />
            <polygon points="20 20, 45 45, 20 70" fill="#ffffff" />
            <polygon points="45 20, 70 45, 45 70" fill="#ffffff" />
            <polygon points="55 10, 80 35, 55 60" fill="#ffffff" />
            <polygon points="70 20, 95 45, 70 70" fill="#ffffff" />
          </g>
          <text x="50" y="24" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">FC BAYERN</text>
        </svg>
      );

    // 8. LIVERPOOL (Liver Bird mítico sobre escudo rojo)
    case 'liverpool':
    case 'liv':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100" className={className} style={{ flexShrink: 0 }}>
          <path d="M 22 20 L 78 20 L 76 64 Q 74 88 50 96 Q 26 88 24 64 Z" fill="#c8102e" stroke="#00b2a9" strokeWidth="3.5" />
          {/* Liver Bird dorado */}
          <path d="M 50 36 Q 56 30 62 36 Q 58 44 54 46 Q 56 56 64 62 Q 56 62 50 56 Q 44 62 36 62 Q 44 56 46 46 Q 42 44 38 36 Q 44 30 50 36 Z" fill="#fbbf24" stroke="#78350f" strokeWidth="1" />
          {/* Rama de alga en el pico */}
          <path d="M 56 34 Q 66 32 68 38" fill="none" stroke="#22c55e" strokeWidth="2" />
          <circle cx="50" cy="74" r="6" fill="#fbbf24" />
        </svg>
      );

    // 9. INTER DE MILÁN (Monograma IM en azul y negro)
    case 'inter':
    case 'int':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100" className={className} style={{ flexShrink: 0 }}>
          <circle cx="50" cy="50" r="44" fill="#0068a8" stroke="#000000" strokeWidth="4" />
          <circle cx="50" cy="50" r="36" fill="#000000" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="#0068a8" strokeWidth="3" />
          {/* Letras IM entrelazadas */}
          <text x="50" y="58" textAnchor="middle" fill="#ffffff" fontSize="24" fontWeight="900" fontFamily="Space Grotesk, sans-serif">IM</text>
        </svg>
      );

    // 10. PARIS SAINT-GERMAIN (Torre Eiffel roja y flor de lis dorada)
    case 'psg':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100" className={className} style={{ flexShrink: 0 }}>
          <circle cx="50" cy="50" r="44" fill="#004170" stroke="#da291c" strokeWidth="4" />
          <circle cx="50" cy="50" r="35" fill="#ffffff" />
          <circle cx="50" cy="50" r="32" fill="#004170" />
          {/* Torre Eiffel */}
          <path d="M 50 26 L 47 48 L 44 68 L 56 68 L 53 48 Z" fill="#da291c" />
          <path d="M 43 56 Q 50 50 57 56" fill="none" stroke="#da291c" strokeWidth="2.5" />
          {/* Flor de lis dorada abajo */}
          <path d="M 50 72 Q 47 67 50 63 Q 53 67 50 72 Z" fill="#fbbf24" />
        </svg>
      );

    // 11. AC MILAN (Óvalo con franjas rossoneras y cruz de San Ambrosio)
    case 'milan':
    case 'mil':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100" className={className} style={{ flexShrink: 0 }}>
          <ellipse cx="50" cy="50" rx="34" ry="44" fill="#ffffff" stroke="#000000" strokeWidth="4" />
          <clipPath id="milan-clip">
            <ellipse cx="50" cy="50" rx="30" ry="40" />
          </clipPath>
          <g clipPath="url(#milan-clip)">
            {/* Lado izquierdo: Franjas rojas y negras */}
            <rect x="20" y="10" width="30" height="80" fill="#000000" />
            <rect x="25" y="10" width="7" height="80" fill="#fb090b" />
            <rect x="38" y="10" width="7" height="80" fill="#fb090b" />
            {/* Lado derecho: Cruz roja en fondo blanco */}
            <rect x="50" y="10" width="30" height="80" fill="#ffffff" />
            <rect x="62" y="10" width="6" height="80" fill="#fb090b" />
            <rect x="50" y="47" width="30" height="6" fill="#fb090b" />
          </g>
          {/* Estrella dorada superior */}
          <polygon points="50 8, 52 14, 58 14, 53 18, 55 24, 50 20, 45 24, 47 18, 42 14, 48 14" fill="#fbbf24" />
        </svg>
      );

    // 12. JUVENTUS (Doble J monocromática moderna)
    case 'juventus':
    case 'juv':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100" className={className} style={{ flexShrink: 0 }}>
          <path d="M 24 16 L 76 16 L 76 60 Q 76 86 50 94 Q 24 86 24 60 Z" fill="#000000" stroke="#ffffff" strokeWidth="3" />
          {/* Doble JJ blanca */}
          <path d="M 44 26 L 44 58 Q 44 68 36 68 Q 30 68 30 62" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />
          <path d="M 64 26 L 64 64 Q 64 78 52 78 Q 44 78 44 70" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />
        </svg>
      );

    // 13. BORUSSIA DORTMUND (BVB 09 en amarillo y negro)
    case 'dortmund':
    case 'bvb':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100" className={className} style={{ flexShrink: 0 }}>
          <circle cx="50" cy="50" r="44" fill="#fde100" stroke="#000000" strokeWidth="5" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="#000000" strokeWidth="2" />
          <text x="50" y="58" textAnchor="middle" fill="#000000" fontSize="22" fontWeight="900" fontFamily="Space Grotesk, sans-serif">BVB</text>
          <text x="50" y="74" textAnchor="middle" fill="#000000" fontSize="12" fontWeight="800">09</text>
        </svg>
      );

    // 14. CHELSEA (León rampante azul con cetro sobre círculo)
    case 'chelsea':
    case 'che':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100" className={className} style={{ flexShrink: 0 }}>
          <circle cx="50" cy="50" r="44" fill="#034694" stroke="#d1ab3e" strokeWidth="4" />
          <circle cx="50" cy="50" r="35" fill="#ffffff" />
          {/* León heráldico azul */}
          <path d="M 48 32 Q 56 28 60 34 Q 54 40 50 42 Q 58 48 62 58 Q 54 58 50 52 Q 46 58 40 64 Q 44 54 46 48 Z" fill="#034694" />
          {/* Cetro dorado */}
          <line x1="56" y1="34" x2="66" y2="64" stroke="#d1ab3e" strokeWidth="3" />
        </svg>
      );

    // 15. VILLARREAL (Submarino Amarillo con corona y barras senyera)
    case 'villarreal':
    case 'vil':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100" className={className} style={{ flexShrink: 0 }}>
          {/* Corona */}
          <polygon points="32 20, 38 12, 50 18, 62 12, 68 20" fill="#f59e0b" stroke="#00519e" strokeWidth="1.5" />
          {/* Escudo amarillo */}
          <path d="M 26 22 L 74 22 L 74 60 Q 74 86 50 94 Q 26 86 26 60 Z" fill="#ffe667" stroke="#00519e" strokeWidth="3.5" />
          {/* Barras rojas senyera */}
          <rect x="36" y="22" width="6" height="50" fill="#ef4444" />
          <rect x="47" y="22" width="6" height="56" fill="#ef4444" />
          <rect x="58" y="22" width="6" height="50" fill="#ef4444" />
          {/* Banda azul triangular */}
          <polygon points="26 22, 50 44, 74 22" fill="#00519e" />
        </svg>
      );

    // 16. TOTTENHAM HOTSPUR (Gallo de pelea sobre balón histórico)
    case 'tottenham':
    case 'tot':
      return (
        <svg width={s} height={s} viewBox="0 0 100 100" className={className} style={{ flexShrink: 0 }}>
          <circle cx="50" cy="50" r="44" fill="#ffffff" stroke="#132257" strokeWidth="4" />
          {/* Gallo erguido */}
          <path d="M 48 20 Q 56 16 58 24 Q 52 28 50 34 Q 56 38 58 50 Q 52 54 48 48 Q 46 54 44 64 L 52 64" fill="#132257" stroke="#132257" strokeWidth="2" strokeLinecap="round" />
          {/* Balón vintage */}
          <circle cx="50" cy="74" r="10" fill="#ffffff" stroke="#132257" strokeWidth="2" />
          <line x1="43" y1="74" x2="57" y2="74" stroke="#132257" strokeWidth="1.5" />
          <line x1="50" y1="67" x2="50" y2="81" stroke="#132257" strokeWidth="1.5" />
        </svg>
      );

    default:
      return (
        <svg width={s} height={s} viewBox="0 0 100 100" className={className} style={{ flexShrink: 0 }}>
          <circle cx="50" cy="50" r="40" fill="#334155" stroke="#94a3b8" strokeWidth="3" />
          <text x="50" y="58" textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="800">CF</text>
        </svg>
      );
  }
};


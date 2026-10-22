import React, { useState, useEffect, useRef } from 'react';
import {
  Scale,
  Clock,
  MapPin,
  Gamepad2,
  Trophy,
  ShieldCheck,
  Sparkles,
  Send,
  X,
  RefreshCw,
  Languages,
  HelpCircle,
  ChevronRight,
  Smile,
  Sun,
  Coffee,
  Heart
} from 'lucide-react';
import { useModal } from '../../context/ModalContext';
import { useTheme } from '../../context/ThemeContext';
import { navigateTo, useHashRoute } from '../../hooks/useHashRoute';
import { ModalKey } from '../../types/common';
import './pumpkinChatbot.css';

/**
 * Calabaza saludando: SVG fiel al 100% de la pantalla de inicio de sesión
 */
export const WavingPumpkinAvatar: React.FC<{ size?: number; className?: string }> = ({
  size = 76,
  className = ''
}) => (
  <svg
    className={`rg-pumpkin ${className}`}
    viewBox="-14 0 228 218"
    role="img"
    aria-label="Calabaza saludando"
    style={{ width: size, height: 'auto' }}
  >
    <ellipse cx="100" cy="206" rx="54" ry="8" fill="rgba(0,0,0,.32)" />
    <g className="rg-pk-body">
      {/* pies */}
      <ellipse cx="72" cy="194" rx="18" ry="10" fill="#d9560a" className="rg-pk-foot-left" />
      <ellipse cx="128" cy="194" rx="18" ry="10" fill="#d9560a" className="rg-pk-foot-right" />

      {/* brazo izquierdo */}
      <path d="M24 130 C6 142 6 160 12 170" fill="none" stroke="#ec6a0c" strokeWidth="13" strokeLinecap="round" className="rg-pk-arm-left" />
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

export type ChatLang = 'es' | 'en';

export interface RichAnswer {
  title: string;
  topicIcon:
    | 'rules'
    | 'schedule'
    | 'venues'
    | 'setup'
    | 'prizes'
    | 'referees'
    | 'bracket'
    | 'tricks'
    | 'help'
    | 'time'
    | 'mood'
    | 'joke'
    | 'weather'
    | 'food'
    | 'thanks';
  points: string[];
  actionLabel?: string;
  actionModalKey?: ModalKey;
  actionRoute?: string;
  suggestions?: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text?: string;
  rich?: RichAnswer;
  timestamp: string;
}

/**
 * Motor de intención con coincidencia de subcadenas tolerante a ruido
 * (ej: "idffinormasjrrj" detecta "normas", "que hora es" da la hora real, etc.)
 */
function processUserQuery(rawInput: string, currentLang: ChatLang): { answer: RichAnswer; detectedLang: ChatLang } {
  const clean = rawInput
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // Detección de idioma preferente según palabras en inglés
  const isEnglishQuery =
    /(what|where|when|rule|rules|schedule|time|prize|prizes|controller|hello|hi|how|english|match|matches|referee|thank|joke|weather)/i.test(clean) &&
    !/(norma|horari|sede|mando|premio|gracias|buen|hola|donde|cuando|chiste|clima)/i.test(clean);

  const lang: ChatLang = isEnglishQuery ? 'en' : currentLang;

  // 1. HORA ACTUAL / CURRENT TIME
  if (/(que\s*hora\s*es|que\s*horas\s*son|hora\s*actual|tienes\s*hora|dime\s*la\s*hora|what\s*time\s*is\s*it|current\s*time|time\s*now)/i.test(clean)) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (lang === 'en') {
      return {
        detectedLang: 'en',
        answer: {
          title: `Current Time in Xàtiva · ${timeStr}`,
          topicIcon: 'time',
          points: [
            `Right now it is ${timeStr} (${dateStr}).`,
            'Tournament matches start at 16:00h and the Grand Final is at 20:00h in the Castle.',
            'You can check the schedule of every match on the Classification board.'
          ],
          actionLabel: 'View Schedule in Bracket',
          actionRoute: 'clasificacion',
          suggestions: ['Schedule', 'Rules', 'Venues', 'How are you?']
        }
      };
    }
    return {
      detectedLang: 'es',
      answer: {
        title: `Reloj Oficial de Xàtiva · ${timeStr}`,
        topicIcon: 'time',
        points: [
          `Son exactamente las ${timeStr} del ${dateStr}.`,
          'Los partidos del torneo se disputan de 16:00h a 20:30h (¡Gran Final a las 20:00h en el Castell!).',
          '¡El silbato arbitral no espera a nadie! Puedes consultar el estado en directo en el cuadro.'
        ],
        actionLabel: 'Ver Horarios en Clasificación',
        actionRoute: 'clasificacion',
        suggestions: ['Horarios', 'Normas', 'Sedes', '¿Cómo estás?']
      }
    };
  }

  // 2. CÓMO ESTÁS / HOW ARE YOU / QUÉ TAL
  if (/(como\s*estas|como\s*te\s*va|que\s*tal|como\s*andas|todo\s*bien|how\s*are\s*you|how\s*are\s*u|hows\s*it\s*going|how\s*do\s*you\s*feel)/i.test(clean)) {
    if (lang === 'en') {
      return {
        detectedLang: 'en',
        answer: {
          title: "I'm doing fantastic & feeling spooky!",
          topicIcon: 'mood',
          points: [
            "I'm feeling great! Waving at all players and visitors from the bottom-right corner.",
            'Excited for the Clash Footballween matches here in Xàtiva.',
            'How are you doing today? Ready to check out the matches or the 3D tricks?'
          ],
          suggestions: ['What time is it?', 'Rules', 'Schedule', 'Tell me a joke']
        }
      };
    }
    return {
      detectedLang: 'es',
      answer: {
        title: '¡Estoy de maravilla y lleno de energía!',
        topicIcon: 'mood',
        points: [
          '¡De lujo! Aquí sigo saludando y animando el torneo desde mi rincón en Xàtiva.',
          'Con muchas ganas de ver los partidazos de Clash Footballween 2026.',
          '¿Y tú qué tal? ¿Preparado para ganar el torneo o animar a tu club favorito?'
        ],
        suggestions: ['¿Qué hora es?', 'Normas', 'Horarios', 'Cuéntame un chiste']
      }
    };
  }

  // 3. QUIÉN ERES / CÓMO TE LLAMAS / WHO ARE YOU
  if (/(quien\s*eres|como\s*te\s*llamas|cual\s*es\s*tu\s*nombre|tu\s*nombre|who\s*are\s*you|whats\s*your\s*name|who\s*made\s*you)/i.test(clean)) {
    if (lang === 'en') {
      return {
        detectedLang: 'en',
        answer: {
          title: 'I am Pumky, your Official Assistant!',
          topicIcon: 'help',
          points: [
            'I am the official pumpkin mascot of Clash Footballween 2026.',
            'I live right here in the corner of your screen, ready to help you with tournament rules, schedules, venues, and easter eggs.'
          ],
          suggestions: ['Rules', 'Schedule', 'Venues', 'Controllers']
        }
      };
    }
    return {
      detectedLang: 'es',
      answer: {
        title: '¡Soy Calabacín, el Asistente Oficial!',
        topicIcon: 'help',
        points: [
          '¡Mucho gusto! Soy la calabaza mascota y guía oficial de Clash Footballween 2026.',
          'Vivo aquí en la esquinita de tu pantalla para responderte cualquier duda del torneo: normas, horarios, sedes, mandos y trucos secretos.'
        ],
        suggestions: ['Normas', 'Horarios', 'Sedes', 'Mandos', 'Trucos 3D']
      }
    };
  }

  // 4. CHISTES / JOKES
  if (/(chiste|joke|broma|cuentame\s*un\s*chiste|tell\s*me\s*a\s*joke|hazme\s*reir)/i.test(clean)) {
    if (lang === 'en') {
      return {
        detectedLang: 'en',
        answer: {
          title: 'A Spooky Football Joke!',
          topicIcon: 'joke',
          points: [
            'Why are pumpkins and ghosts terrible goalkeepers?',
            'Because every time a shot comes in, it goes right through their pumpkin patch!',
            'And what is a vampire\'s favorite part of football? The corner bites!'
          ],
          suggestions: ['Rules', 'Schedule', '3D Tricks']
        }
      };
    }
    return {
      detectedLang: 'es',
      answer: {
        title: '¡Un chiste de fútbol y Halloween!',
        topicIcon: 'joke',
        points: [
          '¿Por qué los fantasmas nunca juegan de porteros en Xàtiva?',
          '¡Porque los balones siempre les atraviesan la red!',
          '¿Y qué jugador de fútbol asusta más en el área? ¡El delantero vampiro, porque le encanta clavar los colmillos en la escuadra!'
        ],
        suggestions: ['Normas', 'Horarios', 'Premios', 'Trucos 3D']
      }
    };
  }

  // 5. CLIMA / TIEMPO EN XÀTIVA / WEATHER
  if (/(que\s*tiempo\s*hace|clima|llueve|hace\s*frio|hace\s*calor|temperatura|weather|is\s*it\s*raining)/i.test(clean)) {
    if (lang === 'en') {
      return {
        detectedLang: 'en',
        answer: {
          title: 'Weather in Xàtiva · Tournament Evening',
          topicIcon: 'weather',
          points: [
            'Pleasant 18°C with clear skies and a gentle Mediterranean evening breeze.',
            'Perfect conditions both inside the Simarro sports hall and atop the castle walls.',
            'Recommendation: Bring a hoodie or jacket for the outdoor Grand Final at the castle!'
          ],
          suggestions: ['Venues', 'Schedule', 'Rules']
        }
      };
    }
    return {
      detectedLang: 'es',
      answer: {
        title: 'El Tiempo en Xàtiva · Tarde-Noche del Torneo',
        topicIcon: 'weather',
        points: [
          'Temperatura agradable de unos 18°C, cielo despejado y brisa mediterránea perfecta para jugar.',
          'Condiciones inmejorables tanto en el pabellón cubierto del Simarro como en las almenas del Castell.',
          'Consejo: Para la Gran Final de las 20:00h en el castillo, ¡llévate una chaqueta que refresca arriba en la montaña!'
        ],
        suggestions: ['Sedes', 'Horarios', 'Normas']
      }
    };
  }

  // 6. COMIDA / BEBIDA / FOOD & DRINKS
  if (/(comida|comer|beber|bebida|hambre|sed|food|drink|cenar|restaurante|snack)/i.test(clean)) {
    if (lang === 'en') {
      return {
        detectedLang: 'en',
        answer: {
          title: 'Food, Drinks & Concessions',
          topicIcon: 'food',
          points: [
            'Food truck zone: Fresh sandwiches, burgers, hot chocolate, soft drinks, and roasted chestnuts.',
            'Available both in the Simarro courtyard and outside the Castle ramparts.',
            'Free water points available for all tournament participants.'
          ],
          suggestions: ['Venues', 'Schedule', 'Rules']
        }
      };
    }
    return {
      detectedLang: 'es',
      answer: {
        title: 'Comida, Bebidas y Food Trucks',
        topicIcon: 'food',
        points: [
          'Zona de restauración: Food trucks oficiales con bocadillos calientes, hamburguesas, refrescos y castañas asadas de otoño.',
          'Puntos de comida ubicados tanto en el patio del Simarro como en la explanada de la entrada del Castell.',
          'Puntos de agua gratuitos para todos los jugadores participantes.'
        ],
        suggestions: ['Sedes', 'Horarios', 'Premios']
      }
    };
  }

  // 7. GRACIAS / THANK YOU
  if (/(gracias|muchas\s*gracias|thank|thanks|thank\s*you)/i.test(clean)) {
    if (lang === 'en') {
      return {
        detectedLang: 'en',
        answer: {
          title: "You're very welcome!",
          topicIcon: 'thanks',
          points: [
            'Always happy to help you navigate Clash Footballween 2026.',
            'If you have any other questions or want to know 3D tricks, just ask!'
          ],
          suggestions: ['Rules', 'Schedule', '3D Tricks']
        }
      };
    }
    return {
      detectedLang: 'es',
      answer: {
        title: '¡De nada! ¡Un auténtico placer!',
        topicIcon: 'thanks',
        points: [
          '¡Para eso estamos! Disfruta al máximo del torneo y pásalo en grande.',
          'Si necesitas saber algo más sobre normas, partidos o trucos, aquí seguiré saludando.'
        ],
        suggestions: ['Normas', 'Horarios', 'Premios', 'Trucos 3D']
      }
    };
  }

  // 8. ADIÓS / BYE
  if (/(adios|hasta\s*luego|chao|nos\s*vemos|bye|goodbye|see\s*you|cya)/i.test(clean)) {
    if (lang === 'en') {
      return {
        detectedLang: 'en',
        answer: {
          title: 'See you on the pitch!',
          topicIcon: 'help',
          points: [
            'Have a wonderful time! See you at 20:00h at the Castle of Xàtiva for the Grand Final.',
            'I will be right here waving whenever you need me!'
          ],
          suggestions: ['Rules', 'Schedule', 'Venues']
        }
      };
    }
    return {
      detectedLang: 'es',
      answer: {
        title: '¡Hasta luego! ¡Nos vemos en el campo!',
        topicIcon: 'help',
        points: [
          '¡Que vaya genial! Nos vemos a las 20:00h en el Castell de Xàtiva para la Gran Final.',
          '¡Aquí seguiré saludándote siempre que quieras!'
        ],
        suggestions: ['Normas', 'Horarios', 'Sedes']
      }
    };
  }

  // 9. NORMAS / REGLAS / RULES (admite "idffinormasjrrj", "reglas", "penaltis", etc.)
  if (/(norma|regla|rule|fairplay|fair\s*play|penalt|prorroga|duracion|formato|tarjeta|amarilla|roja|tiempo\s*de\s*juego)/i.test(clean)) {
    if (lang === 'en') {
      return {
        detectedLang: 'en',
        answer: {
          title: 'Official Tournament Rules (Bases del Torneo)',
          topicIcon: 'rules',
          points: [
            'Knockout format: 16 players in a symmetrical binary tree (15 single-elimination matches).',
            'Match duration: 5 minutes per half (10 minutes real match time). Difficulty: Legendary. Game speed: Normal. Camera: Tele Broadcast.',
            '95 Overall Mode / Equalized stats: Mandatory for all teams to ensure zero statistical advantage.',
            'Tie-breaker: Classic extra time (two 2.5 min halves) + direct penalty shootout if still tied. No rematches.',
            'Fair Play & Pauses: Maximum 2 pauses per match, allowed strictly while the ball is out of play.',
            'Technical issues: Disconnection before min 45 replays a 5-min half adding previous score; after min 46 only remaining time is played. Center backup controllers available for hardware issues.'
          ],
          actionLabel: 'Open Rules Guide',
          actionModalKey: 'normas',
          suggestions: ['Schedule', 'Venues', 'Controllers', 'Prizes']
        }
      };
    }
    return {
      detectedLang: 'es',
      answer: {
        title: 'Reglamento Oficial de CLASH FOOTBALLWEEN',
        topicIcon: 'rules',
        points: [
          'Formato eliminatorio: Cuadro en árbol binario de 16 participantes (15 partidos a eliminación directa).',
          'Duración y ajustes: 5 minutos por tiempo (10 min de juego real). Dificultad: Leyenda. Velocidad: Normal. Cámara: Teleabierta.',
          'Equilibrio de equipos: Modo 95 / Medias igualadas obligatorio en todos los puestos para neutralizar ventajas estadísticas.',
          'Resolución de empates: Prórroga clásica (dos partes de 2,5 min) y tanda de penaltis directa si persiste el empate (sin desempates ni repeticiones).',
          'Pausas y Fair Play: Máximo 2 pausas por encuentro, únicamente con balón detenido fuera de juego.',
          'Incidencias técnicas: Desconexión antes del min 45 se reinicia jugando 5 min sumando el marcador; a partir del min 46 se juega solo el tiempo restante. Sustitución inmediata por mando del centro.'
        ],
        actionLabel: 'Abrir Guía Oficial de Normas',
        actionModalKey: 'normas',
        suggestions: ['Horarios', 'Ubicación y Sedes', 'Setup de Mandos', 'Premios']
      }
    };
  }

  // 2. HORARIOS / CRONOGRAMA / SCHEDULE
  if (/(horari|schedule|hora|fecha|cuand|when|calendari|calendar|programa|cronograma|que\s*dia)/i.test(clean)) {
    if (lang === 'en') {
      return {
        detectedLang: 'en',
        answer: {
          title: 'Official Tournament Schedule · October 31, 2026',
          topicIcon: 'schedule',
          points: [
            'Date: Friday, October 31, 2026 (Monotournament Clash Footballween Xàtiva).',
            'Preliminary Phase: Round of 16 (M-01 to M-08), Quarters (M-09 to M-12), and Semifinals (M-13 & M-14) in the IES Simarro Computer Lab.',
            'Grand Final (M-15): 20:00h at the Peak of the Castle of Xàtiva, broadcast live from the fortress main tower.'
          ],
          actionLabel: 'View Tournament Bracket',
          actionRoute: 'clasificacion',
          suggestions: ['Rules', 'Venues', 'Prizes']
        }
      };
    }
    return {
      detectedLang: 'es',
      answer: {
        title: 'Horarios Oficiales · Viernes 31 de Octubre de 2026',
        topicIcon: 'schedule',
        points: [
          'Fecha: Viernes 31 de octubre de 2026 (Jornada única del torneo en Xàtiva).',
          'Fase Previa en el Aula: Octavos (M-01 a M-08), Cuartos (M-09 a M-12) y Semifinales (M-13 y M-14) en el Aula de Informática del IES Simarro.',
          'Gran Final (M-15): 20:00h en la Cima del Castillo de Xàtiva, retransmitida en streaming en directo desde la torre mayor.'
        ],
        actionLabel: 'Ver Cuadro de Clasificación',
        actionRoute: 'clasificacion',
        suggestions: ['Normas', 'Sedes', 'Setup de Mandos']
      }
    };
  }

  // 3. SEDES / UBICACIÓN / VENUES / MAPA
  if (/(ubicaci|sede|donde|where|venue|location|lugar|simarro|castell|castillo|castle|xativa|mapa|map)/i.test(clean)) {
    if (lang === 'en') {
      return {
        detectedLang: 'en',
        answer: {
          title: 'Official Venues in Xàtiva',
          topicIcon: 'venues',
          points: [
            'Preliminary Venue: IES Dr. Lluís Simarro Computer Lab (C/ Carles Sarthou, Xàtiva) - Round of 16, quarters, and semifinals.',
            'Grand Final Venue: Peak of the Castle of Xàtiva (historic fortress main tower) for the championship match M-15.',
            'Heritage & Weather: Strict protocol to protect the fortress monument, with a weather contingency plan in place for rain or wind.'
          ],
          actionLabel: 'Open Locations Modal',
          actionModalKey: 'ubicaciones',
          suggestions: ['Schedule', 'Rules', 'Controllers']
        }
      };
    }
    return {
      detectedLang: 'es',
      answer: {
        title: 'Sedes Oficiales del Torneo en Xàtiva',
        topicIcon: 'venues',
        points: [
          'Sede Previa: Aula de Informática del IES Dr. Lluís Simarro (C/ Carles Sarthou, Xàtiva) para octavos, cuartos y semifinales.',
          'Sede Gran Final: Cima del Castillo de Xàtiva (torre mayor de la fortaleza medieval) para el partido definitivo M-15.',
          'Patrimonio y clima: Protocolo estricto de respeto al patrimonio histórico y plan B de contingencia meteorológica ante lluvia o viento.'
        ],
        actionLabel: 'Abrir Información de Sedes',
        actionModalKey: 'ubicaciones',
        suggestions: ['Horarios', 'Normas', 'Premios']
      }
    };
  }

  // 4. MANDOS / CONTROLLERS / SETUP
  if (/(mando|controller|pad|setup|ps5|xbox|teclado|dualsense|configuraci|botones)/i.test(clean)) {
    if (lang === 'en') {
      return {
        detectedLang: 'en',
        answer: {
          title: 'Controller Setup & Compatibility',
          topicIcon: 'setup',
          points: [
            'PlayStation: DualSense PS5 and DualShock PS4 supported.',
            'Xbox: Xbox Series and Xbox One wireless controllers supported.',
            'School Setup: Cleaned backup controllers provided by the IES Simarro center in case of hardware faults.',
            'Pre-match configuration: Players may adjust custom button bindings and camera before the referee blows the whistle.'
          ],
          actionLabel: 'Open Setup Guide',
          actionModalKey: 'setup_mandos',
          suggestions: ['Rules', 'Prizes', 'Schedule']
        }
      };
    }
    return {
      detectedLang: 'es',
      answer: {
        title: 'Setup Oficial de Mandos y Hardware',
        topicIcon: 'setup',
        points: [
          'PlayStation: Mandos DualSense PS5 y mandos PS4 homologados.',
          'Xbox: Mandos inalámbricos Xbox Series y Xbox One.',
          'Mando del centro: El IES Dr. Lluís Simarro provee mandos de reserva higienizados ante cualquier fallo técnico.',
          'Ajustes previos: Calibración previa autorizada antes del saque inicial para asignar botones y cámara.'
        ],
        actionLabel: 'Ver Setup de Mandos',
        actionModalKey: 'setup_mandos',
        suggestions: ['Normas', 'Horarios', 'Ubicación']
      }
    };
  }

  // 5. PREMIOS / FINAL / TROFEO / PRIZES
  if (/(premio|prize|trofeo|trophy|ganad|winner|recompens|reward|estandarte|banner|copa)/i.test(clean)) {
    if (lang === 'en') {
      return {
        detectedLang: 'en',
        answer: {
          title: 'Official Prize: The Castle Heraldic Banner',
          topicIcon: 'prizes',
          points: [
            'Grand Prize: The official hoisting and projection of the champion’s heraldic banner (club crest and gamertag) on the Castle of Xàtiva tower for a full commemorative year.',
            'Winner Status: The winner of match M-15 receives the status of "campeon" in the database and is immortalized on the castle module.',
            'Commemorative awards: CLASH FOOTBALLWEEN tournament trophy and official medals.'
          ],
          actionLabel: 'View Grand Final Details',
          actionModalKey: 'gran_final',
          suggestions: ['Rules', 'Schedule', 'Bracket']
        }
      };
    }
    return {
      detectedLang: 'es',
      answer: {
        title: 'Premio Oficial: El Estandarte del Castillo',
        topicIcon: 'prizes',
        points: [
          'Premio de Honor: El izado o proyección oficial del estandarte heráldico con el escudo del club y el gamertag del campeón durante un año entero en la torre del Castillo de Xàtiva.',
          'Estatus de Campeón: El ganador del partido M-15 pasa a estado "campeón" en la base de datos y su nombre queda vinculado al módulo del castillo.',
          'Reconocimiento: Trofeo conmemorativo y medallas de honor de CLASH FOOTBALLWEEN Xàtiva 2026.'
        ],
        actionLabel: 'Ver Detalles de la Gran Final',
        actionModalKey: 'gran_final',
        suggestions: ['Normas', 'Horarios', 'Clasificación']
      }
    };
  }

  // 6. ÁRBITROS / REFEREES
  if (/(arbitr|referee|colegiad|juez|judge|whistle|silbato|pitar|acta)/i.test(clean)) {
    if (lang === 'en') {
      return {
        detectedLang: 'en',
        answer: {
          title: 'Official Referee Corps & System Admins',
          topicIcon: 'referees',
          points: [
            '4 Official Referees: 3 seeded from DB (Andrés Simarro, Lucía Ferrer, Pau Bellver) and 1 open registration referee (no PIN or club required).',
            'Match Records: Referees validate players, log scores/fouls, sign official match sheets, and trigger automatic bracket advancement.',
            'Live Arbitration: Exclusive "Arbitrar partido" button for referees to simulate matches with whistle sounds and real-time event updates.',
            'System Admins: asieratopeferri@gmail.com, ikealaest@alu.edu.gva.es, aarselsan@alu.edu.gva.es, cesaroltrapart@gmail.com.'
          ],
          actionLabel: 'View Official Referees',
          actionRoute: 'arbitros',
          suggestions: ['Bracket', 'Rules', 'Schedule']
        }
      };
    }
    return {
      detectedLang: 'es',
      answer: {
        title: 'Cuerpo Oficial de Árbitros y Administradores',
        topicIcon: 'referees',
        points: [
          '4 Árbitros Oficiales: 3 asignados desde la base de datos (Andrés Simarro, Lucía Ferrer, Pau Bellver) y 1 colegiado registrado (sin PIN ni club).',
          'Gestión de actas: Validación de presencia, registro de marcadores, prórrogas, penaltis y cierre oficial de partidos con propagación de ronda.',
          'Botón de Arbitraje: Exclusivo para árbitros en el cuadro para iniciar la simulación con pitido y guardar goles y faltas en la base de datos.',
          'Administradores del sistema: asieratopeferri@gmail.com, ikealaest@alu.edu.gva.es, aarselsan@alu.edu.gva.es, cesaroltrapart@gmail.com.'
        ],
        actionLabel: 'Ver Sección de Árbitros',
        actionRoute: 'arbitros',
        suggestions: ['Clasificación', 'Normas', 'Horarios']
      }
    };
  }

  // 7. CLASIFICACIÓN / BRACKET / PARTIDOS
  if (/(clasificaci|bracket|cuadro|partid|match|torneo|tournament)/i.test(clean)) {
    if (lang === 'en') {
      return {
        detectedLang: 'en',
        answer: {
          title: 'Tournament Bracket & Match Progression',
          topicIcon: 'bracket',
          points: [
            '16 players in a 15-match binary tree: 8 round of 16 (M-01 to M-08), 4 quarters (M-09 to M-12), 2 semis (M-13, M-14), and Grand Final (M-15).',
            'Real-time synchronization via Supabase Realtime / WebSockets without requiring page reloads.',
            'Referees close match sheets and winners automatically propagate into the next bracket match.'
          ],
          actionLabel: 'Go to Classification',
          actionRoute: 'clasificacion',
          suggestions: ['Schedule', 'Referees', 'Rules']
        }
      };
    }
    return {
      detectedLang: 'es',
      answer: {
        title: 'Cuadro Eliminatorio y Lógica de Partidos',
        topicIcon: 'bracket',
        points: [
          '16 jugadores en árbol binario de 15 partidos: 8 octavos (M-01 a M-08), 4 cuartos (M-09 a M-12), 2 semifinales (M-13 y M-14) y Gran Final (M-15).',
          'Sincronización en tiempo real con Supabase Realtime / WebSockets sin necesidad de recargar la página.',
          'Los árbitros cierran las actas y el algoritmo backend propaga automáticamente al ganador al siguiente partido.'
        ],
        actionLabel: 'Ir a Clasificación',
        actionRoute: 'clasificacion',
        suggestions: ['Normas', 'Horarios', 'Árbitros']
      }
    };
  }

  // 8. TRUCOS 3D / EASTER EGG / CONTROLES DE LA ESCENA
  if (/(truco|trick|secreto|secret|bici|bike|caballito|wheelie|toque|balon|ball|salt|jump|baile|dance)/i.test(clean)) {
    if (lang === 'en') {
      return {
        detectedLang: 'en',
        answer: {
          title: '3D Scene Controls & Hidden Tricks',
          topicIcon: 'tricks',
          points: [
            'Key [ 1 ]: Juggle the football with alternating foot kicks.',
            'Key [ Space ]: Jump (bunny-hop) both on foot and while riding the bike.',
            'Click the Bike: Hop on and ride along the bridge and stairs.',
            'Keys [ W, E, R ] on Bike: Stand up on the rear wheel in a realistic wheelie!',
            'Key [ Z ]: Dismount the bike and return it to its parking spot.'
          ],
          suggestions: ['Rules', 'Venues', 'Schedule']
        }
      };
    }
    return {
      detectedLang: 'es',
      answer: {
        title: 'Controles y Trucos de la Escena 3D',
        topicIcon: 'tricks',
        points: [
          'Tecla [ 1 ]: Toques y malabares continuos con el balón de fútbol.',
          'Barra [ Espacio ]: Salto con física limpia tanto a pie como en bici.',
          'Clic en la Bicicleta: Te montas en marcha por el puente y las escaleras.',
          'Teclas [ W, E, R ] montado en bici: ¡La bici se planta a una rueda haciendo un caballito!',
          'Tecla [ Z ]: Te bajas de la bici y regresa volando a su sitio.'
        ],
        suggestions: ['Normas', 'Horarios', 'Sedes']
      }
    };
  }

  // 9. SALUDOS / GREETINGS
  if (/(hola|buenas|hello|hi|hey|salud|quien\s*eres|who\s*are\s*you|buenos\s*dias)/i.test(clean)) {
    if (lang === 'en') {
      return {
        detectedLang: 'en',
        answer: {
          title: 'Hello! I am Pumky, your Official Assistant',
          topicIcon: 'help',
          points: [
            'I can answer any question about Clash Footballween 2026 in Xàtiva!',
            'Ask me about rules, schedules, venues, controllers, prizes or 3D tricks.'
          ],
          suggestions: ['Rules', 'Schedule', 'Venues', 'Controllers', 'Prizes']
        }
      };
    }
    return {
      detectedLang: 'es',
      answer: {
        title: '¡Hola! Soy Calabacín, el Asistente Oficial',
        topicIcon: 'help',
        points: [
          '¡Estoy aquí para resolver cualquier duda sobre el torneo Clash Footballween 2026 en Xàtiva!',
          'Pregúntame sobre normas, horarios, sedes, mandos, premios o trucos de la escena 3D.'
        ],
        suggestions: ['Normas', 'Horarios', 'Sedes', 'Mandos', 'Premios', 'Trucos 3D']
      }
    };
  }

  // FALLBACK / AYUDA GENERAL
  if (lang === 'en') {
    return {
      detectedLang: 'en',
      answer: {
        title: 'I am here to help you!',
        topicIcon: 'help',
        points: [
          'I could not find an exact match, but you can ask me about:',
          '• Rules & Tournament format (5 min halves, Legend, Mode 95)',
          '• Schedule & Times (Oct 31, preliminary & grand final at 20:00h)',
          '• Venues (IES Simarro Computer Lab & Castle Peak)',
          '• Controller setup (PS5 DualSense, Xbox & center backups)',
          '• Prizes (Champion banner hoisted on the Castle of Xàtiva tower)',
          '• 3D scene bike tricks, wheelie & ball juggling'
        ],
        suggestions: ['Rules', 'Schedule', 'Venues', 'Prizes']
      }
    };
  }

  return {
    detectedLang: 'es',
    answer: {
      title: '¡Estoy aquí para ayudarte con el torneo!',
      topicIcon: 'help',
      points: [
        'No he captado esa consulta exacta, pero puedes preguntarme directamente por:',
        '• Normas oficiales (5 min/tiempo, Leyenda, Modo 95, prórroga y penaltis)',
        '• Horarios de los partidos (31 de octubre, Gran Final a las 20:00h)',
        '• Sedes (Aula de Informática del IES Simarro y Cima del Castillo)',
        '• Setup de mandos (PS5, Xbox y mandos del centro)',
        '• Premios (Estandarte heráldico del campeón en el castillo)',
        '• Trucos 3D (toques con tecla 1, caballito en bici con W/E/R, saltos)'
      ],
      suggestions: ['Normas', 'Horarios', 'Sedes', 'Mandos', 'Premios', 'Trucos 3D']
    }
  };
}

export const PumpkinChatbot: React.FC = () => {
  const { isLight } = useTheme();
  const { openModal } = useModal();
  const route = useHashRoute();
  const [isOpen, setIsOpen] = useState(false);
  const [showGreetingBubble, setShowGreetingBubble] = useState(true);
  const [lang, setLang] = useState<ChatLang>('es');
  const [inputValue, setInputValue] = useState('');
  const [runState, setRunState] = useState<'idle' | 'preparing' | 'running' | 'gone'>('idle');

  // En clasificación, la calabaza aparece pero sale corriendo hacia el borde de la izquierda
  useEffect(() => {
    if (route === 'clasificacion') {
      setIsOpen(false);
      setShowGreetingBubble(false);
      setRunState('preparing');

      const timerRun = window.setTimeout(() => {
        setRunState('running');
      }, 650);

      const timerGone = window.setTimeout(() => {
        setRunState('gone');
      }, 3150);

      return () => {
        window.clearTimeout(timerRun);
        window.clearTimeout(timerGone);
      };
    } else {
      setRunState('idle');
    }
  }, [route]);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init-1',
      sender: 'bot',
      rich: {
        title: '¡Hola! Soy Calabacín · Asistente Oficial',
        topicIcon: 'help',
        points: [
          '¡Bienvenido al torneo Clash Footballween 2026!',
          'Pregúntame cualquier duda sobre normas, horarios, sedes, mandos o premios (respondo en español y en inglés).'
        ],
        suggestions: ['Normas / Rules', 'Horarios / Schedule', 'Sedes / Venues', 'Mandos / Setup', 'Trucos 3D']
      },
      timestamp: 'Ahora'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  // Si pasa un rato, cerrar el bubble flotante para que no moleste
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGreetingBubble(false);
    }, 14000);
    return () => clearTimeout(timer);
  }, []);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend ?? inputValue).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const { answer, detectedLang } = processUserQuery(text, lang);
    if (detectedLang !== lang) {
      setLang(detectedLang);
    }

    const botMsg: ChatMessage = {
      id: `bot-${Date.now() + 1}`,
      sender: 'bot',
      rich: answer,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg, botMsg]);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleActionClick = (rich: RichAnswer) => {
    if (rich.actionModalKey) {
      openModal(rich.actionModalKey);
      setIsOpen(false);
    } else if (rich.actionRoute) {
      navigateTo(rich.actionRoute as any);
      setIsOpen(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'bot',
        rich: {
          title: lang === 'es' ? '¡Chat reiniciado! ¿En qué te ayudo?' : 'Chat reset! How can I help you?',
          topicIcon: 'help',
          points:
            lang === 'es'
              ? ['Escribe tu consulta o haz clic en los temas sugeridos abajo.']
              : ['Type your question or click on any of the suggested topics below.'],
          suggestions:
            lang === 'es'
              ? ['Normas', 'Horarios', 'Sedes', 'Mandos', 'Premios', 'Trucos 3D']
              : ['Rules', 'Schedule', 'Venues', 'Controllers', 'Prizes']
        },
        timestamp: 'Ahora'
      }
    ]);
  };

  const toggleLanguage = () => {
    const nextLang: ChatLang = lang === 'es' ? 'en' : 'es';
    setLang(nextLang);
    setMessages(prev => [
      ...prev,
      {
        id: `lang-${Date.now()}`,
        sender: 'bot',
        text:
          nextLang === 'en'
            ? 'Switched to English! Feel free to ask about rules, schedule, venues, or prizes.'
            : '¡Cambiado a español! Pregúntame sobre normas, horarios, sedes o premios.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const renderIcon = (type: RichAnswer['topicIcon']) => {
    switch (type) {
      case 'rules':
        return <Scale size={16} className="pk-topic-icon rules" />;
      case 'schedule':
      case 'time':
        return <Clock size={16} className="pk-topic-icon schedule" />;
      case 'venues':
        return <MapPin size={16} className="pk-topic-icon venues" />;
      case 'setup':
        return <Gamepad2 size={16} className="pk-topic-icon setup" />;
      case 'prizes':
        return <Trophy size={16} className="pk-topic-icon prizes" />;
      case 'referees':
        return <ShieldCheck size={16} className="pk-topic-icon referees" />;
      case 'bracket':
        return <Trophy size={16} className="pk-topic-icon bracket" />;
      case 'tricks':
      case 'joke':
        return <Sparkles size={16} className="pk-topic-icon tricks" />;
      case 'mood':
        return <Smile size={16} className="pk-topic-icon help" />;
      case 'weather':
        return <Sun size={16} className="pk-topic-icon prizes" />;
      case 'food':
        return <Coffee size={16} className="pk-topic-icon help" />;
      case 'thanks':
        return <Heart size={16} className="pk-topic-icon prizes" />;
      default:
        return <HelpCircle size={16} className="pk-topic-icon help" />;
    }
  };

  if (runState === 'gone') return null;

  return (
    <aside
      className={`pk-chatbot-widget ${isLight ? 'light' : 'dark'} ${
        runState === 'running' ? 'is-running-away' : ''
      }`}
      aria-label="Asistente Oficial Calabacín"
    >
      {(runState === 'preparing' || runState === 'running') && (
        <div className="pk-running-bubble">
          {runState === 'preparing'
            ? '¡Uy, los partidos! ¡Peligro de balonazo!'
            : '¡Aaaaaah! ¡Pies para qué os quiero!'}
        </div>
      )}
      {/* 1. VENTANA DE CHAT EXPANDIDA */}
      {isOpen && (
        <div className="pk-chat-window" role="dialog" aria-modal="false" aria-labelledby="pk-chat-header-title">
          {/* Cabecera del chat */}
          <div className="pk-chat-header">
            <div className="pk-chat-header-identity">
              <div className="pk-chat-mini-avatar">
                <WavingPumpkinAvatar size={34} />
              </div>
              <div>
                <span id="pk-chat-header-title" className="pk-chat-name">
                  Calabacín
                </span>
                <div className="pk-chat-status">
                  <span className="pk-status-dot" />
                  <span>{lang === 'es' ? 'Asistente Oficial · En línea' : 'Official Bot · Online'}</span>
                </div>
              </div>
            </div>

            <div className="pk-chat-header-actions">
              <button
                type="button"
                className="pk-chat-action-btn lang"
                onClick={toggleLanguage}
                title={lang === 'es' ? 'Cambiar a inglés / Switch to English' : 'Switch to Spanish / Cambiar a español'}
                aria-label="Cambiar idioma"
              >
                <Languages size={14} />
                <span>{lang.toUpperCase()}</span>
              </button>

              <button
                type="button"
                className="pk-chat-action-btn"
                onClick={resetChat}
                title={lang === 'es' ? 'Reiniciar conversación' : 'Reset chat'}
                aria-label="Reiniciar conversación"
              >
                <RefreshCw size={13} />
              </button>

              <button
                type="button"
                className="pk-chat-action-btn close"
                onClick={() => setIsOpen(false)}
                title={lang === 'es' ? 'Minimizar asistente' : 'Minimize assistant'}
                aria-label="Minimizar"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Cuerpo de mensajes */}
          <div className="pk-chat-body">
            {messages.map(msg => (
              <div key={msg.id} className={`pk-msg-row ${msg.sender}`}>
                {msg.sender === 'bot' && (
                  <div className="pk-msg-bot-avatar">
                    <WavingPumpkinAvatar size={28} />
                  </div>
                )}

                <div className="pk-msg-bubble">
                  {msg.text && <p className="pk-msg-plain-text">{msg.text}</p>}

                  {msg.rich && (
                    <div className="pk-msg-rich-card">
                      <div className="pk-rich-header">
                        {renderIcon(msg.rich.topicIcon)}
                        <strong>{msg.rich.title}</strong>
                      </div>

                      <ul className="pk-rich-points">
                        {msg.rich.points.map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>

                      {msg.rich.actionLabel && (
                        <button
                          type="button"
                          className="pk-rich-action-btn"
                          onClick={() => handleActionClick(msg.rich!)}
                        >
                          <span>{msg.rich.actionLabel}</span>
                          <ChevronRight size={13} />
                        </button>
                      )}

                      {msg.rich.suggestions && msg.rich.suggestions.length > 0 && (
                        <div className="pk-suggestions-row">
                          {msg.rich.suggestions.map((sug, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              className="pk-sug-chip"
                              onClick={() => handleSendMessage(sug)}
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <span className="pk-msg-time">{msg.timestamp}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Barra inferior de entrada */}
          <div className="pk-chat-input-bar">
            <input
              ref={inputRef}
              type="text"
              className="pk-chat-input"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                lang === 'es'
                  ? 'Pregúntame (ej: normas, horarios, premios)...'
                  : 'Ask me (e.g. rules, schedule, prizes)...'
              }
              aria-label="Mensaje para Calabacín"
            />
            <button
              type="button"
              className="pk-chat-send-btn"
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim()}
              title={lang === 'es' ? 'Enviar duda' : 'Send question'}
              aria-label="Enviar"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* 2. GLOBO FLOTANTE DE SALUDO ESTILO AUTH (Discreto y apunta a la calabaza) */}
      {!isOpen && showGreetingBubble && (
        <div className="pk-floating-bubble" onClick={() => setIsOpen(true)} role="status">
          <span>¡Hola! Pregúntame sobre las normas, horarios...</span>
          <button
            type="button"
            className="pk-bubble-dismiss"
            onClick={e => {
              e.stopPropagation();
              setShowGreetingBubble(false);
            }}
            title="Cerrar saludo"
            aria-label="Cerrar saludo"
          >
            <X size={11} />
          </button>
        </div>
      )}

      {/* 3. BOTÓN FLOTANTE: LA CALABAZA SALUDANDO DIRECTAMENTE SIN CONTENEDOR REDONDO */}
      <button
        type="button"
        className={`pk-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => {
          setIsOpen(prev => !prev);
          setShowGreetingBubble(false);
        }}
        title="Abrir chat con Calabacín (Asistente Oficial)"
        aria-label="Chatbot Calabacín"
        aria-expanded={isOpen}
      >
        <WavingPumpkinAvatar size={78} />
      </button>
    </aside>
  );
};

/**
 * Integración con TheSportsDB (https://www.thesportsdb.com/free_sports_api).
 *
 * Ahora mismo se usa la clave pública de pruebas `123`. Para producción basta con
 * poner la clave real en VITE_SPORTSDB_KEY.
 *
 * El plan gratuito devuelve un subconjunto de equipos por liga y tiene un límite de
 * peticiones, así que cacheamos por liga y, si la API falla o responde HTML
 * (rate limit), tiramos de un listado local para que el registro nunca se bloquee.
 */

const SPORTSDB_KEY = import.meta.env.VITE_SPORTSDB_KEY || '123';
const SPORTSDB_BASE = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}`;
const CACHE_TTL_MS = 30 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 9000;

export interface LeagueOption {
  id: string;
  /** Nombre exacto que espera TheSportsDB en search_all_teams.php?l= */
  apiName: string;
  name: string;
  country: string;
  flag: string;
}

export interface TeamOption {
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

export const LEAGUES: LeagueOption[] = [
  { id: '4335', apiName: 'Spanish La Liga', name: 'LaLiga EA Sports', country: 'España', flag: '🇪🇸' },
  { id: '4328', apiName: 'English Premier League', name: 'Premier League', country: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: '4332', apiName: 'Italian Serie A', name: 'Serie A', country: 'Italia', flag: '🇮🇹' },
  { id: '4331', apiName: 'German Bundesliga', name: 'Bundesliga', country: 'Alemania', flag: '🇩🇪' },
  { id: '4334', apiName: 'French Ligue 1', name: 'Ligue 1', country: 'Francia', flag: '🇫🇷' },
  { id: '4344', apiName: 'Portuguese Primeira Liga', name: 'Primeira Liga', country: 'Portugal', flag: '🇵🇹' }
];

const FALLBACK_TEAMS: Record<string, TeamOption[]> = {
  '4335': [
    ['Real Madrid', 'RMA', '#febe10'],
    ['FC Barcelona', 'BAR', '#a50044'],
    ['Atlético de Madrid', 'ATM', '#cb3524'],
    ['Valencia CF', 'VAL', '#f18e00'],
    ['Sevilla FC', 'SEV', '#d81920'],
    ['Real Betis', 'BET', '#0bb363'],
    ['Villarreal CF', 'VIL', '#ffe667'],
    ['Athletic Club', 'ATH', '#ee2523']
  ].map(([name, shortName, color]) => ({
    id: `local-${shortName}`,
    name,
    shortName,
    stadium: 'TheSportsDB no disponible',
    league: 'Spanish La Liga',
    color,
    color2: '#ffffff'
  })),
  '4328': [
    ['Arsenal', 'ARS', '#ef0107'],
    ['Manchester City', 'MCI', '#6cabdd'],
    ['Liverpool', 'LIV', '#c8102e'],
    ['Manchester United', 'MUN', '#da291c'],
    ['Chelsea', 'CHE', '#034694'],
    ['Tottenham Hotspur', 'TOT', '#132257'],
    ['Newcastle United', 'NEW', '#241f20'],
    ['Aston Villa', 'AVL', '#95bfe5']
  ].map(([name, shortName, color]) => ({
    id: `local-${shortName}`,
    name,
    shortName,
    stadium: 'TheSportsDB no disponible',
    league: 'English Premier League',
    color,
    color2: '#ffffff'
  })),
  '4332': [
    ['AC Milan', 'MIL', '#fb090b'],
    ['Inter Milan', 'INT', '#0068a8'],
    ['Juventus', 'JUV', '#000000'],
    ['Napoli', 'NAP', '#12a0d7'],
    ['AS Roma', 'ROM', '#8e1f2f'],
    ['Lazio', 'LAZ', '#87d8f7'],
    ['Atalanta', 'ATA', '#1e71b8'],
    ['Fiorentina', 'FIO', '#6a2c91']
  ].map(([name, shortName, color]) => ({
    id: `local-${shortName}`,
    name,
    shortName,
    stadium: 'TheSportsDB no disponible',
    league: 'Italian Serie A',
    color,
    color2: '#ffffff'
  })),
  '4331': [
    ['Bayern Munich', 'FCB', '#dc052d'],
    ['Borussia Dortmund', 'BVB', '#fde100'],
    ['RB Leipzig', 'RBL', '#dd0741'],
    ['Bayer Leverkusen', 'B04', '#e32221'],
    ['Eintracht Frankfurt', 'SGE', '#e1000f'],
    ['VfB Stuttgart', 'VFB', '#e32219'],
    ['Werder Bremen', 'SVW', '#1d9053'],
    ['VfL Wolfsburg', 'WOB', '#65b32e']
  ].map(([name, shortName, color]) => ({
    id: `local-${shortName}`,
    name,
    shortName,
    stadium: 'TheSportsDB no disponible',
    league: 'German Bundesliga',
    color,
    color2: '#ffffff'
  })),
  '4334': [
    ['Paris Saint-Germain', 'PSG', '#004170'],
    ['Olympique de Marseille', 'OM', '#2faee0'],
    ['Olympique Lyonnais', 'OL', '#1f4e9b'],
    ['AS Monaco', 'ASM', '#e51b22'],
    ['LOSC Lille', 'LIL', '#e01e13'],
    ['OGC Nice', 'NIC', '#c8102e'],
    ['Stade Rennais', 'REN', '#e13238'],
    ['RC Lens', 'RCL', '#ffe500']
  ].map(([name, shortName, color]) => ({
    id: `local-${shortName}`,
    name,
    shortName,
    stadium: 'TheSportsDB no disponible',
    league: 'French Ligue 1',
    color,
    color2: '#ffffff'
  })),
  '4344': [
    ['SL Benfica', 'BEN', '#e00000'],
    ['FC Porto', 'POR', '#00428c'],
    ['Sporting CP', 'SCP', '#008057'],
    ['SC Braga', 'BRA', '#c4002f'],
    ['Vitória SC', 'VSC', '#ffffff'],
    ['Boavista', 'BOA', '#111111']
  ].map(([name, shortName, color]) => ({
    id: `local-${shortName}`,
    name,
    shortName,
    stadium: 'TheSportsDB no disponible',
    league: 'Portuguese Primeira Liga',
    color,
    color2: '#ffffff'
  }))
};

interface CacheEntry {
  teams: TeamOption[];
  source: 'api' | 'fallback';
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
  const color = normalizeColor((raw.strColour1 as string) || undefined);
  const color2 = normalizeColor((raw.strColour2 as string) || undefined);
  const badge = (raw.strTeamBadge || raw.strBadge || raw.strLogo || raw.strBanner || undefined) as string | undefined;
  const shortName = String(raw.strTeamShort || initials(name)).toUpperCase().slice(0, 4);

  return {
    id: String(raw.idTeam ?? name),
    name,
    shortName,
    badge,
    stadium: (raw.strStadium as string) || undefined,
    league: String(raw.strLeague ?? ''),
    color,
    color2,
    description: raw.strDescriptionEN
      ? String(raw.strDescriptionEN).split('\n')[0].slice(0, 150)
      : undefined
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

export async function fetchTeamsByLeague(league: LeagueOption): Promise<{ teams: TeamOption[]; source: 'api' | 'fallback' }> {
  const cached = teamsCache.get(league.id);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return { teams: cached.teams, source: cached.source };
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
    teamsCache.set(league.id, { teams: unique, source: 'api', at: Date.now() });
    return { teams: unique, source: 'api' };
  } catch {
    const fallback = FALLBACK_TEAMS[league.id] ?? FALLBACK_TEAMS['4335'];
    teamsCache.set(league.id, { teams: fallback, source: 'fallback', at: Date.now() });
    return { teams: fallback, source: 'fallback' };
  }
}

export interface TeamSquad {
  teamName: string;
  source: 'api' | 'fallback';
  forwards: string[];
  midfielders: string[];
  defenders: string[];
  goalkeepers: string[];
  all: string[];
}

const KNOWN_TEAM_IDS: Record<string, string> = {
  'valencia': '133742',
  'valencia cf': '133742',
  'madrid': '133738',
  'real madrid': '133738',
  'barcelona': '133739',
  'fc barcelona': '133739',
  'atletico': '133729',
  'atlético de madrid': '133729',
  'atletico de madrid': '133729',
  'mancity': '133613',
  'manchester city': '133613',
  'arsenal': '133604',
  'arsenal fc': '133604',
  'bayern': '133664',
  'bayern münchen': '133664',
  'bayern munich': '133664',
  'liverpool': '133602',
  'liverpool fc': '133602',
  'inter': '133681',
  'inter de milán': '133681',
  'inter milan': '133681',
  'psg': '133714',
  'paris saint-germain': '133714',
  'milan': '133670',
  'ac milan': '133670',
  'juventus': '133676',
  'juventus fc': '133676',
  'dortmund': '133666',
  'borussia dortmund': '133666',
  'chelsea': '133610',
  'chelsea fc': '133610',
  'villarreal': '133744',
  'villarreal cf': '133744',
  'tottenham': '133616',
  'tottenham hotspur': '133616'
};

const CURATED_SQUADS: Record<string, { forwards: string[]; midfielders: string[]; defenders: string[]; goalkeepers: string[] }> = {
  'real madrid': {
    forwards: ['Kylian Mbappé', 'Vinícius Jr.', 'Rodrygo', 'Endrick', 'Brahim Díaz'],
    midfielders: ['Jude Bellingham', 'Federico Valverde', 'Luka Modric', 'Eduardo Camavinga', 'Aurélien Tchouaméni', 'Arda Güler', 'Dani Ceballos'],
    defenders: ['Antonio Rüdiger', 'Éder Militão', 'Dani Carvajal', 'Ferland Mendy', 'Lucas Vázquez', 'David Alaba', 'Fran García'],
    goalkeepers: ['Thibaut Courtois', 'Andriy Lunin']
  },
  'fc barcelona': {
    forwards: ['Robert Lewandowski', 'Lamine Yamal', 'Raphinha', 'Ferran Torres', 'Ansu Fati', 'Pau Víctor'],
    midfielders: ['Pedri', 'Dani Olmo', 'Gavi', 'Frenkie de Jong', 'Marc Casadó', 'Fermín López', 'Pablo Torre'],
    defenders: ['Jules Koundé', 'Pau Cubarsí', 'Iñigo Martínez', 'Alejandro Balde', 'Ronald Araújo', 'Andreas Christensen', 'Eric García'],
    goalkeepers: ['Marc-André ter Stegen', 'Wojciech Szczesny', 'Iñaki Peña']
  },
  'valencia cf': {
    forwards: ['Hugo Duro', 'Diego López', 'Luis Rioja', 'Dani Gómez', 'Sergi Canós', 'Rafa Mir'],
    midfielders: ['Javi Guerra', 'Pepelu', 'André Almeida', 'Enzo Barrenechea', 'Hugo Guillamón'],
    defenders: ['José Luis Gayà', 'Cristhian Mosquera', 'Thierry Correia', 'César Tárrega', 'Yarek Gasiorowski', 'Dimitri Foulquier'],
    goalkeepers: ['Giorgi Mamardashvili', 'Stole Dimitrievski']
  },
  'atlético de madrid': {
    forwards: ['Antoine Griezmann', 'Julián Álvarez', 'Alexander Sørloth', 'Ángel Correa', 'Giuliano Simeone'],
    midfielders: ['Rodrigo De Paul', 'Koke', 'Conor Gallagher', 'Marcos Llorente', 'Pablo Barrios', 'Samuel Lino', 'Rodrigo Riquelme'],
    defenders: ['Robin Le Normand', 'José María Giménez', 'Reinildo Mandava', 'Nahuel Molina', 'César Azpilicueta', 'Axel Witsel'],
    goalkeepers: ['Jan Oblak', 'Juan Musso']
  },
  'manchester city': {
    forwards: ['Erling Haaland', 'Jack Grealish', 'Jérémy Doku', 'Sávio'],
    midfielders: ['Kevin De Bruyne', 'Phil Foden', 'Bernardo Silva', 'Rodri', 'İlkay Gündogan', 'Mateo Kovacic', 'Matheus Nunes'],
    defenders: ['Rúben Dias', 'Manuel Akanji', 'Joško Gvardiol', 'John Stones', 'Kyle Walker', 'Nathan Aké', 'Rico Lewis'],
    goalkeepers: ['Ederson', 'Stefan Ortega']
  },
  'arsenal fc': {
    forwards: ['Bukayo Saka', 'Kai Havertz', 'Gabriel Martinelli', 'Leandro Trossard', 'Gabriel Jesus', 'Raheem Sterling'],
    midfielders: ['Martin Ødegaard', 'Declan Rice', 'Thomas Partey', 'Mikel Merino', 'Jorginho'],
    defenders: ['William Saliba', 'Gabriel Magalhães', 'Ben White', 'Jurriën Timber', 'Riccardo Calafiori', 'Oleksandr Zinchenko'],
    goalkeepers: ['David Raya', 'Neto']
  },
  'arsenal': {
    forwards: ['Bukayo Saka', 'Kai Havertz', 'Gabriel Martinelli', 'Leandro Trossard', 'Gabriel Jesus', 'Raheem Sterling'],
    midfielders: ['Martin Ødegaard', 'Declan Rice', 'Thomas Partey', 'Mikel Merino', 'Jorginho'],
    defenders: ['William Saliba', 'Gabriel Magalhães', 'Ben White', 'Jurriën Timber', 'Riccardo Calafiori', 'Oleksandr Zinchenko'],
    goalkeepers: ['David Raya', 'Neto']
  },
  'bayern münchen': {
    forwards: ['Harry Kane', 'Leroy Sané', 'Serge Gnabry', 'Michael Olise', 'Kingsley Coman', 'Thomas Müller', 'Mathys Tel'],
    midfielders: ['Jamal Musiala', 'Joshua Kimmich', 'Leon Goretzka', 'João Palhinha', 'Konrad Laimer', 'Aleksandar Pavlovic'],
    defenders: ['Dayot Upamecano', 'Kim Min-jae', 'Alphonso Davies', 'Raphaël Guerreiro', 'Eric Dier', 'Hiroki Ito'],
    goalkeepers: ['Manuel Neuer', 'Daniel Peretz', 'Sven Ulreich']
  },
  'bayern munich': {
    forwards: ['Harry Kane', 'Leroy Sané', 'Serge Gnabry', 'Michael Olise', 'Kingsley Coman', 'Thomas Müller', 'Mathys Tel'],
    midfielders: ['Jamal Musiala', 'Joshua Kimmich', 'Leon Goretzka', 'João Palhinha', 'Konrad Laimer', 'Aleksandar Pavlovic'],
    defenders: ['Dayot Upamecano', 'Kim Min-jae', 'Alphonso Davies', 'Raphaël Guerreiro', 'Eric Dier', 'Hiroki Ito'],
    goalkeepers: ['Manuel Neuer', 'Daniel Peretz', 'Sven Ulreich']
  },
  'liverpool fc': {
    forwards: ['Mohamed Salah', 'Luis Díaz', 'Darwin Núñez', 'Cody Gakpo', 'Diogo Jota', 'Federico Chiesa'],
    midfielders: ['Alexis Mac Allister', 'Dominik Szoboszlai', 'Ryan Gravenberch', 'Curtis Jones', 'Wataru Endo', 'Harvey Elliott'],
    defenders: ['Virgil van Dijk', 'Ibrahima Konaté', 'Trent Alexander-Arnold', 'Andy Robertson', 'Joe Gomez', 'Kostas Tsimikas'],
    goalkeepers: ['Alisson Becker', 'Caoimhin Kelleher']
  },
  'liverpool': {
    forwards: ['Mohamed Salah', 'Luis Díaz', 'Darwin Núñez', 'Cody Gakpo', 'Diogo Jota', 'Federico Chiesa'],
    midfielders: ['Alexis Mac Allister', 'Dominik Szoboszlai', 'Ryan Gravenberch', 'Curtis Jones', 'Wataru Endo', 'Harvey Elliott'],
    defenders: ['Virgil van Dijk', 'Ibrahima Konaté', 'Trent Alexander-Arnold', 'Andy Robertson', 'Joe Gomez', 'Kostas Tsimikas'],
    goalkeepers: ['Alisson Becker', 'Caoimhin Kelleher']
  },
  'inter de milán': {
    forwards: ['Lautaro Martínez', 'Marcus Thuram', 'Mehdi Taremi', 'Marko Arnautovic', 'Joaquín Correa'],
    midfielders: ['Nicolò Barella', 'Hakan Çalhanoglu', 'Henrikh Mkhitaryan', 'Federico Dimarco', 'Denzel Dumfries', 'Davide Frattesi', 'Piotr Zielinski'],
    defenders: ['Alessandro Bastoni', 'Benjamin Pavard', 'Francesco Acerbi', 'Stefan de Vrij', 'Yann Bisseck', 'Carlos Augusto'],
    goalkeepers: ['Yann Sommer', 'Josep Martínez']
  },
  'inter': {
    forwards: ['Lautaro Martínez', 'Marcus Thuram', 'Mehdi Taremi', 'Marko Arnautovic', 'Joaquín Correa'],
    midfielders: ['Nicolò Barella', 'Hakan Çalhanoglu', 'Henrikh Mkhitaryan', 'Federico Dimarco', 'Denzel Dumfries', 'Davide Frattesi', 'Piotr Zielinski'],
    defenders: ['Alessandro Bastoni', 'Benjamin Pavard', 'Francesco Acerbi', 'Stefan de Vrij', 'Yann Bisseck', 'Carlos Augusto'],
    goalkeepers: ['Yann Sommer', 'Josep Martínez']
  },
  'paris saint-germain': {
    forwards: ['Ousmane Dembélé', 'Bradley Barcola', 'Randal Kolo Muani', 'Marco Asensio', 'Gonçalo Ramos', 'Désiré Doué'],
    midfielders: ['Vitinha', 'Warren Zaïre-Emery', 'Fabián Ruiz', 'João Neves', 'Kang-in Lee'],
    defenders: ['Marquinhos', 'Willian Pacho', 'Achraf Hakimi', 'Nuno Mendes', 'Lucas Beraldo', 'Milan Škriniar'],
    goalkeepers: ['Gianluigi Donnarumma', 'Matvey Safonov']
  },
  'psg': {
    forwards: ['Ousmane Dembélé', 'Bradley Barcola', 'Randal Kolo Muani', 'Marco Asensio', 'Gonçalo Ramos', 'Désiré Doué'],
    midfielders: ['Vitinha', 'Warren Zaïre-Emery', 'Fabián Ruiz', 'João Neves', 'Kang-in Lee'],
    defenders: ['Marquinhos', 'Willian Pacho', 'Achraf Hakimi', 'Nuno Mendes', 'Lucas Beraldo', 'Milan Škriniar'],
    goalkeepers: ['Gianluigi Donnarumma', 'Matvey Safonov']
  },
  'ac milan': {
    forwards: ['Rafael Leão', 'Álvaro Morata', 'Christian Pulisic', 'Tammy Abraham', 'Samuel Chukwueze', 'Noah Okafor'],
    midfielders: ['Tijjani Reijnders', 'Youssouf Fofana', 'Ruben Loftus-Cheek', 'Yunus Musah', 'Ismaël Bennacer'],
    defenders: ['Theo Hernández', 'Fikayo Tomori', 'Strahinja Pavlovic', 'Emerson Royal', 'Davide Calabria', 'Malick Thiaw'],
    goalkeepers: ['Mike Maignan', 'Marco Sportiello']
  },
  'milan': {
    forwards: ['Rafael Leão', 'Álvaro Morata', 'Christian Pulisic', 'Tammy Abraham', 'Samuel Chukwueze', 'Noah Okafor'],
    midfielders: ['Tijjani Reijnders', 'Youssouf Fofana', 'Ruben Loftus-Cheek', 'Yunus Musah', 'Ismaël Bennacer'],
    defenders: ['Theo Hernández', 'Fikayo Tomori', 'Strahinja Pavlovic', 'Emerson Royal', 'Davide Calabria', 'Malick Thiaw'],
    goalkeepers: ['Mike Maignan', 'Marco Sportiello']
  },
  'juventus fc': {
    forwards: ['Dusan Vlahovic', 'Kenan Yildiz', 'Francisco Conceição', 'Nico González', 'Timothy Weah', 'Arkadiusz Milik'],
    midfielders: ['Teun Koopmeiners', 'Douglas Luiz', 'Khéphren Thuram', 'Manuel Locatelli', 'Weston McKennie', 'Nicolò Fagioli'],
    defenders: ['Bremer', 'Federico Gatti', 'Pierre Kalulu', 'Danilo', 'Andrea Cambiaso', 'Juan Cabal'],
    goalkeepers: ['Michele Di Gregorio', 'Mattia Perin']
  },
  'juventus': {
    forwards: ['Dusan Vlahovic', 'Kenan Yildiz', 'Francisco Conceição', 'Nico González', 'Timothy Weah', 'Arkadiusz Milik'],
    midfielders: ['Teun Koopmeiners', 'Douglas Luiz', 'Khéphren Thuram', 'Manuel Locatelli', 'Weston McKennie', 'Nicolò Fagioli'],
    defenders: ['Bremer', 'Federico Gatti', 'Pierre Kalulu', 'Danilo', 'Andrea Cambiaso', 'Juan Cabal'],
    goalkeepers: ['Michele Di Gregorio', 'Mattia Perin']
  },
  'borussia dortmund': {
    forwards: ['Serhou Guirassy', 'Karim Adeyemi', 'Donyell Malen', 'Jamie Gittens', 'Maximilian Beier'],
    midfielders: ['Julian Brandt', 'Marcel Sabitzer', 'Emre Can', 'Pascal Groß', 'Felix Nmecha', 'Giovanni Reyna'],
    defenders: ['Nico Schlotterbeck', 'Waldemar Anton', 'Niklas Süle', 'Julian Ryerson', 'Ramy Bensebaini', 'Yan Couto'],
    goalkeepers: ['Gregor Kobel', 'Alexander Meyer']
  },
  'dortmund': {
    forwards: ['Serhou Guirassy', 'Karim Adeyemi', 'Donyell Malen', 'Jamie Gittens', 'Maximilian Beier'],
    midfielders: ['Julian Brandt', 'Marcel Sabitzer', 'Emre Can', 'Pascal Groß', 'Felix Nmecha', 'Giovanni Reyna'],
    defenders: ['Nico Schlotterbeck', 'Waldemar Anton', 'Niklas Süle', 'Julian Ryerson', 'Ramy Bensebaini', 'Yan Couto'],
    goalkeepers: ['Gregor Kobel', 'Alexander Meyer']
  },
  'chelsea fc': {
    forwards: ['Cole Palmer', 'Nicolas Jackson', 'Christopher Nkunku', 'Noni Madueke', 'Pedro Neto', 'Jadon Sancho', 'João Félix'],
    midfielders: ['Enzo Fernández', 'Moisés Caicedo', 'Roméo Lavia', 'Kiernan Dewsbury-Hall'],
    defenders: ['Levi Colwill', 'Wesley Fofana', 'Reece James', 'Marc Cucurella', 'Malo Gusto', 'Axel Disasi', 'Tosin Adarabioyo'],
    goalkeepers: ['Robert Sánchez', 'Filip Jörgensen']
  },
  'chelsea': {
    forwards: ['Cole Palmer', 'Nicolas Jackson', 'Christopher Nkunku', 'Noni Madueke', 'Pedro Neto', 'Jadon Sancho', 'João Félix'],
    midfielders: ['Enzo Fernández', 'Moisés Caicedo', 'Roméo Lavia', 'Kiernan Dewsbury-Hall'],
    defenders: ['Levi Colwill', 'Wesley Fofana', 'Reece James', 'Marc Cucurella', 'Malo Gusto', 'Axel Disasi', 'Tosin Adarabioyo'],
    goalkeepers: ['Robert Sánchez', 'Filip Jörgensen']
  },
  'villarreal cf': {
    forwards: ['Gerard Moreno', 'Ayoze Pérez', 'Álex Baena', 'Thierno Barry', 'Yeremy Pino', 'Nicolas Pépé'],
    midfielders: ['Dani Parejo', 'Santi Comesaña', 'Pape Gueye', 'Denis Suárez', 'Ramón Terrats'],
    defenders: ['Raúl Albiol', 'Logan Costa', 'Eric Bailly', 'Alfonso Pedraza', 'Sergi Cardona', 'Kiko Femenía'],
    goalkeepers: ['Diego Conde', 'Luiz Júnior']
  },
  'villarreal': {
    forwards: ['Gerard Moreno', 'Ayoze Pérez', 'Álex Baena', 'Thierno Barry', 'Yeremy Pino', 'Nicolas Pépé'],
    midfielders: ['Dani Parejo', 'Santi Comesaña', 'Pape Gueye', 'Denis Suárez', 'Ramón Terrats'],
    defenders: ['Raúl Albiol', 'Logan Costa', 'Eric Bailly', 'Alfonso Pedraza', 'Sergi Cardona', 'Kiko Femenía'],
    goalkeepers: ['Diego Conde', 'Luiz Júnior']
  },
  'tottenham hotspur': {
    forwards: ['Son Heung-min', 'Dominic Solanke', 'Brennan Johnson', 'Richarlison', 'Timo Werner'],
    midfielders: ['James Maddison', 'Dejan Kulusevski', 'Pape Matar Sarr', 'Rodrigo Bentancur', 'Yves Bissouma'],
    defenders: ['Cristian Romero', 'Micky van de Ven', 'Pedro Porro', 'Destiny Udogie', 'Radu Dragusin', 'Ben Davies'],
    goalkeepers: ['Guglielmo Vicario', 'Fraser Forster']
  },
  'tottenham': {
    forwards: ['Son Heung-min', 'Dominic Solanke', 'Brennan Johnson', 'Richarlison', 'Timo Werner'],
    midfielders: ['James Maddison', 'Dejan Kulusevski', 'Pape Matar Sarr', 'Rodrigo Bentancur', 'Yves Bissouma'],
    defenders: ['Cristian Romero', 'Micky van de Ven', 'Pedro Porro', 'Destiny Udogie', 'Radu Dragusin', 'Ben Davies'],
    goalkeepers: ['Guglielmo Vicario', 'Fraser Forster']
  }
};

const squadsCache = new Map<string, TeamSquad>();

function normalizeTeamKey(name: string): string {
  return name.trim().toLowerCase().replace(/^(el|los|la|las)\s+/, '');
}

function getCuratedSquad(normalized: string, teamName: string): TeamSquad {
  const squad = CURATED_SQUADS[normalized] ||
    Object.entries(CURATED_SQUADS).find(([k]) => normalized.includes(k) || k.includes(normalized))?.[1] || {
      forwards: ['Delantero Estrella', 'Extremo Rápido', 'Segundo Punta'],
      midfielders: ['Mediapunta Creador', 'Pivote Organizador', 'Interior Ofensivo'],
      defenders: ['Central Capitán', 'Lateral Ofensivo', 'Central Contundente'],
      goalkeepers: ['Portero Titular']
    };

  const all = [...squad.forwards, ...squad.midfielders, ...squad.defenders, ...squad.goalkeepers];
  return {
    teamName,
    source: 'fallback',
    forwards: squad.forwards,
    midfielders: squad.midfielders,
    defenders: squad.defenders,
    goalkeepers: squad.goalkeepers,
    all
  };
}

/**
 * Obtiene la plantilla oficial del equipo consultando TheSportsDB API
 * con fallback instantáneo a plantillas curadas con nombres reales.
 */
export async function fetchTeamSquad(teamName: string, teamId?: string): Promise<TeamSquad> {
  const normKey = normalizeTeamKey(teamName);
  const cacheKey = teamId || normKey;

  const memCached = squadsCache.get(cacheKey);
  if (memCached) return memCached;

  try {
    const localStoreKey = `cf_squad_${cacheKey}`;
    const stored = localStorage.getItem(localStoreKey);
    if (stored) {
      const parsed = JSON.parse(stored) as TeamSquad;
      squadsCache.set(cacheKey, parsed);
      return parsed;
    }
  } catch {
    // localStorage no disponible o inválido
  }

  const resolvedId = (teamId && !teamId.startsWith('local-'))
    ? teamId
    : KNOWN_TEAM_IDS[normKey] || Object.entries(KNOWN_TEAM_IDS).find(([k]) => normKey.includes(k) || k.includes(normKey))?.[1];

  if (resolvedId) {
    try {
      const data = (await fetchJson(
        `${SPORTSDB_BASE}/lookup_all_players.php?id=${encodeURIComponent(resolvedId)}`
      )) as { player?: Array<{ strPlayer?: string; strPosition?: string }> | null };

      if (data && Array.isArray(data.player) && data.player.length > 0) {
        const forwards: string[] = [];
        const midfielders: string[] = [];
        const defenders: string[] = [];
        const goalkeepers: string[] = [];
        const all: string[] = [];

        data.player.forEach(p => {
          const pName = p.strPlayer?.trim();
          if (!pName) return;
          all.push(pName);

          const pos = (p.strPosition || '').toLowerCase();
          if (pos.includes('goal') || pos.includes('porter')) {
            goalkeepers.push(pName);
          } else if (pos.includes('forward') || pos.includes('wing') || pos.includes('striker') || pos.includes('attack') || pos.includes('delant')) {
            forwards.push(pName);
          } else if (pos.includes('back') || pos.includes('defend') || pos.includes('defens')) {
            defenders.push(pName);
          } else {
            midfielders.push(pName);
          }
        });

        // Asegurar que al menos tengamos delanteros y portero si la API no desglosó posiciones
        if (all.length > 0) {
          const squadResult: TeamSquad = {
            teamName,
            source: 'api',
            forwards: forwards.length > 0 ? forwards : all.slice(0, 3),
            midfielders: midfielders.length > 0 ? midfielders : all.slice(2, 6),
            defenders: defenders.length > 0 ? defenders : all.slice(5, 9),
            goalkeepers: goalkeepers.length > 0 ? goalkeepers : [all[0]],
            all
          };

          squadsCache.set(cacheKey, squadResult);
          try {
            localStorage.setItem(`cf_squad_${cacheKey}`, JSON.stringify(squadResult));
          } catch {
            // No-op
          }
          return squadResult;
        }
      }
    } catch {
      // Fallback si la API tiene rate limit o no responde
    }
  }

  const fallbackSquad = getCuratedSquad(normKey, teamName);
  squadsCache.set(cacheKey, fallbackSquad);
  return fallbackSquad;
}

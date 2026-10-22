# 🎃⚽ CLASH FOOTBALLWEEN · XÀTIVA 2026

Plataforma web oficial para el torneo escolar de eSports **CLASH FOOTBALLWEEN**, que une el espíritu de Halloween, el mundo de EA FC y el patrimonio histórico del **Castell de Xàtiva** descendiendo hasta el **IES Dr. Lluís Simarro**.

Desarrollada con **React + TypeScript + Vite + Three.js**, optimizada para subirse a GitHub y desplegarse automáticamente en **Vercel**, con una **arquitectura desacoplada y modular** lista para conectar cualquier backend (Supabase o REST API en Express / NestJS).

---

## 🚀 Inicio Rápido (Desarrollo Local)

Puedes ejecutar el proyecto tanto desde la raíz como desde la carpeta `Web_Frontend`:

### Opción 1: Desde la raíz del repositorio
```bash
# 1. Instalar dependencias del frontend
npm --prefix Web_Frontend install

# 2. Iniciar servidor de desarrollo en http://localhost:5173
npm run dev
```

### Opción 2: Entrando a `Web_Frontend`
```bash
cd Web_Frontend
npm install
npm run dev
```

Abre en tu navegador: [http://localhost:5173](http://localhost:5173).

---

## 🗄️ Base de Datos Supabase (`clash_footballween`)

La app ya está conectada a **Supabase** (Auth + PostgreSQL + Storage).

1. Crea un proyecto en [Supabase](https://supabase.com) llamado `clash_footballween`.
2. Abre **SQL Editor → New query**, pega el contenido completo de [`completo.sql`](./completo.sql) y pulsa **Run**. Ese único fichero crea tablas, RLS, políticas, triggers, el bucket `avatares`, las vistas y los datos iniciales (7 jugadores falsos + los 8 partidos de la mitad BBDD + chat).
3. En **Project Settings → API** copia la *Project URL* y la *anon public key* en `Web_Frontend/.env`:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```
4. Recomendado para el torneo: **Authentication → Providers → Email → Confirm email = OFF**, para que el registro devuelva sesión y se pueda subir la foto de perfil al momento.

### Reparto del cuadro

- **8 jugadores** viven en el código (seed 1-16 según el cuadro estático).
- **7 jugadores** se insertan desde `completo.sql` (mitad derecha del cuadro).
- **1 hueco libre (seed #11)** reservado al jugador que se registre → 16 plazas.
- Perfil, página de jugadores, clasificación y chat leen de Supabase; sin claves configuradas la app arranca con los datos locales de respaldo.

---

## 🏗️ Arquitectura Desacoplada (Preparada para Backend)

El proyecto está diseñado bajo el principio de **Separación de Responsabilidades** (*Separation of Concerns*). La interfaz gráfica no accede directamente a la base de datos ni a almacenamiento crudo; interactúa a través de una capa de servicios tipados:

```
Web_Frontend/
├── src/
│   ├── types/               # Modelos y contratos TypeScript
│   │   ├── user.ts          # UserProfile, UserRole ('jugador' | 'arbitro' | 'admin'), Payloads
│   │   ├── tournament.ts    # TournamentMatch, MatchRound (1..4), MatchStatus, UpdateScorePayload
│   │   ├── chat.ts          # ChatMessage, SendChatMessagePayload
│   │   └── common.ts        # ModalKey, HotspotData
│   │
│   ├── config/              # Constantes y configuración global
│   │   └── constants.ts     # Correos de Admin, PIN de Árbitro, Fechas, Claves de almacenamiento
│   │
│   ├── services/            # Capa de Servicios y API (desacoplada del UI)
│   │   ├── supabase.ts      # Cliente Supabase (Auth + BBDD + Storage)
│   │   ├── authService.ts   # Supabase Auth, perfiles, foto de perfil y roles
│   │   ├── tournamentService.ts # Mezcla mitad estática + mitad Supabase del cuadro
│   │   ├── matchService.ts  # Partidos, Marcadores, Cuadro y Avance de Ronda
│   │   ├── playerService.ts # Jugadores desde `vista_jugadores`
│   │   ├── chatService.ts   # Chat en vivo en `chat_mensajes`
│   │   └── mockData.ts      # Datos locales de respaldo (15 jugadores, 15 partidos, chat)
│   │
│   ├── context/             # Estado reactivo global
│   │   ├── AuthContext.tsx       # Sesión, permisos (isAdmin, isReferee, isStaff)
│   │   ├── TournamentContext.tsx # Cuadro eliminatorio reactivo
│   │   ├── ChatContext.tsx       # Mensajes en directo y emisión
│   │   └── ModalContext.tsx      # Control de ventanas modales
│   │
│   ├── hooks/               # Hooks reutilizables
│   │   ├── useScrollAltitude.ts  # Altitud (310m -> 85m) sincronizada con el scroll
│   │   └── useCountdown.ts       # Cuenta atrás para la Gran Final del 31 de Octubre
│   │
│   └── components/
│       ├── canvas/          # Escena 3D WebGL con Three.js
│       │   ├── WebGLCanvas.tsx     # Canvas reactivo y overlays
│       │   └── scene/              # Módulos 3D (Castillo, Escalinata, Simarro, Personaje, Caminantes, Hotspots)
│       ├── hud/             # Interfaz flotante (Navbar, HUD altitud, Hint scroll, Hotspots 3D)
│       └── modals/          # Modales (Auth, Perfil, Cuadro, Acta Árbitro, Jugadores, Directo, Info)
```

### ¿Cómo conectar el Backend cuando esté listo?
Crea tu archivo `.env` dentro de `Web_Frontend/` basándote en `.env.example`:
```env
# Opción A: API REST (Node.js / Express / NestJS)
VITE_API_URL=http://localhost:3000/api

# Opción B: Supabase (PostgreSQL + Auth + Realtime)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

`src/services/api.ts` detectará automáticamente las variables de entorno y consumirá los endpoints reales. Mientras tanto, funciona 100% en modo simulado local con `localStorage`.

---

## 👑 Roles y Cuentas Preconfiguradas

1. **Administradores (`admin`)**:
   - Correos con acceso automático de administrador:
     - `asieratopeferri@gmail.com`
     - `ikealaest@alu.edu.gva.es`
     - `aarselsan@alu.edu.gva.es`
     - `cesaroltrapart@gmail.com`
   - Privilegios: Modificar cualquier marcador, reiniciar cuadro, moderar chat.

2. **Jueces / Árbitros (`arbitro`)**:
   - Requiere el **Código PIN de Validación Oficial**: `XATIVA2026`.
   - Privilegios: Acceso al acta oficial de los partidos para anotar goles, incidencias (prórroga, desconexión) y finalizar encuentros para avanzar al ganador en el cuadro.

3. **Jugadores (`jugador`)**:
   - Registro con nombre, gamertag de EA FC, club elegido y tipo de mando (PS5, Xbox o Centro).

---

## 🌐 Despliegue en Vercel y GitHub

El repositorio está configurado con `vercel.json` tanto en la raíz como en `Web_Frontend/`:

### Paso 1: Subir cambios a GitHub
```bash
git add .
git commit -m "feat: Migración completa a React TSX modular con Three.js y soporte backend"
git push origin main
```

### Paso 2: Desplegar en Vercel
1. Ve a [Vercel](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New Project"** e importa el repositorio `FUTBOLWEEN`.
3. Vercel detectará la configuración automáticamente:
   - **Framework Preset:** Vite
   - **Build Command:** `npm --prefix Web_Frontend run build` (o `npm run build` si seleccionas `Web_Frontend` como Root Directory)
   - **Output Directory:** `Web_Frontend/dist` (o `dist`)
4. Haz clic en **"Deploy"**. ¡Tu web estará online en segundos con HTTPS y CDN mundial!

---

## 🎨 Características Técnicas

- **Gráficos 3D con Three.js:** Escena continua y optimizada que desciende 225 metros en vertical desde las almenas del castillo hasta el patio del Simarro con 96 peldaños en espiral.
- **Hotspots 3D Proyectados:** Botones interactivos flotantes cuyas coordenadas 3D se proyectan en tiempo real a coordenadas 2D en pantalla según la posición de la cámara.
- **Cuadro Eliminatorio en Tiempo Real:** 15 jugadores inscritos + 1 plaza libre, 15 partidos (8 Octavos, 4 Cuartos, 2 Semifinales, Gran Final) con promoción automática de clasificados al guardar el acta.
- **Base de datos Supabase:** tablas con RLS, triggers, vistas y bucket de avatares definidos en `completo.sql`.
- **Chat en Directo e Integración Streaming:** Sala de retransmisión con badges oficiales según rol (`ADMIN`, `ÁRBITRO`, `JUGADOR`).
- **Responsive & Accesible:** Compatible con resoluciones de PC, portátiles, tablets y móviles con control táctil o ratón.


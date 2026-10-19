# Especificaciones Técnicas y Funcionales: Web Torneo CLASH FOOTBALLWEEN Xàtiva 2026

## 1\. Visión General del Proyecto

* **Nombre del Proyecto:** CLASH FOOTBALLWEEN (Gran Final en el Castillo de Xàtiva).  
* **Objetivo:** Desarrollar una plataforma web completa para la gestión en tiempo real de un torneo escolar de eSports (EA FC / FIFA), con fase previa en el aula de informática y gran final retransmitida desde la torre del Castillo de Xàtiva.  
* **Contexto Metodológico:** Desarrollado bajo el marco de trabajo ágil **SCRUM** por un equipo formado por 1 Scrum Master y 3 Developers.

## 2\. Pila Tecnológica Recomendada

* **Frontend:** HTML5, CSS3 avanzado con Tailwind CSS o frameworks reactivos (React, Vue o Vanilla JS modular).  
* **Backend / API:** Node.js con Express, NestJS o servicios Serverless (Firebase Cloud Functions / Supabase Edge Functions).  
* **Base de Datos:**  
  * Relacional o Documental en tiempo real (PostgreSQL con Supabase o Google Firestore / MongoDB).  
* **Tiempo Real (Real-time):** WebSockets, Socket.io o listeners nativos en tiempo real de la base de datos.  
* **Autenticación:** JWT (JSON Web Tokens) o Firebase/Supabase Auth, con almacenamiento seguro de credenciales mediante hashing (bcrypt/argon2).

## 3\. Roles de Usuario y Permisos

### 3.1. Jugador (Participante)

* Registro abierto con nombre, nick (gamertag), curso y club seleccionado.  
* Consulta de su perfil, historial de partidos y próximo rival.  
* Participación libre en la sala de chat en directo.  
* Visualización del streaming y del cuadro competitivo.

### 3.2. Árbitro / Organizador (Staff)

* Registro protegido mediante **PIN o Clave de Acceso de Árbitro**.  
* Acceso exclusivo al **Panel de Actas y Administración de Resultados**:  
  * Validación de presencia de jugadores.  
  * Inserción y actualización de marcadores (goles local / visitante, prórroga, penaltis).  
  * Cierre oficial de partidos y avance automático de ronda.  
* Insignia gráfica distintiva (*badge* de juez / escudo de armas) en la sala de chat para moderación.

### 3.3. Administrador del Sistema (`admin`)

* Acceso total de control sobre el sistema, configuración del torneo, asignación de roles, reinicio de rondas y moderación de usuarios y chat.  
* **Cuentas con rol `admin` preconfiguradas:**  
  * `asieratopeferri@gmail.com`  
  * `ikealaest@alu.edu.gva.es`  
  * `aarselsan@alu.edu.gva.es`  
  * `cesaroltrapart@gmail.com`

## 4\. Estructura de Secciones y Requisitos Funcionales

### 4.1. Página Principal (Home / Landing)

* Banner de impacto visual que refleje la combinación de Halloween, eSports y la fortaleza de Xàtiva.  
* Indicador en directo del estado del torneo (Fase actual: Previa en el aula o Final en el Castillo).  
* Reloj de cuenta atrás o marcador destacado del partido en juego.  
* Acceso rápido a inscripción, inicio de sesión y streaming.

### 4.2. Sistema de Autenticación (Auth)

* **Selector de Rol:** Botón o pestaña para elegir entre "Soy Jugador", "Soy Árbitro" o "Acceso Administrador".  
* **Formulario de Registro de Jugadores:**  
  * Nombre y apellidos.  
  * Gamertag / Nick EA FC (único).  
  * Correo electrónico.  
  * Contraseña segura.  
  * Curso / Grupo académico (ej: 1º DAW, 2º ASIR, etc.).  
  * Equipo preferido de FIFA.  
  * Tipo de mando utilizado (propio o del centro).  
* **Formulario de Registro de Árbitros:**  
  * Campos básicos de usuario.  
  * Campo de autorización: `Código de Seguridad de Juez` (para validar credenciales legítimas).  
  * Pista o zona asignada (Aula de informática o Castillo).  
* **Inicio de Sesión (Login):**  
  * Entrada por correo/nick y contraseña con redirección condicional según el rol (`jugador`, `arbitre`, `admin`).

### 4.3. Perfil de Usuario (Mi Cuenta)

* Datos del usuario, avatar temático o escudo de su equipo.  
* Estadísticas del jugador: partidos disputados, goles a favor, goles en contra y estado en el cuadro (Vigente / Eliminado).

### 4.4. Cuadro Eliminatorio Interactivo (Bracket)

* Estructura visual para 16 participantes:  
  * **Octavos de Final:** 8 partidos en el aula de informática.  
  * **Cuartos de Final:** 4 partidos en el aula.  
  * **Semifinales:** 2 partidos en el aula (decisión de los dos finalistas que suben a la fortaleza).  
  * **Gran Final en el Castillo de Xàtiva:** Partido único destacado en la torre mayor.  
* Sincronización instantánea: al finalizar un partido, el ganador pasa automáticamente a la siguiente casilla sin necesidad de recargar la página (*refresh*).

### 4.5. Tablón de Clasificación y Resultados en Vivo

* Tabla de marcadores actualizada en tiempo real.  
* Diferenciación visual clara de los partidos:  
  * *Pendiente* (gris / neutro).  
  * *En juego* (verde neón intermitente / pulsante).  
  * *Finalizado* (naranja / oro).

### 4.6. Panel de Administración de Actas (Árbitros y Administradores)

* Vista privada por pista/partido.  
* Controles táctiles o botones rápidos para sumar/restar goles a cada equipo.  
* Checkbox de incidencias técnicas (aviso de desconexión, fallo de mando, revisión de jugada).  
* Botón de confirmación: `Cerrar Acta Oficial`.

### 4.7. Sala de Retransmisión en Directo (Streaming)

* Reproductor responsive embebido (reproductor Twitch o YouTube Live mediante `iframe`).  
* Diseño optimizado para pantallas de ordenador, tabletas y monitores proyectores del aula.  
* Sección lateral o inferior integrada con el chat del torneo.

### 4.8. Sala de Chat en Directo

* Envío de mensajes en tiempo real sin recarga.  
* Mensajes distinguidos por color e insignias:  
  * Texto estándar para jugadores y espectadores.  
  * Reseña destacada para avisos oficiales con insignia `ÁRBITRO`.  
  * Reseña dorada/roja con insignia `ADMIN` para administradores del sistema.  
* Marcas de tiempo (*timestamps*) en formato `HH:MM`.

### 4.9. Normativa y Reglamento del Torneo

* Condiciones técnicas de los partidos: 5 minutos por parte, modo 95 / valoraciones equilibradas.  
* Procedimiento ante desconexiones o bloqueos del juego.  
* Protocolo de deportividad y código de conducta en las instalaciones.

### 4.10. Información de la Final y Logística en el Castillo

* Horarios detallados de la jornada del 31 de octubre.  
* Protocolo de acceso autorizado y medidas de respeto al patrimonio histórico.  
* Plan de contingencia meteorológica (Plan B ante viento fuerte o lluvia en la fortaleza).  
* Explicación del premio: el izado o proyección del estandarte del campeón durante un año.

## 5\. Modelo de Datos Sugerido

### 5.1. Colección / Tabla `users`

{

  "id": "uuid-1234",

  "name": "Marc Navarro Soler",

  "nick": "NavarroXat\_9",

  "email": "asieratopeferri@gmail.com",

  "password\_hash": "\$2b\$12\$...",

  "role": "admin", // "jugador" | "arbitre" | "admin"

  "course": "2º DAW",

  "club": "Valencia CF",

  "controller\_type": "DualSense PS5",

  "created\_at": "2026-10-19T10:00:00Z"

}

#### Cuentas de Administradores Registradas (`admin`):

1. `asieratopeferri@gmail.com`  
2. `ikealaest@alu.edu.gva.es`  
3. `aarselsan@alu.edu.gva.es`  
4. `cesaroltrapart@gmail.com`

### 5.2. Colección / Tabla `matches`

{

  "match\_id": 1,

  "round": 1, // 1: Octavos, 2: Cuartos, 3: Semis, 4: Final

  "location": "aula", // "aula" | "castillo"

  "player1\_id": "uuid-1234",

  "player2\_id": "uuid-5678",

  "score\_player1": 3,

  "score\_player2": 1,

  "status": "finalitzat", // "pendent" | "en\_curs" | "finalitzat"

  "winner\_id": "uuid-1234",

  "referee\_id": "uuid-9999",

  "updated\_at": "2026-10-31T09:45:00Z"

}

### 5.3. Colección / Tabla `chat_messages`

{

  "message\_id": "msg-001",

  "user\_id": "uuid-9999",

  "user\_nick": "Admin\_Asier",

  "role": "admin",

  "is\_admin": true,

  "is\_referee": false,

  "text": "El torneo comenzará puntualmente a las 09:00h en el aula de informática.",

  "timestamp": "2026-10-31T08:50:00Z"

}

## 6\. Guía de Estilo e Identidad Visual (UI / UX)

* **Concepto:** *Dark Gaming Neón \+ Gótico Medieval de Xàtiva*.  
* **Paleta de Colores:**  
  * Fondo oscuro: `#0b0d13` (Negro grafito) y `#131826` (Gótico nocturno).  
  * Primario (Halloween): `#f97316` / `#ea580c` (Naranja intenso).  
  * Secundario (eSports & Misterio): `#9333ea` / `#7c3aed` (Púrpura neón).  
  * Éxito / En vivo: `#22c55e` (Verde neón deportivo).  
  * Acento noble / Trofeo: `#d4af37` / `#f59e0b` (Oro medieval).  
* **Tipografías:**  
  * Encabezados y títulos destacados: `Cinzel` o `Space Grotesk` (en mayúsculas, espaciado generoso).  
  * Textos de lectura, listas y formularios: `Inter` o `Space Grotesk` (alta legibilidad).  
* **Componentes Visuales:**  
  * Tarjetas con efecto cristal oscuro (*Glassmorphism* con borde fino de color púrpura/naranja).  
  * Resplandores luminosos suaves (*glow effect*) en elementos activos.  
  * Iconografía temática: castillos, mandos de consola, banderas y elementos sutiles de Halloween.
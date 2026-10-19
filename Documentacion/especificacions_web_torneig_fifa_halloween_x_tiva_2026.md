# Especificacions Tècniques i Funcionals: Web Torneig FIFA Halloween Xàtiva 2026

## 1. Visió General del Projecte

* **Nom del Projecte:** Torneig FIFA Halloween Xàtiva 2026 (Gran Final al Castell).

* **Objectiu:** Desenvolupar una plataforma web completa per a la gestió en temps real d'un torneig escolar d'eSports (EA FC / FIFA), amb fase prèvia a l'aula d'informàtica i gran final retransmesa des de la torre del Castell de Xàtiva.

* **Context Metodològic:** Desenvolupat sota el marc de treball àgil **SCRUM** per un equip format per 1 Scrum Master i 3 Developers.

## 2. Pila Tecnològica Recomanada

* **Frontend:** HTML5, CSS3 avançat amb Tailwind CSS o frameworks reactius (React, Vue o Vanilla JS modular).

* **Backend / API:** Node.js amb Express, NestJS o serveis Serverless (Firebase Cloud Functions / Supabase Edge Functions).

* **Base de Dades:**

  * Relacional o Documental en temps real (PostgreSQL amb Supabase o Google Firestore / MongoDB).

* **Temps Real (Real-time):** WebSockets, Socket.io o listeners natius en temps real de la base de dades.

* **Autenticació:** JWT (JSON Web Tokens) o Firebase/Supabase Auth, amb emmagatzematge segur de credencials mitjançant hashing (bcrypt/argon2).

## 3. Rols d'Usuari i Permisos

### 3.1. Jugador (Participant)

* Registre obert amb nom, nick (gamertag), curs i club seleccionat.

* Consulta del seu perfil, historial de partits i proper rival.

* Participació lliure a la sala de xat en directe.

* Visualització del streaming i del quadre competitiu.

### 3.2. Àrbitre / Organitzador (Staff)

* Registre protegit mitjançant **PIN o Clau d'Accés d'Àrbitre**.

* Accés exclusiu al **Panell d'Actes i Administració de Resultats**:

  * Validació de presència de jugadors.

  * Inserció i actualització de marcadors (gols local / visitant, pròrroga, penals).

  * Tancament oficial de partits i avançament automàtic de ronda.

* Insígnia gràfica distintiva (*badge* de jutge / escut d'armes) a la sala de xat per moderació.

## 4. Estructura de Seccions i Requisits Funcionals

### 4.1. Pàgina Principal (Home / Landing)

* Banner d'impacte visual que reflectisca la combinació de Halloween, eSports i la fortalesa de Xàtiva.

* Indicador en directe de l'estat del torneig (Fase actual: Prèvia a l'aula o Final al Castell).

* Rellotge de compte arrere o marcador destacat del partit en joc.

* Accés ràpid a inscripció, inici de sessió i streaming.

### 4.2. Sistema d'Autenticació (Auth)

* **Selector de Rol:** Botó o pestanya per triar entre "Soc Jugador" o "Soc Àrbitre".

* **Formulari de Registre de Jugadors:**

  * Nom i cognoms.

  * Gamertag / Nick EA FC (únic).

  * Correu electrònic.

  * Contrasenya segura.

  * Curs / Grup acadèmic (ex: 1r DAW, 2n ASIR, etc.).

  * Equip preferit de FIFA.

  * Tipus de comandament utilitzat (propi o del centre).

* **Formulari de Registre d'Àrbitres:**

  * Camps bàsics d'usuari.

  * Camp d'autorització: `Codi de Seguretat de Jutge` (per validar credencials legítimes).

  * Pista o zona assignada (Aula d'informàtica o Castell).

* **Inici de Sessió (Login):**

  * Entrada per correu/nick i contrasenya per a ambdós rols amb redirecció condicional segons el rol.

### 4.3. Perfil d'Usuari (La Meva Compte)

* Dades de l'usuari, avatar temàtic o escut del seu equip.

* Estadístiques del jugador: partits disputats, gols a favor, gols en contra i estat al quadre (Vigent / Eliminat).

### 4.4. Quadre Eliminatori Interactiu (Bracket)

* Estructura visual per a 16 participants:

  * **Vuitens de Final:** 8 partits a l'aula d'informàtica.

  * **Quarts de Final:** 4 partits a l'aula.

  * **Semifinals:** 2 partits a l'aula (decisió dels dos finalistes que pugen a la fortalesa).

  * **Gran Final al Castell de Xàtiva:** Partit únic destacat a la torre major.

* Sincronització instantània: en finalitzar un partit, el guanyador passa automàticament a la següent casella sense necessitat de recarregar la pàgina (*refresh*).

### 4.5. Tabló de Classificació i Resultats en Viu

* Taula de marcadors actualitzada en temps real.

* Diferenciació visual clara dels partits:

  * *Pendent* (gris / neutre).

  * *En joc* (verd neó intermitent / polsant).

  * *Finalitzat* (taronja / or).

### 4.6. Panell d'Administració d'Actes (Només Àrbitres)

* Vista privada per pista/partit.

* Controls tàctils o botons ràpids per sumar/restar gols a cada equip.

* Checkbox d'incidències tècniques (avís de desconnexió, fallada de comandament, revisió de jugada).

* Botó de confirmació: `Tancar Acta Oficial`.

### 4.7. Sala de Retransmissió en Directe (Streaming)

* Reproductor responsive embebit (reproductor Twitch o YouTube Live mitjançant `iframe`).

* Disseny optimitzat per a pantalles d'ordinador, tauletes i monitors projectors de l'aula.

* Secció lateral o inferior integrada amb el xat del torneig.

### 4.8. Sala de Xat en Directe

* Enviament de missatges en temps real sense recàrrega.

* Missatges distingits per color:

  * Text estàndard per a jugadors i espectadors.

  * Ressenya destacada (fons daurat/morat i etiqueta `ÀRBITRE` o `STAFF`) per a avisos oficials.

* Marques de temps (*timestamps*) en format `HH:MM`.

### 4.9. Normativa i Reglament del Torneig

* Condicions tècniques dels partits: 5 minuts per part, mode 95 / valoracions equilibrades.

* Procediment davant desconnexions o bloquejos del joc.

* Protocol d'esportivitat i codi de conducta a les instal·lacions.

### 4.10. Informació de la Final i Logística al Castell

* Horaris detallats de la jornada del 31 d'octubre.

* Protocol d'accés autoritzat i mesures de respecte al patrimoni històric.

* Pla de contingència meteorològica (Pla B davant vent fort o pluja a la fortalesa).

* Explicació del premi: l'hissat o projecció de l'estandard del campió durant un any.

## 5. Model de Dades Suggerit

### 5.1. Col·lecció / Taula `users`

```
{
  "id": "uuid-1234",
  "name": "Marc Navarro Soler",
  "nick": "NavarroXat_9",
  "email": "marc.navarro@centre.edu",
  "password_hash": "$2b$12$...",
  "role": "jugador", // "jugador" | "arbitre"
  "course": "2n DAW",
  "club": "València CF",
  "controller_type": "DualSense PS5",
  "created_at": "2026-10-19T10:00:00Z"
}

```

### 5.2. Col·lecció / Taula `matches`

```
{
  "match_id": 1,
  "round": 1, // 1: Vuitens, 2: Quarts, 3: Semis, 4: Final
  "location": "aula", // "aula" | "castell"
  "player1_id": "uuid-1234",
  "player2_id": "uuid-5678",
  "score_player1": 3,
  "score_player2": 1,
  "status": "finalitzat", // "pendent" | "en_curs" | "finalitzat"
  "winner_id": "uuid-1234",
  "referee_id": "uuid-9999",
  "updated_at": "2026-10-31T09:45:00Z"
}

```

### 5.3. Col·lecció / Taula `chat_messages`

```
{
  "message_id": "msg-001",
  "user_id": "uuid-9999",
  "user_nick": "Arbitre_David",
  "is_referee": true,
  "text": "Comença la primera semifinal a l'aula 4!",
  "timestamp": "2026-10-31T11:30:15Z"
}

```

## 6. Guia d'Estil i Identitat Visual (UI / UX)

* **Concepte:** *Dark Gaming Neó + Gòtic Medieval de Xàtiva*.

* **Paleta de Colors:**

  * Fons fosc: `#0b0d13` (Negre grafito) i `#131826` (Gòtic nocturn).

  * Primari (Halloween): `#f97316` / `#ea580c` (Taronja intens).

  * Secundari (eSports & Misteri): `#9333ea` / `#7c3aed` (Porpra neó).

  * Èxit / En viu: `#22c55e` (Verd neó esportiu).

  * Acent noble / Trofeu: `#d4af37` / `#f59e0b` (Or medieval).

* **Tipografies:**

  * Capçaleres i títols destacats: `Cinzel` o `Space Grotesk` (en majúscules, espaiat generós).

  * Textos de lectura, llistes i formularis: `Inter` o `Space Grotesk` (alta llegibilitat).

* **Components Visuals:**

  * Targetes amb efecte vidre fosc (*Glassmorphism* amb vora fina de color porpra/taronja).

  * Ressenyes lluminoses suaus (*glow effect*) en elements actius.

  * Iconografia temàtica: castells, mandos de consola, banderes i elements subtils de Halloween.
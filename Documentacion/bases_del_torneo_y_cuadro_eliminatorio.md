# CLASH FOOTBALLWEEN: Bases del Torneo y Cuadro Eliminatorio

## 1. Definición del Modelo de Datos de Usuario/Jugador

Este modelo define la estructura de datos que se almacena en la base de datos (PostgreSQL, MongoDB o Firebase) para cada participante o miembro del arbitraje registrado en la plataforma.

### 1.1 Interfaz TypeScript

```typescript
export interface Jugador {
  id: string;                    // Identificador único (UUID, ej: "usr-a1b2c3d4")
  nombreCompleto: string;        // Nombre y apellidos reales del alumno
  gamertag: string;              // Apodo competitivo de EA SPORTS FC / FIFA (ej: "XativaStriker_99")
  email: string;                 // Correo institucional o personal verificado
  passwordHash: string;          // Hash seguro de la contraseña (bcrypt/argon2)
  curso: string;                 // Grupo o titulación (ej: "1º DAW", "2º ASIR", "1º SMX")
  rol: 'jugador' | 'arbitro';    // Rol de cuenta y permisos en la web
  equipoAsignado: string;        // Club/Selección asignada (ej: "Valencia CF", "Real Madrid")
  tipoMando: 'DualSense PS5' | 'Xbox Series' | 'Mando del Centro';
  estado: 'activo' | 'eliminado' | 'finalista' | 'campeon';
  estadisticas: {
    partidosJugados: number;
    victorias: number;
    derrotas: number;
    golesAFavor: number;
    golesEnContra: number;
  };
  creadoEn: string;              // Marca de tiempo ISO (ej: "2026-10-19T09:30:00Z")
}
```

### 1.2 Ejemplo de Registro en Formato JSON

```json
{
  "id": "usr-8f43c9",
  "nombreCompleto": "Marc Navarro Soler",
  "gamertag": "NavarroXat_9",
  "email": "m.navarro@ieselcastell.edu",
  "curso": "2º DAW",
  "rol": "jugador",
  "equipoAsignado": "Valencia CF",
  "tipoMando": "DualSense PS5",
  "estado": "activo",
  "estadisticas": {
    "partidosJugados": 0,
    "victorias": 0,
    "derrotas": 0,
    "golesAFavor": 0,
    "golesEnContra": 0
  },
  "creadoEn": "2026-10-19T10:15:00Z"
}
```

---

## 2. Estructura JSON del Cuadro Eliminatorio (Bracket)

El cuadro se organiza en 4 rondas correlativas con emparejamientos en árbol binario (16 participantes $\rightarrow$ 8 en octavos $\rightarrow$ 4 en cuartos $\rightarrow$ 2 en semifinales $\rightarrow$ final única en el castillo).

```json
{
  "torneo": "CLASH FOOTBALLWEEN",
  "edicion": "Halloween Xàtiva 2026",
  "totalRondas": 4,
  "rondas": [
    {
      "idRonda": 1,
      "nombre": "Octavos de Final",
      "sede": "Aula de Informática",
      "partidos": [
        {
          "idPartido": "M-01",
          "siguientePartidoId": "M-09",
          "jugadorLocal": { "id": "usr-8f43c9", "gamertag": "NavarroXat_9" },
          "jugadorVisitante": { "id": "usr-12a88e", "gamertag": "TortosaGamer" },
          "golesLocal": 3,
          "golesVisitante": 1,
          "ganadorId": "usr-8f43c9",
          "estado": "finalizado",
          "arbitroId": "arb-01"
        },
        {
          "idPartido": "M-02",
          "siguientePartidoId": "M-09",
          "jugadorLocal": { "id": "usr-34bc71", "gamertag": "CarlaGol7" },
          "jugadorVisitante": { "id": "usr-90ff23", "gamertag": "Vidal_X" },
          "golesLocal": 2,
          "golesVisitante": 0,
          "ganadorId": "usr-34bc71",
          "estado": "finalizado",
          "arbitroId": "arb-02"
        },
        {
          "idPartido": "M-03",
          "siguientePartidoId": "M-10",
          "jugadorLocal": { "id": "usr-55da12", "gamertag": "SergiKing" },
          "jugadorVisitante": { "id": "usr-66ee34", "gamertag": "Luci_Striker" },
          "golesLocal": 4,
          "golesVisitante": 2,
          "ganadorId": "usr-55da12",
          "estado": "finalizado",
          "arbitroId": "arb-01"
        },
        {
          "idPartido": "M-04",
          "siguientePartidoId": "M-10",
          "jugadorLocal": { "id": "usr-77fa45", "gamertag": "BoludaCastle" },
          "jugadorVisitante": { "id": "usr-88ba56", "gamertag": "MartaXativa" },
          "golesLocal": 1,
          "golesVisitante": 0,
          "ganadorId": "usr-77fa45",
          "estado": "finalizado",
          "arbitroId": "arb-02"
        },
        {
          "idPartido": "M-05",
          "siguientePartidoId": "M-11",
          "jugadorLocal": { "id": "usr-99ca67", "gamertag": "Albi_Gamer" },
          "jugadorVisitante": { "id": "usr-10db78", "gamertag": "CerdaWizard" },
          "golesLocal": 1,
          "golesVisitante": 2,
          "ganadorId": "usr-10db78",
          "estado": "finalizado",
          "arbitroId": "arb-03"
        },
        {
          "idPartido": "M-06",
          "siguientePartidoId": "M-11",
          "jugadorLocal": { "id": "usr-21ea89", "gamertag": "Sara_Goal" },
          "jugadorVisitante": { "id": "usr-32fa90", "gamertag": "RocaFort" },
          "golesLocal": 0,
          "golesVisitante": 1,
          "ganadorId": "usr-32fa90",
          "estado": "finalizado",
          "arbitroId": "arb-03"
        },
        {
          "idPartido": "M-07",
          "siguientePartidoId": "M-12",
          "jugadorLocal": { "id": "usr-43ab01", "gamertag": "Fayos_99" },
          "jugadorVisitante": { "id": "usr-54bc12", "gamertag": "Neus_Castle" },
          "golesLocal": 2,
          "golesVisitante": 0,
          "ganadorId": "usr-43ab01",
          "estado": "finalizado",
          "arbitroId": "arb-04"
        },
        {
          "idPartido": "M-08",
          "siguientePartidoId": "M-12",
          "jugadorLocal": { "id": "usr-65cd23", "gamertag": "Vila_Sniper" },
          "jugadorVisitante": { "id": "usr-76de34", "gamertag": "ElenaQueen" },
          "golesLocal": 1,
          "golesVisitante": 3,
          "ganadorId": "usr-76de34",
          "estado": "finalizado",
          "arbitroId": "arb-04"
        }
      ]
    },
    {
      "idRonda": 2,
      "nombre": "Cuartos de Final",
      "sede": "Aula de Informática",
      "partidos": [
        {
          "idPartido": "M-09",
          "siguientePartidoId": "M-13",
          "jugadorLocal": { "id": "usr-8f43c9", "gamertag": "NavarroXat_9" },
          "jugadorVisitante": { "id": "usr-34bc71", "gamertag": "CarlaGol7" },
          "golesLocal": 2,
          "golesVisitante": 1,
          "ganadorId": "usr-8f43c9",
          "estado": "finalizado",
          "arbitroId": "arb-01"
        },
        {
          "idPartido": "M-10",
          "siguientePartidoId": "M-13",
          "jugadorLocal": { "id": "usr-55da12", "gamertag": "SergiKing" },
          "jugadorVisitante": { "id": "usr-77fa45", "gamertag": "BoludaCastle" },
          "golesLocal": 3,
          "golesVisitante": 2,
          "ganadorId": "usr-55da12",
          "estado": "finalizado",
          "arbitroId": "arb-02"
        },
        {
          "idPartido": "M-11",
          "siguientePartidoId": "M-14",
          "jugadorLocal": { "id": "usr-10db78", "gamertag": "CerdaWizard" },
          "jugadorVisitante": { "id": "usr-32fa90", "gamertag": "RocaFort" },
          "golesLocal": 2,
          "golesVisitante": 0,
          "ganadorId": "usr-10db78",
          "estado": "finalizado",
          "arbitroId": "arb-03"
        },
        {
          "idPartido": "M-12",
          "siguientePartidoId": "M-14",
          "jugadorLocal": { "id": "usr-43ab01", "gamertag": "Fayos_99" },
          "jugadorVisitante": { "id": "usr-76de34", "gamertag": "ElenaQueen" },
          "golesLocal": 1,
          "golesVisitante": 2,
          "ganadorId": "usr-76de34",
          "estado": "finalizado",
          "arbitroId": "arb-04"
        }
      ]
    },
    {
      "idRonda": 3,
      "nombre": "Semifinales",
      "sede": "Aula de Informática",
      "partidos": [
        {
          "idPartido": "M-13",
          "siguientePartidoId": "M-15",
          "jugadorLocal": { "id": "usr-8f43c9", "gamertag": "NavarroXat_9" },
          "jugadorVisitante": { "id": "usr-55da12", "gamertag": "SergiKing" },
          "golesLocal": 2,
          "golesVisitante": 0,
          "ganadorId": "usr-8f43c9",
          "estado": "finalizado",
          "arbitroId": "arb-master"
        },
        {
          "idPartido": "M-14",
          "siguientePartidoId": "M-15",
          "jugadorLocal": { "id": "usr-10db78", "gamertag": "CerdaWizard" },
          "jugadorVisitante": { "id": "usr-76de34", "gamertag": "ElenaQueen" },
          "golesLocal": 1,
          "golesVisitante": 3,
          "ganadorId": "usr-76de34",
          "estado": "finalizado",
          "arbitroId": "arb-master"
        }
      ]
    },
    {
      "idRonda": 4,
      "nombre": "Gran Final",
      "sede": "Cima del Castillo de Xàtiva",
      "partidos": [
        {
          "idPartido": "M-15",
          "siguientePartidoId": null,
          "jugadorLocal": { "id": "usr-8f43c9", "gamertag": "NavarroXat_9" },
          "jugadorVisitante": { "id": "usr-76de34", "gamertag": "ElenaQueen" },
          "golesLocal": null,
          "golesVisitante": null,
          "ganadorId": null,
          "estado": "listo_para_jugar",
          "arbitroId": "arb-master"
        }
      ]
    }
  ]
}
```

---

## 3. Reglamento Base Oficial de CLASH FOOTBALLWEEN

### 3.1 Formato de Partida y Ajustes Técnicos
* **Duración:** 5 minutos por tiempo (10 minutos de juego real por partido).
* **Dificultad:** Leyenda.
* **Velocidad de juego:** Predeterminada / Normal.
* **Cámara de visualización:** Teleabierta (por defecto). Cualquier cambio debe acordarse de mutuo acuerdo antes del saque inicial.
* **Equilibrio de equipos:** Modo 95 / Medias igualadas obligatorio en todos los puestos para que ningún equipo posea ventaja estadística sobre otro.

### 3.2 Resolución de Empates
1. Si al finalizar los 90 minutos reglamentarios el marcador permanece igualado, se disputará una **prórroga clásica** (dos partes de 2,5 minutos).
2. Si persiste el empate al terminar la prórroga, el pase de ronda se determinará mediante **tanda de penaltis directa**.
3. No se admiten partidos de desempate ni repetición de encuentros.

### 3.3 Pausas y Conducta Deportiva (Fair Play)
* Cada jugador dispone de un máximo de **2 pausas** por encuentro.
* Las pausas solo podrán solicitarse cuando el balón esté detenido fuera de juego (saque de banda, saque de puerta, córner o falta).
* El uso indebido de pausas en transiciones de ataque rival conllevará una advertencia arbitral y la pérdida de posesión.

### 3.4 Desconexiones e Incidencias Técnicas
* **Corte antes del minuto 45:** Si ocurre una desconexión o corte eléctrico accidental, el partido se reinicia jugando solo un tiempo de 5 minutos, sumando el resultado previo al reinicio.
* **Corte a partir del minuto 46:** Se disputa únicamente el tiempo restante manteniendo la ventaja en el marcador.
* **Avería de mandos:** El jugador debe informar de inmediato al árbitro levantando la mano en juego detenido para reemplazar el mando por uno de reserva del centro.

---

## 4. Criterios de Pase de Ronda y Lógica Backend

Esta sección detalla las reglas de negocio que ejecuta la API del backend al recibir el acta arbitral de un partido.

### 4.1 Validaciones Previas
1. **Verificación de Rol:** La petición HTTP debe portar un JWT válido con rol de árbitro (`role: 'arbitro'`).
2. **Imposibilidad de Empate:** La API rechaza cualquier intento de cierre con `golesLocal === golesVisitante`. Si hubo penaltis, el árbitro anota el gol de desempate de la tanda.
3. **Estado del Encuentro:** El partido debe estar en estado `'en_curso'` o `'listo_para_jugar'`.

### 4.2 Algoritmo de Avance y Propagación
```text
DADO UN PARTIDO CERRADO:
1. Comparar marcadores:
   SI golesLocal > golesVisitante ENTONCES
      ganadorId = jugadorLocal.id
   SI NO
      ganadorId = jugadorVisitante.id
   FIN SI

2. Actualizar estado del partido actual:
   partidoActual.estado = 'finalizado'
   partidoActual.ganadorId = ganadorId

3. Localizar el siguiente partido usando partidoActual.siguientePartidoId:
   SI siguientePartidoId != NULL ENTONCES
      partidoDestino = buscarPartido(siguientePartidoId)
      
      SI partidoDestino.jugadorLocal == NULL ENTONCES
         partidoDestino.jugadorLocal = obtenerDatosJugador(ganadorId)
      SI NO
         partidoDestino.jugadorVisitante = obtenerDatosJugador(ganadorId)
         partidoDestino.estado = 'listo_para_jugar'
      FIN SI
   FIN SI

4. Disparar evento WebSocket / Real-time:
   emitirEvento('BRACKET_UPDATED', { idPartido, ganadorId, siguientePartidoId })
```

### 4.3 Actualización de Clasificación y Perfil
* El backend incrementa en `+1` las victorias del ganador y en `+1` las derrotas del perdedor en la tabla `users`.
* El jugador derrotado pasa automáticamente a estado `'eliminado'`.
* Cuando se cierra el partido `M-15` (la gran final), el ganador pasa a estado `'campeon'` y su nombre queda vinculado al módulo del estandarte del Castillo de Xàtiva.
### 3. Software, Base de Datos y Panel Admin (`/admin`)

* **Despliegue en Supabase (PostgreSQL 15):** 
  Arquitectura relacional con 3 tablas principales (`perfiles`, `partidos`, `chat_mensajes`) y 3 vistas seguras con RLS para alimentar el cuadro y las fichas.

* **Seguridad y Acceso Restringido (`/admin`):**
  Autenticación JWT. Acceso exclusivo a `/admin` para los 4 correos autorizados mediante triggers SQL, y actas arbitrales blindadas contra re-arbitraje.

* **Tiempo Real sin Refresco (WebSockets):**
  Canales de `supabase_realtime` que propagan goles, actas cerradas y mensajes a todos los espectadores en menos de 100 ms (*0 refresh*).

---

> **Nota para decir en la defensa (10 segundos):**  
> *"Hemos desplegado Supabase con PostgreSQL 15, estructurado en 3 tablas y 3 vistas con seguridad RLS. Blindamos el acceso a `/admin` para los 4 correos oficiales y, gracias a Supabase Realtime con WebSockets, los marcadores y el chat se actualizan al instante en las pantallas de todos los espectadores sin recargar."*

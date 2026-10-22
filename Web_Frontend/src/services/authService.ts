import {
  UserProfile,
  LoginPayload,
  RegisterJugadorPayload,
  RegisterArbitroPayload,
  RegisterUsuarioPayload,
  UserRole,
  ControllerType
} from '../types/user';
import { ADMIN_EMAILS, STORAGE_KEYS } from '../config/constants';
import { AVATAR_BUCKET, isSupabaseConfigured, requireSupabase } from './supabase';

/**
 * Autenticación y perfiles.
 *
 * · Con Supabase configurado (Web_Frontend/.env): Supabase Auth + tabla
 *   `perfiles` + bucket `avatares`.
 * · Sin configurar: modo local de respaldo con localStorage, para poder
 *   desarrollar la interfaz antes de crear el proyecto Supabase.
 */

export interface RegisterResult {
  user: UserProfile;
  /** true si Supabase exige confirmar el correo antes de iniciar sesión. */
  requiresEmailConfirmation: boolean;
}

interface StoredAccount extends UserProfile {
  pass: string;
}

interface ProfileRow {
  id: string;
  email: string | null;
  nombre_completo: string | null;
  gamertag: string | null;
  rol: string | null;
  avatar_url: string | null;
  bio: string | null;
  club_nombre: string | null;
  club_short: string | null;
  club_badge: string | null;
  club_color: string | null;
  club_color2: string | null;
  club_stadium: string | null;
  liga: string | null;
  tipo_mando: string | null;
  zona: string | null;
  player_number: number | null;
  seed: number | null;
  referee_slot: number | null;
  matches_played: number | null;
  goals_scored: number | null;
  goals_conceded: number | null;
  is_eliminated: boolean | null;
  created_at: string | null;
}

/* ════════════════════════════════════════════════════════════════
   Utilidades generales
   ════════════════════════════════════════════════════════════════ */

function persistSession(user: UserProfile): void {
  localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(user));
}

function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
  localStorage.removeItem('cf_user_session');
  localStorage.removeItem('cf_current_user');
  localStorage.removeItem('cf_auth_token');
  localStorage.removeItem('user');
  localStorage.removeItem('session');
}

function toProfile(account: StoredAccount): UserProfile {
  const { pass: _pass, ...profile } = account;
  return profile;
}

function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    email: row.email ?? '',
    nombre_completo: row.nombre_completo ?? '',
    gamertag: row.gamertag ?? '',
    rol: (row.rol as UserRole) ?? 'usuario',
    avatar_url: row.avatar_url ?? undefined,
    bio: row.bio ?? undefined,
    club_elegido: row.club_nombre ?? undefined,
    club_short: row.club_short ?? undefined,
    club_badge: row.club_badge ?? undefined,
    club_color: row.club_color ?? undefined,
    club_color2: row.club_color2 ?? undefined,
    club_stadium: row.club_stadium ?? undefined,
    liga: row.liga ?? undefined,
    tipo_mando: (row.tipo_mando as ControllerType | null) ?? undefined,
    zona: (row.zona as UserProfile['zona']) ?? undefined,
    player_number: row.player_number ?? undefined,
    seed: row.seed ?? undefined,
    referee_slot: row.referee_slot ?? undefined,
    matches_played: row.matches_played ?? 0,
    goals_scored: row.goals_scored ?? 0,
    goals_conceded: row.goals_conceded ?? 0,
    is_eliminated: row.is_eliminated ?? false,
    created_at: row.created_at ?? undefined
  };
}

async function fetchProfileByUserId(userId: string): Promise<UserProfile | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('perfiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle<ProfileRow>();

  if (error) throw error;
  return data ? mapProfile(data) : null;
}

/* ════════════════════════════════════════════════════════════════
   Fotos de perfil (Storage)
   ════════════════════════════════════════════════════════════════ */

async function uploadAvatarFile(userId: string, file: File): Promise<string> {
  const client = requireSupabase();
  const rawExt = file.name.split('.').pop()?.toLowerCase() ?? '';
  const ext = /^[a-z0-9]{2,5}$/.test(rawExt) ? rawExt : 'jpg';
  const path = `${userId}/avatar-${Date.now()}.${ext}`;

  const { error } = await client.storage.from(AVATAR_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type || undefined
  });

  if (error) throw new Error(`No se pudo subir la foto: ${error.message}`);

  const { data } = client.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function saveAvatarUrl(userId: string, avatarUrl: string): Promise<UserProfile | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('perfiles')
    .update({ avatar_url: avatarUrl })
    .eq('user_id', userId)
    .select('*')
    .maybeSingle<ProfileRow>();

  if (error) throw new Error(`No se pudo guardar la foto en el perfil: ${error.message}`);
  return data ? mapProfile(data) : null;
}

/* ════════════════════════════════════════════════════════════════
   Modo local de respaldo
   ════════════════════════════════════════════════════════════════ */

function readAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as StoredAccount[]) : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: StoredAccount[]): void {
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
}

function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

function nextNumber(accounts: StoredAccount[], rol: UserRole): number {
  return accounts.filter(account => account.rol === rol).length + 1;
}

function localRegister(
  payload: {
    email: string;
    pass: string;
    nombre_completo: string;
    gamertag: string;
    rol: UserRole;
    avatar_file?: File | null;
  },
  extra: Partial<UserProfile>
): RegisterResult {
  const accounts = readAccounts();
  const emailNorm = payload.email.trim().toLowerCase();

  if (accounts.some(item => item.email.trim().toLowerCase() === emailNorm)) {
    throw new Error('Ya existe una cuenta registrada con ese correo.');
  }
  if (
    accounts.some(
      item => (item.gamertag || '').trim().toLowerCase() === payload.gamertag.trim().toLowerCase()
    )
  ) {
    throw new Error('Ese gamertag ya está en uso. Prueba con otro.');
  }

  const role: UserRole = isAdminEmail(emailNorm) ? 'admin' : payload.rol;
  const dorsalNumber =
    payload.rol === 'arbitro'
      ? 4
      : payload.rol === 'jugador'
        ? (extra.seed === 11 || extra.player_number === 16 ? 16 : nextNumber(accounts, payload.rol))
        : nextNumber(accounts, payload.rol);

  const user: UserProfile = {
    id: createId(payload.rol === 'arbitro' ? 'arb' : payload.rol === 'usuario' ? 'fan' : 'usr'),
    email: payload.email.trim(),
    nombre_completo: payload.nombre_completo.trim(),
    gamertag: payload.gamertag.trim(),
    rol: role,
    referee_slot: payload.rol === 'arbitro' ? 4 : undefined,
    player_number: dorsalNumber,
    created_at: new Date().toISOString(),
    ...extra
  };

  writeAccounts([...accounts, { ...user, pass: payload.pass }]);
  persistSession(user);
  return { user, requiresEmailConfirmation: false };
}

/* ════════════════════════════════════════════════════════════════
   Registro con Supabase
   ════════════════════════════════════════════════════════════════ */

interface SignUpInput {
  email: string;
  pass: string;
  nombre_completo: string;
  gamertag: string;
  rol: 'jugador' | 'arbitro' | 'usuario';
  bio?: string;
  club_elegido?: string;
  club_badge?: string;
  club_short?: string;
  club_color?: string;
  club_color2?: string;
  club_stadium?: string;
  liga?: string;
  tipo_mando?: ControllerType;
  zona?: 'Aula de informática' | 'Castillo';
  avatar_file?: File | null;
}

async function assertDisponible(email: string, gamertag?: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const client = requireSupabase();

  const emailCheck = await client.rpc('email_disponible', { p_email: email.trim() });
  if (emailCheck.error) throw new Error(emailCheck.error.message);
  if (emailCheck.data === false) {
    throw new Error('Ya existe una cuenta registrada con ese correo.');
  }

  if (gamertag && gamertag.trim()) {
    const tagCheck = await client.rpc('gamertag_disponible', { p_gamertag: gamertag.trim() });
    if (tagCheck.error) throw new Error(tagCheck.error.message);
    if (tagCheck.data === false) {
      throw new Error('Ese gamertag ya está en uso. Prueba con otro.');
    }
  }
}

async function signUp(input: SignUpInput): Promise<RegisterResult> {
  if (!isSupabaseConfigured) {
    return localRegister(
      {
        email: input.email,
        pass: input.pass,
        nombre_completo: input.nombre_completo,
        gamertag: input.gamertag,
        rol: input.rol,
        avatar_file: input.avatar_file
      },
      {
        avatar_url: undefined,
        bio: input.bio,
        club_elegido: input.club_elegido,
        club_badge: input.club_badge,
        club_short: input.club_short,
        club_color: input.club_color,
        club_color2: input.club_color2,
        club_stadium: input.club_stadium,
        liga: input.liga,
        tipo_mando: input.tipo_mando,
        zona: input.zona
      }
    );
  }

  await assertDisponible(input.email, input.gamertag);
  const client = requireSupabase();

  const { data, error } = await client.auth.signUp({
    email: input.email.trim(),
    password: input.pass,
    options: {
      data: {
        rol: input.rol,
        nombre_completo: input.nombre_completo.trim(),
        gamertag: input.gamertag.trim(),
        bio: input.bio ?? null,
        club_nombre: input.club_elegido ?? null,
        club_short: input.club_short ?? null,
        club_badge: input.club_badge ?? null,
        club_color: input.club_color ?? null,
        club_color2: input.club_color2 ?? null,
        club_stadium: input.club_stadium ?? null,
        liga: input.liga ?? null,
        tipo_mando: input.tipo_mando ?? null,
        zona: input.zona ?? null
      }
    }
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes('already registered') || message.includes('already been registered')) {
      throw new Error('Ya existe una cuenta registrada con ese correo.');
    }
    if (message.includes('duplicate') || message.includes('unique')) {
      throw new Error('Ese correo o gamertag ya está en uso. Prueba con otros datos.');
    }
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('No se ha podido crear la cuenta. Inténtalo de nuevo.');
  }

  const requiresEmailConfirmation = !data.session;
  let profile: UserProfile | null = null;

  if (data.session) {
    profile = await fetchProfileByUserId(data.user.id);
    if (!profile) {
      // El trigger de alta puede tardar unos milisegundos.
      await sleep(500);
      profile = await fetchProfileByUserId(data.user.id);
    }

    if (profile && input.avatar_file) {
      try {
        const avatarUrl = await uploadAvatarFile(data.user.id, input.avatar_file);
        const withAvatar = await saveAvatarUrl(data.user.id, avatarUrl);
        if (withAvatar) profile = withAvatar;
      } catch (avatarError) {
        // La cuenta ya está creada: la foto podrá subirse desde el perfil.
        console.warn('No se pudo subir la foto de perfil:', avatarError);
      }
    }
  }
  // Sin sesión (confirmación de correo activa) no se puede leer `perfiles`
  // por RLS; el resumen usa los datos del formulario.

  if (!profile) {
    profile = {
      id: data.user.id,
      email: input.email.trim(),
      nombre_completo: input.nombre_completo.trim(),
      gamertag: input.gamertag.trim(),
      rol: input.rol,
      avatar_url: undefined,
      bio: input.bio,
      club_elegido: input.club_elegido,
      club_badge: input.club_badge,
      club_short: input.club_short,
      club_color: input.club_color,
      club_color2: input.club_color2,
      club_stadium: input.club_stadium,
      liga: input.liga,
      tipo_mando: input.tipo_mando,
      zona: input.zona,
      // El registro real ocupa el hueco reservado del cuadro (jugador 16) o plaza 4 (árbitro).
      seed: input.rol === 'jugador' ? 11 : undefined,
      referee_slot: input.rol === 'arbitro' ? 4 : undefined,
      player_number: input.rol === 'jugador' ? 16 : input.rol === 'arbitro' ? 4 : undefined,
      created_at: new Date().toISOString()
    };
  }

  if (data.session) persistSession(profile);

  return { user: profile, requiresEmailConfirmation };
}

/* ════════════════════════════════════════════════════════════════
   API pública
   ════════════════════════════════════════════════════════════════ */

export const authService = {
  /** Sesión cacheada (síncrona). La sesión real se valida en `init`. */
  getCurrentSession(): UserProfile | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
      return data ? (JSON.parse(data) as UserProfile) : null;
    } catch {
      return null;
    }
  },

  /** Recupera la sesión de Supabase y el perfil de la BBDD. */
  async init(): Promise<UserProfile | null> {
    if (!isSupabaseConfigured) {
      return this.getCurrentSession();
    }

    const client = requireSupabase();
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (!data.session?.user) {
      clearSession();
      return null;
    }

    const profile = await fetchProfileByUserId(data.session.user.id);
    if (profile) persistSession(profile);
    return profile;
  },

  /** Escucha los cambios de sesión de Supabase Auth. */
  onAuthStateChange(callback: (user: UserProfile | null) => void): () => void {
    if (!isSupabaseConfigured || !requireSupabase()) return () => undefined;

    const client = requireSupabase();
    const { data } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        clearSession();
        callback(null);
        return;
      }
      void fetchProfileByUserId(session.user.id)
        .then(profile => {
          if (profile) persistSession(profile);
          callback(profile);
        })
        .catch(() => callback(null));
    });

    return () => data.subscription.unsubscribe();
  },

  /** Número que tendrá el próximo jugador registrado (solo modo local). */
  peekNextNumber(rol: UserRole = 'jugador'): number {
    return nextNumber(readAccounts(), rol);
  },

  /** Comprueba si un correo ya está registrado (BBDD o modo local). */
  async isEmailTaken(email: string): Promise<boolean> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return false;

    if (isSupabaseConfigured) {
      const client = requireSupabase();
      const { data, error } = await client.rpc('email_disponible', { p_email: normalized });
      if (error) return false;
      return data === false;
    }

    return readAccounts().some(account => account.email.trim().toLowerCase() === normalized);
  },

  /** Comprueba si un gamertag ya está en uso (BBDD o modo local). */
  async isGamertagTaken(gamertag: string): Promise<boolean> {
    const normalized = gamertag.trim().toLowerCase();
    if (!normalized) return false;

    if (isSupabaseConfigured) {
      const client = requireSupabase();
      const { data, error } = await client.rpc('gamertag_disponible', {
        p_gamertag: normalized
      });
      if (error) return false;
      return data === false;
    }

    return readAccounts().some(
      account => (account.gamertag || '').trim().toLowerCase() === normalized
    );
  },

  async login(payload: LoginPayload): Promise<UserProfile> {
    const email = payload.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Introduce un correo electrónico válido.');
    }

    if (!isSupabaseConfigured) {
      const accounts = readAccounts();
      const account = accounts.find(
        item => item.email.trim().toLowerCase() === email.toLowerCase()
      );
      if (!account || account.pass !== payload.pass) {
        throw new Error('Correo o contraseña incorrectos.');
      }
      const role: UserRole = isAdminEmail(email) ? 'admin' : account.rol;
      const user = toProfile({ ...account, rol: role });
      persistSession(user);
      return user;
    }

    const client = requireSupabase();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password: payload.pass
    });

    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes('invalid login') || message.includes('invalid credentials')) {
        throw new Error('Correo o contraseña incorrectos.');
      }
      if (message.includes('email not confirmed')) {
        throw new Error('Confirma tu correo electrónico antes de iniciar sesión.');
      }
      throw new Error(error.message);
    }

    if (!data.user) throw new Error('No se ha podido iniciar sesión.');

    const profile = await fetchProfileByUserId(data.user.id);
    if (!profile) {
      throw new Error('Tu cuenta no tiene perfil en la BBDD. Ejecuta completo.sql en Supabase.');
    }

    persistSession(profile);
    return profile;
  },

  async registerJugador(payload: RegisterJugadorPayload): Promise<RegisterResult> {
    if (!payload.nombre_completo.trim()) throw new Error('El nombre completo es obligatorio.');
    if (!payload.gamertag.trim()) throw new Error('El gamertag de EA FC es obligatorio.');
    if (!payload.club_elegido) throw new Error('Elige el club con el que vas a jugar.');
    if (payload.pass.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');

    return signUp({
      ...payload,
      rol: 'jugador'
    });
  },

  async registerArbitro(payload: RegisterArbitroPayload): Promise<RegisterResult> {
    if (!payload.nombre_completo.trim()) throw new Error('El nombre completo es obligatorio.');
    if (payload.pass.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');

    // Sin PIN ni club: el gamertag se genera a partir del correo (único) para
    // que dos árbitros con el mismo nombre no colisionen.
    const emailUser = payload.email.trim().split('@')[0].replace(/[^a-z0-9._-]/gi, '');
    const gamertag = `Juez_${emailUser || Date.now().toString(36)}`.slice(0, 32);

    return signUp({
      ...payload,
      gamertag,
      zona: payload.zona ?? 'Aula de informática',
      rol: 'arbitro'
    });
  },

  async registerUsuario(payload: RegisterUsuarioPayload): Promise<RegisterResult> {
    if (!payload.nombre_completo.trim()) throw new Error('El nombre completo es obligatorio.');
    if (payload.pass.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');

    return signUp({
      ...payload,
      gamertag: payload.gamertag?.trim() || payload.nombre_completo.trim().split(/\s+/)[0],
      rol: 'usuario'
    });
  },

  /** Sube una nueva foto de perfil y actualiza `perfiles.avatar_url`. */
  async updateAvatar(file: File): Promise<UserProfile> {
    if (!isSupabaseConfigured) {
      throw new Error('Configura Supabase en Web_Frontend/.env para subir fotos.');
    }

    const client = requireSupabase();
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) {
      throw new Error('Debes iniciar sesión para cambiar tu foto de perfil.');
    }

    const avatarUrl = await uploadAvatarFile(data.user.id, file);
    const profile = await saveAvatarUrl(data.user.id, avatarUrl);
    if (!profile) throw new Error('No se ha encontrado tu perfil en la BBDD.');

    persistSession(profile);
    return profile;
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured) {
      const client = requireSupabase();
      await client.auth.signOut().catch(() => undefined);
    }
    clearSession();
  },

  /** Elimina todo rastro del usuario: BBDD, partidos asignados, chat y localStorage. */
  async deleteAccount(userId: string): Promise<void> {
    const current = this.getCurrentSession();
    const emailNorm = (current?.email || '').trim().toLowerCase();

    if (isSupabaseConfigured) {
      try {
        const client = requireSupabase();

        // 1. Liberar partidos donde este usuario sea jugador visitante/local
        await client
          .from('matches')
          .update({
            jugador_visitante_id: null,
            goles_visitante: 0,
            estado: 'pendiente'
          })
          .eq('jugador_visitante_id', userId);

        await client
          .from('matches')
          .update({
            jugador_local_id: null,
            goles_local: 0,
            estado: 'pendiente'
          })
          .eq('jugador_local_id', userId);

        // 2. Liberar partidos donde sea árbitro
        await client
          .from('matches')
          .update({ arbitro_id: null })
          .eq('arbitro_id', userId);

        // 3. Borrar mensajes de chat
        await client
          .from('chat_messages')
          .delete()
          .eq('user_id', userId);

        // 4. Borrar perfil de la tabla perfiles
        await client
          .from('perfiles')
          .delete()
          .eq('user_id', userId);

        await client.auth.signOut().catch(() => undefined);
      } catch (err) {
        console.warn('Aviso al eliminar cuenta en Supabase:', err);
      }
    }

    // Limpieza de datos en almacenamiento local (localStorage)
    try {
      const accounts = readAccounts();
      const filtered = accounts.filter(
        acc => acc.id !== userId && acc.email.trim().toLowerCase() !== emailNorm
      );
      writeAccounts(filtered);

      const playersRaw = localStorage.getItem(STORAGE_KEYS.PLAYERS);
      if (playersRaw) {
        const pList = JSON.parse(playersRaw);
        if (Array.isArray(pList)) {
          localStorage.setItem(
            STORAGE_KEYS.PLAYERS,
            JSON.stringify(
              pList.filter(
                (p: { id?: string; email?: string }) =>
                  p.id !== userId && p.email?.trim().toLowerCase() !== emailNorm
              )
            )
          );
        }
      }
    } catch (e) {
      console.warn('Aviso al limpiar cuenta en localStorage:', e);
    }

    clearSession();
  }
};

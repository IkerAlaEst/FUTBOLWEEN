import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase.
 *
 * Las credenciales se leen de Web_Frontend/.env:
 *   VITE_SUPABASE_URL=https://xxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
 *
 * Si no están configuradas (o siguen siendo los placeholders del ejemplo),
 * `supabase` es null y los servicios usan el modo local de respaldo para que
 * la app siga arrancando en desarrollo.
 */

const RAW_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const RAW_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

const looksLikePlaceholder = /tu-proyecto|tu-anon-key|xxxx|your-project/i.test(
  `${RAW_URL} ${RAW_KEY}`
);

export const isSupabaseConfigured =
  Boolean(RAW_URL && RAW_KEY) && !looksLikePlaceholder;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(RAW_URL, RAW_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase no está configurado. Rellena VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Web_Frontend/.env.'
    );
  }
  return supabase;
}

/** Nombre del bucket de Storage con las fotos de perfil. */
export const AVATAR_BUCKET = 'avatares';

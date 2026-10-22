/**
 * Capa de Abstracción de Cliente API.
 * Permite cambiar sin esfuerzo entre Mock Local, API REST (Express/NestJS) o Supabase.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || '';
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isBackendConfigured = Boolean(API_BASE_URL || (SUPABASE_URL && SUPABASE_ANON_KEY));

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('API_BASE_URL no está configurada.');
  }

  const url = `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `Error en la petición: ${response.statusText}`);
  }

  return response.json();
}


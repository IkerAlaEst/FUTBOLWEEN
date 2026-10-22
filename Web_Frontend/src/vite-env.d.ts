/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_TOURNAMENT_DATE?: string;
  readonly VITE_SPORTSDB_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

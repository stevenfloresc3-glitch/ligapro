import { createClient } from '@supabase/supabase-js';

// URL y Clave Pública de Supabase
export const SUPABASE_URL = (
  import.meta.env.VITE_SUPABASE_URL || 'https://ewgtkkuywsscmnqljihq.supabase.co'
).trim();

// Sanitización de la clave en caso de contener corchetes accidentales
const rawKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_fiW1vKYg-luvgkW3atTrtw_Qa6MtoRH'
).trim();

export const SUPABASE_ANON_KEY = rawKey.replace(/^\[|\]$/g, '').trim();

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('your-supabase-url')
);

// Creación de la instancia del cliente oficial de Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});


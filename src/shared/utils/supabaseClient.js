import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qkidtuzoviuxwdlzuxzz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFraWR0dXpvdml1eHdkbHp1eHp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDk4NTgsImV4cCI6MjA3NzMyNTg1OH0.dKLpAOMsFXFsVKe3Dki2eoau2udexZ4VFChLUcAGudM';

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'sb-patrimonio-auth-token', // Storage key única para patrimonio
  },
  storage: {
    bucketId: 'urls-sipreb',
  },
});

export default supabase;

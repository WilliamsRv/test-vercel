import { createClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase específico para el módulo ms-05-movements
 * Usa una storage key diferente para evitar conflictos con otros módulos
 * 
 * Configuración:
 * 1. Crea un archivo .env en la raíz del proyecto
 * 2. Agrega estas variables:
 *    VITE_MOVEMENTS_SUPABASE_URL=https://tu-proyecto.supabase.co
 *    VITE_MOVEMENTS_SUPABASE_ANON_KEY=tu_clave_anon_aqui
 */

// Configuración de Supabase para movimientos (separado de patrimonio)
const movementsSupabaseUrl = import.meta.env.VITE_MOVEMENTS_SUPABASE_URL || '';
const movementsSupabaseAnonKey = import.meta.env.VITE_MOVEMENTS_SUPABASE_ANON_KEY || '';

// Validar configuración
if (!movementsSupabaseUrl || !movementsSupabaseAnonKey) {
  console.warn('⚠️ Advertencia: Las variables de entorno de Supabase para movimientos no están configuradas.');
  console.warn('⚠️ Crea un archivo .env con:');
  console.warn('   VITE_MOVEMENTS_SUPABASE_URL=https://tu-proyecto.supabase.co');
  console.warn('   VITE_MOVEMENTS_SUPABASE_ANON_KEY=tu_clave_anon_aqui');
} else {
  console.log('✅ Supabase de movimientos configurado:', {
    url: movementsSupabaseUrl,
    keyLength: movementsSupabaseAnonKey.length,
    keyPrefix: movementsSupabaseAnonKey.substring(0, 20) + '...'
  });
}

// Crear cliente de Supabase para movimientos con storage key única
export const movementsSupabase = movementsSupabaseUrl && movementsSupabaseAnonKey
  ? createClient(movementsSupabaseUrl, movementsSupabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'sb-movements-auth-token', // Storage key única para evitar conflictos
    },
  })
  : null;

// Función para verificar la conexión a Supabase de movimientos
export const checkMovementsSupabaseConnection = async () => {
  if (!movementsSupabase) {
    return false;
  }

  try {
    const response = await fetch(`${movementsSupabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': movementsSupabaseAnonKey,
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Error verificando conexión a Supabase de movimientos:', error);
    return false;
  }
};

export default movementsSupabase;


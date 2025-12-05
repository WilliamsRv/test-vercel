import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext, useAuthState } from "../hooks/useAuth";

// Provider del contexto de autenticación
export const AuthProvider = ({ children }) => {
  const auth = useAuthState();
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-login en modo desarrollo (solo si no hay usuario y no estamos en login)
  useEffect(() => {
    const autoLogin = async () => {
      // Solo auto-login si:
      // 1. No hay usuario autenticado
      // 2. No estamos en la página de login
      // 3. Está habilitado el modo desarrollo
      // 4. No hay bandera de logout manual
      const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
      const manualLogout = sessionStorage.getItem('manualLogout');

      if (!auth.user && location.pathname !== '/login' && isDevelopment && !manualLogout) {
        console.log('🔧 Modo desarrollo: Auto-login como SUPER_ADMIN');
        try {
          await auth.login({
            username: 'admin',
            password: 'admin123'
          });
          console.log('✅ Auto-login exitoso');
        } catch (error) {
          console.error('❌ Error en auto-login:', error);
          navigate('/login');
        }
      }
    };

    if (!auth.loading) {
      autoLogin();
    }
  }, [auth.user, auth.loading, location.pathname]);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

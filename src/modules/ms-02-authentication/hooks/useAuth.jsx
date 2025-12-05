import { createContext, useContext, useEffect, useState } from "react";
import authService from "../services/auth.service";

// Crear contexto de autenticación
export const AuthContext = createContext();

// Hook para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};

// Hook personalizado para manejar la autenticación
export const useAuthState = () => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [token, setToken] = useState(authService.getToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar autenticación al cargar (solo una vez)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        const currentToken = authService.getToken();
        const currentUser = authService.getCurrentUser();

        if (currentToken && currentUser) {
          console.log("🔐 Token encontrado en localStorage");

          // Verificar si el token es válido
          const isValid = await authService.verifyToken();

          if (isValid) {
            console.log("✅ Token válido - Sesión restaurada");
            setUser(authService.getCurrentUser());
            setToken(authService.getToken());
          } else {
            setUser(null);
            setToken(null);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            localStorage.removeItem('tokenType');
            localStorage.removeItem('expiresIn');
            localStorage.removeItem('authMode');
          }
        } else {
          console.log("ℹ️ No hay sesión guardada");
        }
      } catch (error) {
        console.error("❌ Error verificando autenticación:", error);
        // Si hay error, limpiar sesión
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []); // Solo ejecutar una vez al montar el componente

  // Función de login
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.login(credentials);

      if (result.success) {
        setUser(result.user);
        setToken(result.token);
        return result;
      } else {
        throw new Error("Error al iniciar sesión");
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función de logout
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);

      await authService.logout();
      setUser(null);
      setToken(null);

      return { success: true };
    } catch (error) {
      setError(error.message);
      // Aún así limpiar estado local
      setUser(null);
      setToken(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función para cambiar contraseña
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      return await authService.changePassword(currentPassword, newPassword);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Función para actualizar perfil
  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const result = await authService.updateProfile(profileData);

      if (result.success) {
        setUser(result.user);
      }

      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Función para solicitar restablecimiento de contraseña
  const requestPasswordReset = async (email) => {
    try {
      setError(null);
      return await authService.requestPasswordReset(email);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Función para restablecer contraseña
  const resetPassword = async (token, newPassword) => {
    try {
      setError(null);
      return await authService.resetPassword(token, newPassword);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!(token && user),
    login,
    logout,
    changePassword,
    updateProfile,
    requestPasswordReset,
    resetPassword,
    clearError: () => setError(null),
  };
};

export default useAuth;

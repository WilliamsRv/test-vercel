import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth.jsx';

// Hook para proteger rutas que requieren autenticación
export const useProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Guardar la ruta actual para redirigir después del login
      const currentPath = location.pathname + location.search;
      navigate('/login', {
        state: { from: currentPath },
        replace: true
      });
    }
  }, [isAuthenticated, loading, navigate, location]);

  return { isAuthenticated, loading };
};

// Hook para rutas públicas (login, register, etc.)
export const usePublicRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      // Si ya está autenticado, redirigir al dashboard
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  return { isAuthenticated, loading };
};

// Componente HOC para proteger rutas
export const withAuth = (WrappedComponent) => { // eslint-disable-line no-unused-vars
  return function ProtectedComponent(props) {
    const { isAuthenticated, loading } = useProtectedRoute();

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
              <span className="text-white font-bold text-lg">SL</span>
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-slate-600 mt-4">Verificando acceso...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null; // La redirección se maneja en useProtectedRoute
    }

    return <WrappedComponent {...props} />;
  };
};

// Componente HOC para rutas públicas
export const withPublicAuth = (WrappedComponent) => { // eslint-disable-line no-unused-vars
  return function PublicComponent(props) {
    const { isAuthenticated, loading } = usePublicRoute();

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="bg-white rounded-3xl p-12 px-16 shadow-2xl border border-gray-100 text-center max-w-md">
            <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
              SL-SIPREB
            </h1>
            <p className="text-gray-600 text-sm mb-12 font-medium">
              Sistema Patrimonial
            </p>
            <div className="flex justify-center items-center gap-2">
              <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      );
    }

    if (isAuthenticated) {
      return null; // La redirección se maneja en usePublicRoute
    }

    return <WrappedComponent {...props} />;
  };
};

export default useProtectedRoute;

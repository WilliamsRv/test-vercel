import API_BASE_URL from '../config/api';

const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  VALIDATE: '/auth/validate',
};

class AuthService {
  constructor() {
    this.token = localStorage.getItem('accessToken');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorData = {};
        let errorMessage = `Error ${response.status}: ${response.statusText}`;

        try {
          errorData = await response.json();
          console.log('📦 Raw errorData:', errorData);
          console.log('📦 All keys:', Object.keys(errorData));
          console.log('📦 Full errorData:', JSON.stringify(errorData, null, 2));
        } catch (parseError) {
          console.warn('⚠️ No se pudo parsear JSON:', parseError);
        }

        // Extraer el mensaje de error correctamente
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.msg) {
          errorMessage = errorData.msg;
        } else if (errorData.description) {
          errorMessage = errorData.description;
        } else if (errorData.errorMessage) {
          errorMessage = errorData.errorMessage;
        } else if (errorData.reason) {
          errorMessage = errorData.reason;
        }

        console.error('❌ Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          errorMessage,
          allKeys: Object.keys(errorData)
        });

        // Crear un error con toda la información
        const error = new Error(errorMessage);
        error.errorData = errorData;
        throw error;
      }

      return await response.json();
    } catch (error) {
      console.error('Auth Service Error:', error);
      throw error;
    }
  }

  async login(credentials) {
    try {
      // Intentar login con backend
      try {
        const response = await this.request(AUTH_ENDPOINTS.LOGIN, {
          method: 'POST',
          body: JSON.stringify(credentials),
        });

        if (response.accessToken) {
          const token = response.accessToken;
          const user = {
            userId: response.userId,
            username: response.username,
            status: response.status,
            roles: response.roles,
            municipalCode: response.municipalCode, // ✅ NUEVO: Guardar municipalCode
          };

          localStorage.setItem('accessToken', token);
          localStorage.setItem('refreshToken', response.refreshToken);
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('municipalCode', response.municipalCode); // ✅ NUEVO: Guardar municipalCode separado
          localStorage.setItem('tokenType', response.tokenType || 'Bearer');
          localStorage.setItem('expiresIn', response.expiresIn || 3600);
          localStorage.setItem('authMode', 'production');

          // Limpiar bandera de logout manual
          sessionStorage.removeItem('manualLogout');

          this.token = token;
          this.user = user;

          console.info('✅ Login exitoso con backend');
          console.info('🏛️ Municipal Code:', response.municipalCode);
          console.info('👤 Usuario:', user.userId);
          return { success: true, user, token };
        }
      } catch (backendError) {
        // Verificar si es un error de autenticación (bloqueado, suspendido, etc.)
        if (backendError.message && (
          backendError.message.toLowerCase().includes('bloqueado') ||
          backendError.message.toLowerCase().includes('suspendido') ||
          backendError.message.toLowerCase().includes('inactivo') ||
          backendError.message.toLowerCase().includes('credenciales')
        )) {
          // Re-lanzar el error para que el LoginForm lo maneje
          throw backendError;
        }

        console.warn('⚠️ Backend no disponible, intentando modo demo...');
        return this.loginDemo(credentials);
      }

      throw new Error('Respuesta inválida del servidor');
    } catch (error) {
      console.error('❌ Error en login:', error);
      throw error;
    }
  }

  loginDemo(credentials) {
    const demoUsers = [
      {
        username: 'admin',
        password: 'admin123',
        user: {
          userId: 'demo-admin-001',
          username: 'admin',
          nombre: 'Super Administrador',
          status: 'ACTIVE',
          roles: ['SUPER_ADMIN'],
          permissions: ['*'], // Todos los permisos
        }
      },
      {
        username: 'gestor',
        password: 'gestor123',
        user: {
          userId: 'demo-gestor-001',
          username: 'gestor',
          nombre: 'Gestor de Activos',
          status: 'ACTIVE',
          roles: ['GESTOR'],
          permissions: ['assets.read', 'assets.create', 'assets.update', 'operations.read'],
        }
      },
      {
        username: 'usuario',
        password: 'usuario123',
        user: {
          userId: 'demo-user-001',
          username: 'usuario',
          nombre: 'Usuario Regular',
          status: 'ACTIVE',
          roles: ['USER'],
          permissions: ['assets.read', 'reports.read'],
        }
      }
    ];

    const demoUser = demoUsers.find(
      u => u.username === credentials.username && u.password === credentials.password
    );

    if (demoUser) {
      const token = `demo-token-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', `demo-refresh-${Date.now()}`);
      localStorage.setItem('user', JSON.stringify(demoUser.user));
      localStorage.setItem('authMode', 'demo');

      // Limpiar bandera de logout manual
      sessionStorage.removeItem('manualLogout');

      this.token = token;
      this.user = demoUser.user;

      console.info('🎭 Modo DEMO activado - Usuario:', demoUser.user.username);

      return { success: true, user: demoUser.user, token };
    }

    throw new Error('Credenciales incorrectas');
  }

  async logout() {
    try {
      const mode = localStorage.getItem('authMode');

      if (this.token && mode !== 'demo') {
        await this.request(AUTH_ENDPOINTS.LOGOUT, {
          method: 'POST',
        }).catch(() => {
          console.warn('No se pudo notificar el logout al servidor');
        });
      }

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('tokenType');
      localStorage.removeItem('expiresIn');
      localStorage.removeItem('authMode');

      // Marcar que fue un logout manual para evitar auto-login
      sessionStorage.setItem('manualLogout', 'true');

      this.token = null;
      this.user = null;

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
      this.token = null;
      this.user = null;
      throw error;
    }
  }

  isAuthenticated() {
    return !!(this.token && this.user);
  }

  getCurrentUser() {
    return this.user;
  }

  getToken() {
    return this.token;
  }

  async verifyToken() {
    if (!this.token) {
      console.log('❌ No hay token');
      return false;
    }

    const mode = localStorage.getItem('authMode');
    if (mode === 'demo') {
      console.info('🎭 Modo DEMO - Token válido');
      return true;
    }

    try {
      console.log('🔍 Verificando token...');
      const response = await this.request(AUTH_ENDPOINTS.VALIDATE, {
        method: 'POST',
      });

      if (response === true || response.valid === true) {
        console.log('✅ Token válido');
        return true;
      }

      console.log('⚠️ Token no válido según el servidor');
      return false;
    } catch (error) {
      console.warn('⚠️ No se pudo verificar el token:', error.message);
      return false;
    }
  }

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        throw new Error('No hay refresh token');
      }

      const response = await fetch(`${API_BASE_URL}${AUTH_ENDPOINTS.REFRESH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Error al refrescar token');
      }

      const data = await response.json();

      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('expiresIn', data.expiresIn || 3600);
        this.token = data.accessToken;
        console.log('✅ Token renovado exitosamente');
        return { success: true, token: data.accessToken };
      }

      throw new Error('Respuesta inválida del servidor');
    } catch (error) {
      console.error('Refresh token error:', error);
      this.logout();
      throw error;
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      const response = await this.request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (response.success) {
        return { success: true, message: response.message };
      }

      throw new Error(response.message || 'Error al cambiar contraseña');
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  async requestPasswordReset(email) {
    try {
      const response = await this.request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (response.success) {
        return { success: true, message: response.message };
      }

      throw new Error(response.message || 'Error al solicitar restablecimiento');
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }

  async resetPassword(token, newPassword) {
    try {
      const response = await this.request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      if (response.success) {
        return { success: true, message: response.message };
      }

      throw new Error(response.message || 'Error al restablecer contraseña');
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await this.request('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      if (response.success && response.data) {
        this.user = response.data.user;
        localStorage.setItem('user', JSON.stringify(this.user));
        return { success: true, user: this.user };
      }

      throw new Error(response.message || 'Error al actualizar perfil');
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }
}

const authService = new AuthService();

export default authService;

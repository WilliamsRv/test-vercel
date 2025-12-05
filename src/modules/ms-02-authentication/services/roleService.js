/* eslint-disable no-unused-vars */
// Servicio de gestión de roles para SIPREB
import API_BASE_URL from '../config/api';

class RoleService {
  constructor() {
    this.token = localStorage.getItem("accessToken");
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    this.token = localStorage.getItem("accessToken");
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    console.log("📡 Request:", {
      url,
      method: config.method || "GET",
      hasToken: !!this.token,
      headers: config.headers,
      body: options.body ? JSON.parse(options.body) : null,
    });

    console.log("🔍 DETALLES COMPLETOS DEL REQUEST:");
    console.log("URL completa:", url);
    console.log("Método:", config.method || "GET");
    console.log("Headers completos:", JSON.stringify(config.headers, null, 2));
    console.log("Body como string:", options.body);
    if (options.body) {
      console.log("Body parseado:", JSON.parse(options.body));
      console.log("Campos enviados:", Object.keys(JSON.parse(options.body)));
    }

    try {
      const response = await fetch(url, config);
      console.log("📥 Response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error("❌ Error Response:", errorData);

          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        } catch (parseError) {
          console.error("❌ No se pudo parsear el error:", parseError);
        }
        throw new Error(errorMessage);
      }

      if (response.status === 204) return { success: true };
      const data = await response.json();
      console.log("✅ Data received:", data);
      return data;
    } catch (error) {
      console.error("❌ Role Service Error:", error);
      throw error;
    }
  }

  // 1. Crear Rol
  async createRole(roleData) {
    console.log("🚀 Creando rol con datos:", roleData);
    console.log("📤 JSON que se enviará:", JSON.stringify(roleData, null, 2));

    return await this.request("/roles", {
      method: "POST",
      body: JSON.stringify(roleData),
    });
  }

  // 2. Obtener Todos los Roles
  async getAllRoles() {
    return await this.request("/roles");
  }

  // 3. Obtener Roles Activos
  async getActiveRoles() {
    return await this.request("/roles/active");
  }

  // 4. Obtener Rol por ID
  async getRoleById(id) {
    return await this.request(`/roles/${id}`);
  }

  // 5. Obtener Rol por Nombre
  async getRoleByName(name) {
    return await this.request(`/roles/name/${name}`);
  }

  // 6. Actualizar Rol
  async updateRole(id, roleData) {
    return await this.request(`/roles/${id}`, {
      method: "PUT",
      body: JSON.stringify(roleData),
    });
  }

  // 7. Eliminar Rol (Lógico)
  async deleteRole(id) {
    return await this.request(`/roles/${id}`, {
      method: "DELETE",
    });
  }

  // 8. Restaurar Rol
  async restoreRole(id) {
    return await this.request(`/roles/${id}/restore`, {
      method: "PATCH",
    });
  }

  // 9. Verificar usuario actual y permisos
  async getCurrentUser() {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.log("❌ No hay token de acceso");
      return null;
    }

    try {
      // Decodificar el JWT para ver los roles
      const payload = JSON.parse(atob(token.split(".")[1]));
      console.log("🔍 Usuario actual (JWT payload):", payload);
      console.log(
        "🎭 Roles del usuario:",
        payload.roles || payload.authorities
      );
      console.log("🆔 ID del usuario:", payload.sub || payload.userId);
      console.log("� ¿Es rSUPER_ADMIN?", this.isSuperAdmin(payload));
      return payload;
    } catch (error) {
      console.error("❌ Error al decodificar token:", error);
      return null;
    }
  }

  // 10. Verificar si el usuario es SUPER_ADMIN
  isSuperAdmin(userPayload = null) {
    if (!userPayload) {
      const token = localStorage.getItem("accessToken");
      if (!token) return false;

      try {
        userPayload = JSON.parse(atob(token.split(".")[1]));
      } catch (error) {
        return false;
      }
    }

    const roles = userPayload.roles || userPayload.authorities || [];
    const isSuperAdmin = roles.some(
      (role) =>
        role === "SUPER_ADMIN" ||
        role === "ROLE_SUPER_ADMIN" ||
        (typeof role === "object" &&
          (role.authority === "SUPER_ADMIN" ||
            role.authority === "ROLE_SUPER_ADMIN"))
    );

    console.log("🔐 Verificación SUPER_ADMIN:", {
      roles,
      isSuperAdmin,
    });

    return isSuperAdmin;
  }
}

const roleService = new RoleService();
export default roleService;

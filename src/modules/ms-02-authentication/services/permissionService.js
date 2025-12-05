import API_BASE_URL from '../config/api';

class PermissionService {
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
      body: options.body ? JSON.parse(options.body) : null
    });

    try {
      const response = await fetch(url, config);
      console.log("📥 Response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        let errorDetails = null;

        try {
          const errorData = await response.json();
          console.error("❌ Error Response Body:", JSON.stringify(errorData, null, 2));
          errorDetails = errorData;

          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.errors) {
             // Handle validation errors object (e.g. { field: ["error"] })
             const validationMessages = Object.entries(errorData.errors)
                .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
                .join(' | ');
             errorMessage = validationMessages || Object.values(errorData.errors).flat().join(', ');
          }
          
          // Fallback: append full error data if message is still generic
          if (errorMessage === `Error ${response.status}: ${response.statusText}` && errorData) {
             errorMessage += ` - ${JSON.stringify(errorData)}`;
          }
          
          // Si hay errores de validación específicos, agregarlos al mensaje
          if (errorData.errors) {
            const validationErrors = Object.values(errorData.errors).flat().join(', ');
            if (validationErrors && !errorMessage.includes(validationErrors)) {
                errorMessage += `: ${validationErrors}`;
            }
          }

        } catch (parseError) {
          console.error("❌ No se pudo parsear el error:", parseError);
        }
        
        const error = new Error(errorMessage);
        error.details = errorDetails;
        throw error;
      }

      if (response.status === 204) return { success: true };
      const data = await response.json();
      console.log("✅ Data received:", data);
      return data;
    } catch (error) {
      console.error("❌ Permission Service Error:", error);
      throw error;
    }
  }

  // 1. Crear Permiso
  async createPermission(permissionData) {
    console.log("🚀 Creando permiso con datos:", permissionData);
    return await this.request("/permissions", {
      method: "POST",
      body: JSON.stringify(permissionData),
    });
  }

  // 2. Obtener Todos los Permisos
  async getAllPermissions() {
    return await this.request("/permissions");
  }

  // 3. Obtener Permiso por ID
  async getPermissionById(id) {
    return await this.request(`/permissions/${id}`);
  }

  // 4. Buscar Permisos
  async searchPermissions(filters = {}) {
    const params = new URLSearchParams();
    if (filters.module) params.append("module", filters.module);
    if (filters.action) params.append("action", filters.action);
    if (filters.resource) params.append("resource", filters.resource);

    const queryString = params.toString();
    const endpoint = queryString
      ? `/permissions/search?${queryString}`
      : "/permissions";

    return await this.request(endpoint);
  }

  // 5. Actualizar Permiso
  async updatePermission(id, permissionData) {
    return await this.request(`/permissions/${id}`, {
      method: "PUT",
      body: JSON.stringify(permissionData),
    });
  }

  // 6. Eliminar Permiso (Lógico)
  async deletePermission(id) {
    return await this.request(`/permissions/${id}`, {
      method: "DELETE",
    });
  }

  // 7. Restaurar Permiso
  async restorePermission(id) {
    return await this.request(`/permissions/${id}/restore`, {
      method: "PATCH",
    });
  }
}

const permissionService = new PermissionService();
export default permissionService;

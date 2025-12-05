import API_BASE_URL from '../config/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

const assignmentService = {
  // ========== USUARIO-ROL ==========

  // Obtener roles de un usuario
  getUserRoles: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/assignments/users/${userId}/roles`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Error al obtener roles del usuario");
    return await response.json();
  },

  // ✅ ACTUALIZADO: No enviar assignedBy, se inyecta automáticamente del JWT
  assignRoleToUser: async (userId, roleId, expirationDate = null) => {
    const response = await fetch(
      `${API_BASE_URL}/assignments/users/${userId}/roles/${roleId}`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          expirationDate,
          active: true,
        }),
      }
    );
    if (!response.ok) throw new Error("Error al asignar rol al usuario");
    return await response.json();
  },

  // Quitar rol de usuario
  removeRoleFromUser: async (userId, roleId) => {
    const response = await fetch(
      `${API_BASE_URL}/assignments/users/${userId}/roles/${roleId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error("Error al quitar rol del usuario");
    return await response.text();
  },

  // Obtener usuarios con un rol específico
  // NOTA: Este endpoint no existe en el backend actual
  // getRoleUsers: async (roleId) => {
  //   const response = await fetch(`${API_BASE_URL}/assignments/roles/${roleId}/users`, {
  //     headers: getAuthHeaders(),
  //   });
  //   if (!response.ok) throw new Error("Error al obtener usuarios del rol");
  //   return await response.json();
  // },

  // ========== ROL-PERMISO ==========

  // Obtener permisos de un rol
  getRolePermissions: async (roleId) => {
    const response = await fetch(
      `${API_BASE_URL}/assignments/roles/${roleId}/permissions`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error("Error al obtener permisos del rol");
    return await response.json();
  },

  // Asignar permiso a rol
  assignPermissionToRole: async (roleId, permissionId) => {
    const response = await fetch(
      `${API_BASE_URL}/assignments/roles/${roleId}/permissions/${permissionId}`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error("Error al asignar permiso al rol");
    return await response.json();
  },

  // Quitar permiso de rol
  removePermissionFromRole: async (roleId, permissionId) => {
    const response = await fetch(
      `${API_BASE_URL}/assignments/roles/${roleId}/permissions/${permissionId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error("Error al quitar permiso del rol");
    return await response.text();
  },

  // Restaurar permiso a rol
  restorePermissionToRole: async (roleId, permissionId) => {
    const response = await fetch(
      `${API_BASE_URL}/assignments/roles/${roleId}/permissions/${permissionId}/restore`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error("Error al restaurar permiso al rol");
    return await response.json();
  },

  // Obtener permisos efectivos de un usuario
  getUserEffectivePermissions: async (userId) => {
    const response = await fetch(
      `${API_BASE_URL}/assignments/users/${userId}/effective-permissions`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok)
      throw new Error("Error al obtener permisos efectivos del usuario");
    return await response.json();
  },
};

export default assignmentService;

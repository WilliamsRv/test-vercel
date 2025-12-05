import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import assignmentService from "../../services/assignmentService";
import permissionService from "../../services/permissionService";
import personService from "../../services/personService";
import roleService from "../../services/roleService";
import userService from "../../services/userService";
import AssignPermissionModal from "./AssignPermissionModal";
import AssignRoleModal from "./AssignRoleModal";

export default function AssignmentsPage({ onBack }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [persons, setPersons] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("user-role");

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);

  const [isAssignRoleModalOpen, setIsAssignRoleModalOpen] = useState(false);
  const [isAssignPermissionModalOpen, setIsAssignPermissionModalOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData, permissionsData, personsData] = await Promise.all([
        userService.getAllUsers(),
        roleService.getAllRoles(),
        permissionService.getAllPermissions(),
        personService.getAllPersons(),
      ]);

      setUsers(Array.isArray(usersData) ? usersData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setPermissions(Array.isArray(permissionsData) ? permissionsData : []);

      const personsMap = {};
      personsData.forEach((person) => {
        personsMap[person.id] = person;
      });
      setPersons(personsMap);
    } catch (err) {
      console.error("Error al cargar datos:", err);
      Swal.fire({
        title: "Error",
        text: "No se pudieron cargar los datos iniciales",
        icon: "error",
        customClass: { confirmButton: 'btn-confirm-danger' },
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserRoles = async (userId) => {
    try {
      const data = await assignmentService.getUserRoles(userId);
      setUserRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar roles del usuario:", err);
      setUserRoles([]);
    }
  };

  const loadRolePermissions = async (roleId) => {
    try {
      const data = await assignmentService.getRolePermissions(roleId);
      setRolePermissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar permisos del rol:", err);
      setRolePermissions([]);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSelectedRole(null);
    loadUserRoles(user.id);
  };

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setSelectedUser(null);
    loadRolePermissions(role.id);
  };

  const handleRemoveRoleFromUser = async (userId, roleId) => {
    const result = await Swal.fire({
      title: "¿Quitar rol?",
      text: "El usuario perderá este rol y sus permisos asociados",
      icon: "warning",
      showCancelButton: true,
      customClass: { confirmButton: 'btn-confirm-danger' },
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, quitar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await assignmentService.removeRoleFromUser(userId, roleId);
        Swal.fire({
          title: "¡Éxito!",
          text: "Rol quitado correctamente",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        loadUserRoles(userId);
      } catch (err) {
        Swal.fire({
          title: "Error",
          text: err.message || "No se pudo quitar el rol",
          icon: "error",
          customClass: { confirmButton: 'btn-confirm-danger' },
        });
      }
    }
  };

  const handleRemovePermissionFromRole = async (roleId, permissionId) => {
    const result = await Swal.fire({
      title: "¿Quitar permiso?",
      text: "El rol perderá este permiso",
      icon: "warning",
      showCancelButton: true,
      customClass: { confirmButton: 'btn-confirm-danger' },
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, quitar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await assignmentService.removePermissionFromRole(roleId, permissionId);
        Swal.fire({
          title: "¡Éxito!",
          text: "Permiso quitado correctamente",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        loadRolePermissions(roleId);
      } catch (err) {
        Swal.fire({
          title: "Error",
          text: err.message || "No se pudo quitar el permiso",
          icon: "error",
          customClass: { confirmButton: 'btn-confirm-danger' },
        });
      }
    }
  };

  const getPersonName = (personId) => {
    const person = persons[personId];
    if (!person) return "-";
    return `${person.firstName || ""} ${person.lastName || ""}`.trim() || "-";
  };

  const formatDate = (date) => {
    if (!date) return "-";
    try {
      let dateObj;
      if (Array.isArray(date)) {
        const [year, month, day, hour = 0, minute = 0, second = 0] = date;
        dateObj = new Date(year, month - 1, day, hour, minute, second);
      } else {
        dateObj = new Date(date);
      }
      if (isNaN(dateObj.getTime())) return "-";
      return new Intl.DateTimeFormat("es-PE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(dateObj);
    } catch {
      return "-";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-600 font-medium">Cargando asignaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      {/* Header iOS */}
      <div className="bg-blue-600 shadow-lg mb-8 rounded-2xl">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Gestión de Asignaciones
                </h1>
                <p className="text-blue-100 text-sm font-medium">
                  Administración de asignaciones Usuario-Rol y Rol-Permiso
                </p>
              </div>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all duration-200 backdrop-blur-sm text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver a Usuarios
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Tabs iOS */}
        <div className="mb-8">
          <div className="flex bg-gray-100 p-1.5 rounded-2xl max-w-md shadow-sm">
            <button
              onClick={() => {
                setActiveTab("user-role");
                setSelectedUser(null);
                setSelectedRole(null);
                setUserRoles([]);
              }}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === "user-role"
                ? "bg-white text-blue-600 shadow-md"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Usuario - Rol
            </button>
            <button
              onClick={() => {
                setActiveTab("role-permission");
                setSelectedUser(null);
                setSelectedRole(null);
                setRolePermissions([]);
              }}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === "role-permission"
                ? "bg-white text-blue-600 shadow-md"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
              </svg>
              Rol - Permiso
            </button>
          </div>
        </div>

        {/* Contenido según tab activo */}
        {activeTab === "user-role" ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Lista de Usuarios */}
            <div className="bg-white rounded-2xl border border-slate-200">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Usuarios</h2>
                </div>
                <p className="text-sm text-slate-600">
                  Selecciona un usuario para ver sus roles
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {users
                    .filter((u) => u.status === "ACTIVE")
                    .map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className={`w-full p-4 rounded-xl text-left transition-all duration-200 border-2 ${selectedUser?.id === user.id
                          ? "bg-indigo-50 border-indigo-200 shadow-sm"
                          : "bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-slate-200"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${selectedUser?.id === user.id
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-200 text-slate-600"
                            }`}>
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${user.status === "ACTIVE"
                                ? "bg-green-500"
                                : user.status === "SUSPENDED"
                                  ? "bg-orange-500"
                                  : "bg-red-500"
                                }`}></div>
                              <div className="font-semibold text-slate-900 truncate">
                                {user.username}
                              </div>
                            </div>
                            <div className="text-sm text-slate-600 truncate">
                              {getPersonName(user.personId)}
                            </div>
                          </div>
                          {selectedUser?.id === user.id && (
                            <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Roles del Usuario Seleccionado */}
            <div className="bg-white rounded-2xl border border-slate-200">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Roles Asignados</h2>
                      {selectedUser && (
                        <p className="text-sm text-slate-600">
                          Usuario: {selectedUser.username}
                        </p>
                      )}
                    </div>
                  </div>
                  {selectedUser && (
                    <button
                      onClick={() => setIsAssignRoleModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Asignar
                    </button>
                  )}
                </div>
              </div>
              <div className="p-6">
                {!selectedUser ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <p className="text-slate-500 font-medium">Selecciona un usuario</p>
                    <p className="text-slate-400 text-sm mt-1">Para ver sus roles asignados</p>
                  </div>
                ) : userRoles.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <p className="text-slate-500 font-medium">Sin roles asignados</p>
                    <p className="text-slate-400 text-sm mt-1">Este usuario no tiene roles</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {userRoles.map((assignment) => (
                      <div
                        key={assignment.roleId}
                        className="p-4 bg-slate-50 border border-slate-100 rounded-xl"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900">
                                  {assignment.roleName}


                                </div>
                                <div className="text-xs text-slate-500">
                                  Asignado: {formatDate(assignment.assignedAt)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${assignment.active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                                  }`}
                              >
                                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${assignment.active ? "bg-green-500" : "bg-gray-400"
                                  }`}></div>
                                {assignment.active ? "Activo" : "Inactivo"}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              assignment.active &&
                              handleRemoveRoleFromUser(
                                selectedUser.id,
                                assignment.roleId
                              )
                            }
                            disabled={!assignment.active}
                            className={`p-2 rounded-lg transition-colors ${!assignment.active
                              ? "text-slate-400 bg-slate-100 cursor-not-allowed"
                              : "text-red-500 hover:bg-red-50"
                              }`}
                            title={!assignment.active ? "No se puede quitar un rol inactivo" : "Quitar rol"}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Lista de Roles */}
            <div className="bg-white rounded-2xl border border-slate-200">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Roles</h2>
                </div>
                <p className="text-sm text-slate-600">
                  Selecciona un rol para ver sus permisos
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {roles
                    .filter((r) => !r.deletedAt)
                    .map((role) => (
                      <button
                        key={role.id}
                        onClick={() => handleSelectRole(role)}
                        className={`w-full p-4 rounded-xl text-left transition-all duration-200 border-2 ${selectedRole?.id === role.id
                          ? "bg-purple-50 border-purple-200 shadow-sm"
                          : "bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-slate-200"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${selectedRole?.id === role.id
                            ? "bg-purple-600 text-white"
                            : "bg-slate-200 text-slate-600"
                            }`}>
                            {role.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${!role.deletedAt ? "bg-green-500" : "bg-red-500"
                                }`}></div>
                              <div className="font-semibold text-slate-900 truncate">
                                {role.name}
                              </div>
                            </div>
                            <div className="text-sm text-slate-600 truncate">
                              {role.description || "Sin descripción"}
                            </div>
                          </div>
                          {selectedRole?.id === role.id && (
                            <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Permisos del Rol Seleccionado */}
            <div className="bg-white rounded-2xl border border-slate-200">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Permisos Asignados</h2>
                      {selectedRole && (
                        <p className="text-sm text-slate-600">
                          Rol: {selectedRole.name}
                        </p>
                      )}
                    </div>
                  </div>
                  {selectedRole && (
                    <button
                      onClick={() => setIsAssignPermissionModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Asignar
                    </button>
                  )}
                </div>
              </div>
              <div className="p-6">
                {!selectedRole ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <p className="text-slate-500 font-medium">Selecciona un rol</p>
                    <p className="text-slate-400 text-sm mt-1">Para ver sus permisos asignados</p>
                  </div>
                ) : rolePermissions.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
                      </svg>
                    </div>
                    <p className="text-slate-500 font-medium">Sin permisos asignados</p>
                    <p className="text-slate-400 text-sm mt-1">Este rol no tiene permisos</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {rolePermissions.map((permission) => (
                      <div
                        key={permission.permissionId}
                        className="p-4 bg-slate-50 border border-slate-100 rounded-xl"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
                                </svg>
                              </div>
                              <div className="font-semibold text-slate-900">
                                {permission.module}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700">
                                {permission.action}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-700">
                                {permission.resource}
                              </span>
                            </div>
                            {permission.description && (
                              <div className="text-sm text-slate-600">
                                {permission.description}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              const isPermActive = !permissions.find(p => p.id === permission.permissionId)?.deletedAt;
                              if (isPermActive) {
                                handleRemovePermissionFromRole(
                                  selectedRole.id,
                                  permission.permissionId
                                );
                              }
                            }}
                            disabled={!!permissions.find(p => p.id === permission.permissionId)?.deletedAt}
                            className={`p-2 rounded-lg transition-colors ${permissions.find(p => p.id === permission.permissionId)?.deletedAt
                              ? "text-slate-400 bg-slate-100 cursor-not-allowed"
                              : "text-red-500 hover:bg-red-50"
                              }`}
                            title={permissions.find(p => p.id === permission.permissionId)?.deletedAt ? "No se puede quitar un permiso inactivo" : "Quitar permiso"}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      <AssignRoleModal
        isOpen={isAssignRoleModalOpen}
        onClose={() => setIsAssignRoleModalOpen(false)}
        onSuccess={() => {
          setIsAssignRoleModalOpen(false);
          if (selectedUser) loadUserRoles(selectedUser.id);
        }}
        user={selectedUser}
        roles={roles.filter((r) => !r.deletedAt)}
        assignedRoles={userRoles}
      />

      <AssignPermissionModal
        isOpen={isAssignPermissionModalOpen}
        onClose={() => setIsAssignPermissionModalOpen(false)}
        onSuccess={() => {
          setIsAssignPermissionModalOpen(false);
          if (selectedRole) loadRolePermissions(selectedRole.id);
        }}
        role={selectedRole}
        permissions={permissions.filter((p) => !p.deletedAt)}
        assignedPermissions={rolePermissions}
      />
    </div>
  );
}

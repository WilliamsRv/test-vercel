import { useState } from "react";
import Swal from "sweetalert2";
import assignmentService from "../../services/assignmentService";

export default function AssignRoleModal({
  isOpen,
  onClose,
  onSuccess,
  user,
  roles,
  assignedRoles,
}) {
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const availableRoles = roles.filter(
    (role) => !assignedRoles.some((ar) => ar.roleId === role.id)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedRoleId) {
      Swal.fire({
        title: "Error",
        text: "Debes seleccionar un rol",
        icon: "error",
        customClass: { confirmButton: 'btn-confirm-danger' },
      });
      return;
    }

    try {
      setLoading(true);

      // Obtener el usuario actual de forma robusta
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const currentUserId =
        currentUser?.userId ||
        currentUser?.id ||
        userInfo?.sub ||
        userInfo?.userId;

      if (!currentUserId) {
        throw new Error("No se pudo obtener el ID del usuario actual");
      }

      // ✅ ACTUALIZADO: No enviar currentUserId, se inyecta del JWT
      await assignmentService.assignRoleToUser(
        user.id,
        selectedRoleId,
        null // expirationDate (opcional)
      );

      Swal.fire({
        title: "¡Éxito!",
        text: "Rol asignado correctamente",
        icon: "success",
        customClass: { confirmButton: 'btn-confirm-success' },
        timer: 2000,
        showConfirmButton: false,
      });

      setSelectedRoleId("");
      onSuccess();
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.message || "No se pudo asignar el rol",
        icon: "error",
        customClass: { confirmButton: 'btn-confirm-danger' },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-gray-100 animate-fadeInScale">
        {/* Header */}
        <div className="px-6 py-5 bg-blue-600 rounded-t-3xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Asignar Rol</h2>
                <p className="text-blue-100 text-sm mt-0.5">
                  Usuario: {user?.username}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 bg-white">
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Seleccionar Rol <span className="text-red-500">*</span>
            </label>
            {availableRoles.length === 0 ? (
              <div className="w-full px-4 py-3 bg-red-50 border-l-4 border-l-red-500 rounded-xl">
                <p className="text-sm text-red-700 flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  No hay roles disponibles para asignar
                </p>
                <p className="text-xs text-red-600 mt-1 ml-6">Todos los roles ya están asignados</p>
              </div>
            ) : (
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm appearance-none cursor-pointer"
                required
              >
                <option value="">Selecciona un rol...</option>
                {availableRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name} {role.description ? `- ${role.description}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              disabled={loading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
              disabled={loading || availableRoles.length === 0}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Asignando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Asignar Rol
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

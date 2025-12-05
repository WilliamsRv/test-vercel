import { useState } from "react";
import Swal from "sweetalert2";
import assignmentService from "../../services/assignmentService";

export default function AssignPermissionModal({
  isOpen,
  onClose,
  onSuccess,
  role,
  permissions,
  assignedPermissions,
}) {
  const [selectedPermissionId, setSelectedPermissionId] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const availablePermissions = permissions.filter(
    (permission) =>
      !assignedPermissions.some((ap) => ap.permissionId === permission.id)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPermissionId) {
      Swal.fire({
        title: "Error",
        text: "Debes seleccionar un permiso",
        icon: "error",
        customClass: { confirmButton: 'btn-confirm-danger' },
      });
      return;
    }

    try {
      setLoading(true);

      await assignmentService.assignPermissionToRole(
        role.id,
        selectedPermissionId
      );

      Swal.fire({
        title: "¡Éxito!",
        text: "Permiso asignado correctamente",
        icon: "success",
        customClass: { confirmButton: 'btn-confirm-success' },
        timer: 2000,
        showConfirmButton: false,
      });

      setSelectedPermissionId("");
      onSuccess();
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.message || "No se pudo asignar el permiso",
        icon: "error",
        customClass: { confirmButton: 'btn-confirm-danger' },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-100 animate-fadeInScale">
        {/* Header */}
        <div className="px-6 py-5 bg-blue-600 rounded-t-3xl flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Asignar Permiso</h2>
                <p className="text-blue-100 text-sm mt-0.5">Rol: {role?.name}</p>
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
        <form onSubmit={handleSubmit} className="p-6 bg-white overflow-y-auto flex-1">
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Seleccionar Permiso <span className="text-red-500">*</span>
            </label>
            {availablePermissions.length === 0 ? (
              <div className="w-full px-4 py-3 bg-red-50 border-l-4 border-l-red-500 rounded-xl">
                <p className="text-sm text-red-700 flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  No hay permisos disponibles para asignar
                </p>
                <p className="text-xs text-red-600 mt-1 ml-6">Todos los permisos ya están asignados</p>
              </div>
            ) : (
              <select
                value={selectedPermissionId}
                onChange={(e) => setSelectedPermissionId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm appearance-none cursor-pointer"
                required
              >
                <option value="">Selecciona un permiso...</option>
                {availablePermissions.map((permission) => (
                  <option key={permission.id} value={permission.id}>
                    {permission.module} - {permission.action} - {permission.resource}
                    {permission.description ? ` (${permission.description})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Vista previa del permiso seleccionado */}
          {selectedPermissionId && (
            <div className="bg-white rounded-2xl p-5 border-l-4 border-l-blue-500 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Vista Previa
              </h3>
              {(() => {
                const selected = availablePermissions.find(
                  (p) => p.id === selectedPermissionId
                );
                return (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[80px]">
                        Módulo:
                      </span>
                      <span className="text-sm text-slate-900 font-medium">
                        {selected?.module}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[80px]">
                        Acción:
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700">
                        {selected?.action}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[80px]">
                        Recurso:
                      </span>
                      <span className="text-sm text-slate-900 font-medium">
                        {selected?.resource}
                      </span>
                    </div>
                    {selected?.description && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[80px]">
                          Descripción:
                        </span>
                        <span className="text-sm text-slate-600">
                          {selected.description}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 rounded-b-3xl flex-shrink-0 flex gap-4">
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
            onClick={handleSubmit}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
            disabled={loading || availablePermissions.length === 0}
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
                Asignar Permiso
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

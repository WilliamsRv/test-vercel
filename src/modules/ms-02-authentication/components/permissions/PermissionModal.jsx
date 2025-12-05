import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import permissionService from "../../services/permissionService";

export default function PermissionModal({
  isOpen,
  onClose,
  onSuccess,
  permission,
  isEditing,
}) {
  const [formData, setFormData] = useState({
    module: "",
    action: "",
    resource: "",
    displayName: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (permission && isEditing) {
      setFormData({
        module: permission.module || "",
        action: permission.action || "",
        resource: permission.resource || "",
        displayName: permission.displayName || "",
        description: permission.description || "",
      });
    } else {
      setFormData({
        module: "",
        action: "",
        resource: "",
        displayName: "",
        description: "",
      });
    }
  }, [permission, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.module || !formData.action || !formData.resource || !formData.displayName) {
      Swal.fire({
        title: "Campos requeridos",
        text: "Por favor completa todos los campos obligatorios",
        icon: "warning",
        customClass: { confirmButton: 'btn-confirm-primary' },
      });
      return;
    }

    setLoading(true);

    try {
      if (isEditing) {
        await permissionService.updatePermission(permission.id, formData);
      } else {
        await permissionService.createPermission(formData);
      }

      onSuccess();
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo guardar el permiso",
        icon: "error",
        customClass: { confirmButton: 'btn-confirm-danger' },
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[95vh] flex flex-col border border-gray-100 animate-fadeInScale">
        {/* Header - Teal */}
        <div className="px-8 py-6 border-b border-teal-100 flex-shrink-0 flex justify-between items-center bg-teal-600 rounded-t-3xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {isEditing ? "Editar Permiso" : "Nuevo Permiso"}
              </h2>
              <p className="text-teal-100 text-sm mt-1">
                Completa los datos del permiso
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 bg-white" style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Grid de 2 columnas para las secciones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sección: Información Técnica */}
              <div className="bg-white rounded-2xl p-6 border-l-4 border-l-teal-500 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </span>
                  Información Técnica
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                      Módulo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="module"
                      value={formData.module}
                      onChange={handleChange}
                      placeholder="ej: users, roles, permissions"
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-teal-500/20 transition-all text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                      Acción <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="action"
                      value={formData.action}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-teal-500/20 transition-all text-sm appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Seleccionar acción</option>
                      <option value="read">Lectura</option>
                      <option value="write">Escritura</option>
                      <option value="delete">Eliminación</option>
                      <option value="manage">Control Total</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                      Recurso <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="resource"
                      value={formData.resource}
                      onChange={handleChange}
                      placeholder="ej: profile, settings, * (todos)"
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-teal-500/20 transition-all text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Sección: Información de Visualización */}
              <div className="bg-white rounded-2xl p-6 border-l-4 border-l-teal-500 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </span>
                  Información de Visualización
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                      Nombre del Permiso <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-teal-500/20 transition-all text-sm appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Seleccionar nombre</option>
                      <option value="Gestión Completa">Gestión Completa</option>
                      <option value="Lectura de Datos">Lectura de Datos</option>
                      <option value="Creación de Registros">Creación de Registros</option>
                      <option value="Edición de Registros">Edición de Registros</option>
                      <option value="Eliminación de Registros">Eliminación de Registros</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-2 pl-1">
                      Este nombre se mostrará en las tablas y listas de selección.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe el propósito de este permiso..."
                      rows="3"
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-teal-500/20 transition-all text-sm resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-8 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg"
              >
                {loading ? "Guardando..." : isEditing ? "Actualizar Permiso" : "Crear Permiso"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

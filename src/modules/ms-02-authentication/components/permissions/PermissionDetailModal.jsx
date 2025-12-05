export default function PermissionDetailModal({
  isOpen,
  onClose,
  permission,
}) {
  if (!isOpen || !permission) return null;

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
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(dateObj);
    } catch (error) {
      console.warn("Error al formatear fecha:", date, error);
      return "-";
    }
  };

  const getActionBadge = (action) => {
    const badges = {
      read: { bg: "bg-blue-100", text: "text-blue-800", label: "Lectura" },
      write: { bg: "bg-green-100", text: "text-green-800", label: "Escritura" },
      delete: { bg: "bg-red-100", text: "text-red-800", label: "Eliminación" },
      "*": { bg: "bg-purple-100", text: "text-purple-800", label: "Todos" },
    };
    return (
      badges[action] || {
        bg: "bg-gray-100",
        text: "text-gray-800",
        label: action,
      }
    );
  };

  const actionBadge = getActionBadge(permission.action);

  return (
    <div className="fixed inset-0 bg-gray-900/75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200">
        {/* Header - Teal */}
        <div className="bg-teal-600 text-white px-6 py-5 rounded-t-2xl">
          <div className="relative flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-1">
                  Detalles del Permiso
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-teal-100 text-sm">
                    Información completa del permiso
                  </p>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ${permission.status === true
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                  >
                    <span>{permission.status === true ? "✓" : "○"}</span>
                    {permission.status === true ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-teal-100 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido - Grid de Cards */}
        <div className="p-5 bg-slate-50 rounded-b-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Card: Información General */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow border-l-4 border-l-teal-500 md:col-span-2">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Información General
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                    Nombre del Permiso
                  </label>
                  <p className="text-lg font-bold text-slate-900">
                    {permission.displayName || "Sin nombre amigable"}
                  </p>
                </div>
                {permission.description && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                      Descripción
                    </label>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {permission.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Card: Detalles Técnicos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow h-fit border-l-4 border-l-teal-500">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Detalles Técnicos
                </h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                    Módulo
                  </label>
                  <p className="text-sm font-mono font-medium text-slate-900">
                    {permission.module}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                    Acción
                  </label>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${actionBadge.bg} ${actionBadge.text}`}
                    >
                      {actionBadge.label}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">({permission.action})</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                    Recurso
                  </label>
                  <p className="text-sm font-mono font-medium text-slate-900">
                    {permission.resource}
                  </p>
                </div>
              </div>
            </div>

            {/* Card: Auditoría */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow h-fit border-l-4 border-l-teal-500">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Auditoría
                </h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                    Fecha de Creación
                  </label>
                  <p className="text-sm font-medium text-slate-900">
                    {formatDate(permission.createdAt)}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

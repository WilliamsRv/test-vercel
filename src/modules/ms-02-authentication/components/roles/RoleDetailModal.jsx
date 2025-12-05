export default function RoleDetailModal({ isOpen, onClose, role }) {
  if (!isOpen || !role) return null;

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

      if (isNaN(dateObj.getTime())) {
        return "-";
      }

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

  const getStatusInfo = (active) => {
    return active
      ? {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        border: "border-emerald-200",
        icon: "✓",
        label: "Activo",
      }
      : {
        bg: "bg-slate-100",
        text: "text-slate-700",
        border: "border-slate-200",
        icon: "○",
        label: "Inactivo",
      };
  };

  const statusInfo = getStatusInfo(role.active);

  return (
    <div className="fixed inset-0 bg-gray-900/75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col border border-gray-100 animate-fadeInScale">
        {/* Header iOS Púrpura */}
        <div className="px-6 py-5 bg-purple-600 rounded-t-3xl flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner">
                <span className="text-2xl font-bold text-white">
                  {role.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">{role.name}</h2>
                <p className="text-purple-100 text-sm mt-0.5">
                  Información completa del rol
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${statusInfo.bg} ${statusInfo.text} border ${statusInfo.border}`}
                >
                  <span>{statusInfo.icon}</span>
                  {statusInfo.label}
                </span>
                {(role.isSystem || role.is_system) && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white/20 text-white border border-white/30">
                    Sistema
                  </span>
                )}
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
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-slate-50" style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}>
          {/* Sección: Identificación */}
          <div className="bg-white rounded-2xl p-6 border-l-4 border-l-purple-500 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
              Identificación
            </h3>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                Nombre del Rol
              </label>
              <p className="text-xl font-bold text-slate-900 bg-gray-50 px-4 py-3 rounded-xl">{role.name}</p>
            </div>
          </div>

          {/* Sección: Descripción */}
          <div className="bg-white rounded-2xl p-6 border-l-4 border-l-purple-500 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              Descripción
            </h3>
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-slate-700 leading-relaxed">
                {role.description || "Sin descripción disponible"}
              </p>
            </div>
          </div>

          {/* Sección: Configuración */}
          <div className="bg-white rounded-2xl p-6 border-l-4 border-l-purple-500 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              Configuración
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Tipo de Rol
                </label>
                <p className="text-lg font-bold text-slate-900">
                  {role.isSystem || role.is_system ? "Sistema" : "Personalizado"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {role.isSystem || role.is_system
                    ? "No puede ser eliminado"
                    : "Creado por el usuario"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Estado
                </label>
                <p className={`text-lg font-bold ${role.active ? "text-green-700" : "text-slate-700"}`}>
                  {role.active ? "Activo" : "Inactivo"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {role.active ? "Disponible para asignación" : "No disponible"}
                </p>
              </div>
            </div>
          </div>

          {/* Sección: Auditoría */}
          <div className="bg-white rounded-2xl p-6 border-l-4 border-l-purple-500 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Información de Auditoría
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Fecha de Creación
                </label>
                <p className="text-sm font-mono text-slate-700">
                  {formatDate(role.createdAt)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Última Modificación
                </label>
                <p className="text-sm font-mono text-slate-700">
                  {formatDate(role.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>



        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </div>
  );
}

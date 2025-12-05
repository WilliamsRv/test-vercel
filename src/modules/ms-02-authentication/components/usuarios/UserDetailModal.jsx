import { useEffect, useState } from "react";
import { getMunicipalidadById } from "../../../ms-01-tenant-management/services/municipalidadService";
import areaService from "../../services/areaService";
import personService from "../../services/personService";
import positionService from "../../services/positionService";

export default function UserDetailModal({ isOpen, onClose, user, users = [] }) {
  const [personData, setPersonData] = useState(null);
  const [positions, setPositions] = useState([]);
  const [areas, setAreas] = useState([]);
  const [municipalidad, setMunicipalidad] = useState(null);
  const [loadingMunicipalidad, setLoadingMunicipalidad] = useState(false);

  useEffect(() => {
    const loadPersonData = async () => {
      if (isOpen && user?.personId) {
        try {
          const data = await personService.getPersonById(user.personId);
          setPersonData(data);
        } catch (err) {
          console.error("Error al cargar datos de persona:", err);
        }
      }
    };

    const loadPositions = async () => {
      try {
        const data = await positionService.getActivePositions();
        setPositions(data);
      } catch (error) {
        console.error("Error cargando posiciones:", error);
      }
    };

    const loadAreas = async () => {
      try {
        const data = await areaService.getActiveAreas();
        setAreas(data);
      } catch (error) {
        console.error("Error cargando áreas:", error);
      }
    };

    const loadMunicipalidad = async () => {
      if (user?.municipalCode) {
        try {
          setLoadingMunicipalidad(true);
          const data = await getMunicipalidadById(user.municipalCode);
          setMunicipalidad(data);
        } catch (error) {
          console.warn("Servicio de municipalidades no disponible:", error);
          setMunicipalidad(null);
        } finally {
          setLoadingMunicipalidad(false);
        }
      } else {
        setMunicipalidad(null);
      }
    };

    if (isOpen) {
      loadPersonData();
      loadPositions();
      loadAreas();
      loadMunicipalidad();
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

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

  const getPersonName = () => {
    if (!personData) return "Cargando...";
    return `${personData.firstName || ""} ${personData.lastName || ""}`.trim() || "-";
  };

  const getAreaName = (areaId) => {
    if (!areaId) return "Sin asignar";
    const area = areas.find(a => a.id === areaId);
    return area ? area.name : `ID: ${areaId.substring(0, 8)}...`;
  };

  const getPositionName = (positionId) => {
    if (!positionId) return "Sin asignar";
    const position = positions.find(p => p.id === positionId);
    return position ? position.name : `ID: ${positionId.substring(0, 8)}...`;
  };

  const getUserName = (userId) => {
    if (!userId) return "Sin asignar";
    const foundUser = users.find(u => u.id === userId);
    return foundUser ? foundUser.username : "Sin asignar";
  };

  const getStatusInfo = (status) => {
    const statuses = {
      ACTIVE: {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        border: "border-emerald-200",
        icon: "✓",
        label: "Activo",
      },
      INACTIVE: {
        bg: "bg-slate-100",
        text: "text-slate-700",
        border: "border-slate-200",
        icon: "○",
        label: "Inactivo",
      },
      SUSPENDED: {
        bg: "bg-amber-100",
        text: "text-amber-700",
        border: "border-amber-200",
        icon: "⚠",
        label: "Suspendido",
      },
      BLOCKED: {
        bg: "bg-red-100",
        text: "text-red-700",
        border: "border-red-200",
        icon: "🔒",
        label: "Bloqueado",
      },
    };
    return statuses[status] || statuses.INACTIVE;
  };

  const statusInfo = getStatusInfo(user.status);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full border border-blue-100 overflow-hidden animate-fadeInScale">
        {/* Header Estilo iOS - Azul Limpio */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-6">
          <div className="relative flex justify-between items-start">
            <div className="flex items-start gap-4">
              {/* Avatar Circular Estilo iOS */}
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border-2 border-white/30">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                  {user.username}
                </h2>
                <p className="text-blue-50 text-sm font-medium mb-2">
                  {getPersonName()}
                </p>
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${statusInfo.bg} ${statusInfo.text} border-2 ${statusInfo.border} shadow-sm`}
                >
                  <span className="text-base">{statusInfo.icon}</span>
                  {statusInfo.label}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-xl p-2.5 transition-all duration-200 backdrop-blur-sm"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido - Grid de Cards Estilo iOS */}
        <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Card: Información Organizacional - Estilo iOS */}
            <div className="bg-white rounded-2xl shadow-sm border-2 border-blue-100 p-5 hover:shadow-lg hover:border-blue-200 transition-all duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Información Organizacional
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2.5">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                      Área
                    </label>
                    <p className="text-sm font-semibold text-slate-900 break-words whitespace-normal leading-relaxed">
                      {getAreaName(user.areaId)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                      Cargo/Posición
                    </label>
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {getPositionName(user.positionId)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 col-span-2">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                      Jefe Directo
                    </label>
                    <p className="text-sm font-semibold text-slate-900">
                      {getUserName(user.directManagerId)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Seguridad y Acceso - Estilo iOS */}
            <div className="bg-white rounded-2xl shadow-sm border-2 border-blue-100 p-5 hover:shadow-lg hover:border-blue-200 transition-all duration-200 h-fit">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Seguridad y Acceso
                </h3>
              </div>
              <div className="space-y-4">
                {/* Estado de Bloqueo */}
                {(user.status === 'BLOCKED' || (user.blockedUntil && new Date(user.blockedUntil) > new Date())) && (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <label className="text-xs font-bold text-red-800 uppercase tracking-wide block mb-1">
                      ⛔ Cuenta Bloqueada
                    </label>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-red-900">
                          Bloqueado temporalmente
                        </span>
                        <span className="text-xs text-red-700">
                          Hasta: {formatDate(user.blockedUntil)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {/* Estado de Suspensión/Bloqueo */}
                {user.status === 'SUSPENDED' && (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <label className="text-xs font-bold text-amber-800 uppercase tracking-wide block mb-1">
                      Estado de Suspensión
                    </label>
                    <div className="flex items-center gap-2">
                      {user.suspensionEnd ? (
                        <>
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-medium text-amber-900">
                            Hasta: {formatDate(user.suspensionEnd)}
                          </span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="text-sm font-bold text-red-700">
                            INDEFINIDA
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Último Acceso */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                    Último Acceso
                  </label>
                  <p className="text-sm text-slate-900 font-medium flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {user.lastLogin ? formatDate(user.lastLogin) : "Nunca"}
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">
                    Auditoría
                  </h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                          Creación
                        </label>
                        <p className="text-xs text-slate-900 font-medium">
                          {formatDate(user.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                          Actualización
                        </label>
                        <p className="text-xs text-slate-900 font-medium">
                          {formatDate(user.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 col-span-2">
                      <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                          Versión
                        </label>
                        <p className="text-base font-bold text-slate-900">
                          v{user.version || 1}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Municipalidad - Estilo iOS */}
            <div className="bg-white rounded-2xl shadow-sm border-2 border-blue-100 p-5 hover:shadow-lg hover:border-blue-200 transition-all duration-200 h-fit">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  🏛️ Municipalidad
                </h3>
              </div>

              {loadingMunicipalidad ? (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-xs">Cargando...</span>
                </div>
              ) : municipalidad ? (
                <div className="space-y-2">
                  <div className="bg-white px-3 py-2 rounded-lg border border-gray-200">
                    <p className="text-sm font-bold text-slate-900 mb-1">
                      {municipalidad.nombre}
                    </p>
                    <div className="flex flex-wrap gap-1 text-xs text-slate-700">
                      <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                        {municipalidad.tipo}
                      </span>
                      <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                        {municipalidad.distrito}
                      </span>
                    </div>
                  </div>

                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No asignado</p>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

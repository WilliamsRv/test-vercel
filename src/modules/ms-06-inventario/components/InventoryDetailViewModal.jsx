
import { 
  XMarkIcon, 
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MapPinIcon,
  UserIcon,
  CalendarIcon,
  CameraIcon
} from '@heroicons/react/24/outline';

const FOUND_STATUS_CONFIG = {
  FOUND: { label: 'Encontrado', color: 'bg-green-50 text-green-700 border-green-200', bgColor: 'bg-green-500', icon: CheckCircleIcon },
  MISSING: { label: 'Faltante', color: 'bg-red-50 text-red-700 border-red-200', bgColor: 'bg-red-500', icon: XCircleIcon },
  SURPLUS: { label: 'Sobrante', color: 'bg-blue-50 text-blue-700 border-blue-200', bgColor: 'bg-blue-500', icon: PlusIcon },
  DAMAGED: { label: 'Dañado', color: 'bg-amber-50 text-amber-700 border-amber-200', bgColor: 'bg-amber-500', icon: ExclamationTriangleIcon }
};

const CONSERVATION_LABELS = {
  EXCELLENT: 'Excelente',
  GOOD: 'Bueno',
  REGULAR: 'Regular',
  BAD: 'Malo',
  UNUSABLE: 'Inutilizable'
};

export default function InventoryDetailViewModal({ isOpen, onClose, detail, locations = [], users = [] }) {
  if (!isOpen || !detail) return null;

  const statusConfig = FOUND_STATUS_CONFIG[detail.foundStatus] || FOUND_STATUS_CONFIG.FOUND;
  const StatusIcon = statusConfig.icon;

  const getLocationName = (id) => {
    if (!id) return 'No especificada';
    const loc = locations.find(l => l.id === id);
    return loc ? loc.name : id.slice(-8);
  };

  const getUserName = (id) => {
    if (!id) return 'No asignado';
    const user = users.find(u => u.id === id);
    return user ? (user.nombre || user.name || user.username) : id.slice(-8);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES');
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <StatusIcon className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Detalle de Verificación</h3>
                <div className={`inline-flex items-center px-3 py-1.5 mt-2 rounded-full text-sm font-semibold border ${statusConfig.color}`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${statusConfig.bgColor} mr-2`}></div>
                  {statusConfig.label}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 bg-white/20 hover:bg-white/30 rounded-xl p-2.5 transition-all duration-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Columna Izquierda - 2/3 del espacio */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Información del Bien + Conservación */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4">
                  <div className="flex items-center">
                    <div className="bg-white/20 p-2 rounded-lg mr-3">
                      <InformationCircleIcon className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-white">Información del Bien</h4>
                  </div>
                </div>
                <div className="p-6 bg-white">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Asset ID</label>
                      <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                        <p className="text-lg font-bold text-gray-900">
                          {detail.assetId ? detail.assetId.slice(-8) : 'Sin asignar'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Estado de Conservación</label>
                      <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                        <p className="text-lg font-bold text-gray-900">
                          {CONSERVATION_LABELS[detail.actualConservationStatus] || detail.actualConservationStatus || 'No especificado'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ubicación y Responsable */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
                  <div className="flex items-center">
                    <div className="bg-white/20 p-2 rounded-lg mr-3">
                      <MapPinIcon className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-white">Ubicación y Responsable</h4>
                  </div>
                </div>
                <div className="p-6 bg-white">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Ubicación Actual</label>
                      <div className="flex items-center p-4 bg-green-50 rounded-xl border border-green-200">
                        <div className="bg-green-500 p-2 rounded-lg mr-3">
                          <MapPinIcon className="h-5 w-5 text-white" />
                        </div>
                        <p className="font-semibold text-gray-900">{getLocationName(detail.actualLocationId)}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Responsable Actual</label>
                      <div className="flex items-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="bg-blue-500 p-2 rounded-lg mr-3">
                          <UserIcon className="h-5 w-5 text-white" />
                        </div>
                        <p className="font-semibold text-gray-900">{getUserName(detail.actualResponsibleId)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              {(detail.observations || detail.physicalDifferences || detail.documentDifferences) && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="bg-amber-100 p-2 rounded-lg mr-3">
                        <InformationCircleIcon className="h-5 w-5 text-amber-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Observaciones</h4>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {detail.observations && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Observaciones Generales</label>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">{detail.observations}</p>
                        </div>
                      </div>
                    )}
                    {detail.physicalDifferences && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Diferencias Físicas</label>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">{detail.physicalDifferences}</p>
                        </div>
                      </div>
                    )}
                    {detail.documentDifferences && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Diferencias Documentales</label>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">{detail.documentDifferences}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Acción Requerida */}
              {detail.requiresAction && (
                <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-red-100">
                    <div className="flex items-center">
                      <div className="bg-red-100 p-2 rounded-lg mr-3">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-red-900">⚠️ Requiere Acción Correctiva</h4>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <p className="text-sm text-red-900 whitespace-pre-wrap">{detail.requiredAction || 'No especificada'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Panel Lateral */}
            <div className="xl:col-span-1 space-y-6">
              
              {/* Verificación */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="bg-purple-100 p-2 rounded-lg mr-3">
                      <CalendarIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Verificación</h4>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha de Verificación</label>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">{formatDate(detail.verificationDate)}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Verificado por</label>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">{getUserName(detail.verifiedBy)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fotografías */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-5 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-cyan-100 p-2 rounded-lg mr-3">
                        <CameraIcon className="h-5 w-5 text-cyan-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Fotografías</h4>
                    </div>
                    {detail.photographs && detail.photographs.length > 0 && (
                      <span className="bg-cyan-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        {detail.photographs.length}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  {detail.photographs && detail.photographs.length > 0 ? (
                    <div className="space-y-4">
                      {/* Galería de fotos */}
                      <div className={`grid gap-3 ${detail.photographs.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {detail.photographs.map((photo, index) => (
                          <div
                            key={index}
                            className={`group relative rounded-xl overflow-hidden border-2 border-gray-200 hover:border-cyan-400 transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer bg-gray-100 ${detail.photographs.length === 1 ? 'h-48' : 'h-28'}`}
                            onClick={() => window.open(photo.data || photo, '_blank')}
                          >
                            <img
                              src={photo.data || photo}
                              alt={`Foto ${index + 1}`}
                              className="w-full h-full object-contain bg-white group-hover:scale-105 transition-transform duration-300"
                            />
                            {/* Overlay en hover */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <div className="bg-white rounded-full p-3 shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
                                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                              </div>
                            </div>
                            {/* Badge de número */}
                            <div className="absolute top-2 left-2 bg-cyan-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Texto de ayuda */}
                      <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Clic para ver en tamaño completo
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="bg-gray-50 rounded-full p-3 w-14 h-14 mx-auto mb-2 flex items-center justify-center border-2 border-dashed border-gray-200">
                        <CameraIcon className="h-6 w-6 text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-400">Sin fotografías</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Auditoría */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="bg-gray-100 p-2 rounded-lg mr-3">
                      <InformationCircleIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Auditoría</h4>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Creado</label>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">{formatDate(detail.createdAt)}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Actualizado</label>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">{formatDate(detail.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}














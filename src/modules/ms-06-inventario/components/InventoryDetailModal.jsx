
import { 
  XMarkIcon, 
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  UserIcon,
  CalendarIcon,
  InformationCircleIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const statusConfig = {
  PLANNED: {
    label: 'Planificado',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: ClipboardDocumentListIcon,
    bgColor: 'bg-blue-500'
  },
  IN_PROGRESS: {
    label: 'En Progreso',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: ClockIcon,
    bgColor: 'bg-amber-500'
  },
  COMPLETED: {
    label: 'Completado',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircleIcon,
    bgColor: 'bg-emerald-500'
  },
  CANCELLED: {
    label: 'Cancelado',
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: XCircleIcon,
    bgColor: 'bg-red-500'
  }
};

const TYPE_LABELS = {
  GENERAL: "General",
  PARTIAL: "Parcial",
  SELECTIVE: "Selectivo"
};

// Función para normalizar el estado
const normalizeStatus = (status) => {
  if (!status) return 'PLANNED';
  let normalized = status.toUpperCase().replace(/\s+/g, '_');
  
  // Convertir IN_PROCESS a IN_PROGRESS para compatibilidad
  if (normalized === 'IN_PROCESS') {
    normalized = 'IN_PROGRESS';
  }
  
  return normalized;
};

// Función para obtener el estado del inventario
const getInventoryStatus = (inventory) => {
  return inventory?.status || inventory?.inventoryStatus;
};

export default function InventoryDetailModal({ isOpen, onClose, inventory, areaName, categoryName, locationName, responsibleName }) {
  if (!isOpen || !inventory) return null;

  // Función helper para convertir cualquier valor a string seguro
  const toSafeString = (value, defaultValue = '') => {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return defaultValue;
    return String(value);
  };

  // Asegurar que todos los nombres sean strings o null
  const safeAreaName = typeof areaName === 'string' ? areaName : null;
  const safeCategoryName = typeof categoryName === 'string' ? categoryName : null;
  const safeLocationName = typeof locationName === 'string' ? locationName : null;
  const safeResponsibleName = typeof responsibleName === 'string' ? responsibleName : null;

  // Asegurar que todos los campos del inventario sean strings seguros
  const safeInventoryNumber = toSafeString(inventory.inventoryNumber, 'N/A');
  const safeInventoryType = toSafeString(inventory.inventoryType, 'N/A');
  const safeDescription = toSafeString(inventory.description, 'Sin descripción');
  const safeObservations = toSafeString(inventory.observations, '');
  const safeInventoryTeam = toSafeString(inventory.inventoryTeam, '');

  const currentStatus = getInventoryStatus(inventory);
  const normalizedStatus = normalizeStatus(currentStatus);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const [year, month, day] = dateString.split('T')[0].split('-');
      return `${day}/${month}/${year}`;
    } catch (error) {
      return 'N/A';
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    try {
      const date = new Date(dateTimeString);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      
      // Si la hora es 0:00:00, solo mostrar la fecha
      if (hours === 0 && minutes === 0 && seconds === 0) {
        return date.toLocaleDateString('es-ES');
      }
      return date.toLocaleString('es-ES');
    } catch (error) {
      return 'N/A';
    }
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.PLANNED;
    const IconComponent = config.icon;
    
    return (
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full ${config.bgColor} mr-3`}></div>
        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${config.color}`}>
          <IconComponent className="w-4 h-4 mr-2" />
          {config.label}
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6 text-white">
          <div className="flex justify-between items-start">
            <div className="flex items-start">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl mr-4">
                <ClipboardDocumentListIcon className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  Inventario Físico
                </h3>
                <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full inline-block">
                  <span className="text-sm font-medium">{safeInventoryNumber}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-2 transition-colors duration-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(95vh-140px)] overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              {/* Información Principal */}
              <div className="xl:col-span-3 space-y-8">
                
                {/* Información General */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-lg mr-3">
                        <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Información General</h4>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Número de Inventario</label>
                        <div className="flex items-center">
                          <ClipboardDocumentListIcon className="h-4 w-4 text-blue-500 mr-2" />
                          <p className="text-lg font-semibold text-gray-900">{safeInventoryNumber}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</label>
                        <div>
                          {getStatusBadge(normalizedStatus)}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo de Inventario</label>
                        <p className="text-lg font-semibold text-gray-900">
                          {TYPE_LABELS[safeInventoryType] || safeInventoryType}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</label>
                        <p className="text-base text-gray-900">{safeDescription}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alcance */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="bg-purple-100 p-2 rounded-lg mr-3">
                        <MapPinIcon className="h-5 w-5 text-purple-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Alcance del Inventario</h4>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Área</label>
                        <div className="flex items-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                          <div className="bg-purple-100 p-2 rounded-full mr-3">
                            <MapPinIcon className="h-4 w-4 text-purple-600" />
                          </div>
                          <p className="font-semibold text-gray-900">{safeAreaName || 'Todas las áreas'}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</label>
                        <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="bg-blue-100 p-2 rounded-full mr-3">
                            <ClipboardDocumentListIcon className="h-4 w-4 text-blue-600" />
                          </div>
                          <p className="font-semibold text-gray-900">{safeCategoryName || 'Todas las categorías'}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ubicación</label>
                        <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-100">
                          <div className="bg-green-100 p-2 rounded-full mr-3">
                            <MapPinIcon className="h-4 w-4 text-green-600" />
                          </div>
                          <p className="font-semibold text-gray-900">{safeLocationName || 'Todas las ubicaciones'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fechas */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-lg mr-3">
                        <CalendarIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Programación</h4>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha de Inicio Planificada</label>
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 text-green-500 mr-2" />
                          <p className="text-lg font-semibold text-gray-900">{formatDate(inventory.plannedStartDate)}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha de Fin Planificada</label>
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 text-green-500 mr-2" />
                          <p className="text-lg font-semibold text-gray-900">{formatDate(inventory.plannedEndDate)}</p>
                        </div>
                      </div>
                      {inventory.actualStartDate && (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha de Inicio Real</label>
                          <div className="flex items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                            <CalendarIcon className="h-4 w-4 text-emerald-600 mr-2" />
                            <p className="text-base font-semibold text-emerald-900">{formatDateTime(inventory.actualStartDate)}</p>
                          </div>
                        </div>
                      )}
                      {inventory.actualEndDate && (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha de Fin Real</label>
                          <div className="flex items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                            <CalendarIcon className="h-4 w-4 text-emerald-600 mr-2" />
                            <p className="text-base font-semibold text-emerald-900">{formatDateTime(inventory.actualEndDate)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Responsable */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="bg-amber-100 p-2 rounded-lg mr-3">
                        <UserIcon className="h-5 w-5 text-amber-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Responsable</h4>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <div className="bg-amber-100 p-2 rounded-full mr-3">
                        <UserIcon className="h-4 w-4 text-amber-600" />
                      </div>
                      <p className="font-semibold text-gray-900">{safeResponsibleName || 'No asignado'}</p>
                    </div>
                  </div>
                </div>

                {/* Opciones */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="bg-cyan-100 p-2 rounded-lg mr-3">
                        <CheckCircleIcon className="h-5 w-5 text-cyan-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Opciones del Inventario</h4>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={`p-4 rounded-lg border-2 ${inventory.includesMissing ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center">
                          {inventory.includesMissing ? (
                            <CheckCircleIcon className="h-5 w-5 text-emerald-600 mr-2" />
                          ) : (
                            <XCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                          )}
                          <p className={`text-sm font-semibold ${inventory.includesMissing ? 'text-emerald-900' : 'text-gray-600'}`}>
                            Incluye Faltantes
                          </p>
                        </div>
                      </div>
                      <div className={`p-4 rounded-lg border-2 ${inventory.includesSurplus ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center">
                          {inventory.includesSurplus ? (
                            <CheckCircleIcon className="h-5 w-5 text-emerald-600 mr-2" />
                          ) : (
                            <XCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                          )}
                          <p className={`text-sm font-semibold ${inventory.includesSurplus ? 'text-emerald-900' : 'text-gray-600'}`}>
                            Incluye Sobrantes
                          </p>
                        </div>
                      </div>
                      <div className={`p-4 rounded-lg border-2 ${inventory.requiresPhotos ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center">
                          {inventory.requiresPhotos ? (
                            <CheckCircleIcon className="h-5 w-5 text-emerald-600 mr-2" />
                          ) : (
                            <XCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                          )}
                          <p className={`text-sm font-semibold ${inventory.requiresPhotos ? 'text-emerald-900' : 'text-gray-600'}`}>
                            Requiere Fotografías
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Observaciones y Equipo */}
                {(safeObservations || safeInventoryTeam) && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center">
                        <div className="bg-slate-100 p-2 rounded-lg mr-3">
                          <InformationCircleIcon className="h-5 w-5 text-slate-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">Información Adicional</h4>
                      </div>
                    </div>
                    <div className="p-6 space-y-6">
                      {safeObservations && (
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Observaciones</label>
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 min-h-[80px]">
                            <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                              {safeObservations}
                            </p>
                          </div>
                        </div>
                      )}
                      {safeInventoryTeam && (
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Equipo de Inventario</label>
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 min-h-[80px]">
                            <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                              {safeInventoryTeam}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Panel Lateral */}
              <div className="xl:col-span-1 space-y-6">
                
                {/* Información de Auditoría */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="bg-gray-100 p-2 rounded-lg mr-3">
                        <InformationCircleIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Información de Auditoría</h4>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha de Creación</label>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{formatDateTime(inventory.createdAt)}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Última Actualización</label>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{formatDateTime(inventory.updatedAt)}</p>
                      </div>
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











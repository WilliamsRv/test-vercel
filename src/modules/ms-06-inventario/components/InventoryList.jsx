import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  PlayIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  DocumentMagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import Swal from "sweetalert2";

const STATUS_LABELS = {
  PLANNED: { label: "Planificado", color: "bg-blue-50 text-blue-700 border-blue-200", icon: ClipboardDocumentListIcon, bgColor: "bg-blue-500" },
  IN_PROGRESS: { label: "En Progreso", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: ClockIcon, bgColor: "bg-yellow-500" },
  COMPLETED: { label: "Completado", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircleIcon, bgColor: "bg-green-500" },
  CANCELLED: { label: "Cancelado", color: "bg-red-50 text-red-700 border-red-200", icon: XCircleIcon, bgColor: "bg-red-500" }
};

const TYPE_LABELS = {
  GENERAL: "General",
  PARTIAL: "Parcial",
  SELECTIVE: "Selectivo"
};

// Función para normalizar el estado
const normalizeStatus = (status) => {
  if (!status) return 'PLANNED';
  let normalized = String(status).toUpperCase().trim().replace(/\s+/g, '_');
  if (normalized === 'IN_PROCESS') normalized = 'IN_PROGRESS';
  return normalized;
};

// Función para obtener el estado del inventario
const getInventoryStatus = (inventory) => {
  return inventory?.status || inventory?.inventoryStatus;
};

export default function InventoryList({ 
  inventories, 
  onView, 
  onEdit, 
  onDelete, 
  onStart, 
  onComplete, 
  onCreateNew,
  statusFilter,
  onStatusFilterChange
}) {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filteredInventories = inventories.filter(inv => {
    const matchSearch = 
      inv.inventoryNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.description?.toLowerCase().includes(search.toLowerCase());
    const normalizedStatus = normalizeStatus(getInventoryStatus(inv));
    const matchStatus = statusFilter === "todos" || normalizedStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const countByStatus = {
    todos: inventories.length,
    PLANNED: inventories.filter(inv => normalizeStatus(getInventoryStatus(inv)) === 'PLANNED').length,
    IN_PROGRESS: inventories.filter(inv => normalizeStatus(getInventoryStatus(inv)) === 'IN_PROGRESS').length,
    COMPLETED: inventories.filter(inv => normalizeStatus(getInventoryStatus(inv)) === 'COMPLETED').length,
    CANCELLED: inventories.filter(inv => normalizeStatus(getInventoryStatus(inv)) === 'CANCELLED').length
  };

  const getStatusBadge = (status) => {
    const config = STATUS_LABELS[status] || STATUS_LABELS.PLANNED;
    const IconComponent = config.icon;
    
    return (
      <div className="flex items-center">
        <div className={`w-2 h-2 rounded-full ${config.bgColor} mr-2`}></div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
          <IconComponent className="w-3.5 h-3.5 mr-1.5" />
          {config.label}
        </span>
      </div>
    );
  };

  // Función para verificar si el inventario está en el rango de fechas
  const isInDateRange = (inventory) => {
    if (!inventory.plannedStartDate || !inventory.plannedEndDate) {
      return true; // Si no hay fechas, permitir iniciar
    }

    // Obtener fecha actual en UTC (solo año, mes, día)
    const now = new Date();
    const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    // Obtener fechas del inventario en UTC
    const startDate = new Date(inventory.plannedStartDate);
    const startUTC = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());

    const endDate = new Date(inventory.plannedEndDate);
    const endUTC = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());

    return todayUTC >= startUTC && todayUTC <= endUTC;
  };

  const handleStart = (inventory) => {
    const currentStatus = getInventoryStatus(inventory);
    const normalizedStatus = normalizeStatus(currentStatus);

    if (normalizedStatus !== 'PLANNED') {
      Swal.fire({
        icon: 'warning',
        title: 'Estado Incorrecto',
        text: `Este inventario está en estado "${STATUS_LABELS[normalizedStatus]?.label || normalizedStatus}". Solo se pueden iniciar inventarios en estado "Planificado".`,
        confirmButtonColor: '#4f46e5'
      });
      return;
    }

    // Validar rango de fechas
    if (!isInDateRange(inventory)) {
      const formatDateUTC = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        return `${day}/${month}/${year}`;
      };
      
      const startDate = formatDateUTC(inventory.plannedStartDate);
      const endDate = formatDateUTC(inventory.plannedEndDate);
      
      Swal.fire({
        icon: 'warning',
        title: 'Fuera del Rango de Fechas',
        html: `
          <p>Este inventario solo puede iniciarse dentro del rango programado:</p>
          <div class="mt-3 p-3 bg-gray-50 rounded-lg">
            <p class="font-semibold text-gray-700">📅 Fecha de inicio: ${startDate}</p>
            <p class="font-semibold text-gray-700">📅 Fecha de fin: ${endDate}</p>
          </div>
          <p class="mt-3 text-sm text-gray-600">La fecha actual está fuera de este rango.</p>
        `,
        confirmButtonColor: '#4f46e5',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    Swal.fire({
      title: "¿Iniciar inventario?",
      text: `Se iniciará el inventario ${inventory.inventoryNumber}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, iniciar",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        onStart(inventory.id);
      }
    });
  };

  const handleComplete = (inventory) => {
    const currentStatus = getInventoryStatus(inventory);
    const normalizedStatus = normalizeStatus(currentStatus);

    if (normalizedStatus !== 'IN_PROGRESS') {
      Swal.fire({
        icon: 'warning',
        title: 'Estado Incorrecto',
        text: `Este inventario está en estado "${STATUS_LABELS[normalizedStatus]?.label || normalizedStatus}". Solo se pueden completar inventarios en estado "En Progreso".`,
        confirmButtonColor: '#4f46e5'
      });
      return;
    }

    Swal.fire({
      title: "¿Completar inventario?",
      text: `Se marcará como completado el inventario ${inventory.inventoryNumber}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, completar",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        onComplete(inventory.id);
      }
    });
  };

  const handleDelete = (inventory) => {
    Swal.fire({
      title: "¿Eliminar inventario?",
      text: `Se eliminará el inventario ${inventory.inventoryNumber}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        onDelete(inventory.id);
      }
    });
  };

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-200">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>
      </div>

      {filteredInventories.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <ClipboardDocumentListIcon className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay inventarios</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {statusFilter === "todos" 
              ? "Aún no se han creado inventarios. Haz clic en 'Nuevo Inventario' para crear el primero."
              : `No hay inventarios en estado "${STATUS_LABELS[statusFilter]?.label}".`
            }
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center">
                    <ClipboardDocumentListIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Número
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Fecha Inicio
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredInventories.map((inventory, index) => {
                const normalizedStatus = normalizeStatus(getInventoryStatus(inventory));
                return (
                  <tr key={inventory.id} className={`hover:bg-blue-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-lg mr-3">
                          <ClipboardDocumentListIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{inventory.inventoryNumber}</div>
                          <div className="text-xs text-gray-500">ID: {inventory.id.slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="text-sm text-gray-900 font-medium">{TYPE_LABELS[inventory.inventoryType] || inventory.inventoryType}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm text-gray-900">{inventory.description}</span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 font-medium">
                          {inventory.plannedStartDate ? (() => {
                            const date = new Date(inventory.plannedStartDate);
                            const day = String(date.getUTCDate()).padStart(2, '0');
                            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                            const year = date.getUTCFullYear();
                            return `${day}/${month}/${year}`;
                          })() : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      {getStatusBadge(normalizedStatus)}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-1">
                        <button
                          onClick={() => onView(inventory)}
                          className="inline-flex items-center p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        
                        {normalizedStatus === 'PLANNED' && (
                          <>
                            <button
                              onClick={() => onEdit(inventory)}
                              className="inline-flex items-center p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors duration-200"
                              title="Editar"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => handleStart(inventory)}
                              disabled={!isInDateRange(inventory)}
                              className={`inline-flex items-center p-2 rounded-lg transition-colors duration-200 ${
                                isInDateRange(inventory)
                                  ? 'text-purple-600 hover:text-purple-800 hover:bg-purple-100 cursor-pointer'
                                  : 'text-gray-400 bg-gray-100 cursor-not-allowed opacity-50'
                              }`}
                              title={
                                isInDateRange(inventory)
                                  ? 'Iniciar inventario'
                                  : (() => {
                                      const formatDateUTC = (dateString) => {
                                        const date = new Date(dateString);
                                        const day = String(date.getUTCDate()).padStart(2, '0');
                                        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                                        const year = date.getUTCFullYear();
                                        return `${day}/${month}/${year}`;
                                      };
                                      return `Fuera del rango de fechas (${formatDateUTC(inventory.plannedStartDate)} - ${formatDateUTC(inventory.plannedEndDate)})`;
                                    })()
                              }
                            >
                              <PlayIcon className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDelete(inventory)}
                              className="inline-flex items-center p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors duration-200"
                              title="Eliminar"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        
                        {normalizedStatus === 'IN_PROGRESS' && (
                          <>
                            <button
                              onClick={() => navigate(`/inventarios/${inventory.id}/detalles`)}
                              className="inline-flex items-center p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-lg transition-colors duration-200"
                              title="Verificar bienes"
                            >
                              <DocumentMagnifyingGlassIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleComplete(inventory)}
                              className="inline-flex items-center p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors duration-200"
                              title="Completar inventario"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}













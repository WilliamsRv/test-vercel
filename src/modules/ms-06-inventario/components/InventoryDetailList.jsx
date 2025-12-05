
import { useState, useEffect } from "react";
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  CameraIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import Swal from "sweetalert2";
import { getDetailsByInventoryId, deleteInventoryDetail } from "../services/inventoryDetailApi";

const FOUND_STATUS_LABELS = {
  FOUND: { label: "Encontrado", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircleIcon, bgColor: "bg-green-500" },
  MISSING: { label: "Faltante", color: "bg-red-50 text-red-700 border-red-200", icon: XCircleIcon, bgColor: "bg-red-500" },
  SURPLUS: { label: "Sobrante", color: "bg-blue-50 text-blue-700 border-blue-200", icon: PlusIcon, bgColor: "bg-blue-500" },
  DAMAGED: { label: "Dañado", color: "bg-amber-50 text-amber-700 border-amber-200", icon: ExclamationTriangleIcon, bgColor: "bg-amber-500" }
};

export default function InventoryDetailList({ 
  inventoryId, 
  inventoryStatus,
  onAddDetail,
  onEditDetail,
  onViewDetail
}) {
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  useEffect(() => {
    if (inventoryId) {
      loadDetails();
    }
  }, [inventoryId]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const data = await getDetailsByInventoryId(inventoryId);
      setDetails(data);
    } catch (error) {
      console.error('Error al cargar detalles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDetails = details.filter(detail => {
    const matchSearch = detail.observations?.toLowerCase().includes(search.toLowerCase()) ||
      detail.assetId?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "todos" || detail.foundStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const countByStatus = {
    todos: details.length,
    FOUND: details.filter(d => d.foundStatus === 'FOUND').length,
    MISSING: details.filter(d => d.foundStatus === 'MISSING').length,
    SURPLUS: details.filter(d => d.foundStatus === 'SURPLUS').length,
    DAMAGED: details.filter(d => d.foundStatus === 'DAMAGED').length
  };

  const getStatusBadge = (status) => {
    const config = FOUND_STATUS_LABELS[status] || FOUND_STATUS_LABELS.FOUND;
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

  const handleDelete = async (detail) => {
    const result = await Swal.fire({
      title: "¿Eliminar registro?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (result.isConfirmed) {
      try {
        await deleteInventoryDetail(detail.id);
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'Registro eliminado correctamente',
          timer: 1500,
          showConfirmButton: false
        });
        loadDetails();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar el registro'
        });
      }
    }
  };

  const canEdit = inventoryStatus === 'IN_PROGRESS' || inventoryStatus === 'IN_PROCESS';

  if (loading) {
    return (
      <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando detalles...</span>
        </div>
      </div>
    );
  }


  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Bienes Verificados</h3>
              <p className="text-sm text-gray-500">{details.length} registros</p>
            </div>
          </div>
          {canEdit && (
            <button
              onClick={onAddDetail}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
            >
              <PlusIcon className="h-5 w-5" />
              Agregar Bien
            </button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[180px]"
          >
            <option value="todos">Todos ({countByStatus.todos})</option>
            <option value="FOUND">Encontrados ({countByStatus.FOUND})</option>
            <option value="MISSING">Faltantes ({countByStatus.MISSING})</option>
            <option value="SURPLUS">Sobrantes ({countByStatus.SURPLUS})</option>
            <option value="DAMAGED">Dañados ({countByStatus.DAMAGED})</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {filteredDetails.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <ClipboardDocumentListIcon className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay bienes registrados</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {statusFilter === "todos" 
              ? "Aún no se han verificado bienes. Haz clic en 'Agregar Bien' para comenzar."
              : `No hay bienes con estado "${FOUND_STATUS_LABELS[statusFilter]?.label}".`
            }
          </p>
          {canEdit && (
            <button
              onClick={onAddDetail}
              className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              <PlusIcon className="h-5 w-5" />
              Agregar primer bien
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Bien/Asset
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Conservación
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Observaciones
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center">
                    <CameraIcon className="h-4 w-4 mr-1 text-gray-500" />
                    Fotos
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredDetails.map((detail, index) => (
                <tr key={detail.id} className={`hover:bg-blue-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <td className="px-6 py-4">{getStatusBadge(detail.foundStatus)}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      {detail.assetId ? detail.assetId.slice(-8) : 'Sin asignar'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {detail.actualConservationStatus || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 max-w-xs truncate block">
                      {detail.observations || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {detail.photographs && detail.photographs.length > 0 ? (
                      <span className="flex items-center text-sm text-green-600 font-medium">
                        <CameraIcon className="h-4 w-4 mr-1" />
                        {detail.photographs.length}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-1">
                      <button
                        onClick={() => onViewDetail(detail)}
                        className="inline-flex items-center p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                        title="Ver detalle"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {canEdit && (
                        <>
                          <button
                            onClick={() => onEditDetail(detail)}
                            className="inline-flex items-center p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors duration-200"
                            title="Editar"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(detail)}
                            className="inline-flex items-center p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors duration-200"
                            title="Eliminar"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer - Resumen */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex flex-wrap gap-6 text-sm">
          <span className="text-gray-600">Total: <strong className="text-gray-900">{details.length}</strong></span>
          <span className="text-green-600">Encontrados: <strong>{countByStatus.FOUND}</strong></span>
          <span className="text-red-600">Faltantes: <strong>{countByStatus.MISSING}</strong></span>
          <span className="text-blue-600">Sobrantes: <strong>{countByStatus.SURPLUS}</strong></span>
          <span className="text-amber-600">Dañados: <strong>{countByStatus.DAMAGED}</strong></span>
        </div>
      </div>
    </div>
  );
}















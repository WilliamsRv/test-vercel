import { useState, useEffect } from 'react';
import { 
  EyeIcon, 
  PencilIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  CubeIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import assetMovementService from '../../services/assetMovementService';
import { MovementStatusConfig, formatDateOnly, MovementTypeLabels } from '../../types/movementTypes';
import Paginator from '../../../../shared/utils/Paginator';
import { usePagination } from '../../../../shared/utils/usePagination';
import { getBienPatrimonialById } from '../../../ms-04-patrimonio/services/api';

export default function MovementsList({ 
  municipalityId, 
  onView, 
  onEdit,
  onDelete,
  onRestore,
  statusFilter = null,
  typeFilter = null,
  activeFilter = 'active', // 'active', 'inactive', 'all'
  movements: externalMovements = null, // Recibir movimientos como prop opcional
  loading: externalLoading = false, // Recibir estado de carga como prop opcional
  error: externalError = null // Recibir error como prop opcional
}) {
  const [internalMovements, setInternalMovements] = useState([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [internalError, setInternalError] = useState(null);
  const [assetNames, setAssetNames] = useState({}); // Mapa de assetId -> nombre
  const [loadingAssetNames, setLoadingAssetNames] = useState(false);

  // Si se pasan movimientos como props, usarlos; si no, cargarlos internamente
  const movements = externalMovements !== null ? externalMovements : internalMovements;
  const loading = externalMovements !== null ? externalLoading : internalLoading;
  const error = externalMovements !== null ? externalError : internalError;

  // Paginación
  const {
    paginatedData: paginatedMovements,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
  } = usePagination(movements, 10);

  // Resetear a la primera página cuando cambian los filtros o los movimientos
  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, movements.length]);

  useEffect(() => {
    // Solo cargar internamente si no se pasan movimientos como props
    if (externalMovements === null) {
      loadMovements();
    }
  }, [municipalityId, statusFilter, typeFilter, externalMovements]);

  // Cargar nombres de activos cuando cambian los movimientos
  useEffect(() => {
    if (movements && movements.length > 0) {
      loadAssetNames(movements);
    }
  }, [movements]);

  const loadMovements = async () => {
    try {
      setInternalLoading(true);
      setInternalError(null);
      
      let data;
      if (statusFilter) {
        data = await assetMovementService.getMovementsByStatus(statusFilter, municipalityId);
      } else if (typeFilter) {
        data = await assetMovementService.getMovementsByType(typeFilter, municipalityId);
      } else {
        data = await assetMovementService.getAllMovements(municipalityId);
      }
      
      setInternalMovements(Array.isArray(data) ? data : []);
    } catch (err) {
      setInternalError('Error al cargar los movimientos');
      console.error('Error loading movements:', err);
      setInternalMovements([]);
    } finally {
      setInternalLoading(false);
    }
  };

  const loadAssetNames = async (movementsList) => {
    if (!movementsList || movementsList.length === 0) return;
    
    try {
      setLoadingAssetNames(true);
      const assetIds = movementsList
        .map(mov => mov.assetId)
        .filter(Boolean)
        .filter((id, index, self) => self.indexOf(id) === index); // IDs únicos
      
      const namesMap = {};
      
      // Cargar nombres en paralelo
      await Promise.all(
        assetIds.map(async (assetId) => {
          try {
            const asset = await getBienPatrimonialById(assetId);
            if (asset) {
              let name = asset.description || asset.descripcion || asset.assetCode || asset.codigoPatrimonial || assetId;
              
              // Limpiar el nombre: remover información de ubicación que pueda estar concatenada (ej: " - Recepción", " - Auditorio Municipal")
              // Buscar patrones como " - " seguido de texto y removerlo
              if (name && typeof name === 'string') {
                // Remover todo lo que viene después de " - " si existe
                const locationPattern = /\s*-\s*[^-]+$/;
                name = name.replace(locationPattern, '').trim();
              }
              
              namesMap[assetId] = name;
            } else {
              namesMap[assetId] = assetId; // Fallback al ID si no se encuentra
            }
          } catch (err) {
            console.warn(`Error loading asset ${assetId}:`, err);
            namesMap[assetId] = assetId; // Fallback al ID si hay error
          }
        })
      );
      
      setAssetNames(prev => ({ ...prev, ...namesMap }));
    } catch (error) {
      console.error('Error loading asset names:', error);
    } finally {
      setLoadingAssetNames(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = MovementStatusConfig[status] || MovementStatusConfig.REQUESTED;
    
    return (
      <div className="flex items-center">
        <div className={`w-2 h-2 rounded-full ${config.bgColor} mr-2`}></div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
          {config.label}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-slate-600"></div>
            <p className="text-sm text-gray-600">Cargando movimientos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <XCircleIcon className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={loadMovements}
              className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
            >
              Intentar nuevamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

      {movements.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mb-6 mx-auto">
            <ArrowPathIcon className="h-12 w-12 text-slate-400" />
          </div>
          {activeFilter === 'inactive' ? (
            <>
              <p className="text-xl font-semibold text-slate-700 mb-2">No hay movimientos inactivos</p>
              <p className="text-slate-500">No se encontraron movimientos eliminados o inactivos.</p>
            </>
          ) : activeFilter === 'all' ? (
            <>
              <p className="text-xl font-semibold text-slate-700 mb-2">No hay movimientos registrados</p>
              <p className="text-slate-500">No se encontraron movimientos (activos ni inactivos) para este municipio.</p>
            </>
          ) : (
            <>
              <p className="text-xl font-semibold text-slate-700 mb-2">No hay movimientos activos</p>
              <p className="text-slate-500">Aún no se han registrado movimientos activos para este municipio.</p>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: '#283447' }}>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Activo
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Fecha Solicitud
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Motivo
                </th>
                {(onView || onEdit || onDelete || onRestore) && (
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedMovements.map((movement) => (
                <tr
                  key={movement.id}
                  className="group hover:bg-slate-50 transition-all duration-200 bg-white"
                >
                  <td className="px-6 py-5">
                    <div className="font-semibold text-slate-900 text-sm">
                      {movement.movementNumber}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      ID: {movement.id.slice(-8)}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-medium text-slate-800">
                      {loadingAssetNames ? (
                        <span className="text-slate-400">Cargando...</span>
                      ) : movement.assetId ? (
                        <span title={assetNames[movement.assetId] || movement.assetId}>
                          {assetNames[movement.assetId] || movement.assetId}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Sin activo</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm text-slate-800">
                      {MovementTypeLabels[movement.movementType] || movement.movementType}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDateOnly(movement.requestDate)}
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    {getStatusBadge(movement.movementStatus)}
                  </td>
                  <td className="px-6 py-5">
                    <div 
                      className="text-sm text-slate-800 truncate cursor-help" 
                      title={movement.reason || 'Sin motivo'}
                      style={{ maxWidth: '200px' }}
                    >
                      {movement.reason || 'Sin motivo'}
                    </div>
                  </td>
                  {(onView || onEdit || onDelete || onRestore) && (
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        {onView && (
                          <button
                            onClick={() => onView(movement)}
                            className="p-2.5 text-slate-600 hover:text-white hover:bg-slate-700 rounded-lg transition-all duration-200 border border-slate-200 hover:border-slate-700 hover:shadow-md"
                            title="Ver detalles"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        )}
                        
                        {(() => {
                          // Determinar si el movimiento está activo (misma lógica que en MovementsPage)
                          let isActive = true;
                          if (movement.active !== undefined) {
                            isActive = movement.active === true;
                          } else if (movement.deleted !== undefined) {
                            isActive = movement.deleted === false;
                          } else if (movement.deletedAt) {
                            isActive = false;
                          }
                          
                          // Si está inactivo, mostrar botón de restaurar (solo si onRestore existe)
                          if (!isActive && onRestore) {
                            return (
                              <button
                                onClick={() => onRestore(movement)}
                                className="p-2.5 text-green-600 hover:text-white hover:bg-green-600 rounded-lg transition-all duration-200 border border-green-200 hover:border-green-600 hover:shadow-md"
                                title="Restaurar"
                              >
                                <ArrowUturnLeftIcon className="h-4 w-4" />
                              </button>
                            );
                          }
                          
                          // Si está activo, mostrar botón de editar (solo si el estado lo permite y onEdit existe)
                          if (onEdit && (movement.movementStatus === 'REQUESTED' || movement.movementStatus === 'APPROVED')) {
                            return (
                              <button
                                onClick={() => onEdit(movement)}
                                className="p-2.5 text-green-600 hover:text-white hover:bg-green-600 rounded-lg transition-all duration-200 border border-green-200 hover:border-green-600 hover:shadow-md"
                                title="Editar"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                            );
                          }
                          
                          return null;
                        })()}
                        
                        {(() => {
                          // Determinar si el movimiento está activo (misma lógica que en MovementsPage)
                          let isActive = true;
                          if (movement.active !== undefined) {
                            isActive = movement.active === true;
                          } else if (movement.deleted !== undefined) {
                            isActive = movement.deleted === false;
                          } else if (movement.deletedAt) {
                            isActive = false;
                          }
                          
                          // Solo mostrar botón de eliminar si está activo y onDelete existe
                          return isActive && onDelete && (
                            <button
                              onClick={() => onDelete(movement)}
                              className="p-2.5 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-600 hover:shadow-md"
                              title="Eliminar"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          );
                        })()}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginador */}
      {totalItems > 0 && (
        <Paginator
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      )}
    </div>
  );
}


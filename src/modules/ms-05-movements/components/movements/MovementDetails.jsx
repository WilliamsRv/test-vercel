import { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  ArrowPathIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  InformationCircleIcon,
  EyeIcon,
  PaperClipIcon,
  ArrowDownTrayIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import assetMovementService from '../../services/assetMovementService';
import { 
  MovementStatusConfig, 
  MovementTypeLabels, 
  formatDate,
  formatDateOnly,
  canTransitionTo,
  getAvailableActions,
  calculateDuration,
  getMovementStartDate,
  getMovementEndDate
} from '../../types/movementTypes';
import userService from '../../../ms-02-authentication/services/userService';
import personService from '../../../ms-02-authentication/services/personService';
import authService from '../../../ms-02-authentication/services/auth.service';
import { getAllAreas } from '../../../ms-03-configuration/services/areasApi';
import { getAllPhysicalLocations } from '../../../ms-03-configuration/services/physicalLocationApi';
import { getBienPatrimonialById } from '../../../ms-04-patrimonio/services/api';
import { parseAttachedDocuments, downloadMovementDocument } from '../../services/movementDocumentService';
import MovementsList from './MovementsList';
import Swal from 'sweetalert2';

export default function MovementDetails({
  movementId,
  municipalityId,
  onClose,
  onEdit,
  onApprove,
  onReject,
  onMarkInProcess,
  onComplete,
  onCancel
}) {
  const [movement, setMovement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Estados para almacenar los datos relacionados
  const [persons, setPersons] = useState({});
  const [users, setUsers] = useState({});
  const [areas, setAreas] = useState({});
  const [locations, setLocations] = useState({});
  const [assetName, setAssetName] = useState(null);
  const [loadingRelatedData, setLoadingRelatedData] = useState(false);
  
  // Estados para el historial de movimientos del activo
  const [showAssetHistory, setShowAssetHistory] = useState(false);
  const [assetMovements, setAssetMovements] = useState([]);
  const [loadingAssetMovements, setLoadingAssetMovements] = useState(false);
  
  // Estado para documentos adjuntos
  const [attachedDocuments, setAttachedDocuments] = useState([]);

  useEffect(() => {
    loadMovement();
  }, [movementId, municipalityId]);

  const loadMovement = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await assetMovementService.getMovementById(movementId, municipalityId);
      if (data) {
        setMovement(data);
        // Parsear documentos adjuntos
        console.log('📄 Movement data received:', data);
        console.log('📄 attachedDocuments raw:', data.attachedDocuments);
        console.log('📄 attachedDocuments type:', typeof data.attachedDocuments);
        
        if (data.attachedDocuments) {
          const parsedDocs = parseAttachedDocuments(data.attachedDocuments);
          console.log('📄 Parsed documents:', parsedDocs);
          console.log('📄 Number of documents:', parsedDocs.length);
          setAttachedDocuments(parsedDocs);
        } else {
          console.log('📄 No attachedDocuments found in movement data');
          setAttachedDocuments([]);
        }
        // Cargar datos relacionados después de cargar el movimiento
        await loadRelatedData(data);
      } else {
        setError('Movimiento no encontrado');
      }
    } catch (err) {
      setError('Error al cargar el movimiento');
      console.error('Error loading movement:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedData = async (movementData) => {
    try {
      setLoadingRelatedData(true);
      const personsMap = {};
      const usersMap = {};
      const areasMap = {};
      const locationsMap = {};

      // Cargar responsables (personas)
      const responsibleIds = [
        movementData.originResponsibleId,
        movementData.destinationResponsibleId
      ].filter(Boolean);

      for (const personId of responsibleIds) {
        if (!personsMap[personId]) {
          try {
            const person = await personService.getPersonById(personId);
            if (person) {
              const fullName = `${person.firstName || ''} ${person.middleName || ''} ${person.lastName || ''}`.trim();
              personsMap[personId] = fullName || personId;
            }
          } catch (err) {
            console.warn(`Error loading person ${personId}:`, err);
            personsMap[personId] = personId; // Fallback al ID si falla
          }
        }
      }

      // Cargar usuarios
      const userIds = [
        movementData.requestingUser,
        movementData.executingUser,
        movementData.approvedBy
      ].filter(Boolean);

      for (const userId of userIds) {
        if (!usersMap[userId]) {
          try {
            const user = await userService.getUserById(userId);
            if (user) {
              // Intentar obtener el nombre de la persona asociada
              if (user.personId) {
                try {
                  const person = await personService.getPersonById(user.personId);
                  if (person) {
                    const fullName = `${person.firstName || ''} ${person.middleName || ''} ${person.lastName || ''}`.trim();
                    usersMap[userId] = fullName || user.username || userId;
                  } else {
                    usersMap[userId] = user.username || userId;
                  }
                } catch (err) {
                  usersMap[userId] = user.username || userId;
                }
              } else {
                usersMap[userId] = user.username || userId;
              }
            }
          } catch (err) {
            console.warn(`Error loading user ${userId}:`, err);
            usersMap[userId] = userId; // Fallback al ID si falla
          }
        }
      }

      // Cargar áreas
      try {
        const allAreas = await getAllAreas();
        const areaIds = [
          movementData.originAreaId,
          movementData.destinationAreaId
        ].filter(Boolean);

        for (const areaId of areaIds) {
          const area = allAreas.find(a => a.id === areaId);
          if (area) {
            areasMap[areaId] = area.name || area.areaCode || areaId;
          } else {
            areasMap[areaId] = areaId;
          }
        }
      } catch (err) {
        console.warn('Error loading areas:', err);
      }

      // Cargar ubicaciones físicas
      try {
        const allLocations = await getAllPhysicalLocations();
        const locationIds = [
          movementData.originLocationId,
          movementData.destinationLocationId
        ].filter(Boolean);

        for (const locationId of locationIds) {
          const location = allLocations.find(l => l.id === locationId);
          if (location) {
            locationsMap[locationId] = location.name || location.locationCode || locationId;
          } else {
            locationsMap[locationId] = locationId;
          }
        }
      } catch (err) {
        console.warn('Error loading locations:', err);
      }

      // Cargar nombre del activo
      if (movementData.assetId) {
        try {
          const asset = await getBienPatrimonialById(movementData.assetId);
          if (asset) {
            // Usar descripción como nombre principal, si no está disponible usar código patrimonial
            const name = asset.description || asset.descripcion || asset.assetCode || asset.codigoPatrimonial || movementData.assetId;
            setAssetName(name);
          } else {
            setAssetName(movementData.assetId);
          }
        } catch (err) {
          console.warn(`Error loading asset ${movementData.assetId}:`, err);
          setAssetName(movementData.assetId); // Fallback al ID si falla
        }
      }

      setPersons(personsMap);
      setUsers(usersMap);
      setAreas(areasMap);
      setLocations(locationsMap);
    } catch (err) {
      console.error('Error loading related data:', err);
    } finally {
      setLoadingRelatedData(false);
    }
  };

  const handleAction = async (actionFn, ...args) => {
    try {
      setActionLoading(true);
      await actionFn(...args);
      await loadMovement(); // Recargar después de la acción
      // No mostrar alert aquí, los botones manejan sus propios mensajes
    } catch (err) {
      console.error('Error executing action:', err);
      // Re-lanzar el error para que los botones lo manejen
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const loadAssetHistory = async (assetId) => {
    if (!assetId) return;
    
    try {
      setLoadingAssetMovements(true);
      const movements = await assetMovementService.getMovementsByAsset(assetId, municipalityId);
      const movementsArray = Array.isArray(movements) ? movements : [];
      setAssetMovements(movementsArray);
      
      // Cargar datos relacionados para el historial (áreas, ubicaciones, personas)
      if (movementsArray.length > 0) {
        await loadRelatedDataForHistory(movementsArray);
      }
      
      setShowAssetHistory(true);
    } catch (err) {
      console.error('Error loading asset history:', err);
      alert('Error al cargar el historial de movimientos del activo');
    } finally {
      setLoadingAssetMovements(false);
    }
  };

  const loadRelatedDataForHistory = async (movementsData) => {
    try {
      const personsMap = { ...persons };
      const areasMap = { ...areas };
      const locationsMap = { ...locations };

      // Recopilar todos los IDs únicos
      const responsibleIds = new Set();
      const areaIds = new Set();
      const locationIds = new Set();

      movementsData.forEach(mov => {
        if (mov.originResponsibleId) responsibleIds.add(mov.originResponsibleId);
        if (mov.destinationResponsibleId) responsibleIds.add(mov.destinationResponsibleId);
        if (mov.originAreaId) areaIds.add(mov.originAreaId);
        if (mov.destinationAreaId) areaIds.add(mov.destinationAreaId);
        if (mov.originLocationId) locationIds.add(mov.originLocationId);
        if (mov.destinationLocationId) locationIds.add(mov.destinationLocationId);
      });

      // Cargar responsables
      for (const personId of responsibleIds) {
        if (!personsMap[personId]) {
          try {
            const person = await personService.getPersonById(personId);
            if (person) {
              const fullName = `${person.firstName || ''} ${person.middleName || ''} ${person.lastName || ''}`.trim();
              personsMap[personId] = fullName || personId;
            }
          } catch (err) {
            console.warn(`Error loading person ${personId}:`, err);
            personsMap[personId] = personId;
          }
        }
      }

      // Cargar áreas
      try {
        const allAreas = await getAllAreas();
        for (const areaId of areaIds) {
          if (!areasMap[areaId]) {
            const area = allAreas.find(a => a.id === areaId);
            if (area) {
              areasMap[areaId] = area.name || area.areaCode || areaId;
            } else {
              areasMap[areaId] = areaId;
            }
          }
        }
      } catch (err) {
        console.warn('Error loading areas:', err);
      }

      // Cargar ubicaciones
      try {
        const allLocations = await getAllPhysicalLocations();
        for (const locationId of locationIds) {
          if (!locationsMap[locationId]) {
            const location = allLocations.find(l => l.id === locationId);
            if (location) {
              locationsMap[locationId] = location.name || location.locationCode || locationId;
            } else {
              locationsMap[locationId] = locationId;
            }
          }
        }
      } catch (err) {
        console.warn('Error loading locations:', err);
      }

      // Actualizar estados
      setPersons(personsMap);
      setAreas(areasMap);
      setLocations(locationsMap);
    } catch (err) {
      console.error('Error loading related data for history:', err);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-white rounded-lg p-8 shadow-xl border border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Cargando movimiento...</p>
        </div>
      </div>
    );
  }

  if (error || !movement) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-white rounded-lg p-8 max-w-md shadow-xl border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
              <XCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Error</h3>
          </div>
          <p className="text-gray-600 mb-6">{error || 'Movimiento no encontrado'}</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-md font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = MovementStatusConfig[movement.movementStatus] || MovementStatusConfig.REQUESTED;
  const availableActions = getAvailableActions(movement.movementStatus);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header sobrio */}
        <div className="sticky top-0 bg-slate-800 px-6 py-4 flex justify-between items-center border-b border-slate-700 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-500 rounded-md flex items-center justify-center">
              <ArrowPathIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Detalles del Movimiento</h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-slate-300">{movement.movementNumber}</p>
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border border-teal-200 bg-teal-50 text-teal-700">
                  <CheckCircleIcon className="w-3 h-3 mr-1 text-teal-500" />
                  Activo
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white hover:bg-slate-700 rounded-md p-1.5 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Contenedor con scroll */}
        <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
          <div className="p-6 space-y-6">
            {/* Estado y Acciones */}
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Estado del Movimiento</label>
                  <span className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-semibold border ${statusConfig.color} bg-white`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${statusConfig.bgColor} mr-2.5`}></div>
                    {statusConfig.label}
                  </span>
                </div>
                {(availableActions.length > 0) && (
                  <div className="flex flex-wrap gap-2">
                    {availableActions.includes('approve') && onApprove && (
                      <button
                        onClick={async () => {
                          try {
                            // Obtener usuario actual logueado de manera robusta
                            const currentUser = authService.getCurrentUser();
                            let currentUserId = null;
                            
                            // Intentar obtener userId del objeto de usuario
                            if (currentUser) {
                              currentUserId = currentUser.userId || currentUser.id;
                              console.log('👤 Usuario obtenido de authService:', currentUser);
                              console.log('🆔 UserId extraído:', currentUserId);
                            }
                            
                            // Si no se encontró, intentar del localStorage directamente
                            if (!currentUserId) {
                              try {
                                const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
                                currentUserId = storedUser?.userId || storedUser?.id;
                                console.log('👤 Usuario obtenido de localStorage:', storedUser);
                                console.log('🆔 UserId extraído:', currentUserId);
                              } catch (e) {
                                console.error('Error al leer localStorage:', e);
                              }
                            }
                            
                            // Si aún no se encontró, intentar del JWT token
                            if (!currentUserId) {
                              try {
                                const token = localStorage.getItem('accessToken');
                                if (token) {
                                  const payload = JSON.parse(atob(token.split('.')[1]));
                                  currentUserId = payload.sub || payload.userId || payload.id;
                                  console.log('👤 Usuario obtenido del JWT:', payload);
                                  console.log('🆔 UserId extraído:', currentUserId);
                                }
                              } catch (e) {
                                console.error('Error al decodificar JWT:', e);
                              }
                            }

                            if (!currentUserId) {
                              console.error('❌ No se pudo obtener el ID del usuario');
                              Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'No se pudo obtener el usuario actual. Por favor, inicie sesión nuevamente.',
                              });
                              return;
                            }

                            console.log('✅ UserId final para aprobación:', currentUserId);
                            console.log('📋 Datos de aprobación:', {
                              movementId: movement.id,
                              municipalityId: municipalityId,
                              approvedBy: currentUserId
                            });

                            // Confirmar aprobación
                            const result = await Swal.fire({
                              title: '¿Aprobar movimiento?',
                              html: `
                                <div class="text-center">
                                  <p class="text-slate-600 mb-4">¿Está seguro de que desea aprobar este movimiento?</p>
                                  <p class="text-sm text-slate-500">Movimiento: <strong>${movement.movementNumber || movement.id.slice(-8)}</strong></p>
                                </div>
                              `,
                              icon: 'question',
                              showCancelButton: true,
                              confirmButtonColor: '#10b981',
                              cancelButtonColor: '#64748b',
                              confirmButtonText: 'Sí, aprobar',
                              cancelButtonText: 'Cancelar',
                              reverseButtons: true,
                            });

                            if (result.isConfirmed) {
                              await handleAction(onApprove, movement.id, currentUserId);
                              Swal.fire({
                                icon: 'success',
                                title: '¡Aprobado!',
                                text: 'El movimiento ha sido aprobado exitosamente.',
                                timer: 2000,
                                timerProgressBar: true,
                              });
                            }
                          } catch (error) {
                            console.error('❌ Error approving movement:', error);
                            Swal.fire({
                              icon: 'error',
                              title: 'Error al aprobar',
                              text: error.message || 'No se pudo aprobar el movimiento. Por favor, intente nuevamente.',
                            });
                          }
                        }}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Aprobar
                      </button>
                    )}
                    {availableActions.includes('reject') && onReject && (
                      <button
                        onClick={async () => {
                          try {
                            // Obtener usuario actual logueado de manera robusta
                            const currentUser = authService.getCurrentUser();
                            let currentUserId = null;
                            
                            // Intentar obtener userId del objeto de usuario
                            if (currentUser) {
                              currentUserId = currentUser.userId || currentUser.id;
                            }
                            
                            // Si no se encontró, intentar del localStorage directamente
                            if (!currentUserId) {
                              try {
                                const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
                                currentUserId = storedUser?.userId || storedUser?.id;
                              } catch (e) {
                                console.error('Error al leer localStorage:', e);
                              }
                            }
                            
                            // Si aún no se encontró, intentar del JWT token
                            if (!currentUserId) {
                              try {
                                const token = localStorage.getItem('accessToken');
                                if (token) {
                                  const payload = JSON.parse(atob(token.split('.')[1]));
                                  currentUserId = payload.sub || payload.userId || payload.id;
                                }
                              } catch (e) {
                                console.error('Error al decodificar JWT:', e);
                              }
                            }

                            if (!currentUserId) {
                              Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'No se pudo obtener el usuario actual. Por favor, inicie sesión nuevamente.',
                              });
                              return;
                            }

                            // Solicitar motivo del rechazo
                            const { value: rejectionReason } = await Swal.fire({
                              title: 'Rechazar movimiento',
                              html: `
                                <div class="text-left">
                                  <p class="text-slate-600 mb-4">¿Está seguro de que desea rechazar este movimiento?</p>
                                  <p class="text-sm text-slate-500 mb-3">Movimiento: <strong>${movement.movementNumber || movement.id.slice(-8)}</strong></p>
                                  <label class="block text-sm font-medium text-gray-700 mb-2">Motivo del rechazo (opcional):</label>
                                  <textarea 
                                    id="rejection-reason" 
                                    class="swal2-textarea w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    placeholder="Ingrese el motivo del rechazo..."
                                    rows="3"
                                  ></textarea>
                                </div>
                              `,
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonColor: '#ef4444',
                              cancelButtonColor: '#64748b',
                              confirmButtonText: 'Sí, rechazar',
                              cancelButtonText: 'Cancelar',
                              reverseButtons: true,
                              preConfirm: () => {
                                const reason = document.getElementById('rejection-reason')?.value || '';
                                return reason;
                              }
                            });

                            if (rejectionReason !== undefined) {
                              await handleAction(onReject, movement.id, currentUserId, rejectionReason || null);
                              Swal.fire({
                                icon: 'success',
                                title: '¡Rechazado!',
                                text: 'El movimiento ha sido rechazado exitosamente.',
                                timer: 2000,
                                timerProgressBar: true,
                              });
                            }
                          } catch (error) {
                            console.error('Error rejecting movement:', error);
                            Swal.fire({
                              icon: 'error',
                              title: 'Error al rechazar',
                              text: error.message || 'No se pudo rechazar el movimiento. Por favor, intente nuevamente.',
                            });
                          }
                        }}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Rechazar
                      </button>
                    )}
                    {availableActions.includes('in-process') && onMarkInProcess && (
                      <button
                        onClick={() => {
                          const executingUser = prompt('Ingrese el ID del usuario ejecutor:');
                          if (executingUser) {
                            handleAction(onMarkInProcess, movement.id, executingUser);
                          }
                        }}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Marcar en Proceso
                      </button>
                    )}
                    {availableActions.includes('complete') && onComplete && (
                      <button
                        onClick={() => handleAction(onComplete, movement.id)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Completar
                      </button>
                    )}
                    {availableActions.includes('cancel') && onCancel && (
                      <button
                        onClick={() => {
                          const reason = prompt('Motivo de cancelación (opcional):');
                          handleAction(onCancel, movement.id, reason);
                        }}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Información Básica */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span>Información Básica</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-md border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Número de Movimiento</label>
                  <p className="text-gray-900 font-semibold text-base">{movement.movementNumber}</p>
                </div>
                <div className="bg-white p-4 rounded-md border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tipo de Movimiento</label>
                  <p className="text-gray-900 text-base">{MovementTypeLabels[movement.movementType] || movement.movementType}</p>
                </div>
                {movement.movementSubtype && (
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Subtipo</label>
                    <p className="text-gray-900 text-base">{movement.movementSubtype}</p>
                  </div>
                )}
                <div className="bg-white p-4 rounded-md border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">ID del Activo</label>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-gray-900 text-sm flex-1">
                      {loadingRelatedData ? (
                        <span className="text-gray-400">Cargando...</span>
                      ) : (
                        assetName || movement.assetId
                      )}
                    </p>
                    {movement.assetId && (
                      <button
                        onClick={() => loadAssetHistory(movement.assetId)}
                        disabled={loadingAssetMovements}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-blue-200"
                        title="Ver historial de movimientos del activo"
                      >
                        <ClockIcon className="h-4 w-4 text-blue-500" />
                        <span>Historial</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Fechas */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                  <CalendarIcon className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <span>Fechas del Movimiento</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-md border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Fecha de Solicitud</label>
                  <p className="text-gray-900 text-base">{formatDate(movement.requestDate)}</p>
                </div>
                {movement.approvalDate && (
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Fecha de Aprobación</label>
                    <p className="text-gray-900 text-base">{formatDate(movement.approvalDate)}</p>
                  </div>
                )}
                {movement.executionDate && (
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Fecha de Ejecución</label>
                    <p className="text-gray-900 text-base">{formatDate(movement.executionDate)}</p>
                  </div>
                )}
                {movement.receptionDate && (
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Fecha de Recepción</label>
                    <p className="text-gray-900 text-base">{formatDate(movement.receptionDate)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Responsables y Usuarios */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center">
                  <UserIcon className="h-3.5 w-3.5 text-purple-600" />
                </div>
                <span>Responsables y Usuarios</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {movement.originResponsibleId && (
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Responsable Origen</label>
                    <p className="text-gray-900 text-sm">
                      {loadingRelatedData ? (
                        <span className="text-gray-400">Cargando...</span>
                      ) : (
                        persons[movement.originResponsibleId] || movement.originResponsibleId
                      )}
                    </p>
                  </div>
                )}
                {movement.destinationResponsibleId && (
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Responsable Destino</label>
                    <p className="text-gray-900 text-sm">
                      {loadingRelatedData ? (
                        <span className="text-gray-400">Cargando...</span>
                      ) : (
                        persons[movement.destinationResponsibleId] || movement.destinationResponsibleId
                      )}
                    </p>
                  </div>
                )}
                <div className="bg-white p-4 rounded-md border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Usuario Solicitante</label>
                  <p className="text-gray-900 text-sm">
                    {loadingRelatedData ? (
                      <span className="text-gray-400">Cargando...</span>
                    ) : (
                      users[movement.requestingUser] || movement.requestingUser
                    )}
                  </p>
                </div>
                {movement.executingUser && (
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Usuario Ejecutor</label>
                    <p className="text-gray-900 text-sm">
                      {loadingRelatedData ? (
                        <span className="text-gray-400">Cargando...</span>
                      ) : (
                        users[movement.executingUser] || movement.executingUser
                      )}
                    </p>
                  </div>
                )}
                {movement.approvedBy && (
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Aprobado Por</label>
                    <p className="text-gray-900 text-sm">
                      {loadingRelatedData ? (
                        <span className="text-gray-400">Cargando...</span>
                      ) : (
                        users[movement.approvedBy] || movement.approvedBy
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Áreas y Ubicaciones */}
            {(movement.originAreaId || movement.destinationAreaId || movement.originLocationId || movement.destinationLocationId) && (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center">
                    <TagIcon className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <span>Áreas y Ubicaciones</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {movement.originAreaId && (
                    <div className="bg-white p-4 rounded-md border border-gray-200">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Área Origen</label>
                      <p className="text-gray-900 text-sm">
                        {loadingRelatedData ? (
                          <span className="text-gray-400">Cargando...</span>
                        ) : (
                          areas[movement.originAreaId] || movement.originAreaId
                        )}
                      </p>
                    </div>
                  )}
                  {movement.destinationAreaId && (
                    <div className="bg-white p-4 rounded-md border border-gray-200">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Área Destino</label>
                      <p className="text-gray-900 text-sm">
                        {loadingRelatedData ? (
                          <span className="text-gray-400">Cargando...</span>
                        ) : (
                          areas[movement.destinationAreaId] || movement.destinationAreaId
                        )}
                      </p>
                    </div>
                  )}
                  {movement.originLocationId && (
                    <div className="bg-white p-4 rounded-md border border-gray-200">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Ubicación Origen</label>
                      <p className="text-gray-900 text-sm">
                        {loadingRelatedData ? (
                          <span className="text-gray-400">Cargando...</span>
                        ) : (
                          locations[movement.originLocationId] || movement.originLocationId
                        )}
                      </p>
                    </div>
                  )}
                  {movement.destinationLocationId && (
                    <div className="bg-white p-4 rounded-md border border-gray-200">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Ubicación Destino</label>
                      <p className="text-gray-900 text-sm">
                        {loadingRelatedData ? (
                          <span className="text-gray-400">Cargando...</span>
                        ) : (
                          locations[movement.destinationLocationId] || movement.destinationLocationId
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Información Adicional */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                <div className="w-6 h-6 rounded bg-cyan-100 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <span>Información Adicional</span>
              </h3>
              <div className="space-y-4">
                {/* Motivo */}
                <div className="bg-white p-4 rounded-md border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Motivo</label>
                  <p className="text-gray-900 text-base leading-relaxed">{movement.reason}</p>
                </div>

                {/* Observaciones */}
                {movement.observations && (
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Observaciones</label>
                    <p className="text-gray-900 text-base leading-relaxed whitespace-pre-wrap">{movement.observations}</p>
                  </div>
                )}

                {/* Condiciones Especiales */}
                {movement.specialConditions && (
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Condiciones Especiales</label>
                    <p className="text-gray-900 text-base leading-relaxed whitespace-pre-wrap">{movement.specialConditions}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Documentos de Soporte */}
            {(movement.supportingDocumentNumber || movement.supportingDocumentType) && (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <div className="w-6 h-6 rounded bg-rose-100 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span>Documentos de Soporte</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {movement.supportingDocumentNumber && (
                    <div className="bg-white p-4 rounded-md border border-gray-200">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Número de Documento</label>
                      <p className="text-gray-900 text-base">{movement.supportingDocumentNumber}</p>
                    </div>
                  )}
                  {movement.supportingDocumentType && (
                    <div className="bg-white p-4 rounded-md border border-gray-200">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tipo de Documento</label>
                      <p className="text-gray-900 text-base">{movement.supportingDocumentType}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Documentos Adjuntos - Siempre mostrar si hay datos o si el campo existe */}
            {movement && (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <div className="w-6 h-6 rounded bg-indigo-100 flex items-center justify-center">
                    <PaperClipIcon className="h-3.5 w-3.5 text-indigo-600" />
                  </div>
                  <span>Documentos Adjuntos {attachedDocuments.length > 0 ? `(${attachedDocuments.length})` : ''}</span>
                </h3>
                {attachedDocuments.length === 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex items-start gap-3">
                      <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-blue-900">
                        No hay documentos adjuntos en este movimiento
                      </p>
                    </div>
                  </div>
                ) : (
                <div className="space-y-3">
                  {attachedDocuments.map((doc, index) => {
                    const isPDF = doc.fileType === 'application/pdf' || doc.fileName?.toLowerCase().endsWith('.pdf');
                    const fileSizeKB = doc.fileSize ? (doc.fileSize / 1024).toFixed(2) : null;
                    
                    return (
                      <div key={index} className="bg-white border border-gray-200 rounded-md p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                              isPDF ? 'bg-red-100' : 'bg-blue-100'
                            }`}>
                              {isPDF ? (
                                <DocumentIcon className={`h-5 w-5 ${isPDF ? 'text-red-600' : 'text-blue-600'}`} />
                              ) : (
                                <PaperClipIcon className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate" title={doc.fileName}>
                                {doc.fileName || `Documento ${index + 1}`}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                {fileSizeKB && (
                                  <span className="text-xs text-gray-500">
                                    {fileSizeKB} KB
                                  </span>
                                )}
                                {doc.fileType && (
                                  <span className="text-xs text-gray-500">
                                    {doc.fileType.split('/')[1]?.toUpperCase() || 'Archivo'}
                                  </span>
                                )}
                                {doc.uploadedAt && (
                                  <span className="text-xs text-gray-500">
                                    {formatDate(doc.uploadedAt)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isPDF && doc.fileUrl && (
                              <button
                                onClick={() => {
                                  window.open(doc.fileUrl, '_blank', 'noopener,noreferrer');
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center gap-1.5"
                                title="Ver PDF"
                              >
                                <EyeIcon className="h-4 w-4" />
                                Ver PDF
                              </button>
                            )}
                            {doc.fileUrl && (
                              <button
                                onClick={async () => {
                                  try {
                                    const result = await downloadMovementDocument(doc.fileUrl, doc.fileName);
                                    if (!result.success) {
                                      Swal.fire({
                                        icon: 'error',
                                        title: 'Error',
                                        text: result.error || 'No se pudo descargar el archivo',
                                        confirmButtonColor: '#dc2626'
                                      });
                                    }
                                  } catch (error) {
                                    console.error('Error al descargar archivo:', error);
                                    Swal.fire({
                                      icon: 'error',
                                      title: 'Error',
                                      text: 'No se pudo descargar el archivo',
                                      confirmButtonColor: '#dc2626'
                                    });
                                  }
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-1.5"
                                title="Descargar"
                              >
                                <ArrowDownTrayIcon className="h-4 w-4" />
                                Descargar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            )}

            {/* Configuración y Auditoría */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center">
                  <InformationCircleIcon className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <span>Configuración y Auditoría</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-md border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Requiere Aprobación</label>
                  <p className="text-gray-900">
                    {movement.requiresApproval ? (
                      <span className="inline-flex items-center text-green-600 font-medium">
                        <CheckCircleIcon className="h-4 w-4 mr-1.5 text-green-500" />
                        Sí
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-gray-600 font-medium">
                        <XCircleIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                        No
                      </span>
                    )}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-md border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Estado del Registro</label>
                  <p className="text-gray-900">
                    {movement.active !== false ? (
                      <span className="inline-flex items-center text-green-600 font-medium">
                        <CheckCircleIcon className="h-4 w-4 mr-1.5 text-green-500" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-red-600 font-medium">
                        <XCircleIcon className="h-4 w-4 mr-1.5 text-red-500" />
                        Inactivo
                      </span>
                    )}
                  </p>
                </div>
                {movement.createdAt && (
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Fecha de Creación</label>
                    <p className="text-gray-900 text-base">{formatDate(movement.createdAt)}</p>
                  </div>
                )}
                {movement.updatedAt && (
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Última Actualización</label>
                    <p className="text-gray-900 text-base">{formatDate(movement.updatedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Profesional */}
        <div className="px-6 py-4 bg-slate-50 border-t border-gray-200 flex-shrink-0">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Historial de Movimientos del Activo */}
      {showAssetHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="sticky top-0 bg-slate-800 px-6 py-4 flex justify-between items-center border-b border-slate-700 z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-500 rounded-md flex items-center justify-center">
                  <ClockIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Historial de Movimientos del Activo</h2>
                  <p className="text-xs text-slate-300 mt-0.5">{assetName || movement.assetId}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAssetHistory(false)}
                className="text-slate-300 hover:text-white hover:bg-slate-700 rounded-md p-1.5 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingAssetMovements ? (
                <div className="flex flex-col justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-transparent"></div>
                  <p className="mt-4 text-gray-700 font-medium">Cargando historial...</p>
                </div>
              ) : assetMovements.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <ClockIcon className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay movimientos registrados</h3>
                  <p className="text-gray-500">
                    Este activo no tiene movimientos registrados en el sistema.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Vista Timeline del Historial */}
                  <div className="space-y-4">
                    {(() => {
                      // Ordenar movimientos de más antiguo a más reciente para calcular correctamente las fechas
                      const sortedByDate = [...assetMovements].sort((a, b) => {
                        const dateA = new Date(a.requestDate || a.createdAt || 0);
                        const dateB = new Date(b.requestDate || b.createdAt || 0);
                        return dateA - dateB; // Más antiguo primero
                      });
                      
                      // Crear copia invertida para mostrar más reciente primero en la UI
                      const displayOrder = [...sortedByDate].reverse();
                      
                      return displayOrder.map((mov, displayIndex) => {
                        // Calcular el índice en el array ordenado cronológicamente
                        const chronologicalIndex = sortedByDate.findIndex(m => m.id === mov.id);
                        // El siguiente movimiento (más reciente) está en chronologicalIndex + 1
                        const nextMov = chronologicalIndex < sortedByDate.length - 1 ? sortedByDate[chronologicalIndex + 1] : null;
                        const startDate = getMovementStartDate(mov);
                        const endDate = getMovementEndDate(mov, nextMov);
                        const duration = calculateDuration(startDate, endDate);
                        const isActive = mov.movementStatus === 'COMPLETED' && !endDate;
                        const statusConfig = MovementStatusConfig[mov.movementStatus] || MovementStatusConfig.REQUESTED;
                        
                        return (
                          <div key={mov.id} className="relative pl-8 pb-6 border-l-2 border-gray-200 last:border-l-0 last:pb-0">
                            {/* Punto en la línea del tiempo */}
                            <div className={`absolute -left-2.5 top-0 w-5 h-5 rounded-full border-2 border-white ${isActive ? 'bg-green-500' : statusConfig.bgColor}`}></div>
                            
                            {/* Contenido del período */}
                            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.color}`}>
                                      {statusConfig.label}
                                    </span>
                                    <span className="text-sm font-medium text-gray-600">
                                      {MovementTypeLabels[mov.movementType] || mov.movementType}
                                    </span>
                                    <span className="text-xs text-gray-500">#{mov.movementNumber}</span>
                                  </div>
                                  
                                  {/* Información de ubicación y responsable */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                    {mov.destinationAreaId && (
                                      <div className="text-sm">
                                        <span className="text-gray-500">Área: </span>
                                        <span className="font-medium text-gray-900">{areas[mov.destinationAreaId] || mov.destinationAreaId}</span>
                                      </div>
                                    )}
                                    {mov.destinationLocationId && (
                                      <div className="text-sm">
                                        <span className="text-gray-500">Ubicación: </span>
                                        <span className="font-medium text-gray-900">{locations[mov.destinationLocationId] || mov.destinationLocationId}</span>
                                      </div>
                                    )}
                                    {mov.destinationResponsibleId && (
                                      <div className="text-sm">
                                        <span className="text-gray-500">Responsable: </span>
                                        <span className="font-medium text-gray-900">{persons[mov.destinationResponsibleId] || mov.destinationResponsibleId}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Fechas y duración */}
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                  <div>
                                    <span className="text-gray-500">Desde: </span>
                                    <span className="font-medium text-gray-900">
                                      {startDate ? formatDate(startDate) : 'N/A'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Hasta: </span>
                                    <span className={`font-medium ${isActive ? 'text-green-600' : 'text-gray-900'}`}>
                                      {endDate ? formatDate(endDate) : (isActive ? 'Actual' : 'N/A')}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Duración: </span>
                                    <span className="font-medium text-blue-600">
                                      {duration.description}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Motivo si existe */}
                              {mov.reason && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium text-gray-700">Motivo: </span>
                                    {mov.reason}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  
                  {/* Separador y lista completa (opcional) */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Lista Completa de Movimientos</h3>
                    <MovementsList
                      municipalityId={municipalityId}
                      movements={assetMovements}
                      loading={false}
                      error={null}
                      onView={null}
                      onEdit={null}
                      onDelete={null}
                      onRestore={null}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-gray-200 flex-shrink-0">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAssetHistory(false)}
                  className="px-5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


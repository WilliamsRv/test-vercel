import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import MaintenanceActionsModal from '../components/MaintenanceActionsModal';
import MaintenanceDetailModal from '../components/MaintenanceDetailModal';
import MaintenanceFormModal from '../components/MaintenanceFormModal';
import {
  MAINTENANCE_TYPE_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS
} from '../constants/maintenance.constants';
import useMaintenance from '../hooks/useMaintenance';
import assetService from '../services/assetService';

export default function MantenimientoPage() {
  const {
    maintenances,
    loading,
    error,
    fetchMaintenances,
    fetchMaintenancesByStatus,
    createMaintenance,
    updateMaintenance,
    startMaintenance,
    completeMaintenance,
    suspendMaintenance,
    cancelMaintenance,
    rescheduleMaintenance,
  } = useMaintenance();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('SCHEDULED');
  const [filterType, setFilterType] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [selectedMaintenanceForAction, setSelectedMaintenanceForAction] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [allMaintenances, setAllMaintenances] = useState([]);

  // Función para recargar todos los datos
  const reloadAllData = useCallback(async () => {
    try {
      const allData = await fetchMaintenances();
      setAllMaintenances(allData);
      await fetchMaintenancesByStatus(filterStatus);
    } catch (error) {
      console.error('Error reloading data:', error);
    }
  }, [fetchMaintenances, fetchMaintenancesByStatus, filterStatus]);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Cargar todos los mantenimientos para las estadísticas
        const allData = await fetchMaintenances();
        setAllMaintenances(allData);

        // Cargar mantenimientos filtrados por estado
        await fetchMaintenancesByStatus(filterStatus);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recargar cuando cambia el filtro de estado
  useEffect(() => {
    if (filterStatus) {
      fetchMaintenancesByStatus(filterStatus);
    }
  }, [filterStatus, fetchMaintenancesByStatus]);

  const filteredMaintenances = maintenances.filter(maintenance => {
    const matchSearch =
      maintenance.maintenanceCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maintenance.workDescription?.toLowerCase().includes(searchTerm.toLowerCase());
    // No filtramos por estado aquí porque ya viene filtrado del backend
    const matchType = filterType === 'ALL' || maintenance.maintenanceType === filterType;
    const matchPriority = filterPriority === 'ALL' || maintenance.priority === filterPriority;
    return matchSearch && matchType && matchPriority;
  });

  const getPriorityBadgeClass = (priority) => {
    const colors = {
      LOW: 'bg-green-600 text-white',
      MEDIUM: 'bg-yellow-500 text-white',
      HIGH: 'bg-orange-600 text-white',
      CRITICAL: 'bg-red-600 text-white',
    };
    return colors[priority] || 'bg-gray-500 text-white';
  };

  const getTypeBadgeClass = (type) => {
    const colors = {
      PREVENTIVE: 'bg-blue-600 text-white',
      CORRECTIVE: 'bg-purple-600 text-white',
      PREDICTIVE: 'bg-cyan-600 text-white',
    };
    return colors[type] || 'bg-gray-600 text-white';
  };

  const getStatusDotColor = (status) => {
    const colors = {
      SCHEDULED: 'bg-blue-500',
      IN_PROCESS: 'bg-yellow-500',
      COMPLETED: 'bg-green-500',
      CANCELLED: 'bg-red-500',
      SUSPENDED: 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const handleCreate = () => {
    setSelectedMaintenance(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleViewDetails = (maintenance) => {
    setSelectedMaintenance(maintenance);
    setIsDetailModalOpen(true);
  };

  const handleEdit = (maintenance) => {
    setSelectedMaintenance(maintenance);
    setIsEditing(true);
    setTimeout(() => {
      setIsModalOpen(true);
    }, 10);
  };

  const handleFormSubmit = async (maintenanceData) => {
    try {
      Swal.fire({
        title: isEditing ? 'Actualizando...' : 'Creando...',
        html: `
          <div class="text-center py-4">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mb-4"></div>
            <p class="text-slate-600">Por favor espera un momento</p>
          </div>
        `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        customClass: {
          popup: 'rounded-3xl shadow-2xl',
        },
      });

      if (isEditing) {
        await updateMaintenance(selectedMaintenance.id, maintenanceData);
      } else {
        await createMaintenance(maintenanceData);

        // Actualizar el estado del activo a "MAINTENANCE"
        try {
          await assetService.updateAssetStatus(
            maintenanceData.assetId,
            'MAINTENANCE',
            'Mantenimiento programado'
          );
          console.log('✅ Estado del activo actualizado a "MAINTENANCE"');
        } catch (assetError) {
          console.warn('⚠️ No se pudo actualizar el estado del activo:', assetError);
          // No bloqueamos el flujo si falla la actualización del activo
        }
      }

      await Swal.fire({
        title: '¡Éxito!',
        html: `
          <div class="text-center">
            <div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p class="text-slate-600">${isEditing ? 'Mantenimiento actualizado correctamente' : 'Mantenimiento creado correctamente'}</p>
          </div>
        `,
        icon: null,
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Continuar',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        customClass: {
          popup: 'rounded-3xl shadow-2xl border border-slate-100',
          title: 'text-2xl font-bold text-slate-900 mb-4',
        },
      });

      setIsModalOpen(false);
      setSelectedMaintenance(null);
      setIsEditing(false);
      reloadAllData();
    } catch (err) {
      Swal.fire({
        title: 'Error',
        html: `
          <div class="text-center">
            <div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-slate-600">${err.message || 'No se pudo completar la operación'}</p>
          </div>
        `,
        icon: null,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Cerrar',
        customClass: {
          popup: 'rounded-3xl shadow-2xl border border-slate-100',
          title: 'text-2xl font-bold text-slate-900 mb-4',
          confirmButton: 'rounded-xl px-6 py-2.5 font-medium shadow-sm',
        },
      });
      console.error('Error:', err);
    }
  };

  // Determinar acciones disponibles según el estado
  const getAvailableActions = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return ['start', 'suspend', 'cancel'];
      case 'IN_PROCESS':
        return ['complete', 'suspend', 'cancel'];
      case 'SUSPENDED':
        return ['reschedule', 'cancel'];
      case 'COMPLETED':
      case 'CANCELLED':
        return [];
      default:
        return [];
    }
  };

  // Configuración de acciones
  const actionConfig = {
    start: {
      label: 'Iniciar',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      ),
      color: 'blue',
    },
    complete: {
      label: 'Completar',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
      color: 'green',
    },
    suspend: {
      label: 'Suspender',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
      color: 'yellow',
    },
    reschedule: {
      label: 'Reprogramar',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      ),
      color: 'purple',
    },
    cancel: {
      label: 'Cancelar',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      ),
      color: 'red',
    },
  };

  const handleAction = (action, maintenance) => {
    setCurrentAction(action);
    setSelectedMaintenanceForAction(maintenance);
    setIsActionModalOpen(true);
    setOpenDropdownId(null);
  };

  const toggleDropdown = (maintenanceId) => {
    setOpenDropdownId(openDropdownId === maintenanceId ? null : maintenanceId);
  };

  const handleActionSubmit = async (formData) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    try {
      Swal.fire({
        title: 'Procesando...',
        html: `
          <div class="text-center py-4">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mb-4"></div>
            <p class="text-slate-600">Por favor espera un momento</p>
          </div>
        `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        customClass: {
          popup: 'rounded-3xl shadow-2xl',
        },
      });

      switch (currentAction) {
        case 'start':
          await startMaintenance(
            selectedMaintenanceForAction.id,
            user.userId,
            formData.observations || null
          );
          break;
        case 'complete':
          {
            const completeData = {
              workOrder: formData.workOrder,
              laborCost: parseFloat(formData.laborCost) || 0,
              partsCost: parseFloat(formData.partsCost) || 0,
              appliedSolution: formData.appliedSolution,
              observations: formData.observations || null,
              updatedBy: user.userId
            };

            // Agregar completionDocument si se proporciona la URL de la imagen
            if (formData.receiptImageUrl) {
              completeData.completionDocument = {
                fileUrl: formData.receiptImageUrl
              };
            }

            console.log('📤 Datos enviados al complete:', completeData);
            await completeMaintenance(selectedMaintenanceForAction.id, completeData);

            // Actualizar el estado del activo a "AVAILABLE"
            console.log('🔍 Mantenimiento seleccionado:', selectedMaintenanceForAction);
            console.log('🔍 Asset ID:', selectedMaintenanceForAction.assetId);

            if (selectedMaintenanceForAction.assetId) {
              try {
                console.log('📤 Actualizando estado del activo a AVAILABLE...');
                await assetService.updateAssetStatus(
                  selectedMaintenanceForAction.assetId,
                  'AVAILABLE',
                  'Mantenimiento completado'
                );
                console.log('✅ Estado del activo actualizado a "AVAILABLE"');
              } catch (assetError) {
                console.error('❌ Error al actualizar el estado del activo:', assetError);
              }
            } else {
              console.warn('⚠️ No se encontró assetId en el mantenimiento');
            }
            break;
          }
        case 'suspend':
          await suspendMaintenance(
            selectedMaintenanceForAction.id,
            formData.nextDate,
            formData.observations,
            user.userId
          );
          break;
        case 'reschedule':
          {
            const rescheduleData = {
              nextDate: formData.nextDate,
              updatedBy: user.userId
            };

            // Campos opcionales: solo agregar si se proporcionan
            if (formData.technicalResponsibleId) {
              rescheduleData.technicalResponsibleId = formData.technicalResponsibleId;
            }
            if (formData.serviceSupplierId) {
              rescheduleData.serviceSupplierId = formData.serviceSupplierId;
            }
            if (formData.observations) {
              rescheduleData.observations = formData.observations;
            }

            console.log('📤 Datos enviados al reschedule:', rescheduleData);
            await rescheduleMaintenance(selectedMaintenanceForAction.id, rescheduleData);
            break;
          }
        case 'cancel':
          await cancelMaintenance(
            selectedMaintenanceForAction.id,
            formData.observations,
            user.userId
          );

          // Actualizar el estado del activo a "AVAILABLE"
          console.log('🔍 Mantenimiento seleccionado:', selectedMaintenanceForAction);
          console.log('🔍 Asset ID:', selectedMaintenanceForAction.assetId);

          if (selectedMaintenanceForAction.assetId) {
            try {
              console.log('📤 Actualizando estado del activo a AVAILABLE...');
              await assetService.updateAssetStatus(
                selectedMaintenanceForAction.assetId,
                'AVAILABLE',
                'Mantenimiento cancelado'
              );
              console.log('✅ Estado del activo actualizado a "AVAILABLE"');
            } catch (assetError) {
              console.error('❌ Error al actualizar el estado del activo:', assetError);
            }
          } else {
            console.warn('⚠️ No se encontró assetId en el mantenimiento');
          }
          break;
      }

      await Swal.fire({
        title: '¡Éxito!',
        html: `
          <div class="text-center">
            <div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p class="text-slate-600">Operación completada correctamente</p>
          </div>
        `,
        icon: null,
        confirmButtonColor: '#10b981',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        customClass: {
          popup: 'rounded-3xl shadow-2xl border border-slate-100',
          title: 'text-2xl font-bold text-slate-900 mb-4',
        },
      });

      setIsActionModalOpen(false);
      setCurrentAction(null);
      setSelectedMaintenanceForAction(null);
      reloadAllData();
    } catch (err) {
      Swal.fire({
        title: 'Error',
        html: `
          <div class="text-center">
            <div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-slate-600">${err.message || 'No se pudo completar la operación'}</p>
          </div>
        `,
        icon: null,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Cerrar',
        customClass: {
          popup: 'rounded-3xl shadow-2xl border border-slate-100',
          title: 'text-2xl font-bold text-slate-900 mb-4',
          confirmButton: 'rounded-xl px-6 py-2.5 font-medium shadow-sm',
        },
      });
      console.error('Error:', err);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMaintenance(null);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      {/* Header - Orange con diseño redondeado */}
      <div className="bg-orange-600 shadow-lg mb-8 rounded-2xl">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Gestión de Mantenimientos
                </h1>
                <p className="text-orange-100 text-sm font-medium">
                  Control y seguimiento de mantenimientos
                </p>
              </div>
            </div>

            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-transparent border-2 border-white/70 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-200 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nuevo Mantenimiento
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">

        {/* Estadísticas Cards */}
        {allMaintenances.length > 0 && (
          <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Mantenimientos */}
              <div className="bg-white border-l-4 border-l-orange-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total</p>
                    <p className="text-3xl font-bold text-slate-800">{allMaintenances.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-orange-50 text-orange-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Programados */}
              <div className="bg-white border-l-4 border-l-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Programados</p>
                    <p className="text-3xl font-bold text-slate-800">{allMaintenances.filter(m => m.maintenanceStatus === 'SCHEDULED').length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* En Proceso */}
              <div className="bg-white border-l-4 border-l-yellow-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">En Proceso</p>
                    <p className="text-3xl font-bold text-slate-800">{allMaintenances.filter(m => m.maintenanceStatus === 'IN_PROGRESS').length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-yellow-50 text-yellow-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Completados */}
              <div className="bg-white border-l-4 border-l-green-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Completados</p>
                    <p className="text-3xl font-bold text-slate-800">{allMaintenances.filter(m => m.maintenanceStatus === 'COMPLETED').length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-green-50 text-green-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl shadow-sm flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium text-sm">{error}</p>
          </div>
        )}

        {/* Filtros y Búsqueda */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                Buscar
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Código o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {[
              {
                label: 'Estado', value: filterStatus, onChange: setFilterStatus, options: [
                  { value: 'SCHEDULED', label: 'Programados' },
                  { value: 'IN_PROGRESS', label: 'En Proceso' },
                  { value: 'COMPLETED', label: 'Completados' },
                  { value: 'CANCELLED', label: 'Cancelados' },
                  { value: 'SUSPENDED', label: 'Suspendidos' }
                ]
              },
              {
                label: 'Tipo', value: filterType, onChange: setFilterType, options: [
                  { value: 'ALL', label: 'Todos' },
                  { value: 'PREVENTIVE', label: 'Preventivo' },
                  { value: 'CORRECTIVE', label: 'Correctivo' },
                  { value: 'PREDICTIVE', label: 'Predictivo' }
                ]
              },
              {
                label: 'Prioridad', value: filterPriority, onChange: setFilterPriority, options: [
                  { value: 'ALL', label: 'Todas' },
                  { value: 'LOW', label: 'Baja' },
                  { value: 'MEDIUM', label: 'Media' },
                  { value: 'HIGH', label: 'Alta' },
                  { value: 'CRITICAL', label: 'Crítica' }
                ]
              }
            ].map((filter, idx) => (
              <div key={idx}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                  {filter.label}
                </label>
                <div className="relative">
                  <select
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                  >
                    {filter.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabla / Lista */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto min-h-[280px]">
            <table className="w-full">
              <thead>
                <tr className="bg-orange-600 border-b border-orange-700">
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Código</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Descripción</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Prioridad</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredMaintenances.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <p className="text-lg font-medium text-gray-900 mb-1">No hay mantenimientos</p>
                        <p className="text-gray-500 text-sm">Intenta ajustar los filtros de búsqueda</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMaintenances.map((maintenance, index) => (
                    <tr
                      key={maintenance.id}
                      className="hover:bg-gray-50/80 transition-colors duration-200 group border-l-4 border-l-orange-500"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${getStatusDotColor(maintenance.maintenanceStatus)}`}></div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{maintenance.maintenanceCode}</p>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">{STATUS_LABELS[maintenance.maintenanceStatus]}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 line-clamp-2 max-w-xs font-medium">
                          {maintenance.workDescription || 'Sin descripción'}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getTypeBadgeClass(maintenance.maintenanceType)}`}>
                          {MAINTENANCE_TYPE_LABELS[maintenance.maintenanceType]}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getPriorityBadgeClass(maintenance.priority)}`}>
                          {PRIORITY_LABELS[maintenance.priority]}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700">
                            {new Date(maintenance.scheduledDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(maintenance.scheduledDate).getFullYear()}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewDetails(maintenance)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Ver detalles"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {maintenance.maintenanceStatus === 'SCHEDULED' && (
                            <button
                              onClick={() => handleEdit(maintenance)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Editar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}

                          <div className="relative">
                            <button
                              onClick={() => toggleDropdown(maintenance.id)}
                              className={`p-2 rounded-lg transition-all ${openDropdownId === maintenance.id
                                ? 'text-orange-600 bg-orange-50'
                                : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                                }`}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>

                            {openDropdownId === maintenance.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenDropdownId(null)}
                                ></div>
                                <div className={`absolute right-0 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden py-1 animate-fadeIn ${(index < 2 || filteredMaintenances.length <= 3) ? 'top-full mt-2' : 'bottom-full mb-2'}`}>
                                  {getAvailableActions(maintenance.maintenanceStatus).length > 0 ? (
                                    getAvailableActions(maintenance.maintenanceStatus).map((actionKey) => {
                                      const config = actionConfig[actionKey];
                                      return (
                                        <button
                                          key={actionKey}
                                          onClick={() => handleAction(actionKey, maintenance)}
                                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2 transition-colors"
                                        >
                                          <span className={`text-${config.color}-500`}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              {config.icon}
                                            </svg>
                                          </span>
                                          {config.label}
                                        </button>
                                      );
                                    })
                                  ) : (
                                    <div className="px-4 py-3 text-xs text-gray-400 text-center italic">
                                      No hay acciones disponibles
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modales */}
      <MaintenanceFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
        maintenance={selectedMaintenance}
        isEditing={isEditing}
        existingMaintenances={allMaintenances}
      />

      <MaintenanceDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        maintenance={selectedMaintenance}
      />

      <MaintenanceActionsModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        onSubmit={handleActionSubmit}
        action={currentAction}
        maintenance={selectedMaintenanceForAction}
        existingMaintenances={allMaintenances}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  getAllDisposals,
  getDisposalsByStatus,
  finalizeDisposal,
  cancelDisposal,
  DISPOSAL_STATUS,
  DISPOSAL_TYPES,
} from '../../services/disposalService';
import CreateDisposalModal from '../../components/disposals/CreateDisposalModal';
import AddAssetsToDisposalModal from '../../components/disposals/AddAssetsToDisposalModal';
import StartEvaluationModal from '../../components/disposals/StartEvaluationModal';
import TechnicalOpinionModal from '../../components/disposals/TechnicalOpinionModal';
import ResolveDisposalModal from '../../components/disposals/ResolveDisposalModal';
import { useAuth } from '../../../ms-02-authentication/hooks/useAuth';

/**
 * Página de gestión de expedientes de baja
 * 
 * FLUJO SIMPLIFICADO:
 * 1. Crear Expediente (con technicalReportAuthorId)
 * 2. Agregar Bienes
 * 3. Iniciar Evaluación (solo confirma - sin comité)
 * 4. [Opcional] Agregar Opinión Técnica
 * 5. Aprobar/Rechazar (Admin. Finanzas)
 * 6. Finalizar Baja Física
 */
export default function DisposalManagementPage() {
  const { user } = useAuth();
  const [disposals, setDisposals] = useState([]);
  const [filteredDisposals, setFilteredDisposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sorting
  const [sortField, setSortField] = useState('fileNumber');
  const [sortDirection, setSortDirection] = useState('asc');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddAssetsModal, setShowAddAssetsModal] = useState(false);
  const [showStartEvaluationModal, setShowStartEvaluationModal] = useState(false);
  const [showTechnicalOpinionModal, setShowTechnicalOpinionModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedDisposal, setSelectedDisposal] = useState(null);

  useEffect(() => {
    loadDisposals();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [disposals, statusFilter, typeFilter, searchTerm, sortField, sortDirection]);

  const loadDisposals = async () => {
    try {
      setLoading(true);
      const data = await getAllDisposals();
      setDisposals(data);
    } catch (err) {
      setError('Error al cargar los expedientes');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...disposals];

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(d => d.fileStatus === statusFilter);
    }

    // Filter by type
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(d => d.disposalType === typeFilter);
    }

    // Filter by search term - búsqueda global en todos los campos
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(d => {
        const fileNumber = d.fileNumber?.toLowerCase() || '';
        const reason = d.disposalReason?.toLowerCase() || '';
        const status = getStatusBadge(d.fileStatus).props.children?.toLowerCase() || '';
        const type = getTypeBadge(d.disposalType).props.children?.toLowerCase() || '';
        const date = d.createdAt ? new Date(d.createdAt).toLocaleDateString('es-ES') : '';
        
        return fileNumber.includes(search) ||
               reason.includes(search) ||
               status.includes(search) ||
               type.includes(search) ||
               date.includes(search);
      });
    }

    // Ordenar por campo seleccionado
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'fileNumber':
          aValue = a.fileNumber || '';
          bValue = b.fileNumber || '';
          break;
        case 'disposalType':
          aValue = a.disposalType || '';
          bValue = b.disposalType || '';
          break;
        case 'fileStatus':
          aValue = a.fileStatus || '';
          bValue = b.fileStatus || '';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        default:
          aValue = a[sortField] || '';
          bValue = b[sortField] || '';
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredDisposals(filtered);
  };

  const handleCreateDisposal = () => {
    setShowCreateModal(true);
  };

  const handleAddAssets = (disposal) => {
    setSelectedDisposal(disposal);
    setShowAddAssetsModal(true);
  };

  const handleStartEvaluation = (disposal) => {
    setSelectedDisposal(disposal);
    setShowStartEvaluationModal(true);
  };

  const handleAddOpinion = (disposal) => {
    setSelectedDisposal(disposal);
    setShowTechnicalOpinionModal(true);
  };

  const handleResolve = (disposal) => {
    setSelectedDisposal(disposal);
    setShowResolveModal(true);
  };

  const handleFinalize = async (disposal) => {
    if (!confirm('¿Está seguro de finalizar este expediente? Esta acción actualizará el estado de los bienes a BAJA.')) {
      return;
    }

    try {
      await finalizeDisposal(disposal.id);
      loadDisposals();
    } catch (err) {
      alert('Error al finalizar el expediente: ' + err.message);
    }
  };

  const handleCancel = async (disposal) => {
    console.log(user.userId)

    try {
      await cancelDisposal(disposal.id, user.userId);
      
      console.log('Expediente cancelado:', disposal.id, localStorage.getItem('user.userId'));
      loadDisposals();
    } catch (err) {
      alert('Error al cancelar el expediente: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      INITIATED: { label: 'Iniciado', color: 'bg-blue-100 text-blue-800' },
      UNDER_EVALUATION: { label: 'En Evaluación', color: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { label: 'Aprobado', color: 'bg-green-100 text-green-800' },
      REJECTED: { label: 'Rechazado', color: 'bg-red-100 text-red-800' },
      EXECUTED: { label: 'Ejecutado', color: 'bg-purple-100 text-purple-800' },
      CANCELLED: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      OBSOLESCENCE: { label: 'Obsolescencia', icon: '📦' },
      DETERIORATION: { label: 'Deterioro', icon: '🔧' },
      LOSS: { label: 'Pérdida', icon: '❌' },
      THEFT: { label: 'Robo', icon: '🚨' },
      OTHER: { label: 'Otro', icon: '📝' },
    };

    const config = typeConfig[type] || { label: type, icon: '📄' };
    
    return (
      <span className="text-sm text-slate-600">
        {config.icon} {config.label}
      </span>
    );
  };

  const getRelevantDate = (disposal) => {
    // Retornar la fecha más relevante según el estado
    switch (disposal.fileStatus) {
      case 'INITIATED':
        return { date: disposal.createdAt, label: 'Creado' };
      case 'UNDER_EVALUATION':
        return { date: disposal.technicalEvaluationDate, label: 'En Evaluación' };
      case 'APPROVED':
        return { date: disposal.approvalDate, label: 'Aprobado' };
      case 'REJECTED':
        return { date: disposal.approvalDate, label: 'Rechazado' };
      case 'EXECUTED':
        return { date: disposal.physicalRemovalDate, label: 'Ejecutado' };
      case 'CANCELLED':
        return { date: disposal.updatedAt, label: 'Cancelado' };
      default:
        return { date: disposal.createdAt, label: 'Creado' };
    }
  };

  const getActionButtons = (disposal) => {
    const actions = [];

    switch (disposal.fileStatus) {
      case 'INITIATED':
        actions.push(
          <button
            key="add-assets"
            onClick={() => handleAddAssets(disposal)}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
            title="Agregar bienes al expediente de baja"
          >
            📦 Agregar Bienes
          </button>,
          <button
            key="start-evaluation"
            onClick={() => handleStartEvaluation(disposal)}
            className="px-3 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
            title="Iniciar evaluación técnica del expediente"
          >
            📊 Iniciar Evaluación
          </button>
        );
        break;

      case 'UNDER_EVALUATION':
        actions.push(
          <button
            key="add-opinion"
            onClick={() => handleAddOpinion(disposal)}
            className="px-3 py-1.5 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
            title="Agregar opinión técnica sobre los bienes"
          >
            📋 Opinión Técnica
          </button>,
          <button
            key="resolve"
            onClick={() => handleResolve(disposal)}
            className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
            title="Aprobar o rechazar el expediente (solo Admin. Finanzas)"
          >
            ⚖️ Aprobar/Rechazar
          </button>
        );
        break;

      case 'APPROVED':
        actions.push(
          <button
            key="finalize"
            onClick={() => handleFinalize(disposal)}
            className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
          >
            🏁 Finalizar
          </button>
        );
        break;

      case 'EXECUTED':
      case 'REJECTED':
      case 'CANCELLED':
        // No hay acciones disponibles para estos estados
        break;
    }

    // Botones comunes
    if (disposal.fileStatus !== 'EXECUTED') {
      actions.push(
        <button
          key="cancel"
          onClick={() => handleCancel(disposal)}
          className="px-3 py-1.5 text-xs font-semibold bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
        >
          🚫 Cancelar
        </button>
      );
    }

    return actions;
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const getStatistics = () => {
    return {
      total: disposals.length,
      initiated: disposals.filter(d => d.fileStatus === 'INITIATED').length,
      underEvaluation: disposals.filter(d => d.fileStatus === 'UNDER_EVALUATION').length,
      approved: disposals.filter(d => d.fileStatus === 'APPROVED').length,
      executed: disposals.filter(d => d.fileStatus === 'EXECUTED').length,
    };
  };

  const stats = getStatistics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      {/* Header - Slate 800 Profesional */}
      <div className="bg-slate-800 shadow-lg mb-8 rounded-2xl">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Gestión de Bajas de Bienes Patrimoniales
                </h1>
                <p className="text-slate-200 text-sm font-medium">
                  Administre los expedientes de baja de bienes patrimoniales
                </p>
              </div>
            </div>
            <button
              onClick={handleCreateDisposal}
              className="flex items-center gap-2 px-5 py-2.5 bg-transparent border-2 border-white/70 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-200 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nuevo Expediente
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas Profesionales */}
      <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white border-l-4 border-l-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total</p>
                <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-100 text-slate-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white border-l-4 border-l-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Iniciados</p>
                <p className="text-3xl font-bold text-slate-800">{stats.initiated}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white border-l-4 border-l-yellow-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">En Evaluación</p>
                <p className="text-3xl font-bold text-slate-800">{stats.underEvaluation}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-yellow-50 text-yellow-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white border-l-4 border-l-green-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Aprobados</p>
                <p className="text-3xl font-bold text-slate-800">{stats.approved}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-green-50 text-green-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white border-l-4 border-l-purple-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Ejecutados</p>
                <p className="text-3xl font-bold text-slate-800">{stats.executed}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-purple-50 text-purple-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros Modernos */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Buscar
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cualquier campo..."
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 placeholder-gray-400 focus:ring-2 focus:ring-slate-500/20 transition-all text-sm font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Estado
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-slate-500/20 transition-all text-sm"
              >
                <option value="ALL">Todos</option>
                {DISPOSAL_STATUS.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Tipo
            </label>
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-slate-500/20 transition-all text-sm"
              >
                <option value="ALL">Todos</option>
                {DISPOSAL_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Profesional */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-500">
            Cargando expedientes...
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadDisposals}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        ) : filteredDisposals.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mb-6 mx-auto">
              <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-xl font-semibold text-slate-700 mb-2">No se encontraron expedientes</p>
            <p className="text-slate-500">Intenta con otros filtros o crea un nuevo expediente</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th 
                    onClick={() => handleSort('fileNumber')}
                    className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>Expediente</span>
                      {getSortIcon('fileNumber')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('disposalType')}
                    className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>Tipo</span>
                      {getSortIcon('disposalType')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('fileStatus')}
                    className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>Estado</span>
                      {getSortIcon('fileStatus')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('createdAt')}
                    className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>Fecha</span>
                      {getSortIcon('createdAt')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDisposals.map(disposal => (
                  <tr key={disposal.id} className="group hover:bg-slate-50 transition-all duration-200 border-l-4 border-l-slate-800 hover:border-l-slate-700 bg-white">
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {disposal.fileNumber}
                        </p>
                        <p className="text-sm text-slate-600 line-clamp-1">
                          {disposal.disposalReason}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {getTypeBadge(disposal.disposalType)}
                    </td>
                    <td className="px-6 py-5">
                      {getStatusBadge(disposal.fileStatus)}
                    </td>
                    <td className="px-6 py-5">
                      {(() => {
                        const { date, label } = getRelevantDate(disposal);
                        return date ? (
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {new Date(date).toLocaleDateString('es-ES')}
                            </p>
                            <p className="text-xs text-slate-500">{label}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2 flex-wrap">
                        {getActionButtons(disposal)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateDisposalModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          loadDisposals();
          setShowCreateModal(false);
        }}
      />

      {selectedDisposal && (
        <>
          <AddAssetsToDisposalModal
            isOpen={showAddAssetsModal}
            onClose={() => {
              setShowAddAssetsModal(false);
              setSelectedDisposal(null);
            }}
            onSuccess={() => {
              loadDisposals();
              setShowAddAssetsModal(false);
              setSelectedDisposal(null);
            }}
            disposal={selectedDisposal}
          />

          <StartEvaluationModal
            isOpen={showStartEvaluationModal}
            onClose={() => {
              setShowStartEvaluationModal(false);
              setSelectedDisposal(null);
            }}
            onSuccess={() => {
              loadDisposals();
              setShowStartEvaluationModal(false);
              setSelectedDisposal(null);
            }}
            disposal={selectedDisposal}
          />

          <TechnicalOpinionModal
            isOpen={showTechnicalOpinionModal}
            onClose={() => {
              setShowTechnicalOpinionModal(false);
              setSelectedDisposal(null);
            }}
            onSuccess={() => {
              loadDisposals();
              setShowTechnicalOpinionModal(false);
              setSelectedDisposal(null);
            }}
            disposal={selectedDisposal}
            currentUserId={user?.id}
          />

          <ResolveDisposalModal
            isOpen={showResolveModal}
            onClose={() => {
              setShowResolveModal(false);
              setSelectedDisposal(null);
            }}
            onSuccess={() => {
              loadDisposals();
              setShowResolveModal(false);
              setSelectedDisposal(null);
            }}
            disposal={selectedDisposal}
          />
        </>
      )}
    </div>
  );
}

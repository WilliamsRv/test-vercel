import React, { useState, useEffect } from 'react';
import { getProveedores, getProveedoresInactivos, deleteProveedor, restaurarProveedor } from '../../services/api';
import SupplierModal from './SupplierModal';
import SupplierDetailModal from './SupplierDetailModal';
import Paginator from '../../../../shared/utils/Paginator';

export default function SuppliersModule() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('TODOS');
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Estados para modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Cargar proveedores
  useEffect(() => {
    loadProveedores();
  }, []);

  const loadProveedores = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar todos los proveedores (activos e inactivos)
      const [activos, inactivos] = await Promise.all([
        getProveedores(),
        getProveedoresInactivos()
      ]);
      
      const todosProveedores = [...activos, ...inactivos];
      setProveedores(todosProveedores || []);
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
      setError('Error al cargar los proveedores: ' + err.message);
      setProveedores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const motivo = prompt('¿Por qué desea dar de baja este proveedor? (opcional)');
    if (motivo !== null) {
      try {
        await deleteProveedor(id);
        // Recargar la lista inmediatamente
        await loadProveedores();
        console.log('Proveedor eliminado correctamente');
      } catch (err) {
        console.error('Error al dar de baja:', err);
        alert('Error al dar de baja el proveedor: ' + err.message);
      }
    }
  };

  const handleRestore = async (id) => {
    const motivo = prompt('¿Por qué desea restaurar este proveedor? (opcional)');
    if (motivo !== null) {
      try {
        await restaurarProveedor(id);
        // Recargar la lista inmediatamente
        await loadProveedores();
        console.log('Proveedor restaurado correctamente');
      } catch (err) {
        console.error('Error al restaurar:', err);
        alert('Error al restaurar el proveedor: ' + err.message);
      }
    }
  };

  // Abrir modal para crear
  const handleCreate = () => {
    setSelectedProveedor(null);
    setIsEditing(false);
    setIsFormModalOpen(true);
  };

  // Abrir modal para editar
  const handleEdit = (proveedor) => {
    setSelectedProveedor(proveedor);
    setIsEditing(true);
    setIsFormModalOpen(true);
  };

  // Abrir modal de detalles
  const handleViewDetail = (proveedor) => {
    setSelectedProveedor(proveedor);
    setIsDetailModalOpen(true);
  };

  // Cerrar modales
  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setSelectedProveedor(null);
    setIsEditing(false);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedProveedor(null);
  };

  // Callback después de guardar
  const handleFormSuccess = () => {
    loadProveedores();
    closeFormModal();
    if (isDetailModalOpen) {
      closeDetailModal();
    }
  };

  // Filtrado de proveedores
  const filteredProveedores = proveedores.filter((proveedor) => {
    const matchSearch =
      proveedor.numeroDocumento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.legalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.tradeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchEstado = filterEstado === 'TODOS' || 
      (filterEstado === 'ACTIVOS' && proveedor.active) ||
      (filterEstado === 'INACTIVOS' && !proveedor.active);

    return matchSearch && matchEstado;
  });

  // Calcular paginación
  const totalItems = filteredProveedores.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProveedores = filteredProveedores.slice(startIndex, endIndex);

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterEstado]);

  // Handlers para paginación
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll al inicio de la tabla
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(1); // Resetear a la primera página
  };

  // Badge de estado
  const getEstadoBadge = (active) => {
    return active 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  // Badge de calificación (1-5)
  const getQualificationBadge = (qualification) => {
    if (qualification >= 4) return 'bg-green-100 text-green-800';
    if (qualification >= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderBottomColor: '#283447' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      {/* Header - Color Personalizado */}
      <div className="shadow-lg mb-8 rounded-2xl" style={{ backgroundColor: '#283447' }}>
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Gestión de Proveedores
                </h1>
                <p className="text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Administración y control de proveedores institucionales
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-5 py-2.5 bg-transparent border-2 border-white/70 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-200 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nuevo Proveedor
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas Profesionales */}
      {proveedores.length > 0 && (
        <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Proveedores */}
            <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300" style={{ borderLeft: '4px solid #283447' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Proveedores</p>
                  <p className="text-3xl font-bold text-slate-800">{proveedores.length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(40, 52, 71, 0.1)', color: '#283447' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Activos */}
            <div className="bg-white border-l-4 border-l-green-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Activos</p>
                  <p className="text-3xl font-bold text-slate-800">{proveedores.filter((p) => p.active).length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-green-50 text-green-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Inactivos */}
            <div className="bg-white border-l-4 border-l-red-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Inactivos</p>
                  <p className="text-3xl font-bold text-slate-800">{proveedores.filter((p) => !p.active).length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-red-50 text-red-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Proveedores del Estado */}
            <div className="bg-white border-l-4 border-l-purple-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Del Estado</p>
                  <p className="text-3xl font-bold text-slate-800">{proveedores.filter((p) => p.isStateProvider).length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-purple-50 text-purple-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
          <p className="font-medium">{error}</p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
            className="mt-2 text-sm underline hover:text-red-900"
          >
            Limpiar sesión y volver a login
          </button>
        </div>
      )}

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Buscar
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 transition-colors" style={{ color: '#283447' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  onMouseEnter={(e) => e.target.style.color = '#283447'}
                  onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="RUC, razón social, nombre comercial o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 placeholder-gray-400 transition-all text-sm font-medium"
                style={{ '--tw-ring-color': 'rgba(40, 52, 71, 0.2)' }}
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px rgba(40, 52, 71, 0.2)'}
                onBlur={(e) => e.target.style.boxShadow = ''}
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

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Estado
            </label>
            <div className="relative">
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer transition-all text-sm"
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px rgba(40, 52, 71, 0.2)'}
                onBlur={(e) => e.target.style.boxShadow = ''}
              >
                <option value="TODOS">Todos</option>
                <option value="ACTIVOS">Activos</option>
                <option value="INACTIVOS">Inactivos</option>
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: '#283447' }}>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  RUC/Documento
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Razón Social
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Nombre Comercial
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Calificación
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {totalItems === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mb-6">
                        <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="1" y="3" width="15" height="13" />
                          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                          <circle cx="5.5" cy="18.5" r="2.5" />
                          <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                      </div>
                      <p className="text-xl font-semibold text-slate-700 mb-2">No se encontraron proveedores</p>
                      <p className="text-slate-500">Intenta con otros filtros o agrega un nuevo proveedor</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProveedores.map((proveedor) => (
                  <tr
                    key={proveedor.id}
                    className="group hover:bg-slate-50 transition-all duration-200 bg-white"
                  >
                    {/* RUC/Documento */}
                    <td className="px-6 py-5">
                      <div className="font-semibold text-slate-900 text-sm font-mono">
                        {proveedor.numeroDocumento}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        ID: {proveedor.id?.substring(0, 8)}...
                      </div>
                    </td>

                    {/* Razón Social */}
                    <td className="px-6 py-5">
                      <div className="text-sm font-medium text-slate-800 max-w-xs truncate">
                        {proveedor.legalName}
                      </div>
                      {proveedor.isStateProvider && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mt-1.5 bg-gray-100">
                          <svg className="w-4 h-4" style={{ color: '#2563EB' }} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                          </svg>
                          <span className="text-xs font-medium" style={{ color: '#1e40af' }}>Proveedor del Estado</span>
                        </div>
                      )}
                    </td>

                    {/* Nombre Comercial */}
                    <td className="px-6 py-5">
                      <div className="text-sm text-slate-700">
                        {proveedor.tradeName || '-'}
                      </div>
                    </td>

                    {/* Contacto */}
                    <td className="px-6 py-5">
                      <div className="text-sm font-medium text-slate-800">
                        {proveedor.mainContact || '-'}
                      </div>
                      {proveedor.email && (
                        <div className="text-xs text-slate-500 mt-0.5">{proveedor.email}</div>
                      )}
                    </td>

                    {/* Calificación */}
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${getQualificationBadge(
                          proveedor.qualification
                        )}`}
                      >
                        {proveedor.qualification}/5
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-5">
                      <span 
                        className="text-xs font-medium px-3 py-1.5 rounded-full inline-block"
                        style={proveedor.active 
                          ? { backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#15803d' }
                          : { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#dc2626' }
                        }
                      >
                        {proveedor.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        {/* Ver Detalles */}
                        <button
                          onClick={() => handleViewDetail(proveedor)}
                          className="p-2.5 text-slate-600 hover:text-white hover:bg-slate-700 rounded-lg transition-all duration-200 border border-slate-200 hover:border-slate-700 hover:shadow-md"
                          title="Ver detalles"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        {proveedor.active ? (
                          <>
                            {/* Editar */}
                            <button
                              onClick={() => handleEdit(proveedor)}
                              className="p-2.5 text-green-600 hover:text-white hover:bg-green-600 rounded-lg transition-all duration-200 border border-green-200 hover:border-green-600 hover:shadow-md"
                              title="Editar proveedor"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>

                            {/* Eliminar */}
                            <button
                              onClick={() => handleDelete(proveedor.id)}
                              className="p-2.5 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-600 hover:shadow-md"
                              title="Dar de baja"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          /* Restaurar para inactivos */
                          <button
                            onClick={() => handleRestore(proveedor.id)}
                            className="p-2.5 text-green-600 hover:text-white hover:bg-green-600 rounded-lg transition-all duration-200 border border-green-200 hover:border-green-600 hover:shadow-md"
                            title="Restaurar proveedor"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación Profesional */}
        {totalItems > 0 && (
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-t border-gray-200">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              {/* Información de registros */}
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">
                    {startIndex + 1} - {Math.min(endIndex, totalItems)}
                  </span>
                  <span>de</span>
                  <span className="font-semibold text-slate-900">{totalItems}</span>
                  <span>registros</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 ml-4">
                  <label className="text-slate-600 font-medium">Mostrar:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-slate-900 font-medium text-sm bg-white"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {/* Controles de paginación */}
              <div className="flex items-center gap-2">
                {/* Botón Primera Página */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-all duration-200 ${currentPage === 1
                    ? "text-slate-300 cursor-not-allowed"
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  title="Primera página"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>

                {/* Botón Anterior */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-all duration-200 ${currentPage === 1
                    ? "text-slate-300 cursor-not-allowed"
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  title="Página anterior"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Números de página */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Mostrar siempre la primera página, última página, página actual y páginas adyacentes
                      if (page === 1 || page === totalPages) return true;
                      if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                      return false;
                    })
                    .map((page, index, array) => {
                      // Agregar puntos suspensivos si hay saltos
                      const prevPage = array[index - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;

                      return (
                        <div key={page} className="flex items-center gap-1">
                          {showEllipsis && (
                            <span className="px-2 text-slate-400">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`min-w-[40px] h-10 px-3 rounded-lg font-semibold transition-all duration-200 ${currentPage === page
                              ? "text-white shadow-md"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              }`}
                            style={currentPage === page ? { backgroundColor: '#283447' } : {}}
                          >
                            {page}
                          </button>
                        </div>
                      );
                    })}
                </div>

                {/* Botón Siguiente */}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-all duration-200 ${currentPage === totalPages
                    ? "text-slate-300 cursor-not-allowed"
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  title="Página siguiente"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Botón Última Página */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-all duration-200 ${currentPage === totalPages
                    ? "text-slate-300 cursor-not-allowed"
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  title="Última página"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Modales */}
      <SupplierModal
        key={`form-${selectedProveedor?.id || 'new'}-${isEditing}`}
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        onSuccess={handleFormSuccess}
        proveedor={isEditing ? selectedProveedor : null}
      />

      <SupplierDetailModal
        key={`detail-${selectedProveedor?.id || 'view'}`}
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        proveedor={selectedProveedor}
        onEdit={handleEdit}
      />
    </div>
  );
}

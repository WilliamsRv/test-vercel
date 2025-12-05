import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useAuth } from "../../ms-02-authentication/hooks/useAuth";
import InventoryList from "../components/InventoryList";
import InventoryFormModal from "../components/InventoryFormModal";
import InventoryDetailModal from "../components/InventoryDetailModal";
import {
  getAllInventories,
  createInventory,
  updateInventory,
  deleteInventory,
  startInventory,
  completeInventory
} from "../services/inventoryApi";

// URLs de las APIs
const CONFIG_API_URL = 'http://localhost:5004'; // API de Configuración
const AUTH_API_URL = 'http://localhost:5002';   // API de Autenticación

export default function InventarioModule() {
  const { user } = useAuth();
  const [inventories, setInventories] = useState([]);
  const [areas, setAreas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [editingInventory, setEditingInventory] = useState(null);
  const [statusFilter, setStatusFilter] = useState("PLANNED");

  // Obtener el ID del usuario autenticado
  const currentUserId = user?.id || user?.userId;

  useEffect(() => {
    loadInventories();
    loadConfigurationData();
  }, []);

  const loadInventories = async () => {
    try {
      setLoading(true);
      const data = await getAllInventories();
      console.log('📥 Inventarios recibidos del backend:', data);
      console.log('📊 Primer inventario (ejemplo):', data[0]);
      
      // Extraer IDs de usuarios que crearon inventarios (estos SÍ existen en el backend de inventarios)
      const creatorIds = [...new Set(data.map(inv => inv.createdBy).filter(Boolean))];
      console.log('👤 IDs de usuarios que crearon inventarios (existen en backend):', creatorIds);
      
      setInventories(data);
    } catch (error) {
      console.error('Error al cargar inventarios:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los inventarios',
        confirmButtonColor: '#4f46e5'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadConfigurationData = async () => {
    try {
      // Cargar Áreas
      try {
        console.log('🔄 Cargando áreas desde:', `${CONFIG_API_URL}/api/v1/areas`);
        const areasResponse = await fetch(`${CONFIG_API_URL}/api/v1/areas`);
        console.log('📡 Áreas response status:', areasResponse.status);
        if (areasResponse.ok) {
          const areasData = await areasResponse.json();
          console.log('📦 Áreas data:', areasData);
          const activeAreas = Array.isArray(areasData) ? areasData.filter(area => area.active !== false) : [];
          setAreas(activeAreas);
          console.log('✅ Áreas cargadas:', activeAreas.length);
        } else {
          const errorText = await areasResponse.text();
          console.error('❌ Error al cargar áreas:', errorText);
          setAreas([]); // Establecer array vacío en caso de error
        }
      } catch (err) {
        console.error('❌ Error de conexión al cargar áreas:', err);
        setAreas([]); // Establecer array vacío en caso de error
      }

      // Cargar Categorías
      console.log('🔄 Cargando categorías desde:', `${CONFIG_API_URL}/api/v1/categories-assets`);
      const categoriesResponse = await fetch(`${CONFIG_API_URL}/api/v1/categories-assets`);
      console.log('📡 Categorías response status:', categoriesResponse.status);
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        console.log('📦 Categorías data:', categoriesData);
        const activeCategories = Array.isArray(categoriesData) ? categoriesData.filter(cat => cat.active !== false) : [];
        setCategories(activeCategories);
        console.log('✅ Categorías cargadas:', activeCategories.length);
      } else {
        console.error('❌ Error al cargar categorías:', await categoriesResponse.text());
      }

      // Cargar Ubicaciones
      console.log('🔄 Cargando ubicaciones desde:', `${CONFIG_API_URL}/api/v1/physical-locations`);
      const locationsResponse = await fetch(`${CONFIG_API_URL}/api/v1/physical-locations`);
      console.log('📡 Ubicaciones response status:', locationsResponse.status);
      if (locationsResponse.ok) {
        const locationsData = await locationsResponse.json();
        console.log('📦 Ubicaciones data:', locationsData);
        const activeLocations = Array.isArray(locationsData) ? locationsData.filter(loc => loc.active !== false) : [];
        setLocations(activeLocations);
        console.log('✅ Ubicaciones cargadas:', activeLocations.length);
      } else {
        console.error('❌ Error al cargar ubicaciones:', await locationsResponse.text());
      }

      // Cargar Usuarios desde el puerto 5002 con autenticación
      try {
        // Obtener el token del localStorage
        const token = localStorage.getItem('accessToken');
        
        console.log('🔄 Cargando usuarios desde:', `${AUTH_API_URL}/api/v1/users`);
        console.log('🔑 Token encontrado:', token ? 'Sí ✅' : 'No ❌');
        
        const headers = {
          'Content-Type': 'application/json'
        };
        
        // Agregar token si existe
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const usersResponse = await fetch(`${AUTH_API_URL}/api/v1/users`, { headers });
        console.log('📡 Usuarios response status:', usersResponse.status);
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          console.log('📦 Usuarios data completa:', usersData);
          console.log('📦 Primer usuario:', usersData[0]);
          console.log('🔍 IDs de usuarios disponibles:', usersData.map(u => u.id));
          
          const activeUsers = Array.isArray(usersData) ? usersData.filter(user => user.active !== false) : [];
          setUsers(activeUsers);
          console.log('✅ Usuarios cargados:', activeUsers.length);
        } else if (usersResponse.status === 401) {
          console.warn('⚠️ No autorizado para cargar usuarios. Usando lista vacía.');
          setUsers([]);
        } else {
          console.error('❌ Error al cargar usuarios:', await usersResponse.text());
          setUsers([]);
        }
      } catch (err) {
        console.error('❌ Error al cargar usuarios:', err);
        setUsers([]);
      }
    } catch (error) {
      console.error('❌ Error general al cargar datos de configuración:', error);
    }
  };

  const handleCreateNew = () => {
    setEditingInventory(null);
    setIsFormOpen(true);
  };

  const handleEdit = (inventory) => {
    setEditingInventory(inventory);
    setIsFormOpen(true);
  };

  const handleView = (inventory) => {
    setSelectedInventory(inventory);
    setIsDetailOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      Swal.fire({
        title: 'Guardando...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      if (editingInventory) {
        await updateInventory(editingInventory.id, formData);
        Swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: 'Inventario actualizado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        await createInventory(formData);
        Swal.fire({
          icon: 'success',
          title: 'Creado',
          text: 'Inventario creado correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      }

      setIsFormOpen(false);
      setEditingInventory(null);
      loadInventories();
    } catch (error) {
      console.error('Error al guardar inventario:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo guardar el inventario',
        confirmButtonColor: '#4f46e5'
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      if (!currentUserId) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo identificar el usuario actual',
          confirmButtonColor: '#4f46e5'
        });
        return;
      }

      console.log('🗑️ Eliminando con userId:', currentUserId);
      console.log('👥 Usuarios disponibles:', users.map(u => ({ id: u.id, nombre: u.nombre || u.name || u.username })));

      Swal.fire({
        title: 'Eliminando...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      await deleteInventory(id, currentUserId);
      
      Swal.fire({
        icon: 'success',
        title: 'Eliminado',
        text: 'Inventario eliminado correctamente',
        timer: 2000,
        showConfirmButton: false
      });

      loadInventories();
    } catch (error) {
      console.error('Error al eliminar inventario:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo eliminar el inventario',
        confirmButtonColor: '#4f46e5'
      });
    }
  };

  const handleStart = async (id) => {
    try {
      console.log('🚀 Iniciando inventario:', id);
      
      Swal.fire({
        title: 'Iniciando inventario...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const result = await startInventory(id, currentUserId);
      console.log('✅ Inventario iniciado, respuesta:', result);
      
      Swal.fire({
        icon: 'success',
        title: 'Iniciado',
        text: 'Inventario iniciado correctamente',
        timer: 1500,
        showConfirmButton: false
      });

      // Recargar la lista después de un breve delay
      setTimeout(() => {
        loadInventories();
      }, 1600);
    } catch (error) {
      console.error('❌ Error al iniciar inventario:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo iniciar el inventario',
        confirmButtonColor: '#4f46e5'
      });
    }
  };

  const handleComplete = async (id) => {
    try {
      console.log('✔️ Completando inventario:', id);
      
      Swal.fire({
        title: 'Completando inventario...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const result = await completeInventory(id, currentUserId);
      console.log('✅ Inventario completado, respuesta:', result);
      
      Swal.fire({
        icon: 'success',
        title: 'Completado',
        text: 'Inventario completado correctamente',
        timer: 1500,
        showConfirmButton: false
      });

      // Recargar la lista después de un breve delay
      setTimeout(() => {
        loadInventories();
      }, 1600);
    } catch (error) {
      console.error('❌ Error al completar inventario:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo completar el inventario',
        confirmButtonColor: '#4f46e5'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando inventarios...</p>
        </div>
      </div>
    );
  }

  const countByStatus = {
    todos: inventories.length,
    PLANNED: inventories.filter(inv => {
      const status = inv?.status || inv?.inventoryStatus;
      let normalized = String(status || '').toUpperCase().trim().replace(/\s+/g, '_');
      if (normalized === 'IN_PROCESS') normalized = 'IN_PROGRESS';
      return normalized === 'PLANNED';
    }).length,
    IN_PROGRESS: inventories.filter(inv => {
      const status = inv?.status || inv?.inventoryStatus;
      let normalized = String(status || '').toUpperCase().trim().replace(/\s+/g, '_');
      if (normalized === 'IN_PROCESS') normalized = 'IN_PROGRESS';
      return normalized === 'IN_PROGRESS';
    }).length,
    COMPLETED: inventories.filter(inv => {
      const status = inv?.status || inv?.inventoryStatus;
      let normalized = String(status || '').toUpperCase().trim().replace(/\s+/g, '_');
      if (normalized === 'IN_PROCESS') normalized = 'IN_PROGRESS';
      return normalized === 'COMPLETED';
    }).length,
    CANCELLED: inventories.filter(inv => {
      const status = inv?.status || inv?.inventoryStatus;
      let normalized = String(status || '').toUpperCase().trim().replace(/\s+/g, '_');
      if (normalized === 'IN_PROCESS') normalized = 'IN_PROGRESS';
      return normalized === 'CANCELLED';
    }).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      {/* Header - Turquesa */}
      <div className="bg-teal-600 shadow-lg mb-8 rounded-2xl">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Gestión de Inventarios
                </h1>
                <p className="text-teal-100 text-sm font-medium">
                  Administración de inventarios físicos patrimoniales
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-5 py-2.5 bg-transparent border-2 border-white/70 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-200 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nuevo Inventario
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas Profesionales */}
      {inventories.length > 0 && (
        <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Inventarios */}
            <div className="bg-white border-l-4 border-l-teal-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Inventarios</p>
                  <p className="text-3xl font-bold text-slate-800">{countByStatus.todos}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-teal-50 text-teal-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Planificados */}
            <div className="bg-white border-l-4 border-l-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Planificados</p>
                  <p className="text-3xl font-bold text-slate-800">{countByStatus.PLANNED}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* En Progreso */}
            <div className="bg-white border-l-4 border-l-yellow-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">En Progreso</p>
                  <p className="text-3xl font-bold text-slate-800">{countByStatus.IN_PROGRESS}</p>
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
                  <p className="text-3xl font-bold text-slate-800">{countByStatus.COMPLETED}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-green-50 text-green-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Cancelados */}
            <div className="bg-white border-l-4 border-l-red-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Cancelados</p>
                  <p className="text-3xl font-bold text-slate-800">{countByStatus.CANCELLED}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-red-50 text-red-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Estado
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-teal-500/20 transition-all text-sm"
              >
                <option value="todos">Todos ({countByStatus.todos})</option>
                <option value="PLANNED">Planificado ({countByStatus.PLANNED})</option>
                <option value="IN_PROGRESS">En Progreso ({countByStatus.IN_PROGRESS})</option>
                <option value="COMPLETED">Completado ({countByStatus.COMPLETED})</option>
                <option value="CANCELLED">Cancelado ({countByStatus.CANCELLED})</option>
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

      <InventoryList
        inventories={inventories}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStart={handleStart}
        onComplete={handleComplete}
        onCreateNew={handleCreateNew}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <InventoryFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingInventory(null);
        }}
        onSave={handleSave}
        inventory={editingInventory}
        areas={areas}
        categories={categories}
        locations={locations}
        users={users}
      />

      {selectedInventory && (
        <InventoryDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedInventory(null);
          }}
          inventory={selectedInventory}
          areaName={selectedInventory.areaId ? (areas.find(a => a.id === selectedInventory.areaId)?.name || null) : null}
          categoryName={selectedInventory.categoryId ? (categories.find(c => c.id === selectedInventory.categoryId)?.name || null) : null}
          locationName={selectedInventory.locationId ? (locations.find(l => l.id === selectedInventory.locationId)?.name || null) : null}
          responsibleName={selectedInventory.generalResponsibleId ? (users.find(u => u.id === selectedInventory.generalResponsibleId)?.nombre || users.find(u => u.id === selectedInventory.generalResponsibleId)?.name || users.find(u => u.id === selectedInventory.generalResponsibleId)?.username || null) : null}
        />
      )}
    </div>
  );
}

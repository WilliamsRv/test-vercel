
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { 
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import InventoryDetailList from "../components/InventoryDetailList";
import InventoryDetailFormModal from "../components/InventoryDetailFormModal";
import InventoryDetailViewModal from "../components/InventoryDetailViewModal";
import { getInventoryById } from "../services/inventoryApi";
import { createInventoryDetail, updateInventoryDetail } from "../services/inventoryDetailApi";

const CONFIG_API_URL = 'http://localhost:5004';
const AUTH_API_URL = 'http://localhost:5002';

const STATUS_CONFIG = {
  PLANNED: { label: 'Planificado', color: 'bg-blue-50 text-blue-700 border-2 border-blue-300', icon: ClipboardDocumentListIcon },
  IN_PROGRESS: { label: 'En Progreso', color: 'bg-amber-50 text-amber-700 border-2 border-amber-300', icon: ClockIcon },
  COMPLETED: { label: 'Completado', color: 'bg-green-50 text-green-700 border-2 border-green-300', icon: CheckCircleIcon },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-50 text-red-700 border-2 border-red-300', icon: XCircleIcon }
};

export default function InventoryDetailsPage() {
  const { inventoryId } = useParams();
  const navigate = useNavigate();
  
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editingDetail, setEditingDetail] = useState(null);
  const [viewingDetail, setViewingDetail] = useState(null);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadInventory();
    loadConfigData();
  }, [inventoryId]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await getInventoryById(inventoryId);
      setInventory(data);
    } catch (error) {
      console.error('Error al cargar inventario:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar el inventario'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadConfigData = async () => {
    try {
      const locResponse = await fetch(`${CONFIG_API_URL}/api/v1/physical-locations`);
      if (locResponse.ok) {
        const locData = await locResponse.json();
        setLocations(locData.filter(l => l.active !== false));
      }

      const token = localStorage.getItem('accessToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const usersResponse = await fetch(`${AUTH_API_URL}/api/v1/users`, { headers });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.filter(u => u.active !== false));
      }
    } catch (error) {
      console.error('Error al cargar datos de configuración:', error);
    }
  };

  const handleAddDetail = () => {
    setEditingDetail(null);
    setIsFormOpen(true);
  };

  const handleEditDetail = (detail) => {
    setEditingDetail(detail);
    setIsFormOpen(true);
  };

  const handleViewDetail = (detail) => {
    setViewingDetail(detail);
    setIsViewOpen(true);
  };

  const handleSaveDetail = async (formData) => {
    try {
      Swal.fire({
        title: 'Guardando...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      if (editingDetail) {
        await updateInventoryDetail(editingDetail.id, formData);
      } else {
        await createInventoryDetail(formData);
      }

      Swal.fire({
        icon: 'success',
        title: editingDetail ? 'Actualizado' : 'Creado',
        text: 'Registro guardado correctamente',
        timer: 1500,
        showConfirmButton: false
      });

      setIsFormOpen(false);
      setEditingDetail(null);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo guardar el registro'
      });
    }
  };

  const normalizeStatus = (status) => {
    if (!status) return 'PLANNED';
    let normalized = String(status).toUpperCase().trim().replace(/\s+/g, '_');
    if (normalized === 'IN_PROCESS') normalized = 'IN_PROGRESS';
    return normalized;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="p-6 text-center">
        <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <ClipboardDocumentListIcon className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Inventario no encontrado</h3>
        <button
          onClick={() => navigate('/inventarios')}
          className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
        >
          Volver a la lista
        </button>
      </div>
    );
  }

  const inventoryStatus = normalizeStatus(inventory.status || inventory.inventoryStatus);
  const statusConfig = STATUS_CONFIG[inventoryStatus] || STATUS_CONFIG.PLANNED;
  const StatusIcon = statusConfig.icon;


  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/inventarios')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="font-medium">Volver a Inventarios</span>
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {inventory.inventoryNumber}
            </h1>
            <p className="text-base text-gray-600">
              {inventory.description || 'Verificación de bienes del inventario'}
            </p>
          </div>
          <div className={`flex items-center gap-3 px-6 py-3 rounded-full text-lg font-bold ${statusConfig.color}`}>
            <StatusIcon className="h-6 w-6" />
            {statusConfig.label}
          </div>
        </div>
      </div>

      {/* Lista de detalles */}
      <InventoryDetailList
        key={refreshKey}
        inventoryId={inventoryId}
        inventoryStatus={inventoryStatus}
        onAddDetail={handleAddDetail}
        onEditDetail={handleEditDetail}
        onViewDetail={handleViewDetail}
      />

      {/* Modal de formulario */}
      <InventoryDetailFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingDetail(null);
        }}
        onSave={handleSaveDetail}
        detail={editingDetail}
        inventoryId={inventoryId}
        municipalityId={inventory.municipalityId}
        locations={locations}
        users={users}
      />

      {/* Modal de vista */}
      <InventoryDetailViewModal
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setViewingDetail(null);
        }}
        detail={viewingDetail}
        locations={locations}
        users={users}
      />
    </div>
  );
}











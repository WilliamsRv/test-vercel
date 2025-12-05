
import { useEffect, useState } from "react";
import { 
  XMarkIcon, 
  ClipboardDocumentListIcon, 
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const INVENTORY_TYPES = [
  { value: "GENERAL", label: "General" },
  { value: "SELECTIVE", label: "Selectivo" }
];

export default function InventoryFormModal({ isOpen, onClose, onSave, inventory, areas, categories, locations, users }) {
  const [formData, setFormData] = useState({
    municipalityId: '7a52b3a4-87a9-4b1f-91d4-a1ee23c5e9c5',
    inventoryNumber: '',
    inventoryType: 'GENERAL',
    inventoryType: 'GENERAL',
    description: '',
    areaId: '',
    categoryId: '',
    locationId: '',
    plannedStartDate: '',
    plannedEndDate: '',
    generalResponsibleId: '',
    includesMissing: false,
    includesSurplus: false,
    requiresPhotos: false,
    observations: '',
    inventoryTeam: '',
    attachedDocuments: '',
    createdBy: '3bddf19a-2d5a-4ee7-8be4-63494fb411b8',
    status: 'PLANNED'
  });

  const [errors, setErrors] = useState({});
  const [assetsCount, setAssetsCount] = useState(null);
  const [checkingAssets, setCheckingAssets] = useState(false);

  useEffect(() => {
    if (inventory) {
      // Función para convertir fecha UTC a fecha local sin cambio de día
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      setFormData({
        municipalityId: inventory.municipalityId || '7a52b3a4-87a9-4b1f-91d4-a1ee23c5e9c5',
        inventoryNumber: inventory.inventoryNumber || '',
        inventoryType: inventory.inventoryType || 'GENERAL',
        description: inventory.description || '',
        areaId: inventory.areaId || '',
        categoryId: inventory.categoryId || '',
        locationId: inventory.locationId || '',
        plannedStartDate: formatDateForInput(inventory.plannedStartDate),
        plannedEndDate: formatDateForInput(inventory.plannedEndDate),
        generalResponsibleId: inventory.generalResponsibleId || '',
        includesMissing: inventory.includesMissing || false,
        includesSurplus: inventory.includesSurplus || false,
        requiresPhotos: inventory.requiresPhotos || false,
        observations: inventory.observations || '',
        inventoryTeam: inventory.inventoryTeam || '',
        attachedDocuments: inventory.attachedDocuments || '',
        createdBy: inventory.createdBy || '3bddf19a-2d5a-4ee7-8be4-63494fb411b8'
      });
    } else {
      setFormData({
        municipalityId: '7a52b3a4-87a9-4b1f-91d4-a1ee23c5e9c5',
        inventoryNumber: '',
        inventoryType: 'GENERAL',
        description: '',
        areaId: '',
        categoryId: '',
        locationId: '',
        plannedStartDate: '',
        plannedEndDate: '',
        generalResponsibleId: '',
        includesMissing: false,
        includesSurplus: false,
        requiresPhotos: false,
        observations: '',
        inventoryTeam: '',
        attachedDocuments: '',
        createdBy: '3bddf19a-2d5a-4ee7-8be4-63494fb411b8',
        status: 'PLANNED'
      });
    }
    setErrors({});
  }, [inventory, isOpen]);

  // Verificar cantidad de bienes según filtros
  const checkAssetsCount = async (areaId, categoryId, locationId) => {
    if (!areaId && !categoryId && !locationId) {
      setAssetsCount(null);
      return;
    }

    try {
      setCheckingAssets(true);
      
      // Obtener todos los bienes y filtrar en el frontend
      // porque el backend no respeta los query params
      const response = await fetch(`http://localhost:5003/api/v1/assets`);
      if (response.ok) {
        const allAssets = await response.json();
        
        // Filtrar según los criterios seleccionados
        // Los campos en el bien son: currentAreaId, categoryId, currentLocationId
        const filteredAssets = allAssets.filter(asset => {
          if (areaId && asset.currentAreaId !== areaId) return false;
          if (categoryId && asset.categoryId !== categoryId) return false;
          if (locationId && asset.currentLocationId !== locationId) return false;
          return true;
        });
        
        console.log(`� Bilenes filtrados: ${filteredAssets.length} de ${allAssets.length} totales`);
        console.log(`🔍 Filtros aplicados:`, { areaId, categoryId, locationId });
        
        setAssetsCount(filteredAssets.length);
      } else {
        setAssetsCount(0);
      }
    } catch (error) {
      console.error('Error al verificar bienes:', error);
      setAssetsCount(null);
    } finally {
      setCheckingAssets(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    let updates = {
      [name]: newValue
    };
    
    // Si es tipo SELECTIVE y se selecciona un filtro, limpiar los otros
    if (formData.inventoryType === 'SELECTIVE' && ['areaId', 'categoryId', 'locationId'].includes(name) && value) {
      if (name === 'areaId') {
        updates.categoryId = '';
        updates.locationId = '';
      } else if (name === 'categoryId') {
        updates.areaId = '';
        updates.locationId = '';
      } else if (name === 'locationId') {
        updates.areaId = '';
        updates.categoryId = '';
      }
    }
    
    // Si cambia a tipo GENERAL, limpiar todos los filtros
    if (name === 'inventoryType' && value === 'GENERAL') {
      updates.areaId = '';
      updates.categoryId = '';
      updates.locationId = '';
      setAssetsCount(null);
    }
    
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
    
    // Validación en tiempo real para campos de texto
    if (type !== 'checkbox' && !['areaId', 'categoryId', 'locationId', 'plannedStartDate', 'plannedEndDate', 'generalResponsibleId', 'inventoryType'].includes(name)) {
      const error = validateField(name, newValue);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
    
    // Verificar bienes cuando cambia un filtro
    if (['areaId', 'categoryId', 'locationId'].includes(name)) {
      const newAreaId = name === 'areaId' ? value : (updates.areaId !== undefined ? updates.areaId : formData.areaId);
      const newCategoryId = name === 'categoryId' ? value : (updates.categoryId !== undefined ? updates.categoryId : formData.categoryId);
      const newLocationId = name === 'locationId' ? value : (updates.locationId !== undefined ? updates.locationId : formData.locationId);
      
      checkAssetsCount(newAreaId, newCategoryId, newLocationId);
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'inventoryNumber':
        if (!value || value.trim() === '') {
          error = 'Número de inventario requerido';
        }
        break;
      case 'description':
        if (!value || value.trim() === '') {
          error = 'Descripción requerida';
        }
        break;
      case 'observations':
        if (value && value.trim() === '') {
          error = 'No puede contener solo espacios en blanco';
        }
        break;
      case 'inventoryTeam':
        if (value && value.trim() === '') {
          error = 'No puede contener solo espacios en blanco';
        }
        break;
    }
    
    return error;
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.inventoryNumber || !formData.inventoryNumber.trim()) newErrors.inventoryNumber = "Número de inventario requerido";
    if (!formData.inventoryType) newErrors.inventoryType = "Tipo de inventario requerido";
    if (!formData.description || !formData.description.trim()) newErrors.description = "Descripción requerida";
    if (!formData.plannedStartDate) newErrors.plannedStartDate = "Fecha de inicio requerida";
    if (!formData.plannedEndDate) newErrors.plannedEndDate = "Fecha de fin requerida";
    if (formData.plannedStartDate && formData.plannedEndDate && formData.plannedStartDate > formData.plannedEndDate) {
      newErrors.plannedEndDate = "La fecha de fin debe ser posterior a la fecha de inicio";
    }
    
    // Validar campos de texto que no deben ser solo espacios
    if (formData.observations && typeof formData.observations === 'string' && formData.observations.trim() === '') {
      newErrors.observations = 'No puede contener solo espacios en blanco';
    }
    if (formData.inventoryTeam && typeof formData.inventoryTeam === 'string' && formData.inventoryTeam.trim() === '') {
      newErrors.inventoryTeam = 'No puede contener solo espacios en blanco';
    }
    
    // Validación para tipo SELECTIVE
    if (formData.inventoryType === 'SELECTIVE') {
      const filtersSelected = [
        formData.areaId,
        formData.categoryId,
        formData.locationId
      ].filter(Boolean).length;
      
      if (filtersSelected === 0) {
        newErrors.areaId = "Los inventarios SELECTIVE deben tener al menos un filtro";
      } else if (filtersSelected > 1) {
        newErrors.areaId = "Los inventarios SELECTIVE solo pueden tener UN filtro a la vez";
      }
      
      // Validar que existan bienes con los filtros seleccionados
      if (assetsCount === 0) {
        newErrors.areaId = "No existen bienes con los filtros seleccionados. No se puede crear el inventario.";
      }
    }
    
    // Validación para tipo GENERAL
    if (formData.inventoryType === 'GENERAL') {
      if (formData.areaId || formData.categoryId || formData.locationId) {
        newErrors.areaId = "Los inventarios GENERAL no deben tener filtros";
      }
    }
    
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Convertir fechas a formato ISO UTC manteniendo el día seleccionado
    const formatDateToUTC = (dateString, isEndOfDay = false) => {
      if (!dateString) return null;
      const [year, month, day] = dateString.split('-');
      const time = isEndOfDay ? '23:59:59' : '00:00:00';
      return `${year}-${month}-${day}T${time}Z`; // La 'Z' indica UTC
    };

    const dataToSend = {
      ...formData,
      // Limpiar espacios en blanco de los campos de texto
      inventoryNumber: formData.inventoryNumber?.trim() || '',
      description: formData.description?.trim() || '',
      observations: (formData.observations && typeof formData.observations === 'string') ? formData.observations.trim() : '',
      inventoryTeam: (formData.inventoryTeam && typeof formData.inventoryTeam === 'string') ? formData.inventoryTeam.trim() : '',
      plannedStartDate: formatDateToUTC(formData.plannedStartDate, false),
      plannedEndDate: formatDateToUTC(formData.plannedEndDate, true),
      areaId: formData.areaId || null,
      categoryId: formData.categoryId || null,
      locationId: formData.locationId || null,
      generalResponsibleId: formData.generalResponsibleId || null,
      status: 'PLANNED'
    };

    onSave(dataToSend);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg mr-3">
                <ClipboardDocumentListIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  {inventory ? 'Editar Inventario Físico' : 'Nuevo Inventario Físico'}
                </h3>
                <p className="text-blue-100 text-sm">
                  {inventory ? 'Modifica los datos del inventario existente' : 'Completa la información para crear un nuevo inventario'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-2 transition-colors duration-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {errors.submit && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
                  <p className="text-sm text-red-700 font-medium">{errors.submit}</p>
                </div>
              </div>
            )}

            {/* Información Básica */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="text-lg font-semibold text-gray-900">Información Básica</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Número de Inventario *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="inventoryNumber"
                      value={formData.inventoryNumber}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                        errors.inventoryNumber ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="INV-2024-001"
                    />
                    {!errors.inventoryNumber && formData.inventoryNumber && (
                      <CheckCircleIcon className="absolute right-3 top-3 h-5 w-5 text-green-500" />
                    )}
                  </div>
                  {errors.inventoryNumber && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.inventoryNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo de Inventario * {inventory && <span className="text-xs text-gray-500">(No editable)</span>}
                  </label>
                  <select
                    name="inventoryType"
                    value={formData.inventoryType}
                    onChange={handleChange}
                    disabled={!!inventory}
                    className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:outline-none transition-colors duration-200 ${
                      inventory 
                        ? 'bg-gray-100 cursor-not-allowed text-gray-600 border-gray-200' 
                        : 'border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    }`}
                  >
                    {INVENTORY_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  {inventory && (
                    <p className="mt-2 text-xs text-gray-500 flex items-center">
                      <InformationCircleIcon className="h-4 w-4 mr-1" />
                      El tipo no puede modificarse porque define qué bienes se incluyen en el inventario
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Descripción *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 resize-none ${
                      errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Descripción del inventario..."
                  />
                  {errors.description && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Alcance */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <InformationCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                <h4 className="text-lg font-semibold text-gray-900">
                  Alcance del Inventario
                  {inventory && <span className="text-xs text-gray-500 ml-2">(No editable)</span>}
                </h4>
              </div>
              
              {formData.inventoryType === 'GENERAL' && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    ℹ️ Los inventarios <strong>GENERAL</strong> no deben tener filtros. Se incluirán todos los activos.
                  </p>
                </div>
              )}
              
              {formData.inventoryType === 'SELECTIVE' && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    ⚠️ Los inventarios <strong>SELECTIVE</strong> deben tener <strong>UN SOLO</strong> filtro (Área, Categoría o Ubicación).
                  </p>
                </div>
              )}
              
              {inventory && (
                <div className="mb-4 p-3 bg-gray-100 border border-gray-300 rounded-lg">
                  <p className="text-sm text-gray-700 flex items-center">
                    <InformationCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                    Los filtros no pueden modificarse porque definen qué bienes están incluidos en el inventario
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Área</label>
                  <select
                    name="areaId"
                    value={formData.areaId}
                    onChange={handleChange}
                    disabled={!!inventory}
                    className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:outline-none transition-colors duration-200 ${
                      inventory 
                        ? 'bg-gray-100 cursor-not-allowed text-gray-600 border-gray-200' 
                        : 'border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    }`}
                  >
                    <option value="">Todas las áreas</option>
                    {areas?.map(area => (
                      <option key={area.id} value={area.id}>{area.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    disabled={!!inventory}
                    className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:outline-none transition-colors duration-200 ${
                      inventory 
                        ? 'bg-gray-100 cursor-not-allowed text-gray-600 border-gray-200' 
                        : 'border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    }`}
                  >
                    <option value="">Todas las categorías</option>
                    {categories?.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ubicación</label>
                  <select
                    name="locationId"
                    value={formData.locationId}
                    onChange={handleChange}
                    disabled={!!inventory}
                    className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:outline-none transition-colors duration-200 ${
                      inventory 
                        ? 'bg-gray-100 cursor-not-allowed text-gray-600 border-gray-200' 
                        : 'border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    }`}
                  >
                    <option value="">Todas las ubicaciones</option>
                    {locations?.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Indicador de bienes encontrados */}
              {!inventory && (formData.areaId || formData.categoryId || formData.locationId) && (
                <div className="mt-4">
                  {checkingAssets ? (
                    <div className="flex items-center text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      <p className="text-sm font-medium">Verificando bienes disponibles...</p>
                    </div>
                  ) : assetsCount !== null && (
                    <div className={`flex items-center rounded-lg px-3 py-2 border ${
                      assetsCount === 0 
                        ? 'text-red-600 bg-red-50 border-red-200' 
                        : 'text-green-600 bg-green-50 border-green-200'
                    }`}>
                      {assetsCount === 0 ? (
                        <>
                          <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                          <p className="text-sm font-medium">
                            ⚠️ No existen bienes con los filtros seleccionados. No se podrá realizar el inventario.
                          </p>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                          <p className="text-sm font-medium">
                            ✓ Se encontraron {assetsCount} bien{assetsCount !== 1 ? 'es' : ''} que coinciden con los filtros
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {errors.areaId && (
                <div className="mt-2 flex items-center text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                  <p className="text-sm font-medium">{errors.areaId}</p>
                </div>
              )}
            </div>

            {/* Fechas y Responsable */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <CalendarIcon className="h-5 w-5 text-purple-600 mr-2" />
                <h4 className="text-lg font-semibold text-gray-900">Programación</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha Inicio *
                  </label>
                  <input
                    type="date"
                    name="plannedStartDate"
                    value={formData.plannedStartDate}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                      errors.plannedStartDate ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  />
                  {errors.plannedStartDate && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.plannedStartDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha Fin *
                  </label>
                  <input
                    type="date"
                    name="plannedEndDate"
                    value={formData.plannedEndDate}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                      errors.plannedEndDate ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  />
                  {errors.plannedEndDate && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.plannedEndDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Responsable General
                  </label>
                  <select
                    name="generalResponsibleId"
                    value={formData.generalResponsibleId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 transition-colors duration-200"
                  >
                    <option value="">Sin responsable asignado</option>
                    {users && users.length > 0 && users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.nombre || user.name || user.fullName || user.username || user.email || 'Usuario sin nombre'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Opciones */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Opciones</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    name="includesMissing"
                    checked={formData.includesMissing}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Incluir registro de faltantes</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    name="includesSurplus"
                    checked={formData.includesSurplus}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Incluir registro de sobrantes</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    name="requiresPhotos"
                    checked={formData.requiresPhotos}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Requiere fotografías</span>
                </label>
              </div>
            </div>

            {/* Observaciones */}
            <div className="bg-gray-50 rounded-xl p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Observaciones</label>
              <textarea
                name="observations"
                value={formData.observations}
                onChange={handleChange}
                rows="3"
                className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200 resize-none ${
                  errors.observations 
                    ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-200 hover:border-gray-300 focus:ring-blue-500 focus:border-transparent'
                }`}
                placeholder="Observaciones adicionales..."
              />
              {errors.observations && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  {errors.observations}
                </p>
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-2xl">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-8 py-3 border border-transparent rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                {inventory ? 'Actualizar Inventario' : 'Crear Inventario'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}








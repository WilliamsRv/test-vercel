import React, { useState, useEffect } from 'react';
import { createBienPatrimonial, updateBienPatrimonial } from '../../services/api';
import { uploadAssetDocument, deleteAssetDocument, validateFile, getFileIcon, formatFileSize } from '../../services/uploadService';
import useConfigurationData from '../../hooks/useConfigurationData';

import SelectSearch from '../shared/SelectSearch';

/**
 * Modal para crear y editar bienes patrimoniales
 * Incluye soporte para carga de documentos adjuntos
 */
export default function AssetModal({ isOpen, onClose, onSuccess, bien = null }) {
  const isEditing = !!bien;

  const [formData, setFormData] = useState({
    // Campos que enviaremos al backend (en inglés según migración)
    assetCode: '',
    description: '',
    detalles: '',
    brand: '',
    model: '',
    serialNumber: '',
    color: '',
    dimensions: '',
    weight: '',
    acquisitionDate: '',
    fechaFabricacion: '',
    acquisitionValue: '',
    currency: 'PEN',
    acquisitionType: '', // Tipo de adquisición (SBN crítico)
    usefulLife: '',
    residualValue: '1',
    metodoDepreciacion: 'LINEAL',
    assetStatus: 'DISPONIBLE',
    conservationStatus: 'NUEVO',
    condicionUso: 'EXCELENTE',
    ubicacionActual: '',
    ubicacionFisica: '',
    responsableActual: '',
    areaAsignada: '',
    observations: '',
    requiresMaintenance: false,
    isDepreciable: true,
    invoiceNumber: '',
    pecosaNumber: '', // Número PECOSA (requerido para TRANSFERENCIA, DONACION, ASIGNACION)
    purchaseOrderNumber: '',
    warrantyExpirationDate: '',
    documentoRespaldo: '',
    imagenUrl: '',
    qrCode: '',
    barcode: '',
    rfidTag: '',
    categoryId: '',
    supplierId: '',
    currentLocationId: '',
    currentResponsibleId: '',
    currentAreaId: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('identificacion');

  // Estados para upload de archivos
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Definir las tabs del formulario con iconos Heroicons
  const tabs = [
    { 
      id: 'identificacion', 
      label: 'Identificación',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      id: 'tecnica', 
      label: 'Información Técnica',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    { 
      id: 'financiera', 
      label: 'Información Financiera',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      id: 'ubicacion', 
      label: 'Ubicación y Responsables',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    { 
      id: 'documentacion', 
      label: 'Documentación',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
  ];  useEffect(() => {
    if (bien) {
      setFormData({
        // Mapeo de campos: backend ahora retorna en inglés, pero mantenemos compatibilidad con español
        assetCode: bien.assetCode || bien.codigoPatrimonial || '',
        description: bien.description || bien.descripcion || '',
        detalles: bien.detalles || '',
        brand: bien.brand || bien.marca || '',
        model: bien.model || bien.modelo || '',
        serialNumber: bien.serialNumber || bien.serie || '',
        color: bien.color || '',
        dimensions: bien.dimensions || bien.dimensiones || '',
        weight: bien.weight || bien.peso || '',
        acquisitionDate: bien.acquisitionDate || bien.fechaAdquisicion || '',
        fechaFabricacion: bien.fechaFabricacion || '',
        acquisitionValue: bien.acquisitionValue || bien.valorAdquisicion || '',
        currency: bien.currency || bien.moneda || 'PEN',
        acquisitionType: bien.acquisitionType || bien.tipoAdquisicion || '',
        usefulLife: bien.usefulLife || bien.vidaUtil || '',
        residualValue: bien.residualValue || bien.valorResidual || '1',
        metodoDepreciacion: bien.metodoDepreciacion || 'LINEAL',
        assetStatus: bien.assetStatus || bien.estadoBien || 'DISPONIBLE',
        conservationStatus: bien.conservationStatus || bien.estadoFisico || bien.estadoConservacion || 'NUEVO',
        condicionUso: bien.condicionUso || 'EXCELENTE',
        ubicacionActual: bien.ubicacionActual || '',
        ubicacionFisica: bien.ubicacionFisica || '',
        responsableActual: bien.responsableActual || '',
        areaAsignada: bien.areaAsignada || '',
        observations: bien.observations || bien.observaciones || '',
        requiresMaintenance: bien.requiresMaintenance ?? bien.requiereMantenimiento ?? false,
        isDepreciable: bien.isDepreciable ?? bien.esDepreciable ?? true,
        invoiceNumber: bien.invoiceNumber || bien.numeroFactura || bien.facturaNumero || '',
        pecosaNumber: bien.pecosaNumber || bien.numeroPecosa || '',
        purchaseOrderNumber: bien.purchaseOrderNumber || bien.numeroOrdenCompra || bien.ordenCompra || '',
        warrantyExpirationDate: bien.warrantyExpirationDate || bien.fechaVencimientoGarantia || '',
        documentoRespaldo: bien.documentoRespaldo || '',
        imagenUrl: bien.imagenUrl || '',
        qrCode: bien.qrCode || bien.codigoQr || '',
        barcode: bien.barcode || bien.codigoBarras || '',
        rfidTag: bien.rfidTag || bien.etiquetaRfid || '',
        categoryId: bien.categoryId || bien.categoriaId || '',
        supplierId: bien.supplierId || bien.proveedorId || '',
        currentLocationId: bien.currentLocationId || bien.ubicacionActualId || '',
        currentResponsibleId: bien.currentResponsibleId || bien.responsableActualId || '',
        currentAreaId: bien.currentAreaId || bien.areaActualId || '',
      });

      // Cargar archivos adjuntos si existen
      if (bien.attachedDocuments) {
        try {
          const docs = typeof bien.attachedDocuments === 'string' 
            ? JSON.parse(bien.attachedDocuments) 
            : bien.attachedDocuments;
          if (Array.isArray(docs)) {
            setUploadedFiles(docs);
          }
        } catch (e) {
          console.error('Error parsing attachedDocuments:', e);
        }
      }
    }
  }, [bien]);

  // Usar hook de configuración
  const configData = useConfigurationData();
  const { areas, categories, locations: ubicaciones, responsible: responsables, suppliers: providers } = configData;

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      configData.reload();
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Funciones para manejo de archivos
  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    
    if (!files.length) return;

    // Validar que no exceda el máximo de archivos
    if (uploadedFiles.length + files.length > 5) {
      setUploadError('Máximo 5 archivos permitidos');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    for (const file of files) {
      // Validar archivo
      const validation = validateFile(file);
      if (!validation.valid) {
        setUploadError(validation.error);
        continue;
      }

      // Subir archivo
      setUploadProgress({ fileName: file.name, progress: 0 });
      
      const assetCode = formData.assetCode || 'TEMP';
      const result = await uploadAssetDocument(file, assetCode);

      if (result.success) {
        setUploadedFiles(prev => [...prev, result]);
      } else {
        setUploadError(result.error);
      }
    }

    setUploadProgress(null);
    setIsUploading(false);
    event.target.value = ''; // Reset input
  };

  const handleFileDelete = async (index) => {
    const fileToDelete = uploadedFiles[index];
    
    if (window.confirm(`¿Está seguro de eliminar ${fileToDelete.fileName}?`)) {
      const result = await deleteAssetDocument(fileToDelete.path);
      
      if (result.success) {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
      } else {
        setUploadError(result.error);
      }
    }
  };

  // Validación completa del formulario según normativa SBN
  const validateForm = () => {
    // 1. UBICACIÓN Y RESPONSABILIDAD (CRÍTICO según SBN)
    if (!formData.currentLocationId) {
      setError('❌ La ubicación física del bien es obligatoria según normativa SBN');
      return false;
    }
    if (!formData.currentResponsibleId) {
      setError('❌ Debe asignar un responsable del bien (obligatorio según normativa SBN)');
      return false;
    }

    // 2. VALORES NUMÉRICOS (Validación de lógica)
    const acquisitionValue = parseFloat(formData.acquisitionValue);
    if (acquisitionValue <= 0) {
      setError('❌ El valor de adquisición debe ser mayor a 0');
      return false;
    }

    const weight = parseFloat(formData.weight);
    if (weight && weight <= 0) {
      setError('❌ El peso debe ser mayor a 0');
      return false;
    }

    // Validar vida útil para bienes depreciables
    if (formData.isDepreciable) {
      const usefulLife = parseInt(formData.usefulLife, 10);
      if (!usefulLife || usefulLife <= 0) {
        setError('❌ La vida útil es obligatoria para bienes depreciables y debe ser mayor a 0');
        return false;
      }
      if (usefulLife > 100) {
        setError('❌ La vida útil no puede ser mayor a 100 años');
        return false;
      }
    }

    const residualValue = parseFloat(formData.residualValue);
    if (residualValue < 1) {
      setError('❌ El valor residual mínimo es 1');
      return false;
    }
    if (residualValue >= acquisitionValue) {
      setError('❌ El valor residual debe ser menor al valor de adquisición');
      return false;
    }

    // 3. FECHAS (Validación de coherencia)
    const acquisitionDate = new Date(formData.acquisitionDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (acquisitionDate > today) {
      setError('❌ La fecha de adquisición no puede ser futura');
      return false;
    }

    // Validar año razonable (no más de 100 años atrás)
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 100);
    if (acquisitionDate < minDate) {
      setError('❌ La fecha de adquisición debe ser posterior a ' + minDate.getFullYear());
      return false;
    }

    if (formData.warrantyExpirationDate) {
      const warrantyDate = new Date(formData.warrantyExpirationDate);
      if (warrantyDate < acquisitionDate) {
        setError('❌ La fecha de vencimiento de garantía debe ser posterior a la fecha de adquisición');
        return false;
      }
    }

    // 4. TIPO DE ADQUISICIÓN Y DOCUMENTO DE SUSTENTO (CRÍTICO según SBN)
    if (!formData.acquisitionType) {
      setError('❌ El tipo de adquisición es obligatorio según normativa SBN');
      return false;
    }

    // Validar documento según tipo de adquisición
    const acquisitionType = formData.acquisitionType;
    
    if (acquisitionType === 'COMPRA' && !formData.invoiceNumber) {
      setError('❌ El número de factura es obligatorio para adquisiciones por COMPRA');
      return false;
    }

    if (['TRANSFERENCIA', 'DONACION', 'ASIGNACION'].includes(acquisitionType) && !formData.pecosaNumber) {
      setError('❌ El número de PECOSA es obligatorio para ' + acquisitionType);
      return false;
    }

    // 5. MONEDA (Obligatorio)
    if (!formData.currency) {
      setError('❌ La moneda es obligatoria');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validar formulario antes de enviar
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // Helper para extraer id si el campo es un objeto (Select puede devolver objeto)
      const extractId = (v) => {
        if (!v && v !== 0) return null;
        if (typeof v === 'string' || typeof v === 'number') return v;
        if (typeof v === 'object') return v.id || v._id || v.personaId || v.codigo || v.code || null;
        return null;
      };

      // Mapear formData exactamente a AssetRequest con nombres en INGLÉS (migración del backend)
      const payload = {
        // Municipality ID - Obtenido de localStorage
        municipalityId: '24ad12a5-d9e5-4cdd-91f1-8fd0355c9473',
        
        // 1 - Código patrimonial (assetCode en inglés)
        assetCode: formData.assetCode || null,
        // 2
        internalCode: formData.internalCode || formData.codigoInterno || null,
        // 3
        sbnCode: formData.sbnCode || formData.codigoSbn || null,
        // 4 - Descripción
        description: formData.description || null,
        // 5 - Categoría
        categoryId: extractId(formData.categoryId) || null,
        // 6
        subcategoryId: formData.subcategoryId || formData.subcategoriaId || null,
        // 7 - Marca
        brand: formData.brand || null,
        // 8 - Modelo
        model: formData.model || null,
        // 9 - Número de serie
        serialNumber: formData.serialNumber || null,
        // 10 - Placa patrimonial
        assetPlate: formData.assetPlate || formData.placaPatrimonial || null,
        // 11 - Vida útil (Integer)
        usefulLife: formData.usefulLife ? parseInt(formData.usefulLife, 10) : null,
        // 12
        color: formData.color || null,
        // 13 - Dimensiones
        dimensions: formData.dimensions || null,
        // 14 - Peso
        weight: formData.weight ? parseFloat(formData.weight) : null,
        // 15
        material: formData.material || null,
        // 16 - Proveedor
        supplierId: extractId(formData.supplierId) || null,
        // 17 - Fecha de adquisición
        acquisitionDate: formData.acquisitionDate || null,
        // 18
        acquisitionType: formData.acquisitionType || formData.tipoAdquisicion || null,
        // 19 - Número de factura
        invoiceNumber: formData.invoiceNumber || null,
        // 20 - Número de orden de compra
        purchaseOrderNumber: formData.purchaseOrderNumber || null,
        // 21
        pecosaNumber: formData.pecosaNumber || formData.numeroPecosa || null,
        // 22 - Valor de adquisición
        acquisitionValue: formData.acquisitionValue ? parseFloat(formData.acquisitionValue) : null,
        // 23 - Moneda
        currency: formData.currency || null,
        // 24 - Valor residual
        residualValue: formData.residualValue ? parseFloat(formData.residualValue) : null,
        // 25 - Estado del bien
        assetStatus: formData.assetStatus || null,
        // 26 - Estado de conservación
        conservationStatus: formData.conservationStatus || null,
        // 27 - Ubicación actual
        currentLocationId: extractId(formData.currentLocationId) || null,
        // 28 - Responsable actual
        currentResponsibleId: extractId(formData.currentResponsibleId) || null,
        // 29 - Área actual
        currentAreaId: extractId(formData.currentAreaId) || null,
        // 30 - Fecha vencimiento garantía
        warrantyExpirationDate: formData.warrantyExpirationDate || null,
        // 31 - Observaciones
        observations: formData.observations || null,
        // 32
        technicalSpecifications: formData.technicalSpecifications || formData.especificacionesTecnicas || null,
        // 33 - Documentos adjuntos (URLs de archivos subidos a Supabase)
        attachedDocuments: uploadedFiles.length > 0 
          ? JSON.stringify(uploadedFiles.map(f => ({ url: f.url, fileName: f.fileName, fileSize: f.fileSize, fileType: f.fileType })))
          : (formData.attachedDocuments || formData.documentosAdjuntos || null),
        // 34
        customFields: formData.customFields || formData.camposPersonalizados || null,
        // 35
        isInventoriable: typeof formData.isInventoriable === 'boolean' ? formData.isInventoriable : null,
        // 36 - Requiere mantenimiento
        requiresMaintenance: !!formData.requiresMaintenance,
        // 37 - Es depreciable
        isDepreciable: !!formData.isDepreciable,
        // Identificadores físicos
        qrCode: formData.qrCode || null,
        barcode: formData.barcode || null,
        rfidTag: formData.rfidTag || null,
        // 38
        createdBy: formData.createdBy || null,
      };

      // Log para depuración: qué se está enviando
      // eslint-disable-next-line no-console
      console.log('Submitting Bien - formData:', formData);
      // eslint-disable-next-line no-console
      console.log('Submitting Bien - payload:', payload);

      if (isEditing) {
        await updateBienPatrimonial(bien.id, payload);
      } else {
        await createBienPatrimonial(payload);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar el bien patrimonial');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block w-full max-w-5xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
          {/* Header */}
          <div style={{ background: 'linear-gradient(to right, #334155, #1e293b)' }} className="px-6 py-5">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">
                {isEditing ? 'Editar Bien Patrimonial' : 'Nuevo Bien Patrimonial'}
              </h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="flex flex-col max-h-[75vh]">
            {error && (
              <div className="mx-6 mt-6 mb-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {configData.error && (
              <div className="mx-6 mt-6 mb-2 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                ⚠️ {configData.error}
              </div>
            )}

            {/* Tabs Navigation */}
            <div className="px-6 pt-4 border-b border-gray-200">
              <nav className="flex space-x-2 overflow-x-auto pb-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={activeTab === tab.id ? { backgroundColor: '#334155' } : {}}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap
                      ${activeTab === tab.id
                        ? 'text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="flex-1 px-6 py-6 overflow-y-auto">

            {/* TAB 1: IDENTIFICACIÓN */}
            {activeTab === 'identificacion' && (
              <>
            {/* Información Básica */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">
                Información Básica
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Código Patrimonial <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="assetCode"
                    value={formData.assetCode}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="BP-2025-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Serie
                  </label>
                  <input
                    type="text"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="SN123456789"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Descripción breve del bien"
                  />
                </div>

                <div>
                  <SelectSearch
                    label="Categoría"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    options={categories}
                    valueKey="id"
                    labelKey="label"
                    placeholder="Buscar categoría..."
                    emptyOption="-- Seleccione categoría --"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Detalles
                  </label>
                  <textarea
                    name="detalles"
                    value={formData.detalles}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Detalles adicionales..."
                  />
                </div>
              </div>
            </div>
              </>
            )}

            {/* TAB 2: INFORMACIÓN TÉCNICA */}
            {activeTab === 'tecnica' && (
              <>
            {/* Características Físicas */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">
                Características Físicas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dimensiones</label>
                  <input
                    type="text"
                    name="dimensions"
                    value={formData.dimensions}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="35.7 x 23.3 x 1.99 cm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Mayor a 0 kg"
                  />
                </div>
              </div>
            </div>
              </>
            )}

            {/* TAB 3: INFORMACIÓN FINANCIERA */}
            {activeTab === 'financiera' && (
              <>
            {/* Información Financiera */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">
                Información Financiera
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fecha Adquisición <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="acquisitionDate"
                    value={formData.acquisitionDate}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Valor Adquisición <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    name="acquisitionValue"
                    value={formData.acquisitionValue}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Valor mayor a 0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Moneda <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">-- Seleccione moneda --</option>
                    <option value="PEN">PEN (Soles)</option>
                    <option value="USD">USD (Dólares)</option>
                    <option value="EUR">EUR (Euros)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tipo de Adquisición <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="acquisitionType"
                    value={formData.acquisitionType}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">-- Seleccione tipo --</option>
                    <option value="COMPRA">Compra</option>
                    <option value="DONACION">Donación</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="ASIGNACION">Asignación</option>
                    <option value="FABRICACION">Fabricación</option>
                    <option value="PERMUTA">Permuta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Vida Útil (meses)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1200"
                    name="usefulLife"
                    value={formData.usefulLife}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Entre 1 y 1200 meses (100 años)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Valor Residual <span className="text-slate-500 text-xs">(Fijo: S/ 1.00)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    name="residualValue"
                    value={formData.residualValue}
                    readOnly
                    disabled
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-600 cursor-not-allowed"
                    placeholder="Valor fijo de S/ 1.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Método Depreciación
                  </label>
                  <select
                    name="metodoDepreciacion"
                    value={formData.metodoDepreciacion}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="LINEAL">Lineal</option>
                    <option value="ACELERADA">Acelerada</option>
                    <option value="SUMA_DIGITOS">Suma de Dígitos</option>
                  </select>
                </div>
              </div>
            </div>
              </>
            )}

            {/* TAB 4: UBICACIÓN Y RESPONSABLES */}
            {activeTab === 'ubicacion' && (
              <>
            {/* Estados */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">
                Estados y Condición
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Estado del Bien
                  </label>
                  <select
                    name="assetStatus"
                    value={formData.assetStatus}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="DISPONIBLE">Disponible</option>
                    <option value="EN_USO">En Uso</option>
                    <option value="MANTENIMIENTO">Mantenimiento</option>
                    <option value="BAJA">Baja</option>
                    <option value="PRESTADO">Prestado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Estado Físico
                  </label>
                  <select
                    name="conservationStatus"
                    value={formData.conservationStatus}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="NUEVO">Nuevo</option>
                    <option value="BUENO">Bueno</option>
                    <option value="REGULAR">Regular</option>
                    <option value="MALO">Malo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Condición de Uso
                  </label>
                  <select
                    name="condicionUso"
                    value={formData.condicionUso}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="EXCELENTE">Excelente</option>
                    <option value="BUENO">Bueno</option>
                    <option value="REGULAR">Regular</option>
                    <option value="DEFICIENTE">Deficiente</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Ubicación y Responsable */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">
                Ubicación y Responsabilidad
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <SelectSearch
                    label="Proveedor (opcional)"
                    name="supplierId"
                    value={formData.supplierId}
                    onChange={handleChange}
                    options={providers}
                    valueKey="id"
                    labelKey="label"
                    placeholder="Buscar proveedor..."
                    emptyOption="-- Seleccione proveedor --"
                  />
                </div>

                <div>
                  <SelectSearch
                    label="Ubicación"
                    name="currentLocationId"
                    value={formData.currentLocationId}
                    onChange={handleChange}
                    options={ubicaciones}
                    valueKey="id"
                    labelKey="label"
                    placeholder="Buscar ubicación..."
                    emptyOption="-- Seleccione ubicación --"
                    required
                  />
                </div>

                <div>
                  <SelectSearch
                    label="Responsable"
                    name="currentResponsibleId"
                    value={formData.currentResponsibleId}
                    onChange={handleChange}
                    options={responsables}
                    valueKey="id"
                    labelKey="label"
                    placeholder="Buscar responsable..."
                    emptyOption="-- Seleccione responsable --"
                    required
                  />
                </div>

                <div>
                  <SelectSearch
                    label="Área"
                    name="currentAreaId"
                    value={formData.currentAreaId}
                    onChange={handleChange}
                    options={areas}
                    valueKey="id"
                    labelKey="label"
                    placeholder="Buscar área..."
                    emptyOption="-- Seleccione área --"
                  />
                </div>
              </div>
            </div>
              </>
            )}

            {/* TAB 5: DOCUMENTACIÓN */}
            {activeTab === 'documentacion' && (
              <>
            {/* Documentación */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">
                Documentación
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Número de Factura - Obligatorio para COMPRA */}
                {formData.acquisitionType === 'COMPRA' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Número de Factura <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="invoiceNumber"
                      value={formData.invoiceNumber}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Ej: F001-00001234"
                    />
                  </div>
                )}

                {/* Número PECOSA - Obligatorio para TRANSFERENCIA, DONACION, ASIGNACION */}
                {['TRANSFERENCIA', 'DONACION', 'ASIGNACION'].includes(formData.acquisitionType) && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Número PECOSA <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="pecosaNumber"
                      value={formData.pecosaNumber}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Ej: PECOSA-2024-001234"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Orden de Compra
                  </label>
                  <input
                    type="text"
                    name="purchaseOrderNumber"
                    value={formData.purchaseOrderNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Vencimiento Garantía
                  </label>
                  <input
                    type="date"
                    name="warrantyExpirationDate"
                    value={formData.warrantyExpirationDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Identificadores */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">
                Identificadores
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Código QR
                  </label>
                  <input
                    type="text"
                    name="qrCode"
                    value={formData.qrCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Código de Barras
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Etiqueta RFID
                  </label>
                  <input
                    type="text"
                    name="rfidTag"
                    value={formData.rfidTag}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Opciones */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">
                Opciones
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDepreciable"
                    name="isDepreciable"
                    checked={formData.isDepreciable}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="isDepreciable" className="ml-2 text-sm font-medium text-slate-700">
                    Es Depreciable
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requiresMaintenance"
                    name="requiresMaintenance"
                    checked={formData.requiresMaintenance}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="requiresMaintenance" className="ml-2 text-sm font-medium text-slate-700">
                    Requiere Mantenimiento
                  </label>
                </div>
              </div>
            </div>

            {/* Subir Archivos Adjuntos */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">
                Archivos Adjuntos
              </h4>
              
              {/* Upload Area */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Subir documentos (Máx. 5 archivos, 5MB cada uno)
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-10 h-10 mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mb-2 text-sm text-slate-500">
                        <span className="font-semibold">Click para subir</span> o arrastra archivos
                      </p>
                      <p className="text-xs text-slate-400">PDF, DOC, DOCX, JPG, PNG, WEBP</p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                      onChange={handleFileSelect}
                      disabled={isUploading || uploadedFiles.length >= 5}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Upload Progress */}
              {uploadProgress && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-blue-700">Subiendo {uploadProgress.fileName}...</span>
                  </div>
                </div>
              )}

              {/* Upload Error */}
              {uploadError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{uploadError}</p>
                </div>
              )}

              {/* Lista de archivos subidos */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    Archivos subidos ({uploadedFiles.length}/5):
                  </p>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">{getFileIcon(file.fileType)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{file.fileName}</p>
                          <p className="text-xs text-slate-500">{formatFileSize(file.fileSize)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileDelete(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Eliminar archivo"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Observaciones */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Observaciones
              </label>
              <textarea
                name="observations"
                value={formData.observations}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Observaciones adicionales..."
              />
            </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  const currentIndex = tabs.findIndex(t => t.id === activeTab);
                  if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1].id);
                }}
                disabled={tabs.findIndex(t => t.id === activeTab) === 0}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              
              <span className="text-sm text-gray-500">
                Sección {tabs.findIndex(t => t.id === activeTab) + 1} de {tabs.length}
              </span>

              <button
                type="button"
                onClick={() => {
                  const currentIndex = tabs.findIndex(t => t.id === activeTab);
                  if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1].id);
                }}
                disabled={tabs.findIndex(t => t.id === activeTab) === tabs.length - 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente →
              </button>
            </div>
            </div>
          </form>

          {/* Footer */}
          <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

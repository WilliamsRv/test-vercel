import { useEffect, useState } from 'react';
import {
    MAINTENANCE_TYPES,
    MAINTENANCE_TYPE_LABELS,
    PRIORITIES,
    PRIORITY_LABELS,
} from '../constants/maintenance.constants';
import assetService from '../services/assetService';
import supplierService from '../services/supplierService';
import userService from '../services/userService';
import { uploadFile } from '../../../shared/utils/supabaseStorage';

export default function MaintenanceFormModal({ isOpen, onClose, onSubmit, maintenance, isEditing, existingMaintenances = [] }) {
    const [loading, setLoading] = useState(false);
    const [assets, setAssets] = useState([]);
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [filePreview, setFilePreview] = useState('');
    const [formData, setFormData] = useState({
        maintenanceCode: '',
        assetId: '',
        maintenanceType: 'PREVENTIVE',
        priority: 'MEDIUM',
        scheduledDate: '',
        workDescription: '',
        reportedProblem: '',
        observations: '',
        technicalResponsibleId: '',
        serviceSupplierId: '',
        hasSupplier: false,
        hasCosts: false,
        laborCost: 0,
        partsCost: 0,
        hasWarranty: false,
        warrantyExpirationDate: '',
        imageUrl: '',
        isScheduled: true,
    });

    useEffect(() => {
        if (isOpen) {
            loadAssets();
            loadUsers();
            loadSuppliers();
        }
    }, [isOpen]);

    const loadAssets = async () => {
        setLoadingAssets(true);
        try {
            console.log('🔄 Cargando activos disponibles...');
            const assets = await assetService.getAvailableAssets();
            console.log('✅ Activos cargados:', assets.length);
            setAssets(assets);
            if (assets.length === 0) {
                console.warn('⚠️ No se encontraron activos disponibles');
            }
        } catch (error) {
            console.error('❌ Error al cargar activos:', error);
            console.error('❌ Detalles del error:', error.message);
            setAssets([]);
        } finally {
            setLoadingAssets(false);
        }
    };

    const loadUsers = async () => {
        setLoadingUsers(true);
        try {
            console.log('🔄 Cargando usuarios activos...');
            const users = await userService.getActiveUsers();
            console.log('✅ Usuarios cargados:', users.length);
            console.log('📋 Primeros 3 usuarios:', users.slice(0, 3));
            setUsers(users);
            if (users.length === 0) {
                console.warn('⚠️ No se encontraron usuarios activos');
            }
        } catch (error) {
            console.error('❌ Error al cargar usuarios:', error);
            console.error('❌ Detalles del error:', error.message);
            console.error('❌ Stack:', error.stack);
            setUsers([]);
        } finally {
            setLoadingUsers(false);
        }
    };

    const loadSuppliers = async () => {
        setLoadingSuppliers(true);
        try {
            console.log('🔄 Cargando proveedores activos...');
            const suppliers = await supplierService.getActiveSuppliers();
            console.log('✅ Proveedores cargados:', suppliers.length);
            setSuppliers(suppliers);
            if (suppliers.length === 0) {
                console.warn('⚠️ No se encontraron proveedores activos');
            }
        } catch (error) {
            console.error('❌ Error al cargar proveedores:', error);
            console.error('❌ Detalles del error:', error.message);
            setSuppliers([]);
        } finally {
            setLoadingSuppliers(false);
        }
    };

    useEffect(() => {
        if (isOpen && isEditing && maintenance) {
            setFormData({
                maintenanceCode: maintenance.maintenanceCode || '',
                assetId: maintenance.assetId || '',
                maintenanceType: maintenance.maintenanceType || 'PREVENTIVE',
                priority: maintenance.priority || 'MEDIUM',
                scheduledDate: maintenance.scheduledDate ? maintenance.scheduledDate.split('T')[0] : '',
                workDescription: maintenance.workDescription || '',
                reportedProblem: maintenance.reportedProblem || '', // ⭐ Campo nuevo
                observations: maintenance.observations || '',
                technicalResponsibleId: maintenance.technicalResponsibleId || '',
                serviceSupplierId: maintenance.serviceSupplierId || '',
                hasSupplier: !!maintenance.serviceSupplierId,
                hasCosts: (maintenance.laborCost > 0 || maintenance.partsCost > 0) || false,
                laborCost: maintenance.laborCost || 0,
                partsCost: maintenance.partsCost || 0,
                hasWarranty: maintenance.hasWarranty || false,
                warrantyExpirationDate: maintenance.warrantyExpirationDate ? maintenance.warrantyExpirationDate.split('T')[0] : '',
                imageUrl: maintenance.attachedDocuments?.[0]?.fileUrl || '',
                isScheduled: maintenance.isScheduled !== undefined ? maintenance.isScheduled : true,
            });
        } else if (isOpen && !isEditing) {
            const generateMaintenanceCode = () => {
                const now = new Date();
                const year = now.getFullYear();
                const day = String(now.getDate()).padStart(2, '0');

                // Nombres de meses en español (abreviados a 3 letras en mayúsculas)
                const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
                const monthName = monthNames[now.getMonth()];

                // Formato: MANT-DD-MES-YYYY (día-mes-año)
                const datePrefix = `MANT-${day}-${monthName}-${year}`;

                const todayMaintenances = existingMaintenances.filter(m =>
                    m.maintenanceCode && m.maintenanceCode.startsWith(datePrefix)
                );

                let maxCorrelative = 0;
                todayMaintenances.forEach(m => {
                    const match = m.maintenanceCode.match(/-(\d{3})$/);
                    if (match) {
                        const num = parseInt(match[1], 10);
                        if (num > maxCorrelative) {
                            maxCorrelative = num;
                        }
                    }
                });

                const newCorrelative = String(maxCorrelative + 1).padStart(3, '0');
                return `${datePrefix}-${newCorrelative}`;
            };

            const newCode = generateMaintenanceCode();

            setFormData({
                maintenanceCode: newCode,
                assetId: '',
                maintenanceType: 'PREVENTIVE',
                priority: 'MEDIUM',
                scheduledDate: '',
                workDescription: '',
                reportedProblem: '', // ⭐ Campo nuevo
                observations: '',
                technicalResponsibleId: '',
                serviceSupplierId: '',
                hasSupplier: false,
                hasCosts: false,
                laborCost: 0,
                partsCost: 0,
                hasWarranty: false,
                warrantyExpirationDate: '',
                imageUrl: '',
                isScheduled: true,
            });
        }
    }, [isOpen, isEditing, maintenance, existingMaintenances]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            // Generar preview local
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile) {
            alert('Por favor selecciona un archivo primero');
            return;
        }

        setUploadingFile(true);
        try {
            console.log('📤 Iniciando subida de archivo...');
            const { url, path } = await uploadFile(selectedFile, 'mantenimiento');
            console.log('✅ Archivo subido exitosamente:', url);

            // Actualizar el formData con la URL generada
            setFormData(prev => ({
                ...prev,
                imageUrl: url,
            }));

            // Limpiar el archivo seleccionado pero mantener el preview
            setSelectedFile(null);
            alert('✅ Imagen subida exitosamente');
        } catch (error) {
            console.error('❌ Error al subir archivo:', error);
            alert(`Error al subir archivo: ${error.message}`);
        } finally {
            setUploadingFile(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const municipalityId = localStorage.getItem('municipalCode') || 'a1b2c3d4-e5f6-4a5b-8c9d-111111111111';

            const userIdFromStorage = user.userId || user.id || '';
            const isValidUUID = (uuid) => {
                return uuid && uuid.length === 36 &&
                    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
            };

            const userId = isValidUUID(userIdFromStorage)
                ? userIdFromStorage
                : '55555555-5555-5555-5555-555555555555';

            let maintenanceData = {
                municipalityId: isEditing ? maintenance.municipalityId : municipalityId,
                maintenanceCode: formData.maintenanceCode.trim(),
                assetId: formData.assetId,
                maintenanceType: formData.maintenanceType,
                priority: formData.priority,
                scheduledDate: formData.scheduledDate,
                workDescription: formData.workDescription.trim(),
                reportedProblem: formData.reportedProblem.trim() || null, // ⭐ Campo nuevo (opcional)
                observations: formData.observations.trim(),
                technicalResponsibleId: formData.technicalResponsibleId,
                laborCost: formData.hasCosts ? parseFloat(formData.laborCost) || 0 : 0,
                partsCost: formData.hasCosts ? parseFloat(formData.partsCost) || 0 : 0,
                hasWarranty: formData.hasWarranty,
                requestedBy: isEditing ? maintenance.requestedBy : userId,
            };

            if (formData.serviceSupplierId) {
                maintenanceData.serviceSupplierId = formData.serviceSupplierId;
            }

            if (isEditing) {
                if (maintenance.attachedDocuments && maintenance.attachedDocuments.length > 0) {
                    maintenanceData.attachedDocuments = maintenance.attachedDocuments;
                } else if (formData.imageUrl?.trim()) {
                    maintenanceData.attachedDocuments = [{
                        fileUrl: formData.imageUrl.trim()
                    }];
                } else {
                    maintenanceData.attachedDocuments = [];
                }
            } else {
                if (formData.imageUrl?.trim()) {
                    maintenanceData.attachedDocuments = [{
                        fileUrl: formData.imageUrl.trim()
                    }];
                } else {
                    maintenanceData.attachedDocuments = [];
                }
            }

            if (formData.hasWarranty) {
                if (!formData.warrantyExpirationDate) {
                    throw new Error('La fecha de expiración de garantía es obligatoria cuando tiene garantía');
                }
                maintenanceData.warrantyExpirationDate = formData.warrantyExpirationDate;
            }

            if (isEditing) {
                maintenanceData.isScheduled = maintenance.isScheduled;
                maintenanceData.maintenanceStatus = maintenance.maintenanceStatus;
                maintenanceData.updatedBy = userId;
            } else {
                maintenanceData.isScheduled = true;
                maintenanceData.maintenanceStatus = 'SCHEDULED';
            }

            await onSubmit(maintenanceData);
        } catch (error) {
            console.error('❌ Error en handleSubmit:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col border border-gray-100 animate-fadeInScale">
                {/* Header - Orange */}
                <div className="px-8 py-6 border-b border-orange-100 flex-shrink-0 flex justify-between items-center bg-orange-600 rounded-t-3xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">
                                {isEditing ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento'}
                            </h2>
                            <p className="text-orange-100 text-sm mt-1">
                                {isEditing ? 'Actualiza la información del mantenimiento' : 'Completa los datos para crear un nuevo mantenimiento'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-all duration-200"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8 overflow-y-auto flex-1 bg-white" style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}>
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Sección: Información Básica */}
                        <div className="bg-white rounded-2xl p-6 border-l-4 border-l-orange-500 border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </span>
                                Información Básica
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                                        Código <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="maintenanceCode"
                                        value={formData.maintenanceCode}
                                        readOnly
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-500 font-mono text-sm cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                                        Activo <span className="text-red-500">*</span>
                                    </label>
                                    {loadingAssets ? (
                                        <div className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl flex items-center gap-3">
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                                            <span className="text-sm font-medium text-gray-600">Cargando activos...</span>
                                        </div>
                                    ) : assets.length === 0 ? (
                                        <div className="w-full px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                                            <p className="text-sm text-red-600 font-medium">⚠️ No se pudieron cargar los activos</p>
                                            <p className="text-xs text-red-500 mt-1">Verifica que el servicio MS-04 esté activo en el puerto 5003</p>
                                        </div>
                                    ) : (
                                        <select
                                            name="assetId"
                                            value={formData.assetId}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm appearance-none cursor-pointer"
                                        >
                                            <option value="">Seleccione un activo</option>
                                            {assets.map((asset) => (
                                                <option key={asset.id} value={asset.id}>
                                                    {asset.assetCode} - {asset.description || 'Sin descripción'}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                                        Tipo <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="maintenanceType"
                                        value={formData.maintenanceType}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm appearance-none"
                                    >
                                        {Object.entries(MAINTENANCE_TYPES).map(([key, value]) => (
                                            <option key={key} value={value}>
                                                {MAINTENANCE_TYPE_LABELS[value]}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                                        Prioridad <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm appearance-none"
                                    >
                                        {Object.entries(PRIORITIES).map(([key, value]) => (
                                            <option key={key} value={value}>
                                                {PRIORITY_LABELS[value]}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                                        Fecha Programada <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="scheduledDate"
                                        value={formData.scheduledDate}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sección: Descripción */}
                        <div className="bg-white rounded-2xl p-6 border-l-4 border-l-orange-500 border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                    </svg>
                                </span>
                                Detalles del Trabajo
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                                        Descripción <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="workDescription"
                                        value={formData.workDescription}
                                        onChange={handleChange}
                                        required
                                        rows={3}
                                        placeholder="Describe el trabajo a realizar..."
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm resize-none"
                                    />
                                </div>

                                {/* ⭐ Campo Nuevo: Problema Reportado */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                                        Problema Reportado <span className="text-gray-400 text-xs normal-case">(Opcional)</span>
                                    </label>
                                    <textarea
                                        name="reportedProblem"
                                        value={formData.reportedProblem}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Ej: Filtro obstruido y vibración anormal detectada"
                                        className="w-full px-4 py-3 bg-amber-50/50 border border-amber-100 rounded-xl text-slate-900 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm resize-none"
                                    />
                                    <p className="text-xs text-amber-600 mt-2 ml-1 font-medium flex items-center gap-1.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Describe el problema que motivó este mantenimiento
                                    </p>
                                </div>

                                {!isEditing && (
                                    <div className="space-y-4">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                                            Evidencia Fotográfica <span className="text-red-500">*</span>
                                        </label>

                                        {/* Selector de archivo */}
                                        <div className="flex gap-3">
                                            <label className="flex-1 cursor-pointer">
                                                <div className="w-full px-4 py-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-xl text-blue-700 hover:border-blue-500 hover:bg-blue-100 transition-all text-sm font-medium text-center flex items-center justify-center gap-2">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {selectedFile ? selectedFile.name : 'Seleccionar imagen'}
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileSelect}
                                                    className="hidden"
                                                />
                                            </label>

                                            <button
                                                type="button"
                                                onClick={handleFileUpload}
                                                disabled={!selectedFile || uploadingFile}
                                                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                                            >
                                                {uploadingFile ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                                        Subiendo...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                        </svg>
                                                        Subir
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* Preview de la imagen */}
                                        {(filePreview || formData.imageUrl) && (
                                            <div className="relative rounded-xl overflow-hidden bg-gray-50 border border-gray-200 h-64 shadow-inner">
                                                <img
                                                    src={filePreview || formData.imageUrl}
                                                    alt="Preview"
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-red-500"><span>Error al cargar imagen</span></div>';
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* URL generada (solo lectura) */}
                                        {formData.imageUrl && (
                                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                                <label className="block text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
                                                    ✅ URL Generada
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.imageUrl}
                                                    readOnly
                                                    className="w-full px-3 py-2 bg-white border border-green-300 rounded-lg text-xs text-green-800 font-mono cursor-text select-all"
                                                    onClick={(e) => e.target.select()}
                                                />
                                                <p className="text-xs text-green-600 mt-2 font-medium">La imagen ha sido subida exitosamente a Supabase Storage</p>
                                            </div>
                                        )}

                                        {!formData.imageUrl && (
                                            <p className="text-xs text-amber-600 font-medium flex items-center gap-1.5">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Selecciona y sube una imagen para generar la URL automáticamente
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sección: Observaciones */}
                        <div className="bg-white rounded-2xl p-6 border-l-4 border-l-orange-500 border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                    </svg>
                                </span>
                                Observaciones
                            </h3>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                                    Notas Adicionales <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="observations"
                                    value={formData.observations}
                                    onChange={handleChange}
                                    required
                                    rows={3}
                                    placeholder="Observaciones importantes..."
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm resize-none"
                                />
                            </div>
                        </div>

                        {/* Sección: Responsables */}
                        <div className="bg-white rounded-2xl p-6 border-l-4 border-l-orange-500 border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </span>
                                Responsables
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                                        Técnico Responsable <span className="text-red-500">*</span>
                                    </label>
                                    {loadingUsers ? (
                                        <div className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl flex items-center gap-3">
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-600 border-t-transparent"></div>
                                            <span className="text-sm font-medium text-gray-600">Cargando usuarios...</span>
                                        </div>
                                    ) : users.length === 0 ? (
                                        <div className="w-full px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                                            <p className="text-sm text-red-600 font-medium">⚠️ No se pudieron cargar los usuarios</p>
                                            <p className="text-xs text-red-500 mt-1">Verifica que el servicio MS-02 esté activo en el puerto 5002</p>
                                        </div>
                                    ) : (
                                        <select
                                            name="technicalResponsibleId"
                                            value={formData.technicalResponsibleId}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm appearance-none cursor-pointer"
                                        >
                                            <option value="">Seleccione un técnico</option>
                                            {users.map((user) => (
                                                <option key={user.id} value={user.id}>
                                                    {user.fullName || user.username || user.email || 'Usuario'}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="hasSupplier"
                                            checked={formData.hasSupplier}
                                            onChange={handleChange}
                                            className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded-lg transition-all"
                                        />
                                        <label className="ml-3 block text-sm font-medium text-slate-700">
                                            Asignar Proveedor Externo
                                        </label>
                                    </div>

                                    {formData.hasSupplier && (
                                        loadingSuppliers ? (
                                            <div className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl flex items-center gap-3">
                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-600 border-t-transparent"></div>
                                                <span className="text-sm font-medium text-gray-600">Cargando proveedores...</span>
                                            </div>
                                        ) : suppliers.length === 0 ? (
                                            <div className="w-full px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                                                <p className="text-sm text-red-600 font-medium">⚠️ No se pudieron cargar los proveedores</p>
                                                <p className="text-xs text-red-500 mt-1">Verifica que el servicio MS-04 esté activo en el puerto 5004</p>
                                            </div>
                                        ) : (
                                            <select
                                                name="serviceSupplierId"
                                                value={formData.serviceSupplierId}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm appearance-none cursor-pointer"
                                            >
                                                <option value="">Seleccione un proveedor</option>
                                                {suppliers.map((supplier) => (
                                                    <option key={supplier.id} value={supplier.id}>
                                                        {supplier.businessName || supplier.name}
                                                    </option>
                                                ))}
                                            </select>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sección: Costos y Garantía */}
                        <div className="bg-white rounded-2xl p-6 border-l-4 border-l-orange-500 border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </span>
                                Costos y Garantía
                            </h3>

                            <div className="space-y-6">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="hasCosts"
                                        checked={formData.hasCosts}
                                        onChange={handleChange}
                                        className="h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded-lg transition-all"
                                    />
                                    <label className="ml-3 block text-sm font-medium text-slate-700">
                                        Registrar Costos Estimados
                                    </label>
                                </div>

                                {formData.hasCosts && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                                                Mano de Obra
                                            </label>
                                            <input
                                                type="number"
                                                name="laborCost"
                                                value={formData.laborCost}
                                                onChange={handleChange}
                                                min="0"
                                                step="0.01"
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                                                Repuestos
                                            </label>
                                            <input
                                                type="number"
                                                name="partsCost"
                                                value={formData.partsCost}
                                                onChange={handleChange}
                                                min="0"
                                                step="0.01"
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="border-t border-gray-100 pt-6">
                                    <div className="flex items-center mb-4">
                                        <input
                                            type="checkbox"
                                            name="hasWarranty"
                                            checked={formData.hasWarranty}
                                            onChange={handleChange}
                                            className="h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded-lg transition-all"
                                        />
                                        <label className="ml-3 block text-sm font-medium text-slate-700">
                                            Tiene Garantía
                                        </label>
                                    </div>

                                    {formData.hasWarranty && (
                                        <div className="pl-8">
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                                                Fecha de Expiración <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                name="warrantyExpirationDate"
                                                value={formData.warrantyExpirationDate}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl text-slate-600 font-medium hover:bg-gray-200/50 transition-all duration-200"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-8 py-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Mantenimiento')}
                    </button>
                </div>
            </div>
        </div>
    );
}

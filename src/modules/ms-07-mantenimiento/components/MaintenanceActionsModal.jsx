import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import supplierService from '../services/supplierService';
import userService from '../services/userService';
import { uploadFile } from '../../../shared/utils/supabaseStorage';

export default function MaintenanceActionsModal({ isOpen, onClose, onSubmit, action, maintenance, existingMaintenances = [] }) {
    const [formData, setFormData] = useState({
        observations: '',
        nextDate: '',
        workOrder: '',
        laborCost: 0,
        partsCost: 0,
        appliedSolution: '',
        technicalResponsibleId: '',
        serviceSupplierId: '',
        updatedBy: '',
        receiptImageUrl: '', // URL de la imagen del recibo/voucher al completar
    });

    const [users, setUsers] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);
    const [usersAvailable, setUsersAvailable] = useState(true);
    const [suppliersAvailable, setSuppliersAvailable] = useState(true);
    const [receiptFile, setReceiptFile] = useState(null);
    const [uploadingReceipt, setUploadingReceipt] = useState(false);

    useEffect(() => {
        if (isOpen && action === 'reschedule') {
            loadUsers();
            loadSuppliers();
        }

        // Generar código correlativo WO cuando se abre el modal de completar
        if (isOpen && action === 'complete') {
            const generateWorkOrderCode = () => {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const datePrefix = `WO-${year}-${month}-${day}`;

                // Filtrar órdenes de trabajo del mismo día
                const todayWorkOrders = existingMaintenances.filter(m =>
                    m.workOrder && m.workOrder.startsWith(datePrefix)
                );

                // Obtener el último número correlativo del día
                let maxCorrelative = 0;
                todayWorkOrders.forEach(m => {
                    const match = m.workOrder.match(/-(\d{3})$/);
                    if (match) {
                        const num = parseInt(match[1], 10);
                        if (num > maxCorrelative) {
                            maxCorrelative = num;
                        }
                    }
                });

                // Incrementar el correlativo
                const newCorrelative = String(maxCorrelative + 1).padStart(3, '0');
                return `${datePrefix}-${newCorrelative}`;
            };

            const newWorkOrder = generateWorkOrderCode();
            setFormData(prev => ({
                ...prev,
                workOrder: newWorkOrder
            }));
        }
    }, [isOpen, action, existingMaintenances]);

    const loadUsers = async () => {
        try {
            setLoadingUsers(true);
            const data = await userService.getAllUsers();
            setUsers(Array.isArray(data) ? data : []);
            setUsersAvailable(true);
        } catch (error) {
            console.warn('Servicio de usuarios no disponible:', error);
            setUsers([]);
            setUsersAvailable(false);
        } finally {
            setLoadingUsers(false);
        }
    };

    const loadSuppliers = async () => {
        try {
            setLoadingSuppliers(true);
            const data = await supplierService.getAllSuppliers();
            setSuppliers(Array.isArray(data) ? data : []);
            setSuppliersAvailable(true);
        } catch (error) {
            console.warn('Servicio de proveedores no disponible:', error);
            setSuppliers([]);
            setSuppliersAvailable(false);
        } finally {
            setLoadingSuppliers(false);
        }
    };

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const MAX_SIZE_MB = 5;
    const ALLOWED_TYPES = [
        'image/jpeg', 'image/png', 'image/webp', 'image/jpg',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const handleReceiptSelect = (e) => {
        const file = e.target.files?.[0] || null;
        if (!file) { setReceiptFile(null); return; }
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > MAX_SIZE_MB) {
            alert(`El archivo supera ${MAX_SIZE_MB} MB. Reduce el tamaño.`);
            e.target.value = '';
            return;
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
            alert('Tipo de archivo no permitido. Usa imagen o PDF/DOC/DOCX.');
            e.target.value = '';
            return;
        }
        setReceiptFile(file);
    };

    const uploadReceiptToSupabase = async () => {
        if (!receiptFile) return;
        try {
            setUploadingReceipt(true);
            const codeSafe = (formData.workOrder || 'RECIBO').replace(/[^A-Za-z0-9_-]/g, '-');
            const folder = `mantenimientos/${codeSafe}`;
            const result = await uploadFile(receiptFile, folder);
            if (result && result.url) {
                setFormData(prev => ({ ...prev, receiptImageUrl: result.url }));
                Swal.fire({
                    icon: 'success',
                    title: '¡Archivo subido correctamente!',
                    text: 'El recibo se ha cargado exitosamente',
                    confirmButtonColor: '#10b981',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        } catch (err) {
            console.error('❌ Error subiendo recibo a Supabase:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error al subir archivo',
                text: 'No se pudo subir el archivo. Verifica configuración de Supabase.',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setUploadingReceipt(false);
        }
    };

    const getTitle = () => {
        switch (action) {
            case 'start': return 'Iniciar Mantenimiento';
            case 'complete': return 'Completar Mantenimiento';
            case 'suspend': return 'Suspender Mantenimiento';
            case 'reschedule': return 'Reprogramar Mantenimiento';
            case 'cancel': return 'Cancelar Mantenimiento';
            default: return 'Acción';
        }
    };

    const getIcon = () => {
        switch (action) {
            case 'start':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />;
            case 'complete':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />;
            case 'suspend':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />;
            case 'reschedule':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />;
            case 'cancel':
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />;
            default:
                return null;
        }
    };

    const getColorClasses = () => {
        switch (action) {
            case 'start':
                return {
                    button: 'bg-blue-600 hover:bg-blue-700',
                    ring: 'focus:ring-blue-500',
                };
            case 'complete':
                return {
                    button: 'bg-green-600 hover:bg-green-700',
                    ring: 'focus:ring-green-500',
                };
            case 'suspend':
                return {
                    button: 'bg-yellow-500 hover:bg-yellow-600',
                    ring: 'focus:ring-yellow-500',
                };
            case 'reschedule':
                return {
                    button: 'bg-purple-600 hover:bg-purple-700',
                    ring: 'focus:ring-purple-500',
                };
            case 'cancel':
                return {
                    button: 'bg-red-600 hover:bg-red-700',
                    ring: 'focus:ring-red-500',
                };
            default:
                return {
                    button: 'bg-gray-800 hover:bg-gray-900',
                    ring: 'focus:ring-gray-500',
                };
        }
    };

    const colorClasses = getColorClasses();

    // Obtener colores del encabezado según la acción
    const getHeaderColors = () => {
        switch (action) {
            case 'start':
                return 'bg-blue-600';
            case 'complete':
                return 'bg-green-600';
            case 'suspend':
                return 'bg-yellow-500';
            case 'reschedule':
                return 'bg-purple-600';
            case 'cancel':
                return 'bg-red-600';
            default:
                return 'bg-gray-600';
        }
    };

    const getHeaderTextColor = () => {
        switch (action) {
            case 'start':
                return 'text-blue-100';
            case 'complete':
                return 'text-green-100';
            case 'suspend':
                return 'text-yellow-100';
            case 'reschedule':
                return 'text-purple-100';
            case 'cancel':
                return 'text-red-100';
            default:
                return 'text-gray-100';
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-100 animate-fadeInScale">
                {/* Header - Dynamic Color */}
                <div className={`px-8 py-6 border-b border-white/20 flex-shrink-0 flex justify-between items-center ${getHeaderColors()} rounded-t-3xl`}>
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-inner">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {getIcon()}
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">{getTitle()}</h2>
                            <p className={`${getHeaderTextColor()} font-mono text-sm mt-1`}>{maintenance?.maintenanceCode}</p>
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

                {/* Form - Scrollable */}
                <div className="flex-1 overflow-y-auto p-8 bg-white" style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}>

                    {/* ⭐ Información del Mantenimiento - Mostrar reportedProblem si existe */}
                    {maintenance?.reportedProblem && (
                        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 animate-fadeIn">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wide mb-2">
                                        Problema Reportado
                                    </h4>
                                    <p className="text-sm text-amber-800 leading-relaxed">
                                        {maintenance.reportedProblem}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Iniciar */}
                        {action === 'start' && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 ml-1">
                                    Observaciones (Opcional)
                                </label>
                                <textarea
                                    name="observations"
                                    value={formData.observations}
                                    onChange={handleChange}
                                    rows={4}
                                    className={`w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 placeholder-gray-400 focus:ring-2 ${colorClasses.ring} transition-all resize-none`}
                                    placeholder="Ej: Técnico Juan Pérez inició el trabajo"
                                />
                            </div>
                        )}

                        {/* Completar */}
                        {action === 'complete' && (
                            <>
                                <div className="bg-green-50/50 rounded-2xl p-6 border border-green-100">
                                    <label className="flex items-center gap-2 text-sm font-bold text-green-800 mb-3 uppercase tracking-wide">
                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                        </svg>
                                        Orden de Trabajo
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="workOrder"
                                            value={formData.workOrder}
                                            readOnly
                                            required
                                            className="w-full px-4 py-3 border-none rounded-xl bg-white text-green-900 font-mono font-bold text-lg shadow-sm cursor-not-allowed"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="text-xs text-green-700 mt-2 flex items-center gap-1.5 font-medium ml-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Generado automáticamente
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 ml-1">
                                            Costo Mano de Obra <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                            <input
                                                type="number"
                                                name="laborCost"
                                                value={formData.laborCost}
                                                onChange={handleChange}
                                                required
                                                min="0"
                                                step="0.01"
                                                className={`w-full pl-8 pr-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 font-semibold focus:ring-2 ${colorClasses.ring} transition-all`}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 ml-1">
                                            Costo Repuestos <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                            <input
                                                type="number"
                                                name="partsCost"
                                                value={formData.partsCost}
                                                onChange={handleChange}
                                                required
                                                min="0"
                                                step="0.01"
                                                className={`w-full pl-8 pr-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 font-semibold focus:ring-2 ${colorClasses.ring} transition-all`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 ml-1">
                                        Solución Aplicada <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="appliedSolution"
                                        value={formData.appliedSolution}
                                        onChange={handleChange}
                                        required
                                        rows={3}
                                        className={`w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 placeholder-gray-400 focus:ring-2 ${colorClasses.ring} transition-all resize-none`}
                                        placeholder="Describe la solución aplicada..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 ml-1">
                                        Recibo/Voucher (Imagen/Documento)
                                    </label>
                                    <div className="rounded-2xl border border-dashed border-green-200 bg-green-50/40 p-4">
                                        <div className="flex items-center gap-3">
                                            <label className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 cursor-pointer">
                                                Seleccionar archivo
                                                <input
                                                    type="file"
                                                    accept="image/*,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                                                    onChange={handleReceiptSelect}
                                                    className="hidden"
                                                />
                                            </label>
                                            <div className="flex-1 text-sm text-slate-600 truncate">
                                                {receiptFile ? receiptFile.name : 'Ningún archivo seleccionado'}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={uploadReceiptToSupabase}
                                                disabled={!receiptFile || uploadingReceipt}
                                                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
                                            >
                                                {uploadingReceipt ? 'Subiendo…' : 'Subir a Supabase'}
                                            </button>
                                        </div>
                                        {formData.receiptImageUrl && (
                                            <div className="mt-4 flex items-center justify-between">
                                                <span className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-medium">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                                    Archivo subido
                                                </span>
                                                <a href={formData.receiptImageUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 text-xs font-medium hover:underline">
                                                    Ver archivo
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 ml-1">
                                        Observaciones (Opcional)
                                    </label>
                                    <textarea
                                        name="observations"
                                        value={formData.observations}
                                        onChange={handleChange}
                                        rows={2}
                                        className={`w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 placeholder-gray-400 focus:ring-2 ${colorClasses.ring} transition-all resize-none`}
                                        placeholder="Observaciones adicionales..."
                                    />
                                </div>
                            </>
                        )}

                        {/* Suspender */}
                        {action === 'suspend' && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 ml-1">
                                        Próxima Fecha <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="nextDate"
                                        value={formData.nextDate}
                                        onChange={handleChange}
                                        required
                                        className={`w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 ${colorClasses.ring} transition-all`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 ml-1">
                                        Motivo de Suspensión <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="observations"
                                        value={formData.observations}
                                        onChange={handleChange}
                                        required
                                        rows={4}
                                        className={`w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 placeholder-gray-400 focus:ring-2 ${colorClasses.ring} transition-all resize-none`}
                                        placeholder="Ej: Falta de repuestos. Se espera llegada de material"
                                    />
                                </div>
                            </>
                        )}

                        {/* Reprogramar */}
                        {action === 'reschedule' && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 ml-1">
                                        Nueva Fecha <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="nextDate"
                                        value={formData.nextDate}
                                        onChange={handleChange}
                                        required
                                        className={`w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 ${colorClasses.ring} transition-all`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 ml-1">
                                        Responsable Técnico (Opcional)
                                    </label>
                                    {loadingUsers ? (
                                        <div className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl flex items-center gap-3">
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-600 border-t-transparent"></div>
                                            <span className="text-sm font-medium text-gray-600">Cargando usuarios...</span>
                                        </div>
                                    ) : usersAvailable && users.length > 0 ? (
                                        <div className="relative">
                                            <select
                                                name="technicalResponsibleId"
                                                value={formData.technicalResponsibleId}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 appearance-none focus:ring-2 ${colorClasses.ring} transition-all`}
                                            >
                                                <option value="">Mantener técnico actual (Opcional)</option>
                                                {users.map((user) => (
                                                    <option key={user.id} value={user.id}>
                                                        {user.username} - {user.personId?.substring(0, 8)}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                type="text"
                                                name="technicalResponsibleId"
                                                value={formData.technicalResponsibleId}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 ${colorClasses.ring} transition-all`}
                                                placeholder="UUID del responsable técnico (opcional)"
                                            />
                                            <p className="text-xs text-slate-400 mt-2 ml-1 font-medium">
                                                Opcional - Dejar vacío para mantener el actual
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 ml-1">
                                        Proveedor de Servicio (Opcional)
                                    </label>
                                    {loadingSuppliers ? (
                                        <div className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl flex items-center gap-3">
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-600 border-t-transparent"></div>
                                            <span className="text-sm font-medium text-gray-600">Cargando proveedores...</span>
                                        </div>
                                    ) : suppliersAvailable && suppliers.length > 0 ? (
                                        <div className="relative">
                                            <select
                                                name="serviceSupplierId"
                                                value={formData.serviceSupplierId}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 appearance-none focus:ring-2 ${colorClasses.ring} transition-all`}
                                            >
                                                <option value="">Mantener proveedor actual (Opcional)</option>
                                                {suppliers.map((supplier) => (
                                                    <option key={supplier.id} value={supplier.id}>
                                                        {supplier.name} - {supplier.ruc}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                type="text"
                                                name="serviceSupplierId"
                                                value={formData.serviceSupplierId}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 ${colorClasses.ring} transition-all`}
                                                placeholder="UUID del proveedor (opcional)"
                                            />
                                            <p className="text-xs text-slate-400 mt-2 ml-1 font-medium">
                                                Opcional - Dejar vacío para mantener el actual
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 ml-1">
                                        Actualizado Por <span className="text-red-500">*</span>
                                    </label>
                                    {loadingUsers ? (
                                        <div className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl flex items-center gap-3">
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-600 border-t-transparent"></div>
                                            <span className="text-sm font-medium text-gray-600">Cargando usuarios...</span>
                                        </div>
                                    ) : usersAvailable && users.length > 0 ? (
                                        <div className="relative">
                                            <select
                                                name="updatedBy"
                                                value={formData.updatedBy}
                                                onChange={handleChange}
                                                required
                                                className={`w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 appearance-none focus:ring-2 ${colorClasses.ring} transition-all`}
                                            >
                                                <option value="">Seleccione el usuario que actualiza</option>
                                                {users.map((user) => (
                                                    <option key={user.id} value={user.id}>
                                                        {user.username} - {user.personId?.substring(0, 8)}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                type="text"
                                                name="updatedBy"
                                                value={formData.updatedBy}
                                                onChange={handleChange}
                                                required
                                                className={`w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 ${colorClasses.ring} transition-all`}
                                                placeholder="UUID del usuario"
                                            />
                                            <p className="text-xs text-slate-400 mt-2 ml-1 font-medium">
                                                Servicio no disponible - Ingrese el UUID manualmente
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 ml-1">
                                        Observaciones (Opcional)
                                    </label>
                                    <textarea
                                        name="observations"
                                        value={formData.observations}
                                        onChange={handleChange}
                                        rows={2}
                                        className={`w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 placeholder-gray-400 focus:ring-2 ${colorClasses.ring} transition-all resize-none`}
                                        placeholder="Ej: Repuestos recibidos. Se reprograma el mantenimiento"
                                    />
                                </div>
                            </>
                        )}

                        {/* Cancelar */}
                        {action === 'cancel' && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 ml-1">
                                    Motivo de Cancelación <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="observations"
                                    value={formData.observations}
                                    onChange={handleChange}
                                    required
                                    rows={4}
                                    className={`w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 placeholder-gray-400 focus:ring-2 ${colorClasses.ring} transition-all resize-none`}
                                    placeholder="Ej: Activo dado de baja. Ya no requiere mantenimiento"
                                />
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="pt-6 mt-6 border-t border-gray-100">
                            <button
                                type="submit"
                                className={`w-full px-6 py-4 ${colorClasses.button} text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2`}
                            >
                                <span>Confirmar Acción</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

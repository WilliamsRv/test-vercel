import { useCallback, useEffect, useState } from 'react';
import {
    MAINTENANCE_TYPE_LABELS,
    PRIORITY_LABELS,
    STATUS_LABELS,
} from '../constants/maintenance.constants';
import assetService from '../services/assetService';
import supplierService from '../services/supplierService';
import userService from '../services/userService';

export default function MaintenanceDetailModal({ isOpen, onClose, maintenance }) {
    const [assetName, setAssetName] = useState(null);
    const [technicalResponsibleName, setTechnicalResponsibleName] = useState(null);
    const [supplierName, setSupplierName] = useState(null);
    const [requestedByName, setRequestedByName] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadReferences = useCallback(async () => {
        if (!maintenance) return;
        setLoading(true);


        if (maintenance.assetId) {
            try {
                const assets = await assetService.getAllAssets();
                const asset = assets.find(a => a.id === maintenance.assetId);
                if (asset) {
                    setAssetName(`${asset.assetCode} - ${asset.description}`);
                }
            } catch (error) {
                console.warn('Error loading asset:', error);
            }
        }

        try {
            const users = await userService.getAllUsers();

            if (maintenance.technicalResponsibleId) {
                const tech = users.find(u => u.id === maintenance.technicalResponsibleId);
                if (tech) setTechnicalResponsibleName(tech.username);
            }

            if (maintenance.requestedBy) {
                const requester = users.find(u => u.id === maintenance.requestedBy);
                if (requester) setRequestedByName(requester.username);
            }

            // Updated by name not currently displayed in UI
            // if (maintenance.updatedBy) {
            //     const updater = users.find(u => u.id === maintenance.updatedBy);
            //     if (updater) setUpdatedByName(updater.username);
            // }
        } catch (error) {
            console.warn('Error loading users:', error);
        }

        if (maintenance.serviceSupplierId) {
            try {
                const suppliers = await supplierService.getAllSuppliers();
                const supplier = suppliers.find(s => s.id === maintenance.serviceSupplierId);
                if (supplier) {
                    setSupplierName(supplier.name || supplier.businessName);
                }
            } catch (error) {
                console.warn('Error loading supplier:', error);
            }
        }

        setLoading(false);
    }, [maintenance]);

    useEffect(() => {
        if (isOpen && maintenance) {
            loadReferences();
        }
    }, [isOpen, maintenance, loadReferences]);

    if (!isOpen || !maintenance) return null;

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatDateTime = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '-';
        return `$${parseFloat(amount).toFixed(2)}`;
    };

    const parseObservationsHistory = (observations) => {
        if (!observations) return null;

        const historyRegex = /\[([^\]]+)\]\s*([^:]+):\s*([^[]+)/g;
        const entries = [];
        let match;

        while ((match = historyRegex.exec(observations)) !== null) {
            entries.push({
                timestamp: match[1].trim(),
                status: match[2].trim(),
                description: match[3].trim()
            });
        }

        if (entries.length > 0) {
            entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            return entries;
        }

        return null;
    };

    const formatHistoryDate = (timestamp) => {
        if (!timestamp) return '-';
        const date = new Date(timestamp);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        const statusLower = status.toLowerCase();
        if (statusLower.includes('iniciado') || statusLower.includes('in_progress')) return 'blue';
        if (statusLower.includes('completado') || statusLower.includes('completed')) return 'green';
        if (statusLower.includes('suspendido') || statusLower.includes('suspended')) return 'yellow';
        if (statusLower.includes('reprogramado') || statusLower.includes('rescheduled')) return 'purple';
        if (statusLower.includes('cancelado') || statusLower.includes('cancelled')) return 'red';
        return 'gray';
    };

    const observationsHistory = parseObservationsHistory(maintenance.observations);

    return (
        <div className="fixed inset-0 bg-gray-900/75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col border border-gray-100 animate-fadeInScale">
                {/* Header - Orange */}
                <div className="px-8 py-6 border-b border-orange-100 flex-shrink-0 flex justify-between items-start bg-orange-600 rounded-t-3xl">
                    <div className="flex items-start gap-5">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-inner">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Detalle del Mantenimiento</h2>
                            <p className="text-orange-100 font-mono text-sm mt-1">{maintenance.maintenanceCode}</p>
                            {assetName && (
                                <p className="text-orange-100 text-sm mt-1 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    {assetName}
                                </p>
                            )}
                            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold uppercase tracking-wide">
                                {STATUS_LABELS[maintenance.maintenanceStatus]}
                            </div>
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

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white" style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}>

                    {/* Información General */}
                    <section>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
                            Información General
                        </h3>
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tipo</label>
                                    <p className="text-sm font-semibold text-slate-900 mt-1">{MAINTENANCE_TYPE_LABELS[maintenance.maintenanceType]}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Prioridad</label>
                                    <p className="text-sm font-semibold text-slate-900 mt-1">{PRIORITY_LABELS[maintenance.priority]}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Programado</label>
                                    <p className="text-sm font-semibold text-slate-900 mt-1">{maintenance.isScheduled ? 'Sí' : 'No'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Orden de Trabajo</label>
                                    <p className="text-sm font-semibold text-slate-900 mt-1">{maintenance.workOrder || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Referencias */}
                    <section>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
                            Referencias
                        </h3>
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Activo</label>
                                    {loading ? (
                                        <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4 mt-1"></div>
                                    ) : (
                                        <p className="text-sm font-semibold text-slate-900 mt-1">{assetName || maintenance.assetId}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Responsable Técnico</label>
                                    {loading ? (
                                        <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2 mt-1"></div>
                                    ) : (
                                        <p className="text-sm font-semibold text-slate-900 mt-1">{technicalResponsibleName || maintenance.technicalResponsibleId || '-'}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Proveedor</label>
                                    {loading ? (
                                        <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2 mt-1"></div>
                                    ) : (
                                        <p className="text-sm font-semibold text-slate-900 mt-1">{supplierName || maintenance.serviceSupplierId || '-'}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Solicitado Por</label>
                                    {loading ? (
                                        <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2 mt-1"></div>
                                    ) : (
                                        <p className="text-sm font-semibold text-slate-900 mt-1">{requestedByName || maintenance.requestedBy || '-'}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Fechas */}
                    <section>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
                            Cronograma
                        </h3>
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Programada</label>
                                    <p className="text-sm font-semibold text-slate-900 mt-1">{formatDate(maintenance.scheduledDate)}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Inicio</label>
                                    <p className="text-sm font-semibold text-slate-900 mt-1">{formatDateTime(maintenance.startDate)}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Fin</label>
                                    <p className="text-sm font-semibold text-slate-900 mt-1">{formatDateTime(maintenance.endDate)}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Descripción del Trabajo */}
                    <section>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
                            Detalles del Trabajo
                        </h3>
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-6">
                            <div>
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">Descripción</label>
                                <p className="text-sm text-slate-900 leading-relaxed bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    {maintenance.workDescription || '-'}
                                </p>
                            </div>
                            {/* ⭐ Campo Nuevo: Problema Reportado */}
                            {maintenance.reportedProblem && (
                                <div>
                                    <label className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        Problema Reportado
                                    </label>
                                    <p className="text-sm text-slate-900 leading-relaxed bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm">
                                        {maintenance.reportedProblem}
                                    </p>
                                </div>
                            )}
                            {maintenance.appliedSolution && (
                                <div>
                                    <label className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Solución Aplicada
                                    </label>
                                    <p className="text-sm text-slate-900 leading-relaxed bg-green-50 p-4 rounded-xl border border-green-200 shadow-sm">
                                        {maintenance.appliedSolution}
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Historial de Observaciones - Timeline */}
                    {observationsHistory && (
                        <section>
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
                                Historial
                            </h3>
                            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                                <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
                                    {observationsHistory.map((entry, index) => {
                                        const color = getStatusColor(entry.status);
                                        const dotColors = {
                                            blue: 'bg-blue-500 border-blue-100',
                                            green: 'bg-green-500 border-green-100',
                                            yellow: 'bg-yellow-500 border-yellow-100',
                                            purple: 'bg-purple-500 border-purple-100',
                                            red: 'bg-red-500 border-red-100',
                                            gray: 'bg-gray-500 border-gray-100'
                                        };
                                        const dotClass = dotColors[color] || dotColors.gray;

                                        return (
                                            <div key={index} className="relative pl-8">
                                                <div className={`absolute -left-[9px] top-0 w-5 h-5 rounded-full border-4 ${dotClass}`}></div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="text-sm font-bold text-slate-900">{entry.status}</span>
                                                        <span className="text-xs text-gray-400 font-medium">{formatHistoryDate(entry.timestamp)}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 bg-white p-3 rounded-xl border border-gray-100 shadow-sm inline-block">
                                                        {entry.description}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Costos */}
                    {(maintenance.laborCost > 0 || maintenance.partsCost > 0) && (
                        <section>
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
                                Costos
                            </h3>
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Mano de Obra</label>
                                        <p className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(maintenance.laborCost)}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Repuestos</label>
                                        <p className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(maintenance.partsCost)}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total</label>
                                        <p className="text-xl font-bold text-amber-600 mt-1">{formatCurrency(maintenance.totalCost)}</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Imágenes de Evidencia */}
                    {maintenance.attachedDocuments && maintenance.attachedDocuments.length > 0 && (
                        <section>
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
                                Evidencia
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {maintenance.attachedDocuments.map((doc, index) => (
                                    <div key={index} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="mb-3 flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                                {index === 0 ? 'Problema' : 'Documento'}
                                            </span>
                                            <span className="text-xs text-gray-400">• {formatDateTime(doc.uploadedAt)}</span>
                                        </div>
                                        <div className="relative rounded-xl overflow-hidden bg-gray-50 aspect-video mb-3 group cursor-pointer" onClick={() => window.open(doc.fileUrl, '_blank')}>
                                            <img
                                                src={doc.fileUrl}
                                                alt="Evidencia"
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                onError={(e) => e.target.style.display = 'none'}
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                <div className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur rounded-full p-3 transition-opacity shadow-lg">
                                                    <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                        <a
                                            href={doc.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full text-center py-2 rounded-lg bg-gray-50 text-slate-600 text-sm font-medium hover:bg-gray-100 transition-colors"
                                        >
                                            Ver Original
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}

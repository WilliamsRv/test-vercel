import { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  UserIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  EyeIcon,
  InformationCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import handoverReceiptService from '../../services/handoverReceiptService';

const statusConfig = {
  GENERATED: {
    label: 'Generado',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: DocumentTextIcon,
    bgColor: 'bg-blue-500'
  },
  PARTIALLY_SIGNED: {
    label: 'Parcialmente Firmado',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: ClockIcon,
    bgColor: 'bg-amber-500'
  },
  FULLY_SIGNED: {
    label: 'Completamente Firmado',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircleIcon,
    bgColor: 'bg-emerald-500'
  },
  VOIDED: {
    label: 'Anulado',
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: XCircleIcon,
    bgColor: 'bg-red-500'
  }
};

export default function HandoverReceiptDetails({ 
  receiptId, 
  municipalityId,
  users = [],
  movements = [],
  onClose, 
  onEdit, 
  onSign 
}) {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getUsernameById = (personId) => {
    if (!personId) return 'No asignado';
    const user = users.find(u => u.id === personId);
    return user ? user.username : 'No asignado';
  };

  const getMovementInfo = (movementId) => {
    if (!movementId) return 'N/A';
    const movement = movements.find(m => m.id === movementId);
    if (movement) {
      return `${movement.movementNumber} - ${movement.movementType || 'Sin tipo'}`;
    }
    return movementId.slice(-8); // Mostrar últimos 8 caracteres del ID si no se encuentra
  };

  useEffect(() => {
    if (receiptId && municipalityId) {
      loadReceiptDetails();
    }
  }, [receiptId, municipalityId]);

  const loadReceiptDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await handoverReceiptService.getHandoverReceiptById(receiptId, municipalityId);
      setReceipt(data);
    } catch (err) {
      setError('Error al cargar los detalles del acta');
      console.error('Error loading receipt details:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // Crear fecha directamente desde el string sin conversión de zona horaria
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleString('es-ES');
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.GENERATED;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold border-2 shadow-sm ${config.color}`}>
        <div className={`w-2.5 h-2.5 rounded-full ${config.bgColor} mr-2.5 animate-pulse`}></div>
        <IconComponent className="w-4 h-4 mr-2" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg relative">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-300"></div>
                <div className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-4 border-t-slate-700"></div>
                <div className="absolute inset-1.5 bg-white rounded-full opacity-30"></div>
                <svg className="absolute inset-4 h-4 w-4 text-slate-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                SL-SIPREB
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">🏛️ One moment, please...</h3>
            <p className="text-slate-600 text-lg mb-2">Consultando documento oficial</p>
            <p className="text-slate-500">Accediendo al archivo municipal...</p>
            <div className="mt-6 flex justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 text-white">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Error</h3>
              <button 
                onClick={onClose} 
                className="text-white hover:text-gray-200 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-1 transition-colors duration-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={loadReceiptDetails}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
            >
              Intentar nuevamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-8 py-7 text-white">
          <div className="flex justify-between items-start">
            <div className="flex items-start">
              <div className="bg-white/20 backdrop-blur-sm p-3.5 rounded-2xl mr-5 shadow-lg ring-1 ring-white/10">
                <DocumentTextIcon className="h-9 w-9" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2 tracking-tight">
                  Acta de Entrega-Recepción
                </h3>
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full shadow">
                    <span className="text-sm font-semibold">#{receipt.receiptNumber}</span>
                  </div>
                  <div className="bg-white/10 px-3 py-1 rounded-full">
                    <span className="text-xs text-indigo-100">ID: {receipt.id.slice(-8)}</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl p-2.5 transition-all duration-200 hover:scale-105 hover:rotate-90"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(95vh-140px)] overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              {/* Información Principal */}
              <div className="xl:col-span-3 space-y-8">
                
                {/* Información General */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4">
                    <div className="flex items-center">
                      <div className="bg-white/20 p-2 rounded-xl mr-3">
                        <InformationCircleIcon className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-white">Información General</h4>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Número de Acta</label>
                        <div className="flex items-center bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
                          <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-3" />
                          <p className="text-lg font-bold text-gray-900">{receipt.receiptNumber}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</label>
                        <div className="pt-1">
                          {getStatusBadge(receipt.receiptStatus)}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha del Acta</label>
                        <div className="flex items-center bg-green-50 rounded-xl px-4 py-3 border border-green-100">
                          <CalendarIcon className="h-5 w-5 text-green-600 mr-3" />
                          <p className="text-lg font-bold text-gray-900">{formatDate(receipt.receiptDate)}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Movimiento</label>
                        <div className="flex items-center bg-purple-50 rounded-xl px-4 py-3 border border-purple-100">
                          <EyeIcon className="h-5 w-5 text-purple-600 mr-3" />
                          <p className="text-lg font-bold text-gray-900">
                            {receipt.movementNumber || getMovementInfo(receipt.movementId)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Participantes */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
                  <div className="bg-gradient-to-r from-sky-600 to-blue-600 px-6 py-4">
                    <div className="flex items-center">
                      <div className="bg-white/20 p-2 rounded-xl mr-3">
                        <UserIcon className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-white">Participantes</h4>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="group">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Responsable de Entrega</label>
                        <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 group-hover:border-green-300 transition-colors">
                          <div className="bg-green-500 p-2.5 rounded-xl mr-4 shadow-sm">
                            <UserIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{getUsernameById(receipt.deliveringResponsibleId)}</p>
                            <p className="text-xs text-green-600 font-medium">Entrega</p>
                          </div>
                        </div>
                      </div>
                      <div className="group">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Responsable de Recepción</label>
                        <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 group-hover:border-blue-300 transition-colors">
                          <div className="bg-blue-500 p-2.5 rounded-xl mr-4 shadow-sm">
                            <UserIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{getUsernameById(receipt.receivingResponsibleId)}</p>
                            <p className="text-xs text-blue-600 font-medium">Recepción</p>
                          </div>
                        </div>
                      </div>
                      <div className="group">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Testigo 1</label>
                        <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border-2 border-purple-200 group-hover:border-purple-300 transition-colors">
                          <div className="bg-purple-500 p-2.5 rounded-xl mr-4 shadow-sm">
                            <UserIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{getUsernameById(receipt.witness1Id)}</p>
                            <p className="text-xs text-purple-600 font-medium">Testigo</p>
                          </div>
                        </div>
                      </div>
                      <div className="group">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Testigo 2</label>
                        <div className="flex items-center p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200 group-hover:border-orange-300 transition-colors">
                          <div className="bg-orange-500 p-2.5 rounded-xl mr-4 shadow-sm">
                            <UserIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{getUsernameById(receipt.witness2Id)}</p>
                            <p className="text-xs text-orange-600 font-medium">Testigo</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Observaciones */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-4">
                    <div className="flex items-center">
                      <div className="bg-white/20 p-2 rounded-xl mr-3">
                        <DocumentTextIcon className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-white">Observaciones</h4>
                    </div>
                  </div>
                  <div className="p-6 space-y-5">
                    <div>
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center">
                        <span className="w-2.5 h-2.5 bg-teal-500 rounded-full mr-2"></span>
                        Observaciones de Entrega
                      </label>
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 min-h-[80px] hover:border-slate-300 transition-colors">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {receipt.deliveryObservations || <span className="text-slate-400 italic">Sin observaciones</span>}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center">
                        <span className="w-2.5 h-2.5 bg-cyan-500 rounded-full mr-2"></span>
                        Observaciones de Recepción
                      </label>
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 min-h-[80px] hover:border-slate-300 transition-colors">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {receipt.receptionObservations || <span className="text-slate-400 italic">Sin observaciones</span>}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center">
                        <span className="w-2.5 h-2.5 bg-sky-500 rounded-full mr-2"></span>
                        Condiciones Especiales
                      </label>
                      <div className="bg-sky-50 rounded-xl p-4 border border-sky-200 min-h-[80px] hover:border-sky-300 transition-colors">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {receipt.specialConditions || <span className="text-slate-400 italic">Sin condiciones especiales</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel Lateral */}
              <div className="xl:col-span-1 space-y-6">
                
                {/* Fechas de Firma */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
                    <div className="flex items-center">
                      <div className="bg-white/20 p-2 rounded-xl mr-3">
                        <ShieldCheckIcon className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-white">Estado de Firmas</h4>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Firma de Entrega
                      </label>
                      <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${receipt.deliverySignatureDate ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 shadow-sm' : 'bg-gray-50 border-gray-200 border-dashed'}`}>
                        <div className="flex items-center">
                          {receipt.deliverySignatureDate ? (
                            <>
                              <div className="bg-green-500 p-2 rounded-lg mr-3 shadow-sm">
                                <CheckCircleIcon className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-green-700">✓ Firmado</p>
                                <p className="text-xs text-gray-600 mt-0.5">{formatDateTime(receipt.deliverySignatureDate)}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="bg-gray-200 p-2 rounded-lg mr-3">
                                <ClockIcon className="h-5 w-5 text-gray-400" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-500">Pendiente</p>
                                <p className="text-xs text-gray-400">Esperando firma...</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Firma de Recepción
                      </label>
                      <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${receipt.receptionSignatureDate ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-sm' : 'bg-gray-50 border-gray-200 border-dashed'}`}>
                        <div className="flex items-center">
                          {receipt.receptionSignatureDate ? (
                            <>
                              <div className="bg-blue-500 p-2 rounded-lg mr-3 shadow-sm">
                                <CheckCircleIcon className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-blue-700">✓ Firmado</p>
                                <p className="text-xs text-gray-600 mt-0.5">{formatDateTime(receipt.receptionSignatureDate)}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="bg-gray-200 p-2 rounded-lg mr-3">
                                <ClockIcon className="h-5 w-5 text-gray-400" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-500">Pendiente</p>
                                <p className="text-xs text-gray-400">Esperando firma...</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documento PDF */}
                {receipt.pdfDocumentPath && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
                    <div className="bg-gradient-to-r from-red-500 to-rose-500 px-6 py-4">
                      <div className="flex items-center">
                        <div className="bg-white/20 p-2 rounded-xl mr-3">
                          <DocumentArrowDownIcon className="h-5 w-5 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold text-white">Documento</h4>
                      </div>
                    </div>
                    <div className="p-5">
                      <button className="flex items-center justify-center w-full px-4 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
                        <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                        Descargar PDF
                      </button>
                    </div>
                  </div>
                )}

                {/* Información de Auditoría */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
                  <div className="bg-gradient-to-r from-slate-500 to-gray-500 px-6 py-4">
                    <div className="flex items-center">
                      <div className="bg-white/20 p-2 rounded-xl mr-3">
                        <InformationCircleIcon className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-white">Auditoría</h4>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Generado por</label>
                      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-3.5 border border-gray-200">
                        <p className="text-sm font-bold text-gray-900">{getUsernameById(receipt.generatedBy)}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Creación</label>
                      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-3.5 border border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{formatDateTime(receipt.createdAt)}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Actualización</label>
                      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-3.5 border border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{formatDateTime(receipt.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
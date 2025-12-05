import { FaAlignLeft, FaHashtag, FaMapMarkerAlt, FaMoneyBillWave, FaTimes } from "react-icons/fa";

export default function AreaDetailModal({ isOpen, onClose, area }) {
    if (!isOpen || !area) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border-2 border-emerald-100">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Detalles del Área</h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-emerald-200 transition-colors"
                    >
                        <FaTimes className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                                    <FaHashtag className="mr-2 text-emerald-500" />
                                    Información Básica
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500">Código</p>
                                        <p className="font-medium">{area.areaCode || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Nombre</p>
                                        <p className="font-medium">{area.name || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Nivel Jerárquico</p>
                                        <p className="font-medium">
                                            {area.hierarchicalLevel === 1 ? 'Nivel 1: Gerencia' : 'Nivel 2: Subgerencia'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Estado</p>
                                        <div className="flex items-center">
                                            <div className={`w-3 h-3 rounded-full mr-2 ${area.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            <span className="font-medium">{area.active ? 'Activo' : 'Inactivo'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                                    <FaMapMarkerAlt className="mr-2 text-teal-500" />
                                    Ubicación y Contacto
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500">Ubicación Física</p>
                                        <p className="font-medium">{area.physicalLocation || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Teléfono</p>
                                        <p className="font-medium">{area.phone || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Correo Electrónico</p>
                                        <p className="font-medium">{area.email || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                                    <FaMoneyBillWave className="mr-2 text-green-500" />
                                    Información Financiera
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500">Presupuesto Anual</p>
                                        <p className="font-medium text-lg">
                                            {area.annualBudget ?
                                                `S/ ${parseFloat(area.annualBudget).toLocaleString('es-PE', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                })}`
                                                : '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                                    <FaAlignLeft className="mr-2 text-emerald-500" />
                                    Descripción
                                </h3>
                                <p className="text-gray-700 whitespace-pre-line">
                                    {area.description || 'No hay descripción disponible.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

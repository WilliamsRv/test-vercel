import React, { useEffect, useState } from "react";
import SystemConfigurationEditModal from "./EditSystemConfiguration";
import CreateSystemConfiguration from "./createSystemConfiguration";
import {
    getAllSystemConfigurations,
    softDeleteSystemConfiguration,
    restoreSystemConfiguration,
} from "../../services/apisystemconfigurations";
import { FaEdit, FaSearch, FaEye, FaTrash, FaUndo, FaPlus } from "react-icons/fa";
import Swal from "sweetalert2";
import Paginator from "../../../../shared/utils/Paginator";

const SystemConfigurationList = () => {
    const [configs, setConfigs] = useState([]);
    const [filteredConfigs, setFilteredConfigs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedConfig, setSelectedConfig] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [editableFilter, setEditableFilter] = useState("all");

    const fetchConfigurations = async () => {
        try {
            setLoading(true);
            const data = await getAllSystemConfigurations();
            setConfigs(data);
            setFilteredConfigs(data);
        } catch (err) {
            console.error("Error al obtener configuraciones del sistema:", err);
            Swal.fire("Error", "No se pudieron cargar las configuraciones.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigurations();
    }, []);

    // Resetear página cuando cambie búsqueda, filtro o el conjunto de resultados
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, configs, itemsPerPage, editableFilter]);

    useEffect(() => {
        let filtered = configs.filter(
            (c) =>
                c.key?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.category?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.value?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.dataType?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Aplicar filtro por editable / no editable
        if (editableFilter === "editable") {
            filtered = filtered.filter((c) => !!c.isEditable);
        } else if (editableFilter === "notEditable") {
            filtered = filtered.filter((c) => !c.isEditable);
        }

        setFilteredConfigs(filtered);
    }, [searchTerm, configs, editableFilter]);

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        const date = new Date(dateString + "Z");
        return date.toLocaleString("es-PE", {
            timeZone: "America/Lima",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const formatBoolean = (value) => {
        if (value === true) return "Sí";
        if (value === false) return "No";
        return "—";
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "¿Desactivar configuración?",
            text: "Esta acción marcará la configuración como no editable.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, desactivar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
        });

        if (result.isConfirmed) {
            try {
                await softDeleteSystemConfiguration(id);
                Swal.fire("Desactivada", "La configuración fue marcada como no editable.", "success");
                fetchConfigurations();
            } catch (error) {
                Swal.fire("Error", "No se pudo desactivar la configuración.", "error");
            }
        }
    };

    const handleRestore = async (id) => {
        const result = await Swal.fire({
            title: "¿Restaurar configuración?",
            text: "La configuración volverá a estar editable.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, restaurar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#28a745",
            cancelButtonColor: "#6c757d",
        });

        if (result.isConfirmed) {
            try {
                await restoreSystemConfiguration(id);
                Swal.fire("Restaurada", "La configuración fue restaurada exitosamente.", "success");
                fetchConfigurations();
            } catch (error) {
                Swal.fire("Error", "No se pudo restaurar la configuración.", "error");
            }
        }
    };

    const excludedFields = ["id", "createdBy", "updatedBy", "municipalityId"];

    const detailOrder = [
        "municipalityId",
        "category",
        "key",
        "value",
        "dataType",
        "description",
        "isEditable",
        "requiresRestart",
        "isSensitive",
        "minimumValue",
        "maximumValue",
        "allowedValues",
        "validationPattern",
    ];

    const fieldLabels = {
        municipalityId: "Municipalidad ID",
        category: "Categoría",
        key: "Clave",
        value: "Valor",
        dataType: "Tipo de dato",
        description: "Descripción",
        isEditable: "¿Es editable?",
        requiresRestart: "¿Requiere reinicio?",
        isSensitive: "¿Es sensible?",
        minimumValue: "Valor mínimo",
        maximumValue: "Valor máximo",
        allowedValues: "Valores permitidos",
        validationPattern: "Patrón de validación",
    };

    return (
        <div className="p-8 space-y-8 bg-gray-50 rounded-2xl shadow-md border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
                    Configuraciones del Sistema
                </h2>

                <div className="flex flex-col items-end gap-4 w-full sm:w-auto">

                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 w-full sm:w-80">
                        <label className="block text-sm font-semibold text-gray-600 mb-2">
                            Buscar por categoría y clave,valor o tipo:
                        </label>
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Ej: seguridad, login, valor, tipo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="mt-3">
                            <label className="block text-xs text-gray-500 mb-1">Filtrar por:</label>
                            <select
                                value={editableFilter}
                                onChange={(e) => setEditableFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="editable">Editable</option>
                                <option value="notEditable">No editable</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full sm:w-80"
                    >
                        <FaPlus /> Nueva Configuración
                    </button>
                </div>
            </div>

            {loading ? (
                <p className="text-center text-gray-500 italic py-6">Cargando configuraciones...</p>
            ) : filteredConfigs.length === 0 ? (
                <p className="text-center text-gray-500 italic py-6">
                    No hay configuraciones que coincidan.
                </p>
            ) : (
                (() => {
                    const totalItems = filteredConfigs.length;
                    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const paginated = filteredConfigs.slice(startIndex, endIndex);

                    return (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {paginated.map((config) => (
                                    <div
                                        key={config.id}
                                        className="bg-white p-5 rounded-2xl shadow hover:shadow-lg border border-gray-200 transition-all duration-200 relative"
                                    >
                                        <h3 className="text-lg font-bold text-gray-800 mb-2 capitalize">
                                            {config.category}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-1">
                                            <span className="font-semibold text-gray-700">Clave:</span>{" "}
                                            {config.key}
                                        </p>
                                        <p className="text-sm text-gray-600 mb-1">
                                            <span className="font-semibold text-gray-700">Valor:</span>{" "}
                                            {config.value}
                                        </p>
                                        <p className="text-sm text-gray-600 mb-1">
                                            <span className="font-semibold text-gray-700">Tipo:</span>{" "}
                                            {config.dataType}
                                        </p>
                                        <div className="flex justify-between items-center mt-3 text-sm">
                                            <span
                                                className={`font-semibold ${config.isEditable
                                                    ? "text-green-600"
                                                    : "text-gray-500"
                                                    }`}
                                            >
                                                {config.isEditable ? "Editable" : "No editable"}
                                            </span>
                                            <span
                                                className={`font-semibold ${config.requiresRestart
                                                    ? "text-amber-600"
                                                    : "text-gray-500"
                                                    }`}
                                            >
                                                {config.requiresRestart ? "Requiere reinicio" : "Normal"}
                                            </span>
                                        </div>

                                        {/* Botones de acción */}
                                        <div className="flex justify-end items-center gap-3 mt-4">
                                            <button
                                                className="text-gray-600 hover:text-blue-600 transition"
                                                title="Ver detalles"
                                                onClick={() => {
                                                    setSelectedConfig(config);
                                                    setShowDetails(true);
                                                }}
                                            >
                                                <FaEye />
                                            </button>

                                            {config.isEditable && (
                                                <button
                                                    className="text-blue-600 hover:text-blue-800 transition"
                                                    title="Editar configuración"
                                                    onClick={() => {
                                                        setSelectedConfig(config);
                                                        setShowEditModal(true);
                                                    }}
                                                >
                                                    <FaEdit />
                                                </button>
                                            )}

                                            {config.isEditable ? (
                                                <button
                                                    className="text-red-600 hover:text-red-800 transition"
                                                    title="Desactivar configuración"
                                                    onClick={() => handleDelete(config.id)}
                                                >
                                                    <FaTrash />
                                                </button>
                                            ) : (
                                                <button
                                                    className="text-green-600 hover:text-green-800 transition"
                                                    title="Restaurar configuración"
                                                    onClick={() => handleRestore(config.id)}
                                                >
                                                    <FaUndo />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <Paginator
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalItems={totalItems}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={(p) => setCurrentPage(p)}
                                    onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
                                    pageSizeOptions={[5, 10, 25, 50]}
                                    showPageInfo={true}
                                    showItemsPerPage={true}
                                />
                            </div>
                        </>
                    );
                })()
            )}

            {showDetails && selectedConfig && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-center items-center">
                    <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                        {/* Header sticky */}
                        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur px-6 py-4 border-b">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 text-gray-800">
                                        <h3 className="text-2xl font-bold">Detalles de Configuración</h3>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Revise los parámetros, estados y validaciones de la configuración.</p>
                                </div>
                                <button
                                    onClick={() => setShowDetails(false)}
                                    className="text-gray-400 hover:text-gray-700 text-xl font-bold"
                                    aria-label="Cerrar modal"
                                >
                                    ✕
                                </button>
                            </div>
                            {/* Badges de estado */}
                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                <span className={`px-2 py-1 rounded-full border ${selectedConfig.isEditable ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                                    {selectedConfig.isEditable ? 'Editable' : 'No editable'}
                                </span>
                                <span className={`px-2 py-1 rounded-full border ${selectedConfig.requiresRestart ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                                    {selectedConfig.requiresRestart ? 'Requiere reinicio' : 'Sin reinicio'}
                                </span>
                                <span className={`px-2 py-1 rounded-full border ${selectedConfig.isSensitive ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                                    {selectedConfig.isSensitive ? 'Sensible' : 'No sensible'}
                                </span>
                            </div>
                        </div>

                        {/* Content scrollable */}
                        <div className="max-h-[70vh] overflow-y-auto p-6">
                            {/* Sección: Información General */}
                            <div className="mb-5">
                                <div className="flex items-center gap-2 text-gray-800 mb-2">
                                    <h4 className="font-semibold text-base">Información General</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                                    {['category','key','dataType','description'].map((key) => {
                                        const label = fieldLabels[key] || key;
                                        const value = selectedConfig[key];
                                        const displayValue = (value === null || value === '') ? '—' : value;
                                        return (
                                            <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <span className="block font-semibold capitalize text-gray-800 mb-1">{label}</span>
                                                <span className="block text-gray-600 break-words">{displayValue}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Sección: Valores */}
                            <div className="mb-5">
                                <div className="flex items-center gap-2 text-gray-800 mb-2">
                                    <h4 className="font-semibold text-base">Valores</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                                    {['value','minimumValue','maximumValue','allowedValues'].map((key) => {
                                        const label = fieldLabels[key] || key;
                                        let value = selectedConfig[key];
                                        let displayValue = value;
                                        if (Array.isArray(value)) displayValue = value.join(', ');
                                        else if (typeof value === 'object' && value !== null) displayValue = JSON.stringify(value);
                                        else if (value === null || value === '') displayValue = (key === 'minimumValue' || key === 'maximumValue') ? 'Ninguno' : '—';
                                        return (
                                            <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <span className="block font-semibold capitalize text-gray-800 mb-1">{label}</span>
                                                <span className="block text-gray-600 break-words">{displayValue}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Sección: Validación */}
                            <div className="mb-5">
                                <div className="flex items-center gap-2 text-gray-800 mb-2">
                                    <h4 className="font-semibold text-base">Validación</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                                    {['validationPattern'].map((key) => {
                                        const label = fieldLabels[key] || key;
                                        const value = selectedConfig[key];
                                        const displayValue = (value === null || value === '') ? 'NINGUNO' : value;
                                        return (
                                            <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-100 md:col-span-2">
                                                <span className="block font-semibold capitalize text-gray-800 mb-1">{label}</span>
                                                <span className="block text-gray-600 break-words font-mono text-xs">{displayValue}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Footer sticky */}
                        <div className="sticky bottom-0 z-10 bg-white/90 backdrop-blur px-6 py-4 border-t flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDetails(false)}
                                className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de edición */}
            {showEditModal && selectedConfig && (
                <SystemConfigurationEditModal
                    config={selectedConfig}
                    onClose={() => setShowEditModal(false)}
                    onUpdated={fetchConfigurations}
                />
            )}

            {/* Modal de creación */}
            {showCreateModal && (
                <CreateSystemConfiguration
                    onClose={() => setShowCreateModal(false)}
                    onCreated={fetchConfigurations}
                />
            )}
        </div>
    );
};

export default SystemConfigurationList;
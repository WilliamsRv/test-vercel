import { useEffect, useState } from "react";
import { FaAlignLeft, FaBan, FaCheckCircle, FaCheckSquare, FaEnvelope, FaHashtag, FaListAlt, FaMapMarkerAlt, FaMoneyBillWave, FaPhone, FaSignature, FaTimes } from "react-icons/fa";
import Swal from "sweetalert2";
import { createArea, updateArea } from "../../services/areasApi";

export default function AreaModal({ isOpen, onClose, onSuccess, area = null }) {
    const [formData, setFormData] = useState({
        municipalityId: '7a52b3a4-87a9-4b1f-91d4-a1ee23c5e9c5',
        areaCode: '',
        name: '',
        description: '',
        hierarchicalLevel: '',
        physicalLocation: '',
        phone: '',
        email: '',
        annualBudget: '',
        _rawBudget: 0,
        active: true,
        createdBy: '3bddf19a-2d5a-4ee7-8be4-63494fb411b8',
        responsibleId: null,
        parentAreaId: null
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const isEditing = area && area.id;

    useEffect(() => {
        if (isOpen) {
            if (area && area.id) {
                setFormData({
                    municipalityId: area.municipalityId || '7a52b3a4-87a9-4b1f-91d4-a1ee23c5e9c5',
                    areaCode: area.areaCode || '',
                    name: area.name || '',
                    description: area.description || '',
                    hierarchicalLevel: String(area.hierarchicalLevel) || '',
                    physicalLocation: area.physicalLocation || '',
                    phone: area.phone || '',
                    email: area.email || '',
                    annualBudget: area.annualBudget ? formatCurrency(area.annualBudget) : '',
                    _rawBudget: area.annualBudget || 0,
                    active: area.active !== false,
                    createdBy: area.createdBy || '3bddf19a-2d5a-4ee7-8be4-63494fb411b8',
                    responsibleId: area.responsibleId || null,
                    parentAreaId: area.parentAreaId || null
                });
            } else {
                setFormData({
                    municipalityId: '7a52b3a4-87a9-4b1f-91d4-a1ee23c5e9c5',
                    areaCode: '',
                    name: '',
                    description: '',
                    hierarchicalLevel: '',
                    physicalLocation: '',
                    phone: '',
                    email: '',
                    annualBudget: '',
                    _rawBudget: 0,
                    active: true,
                    createdBy: '3bddf19a-2d5a-4ee7-8be4-63494fb411b8',
                    responsibleId: null,
                    parentAreaId: null
                });
            }
            setErrors({});
        }
    }, [isOpen, area]);

    const formatCurrency = (value) => {
        if (!value) return '';
        const num = parseFloat(value.toString().replace(/[^0-9.]/g, '')) || 0;
        return new Intl.NumberFormat('es-PE', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    };

    const parseCurrency = (value) => {
        if (!value) return 0;
        const numericValue = value.toString().replace(/[^0-9.]/g, '');
        return parseFloat(numericValue) || 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'annualBudget') {
            const numericValue = value.replace(/[^0-9.]/g, '');
            const parts = numericValue.split('.');
            const formattedValue = parts.length > 1
                ? `${parts[0]}.${parts.slice(1).join('').replace(/\./g, '')}`
                : numericValue;
            const decimalParts = formattedValue.split('.');
            const finalValue = decimalParts.length > 1
                ? `${decimalParts[0]}.${decimalParts[1].slice(0, 2)}`
                : formattedValue;

            setFormData(prev => ({
                ...prev,
                [name]: finalValue,
                _rawBudget: parseFloat(finalValue) || 0
            }));
        } else if (name === 'phone') {
            const phoneValue = value.replace(/[^0-9\s()+-]/g, '');
            const limitedValue = phoneValue.slice(0, 15);
            setFormData(prev => ({ ...prev, [name]: limitedValue }));
        } else if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.areaCode?.trim()) newErrors.areaCode = 'El código es requerido';
        if (!formData.name?.trim()) newErrors.name = 'El nombre es requerido';
        if (!formData.hierarchicalLevel) newErrors.hierarchicalLevel = 'Debe seleccionar un nivel jerárquico';
        if (!formData.physicalLocation?.trim()) newErrors.physicalLocation = 'La ubicación es requerida';
        if (!formData.phone?.trim()) newErrors.phone = 'El teléfono es requerido';

        if (!formData.email?.trim()) {
            newErrors.email = 'El correo electrónico es requerido';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Ingrese un correo electrónico válido';
        }

        const budgetValue = parseCurrency(formData.annualBudget);
        if (isNaN(budgetValue) || budgetValue <= 0) {
            newErrors.annualBudget = 'Ingrese un monto válido mayor a 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setLoading(true);

            const payload = {
                municipalityId: formData.municipalityId,
                areaCode: formData.areaCode.trim().toUpperCase(),
                name: formData.name.trim(),
                description: formData.description.trim(),
                hierarchicalLevel: parseInt(formData.hierarchicalLevel),
                physicalLocation: formData.physicalLocation.trim(),
                phone: formData.phone.replace(/[^0-9]/g, ''),
                email: formData.email.trim().toLowerCase(),
                annualBudget: parseCurrency(formData.annualBudget) || 0,
                active: formData.active,
                createdBy: formData.createdBy,
                responsibleId: formData.responsibleId,
                parentAreaId: formData.hierarchicalLevel === '2' ? 'a1d4e22b-9b2f-43a3-923d-154bc3ef4a0c' : null
            };

            if (isEditing) {
                await updateArea(area.id, payload);
            } else {
                await createArea(payload);
            }

            Swal.fire({
                title: '¡Éxito!',
                text: isEditing ? 'Área actualizada correctamente' : 'Área creada correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar',
                timer: 2000
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error al guardar el área:', error);

            let errorMessage = 'Ocurrió un error al guardar el área';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
                <div className="bg-emerald-600 text-white p-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                        {isEditing ? `Editar Área: ${area?.name}` : 'Crear Nueva Área'}
                    </h2>
                    <button
                        className="text-white text-2xl leading-none hover:text-gray-200"
                        onClick={onClose}
                        aria-label="Cerrar"
                    >
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Código */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FaHashtag className="inline mr-2 text-emerald-500" />
                                Código <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="areaCode"
                                value={formData.areaCode}
                                onChange={handleInputChange}
                                readOnly={isEditing}
                                className={`w-full px-3 py-2 border rounded-lg ${isEditing ? 'bg-gray-100 cursor-not-allowed' : ''} ${errors.areaCode ? 'border-red-500' : 'border-gray-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'}`}
                                placeholder="Ej: DGA-PAT-02"
                            />
                            {errors.areaCode && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <FaBan className="mr-1" /> {errors.areaCode}
                                </p>
                            )}
                        </div>

                        {/* Nombre */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FaSignature className="inline mr-2 text-emerald-500" />
                                Nombre <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                readOnly={isEditing}
                                className={`w-full px-3 py-2 border rounded-lg ${isEditing ? 'bg-gray-100 cursor-not-allowed' : ''} ${errors.name ? 'border-red-500' : 'border-gray-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'}`}
                                placeholder="Nombre del área"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <FaBan className="mr-1" /> {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Nivel Jerárquico */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FaListAlt className="inline mr-2 text-emerald-500" />
                                Nivel Jerárquico <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="hierarchicalLevel"
                                value={formData.hierarchicalLevel}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-lg ${errors.hierarchicalLevel ? 'border-red-500' : 'border-gray-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'}`}
                            >
                                <option value="">Seleccione el nivel</option>
                                <option value="1">Nivel 1: Gerencia</option>
                                <option value="2">Nivel 2: Subgerencia</option>
                            </select>
                            {errors.hierarchicalLevel && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <FaBan className="mr-1" /> {errors.hierarchicalLevel}
                                </p>
                            )}
                        </div>

                        {/* Ubicación Física */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FaMapMarkerAlt className="inline mr-2 text-emerald-500" />
                                Ubicación Física <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="physicalLocation"
                                value={formData.physicalLocation}
                                onChange={handleInputChange}
                                readOnly={isEditing}
                                className={`w-full px-3 py-2 border rounded-lg ${isEditing ? 'bg-gray-100 cursor-not-allowed' : ''} ${errors.physicalLocation ? 'border-red-500' : 'border-gray-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'}`}
                                placeholder="Ej: Piso 2, Oficina 201"
                            />
                            {errors.physicalLocation && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <FaBan className="mr-1" /> {errors.physicalLocation}
                                </p>
                            )}
                        </div>

                        {/* Teléfono */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FaPhone className="inline mr-2 text-emerald-500" />
                                Teléfono <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-lg ${errors.phone ? 'border-red-500' : 'border-gray-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'}`}
                                placeholder="Ej: (01) 234-5678"
                            />
                            {errors.phone && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <FaBan className="mr-1" /> {errors.phone}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FaEnvelope className="inline mr-2 text-emerald-500" />
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-lg ${errors.email ? 'border-red-500' : 'border-gray-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'}`}
                                placeholder="correo@ejemplo.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <FaBan className="mr-1" /> {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Presupuesto Anual */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FaMoneyBillWave className="inline mr-2 text-emerald-500" />
                                Presupuesto Anual (S/.) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="annualBudget"
                                value={formData.annualBudget}
                                onChange={handleInputChange}
                                onBlur={(e) => {
                                    const value = parseCurrency(e.target.value);
                                    if (!isNaN(value) && value > 0) {
                                        setFormData(prev => ({
                                            ...prev,
                                            annualBudget: formatCurrency(value),
                                            _rawBudget: value
                                        }));
                                    }
                                }}
                                className={`w-full px-3 py-2 border rounded-lg ${errors.annualBudget ? 'border-red-500' : 'border-gray-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'}`}
                                placeholder="0.00"
                            />
                            {errors.annualBudget && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <FaBan className="mr-1" /> {errors.annualBudget}
                                </p>
                            )}
                        </div>

                        {/* Estado */}
                        {isEditing && (
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="active"
                                    name="active"
                                    checked={formData.active}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                                />
                                <label htmlFor="active" className="ml-2 text-sm font-medium text-gray-700 flex items-center">
                                    <FaCheckSquare className="mr-1 text-emerald-500" />
                                    Área Activa
                                </label>
                            </div>
                        )}

                        {/* Descripción */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FaAlignLeft className="inline mr-2 text-emerald-500" />
                                Descripción
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                placeholder="Descripción detallada del área"
                            />
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors duration-200 flex items-center"
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {isEditing ? 'Actualizando...' : 'Guardando...'}
                                </span>
                            ) : (
                                <>
                                    <FaCheckCircle className="mr-2" />
                                    {isEditing ? 'Actualizar Área' : 'Guardar Área'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { createPosition, updatePosition } from "../../services/positionApi";

const PositionForm = ({ position, positions = [], onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    positionCode: "",
    name: "",
    description: "",
    hierarchicalLevel: 1,
    baseSalary: 0,
    municipalityId: "",
    active: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (position) {
      setFormData({
        positionCode: position.positionCode || "",
        name: position.name || "",
        description: position.description || "",
        hierarchicalLevel: position.hierarchicalLevel || 1,
        baseSalary: position.baseSalary || 0,
        municipalityId: position.municipalityId || "",
        active: position.active ?? true,
      });
    } else {
      setFormData({
        positionCode: "",
        name: "",
        description: "",
        hierarchicalLevel: 1,
        baseSalary: 0,
        municipalityId: "",
        active: true,
      });
    }
  }, [position]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let newValue = type === "number" ? (value === "" ? "" : Number(value)) : value.trimStart();
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    validateField(name, newValue);
  };

  const validateField = (name, value) => {
    let newErrors = { ...errors };
    const hasSpaces = /\s/.test(value);

    switch (name) {
      case "positionCode":
        if (!value?.toString().trim()) newErrors.positionCode = "El código del cargo es obligatorio.";
        else if (hasSpaces) newErrors.positionCode = "El código no debe contener espacios.";
        else if (value.length < 4) newErrors.positionCode = "Debe tener al menos 4 caracteres.";
        else if (positions.some((p) => p.positionCode?.toLowerCase() === value.toLowerCase() && p.id !== position?.id))
          newErrors.positionCode = "Ya existe un cargo con este código.";
        else delete newErrors.positionCode;
        break;
      case "municipalityId":
        if (!value?.toString().trim()) newErrors.municipalityId = "El código del municipio es obligatorio.";
        else if (hasSpaces) newErrors.municipalityId = "El código no debe contener espacios.";
        else if (value.length < 5) newErrors.municipalityId = "Debe tener al menos 5 caracteres.";
        else delete newErrors.municipalityId;
        break;
      case "name":
        if (!value?.toString().trim()) newErrors.name = "El nombre es obligatorio.";
        else if (value.length < 5) newErrors.name = "Debe tener al menos 5 caracteres.";
        else delete newErrors.name;
        break;
      case "description":
        if (!value?.toString().trim()) newErrors.description = "La descripción es obligatoria.";
        else if (value.length < 5) newErrors.description = "Debe tener al menos 5 caracteres.";
        else delete newErrors.description;
        break;
      case "hierarchicalLevel":
        if (!value || Number(value) < 1) newErrors.hierarchicalLevel = "El nivel debe ser 1 o mayor.";
        else delete newErrors.hierarchicalLevel;
        break;
      case "baseSalary":
        if (!value || Number(value) < 1) newErrors.baseSalary = "El salario debe ser 1 o mayor.";
        else delete newErrors.baseSalary;
        break;
      default:
        break;
    }
    setErrors(newErrors);
  };

  const validateAll = () => {
    let newErrors = {};
    Object.entries(formData).forEach(([field, value]) => {
      if (field !== "active" && (value === "" || value === null || value === undefined))
        newErrors[field] = "Campo obligatorio.";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) {
      Swal.fire({ icon: "error", title: "Errores en el formulario", text: "Corrige los campos en rojo antes de continuar." });
      return;
    }

    try {
      if (position?.id) {
        await updatePosition(position.id, formData);
        Swal.fire({ title: "¡Actualizado!", text: "El cargo fue actualizado correctamente.", icon: "success", timer: 2000, showConfirmButton: false });
      } else {
        await createPosition({ ...formData, active: true });
        Swal.fire({ title: "¡Creado!", text: "El cargo fue creado correctamente.", icon: "success", timer: 2000, showConfirmButton: false });
      }
      onSuccess();
    } catch (error) {
      Swal.fire("Error", "No se pudo guardar el cargo.", "error");
      console.error("Error saving position:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sección: Identificación */}
      <div className="bg-white rounded-2xl p-6 border-l-4 border-l-blue-500 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </span>
          Identificación
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Código del Cargo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="positionCode"
              value={formData.positionCode}
              onChange={handleChange}
              disabled={!!position}
              className={`w-full px-4 py-3 border-none rounded-xl text-slate-900 focus:ring-2 transition-all text-sm ${
                errors.positionCode ? "bg-red-50 focus:ring-red-500/20" : formData.positionCode?.trim() ? "bg-green-50 focus:ring-green-500/20" : "bg-gray-50 focus:ring-blue-500/20"
              } ${position ? "opacity-60 cursor-not-allowed" : ""}`}
            />
            {errors.positionCode && (
              <div className="mt-2 px-4 py-2 bg-red-50 border-l-4 border-l-red-500 rounded-lg">
                <p className="text-sm text-red-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  {errors.positionCode}
                </p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Código de Municipio <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="municipalityId"
              value={formData.municipalityId}
              onChange={handleChange}
              disabled={!!position}
              className={`w-full px-4 py-3 border-none rounded-xl text-slate-900 focus:ring-2 transition-all text-sm ${
                errors.municipalityId ? "bg-red-50 focus:ring-red-500/20" : formData.municipalityId?.trim() ? "bg-green-50 focus:ring-green-500/20" : "bg-gray-50 focus:ring-blue-500/20"
              } ${position ? "opacity-60 cursor-not-allowed" : ""}`}
            />
            {errors.municipalityId && (
              <div className="mt-2 px-4 py-2 bg-red-50 border-l-4 border-l-red-500 rounded-lg">
                <p className="text-sm text-red-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  {errors.municipalityId}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sección: Información del Cargo */}
      <div className="bg-white rounded-2xl p-6 border-l-4 border-l-blue-500 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </span>
          Información del Cargo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-none rounded-xl text-slate-900 focus:ring-2 transition-all text-sm ${
                errors.name ? "bg-red-50 focus:ring-red-500/20" : formData.name?.trim() ? "bg-green-50 focus:ring-green-500/20" : "bg-gray-50 focus:ring-blue-500/20"
              }`}
            />
            {errors.name && (
              <div className="mt-2 px-4 py-2 bg-red-50 border-l-4 border-l-red-500 rounded-lg">
                <p className="text-sm text-red-700">{errors.name}</p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Nivel Jerárquico <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="hierarchicalLevel"
              value={formData.hierarchicalLevel}
              onChange={handleChange}
              min={1}
              className={`w-full px-4 py-3 border-none rounded-xl text-slate-900 focus:ring-2 transition-all text-sm ${
                errors.hierarchicalLevel ? "bg-red-50 focus:ring-red-500/20" : "bg-gray-50 focus:ring-blue-500/20"
              }`}
            />
            {errors.hierarchicalLevel && (
              <div className="mt-2 px-4 py-2 bg-red-50 border-l-4 border-l-red-500 rounded-lg">
                <p className="text-sm text-red-700">{errors.hierarchicalLevel}</p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Salario Base (S/.) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="baseSalary"
              value={formData.baseSalary}
              onChange={handleChange}
              min={1}
              step="0.01"
              className={`w-full px-4 py-3 border-none rounded-xl text-slate-900 focus:ring-2 transition-all text-sm ${
                errors.baseSalary ? "bg-red-50 focus:ring-red-500/20" : "bg-gray-50 focus:ring-blue-500/20"
              }`}
            />
            {errors.baseSalary && (
              <div className="mt-2 px-4 py-2 bg-red-50 border-l-4 border-l-red-500 rounded-lg">
                <p className="text-sm text-red-700">{errors.baseSalary}</p>
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className={`w-full px-4 py-3 border-none rounded-xl text-slate-900 focus:ring-2 transition-all text-sm resize-none ${
                errors.description ? "bg-red-50 focus:ring-red-500/20" : formData.description?.trim() ? "bg-green-50 focus:ring-green-500/20" : "bg-gray-50 focus:ring-blue-500/20"
              }`}
            />
            {errors.description && (
              <div className="mt-2 px-4 py-2 bg-red-50 border-l-4 border-l-red-500 rounded-lg">
                <p className="text-sm text-red-700">{errors.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all duration-200"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-all duration-200 shadow-lg"
        >
          {position ? "Actualizar Cargo" : "Crear Cargo"}
        </button>
      </div>
    </form>
  );
};

export default PositionForm;

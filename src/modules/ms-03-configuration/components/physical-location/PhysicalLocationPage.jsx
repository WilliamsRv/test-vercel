import { useEffect, useState } from "react";
import { getAllPhysicalLocations, createPhysicalLocation, updatePhysicalLocation, deletePhysicalLocation, getInactivePhysicalLocations, restorePhysicalLocation } from "../../services/physicalLocationApi";
import Swal from "sweetalert2";
import { FaEdit, FaTrash, FaLayerGroup, FaCheckCircle, FaBan, FaUndo } from "react-icons/fa";

export default function PhysicalLocationPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [inactiveItems, setInactiveItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | inactive

  // Create modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    locationCode: "",
    name: "",
    description: "",
    locationType: "",
    address: "",
    floor: "",
    sector: "",
    reference: "",
    gpsCoordinates: null,
    maxCapacity: "",
    areaM2: "",
    responsibleId: ""
  });
  const [createErrors, setCreateErrors] = useState({});

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    locationCode: "",
    name: "",
    description: "",
    locationType: "",
    parentLocationId: "",
    address: "",
    floor: "",
    sector: "",
    reference: "",
    gpsCoordinates: null,
    maxCapacity: "",
    areaM2: "",
    responsibleId: ""
  });
  const [editErrors, setEditErrors] = useState({});

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [locations, inactives] = await Promise.all([
        getAllPhysicalLocations(),
        getInactivePhysicalLocations(),
      ]);
      setItems(Array.isArray(locations) ? locations : []);
      setInactiveItems(Array.isArray(inactives) ? inactives : []);
    } catch (e) {
      setError(e?.message || "Error cargando ubicaciones físicas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const validateForm = (formData) => {
    const errors = {};
    
    // Validar campos requeridos
    if (!formData.name?.trim()) {
      errors.name = "El nombre es requerido";
    } else if (formData.name.trim().length < 3) {
      errors.name = "El nombre debe tener al menos 3 caracteres";
    } else if (formData.name.trim().length > 100) {
      errors.name = "El nombre no puede exceder los 100 caracteres";
    }

    if (!formData.locationCode?.trim()) {
      errors.locationCode = "El código es requerido";
    } else if (!/^[A-Z0-9-]+$/.test(formData.locationCode.trim())) {
      errors.locationCode = "El código solo puede contener letras mayúsculas, números y guiones";
    }

    if (!formData.locationType) {
      errors.locationType = "El tipo de ubicación es requerido";
    }

    // Validar campos opcionales con formato específico
    if (formData.floor) {
      if (isNaN(Number(formData.floor)) || !Number.isInteger(Number(formData.floor))) {
        errors.floor = "El piso debe ser un número entero";
      } else if (Number(formData.floor) < -10 || Number(formData.floor) > 200) {
        errors.floor = "El piso debe estar entre -10 y 200";
      }
    }

    if (formData.maxCapacity) {
      if (isNaN(Number(formData.maxCapacity)) || !Number.isInteger(Number(formData.maxCapacity))) {
        errors.maxCapacity = "La capacidad debe ser un número entero";
      } else if (Number(formData.maxCapacity) < 0) {
        errors.maxCapacity = "La capacidad no puede ser negativa";
      } else if (Number(formData.maxCapacity) > 10000) {
        errors.maxCapacity = "La capacidad máxima permitida es 10,000";
      }
    }

    if (formData.areaM2) {
      if (isNaN(Number(formData.areaM2))) {
        errors.areaM2 = "El área debe ser un número";
      } else if (Number(formData.areaM2) <= 0) {
        errors.areaM2 = "El área debe ser mayor a 0";
      } else if (Number(formData.areaM2) > 10000) {
        errors.areaM2 = "El área no puede exceder los 10,000 m²";
      } else if (!/^\d+(\.\d{1,2})?$/.test(formData.areaM2)) {
        errors.areaM2 = "El área debe tener máximo 2 decimales";
      }
    }

    // Validar longitud máxima de campos de texto
    if (formData.description?.trim() && formData.description.trim().length > 500) {
      errors.description = "La descripción no puede exceder los 500 caracteres";
    }

    if (formData.address?.trim() && formData.address.trim().length > 200) {
      errors.address = "La dirección no puede exceder los 200 caracteres";
    }

    if (formData.sector?.trim() && formData.sector.trim().length > 50) {
      errors.sector = "El sector no puede exceder los 50 caracteres";
    }

    if (formData.reference?.trim() && formData.reference.trim().length > 100) {
      errors.reference = "La referencia no puede exceder los 100 caracteres";
    }

    return errors;
  };

  const onCreateSubmit = async (e) => {
    e.preventDefault();
    
    // Validar el formulario
    const formErrors = validateForm(createForm);
    setCreateErrors(formErrors);
    
    // Si hay errores, detener el envío
    if (Object.keys(formErrors).length > 0) {
      // Desplazarse al primer campo con error
      const firstErrorField = Object.keys(formErrors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
      return;
    }
    
    try {

      setCreateErrors(errs);
      if (Object.keys(errs).length) return;

      // Construir el payload según lo esperado por la API
      const payload = {
        municipalityId: "7a52b3a4-87a9-4b1f-91d4-a1ee23c5e9c5", // TODO: Obtener del usuario o configuración
        locationCode: createForm.locationCode.trim(),
        name: createForm.name.trim(),
        description: createForm.description?.trim() || null,
        locationType: createForm.locationType,
        parentLocationId: null, // TODO: Implementar selección de ubicación padre si es necesario
        address: createForm.address?.trim() || null,
        floor: createForm.floor ? Number(createForm.floor) : null,
        sector: createForm.sector?.trim() || null,
        reference: createForm.reference?.trim() || null,
        gpsCoordinates: createForm.gpsCoordinates || { x: 0, y: 0 }, // Coordenadas por defecto
        maxCapacity: createForm.maxCapacity ? Number(createForm.maxCapacity) : 0,
        areaM2: createForm.areaM2 ? parseFloat(createForm.areaM2) : 0,
        active: true,
        createdBy: "3bddf19a-2d5a-4ee7-8be4-63494fb411b8" // TODO: Reemplazar con ID del usuario autenticado
      };
      await createPhysicalLocation(payload);
      await Swal.fire({ icon: "success", title: "Ubicación creada" });
      setIsCreateOpen(false);
      setCreateForm({ locationCode: "", name: "", description: "", locationType: "", address: "", floor: "", sector: "", reference: "", gpsCoordinates: null, maxCapacity: "", areaM2: "" });
      setCreateErrors({});
      await load();
    } catch (e2) {
      const msg = e2?.message || "Error creando registro";
      setError(msg);
      await Swal.fire({ icon: "error", title: "No se pudo crear", text: msg });
    }
  };

  const onEditSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validar el formulario
      const formErrors = validateForm(editForm);
      setEditErrors(formErrors);
      
      // Si hay errores, detener el envío
      if (Object.keys(formErrors).length > 0) {
        // Desplazarse al primer campo con error
        const firstErrorField = Object.keys(formErrors)[0];
        const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorElement.focus();
        }
        return;
      }

      // Construir el payload según lo esperado por la API
      const payload = {
        id: editing.id,
        locationCode: editForm.locationCode.trim(),
        name: editForm.name.trim(),
        locationType: editForm.locationType,
        address: editForm.address?.trim() || "",
        sector: editForm.sector?.trim() || "",
        floor: editForm.floor ? parseInt(editForm.floor) : null,
        reference: editForm.reference?.trim() || "",
        maxCapacity: editForm.maxCapacity ? parseInt(editForm.maxCapacity) : 0,
        areaM2: editForm.areaM2 ? parseFloat(editForm.areaM2) : 0
      };
      
      console.log("Sending update payload:", payload); // Para depuración
      
      // Actualizar la ubicación
      try {
        const response = await updatePhysicalLocation(editing.id, payload);
        console.log("Update response:", response); // Para depuración
        await Swal.fire({ icon: "success", title: "Ubicación actualizada" });
      } catch (error) {
        console.error("Error updating location:", error);
        throw error; // Re-lanzar el error para que se maneje en el catch externo
      }
      setIsEditOpen(false);
      setEditing(null);
      setEditErrors({});
      await load();
    } catch (e2) {
      let msg = e2?.message || "Error actualizando registro";
      if (!msg && e2?.response?.data) {
        try { msg = JSON.stringify(e2.response.data); } catch {}
      }
      setError(msg);
      await Swal.fire({ icon: "error", title: "No se pudo actualizar", text: msg });
    }
  };

  const onEdit = (row) => {
    setEditing(row);
    setEditForm({
      locationCode: row.locationCode || "",
      name: row.name || "",
      locationType: row.locationType || "OFFICE",
      address: row.address || "",
      sector: row.sector || "",
      floor: row.floor ?? "",
      reference: row.reference || "",
      maxCapacity: row.maxCapacity ? String(row.maxCapacity) : "",
      areaM2: row.areaM2 ? String(row.areaM2) : ""
    });
    setIsEditOpen(true);
  };

  const onDelete = async (row) => {
    if (!row?.id) return;
    const res = await Swal.fire({
      title: "¿Eliminar ubicación?",
      text: row.code ? `${row.code} - ${row.name}` : row.name,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!res.isConfirmed) return;
    await deletePhysicalLocation(row.id);
    await Swal.fire({ icon: "success", title: "Ubicación eliminada", toast: true, timer: 2000, position: "top-end", showConfirmButton: false });
    await load();
  };

  const onRestore = async (row) => {
    if (!row?.id) return;
    await restorePhysicalLocation(row.id);
    await Swal.fire({ icon: "success", title: "Ubicación restaurada", toast: true, timer: 2000, position: "top-end", showConfirmButton: false });
    await load();
  };

  const isInactiveFlag = (x) => (x?.active === false || x?.activo === false);
  const activesList = items.filter((x) => !isInactiveFlag(x));
  const derivedInactiveFromItems = items.filter((x) => isInactiveFlag(x));
  const inactivesList = (inactiveItems && inactiveItems.length > 0) ? inactiveItems : derivedInactiveFromItems;
  const allCombined = (() => {
    const map = new Map();
    for (const it of [...items, ...inactivesList]) {
      if (!map.has(it.id)) map.set(it.id, it);
    }
    return Array.from(map.values());
  })();
  const baseList = statusFilter === "inactive" ? inactivesList : (statusFilter === "active" ? activesList : allCombined);
  const filtered = baseList.filter((x) =>
    (x.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (x.code || "").toLowerCase().includes(search.toLowerCase())
  );

  // sort by code ascending (numeric aware)
  const filteredSorted = [...filtered].sort((a, b) => {
    const ac = String(a.code || "");
    const bc = String(b.code || "");
    const anum = parseInt((ac.match(/\d+/) || ["999999"]) [0], 10);
    const bnum = parseInt((bc.match(/\d+/) || ["999999"]) [0], 10);
    if (!isNaN(anum) && !isNaN(bnum) && anum !== bnum) return anum - bnum;
    return ac.localeCompare(bc, undefined, { numeric: true, sensitivity: "base" });
  });

  // Generar siguiente código de ubicación en formato LOC-XXX (ej: LOC-001, LOC-002)
  const nextLocationCode = () => {
    const prefix = "LOC-";
    let maxNum = 0;
    
    // Buscar el número más alto en los códigos existentes
    [...items, ...inactiveItems].forEach(item => {
      if (item.locationCode) {
        const match = item.locationCode.toUpperCase().match(/^LOC-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num)) {
            maxNum = Math.max(maxNum, num);
          }
        }
      }
    });
    
    // Incrementar el número y formatear con ceros a la izquierda
    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(3, '0')}`;
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Ubicaciones Físicas</h2>

      {error && <div className="text-red-600">{error}</div>}

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="flex items-center justify-between bg-blue-100 border-l-4 border-blue-600 rounded-xl p-5 shadow-sm">
          <div>
            <h2 className="text-sm text-blue-600 font-semibold uppercase">Total</h2>
            <p className="text-3xl font-bold text-blue-800 mt-1">{allCombined.length}</p>
          </div>
          <div className="text-blue-600 text-4xl"><FaLayerGroup /></div>
        </div>

        <div className="flex items-center justify-between bg-green-100 border-l-4 border-green-600 rounded-xl p-5 shadow-sm">
          <div>
            <h2 className="text-sm text-green-600 font-semibold uppercase">Activas</h2>
            <p className="text-3xl font-bold text-green-800 mt-1">{activesList.length}</p>
          </div>
          <div className="text-green-600 text-4xl"><FaCheckCircle /></div>
        </div>

        <div className="flex items-center justify-between bg-amber-100 border-l-4 border-amber-600 rounded-xl p-5 shadow-sm">
          <div>
            <h2 className="text-sm text-amber-600 font-semibold uppercase">Inactivas</h2>
            <p className="text-3xl font-bold text-amber-800 mt-1">{inactivesList.length}</p>
          </div>
          <div className="text-amber-600 text-4xl"><FaBan /></div>
        </div>
      </div>

      {/* Filtros y botón Crear */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-1 gap-4 w-full">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-700"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-56 border border-gray-300 rounded-md p-2 text-gray-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
          </select>
        </div>
        <button
          type="button"
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 whitespace-nowrap"
          onClick={() => { 
            setCreateForm({ 
              name: "", 
              locationCode: nextLocationCode(), 
              description: "", 
              locationType: "",
              parentLocationId: "",
              address: "", 
              floor: "",
              sector: "",
              reference: "",
              maxCapacity: "", 
              areaM2: "",
              responsibleId: ""
            }); 
            setCreateErrors({}); 
            setIsCreateOpen(true); 
          }}
        >
          Agregar Ubicación
        </button>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-start z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between sticky top-0 z-10">
              <h2 className="text-lg font-semibold">Crear Ubicación Física</h2>
              <button 
                className="text-white text-2xl leading-none hover:bg-blue-700 rounded-full w-8 h-8 flex items-center justify-center" 
                onClick={()=>setIsCreateOpen(false)} 
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <form className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto" onSubmit={onCreateSubmit}>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input 
                  name="name"
                  className={`border p-2 rounded w-full ${createErrors.name ? "border-red-500" : "focus:ring-2 focus:ring-blue-500 focus:border-transparent"}`} 
                  placeholder="Nombre de la ubicación (requerido)" 
                  value={createForm.name} 
                  onChange={(e) => {
                    const v = e.target.value;
                    setCreateForm({...createForm, name: v});
                    // Validación en tiempo real solo para borrar el error cuando se corrige
                    if (createErrors.name && v.trim().length >= 3) {
                      setCreateErrors(prev => ({...prev, name: undefined}));
                    }
                  }}
                  onBlur={(e) => {
                    const v = e.target.value;
                    const newErrors = {...createErrors};
                    if (!v.trim()) {
                      newErrors.name = "El nombre es requerido";
                    } else if (v.trim().length < 3) {
                      newErrors.name = "El nombre debe tener al menos 3 caracteres";
                    } else {
                      delete newErrors.name;
                    }
                    setCreateErrors(newErrors);
                  }}
                />
                {createErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{createErrors.name}</p>
                )}
                {createErrors.name && <span className="text-red-600 text-xs mt-1">{createErrors.name}</span>}
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Código *</label>
                <div className="relative">
                  <input 
                    className={`border p-2 rounded w-full ${createErrors.locationCode ? "border-red-500" : "focus:ring-2 focus:ring-blue-500 focus:border-transparent"}`} 
                    placeholder="Ej: LOC-001-A" 
                    value={createForm.locationCode}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCreateForm({...createForm, locationCode: v});
                      setCreateErrors(prev => ({...prev, locationCode: v.trim() ? undefined : "El código es requerido"}));
                    }}
                  />
                  <button 
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800"
                    onClick={() => setCreateForm({...createForm, locationCode: nextLocationCode()})}
                    title="Generar código"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                {createErrors.locationCode && <span className="text-red-600 text-xs mt-1">{createErrors.locationCode}</span>}
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Tipo de Ubicación *</label>
                <select 
                  name="locationType"
                  className={`border p-2 rounded w-full ${createErrors.locationType ? "border-red-500" : "focus:ring-2 focus:ring-blue-500 focus:border-transparent"}`}
                  value={createForm.locationType}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCreateForm({...createForm, locationType: v});
                    if (createErrors.locationType && v) {
                      setCreateErrors(prev => ({...prev, locationType: undefined}));
                    }
                  }}
                  onBlur={(e) => {
                    const v = e.target.value;
                    const newErrors = {...createErrors};
                    if (!v) {
                      newErrors.locationType = "El tipo de ubicación es requerido";
                    } else {
                      delete newErrors.locationType;
                    }
                    setCreateErrors(newErrors);
                  }}
                >
                  <option value="">Seleccione tipo</option>
                  <option value="OFFICE">Oficina</option>
                  <option value="WAREHOUSE">Almacén</option>
                  <option value="FIELD">Campo</option>
                  <option value="VEHICLE">Vehículo</option>
                  <option value="STORAGE">Almacenamiento</option>
                  <option value="WORKSHOP">Taller</option>
                </select>
                {createErrors.locationType && <span className="text-red-600 text-xs mt-1">{createErrors.locationType}</span>}
              </div>
              <div className="flex flex-col md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input 
                  className="border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="Dirección completa" 
                  value={createForm.address || ''} 
                  onChange={(e) => setCreateForm({...createForm, address: e.target.value})} 
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Piso (opcional)</label>
                <input 
                  className={`border p-2 rounded ${createErrors.floor ? "border-red-500" : "focus:ring-2 focus:ring-blue-500 focus:border-transparent"}`} 
                  type="number" 
                  placeholder="Número de piso" 
                  value={createForm.floor || ''} 
                  onChange={(e) => {
                    const v = e.target.value;
                    setCreateForm({...createForm, floor: v});
                    setCreateErrors(prev => ({
                      ...prev, 
                      floor: (v === '' || !isNaN(Number(v))) ? undefined : "El piso debe ser un número"
                    }));
                  }}
                />
                {createErrors.floor && <span className="text-red-600 text-xs mt-1">{createErrors.floor}</span>}
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Sector (opcional)</label>
                <input 
                  className="border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="Ej: Almacén, Oficinas, etc." 
                  value={createForm.sector || ''} 
                  onChange={(e) => setCreateForm({...createForm, sector: e.target.value})} 
                />
              </div>
              <div className="flex flex-col md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1">Referencia (opcional)</label>
                <input 
                  className="border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="Puntos de referencia cercanos" 
                  value={createForm.reference || ''} 
                  onChange={(e) => setCreateForm({...createForm, reference: e.target.value})} 
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Capacidad Máxima (opcional)</label>
                <div className="relative">
                  <input 
                    className={`border p-2 rounded w-full ${createErrors.maxCapacity ? "border-red-500" : "focus:ring-2 focus:ring-blue-500 focus:border-transparent"}`} 
                    placeholder="Ej: 10" 
                    type="number" 
                    min="0" 
                    value={createForm.maxCapacity || ''} 
                    onChange={(e) => {
                      const v = e.target.value;
                      setCreateForm({...createForm, maxCapacity: v});
                      const ok = v === "" || (!isNaN(Number(v)) && Number(v) >= 0);
                      setCreateErrors(prev => ({ ...prev, maxCapacity: ok ? undefined : "La capacidad debe ser ≥ 0" }));
                    }} 
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    personas
                  </div>
                </div>
                {createErrors.maxCapacity && <span className="text-red-600 text-xs mt-1">{createErrors.maxCapacity}</span>}
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Área (m²) (opcional)</label>
                <div className="relative">
                  <input 
                    className={`border p-2 rounded w-full ${createErrors.areaM2 ? "border-red-500" : "focus:ring-2 focus:ring-blue-500 focus:border-transparent"}`} 
                    placeholder="Ej: 25.50" 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    value={createForm.areaM2 || ''} 
                    onChange={(e) => {
                      const v = e.target.value;
                      setCreateForm({...createForm, areaM2: v});
                      const ok = v === "" || (!isNaN(Number(v)) && Number(v) > 0);
                      setCreateErrors(prev => ({ ...prev, areaM2: ok ? undefined : "El área debe ser > 0" }));
                    }} 
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    m²
                  </div>
                </div>
                {createErrors.areaM2 && <span className="text-red-600 text-xs mt-1">{createErrors.areaM2}</span>}
              </div>
              <div className="flex flex-col md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                <textarea 
                  className="border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="Ingrese una descripción detallada de la ubicación..." 
                  rows="3"
                  value={createForm.description || ''} 
                  onChange={(e) => setCreateForm({...createForm, description: e.target.value})} 
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button 
                  type="button" 
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" 
                  onClick={()=>setIsCreateOpen(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50" 
                  disabled={!createForm.name?.trim() || !createForm.locationCode?.trim() || !createForm.locationType || Object.keys(createErrors).some(k=>createErrors[k])}
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Guardar Ubicación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
          <div className="bg-yellow-500 text-white p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Editar Ubicación Física</h2>
            <button className="text-white text-2xl leading-none" onClick={()=>setIsEditOpen(false)} aria-label="Cerrar">×</button>
          </div>
          <form className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[80vh] overflow-y-auto" onSubmit={onEditSubmit}>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Código *</label>
              <input 
                name="locationCode"
                className={`border p-2 rounded w-full ${editErrors.locationCode ? "border-red-500" : "focus:ring-2 focus:ring-blue-500 focus:border-transparent"}`} 
                placeholder="Código de ubicación" 
                value={editForm.locationCode} 
                onChange={(e) => {
                  const v = e.target.value;
                  setEditForm({...editForm, locationCode: v});
                  if (editErrors.locationCode && v.trim()) {
                    setEditErrors(prev => ({...prev, locationCode: undefined}));
                  }
                }}
                onBlur={(e) => {
                  const v = e.target.value;
                  const newErrors = {...editErrors};
                  if (!v.trim()) {
                    newErrors.locationCode = "El código es requerido";
                  } else {
                    delete newErrors.locationCode;
                  }
                  setEditErrors(newErrors);
                }}
              />
              {editErrors.locationCode && (
                <p className="mt-1 text-sm text-red-600">{editErrors.locationCode}</p>
              )}
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input 
                name="name"
                className={`border p-2 rounded w-full ${editErrors.name ? "border-red-500" : "focus:ring-2 focus:ring-blue-500 focus:border-transparent"}`} 
                placeholder="Nombre de la ubicación" 
                value={editForm.name} 
                onChange={(e) => {
                  const v = e.target.value;
                  setEditForm({...editForm, name: v});
                  if (editErrors.name && v.trim().length >= 3) {
                    setEditErrors(prev => ({...prev, name: undefined}));
                  }
                }}
                onBlur={(e) => {
                  const v = e.target.value;
                  const newErrors = {...editErrors};
                  if (!v.trim()) {
                    newErrors.name = "El nombre es requerido";
                  } else if (v.trim().length < 3) {
                    newErrors.name = "El nombre debe tener al menos 3 caracteres";
                  } else {
                    delete newErrors.name;
                  }
                  setEditErrors(newErrors);
                }}
              />
              {editErrors.name && (
                <p className="mt-1 text-sm text-red-600">{editErrors.name}</p>
              )}
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Tipo de Ubicación *</label>
              <select 
                name="locationType"
                className={`border p-2 rounded w-full ${editErrors.locationType ? "border-red-500" : "focus:ring-2 focus:ring-blue-500 focus:border-transparent"}`}
                value={editForm.locationType}
                onChange={(e) => {
                  const v = e.target.value;
                  setEditForm({...editForm, locationType: v});
                  if (editErrors.locationType && v) {
                    setEditErrors(prev => ({...prev, locationType: undefined}));
                  }
                }}
                onBlur={(e) => {
                  const v = e.target.value;
                  const newErrors = {...editErrors};
                  if (!v) {
                    newErrors.locationType = "El tipo de ubicación es requerido";
                  } else {
                    delete newErrors.locationType;
                  }
                  setEditErrors(newErrors);
                }}
              >
                <option value="">Seleccione tipo</option>
                <option value="OFFICE">Oficina</option>
                <option value="WAREHOUSE">Almacén</option>
                <option value="FIELD">Campo</option>
                <option value="VEHICLE">Vehículo</option>
                <option value="STORAGE">Almacenamiento</option>
                <option value="WORKSHOP">Taller</option>
              </select>
              {editErrors.locationType && (
                <p className="mt-1 text-sm text-red-600">{editErrors.locationType}</p>
              )}
            </div>

            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input 
                name="address"
                className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="Dirección completa" 
                value={editForm.address || ''} 
                onChange={(e) => setEditForm({...editForm, address: e.target.value})} 
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Sector</label>
              <input 
                name="sector"
                className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="Sector o área" 
                value={editForm.sector || ''} 
                onChange={(e) => setEditForm({...editForm, sector: e.target.value})} 
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Piso (opcional)</label>
              <input 
                name="floor"
                type="number"
                className={`border p-2 rounded w-full ${editErrors.floor ? "border-red-500" : "focus:ring-2 focus:ring-blue-500 focus:border-transparent"}`} 
                placeholder="Número de piso" 
                value={editForm.floor || ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setEditForm({...editForm, floor: v});
                  // Validación en tiempo real
                  if (editErrors.floor && (v === '' || (!isNaN(Number(v)) && Number(v) >= -10 && Number(v) <= 200))) {
                    setEditErrors(prev => ({...prev, floor: undefined}));
                  }
                }}
                onBlur={(e) => {
                  const v = e.target.value;
                  const newErrors = {...editErrors};
                  if (v && (isNaN(Number(v)) || !Number.isInteger(Number(v)))) {
                    newErrors.floor = "El piso debe ser un número entero";
                  } else if (v && (Number(v) < -10 || Number(v) > 200)) {
                    newErrors.floor = "El piso debe estar entre -10 y 200";
                  } else {
                    delete newErrors.floor;
                  }
                  setEditErrors(newErrors);
                }}
              />
              {editErrors.floor && (
                <p className="mt-1 text-sm text-red-600">{editErrors.floor}</p>
              )}
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Referencia</label>
              <input 
                name="reference"
                className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="Punto de referencia" 
                value={editForm.reference || ''} 
                onChange={(e) => setEditForm({...editForm, reference: e.target.value})} 
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Capacidad Máxima</label>
              <div className="relative">
                <input 
                  name="maxCapacity"
                  type="number"
                  min="0"
                  step="1"
                  className={`border p-2 rounded w-full pr-10 ${editErrors.maxCapacity ? "border-red-500" : "focus:ring-2 focus:ring-blue-500 focus:border-transparent"}`} 
                  placeholder="Ej: 10" 
                  value={editForm.maxCapacity}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEditForm({...editForm, maxCapacity: v});
                    if (editErrors.maxCapacity && (v === '' || (!isNaN(Number(v)) && Number(v) >= 0))) {
                      setEditErrors(prev => ({...prev, maxCapacity: undefined}));
                    }
                  }}
                  onBlur={(e) => {
                    const v = e.target.value;
                    const newErrors = {...editErrors};
                    if (v && (isNaN(Number(v)) || Number(v) < 0)) {
                      newErrors.maxCapacity = "La capacidad debe ser un número positivo";
                    } else {
                      delete newErrors.maxCapacity;
                    }
                    setEditErrors(newErrors);
                  }}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">pers.</span>
              </div>
              {editErrors.maxCapacity && (
                <p className="mt-1 text-sm text-red-600">{editErrors.maxCapacity}</p>
              )}
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Área (m²)</label>
              <div className="relative">
                <input 
                  name="areaM2"
                  type="number"
                  min="0"
                  step="0.01"
                  className={`border p-2 rounded w-full pr-10 ${editErrors.areaM2 ? "border-red-500" : "focus:ring-2 focus:ring-blue-500 focus:border-transparent"}`} 
                  placeholder="Ej: 25.50" 
                  value={editForm.areaM2}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEditForm({...editForm, areaM2: v});
                    if (editErrors.areaM2 && (v === '' || (!isNaN(Number(v)) && Number(v) >= 0))) {
                      setEditErrors(prev => ({...prev, areaM2: undefined}));
                    }
                  }}
                  onBlur={(e) => {
                    const v = e.target.value;
                    const newErrors = {...editErrors};
                    if (v && (isNaN(Number(v)) || Number(v) < 0)) {
                      newErrors.areaM2 = "El área debe ser un número positivo";
                    } else if (v && !/^\d+(\.\d{1,2})?$/.test(v)) {
                      newErrors.areaM2 = "Máximo 2 decimales";
                    } else {
                      delete newErrors.areaM2;
                    }
                    setEditErrors(newErrors);
                  }}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">m²</span>
              </div>
              {editErrors.areaM2 && (
                <p className="mt-1 text-sm text-red-600">{editErrors.areaM2}</p>
              )}
            </div>

 <div className="md:col-span-2 flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button 
                type="button" 
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" 
                onClick={() => setIsEditOpen(false)}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                disabled={!editForm.locationType || Object.keys(editErrors).some(k => editErrors[k])}
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
      )}

      <div className="bg-white rounded-xl border overflow-x-auto">
        {loading ? (
          <div className="p-6">Cargando...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
              <tr>
                <th className="text-left p-3 font-semibold">Código</th>
                <th className="text-left p-3 font-semibold">Nombre</th>
                <th className="text-left p-3 font-semibold">Tipo</th>
                <th className="text-left p-3 font-semibold">Dirección</th>
                <th className="text-left p-3 font-semibold">Sector</th>
                <th className="text-left p-3 font-semibold">Piso</th>
                <th className="text-left p-3 font-semibold">Referencia</th>
                <th className="text-left p-3 font-semibold">Cap. Máx.</th>
                <th className="text-left p-3 font-semibold">Área (m²)</th>
                <th className="text-left p-3 font-semibold">Estado</th>
                <th className="text-center p-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredSorted.map((row) => {
                const isInactive = (row.active === false || row.activo === false) || inactiveItems.some(it => it.id === row.id);
                return (
                <tr key={row.id} className="border-t">
                  <td className="p-3">{row.locationCode || '-'}</td>
                  <td className="p-3">{row.name || '-'}</td>
                  <td className="p-3">
                    {row.locationType ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {row.locationType}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="p-3">
                    <div className="line-clamp-1" title={row.address}>
                      {row.address || '-'}
                    </div>
                  </td>
                  <td className="p-3">{row.sector || '-'}</td>
                  <td className="p-3">{row.floor || '-'}</td>
                  <td className="p-3">{row.reference || '-'}</td>
                  <td className="p-3">{row.maxCapacity ?? '-'}</td>
                  <td className="p-3">{row.areaM2 ? `${row.areaM2} m²` : '-'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${isInactive ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                      {isInactive ? "Inactiva" : "Activa"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="inline-flex items-center gap-2">
                      {!isInactive ? (
                        <>
                          <button type="button" className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50" title="Editar" aria-label="Editar" onClick={()=>onEdit(row)}>
                            <FaEdit />
                          </button>
                          <button type="button" className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50" title="Desactivar" aria-label="Desactivar" onClick={()=>onDelete(row)}>
                            <FaTrash />
                          </button>
                        </>
                      ) : (
                        <button type="button" className="text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-50" title="Restaurar" aria-label="Restaurar" onClick={()=>onRestore(row)}>
                          <FaUndo />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );})}
              {filteredSorted.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-gray-500" colSpan={12}>Sin resultados</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

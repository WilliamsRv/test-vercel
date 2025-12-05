import { useEffect, useState } from "react";
import { FaBan, FaCheckCircle, FaEdit, FaEye, FaLayerGroup, FaTrash, FaUndo } from "react-icons/fa";
import Swal from "sweetalert2";
import { deleteArea, getAllAreas, restoreArea } from "../../services/areasApi";
import AreaDetailModal from "./AreaDetailModal";
import AreaModal from "./AreaModal";

export default function AreasPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAllAreas();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "Error cargando áreas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = () => {
    setSelectedArea(null);
    setIsModalOpen(true);
  };

  const handleEdit = (area) => {
    setSelectedArea(area);
    setIsModalOpen(true);
  };

  const handleViewDetail = (area) => {
    setSelectedArea(area);
    setIsDetailModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedArea(null);
  };

  const handleDetailModalClose = () => {
    setIsDetailModalOpen(false);
    setSelectedArea(null);
  };

  const handleSuccess = () => {
    load();
  };

  const onDelete = async (row) => {
    if (!row?.id) return;
    const res = await Swal.fire({
      title: "¿Inactivar área?",
      text: row.name || row.code || "",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, inactivar",
      cancelButtonText: "Cancelar",
    });
    if (!res.isConfirmed) return;
    await deleteArea(row.id);
    setFilter("inactivos");
    await load();
    await Swal.fire({
      icon: "success",
      title: "Área inactivada",
      toast: true,
      timer: 2000,
      position: "top-end",
      showConfirmButton: false
    });
  };

  const onRestore = async (row) => {
    if (!row?.id) return;
    const res = await Swal.fire({
      title: "¿Restaurar área?",
      text: row.name || row.code || "",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, restaurar",
      cancelButtonText: "Cancelar",
    });
    if (!res.isConfirmed) return;
    await restoreArea(row.id);
    setFilter("activos");
    await load();
    await Swal.fire({
      icon: "success",
      title: "Área restaurada",
      toast: true,
      timer: 2000,
      position: "top-end",
      showConfirmButton: false
    });
  };

  const filtered = items.filter((x) => {
    const matchesSearch =
      (x.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (x.areaCode || "").toLowerCase().includes(search.toLowerCase());

    if (filter === "todos") return matchesSearch;
    if (filter === "activos") return matchesSearch && (x.active === true);
    return matchesSearch && (x.active === false);
  });

  const filteredSorted = [...filtered].sort((a, b) => {
    const ac = String(a.code || "");
    const bc = String(b.code || "");
    const anum = parseInt((ac.match(/\d+/) || ["999999"])[0], 10);
    const bnum = parseInt((bc.match(/\d+/) || ["999999"])[0], 10);
    if (!isNaN(anum) && !isNaN(bnum) && anum !== bnum) return anum - bnum;
    return ac.localeCompare(bc, undefined, { numeric: true, sensitivity: "base" });
  });

  const total = items.length;
  const totalActivas = items.filter((x) => (x.active ?? x.activo ?? false)).length;
  const totalInactivas = total - totalActivas;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      {/* Header - Verde Esmeralda */}
      <div className="bg-emerald-600 shadow-lg mb-8 rounded-2xl">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                <FaLayerGroup className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Gestión de Áreas
                </h1>
                <p className="text-emerald-100 text-sm font-medium">
                  Administración de áreas organizacionales
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-5 py-2.5 bg-transparent border-2 border-white/70 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-200 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nueva Área
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas Profesionales */}
      <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total */}
          <div className="bg-white border-l-4 border-l-emerald-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Áreas</p>
                <p className="text-3xl font-bold text-slate-800">{total}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-500">
                <FaLayerGroup className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Activas */}
          <div className="bg-white border-l-4 border-l-green-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Activas</p>
                <p className="text-3xl font-bold text-slate-800">{totalActivas}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-green-50 text-green-500">
                <FaCheckCircle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Inactivas */}
          <div className="bg-white border-l-4 border-l-amber-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Inactivas</p>
                <p className="text-3xl font-bold text-slate-800">{totalInactivas}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-500">
                <FaBan className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Buscar
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm font-medium"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Estado
            </label>
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
              >
                <option value="todos">Todas</option>
                <option value="activos">Activas</option>
                <option value="inactivos">Inactivas</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {/* Tabla Profesional */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-600"></div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-emerald-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Ubicación Física
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Presupuesto Anual
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSorted.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mb-6">
                          <FaLayerGroup className="w-12 h-12 text-slate-400" />
                        </div>
                        <p className="text-xl font-semibold text-slate-700 mb-2">No se encontraron áreas</p>
                        <p className="text-slate-500">Intenta con otros filtros o agrega una nueva área</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSorted.map((row) => (
                    <tr
                      key={row.id}
                      className="group hover:bg-slate-50 transition-all duration-200 border-l-4 border-l-emerald-500 hover:border-l-emerald-600 bg-white"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900">{row.areaCode || "-"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-900">{row.name || "-"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">
                          {row.physicalLocation || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">
                          {row.phone || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">
                          {row.email || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-slate-900">
                          {row.annualBudget ? (
                            <>S/ {new Intl.NumberFormat('es-PE', {
                              style: 'decimal',
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            }).format(row.annualBudget)}</>
                          ) : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-all duration-200"
                            title="Ver detalles"
                            aria-label="Ver detalles"
                            onClick={(e) => { e.stopPropagation(); handleViewDetail(row); }}
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="Editar"
                            aria-label="Editar"
                            onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          {!row.active && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onRestore(row); }}
                              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200"
                              title="Restaurar"
                            >
                              <FaUndo className="w-4 h-4" />
                            </button>
                          )}
                          {row.active && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onDelete(row); }}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                              title="Inactivar"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modales */}
      <AreaModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        area={selectedArea}
      />

      <AreaDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleDetailModalClose}
        area={selectedArea}
      />
    </div>
  );
}

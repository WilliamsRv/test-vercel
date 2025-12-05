import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FaPlusCircle } from "react-icons/fa";
import { createCategory, getAllActiveCategories, getAllInactiveCategories } from "../../services/apiCategory";

const CrearCategoria = ({ onClose, onCreated }) => {
    const [categoriasPadre, setCategoriasPadre] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [categoria, setCategoria] = useState({
        categoryCode: "",
        name: "",
        description: "",
        accountingAccount: "",
        annualDepreciation: 0,
        usefulLifeYears: 0,
        parentCategoryId: null,
        isInventoriable: false,
        requiresSerial: false,
        requiresPlate: false,
        level: 1,
        residualValuePct: 0,
        municipalityId: "24ad12a5-d9e5-4cdd-91f1-8fd0355c9473",
    });

    const generarCodigoCategoria = (categorias) => {
        if (!categorias || categorias.length === 0) return "CAT-001";
        const numeros = categorias
            .map((c) => {
                const match = c.categoryCode?.match(/CAT-(\d+)/);
                return match ? parseInt(match[1], 10) : 0;
            })
            .filter((n) => !isNaN(n));
        const maxNum = numeros.length > 0 ? Math.max(...numeros) : 0;
        return `CAT-${(maxNum + 1).toString().padStart(3, "0")}`;
    };

    useEffect(() => {
        const fetchCategorias = async () => {
            try {
                const [actives, inactives] = await Promise.all([
                    getAllActiveCategories(),
                    getAllInactiveCategories(),
                ]);
                const allCategoriesData = [...actives, ...inactives];
                setCategoriasPadre(actives);
                setAllCategories(allCategoriesData);
                const nuevoCodigo = generarCodigoCategoria(allCategoriesData);
                setCategoria((prev) => ({ ...prev, categoryCode: nuevoCodigo }));
            } catch (error) {
                console.error("Error cargando categorías:", error);
            }
        };
        fetchCategorias();
    }, []);


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCategoria((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value === "" ? null : value,
        }));
    };

    /**
     * Valida todos los campos de la categoría
     * @returns {object} { válido: boolean, errores: array<string> }
     */
    const validarCategoria = () => {
        const errores = [];
        const regexLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s.,-]+$/;

        // Validar nombre
        if (!categoria.name?.trim()) {
            errores.push("El nombre es obligatorio.");
        } else if (!regexLetras.test(categoria.name)) {
            errores.push("El nombre solo puede contener letras, espacios y algunos signos (.,-).");
        } else if (categoria.name.length < 3 || categoria.name.length > 50) {
            errores.push("El nombre debe tener entre 3 y 50 caracteres.");
        }

        // Validar descripción
        if (!categoria.description?.trim()) {
            errores.push("La descripción es obligatoria.");
        } else if (!regexLetras.test(categoria.description)) {
            errores.push("La descripción solo puede contener letras, espacios y algunos signos (.,-).");
        } else if (categoria.description.length < 5 || categoria.description.length > 200) {
            errores.push("La descripción debe tener entre 5 y 200 caracteres.");
        }

        // Validar duplicado por nombre
        if (categoria.name?.trim()) {
            const normalizarString = (str) =>
                str?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() || "";
            const nombreNormalizado = normalizarString(categoria.name);
            const nombreDuplicado = allCategories.some(
                (c) => normalizarString(c.name) === nombreNormalizado
            );
            if (nombreDuplicado) {
                errores.push("Ya existe una categoría con ese nombre (activa o inactiva).");
            }
        }

        // Validar campos numéricos
        const camposNumericos = [
            { campo: "accountingAccount", nombre: "Cuenta Contable", min: 0, max: null, regex: /^(?!0000$)[0-9]{4}$/ },
            { campo: "annualDepreciation", nombre: "Depreciación Anual (%)", min: 10, max: 50 },
            { campo: "usefulLifeYears", nombre: "Vida Útil (Años)", min: 2, max: 50 },
            { campo: "residualValuePct", nombre: "Valor Residual (%)", min: 5, max: 30 },
            { campo: "level", nombre: "Nivel", min: 1, max: null },
        ];

        for (const { campo, nombre, min, max, regex } of camposNumericos) {
            const valor = categoria[campo];

            if (valor === "" || valor === null || valor === undefined) {
                errores.push(`${nombre} es obligatorio.`);
                continue;
            }

            const numero = Number(valor);
            if (isNaN(numero)) {
                errores.push(`${nombre} debe ser un número.`);
                continue;
            }

            if (min !== null && numero < min) {
                errores.push(`${nombre} debe ser mayor o igual a ${min}.`);
            }

            if (max !== null && numero > max) {
                errores.push(`${nombre} no puede superar ${max}.`);
            }

            if (regex && !regex.test(String(valor))) {
                errores.push(`${nombre} tiene un formato incorrecto (debe ser exactamente 4 dígitos y no puede ser 0000).`);
            }
        }

        // Validar nivel vs categoría padre
        const parent = allCategories.find((c) => c.id === categoria.parentCategoryId);
        if (parent && Number(categoria.level) <= Number(parent.level)) {
            errores.push("El nivel debe ser mayor que el de la categoría padre.");
        }

        return {
            válido: errores.length === 0,
            errores,
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validar todos los campos
        const { válido, errores } = validarCategoria();

        if (!válido) {
            const listaErrores = errores
                .map((err, idx) => `<li style="margin-bottom: 8px; color: #dc2626;">${idx + 1}. ${err}</li>`)
                .join("");
            Swal.fire({
                title: "Errores en el formulario",
                html: `<ul style="text-align: left; font-size: 0.9rem; line-height: 1.8; list-style-position: inside; padding: 0;">${listaErrores}</ul>`,
                icon: "warning",
                confirmButtonText: "Entendido",
            });
            return;
        }

        const confirm = await Swal.fire({
            title: "¿Deseas crear esta categoría?",
            text: "Se registrará una nueva categoría con los datos ingresados.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, crear",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#16a34a",
            cancelButtonColor: "#d33",
        });

        if (!confirm.isConfirmed) return;

        // Crear categoría
        try {
            Swal.fire({
                title: "Creando categoría...",
                text: "Por favor, espera unos segundos.",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => Swal.showLoading(),
            });

            await createCategory({
                ...categoria,
                annualDepreciation: Number(categoria.annualDepreciation),
                usefulLifeYears: Number(categoria.usefulLifeYears),
                residualValuePct: Number(categoria.residualValuePct),
                level: Number(categoria.level),
                parentCategoryId: categoria.parentCategoryId || null,
            });

            Swal.close();
            await Swal.fire("Creada", "La categoría ha sido creada correctamente.", "success");

            onCreated?.();
            onClose?.();
        } catch (error) {
            console.error("Error al crear categoría:", error);
            Swal.close();
            Swal.fire("Error", "No se pudo crear la categoría.", "error");
        }
    };



    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Encabezado */}
                <div className="bg-green-600 text-white p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FaPlusCircle className="text-2xl" />
                        <h2 className="text-xl font-semibold">Crear Nueva Categoría</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white text-2xl hover:text-gray-200"
                    >
                        ✕
                    </button>
                </div>

                {/* Formulario */}
                <div className="overflow-y-auto p-6">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-gray-700">

                        {/* Código */}
                        <div>
                            <label className="block text-sm font-semibold mb-1">Código</label>
                            <input
                                type="text"
                                name="categoryCode"
                                value={categoria.categoryCode}
                                readOnly
                                className="w-full border px-3 py-2 rounded-md bg-gray-100 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">Código generado automáticamente.</p>
                        </div>

                        {/* Nombre */}
                        <div>
                            <label className="block text-sm font-semibold mb-1">Nombre</label>
                            <input
                                type="text"
                                name="name"
                                value={categoria.name || ""}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, "");
                                    setCategoria((prev) => ({
                                        ...prev,
                                        name: value,
                                    }));
                                }}
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Nombre único de la categoría (solo letras, por ejemplo, "Vehículos", "Equipos de Cómputo").
                            </p>
                        </div>

                        {/* Descripción */}
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-semibold mb-1">Descripción</label>
                            <textarea
                                name="description"
                                value={categoria.description || ""}
                                onChange={handleChange}
                                rows={3}
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500 resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Explica brevemente el propósito o tipo de activos que abarca esta categoría.
                            </p>
                        </div>

                        {/* Cuenta contable */}
                        <div>
                            <label className="block text-sm font-semibold mb-1">Cuenta Contable</label>
                            <input
                                type="text"
                                name="accountingAccount"
                                value={categoria.accountingAccount || ""}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                                    setCategoria((prev) => ({
                                        ...prev,
                                        accountingAccount: value,
                                    }));
                                }}
                                placeholder="0000"
                                maxLength="4"
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Número de cuenta contable (exactamente 4 dígitos, por ejemplo, 1041).
                            </p>
                        </div>

                        {/* Depreciación anual */}
                        <div>
                            <label className="block text-sm font-semibold mb-1">Depreciación Anual (%)</label>
                            <input
                                type="number"
                                name="annualDepreciation"
                                value={categoria.annualDepreciation ?? 0}
                                min={0}
                                max={100}
                                onChange={(e) =>
                                    handleChange({
                                        target: {
                                            name: "annualDepreciation",
                                            value: Math.min(100, Math.max(0, Number(e.target.value))),
                                        },
                                    })
                                }
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Porcentaje anual de depreciación que se aplicará a los activos de esta categoría.
                            </p>
                        </div>

                        {/* Vida útil */}
                        <div>
                            <label className="block text-sm font-semibold mb-1">Vida Útil (Años)</label>
                            <input
                                type="number"
                                name="usefulLifeYears"
                                value={categoria.usefulLifeYears ?? 0}
                                min={0}
                                onChange={(e) =>
                                    handleChange({
                                        target: {
                                            name: "usefulLifeYears",
                                            value: Math.max(0, Number(e.target.value)),
                                        },
                                    })
                                }
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Número estimado de años durante los cuales el activo se considera útil.
                            </p>
                        </div>

                        {/* Valor residual */}
                        <div>
                            <label className="block text-sm font-semibold mb-1">Valor Residual (%)</label>
                            <input
                                type="number"
                                name="residualValuePct"
                                value={categoria.residualValuePct ?? 0}
                                min={0}
                                max={100}
                                onChange={(e) =>
                                    handleChange({
                                        target: {
                                            name: "residualValuePct",
                                            value: Math.min(100, Math.max(0, Number(e.target.value))),
                                        },
                                    })
                                }
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Porcentaje del valor original que conserva el activo al final de su vida útil.
                            </p>
                        </div>

                        {/* Nivel */}
                        <div>
                            <label className="block text-sm font-semibold mb-1">Nivel</label>
                            <input
                                type="number"
                                name="level"
                                value={categoria.level ?? 0}
                                min={0} 
                                onChange={(e) =>
                                    handleChange({
                                        target: {
                                            name: "level",
                                            value: Math.max(0, Number(e.target.value)),
                                        },
                                    })
                                }
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Nivel jerárquico de la categoría (por ejemplo, 1 para principal, 2 para subcategoría).
                            </p>
                        </div>

                        {/* Categoría Padre */}
                        <div>
                            <label className="block text-sm font-semibold mb-1">Categoría Padre</label>
                            <select
                                name="parentCategoryId"
                                value={categoria.parentCategoryId || ""}
                                onChange={handleChange}
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500"
                            >
                                <option value="">— Ninguna —</option>
                                {categoriasPadre.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Solo se muestran categorías activas disponibles.
                            </p>
                        </div>

                        {/* Nivel de Categoría Padre */}
                        {categoria.parentCategoryId && (
                            <div>
                                <label className="block text-sm font-semibold mb-1">Nivel de Categoría Padre</label>
                                <div className="w-full border rounded-md p-2 bg-gray-50 text-gray-700 flex items-center gap-2">
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                        {allCategories.find((c) => c.id === categoria.parentCategoryId)?.level || "—"}
                                    </span>
                                    <span className="text-sm">
                                        {allCategories.find((c) => c.id === categoria.parentCategoryId)?.name}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Tu categoría debe tener un nivel superior a este.
                                </p>
                            </div>
                        )}

                        {/* Checkboxes */}
                        <div className="sm:col-span-2 flex flex-wrap gap-6 mt-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="requiresSerial"
                                    checked={categoria.requiresSerial}
                                    onChange={handleChange}
                                />
                                <span>Requiere Serie</span>
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="requiresPlate"
                                    checked={categoria.requiresPlate}
                                    onChange={handleChange}
                                />
                                <span>Requiere Placa</span>
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="isInventoriable"
                                    checked={categoria.isInventoriable}
                                    onChange={handleChange}
                                />
                                <span>Es Inventariable</span>
                            </label>
                        </div>

                        {/* Botones */}
                        <div className="sm:col-span-2 flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition"
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition"
                            >
                                Crear
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CrearCategoria;
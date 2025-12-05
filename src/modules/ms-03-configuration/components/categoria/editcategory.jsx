import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FaEdit } from "react-icons/fa";
import { updateCategory, getAllActiveCategories, getAllInactiveCategories } from "../../services/apiCategory";

const EditarCategoria = ({ categoria, onClose, onUpdated }) => {
    const [form, setForm] = useState({
        categoryCode: categoria.categoryCode || "",
        name: categoria.name || "",
        description: categoria.description || "",
        accountingAccount: categoria.accountingAccount || "",
        annualDepreciation: categoria.annualDepreciation || "",
        usefulLifeYears: categoria.usefulLifeYears || "",
        residualValuePct: categoria.residualValuePct || "",
        level: categoria.level || 1,
        requiresSerial: categoria.requiresSerial || false,
        requiresPlate: categoria.requiresPlate || false,
        isInventoriable: categoria.isInventoriable || false,
        parentCategoryId: categoria.parentCategoryId || null,
        municipalityId: "24ad12a5-d9e5-4cdd-91f1-8fd0355c9473",
    });

    const [allCategories, setAllCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const [active, inactive] = await Promise.all([
                    getAllActiveCategories(),
                    getAllInactiveCategories()
                ]);
                const all = [...active, ...inactive];
                const filteredCategories = all
                    .filter(c => c.id !== categoria.id)
                    .sort((a, b) => a.name.localeCompare(b.name));
                setAllCategories(filteredCategories);
            } catch (error) {
                console.error("Error al cargar categorías:", error);
            }
        };
        fetchCategories();
    }, [categoria.id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({
            ...form,
            [name]: type === "checkbox" ? checked : value === "" ? null : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validaciones centralizadas
        const errores = [];
        const regexLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s.,-]+$/;

        // Nombre y descripción
        if (!form.name?.toString().trim()) errores.push("El nombre es obligatorio.");
        else if (!regexLetras.test(form.name)) errores.push("El nombre solo puede contener letras, espacios y algunos signos (.,-). ");
        else if (form.name.toString().length < 3 || form.name.toString().length > 50) errores.push("El nombre debe tener entre 3 y 50 caracteres.");

        if (!form.description?.toString().trim()) errores.push("La descripción es obligatoria.");
        else if (!regexLetras.test(form.description)) errores.push("La descripción solo puede contener letras, espacios y algunos signos (.,-). ");
        else if (form.description.toString().length < 5 || form.description.toString().length > 200) errores.push("La descripción debe tener entre 5 y 200 caracteres.");

        // Duplicado
        if (form.name?.trim()) {
            const normalizarString = (str) =>
                str?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() || "";
            const nombreNormalizado = normalizarString(form.name);
            const nombreDuplicado = allCategories.some(
                (c) => normalizarString(c.name) === nombreNormalizado
            );
            if (nombreDuplicado) {
                errores.push("Ya existe una categoría con ese nombre (activa o inactiva).");
            }
        }

        // Campos numéricos
        const camposNumericos = [
            { campo: "accountingAccount", nombre: "Cuenta Contable", min: 0, max: null, regex: /^(?!0000$)[0-9]{4}$/ },
            { campo: "annualDepreciation", nombre: "Depreciación Anual (%)", min: 10, max: 50 },
            { campo: "usefulLifeYears", nombre: "Vida Útil (Años)", min: 2, max: 50 },
            { campo: "residualValuePct", nombre: "Valor Residual (%)", min: 5, max: 30 },
            { campo: "level", nombre: "Nivel", min: 1, max: null },
        ];

        for (const { campo, nombre, min, max, regex } of camposNumericos) {
            const valor = form[campo];

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
                errores.push(`${nombre} tiene un formato incorrecto.`);
            }
        }

        // Nivel vs categoría padre
        const parent = allCategories.find((c) => c.id === form.parentCategoryId);
        if (parent && Number(form.level) <= Number(parent.level)) {
            errores.push("El nivel debe ser mayor que el de la categoría padre.");
        }

        if (errores.length > 0) {
            const listaErrores = errores.map((err, idx) => `<li style="margin-bottom: 8px; color: #dc2626;">${idx + 1}. ${err}</li>`).join("");
            Swal.fire({
                title: "Errores en el formulario",
                html: `<ul style="text-align: left; font-size: 0.9rem; line-height: 1.8; list-style-position: inside; padding: 0;">${listaErrores}</ul>`,
                icon: "warning",
                confirmButtonText: "Entendido",
            });
            return;
        }

        const confirm = await Swal.fire({
            title: "¿Deseas guardar los cambios?",
            text: "Se actualizarán los datos de esta categoría.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, guardar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#2563eb",
            cancelButtonColor: "#d33",
        });

        if (!confirm.isConfirmed) return;

        try {
            Swal.fire({
                title: "Actualizando categoría...",
                text: "Por favor, espera unos segundos.",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => Swal.showLoading(),
            });

            await updateCategory(categoria.id, {
                ...form,
                annualDepreciation: Number(form.annualDepreciation),
                usefulLifeYears: Number(form.usefulLifeYears),
                residualValuePct: Number(form.residualValuePct),
                level: Number(form.level),
                parentCategoryId: form.parentCategoryId || null,
            });

            Swal.close();
            await Swal.fire("Actualizada", "La categoría se actualizó correctamente.", "success");

            onUpdated?.();
            onClose?.();
        } catch (error) {
            console.error("Error al actualizar categoría:", error);
            Swal.close();
            Swal.fire("Error", "No se pudo actualizar la categoría.", "error");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Encabezado */}
                <div className="bg-blue-600 text-white p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FaEdit className="text-2xl" />
                        <h2 className="text-xl font-semibold">Editar Categoría</h2>
                    </div>
                    <button onClick={onClose} className="text-white text-2xl hover:text-gray-200">✕</button>
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
                                value={form.categoryCode}
                                readOnly
                                className="w-full border px-3 py-2 rounded-md bg-gray-100 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">Código interno generado automáticamente.</p>
                        </div>

                        {/* Nombre */}
                        <div>
                            <label className="block text-sm font-semibold mb-1">Nombre</label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, "");
                                    setForm((prev) => ({ ...prev, name: value }));
                                }}
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Nombre único de la categoría (solo letras, por ejemplo, “Vehículos”, “Equipos de Cómputo”).
                            </p>
                        </div>

                        {/* Descripción */}
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-semibold mb-1">Descripción</label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 resize-none"
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
                                value={form.accountingAccount || ""}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                                    setForm((prev) => ({ ...prev, accountingAccount: value }));
                                }}
                                placeholder="0000"
                                maxLength="4"
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Número de cuenta contable (exactamente 4 dígitos, por ejemplo, 1041).</p>
                        </div>

                        {/* Depreciación anual */}
                        <div>
                            <label className="block text-sm font-semibold mb-1">Depreciación Anual (%)</label>
                            <input
                                type="number"
                                name="annualDepreciation"
                                value={form.annualDepreciation}
                                min={0}
                                max={100}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, annualDepreciation: Math.min(100, Math.max(0, Number(e.target.value))) }))
                                }
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Porcentaje anual de depreciación.</p>
                        </div>

                        {/* Vida útil */}
                        <div>
                            <label className="block text-sm font-semibold mb-1">Vida Útil (Años)</label>
                            <input
                                type="number"
                                name="usefulLifeYears"
                                value={form.usefulLifeYears}
                                min={0}
                                max={100}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, usefulLifeYears: Math.max(0, Number(e.target.value)) }))
                                }
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Años durante los cuales el activo es útil.</p>
                        </div>

                        {/* Valor residual */}
                        <div>
                            <label className="block text-sm font-semibold mb-1">Valor Residual (%)</label>
                            <input
                                type="number"
                                name="residualValuePct"
                                value={form.residualValuePct}
                                min={0}
                                max={100}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, residualValuePct: Math.min(100, Math.max(0, Number(e.target.value))) }))
                                }
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Porcentaje del valor original conservado.</p>
                        </div>

                        {/* Nivel */}
                        <div>
                            <label className="block text-sm font-semibold mb-1">Nivel</label>
                            <input
                                type="number"
                                name="level"
                                value={form.level}
                                min={1}
                                onChange={(e) => setForm((prev) => ({ ...prev, level: Math.max(1, Number(e.target.value)) }))}
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Nivel jerárquico (1=principal, 2=subcategoría...).</p>
                        </div>

                        {/* Categoría padre */}
                        <div>
                            <label className="block text-sm font-semibold mb-1">Categoría Padre</label>
                            <select
                                name="parentCategoryId"
                                value={form.parentCategoryId || ""}
                                onChange={handleChange}
                                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">— Ninguna —</option>
                                {allCategories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Solo se muestran categorías activas.</p>
                        </div>

                        {/* Nivel de Categoría Padre */}
                        {form.parentCategoryId && (
                            <div>
                                <label className="block text-sm font-semibold mb-1">Nivel de Categoría Padre</label>
                                <div className="w-full border rounded-md p-2 bg-gray-50 text-gray-700 flex items-center gap-2">
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                        {allCategories.find((c) => c.id === form.parentCategoryId)?.level || "—"}
                                    </span>
                                    <span className="text-sm">
                                        {allCategories.find((c) => c.id === form.parentCategoryId)?.name}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Tu categoría debe tener un nivel superior a este.</p>
                            </div>
                        )}

                        {/* Checkboxes */}
                        <div className="sm:col-span-2 flex flex-wrap gap-6 mt-2">
                            {[
                                { name: "requiresSerial", label: "Requiere Serie" },
                                { name: "requiresPlate", label: "Requiere Placa" },
                                { name: "isInventoriable", label: "Es Inventariable" }
                            ].map((chk) => (
                                <label key={chk.name} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name={chk.name}
                                        checked={form[chk.name]}
                                        onChange={handleChange}
                                    />
                                    <span>{chk.label}</span>
                                </label>
                            ))}
                        </div>

                        {/* Botones */}
                        <div className="sm:col-span-2 text-right mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-gray-200 text-gray-700 px-5 py-2 rounded-md hover:bg-gray-300 mr-3"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditarCategoria;
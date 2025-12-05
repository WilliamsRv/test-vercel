import { useEffect, useState } from "react";
import documentTypeService from "../../services/documentTypeService";

export default function PersonDetailModal({ isOpen, onClose, person }) {
  const [documentTypeName, setDocumentTypeName] = useState("");

  useEffect(() => {
    if (isOpen && person?.documentTypeId) {
      loadDocumentType();
    }
  }, [isOpen, person]);

  const loadDocumentType = async () => {
    try {
      const docType = await documentTypeService.getDocumentTypeById(person.documentTypeId);
      if (docType) {
        setDocumentTypeName(docType.code || docType.name || "");
      }
    } catch (error) {
      console.error("Error loading document type:", error);
      setDocumentTypeName("");
    }
  };

  if (!isOpen || !person) return null;

  const getPersonStatus = (person) => {
    if (typeof person.status === "boolean") {
      return person.status ? "ACTIVE" : "INACTIVE";
    }
    if (typeof person.active === "boolean") {
      return person.active ? "ACTIVE" : "INACTIVE";
    }
    return "ACTIVE";
  };

  const formatDate = (date) => {
    if (!date) return "-";
    try {
      let dateObj;
      if (Array.isArray(date)) {
        const [year, month, day] = date;
        dateObj = new Date(year, month - 1, day);
      } else {
        dateObj = new Date(date);
      }
      if (isNaN(dateObj.getTime())) return "-";
      return new Intl.DateTimeFormat("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(dateObj);
    } catch {
      return "-";
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    try {
      let dateObj;
      if (Array.isArray(birthDate)) {
        const [year, month, day] = birthDate;
        dateObj = new Date(year, month - 1, day);
      } else {
        dateObj = new Date(birthDate);
      }
      const today = new Date();
      let age = today.getFullYear() - dateObj.getFullYear();
      const monthDiff = today.getMonth() - dateObj.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateObj.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  };

  const age = calculateAge(person.birthDate);
  const personStatus = getPersonStatus(person);

  const getStatusInfo = (status) => {
    const statuses = {
      ACTIVE: {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        border: "border-emerald-200",
        icon: "✓",
        label: "Activo",
      },
      INACTIVE: {
        bg: "bg-slate-100",
        text: "text-slate-700",
        border: "border-slate-200",
        icon: "○",
        label: "Inactivo",
      },
    };
    return statuses[status] || statuses.INACTIVE;
  };

  const statusInfo = getStatusInfo(personStatus);

  return (
    <div className="fixed inset-0 bg-gray-900/75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200">
        {/* Header Profesional Azul */}
        <div className="bg-blue-600 text-white px-6 py-5 rounded-t-2xl">
          <div className="relative flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${personStatus === "ACTIVE" ? "bg-green-400" : "bg-slate-400"
                  }`}></div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    {person.fullName || "Sin nombre"}
                  </h2>
                  <p className="text-blue-100 text-sm">
                    {statusInfo.label}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-blue-100 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido - Grid de Cards con línea azul */}
        <div className="p-5 bg-slate-50 rounded-b-2xl border-l-4 border-l-blue-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Card: Información Personal */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Información Personal
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2.5">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                      Tipo de Persona
                    </label>
                    <p className="text-sm font-semibold text-slate-900 break-words whitespace-normal leading-relaxed">
                      {person.personType === "NATURAL" ? "Persona Natural" : "Persona Jurídica"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                      Tipo de Documento
                    </label>
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {documentTypeName || person.documentType || "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 col-span-2">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                      Número de Documento
                    </label>
                    <p className="text-sm font-mono font-semibold text-slate-900">
                      {person.documentNumber || "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                      Fecha de Nacimiento
                    </label>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatDate(person.birthDate)}
                    </p>
                  </div>
                </div>
                {age !== null && (
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                        Edad
                      </label>
                      <p className="text-sm font-semibold text-slate-900">
                        {age} años
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2 col-span-2">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                      Género
                    </label>
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium ${person.gender === "M" ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-pink-100 text-pink-700 border border-pink-200"
                      }`}>
                      {person.gender === "M" ? "Masculino" : "Femenino"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Información de Contacto */}
            {(person.personalEmail || person.personalPhone || person.workPhone) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow h-fit border-l-4 border-l-blue-500">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Información de Contacto
                  </h3>
                </div>
                <div className="space-y-3">
                  {person.personalEmail && (
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                          Email Personal
                        </label>
                        <p className="text-sm text-blue-600 font-medium break-all">
                          {person.personalEmail}
                        </p>
                      </div>
                    </div>
                  )}
                  {person.personalPhone && (
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                          Número Celular
                        </label>
                        <p className="text-sm font-mono font-medium text-slate-900">
                          {person.personalPhone}
                        </p>
                      </div>
                    </div>
                  )}
                  {person.workPhone && (
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 3l-6 6m0 0V4m0 5h5M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                          Teléfono de Trabajo
                        </label>
                        <p className="text-sm font-mono font-medium text-slate-900">
                          {person.workPhone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Card: Dirección */}
            {person.address && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow h-fit border-l-4 border-l-blue-500">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Dirección
                  </h3>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                      Dirección Completa
                    </label>
                    <p className="text-sm font-medium text-slate-900 leading-relaxed">
                      {person.address}
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

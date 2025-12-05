import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import documentTypeService from "../../services/documentTypeService";
import personService from "../../services/personService";

export default function PersonModal({ isOpen, onClose, person, onSuccess }) {
  const [formData, setFormData] = useState({
    documentTypeId: "",
    documentNumber: "",
    personType: "N",
    firstName: "",
    lastName: "",
    middleName: "",
    birthDate: "",
    gender: "M",
    personalPhone: "",
    workPhone: "",
    personalEmail: "",
    address: "",
  });

  const [documentTypes, setDocumentTypes] = useState([]);
  const [allDocumentTypes, setAllDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      // Cargar tipos de documento con el tipo de persona correcto
      const personTypeToUse = person?.personType || "N";
      loadDocumentTypes(personTypeToUse);
    }
  }, [isOpen, person]);

  useEffect(() => {
    if (person) {
      let formattedBirthDate = "";
      if (person.birthDate) {
        try {
          let dateObj;
          if (Array.isArray(person.birthDate)) {
            const [year, month, day] = person.birthDate;
            dateObj = new Date(year, month - 1, day);
          } else {
            dateObj = new Date(person.birthDate);
          }
          if (!isNaN(dateObj.getTime())) {
            formattedBirthDate = dateObj.toISOString().split('T')[0];
          }
        } catch (error) {
          console.warn("Error al formatear fecha:", error);
        }
      }

      setFormData({
        documentTypeId: person.documentTypeId || "",
        documentNumber: person.documentNumber || "",
        personType: person.personType || "N",
        firstName: person.firstName || "",
        lastName: person.lastName || "",
        middleName: person.middleName || "",
        birthDate: formattedBirthDate,
        gender: person.gender || "M",
        personalPhone: person.personalPhone || "",
        workPhone: person.workPhone || "",
        personalEmail: person.personalEmail || "",
        address: person.address || "",
      });
    } else {
      setFormData({
        documentTypeId: "",
        documentNumber: "",
        personType: "N",
        firstName: "",
        lastName: "",
        middleName: "",
        birthDate: "",
        gender: "M",
        personalPhone: "",
        workPhone: "",
        personalEmail: "",
        address: "",
      });
    }
  }, [person, isOpen]);

  const loadDocumentTypes = async (personTypeOverride = null) => {
    try {
      const types = await documentTypeService.getActiveDocumentTypes();
      setAllDocumentTypes(types);
      
      // Usar el tipo de persona proporcionado o el del formulario
      const personTypeToFilter = personTypeOverride || formData.personType;
      filterDocumentTypes(personTypeToFilter, types);
    } catch (error) {
      console.error('Error loading document types:', error);
    }
  };

  const filterDocumentTypes = (personType, types = allDocumentTypes) => {
    if (!types || types.length === 0) return;
    
    let filtered = [];
    if (personType === "N") {
      // Persona Natural: DNI, CE, Pasaporte (excluir RUC)
      filtered = types.filter(t => t.code !== "RUC");
    } else if (personType === "J") {
      // Persona Jurídica: Solo RUC
      filtered = types.filter(t => t.code === "RUC");
    }
    
    setDocumentTypes(filtered);
    
    // Si el tipo de documento actual no está en los filtrados, limpiarlo
    if (formData.documentTypeId) {
      const isValid = filtered.some(t => t.id === parseInt(formData.documentTypeId));
      if (!isValid) {
        setFormData(prev => ({ ...prev, documentTypeId: "", documentNumber: "" }));
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Si cambia el tipo de persona, filtrar tipos de documento
    if (name === "personType") {
      filterDocumentTypes(value);
    }
    
    // Validación especial para número de documento
    if (name === "documentNumber") {
      // Solo permitir números
      const numericValue = value.replace(/\D/g, '');
      
      // Obtener el tipo de documento seleccionado
      const selectedType = documentTypes.find(t => t.id === parseInt(formData.documentTypeId));
      
      // Si hay un tipo seleccionado y tiene longitud definida, limitar
      if (selectedType && selectedType.length) {
        const maxLength = selectedType.length;
        if (numericValue.length > maxLength) {
          // No permitir más dígitos de los permitidos
          return;
        }
      }
      
      // Actualizar con el valor numérico
      setFormData(prev => ({
        ...prev,
        [name]: numericValue,
      }));
      
      // Limpiar error del campo
      if (errors[name]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
      return;
    }
    
    // Validación especial para teléfono personal
    if (name === "personalPhone") {
      // Solo permitir números
      const numericValue = value.replace(/\D/g, '');
      
      // Limitar a 9 dígitos
      if (numericValue.length > 9) {
        return;
      }
      
      // Actualizar con el valor numérico
      setFormData(prev => ({
        ...prev,
        [name]: numericValue,
      }));
      
      // Limpiar error del campo
      if (errors[name]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
      return;
    }
    
    // Validación especial para teléfono de trabajo (opcional)
    if (name === "workPhone") {
      // Solo permitir números
      const numericValue = value.replace(/\D/g, '');
      
      // Limitar a 20 dígitos
      if (numericValue.length > 20) {
        return;
      }
      
      // Actualizar con el valor numérico
      setFormData(prev => ({
        ...prev,
        [name]: numericValue,
      }));
      
      // Limpiar error del campo
      if (errors[name]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
      return;
    }
    
    // Validación especial para nombres y apellidos
    if (name === "firstName" || name === "lastName") {
      // Solo permitir letras (incluyendo acentos, ñ) y espacios
      // Eliminar números y caracteres especiales
      let cleanValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
      
      // Eliminar espacios al inicio
      cleanValue = cleanValue.replace(/^\s+/, '');
      
      // Reemplazar múltiples espacios por uno solo
      cleanValue = cleanValue.replace(/\s{2,}/g, ' ');
      
      // Limitar a 100 caracteres
      if (cleanValue.length > 100) {
        return;
      }
      
      // Actualizar con el valor limpio
      setFormData(prev => ({
        ...prev,
        [name]: cleanValue,
      }));
      
      // Limpiar error del campo
      if (errors[name]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Función para calcular la edad
  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    
    const birth = new Date(birthDate);
    const today = new Date();
    
    // Verificar que no sea fecha futura
    if (birth > today) {
      return { age: null, isFuture: true };
    }
    
    // Calcular edad
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return { age, isFuture: false, isAdult: age >= 18 };
  };

  const validateAge = (birthDate) => {
    if (!birthDate) return false;
    
    const result = calculateAge(birthDate);
    
    if (result.isFuture) {
      return { valid: false, message: "La fecha de nacimiento no puede ser futura" };
    }
    
    if (!result.isAdult) {
      return { valid: false, message: `Debe ser mayor de 18 años (tiene ${result.age} años)` };
    }
    
    return { valid: true, age: result.age };
  };

  const validatePhone = (phone) => {
    if (!phone) return { valid: false, message: "El teléfono es obligatorio" };
    
    // Eliminar espacios y guiones
    const cleanPhone = phone.replace(/[\s-]/g, '');
    
    // Debe tener exactamente 9 dígitos
    if (cleanPhone.length !== 9) {
      return { valid: false, message: "El teléfono debe tener 9 dígitos" };
    }
    
    // Debe comenzar con 9
    if (!cleanPhone.startsWith('9')) {
      return { valid: false, message: "El teléfono debe comenzar con 9" };
    }
    
    // Solo números
    if (!/^\d+$/.test(cleanPhone)) {
      return { valid: false, message: "El teléfono solo debe contener números" };
    }
    
    return { valid: true };
  };

  const validateEmail = (email) => {
    if (!email) return { valid: true }; // Es opcional
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, message: "El formato del email no es válido" };
    }
    
    if (email.length > 200) {
      return { valid: false, message: "El email no puede exceder 200 caracteres" };
    }
    
    return { valid: true };
  };

  const validateForm = () => {
    const newErrors = {};

    // Tipo de documento
    if (!formData.documentTypeId) {
      newErrors.documentTypeId = "El tipo de documento es obligatorio";
    }

    // Número de documento
    if (!formData.documentNumber) {
      newErrors.documentNumber = "El número de documento es obligatorio";
    } else {
      const selectedType = documentTypes.find(t => t.id === parseInt(formData.documentTypeId));
      if (selectedType && selectedType.length) {
        if (formData.documentNumber.length !== selectedType.length) {
          newErrors.documentNumber = `El ${selectedType.code} debe tener ${selectedType.length} dígitos`;
        }
      }
    }

    // Nombres
    if (!formData.firstName) {
      newErrors.firstName = "El nombre es obligatorio";
    } else if (formData.firstName.length < 2 || formData.firstName.length > 100) {
      newErrors.firstName = "El nombre debe tener entre 2 y 100 caracteres";
    }

    // Apellidos
    if (!formData.lastName) {
      newErrors.lastName = "El apellido es obligatorio";
    } else if (formData.lastName.length < 2 || formData.lastName.length > 100) {
      newErrors.lastName = "El apellido debe tener entre 2 y 100 caracteres";
    }

    // Fecha de nacimiento y edad
    if (!formData.birthDate) {
      newErrors.birthDate = "La fecha de nacimiento es obligatoria";
    } else {
      const ageValidation = validateAge(formData.birthDate);
      if (!ageValidation.valid) {
        newErrors.birthDate = ageValidation.message;
      }
    }

    // Género
    if (!formData.gender) {
      newErrors.gender = "El género es obligatorio";
    }

    // Teléfono personal
    const phoneValidation = validatePhone(formData.personalPhone);
    if (!phoneValidation.valid) {
      newErrors.personalPhone = phoneValidation.message;
    }

    // Teléfono de trabajo (opcional)
    if (formData.workPhone) {
      const cleanWorkPhone = formData.workPhone.replace(/[\s-]/g, '');
      if (cleanWorkPhone.length > 0 && cleanWorkPhone.length < 7) {
        newErrors.workPhone = "El teléfono de trabajo debe tener al menos 7 dígitos";
      } else if (cleanWorkPhone.length > 20) {
        newErrors.workPhone = "El teléfono de trabajo no puede exceder 20 caracteres";
      }
    }

    // Email personal (opcional)
    const emailValidation = validateEmail(formData.personalEmail);
    if (!emailValidation.valid) {
      newErrors.personalEmail = emailValidation.message;
    }

    // Dirección
    if (!formData.address) {
      newErrors.address = "La dirección es obligatoria";
    } else if (formData.address.length < 5 || formData.address.length > 500) {
      newErrors.address = "La dirección debe tener entre 5 y 500 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkDuplicates = async () => {
    try {
      // Verificar documento duplicado
      if (formData.documentTypeId && formData.documentNumber) {
        const docExists = await personService.checkDocumentExists(
          formData.documentTypeId,
          formData.documentNumber
        );
        
        if (docExists) {
          // Si estamos editando, verificar que no sea el mismo registro
          if (!person || person.documentNumber !== formData.documentNumber) {
            return {
              isDuplicate: true,
              message: "Ya existe una persona registrada con este documento"
            };
          }
        }
      }

      // Verificar email duplicado (solo si se proporciona)
      if (formData.personalEmail) {
        const emailExists = await personService.checkEmailExists(formData.personalEmail);
        
        if (emailExists) {
          // Si estamos editando, verificar que no sea el mismo registro
          if (!person || person.personalEmail !== formData.personalEmail) {
            return {
              isDuplicate: true,
              message: "Ya existe una persona registrada con este email"
            };
          }
        }
      }

      return { isDuplicate: false };
    } catch (error) {
      console.error('Error checking duplicates:', error);
      // No bloquear el guardado si falla la verificación
      return { isDuplicate: false };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar formulario
    if (!validateForm()) {
      Swal.fire({
        title: "Errores de validación",
        text: "Por favor, corrija los errores en el formulario",
        icon: "warning",
        customClass: { confirmButton: 'btn-confirm-danger' },
      });
      return;
    }

    setLoading(true);

    try {
      // Verificar duplicados
      const duplicateCheck = await checkDuplicates();
      if (duplicateCheck.isDuplicate) {
        Swal.fire({
          title: "Registro duplicado",
          text: duplicateCheck.message,
          icon: "warning",
          customClass: { confirmButton: 'btn-confirm-danger' },
        });
        setLoading(false);
        return;
      }

      const dataToSend = {
        ...formData,
        documentTypeId: parseInt(formData.documentTypeId),
      };

      // Limpiar campos opcionales vacíos
      if (!dataToSend.workPhone) delete dataToSend.workPhone;
      if (!dataToSend.personalEmail) delete dataToSend.personalEmail;
      if (!dataToSend.middleName) delete dataToSend.middleName;

      if (person) {
        await personService.updatePerson(person.id, dataToSend);
      } else {
        await personService.createPerson(dataToSend);
      }

      onSuccess();
    } catch (error) {
      console.error('Error al guardar persona:', error);
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo guardar la persona",
        icon: "error",
        customClass: { confirmButton: 'btn-confirm-danger' },
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col border border-gray-100">
        {/* Header - Indigo */}
        <div className="px-8 py-6 border-b border-indigo-100 flex-shrink-0 flex justify-between items-center bg-indigo-600 rounded-t-3xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {person ? "Editar Persona" : "Nueva Persona"}
              </h2>
              <p className="text-indigo-100 text-sm mt-1">
                Completa los datos de la persona
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 overflow-y-auto flex-1 bg-white" style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Sección: Seleccionar Tipo de Persona (Solo al crear) */}
            {!person && (
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 border-l-4 border-l-indigo-500 border border-indigo-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  Seleccione el Tipo de Persona
                </h3>
                <p className="text-sm text-slate-600 mb-4 pl-1">
                  Primero seleccione si es una persona natural (individuo) o jurídica (empresa/organización)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, personType: 'N', documentTypeId: '' }))}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                      formData.personType === 'N'
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        formData.personType === 'N' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold text-base mb-1 ${
                          formData.personType === 'N' ? 'text-indigo-700' : 'text-slate-800'
                        }`}>
                          Persona Natural
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Individuo con DNI, Carné de Extranjería o Pasaporte
                        </p>
                      </div>
                      {formData.personType === 'N' && (
                        <div className="flex-shrink-0">
                          <svg className="w-6 h-6 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, personType: 'J', documentTypeId: '' }))}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                      formData.personType === 'J'
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        formData.personType === 'J' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold text-base mb-1 ${
                          formData.personType === 'J' ? 'text-indigo-700' : 'text-slate-800'
                        }`}>
                          Persona Jurídica
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Empresa u organización con RUC
                        </p>
                      </div>
                      {formData.personType === 'J' && (
                        <div className="flex-shrink-0">
                          <svg className="w-6 h-6 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Sección: Documento de Identidad */}
            <div className="bg-white rounded-2xl p-6 border-l-4 border-l-indigo-500 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </span>
                Documento de Identidad
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mostrar tipo de persona solo en modo edición */}
                {person && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                      Tipo de Persona <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="personType"
                      value={formData.personType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl text-slate-500 cursor-not-allowed text-sm appearance-none"
                      required
                      disabled
                    >
                      <option value="N">Persona Natural</option>
                      <option value="J">Persona Jurídica</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1.5 pl-1">No se puede cambiar el tipo de persona</p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                    Tipo de Documento <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="documentTypeId"
                    value={formData.documentTypeId}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 transition-all text-sm appearance-none cursor-pointer ${
                      errors.documentTypeId ? 'ring-2 ring-red-500' : 'focus:ring-indigo-500/20'
                    }`}
                    required
                  >
                    <option value="">Seleccione un tipo</option>
                    {documentTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.code} - {type.description}
                      </option>
                    ))}
                  </select>
                  {errors.documentTypeId && (
                    <p className="text-xs text-red-500 mt-1.5 pl-1">{errors.documentTypeId}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 pl-1">
                    <p className="text-xs text-gray-500">
                      {formData.personType === "N" ? "DNI, CE o Pasaporte para personas naturales" : "RUC para personas jurídicas"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                    Número de Documento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    name="documentNumber"
                    value={formData.documentNumber}
                    onChange={handleChange}
                    maxLength={documentTypes.find(t => t.id === parseInt(formData.documentTypeId))?.length || 20}
                    placeholder={documentTypes.find(t => t.id === parseInt(formData.documentTypeId))?.length 
                      ? `${documentTypes.find(t => t.id === parseInt(formData.documentTypeId)).length} dígitos`
                      : "Número de documento"}
                    className={`w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 transition-all text-sm ${
                      errors.documentNumber ? 'ring-2 ring-red-500' : 'focus:ring-indigo-500/20'
                    }`}
                    required
                  />
                  {errors.documentNumber && (
                    <p className="text-xs text-red-500 mt-1.5 pl-1">{errors.documentNumber}</p>
                  )}
                  {formData.documentTypeId && documentTypes.find(t => t.id === parseInt(formData.documentTypeId))?.length && (
                    <p className={`text-xs mt-1.5 pl-1 ${
                      formData.documentNumber.length === documentTypes.find(t => t.id === parseInt(formData.documentTypeId)).length
                        ? 'text-green-600 font-semibold'
                        : 'text-gray-500'
                    }`}>
                      {formData.documentNumber.length} / {documentTypes.find(t => t.id === parseInt(formData.documentTypeId)).length} dígitos
                      {formData.documentNumber.length === documentTypes.find(t => t.id === parseInt(formData.documentTypeId)).length && ' ✓'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1 flex items-center gap-2">
                    Fecha de Nacimiento <span className="text-red-500">*</span>
                    {/* Mostrar edad calculada al lado del label */}
                    {formData.birthDate && (() => {
                      const ageResult = calculateAge(formData.birthDate);
                      if (ageResult && ageResult.age !== null) {
                        return (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ageResult.isAdult
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-red-100 text-red-700 border border-red-200'
                          }`}>
                            {ageResult.age} años {ageResult.isAdult ? '✓' : '✗'}
                          </span>
                        );
                      }
                      if (ageResult && ageResult.isFuture) {
                        return (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                            Fecha inválida ✗
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 transition-all text-sm ${
                      formData.birthDate && calculateAge(formData.birthDate)?.isFuture
                        ? 'ring-2 ring-red-500'
                        : formData.birthDate && !calculateAge(formData.birthDate)?.isAdult
                        ? 'ring-2 ring-red-500'
                        : formData.birthDate && calculateAge(formData.birthDate)?.isAdult
                        ? 'ring-2 ring-green-500'
                        : errors.birthDate 
                        ? 'ring-2 ring-red-500' 
                        : 'focus:ring-indigo-500/20'
                    }`}
                    required
                  />
                  {errors.birthDate && (
                    <p className="text-xs text-red-500 mt-1.5 pl-1">{errors.birthDate}</p>
                  )}
                  {/* Mensaje dinámico según la edad */}
                  {formData.birthDate ? (
                    (() => {
                      const ageResult = calculateAge(formData.birthDate);
                      if (ageResult?.isFuture) {
                        return (
                          <p className="text-xs text-red-500 font-semibold mt-1.5 pl-1">
                            ⚠️ La fecha no puede ser futura
                          </p>
                        );
                      }
                      if (ageResult?.age !== null && !ageResult?.isAdult) {
                        return (
                          <p className="text-xs text-red-500 font-semibold mt-1.5 pl-1">
                            ⚠️ Debe ser mayor de 18 años (actualmente tiene {ageResult.age} años)
                          </p>
                        );
                      }
                      if (ageResult?.isAdult) {
                        return (
                          <p className="text-xs text-green-600 font-semibold mt-1.5 pl-1">
                            ✓ Mayor de edad ({ageResult.age} años)
                          </p>
                        );
                      }
                      return null;
                    })()
                  ) : (
                    <p className="text-xs text-gray-500 mt-1.5 pl-1">Debe ser mayor de 18 años</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sección: Datos Personales */}
            <div className="bg-white rounded-2xl p-6 border-l-4 border-l-indigo-500 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                Datos Personales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                    Nombres <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Ej: Juan Carlos"
                    className={`w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 transition-all text-sm ${
                      errors.firstName ? 'ring-2 ring-red-500' : 'focus:ring-indigo-500/20'
                    }`}
                    required
                  />
                  {errors.firstName && (
                    <p className="text-xs text-red-500 mt-1.5 pl-1">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                    Apellidos <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Ej: Pérez García"
                    className={`w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 transition-all text-sm ${
                      errors.lastName ? 'ring-2 ring-red-500' : 'focus:ring-indigo-500/20'
                    }`}
                    required
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-500 mt-1.5 pl-1">{errors.lastName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                    Género <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, gender: 'M' }))}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
                        formData.gender === 'M'
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        formData.gender === 'M' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="text-left flex-1">
                        <span className={`font-semibold text-sm ${
                          formData.gender === 'M' ? 'text-blue-700' : 'text-slate-700'
                        }`}>
                          Masculino
                        </span>
                      </div>
                      {formData.gender === 'M' && (
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, gender: 'F' }))}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
                        formData.gender === 'F'
                          ? 'border-pink-500 bg-pink-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-pink-300 hover:shadow-sm'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        formData.gender === 'F' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="text-left flex-1">
                        <span className={`font-semibold text-sm ${
                          formData.gender === 'F' ? 'text-pink-700' : 'text-slate-700'
                        }`}>
                          Femenino
                        </span>
                      </div>
                      {formData.gender === 'F' && (
                        <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.gender && (
                    <p className="text-xs text-red-500 mt-1.5 pl-1">{errors.gender}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sección: Contacto */}
            <div className="bg-white rounded-2xl p-6 border-l-4 border-l-indigo-500 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                Información de Contacto
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                    Número de Celular <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    name="personalPhone"
                    value={formData.personalPhone}
                    onChange={handleChange}
                    maxLength={9}
                    placeholder="9 dígitos"
                    className={`w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 transition-all text-sm ${
                      errors.personalPhone ? 'ring-2 ring-red-500' : 'focus:ring-indigo-500/20'
                    }`}
                    required
                  />
                  {errors.personalPhone && (
                    <p className="text-xs text-red-500 mt-1.5 pl-1">{errors.personalPhone}</p>
                  )}
                  <p className={`text-xs mt-1.5 pl-1 flex items-center gap-2 ${
                    formData.personalPhone.length === 9 && formData.personalPhone.startsWith('9')
                      ? 'text-green-600 font-semibold'
                      : formData.personalPhone.length > 0 && !formData.personalPhone.startsWith('9')
                      ? 'text-red-500 font-semibold'
                      : 'text-gray-500'
                  }`}>
                    <span>
                      {formData.personalPhone.length} / 9 dígitos
                      {formData.personalPhone.length === 9 && formData.personalPhone.startsWith('9') && ' ✓'}
                    </span>
                    {formData.personalPhone.length > 0 && !formData.personalPhone.startsWith('9') && (
                      <span className="text-red-500">• Debe comenzar con 9</span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                    Teléfono de Trabajo <span className="text-gray-400">(Opcional)</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    name="workPhone"
                    value={formData.workPhone}
                    onChange={handleChange}
                    maxLength={20}
                    placeholder="Teléfono fijo o móvil"
                    className={`w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 transition-all text-sm ${
                      errors.workPhone ? 'ring-2 ring-red-500' : 'focus:ring-indigo-500/20'
                    }`}
                  />
                  {errors.workPhone && (
                    <p className="text-xs text-red-500 mt-1.5 pl-1">{errors.workPhone}</p>
                  )}
                  {formData.workPhone && (
                    <p className={`text-xs mt-1.5 pl-1 ${
                      formData.workPhone.length >= 7 && formData.workPhone.length <= 20
                        ? 'text-green-600 font-semibold'
                        : 'text-gray-500'
                    }`}>
                      {formData.workPhone.length} dígitos
                      {formData.workPhone.length >= 7 && formData.workPhone.length <= 20 && ' ✓'}
                      {formData.workPhone.length > 0 && formData.workPhone.length < 7 && ' (mínimo 7)'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                    Email Personal <span className="text-gray-400">(Opcional)</span>
                  </label>
                  <input
                    type="email"
                    name="personalEmail"
                    value={formData.personalEmail}
                    onChange={handleChange}
                    placeholder="ejemplo@correo.com"
                    className={`w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 transition-all text-sm ${
                      errors.personalEmail ? 'ring-2 ring-red-500' : 'focus:ring-indigo-500/20'
                    }`}
                  />
                  {errors.personalEmail && (
                    <p className="text-xs text-red-500 mt-1.5 pl-1">{errors.personalEmail}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                    Dirección <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Dirección completa..."
                    rows="2"
                    className={`w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 transition-all text-sm resize-none ${
                      errors.address ? 'ring-2 ring-red-500' : 'focus:ring-indigo-500/20'
                    }`}
                    required
                  />
                  {errors.address && (
                    <p className="text-xs text-red-500 mt-1.5 pl-1">{errors.address}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg"
              >
                {loading ? "Guardando..." : person ? "Actualizar Persona" : "Crear Persona"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

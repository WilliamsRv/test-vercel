import React, { useState, useEffect } from 'react';
import { 
  createProveedor, 
  updateProveedor, 
  getTiposDocumento, 
  validarDocumentoPorTipo,
  validarTelefonoPeruano,
  validarNombreComercial,
  validarRazonSocial,
  validarContactoPrincipal,
  validarDireccion,
  validarSitioWeb,
  validarEmail,
  obtenerPlaceholderDocumento,
  obtenerErrorDocumentoPorTipo
} from '../../services/api';

export default function SupplierModal({ isOpen, onClose, onSuccess, proveedor = null }) {
  const isEditing = !!proveedor;
  
  const [formData, setFormData] = useState({
    documentTypesId: 1,
    numeroDocumento: '',
    legalName: '',
    tradeName: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    mainContact: '',
    taxCondition: '',
    isStateProvider: false,
    qualification: 5,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [tiposDocumento, setTiposDocumento] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadTiposDocumento();
    }
  }, [isOpen]);

  useEffect(() => {
    if (proveedor) {
      setFormData({
        documentTypesId: proveedor.documentTypesId || 1,
        numeroDocumento: proveedor.numeroDocumento || '',
        legalName: proveedor.legalName || '',
        tradeName: proveedor.tradeName || '',
        address: proveedor.address || '',
        phone: proveedor.phone || '',
        email: proveedor.email || '',
        website: proveedor.website || '',
        mainContact: proveedor.mainContact || '',
        taxCondition: proveedor.taxCondition || '',
        isStateProvider: proveedor.isStateProvider || false,
        qualification: proveedor.qualification || 5,
      });
    } else {
      setFormData({
        documentTypesId: 1,
        numeroDocumento: '',
        legalName: '',
        tradeName: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        mainContact: '',
        taxCondition: '',
        isStateProvider: false,
        qualification: 5,
      });
    }
    setError(null);
    setErrors({});
  }, [proveedor, isOpen]);

  // Revalidar número de documento cuando cambia el tipo de documento
  useEffect(() => {
    // Solo revalidar si hay un número de documento escrito
    if (formData.numeroDocumento && formData.numeroDocumento.trim()) {
      const isValid = validarDocumentoPorTipo(
        formData.documentTypesId, 
        formData.numeroDocumento, 
        proveedor?.numeroDocumento
      );
      
      if (!isValid) {
        // Mostrar error si es inválido
        setErrors(prev => ({
          ...prev,
          numeroDocumento: obtenerErrorDocumentoPorTipo(
            formData.documentTypesId, 
            formData.numeroDocumento, 
            proveedor?.numeroDocumento
          )
        }));
      } else {
        // Limpiar error si es válido
        setErrors(prev => ({
          ...prev,
          numeroDocumento: ''
        }));
      }
    } else {
      // Si está vacío, limpiar error
      setErrors(prev => ({
        ...prev,
        numeroDocumento: ''
      }));
    }
  }, [formData.documentTypesId]); // Solo cuando cambia el tipo de documento

  const loadTiposDocumento = async () => {
    try {
      const tipos = await getTiposDocumento();
      setTiposDocumento(tipos);
    } catch (err) {
      console.error('Error al cargar tipos de documento:', err);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validar campos requeridos
    if (!formData.documentTypesId) {
      newErrors.documentTypesId = 'Tipo de documento es requerido';
    }
    
    // Validar número de documento (siempre validar estrictamente)
    if (!formData.numeroDocumento?.trim()) {
      newErrors.numeroDocumento = obtenerErrorDocumentoPorTipo(
        formData.documentTypesId, 
        '', 
        null // Siempre validar estrictamente, no permitir valores inválidos incluso en edición
      );
    } else {
      // Si tiene valor, validar formato y tipo
      // IMPORTANTE: Validar estrictamente, incluso en modo edición (no usar documentoOriginal)
      const isValid = validarDocumentoPorTipo(
        formData.documentTypesId, 
        formData.numeroDocumento, 
        null // Validar estrictamente, no permitir documentos inválidos
      );
      
      console.log('🔍 Validando en submit:', {
        numeroDocumento: formData.numeroDocumento,
        documentTypesId: formData.documentTypesId,
        isValid,
        error: !isValid ? obtenerErrorDocumentoPorTipo(formData.documentTypesId, formData.numeroDocumento, null) : 'ninguno'
      });
      
      if (!isValid) {
        newErrors.numeroDocumento = obtenerErrorDocumentoPorTipo(
          formData.documentTypesId, 
          formData.numeroDocumento, 
          null // Validar estrictamente
        );
      }
    }
    
    if (!formData.legalName?.trim()) {
      newErrors.legalName = 'Razón social es requerida';
    }
    
    // Validar calificación (1-5)
    if (!formData.qualification || formData.qualification < 1 || formData.qualification > 5) {
      newErrors.qualification = 'La calificación debe estar entre 1 y 5';
    }
    
    // Validar razón social
    if (formData.legalName && !validarRazonSocial(formData.legalName)) {
      newErrors.legalName = 'Razón social debe tener entre 3-100 caracteres, contener letras y solo caracteres válidos';
    }
    
    // Validar nombre comercial (requerido)
    if (!formData.tradeName?.trim()) {
      newErrors.tradeName = 'Nombre comercial es requerido';
    } else if (!validarNombreComercial(formData.tradeName)) {
      newErrors.tradeName = 'Nombre comercial debe tener mínimo 2 caracteres y al menos una palabra';
    }
    
    // Validar dirección (requerida)
    if (!formData.address?.trim()) {
      newErrors.address = 'Dirección es requerida';
    } else if (!validarDireccion(formData.address)) {
      newErrors.address = 'Dirección debe tener entre 5-200 caracteres y contener letras y números';
    }
    
    // Validar teléfono (requerido)
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Teléfono es requerido';
    } else if (!validarTelefonoPeruano(formData.phone)) {
      newErrors.phone = 'Teléfono debe ser móvil peruano (9 dígitos empezando con 9)';
    }
    
    // Validar email (requerido)
    if (!formData.email?.trim()) {
      newErrors.email = 'Email es requerido';
    } else if (!validarEmail(formData.email)) {
      newErrors.email = 'Email debe tener un formato válido (ejemplo: usuario@dominio.com)';
    }
    
    // Validar contacto principal (requerido)
    if (!formData.mainContact?.trim()) {
      newErrors.mainContact = 'Contacto principal es requerido';
    } else if (!validarContactoPrincipal(formData.mainContact)) {
      newErrors.mainContact = 'Contacto principal debe tener mínimo 3 caracteres y solo letras';
    }
    
    // Validar sitio web (opcional)
    if (formData.website && !validarSitioWeb(formData.website)) {
      newErrors.website = 'Sitio web debe ser una URL válida';
    }
    
    return newErrors;
  };

  // Handler para validar cuando el campo pierde el foco (onBlur)
  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    // Validar número de documento cuando pierde el foco
    if (name === 'numeroDocumento') {
      // Obtener el valor actual del campo (puede haber cambiado)
      const currentValue = value || formData.numeroDocumento || '';
      const currentDocumentTypeId = formData.documentTypesId;
      
      // Forzar validación
      if (!currentValue || !currentValue.trim()) {
        // Si está vacío y es requerido, mostrar error
        const errorMsg = obtenerErrorDocumentoPorTipo(
          currentDocumentTypeId, 
          '', 
          proveedor?.numeroDocumento
        );
        setErrors(prev => ({
          ...prev,
          numeroDocumento: errorMsg
        }));
      } else {
        // Validar el documento - IMPORTANTE: siempre validar aquí
        const isValid = validarDocumentoPorTipo(currentDocumentTypeId, currentValue, proveedor?.numeroDocumento);
        
        console.log('🔍 Validando en onBlur:', { 
          currentValue, 
          currentDocumentTypeId, 
          isValid,
          validationResult: validarDocumentoPorTipo(currentDocumentTypeId, currentValue, proveedor?.numeroDocumento)
        });
        
        if (!isValid) {
          // Si es inválido, mostrar error
          const errorMsg = obtenerErrorDocumentoPorTipo(
            currentDocumentTypeId, 
            currentValue, 
            proveedor?.numeroDocumento
          );
          console.log('❌ Error encontrado:', errorMsg);
          setErrors(prev => ({
            ...prev,
            numeroDocumento: errorMsg
          }));
        } else {
          // Limpiar error si el documento es válido
          setErrors(prev => ({
            ...prev,
            numeroDocumento: ''
          }));
        }
      }
    } else if (name === 'legalName') {
      // Validar razón social cuando pierde el foco
      if (!value || !value.trim()) {
        setErrors(prev => ({ ...prev, legalName: 'Razón social es requerida' }));
      } else {
        const isValid = validarRazonSocial(value);
        if (!isValid) {
          setErrors(prev => ({ ...prev, legalName: 'Razón social debe tener entre 3-100 caracteres, contener letras y solo caracteres válidos' }));
        } else {
          setErrors(prev => ({ ...prev, legalName: '' }));
        }
      }
    } else if (name === 'tradeName') {
      // Validar nombre comercial
      if (!value || !value.trim()) {
        setErrors(prev => ({ ...prev, tradeName: 'Nombre comercial es requerido' }));
      } else if (!validarNombreComercial(value)) {
        setErrors(prev => ({ ...prev, tradeName: 'Nombre comercial debe tener mínimo 2 caracteres y al menos una palabra' }));
      } else {
        setErrors(prev => ({ ...prev, tradeName: '' }));
      }
    } else if (name === 'address') {
      // Validar dirección
      if (!value || !value.trim()) {
        setErrors(prev => ({ ...prev, address: 'Dirección es requerida' }));
      } else {
        const isValid = validarDireccion(value);
        if (!isValid) {
          setErrors(prev => ({ ...prev, address: 'Dirección debe tener entre 5-200 caracteres y contener letras y números' }));
        } else {
          setErrors(prev => ({ ...prev, address: '' }));
        }
      }
    } else if (name === 'phone') {
      // Validar teléfono
      if (!value || !value.trim()) {
        setErrors(prev => ({ ...prev, phone: 'Teléfono es requerido' }));
      } else if (!validarTelefonoPeruano(value)) {
        setErrors(prev => ({ ...prev, phone: 'Teléfono debe ser móvil peruano (9 dígitos empezando con 9)' }));
      } else {
        setErrors(prev => ({ ...prev, phone: '' }));
      }
    } else if (name === 'email') {
      // Validar email
      if (!value || !value.trim()) {
        setErrors(prev => ({ ...prev, email: 'Email es requerido' }));
      } else if (!validarEmail(value)) {
        setErrors(prev => ({ ...prev, email: 'Email debe tener un formato válido (ejemplo: usuario@dominio.com)' }));
      } else {
        setErrors(prev => ({ ...prev, email: '' }));
      }
    } else if (name === 'mainContact') {
      // Validar contacto principal
      if (!value || !value.trim()) {
        setErrors(prev => ({ ...prev, mainContact: 'Contacto principal es requerido' }));
      } else if (!validarContactoPrincipal(value)) {
        setErrors(prev => ({ ...prev, mainContact: 'Contacto principal debe tener mínimo 3 caracteres y solo letras' }));
      } else {
        setErrors(prev => ({ ...prev, mainContact: '' }));
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Si está cambiando el tipo de documento, necesitamos actualizar el estado y revalidar
    if (name === 'documentTypesId') {
      const newDocumentTypeId = type === 'number' ? parseInt(value) : value;
      
      setFormData(prev => {
        const newFormData = {
          ...prev,
          documentTypesId: newDocumentTypeId
        };
        
        // Si hay un número de documento escrito, revalidarlo con el nuevo tipo
        if (newFormData.numeroDocumento && newFormData.numeroDocumento.trim()) {
          const isValid = validarDocumentoPorTipo(
            newDocumentTypeId, 
            newFormData.numeroDocumento, 
            proveedor?.numeroDocumento
          );
          
          // Actualizar errores inmediatamente
          setTimeout(() => {
            if (!isValid) {
              setErrors(prevErrors => ({
                ...prevErrors,
                numeroDocumento: obtenerErrorDocumentoPorTipo(
                  newDocumentTypeId, 
                  newFormData.numeroDocumento, 
                  proveedor?.numeroDocumento
                )
              }));
            } else {
              setErrors(prevErrors => ({
                ...prevErrors,
                numeroDocumento: ''
              }));
            }
          }, 0);
        } else {
          // Si está vacío, limpiar error
          setErrors(prevErrors => ({
            ...prevErrors,
            numeroDocumento: ''
          }));
        }
        
        return newFormData;
      });
      
      return; // Salir temprano para no procesar más validaciones
    }
    
    // Filtrar caracteres para numeroDocumento ANTES de actualizar el estado
    let finalValue = value;
    if (name === 'numeroDocumento') {
      if (formData.documentTypesId === 1 || formData.documentTypesId === 2) {
        // RUC o DNI: solo números
        finalValue = value.replace(/[^\d]/g, '');
      } else if (formData.documentTypesId === 3 || formData.documentTypesId === 4) {
        // CE o Pasaporte: solo letras y números (sin espacios ni caracteres especiales)
        finalValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      }
    }
    
    // Actualizar el estado del formulario con el valor filtrado
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(finalValue) || '' : finalValue)
    }));

    // Validaciones en tiempo real
    if (name === 'numeroDocumento') {
      // Usar el valor filtrado para validación sin reasignar const
      const validatedValue = finalValue;
      
      // Si el campo está vacío mientras escribe, limpiar error
      if (!validatedValue || !validatedValue.trim()) {
        setErrors(prev => ({
          ...prev,
          numeroDocumento: ''
        }));
        return;
      }
      
      // Si tiene valor, validar en tiempo real con el tipo de documento actual
      if (validatedValue && validatedValue.trim()) {
        const isValid = validarDocumentoPorTipo(formData.documentTypesId, validatedValue, proveedor?.numeroDocumento);
        
        if (!isValid) {
          // Mostrar error si es inválido
          setErrors(prev => ({
            ...prev,
            numeroDocumento: obtenerErrorDocumentoPorTipo(
              formData.documentTypesId, 
              validatedValue, 
              proveedor?.numeroDocumento
            )
          }));
        } else {
          // Limpiar error si es válido
          setErrors(prev => ({
            ...prev,
            numeroDocumento: ''
          }));
        }
      }
    } else if (name === 'legalName') {
      if (!value || !value.trim()) {
        // Si está vacío, no validar aquí (se validará en onBlur si es requerido)
        return;
      }
      
      // Validar en tiempo real
      const isValid = validarRazonSocial(value);
      console.log('🔍 Validando Razón Social:', { value, isValid, length: value?.length });
      
      if (!isValid) {
        setErrors(prev => ({
          ...prev,
          legalName: 'Razón social debe tener entre 3-100 caracteres, contener letras y solo caracteres válidos'
        }));
      } else {
        // Limpiar error si es válido
        setErrors(prev => {
          if (prev.legalName) {
            return {
              ...prev,
              legalName: ''
            };
          }
          return prev;
        });
      }
    } else if (name === 'tradeName' && value) {
      if (!validarNombreComercial(value)) {
        setErrors(prev => ({
          ...prev,
          tradeName: 'Nombre comercial debe tener mínimo 2 caracteres y al menos una palabra'
        }));
      }
    } else if (name === 'phone' && value) {
      if (!validarTelefonoPeruano(value)) {
        setErrors(prev => ({
          ...prev,
          phone: 'Teléfono debe ser móvil peruano (9 dígitos empezando con 9)'
        }));
      }
    } else if (name === 'email' && value) {
      if (!validarEmail(value)) {
        setErrors(prev => ({
          ...prev,
          email: 'Email debe tener un formato válido (ejemplo: usuario@dominio.com)'
        }));
      }
    } else if (name === 'website' && value) {
      if (!validarSitioWeb(value)) {
        setErrors(prev => ({
          ...prev,
          website: 'Sitio web debe ser una URL válida'
        }));
      }
    } else if (name === 'mainContact' && value) {
      if (!validarContactoPrincipal(value)) {
        setErrors(prev => ({
          ...prev,
          mainContact: 'Contacto principal debe tener mínimo 3 caracteres y solo letras'
        }));
      }
    } else if (name === 'address' && value) {
      if (!validarDireccion(value)) {
        setErrors(prev => ({
          ...prev,
          address: 'Dirección debe tener entre 5-200 caracteres y contener letras y números'
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validar formulario
    const validationErrors = validateForm();
    console.log('📋 Errores de validación:', validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      console.log('❌ Formulario inválido, bloqueando guardado');
      setErrors(validationErrors);
      setLoading(false);
      
      // Hacer scroll al primer error
      const firstErrorField = Object.keys(validationErrors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
      
      return;
    }
    
    console.log('✅ Formulario válido, procediendo a guardar');

    try {
      const dataToSend = {
        ...formData,
        qualification: parseInt(formData.qualification),
      };

      if (isEditing) {
        await updateProveedor(proveedor.id, dataToSend);
      } else {
        await createProveedor(dataToSend);
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar el proveedor');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-700 via-slate-750 to-slate-800 px-6 py-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-6 py-6 max-h-[70vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Información Básica */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-slate-800">
                  Información Básica
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <span>Tipo de Documento</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <select
                      name="documentTypesId"
                      value={formData.documentTypesId}
                      onChange={handleChange}
                      required
                      className={`w-full pl-10 pr-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                        errors.documentTypesId ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white bg-white'
                      }`}
                    >
                      {tiposDocumento.map((tipo) => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.name} - {tipo.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.documentTypesId && (
                    <p className="text-red-600 text-xs mt-1">{errors.documentTypesId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Número de Documento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="numeroDocumento"
                    value={formData.numeroDocumento}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white ${
                      errors.numeroDocumento ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                    }`}
                    placeholder={obtenerPlaceholderDocumento(formData.documentTypesId)}
                  />
                  {errors.numeroDocumento && (
                    <p className="text-red-600 text-xs mt-1">{errors.numeroDocumento}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Razón Social <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="legalName"
                    value={formData.legalName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white ${
                      errors.legalName ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                    }`}
                    placeholder="Empresa ABC S.A.C."
                  />
                  {errors.legalName && (
                    <p className="text-red-600 text-xs mt-1">{errors.legalName}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <span>Nombre Comercial</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="tradeName"
                    value={formData.tradeName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white ${
                      errors.tradeName ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                    }`}
                    placeholder="ABC Corp"
                  />
                  {errors.tradeName && (
                    <p className="text-red-600 text-xs mt-1">{errors.tradeName}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Información de Contacto */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-slate-800">
                  Información de Contacto
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <span>Dirección</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                      errors.address ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white bg-white'
                    }`}
                    placeholder="Av. Principal 123, Lima"
                  />
                  {errors.address && (
                    <p className="text-red-600 text-xs mt-1">{errors.address}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <span>Teléfono</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white ${
                      errors.phone ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                    }`}
                    placeholder="+51 987654321"
                  />
                  {errors.phone && (
                    <p className="text-red-600 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <span>Email</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                    }`}
                    placeholder="contacto@abc.com"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Sitio Web
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white ${
                      errors.website ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                    }`}
                    placeholder="https://abc.com"
                  />
                  {errors.website && (
                    <p className="text-red-600 text-xs mt-1">{errors.website}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <span>Contacto Principal</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="mainContact"
                    value={formData.mainContact || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white ${
                      errors.mainContact ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                    }`}
                    placeholder="Juan Pérez"
                  />
                  {errors.mainContact && (
                    <p className="text-red-600 text-xs mt-1">{errors.mainContact}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Información Tributaria */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-slate-800">
                  Información Tributaria
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Condición Tributaria
                  </label>
                  <select
                    name="taxCondition"
                    value={formData.taxCondition}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar condición</option>
                    <option value="Responsable del IVA">Responsable del IVA</option>
                    <option value="No Responsable del IVA">No Responsable del IVA</option>
                    <option value="Exonerado del IVA">Exonerado del IVA</option>
                    <option value="No Domiciliado">No Domiciliado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Calificación <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white ${
                      errors.qualification ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                    }`}
                    required
                  >
                    <option value="">Seleccionar calificación</option>
                    <option value={1}>1 - Muy mala</option>
                    <option value={2}>2 - Mala</option>
                    <option value={3}>3 - Regular</option>
                    <option value={4}>4 - Buena</option>
                    <option value={5}>5 - Excelente</option>
                  </select>
                  {errors.qualification && (
                    <p className="text-red-600 text-xs mt-1">{errors.qualification}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isStateProvider"
                      name="isStateProvider"
                      checked={formData.isStateProvider}
                      onChange={handleChange}
                      className="w-4 h-4 text-slate-600 border-gray-300 rounded focus:ring-slate-500"
                    />
                    <label htmlFor="isStateProvider" className="ml-2 text-sm font-medium text-slate-700">
                      Es proveedor del estado
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-5 flex justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 border-2 border-slate-300 bg-white rounded-xl text-slate-700 hover:bg-white hover:border-slate-400 font-semibold transition-all shadow-sm hover:shadow"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-2.5 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isEditing ? 'Actualizar' : 'Guardar'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  DocumentTextIcon, 
  UserIcon, 
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import handoverReceiptService from '../../services/handoverReceiptService';

export default function HandoverReceiptForm({ 
  municipalityId, 
  receipt = null, 
  onSave, 
  onCancel,
  movements = [],
  users = [],
  loadingMovements = false,
  loadingUsers = false
}) {
  const [formData, setFormData] = useState({
    receiptNumber: '',
    movementId: '',
    deliveringResponsibleId: '',
    receivingResponsibleId: '',
    witness1Id: '',
    witness2Id: '',
    receiptDate: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
    deliveryObservations: '',
    receptionObservations: '',
    specialConditions: '',
    generatedBy: '' // This should come from current user context
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (receipt) {
      setFormData({
        receiptNumber: receipt.receiptNumber || '',
        movementId: receipt.movementId || '',
        deliveringResponsibleId: receipt.deliveringResponsibleId || '',
        receivingResponsibleId: receipt.receivingResponsibleId || '',
        witness1Id: receipt.witness1Id || '',
        witness2Id: receipt.witness2Id || '',
        receiptDate: receipt.receiptDate ? receipt.receiptDate.split('T')[0] : new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
        deliveryObservations: receipt.deliveryObservations || '',
        receptionObservations: receipt.receptionObservations || '',
        specialConditions: receipt.specialConditions || '',
        generatedBy: receipt.generatedBy || ''
      });
    }
  }, [receipt]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validar campos de texto (observaciones y condiciones)
  const validateTextField = (value, fieldName) => {
    // Si el campo está vacío o solo tiene espacios
    if (!value || value.trim() === '') {
      return `${fieldName} es requerido`;
    }
    // Si el campo tiene contenido pero es menor a 5 caracteres
    if (value.trim().length < 5) {
      return `${fieldName} debe tener al menos 5 caracteres`;
    }
    return '';
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.movementId) {
      newErrors.movementId = 'El movimiento es requerido';
    }

    if (!formData.deliveringResponsibleId) {
      newErrors.deliveringResponsibleId = 'El responsable de entrega es requerido';
    }

    if (!formData.receivingResponsibleId) {
      newErrors.receivingResponsibleId = 'El responsable de recepción es requerido';
    }

    if (!formData.receiptDate) {
      newErrors.receiptDate = 'La fecha del acta es requerida';
    }

    if (!formData.generatedBy) {
      newErrors.generatedBy = 'El usuario generador es requerido';
    }

    // Validate that delivering and receiving responsibles are different
    if (formData.deliveringResponsibleId && formData.receivingResponsibleId && 
        formData.deliveringResponsibleId === formData.receivingResponsibleId) {
      newErrors.receivingResponsibleId = 'El responsable de recepción debe ser diferente al de entrega';
    }

    // Validar campos de texto opcionales
    const deliveryObsError = validateTextField(formData.deliveryObservations, 'Observaciones de Entrega');
    if (deliveryObsError) {
      newErrors.deliveryObservations = deliveryObsError;
    }

    const receptionObsError = validateTextField(formData.receptionObservations, 'Observaciones de Recepción');
    if (receptionObsError) {
      newErrors.receptionObservations = receptionObsError;
    }

    const specialCondError = validateTextField(formData.specialConditions, 'Condiciones Especiales');
    if (specialCondError) {
      newErrors.specialConditions = specialCondError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll al primer error
      setTimeout(() => {
        const firstError = document.querySelector('.border-red-300');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    setLoading(true);
    
    try {
      // Preparar datos según HandoverReceiptRequest del backend
      const dataToSend = {
        movementId: formData.movementId,
        deliveringResponsibleId: formData.deliveringResponsibleId,
        receivingResponsibleId: formData.receivingResponsibleId,
        witness1Id: formData.witness1Id || null,
        witness2Id: formData.witness2Id || null,
        receiptDate: formData.receiptDate,
        deliveryObservations: formData.deliveryObservations?.trim() || null,
        receptionObservations: formData.receptionObservations?.trim() || null,
        specialConditions: formData.specialConditions?.trim() || null,
        generatedBy: formData.generatedBy
      };

      // Validar que los UUIDs no estén vacíos
      if (!dataToSend.movementId || dataToSend.movementId === '') {
        setErrors({ submit: 'Debe seleccionar un movimiento' });
        return;
      }
      if (!dataToSend.deliveringResponsibleId || dataToSend.deliveringResponsibleId === '') {
        setErrors({ submit: 'Debe seleccionar un responsable de entrega' });
        return;
      }
      if (!dataToSend.receivingResponsibleId || dataToSend.receivingResponsibleId === '') {
        setErrors({ submit: 'Debe seleccionar un responsable de recepción' });
        return;
      }
      if (!dataToSend.generatedBy || dataToSend.generatedBy === '') {
        setErrors({ submit: 'Debe seleccionar quién genera el acta' });
        return;
      }

      console.log('Form data to send:', JSON.stringify(dataToSend, null, 2));
      console.log('Municipality ID:', municipalityId);
      console.log('Is editing?', !!receipt);

      onSave && onSave(dataToSend);
    } catch (error) {
      console.error('Error saving handover receipt:', error);
      setErrors({ submit: 'Error al guardar el acta. Por favor, intente nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg mr-3">
                <DocumentTextIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  {receipt ? 'Editar Acta de Entrega-Recepción' : 'Nueva Acta de Entrega-Recepción'}
                </h3>
                <p className="text-blue-100 text-sm">
                  {receipt ? 'Modifica los datos del acta existente' : 'Completa la información para crear una nueva acta'}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-white hover:text-gray-200 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-2 transition-colors duration-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">

        <form onSubmit={handleSubmit} className="space-y-8">
          {errors.submit && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
                <p className="text-sm text-red-700 font-medium">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Información Básica */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-2" />
              <h4 className="text-lg font-semibold text-gray-900">Información Básica</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nota: El número de acta se genera automáticamente */}
              <div className="md:col-span-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2" />
                    <p className="text-sm text-blue-700">
                      El número de acta se generará automáticamente al crear el registro.
                    </p>
                  </div>
                </div>
              </div>

              {/* Fecha del Acta */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Fecha del Acta *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="receiptDate"
                    value={formData.receiptDate}
                    readOnly
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm bg-gray-100 cursor-not-allowed transition-colors duration-200"
                  />
                  <CheckCircleIcon className="absolute right-3 top-3 h-5 w-5 text-green-500" />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  La fecha se establece automáticamente al momento de crear el acta
                </p>
              </div>
              {/* Movimiento */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Movimiento *
                </label>
                <div className="relative">
                  <select
                    name="movementId"
                    value={formData.movementId}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                      errors.movementId ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar movimiento</option>
                    {loadingMovements ? (
                      <option value="" disabled>Cargando movimientos...</option>
                    ) : movements && movements.length > 0 ? (
                      movements.map(movement => (
                        <option key={movement.id} value={movement.id}>
                          {movement.movementNumber} - {movement.movementType || 'Sin tipo'} - {movement.movementStatus || 'Sin estado'}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No hay movimientos disponibles</option>
                    )}
                  </select>
                  {!errors.movementId && formData.movementId && (
                    <CheckCircleIcon className="absolute right-3 top-3 h-5 w-5 text-green-500" />
                  )}
                </div>
                {errors.movementId && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    {errors.movementId}
                  </p>
                )}
              </div>

              {/* Usuario Generador */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Generado por *
                </label>
                <div className="relative">
                  <select
                    name="generatedBy"
                    value={formData.generatedBy}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                      errors.generatedBy ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar usuario</option>
                    {loadingUsers ? (
                      <option value="" disabled>Cargando usuarios...</option>
                    ) : users && users.length > 0 ? (
                      users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.username}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No hay usuarios disponibles</option>
                    )}
                  </select>
                  {!errors.generatedBy && formData.generatedBy && (
                    <CheckCircleIcon className="absolute right-3 top-3 h-5 w-5 text-green-500" />
                  )}
                </div>
                {errors.generatedBy && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    {errors.generatedBy}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Participantes */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <UserIcon className="h-5 w-5 text-green-600 mr-2" />
              <h4 className="text-lg font-semibold text-gray-900">Participantes</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Responsable de Entrega */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Responsable de Entrega *
                </label>
                <div className="relative">
                  <select
                    name="deliveringResponsibleId"
                    value={formData.deliveringResponsibleId}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                      errors.deliveringResponsibleId ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar responsable</option>
                    {loadingUsers ? (
                      <option value="" disabled>Cargando usuarios...</option>
                    ) : users && users.length > 0 ? (
                      users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.username}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No hay usuarios disponibles</option>
                    )}
                  </select>
                  {!errors.deliveringResponsibleId && formData.deliveringResponsibleId && (
                    <CheckCircleIcon className="absolute right-3 top-3 h-5 w-5 text-green-500" />
                  )}
                </div>
                {errors.deliveringResponsibleId && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    {errors.deliveringResponsibleId}
                  </p>
                )}
              </div>

              {/* Responsable de Recepción */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Responsable de Recepción *
                </label>
                <div className="relative">
                  <select
                    name="receivingResponsibleId"
                    value={formData.receivingResponsibleId}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                      errors.receivingResponsibleId ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar responsable</option>
                    {loadingUsers ? (
                      <option value="" disabled>Cargando usuarios...</option>
                    ) : users && users.length > 0 ? (
                      users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.username}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No hay usuarios disponibles</option>
                    )}
                  </select>
                  {!errors.receivingResponsibleId && formData.receivingResponsibleId && (
                    <CheckCircleIcon className="absolute right-3 top-3 h-5 w-5 text-green-500" />
                  )}
                </div>
                {errors.receivingResponsibleId && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    {errors.receivingResponsibleId}
                  </p>
                )}
              </div>

              {/* Testigo 1 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Testigo 1 (Opcional)
                </label>
                <select
                  name="witness1Id"
                  value={formData.witness1Id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 transition-colors duration-200"
                >
                  <option value="">Seleccionar testigo</option>
                  {loadingUsers ? (
                    <option value="" disabled>Cargando usuarios...</option>
                  ) : users && users.length > 0 ? (
                    users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No hay usuarios disponibles</option>
                  )}
                </select>
              </div>

              {/* Testigo 2 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Testigo 2 (Opcional)
                </label>
                <select
                  name="witness2Id"
                  value={formData.witness2Id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 transition-colors duration-200"
                >
                  <option value="">Seleccionar testigo</option>
                  {loadingUsers ? (
                    <option value="" disabled>Cargando usuarios...</option>
                  ) : users && users.length > 0 ? (
                    users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No hay usuarios disponibles</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Observaciones y Condiciones */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="h-5 w-5 text-purple-600 mr-2" />
              <h4 className="text-lg font-semibold text-gray-900">Observaciones y Condiciones</h4>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Observaciones de Entrega *
                </label>
                <div className="relative">
                  <textarea
                    name="deliveryObservations"
                    value={formData.deliveryObservations}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 resize-none ${
                      errors.deliveryObservations ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Ingrese las observaciones del responsable de entrega (mínimo 5 caracteres)..."
                  />
                  {errors.deliveryObservations && (
                    <ExclamationTriangleIcon className="absolute right-3 top-3 h-5 w-5 text-red-500" />
                  )}
                </div>
                {errors.deliveryObservations && (
                  <div className="mt-2 flex items-center text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                    <p className="text-sm font-medium">{errors.deliveryObservations}</p>
                  </div>
                )}
                {formData.deliveryObservations && formData.deliveryObservations.trim().length > 0 && !errors.deliveryObservations && (
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.deliveryObservations.trim().length} caracteres
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Observaciones de Recepción *
                </label>
                <div className="relative">
                  <textarea
                    name="receptionObservations"
                    value={formData.receptionObservations}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 resize-none ${
                      errors.receptionObservations ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Ingrese las observaciones del responsable de recepción (mínimo 5 caracteres)..."
                  />
                  {errors.receptionObservations && (
                    <ExclamationTriangleIcon className="absolute right-3 top-3 h-5 w-5 text-red-500" />
                  )}
                </div>
                {errors.receptionObservations && (
                  <div className="mt-2 flex items-center text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                    <p className="text-sm font-medium">{errors.receptionObservations}</p>
                  </div>
                )}
                {formData.receptionObservations && formData.receptionObservations.trim().length > 0 && !errors.receptionObservations && (
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.receptionObservations.trim().length} caracteres
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Condiciones Especiales *
                </label>
                <div className="relative">
                  <textarea
                    name="specialConditions"
                    value={formData.specialConditions}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 resize-none ${
                      errors.specialConditions ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Ingrese las condiciones especiales del acta (mínimo 5 caracteres)..."
                  />
                  {errors.specialConditions && (
                    <ExclamationTriangleIcon className="absolute right-3 top-3 h-5 w-5 text-red-500" />
                  )}
                </div>
                {errors.specialConditions && (
                  <div className="mt-2 flex items-center text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                    <p className="text-sm font-medium">{errors.specialConditions}</p>
                  </div>
                )}
                {formData.specialConditions && formData.specialConditions.trim().length > 0 && !errors.specialConditions && (
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.specialConditions.trim().length} caracteres
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-2xl">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 border border-transparent rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="relative mr-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30"></div>
                    <div className="absolute inset-0 animate-spin rounded-full h-4 w-4 border-2 border-t-white"></div>
                    <div className="absolute inset-0.5 bg-white rounded-full opacity-20"></div>
                    <svg className="absolute inset-1 h-2 w-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                    </svg>
                  </div>
                  🏛️ One moment, please...
                </div>
              ) : (
                receipt ? 'Actualizar Acta' : 'Crear Acta'
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
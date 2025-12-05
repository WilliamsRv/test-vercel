import React, { useState } from 'react';
import { createDisposal, DISPOSAL_TYPES } from '../../services/disposalService';

/**
 * Modal para crear un nuevo expediente de baja
 * 
 * IMPORTANTE: Incluye campo technicalReportAuthorId (obligatorio)
 * Este campo identifica quién elabora el informe técnico
 */

export default function CreateDisposalModal({ isOpen, onClose, onSuccess }) {
  // Obtener userId del localStorage o usar UUID de prueba
  const userId = localStorage.getItem('userId');
  const DEFAULT_TEST_UUID = '123e4567-e89b-12d3-a456-426614174002';
  
  const [formData, setFormData] = useState({
    municipalityId: '123e4567-e89b-12d3-a456-426614174000', // TODO: Obtener del contexto/usuario
    disposalType: 'OBSOLESCENCE',
    disposalReason: '',
    reasonDescription: '',
    technicalReportAuthorId: userId || DEFAULT_TEST_UUID, // ✅ NUEVO CAMPO REQUERIDO
    requiresDestruction: false,
    allowsDonation: false,
    recoverableValue: 0,
    observations: '',
    requestedBy: userId || DEFAULT_TEST_UUID, // Actualizado para usar userId o UUID de prueba
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validaciones
      if (!formData.technicalReportAuthorId || formData.technicalReportAuthorId.trim() === '') {
        throw new Error('El autor del informe técnico es requerido (technicalReportAuthorId)');
      }
      if (!formData.disposalReason.trim()) {
        throw new Error('El motivo de baja es requerido');
      }
      if (!formData.reasonDescription.trim()) {
        throw new Error('La descripción del motivo es requerida');
      }

      const payload = {
        ...formData,
        recoverableValue: parseFloat(formData.recoverableValue) || 0,
      };

      console.log('📤 Payload enviado desde CreateDisposalModal:', payload);
      console.log('🔍 technicalReportAuthorId:', payload.technicalReportAuthorId);

      await createDisposal(payload);
      
      // Resetear formulario
      setFormData({
        municipalityId: '123e4567-e89b-12d3-a456-426614174000',
        disposalType: 'OBSOLESCENCE',
        disposalReason: '',
        reasonDescription: '',
        technicalReportAuthorId: userId || DEFAULT_TEST_UUID, // ✅ Incluir en reset
        requiresDestruction: false,
        allowsDonation: false,
        recoverableValue: 0,
        observations: '',
        requestedBy: userId || DEFAULT_TEST_UUID,
      });

      onSuccess();
    
      onClose();
    } catch (err) {
      setError(err.message || 'Error al crear el expediente de baja');
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
        <div className="inline-block w-full max-w-3xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">
                🗑️ Nuevo Expediente de Baja
              </h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-6 py-6 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Tipo de Baja */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">
                📋 Información del Expediente
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tipo de Baja <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="disposalType"
                    value={formData.disposalType}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    {DISPOSAL_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Motivo de Baja <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="disposalReason"
                    value={formData.disposalReason}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Ej: OBSOLESCENCE, DETERIORO, etc."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Descripción del Motivo <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="reasonDescription"
                    value={formData.reasonDescription}
                    onChange={handleChange}
                    required
                    rows="3"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Describa detalladamente el motivo de la baja..."
                  />
                </div>
              </div>
            </div>

            {/* Opciones de Disposición */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">
                🔧 Opciones de Disposición
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requiresDestruction"
                    name="requiresDestruction"
                    checked={formData.requiresDestruction}
                    onChange={handleChange}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <label htmlFor="requiresDestruction" className="ml-2 text-sm font-medium text-slate-700">
                    Requiere Destrucción
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allowsDonation"
                    name="allowsDonation"
                    checked={formData.allowsDonation}
                    onChange={handleChange}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <label htmlFor="allowsDonation" className="ml-2 text-sm font-medium text-slate-700">
                    Permite Donación
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Valor Recuperable (S/)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="recoverableValue"
                    value={formData.recoverableValue}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Observaciones Adicionales
              </label>
              <textarea
                name="observations"
                value={formData.observations}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Observaciones adicionales sobre el expediente..."
              />
            </div>
          </form>

          {/* Footer */}
          <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear Expediente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

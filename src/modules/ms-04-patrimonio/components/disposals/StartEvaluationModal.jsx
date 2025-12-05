import React, { useState } from 'react';
import { assignCommittee } from '../../services/disposalService';

/**
 * Modal simplificado para iniciar la evaluación técnica
 * 
 * REEMPLAZA: AssignCommitteeModal (obsoleto - eliminado)
 * 
 * FLUJO NUEVO:
 * - Solo requiere confirmar quien inicia la evaluación (assignedBy)
 * - NO requiere seleccionar comité (presidente, secretario, miembro)
 * - Cambia estado: INITIATED → UNDER_EVALUATION
 */
export default function StartEvaluationModal({ isOpen, onClose, onSuccess, disposal }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Usuario actual (debería venir de auth)
  const userId = localStorage.getItem('userId') || '123e4567-e89b-12d3-a456-426614174001';

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Iniciando evaluación técnica:', {
        disposalId: disposal.id,
        assignedBy: userId
      });

      await assignCommittee(disposal.id, {
        assignedBy: userId
      });

      console.log('✅ Evaluación iniciada exitosamente');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('❌ Error al iniciar evaluación:', err);
      setError(err.message || 'Error al iniciar la evaluación técnica');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔍</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Iniciar Evaluación Técnica
                </h2>
                <p className="text-purple-100 text-sm">
                  Expediente: {disposal?.fileNumber}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition"
              disabled={loading}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Información del expediente */}
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span>📋</span>
              Información del Expediente
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Número:</span>
                <span className="font-medium text-slate-800">{disposal?.fileNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tipo:</span>
                <span className="font-medium text-slate-800">
                  {disposal?.disposalType === 'ADMINISTRATIVE' && '📑 Administrativa'}
                  {disposal?.disposalType === 'TECHNICAL' && '🔧 Técnica'}
                  {disposal?.disposalType === 'FORTUITOUS' && '⚡ Fortuita'}
                  {disposal?.disposalType === 'OBSOLESCENCE' && '📦 Obsolescencia'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Motivo:</span>
                <span className="font-medium text-slate-800">{disposal?.disposalReason}</span>
              </div>
            </div>
          </div>

          {/* Información sobre el proceso */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <div className="text-2xl">ℹ️</div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">
                  ¿Qué sucede al iniciar la evaluación?
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ El expediente cambiará a estado <strong>"En Evaluación"</strong></li>
                  <li>✓ Se registrará la fecha de inicio de evaluación técnica</li>
                  <li>✓ Se podrá agregar opiniones técnicas sobre los bienes</li>
                  <li>✓ El Administrador de Finanzas podrá aprobar/rechazar el expediente</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">Error</h4>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Acción */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Iniciando...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Iniciar Evaluación
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

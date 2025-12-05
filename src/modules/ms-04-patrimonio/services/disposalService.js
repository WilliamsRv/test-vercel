// Servicio para gestión de bajas de bienes patrimoniales
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'https://vg-ms-patrimonioservice-production.up.railway.app/api/v1'}`;

// ==================== GESTIÓN DE EXPEDIENTES ====================

/**
 * Crear un nuevo expediente de baja
 */
export const createDisposal = async (data) => {
    console.log('Datos enviados a createDisposal:', data);
  try {
    const response = await fetch(`${API_BASE_URL}/asset-disposals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Error al crear el expediente de baja');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en createDisposal:', error);
    throw error;
  }
};

/**
 * Obtener todos los expedientes de baja
 */
export const getAllDisposals = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/asset-disposals`);
    
    if (!response.ok) {
      throw new Error('Error al obtener los expedientes de baja');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en getAllDisposals:', error);
    throw error;
  }
};

/**
 * Obtener expediente de baja por ID
 */
export const getDisposalById = async (id) => {
  console.log(id)
  try {
    const response = await fetch(`${API_BASE_URL}/asset-disposals/${id}`);
    
    if (!response.ok) {
      throw new Error('Error al obtener el expediente de baja');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en getDisposalById:', error);
    throw error;
  }
};

/**
 * Obtener expedientes por estado
 */
export const getDisposalsByStatus = async (status) => {
  try {
    const response = await fetch(`${API_BASE_URL}/asset-disposals/status/${status}`);
    
    if (!response.ok) {
      throw new Error('Error al buscar expedientes por estado');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en getDisposalsByStatus:', error);
    throw error;
  }
};

/**
 * Buscar expediente por número
 */
export const getDisposalByFileNumber = async (fileNumber) => {
  try {
    const response = await fetch(`${API_BASE_URL}/asset-disposals/file-number/${fileNumber}`);
    
    if (!response.ok) {
      throw new Error('Error al buscar expediente por número');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en getDisposalByFileNumber:', error);
    throw error;
  }
};

/**
 * Obtener expedientes por solicitante
 */
export const getDisposalsByRequestedBy = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/asset-disposals/requested-by/${userId}`);
    
    if (!response.ok) {
      throw new Error('Error al obtener expedientes del solicitante');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en getDisposalsByRequestedBy:', error);
    throw error;
  }
};

/**
 * Asignar evaluación al expediente (SIMPLIFICADO)
 * Cambia estado de INITIATED → UNDER_EVALUATION
 * 
 * @param {string} disposalId - ID del expediente
 * @param {Object} data - { assignedBy }
 */
export const assignCommittee = async (disposalId, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/asset-disposals/${disposalId}/assign-committee`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assignedBy: data.assignedBy,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Error al iniciar la evaluación técnica');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en assignCommittee:', error);
    throw error;
  }
};

/**
 * Resolver expediente (aprobar o rechazar)
 * Cambia estado de UNDER_EVALUATION → APPROVED o REJECTED
 * 
 * @param {string} disposalId - ID del expediente
 * @param {Object} data - { approved, resolutionNumber, observations, approvedById }
 */
export const resolveDisposal = async (disposalId, data) => {
  try {
    const payload = {
      approved: data.approved,
      resolutionNumber: data.resolutionNumber,
      observations: data.observations,
    };

    console.log('Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(`${API_BASE_URL}/asset-disposals/${disposalId}/resolve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error del servidor:', errorText);
      throw new Error(`Error al resolver el expediente: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en resolveDisposal:', error);
    throw error;
  }
};

/**
 * Cancelar expediente
 */
export const cancelDisposal = async (disposalId, cancelledBy) => {
  try {
    const response = await fetch(`${API_BASE_URL}/asset-disposals/${disposalId}/cancel?cancelledBy=${cancelledBy}`, {
      method: 'PUT',
    });
    console.log('Response de cancelDisposal:', disposalId, cancelledBy);
    if (!response.ok) {
      throw new Error('Error al cancelar el expediente');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en cancelDisposal:', error);
    throw error;
  }
};

/**
 * Finalizar expediente (ejecutar baja)
 * Cambia estado de APPROVED → EXECUTED
 */
export const finalizeDisposal = async (disposalId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/asset-disposals/${disposalId}/finalize`, {
      method: 'PUT',
    });
    
    if (!response.ok) {
      throw new Error('Error al finalizar el expediente');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en finalizeDisposal:', error);
    throw error;
  }
};

/**
 * Eliminar expediente
 */
export const deleteDisposal = async (disposalId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/asset-disposals/${disposalId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Error al eliminar el expediente');
    }
    
    return true;
  } catch (error) {
    console.error('Error en deleteDisposal:', error);
    throw error;
  }
};

// ==================== GESTIÓN DE DETALLES (BIENES) ====================

/**
 * Agregar bien al expediente
 */
export const addAssetToDisposal = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/asset-disposal-details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Error al agregar el bien al expediente');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en addAssetToDisposal:', error);
    throw error;
  }
};

/**
 * Obtener detalle por ID
 */
export const getDisposalDetailById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/asset-disposal-details/${id}`);
    
    if (!response.ok) {
      throw new Error('Error al obtener el detalle');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en getDisposalDetailById:', error);
    throw error;
  }
};

/**
 * Obtener todos los bienes de un expediente
 */
export const getAssetsByDisposalId = async (disposalId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/asset-disposal-details/disposal/${disposalId}`);
    
    if (!response.ok) {
      throw new Error('Error al obtener los bienes del expediente');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en getAssetsByDisposalId:', error);
    throw error;
  }
};

/**
 * Obtener historial de bajas de un bien
 */
export const getDisposalHistoryByAsset = async (assetId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/asset-disposal-details/asset/${assetId}`);
    
    if (!response.ok) {
      throw new Error('Error al obtener el historial de bajas del bien');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en getDisposalHistoryByAsset:', error);
    throw error;
  }
};

/**
 * Agregar opinión técnica a un bien
 */
export const addTechnicalOpinion = async (detailId, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/asset-disposal-details/${detailId}/technical-opinion`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Error al agregar la opinión técnica');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en addTechnicalOpinion:', error);
    throw error;
  }
};

/**
 * Ejecutar remoción física del bien
 */
export const executeRemoval = async (detailId, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/asset-disposal-details/${detailId}/execute-removal`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Error al ejecutar la remoción física');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en executeRemoval:', error);
    throw error;
  }
};

/**
 * Eliminar bien del expediente
 */
export const removeAssetFromDisposal = async (detailId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/asset-disposal-details/${detailId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Error al eliminar el bien del expediente');
    }
    
    return true;
  } catch (error) {
    console.error('Error en removeAssetFromDisposal:', error);
    throw error;
  }
};

// ==================== UTILIDADES ====================

/**
 * Obtener detalles completos de un expediente (incluye bienes)
 */
export const getDisposalWithAssets = async (disposalId) => {
  try {
    const [disposal, assets] = await Promise.all([
      getDisposalById(disposalId),
      getAssetsByDisposalId(disposalId),
    ]);
    
    return {
      ...disposal,
      disposalAssets: assets, // ✅ Usar disposalAssets para consistencia con el backend
      assets, // Mantener también assets por compatibilidad
    };
  } catch (error) {
    console.error('Error en getDisposalWithAssets:', error);
    throw error;
  }
};

/**
 * Estados del expediente con traducciones
 */
export const DISPOSAL_STATUS = [
  { value: 'INITIATED', label: 'Iniciado', color: 'blue' },
  { value: 'UNDER_EVALUATION', label: 'En Evaluación', color: 'yellow' },
  { value: 'APPROVED', label: 'Aprobado', color: 'green' },
  { value: 'REJECTED', label: 'Rechazado', color: 'red' },
  { value: 'EXECUTED', label: 'Ejecutado', color: 'purple' },
  { value: 'CANCELLED', label: 'Cancelado', color: 'gray' },
];

/**
 * Tipos de baja con traducciones (ACTUALIZADO según backend)
 */
export const DISPOSAL_TYPES = [
  { value: 'ADMINISTRATIVE', label: 'Administrativa', icon: '📋' },
  { value: 'TECHNICAL', label: 'Técnica', icon: '🔧' },
  { value: 'FORTUITOUS', label: 'Fortuita', icon: '⚡' },
  { value: 'OBSOLESCENCE', label: 'Obsolescencia', icon: '⏳' },
];

/**
 * Recomendaciones con traducciones
 */
export const RECOMMENDATIONS = [
  { value: 'DESTROY', label: 'Destruir' },
  { value: 'DONATE', label: 'Donar' },
  { value: 'SELL', label: 'Vender' },
  { value: 'RECYCLE', label: 'Reciclar' },
  { value: 'TRANSFER', label: 'Transferir' },
];

// ==================== FLUJO SIMPLIFICADO: SOLICITUD CON APROBACIÓN ====================

/**
 * Crear solicitud de baja con informe técnico (ACTUALIZADO según nueva API)
 * Requiere: technicalReportAuthorId (obligatorio)
 * Estado inicial: INITIATED
 * 
 * @param {Object} data - { municipalityId, disposalType, disposalReason, reasonDescription, 
 *                         technicalReportAuthorId, observations, requiresDestruction, 
 *                         allowsDonation, recoverableValue, requestedBy }
 */
export const createDisposalRequest = async (data) => {
  console.log('Datos enviados a createDisposalRequest:', data);
  
  // Validar que technicalReportAuthorId exista y no esté vacío
  if (!data.technicalReportAuthorId || data.technicalReportAuthorId.trim() === '') {
    throw new Error('❌ El campo technicalReportAuthorId es obligatorio y no puede estar vacío');
  }
  
  const payload = {
    municipalityId: data.municipalityId,
    disposalType: data.disposalType,
    disposalReason: data.disposalReason,
    reasonDescription: data.reasonDescription,
    technicalReportAuthorId: data.technicalReportAuthorId, // ✅ REQUERIDO (confirmado en backend)
    observations: data.observations || null,
    requiresDestruction: data.requiresDestruction || false,
    allowsDonation: data.allowsDonation || false,
    recoverableValue: data.recoverableValue || 0,
    requestedBy: data.requestedBy,
  };
  
  console.log('📤 Payload enviado al backend:', JSON.stringify(payload, null, 2));
  console.log('🔍 technicalReportAuthorId value:', payload.technicalReportAuthorId);
  console.log('🔍 technicalReportAuthorId type:', typeof payload.technicalReportAuthorId);
  console.log('🔍 technicalReportAuthorId length:', payload.technicalReportAuthorId?.length);
  
  try {
    const response = await fetch(`${API_BASE_URL}/asset-disposals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response del backend:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      
      throw new Error(errorData?.message || `Error del servidor: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Respuesta exitosa del backend:', result);
    return result;
  } catch (error) {
    console.error('Error en createDisposalRequest:', error);
    throw error;
  }
};

/**
 * Obtener todas las solicitudes de baja pendientes de evaluación
 * Filtra por estado INITIATED
 */
export const getPendingDisposalRequests = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/asset-disposals/status/INITIATED`);
    
    if (!response.ok) {
      throw new Error('Error al obtener solicitudes pendientes');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en getPendingDisposalRequests:', error);
    throw error;
  }
};

/**
 * Obtener solicitudes en evaluación (UNDER_EVALUATION)
 */
export const getDisposalsUnderEvaluation = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/asset-disposals/status/UNDER_EVALUATION`);
    
    if (!response.ok) {
      throw new Error('Error al obtener solicitudes en evaluación');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en getDisposalsUnderEvaluation:', error);
    throw error;
  }
};

/**
 * Obtener solicitudes aprobadas (APPROVED)
 */
export const getApprovedDisposals = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/asset-disposals/status/APPROVED`);
    
    if (!response.ok) {
      throw new Error('Error al obtener solicitudes aprobadas');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en getApprovedDisposals:', error);
    throw error;
  }
};

/**
 * Obtener historial completo de solicitudes de baja
 */
export const getDisposalRequestHistory = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/asset-disposals`);
    
    if (!response.ok) {
      throw new Error('Error al obtener historial de solicitudes');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en getDisposalRequestHistory:', error);
    throw error;
  }
};

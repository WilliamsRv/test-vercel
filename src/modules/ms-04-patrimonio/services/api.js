// Use environment variable or fallback to localhost
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'https://vg-ms-patrimonioservice-production.up.railway.app/api/v1'}/assets`;


/**
 * Obtener todos los bienes patrimoniales
 * Retorna: Array de AssetResponse con campos en inglés
 */
export const getBienesPatrimoniales = async () => {
  try {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
      throw new Error('Error al obtener bienes patrimoniales');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getBienesPatrimoniales:', error);
    throw error;
  }
};

/**
 * Obtener un bien patrimonial por ID
 */
export const getBienPatrimonialById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) {
      throw new Error('Error al obtener el bien patrimonial');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getBienPatrimonialById:', error);
    throw error;
  }
};

/**
 * Crear un nuevo bien patrimonial
 */
export const createBienPatrimonial = async (data) => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    console.log('Respuesta de createBienPatrimonial:', response);
    if (!response.ok) {
      throw new Error('Error al crear el bien patrimonial');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en createBienPatrimonial:', error);
    throw error;
  }
};

/**
 * Actualizar un bien patrimonial
 */
export const updateBienPatrimonial = async (id, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    console.log('Bien a actualizar data:', data);
    if (!response.ok) {
      throw new Error('Error al actualizar el bien patrimonial');
    }
    return await response.json();
   
  } catch (error) {
    console.error('Error en updateBienPatrimonial:', error);
    throw error;
  }
};

/**
 * Eliminar un bien patrimonial (eliminación lógica - cambia estado a BAJA)
 */
export const deleteBienPatrimonial = async (id, motivo = 'Bien dado de baja') => {
  try {
    // Eliminación lógica: cambiar estado a BAJA
    return await cambiarEstadoBien(id, 'BAJA', motivo);
  } catch (error) {
    console.error('Error en deleteBienPatrimonial:', error);
    throw error;
  }
};

/**
 * Restaurar un bien patrimonial (cambia estado de BAJA a DISPONIBLE)
 */
export const restaurarBienPatrimonial = async (id, motivo = 'Bien restaurado') => {
  try {
    return await cambiarEstadoBien(id, 'DISPONIBLE', motivo);
  } catch (error) {
    console.error('Error en restaurarBienPatrimonial:', error);
    throw error;
  }
};

/**
 * Eliminar físicamente un bien patrimonial (solo administradores)
 */
export const deleteBienPatrimonialFisico = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Error al eliminar físicamente el bien patrimonial');
    }
  } catch (error) {
    console.error('Error en deleteBienPatrimonialFisico:', error);
    throw error;
  }
};

/**
 * Cambiar estado de un bien patrimonial
 */
export const cambiarEstadoBien = async (id, nuevoEstado, motivo = '') => {
  try {
    // Obtener token para autenticación
    const token = localStorage.getItem('accessToken');
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/${id}/status`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify({ nuevoEstado, motivo }),
    });
    if (!response.ok) {
      throw new Error('Error al cambiar el estado del bien');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en cambiarEstadoBien:', error);
    throw error;
  }
};

/**
 * Buscar bienes por estado
 */
export const getBienesByEstado = async (status) => {
  try {
    const response = await fetch(`${API_BASE_URL}/status/${status}`);
    if (!response.ok) {
      throw new Error('Error al buscar bienes por estado');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getBienesByEstado:', error);
    throw error;
  }
};

/**
 * Buscar bien por código patrimonial (assetCode)
 * ⚠️ MIGRADO: El parámetro del endpoint cambió de {codigoPatrimonial} a {assetCode}
 */
export const getBienByCodigo = async (assetCode) => {
  try {
    const response = await fetch(`${API_BASE_URL}/codigo/${assetCode}`);
    if (!response.ok) {
      throw new Error('Error al buscar bien por código');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getBienByCodigo:', error);
    throw error;
  }
};

/**
 * Validar si un código SBN ya existe en el sistema (para evitar duplicados)
 * @param {string} sbnCode - Código SBN de 8 dígitos
 * @param {string} excludeAssetId - ID del activo a excluir (al editar)
 * @returns {Promise<{exists: boolean, assetCode?: string, description?: string}>}
 */
export const validateSBNCode = async (sbnCode, excludeAssetId = null) => {
  try {
    const url = excludeAssetId 
      ? `${API_BASE_URL}/validate-sbn/${sbnCode}?excludeAssetId=${excludeAssetId}`
      : `${API_BASE_URL}/validate-sbn/${sbnCode}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Error al validar código SBN');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en validateSBNCode:', error);
    // En caso de error de red, devolver que no existe para no bloquear
    return { exists: false };
  }
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5005';
const ASSET_MOVEMENTS_ENDPOINT = '/api/v1/asset-movements';

/**
 * Helper para manejar errores de la API
 */
async function handleApiCall(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `Error ${response.status}: ${response.statusText}`
    }));
    throw new Error(error.message || 'Error en la petición');
  }
  return await response.json();
}

class AssetMovementService {
  /**
   * Crear un nuevo movimiento
   */
  async createMovement(municipalityId, movementData) {
    try {
      // Asegurar que attachedDocuments sea un string JSON válido, no un array
      const dataToSend = { ...movementData };
      if (dataToSend.attachedDocuments) {
        // Si attachedDocuments es un array, convertirlo a string JSON
        if (Array.isArray(dataToSend.attachedDocuments)) {
          dataToSend.attachedDocuments = JSON.stringify(dataToSend.attachedDocuments);
        }
        // Si attachedDocuments es un string, verificar que sea JSON válido
        else if (typeof dataToSend.attachedDocuments === 'string') {
          try {
            // Verificar que sea JSON válido parseándolo
            JSON.parse(dataToSend.attachedDocuments);
            // Si es válido, dejarlo como está (ya es un string JSON)
          } catch (e) {
            // Si no es JSON válido, intentar convertirlo
            console.warn('⚠️ attachedDocuments no es un JSON válido, intentando convertir...');
            dataToSend.attachedDocuments = JSON.stringify(dataToSend.attachedDocuments);
          }
        }
      }
      
      // Log detallado antes de enviar
      console.log('📡 Creating movement - ANTES de procesar:', {
        attachedDocumentsType: typeof movementData.attachedDocuments,
        attachedDocumentsIsArray: Array.isArray(movementData.attachedDocuments),
        attachedDocumentsValue: movementData.attachedDocuments
      });
      
      console.log('📡 Creating movement - DESPUÉS de procesar:', {
        attachedDocumentsType: typeof dataToSend.attachedDocuments,
        attachedDocumentsIsArray: Array.isArray(dataToSend.attachedDocuments),
        attachedDocumentsValue: dataToSend.attachedDocuments,
        attachedDocumentsLength: dataToSend.attachedDocuments ? dataToSend.attachedDocuments.length : 0
      });
      
      // Verificar el JSON que se va a enviar
      const jsonBody = JSON.stringify(dataToSend);
      console.log('📡 Creating asset movement with data:', dataToSend);
      console.log('📡 API URL:', `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}`);
      console.log('📡 Movement type:', dataToSend.movementType);
      console.log('📡 Full payload (primeros 1000 chars):', jsonBody.substring(0, 1000));
      
      // Verificar específicamente attachedDocuments en el JSON
      try {
        const parsedBody = JSON.parse(jsonBody);
        console.log('📡 attachedDocuments en JSON parseado:', {
          type: typeof parsedBody.attachedDocuments,
          isArray: Array.isArray(parsedBody.attachedDocuments),
          value: parsedBody.attachedDocuments
        });
      } catch (e) {
        console.error('❌ Error parseando JSON body:', e);
      }
      
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}`, {
        method: 'POST',
        headers: headers,
        body: jsonBody,
      });

      console.log('📥 Response status:', response.status, response.statusText);

      if (response.status === 201) {
        const data = await response.json();
        console.log('✅ Movement created successfully:', data);
        return data;
      } else {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
          console.error('❌ Error details:', errorJson);
        } catch (e) {
          if (errorText) {
            errorMessage = errorText.substring(0, 200);
          }
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('❌ Error creating asset movement:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los movimientos por municipio
   */
  async getAllMovements(municipalityId) {
    try {
      const url = `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/municipality/${municipalityId}`;
      console.log('🔍 Fetching movements from:', url);
      
      const response = await fetch(url);
      
      console.log('📥 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('⚠️ No movements found (404)');
          return [];
        }
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`Error fetching movements: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Movements received:', Array.isArray(data) ? `${data.length} movements` : 'Not an array', data);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Error fetching movements:', error);
      throw error;
    }
  }

  /**
   * Obtener movimiento por ID
   */
  async getMovementById(id, municipalityId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/${id}/municipality/${municipalityId}`
      );
      
      if (response.status === 404) {
        return null;
      }
      
      return await handleApiCall(response);
    } catch (error) {
      console.error('Error fetching movement:', error);
      throw error;
    }
  }

  /**
   * Actualizar movimiento
   */
  async updateMovement(id, municipalityId, movementData) {
    try {
      // Asegurar que attachedDocuments sea un string JSON válido, no un array
      const dataToSend = { ...movementData };
      if (dataToSend.attachedDocuments) {
        // Si attachedDocuments es un array, convertirlo a string JSON
        if (Array.isArray(dataToSend.attachedDocuments)) {
          dataToSend.attachedDocuments = JSON.stringify(dataToSend.attachedDocuments);
        }
        // Si attachedDocuments es un string, verificar que sea JSON válido
        else if (typeof dataToSend.attachedDocuments === 'string') {
          try {
            // Verificar que sea JSON válido parseándolo
            JSON.parse(dataToSend.attachedDocuments);
            // Si es válido, dejarlo como está (ya es un string JSON)
          } catch (e) {
            // Si no es JSON válido, intentar convertirlo
            console.warn('⚠️ attachedDocuments no es un JSON válido, intentando convertir...');
            dataToSend.attachedDocuments = JSON.stringify(dataToSend.attachedDocuments);
          }
        }
      }
      
      // Log detallado antes de enviar
      console.log('📡 Updating movement - ANTES de procesar:', {
        attachedDocumentsType: typeof movementData.attachedDocuments,
        attachedDocumentsIsArray: Array.isArray(movementData.attachedDocuments),
        attachedDocumentsValue: movementData.attachedDocuments
      });
      
      console.log('📡 Updating movement - DESPUÉS de procesar:', {
        attachedDocumentsType: typeof dataToSend.attachedDocuments,
        attachedDocumentsIsArray: Array.isArray(dataToSend.attachedDocuments),
        attachedDocumentsValue: dataToSend.attachedDocuments,
        attachedDocumentsLength: dataToSend.attachedDocuments ? dataToSend.attachedDocuments.length : 0
      });
      
      // Verificar el JSON que se va a enviar
      const jsonBody = JSON.stringify(dataToSend);
      console.log('📡 JSON body a enviar (primeros 1000 chars):', jsonBody.substring(0, 1000));
      
      // Verificar específicamente attachedDocuments en el JSON
      try {
        const parsedBody = JSON.parse(jsonBody);
        console.log('📡 attachedDocuments en JSON parseado:', {
          type: typeof parsedBody.attachedDocuments,
          isArray: Array.isArray(parsedBody.attachedDocuments),
          value: parsedBody.attachedDocuments
        });
      } catch (e) {
        console.error('❌ Error parseando JSON body:', e);
      }
      
      const response = await fetch(
        `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/${id}/municipality/${municipalityId}`,
        {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
          },
          body: jsonBody
        }
      );
      
      console.log('📥 Update response status:', response.status, response.statusText);
      
      if (response.status === 404) {
        throw new Error('Movimiento no encontrado');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Update error response:', errorText);
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          // Si no es JSON, usar el texto
          if (errorText) {
            errorMessage = errorText.substring(0, 200);
          }
        }
        throw new Error(errorMessage);
      }
      
      return await handleApiCall(response);
    } catch (error) {
      console.error('❌ Error updating movement:', error);
      throw error;
    }
  }

  /**
   * Aprobar movimiento
   */
  async approveMovement(id, municipalityId, approvedBy) {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      console.log('📡 Approving movement:', { id, municipalityId, approvedBy });
      
      const response = await fetch(
        `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/${id}/approve/municipality/${municipalityId}`,
        {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ approvedBy })
        }
      );
      
      console.log('📥 Approve response status:', response.status, response.statusText);
      
      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'approvedBy es requerido');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Approve error response:', errorText);
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          if (errorText) {
            errorMessage = errorText.substring(0, 200);
          }
        }
        throw new Error(errorMessage);
      }
      
      return await handleApiCall(response);
    } catch (error) {
      console.error('Error approving movement:', error);
      throw error;
    }
  }

  /**
   * Rechazar movimiento
   */
  async rejectMovement(id, municipalityId, approvedBy, rejectionReason) {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const body = { approvedBy };
      if (rejectionReason) {
        body.rejectionReason = rejectionReason;
      }

      const response = await fetch(
        `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/${id}/reject/municipality/${municipalityId}`,
        {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(body)
        }
      );
      
      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'approvedBy es requerido');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Reject error response:', errorText);
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          if (errorText) {
            errorMessage = errorText.substring(0, 200);
          }
        }
        throw new Error(errorMessage);
      }
      
      return await handleApiCall(response);
    } catch (error) {
      console.error('Error rejecting movement:', error);
      throw error;
    }
  }

  /**
   * Marcar movimiento como "En Proceso"
   */
  async markInProcess(id, municipalityId, executingUser) {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(
        `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/${id}/in-process/municipality/${municipalityId}`,
        {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ executingUser })
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Mark in process error response:', errorText);
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          if (errorText) {
            errorMessage = errorText.substring(0, 200);
          }
        }
        throw new Error(errorMessage);
      }
      
      return await handleApiCall(response);
    } catch (error) {
      console.error('Error marking movement as in process:', error);
      throw error;
    }
  }

  /**
   * Completar movimiento
   */
  async completeMovement(id, municipalityId) {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(
        `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/${id}/complete/municipality/${municipalityId}`,
        {
          method: 'POST',
          headers: headers
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Complete movement error response:', errorText);
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          if (errorText) {
            errorMessage = errorText.substring(0, 200);
          }
        }
        throw new Error(errorMessage);
      }
      
      return await handleApiCall(response);
    } catch (error) {
      console.error('Error completing movement:', error);
      throw error;
    }
  }

  /**
   * Cancelar movimiento
   */
  async cancelMovement(id, municipalityId, cancellationReason) {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const body = {};
      if (cancellationReason) {
        body.cancellationReason = cancellationReason;
      }

      const response = await fetch(
        `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/${id}/cancel/municipality/${municipalityId}`,
        {
          method: 'POST',
          headers: headers,
          body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Cancel movement error response:', errorText);
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          if (errorText) {
            errorMessage = errorText.substring(0, 200);
          }
        }
        throw new Error(errorMessage);
      }
      
      return await handleApiCall(response);
    } catch (error) {
      console.error('Error cancelling movement:', error);
      throw error;
    }
  }

  /**
   * Eliminar movimiento (Soft Delete)
   */
  async deleteMovement(id, municipalityId, deletedBy) {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(
        `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/${id}/municipality/${municipalityId}`,
        {
          method: 'DELETE',
          headers: headers,
          body: JSON.stringify({ deletedBy })
        }
      );
      
      return await handleApiCall(response);
    } catch (error) {
      console.error('Error deleting movement:', error);
      throw error;
    }
  }

  /**
   * Restaurar movimiento eliminado
   * POST /api/v1/asset-movements/{id}/restore/municipality/{municipalityId}
   * Body: { "restoredBy": "uuid-del-usuario" }
   */
  async restoreMovement(id, municipalityId, restoredBy) {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const url = `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/${id}/restore/municipality/${municipalityId}`;
      console.log('🔄 Restoring movement:', id, 'restoredBy:', restoredBy);
      console.log('📡 API URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ restoredBy })
      });
      
      console.log('📥 Restore response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Restore error response:', errorText);
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          if (errorText) {
            errorMessage = errorText.substring(0, 200);
          }
        }
        throw new Error(errorMessage);
      }
      
      const data = await handleApiCall(response);
      console.log('✅ Movement restored successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error restoring movement:', error);
      throw error;
    }
  }

  /**
   * Obtener movimientos por activo
   */
  async getMovementsByAsset(assetId, municipalityId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/asset/${assetId}/municipality/${municipalityId}`
      );
      return await handleApiCall(response);
    } catch (error) {
      console.error('Error fetching movements by asset:', error);
      return [];
    }
  }

  /**
   * Obtener movimientos por tipo
   */
  async getMovementsByType(movementType, municipalityId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/type/${movementType}/municipality/${municipalityId}`
      );
      return await handleApiCall(response);
    } catch (error) {
      console.error('Error fetching movements by type:', error);
      return [];
    }
  }

  /**
   * Obtener movimientos por estado
   */
  async getMovementsByStatus(status, municipalityId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/status/${status}/municipality/${municipalityId}`
      );
      return await handleApiCall(response);
    } catch (error) {
      console.error('Error fetching movements by status:', error);
      return [];
    }
  }

  /**
   * Obtener movimientos pendientes de aprobación
   */
  async getPendingApprovalMovements(municipalityId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/pending-approval/municipality/${municipalityId}`
      );
      return await handleApiCall(response);
    } catch (error) {
      console.error('Error fetching pending approval movements:', error);
      return [];
    }
  }

  /**
   * Obtener movimientos por responsable de destino
   */
  async getMovementsByDestinationResponsible(destinationResponsibleId, municipalityId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/destination-responsible/${destinationResponsibleId}/municipality/${municipalityId}`
      );
      return await handleApiCall(response);
    } catch (error) {
      console.error('Error fetching movements by destination responsible:', error);
      return [];
    }
  }

  /**
   * Obtener movimientos por responsable de origen
   */
  async getMovementsByOriginResponsible(originResponsibleId, municipalityId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/origin-responsible/${originResponsibleId}/municipality/${municipalityId}`
      );
      return await handleApiCall(response);
    } catch (error) {
      console.error('Error fetching movements by origin responsible:', error);
      return [];
    }
  }

  /**
   * Contar movimientos
   */
  async countMovements(municipalityId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/count/municipality/${municipalityId}`
      );
      const data = await handleApiCall(response);
      return data.count || 0;
    } catch (error) {
      console.error('Error counting movements:', error);
      return 0;
    }
  }

  /**
   * Obtener movimientos eliminados (soft-deleted)
   * GET /api/v1/asset-movements/deleted/municipality/{municipalityId}
   * Retorna movimientos con active = false, ordenados por deletedAt DESC
   */
  async getDeletedMovements(municipalityId) {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const url = `${API_BASE_URL}${ASSET_MOVEMENTS_ENDPOINT}/deleted/municipality/${municipalityId}`;
      console.log('🔍 Fetching deleted movements from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });
      
      console.log('📥 Deleted movements response status:', response.status, response.statusText);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('⚠️ No deleted movements found (404)');
          return [];
        }
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`Error fetching deleted movements: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Deleted movements received:', Array.isArray(data) ? `${data.length} movements` : 'Not an array', data);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Error fetching deleted movements:', error);
      // Retornar array vacío en caso de error para no romper la UI
      return [];
    }
  }
}

export default new AssetMovementService();


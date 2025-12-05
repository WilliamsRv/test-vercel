const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5005';
const HANDOVER_RECEIPTS_ENDPOINT = '/api/v1/handover-receipts';

class HandoverReceiptService {
  // Crear acta de entrega-recepción
  async createHandoverReceipt(municipalityId, receiptData) {
    try {
      console.log('Creating handover receipt with data:', receiptData);
      console.log('Municipality ID:', municipalityId);
      console.log('API URL:', `${API_BASE_URL}${HANDOVER_RECEIPTS_ENDPOINT}/municipality/${municipalityId}`);
      
      const response = await fetch(`${API_BASE_URL}${HANDOVER_RECEIPTS_ENDPOINT}/municipality/${municipalityId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(receiptData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Error creating handover receipt: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Success response:', result);
      return result;
    } catch (error) {
      console.error('Error creating handover receipt:', error);
      throw error;
    }
  }

  // Obtener acta por ID
  async getHandoverReceiptById(id, municipalityId) {
    try {
      const response = await fetch(`${API_BASE_URL}${HANDOVER_RECEIPTS_ENDPOINT}/${id}/municipality/${municipalityId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching handover receipt: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching handover receipt:', error);
      throw error;
    }
  }

  // Obtener todas las actas
  async getAllHandoverReceipts(municipalityId) {
    try {
      console.log('Fetching handover receipts for municipality:', municipalityId);
      console.log('Calling API:', `${API_BASE_URL}${HANDOVER_RECEIPTS_ENDPOINT}/municipality/${municipalityId}`);
      
      const response = await fetch(`${API_BASE_URL}${HANDOVER_RECEIPTS_ENDPOINT}/municipality/${municipalityId}`);
      
      if (!response.ok) {
        console.log('API response not OK:', response.status, response.statusText);
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Error fetching handover receipts: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API data received:', data);
      
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching handover receipts:', error);
      throw error;
    }
  }

  // Obtener acta por movimiento
  async getHandoverReceiptByMovement(movementId, municipalityId) {
    try {
      const response = await fetch(`${API_BASE_URL}${HANDOVER_RECEIPTS_ENDPOINT}/movement/${movementId}/municipality/${municipalityId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching handover receipt by movement: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching handover receipt by movement:', error);
      throw error;
    }
  }

  // Obtener actas por estado
  async getHandoverReceiptsByStatus(status, municipalityId) {
    try {
      const response = await fetch(`${API_BASE_URL}${HANDOVER_RECEIPTS_ENDPOINT}/status/${status}/municipality/${municipalityId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching handover receipts by status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching handover receipts by status:', error);
      return [];
    }
  }

  // Obtener actas por responsable
  async getHandoverReceiptsByResponsible(responsibleId, municipalityId) {
    try {
      const response = await fetch(`${API_BASE_URL}${HANDOVER_RECEIPTS_ENDPOINT}/responsible/${responsibleId}/municipality/${municipalityId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching handover receipts by responsible: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching handover receipts by responsible:', error);
      return [];
    }
  }

  // Firmar acta
  async signHandoverReceipt(id, municipalityId, signatureData) {
    try {
      const response = await fetch(`${API_BASE_URL}${HANDOVER_RECEIPTS_ENDPOINT}/${id}/sign/municipality/${municipalityId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signatureData),
      });

      if (!response.ok) {
        throw new Error(`Error signing handover receipt: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error signing handover receipt:', error);
      throw error;
    }
  }

  // Contar actas
  async countHandoverReceipts(municipalityId) {
    try {
      const response = await fetch(`${API_BASE_URL}${HANDOVER_RECEIPTS_ENDPOINT}/count/municipality/${municipalityId}`);
      
      if (!response.ok) {
        throw new Error(`Error counting handover receipts: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error counting handover receipts:', error);
      return 0;
    }
  }

  // Contar actas por estado
  async countHandoverReceiptsByStatus(status, municipalityId) {
    try {
      const response = await fetch(`${API_BASE_URL}${HANDOVER_RECEIPTS_ENDPOINT}/count/status/${status}/municipality/${municipalityId}`);
      
      if (!response.ok) {
        throw new Error(`Error counting handover receipts by status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error counting handover receipts by status:', error);
      return 0;
    }
  }

  // Actualizar acta de entrega-recepción
  async updateHandoverReceipt(id, municipalityId, receiptData) {
    try {
      console.log('Updating handover receipt:', id);
      console.log('Update data:', receiptData);
      
      const response = await fetch(`${API_BASE_URL}${HANDOVER_RECEIPTS_ENDPOINT}/${id}/municipality/${municipalityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(receiptData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Error updating handover receipt: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Update success:', result);
      return result;
    } catch (error) {
      console.error('Error updating handover receipt:', error);
      throw error;
    }
  }
}

export default new HandoverReceiptService();
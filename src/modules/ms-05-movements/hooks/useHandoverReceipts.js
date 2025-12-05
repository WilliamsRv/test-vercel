import { useState, useEffect, useCallback } from 'react';
import handoverReceiptService from '../services/handoverReceiptService';

export const useHandoverReceipts = (municipalityId) => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadReceipts = useCallback(async () => {
    // Si no hay municipalityId válido, usar un ID por defecto para desarrollo
    const validMunicipalityId = municipalityId && municipalityId !== 'your-municipality-id' 
      ? municipalityId 
      : 'default-municipality-id';
    
    try {
      setLoading(true);
      setError(null);
      const data = await handoverReceiptService.getAllHandoverReceipts(validMunicipalityId);
      setReceipts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Error al cargar las actas de entrega-recepción');
      console.error('Error loading receipts:', err);
      // En caso de error, establecer array vacío para evitar crashes
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  }, [municipalityId]);

  const createReceipt = async (receiptData) => {
    try {
      const newReceipt = await handoverReceiptService.createHandoverReceipt(municipalityId, receiptData);
      return newReceipt;
    } catch (err) {
      console.error('Error creating receipt:', err);
      throw err;
    }
  };

  const updateReceiptData = async (id, receiptData) => {
    try {
      const updatedReceipt = await handoverReceiptService.updateHandoverReceipt(id, municipalityId, receiptData);
      return updatedReceipt;
    } catch (err) {
      console.error('Error updating receipt:', err);
      throw err;
    }
  };

  const updateReceipt = (updatedReceipt) => {
    setReceipts(prev => 
      prev.map(receipt => 
        receipt.id === updatedReceipt.id ? updatedReceipt : receipt
      )
    );
  };

  const signReceipt = async (receiptId, signatureData) => {
    try {
      const signedReceipt = await handoverReceiptService.signHandoverReceipt(
        receiptId, 
        municipalityId, 
        signatureData
      );
      updateReceipt(signedReceipt);
      return signedReceipt;
    } catch (err) {
      console.error('Error signing receipt:', err);
      throw err;
    }
  };

  const getReceiptsByStatus = useCallback(async (status) => {
    if (!municipalityId) return [];
    
    try {
      const data = await handoverReceiptService.getHandoverReceiptsByStatus(status, municipalityId);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error loading receipts by status:', err);
      throw err;
    }
  }, [municipalityId]);

  const getReceiptsByResponsible = useCallback(async (responsibleId) => {
    if (!municipalityId) return [];
    
    try {
      const data = await handoverReceiptService.getHandoverReceiptsByResponsible(responsibleId, municipalityId);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error loading receipts by responsible:', err);
      throw err;
    }
  }, [municipalityId]);

  const getReceiptByMovement = useCallback(async (movementId) => {
    if (!municipalityId) return null;
    
    try {
      return await handoverReceiptService.getHandoverReceiptByMovement(movementId, municipalityId);
    } catch (err) {
      console.error('Error loading receipt by movement:', err);
      throw err;
    }
  }, [municipalityId]);

  const countReceipts = useCallback(async () => {
    if (!municipalityId) return 0;
    
    try {
      return await handoverReceiptService.countHandoverReceipts(municipalityId);
    } catch (err) {
      console.error('Error counting receipts:', err);
      return 0;
    }
  }, [municipalityId]);

  const countReceiptsByStatus = useCallback(async (status) => {
    if (!municipalityId) return 0;
    
    try {
      return await handoverReceiptService.countHandoverReceiptsByStatus(status, municipalityId);
    } catch (err) {
      console.error('Error counting receipts by status:', err);
      return 0;
    }
  }, [municipalityId]);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  return {
    receipts,
    loading,
    error,
    loadReceipts,
    createReceipt,
    updateReceipt,
    updateReceiptData,
    signReceipt,
    getReceiptsByStatus,
    getReceiptsByResponsible,
    getReceiptByMovement,
    countReceipts,
    countReceiptsByStatus
  };
};
import { useState, useEffect, useCallback } from 'react';
import assetMovementService from '../services/assetMovementService';

export const useAssetMovements = (municipalityId) => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadMovements = useCallback(async () => {
    if (!municipalityId) {
      console.warn('⚠️ No municipalityId provided');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading movements for municipality:', municipalityId);
      const data = await assetMovementService.getAllMovements(municipalityId);
      console.log('📊 Movements loaded:', data.length, 'items');
      
      // Cargar todos los movimientos (activos e inactivos)
      // El filtrado se hará en el componente según el filtro seleccionado
      const allMovements = Array.isArray(data) ? data : [];
      
      console.log('📊 All movements loaded:', allMovements.length, 'items');
      setMovements(allMovements);
    } catch (err) {
      const errorMessage = err.message || 'Error al cargar los movimientos';
      setError(errorMessage);
      console.error('❌ Error loading movements:', err);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  }, [municipalityId]);

  const createMovement = async (movementData) => {
    try {
      const newMovement = await assetMovementService.createMovement(municipalityId, movementData);
      setMovements(prev => [newMovement, ...prev]);
      return newMovement;
    } catch (err) {
      console.error('Error creating movement:', err);
      throw err;
    }
  };

  const updateMovement = (updatedMovement) => {
    setMovements(prev => 
      prev.map(movement => 
        movement.id === updatedMovement.id ? updatedMovement : movement
      )
    );
  };

  const deleteMovement = async (id, deletedBy) => {
    try {
      await assetMovementService.deleteMovement(id, municipalityId, deletedBy);
      setMovements(prev => prev.filter(movement => movement.id !== id));
    } catch (err) {
      console.error('Error deleting movement:', err);
      throw err;
    }
  };

  const approveMovement = async (id, approvedBy) => {
    try {
      const approved = await assetMovementService.approveMovement(id, municipalityId, approvedBy);
      updateMovement(approved);
      return approved;
    } catch (err) {
      console.error('Error approving movement:', err);
      throw err;
    }
  };

  const rejectMovement = async (id, approvedBy, rejectionReason) => {
    try {
      const rejected = await assetMovementService.rejectMovement(id, municipalityId, approvedBy, rejectionReason);
      updateMovement(rejected);
      return rejected;
    } catch (err) {
      console.error('Error rejecting movement:', err);
      throw err;
    }
  };

  const markInProcess = async (id, executingUser) => {
    try {
      const inProcess = await assetMovementService.markInProcess(id, municipalityId, executingUser);
      updateMovement(inProcess);
      return inProcess;
    } catch (err) {
      console.error('Error marking movement as in process:', err);
      throw err;
    }
  };

  const completeMovement = async (id) => {
    try {
      const completed = await assetMovementService.completeMovement(id, municipalityId);
      updateMovement(completed);
      return completed;
    } catch (err) {
      console.error('Error completing movement:', err);
      throw err;
    }
  };

  const cancelMovement = async (id, cancellationReason) => {
    try {
      const cancelled = await assetMovementService.cancelMovement(id, municipalityId, cancellationReason);
      updateMovement(cancelled);
      return cancelled;
    } catch (err) {
      console.error('Error cancelling movement:', err);
      throw err;
    }
  };

  const restoreMovement = async (id, restoredBy) => {
    try {
      const restored = await assetMovementService.restoreMovement(id, municipalityId, restoredBy);
      setMovements(prev => [restored, ...prev]);
      return restored;
    } catch (err) {
      console.error('Error restoring movement:', err);
      throw err;
    }
  };

  const getMovementsByStatus = useCallback(async (status) => {
    if (!municipalityId) return [];
    
    try {
      const data = await assetMovementService.getMovementsByStatus(status, municipalityId);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error loading movements by status:', err);
      throw err;
    }
  }, [municipalityId]);

  const getMovementsByType = useCallback(async (movementType) => {
    if (!municipalityId) return [];
    
    try {
      const data = await assetMovementService.getMovementsByType(movementType, municipalityId);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error loading movements by type:', err);
      throw err;
    }
  }, [municipalityId]);

  const getMovementsByAsset = useCallback(async (assetId) => {
    if (!municipalityId) return [];
    
    try {
      const data = await assetMovementService.getMovementsByAsset(assetId, municipalityId);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error loading movements by asset:', err);
      throw err;
    }
  }, [municipalityId]);

  const getPendingApprovalMovements = useCallback(async () => {
    if (!municipalityId) return [];
    
    try {
      const data = await assetMovementService.getPendingApprovalMovements(municipalityId);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error loading pending approval movements:', err);
      throw err;
    }
  }, [municipalityId]);

  const countMovements = useCallback(async () => {
    if (!municipalityId) return 0;
    
    try {
      return await assetMovementService.countMovements(municipalityId);
    } catch (err) {
      console.error('Error counting movements:', err);
      return 0;
    }
  }, [municipalityId]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  return {
    movements,
    loading,
    error,
    loadMovements,
    createMovement,
    updateMovement,
    deleteMovement,
    approveMovement,
    rejectMovement,
    markInProcess,
    completeMovement,
    cancelMovement,
    restoreMovement,
    getMovementsByStatus,
    getMovementsByType,
    getMovementsByAsset,
    getPendingApprovalMovements,
    countMovements
  };
};


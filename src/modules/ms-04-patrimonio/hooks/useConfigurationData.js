import { useState, useEffect } from 'react';
import {
  getAreas,
  getCategories,
  getLocations,
  getResponsible,
  getSuppliers,
  normalizeAreas,
  normalizeCategories,
  normalizeLocations,
  normalizeResponsible,
  normalizeSuppliers,
} from '../services/configurationService';

/**
 * Hook para cargar datos de configuración con caché automático
 */
export default function useConfigurationData() {
  const [data, setData] = useState({
    areas: [],
    categories: [],
    locations: [],
    responsible: [],
    suppliers: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [areas, categories, locations, responsible, suppliers] = await Promise.all([
        getAreas(),
        getCategories(),
        getLocations(),
        getResponsible(),
        getSuppliers(),
      ]);

      setData({
        areas: normalizeAreas(areas),
        categories: normalizeCategories(categories),
        locations: normalizeLocations(locations),
        responsible: normalizeResponsible(responsible),
        suppliers: normalizeSuppliers(suppliers),
      });
    } catch (err) {
      setError('No se pudieron cargar los datos de configuración');
      console.error('Error cargando configuración:', err);
    } finally {
      setLoading(false);
    }
  };

  return { ...data, loading, error, reload: loadData };
}

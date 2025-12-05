// Servicio de configuración con caché en localStorage
const API_BASE = import.meta.env.VITE_CONFIGURATION_API_URL || 'http://localhost:5003/api/v1';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Utilidades de caché
const cache = {
  get(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      const { data, timestamp } = JSON.parse(item);
      if (Date.now() - timestamp > CACHE_DURATION) {
        localStorage.removeItem(key);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },
  
  set(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (error) {
      console.warn('Error guardando caché:', error);
    }
  },
  
  clear() {
    ['areas', 'categories', 'locations', 'responsible', 'suppliers']
      .forEach(key => localStorage.removeItem(`sipreb_${key}`));
  }
};

// Obtener headers con token de autenticación
function getHeaders() {
  const token = localStorage.getItem('accessToken');
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
}

// Fetch con caché y autenticación
async function fetchWithCache(endpoint) {
  const cacheKey = `sipreb_${endpoint}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${API_BASE}/${endpoint}`, {
      headers: getHeaders()
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    // Intentar caché expirado como fallback
    const expired = localStorage.getItem(cacheKey);
    if (expired) {
      console.warn(`API no disponible, usando caché: ${endpoint}`);
      return JSON.parse(expired).data;
    }
    throw error;
  }
}

// API endpoints
export const getAreas = () => fetchWithCache('areas');
export const getCategories = () => fetchWithCache('categories');
export const getLocations = () => fetchWithCache('locations');
export const getResponsible = () => fetchWithCache('responsible');
export const getSuppliers = () => fetchWithCache('suppliers');

// Normalización para SelectSearch
const normalize = (items, nameField, codeField) => 
  (items || []).map(item => ({
    id: item.id,
    label: item[nameField] || 'Sin nombre',
    code: item[codeField] || 'Sin código',
    raw: item
  }));

export const normalizeAreas = (data) => normalize(data, 'name', 'areaCode');
export const normalizeCategories = (data) => normalize(data, 'name', 'categoryCode');
export const normalizeLocations = (data) => normalize(data, 'name', 'locationCode');

// Normalización especial para responsables (concatena firstName y lastName)
export const normalizeResponsible = (data) => 
  (data || []).map(item => ({
    id: item.id,
    label: `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Sin nombre',
    code: item.employeeCode || 'Sin código',
    firstName: item.firstName,
    lastName: item.lastName,
    raw: item
  }));

// Normalización especial para proveedores (usa tradeName o legalName)
export const normalizeSuppliers = (data) => 
  (data || []).map(item => ({
    id: item.id,
    label: item.tradeName || item.legalName || 'Sin nombre',
    code: item.codigoProveedor || 'Sin código',
    legalName: item.legalName,
    tradeName: item.tradeName,
    raw: item
  }));

export const clearCache = () => cache.clear();

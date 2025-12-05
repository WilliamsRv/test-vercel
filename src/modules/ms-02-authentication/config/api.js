// API principal (Authentication)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api/v1';

// API de Organización (Areas y Positions - puerto 5004)
export const ORG_API_URL = import.meta.env.VITE_ORG_API_URL || 'http://localhost:5004';

// API de Tipos de Documento (puerto 5004)
export const DOCUMENT_TYPE_API_URL = import.meta.env.VITE_DOCUMENT_TYPES_API || 'http://localhost:5004';

// Alias para compatibilidad
export const AREA_API_URL = ORG_API_URL;
export const POSITION_API_URL = ORG_API_URL;

export default API_BASE_URL;

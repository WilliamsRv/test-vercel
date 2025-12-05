/**
 * Configuración centralizada de APIs para el módulo MS-07 Mantenimiento
 * Todas las URLs base de los microservicios están definidas aquí
 */

// Microservicios externos
export const API_ENDPOINTS = {
    // MS-01: Municipalidades
    MS_01_MUNICIPALITIES: 'http://localhost:5001/api/municipalities',

    // MS-02: Autenticación y Usuarios
    MS_02_AUTH: 'http://localhost:5002/api/v1',
    MS_02_USERS: 'http://localhost:5002/api/v1/users',
    MS_02_USERS_ACTIVE: 'http://localhost:5002/api/v1/users/active',

    // MS-03: Bienes/Activos (Patrimonio)
    MS_03_ASSETS: 'http://localhost:5003/api/assets',

    // MS-04: Proveedores
    MS_04_SUPPLIERS: 'http://localhost:5004/api/v1/suppliers',

    // MS-07: Mantenimiento (este módulo)
    MS_07_MAINTENANCE: 'http://localhost:5007/api/v1/maintenances',
};

// Endpoints específicos por servicio
export const USER_ENDPOINTS = {
    BASE: API_ENDPOINTS.MS_02_USERS,
    ACTIVE: API_ENDPOINTS.MS_02_USERS_ACTIVE,
    BY_ID: (id) => `${API_ENDPOINTS.MS_02_USERS}/${id}`,
    FALLBACK_OPTIONS: [
        API_ENDPOINTS.MS_02_USERS,
        API_ENDPOINTS.MS_02_USERS_ACTIVE,
        `${API_ENDPOINTS.MS_02_USERS}?status=ACTIVE`,
        `${API_ENDPOINTS.MS_02_USERS}?isActive=true`,
        `${API_ENDPOINTS.MS_02_USERS}?active=true`,
    ],
};

export const SUPPLIER_ENDPOINTS = {
    BASE: API_ENDPOINTS.MS_04_SUPPLIERS,
    BY_ID: (id) => `${API_ENDPOINTS.MS_04_SUPPLIERS}/${id}`,
    ACTIVE: `${API_ENDPOINTS.MS_04_SUPPLIERS}?active=true`,
};

export const ASSET_ENDPOINTS = {
    BASE: 'http://localhost:5003/api/v1/assets',
    BY_ID: (id) => `http://localhost:5003/api/v1/assets/${id}`,
    BY_CODE: (code) => `http://localhost:5003/api/v1/assets/code/${code}`,
    BY_STATUS: (status) => `http://localhost:5003/api/v1/assets/status/${status}`,
};

export const MUNICIPALITY_ENDPOINTS = {
    BASE: API_ENDPOINTS.MS_01_MUNICIPALITIES,
    BY_ID: (id) => `${API_ENDPOINTS.MS_01_MUNICIPALITIES}/${id}`,
};

export const MAINTENANCE_ENDPOINTS = {
    BASE: API_ENDPOINTS.MS_07_MAINTENANCE,
    BY_ID: (id) => `${API_ENDPOINTS.MS_07_MAINTENANCE}/${id}`,
    BY_MUNICIPALITY: (municipalityId) => `${API_ENDPOINTS.MS_07_MAINTENANCE}?municipalityId=${municipalityId}`,
    BY_STATUS_SCHEDULED: `${API_ENDPOINTS.MS_07_MAINTENANCE}/status/scheduled`,
    BY_STATUS_IN_PROGRESS: `${API_ENDPOINTS.MS_07_MAINTENANCE}/status/in-process`,
    BY_STATUS_SUSPENDED: `${API_ENDPOINTS.MS_07_MAINTENANCE}/status/suspended`,
    BY_STATUS_COMPLETED: `${API_ENDPOINTS.MS_07_MAINTENANCE}/status/completed`,
    BY_STATUS_CANCELLED: `${API_ENDPOINTS.MS_07_MAINTENANCE}/status/cancelled`,
    START: (id) => `${API_ENDPOINTS.MS_07_MAINTENANCE}/${id}/start`,
    COMPLETE: (id) => `${API_ENDPOINTS.MS_07_MAINTENANCE}/${id}/complete`,
    SUSPEND: (id) => `${API_ENDPOINTS.MS_07_MAINTENANCE}/${id}/suspend`,
    CANCEL: (id) => `${API_ENDPOINTS.MS_07_MAINTENANCE}/${id}/cancel`,
    RESCHEDULE: (id) => `${API_ENDPOINTS.MS_07_MAINTENANCE}/${id}/reschedule`,
};

export default API_ENDPOINTS;

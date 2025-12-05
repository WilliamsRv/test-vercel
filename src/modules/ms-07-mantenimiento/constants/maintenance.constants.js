// Tipos de mantenimiento
export const MAINTENANCE_TYPES = {
    PREVENTIVE: 'PREVENTIVE',
    CORRECTIVE: 'CORRECTIVE',
    PREDICTIVE: 'PREDICTIVE',
    EMERGENCY: 'EMERGENCY',
};

// Prioridades
export const PRIORITIES = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
};

// Estados de mantenimiento
export const MAINTENANCE_STATUSES = {
    SCHEDULED: 'SCHEDULED',
    IN_PROCESS: 'IN_PROCESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    SUSPENDED: 'SUSPENDED',
};

// Labels en español para tipos
export const MAINTENANCE_TYPE_LABELS = {
    PREVENTIVE: 'Preventivo',
    CORRECTIVE: 'Correctivo',
    PREDICTIVE: 'Predictivo',
    EMERGENCY: 'Emergencia',
};

// Labels en español para prioridades
export const PRIORITY_LABELS = {
    LOW: 'Baja',
    MEDIUM: 'Media',
    HIGH: 'Alta',
    CRITICAL: 'Crítica',
};

// Labels en español para estados
export const STATUS_LABELS = {
    SCHEDULED: 'Programado',
    IN_PROCESS: 'En Proceso',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado',
    SUSPENDED: 'Suspendido',
};

// Colores para badges de estados
export const STATUS_COLORS = {
    SCHEDULED: 'blue',
    IN_PROCESS: 'yellow',
    COMPLETED: 'green',
    CANCELLED: 'red',
    SUSPENDED: 'gray',
};

// Colores para badges de prioridades
export const PRIORITY_COLORS = {
    LOW: 'blue',
    MEDIUM: 'yellow',
    HIGH: 'orange',
    CRITICAL: 'red',
};

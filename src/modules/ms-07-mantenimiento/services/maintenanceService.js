import { MAINTENANCE_ENDPOINTS } from '../config/api.js';

// Utilidades de validación
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuid && uuidRegex.test(uuid);
};

const isValidDate = (dateString) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
};

class MaintenanceService {
    constructor() {
        // Servicio sin autenticación
    }

    async request(endpoint, options = {}) {
        const url = endpoint;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                // Manejo específico de errores según código HTTP
                let errorMessage = errorData.message || `Error ${response.status}`;

                if (response.status === 400 && errorData.validationErrors) {
                    const errors = Object.entries(errorData.validationErrors)
                        .map(([field, msg]) => `${field}: ${msg}`)
                        .join('\n');
                    errorMessage = `Errores de validación:\n${errors}`;
                } else if (response.status === 404) {
                    errorMessage = 'Mantenimiento no encontrado';
                } else if (response.status === 409) {
                    errorMessage = 'El código de mantenimiento ya existe';
                } else if (response.status === 500) {
                    errorMessage = 'Error interno del servidor. Intente nuevamente.';
                }

                throw new Error(errorMessage);
            }

            return await response.json();
        } catch (error) {
            console.error('Maintenance Service Error:', error);
            throw error;
        }
    }

    // Validar datos antes de enviar
    validateMaintenanceData(data) {
        const errors = [];

        // Validar campos obligatorios
        const requiredFields = [
            'municipalityId',
            'maintenanceCode',
            'assetId',
            'maintenanceType',
            'priority',
            'scheduledDate',
            'workDescription',
            'observations', // Ahora es obligatorio
            'technicalResponsibleId',
            'requestedBy'
        ];

        for (const field of requiredFields) {
            if (!data[field]) {
                errors.push(`El campo ${field} es obligatorio`);
            }
        }

        // Validar UUIDs
        const uuidFields = ['municipalityId', 'assetId', 'technicalResponsibleId', 'requestedBy'];
        for (const field of uuidFields) {
            if (data[field] && !isValidUUID(data[field])) {
                errors.push(`${field} debe ser un UUID válido`);
            }
        }

        // serviceSupplierId es opcional
        if (data.serviceSupplierId && !isValidUUID(data.serviceSupplierId)) {
            errors.push('serviceSupplierId debe ser un UUID válido');
        }

        if (data.updatedBy && !isValidUUID(data.updatedBy)) {
            errors.push('updatedBy debe ser un UUID válido');
        }

        // Validar fecha
        if (data.scheduledDate && !isValidDate(data.scheduledDate)) {
            errors.push('scheduledDate debe tener formato YYYY-MM-DD');
        }

        // Validar garantía
        if (data.hasWarranty === true) {
            if (!data.warrantyExpirationDate) {
                errors.push('warrantyExpirationDate es obligatorio cuando hasWarranty es true');
            } else if (!isValidDate(data.warrantyExpirationDate)) {
                errors.push('warrantyExpirationDate debe tener formato YYYY-MM-DD');
            }
        } else if (data.hasWarranty === false && data.warrantyExpirationDate) {
            errors.push('warrantyExpirationDate debe ser null cuando hasWarranty es false');
        }

        // Validar costos
        if (data.laborCost !== undefined && data.laborCost < 0) {
            errors.push('laborCost no puede ser negativo');
        }
        if (data.partsCost !== undefined && data.partsCost < 0) {
            errors.push('partsCost no puede ser negativo');
        }

        // Validar longitud del código
        if (data.maintenanceCode && data.maintenanceCode.length > 50) {
            errors.push('maintenanceCode no puede exceder 50 caracteres');
        }

        if (errors.length > 0) {
            throw new Error(errors.join('\n'));
        }

        return true;
    }

    // Limpiar datos antes de enviar (eliminar campos autogenerados)
    cleanDataForRequest(data) {
        const cleanData = { ...data };

        // Eliminar campos que se generan automáticamente en el backend
        delete cleanData.id;
        delete cleanData.totalCost;
        delete cleanData.createdAt;
        delete cleanData.updatedAt;
        
        // Eliminar campos internos del frontend
        delete cleanData.hasCosts;

        // Si hasWarranty es false, NO incluir warrantyExpirationDate
        if (cleanData.hasWarranty === false && cleanData.warrantyExpirationDate) {
            delete cleanData.warrantyExpirationDate;
        }
        
        // Eliminar attachedDocuments si está vacío para evitar enviar array vacío
        if (cleanData.attachedDocuments && cleanData.attachedDocuments.length === 0) {
            delete cleanData.attachedDocuments;
        }

        return cleanData;
    }

    // Crear nuevo mantenimiento
    async createMaintenance(maintenanceData) {
        try {
            // Validar datos
            this.validateMaintenanceData(maintenanceData);

            // Limpiar datos
            const cleanData = this.cleanDataForRequest(maintenanceData);

            // Validar attachedDocuments según la nueva API
            if (cleanData.attachedDocuments) {
                if (!Array.isArray(cleanData.attachedDocuments)) {
                    throw new Error('attachedDocuments debe ser un array');
                }
                // Permitir 0 o 1 documento (opcional)
                if (cleanData.attachedDocuments.length > 1) {
                    throw new Error('Solo se permite máximo 1 documento adjunto');
                }
                // Validar fileUrl si hay un documento
                if (cleanData.attachedDocuments.length === 1 && !cleanData.attachedDocuments[0].fileUrl) {
                    throw new Error('El documento debe contener fileUrl');
                }
            }

            console.log('📤 Enviando datos al backend (CREATE):', cleanData);
            const response = await this.request(MAINTENANCE_ENDPOINTS.BASE, {
                method: 'POST',
                body: JSON.stringify(cleanData),
            });
            console.log('✅ Respuesta del backend (CREATE):', response);
            return response;
        } catch (error) {
            console.error('❌ Error al crear mantenimiento:', error);
            throw error;
        }
    }

    // Listar todos los mantenimientos
    async getAllMaintenances() {
        try {
            const response = await this.request(MAINTENANCE_ENDPOINTS.BASE, {
                method: 'GET',
            });
            return response;
        } catch (error) {
            console.error('Error al obtener mantenimientos:', error);
            throw error;
        }
    }

    // Obtener mantenimientos por estado
    async getMaintenancesByStatus(status) {
        try {
            let endpoint;
            const statusUpper = status.toUpperCase();

            switch (statusUpper) {
                case 'SCHEDULED':
                    endpoint = MAINTENANCE_ENDPOINTS.BY_STATUS_SCHEDULED;
                    break;
                case 'IN_PROGRESS':
                case 'IN_PROCESS':
                    endpoint = MAINTENANCE_ENDPOINTS.BY_STATUS_IN_PROGRESS;
                    break;
                case 'SUSPENDED':
                    endpoint = MAINTENANCE_ENDPOINTS.BY_STATUS_SUSPENDED;
                    break;
                case 'COMPLETED':
                    endpoint = MAINTENANCE_ENDPOINTS.BY_STATUS_COMPLETED;
                    break;
                case 'CANCELLED':
                    endpoint = MAINTENANCE_ENDPOINTS.BY_STATUS_CANCELLED;
                    break;
                default:
                    throw new Error(`Estado no válido: ${status}`);
            }

            const response = await this.request(endpoint, {
                method: 'GET',
            });
            return response;
        } catch (error) {
            console.error(`Error al obtener mantenimientos con estado ${status}:`, error);
            throw error;
        }
    }

    // Obtener mantenimiento por ID
    async getMaintenanceById(id) {
        try {
            const response = await this.request(MAINTENANCE_ENDPOINTS.BY_ID(id), {
                method: 'GET',
            });
            return response;
        } catch (error) {
            console.error('Error al obtener mantenimiento:', error);
            throw error;
        }
    }

    // Actualizar mantenimiento completo
    async updateMaintenance(id, maintenanceData) {
        try {
            if (!isValidUUID(id)) {
                throw new Error('ID debe ser un UUID válido');
            }

            // Validar datos
            this.validateMaintenanceData(maintenanceData);

            // Limpiar datos
            const cleanData = this.cleanDataForRequest(maintenanceData);

            const response = await this.request(MAINTENANCE_ENDPOINTS.BY_ID(id), {
                method: 'PUT',
                body: JSON.stringify(cleanData),
            });
            return response;
        } catch (error) {
            console.error('❌ Error al actualizar mantenimiento:', error);
            throw error;
        }
    }

    // Iniciar mantenimiento (SCHEDULED -> IN_PROCESS)
    async startMaintenance(id, updatedBy, observations = null) {
        try {
            const response = await this.request(MAINTENANCE_ENDPOINTS.START(id), {
                method: 'PATCH',
                body: JSON.stringify({ updatedBy, observations }),
            });
            return response;
        } catch (error) {
            console.error('Error al iniciar mantenimiento:', error);
            throw error;
        }
    }

    // Completar mantenimiento
    async completeMaintenance(id, data) {
        try {
            // Validar campos requeridos para completar
            if (!data.workOrder) {
                throw new Error('workOrder es obligatorio');
            }
            if (data.laborCost === undefined || data.laborCost === null) {
                throw new Error('laborCost es obligatorio');
            }
            if (data.partsCost === undefined || data.partsCost === null) {
                throw new Error('partsCost es obligatorio');
            }
            if (!data.appliedSolution) {
                throw new Error('appliedSolution es obligatorio');
            }
            if (!data.updatedBy) {
                throw new Error('updatedBy es obligatorio');
            }

            // Validar completionDocument
            if (data.completionDocument) {
                if (!data.completionDocument.fileUrl) {
                    throw new Error('completionDocument debe contener fileUrl');
                }
            }

            console.log('📤 Completando mantenimiento:', { id, data });
            const response = await this.request(MAINTENANCE_ENDPOINTS.COMPLETE(id), {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
            console.log('✅ Mantenimiento completado:', response);
            return response;
        } catch (error) {
            console.error('❌ Error al completar mantenimiento:', error);
            throw error;
        }
    }

    // Suspender mantenimiento
    async suspendMaintenance(id, nextDate, observations, updatedBy) {
        try {
            const response = await this.request(MAINTENANCE_ENDPOINTS.SUSPEND(id), {
                method: 'PATCH',
                body: JSON.stringify({ nextDate, observations, updatedBy }),
            });
            return response;
        } catch (error) {
            console.error('Error al suspender mantenimiento:', error);
            throw error;
        }
    }

    // Cancelar mantenimiento
    async cancelMaintenance(id, observations, updatedBy) {
        try {
            const response = await this.request(MAINTENANCE_ENDPOINTS.CANCEL(id), {
                method: 'PATCH',
                body: JSON.stringify({ observations, updatedBy }),
            });
            return response;
        } catch (error) {
            console.error('Error al cancelar mantenimiento:', error);
            throw error;
        }
    }

    // Reprogramar mantenimiento (SUSPENDED -> SCHEDULED)
    async rescheduleMaintenance(id, data) {
        try {
            // Validar campos obligatorios
            if (!data.nextDate) {
                throw new Error('nextDate es obligatorio');
            }
            if (!data.updatedBy) {
                throw new Error('updatedBy es obligatorio');
            }

            // Construir body solo con campos proporcionados
            const body = {
                nextDate: data.nextDate,
                updatedBy: data.updatedBy
            };

            // Campos opcionales: solo agregar si se proporcionan
            if (data.technicalResponsibleId) {
                body.technicalResponsibleId = data.technicalResponsibleId;
            }
            if (data.serviceSupplierId) {
                body.serviceSupplierId = data.serviceSupplierId;
            }
            if (data.observations) {
                body.observations = data.observations;
            }

            console.log('📤 Reprogramando mantenimiento:', { id, body });
            const response = await this.request(MAINTENANCE_ENDPOINTS.RESCHEDULE(id), {
                method: 'PATCH',
                body: JSON.stringify(body),
            });
            console.log('✅ Mantenimiento reprogramado:', response);
            return response;
        } catch (error) {
            console.error('❌ Error al reprogramar mantenimiento:', error);
            throw error;
        }
    }
}

const maintenanceService = new MaintenanceService();

export default maintenanceService;

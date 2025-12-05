import API_BASE_URL from '../config/api';

class UserService {
    constructor() {
        this.token = localStorage.getItem('accessToken');
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        this.token = localStorage.getItem('accessToken');
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        console.log('📡 Request:', {
            url,
            method: config.method || 'GET',
            hasToken: !!this.token,
            headers: config.headers,
            body: options.body ? JSON.parse(options.body) : null
        });

        try {
            const response = await fetch(url, config);
            console.log('📥 Response:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            if (!response.ok) {
                let errorMessage = `Error ${response.status}: ${response.statusText}`;
                let errorDetails = null;

                try {
                    const errorData = await response.json();
                    console.error('❌ Error Response:', errorData);
                    console.error('❌ Error Response (JSON):', JSON.stringify(errorData, null, 2));

                    errorDetails = errorData;

                    // Intentar extraer el mensaje de error más específico
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    } else if (errorData.error) {
                        errorMessage = errorData.error;
                    } else if (errorData.detail) {
                        errorMessage = errorData.detail;
                    } else if (errorData.errors) {
                        // Si hay múltiples errores de validación
                        errorMessage = Object.values(errorData.errors).flat().join(', ');
                    } else if (errorData.timestamp && errorData.path) {
                        // Formato de error de Spring Boot
                        errorMessage = `${errorData.error || 'Error'}: ${errorData.message || 'Error en el servidor'}`;
                    }

                    // Si es un NullPointerException, dar más contexto
                    if (errorData.trace && errorData.trace.includes('NullPointerException')) {
                        errorMessage = 'Error: Uno de los campos requeridos está vacío o es nulo. Verifica que todos los campos obligatorios estén completos.';
                        console.error('🚨 NullPointerException detectado - posibles campos nulos:', {
                            trace: errorData.trace,
                            debug: errorData.debug
                        });
                    }

                } catch (parseError) {
                    console.error('❌ No se pudo parsear el error:', parseError);
                    // Intentar obtener el texto plano
                    try {
                        const errorText = await response.text();
                        console.error('❌ Error Response (texto):', errorText);
                        if (errorText) {
                            errorMessage = errorText.substring(0, 200);
                        }
                        // eslint-disable-next-line no-unused-vars
                    } catch (textError) {
                        console.error('❌ No se pudo obtener el texto del error');
                    }
                }

                const error = new Error(errorMessage);
                error.details = errorDetails;
                error.status = response.status;
                throw error;
            }
            if (response.status === 204) return { success: true };
            const data = await response.json();
            console.log('✅ Data received:', data);
            return data;
        } catch (error) {
            console.error('❌ User Service Error:', error);
            throw error;
        }
    }

    async getAllUsers() {
        return await this.request('/users');
    }

    async getUserById(userId) {
        return await this.request(`/users/${userId}`);
    }

    async createUser(userData) {
        return await this.request('/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async updateUser(userId, userData) {
        // Obtener el usuario actual del localStorage
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const updatedBy = currentUser?.userId || 'system';

        return await this.request(`/users/${userId}?updatedBy=${updatedBy}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    }

    // ✅ NUEVO: Validar datos antes de actualizar (para debugging)
    async validateUpdateUser(userId, userData) {
        return await this.request(`/users/${userId}/validate-update`, {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    // ✅ ACTUALIZADO: Enviar updatedBy como query parameter
    async deleteUser(userId) {
        // Obtener el usuario actual del localStorage
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const updatedBy = currentUser?.userId || 'system';

        return await this.request(`/users/${userId}?updatedBy=${updatedBy}`, {
            method: 'DELETE',
        });
    }

    async restoreUser(userId) {
        // Obtener el usuario actual del localStorage
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const updatedBy = currentUser?.userId || 'system';

        return await this.request(`/users/${userId}/restore?updatedBy=${updatedBy}`, {
            method: 'PATCH',
        });
    }

    async changeUserStatus(userId, status) {
        return await this.request(`/users/${userId}/status/${status}`, {
            method: 'PATCH',
        });
    }

    async suspendUser(userId, reason, suspensionEnd) {
        // ❌ NO enviar updatedBy ni suspendedBy - se inyecta automáticamente del JWT
        return await this.request(`/users/${userId}/suspend`, {
            method: 'PATCH',
            body: JSON.stringify({
                reason,
                suspensionEnd: suspensionEnd ? new Date(suspensionEnd).toISOString() : null
            }),
        });
    }

    // Levantar suspensión - usa PATCH /restore
    async unsuspendUser(userId) {
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const updatedBy = currentUser?.userId || 'system';

        return await this.request(`/users/${userId}/restore?updatedBy=${updatedBy}`, {
            method: 'PATCH',
        });
    }

    // Soporta dos opciones: fecha específica o duración en horas
    async blockUser(userId, reason, options = {}) {
        const body = { reason };

        // Opción 1: Fecha específica
        if (options.blockedUntil) {
            body.blockedUntil = new Date(options.blockedUntil).toISOString();
        }

        // Opción 2: Duración en horas
        if (options.durationHours) {
            body.durationHours = options.durationHours;
        }

        return await this.request(`/users/${userId}/block`, {
            method: 'PATCH',
            body: JSON.stringify(body),
        });
    }


    async unblockUser(userId) {
        return await this.request(`/users/${userId}/unblock`, {
            method: 'PATCH'
        });
    }

    async getActiveUsers() {
        return await this.request('/users/active');
    }

    async getInactiveUsers() {
        return await this.request('/users/inactive');
    }

    async getSuspendedUsers() {
        return await this.request('/users/suspended');
    }

    async getBlockedUsers(page = 0, size = 10) {
        return await this.request(`/users/blocked?page=${page}&size=${size}`);
    }

    async getUserByUsername(username) {
        return await this.request(`/users/username/${encodeURIComponent(username)}`);
    }

    async checkUsernameExists(username) {
        return await this.request(`/users/exists/${encodeURIComponent(username)}`);
    }

    async forceUnblockExpired() {
        return await this.request('/users/force-unblock-expired', {
            method: 'POST'
        });
    }
}

const userService = new UserService();
export default userService;

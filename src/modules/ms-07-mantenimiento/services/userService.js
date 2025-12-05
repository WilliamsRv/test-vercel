/**
 * Servicio para gestionar usuarios desde el microservicio MS-02
 * Puerto: 5002
 * Base: http://localhost:5002/api/v1
 */

import { USER_ENDPOINTS } from '../config/api.js';

class UserService {
    constructor() {
        // No almacenar token en constructor, obtenerlo dinámicamente
    }

    // Obtener token actual de localStorage
    getToken() {
        return localStorage.getItem('accessToken');
    }

    /**
     * Obtener todos los usuarios
     * @returns {Promise<Array>} Lista de usuarios
     */
    async getAllUsers() {
        try {
            const url = USER_ENDPOINTS.BASE;
            const token = this.getToken();

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Mapear usuarios al formato esperado
            return data.map((user) => {

                const fullName = user.person
                    ? `${user.person.firstName || ''} ${user.person.lastName || ''}`.trim()
                    : user.username || user.email || `Usuario-${user.id?.substring(0, 8)}`;

                return {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    personId: user.personId,
                    fullName: fullName,
                    firstName: user.person?.firstName || '',
                    lastName: user.person?.lastName || '',
                    role: user.role,
                    isActive: user.isActive !== false
                };
            });
        } catch (error) {
            console.error('❌ Error al obtener usuarios:', error);
            console.error('❌ URL intentada:', USER_ENDPOINTS.BASE);
            throw error;
        }
    }

    /**
     * Obtener usuario por ID
     * @param {string} id - UUID del usuario
     * @returns {Promise<Object>} Usuario
     */
    async getUserById(id) {
        try {
            const token = this.getToken();
            const response = await fetch(USER_ENDPOINTS.BY_ID(id), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Usuario no encontrado');
                }
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const user = await response.json();

            return {
                id: user.id,
                username: user.username,
                email: user.email,
                personId: user.personId,
                fullName: user.person
                    ? `${user.person.firstName} ${user.person.lastName}`.trim()
                    : user.username,
                firstName: user.person?.firstName || '',
                lastName: user.person?.lastName || '',
                role: user.role,
                isActive: user.isActive
            };
        } catch (error) {
            console.error('❌ Error al obtener usuario:', error);
            throw error;
        }
    }

    /**
     * Obtener usuarios activos (para selects)
     * @returns {Promise<Array>} Lista de usuarios activos
     */
    async getActiveUsers() {
        try {
            const endpoints = USER_ENDPOINTS.FALLBACK_OPTIONS;
            const token = this.getToken();

            console.log('🔍 Intentando cargar usuarios desde:', endpoints);

            let raw = null;
            let successUrl = null;

            for (const url of endpoints) {
                try {
                    console.log(`📡 Probando URL: ${url}`);
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token && { 'Authorization': `Bearer ${token}` })
                        }
                    });

                    console.log(`📊 Respuesta de ${url}: ${response.status} ${response.statusText}`);

                    if (response.ok) {
                        raw = await response.json();
                        successUrl = url;
                        console.log(`✅ Usuarios obtenidos exitosamente desde ${url}`);
                        break;
                    }
                } catch (err) {
                    console.warn(`⚠️ Error en ${url}:`, err.message);
                    continue;
                }
            }

            if (!raw) {
                console.error('❌ No se pudo obtener usuarios de ningún endpoint');
                throw new Error('No se pudo obtener usuarios de MS-02. Verifica que el servicio esté activo.');
            }

            const data = Array.isArray(raw)
                ? raw
                : Array.isArray(raw.content)
                    ? raw.content
                    : Array.isArray(raw.data)
                        ? raw.data
                        : Array.isArray(raw.items)
                            ? raw.items
                            : Array.isArray(raw.results)
                                ? raw.results
                                : Array.isArray(raw?.page?.content)
                                    ? raw.page.content
                                    : Array.isArray(raw.users)
                                        ? raw.users
                                        : [];

            console.log(`📋 Total de usuarios encontrados: ${data.length}`);

            const normalized = data.map((user) => ({
                id: user.id,
                username: user.username,
                email: user.email,
                personId: user.personId,
                fullName: user.person ? `${user.person.firstName || ''} ${user.person.lastName || ''}`.trim() : (user.username || user.email || ''),
                firstName: user.person?.firstName || '',
                lastName: user.person?.lastName || '',
                role: user.role,
                isActive: user.isActive ?? (user.active ?? (user.status ? String(user.status).toUpperCase() === 'ACTIVE' : true))
            }));

            const activeOnly = normalized.filter(u => u.isActive);
            console.log(`✅ Usuarios activos: ${activeOnly.length}`);
            return activeOnly;
        } catch (error) {
            console.error('❌ Error al obtener usuarios activos:', error);
            throw error;
        }
    }
}

const userService = new UserService();

export default userService;

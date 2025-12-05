import { AREA_API_URL } from '../config/api';
const CACHE_KEY = 'areas_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

class AreaService {
    constructor() {
        // Datos de ejemplo solo como fallback cuando no hay conexión
        this.fallbackAreas = [
            {
                id: "11111111-1111-1111-1111-111111111111",
                code: "A001",
                name: "Área 1",
                description: "Área de ejemplo 1",
                active: true
            },
            {
                id: "44444444-4444-4444-4444-444444444444",
                code: "A002",
                name: "Área 2",
                description: "Área de ejemplo 2",
                active: true
            },
            {
                id: "66666666-6666-6666-6666-666666666666",
                code: "A003",
                name: "Área 3",
                description: "Área de ejemplo 3",
                active: true
            },
            {
                id: "88888888-8888-8888-8888-888888888888",
                code: "A004",
                name: "Área 4",
                description: "Área de ejemplo 4",
                active: true
            }
        ];
    }

    async request(endpoint, options = {}) {
        const url = `${AREA_API_URL}${endpoint}`;
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
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const text = await response.text();
            return text ? JSON.parse(text) : {};
        } catch (error) {
            console.error('Area Service Error:', error);
            throw error;
        }
    }

    getFromCache(ignoreExpiration = false) {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);
            const isExpired = Date.now() - timestamp > CACHE_DURATION;

            if (isExpired && !ignoreExpiration) return null;

            return data;
        } catch (error) {
            console.error('Error reading cache:', error);
            return null;
        }
    }

    saveToCache(data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.error('Error saving to cache:', error);
        }
    }

    async getAllAreas() {
        try {
            // Verificar caché primero
            const cached = this.getFromCache();
            if (cached) {
                console.log('✅ Areas loaded from cache:', cached);
                return cached;
            }

            // Llamar a la API
            console.log('🔄 Fetching areas from API:', `${AREA_API_URL}/api/v1/areas`);
            const data = await this.request('/api/v1/areas');
            console.log('📦 Areas received from API:', data);

            // Validar que sea un array
            if (!Array.isArray(data)) {
                console.error('❌ API response is not an array:', data);
                throw new Error('Invalid API response format');
            }

            // Guardar en caché
            this.saveToCache(data);

            console.log('✅ Areas loaded from API and cached:', data.length, 'areas');
            return data;
        } catch (error) {
            console.error('❌ Failed to fetch areas from API:', error.message);
            console.error('⚠️ CORS Error: El backend necesita configurar CORS para permitir peticiones desde http://localhost:5173');

            // Intentar usar caché aunque esté expirado
            const cached = this.getFromCache(true);
            if (cached && cached.length > 0) {
                console.log('✅ Using expired cache as fallback:', cached);
                return cached;
            }

            // Fallback: datos de ejemplo solo cuando no hay caché
            console.warn('⚠️ Usando datos de ejemplo como fallback. Configura CORS en el backend para ver datos reales.');
            return this.fallbackAreas;
        }
    }

    async getActiveAreas() {
        const areas = await this.getAllAreas();
        return areas.filter(a => a.active);
    }

    async getAreaById(id) {
        const areas = await this.getAllAreas();
        return areas.find(a => a.id === id);
    }

    clearCache() {
        try {
            localStorage.removeItem(CACHE_KEY);
            console.log('Areas cache cleared');
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }
}

const areaService = new AreaService();
export default areaService;

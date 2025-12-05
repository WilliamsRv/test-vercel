import { POSITION_API_URL } from '../config/api';
const CACHE_KEY = 'positions_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

class PositionService {
    constructor() {
        // Datos de ejemplo solo como fallback cuando no hay conexión
        this.fallbackPositions = [
            {
                id: "22222222-2222-2222-2222-222222222222",
                positionCode: "P001",
                name: "Posición 1",
                description: "Posición de ejemplo 1",
                hierarchicalLevel: 1,
                baseSalary: 0,
                active: true
            },
            {
                id: "33333333-3333-3333-3333-333333333333",
                positionCode: "P002",
                name: "Posición 2",
                description: "Posición de ejemplo 2",
                hierarchicalLevel: 2,
                baseSalary: 0,
                active: true
            },
            {
                id: "55555555-5555-5555-5555-555555555555",
                positionCode: "P003",
                name: "Posición 3",
                description: "Posición de ejemplo 3",
                hierarchicalLevel: 3,
                baseSalary: 0,
                active: true
            }
        ];
    }

    async request(endpoint, options = {}) {
        const url = `${POSITION_API_URL}${endpoint}`;
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
            console.error('Position Service Error:', error);
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

    async getAllPositions() {
        try {
            // Verificar caché primero
            const cached = this.getFromCache();
            if (cached) {
                console.log('✅ Positions loaded from cache:', cached);
                return cached;
            }

            // Llamar a la API
            console.log('🔄 Fetching positions from API:', `${POSITION_API_URL}/api/v1/positions`);
            const data = await this.request('/api/v1/positions');
            console.log('📦 Positions received from API:', data);

            // Validar que sea un array
            if (!Array.isArray(data)) {
                console.error('❌ API response is not an array:', data);
                throw new Error('Invalid API response format');
            }

            // Guardar en caché
            this.saveToCache(data);

            console.log('✅ Positions loaded from API and cached:', data.length, 'positions');
            return data;
        } catch (error) {
            console.error('❌ Failed to fetch positions from API:', error.message);
            console.error('⚠️ CORS Error: El backend necesita configurar CORS para permitir peticiones desde http://localhost:5173');

            // Intentar usar caché aunque esté expirado
            const cached = this.getFromCache(true);
            if (cached && cached.length > 0) {
                console.log('✅ Using expired cache as fallback:', cached);
                return cached;
            }

            // Fallback: datos de ejemplo solo cuando no hay caché
            console.warn('⚠️ Usando datos de ejemplo como fallback. Configura CORS en el backend para ver datos reales.');
            return this.fallbackPositions;
        }
    }

    async getActivePositions() {
        const positions = await this.getAllPositions();
        return positions.filter(p => p.active);
    }

    async getPositionById(id) {
        const positions = await this.getAllPositions();
        return positions.find(p => p.id === id);
    }

    clearCache() {
        try {
            localStorage.removeItem(CACHE_KEY);
            console.log('Positions cache cleared');
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }
}

const positionService = new PositionService();
export default positionService;

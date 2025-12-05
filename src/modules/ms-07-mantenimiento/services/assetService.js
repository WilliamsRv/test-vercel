import { ASSET_ENDPOINTS } from '../config/api.js';

// URL base del microservicio de patrimonio
const PATRIMONIO_API_URL = 'http://localhost:5003/api/v1/assets';

class AssetService {
    constructor() {
        // No almacenar token en constructor, obtenerlo dinámicamente
    }

    // Obtener token actual de localStorage
    getToken() {
        return localStorage.getItem('accessToken');
    }

    // Parsear respuesta del servidor
    parseResponse(raw) {
        return Array.isArray(raw)
            ? raw
            : Array.isArray(raw.data)
                ? raw.data
                : Array.isArray(raw.content)
                    ? raw.content
                    : Array.isArray(raw.bienes)
                        ? raw.bienes
                        : Array.isArray(raw.assets)
                            ? raw.assets
                            : [];
    }

    /**
     * Obtener TODOS los activos (sin filtro)
     */
    async getAllAssets() {
        try {
            const token = this.getToken();
            const response = await fetch(PATRIMONIO_API_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const raw = await response.json();
            const data = this.parseResponse(raw);
            console.log(`✅ Todos los activos obtenidos: ${data.length} registros`);
            return data;
        } catch (error) {
            console.error('❌ Error al cargar todos los activos:', error);
            throw error;
        }
    }

    /**
     * Obtener activos por estado usando el endpoint /status/{status}
     * @param {string} status - Estado del activo (AVAILABLE, ACTIVO, MAINTENANCE, etc.)
     */
    async getAssetsByStatus(status) {
        try {
            const token = this.getToken();
            const url = `${PATRIMONIO_API_URL}/status/${status}`;
            
            console.log(`🔍 Obteniendo activos con estado: ${status}`);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const raw = await response.json();
            const data = this.parseResponse(raw);
            console.log(`✅ Activos con estado ${status}: ${data.length} registros`);
            return data;
        } catch (error) {
            console.error(`❌ Error al cargar activos con estado ${status}:`, error);
            throw error;
        }
    }

    /**
     * Obtener activos disponibles para mantenimiento
     * Excluye: BAJA y MAINTENANCE
     * Incluye: IN_USE, AVAILABLE, DISPONIBLE y otros estados activos
     */
    async getAvailableAssets() {
        try {
            // Estados a EXCLUIR (no pueden recibir mantenimiento)
            const excludedStatuses = ['BAJA', 'MAINTENANCE'];
            
            // Obtener todos los activos y filtrar
            console.log('🔄 Obteniendo activos para mantenimiento...');
            const allAssets = await this.getAllAssets();
            
            const availableAssets = allAssets.filter(asset => {
                const status = (asset.assetStatus || asset.status || '').toUpperCase();
                return !excludedStatuses.includes(status);
            });

            console.log(`✅ Activos disponibles para mantenimiento: ${availableAssets.length} de ${allAssets.length}`);
            console.log(`   📊 Excluidos: BAJA y MAINTENANCE`);
            
            return availableAssets;
        } catch (error) {
            console.error('❌ Error al cargar activos disponibles:', error);
            throw error;
        }
    }

    async updateAssetStatus(assetId, nuevoEstado, motivo) {
        try {
            const response = await fetch(`${ASSET_ENDPOINTS.BY_ID(assetId)}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nuevoEstado,
                    motivo
                }),
            });

            if (!response.ok) {
                throw new Error('Error al actualizar el estado del activo');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al actualizar estado del activo:', error);
            throw error;
        }
    }
}

const assetService = new AssetService();
export default assetService;

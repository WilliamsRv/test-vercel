import { MUNICIPALITY_ENDPOINTS } from '../config/api.js';

/**
 * Mapear datos de la API (inglés) a formato local (español)
 */
const mapFromApi = (m) => {
    if (!m) return m;
    return {
        id: m.id,
        nombre: m.name,
        name: m.name, // Mantener ambos para compatibilidad
        ruc: m.ruc,
        ubigeo: m.ubigeoCode,
        tipo: m.municipalityType,
        departamento: m.department,
        provincia: m.province,
        distrito: m.district,
        direccion: m.address,
        telefono: m.phoneNumber,
        celular: m.mobileNumber,
        email: m.email,
        website: m.website,
        alcalde: m.mayorName,
        activo: m.isActive,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
    };
};

/**
 * Servicio para obtener información de municipalidades
 */
class MunicipalityService {
    constructor() {
        // No almacenar token en constructor, obtenerlo dinámicamente
    }

    // Obtener token actual de localStorage
    getToken() {
        return localStorage.getItem('accessToken');
    }

    /**
     * Obtener municipalidad por ID
     */
    async getMunicipalityById(id) {
        try {
            const token = this.getToken();
            console.log('🌐 Llamando a API:', MUNICIPALITY_ENDPOINTS.BY_ID(id));
            const response = await fetch(MUNICIPALITY_ENDPOINTS.BY_ID(id), {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });

            if (!response.ok) {
                console.error('❌ Error HTTP:', response.status, response.statusText);
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('📦 Datos recibidos de la API (raw):', data);

            const mapped = mapFromApi(data);
            console.log('✅ Datos mapeados:', mapped);

            return mapped;
        } catch (error) {
            console.error('❌ Error al obtener municipalidad:', error);
            throw error;
        }
    }

    /**
     * Obtener todas las municipalidades
     */
    async getAllMunicipalities() {
        try {
            const token = this.getToken();
            const response = await fetch(MUNICIPALITY_ENDPOINTS.BASE, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const list = Array.isArray(data) ? data : (data.data || []);
            return list.map(mapFromApi);
        } catch (error) {
            console.error('Error al obtener municipalidades:', error);
            throw error;
        }
    }
}

const municipalityService = new MunicipalityService();

export default municipalityService;

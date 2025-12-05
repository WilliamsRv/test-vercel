import { SUPPLIER_ENDPOINTS } from '../config/api.js';

class SupplierService {
    constructor() {
        // No almacenar token en constructor, obtenerlo dinámicamente
    }

    // Obtener token actual de localStorage
    getToken() {
        return localStorage.getItem('accessToken');
    }

    /**
     * Obtener todos los proveedores
     * @returns {Promise<Array>} Lista de proveedores
     */
    async getAllSuppliers() {
        try {
            const endpoints = [
                SUPPLIER_ENDPOINTS.BASE
            ];
            const token = this.getToken();

            console.log('🔍 Intentando cargar proveedores desde:', endpoints);

            let raw = null;

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
                        console.log(`✅ Proveedores obtenidos exitosamente desde ${url}`);
                        break;
                    }
                } catch (e) {
                    console.warn(`⚠️ Error en ${url}:`, e?.message || e);
                    continue;
                }
            }

            if (!raw) {
                console.error('❌ No se pudo obtener proveedores de ningún endpoint');
                throw new Error('No se pudo obtener proveedores de MS-04. Verifica que el servicio esté activo.');
            }

            const data = Array.isArray(raw)
                ? raw
                : Array.isArray(raw.content)
                    ? raw.content
                    : Array.isArray(raw.data)
                        ? raw.data
                        : Array.isArray(raw.items)
                            ? raw.items
                            : [];

            console.log(`📋 Total de proveedores encontrados: ${data.length}`);

            // Mapear proveedores al formato esperado
            const mapped = data.map((supplier) => {

                // Normalizar campos desde distintos esquemas (MS-03 / MS-04)
                const businessName = (
                    supplier.legalName ||
                    supplier.businessName ||
                    supplier.companyName ||
                    supplier.tradeName ||
                    supplier.supplierName ||
                    supplier.name ||
                    (supplier.id ? `Proveedor-${String(supplier.id).substring(0, 8)}` : 'Proveedor')
                );

                const rucCandidate = (
                    supplier.numeroDocumento ||
                    supplier.ruc ||
                    supplier.taxId ||
                    supplier.taxIdentificationNumber ||
                    (supplier.document && supplier.document.number) ||
                    supplier.documentNumber ||
                    supplier.documentId ||
                    supplier.identifier ||
                    null
                );

                // Formatear RUC si es 11 dígitos
                const ruc = typeof rucCandidate === 'string'
                    ? rucCandidate.replace(/\D/g, '')
                    : null;

                return {
                    id: supplier.id || supplier.supplierId || supplier.uuid,
                    name: supplier.tradeName || supplier.name || businessName,
                    businessName,
                    ruc: ruc && ruc.length === 11 ? ruc : 'Sin RUC',
                    taxId: ruc || '',
                    email: supplier.email || '',
                    phone: supplier.phone || supplier.phoneNumber || supplier.telephone || '',
                    address: supplier.address || supplier.direction || '',
                    contactPerson: supplier.mainContact || supplier.contactPerson || supplier.contact || '',
                    isActive: supplier.active !== undefined ? supplier.active : (supplier.isActive !== false),
                    supplierType: supplier.supplierType || supplier.type || ''
                };
            });

            console.log(`✅ Proveedores mapeados: ${mapped.length}`);
            return mapped;
        } catch (error) {
            console.error('❌ Error al obtener proveedores:', error);
            throw error;
        }
    }

    /**
     * Obtener proveedor por ID
     * @param {string} id - UUID del proveedor
     * @returns {Promise<Object>} Proveedor
     */
    async getSupplierById(id) {
        try {
            const token = this.getToken();
            const response = await fetch(SUPPLIER_ENDPOINTS.BY_ID(id), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Proveedor no encontrado');
                }
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const supplier = await response.json();

            return {
                id: supplier.id,
                name: supplier.name || supplier.businessName,
                businessName: supplier.businessName || supplier.name,
                ruc: supplier.ruc || supplier.taxId || 'Sin RUC',
                taxId: supplier.taxId || supplier.ruc,
                email: supplier.email,
                phone: supplier.phone,
                address: supplier.address,
                contactPerson: supplier.contactPerson,
                isActive: supplier.isActive,
                supplierType: supplier.supplierType
            };
        } catch (error) {
            console.error('❌ Error al obtener proveedor:', error);
            throw error;
        }
    }

    /**
     * Obtener proveedores activos (para selects)
     * @returns {Promise<Array>} Lista de proveedores activos
     */
    async getActiveSuppliers() {
        try {
            const suppliers = await this.getAllSuppliers();
            return suppliers.filter(supplier => supplier.isActive !== false);
        } catch (error) {
            console.error('❌ Error al obtener proveedores activos:', error);
            throw error;
        }
    }

    /**
     * Obtener proveedores por tipo
     * @param {string} type - Tipo de proveedor
     * @returns {Promise<Array>} Lista de proveedores del tipo especificado
     */
    async getSuppliersByType(type) {
        try {
            const suppliers = await this.getAllSuppliers();
            return suppliers.filter(supplier => supplier.supplierType === type);
        } catch (error) {
            console.error('❌ Error al obtener proveedores por tipo:', error);
            throw error;
        }
    }
}

const supplierService = new SupplierService();

export default supplierService;

// Use environment variable or fallback to localhost (now pointing to English endpoint)
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1'}/municipalities`;

// Enum translations between UI (ES) and API (EN)
const toApiType = (uiTipo) => {
  switch ((uiTipo || '').toUpperCase()) {
    case 'PROVINCIAL':
      return 'PROVINCIAL';
    case 'DISTRITAL':
      return 'DISTRICT';
    case 'CENTRO POBLADO':
      return 'TOWN_CENTER';
    default:
      return uiTipo; // pass-through if already in EN or empty
  }
};

const fromApiType = (apiType) => {
  switch ((apiType || '').toUpperCase()) {
    case 'PROVINCIAL':
      return 'PROVINCIAL';
    case 'DISTRICT':
      return 'DISTRITAL';
    case 'TOWN_CENTER':
      return 'CENTRO POBLADO';
    default:
      return apiType; // pass-through
  }
};

// Map Spanish UI model <-> English API model
const mapToApi = (m) => {
  if (!m) return m;
  return {
    id: m.id,
    name: m.nombre,
    ruc: m.ruc,
    ubigeoCode: m.ubigeo,
    municipalityType: toApiType(m.tipo),
    department: m.departamento,
    province: m.provincia,
    district: m.distrito,
    address: m.direccion,
    phoneNumber: m.telefono,
    mobileNumber: m.celular,
    email: m.email,
    website: m.website,
    mayorName: m.alcalde,
    isActive: m.activo,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
};

const mapFromApi = (m) => {
  if (!m) return m;
  return {
    id: m.id,
    nombre: m.name,
    ruc: m.ruc,
    ubigeo: m.ubigeoCode,
    tipo: fromApiType(m.municipalityType),
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
 * Obtener todas las municipalidades
 */
export const getMunicipalidades = async () => {
  try {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
      throw new Error('Error al obtener municipalidades');
    }
    const data = await response.json();
    const list = Array.isArray(data) ? data : (data.data || []);
    return { data: list.map(mapFromApi) };
  } catch (error) {
    console.error('Error en getMunicipalidades:', error);
    throw error;
  }
};

/**
 * Obtener una municipalidad por ID
 */
export const getMunicipalidadById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) {
      throw new Error('Error al obtener la municipalidad');
    }
    const item = await response.json();
    return mapFromApi(item);
  } catch (error) {
    console.error('Error en getMunicipalidadById:', error);
    throw error;
  }
};

/**
 * Crear una nueva municipalidad
 */
export const createMunicipalidad = async (data) => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mapToApi(data)),
    });
    if (!response.ok) {
      throw new Error('Error al crear la municipalidad');
    }
    const item = await response.json();
    return mapFromApi(item);
  } catch (error) {
    console.error('Error en createMunicipalidad:', error);
    throw error;
  }
};

/**
 * Actualizar una municipalidad
 */
export const updateMunicipalidad = async (id, data) => {
  try {
    // Asegurarse de que el id sea válido
    if (!id) {
      throw new Error('ID de municipalidad no válido');
    }

    // Filtrar solo los campos que tienen valor
    const payload = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});

    console.log('Enviando actualización:', {
      url: `${API_BASE_URL}/${id}`,
      payload
    });

    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mapToApi(payload))
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Error ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.json();
    const mapped = mapFromApi(responseData);
    console.log('Municipalidad actualizada:', mapped);
    return mapped;
  } catch (error) {
    console.error('Error en updateMunicipalidad:', {
      message: error.message,
      originalError: error
    });
    throw error;
  }
};

/**
 * Eliminar una municipalidad
 */
export const deleteMunicipalidad = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Error al eliminar la municipalidad');
    }
  } catch (error) {
    console.error('Error en deleteMunicipalidad:', error);
    throw error;
  }
};

/**
 * Buscar municipalidades por estado
 */
export const getMunicipalidadesByEstado = async (activo) => {
  try {
    const response = await fetch(`${API_BASE_URL}/estado/${activo}`);
    if (!response.ok) {
      throw new Error('Error al buscar municipalidades por estado');
    }
    const data = await response.json();
    const list = Array.isArray(data) ? data : (data.data || []);
    return { data: list.map(mapFromApi) };
  } catch (error) {
    console.error('Error en getMunicipalidadesByEstado:', error);
    throw error;
  }
};

/**
 * Buscar municipalidad por RUC
 */
export const getMunicipalidadByRuc = async (ruc) => {
  try {
    // No hay endpoint dedicado actualmente; si se implementa, ajustar aquí.
    const response = await fetch(`${API_BASE_URL}/ruc/${ruc}`);
    if (!response.ok) {
      throw new Error('Error al buscar municipalidad por RUC');
    }
    const item = await response.json();
    return mapFromApi(item);
  } catch (error) {
    console.error('Error en getMunicipalidadByRuc:', error);
    throw error;
  }
};

/**
 * Validar RUC
 */
export const validateRuc = async (ruc, excludeId = null) => {
  try {
    const url = new URL(`${API_BASE_URL}/validate/tax-id/${ruc}`);
    if (excludeId) {
      console.log('Validando RUC con excludeId:', excludeId);
      url.searchParams.append('excludeId', excludeId);
    }
    console.log('URL de validación RUC:', url.toString());
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Error al validar RUC');
    }
    const result = await response.json();
    console.log('Resultado validación RUC:', result);
    return result;
  } catch (error) {
    console.error('Error en validateRuc:', error);
    throw error;
  }
};

/**
 * Validar Ubigeo
 */
export const validateUbigeo = async (ubigeo, excludeId = null) => {
  try {
    const url = new URL(`${API_BASE_URL}/validate/ubigeo-code/${ubigeo}`);
    if (excludeId) {
      url.searchParams.append('excludeId', excludeId);
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Error al validar ubigeo');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en validateUbigeo:', error);
    throw error;
  }
};
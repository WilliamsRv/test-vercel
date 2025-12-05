import axios from "axios";

const BASE_URL = "/api/v1/physical-locations";

export const getAllPhysicalLocations = async () => {
  try {
    const { data } = await axios.get(`${BASE_URL}`);
    return data;
  } catch (err) {
    const msg = err?.response?.data?.message || err?.response?.data?.title || err?.response?.data?.error || err?.message || "Error obteniendo ubicaciones fisicas";
    throw new Error(msg);
  }
};

export const createPhysicalLocation = async (payload) => {
  try {
    // Intentar endpoint tipo /create primero
    try {
      const { data } = await axios.post(`${BASE_URL}/create`, payload);
      return data;
    } catch (e1) {
      // Fallback al root REST si no existe /create
      if (e1?.response?.status === 404 || e1?.response?.status === 405) {
        const { data } = await axios.post(`${BASE_URL}`, payload);
        return data;
      }
      throw e1;
    }
  } catch (err) {
    const msg = err?.response?.data?.message || err?.response?.data?.title || err?.response?.data?.error || err?.message || "Error creando ubicación física";
    throw new Error(msg);
  }
};

export const updatePhysicalLocation = async (id, payload) => {
  try {
    // Intentar /update/{id} (como en Areas)
    try {
      const { data } = await axios.put(`${BASE_URL}/update/${id}`, payload);
      return data;
    } catch (e1) {
      if (e1?.response?.status === 404 || e1?.response?.status === 405) {
        const { data } = await axios.put(`${BASE_URL}/${id}`, payload);
        return data;
      }
      throw e1;
    }
  } catch (err) {
    const msg = err?.response?.data?.message || err?.response?.data?.title || err?.response?.data?.error || err?.message || "Error actualizando ubicación física";
    throw new Error(msg);
  }
};

export const deletePhysicalLocation = async (id) => {
  try {
    try {
      await axios.delete(`${BASE_URL}/inactive/${id}`);
      return;
    } catch (e1) {
      // Fallbacks: DELETE root o update flag active=false
      if (e1?.response?.status === 404 || e1?.response?.status === 405) {
        try {
          await axios.delete(`${BASE_URL}/${id}`);
          return;
        } catch (e2) {
          // Intentar desactivar por flag
          try {
            await axios.put(`${BASE_URL}/update/${id}`, { active: false });
            return;
          } catch (e3) {
            await axios.put(`${BASE_URL}/${id}`, { active: false });
            return;
          }
        }
      }
      // Si vino otro error, intentar también por flag una vez
      try {
        await axios.put(`${BASE_URL}/update/${id}`, { active: false });
        return;
      } catch (_) {}
      try {
        await axios.put(`${BASE_URL}/${id}`, { active: false });
        return;
      } catch (_) {}
      throw e1;
    }
  } catch (err) {
    const msg = err?.response?.data?.message || err?.response?.data?.title || err?.response?.data?.error || err?.message || "Error eliminando ubicación física";
    throw new Error(msg);
  }
};

// Listar ubicaciones inactivas
export const getInactivePhysicalLocations = async () => {
  try {
    const { data } = await axios.get(`${BASE_URL}/inactive`);
    return data;
  } catch (e1) {
    if (e1?.response?.status === 404) return []; // si no existe endpoint, devolver vacío
    const msg = e1?.response?.data?.message || e1?.response?.data?.title || e1?.response?.data?.error || e1?.message || "Error obteniendo ubicaciones inactivas";
    throw new Error(msg);
  }
};

// Restaurar (activar) una ubicación inactiva
export const restorePhysicalLocation = async (id) => {
  try {
    try {
      // intención principal
      const { data } = await axios.put(`${BASE_URL}/active/${id}`, { active: true });
      return data;
    } catch (e1) {
      // variantes comunes
      try {
        const { data } = await axios.put(`${BASE_URL}/restore/${id}`, { active: true });
        return data;
      } catch (e2) {
        try {
          const { data } = await axios.put(`${BASE_URL}/${id}/restore`, { active: true });
          return data;
        } catch (e3) {
          // Fallback: actualizar flag por endpoint de update
          try {
            const { data } = await axios.put(`${BASE_URL}/update/${id}`, { active: true });
            return data;
          } catch (e4) {
            const { data } = await axios.put(`${BASE_URL}/${id}`, { active: true });
            return data;
          }
        }
      }
    }
  } catch (err) {
    const msg = err?.response?.data?.message || err?.response?.data?.title || err?.response?.data?.error || err?.message || "Error restaurando ubicación física";
    throw new Error(msg);
  }
};

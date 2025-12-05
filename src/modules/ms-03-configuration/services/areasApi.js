import axios from "axios";

const BASE_URL = "/api/v1/areas";

export const getAllAreas = async () => {
  try {
    const { data } = await axios.get(`${BASE_URL}`);
    return data;
  } catch (err) {
    const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Error obteniendo áreas";
    throw new Error(msg);
  }
};

export const createArea = async (payload) => {
  try {
    const { data } = await axios.post(`${BASE_URL}/create`, payload);
    return data;
  } catch (err) {
    const msg = err?.response?.data?.message || err?.response?.data?.title || err?.response?.data?.error || err?.message || "Error creando área";
    throw new Error(msg);
  }
};

export const updateArea = async (id, payload) => {
  try {
    const { data } = await axios.put(`${BASE_URL}/update/${id}`, payload);
    return data;
  } catch (err) {
    const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Error actualizando área";
    throw new Error(msg);
  }
};

export const deleteArea = async (id) => {
  try {
    await axios.delete(`${BASE_URL}/inactive/${id}`);
  } catch (err) {
    const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Error eliminando área";
    throw new Error(msg);
  }
};

export const restoreArea = async (id) => {
  try {
    await axios.patch(`${BASE_URL}/restore/${id}`);
  } catch (err) {
    const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Error restaurando área";
    throw new Error(msg);
  }
};

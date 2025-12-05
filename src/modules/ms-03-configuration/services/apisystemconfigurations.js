import axios from "axios";

const API_URL = "/api/v1/system-configurations";

// Obtener todas las configuraciones
export const getAllSystemConfigurations = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error al obtener todas las configuraciones del sistema:", error);
        throw error;
    }
};

// Crear una nueva configuración
export const createSystemConfiguration = async (config) => {
    try {
        const response = await axios.post(`${API_URL}/create`, config);
        return response.data;
    } catch (error) {
        console.error("Error al crear configuración del sistema:", error.response?.data || error);
        throw error;
    }
};

// Actualizar una configuración existente
export const updateSystemConfiguration = async (id, config) => {
    try {
        const response = await axios.put(`${API_URL}/update/${id}`, config);
        return response.data;
    } catch (error) {
        console.error("Error al actualizar configuración del sistema:", error.response?.data || error);
        throw error;
    }
};

// Eliminar lógicamente (soft delete)
export const softDeleteSystemConfiguration = async (id) => {
    try {
        await axios.delete(`${API_URL}/soft-delete/${id}`);
    } catch (error) {
        console.error("Error al eliminar lógicamente la configuración del sistema:", error.response?.data || error);
        throw error;
    }
};

// Restaurar una configuración eliminada
export const restoreSystemConfiguration = async (id) => {
    try {
        await axios.put(`${API_URL}/restore/${id}`);
    } catch (error) {
        console.error("Error al restaurar la configuración del sistema:", error.response?.data || error);
        throw error;
    }
};
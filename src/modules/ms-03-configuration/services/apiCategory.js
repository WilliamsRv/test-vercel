import axios from "axios";

const API_URL = "/api/v1/categories-assets";


// Obtener todas las Categorias
export const getAllCategories = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error al obtener todas las categorías:", error);
        throw error;
    }
};

// Obtener todas las Categorias Activas
export const getAllActiveCategories = async () => {
    try {
        const response = await axios.get(`${API_URL}/active`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener categorías activas:", error);
        throw error;
    }
};

// Obtener todas las Categorias Inactivas
export const getAllInactiveCategories = async () => {
    try {
        const response = await axios.get(`${API_URL}/inactive`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener categorías inactivas:", error);
        throw error;
    }
};

// Crear una nueva categoria
export const createCategory = async (category) => {
    try {
        const response = await axios.post(`${API_URL}/create`, category);
        return response.data;
    } catch (error) {
        console.error("Error al crear categoría:", error.response?.data || error);
        throw error;
    }
};

// Actualizar una Categoria existente
export const updateCategory = async (id, category) => {
    try {
        const response = await axios.put(`${API_URL}/update/${id}`, category);
        return response.data;
    } catch (error) {
        console.error("Error al actualizar categoría:", error.response?.data || error);
        throw error;
    }
};

// Eliminar lógicamente
export const deleteCategory = async (id) => {
    try {
        await axios.delete(`${API_URL}/inactive/${id}`);
    } catch (error) {
        console.error("Error al eliminar categoría:", error.response?.data || error);
        throw error;
    }
};


// Restaurar una Categoria eliminada
export const restoreCategory = async (id) => {
    try {
        await axios.patch(`${API_URL}/restore/${id}`);
    } catch (error) {
        console.error("Error al restaurar categoría:", error.response?.data || error);
        throw error;
    }
};
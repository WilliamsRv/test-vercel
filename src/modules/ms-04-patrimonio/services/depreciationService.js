import axios from "axios";

const API_URL = 'http://localhost:5003/api/v1/depreciations';

// Obtener historial de depreciaciones de un bien por su ID
export const getDepreciationHistoryByAsset = async (assetId) => {
     try {
          // Ajustamos la ruta según tu backend
          const response = await axios.get(`${API_URL}/${assetId}`);
          return response.data;
     } catch (error) {
          console.error("Error al obtener el historial de depreciaciones:", error);
          throw error;
     }
};

// Calcular depreciación actual (si tu backend tiene un endpoint para eso)
export const calculateDepreciation = async (assetId) => {
     try {
          const response = await axios.get(`${API_URL}/calculate/${assetId}`);
          return response.data;
     } catch (error) {
          console.error("Error al calcular depreciación:", error);
          throw error;
     }
};

// Generar depreciaciones automáticas de un bien y traer el historial actualizado
export const generateAndFetchDepreciations = async (assetId, params) => {
     try {
          // 1️⃣ Generar depreciaciones automáticas
          await axios.get(`${API_URL}/auto/${assetId}`, { params });

          // 2️⃣ Traer el historial completo actualizado
          const response = await axios.get(`${API_URL}/${assetId}`);
          return response.data;
     } catch (error) {
          console.error("Error al generar o obtener depreciaciones:", error);
          throw error;
     }
};

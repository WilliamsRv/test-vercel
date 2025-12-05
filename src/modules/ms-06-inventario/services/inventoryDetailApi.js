
// API Service para Detalle de Inventario Físico
const API_BASE_URL = 'http://localhost:5006/api/v1/inventory-details';

// Headers por defecto
const getHeaders = () => ({
     'Content-Type': 'application/json',
});

// Obtener todos los detalles
export const getAllInventoryDetails = async () => {
     try {
          const response = await fetch(API_BASE_URL, {
               method: 'GET',
               headers: getHeaders(),
          });

          if (!response.ok) {
               throw new Error(`Error ${response.status}: ${response.statusText}`);
          }

          return await response.json();
     } catch (error) {
          console.error('❌ Error al obtener detalles de inventario:', error);
          throw error;
     }
};

// Obtener detalles por ID de inventario
export const getDetailsByInventoryId = async (inventoryId) => {
     try {
          console.log('🔍 Buscando detalles para inventario:', inventoryId);
          const response = await fetch(`${API_BASE_URL}/by-inventory/${inventoryId}`, {
               method: 'GET',
               headers: getHeaders(),
          });

          if (!response.ok) {
               throw new Error(`Error ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          console.log('✅ Detalles encontrados:', data.length);
          return data;
     } catch (error) {
          console.error('❌ Error al obtener detalles por inventario:', error);
          throw error;
     }
};

// Crear nuevo detalle
export const createInventoryDetail = async (detailData) => {
     try {
          console.log('📝 Creando detalle de inventario:', detailData);
          const response = await fetch(API_BASE_URL, {
               method: 'POST',
               headers: getHeaders(),
               body: JSON.stringify(detailData),
          });

          if (!response.ok) {
               const errorText = await response.text();
               throw new Error(`Error ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          console.log('✅ Detalle creado:', data);
          return data;
     } catch (error) {
          console.error('❌ Error al crear detalle:', error);
          throw error;
     }
};

// Actualizar detalle
export const updateInventoryDetail = async (id, detailData) => {
     try {
          console.log('📝 Actualizando detalle:', id, detailData);
          const response = await fetch(`${API_BASE_URL}/${id}`, {
               method: 'PUT',
               headers: getHeaders(),
               body: JSON.stringify(detailData),
          });

          if (!response.ok) {
               const errorText = await response.text();
               throw new Error(`Error ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          console.log('✅ Detalle actualizado:', data);
          return data;
     } catch (error) {
          console.error('❌ Error al actualizar detalle:', error);
          throw error;
     }
};

// Eliminar detalle (lógico)
export const deleteInventoryDetail = async (id) => {
     try {
          console.log('🗑️ Eliminando detalle:', id);
          const response = await fetch(`${API_BASE_URL}/${id}`, {
               method: 'DELETE',
               headers: getHeaders(),
          });

          if (!response.ok) {
               const errorText = await response.text();
               throw new Error(`Error ${response.status}: ${errorText}`);
          }

          console.log('✅ Detalle eliminado');
          return true;
     } catch (error) {
          console.error('❌ Error al eliminar detalle:', error);
          throw error;
     }
};

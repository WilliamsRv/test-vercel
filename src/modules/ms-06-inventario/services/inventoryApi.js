
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5006'}/api/v1/inventories`;
const API_DETAILS_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5006'}/api/v1/inventory-details`;

// ==================== INVENTARIOS ====================

export const getAllInventories = async () => {
     try {
          const response = await fetch(`${API_BASE_URL}/with-details`);
          if (!response.ok) throw new Error('Error al obtener inventarios');
          return await response.json();
     } catch (error) {
          console.error('Error en getAllInventories:', error);
          throw error;
     }
};

export const getInventoryById = async (id) => {
     try {
          const response = await fetch(`${API_BASE_URL}/${id}`);
          if (!response.ok) throw new Error('Error al obtener inventario');
          return await response.json();
     } catch (error) {
          console.error('Error en getInventoryById:', error);
          throw error;
     }
};

export const createInventory = async (data) => {
     try {
          const response = await fetch(API_BASE_URL, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(data),
          });
          if (!response.ok) throw new Error('Error al crear inventario');
          return await response.json();
     } catch (error) {
          console.error('Error en createInventory:', error);
          throw error;
     }
};

export const updateInventory = async (id, data) => {
     try {
          console.log('📤 Actualizando inventario:', id);
          console.log('📦 Datos a enviar:', data);

          const response = await fetch(`${API_BASE_URL}/${id}`, {
               method: 'PUT',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(data),
          });

          console.log('📡 Response status:', response.status);

          if (!response.ok) {
               const errorText = await response.text();
               console.error('❌ Error del backend:', errorText);
               throw new Error(errorText || 'Error al actualizar inventario');
          }

          const result = await response.json();
          console.log('✅ Inventario actualizado:', result);
          return result;
     } catch (error) {
          console.error('❌ Error en updateInventory:', error);
          throw error;
     }
};

export const deleteInventory = async (id, userId) => {
     try {
          console.log('🗑️ Eliminando inventario:', id, 'userId:', userId);
          
          const response = await fetch(`${API_BASE_URL}/${id}?userId=${userId}`, {
               method: 'DELETE',
          });
          
          console.log('📡 Response status:', response.status);
          
          if (!response.ok) {
               const errorText = await response.text();
               console.error('❌ Error del backend:', errorText);
               throw new Error(errorText || 'Error al eliminar inventario');
          }
          
          const result = await response.text();
          console.log('✅ Inventario eliminado:', result);
          return result;
     } catch (error) {
          console.error('Error en deleteInventory:', error);
          throw error;
     }
};

export const startInventory = async (id, userId) => {
     try {
          const url = `${API_BASE_URL}/${id}/start?userId=${userId}`;
          console.log('📡 PUT:', url);

          const response = await fetch(url, {
               method: 'PUT',
          });

          console.log('📡 Response status:', response.status);

          if (!response.ok) {
               const errorText = await response.text();
               console.error('❌ Error response:', errorText);
               throw new Error(errorText || 'Error al iniciar inventario');
          }

          const data = await response.json();
          console.log('📦 Data recibida:', data);
          return data;
     } catch (error) {
          console.error('❌ Error en startInventory:', error);
          throw error;
     }
};

export const completeInventory = async (id, userId) => {
     try {
          const url = `${API_BASE_URL}/${id}/complete?userId=${userId}`;
          console.log('📡 PUT:', url);

          const response = await fetch(url, {
               method: 'PUT',
          });

          console.log('📡 Response status:', response.status);

          if (!response.ok) {
               const errorText = await response.text();
               console.error('❌ Error response:', errorText);
               throw new Error(errorText || 'Error al completar inventario');
          }

          const data = await response.json();
          console.log('📦 Data recibida:', data);
          return data;
     } catch (error) {
          console.error('❌ Error en completeInventory:', error);
          throw error;
     }
};

// ==================== DETALLES ====================

export const getDetailsByInventoryId = async (inventoryId) => {
     try {
          const response = await fetch(`${API_DETAILS_URL}/by-inventory/${inventoryId}`);
          if (!response.ok) throw new Error('Error al obtener detalles');
          return await response.json();
     } catch (error) {
          console.error('Error en getDetailsByInventoryId:', error);
          throw error;
     }
};

export const createDetail = async (data) => {
     try {
          const response = await fetch(API_DETAILS_URL, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(data),
          });
          if (!response.ok) throw new Error('Error al crear detalle');
          return await response.json();
     } catch (error) {
          console.error('Error en createDetail:', error);
          throw error;
     }
};

export const updateDetail = async (id, data) => {
     try {
          const response = await fetch(`${API_DETAILS_URL}/${id}`, {
               method: 'PUT',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(data),
          });
          if (!response.ok) throw new Error('Error al actualizar detalle');
          return await response.json();
     } catch (error) {
          console.error('Error en updateDetail:', error);
          throw error;
     }
};

export const deleteDetail = async (id) => {
     try {
          const response = await fetch(`${API_DETAILS_URL}/${id}`, {
               method: 'DELETE',
          });
          if (!response.ok) throw new Error('Error al eliminar detalle');
     } catch (error) {
          console.error('Error en deleteDetail:', error);
          throw error;
     }
};

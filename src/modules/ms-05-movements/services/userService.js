const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5005';

class UserService {
  // Obtener usuarios por municipio
  async getUsersByMunicipality(municipalityId) {
    try {
      console.log('Fetching users for municipality:', municipalityId);
      const response = await fetch(`${API_BASE_URL}/api/v1/users/municipality/${municipalityId}`);
      
      if (!response.ok) {
        console.log('Users API response not OK:', response.status, response.statusText);
        throw new Error(`Error fetching users: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Users API data received:', data);
      return data;
    } catch (error) {
      console.error('Error fetching users:', error);
      // Retornar datos mock si falla la API
      console.log('Using mock users data');
      return [
        { id: '48cc4cf0-699f-4001-8b14-e3f76f9210ae', firstName: 'Usuario', lastName: 'Demo' }
      ];
    }
  }
}

export default new UserService();
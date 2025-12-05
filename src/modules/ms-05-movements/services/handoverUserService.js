const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';
const USERS_ENDPOINT = '/api/v1/users';

class HandoverUserService {
  // Obtener todos los usuarios
  async getAllUsers() {
    try {
      console.log('Fetching users from:', `${API_BASE_URL}${USERS_ENDPOINT}`);
      
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}${USERS_ENDPOINT}`, {
        headers
      });
      
      if (!response.ok) {
        console.log('API response not OK:', response.status, response.statusText);
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Error fetching users: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Users data received:', data);
      
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Obtener usuario por ID
  async getUserById(id) {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}${USERS_ENDPOINT}/${id}`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching user: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  // Obtener usuarios activos
  async getActiveUsers() {
    try {
      const allUsers = await this.getAllUsers();
      return allUsers.filter(user => user.status === 'ACTIVE');
    } catch (error) {
      console.error('Error fetching active users:', error);
      throw error;
    }
  }

  // Obtener usuarios por municipio (filtra usuarios activos)
  async getUsersByMunicipality(municipalityId) {
    try {
      console.log('🔍 Fetching users for municipality:', municipalityId);
      const allUsers = await this.getAllUsers();
      console.log('📊 Total users received:', allUsers.length);
      console.log('📋 Sample user data:', allUsers[0]);
      
      // Filtrar usuarios activos y del municipio especificado
      const filteredUsers = allUsers.filter(user => {
        const isActive = user.status === 'ACTIVE';
        const matchesMunicipality = user.municipalCode === municipalityId;
        return isActive && matchesMunicipality;
      });
      
      // Mapear para incluir personId como id (el backend espera personId)
      const mappedUsers = filteredUsers.map(user => ({
        id: user.personId, // Usar personId en lugar de user.id
        userId: user.id, // Mantener el userId original por si se necesita
        username: user.username,
        personId: user.personId,
        status: user.status,
        municipalCode: user.municipalCode
      }));
      
      console.log('✅ Filtered users for municipality:', mappedUsers.length);
      console.log('👥 Mapped users:', mappedUsers.map(u => ({ personId: u.id, username: u.username })));
      return mappedUsers;
    } catch (error) {
      console.error('❌ Error fetching users by municipality:', error);
      return []; // Devolver array vacío en lugar de lanzar error
    }
  }
}

export default new HandoverUserService();

import API_BASE_URL from '../config/api';

class PersonService {
    constructor() {
        this.token = localStorage.getItem('accessToken');
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        this.token = localStorage.getItem('accessToken');
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                let errorMessage = `Error ${response.status}: ${response.statusText}`;

                try {
                    const errorData = await response.json();
                    console.error('Error del backend:', errorData);

                    // Intentar extraer el mensaje de error del backend
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    } else if (errorData.error) {
                        errorMessage = errorData.error;
                    } else if (errorData.detail) {
                        errorMessage = errorData.detail;
                    }
                } catch (parseError) {
                    // Si no se puede parsear el JSON, usar el texto de la respuesta
                    const errorText = await response.text().catch(() => '');
                    if (errorText) {
                        console.error('Error del backend (texto):', errorText);
                        errorMessage = errorText.substring(0, 200); // Limitar longitud
                    }
                }

                throw new Error(errorMessage);
            }

            // Si la respuesta es 204 No Content o está vacía, retornar objeto vacío
            if (response.status === 204 || response.headers.get('content-length') === '0') {
                return {};
            }

            // Intentar parsear JSON, si falla retornar objeto vacío
            const text = await response.text();
            return text ? JSON.parse(text) : {};
        } catch (error) {
            console.error('Person Service Error:', error);
            throw error;
        }
    }

    async getAllPersons() {
        return await this.request('/persons');
    }

    async getPersonById(personId) {
        return await this.request(`/persons/${personId}`);
    }

    async getPersonByDocument(documentTypeId, documentNumber) {
        return await this.request(`/persons/document/${documentTypeId}/${documentNumber}`);
    }

    async getPersonByEmail(email) {
        return await this.request(`/persons/email/${encodeURIComponent(email)}`);
    }

    async searchPersonsByName(name) {
        return await this.request(`/persons/search/name/${encodeURIComponent(name)}`);
    }

    async createPerson(personData) {
        return await this.request('/persons', {
            method: 'POST',
            body: JSON.stringify(personData),
        });
    }

    async updatePerson(personId, personData) {
        // Obtener el usuario actual del localStorage
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const updatedBy = currentUser?.userId || 'system';

        return await this.request(`/persons/${personId}?updatedBy=${updatedBy}`, {
            method: 'PUT',
            body: JSON.stringify(personData),
        });
    }

    async deletePerson(personId) {
        // Obtener el usuario actual del localStorage
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const updatedBy = currentUser?.userId || 'system';

        return await this.request(`/persons/${personId}?updatedBy=${updatedBy}`, {
            method: 'DELETE',
        });
    }

    async restorePerson(personId) {
        // Obtener el usuario actual del localStorage
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const updatedBy = currentUser?.userId || 'system';

        return await this.request(`/persons/${personId}/restore?updatedBy=${updatedBy}`, {
            method: 'PATCH',
        });
    }

    async getInactivePersons() {
        return await this.request('/persons/inactive');
    }

    async checkEmailExists(email) {
        return await this.request(`/persons/exists/email/${encodeURIComponent(email)}`);
    }

    async checkDocumentExists(documentTypeId, documentNumber) {
        return await this.request(`/persons/exists/document/${documentTypeId}/${documentNumber}`);
    }

    async getActivePersons() {
        return await this.request('/persons/active');
    }
}

const personService = new PersonService();
export default personService;

/**
 * Helper para gestionar el municipalityId
 * 
 * TODO: TEMPORAL - Esta implementaci??n usa localStorage con un UUID fijo
 * En el futuro, cuando el sistema sea multi-municipalidad:
 * 1. El backend de autenticaci??n debe retornar el municipalityId en el login
 * 2. Se debe agregar un selector de municipalidad para super-admins
 * 3. Se debe implementar un contexto global para gestionar la municipalidad activa
 */

const MUNICIPALITY_ID_KEY = 'municipalityId';
const DEFAULT_MUNICIPALITY_ID = '24ad12a5-d9e5-4cdd-91f1-8fd0355c9473';

/**
 * Obtiene el municipalityId actual
 * @returns {string} UUID del municipio
 */
export const getMunicipalityId = () => {
  const storedId = localStorage.getItem(MUNICIPALITY_ID_KEY);

  // Si no existe en localStorage, guardarlo
  if (!storedId) {
    localStorage.setItem(MUNICIPALITY_ID_KEY, DEFAULT_MUNICIPALITY_ID);
    console.warn('?????? municipalityId no encontrado, usando valor por defecto:', DEFAULT_MUNICIPALITY_ID);
    return DEFAULT_MUNICIPALITY_ID;
  }

  return storedId;
};

/**
 * Establece el municipalityId
 * @param {string} municipalityId - UUID del municipio
 */
export const setMunicipalityId = (municipalityId) => {
  if (!municipalityId) {
    throw new Error('municipalityId no puede estar vac??o');
  }

  localStorage.setItem(MUNICIPALITY_ID_KEY, municipalityId);
  console.info('??? municipalityId actualizado:', municipalityId);
};

/**
 * Limpia el municipalityId del localStorage
 */
export const clearMunicipalityId = () => {
  localStorage.removeItem(MUNICIPALITY_ID_KEY);
  console.info('??????? municipalityId eliminado');
};

/**
 * Inicializa el municipalityId si no existe
 * Debe llamarse al inicio de la aplicaci??n
 */
export const initializeMunicipalityId = () => {
  const currentId = localStorage.getItem(MUNICIPALITY_ID_KEY);

  if (!currentId) {
    localStorage.setItem(MUNICIPALITY_ID_KEY, DEFAULT_MUNICIPALITY_ID);
    console.info('??????? municipalityId inicializado:', DEFAULT_MUNICIPALITY_ID);
  } else {
    console.info('??????? municipalityId encontrado:', currentId);
  }
};

// Inicializar autom??ticamente al importar este m??dulo
initializeMunicipalityId();

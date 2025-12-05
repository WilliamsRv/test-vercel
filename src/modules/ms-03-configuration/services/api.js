const API_BASE_URL = '/api/v1/suppliers';

/**
 * Obtener todos los proveedores activos
 */
export const getProveedores = async () => {
  try {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
      throw new Error('Error al obtener proveedores');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getProveedores:', error);
    throw error;
  }
};

/**
 * Obtener proveedores inactivos
 */
export const getProveedoresInactivos = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/inactive`);
    if (!response.ok) {
      throw new Error('Error al obtener proveedores inactivos');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getProveedoresInactivos:', error);
    throw error;
  }
};

/**
 * Obtener un proveedor por ID
 */
export const getProveedorById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) {
      throw new Error('Error al obtener el proveedor');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getProveedorById:', error);
    throw error;
  }
};

/**
 * Crear un nuevo proveedor
 */
export const createProveedor = async (data) => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Error al crear el proveedor');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en createProveedor:', error);
    throw error;
  }
};

/**
 * Actualizar un proveedor
 */
export const updateProveedor = async (id, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Error al actualizar el proveedor');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en updateProveedor:', error);
    throw error;
  }
};

/**
 * Eliminar un proveedor (eliminación lógica)
 */
export const deleteProveedor = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Error al eliminar el proveedor');
    }
    
    // Verificar si la respuesta tiene contenido JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      // Si no hay JSON, devolver un objeto de éxito
      return { success: true, message: 'Proveedor eliminado correctamente' };
    }
  } catch (error) {
    console.error('Error en deleteProveedor:', error);
    throw error;
  }
};

/**
 * Restaurar un proveedor eliminado
 */
export const restaurarProveedor = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}/restore`, {
      method: 'PATCH',
    });
    if (!response.ok) {
      throw new Error('Error al restaurar el proveedor');
    }
    
    // Verificar si la respuesta tiene contenido JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      // Si no hay JSON, devolver un objeto de éxito
      return { success: true, message: 'Proveedor restaurado correctamente' };
    }
  } catch (error) {
    console.error('Error en restaurarProveedor:', error);
    throw error;
  }
};

/**
 * Obtener tipos de documento disponibles
 */
export const getTiposDocumento = async () => {
  try {
    const response = await fetch('/api/v1/document-types');
    if (!response.ok) {
      throw new Error('Error al obtener tipos de documento');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getTiposDocumento:', error);
    // Retornar tipos por defecto si falla
    return [
      { id: 1, name: 'RUC', description: 'Registro Único de Contribuyentes' },
      { id: 2, name: 'DNI', description: 'Documento Nacional de Identidad' },
      { id: 3, name: 'CE', description: 'Carnet de Extranjería' },
      { id: 4, name: 'Pasaporte', description: 'Pasaporte' },
    ];
  }
};

/**
 * Validar RUC peruano (11 dígitos)
 * @param {string} ruc - RUC a validar
 * @param {boolean} strict - Si true, valida dígito verificador. Si false, solo formato
 * @param {string} rucOriginal - RUC original para comparar (si es el mismo, no validar)
 */
export const validarRUC = (ruc, strict = true, rucOriginal = null) => {
  if (!ruc) return false;
  
  // Limpiar el RUC (solo números)
  const rucLimpio = ruc.replace(/\D/g, '');
  
  // Verificar que tenga 11 dígitos
  if (rucLimpio.length !== 11) return false;
  
  // Verificar que todos sean números
  if (!/^\d{11}$/.test(rucLimpio)) return false;
  
  // Si es el mismo RUC original, no validar estrictamente
  if (rucOriginal && rucLimpio === rucOriginal.replace(/\D/g, '')) {
    return true;
  }
  
  // Si no es validación estricta, solo verificar formato
  if (!strict) return true;
  
  // Algoritmo de validación RUC peruano
  const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const rucArray = rucLimpio.split('').map(Number);
  const digitoVerificador = rucArray[10];
  
  let suma = 0;
  for (let i = 0; i < 10; i++) {
    suma += rucArray[i] * multiplicadores[i];
  }
  
  const resto = suma % 11;
  const digitoCalculado = resto < 2 ? resto : 11 - resto;
  
  return digitoCalculado === digitoVerificador;
};

/**
 * Formatear RUC para mostrar
 */
export const formatearRUC = (ruc) => {
  if (!ruc) return '';
  const rucLimpio = ruc.replace(/\D/g, '');
  if (rucLimpio.length === 11) {
    return `${rucLimpio.slice(0, 2)}-${rucLimpio.slice(2, 9)}-${rucLimpio.slice(9)}`;
  }
  return ruc;
};

/**
 * Validar DNI peruano (8 dígitos)
 * @param {string} dni - DNI a validar
 */
export const validarDNI = (dni) => {
  if (!dni) return false;
  
  // Verificar que solo contenga números (sin limpiar)
  if (!/^\d+$/.test(dni)) return false;
  
  // Verificar que tenga exactamente 8 dígitos
  if (dni.length !== 8) return false;
  
  // Verificar que no sean todos ceros
  if (dni === '00000000') return false;
  
  return true;
};

/**
 * Obtener mensaje de error específico para DNI
 * @param {string} dni - DNI a validar
 */
export const obtenerErrorDNI = (dni) => {
  if (!dni) return 'DNI es requerido';
  
  // Verificar si contiene caracteres no numéricos
  if (!/^\d*$/.test(dni)) return 'DNI debe contener solo números';
  
  // Verificar longitud
  if (dni.length === 0) return 'DNI es requerido';
  if (dni.length < 8) return `DNI debe tener exactamente 8 dígitos (faltan ${8 - dni.length})`;
  if (dni.length > 8) return 'DNI debe tener exactamente 8 dígitos';
  
  // Verificar que no sean todos ceros
  if (dni === '00000000') return 'DNI inválido (no puede ser 00000000)';
  
  return 'DNI inválido';
};

/**
 * Obtener mensaje de error específico para RUC
 * @param {string} ruc - RUC a validar
 * @param {string} rucOriginal - RUC original para comparación
 */
export const obtenerErrorRUC = (ruc, rucOriginal = null) => {
  if (!ruc) return 'RUC es requerido';
  
  const rucLimpio = ruc.replace(/\D/g, '');
  
  // Verificar si contiene caracteres no numéricos (después de limpiar)
  if (rucLimpio.length !== ruc.replace(/\s/g, '').length) {
    return 'RUC debe contener solo números';
  }
  
  // Verificar longitud
  if (rucLimpio.length === 0) return 'RUC es requerido';
  if (rucLimpio.length < 11) return `RUC debe tener exactamente 11 dígitos (faltan ${11 - rucLimpio.length})`;
  if (rucLimpio.length > 11) return 'RUC debe tener exactamente 11 dígitos';
  
  // Si es el mismo RUC original, no validar dígito verificador
  if (rucOriginal && rucLimpio === rucOriginal.replace(/\D/g, '')) {
    return '';
  }
  
  // Validar dígito verificador
  if (!validarRUC(ruc, true, rucOriginal)) {
    return 'RUC inválido (dígito verificador incorrecto)';
  }
  
  return 'RUC inválido';
};

/**
 * Obtener mensaje de error específico para CE
 * @param {string} ce - CE a validar
 */
export const obtenerErrorCE = (ce) => {
  if (!ce) return 'CE es requerido';
  
  const ceLimpio = ce.replace(/\s/g, '').toUpperCase();
  
  // Verificar si contiene caracteres inválidos
  if (!/^[A-Z0-9]*$/.test(ceLimpio)) {
    return 'CE debe contener solo letras y números';
  }
  
  // Verificar longitud
  if (ceLimpio.length === 0) return 'CE es requerido';
  if (ceLimpio.length < 9) return `CE debe tener exactamente 9 caracteres (faltan ${9 - ceLimpio.length})`;
  if (ceLimpio.length > 9) return 'CE debe tener exactamente 9 caracteres';
  
  return 'CE inválido';
};

/**
 * Obtener mensaje de error específico para Pasaporte
 * @param {string} pasaporte - Pasaporte a validar
 */
export const obtenerErrorPasaporte = (pasaporte) => {
  if (!pasaporte) return 'Pasaporte es requerido';
  
  const pasaporteLimpio = pasaporte.replace(/\s/g, '').toUpperCase();
  
  // Verificar si contiene caracteres inválidos
  if (!/^[A-Z0-9]*$/.test(pasaporteLimpio)) {
    return 'Pasaporte debe contener solo letras y números';
  }
  
  // Verificar longitud
  if (pasaporteLimpio.length === 0) return 'Pasaporte es requerido';
  if (pasaporteLimpio.length < 6) return `Pasaporte debe tener entre 6 y 12 caracteres (mínimo ${6 - pasaporteLimpio.length} faltantes)`;
  if (pasaporteLimpio.length > 12) return 'Pasaporte debe tener máximo 12 caracteres';
  
  return 'Pasaporte inválido';
};

/**
 * Validar Carnet de Extranjería (9 caracteres alfanuméricos)
 * @param {string} ce - CE a validar
 */
export const validarCE = (ce) => {
  if (!ce) return false;
  const ceLimpio = ce.replace(/\s/g, '').toUpperCase();
  return /^[A-Z0-9]{9}$/.test(ceLimpio);
};

/**
 * Validar Pasaporte (6-12 caracteres alfanuméricos)
 * @param {string} pasaporte - Pasaporte a validar
 */
export const validarPasaporte = (pasaporte) => {
  if (!pasaporte) return false;
  const pasaporteLimpio = pasaporte.replace(/\s/g, '').toUpperCase();
  return /^[A-Z0-9]{6,12}$/.test(pasaporteLimpio);
};

/**
 * Validar documento según su tipo
 * @param {number} documentTypeId - ID del tipo de documento
 * @param {string} numeroDocumento - Número del documento
 * @param {string} documentoOriginal - Documento original para comparación
 */
export const validarDocumentoPorTipo = (documentTypeId, numeroDocumento, documentoOriginal = null) => {
  if (!numeroDocumento) return false;
  
  switch (documentTypeId) {
    case 1: // RUC
      return validarRUC(numeroDocumento, true, documentoOriginal);
    case 2: // DNI
      return validarDNI(numeroDocumento);
    case 3: // CE
      return validarCE(numeroDocumento);
    case 4: // Pasaporte
      return validarPasaporte(numeroDocumento);
    default:
      return true; // Para otros tipos, solo verificar que no esté vacío
  }
};

/**
 * Obtener mensaje de error específico según el tipo de documento
 * @param {number} documentTypeId - ID del tipo de documento
 * @param {string} numeroDocumento - Número del documento a validar
 * @param {string} documentoOriginal - Documento original para comparación
 * @returns {string} Mensaje de error específico
 */
export const obtenerErrorDocumentoPorTipo = (documentTypeId, numeroDocumento, documentoOriginal = null) => {
  if (!numeroDocumento) {
    const tipoDoc = documentTypeId === 1 ? 'RUC' : documentTypeId === 2 ? 'DNI' : documentTypeId === 3 ? 'CE' : 'Pasaporte';
    return `${tipoDoc} es requerido`;
  }
  
  switch (documentTypeId) {
    case 1: // RUC
      return obtenerErrorRUC(numeroDocumento, documentoOriginal);
    case 2: // DNI
      return obtenerErrorDNI(numeroDocumento);
    case 3: // CE
      return obtenerErrorCE(numeroDocumento);
    case 4: // Pasaporte
      return obtenerErrorPasaporte(numeroDocumento);
    default:
      return 'Documento inválido';
  }
};

/**
 * Validar teléfono móvil peruano (9 dígitos empezando con 9)
 * @param {string} telefono - Teléfono a validar
 */
export const validarTelefonoPeruano = (telefono) => {
  if (!telefono) return true; // Campo opcional
  
  // Limpiar el teléfono (quitar espacios, guiones, paréntesis)
  const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '');
  
  // Verificar si tiene código de país (+51)
  if (telefonoLimpio.startsWith('+51')) {
    const numeroSinCodigo = telefonoLimpio.substring(3);
    return /^9\d{8}$/.test(numeroSinCodigo);
  }
  
  // Verificar formato de 9 dígitos empezando con 9
  return /^9\d{8}$/.test(telefonoLimpio);
};

/**
 * Validar nombre comercial
 * @param {string} nombreComercial - Nombre comercial a validar
 */
export const validarNombreComercial = (nombreComercial) => {
  if (!nombreComercial) return true; // Campo opcional
  
  const nombreLimpio = nombreComercial.trim();
  
  // Mínimo 2 caracteres
  if (nombreLimpio.length < 2) return false;
  
  // No puede ser solo números
  if (/^\d+$/.test(nombreLimpio)) return false;
  
  // Debe tener al menos una palabra (letras)
  return /[a-zA-Z]/.test(nombreLimpio);
};

/**
 * Validar razón social
 * @param {string} razonSocial - Razón social a validar
 */
export const validarRazonSocial = (razonSocial) => {
  if (!razonSocial) return false;
  
  const razonLimpia = razonSocial.trim();
  
  // Entre 3 y 100 caracteres
  if (razonLimpia.length < 3 || razonLimpia.length > 100) {
    console.log('❌ Razón Social - Longitud inválida:', razonLimpia.length);
    return false;
  }
  
  // Solo letras, números, &, ., ,, (), -, espacios
  // No emojis ni comillas
  const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9&.,()\- ]+$/;
  const regexMatch = regex.test(razonLimpia);
  if (!regexMatch) {
    console.log('❌ Razón Social - Caracteres inválidos:', razonLimpia);
    return false;
  }
  
  // Verificar que tenga al menos una letra
  const tieneLetras = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(razonLimpia);
  if (!tieneLetras) {
    console.log('❌ Razón Social - No contiene letras');
    return false;
  }
  
  console.log('✅ Razón Social válida:', razonLimpia);
  return true;
};

/**
 * Validar contacto principal
 * @param {string} contacto - Contacto principal a validar
 */
export const validarContactoPrincipal = (contacto) => {
  if (!contacto) return true; // Campo opcional
  
  const contactoLimpio = contacto.trim();
  
  // Mínimo 3 caracteres
  if (contactoLimpio.length < 3) return false;
  
  // Solo letras y espacios
  return /^[a-zA-Z\s]+$/.test(contactoLimpio);
};

/**
 * Validar dirección
 * @param {string} direccion - Dirección a validar
 */
export const validarDireccion = (direccion) => {
  if (!direccion) return true; // Campo opcional
  
  const direccionLimpia = direccion.trim();
  
  // Entre 5 y 200 caracteres
  if (direccionLimpia.length < 5 || direccionLimpia.length > 200) return false;
  
  // Caracteres permitidos: letras, números, espacios, guiones, puntos, comas, #, /
  const regex = /^[a-zA-Z0-9\s\-.,#/]+$/;
  if (!regex.test(direccionLimpia)) return false;
  
  // Verificar que tenga al menos un número
  const tieneNumeros = /\d/.test(direccionLimpia);
  if (!tieneNumeros) return false;
  
  // Verificar que tenga al menos una letra
  const tieneLetras = /[a-zA-Z]/.test(direccionLimpia);
  if (!tieneLetras) return false;
  
  return true;
};

/**
 * Validar sitio web
 * @param {string} sitioWeb - Sitio web a validar
 */
export const validarSitioWeb = (sitioWeb) => {
  if (!sitioWeb) return true; // Campo opcional
  
  const sitioLimpio = sitioWeb.trim();
  
  // No puede ser solo números
  if (/^\d+$/.test(sitioLimpio)) return false;
  
  // Debe tener formato URL válido
  try {
    // Si no tiene protocolo, agregar https://
    const urlCompleta = sitioLimpio.startsWith('http') ? sitioLimpio : `https://${sitioLimpio}`;
    new URL(urlCompleta);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validar email según RFC 5322
 * @param {string} email - Email a validar
 */
export const validarEmail = (email) => {
  if (!email) return true; // Campo opcional
  
  const emailLimpio = email.trim();
  
  // Máximo 254 caracteres
  if (emailLimpio.length > 254) return false;
  
  // Verificar que tenga al menos un @
  if (!emailLimpio.includes('@')) return false;
  
  // Verificar que no empiece o termine con punto
  if (emailLimpio.startsWith('.') || emailLimpio.endsWith('.')) return false;
  
  // Verificar que no tenga puntos consecutivos
  if (emailLimpio.includes('..')) return false;
  
  // Dividir en usuario y dominio
  const partes = emailLimpio.split('@');
  if (partes.length !== 2) return false;
  
  const [usuario, dominio] = partes;
  
  // Validar usuario (parte antes del @)
  if (!usuario || usuario.length === 0) return false;
  if (usuario.length > 64) return false; // RFC 5321
  
  // Validar dominio (parte después del @)
  if (!dominio || dominio.length === 0) return false;
  if (dominio.length > 253) return false; // RFC 5321
  
  // El dominio debe tener al menos un punto
  if (!dominio.includes('.')) return false;
  
  // El dominio no puede empezar o terminar con punto o guión
  if (dominio.startsWith('.') || dominio.endsWith('.') || 
      dominio.startsWith('-') || dominio.endsWith('-')) return false;
  
  // Regex más estricto para usuario
  const regexUsuario = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
  if (!regexUsuario.test(usuario)) return false;
  
  // Regex para dominio (más estricto)
  const regexDominio = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!regexDominio.test(dominio)) return false;
  
  // Verificar que la extensión del dominio tenga al menos 2 caracteres
  const extensionDominio = dominio.split('.').pop();
  if (!extensionDominio || extensionDominio.length < 2) return false;
  
  return true;
};

/**
 * Obtener placeholder dinámico según tipo de documento
 * @param {number} documentTypeId - ID del tipo de documento
 */
export const obtenerPlaceholderDocumento = (documentTypeId) => {
  switch (documentTypeId) {
    case 1: // RUC
      return "20123456789";
    case 2: // DNI
      return "12345678";
    case 3: // CE
      return "CE1234567";
    case 4: // Pasaporte
      return "P123456";
    default:
      return "Número de documento";
  }
};
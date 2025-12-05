/**
 * Servicio de validación de Códigos SBN según normativa peruana
 * Sistema de Bienes Nacionales (SBN)
 */

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003/api'}`;

/**
 * Catálogo básico de códigos SBN válidos (ejemplo simplificado)
 * En producción, esto debería venir de la base de datos o API del SBN
 * Formato: código SBN de 8 dígitos
 */
const CATALOGO_SBN = {
  // EQUIPOS DE COMPUTO
  '64121001': { descripcion: 'Computadora de escritorio', categoria: 'EQUIPOS DE COMPUTO' },
  '64121002': { descripcion: 'Computadora portátil', categoria: 'EQUIPOS DE COMPUTO' },
  '64121003': { descripcion: 'Impresora láser', categoria: 'EQUIPOS DE COMPUTO' },
  '64121004': { descripcion: 'Impresora de inyección de tinta', categoria: 'EQUIPOS DE COMPUTO' },
  '64121005': { descripcion: 'Escáner', categoria: 'EQUIPOS DE COMPUTO' },
  '64121006': { descripcion: 'Monitor LCD/LED', categoria: 'EQUIPOS DE COMPUTO' },
  '64121007': { descripcion: 'Servidor', categoria: 'EQUIPOS DE COMPUTO' },
  '64121008': { descripcion: 'Tablet', categoria: 'EQUIPOS DE COMPUTO' },
  
  // MOBILIARIO
  '51111001': { descripcion: 'Escritorio de oficina', categoria: 'MOBILIARIO' },
  '51111002': { descripcion: 'Silla giratoria', categoria: 'MOBILIARIO' },
  '51111003': { descripcion: 'Archivador metálico', categoria: 'MOBILIARIO' },
  '51111004': { descripcion: 'Estante de madera', categoria: 'MOBILIARIO' },
  '51111005': { descripcion: 'Mesa de reuniones', categoria: 'MOBILIARIO' },
  '51111006': { descripcion: 'Silla fija', categoria: 'MOBILIARIO' },
  
  // VEHICULOS
  '33311001': { descripcion: 'Automóvil sedán', categoria: 'VEHICULOS' },
  '33311002': { descripcion: 'Camioneta pick-up', categoria: 'VEHICULOS' },
  '33311003': { descripcion: 'Motocicleta', categoria: 'VEHICULOS' },
  '33311004': { descripcion: 'Ómnibus', categoria: 'VEHICULOS' },
  
  // MAQUINARIA Y EQUIPO
  '65321001': { descripcion: 'Fotocopiadora', categoria: 'MAQUINARIA Y EQUIPO' },
  '65321002': { descripcion: 'Proyector multimedia', categoria: 'MAQUINARIA Y EQUIPO' },
  '65321003': { descripcion: 'Aire acondicionado', categoria: 'MAQUINARIA Y EQUIPO' },
  '65321004': { descripcion: 'Ventilador industrial', categoria: 'MAQUINARIA Y EQUIPO' },
};

/**
 * 1. Validar formato: exactamente 8 dígitos numéricos
 */
export const validarFormatoSBN = (codigo) => {
  if (!codigo) {
    return { valid: false, error: 'El código SBN es obligatorio' };
  }

  // Limpiar espacios y caracteres especiales
  const codigoLimpio = codigo.replace(/[^0-9]/g, '');

  // Debe tener exactamente 8 dígitos
  if (codigoLimpio.length !== 8) {
    return { 
      valid: false, 
      error: 'El código SBN debe tener exactamente 8 dígitos numéricos' 
    };
  }

  // Solo números, sin letras
  if (!/^\d{8}$/.test(codigoLimpio)) {
    return { 
      valid: false, 
      error: 'El código SBN solo puede contener números' 
    };
  }

  return { valid: true, codigo: codigoLimpio };
};

/**
 * 2. Validar existencia en catálogo oficial SBN
 */
export const validarExistenciaEnCatalogo = (codigo) => {
  const formatoValido = validarFormatoSBN(codigo);
  if (!formatoValido.valid) {
    return formatoValido;
  }

  const codigoLimpio = formatoValido.codigo;

  // Verificar si existe en el catálogo
  if (!CATALOGO_SBN[codigoLimpio]) {
    return {
      valid: false,
      error: 'El código SBN no existe en el Catálogo Nacional de Bienes Muebles del Estado',
      sugerencia: 'Verifique el código en el catálogo oficial del SBN'
    };
  }

  return {
    valid: true,
    codigo: codigoLimpio,
    descripcion: CATALOGO_SBN[codigoLimpio].descripcion,
    categoria: CATALOGO_SBN[codigoLimpio].categoria
  };
};

/**
 * 3. Validar no duplicidad (verificar en base de datos)
 * NOTA: Validación deshabilitada temporalmente hasta implementar endpoint en backend
 */
export const validarNoDuplicidad = async (codigoSBN, assetId = null) => {
  try {
    const formatoValido = validarFormatoSBN(codigoSBN);
    if (!formatoValido.valid) {
      return formatoValido;
    }

    const codigoLimpio = formatoValido.codigo;

    // ⚠️ VALIDACIÓN DE DUPLICADOS DESHABILITADA TEMPORALMENTE
    // TODO: Habilitar cuando el backend implemente el endpoint /api/assets/validate-sbn/{sbnCode}
    
    // Descomentar cuando el backend esté listo:
    /*
    const { validateSBNCode } = await import('./api');
    const data = await validateSBNCode(codigoLimpio, assetId);

    if (data.exists) {
      return {
        valid: false,
        error: `El código SBN ${codigoLimpio} ya está asignado al bien ${data.assetCode}`,
        assetCode: data.assetCode,
        description: data.description
      };
    }
    */

    // Por ahora, solo validar formato y existencia en catálogo
    return { 
      valid: true, 
      codigo: codigoLimpio,
      warning: '⚠️ Validación de duplicados deshabilitada - verifique manualmente'
    };
  } catch (error) {
    console.error('Error en validarNoDuplicidad:', error);
    return {
      valid: true,
      warning: 'No se pudo verificar la duplicidad del código SBN. Verifique manualmente.'
    };
  }
};

/**
 * 4. Validar correspondencia con tipo de bien
 */
export const validarCorrespondenciaConCategoria = (codigoSBN, categoriaDescripcion) => {
  const catalogoInfo = validarExistenciaEnCatalogo(codigoSBN);
  
  if (!catalogoInfo.valid) {
    return catalogoInfo;
  }

  // Comparar categoría del SBN con categoría del bien
  const categoriaSBN = catalogoInfo.categoria.toLowerCase();
  const categoriaActual = (categoriaDescripcion || '').toLowerCase();

  // Validación flexible: buscar palabras clave
  const palabrasClaveSBN = categoriaSBN.split(/\s+/);
  const coincide = palabrasClaveSBN.some(palabra => 
    categoriaActual.includes(palabra) || palabra.includes(categoriaActual)
  );

  if (!coincide && categoriaDescripcion) {
    return {
      valid: false,
      error: `El código SBN corresponde a "${catalogoInfo.descripcion}" (${catalogoInfo.categoria}), pero la categoría seleccionada es "${categoriaDescripcion}"`,
      sugerencia: 'Verifique que el código SBN corresponda al tipo de bien registrado'
    };
  }

  return { valid: true, ...catalogoInfo };
};

/**
 * 5. Validar estado del bien (solo bienes vigentes pueden tener SBN)
 */
export const validarEstadoBien = (estado) => {
  const estadosValidos = ['DISPONIBLE', 'EN_USO', 'MANTENIMIENTO', 'ALMACENADO'];
  
  if (!estadosValidos.includes(estado)) {
    return {
      valid: false,
      error: 'Solo los bienes vigentes (disponibles, en uso, en mantenimiento o almacenados) pueden tener código SBN asignado',
      sugerencia: 'Los bienes dados de baja, extraviados o transferidos no requieren código SBN'
    };
  }

  return { valid: true };
};

/**
 * 6. Validación completa del código SBN
 * Ejecuta todas las validaciones en secuencia
 */
export const validarCodigoSBNCompleto = async (codigoSBN, options = {}) => {
  const {
    assetId = null,
    categoriaDescripcion = null,
    estado = 'DISPONIBLE',
    skipDuplicateCheck = true  // ⚠️ DESHABILITADO por defecto hasta que el backend esté listo
  } = options;

  // 1. Validar formato
  const formatoValido = validarFormatoSBN(codigoSBN);
  if (!formatoValido.valid) {
    return formatoValido;
  }

  // 2. Validar existencia en catálogo
  const existeEnCatalogo = validarExistenciaEnCatalogo(formatoValido.codigo);
  if (!existeEnCatalogo.valid) {
    return existeEnCatalogo;
  }

  // 3. Validar estado del bien
  const estadoValido = validarEstadoBien(estado);
  if (!estadoValido.valid) {
    return estadoValido;
  }

  // 4. Validar correspondencia con categoría (si se proporciona)
  if (categoriaDescripcion) {
    const correspondenciaValida = validarCorrespondenciaConCategoria(formatoValido.codigo, categoriaDescripcion);
    if (!correspondenciaValida.valid) {
      return correspondenciaValida;
    }
  }

  // 5. Validar no duplicidad (si no se omite)
  if (!skipDuplicateCheck) {
    const noDuplicado = await validarNoDuplicidad(formatoValido.codigo, assetId);
    if (!noDuplicado.valid) {
      return noDuplicado;
    }
    // Propagar warning si existe
    if (noDuplicado.warning) {
      return {
        valid: true,
        warning: noDuplicado.warning,
        ...existeEnCatalogo
      };
    }
  }

  return {
    valid: true,
    codigo: formatoValido.codigo,
    descripcion: existeEnCatalogo.descripcion,
    categoria: existeEnCatalogo.categoria,
    message: 'Código SBN válido'
  };
};

/**
 * Obtener lista de códigos SBN disponibles por categoría
 */
export const obtenerCodigosSBNPorCategoria = (categoriaDescripcion) => {
  if (!categoriaDescripcion) {
    return Object.entries(CATALOGO_SBN).map(([codigo, info]) => ({
      codigo,
      ...info
    }));
  }

  const categoriaLower = categoriaDescripcion.toLowerCase();
  
  return Object.entries(CATALOGO_SBN)
    .filter(([_, info]) => {
      const categoriaSBN = info.categoria.toLowerCase();
      return categoriaSBN.includes(categoriaLower) || categoriaLower.includes(categoriaSBN);
    })
    .map(([codigo, info]) => ({
      codigo,
      ...info
    }));
};

/**
 * Formatear código SBN con separadores visuales (opcional)
 */
export const formatearCodigoSBN = (codigo) => {
  const codigoLimpio = codigo.replace(/[^0-9]/g, '');
  if (codigoLimpio.length === 8) {
    // Formato: 6412-1001 (ejemplo visual, no oficial)
    return `${codigoLimpio.slice(0, 4)}-${codigoLimpio.slice(4)}`;
  }
  return codigo;
};

export default {
  validarFormatoSBN,
  validarExistenciaEnCatalogo,
  validarNoDuplicidad,
  validarCorrespondenciaConCategoria,
  validarEstadoBien,
  validarCodigoSBNCompleto,
  obtenerCodigosSBNPorCategoria,
  formatearCodigoSBN,
  CATALOGO_SBN
};

import { movementsSupabase } from '../utils/movementsSupabaseClient';

/**
 * Servicio para manejar la subida de documentos de movimientos a Supabase Storage
 */

// Importar las variables directamente para logging y verificación
const movementsSupabaseUrl = import.meta.env.VITE_MOVEMENTS_SUPABASE_URL || '';
const movementsSupabaseAnonKey = import.meta.env.VITE_MOVEMENTS_SUPABASE_ANON_KEY || '';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB para movimientos

// Tipos de archivo permitidos para movimientos
const ALLOWED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
};

/**
 * Validar archivo para movimientos (permite hasta 10MB)
 */
const validateMovementFile = (file) => {
  // Validar tipo
  if (!ALLOWED_FILE_TYPES[file.type]) {
    return {
      valid: false,
      error: 'Tipo de archivo no permitido. Solo se permiten: PDF, DOC, DOCX, JPG, PNG, XLS, XLSX',
    };
  }

  // Validar tamaño (10MB para movimientos)
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'El archivo es muy grande. Tamaño máximo: 10MB',
    };
  }

  return { valid: true };
};

/**
 * Generar nombre único para el archivo de movimiento
 */
export const generateMovementFileName = (originalName, movementId = null) => {
  const timestamp = Date.now();
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const extension = sanitizedName.substring(sanitizedName.lastIndexOf('.'));
  const nameWithoutExt = sanitizedName.substring(0, sanitizedName.lastIndexOf('.'));
  
  const prefix = movementId ? `MV-${movementId}` : 'MV-TEMP';
  return `${prefix}_${timestamp}_${nameWithoutExt}${extension}`;
};

/**
 * Subir archivo de movimiento a Supabase Storage
 * @param {File} file - Archivo a subir
 * @param {string} movementId - ID del movimiento (opcional, puede ser null para nuevos movimientos)
 * @param {string} municipalityId - ID del municipio
 * @returns {Promise<{success: boolean, url?: string, fileName?: string, fileSize?: number, fileType?: string, error?: string}>}
 */
export const uploadMovementDocument = async (file, movementId = null, municipalityId = null) => {
  try {
    // Verificar que Supabase de movimientos esté configurado
    if (!movementsSupabase) {
      console.error('❌ Supabase client de movimientos no está inicializado');
      return { 
        success: false, 
        error: 'Error de configuración: Supabase de movimientos no está disponible. Verifique que las variables VITE_MOVEMENTS_SUPABASE_URL y VITE_MOVEMENTS_SUPABASE_ANON_KEY estén configuradas en el archivo .env' 
      };
    }

    // Validar archivo para movimientos (permite hasta 10MB)
    const validation = validateMovementFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generar nombre único
    const fileName = generateMovementFileName(file.name, movementId);
    const folder = movementId ? `movimientos/${municipalityId || 'default'}/${movementId}` : `movimientos/${municipalityId || 'default'}/temp`;
    const filePath = `${folder}/${fileName}`;

    console.log('📤 Intentando subir archivo a Supabase:', {
      fileName: file.name,
      filePath,
      fileSize: file.size,
      bucket: 'urls-sipreb',
      supabaseUrl: movementsSupabaseUrl,
      hasKey: !!movementsSupabaseAnonKey,
      keyLength: movementsSupabaseAnonKey?.length,
      keyPrefix: movementsSupabaseAnonKey?.substring(0, 30) + '...'
    });
    
    // Verificar que el cliente esté correctamente inicializado
    if (!movementsSupabase) {
      console.error('❌ movementsSupabase es null o undefined');
      return {
        success: false,
        error: 'Error: Cliente de Supabase no está inicializado. Verifique las variables de entorno.'
      };
    }
    
    console.log('✅ Cliente de Supabase inicializado correctamente');

    // Subir archivo a Supabase Storage (usando el cliente de movimientos)
    // Nota: Asegúrate de que el bucket 'urls-sipreb' esté marcado como público
    // y que las políticas estén aplicadas a 'anon' en Supabase
    const { data, error } = await movementsSupabase.storage
      .from('urls-sipreb')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
        // No incluir duplicados
      });

    if (error) {
      console.error('❌ Error al subir archivo de movimiento:', error);
      
      // Mensajes de error más descriptivos
      let errorMessage = error.message || 'Error desconocido al subir el archivo';
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
        errorMessage = 'Error de conexión: No se pudo conectar con el servidor de almacenamiento. Verifique su conexión a internet y que Supabase esté disponible.';
      } else if (error.message?.includes('new row violates row-level security')) {
        errorMessage = 'Error de permisos: No tiene permisos para subir archivos. Verifique que las policies de Supabase estén configuradas correctamente.';
      } else if (error.message?.includes('signature verification failed') || error.statusCode === 400) {
        // Decodificar el JWT para verificar que la clave corresponda al proyecto
        let keyInfo = 'No se pudo verificar';
        try {
          const keyParts = movementsSupabaseAnonKey.split('.');
          if (keyParts.length === 3) {
            const payload = JSON.parse(atob(keyParts[1]));
            keyInfo = `Proyecto: ${payload.ref || 'N/A'}, Rol: ${payload.role || 'N/A'}`;
          }
        } catch (e) {
          // Ignorar errores de decodificación
        }
        
        errorMessage = `Error de autenticación: La clave de Supabase no es válida o no corresponde al proyecto. Verifique que:\n1. La clave anon public en .env.development corresponda al proyecto ${movementsSupabaseUrl}\n2. La clave no sea la service_role (debe ser anon public)\n3. Reinicie el servidor después de cambiar las variables de entorno\n\nInfo de la clave: ${keyInfo}`;
      } else if (error.message?.includes('The resource already exists')) {
        errorMessage = 'El archivo ya existe. Intente con otro nombre.';
      }
      
      return { success: false, error: errorMessage };
    }

    if (!data) {
      console.error('❌ No se recibió data después de subir el archivo');
      return { 
        success: false, 
        error: 'Error: No se recibió confirmación del servidor después de subir el archivo.' 
      };
    }

    console.log('✅ Archivo subido exitosamente:', data);

    // Obtener URL pública (usando el cliente de movimientos)
    const { data: urlData } = movementsSupabase.storage
      .from('urls-sipreb')
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      console.error('❌ No se pudo obtener la URL pública del archivo');
      return { 
        success: false, 
        error: 'Error: El archivo se subió pero no se pudo obtener su URL pública.' 
      };
    }

    return {
      success: true,
      url: urlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      path: filePath,
    };
  } catch (error) {
    console.error('❌ Error en uploadMovementDocument:', error);
    
    // Manejar diferentes tipos de errores
    let errorMessage = 'Error al subir el archivo';
    
    if (error instanceof TypeError && error.message?.includes('Failed to fetch')) {
      errorMessage = 'Error de conexión: No se pudo conectar con el servidor. Verifique su conexión a internet.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage };
  }
};

/**
 * Subir múltiples archivos de movimiento
 * @param {File[]} files - Array de archivos a subir
 * @param {string} movementId - ID del movimiento (opcional)
 * @param {string} municipalityId - ID del municipio
 * @param {string} uploadedBy - ID del usuario que sube
 * @returns {Promise<Array>} - Array de objetos con información de archivos subidos
 */
export const uploadMultipleMovementDocuments = async (files, movementId = null, municipalityId = null, uploadedBy = null) => {
  const uploaded = [];
  const errors = [];
  
  for (const file of files) {
    try {
      const result = await uploadMovementDocument(file, movementId, municipalityId);
      
      if (result.success) {
        uploaded.push({
          fileName: result.fileName,
          fileUrl: result.url,
          fileType: result.fileType,
          fileSize: result.fileSize,
          uploadedAt: new Date().toISOString(),
          uploadedBy: uploadedBy || null,
        });
      } else {
        console.error(`❌ Error al subir archivo ${file.name}:`, result.error);
        errors.push({ fileName: file.name, error: result.error });
        // Continuar con los demás archivos aunque uno falle
      }
    } catch (error) {
      console.error(`❌ Excepción al subir archivo ${file.name}:`, error);
      errors.push({ fileName: file.name, error: error.message || 'Error desconocido' });
      // Continuar con los demás archivos aunque uno falle
    }
  }
  
  // Si hubo errores pero también archivos subidos exitosamente, loguear ambos
  if (errors.length > 0 && uploaded.length > 0) {
    console.warn(`⚠️ Se subieron ${uploaded.length} archivos exitosamente, pero ${errors.length} fallaron:`, errors);
  } else if (errors.length > 0 && uploaded.length === 0) {
    console.error(`❌ No se pudo subir ningún archivo. Errores:`, errors);
  }
  
  return uploaded;
};

/**
 * Preparar el array de documentos para enviar al API
 * @param {Array} uploadedFiles - Array de archivos subidos
 * @returns {string|undefined} - JSON string para attachedDocuments o undefined si no hay documentos
 */
export const prepareAttachedDocuments = (uploadedFiles) => {
  if (!uploadedFiles || uploadedFiles.length === 0) {
    return undefined;
  }
  
  return JSON.stringify(uploadedFiles);
};

/**
 * Parsear documentos adjuntos de un movimiento
 * Normaliza el formato para que siempre tenga fileUrl (compatible con url)
 * @param {string|Array} attachedDocuments - String JSON o Array de documentos
 * @returns {Array} - Array de objetos de documentos normalizados
 */
export const parseAttachedDocuments = (attachedDocuments) => {
  if (!attachedDocuments) {
    return [];
  }
  
  let documents = [];
  
  if (Array.isArray(attachedDocuments)) {
    documents = attachedDocuments;
  } else if (typeof attachedDocuments === 'string') {
    try {
      const parsed = JSON.parse(attachedDocuments);
      documents = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error parsing attachedDocuments:', error);
      return [];
    }
  } else {
    return [];
  }
  
  // Normalizar documentos: asegurar que siempre tengan fileUrl
  // Si tienen 'url' pero no 'fileUrl', copiar 'url' a 'fileUrl'
  return documents.map(doc => {
    const normalized = { ...doc };
    // Si tiene 'url' pero no 'fileUrl', usar 'url' como 'fileUrl'
    if (normalized.url && !normalized.fileUrl) {
      normalized.fileUrl = normalized.url;
    }
    // Si tiene 'fileUrl' pero no 'url', usar 'fileUrl' como 'url' (para compatibilidad)
    if (normalized.fileUrl && !normalized.url) {
      normalized.url = normalized.fileUrl;
    }
    return normalized;
  });
};

/**
 * Descargar archivo de movimiento de Supabase Storage
 * @param {string} fileUrl - URL pública del archivo
 * @param {string} fileName - Nombre del archivo para descargar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const downloadMovementDocument = async (fileUrl, fileName) => {
  try {
    if (!fileUrl) {
      return { success: false, error: 'URL del archivo no proporcionada' };
    }

    // Descargar el archivo usando fetch
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      throw new Error(`Error al descargar archivo: ${response.status} ${response.statusText}`);
    }

    // Convertir la respuesta a blob
    const blob = await response.blob();
    
    // Crear un enlace temporal para descargar
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'documento.pdf';
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error en downloadMovementDocument:', error);
    return { success: false, error: error.message || 'Error al descargar el archivo' };
  }
};

/**
 * Eliminar archivo de movimiento de Supabase Storage
 * @param {string} filePath - Path del archivo en el storage
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteMovementDocument = async (filePath) => {
  try {
    if (!movementsSupabase) {
      return { success: false, error: 'Supabase de movimientos no está configurado' };
    }
    
    const { error } = await movementsSupabase.storage
      .from('urls-sipreb')
      .remove([filePath]);

    if (error) {
      console.error('Error al eliminar archivo de movimiento:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error en deleteMovementDocument:', error);
    return { success: false, error: 'Error al eliminar el archivo' };
  }
};

/**
 * Obtener icono según tipo de archivo
 * @param {string} fileType - Tipo MIME del archivo
 * @returns {string} - Emoji del icono
 */
export const getFileIcon = (fileType) => {
  if (!fileType) return '📎';
  const type = fileType.toLowerCase();
  if (type.includes('pdf')) return '📄';
  if (type.includes('word') || type.includes('doc')) return '📝';
  if (type.includes('excel') || type.includes('spreadsheet') || type.includes('xls')) return '📊';
  if (type.includes('image')) return '🖼️';
  return '📎';
};

/**
 * Formatear tamaño de archivo
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} - Tamaño formateado (ej: "150.56 KB")
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};


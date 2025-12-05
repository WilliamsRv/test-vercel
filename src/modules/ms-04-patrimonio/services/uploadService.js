import { supabase } from '../../../shared/utils/supabaseClient';

/**
 * Servicio para manejar la subida de archivos a Supabase Storage
 */

// Tipos de archivo permitidos
const ALLOWED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Validar archivo antes de subir
 */
export const validateFile = (file) => {
  // Validar tipo
  if (!ALLOWED_FILE_TYPES[file.type]) {
    return {
      valid: false,
      error: 'Tipo de archivo no permitido. Solo se permiten: PDF, DOC, DOCX, JPG, PNG, WEBP',
    };
  }

  // Validar tamaño
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'El archivo es muy grande. Tamaño máximo: 5MB',
    };
  }

  return { valid: true };
};

/**
 * Generar nombre único para el archivo
 */
export const generateUniqueFileName = (originalName, assetCode) => {
  const timestamp = Date.now();
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const extension = sanitizedName.substring(sanitizedName.lastIndexOf('.'));
  const nameWithoutExt = sanitizedName.substring(0, sanitizedName.lastIndexOf('.'));
  
  return `${assetCode}_${timestamp}_${nameWithoutExt}${extension}`;
};

/**
 * Subir archivo a Supabase Storage
 * @param {File} file - Archivo a subir
 * @param {string} assetCode - Código del bien patrimonial
 * @param {function} onProgress - Callback para progreso (opcional)
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const uploadAssetDocument = async (file, assetCode, onProgress = null) => {
  try {
    // Validar archivo
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generar nombre único
    const fileName = generateUniqueFileName(file.name, assetCode);
    const filePath = `patrimonio/${assetCode}/${fileName}`;

    // Subir archivo a Supabase Storage
    const { data, error } = await supabase.storage
      .from('urls-sipreb')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error al subir archivo:', error);
      return { success: false, error: error.message };
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('urls-sipreb')
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      path: filePath,
    };
  } catch (error) {
    console.error('Error en uploadAssetDocument:', error);
    return { success: false, error: 'Error al subir el archivo' };
  }
};

/**
 * Eliminar archivo de Supabase Storage
 * @param {string} filePath - Path del archivo en el storage
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteAssetDocument = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from('urls-sipreb')
      .remove([filePath]);

    if (error) {
      console.error('Error al eliminar archivo:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error en deleteAssetDocument:', error);
    return { success: false, error: 'Error al eliminar el archivo' };
  }
};

/**
 * Descargar archivo
 * @param {string} filePath - Path del archivo en el storage
 * @returns {Promise<{success: boolean, blob?: Blob, error?: string}>}
 */
export const downloadAssetDocument = async (filePath) => {
  try {
    const { data, error } = await supabase.storage
      .from('urls-sipreb')
      .download(filePath);

    if (error) {
      console.error('Error al descargar archivo:', error);
      return { success: false, error: error.message };
    }

    return { success: true, blob: data };
  } catch (error) {
    console.error('Error en downloadAssetDocument:', error);
    return { success: false, error: 'Error al descargar el archivo' };
  }
};

/**
 * Obtener icono según tipo de archivo
 */
export const getFileIcon = (fileType) => {
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word') || fileType.includes('doc')) return '📝';
  if (fileType.includes('image')) return '🖼️';
  return '📎';
};

/**
 * Formatear tamaño de archivo
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

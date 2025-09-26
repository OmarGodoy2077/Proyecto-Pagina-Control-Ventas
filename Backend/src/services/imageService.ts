/**
 * Servicio simulado de almacenamiento de imágenes
 * En el futuro se integrará con Cloudinary
 */

import { SaleImageType } from '../models/Sale';

/**
 * Resultado de subida de imagen
 */
export interface ImageUploadResult {
  imageUrl: string;
  publicId: string;
  fileSize: number;
  width?: number;
  height?: number;
}

/**
 * Configuración de subida de imagen
 */
export interface ImageUploadConfig {
  maxFileSize: number; // en bytes
  allowedFormats: string[];
  transformations?: {
    width?: number;
    height?: number;
    quality?: number;
    crop?: 'fill' | 'fit' | 'scale';
  };
}

/**
 * Configuración por defecto para subida de imágenes
 */
export const defaultUploadConfig: ImageUploadConfig = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
  transformations: {
    width: 1920,
    height: 1080,
    quality: 80,
    crop: 'fit'
  }
};

/**
 * Configuraciones específicas por tipo de imagen
 */
export const imageTypeConfigs: Record<SaleImageType, Partial<ImageUploadConfig>> = {
  sealed: {
    transformations: {
      width: 800,
      height: 600,
      quality: 90
    }
  },
  full_product: {
    transformations: {
      width: 1200,
      height: 900,
      quality: 85
    }
  },
  serial_number: {
    transformations: {
      width: 1920,
      height: 1080,
      quality: 95 // Alta calidad para OCR
    }
  }
};

/**
 * Simula la subida de una imagen a Cloudinary
 * @param imageBuffer - Buffer de la imagen
 * @param fileName - Nombre del archivo
 * @param imageType - Tipo de imagen (sealed, full_product, serial_number)
 * @returns Resultado de la subida simulada
 */
export const uploadImage = async (
  imageBuffer: Buffer,
  fileName: string,
  imageType: SaleImageType
): Promise<ImageUploadResult> => {
  // Simular tiempo de subida
  await new Promise(resolve => setTimeout(resolve, 500));

  // Validar tamaño de archivo
  const config = { ...defaultUploadConfig, ...imageTypeConfigs[imageType] };
  if (imageBuffer.length > config.maxFileSize) {
    throw new Error(`Archivo demasiado grande. Máximo: ${formatFileSize(config.maxFileSize)}`);
  }

  // Generar ID público único
  const timestamp = Date.now();
  const publicId = `sales-system/${imageType}/${timestamp}-${fileName.replace(/\.[^/.]+$/, '')}`;

  // Simular URL de Cloudinary
  const baseUrl = 'https://res.cloudinary.com/sales-system/image/upload';
  let transformationUrl = '';

  if (config.transformations) {
    const { width, height, quality, crop } = config.transformations;
    const transformations = [];
    
    if (width && height) {
      transformations.push(`w_${width},h_${height}`);
    }
    if (crop) {
      transformations.push(`c_${crop}`);
    }
    if (quality) {
      transformations.push(`q_${quality}`);
    }
    
    if (transformations.length > 0) {
      transformationUrl = transformations.join(',') + '/';
    }
  }

  const imageUrl = `${baseUrl}/${transformationUrl}${publicId}.jpg`;

  // Simular dimensiones basadas en las transformaciones
  const result: ImageUploadResult = {
    imageUrl,
    publicId,
    fileSize: imageBuffer.length,
    width: config.transformations?.width || 1920,
    height: config.transformations?.height || 1080
  };

  return result;
};

/**
 * Simula la eliminación de una imagen de Cloudinary
 * @param publicId - ID público de la imagen a eliminar
 * @returns True si se eliminó correctamente
 */
export const deleteImage = async (publicId: string): Promise<boolean> => {
  // Simular tiempo de eliminación
  await new Promise(resolve => setTimeout(resolve, 300));
  
  console.log(`[SIMULATED] Imagen eliminada: ${publicId}`);
  return true;
};

/**
 * Valida el formato de un archivo de imagen
 * @param fileName - Nombre del archivo
 * @param allowedFormats - Formatos permitidos
 * @returns True si el formato es válido
 */
export const validateImageFormat = (
  fileName: string, 
  allowedFormats: string[] = defaultUploadConfig.allowedFormats
): boolean => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? allowedFormats.includes(extension) : false;
};

/**
 * Obtiene el tipo MIME basado en la extensión del archivo
 * @param fileName - Nombre del archivo
 * @returns Tipo MIME
 */
export const getMimeType = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
};

/**
 * Formatea el tamaño de archivo en formato legible
 * @param bytes - Tamaño en bytes
 * @returns Tamaño formateado
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Configuración futura para integración real con Cloudinary
 */
export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
  secure: boolean;
}

/**
 * Función placeholder para cuando se integre Cloudinary real
 * @param imageBuffer - Buffer de la imagen
 * @param options - Opciones de Cloudinary
 * @returns Resultado de Cloudinary
 */
export const uploadToCloudinaryReal = async (
  imageBuffer: Buffer,
  options: any
): Promise<any> => {
  // TODO: Implementar integración real con Cloudinary
  
  throw new Error('Cloudinary real no implementado aún. Use uploadImage para simulación.');
};
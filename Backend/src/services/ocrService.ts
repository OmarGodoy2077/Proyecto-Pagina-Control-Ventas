/**
 * Servicio simulado de OCR para extracción de números de serie
 * En el futuro se integrará con Tesseract.js o Google Vision API
 */

import { SerialExtractionResponse } from '../models/Sale';

/**
 * Simula la extracción de número de serie desde una imagen
 * @param imageBuffer - Buffer de la imagen
 * @param fileName - Nombre del archivo
 * @returns Respuesta con el número de serie extraído (simulado)
 */
export const extractSerialFromImage = async (
  imageBuffer: Buffer,
  fileName: string
): Promise<SerialExtractionResponse> => {
  // Simular tiempo de procesamiento
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Generar número de serie simulado basado en el nombre del archivo y timestamp
  const timestamp = Date.now().toString();
  const fileHash = fileName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const simulatedSerial = `${fileHash.substring(0, 3)}${timestamp.slice(-6)}${generateRandomLetters(3)}`;

  // Simular URL de imagen almacenada (en el futuro será Cloudinary)
  const imageUrl = `https://cloudinary.com/sales-system/images/${timestamp}-${fileName}`;

  // Simular confianza del OCR (entre 0.7 y 0.95)
  const confidence = Math.random() * 0.25 + 0.7;

  return {
    extractedSerial: simulatedSerial,
    imageUrl: imageUrl,
    confidence: Math.round(confidence * 100) / 100
  };
};

/**
 * Valida si un número de serie extraído es válido
 * @param serialNumber - Número de serie a validar
 * @returns True si el formato es válido
 */
export const validateSerialNumber = (serialNumber: string): boolean => {
  if (!serialNumber || serialNumber.length < 6) {
    return false;
  }

  // Validar que contiene al menos letras y números
  const hasLetters = /[A-Za-z]/.test(serialNumber);
  const hasNumbers = /[0-9]/.test(serialNumber);

  return hasLetters && hasNumbers;
};

/**
 * Limpia y normaliza un número de serie
 * @param serialNumber - Número de serie a limpiar
 * @returns Número de serie limpio
 */
export const cleanSerialNumber = (serialNumber: string): string => {
  return serialNumber
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim();
};

/**
 * Genera letras aleatorias para el número de serie simulado
 * @param length - Longitud de la cadena
 * @returns Cadena de letras aleatorias
 */
const generateRandomLetters = (length: number): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  return result;
};

/**
 * Configuración futura para integración con servicios reales de OCR
 */
export interface OCRConfig {
  provider: 'tesseract' | 'google-vision' | 'aws-textract';
  apiKey?: string;
  confidence_threshold: number;
  preprocessing: {
    resize: boolean;
    denoise: boolean;
    contrast_enhancement: boolean;
  };
}

/**
 * Configuración por defecto para OCR
 */
export const defaultOCRConfig: OCRConfig = {
  provider: 'tesseract',
  confidence_threshold: 0.7,
  preprocessing: {
    resize: true,
    denoise: true,
    contrast_enhancement: true
  }
};

/**
 * Función placeholder para cuando se integre OCR real
 * @param imageBuffer - Buffer de la imagen
 * @param config - Configuración de OCR
 * @returns Texto extraído de la imagen
 */
export const performRealOCR = async (
  imageBuffer: Buffer,
  config: OCRConfig = defaultOCRConfig
): Promise<{ text: string; confidence: number }> => {
  // TODO: Implementar integración real con Tesseract.js o Google Vision
  
  throw new Error('OCR real no implementado aún. Use extractSerialFromImage para simulación.');
};
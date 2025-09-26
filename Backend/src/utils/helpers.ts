import { v4 as uuidv4 } from 'uuid';

/**
 * Genera un UUID v4
 * @returns UUID string
 */
export const generateUUID = (): string => {
  return uuidv4();
};

/**
 * Valida si un string es un UUID válido
 * @param uuid - String a validar
 * @returns True si es un UUID válido
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Sanitiza una cadena de texto eliminando caracteres peligrosos
 * @param input - Cadena a sanitizar
 * @returns Cadena sanitizada
 */
export const sanitizeString = (input: string): string => {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Elimina caracteres HTML básicos
    .replace(/javascript:/gi, '') // Elimina javascript:
    .replace(/on\w+=/gi, ''); // Elimina eventos onclick, onload, etc.
};

/**
 * Capitaliza la primera letra de cada palabra
 * @param str - String a capitalizar
 * @returns String capitalizado
 */
export const capitalizeWords = (str: string): string => {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Genera un SKU único basado en el nombre del producto
 * @param productName - Nombre del producto
 * @param timestamp - Timestamp opcional
 * @returns SKU generado
 */
export const generateSKU = (productName: string, timestamp?: number): string => {
  const cleanName = productName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 6);
    
  const time = timestamp || Date.now();
  const suffix = time.toString().slice(-6);
  
  return `${cleanName}-${suffix}`;
};

/**
 * Formatea un número como moneda
 * @param amount - Cantidad a formatear
 * @param currency - Código de moneda (por defecto 'EUR')
 * @param locale - Localización (por defecto 'es-ES')
 * @returns Cantidad formateada
 */
export const formatCurrency = (
  amount: number, 
  currency: string = 'EUR', 
  locale: string = 'es-ES'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Formatea un número con separadores de miles
 * @param number - Número a formatear
 * @param locale - Localización (por defecto 'es-ES')
 * @returns Número formateado
 */
export const formatNumber = (number: number, locale: string = 'es-ES'): string => {
  return new Intl.NumberFormat(locale).format(number);
};

/**
 * Genera una cadena aleatoria
 * @param length - Longitud de la cadena
 * @param charset - Conjunto de caracteres a usar
 * @returns Cadena aleatoria
 */
export const generateRandomString = (
  length: number, 
  charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};

/**
 * Valida si un email tiene un formato válido
 * @param email - Email a validar
 * @returns True si el email es válido
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida si un número de teléfono tiene un formato válido (español)
 * @param phone - Teléfono a validar
 * @returns True si el teléfono es válido
 */
export const isValidPhone = (phone: string): boolean => {
  // Acepta formatos: +34 XXX XXX XXX, 9XX XXX XXX, 6XX XXX XXX
  const phoneRegex = /^(\+34|0034|34)?[6789]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Trunca un texto a una longitud específica
 * @param text - Texto a truncar
 * @param maxLength - Longitud máxima
 * @param suffix - Sufijo a añadir (por defecto '...')
 * @returns Texto truncado
 */
export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Convierte bytes a formato legible
 * @param bytes - Número de bytes
 * @param decimals - Número de decimales (por defecto 2)
 * @returns Tamaño formateado
 */
export const formatFileSize = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};
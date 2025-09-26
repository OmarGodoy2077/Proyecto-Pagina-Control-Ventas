/**
 * Utilidades para manejo de fechas y garantías
 */

/**
 * Calcula la fecha de finalización de garantía
 * @param startDate - Fecha de inicio de la garantía
 * @param months - Meses de garantía
 * @returns Fecha de finalización de la garantía
 */
export const calculateWarrantyEnd = (startDate: Date, months: number): Date => {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + months);
  return endDate;
};

/**
 * Verifica si una garantía está próxima a vencer
 * @param warrantyEnd - Fecha de fin de garantía
 * @param daysThreshold - Días de anticipación (por defecto 30)
 * @returns True si la garantía vence pronto
 */
export const isWarrantyExpiringSoon = (warrantyEnd: Date, daysThreshold: number = 30): boolean => {
  const now = new Date();
  const diffTime = warrantyEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays <= daysThreshold && diffDays > 0;
};

/**
 * Calcula los días restantes hasta el vencimiento de la garantía
 * @param warrantyEnd - Fecha de fin de garantía
 * @returns Número de días restantes (negativo si ya venció)
 */
export const getDaysUntilWarrantyExpiry = (warrantyEnd: Date): number => {
  const now = new Date();
  const diffTime = warrantyEnd.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Formatea una fecha para display
 * @param date - Fecha a formatear
 * @param locale - Localización (por defecto 'es-ES')
 * @returns Fecha formateada
 */
export const formatDate = (date: Date, locale: string = 'es-ES'): string => {
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formatea una fecha y hora para display
 * @param date - Fecha a formatear
 * @param locale - Localización (por defecto 'es-ES')
 * @returns Fecha y hora formateadas
 */
export const formatDateTime = (date: Date, locale: string = 'es-ES'): string => {
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Convierte una fecha a formato ISO string para la base de datos
 * @param date - Fecha a convertir
 * @returns Fecha en formato ISO string
 */
export const toISOString = (date: Date): string => {
  return date.toISOString();
};

/**
 * Obtiene el inicio del día para una fecha
 * @param date - Fecha de referencia
 * @returns Fecha con hora 00:00:00
 */
export const getStartOfDay = (date: Date): Date => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

/**
 * Obtiene el final del día para una fecha
 * @param date - Fecha de referencia
 * @returns Fecha con hora 23:59:59.999
 */
export const getEndOfDay = (date: Date): Date => {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
};

/**
 * Obtiene el rango de fechas para el mes actual
 * @returns Objeto con start y end del mes actual
 */
export const getCurrentMonthRange = (): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    start: getStartOfDay(start),
    end: getEndOfDay(end)
  };
};

/**
 * Obtiene el rango de fechas para el año actual
 * @returns Objeto con start y end del año actual
 */
export const getCurrentYearRange = (): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear(), 11, 31);
  
  return {
    start: getStartOfDay(start),
    end: getEndOfDay(end)
  };
};

/**
 * Valida si una fecha está en el pasado
 * @param date - Fecha a validar
 * @returns True si la fecha está en el pasado
 */
export const isDateInPast = (date: Date): boolean => {
  const now = new Date();
  return date < now;
};

/**
 * Valida si una fecha está en el futuro
 * @param date - Fecha a validar
 * @returns True si la fecha está en el futuro
 */
export const isDateInFuture = (date: Date): boolean => {
  const now = new Date();
  return date > now;
};
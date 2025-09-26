/**
 * Servicio para cálculo de garantías y fechas relacionadas
 */

import { calculateWarrantyEnd, isWarrantyExpiringSoon, getDaysUntilWarrantyExpiry } from '../utils/date';
import { ExpiringWarranty } from '../models/Sale';
import { query } from '../database/connection';

/**
 * Calcula las fechas de garantía para una venta
 * @param saleDate - Fecha de la venta
 * @param warrantyPeriodMonths - Período de garantía en meses
 * @returns Fechas de inicio y fin de garantía
 */
export const calculateWarrantyDates = (
  saleDate: Date,
  warrantyPeriodMonths: number
): { warrantyStart: Date; warrantyEnd: Date } => {
  const warrantyStart = new Date(saleDate);
  const warrantyEnd = calculateWarrantyEnd(warrantyStart, warrantyPeriodMonths);

  return {
    warrantyStart,
    warrantyEnd
  };
};

/**
 * Obtiene todas las garantías que vencen en los próximos días
 * @param daysThreshold - Días de anticipación (por defecto 30)
 * @returns Lista de garantías próximas a vencer
 */
export const getExpiringWarranties = async (daysThreshold: number = 30): Promise<ExpiringWarranty[]> => {
  const currentDate = new Date();
  const thresholdDate = new Date();
  thresholdDate.setDate(currentDate.getDate() + daysThreshold);

  const queryText = `
    SELECT 
      s.id as sale_id,
      CONCAT(c.first_name, ' ', c.last_name) as customer_name,
      c.email as customer_email,
      p.name as product_name,
      s.warranty_end,
      (s.warranty_end - CURRENT_DATE) as days_until_expiry
    FROM sales s
    INNER JOIN customers c ON s.customer_id = c.id
    INNER JOIN products p ON s.product_id = p.id
    WHERE s.warranty_end BETWEEN CURRENT_DATE AND $1
    AND s.warranty_end >= CURRENT_DATE
    ORDER BY s.warranty_end ASC
  `;

  try {
    const result = await query(queryText, [thresholdDate.toISOString().split('T')[0]]);
    
    return result.rows.map((row: any) => ({
      sale_id: row.sale_id,
      customer_name: row.customer_name,
      customer_email: row.customer_email,
      product_name: row.product_name,
      warranty_end: new Date(row.warranty_end),
      days_until_expiry: parseInt(row.days_until_expiry, 10)
    }));
  } catch (error) {
    console.error('Error obteniendo garantías próximas a vencer:', error);
    throw new Error('Error al consultar garantías próximas a vencer');
  }
};

/**
 * Verifica el estado de garantía de una venta específica
 * @param saleId - ID de la venta
 * @returns Estado de la garantía
 */
export const checkWarrantyStatus = async (saleId: string): Promise<{
  isActive: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiry: number;
  warrantyEnd: Date;
}> => {
  const queryText = `
    SELECT warranty_end
    FROM sales
    WHERE id = $1
  `;

  try {
    const result = await query(queryText, [saleId]);
    
    if (result.rows.length === 0) {
      throw new Error('Venta no encontrada');
    }

    const warrantyEnd = new Date(result.rows[0].warranty_end);
    const daysUntilExpiry = getDaysUntilWarrantyExpiry(warrantyEnd);
    const isActive = daysUntilExpiry > 0;
    const isExpiringSoon = isWarrantyExpiringSoon(warrantyEnd);

    return {
      isActive,
      isExpiringSoon,
      daysUntilExpiry,
      warrantyEnd
    };
  } catch (error) {
    console.error('Error verificando estado de garantía:', error);
    throw new Error('Error al verificar estado de garantía');
  }
};

/**
 * Obtiene estadísticas de garantías
 * @returns Estadísticas de garantías del sistema
 */
export const getWarrantyStatistics = async (): Promise<{
  totalActiveWarranties: number;
  expiringSoonCount: number;
  expiredCount: number;
  averageWarrantyPeriod: number;
}> => {
  const queryText = `
    SELECT 
      COUNT(CASE WHEN warranty_end > CURRENT_DATE THEN 1 END) as active_warranties,
      COUNT(CASE WHEN warranty_end BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as expiring_soon,
      COUNT(CASE WHEN warranty_end < CURRENT_DATE THEN 1 END) as expired,
      AVG(warranty_period_months) as avg_warranty_period
    FROM sales
  `;

  try {
    const result = await query(queryText);
    const row = result.rows[0];

    return {
      totalActiveWarranties: parseInt(row.active_warranties, 10) || 0,
      expiringSoonCount: parseInt(row.expiring_soon, 10) || 0,
      expiredCount: parseInt(row.expired, 10) || 0,
      averageWarrantyPeriod: parseFloat(row.avg_warranty_period) || 0
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de garantías:', error);
    throw new Error('Error al obtener estadísticas de garantías');
  }
};

/**
 * Obtiene el historial de garantías de un cliente
 * @param customerId - ID del cliente
 * @returns Lista de garantías del cliente
 */
export const getCustomerWarranties = async (customerId: string): Promise<{
  active: ExpiringWarranty[];
  expired: ExpiringWarranty[];
}> => {
  const queryText = `
    SELECT 
      s.id as sale_id,
      CONCAT(c.first_name, ' ', c.last_name) as customer_name,
      c.email as customer_email,
      p.name as product_name,
      s.warranty_end,
      (s.warranty_end - CURRENT_DATE) as days_until_expiry,
      CASE WHEN s.warranty_end > CURRENT_DATE THEN 'active' ELSE 'expired' END as status
    FROM sales s
    INNER JOIN customers c ON s.customer_id = c.id
    INNER JOIN products p ON s.product_id = p.id
    WHERE c.id = $1
    ORDER BY s.warranty_end DESC
  `;

  try {
    const result = await query(queryText, [customerId]);
    
    const warranties = result.rows.map((row: any) => ({
      sale_id: row.sale_id,
      customer_name: row.customer_name,
      customer_email: row.customer_email,
      product_name: row.product_name,
      warranty_end: new Date(row.warranty_end),
      days_until_expiry: parseInt(row.days_until_expiry, 10)
    }));

    const active = warranties.filter(w => w.days_until_expiry > 0);
    const expired = warranties.filter(w => w.days_until_expiry <= 0);

    return { active, expired };
  } catch (error) {
    console.error('Error obteniendo garantías del cliente:', error);
    throw new Error('Error al obtener garantías del cliente');
  }
};

/**
 * Extiende el período de garantía de una venta
 * @param saleId - ID de la venta
 * @param additionalMonths - Meses adicionales de garantía
 * @returns Nueva fecha de fin de garantía
 */
export const extendWarranty = async (saleId: string, additionalMonths: number): Promise<Date> => {
  const queryText = `
    UPDATE sales 
    SET 
      warranty_end = warranty_end + INTERVAL '${additionalMonths} months',
      warranty_period_months = warranty_period_months + $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING warranty_end
  `;

  try {
    const result = await query(queryText, [saleId, additionalMonths]);
    
    if (result.rows.length === 0) {
      throw new Error('Venta no encontrada');
    }

    return new Date(result.rows[0].warranty_end);
  } catch (error) {
    console.error('Error extendiendo garantía:', error);
    throw new Error('Error al extender garantía');
  }
};
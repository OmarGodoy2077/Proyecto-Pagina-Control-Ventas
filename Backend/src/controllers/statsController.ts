import { Request, Response } from 'express';
import { query } from '../database/connection';
import { getExpiringWarranties, getWarrantyStatistics, checkWarrantyStatus } from '../services/warrantyService';
import { NotFoundError } from '../middleware/errorHandler';

/**
 * Controlador de estadísticas y garantías
 * Maneja endpoints de reporting y análisis
 */

/**
 * @route GET /api/stats/dashboard
 * @desc Obtiene estadísticas generales del dashboard
 * @access Private
 */
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.userRole;

    // Estadísticas generales
    const generalStatsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM sales) as total_sales,
        (SELECT COUNT(*) FROM products WHERE is_active = true) as active_products,
        (SELECT COUNT(*) FROM customers) as total_customers,
        (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
        (SELECT SUM(total_price) FROM sales) as total_revenue,
        (SELECT AVG(total_price) FROM sales) as average_sale_value
    `;

    const generalStats = await query(generalStatsQuery);
    const stats = generalStats.rows[0];

    // Estadísticas por período (este mes)
    const monthlyStatsQuery = `
      SELECT 
        COUNT(*) as monthly_sales,
        SUM(total_price) as monthly_revenue,
        AVG(total_price) as monthly_avg_sale
      FROM sales
      WHERE EXTRACT(MONTH FROM sale_date) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM sale_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    `;

    const monthlyStats = await query(monthlyStatsQuery);
    const monthStats = monthlyStats.rows[0];

    // Productos con stock bajo
    const lowStockQuery = `
      SELECT COUNT(*) as low_stock_count
      FROM products
      WHERE stock <= 10 AND is_active = true
    `;

    const lowStockResult = await query(lowStockQuery);
    const lowStockCount = parseInt(lowStockResult.rows[0].low_stock_count, 10);

    // Estadísticas de garantías
    const warrantyStats = await getWarrantyStatistics();

    // Ventas del vendedor si no es admin
    let sellerStats = null;
    if (userRole !== 'admin' && userId) {
      const sellerStatsQuery = `
        SELECT 
          COUNT(*) as my_sales,
          SUM(total_price) as my_revenue,
          AVG(total_price) as my_avg_sale
        FROM sales
        WHERE seller_id = $1
      `;

      const sellerResult = await query(sellerStatsQuery, [userId]);
      sellerStats = sellerResult.rows[0];
    }

    res.json({
      success: true,
      data: {
        general: {
          total_sales: parseInt(stats.total_sales, 10) || 0,
          active_products: parseInt(stats.active_products, 10) || 0,
          total_customers: parseInt(stats.total_customers, 10) || 0,
          active_users: parseInt(stats.active_users, 10) || 0,
          total_revenue: parseFloat(stats.total_revenue) || 0,
          average_sale_value: parseFloat(stats.average_sale_value) || 0
        },
        monthly: {
          sales: parseInt(monthStats.monthly_sales, 10) || 0,
          revenue: parseFloat(monthStats.monthly_revenue) || 0,
          average_sale: parseFloat(monthStats.monthly_avg_sale) || 0
        },
        inventory: {
          low_stock_products: lowStockCount
        },
        warranties: warrantyStats,
        seller: sellerStats ? {
          my_sales: parseInt(sellerStats.my_sales, 10) || 0,
          my_revenue: parseFloat(sellerStats.my_revenue) || 0,
          my_average_sale: parseFloat(sellerStats.my_avg_sale) || 0
        } : null
      }
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @route GET /api/stats/sales
 * @desc Obtiene estadísticas detalladas de ventas
 * @access Private
 */
export const getSalesStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const period = (req.query.period as string) || 'month'; // month, quarter, year
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.userRole;

    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = "sale_date >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "EXTRACT(MONTH FROM sale_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM sale_date) = EXTRACT(YEAR FROM CURRENT_DATE)";
        break;
      case 'quarter':
        dateFilter = "EXTRACT(QUARTER FROM sale_date) = EXTRACT(QUARTER FROM CURRENT_DATE) AND EXTRACT(YEAR FROM sale_date) = EXTRACT(YEAR FROM CURRENT_DATE)";
        break;
      case 'year':
        dateFilter = "EXTRACT(YEAR FROM sale_date) = EXTRACT(YEAR FROM CURRENT_DATE)";
        break;
      default:
        dateFilter = "1=1"; // Sin filtro
    }

    // Agregar filtro de vendedor si no es admin
    if (userRole !== 'admin' && userId) {
      dateFilter += ` AND seller_id = '${userId}'`;
    }

    // Ventas por día
    const dailySalesQuery = `
      SELECT 
        DATE(sale_date) as date,
        COUNT(*) as sales_count,
        SUM(total_price) as daily_revenue,
        AVG(total_price) as avg_sale_value
      FROM sales
      WHERE ${dateFilter}
      GROUP BY DATE(sale_date)
      ORDER BY date DESC
      LIMIT 30
    `;

    const dailySales = await query(dailySalesQuery);

    // Top productos vendidos
    const topProductsQuery = `
      SELECT 
        p.name,
        p.sku,
        SUM(s.quantity) as total_quantity,
        SUM(s.total_price) as total_revenue,
        COUNT(s.id) as sales_count
      FROM sales s
      INNER JOIN products p ON s.product_id = p.id
      WHERE ${dateFilter}
      GROUP BY p.id, p.name, p.sku
      ORDER BY total_revenue DESC
      LIMIT 10
    `;

    const topProducts = await query(topProductsQuery);

    // Top vendedores (solo si es admin)
    let topSellers = [];
    if (userRole === 'admin') {
      const topSellersQuery = `
        SELECT 
          u.first_name,
          u.last_name,
          u.email,
          COUNT(s.id) as sales_count,
          SUM(s.total_price) as total_revenue,
          AVG(s.total_price) as avg_sale_value
        FROM sales s
        INNER JOIN users u ON s.seller_id = u.id
        WHERE ${dateFilter}
        GROUP BY u.id, u.first_name, u.last_name, u.email
        ORDER BY total_revenue DESC
        LIMIT 10
      `;

      const topSellersResult = await query(topSellersQuery);
      topSellers = topSellersResult.rows;
    }

    res.json({
      success: true,
      data: {
        period,
        daily_sales: dailySales.rows,
        top_products: topProducts.rows,
        top_sellers: topSellers
      }
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @route GET /api/warranties/expiring
 * @desc Obtiene garantías próximas a vencer
 * @access Private
 */
export const getExpiringWarrantiesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const expiringWarranties = await getExpiringWarranties(days);

    res.json({
      success: true,
      data: {
        warranties: expiringWarranties,
        count: expiringWarranties.length,
        days_threshold: days
      }
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @route GET /api/warranties/statistics
 * @desc Obtiene estadísticas de garantías
 * @access Private
 */
export const getWarrantyStatisticsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getWarrantyStatistics();

    res.json({
      success: true,
      data: { statistics: stats }
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @route GET /api/warranties/check/:saleId
 * @desc Verifica el estado de garantía de una venta
 * @access Private
 */
export const checkWarrantyStatusController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { saleId } = req.params;
    const status = await checkWarrantyStatus(saleId);

    res.json({
      success: true,
      data: { warranty_status: status }
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @route GET /api/reports/inventory
 * @desc Genera reporte de inventario
 * @access Private
 */
export const getInventoryReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const includeInactive = req.query.include_inactive === 'true';

    const inventoryQuery = `
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.stock,
        p.price,
        p.is_active,
        COALESCE(sales_data.total_sold, 0) as total_sold,
        COALESCE(sales_data.total_revenue, 0) as total_revenue,
        (p.stock * p.price) as stock_value,
        CASE 
          WHEN p.stock = 0 THEN 'Sin Stock'
          WHEN p.stock <= 5 THEN 'Stock Crítico'
          WHEN p.stock <= 10 THEN 'Stock Bajo'
          ELSE 'Stock Normal'
        END as stock_status
      FROM products p
      LEFT JOIN (
        SELECT 
          product_id,
          SUM(quantity) as total_sold,
          SUM(total_price) as total_revenue
        FROM sales
        GROUP BY product_id
      ) sales_data ON p.id = sales_data.product_id
      ${includeInactive ? '' : 'WHERE p.is_active = true'}
      ORDER BY p.name
    `;

    const inventory = await query(inventoryQuery);

    // Resumen del inventario
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN is_active THEN 1 END) as active_products,
        SUM(stock) as total_stock,
        SUM(stock * price) as total_stock_value,
        COUNT(CASE WHEN stock = 0 AND is_active THEN 1 END) as out_of_stock,
        COUNT(CASE WHEN stock <= 10 AND stock > 0 AND is_active THEN 1 END) as low_stock
      FROM products
    `;

    const summary = await query(summaryQuery);

    res.json({
      success: true,
      data: {
        products: inventory.rows,
        summary: summary.rows[0],
        include_inactive: includeInactive,
        generated_at: new Date()
      }
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @route GET /api/reports/sales
 * @desc Genera reporte de ventas
 * @access Private
 */
export const getSalesReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;
    const sellerId = req.query.seller_id as string;
    const productId = req.query.product_id as string;
    const customerId = req.query.customer_id as string;

    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.userRole;

    // Construir filtros
    const filters: string[] = [];
    const queryParams: any[] = [];
    let paramCounter = 1;

    if (startDate) {
      filters.push(`s.sale_date >= $${paramCounter}`);
      queryParams.push(startDate);
      paramCounter++;
    }

    if (endDate) {
      filters.push(`s.sale_date <= $${paramCounter}`);
      queryParams.push(endDate);
      paramCounter++;
    }

    if (sellerId) {
      filters.push(`s.seller_id = $${paramCounter}`);
      queryParams.push(sellerId);
      paramCounter++;
    } else if (userRole !== 'admin' && userId) {
      // Si no es admin, solo puede ver sus propias ventas
      filters.push(`s.seller_id = $${paramCounter}`);
      queryParams.push(userId);
      paramCounter++;
    }

    if (productId) {
      filters.push(`s.product_id = $${paramCounter}`);
      queryParams.push(productId);
      paramCounter++;
    }

    if (customerId) {
      filters.push(`s.customer_id = $${paramCounter}`);
      queryParams.push(customerId);
      paramCounter++;
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    // Reporte detallado de ventas
    const salesQuery = `
      SELECT 
        s.id,
        s.sale_date,
        s.quantity,
        s.unit_price,
        s.total_price,
        s.warranty_period_months,
        s.warranty_end,
        p.name as product_name,
        p.sku as product_sku,
        CONCAT(c.first_name, ' ', c.last_name) as customer_name,
        c.email as customer_email,
        CONCAT(u.first_name, ' ', u.last_name) as seller_name,
        u.email as seller_email
      FROM sales s
      INNER JOIN products p ON s.product_id = p.id
      INNER JOIN customers c ON s.customer_id = c.id
      INNER JOIN users u ON s.seller_id = u.id
      ${whereClause}
      ORDER BY s.sale_date DESC
    `;

    const sales = await query(salesQuery, queryParams);

    // Resumen del reporte
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_sales,
        SUM(total_price) as total_revenue,
        AVG(total_price) as average_sale,
        SUM(quantity) as total_items_sold,
        COUNT(DISTINCT customer_id) as unique_customers,
        COUNT(DISTINCT product_id) as unique_products
      FROM sales s
      ${whereClause}
    `;

    const summary = await query(summaryQuery, queryParams);

    res.json({
      success: true,
      data: {
        sales: sales.rows,
        summary: summary.rows[0],
        filters: {
          start_date: startDate,
          end_date: endDate,
          seller_id: sellerId,
          product_id: productId,
          customer_id: customerId
        },
        generated_at: new Date()
      }
    });
  } catch (error) {
    throw error;
  }
};
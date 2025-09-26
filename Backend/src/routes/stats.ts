import { Router } from 'express';
import {
  getDashboardStats,
  getSalesStats,
  getExpiringWarrantiesController,
  getWarrantyStatisticsController,
  checkWarrantyStatusController,
  getInventoryReport,
  getSalesReport
} from '../controllers/statsController';
import {
  validateUUIDParam,
  handleValidationErrors
} from '../middleware/validation';
import { authMiddleware, requireRole, asyncHandler } from '../middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @route GET /api/stats/dashboard
 * @desc Obtiene estadísticas generales del dashboard
 * @access Private
 */
router.get('/dashboard', asyncHandler(getDashboardStats));

/**
 * @route GET /api/stats/sales
 * @desc Obtiene estadísticas detalladas de ventas
 * @access Private
 */
router.get(
  '/sales',
  [
    require('express-validator').query('period')
      .optional()
      .isIn(['week', 'month', 'quarter', 'year'])
      .withMessage('Período debe ser week, month, quarter o year'),
    handleValidationErrors
  ],
  asyncHandler(getSalesStats)
);

/**
 * @route GET /api/warranties/expiring
 * @desc Obtiene garantías próximas a vencer
 * @access Private
 */
router.get(
  '/warranties/expiring',
  [
    require('express-validator').query('days')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Días debe ser un número entre 1 y 365'),
    handleValidationErrors
  ],
  asyncHandler(getExpiringWarrantiesController)
);

/**
 * @route GET /api/warranties/statistics
 * @desc Obtiene estadísticas de garantías
 * @access Private
 */
router.get('/warranties/statistics', asyncHandler(getWarrantyStatisticsController));

/**
 * @route GET /api/warranties/check/:saleId
 * @desc Verifica el estado de garantía de una venta
 * @access Private
 */
router.get(
  '/warranties/check/:saleId',
  validateUUIDParam('saleId'),
  handleValidationErrors,
  asyncHandler(checkWarrantyStatusController)
);

/**
 * @route GET /api/reports/inventory
 * @desc Genera reporte de inventario
 * @access Private (Admin)
 */
router.get(
  '/reports/inventory',
  requireRole(['admin']),
  [
    require('express-validator').query('include_inactive')
      .optional()
      .isBoolean()
      .withMessage('include_inactive debe ser un valor booleano'),
    handleValidationErrors
  ],
  asyncHandler(getInventoryReport)
);

/**
 * @route GET /api/reports/sales
 * @desc Genera reporte de ventas
 * @access Private
 */
router.get(
  '/reports/sales',
  [
    require('express-validator').query('start_date')
      .optional()
      .isISO8601()
      .withMessage('start_date debe ser una fecha válida'),
    require('express-validator').query('end_date')
      .optional()
      .isISO8601()
      .withMessage('end_date debe ser una fecha válida'),
    require('express-validator').query('seller_id')
      .optional()
      .custom((value) => {
        const { isValidUUID } = require('../utils/helpers');
        if (value && !isValidUUID(value)) {
          throw new Error('seller_id debe ser un UUID válido');
        }
        return true;
      }),
    require('express-validator').query('product_id')
      .optional()
      .custom((value) => {
        const { isValidUUID } = require('../utils/helpers');
        if (value && !isValidUUID(value)) {
          throw new Error('product_id debe ser un UUID válido');
        }
        return true;
      }),
    require('express-validator').query('customer_id')
      .optional()
      .custom((value) => {
        const { isValidUUID } = require('../utils/helpers');
        if (value && !isValidUUID(value)) {
          throw new Error('customer_id debe ser un UUID válido');
        }
        return true;
      }),
    handleValidationErrors
  ],
  asyncHandler(getSalesReport)
);

export default router;
import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerSales,
  getCustomerStatistics
} from '../controllers/customerController';
import {
  validateCreateCustomer,
  validateUpdateCustomer,
  validateUUIDParam,
  validatePagination,
  handleValidationErrors
} from '../middleware/validation';
import { authMiddleware, requireRole, asyncHandler } from '../middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @route GET /api/customers
 * @desc Obtiene lista paginada de clientes con filtros opcionales
 * @access Private
 */
router.get('/', validatePagination, asyncHandler(getCustomers));

/**
 * @route GET /api/customers/:id
 * @desc Obtiene un cliente por su ID
 * @access Private
 */
router.get('/:id', validateUUIDParam('id'), handleValidationErrors, asyncHandler(getCustomerById));

/**
 * @route GET /api/customers/:id/sales
 * @desc Obtiene el historial de ventas de un cliente
 * @access Private
 */
router.get(
  '/:id/sales',
  [validateUUIDParam('id'), validatePagination],
  asyncHandler(getCustomerSales)
);

/**
 * @route GET /api/customers/:id/statistics
 * @desc Obtiene estadísticas de compras de un cliente
 * @access Private
 */
router.get(
  '/:id/statistics',
  validateUUIDParam('id'),
  handleValidationErrors,
  asyncHandler(getCustomerStatistics)
);

/**
 * @route POST /api/customers
 * @desc Crea un nuevo cliente
 * @access Private
 */
router.post('/', validateCreateCustomer, asyncHandler(createCustomer));

/**
 * @route PUT /api/customers/:id
 * @desc Actualiza un cliente existente
 * @access Private
 */
router.put(
  '/:id',
  validateUUIDParam('id'),
  validateUpdateCustomer,
  asyncHandler(updateCustomer)
);

/**
 * @route DELETE /api/customers/:id
 * @desc Elimina un cliente (solo si no tiene ventas)
 * @access Private (Admin)
 */
router.delete(
  '/:id',
  requireRole(['admin']),
  validateUUIDParam('id'),
  handleValidationErrors,
  asyncHandler(deleteCustomer)
);

export default router;
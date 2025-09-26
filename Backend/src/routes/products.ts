import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  adjustStock
} from '../controllers/productController';
import {
  validateCreateProduct,
  validateUpdateProduct,
  validateUUIDParam,
  validatePagination,
  handleValidationErrors
} from '../middleware/validation';
import { authMiddleware, requireRole, asyncHandler } from '../middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @route GET /api/products
 * @desc Obtiene lista paginada de productos con filtros opcionales
 * @access Private
 */
router.get('/', validatePagination, asyncHandler(getProducts));

/**
 * @route GET /api/products/low-stock
 * @desc Obtiene productos con stock bajo
 * @access Private
 */
router.get('/low-stock', asyncHandler(getLowStockProducts));

/**
 * @route GET /api/products/:id
 * @desc Obtiene un producto por su ID
 * @access Private
 */
router.get('/:id', validateUUIDParam('id'), handleValidationErrors, asyncHandler(getProductById));

/**
 * @route POST /api/products
 * @desc Crea un nuevo producto
 * @access Private (Admin)
 */
router.post('/', requireRole(['admin']), validateCreateProduct, asyncHandler(createProduct));

/**
 * @route PUT /api/products/:id
 * @desc Actualiza un producto existente
 * @access Private (Admin)
 */
router.put(
  '/:id',
  requireRole(['admin']),
  validateUUIDParam('id'),
  validateUpdateProduct,
  asyncHandler(updateProduct)
);

/**
 * @route DELETE /api/products/:id
 * @desc Elimina (desactiva) un producto
 * @access Private (Admin)
 */
router.delete(
  '/:id',
  requireRole(['admin']),
  validateUUIDParam('id'),
  handleValidationErrors,
  asyncHandler(deleteProduct)
);

/**
 * @route POST /api/products/:id/adjust-stock
 * @desc Ajusta el stock de un producto
 * @access Private (Admin)
 */
router.post(
  '/:id/adjust-stock',
  requireRole(['admin']),
  [
    validateUUIDParam('id'),
    require('express-validator').body('adjustment')
      .isInt()
      .withMessage('El ajuste debe ser un número entero'),
    require('express-validator').body('reason')
      .optional()
      .isLength({ max: 255 })
      .withMessage('La razón no puede exceder 255 caracteres'),
    handleValidationErrors
  ],
  asyncHandler(adjustStock)
);

export default router;
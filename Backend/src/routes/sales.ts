import { Router } from 'express';
import {
  getSales,
  getSaleById,
  createSale,
  uploadSaleImages,
  extractSerial,
  uploadImages,
  uploadSingleImage
} from '../controllers/saleController';
import {
  validateCreateSale,
  validateUUIDParam,
  validatePagination,
  validateImageUpload,
  handleValidationErrors
} from '../middleware/validation';
import { authMiddleware, asyncHandler } from '../middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @route GET /api/sales
 * @desc Obtiene lista paginada de ventas con filtros opcionales
 * @access Private
 */
router.get('/', validatePagination, asyncHandler(getSales));

/**
 * @route GET /api/sales/:id
 * @desc Obtiene una venta por su ID con detalles completos
 * @access Private
 */
router.get('/:id', validateUUIDParam('id'), handleValidationErrors, asyncHandler(getSaleById));

/**
 * @route POST /api/sales
 * @desc Crea una nueva venta
 * @access Private
 */
router.post('/', validateCreateSale, asyncHandler(createSale));

/**
 * @route POST /api/sales/:id/images
 * @desc Sube imágenes para una venta
 * @access Private
 */
router.post(
  '/:id/images',
  validateUUIDParam('id'),
  handleValidationErrors,
  uploadImages, // Middleware de multer
  [
    require('express-validator').body('image_types')
      .isArray()
      .withMessage('image_types debe ser un array')
      .custom((value: string[]) => {
        const validTypes = ['sealed', 'full_product', 'serial_number'];
        if (!value.every(type => validTypes.includes(type))) {
          throw new Error('Tipos de imagen inválidos');
        }
        if (value.length > 3) {
          throw new Error('Máximo 3 imágenes permitidas');
        }
        return true;
      }),
    handleValidationErrors
  ],
  asyncHandler(uploadSaleImages)
);

/**
 * @route POST /api/sales/:id/extract-serial
 * @desc Extrae número de serie de una imagen usando OCR (simulado)
 * @access Private
 */
router.post(
  '/:id/extract-serial',
  validateUUIDParam('id'),
  handleValidationErrors,
  uploadSingleImage, // Middleware de multer para imagen individual
  asyncHandler(extractSerial)
);

export default router;
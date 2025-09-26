import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { isValidUUID, isValidEmail, isValidPhone } from '../utils/helpers';

/**
 * Middleware para manejar errores de validación
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array().map(error => ({
        field: error.type === 'field' ? (error as any).path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? (error as any).value : undefined
      }))
    });
    return;
  }
  
  next();
};

/**
 * Validaciones para autenticación
 */
export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Email debe tener un formato válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password es requerido'),
  handleValidationErrors
];

export const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Email debe tener un formato válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password debe tener al menos 8 caracteres'),
  body('first_name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Nombre debe tener entre 2 y 50 caracteres')
    .trim(),
  body('last_name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Apellido debe tener entre 2 y 50 caracteres')
    .trim(),
  body('role')
    .optional()
    .isIn(['seller', 'admin'])
    .withMessage('Rol debe ser seller o admin'),
  handleValidationErrors
];

/**
 * Validaciones para productos
 */
export const validateCreateProduct = [
  body('name')
    .isLength({ min: 2, max: 255 })
    .withMessage('Nombre del producto debe tener entre 2 y 255 caracteres')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Descripción no puede exceder 1000 caracteres')
    .trim(),
  body('sku')
    .isLength({ min: 3, max: 100 })
    .withMessage('SKU debe tener entre 3 y 100 caracteres')
    .trim(),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock debe ser un número entero mayor o igual a 0'),
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Precio debe ser mayor a 0'),
  handleValidationErrors
];

export const validateUpdateProduct = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nombre del producto debe tener entre 2 y 255 caracteres')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Descripción no puede exceder 1000 caracteres')
    .trim(),
  body('sku')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('SKU debe tener entre 3 y 100 caracteres')
    .trim(),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock debe ser un número entero mayor o igual a 0'),
  body('price')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Precio debe ser mayor a 0'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active debe ser un valor booleano'),
  handleValidationErrors
];

/**
 * Validaciones para clientes
 */
export const validateCreateCustomer = [
  body('first_name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre debe tener entre 2 y 100 caracteres')
    .trim(),
  body('last_name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Apellido debe tener entre 2 y 100 caracteres')
    .trim(),
  body('email')
    .isEmail()
    .withMessage('Email debe tener un formato válido')
    .normalizeEmail(),
  body('phone')
    .optional()
    .custom((value) => {
      if (value && !isValidPhone(value)) {
        throw new Error('Teléfono debe tener un formato válido');
      }
      return true;
    }),
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Dirección no puede exceder 500 caracteres')
    .trim(),
  handleValidationErrors
];

export const validateUpdateCustomer = [
  body('first_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre debe tener entre 2 y 100 caracteres')
    .trim(),
  body('last_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Apellido debe tener entre 2 y 100 caracteres')
    .trim(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email debe tener un formato válido')
    .normalizeEmail(),
  body('phone')
    .optional()
    .custom((value) => {
      if (value && !isValidPhone(value)) {
        throw new Error('Teléfono debe tener un formato válido');
      }
      return true;
    }),
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Dirección no puede exceder 500 caracteres')
    .trim(),
  handleValidationErrors
];

/**
 * Validaciones para ventas
 */
export const validateCreateSale = [
  body('product_id')
    .custom((value) => {
      if (!isValidUUID(value)) {
        throw new Error('product_id debe ser un UUID válido');
      }
      return true;
    }),
  body('customer_id')
    .custom((value) => {
      if (!isValidUUID(value)) {
        throw new Error('customer_id debe ser un UUID válido');
      }
      return true;
    }),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Cantidad debe ser un número entero mayor a 0'),
  body('unit_price')
    .isFloat({ min: 0.01 })
    .withMessage('Precio unitario debe ser mayor a 0'),
  body('warranty_period_months')
    .isInt({ min: 1, max: 120 })
    .withMessage('Período de garantía debe ser entre 1 y 120 meses'),
  body('serial_number')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Número de serie no puede exceder 255 caracteres')
    .trim(),
  handleValidationErrors
];

/**
 * Validaciones para parámetros de ruta
 */
export const validateUUIDParam = (paramName: string = 'id'): ValidationChain => {
  return param(paramName)
    .custom((value) => {
      if (!isValidUUID(value)) {
        throw new Error(`${paramName} debe ser un UUID válido`);
      }
      return true;
    });
};

/**
 * Validaciones para consultas de paginación
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page debe ser un número entero mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit debe ser un número entero entre 1 y 100'),
  query('sortBy')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('sortBy debe tener entre 1 y 50 caracteres'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder debe ser asc o desc'),
  handleValidationErrors
];

/**
 * Validación para subida de imágenes
 */
export const validateImageUpload = [
  body('image_type')
    .isIn(['sealed', 'full_product', 'serial_number'])
    .withMessage('image_type debe ser sealed, full_product o serial_number'),
  handleValidationErrors
];
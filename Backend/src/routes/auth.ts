import { Router } from 'express';
import { 
  register, 
  login, 
  refreshAccessToken, 
  logout, 
  getCurrentUser, 
  changePassword 
} from '../controllers/authController';
import { 
  validateLogin, 
  validateRegister, 
  handleValidationErrors 
} from '../middleware/validation';
import { authMiddleware, asyncHandler } from '../middleware';

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Registra un nuevo usuario (vendedor)
 * @access Public
 */
router.post('/register', validateRegister, asyncHandler(register));

/**
 * @route POST /api/auth/login
 * @desc Autentica un usuario y devuelve tokens
 * @access Public
 */
router.post('/login', validateLogin, asyncHandler(login));

/**
 * @route POST /api/auth/refresh
 * @desc Genera un nuevo access token usando el refresh token
 * @access Public (pero requiere refresh token en cookie)
 */
router.post('/refresh', asyncHandler(refreshAccessToken));

/**
 * @route POST /api/auth/logout
 * @desc Cierra sesión eliminando el refresh token
 * @access Public
 */
router.post('/logout', asyncHandler(logout));

/**
 * @route GET /api/auth/me
 * @desc Obtiene información del usuario autenticado
 * @access Private
 */
router.get('/me', authMiddleware, asyncHandler(getCurrentUser));

/**
 * @route POST /api/auth/change-password
 * @desc Cambia la contraseña del usuario autenticado
 * @access Private
 */
router.post(
  '/change-password',
  authMiddleware,
  [
    require('express-validator').body('currentPassword')
      .notEmpty()
      .withMessage('Contraseña actual es requerida'),
    require('express-validator').body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Nueva contraseña debe tener al menos 8 caracteres'),
    handleValidationErrors
  ],
  asyncHandler(changePassword)
);

export default router;
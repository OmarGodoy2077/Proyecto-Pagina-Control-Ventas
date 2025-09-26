import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt';
import { AuthenticatedRequest } from '../models';

/**
 * Interfaz extendida de Request con datos de autenticación
 */
export interface AuthRequest extends Request {
  user?: AuthenticatedRequest;
}

/**
 * Middleware de autenticación JWT
 * Verifica el token de acceso y añade la información del usuario a la request
 */
export const authMiddleware = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    // Extraer token del header Authorization
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Token de acceso requerido'
      });
      return;
    }

    // Verificar y decodificar el token
    const decoded = verifyAccessToken(token);
    
    // Añadir información del usuario a la request
    req.user = {
      userId: decoded.userId,
      userRole: decoded.role,
      userEmail: decoded.email
    };

    next();
  } catch (error) {
    let message = 'Token inválido';
    
    if (error instanceof Error) {
      message = error.message;
    }

    res.status(401).json({
      success: false,
      error: message
    });
  }
};

/**
 * Middleware de autorización por rol
 * Verifica que el usuario tenga uno de los roles permitidos
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.userRole)) {
      res.status(403).json({
        success: false,
        error: 'No tienes permisos para realizar esta acción'
      });
      return;
    }

    next();
  };
};

/**
 * Middleware opcional de autenticación
 * Similar al authMiddleware pero no falla si no hay token
 */
export const optionalAuth = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = {
        userId: decoded.userId,
        userRole: decoded.role,
        userEmail: decoded.email
      };
    }

    next();
  } catch (error) {
    // Si hay error con el token, continuar sin usuario
    next();
  }
};

/**
 * Middleware para verificar que el usuario sea propietario del recurso
 * Útil para endpoints donde un usuario solo puede acceder a sus propios datos
 */
export const requireOwnership = (userIdParam: string = 'userId') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
      return;
    }

    const resourceUserId = req.params[userIdParam];
    
    // Los admins pueden acceder a cualquier recurso
    if (req.user.userRole === 'admin') {
      next();
      return;
    }

    // Los usuarios solo pueden acceder a sus propios recursos
    if (req.user.userId !== resourceUserId) {
      res.status(403).json({
        success: false,
        error: 'No tienes permisos para acceder a este recurso'
      });
      return;
    }

    next();
  };
};
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../models/Common';

/**
 * Clase de error personalizada para la aplicación
 */
export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // Mantiene el stack trace limpio
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Errores predefinidos comunes
 */
export class NotFoundError extends CustomError {
  constructor(resource: string = 'Recurso') {
    super(`${resource} no encontrado`, 404);
  }
}

export class ValidationError extends CustomError {
  constructor(message: string = 'Datos de entrada inválidos') {
    super(message, 400);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string = 'No autorizado') {
    super(message, 401);
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string = 'Acceso denegado') {
    super(message, 403);
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = 'Conflicto de datos') {
    super(message, 409);
  }
}

export class DatabaseError extends CustomError {
  constructor(message: string = 'Error en la base de datos') {
    super(message, 500);
  }
}

/**
 * Middleware global de manejo de errores
 * Debe ser el último middleware en la aplicación
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err } as CustomError;
  error.message = err.message;

  // Log del error para debugging
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Error de validación de Mongoose/PostgreSQL (código 11000 para duplicados)
  if (err.message.includes('duplicate key value')) {
    const message = 'Recurso ya existe';
    error = new ConflictError(message);
  }

  // Error de cast de ID inválido
  if (err.name === 'CastError') {
    const message = 'Recurso no encontrado';
    error = new NotFoundError(message);
  }

  // Error de validación de JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token inválido';
    error = new UnauthorizedError(message);
  }

  // Error de token expirado
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expirado';
    error = new UnauthorizedError(message);
  }

  // Errores de PostgreSQL
  if (err.name === 'PostgresError' || (err as any).code) {
    const pgError = err as any;
    switch (pgError.code) {
      case '23505': // unique_violation
        error = new ConflictError('Ya existe un recurso con esos datos');
        break;
      case '23503': // foreign_key_violation
        error = new ValidationError('Referencias a datos inexistentes');
        break;
      case '23502': // not_null_violation
        error = new ValidationError('Faltan campos requeridos');
        break;
      case '23514': // check_violation
        error = new ValidationError('Datos no cumplen las restricciones');
        break;
      default:
        error = new DatabaseError('Error en la base de datos');
    }
  }

  // Si no es un error operacional, tratar como error interno del servidor
  if (!error.isOperational) {
    error.statusCode = 500;
    error.message = 'Error interno del servidor';
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error
    })
  });
};

/**
 * Middleware para capturar rutas no encontradas
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Ruta ${req.originalUrl} no encontrada`);
  next(error);
};

/**
 * Wrapper para funciones async en rutas
 * Captura errores automáticamente y los pasa al middleware de error
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
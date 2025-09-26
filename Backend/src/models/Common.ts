/**
 * Respuesta API estándar
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: ValidationError[];
}

/**
 * Error de validación
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Respuesta paginada
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Parámetros de paginación
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Request con usuario autenticado
 */
export interface AuthenticatedRequest {
  userId: string;
  userRole: string;
  userEmail: string;
}

/**
 * Configuración de middleware
 */
export interface MiddlewareConfig {
  skipAuth?: boolean;
  requireRole?: string[];
}

/**
 * Error personalizado de la aplicación
 */
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

/**
 * Log de auditoría
 */
export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}
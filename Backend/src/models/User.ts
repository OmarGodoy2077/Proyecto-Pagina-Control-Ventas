/**
 * Modelo de Usuario (Vendedor)
 */
export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: 'seller' | 'admin';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Datos para crear un nuevo usuario
 */
export interface CreateUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: 'seller' | 'admin';
}

/**
 * Datos para actualizar un usuario
 */
export interface UpdateUserData {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: 'seller' | 'admin';
  is_active?: boolean;
}

/**
 * Usuario sin información sensible
 */
export interface SafeUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'seller' | 'admin';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Datos de login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Respuesta de autenticación
 */
export interface AuthResponse {
  user: SafeUser;
  accessToken: string;
}

/**
 * Payload del JWT
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Token de refresh
 */
export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
}
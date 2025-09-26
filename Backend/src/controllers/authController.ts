import { Request, Response } from 'express';
import { query } from '../database/connection';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, hashRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { generateUUID } from '../utils/helpers';
import { CreateUserData, LoginCredentials, SafeUser, JWTPayload } from '../models';
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../middleware/errorHandler';
import { config } from '../config';

/**
 * Controlador de autenticación
 * Maneja registro, login, logout y refresh de tokens
 */

/**
 * @route POST /api/auth/register
 * @desc Registra un nuevo usuario (vendedor)
 * @access Public
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, first_name, last_name, role = 'seller' }: CreateUserData = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw new ConflictError('Ya existe un usuario con este email');
    }

    // Hash de la contraseña
    const passwordHash = await hashPassword(password);

    // Crear usuario
    const userId = generateUUID();
    const insertQuery = `
      INSERT INTO users (id, email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, first_name, last_name, role, is_active, created_at, updated_at
    `;

    const result = await query(insertQuery, [
      userId,
      email,
      passwordHash,
      first_name,
      last_name,
      role
    ]);

    const user: SafeUser = result.rows[0];

    // Generar tokens
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Guardar refresh token hasheado en la base de datos
    const tokenHash = await hashRefreshToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

    await query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [userId, tokenHash, expiresAt]
    );

    // Configurar cookie con refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user,
        accessToken
      }
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @route POST /api/auth/login
 * @desc Autentica un usuario y devuelve tokens
 * @access Public
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginCredentials = req.body;

    // Buscar usuario por email
    const userQuery = `
      SELECT id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at
      FROM users
      WHERE email = $1 AND is_active = true
    `;
    
    const userResult = await query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    const userRecord = userResult.rows[0];

    // Verificar contraseña
    const isPasswordValid = await verifyPassword(password, userRecord.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Crear objeto de usuario sin contraseña
    const user: SafeUser = {
      id: userRecord.id,
      email: userRecord.email,
      first_name: userRecord.first_name,
      last_name: userRecord.last_name,
      role: userRecord.role,
      is_active: userRecord.is_active,
      created_at: userRecord.created_at,
      updated_at: userRecord.updated_at
    };

    // Generar tokens
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Limpiar tokens expirados del usuario
    await query(
      'DELETE FROM refresh_tokens WHERE user_id = $1 AND expires_at < NOW()',
      [user.id]
    );

    // Guardar nuevo refresh token
    const tokenHash = await hashRefreshToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, tokenHash, expiresAt]
    );

    // Configurar cookie con refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user,
        accessToken
      }
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @route POST /api/auth/refresh
 * @desc Genera un nuevo access token usando el refresh token
 * @access Private
 */
export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token no encontrado');
    }

    // Verificar refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Verificar que el token existe en la base de datos
    const tokenHash = await hashRefreshToken(refreshToken);
    const tokenQuery = `
      SELECT rt.id, u.id as user_id, u.email, u.first_name, u.last_name, u.role, u.is_active
      FROM refresh_tokens rt
      INNER JOIN users u ON rt.user_id = u.id
      WHERE rt.token_hash = $1 AND rt.expires_at > NOW() AND u.is_active = true
    `;

    const tokenResult = await query(tokenQuery, [tokenHash]);

    if (tokenResult.rows.length === 0) {
      throw new UnauthorizedError('Refresh token inválido o expirado');
    }

    const userRecord = tokenResult.rows[0];

    // Crear nuevo access token
    const payload: JWTPayload = {
      userId: userRecord.user_id,
      email: userRecord.email,
      role: userRecord.role
    };

    const accessToken = generateAccessToken(payload);

    res.json({
      success: true,
      data: {
        accessToken
      }
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @route POST /api/auth/logout
 * @desc Cierra sesión eliminando el refresh token
 * @access Private
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      // Eliminar refresh token de la base de datos
      const tokenHash = await hashRefreshToken(refreshToken);
      await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
    }

    // Limpiar cookie
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logout exitoso'
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @route GET /api/auth/me
 * @desc Obtiene información del usuario autenticado
 * @access Private
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    const userQuery = `
      SELECT id, email, first_name, last_name, role, is_active, created_at, updated_at
      FROM users
      WHERE id = $1 AND is_active = true
    `;

    const result = await query(userQuery, [userId]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Usuario no encontrado');
    }

    const user: SafeUser = result.rows[0];

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    throw error;
  }
};

/**
 * @route POST /api/auth/change-password
 * @desc Cambia la contraseña del usuario autenticado
 * @access Private
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    if (!currentPassword || !newPassword) {
      throw new ValidationError('Contraseña actual y nueva son requeridas');
    }

    // Obtener contraseña actual del usuario
    const userQuery = 'SELECT password_hash FROM users WHERE id = $1';
    const userResult = await query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await verifyPassword(currentPassword, userResult.rows[0].password_hash);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedError('Contraseña actual incorrecta');
    }

    // Hash de la nueva contraseña
    const newPasswordHash = await hashPassword(newPassword);

    // Actualizar contraseña
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    // Invalidar todos los refresh tokens del usuario por seguridad
    await query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);

    // Limpiar cookie
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Contraseña cambiada exitosamente. Por favor, inicia sesión nuevamente.'
    });
  } catch (error) {
    throw error;
  }
};
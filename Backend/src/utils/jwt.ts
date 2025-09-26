import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JWTPayload } from '../models';

/**
 * Genera un token de acceso JWT
 * @param payload - Datos del usuario para el token
 * @returns Token JWT firmado
 */
export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
    issuer: 'sales-inventory-system',
    audience: 'sales-app-users'
  });
};

/**
 * Genera un token de refresh JWT
 * @param payload - Datos del usuario para el token
 * @returns Token de refresh JWT firmado
 */
export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
    issuer: 'sales-inventory-system',
    audience: 'sales-app-users'
  });
};

/**
 * Verifica y decodifica un token de acceso
 * @param token - Token JWT a verificar
 * @returns Payload decodificado del token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret, {
      issuer: 'sales-inventory-system',
      audience: 'sales-app-users'
    });
    
    if (typeof decoded === 'object' && decoded !== null) {
      return decoded as JWTPayload;
    }
    
    throw new Error('Token inválido');
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expirado');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Token inválido');
    }
    throw error;
  }
};

/**
 * Verifica y decodifica un token de refresh
 * @param token - Token de refresh JWT a verificar
 * @returns Payload decodificado del token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret, {
      issuer: 'sales-inventory-system',
      audience: 'sales-app-users'
    });
    
    if (typeof decoded === 'object' && decoded !== null) {
      return decoded as JWTPayload;
    }
    
    throw new Error('Token de refresh inválido');
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token de refresh expirado');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Token de refresh inválido');
    }
    throw error;
  }
};

/**
 * Extrae el token del header Authorization
 * @param authHeader - Header de autorización
 * @returns Token extraído o null
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) {
    return null;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

/**
 * Genera un hash para almacenar tokens de refresh de forma segura
 * @param token - Token de refresh a hashear
 * @returns Hash del token
 */
export const hashRefreshToken = async (token: string): Promise<string> => {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Obtiene la fecha de expiración de un token sin verificarlo
 * @param token - Token JWT
 * @returns Fecha de expiración o null
 */
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token);
    if (typeof decoded === 'object' && decoded !== null && 'exp' in decoded) {
      return new Date((decoded.exp as number) * 1000);
    }
    return null;
  } catch {
    return null;
  }
};
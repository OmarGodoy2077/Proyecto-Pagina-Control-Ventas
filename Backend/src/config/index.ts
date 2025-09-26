import dotenv from 'dotenv';

dotenv.config();

/**
 * Configuración centralizada de variables de entorno
 */
export const config = {
  // Configuración del servidor
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Configuración de base de datos
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'sales_inventory_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  },
  
  // Configuración JWT
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'fallback_access_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // Configuración CORS
  corsOrigin: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Configuración de archivos
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
  },
};

/**
 * Validación de variables de entorno críticas en producción
 */
export const validateConfig = (): void => {
  if (config.nodeEnv === 'production') {
    const requiredEnvVars = [
      'DB_HOST',
      'DB_NAME',
      'DB_USER',
      'DB_PASSWORD',
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Variables de entorno faltantes: ${missingVars.join(', ')}`);
    }
  }
};
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config, validateConfig } from './config';
import { testConnection } from './database/connection';
import { initializeDatabase } from './database/init';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

/**
 * Configuración y creación de la aplicación Express
 */

// Validar configuración en producción
validateConfig();

const app = express();

/**
 * Middlewares de seguridad
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

/**
 * Configuración CORS
 */
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

/**
 * Middlewares de parsing
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

/**
 * Logging
 */
if (config.nodeEnv === 'development') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('common'));
}

/**
 * Rutas principales
 */
app.use('/api', routes);

/**
 * Ruta raíz con información de la API
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Sales Inventory & Warranty Management System',
    version: '1.0.0',
    description: 'Sistema de gestión de ventas, inventario y garantías con Node.js, Express, TypeScript y PostgreSQL',
    author: 'Omar Godoy',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      products: '/api/products',
      customers: '/api/customers',
      sales: '/api/sales',
      stats: '/api/stats'
    },
    documentation: 'Ver README.md para documentación completa'
  });
});

/**
 * Middleware de manejo de errores 404
 */
app.use(notFoundHandler);

/**
 * Middleware global de manejo de errores
 */
app.use(errorHandler);

/**
 * Función para inicializar la base de datos
 */
export const initializeApp = async (): Promise<void> => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await testConnection();

    console.log('🔄 Inicializando estructura de base de datos...');
    await initializeDatabase();

    console.log('✅ Aplicación inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando la aplicación:', error);
    process.exit(1);
  }
};

export default app;
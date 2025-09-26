import { Pool, PoolClient } from 'pg';
import { config } from '../config';

/**
 * Pool de conexiones a PostgreSQL
 */
export const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  max: 20, // máximo número de conexiones
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Ejecuta una consulta SQL
 * @param text - Query SQL
 * @param params - Parámetros de la query
 * @returns Resultado de la consulta
 */
export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error', { text, error });
    throw error;
  }
};

/**
 * Obtiene un cliente del pool para transacciones
 * @returns Cliente de PostgreSQL
 */
export const getClient = async (): Promise<PoolClient> => {
  return await pool.connect();
};

/**
 * Verifica la conexión a la base de datos
 */
export const testConnection = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Conexión a PostgreSQL exitosa');
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error);
    throw error;
  }
};

/**
 * Cierra el pool de conexiones
 */
export const closePool = async (): Promise<void> => {
  await pool.end();
  console.log('Pool de conexiones cerrado');
};
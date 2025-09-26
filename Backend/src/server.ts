import app, { initializeApp } from './app';
import { config } from './config';
import { closePool } from './database/connection';

/**
 * Servidor principal de la aplicación
 */

/**
 * Función para iniciar el servidor
 */
const startServer = async (): Promise<void> => {
  try {
    // Inicializar la aplicación (base de datos, etc.)
    await initializeApp();

    // Iniciar el servidor
    const server = app.listen(config.port, () => {
      console.log(`🚀 Servidor corriendo en puerto ${config.port}`);
      console.log(`📝 Ambiente: ${config.nodeEnv}`);
      console.log(`🌐 URL: http://localhost:${config.port}`);
      console.log(`📊 API Health: http://localhost:${config.port}/api/health`);
      console.log(`📖 API Docs: http://localhost:${config.port}/`);
    });

    // Manejo graceful de cierre del servidor
    const gracefulShutdown = async (signal: string): Promise<void> => {
      console.log(`\n🔄 Recibida señal ${signal}. Cerrando servidor...`);
      
      server.close(async () => {
        console.log('🔒 Servidor HTTP cerrado');
        
        try {
          await closePool();
          console.log('🔒 Conexiones de base de datos cerradas');
          console.log('✅ Cierre graceful completado');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error durante el cierre:', error);
          process.exit(1);
        }
      });

      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        console.error('⚠️ Forzando cierre del servidor...');
        process.exit(1);
      }, 10000);
    };

    // Escuchar señales de cierre
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Manejo de errores no capturados
    process.on('uncaughtException', (error: Error) => {
      console.error('❌ Excepción no capturada:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      console.error('❌ Promesa rechazada no manejada:', reason);
      console.error('En promesa:', promise);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
};

// Iniciar el servidor si este archivo se ejecuta directamente
if (require.main === module) {
  startServer();
}

export default startServer;
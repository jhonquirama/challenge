import pgPromise from 'pg-promise';
import { logger } from '../../shared/utils/logger';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuración de la base de datos
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'notification_events',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 30, // máximo de conexiones en el pool
};

// Opciones para pg-promise
const pgp = pgPromise({
  // Eventos de conexión
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  connect(client) {
    logger.info('Nueva conexión a la base de datos establecida');
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  disconnect(client) {
    logger.info('Conexión a la base de datos cerrada');
  },
  error(err: Error, e: { query: string }) {
    logger.error('Error en la conexión a la base de datos', { error: err.message, query: e.query });
  },
});

// Crear instancia de la base de datos
export const db = pgp(config);

/**
 * Prueba la conexión a la base de datos
 * @returns {Promise<boolean>} true si la conexión es exitosa, false en caso contrario
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    await db.one('SELECT 1 AS result');
    logger.info('Conexión a la base de datos exitosa');
    return true;
  } catch (error) {
    logger.error('Error al conectar con la base de datos:', error);
    return false;
  }
};

/**
 * Verifica si las tablas existen en la base de datos
 * @returns {Promise<boolean>} true si las tablas existen, false en caso contrario
 */
export const tablesExist = async (): Promise<boolean> => {
  try {
    const result = await db.oneOrNone(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notification_events'
      ) AS notification_events_exists,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'delivery_attempts'
      ) AS delivery_attempts_exists,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'event_subscriptions'
      ) AS event_subscriptions_exists
    `);

    return result && result.notification_events_exists && result.delivery_attempts_exists;
  } catch (error) {
    logger.error('Error al verificar la existencia de tablas:', error);
    return false;
  }
};

/**
 * Ejecuta las migraciones de la base de datos
 */
export const runMigrations = async (): Promise<void> => {
  try {
    logger.info('Ejecutando migraciones...');
    const { stdout, stderr } = await execAsync('npm run migrate:up');

    if (stderr && !stderr.includes('notice')) {
      logger.warn('Advertencias durante la ejecución de migraciones:', stderr);
    }

    logger.info('Migraciones ejecutadas correctamente');
    logger.debug('Salida de migraciones:', stdout);
  } catch (error) {
    logger.error('Error al ejecutar migraciones:', error);
    throw error;
  }
};

/**
 * Inicializa la base de datos verificando la conexión y ejecutando migraciones si es necesario
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Verificar conexión
    const connected = await testConnection();
    if (!connected) {
      throw new Error('No se pudo conectar a la base de datos');
    }

    // Verificar si las tablas existen, si no, ejecutar migraciones
    const tables = await tablesExist();
    if (!tables) {
      await runMigrations();
    } else {
      logger.info('Las tablas ya existen en la base de datos');
    }
  } catch (error) {
    logger.error('Error al inicializar la base de datos:', error);
    throw error;
  }
};

export { pgp };
import pgPromise from 'pg-promise';
import { logger } from '../../shared/utils/logger';
import { spawn } from 'child_process';
import path from 'path';

// Opciones de inicialización
const initOptions = {
  // Eventos globales
  error(error: any, e: any) {
    if (e.cn) {
      // Error de conexión
      logger.error('Error de conexión a la base de datos:', error);
    } else if (e.query) {
      // Error de consulta
      logger.error('Error en consulta:', error);
    } else {
      // Error genérico
      logger.error('Error de base de datos:', error);
    }
  }
};

// Inicializar pg-promise con opciones
const pgp = pgPromise(initOptions);

// Configuración de conexión
const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'notification_events',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 30, // Máximo de conexiones en el pool
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// Crear instancia de la base de datos
export const db = pgp(connectionConfig);

// Función para verificar la conexión
export const testConnection = async (): Promise<boolean> => {
  try {
    await db.one('SELECT 1 AS connected');
    logger.info('Conexión a la base de datos establecida correctamente');
    return true;
  } catch (error) {
    logger.error('Error al conectar con la base de datos:', error);
    return false;
  }
};

// Función para ejecutar migraciones
export const runMigrations = async (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    logger.info('Ejecutando migraciones de base de datos...');
    
    const migrateProcess = spawn('npx', [
      'node-pg-migrate',
      'up',
      '--migrations-dir', './migrations',
      '--migration-file-language', 'js',
      '--verbose'
    ], {
      env: {
        ...process.env,
        PGHOST: process.env.DB_HOST || 'localhost',
        PGPORT: process.env.DB_PORT || '5432',
        PGDATABASE: process.env.DB_NAME || 'notification_events',
        PGUSER: process.env.DB_USER || 'postgres',
        PGPASSWORD: process.env.DB_PASSWORD || 'postgres'
      },
      stdio: 'pipe'
    });

    migrateProcess.stdout.on('data', (data) => {
      logger.info(`Migración: ${data.toString().trim()}`);
    });

    migrateProcess.stderr.on('data', (data) => {
      logger.error(`Error de migración: ${data.toString().trim()}`);
    });

    migrateProcess.on('close', (code) => {
      if (code === 0) {
        logger.info('Migraciones completadas exitosamente');
        resolve(true);
      } else {
        logger.error(`Proceso de migración falló con código: ${code}`);
        resolve(false);
      }
    });

    migrateProcess.on('error', (err) => {
      logger.error('Error al ejecutar migraciones:', err);
      reject(err);
    });
  });
};

// Función para inicializar la base de datos (ahora usa migraciones)
export const initializeDatabase = async (): Promise<void> => {
  try {
    const connected = await testConnection();
    if (!connected) {
      throw new Error('No se pudo conectar a la base de datos');
    }
    
    const migrationsSuccessful = await runMigrations();
    if (!migrationsSuccessful) {
      logger.warn('Las migraciones no se completaron correctamente');
    }
    
    logger.info('Base de datos inicializada correctamente');
  } catch (error) {
    logger.error('Error al inicializar la base de datos:', error);
    throw error;
  }
};
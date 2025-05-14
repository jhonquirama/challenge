import pgPromise from 'pg-promise';
import { logger } from '../../shared/utils/logger';

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
  connect(client) {
    logger.info('Nueva conexión a la base de datos establecida');
  },
  disconnect(client) {
    logger.info('Conexión a la base de datos cerrada');
  },
  error(err, e) {
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
 * Inicializa la base de datos creando las tablas necesarias si no existen
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Verificar si las tablas existen
    const tablesExist = await db.oneOrNone(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notification_events'
      ) AS notification_events_exists,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'delivery_attempts'
      ) AS delivery_attempts_exists
    `);

    if (!tablesExist.notification_events_exists || !tablesExist.delivery_attempts_exists) {
      logger.info('Creando tablas necesarias...');
      
      // Crear tabla de eventos si no existe
      if (!tablesExist.notification_events_exists) {
        await db.none(`
          CREATE TABLE notification_events (
            event_id VARCHAR(50) PRIMARY KEY,
            event_type VARCHAR(50) NOT NULL,
            content TEXT NOT NULL,
            delivery_date TIMESTAMP NOT NULL,
            delivery_status VARCHAR(20) NOT NULL CHECK (delivery_status IN ('completed', 'failed', 'pending', 'retrying')),
            client_id VARCHAR(50),
            retry_count INTEGER DEFAULT 0,
            last_retry_date TIMESTAMP,
            max_retries INTEGER DEFAULT 5,
            next_retry_date TIMESTAMP,
            webhook_url VARCHAR(255),
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // Crear índices
        await db.none('CREATE INDEX idx_notification_events_client_id ON notification_events(client_id)');
        await db.none('CREATE INDEX idx_notification_events_delivery_status ON notification_events(delivery_status)');
        await db.none('CREATE INDEX idx_notification_events_delivery_date ON notification_events(delivery_date)');
        await db.none('CREATE INDEX idx_notification_events_next_retry_date ON notification_events(next_retry_date)');
        
        // Crear trigger para updated_at
        await db.none(`
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = now();
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql
        `);
        
        await db.none(`
          CREATE TRIGGER update_updated_at_trigger
          BEFORE UPDATE ON notification_events
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
        `);
      }
      
      // Crear tabla de intentos si no existe
      if (!tablesExist.delivery_attempts_exists) {
        await db.none(`
          CREATE TABLE delivery_attempts (
            id SERIAL PRIMARY KEY,
            event_id VARCHAR(50) NOT NULL REFERENCES notification_events(event_id) ON DELETE CASCADE,
            attempt_date TIMESTAMP NOT NULL,
            status VARCHAR(10) NOT NULL CHECK (status IN ('success', 'failure')),
            status_code INTEGER,
            error_message TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // Crear índices
        await db.none('CREATE INDEX idx_delivery_attempts_event_id ON delivery_attempts(event_id)');
        await db.none('CREATE INDEX idx_delivery_attempts_status ON delivery_attempts(status)');
      }
      
      logger.info('Tablas creadas correctamente');
    } else {
      logger.info('Las tablas ya existen en la base de datos');
    }
  } catch (error) {
    logger.error('Error al inicializar la base de datos:', error);
    throw error;
  }
};
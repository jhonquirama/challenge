import pgPromise from 'pg-promise';
import { logger } from '../../../../shared/utils/logger';

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
export const dbClient = pgp(config);
import { db, testConnection } from '../../src/infrastructure/config/database.config';
import { logger } from '../../src/shared/utils/logger';

// Configuración para tests de integración
beforeAll(async () => {
  // Verificar conexión a la base de datos
  try {
    const connected = await testConnection();
    if (!connected) {
      throw new Error('No se pudo conectar a la base de datos para las pruebas');
    }
    
    // Crear tablas de prueba si no existen
    await db.none(`
      CREATE TABLE IF NOT EXISTS notification_events (
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await db.none(`
      CREATE TABLE IF NOT EXISTS delivery_attempts (
        id SERIAL PRIMARY KEY,
        event_id VARCHAR(50) NOT NULL,
        attempt_date TIMESTAMP NOT NULL,
        status VARCHAR(10) NOT NULL CHECK (status IN ('success', 'failure')),
        status_code INTEGER,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES notification_events(event_id) ON DELETE CASCADE
      )
    `);
    
    logger.info('Base de datos inicializada para pruebas');
  } catch (error) {
    logger.error('Error al inicializar la base de datos para pruebas:', error);
    throw error;
  }
});

// Limpiar después de todos los tests
afterAll(async () => {
  // Limpiar datos de prueba
  try {
    await db.none('DELETE FROM delivery_attempts WHERE event_id LIKE $1', ['TEST%']);
    await db.none('DELETE FROM notification_events WHERE event_id LIKE $1', ['TEST%']);
    logger.info('Datos de prueba eliminados');
  } catch (error) {
    logger.error('Error al limpiar datos de prueba:', error);
  }
});
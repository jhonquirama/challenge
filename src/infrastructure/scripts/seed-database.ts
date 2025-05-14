import fs from 'fs';
import path from 'path';
import { db } from '../config/database.config';
import { logger } from '../../shared/utils/logger';
import { NotificationEvent } from '../../core/domain/models/NotificationEvent';

/**
 * Script para cargar datos iniciales en la base de datos
 */
export const seedDatabase = async (): Promise<void> => {
  try {
    logger.info('Iniciando carga de datos iniciales...');
    
    // Verificar si ya hay datos en la base de datos
    const count = await db.one('SELECT COUNT(*) FROM notification_events');
    if (parseInt(count.count) > 0) {
      logger.info('La base de datos ya contiene eventos, omitiendo carga inicial');
      return;
    }
    
    // Cargar datos del archivo JSON
    const dataPath = path.join(__dirname, '../../../notification_events.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);
    
    if (!data.events || !Array.isArray(data.events) || data.events.length === 0) {
      logger.warn('No se encontraron eventos para cargar');
      return;
    }
    
    logger.info(`Cargando ${data.events.length} eventos iniciales...`);
    
    // Insertar eventos en la base de datos usando una transacción
    await db.tx(async t => {
      for (const event of data.events) {
        // Asegurarse de que el evento tenga todos los campos necesarios
        const completeEvent: NotificationEvent = {
          ...event,
          retry_count: 0,
          max_retries: 5,
          webhook_url: 'https://webhook.site/your-test-endpoint'
        };
        
        // Insertar el evento
        await t.none(`
          INSERT INTO notification_events(
            event_id, event_type, content, delivery_date, delivery_status,
            client_id, retry_count, max_retries, webhook_url
          ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          completeEvent.event_id,
          completeEvent.event_type,
          completeEvent.content,
          completeEvent.delivery_date,
          completeEvent.delivery_status,
          completeEvent.client_id,
          completeEvent.retry_count,
          completeEvent.max_retries,
          completeEvent.webhook_url
        ]);
      }
    });
    
    logger.info('Carga de datos iniciales completada exitosamente');
  } catch (error) {
    logger.error('Error al cargar datos iniciales:', error);
    throw error;
  }
};
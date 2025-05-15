import { db } from '../config/database.config';
import { logger } from '../../shared/utils/logger';

/**
 * Carga datos de ejemplo en la base de datos si está vacía
 */
export const seedDatabase = async (): Promise<void> => {
  try {
    // Verificar si ya hay datos en la base de datos
    const count = await db.one('SELECT COUNT(*) FROM notification_events');

    if (parseInt(count.count) === 0) {
      logger.info('Cargando datos de ejemplo en la base de datos...');

      // Usar una transacción para garantizar la integridad de los datos
      await db.tx(async (t) => {
        // Insertar eventos de ejemplo desde las migraciones
        await t.none(`
          INSERT INTO notification_events (
            event_id, event_type, content, delivery_date, delivery_status, 
            client_id, retry_count, webhook_url
          ) VALUES 
            ('EVT001', 'credit_card_payment', 'Credit card payment received for $150.00', '2024-03-15T09:30:22Z', 'completed', 'CLIENT001', 0, 'https://webhook.site/test-endpoint-1'),
            ('EVT002', 'debit_card_withdrawal', 'ATM withdrawal of $200.00', '2024-03-15T10:15:45Z', 'failed', 'CLIENT001', 3, 'https://webhook.site/test-endpoint-1'),
            ('EVT003', 'credit_transfer', 'Bank transfer received from Account #4567 for $1,500.00', '2024-03-15T11:20:18Z', 'pending', 'CLIENT002', 0, 'https://webhook.site/test-endpoint-2'),
            ('EVT004', 'account_update', 'Account details updated: email changed', '2024-03-15T14:05:33Z', 'retrying', 'CLIENT002', 1, 'https://webhook.site/test-endpoint-2')
          ON CONFLICT (event_id) DO NOTHING
        `);

        // Insertar intentos de entrega de ejemplo
        await t.none(`
          INSERT INTO delivery_attempts (
            event_id, attempt_date, status, status_code, error_message
          ) VALUES 
            ('EVT001', '2024-03-15T09:30:25Z', 'success', 200, NULL),
            ('EVT002', '2024-03-15T10:15:48Z', 'failure', 500, 'Internal server error'),
            ('EVT002', '2024-03-15T10:25:48Z', 'failure', 500, 'Internal server error'),
            ('EVT002', '2024-03-15T10:45:22Z', 'failure', 500, 'Internal server error'),
            ('EVT004', '2024-03-15T14:10:45Z', 'failure', 503, 'Service unavailable')
        `);

        // Insertar suscripciones de ejemplo
        try {
          await t.none(`
            INSERT INTO event_subscriptions (
              client_id, event_type, webhook_url, active
            ) VALUES 
              ('CLIENT001', 'credit_card_payment', 'https://webhook.site/client001-payments', true),
              ('CLIENT001', 'debit_card_withdrawal', 'https://webhook.site/client001-withdrawals', true),
              ('CLIENT002', 'credit_transfer', 'https://webhook.site/client002-transfers', true),
              ('CLIENT002', 'account_update', 'https://webhook.site/client002-updates', true)
            ON CONFLICT DO NOTHING
          `);
        } catch (error) {
          // Si la tabla event_subscriptions no existe, ignorar el error
          logger.warn(
            'No se pudieron insertar suscripciones de ejemplo (la tabla podría no existir)',
          );
        }
      });

      logger.info('Datos de ejemplo cargados correctamente');
    } else {
      logger.info('La base de datos ya contiene datos, omitiendo carga de datos de ejemplo');
    }
  } catch (error) {
    logger.error('Error al cargar datos de ejemplo:', error);
    // No lanzar error para permitir que la aplicación continúe
  }
};

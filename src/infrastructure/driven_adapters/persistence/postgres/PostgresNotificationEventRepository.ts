import { IDatabase } from 'pg-promise';
import { NotificationEvent, DeliveryStatus } from '../../../../core/domain/models/NotificationEvent';
import { INotificationEventRepository, NotificationEventFilter } from '../../../../core/ports/output/INotificationEventRepository';
import { logger } from '../../../../shared/utils/logger';

export class PostgresNotificationEventRepository implements INotificationEventRepository {
  constructor(private readonly db: IDatabase<any>) {}

  async findAll(filter?: NotificationEventFilter): Promise<NotificationEvent[]> {
    try {
      let query = `
        SELECT 
          ne.*, 
          json_agg(
            json_build_object(
              'attempt_date', da.attempt_date,
              'status', da.status,
              'status_code', da.status_code,
              'error_message', da.error_message
            )
          ) FILTER (WHERE da.id IS NOT NULL) as delivery_attempts
        FROM 
          notification_events ne
        LEFT JOIN 
          delivery_attempts da ON ne.event_id = da.event_id
      `;

      const whereConditions: string[] = [];
      const queryParams: any[] = [];

      if (filter) {
        if (filter.clientId) {
          whereConditions.push('ne.client_id = $' + (queryParams.length + 1));
          queryParams.push(filter.clientId);
        }

        if (filter.deliveryStatus) {
          whereConditions.push('ne.delivery_status = $' + (queryParams.length + 1));
          queryParams.push(filter.deliveryStatus);
        }

        if (filter.startDate) {
          whereConditions.push('ne.delivery_date >= $' + (queryParams.length + 1));
          queryParams.push(filter.startDate);
        }

        if (filter.endDate) {
          whereConditions.push('ne.delivery_date <= $' + (queryParams.length + 1));
          queryParams.push(filter.endDate);
        }
      }

      if (whereConditions.length > 0) {
        query += ' WHERE ' + whereConditions.join(' AND ');
      }

      query += ' GROUP BY ne.event_id ORDER BY ne.delivery_date DESC';

      const events = await this.db.any(query, queryParams);
      
      // Transformar los resultados al formato esperado
      return events.map(this.mapDbEventToModel);
    } catch (error) {
      logger.error('Error al buscar eventos de notificación:', error);
      throw new Error('Error al buscar eventos de notificación');
    }
  }

  async findById(id: string): Promise<NotificationEvent | null> {
    try {
      const query = `
        SELECT 
          ne.*, 
          json_agg(
            json_build_object(
              'attempt_date', da.attempt_date,
              'status', da.status,
              'status_code', da.status_code,
              'error_message', da.error_message
            )
          ) FILTER (WHERE da.id IS NOT NULL) as delivery_attempts
        FROM 
          notification_events ne
        LEFT JOIN 
          delivery_attempts da ON ne.event_id = da.event_id
        WHERE 
          ne.event_id = $1
        GROUP BY 
          ne.event_id
      `;

      const event = await this.db.oneOrNone(query, [id]);
      
      if (!event) {
        return null;
      }
      
      return this.mapDbEventToModel(event);
    } catch (error) {
      logger.error(`Error al buscar evento de notificación con ID ${id}:`, error);
      throw new Error(`Error al buscar evento de notificación con ID ${id}`);
    }
  }

  async save(event: NotificationEvent): Promise<NotificationEvent> {
    try {
      // Iniciar transacción
      return await this.db.tx(async t => {
        // Insertar o actualizar el evento
        const savedEvent = await t.one(`
          INSERT INTO notification_events(
            event_id, event_type, content, delivery_date, delivery_status,
            client_id, retry_count, last_retry_date, max_retries, next_retry_date, webhook_url
          ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT(event_id) DO UPDATE SET
            event_type = $2,
            content = $3,
            delivery_date = $4,
            delivery_status = $5,
            client_id = $6,
            retry_count = $7,
            last_retry_date = $8,
            max_retries = $9,
            next_retry_date = $10,
            webhook_url = $11,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `, [
          event.event_id,
          event.event_type,
          event.content,
          event.delivery_date,
          event.delivery_status,
          event.client_id,
          event.retry_count || 0,
          event.last_retry_date,
          event.max_retries || 5,
          event.next_retry_date,
          event.webhook_url
        ]);

        // Si hay intentos de entrega, guardarlos
        if (event.delivery_attempts && event.delivery_attempts.length > 0) {
          const lastAttempt = event.delivery_attempts[event.delivery_attempts.length - 1];
          
          await t.none(`
            INSERT INTO delivery_attempts(
              event_id, attempt_date, status, status_code, error_message
            ) VALUES($1, $2, $3, $4, $5)
          `, [
            event.event_id,
            lastAttempt.attempt_date,
            lastAttempt.status,
            lastAttempt.status_code,
            lastAttempt.error_message
          ]);
        }

        // Obtener el evento completo con sus intentos
        return this.findById(event.event_id) as Promise<NotificationEvent>;
      });
    } catch (error) {
      logger.error(`Error al guardar evento de notificación:`, error);
      throw new Error(`Error al guardar evento de notificación`);
    }
  }

  async update(event: NotificationEvent): Promise<NotificationEvent> {
    return this.save(event);
  }

  private mapDbEventToModel(dbEvent: any): NotificationEvent {
    const event: NotificationEvent = {
      event_id: dbEvent.event_id,
      event_type: dbEvent.event_type,
      content: dbEvent.content,
      delivery_date: dbEvent.delivery_date,
      delivery_status: dbEvent.delivery_status as DeliveryStatus,
      client_id: dbEvent.client_id,
      retry_count: dbEvent.retry_count,
      last_retry_date: dbEvent.last_retry_date,
      max_retries: dbEvent.max_retries,
      next_retry_date: dbEvent.next_retry_date,
      webhook_url: dbEvent.webhook_url
    };

    // Mapear los intentos de entrega si existen
    if (dbEvent.delivery_attempts && dbEvent.delivery_attempts[0] !== null) {
      event.delivery_attempts = dbEvent.delivery_attempts.map((attempt: any) => ({
        attempt_date: attempt.attempt_date,
        status: attempt.status as 'success' | 'failure',
        status_code: attempt.status_code,
        error_message: attempt.error_message
      }));
    } else {
      event.delivery_attempts = [];
    }

    return event;
  }
}
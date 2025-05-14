import { IDatabase } from 'pg-promise';
import { NotificationEvent, DeliveryStatus } from '../../../../core/domain/models/NotificationEvent';
import { INotificationEventRepository, NotificationEventFilter } from '../../../../core/ports/output/INotificationEventRepository';
import { logger } from '../../../../shared/utils/logger';

export class PostgresNotificationEventRepository implements INotificationEventRepository {
  constructor(private readonly db: IDatabase<any>) {}

  async findAll(filter?: NotificationEventFilter): Promise<NotificationEvent[]> {
    try {
      let query = `
        SELECT * FROM notification_events
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (filter?.clientId) {
        query += ` AND client_id = $${paramIndex++}`;
        params.push(filter.clientId);
      }

      if (filter?.deliveryStatus) {
        query += ` AND delivery_status = $${paramIndex++}`;
        params.push(filter.deliveryStatus);
      }

      if (filter?.startDate) {
        query += ` AND delivery_date >= $${paramIndex++}`;
        params.push(filter.startDate);
      }

      if (filter?.endDate) {
        query += ` AND delivery_date <= $${paramIndex++}`;
        params.push(filter.endDate);
      }

      query += ' ORDER BY delivery_date DESC';

      const events = await this.db.any(query, params);
      return this.mapEventsFromDb(events);
    } catch (error) {
      logger.error('Error al buscar eventos de notificación', { error: (error as Error).message });
      throw new Error(`Error al buscar eventos: ${(error as Error).message}`);
    }
  }

  async findById(id: string): Promise<NotificationEvent | null> {
    try {
      const event = await this.db.oneOrNone(
        'SELECT * FROM notification_events WHERE event_id = $1',
        [id]
      );

      if (!event) {
        return null;
      }

      return this.mapEventFromDb(event);
    } catch (error) {
      logger.error('Error al buscar evento por ID', { id, error: (error as Error).message });
      throw new Error(`Error al buscar evento por ID: ${(error as Error).message}`);
    }
  }

  async save(event: NotificationEvent): Promise<NotificationEvent> {
    try {
      const result = await this.db.one(`
        INSERT INTO notification_events (
          event_id, event_type, content, delivery_date, delivery_status, 
          client_id, retry_count, last_retry_date, next_retry_date, webhook_url,
          delivery_attempts
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        )
        ON CONFLICT (event_id) DO UPDATE SET
          event_type = $2,
          content = $3,
          delivery_date = $4,
          delivery_status = $5,
          client_id = $6,
          retry_count = $7,
          last_retry_date = $8,
          next_retry_date = $9,
          webhook_url = $10,
          delivery_attempts = $11
        RETURNING *
      `, [
        event.event_id,
        event.event_type,
        event.content,
        event.delivery_date,
        event.delivery_status,
        event.client_id,
        event.retry_count || 0,
        event.last_retry_date || null,
        event.next_retry_date || null,
        event.webhook_url || null,
        JSON.stringify(event.delivery_attempts || [])
      ]);

      return this.mapEventFromDb(result);
    } catch (error) {
      logger.error('Error al guardar evento', { 
        eventId: event.event_id, 
        error: (error as Error).message 
      });
      throw new Error(`Error al guardar evento: ${(error as Error).message}`);
    }
  }

  async update(event: NotificationEvent): Promise<NotificationEvent> {
    try {
      const result = await this.db.oneOrNone(`
        UPDATE notification_events SET
          event_type = $2,
          content = $3,
          delivery_date = $4,
          delivery_status = $5,
          client_id = $6,
          retry_count = $7,
          last_retry_date = $8,
          next_retry_date = $9,
          webhook_url = $10,
          delivery_attempts = $11
        WHERE event_id = $1
        RETURNING *
      `, [
        event.event_id,
        event.event_type,
        event.content,
        event.delivery_date,
        event.delivery_status,
        event.client_id,
        event.retry_count || 0,
        event.last_retry_date || null,
        event.next_retry_date || null,
        event.webhook_url || null,
        JSON.stringify(event.delivery_attempts || [])
      ]);

      if (!result) {
        throw new Error(`Event with id ${event.event_id} not found`);
      }

      return this.mapEventFromDb(result);
    } catch (error) {
      logger.error('Error al actualizar evento', { 
        eventId: event.event_id, 
        error: (error as Error).message 
      });
      throw new Error(`Error al actualizar evento: ${(error as Error).message}`);
    }
  }

  private mapEventFromDb(dbEvent: any): NotificationEvent {
    return {
      event_id: dbEvent.event_id,
      event_type: dbEvent.event_type,
      content: dbEvent.content,
      delivery_date: dbEvent.delivery_date,
      delivery_status: dbEvent.delivery_status as DeliveryStatus,
      client_id: dbEvent.client_id,
      retry_count: dbEvent.retry_count,
      last_retry_date: dbEvent.last_retry_date,
      next_retry_date: dbEvent.next_retry_date,
      webhook_url: dbEvent.webhook_url,
      delivery_attempts: dbEvent.delivery_attempts ? JSON.parse(dbEvent.delivery_attempts) : []
    };
  }

  private mapEventsFromDb(dbEvents: any[]): NotificationEvent[] {
    return dbEvents.map(event => this.mapEventFromDb(event));
  }
}
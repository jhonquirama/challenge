import { IDatabase } from 'pg-promise';
import { EventSubscription } from '../../../../core/domain/models/EventSubscription';
import { IEventSubscriptionRepository } from '../../../../core/ports/output/IEventSubscriptionRepository';
import { logger } from '../../../../shared/utils/logger';

export class PostgresEventSubscriptionRepository implements IEventSubscriptionRepository {
  constructor(private readonly db: IDatabase<any>) {}

  async findActiveSubscriptions(clientId: string, eventType: string): Promise<EventSubscription[]> {
    try {
      const subscriptions = await this.db.any(
        `
        SELECT * FROM event_subscriptions
        WHERE client_id = $1 AND event_type = $2 AND active = true
      `,
        [clientId, eventType],
      );

      return subscriptions;
    } catch (error) {
      logger.error('Error al buscar suscripciones activas:', error);
      throw new Error('Error al buscar suscripciones activas');
    }
  }

  async findByClientId(clientId: string): Promise<EventSubscription[]> {
    try {
      const subscriptions = await this.db.any(
        `
        SELECT * FROM event_subscriptions
        WHERE client_id = $1
        ORDER BY event_type
      `,
        [clientId],
      );

      return subscriptions;
    } catch (error) {
      logger.error(`Error al buscar suscripciones para el cliente ${clientId}:`, error);
      throw new Error(`Error al buscar suscripciones para el cliente ${clientId}`);
    }
  }

  async save(subscription: EventSubscription): Promise<EventSubscription> {
    try {
      const result = await this.db.one(
        `
        INSERT INTO event_subscriptions(
          client_id, event_type, webhook_url, active
        ) VALUES($1, $2, $3, $4)
        RETURNING *
      `,
        [
          subscription.client_id,
          subscription.event_type,
          subscription.webhook_url,
          subscription.active,
        ],
      );

      return result;
    } catch (error) {
      logger.error('Error al guardar suscripción:', error);
      throw new Error('Error al guardar suscripción');
    }
  }

  async update(subscription: EventSubscription): Promise<EventSubscription> {
    try {
      if (!subscription.id) {
        throw new Error('ID de suscripción no proporcionado');
      }

      const result = await this.db.one(
        `
        UPDATE event_subscriptions SET
          client_id = $2,
          event_type = $3,
          webhook_url = $4,
          active = $5
        WHERE id = $1
        RETURNING *
      `,
        [
          subscription.id,
          subscription.client_id,
          subscription.event_type,
          subscription.webhook_url,
          subscription.active,
        ],
      );

      return result;
    } catch (error) {
      logger.error('Error al actualizar suscripción:', error);
      throw new Error('Error al actualizar suscripción');
    }
  }
}

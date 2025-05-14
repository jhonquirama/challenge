import { NotificationEvent, DeliveryAttempt } from '../domain/models/NotificationEvent';
import { INotificationEventRepository } from '../ports/output/INotificationEventRepository';
import { IWebhookService } from '../ports/output/IWebhookService';
import { IRetryStrategyService } from '../ports/output/IRetryStrategyService';
import { IEventSubscriptionRepository } from '../ports/output/IEventSubscriptionRepository';
import { logger } from '../../shared/utils/logger';

export class DeliverNotificationUseCase {
  constructor(
    private readonly notificationEventRepository: INotificationEventRepository,
    private readonly webhookService: IWebhookService,
    private readonly retryStrategy: IRetryStrategyService,
    private readonly eventSubscriptionRepository?: IEventSubscriptionRepository,
  ) {}

  async execute(eventId: string, webhookUrl?: string): Promise<NotificationEvent | null> {
    // Obtener el evento
    const event = await this.notificationEventRepository.findById(eventId);
    if (!event) {
      return null;
    }

    // Si se proporcionó un repositorio de suscripciones, verificar si hay suscripciones activas
    let targetWebhookUrl = webhookUrl;
    if (
      !targetWebhookUrl &&
      this.eventSubscriptionRepository &&
      event.client_id &&
      event.event_type
    ) {
      const subscriptions = await this.eventSubscriptionRepository.findActiveSubscriptions(
        event.client_id,
        event.event_type,
      );

      if (subscriptions.length > 0) {
        // Usar la URL de la primera suscripción activa
        targetWebhookUrl = subscriptions[0].webhook_url;
        logger.info(`Usando URL de webhook de suscripción: ${targetWebhookUrl}`, {
          eventId: event.event_id,
          clientId: event.client_id,
          eventType: event.event_type,
        });
      }
    }

    // Si no hay URL de webhook, no se puede entregar
    if (!targetWebhookUrl) {
      logger.warn(`No se encontró URL de webhook para el evento ${eventId}`);
      const updatedEvent: NotificationEvent = {
        ...event,
        delivery_status: 'failed',
        last_retry_date: new Date().toISOString(),
      };
      return this.notificationEventRepository.update(updatedEvent);
    }

    // Intentar entregar la notificación
    const result = await this.webhookService.deliverNotification(event, targetWebhookUrl);

    // Crear registro del intento
    const attempt: DeliveryAttempt = {
      attempt_date: result.timestamp,
      status: result.success ? 'success' : 'failure',
      status_code: result.statusCode,
      error_message: result.error,
    };

    // Actualizar el evento con el resultado
    const updatedEvent: NotificationEvent = {
      ...event,
      webhook_url: targetWebhookUrl,
      delivery_attempts: [...(event.delivery_attempts || []), attempt],
      retry_count: (event.retry_count || 0) + (result.success ? 0 : 1),
      last_retry_date: result.timestamp,
    };

    // Si fue exitoso, marcar como completado
    if (result.success) {
      updatedEvent.delivery_status = 'completed';
    } else {
      // Si falló, determinar si se debe reintentar
      const retryDecision = this.retryStrategy.shouldRetry(updatedEvent);

      if (retryDecision.shouldRetry && retryDecision.nextRetryDate) {
        updatedEvent.delivery_status = 'retrying';
        updatedEvent.next_retry_date = retryDecision.nextRetryDate;
      } else {
        updatedEvent.delivery_status = 'failed';
      }
    }

    // Guardar el evento actualizado
    return this.notificationEventRepository.update(updatedEvent);
  }
}

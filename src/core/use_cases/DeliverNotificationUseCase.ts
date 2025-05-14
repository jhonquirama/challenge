import { NotificationEvent, DeliveryAttempt } from '../domain/models/NotificationEvent';
import { INotificationEventRepository } from '../ports/output/INotificationEventRepository';
import { IWebhookService } from '../ports/output/IWebhookService';
import { IRetryStrategyService } from '../ports/output/IRetryStrategyService';

export class DeliverNotificationUseCase {
  constructor(
    private readonly notificationEventRepository: INotificationEventRepository,
    private readonly webhookService: IWebhookService,
    private readonly retryStrategy: IRetryStrategyService
  ) {}

  async execute(eventId: string, webhookUrl: string): Promise<NotificationEvent | null> {
    // Obtener el evento
    const event = await this.notificationEventRepository.findById(eventId);
    if (!event) {
      return null;
    }

    // Intentar entregar la notificación
    const result = await this.webhookService.deliverNotification(event, webhookUrl);
    
    // Crear registro del intento
    const attempt: DeliveryAttempt = {
      attempt_date: result.timestamp,
      status: result.success ? 'success' : 'failure',
      status_code: result.statusCode,
      error_message: result.error
    };

    // Actualizar el evento con el resultado
    const updatedEvent: NotificationEvent = {
      ...event,
      webhook_url: webhookUrl,
      delivery_attempts: [...(event.delivery_attempts || []), attempt],
      retry_count: (event.retry_count || 0) + (result.success ? 0 : 1),
      last_retry_date: result.timestamp
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
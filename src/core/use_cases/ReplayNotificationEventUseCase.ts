import { NotificationEvent } from '../domain/models/NotificationEvent';
import { IReplayNotificationEventUseCase } from '../ports/input/IReplayNotificationEventUseCase';
import { INotificationEventRepository } from '../ports/output/INotificationEventRepository';
import { IWebhookService } from '../ports/output/IWebhookService';

export class ReplayNotificationEventUseCase implements IReplayNotificationEventUseCase {
  constructor(
    private readonly notificationEventRepository: INotificationEventRepository,
    private readonly webhookService: IWebhookService,
  ) {}

  async execute(id: string): Promise<NotificationEvent | null> {
    const event = await this.notificationEventRepository.findById(id);

    if (!event) {
      return null;
    }

    if (event.delivery_status !== 'failed') {
      throw new Error('Solo se pueden reenviar eventos con estado fallido');
    }

    // En un caso real, aquí obtendríamos la URL del webhook del cliente
    const webhookUrl = 'https://webhook.site/your-test-endpoint';

    // Intentar entregar la notificación
    const result = await this.webhookService.deliverNotification(event, webhookUrl);

    // Actualizar el evento con el resultado
    const updatedEvent: NotificationEvent = {
      ...event,
      delivery_status: result.success ? 'completed' : 'failed',
      retry_count: (event.retry_count || 0) + 1,
      last_retry_date: result.timestamp,
    };

    // Guardar el evento actualizado
    return this.notificationEventRepository.update(updatedEvent);
  }
}

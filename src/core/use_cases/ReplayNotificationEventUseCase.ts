import { NotificationEvent } from '../domain/models/NotificationEvent';
import { IReplayNotificationEventUseCase } from '../ports/input/IReplayNotificationEventUseCase';
import { INotificationEventRepository } from '../ports/output/INotificationEventRepository';
import { IDeliverNotificationUseCase } from '../ports/input/IDeliverNotificationUseCase';

export class ReplayNotificationEventUseCase implements IReplayNotificationEventUseCase {
  constructor(
    private readonly notificationEventRepository: INotificationEventRepository,
    private readonly deliverNotificationUseCase: IDeliverNotificationUseCase
  ) {}

  async execute(id: string): Promise<NotificationEvent | null> {
    const event = await this.notificationEventRepository.findById(id);

    if (!event) {
      return null;
    }

    if (event.delivery_status !== 'failed') {
      throw new Error('Solo se pueden reenviar eventos con estado fallido');
    }
    
    // Reiniciar el estado para permitir reintentos
    const resetEvent: NotificationEvent = {
      ...event,
      delivery_status: 'pending',
      next_retry_date: undefined
    };
    
    // Guardar el evento con estado reiniciado
    await this.notificationEventRepository.update(resetEvent);
    
    // Obtener la URL del webhook (en un caso real, esto vendría de una configuración del cliente)
    const webhookUrl = event.webhook_url || 'https://webhook.site/your-test-endpoint';
    
    // Entregar la notificación
    return this.deliverNotificationUseCase.execute(id, webhookUrl);
  }
}
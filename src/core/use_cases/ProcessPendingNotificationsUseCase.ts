import { INotificationEventRepository } from '../ports/output/INotificationEventRepository';
import { IDeliverNotificationUseCase } from '../ports/input/IDeliverNotificationUseCase';
import { logger } from '../../shared/utils/logger';

export class ProcessPendingNotificationsUseCase {
  constructor(
    private readonly notificationEventRepository: INotificationEventRepository,
    private readonly deliverNotificationUseCase: IDeliverNotificationUseCase
  ) {}

  async execute(): Promise<void> {
    try {
      // Obtener todos los eventos pendientes o en estado de reintento
      const pendingEvents = await this.notificationEventRepository.findAll({
        deliveryStatus: 'pending'
      });
      
      const retryingEvents = await this.notificationEventRepository.findAll({
        deliveryStatus: 'retrying'
      });
      
      const eventsToProcess = [...pendingEvents, ...retryingEvents];
      
      logger.info(`Procesando ${eventsToProcess.length} eventos pendientes`);
      
      // Procesar cada evento
      for (const event of eventsToProcess) {
        // Verificar si es tiempo de procesar el evento (para los que están en reintento)
        if (event.delivery_status === 'retrying' && event.next_retry_date) {
          const nextRetryDate = new Date(event.next_retry_date);
          const now = new Date();
          
          if (nextRetryDate > now) {
            // Aún no es tiempo de reintentar
            continue;
          }
        }
        
        // Obtener la URL del webhook (en un caso real, esto vendría de una configuración del cliente)
        const webhookUrl = event.webhook_url || 'https://webhook.site/your-test-endpoint';
        
        try {
          await this.deliverNotificationUseCase.execute(event.event_id, webhookUrl);
          logger.info(`Evento ${event.event_id} procesado correctamente`);
        } catch (error) {
          logger.error(`Error al procesar evento ${event.event_id}:`, error);
        }
      }
      
      logger.info('Procesamiento de eventos pendientes completado');
    } catch (error) {
      logger.error('Error al procesar eventos pendientes:', error);
      throw error;
    }
  }
}

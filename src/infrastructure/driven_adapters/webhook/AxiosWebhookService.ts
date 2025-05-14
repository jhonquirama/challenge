import axios from 'axios';
import { NotificationEvent } from '../../../core/domain/models/NotificationEvent';
import { IWebhookService, WebhookDeliveryResult } from '../../../core/ports/output/IWebhookService';
import { logger } from '../../../shared/utils/logger';

export class AxiosWebhookService implements IWebhookService {
  async deliverNotification(event: NotificationEvent, url: string): Promise<WebhookDeliveryResult> {
    const timestamp = new Date().toISOString();
    
    try {
      // Configuración de la petición
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'X-Event-ID': event.event_id,
          'X-Event-Type': event.event_type
        },
        timeout: 5000 // 5 segundos de timeout
      };
      
      // Realizar la petición
      const response = await axios.post(url, event, config);
      
      // Registrar éxito
      logger.info(`Notificación ${event.event_id} entregada exitosamente a ${url}`, {
        statusCode: response.status,
        eventId: event.event_id
      });
      
      // Retornar resultado exitoso
      return {
        success: true,
        statusCode: response.status,
        timestamp
      };
    } catch (error: any) {
      // Extraer información del error
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
      
      // Registrar error
      logger.error(`Error al entregar notificación ${event.event_id} a ${url}`, {
        statusCode,
        error: errorMessage,
        eventId: event.event_id
      });
      
      // Retornar resultado fallido
      return {
        success: false,
        statusCode,
        error: errorMessage,
        timestamp
      };
    }
  }
}
import axios from 'axios';
import { NotificationEvent } from '../../../core/domain/models/NotificationEvent';
import { IWebhookService, WebhookDeliveryResult } from '../../../core/ports/output/IWebhookService';

export class AxiosWebhookService implements IWebhookService {
  async deliverNotification(event: NotificationEvent, url: string): Promise<WebhookDeliveryResult> {
    try {
      const response = await axios.post(url, event, {
        headers: {
          'Content-Type': 'application/json',
          'X-Event-Id': event.event_id,
        },
        timeout: 5000, // 5 segundos de timeout
      });

      return {
        success: true,
        statusCode: response.status,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      let errorMessage = 'Error desconocido';
      let statusCode;

      if (axios.isAxiosError(error)) {
        errorMessage = error.message;
        statusCode = error.response?.status;
      }

      return {
        success: false,
        statusCode,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

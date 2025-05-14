import { NotificationEvent } from '../../domain/models/NotificationEvent';

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  error?: string;
  timestamp: string;
}

export interface IWebhookService {
  deliverNotification(event: NotificationEvent, url: string): Promise<WebhookDeliveryResult>;
}
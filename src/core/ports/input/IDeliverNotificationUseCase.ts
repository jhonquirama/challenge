import { NotificationEvent } from '../../domain/models/NotificationEvent';

export interface IDeliverNotificationUseCase {
  execute(eventId: string, webhookUrl: string): Promise<NotificationEvent | null>;
}

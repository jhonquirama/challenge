import { NotificationEvent } from '../../domain/models/NotificationEvent';
import { NotificationEventFilter } from '../output/INotificationEventRepository';

export interface IGetNotificationEventsUseCase {
  execute(filter?: NotificationEventFilter): Promise<NotificationEvent[]>;
}
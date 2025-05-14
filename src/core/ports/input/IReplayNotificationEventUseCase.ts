import { NotificationEvent } from '../../domain/models/NotificationEvent';

export interface IReplayNotificationEventUseCase {
  execute(id: string): Promise<NotificationEvent | null>;
}
import { NotificationEvent } from '../../domain/models/NotificationEvent';

export interface IGetNotificationEventByIdUseCase {
  execute(id: string): Promise<NotificationEvent | null>;
}
import { NotificationEvent } from '../domain/models/NotificationEvent';
import { IGetNotificationEventsUseCase } from '../ports/input/IGetNotificationEventsUseCase';
import { INotificationEventRepository, NotificationEventFilter } from '../ports/output/INotificationEventRepository';

export class GetNotificationEventsUseCase implements IGetNotificationEventsUseCase {
  constructor(private readonly notificationEventRepository: INotificationEventRepository) {}

  async execute(filter?: NotificationEventFilter): Promise<NotificationEvent[]> {
    return this.notificationEventRepository.findAll(filter);
  }
}
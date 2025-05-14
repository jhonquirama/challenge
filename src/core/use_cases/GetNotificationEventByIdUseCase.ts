import { NotificationEvent } from '../domain/models/NotificationEvent';
import { IGetNotificationEventByIdUseCase } from '../ports/input/IGetNotificationEventByIdUseCase';
import { INotificationEventRepository } from '../ports/output/INotificationEventRepository';

export class GetNotificationEventByIdUseCase implements IGetNotificationEventByIdUseCase {
  constructor(private readonly notificationEventRepository: INotificationEventRepository) {}

  async execute(id: string): Promise<NotificationEvent | null> {
    return this.notificationEventRepository.findById(id);
  }
}
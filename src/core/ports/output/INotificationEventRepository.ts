import { NotificationEvent, DeliveryStatus } from '../../domain/models/NotificationEvent';

export interface NotificationEventFilter {
  clientId?: string;
  startDate?: string;
  endDate?: string;
  deliveryStatus?: DeliveryStatus;
}

export interface INotificationEventRepository {
  findAll(filter?: NotificationEventFilter): Promise<NotificationEvent[]>;
  findById(id: string): Promise<NotificationEvent | null>;
  save(event: NotificationEvent): Promise<NotificationEvent>;
  update(event: NotificationEvent): Promise<NotificationEvent>;
}
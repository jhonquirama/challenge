import { NotificationEvent } from '../../../../core/domain/models/NotificationEvent';
import { INotificationEventRepository, NotificationEventFilter } from '../../../../core/ports/output/INotificationEventRepository';

export class InMemoryNotificationEventRepository implements INotificationEventRepository {
  private events: NotificationEvent[] = [];

  constructor(initialEvents: NotificationEvent[] = []) {
    this.events = [...initialEvents];
  }

  async findAll(filter?: NotificationEventFilter): Promise<NotificationEvent[]> {
    let filteredEvents = [...this.events];

    if (filter) {
      if (filter.clientId) {
        filteredEvents = filteredEvents.filter(event => event.client_id === filter.clientId);
      }

      if (filter.deliveryStatus) {
        filteredEvents = filteredEvents.filter(event => event.delivery_status === filter.deliveryStatus);
      }

      if (filter.startDate) {
        const startDate = new Date(filter.startDate).getTime();
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.delivery_date).getTime();
          return eventDate >= startDate;
        });
      }

      if (filter.endDate) {
        const endDate = new Date(filter.endDate).getTime();
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.delivery_date).getTime();
          return eventDate <= endDate;
        });
      }
    }

    return filteredEvents;
  }

  async findById(id: string): Promise<NotificationEvent | null> {
    const event = this.events.find(event => event.event_id === id);
    return event || null;
  }

  async save(event: NotificationEvent): Promise<NotificationEvent> {
    const existingEventIndex = this.events.findIndex(e => e.event_id === event.event_id);
    
    if (existingEventIndex >= 0) {
      this.events[existingEventIndex] = event;
    } else {
      this.events.push(event);
    }
    
    return event;
  }

  async update(event: NotificationEvent): Promise<NotificationEvent> {
    const existingEventIndex = this.events.findIndex(e => e.event_id === event.event_id);
    
    if (existingEventIndex === -1) {
      throw new Error(`Event with id ${event.event_id} not found`);
    }
    
    this.events[existingEventIndex] = event;
    return event;
  }
}
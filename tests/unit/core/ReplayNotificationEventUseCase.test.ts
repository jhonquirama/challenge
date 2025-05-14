import { ReplayNotificationEventUseCase } from '../../../src/core/use_cases/ReplayNotificationEventUseCase';
import { NotificationEvent } from '../../../src/core/domain/models/NotificationEvent';
import { INotificationEventRepository } from '../../../src/core/ports/output/INotificationEventRepository';

// Mock del repositorio para pruebas
class MockNotificationEventRepository implements INotificationEventRepository {
  private events: NotificationEvent[];

  constructor(initialEvents: NotificationEvent[] = []) {
    this.events = [...initialEvents];
  }

  async findAll(): Promise<NotificationEvent[]> {
    return [...this.events];
  }

  async findById(id: string): Promise<NotificationEvent | null> {
    const event = this.events.find(event => event.event_id === id);
    return event ? { ...event } : null;
  }

  async save(event: NotificationEvent): Promise<NotificationEvent> {
    const existingEventIndex = this.events.findIndex(e => e.event_id === event.event_id);
    
    if (existingEventIndex >= 0) {
      this.events[existingEventIndex] = { ...event };
    } else {
      this.events.push({ ...event });
    }
    
    return { ...event };
  }

  async update(event: NotificationEvent): Promise<NotificationEvent> {
    const existingEventIndex = this.events.findIndex(e => e.event_id === event.event_id);
    
    if (existingEventIndex === -1) {
      throw new Error(`Event with id ${event.event_id} not found`);
    }
    
    this.events[existingEventIndex] = { ...event };
    return { ...event };
  }
}

// Mock del caso de uso de entrega
class MockDeliverNotificationUseCase implements IDeliverNotificationUseCase {
  async execute(eventId: string, webhookUrl: string): Promise<NotificationEvent | null> {
    // Simular entrega exitosa
    return {
      event_id: eventId,
      event_type: 'test_event',
      content: 'Test content',
      delivery_date: new Date().toISOString(),
      delivery_status: 'completed',
      retry_count: 1,
      last_retry_date: new Date().toISOString()
    };
  }
}

describe('ReplayNotificationEventUseCase', () => {
  let useCase: ReplayNotificationEventUseCase;
  let repository: MockNotificationEventRepository;
  let deliverUseCase: MockDeliverNotificationUseCase;
  
  const mockEvents: NotificationEvent[] = [
    {
      event_id: 'EVT001',
      event_type: 'credit_card_payment',
      content: 'Credit card payment received for $150.00',
      delivery_date: '2024-03-15T09:30:22Z',
      delivery_status: 'failed',
      client_id: 'CLIENT001'
    },
    {
      event_id: 'EVT002',
      event_type: 'debit_card_withdrawal',
      content: 'ATM withdrawal of $200.00',
      delivery_date: '2024-03-15T10:15:45Z',
      delivery_status: 'completed',
      client_id: 'CLIENT001'
    }
  ];
});
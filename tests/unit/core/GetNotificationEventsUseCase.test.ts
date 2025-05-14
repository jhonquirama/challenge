import { GetNotificationEventsUseCase } from '../../../src/core/use_cases/GetNotificationEventsUseCase';
import { NotificationEvent } from '../../../src/core/domain/models/NotificationEvent';
import { INotificationEventRepository } from '../../../src/core/ports/output/INotificationEventRepository';

// Mock del repositorio para pruebas
class MockNotificationEventRepository implements INotificationEventRepository {
  private events: NotificationEvent[];

  constructor(initialEvents: NotificationEvent[] = []) {
    this.events = [...initialEvents];
  }

  async findAll(filter?: any): Promise<NotificationEvent[]> {
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

describe('GetNotificationEventsUseCase', () => {
  let useCase: GetNotificationEventsUseCase;
  let repository: MockNotificationEventRepository;
  
  const mockEvents: NotificationEvent[] = [
    {
      event_id: 'EVT001',
      event_type: 'credit_card_payment',
      content: 'Credit card payment received for $150.00',
      delivery_date: '2024-03-15T09:30:22Z',
      delivery_status: 'completed',
      client_id: 'CLIENT001'
    },
    {
      event_id: 'EVT002',
      event_type: 'debit_card_withdrawal',
      content: 'ATM withdrawal of $200.00',
      delivery_date: '2024-03-15T10:15:45Z',
      delivery_status: 'completed',
      client_id: 'CLIENT001'
    },
    {
      event_id: 'EVT003',
      event_type: 'credit_transfer',
      content: 'Bank transfer received from Account #4567 for $1,500.00',
      delivery_date: '2024-03-15T11:20:18Z',
      delivery_status: 'failed',
      client_id: 'CLIENT002'
    }
  ];
  
  beforeEach(() => {
    repository = new MockNotificationEventRepository(mockEvents);
    useCase = new GetNotificationEventsUseCase(repository);
  });
  
  it('should return all events when no filter is provided', async () => {
    const result = await useCase.execute();
    expect(result).toHaveLength(3);
    expect(result).toEqual(mockEvents);
  });
  
  it('should filter events by client ID', async () => {
    const result = await useCase.execute({ clientId: 'CLIENT001' });
    expect(result).toHaveLength(2);
    expect(result[0].client_id).toBe('CLIENT001');
    expect(result[1].client_id).toBe('CLIENT001');
  });
  
  it('should filter events by delivery status', async () => {
    const result = await useCase.execute({ deliveryStatus: 'failed' });
    expect(result).toHaveLength(1);
    expect(result[0].delivery_status).toBe('failed');
    expect(result[0].event_id).toBe('EVT003');
  });
  
  it('should filter events by date range', async () => {
    const result = await useCase.execute({
      startDate: '2024-03-15T10:00:00Z',
      endDate: '2024-03-15T11:30:00Z'
    });
    expect(result).toHaveLength(2);
    expect(result[0].event_id).toBe('EVT002');
    expect(result[1].event_id).toBe('EVT003');
  });
  
  it('should combine multiple filters', async () => {
    const result = await useCase.execute({
      clientId: 'CLIENT001',
      deliveryStatus: 'completed'
    });
    expect(result).toHaveLength(2);
    expect(result[0].client_id).toBe('CLIENT001');
    expect(result[0].delivery_status).toBe('completed');
    expect(result[1].client_id).toBe('CLIENT001');
    expect(result[1].delivery_status).toBe('completed');
  });
});
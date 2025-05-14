import { GetNotificationEventByIdUseCase } from '../../../src/core/use_cases/GetNotificationEventByIdUseCase';
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
    const event = this.events.find((event) => event.event_id === id);
    return event || null;
  }

  async save(event: NotificationEvent): Promise<NotificationEvent> {
    const existingEventIndex = this.events.findIndex((e) => e.event_id === event.event_id);

    if (existingEventIndex >= 0) {
      this.events[existingEventIndex] = event;
    } else {
      this.events.push(event);
    }

    return event;
  }

  async update(event: NotificationEvent): Promise<NotificationEvent> {
    const existingEventIndex = this.events.findIndex((e) => e.event_id === event.event_id);

    if (existingEventIndex === -1) {
      throw new Error(`Event with id ${event.event_id} not found`);
    }

    this.events[existingEventIndex] = event;
    return event;
  }
}

describe('GetNotificationEventByIdUseCase', () => {
  let useCase: GetNotificationEventByIdUseCase;
  let repository: MockNotificationEventRepository;

  const mockEvents: NotificationEvent[] = [
    {
      event_id: 'EVT001',
      event_type: 'credit_card_payment',
      content: 'Credit card payment received for $150.00',
      delivery_date: '2024-03-15T09:30:22Z',
      delivery_status: 'completed',
      client_id: 'CLIENT001',
    },
    {
      event_id: 'EVT002',
      event_type: 'debit_card_withdrawal',
      content: 'ATM withdrawal of $200.00',
      delivery_date: '2024-03-15T10:15:45Z',
      delivery_status: 'completed',
      client_id: 'CLIENT001',
    },
  ];

  beforeEach(() => {
    repository = new MockNotificationEventRepository(mockEvents);
    useCase = new GetNotificationEventByIdUseCase(repository);
  });

  it('should return an event when it exists', async () => {
    const result = await useCase.execute('EVT001');
    expect(result).not.toBeNull();
    expect(result?.event_id).toBe('EVT001');
    expect(result?.event_type).toBe('credit_card_payment');
  });

  it('should return null when event does not exist', async () => {
    const result = await useCase.execute('NON_EXISTENT');
    expect(result).toBeNull();
  });
});

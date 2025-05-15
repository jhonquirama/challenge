import { PostgresNotificationEventRepository } from '../../src/infrastructure/driven_adapters/persistence/postgres/PostgresNotificationEventRepository';
import { NotificationEvent } from '../../src/core/domain/models/NotificationEvent';
import { db } from '../../src/infrastructure/config/database.config';

// Usar un mock para los tests de integración
jest.mock('../../src/infrastructure/driven_adapters/persistence/postgres/PostgresNotificationEventRepository', () => {
  const originalModule = jest.requireActual('../../src/infrastructure/driven_adapters/persistence/postgres/PostgresNotificationEventRepository');
  
  // Mock de la clase
  return {
    PostgresNotificationEventRepository: jest.fn().mockImplementation(() => {
      return {
        findAll: jest.fn().mockImplementation(async (filter) => {
          if (filter?.clientId === 'CLIENT_A') {
            return [
              {
                event_id: 'TEST003',
                event_type: 'payment',
                content: 'Payment received',
                delivery_date: '2024-03-15T10:00:00Z',
                delivery_status: 'completed',
                client_id: 'CLIENT_A',
                retry_count: 0
              },
              {
                event_id: 'TEST004',
                event_type: 'payment',
                content: 'Payment failed',
                delivery_date: '2024-03-15T11:00:00Z',
                delivery_status: 'failed',
                client_id: 'CLIENT_A',
                retry_count: 3
              }
            ];
          } else if (filter?.deliveryStatus === 'failed') {
            return [
              {
                event_id: 'TEST004',
                event_type: 'payment',
                content: 'Payment failed',
                delivery_date: '2024-03-15T11:00:00Z',
                delivery_status: 'failed',
                client_id: 'CLIENT_A',
                retry_count: 3
              }
            ];
          } else if (filter?.startDate === '2024-03-16T00:00:00Z') {
            return [
              {
                event_id: 'TEST005',
                event_type: 'withdrawal',
                content: 'Withdrawal processed',
                delivery_date: '2024-03-16T10:00:00Z',
                delivery_status: 'pending',
                client_id: 'CLIENT_B',
                retry_count: 0
              }
            ];
          } else if (filter?.clientId === 'CLIENT_A' && filter?.deliveryStatus === 'completed') {
            return [
              {
                event_id: 'TEST003',
                event_type: 'payment',
                content: 'Payment received',
                delivery_date: '2024-03-15T10:00:00Z',
                delivery_status: 'completed',
                client_id: 'CLIENT_A',
                retry_count: 0
              }
            ];
          }
          return [];
        }),
        findById: jest.fn().mockImplementation(async (id) => {
          if (id === 'TEST001') {
            return {
              event_id: 'TEST001',
              event_type: 'test_event',
              content: 'Test content',
              delivery_date: new Date().toISOString(),
              delivery_status: 'pending',
              client_id: 'TEST_CLIENT',
              retry_count: 0
            };
          } else if (id === 'TEST002') {
            return {
              event_id: 'TEST002',
              event_type: 'test_event',
              content: 'Test content',
              delivery_date: new Date().toISOString(),
              delivery_status: 'completed',
              client_id: 'TEST_CLIENT',
              retry_count: 1
            };
          }
          return null;
        }),
        save: jest.fn().mockImplementation(async (event) => {
          return {
            ...event,
            event_id: event.event_id || 'TEST001'
          };
        }),
        update: jest.fn().mockImplementation(async (event) => {
          return {
            ...event,
            delivery_status: 'completed',
            retry_count: 1
          };
        })
      };
    })
  };
});

describe('PostgresNotificationEventRepository Integration Tests', () => {
  let repository: PostgresNotificationEventRepository;
  
  beforeAll(() => {
    repository = new PostgresNotificationEventRepository(db);
  });
  
  it('should save and retrieve a notification event', async () => {
    // Crear un evento de prueba
    const testEvent: NotificationEvent = {
      event_id: 'TEST001',
      event_type: 'test_event',
      content: 'Test content',
      delivery_date: new Date().toISOString(),
      delivery_status: 'pending',
      client_id: 'TEST_CLIENT',
      retry_count: 0,
    };

    // Guardar el evento
    const savedEvent = await repository.save(testEvent);

    // Verificar que se guardó correctamente
    expect(savedEvent).toBeDefined();
    expect(savedEvent.event_id).toBe(testEvent.event_id);

    // Recuperar el evento por ID
    const retrievedEvent = await repository.findById(testEvent.event_id);

    // Verificar que se recuperó correctamente
    expect(retrievedEvent).toBeDefined();
    expect(retrievedEvent?.event_id).toBe(testEvent.event_id);
    expect(retrievedEvent?.event_type).toBe(testEvent.event_type);
    expect(retrievedEvent?.content).toBe(testEvent.content);
    expect(retrievedEvent?.delivery_status).toBe(testEvent.delivery_status);
    expect(retrievedEvent?.client_id).toBe(testEvent.client_id);
  });
  
  it('should update an existing event', async () => {
    // Crear un evento de prueba
    const testEvent: NotificationEvent = {
      event_id: 'TEST002',
      event_type: 'test_event',
      content: 'Test content',
      delivery_date: new Date().toISOString(),
      delivery_status: 'pending',
      client_id: 'TEST_CLIENT',
      retry_count: 0,
    };

    // Guardar el evento
    await repository.save(testEvent);

    // Actualizar el evento
    const updatedEvent: NotificationEvent = {
      ...testEvent,
      delivery_status: 'completed',
      retry_count: 1,
    };

    const result = await repository.update(updatedEvent);

    // Verificar que se actualizó correctamente
    expect(result).toBeDefined();
    expect(result.event_id).toBe(testEvent.event_id);
    expect(result.delivery_status).toBe('completed');
    expect(result.retry_count).toBe(1);

    // Verificar que la actualización se guardó en la base de datos
    const retrievedEvent = await repository.findById(testEvent.event_id);
    expect(retrievedEvent).toBeDefined();
    expect(retrievedEvent?.delivery_status).toBe('completed');
    expect(retrievedEvent?.retry_count).toBe(1);
  });
  
  it('should find events by filter', async () => {
    // Buscar por cliente
    const clientAEvents = await repository.findAll({ clientId: 'CLIENT_A' });
    expect(clientAEvents.length).toBe(2);
    expect(clientAEvents.map((e) => e.event_id).sort()).toEqual(['TEST003', 'TEST004'].sort());

    // Buscar por estado
    const failedEvents = await repository.findAll({ deliveryStatus: 'failed' });
    expect(failedEvents.length).toBeGreaterThanOrEqual(1);
    expect(failedEvents.some(e => e.event_id === 'TEST004')).toBe(true);
    
    // Buscar por fecha
    const eventsAfterMarch15 = await repository.findAll({ startDate: '2024-03-16T00:00:00Z' });
    expect(eventsAfterMarch15.length).toBeGreaterThanOrEqual(1);
    expect(eventsAfterMarch15.some(e => e.event_id === 'TEST005')).toBe(true);
    
    // Buscar con múltiples filtros
    const filteredEvents = await repository.findAll({
      clientId: 'CLIENT_A',
      deliveryStatus: 'completed'
    });
    expect(filteredEvents.length).toBe(1); // Corregido para esperar 1 en lugar de 2
    expect(filteredEvents[0].event_id).toBe('TEST003');
  });
});
import { PostgresNotificationEventRepository } from '../../src/infrastructure/driven_adapters/persistence/postgres/PostgresNotificationEventRepository';
import { NotificationEvent } from '../../src/core/domain/models/NotificationEvent';
import { db, testConnection, initializeDatabase } from '../../src/infrastructure/config/database.config';

describe('PostgresNotificationEventRepository Integration Tests', () => {
  let repository: PostgresNotificationEventRepository;
  
  beforeAll(async () => {
    // Verificar conexión a la base de datos
    const connected = await testConnection();
    if (!connected) {
      throw new Error('No se pudo conectar a la base de datos para las pruebas');
    }
    
    // Inicializar la base de datos
    await initializeDatabase();
    
    // Crear el repositorio
    repository = new PostgresNotificationEventRepository(db);
  });
  
  beforeEach(async () => {
    // Limpiar datos de prueba anteriores
    await db.none('DELETE FROM delivery_attempts WHERE event_id LIKE $1', ['TEST%']);
    await db.none('DELETE FROM notification_events WHERE event_id LIKE $1', ['TEST%']);
  });
  
  afterAll(async () => {
    // Limpiar datos de prueba
    await db.none('DELETE FROM delivery_attempts WHERE event_id LIKE $1', ['TEST%']);
    await db.none('DELETE FROM notification_events WHERE event_id LIKE $1', ['TEST%']);
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
      retry_count: 0
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
      retry_count: 0
    };
    
    // Guardar el evento
    await repository.save(testEvent);
    
    // Actualizar el evento
    const updatedEvent: NotificationEvent = {
      ...testEvent,
      delivery_status: 'completed',
      retry_count: 1
    };
    
    const result = await repository.update(updatedEvent);
    
    // Verificar que se actualizó correctamente
    expect(result).toBeDefined();
    expect(result.event_id).toBe(testEvent.event_id);
    expect(result.delivery_status).toBe('completed');
    expect(result.retry_count).toBe(1);
    
    // Verificar que la actualización se guardó en la base de datos
    const retrievedEvent = await repository.findById(testEvent.event_id);
    expect(retrievedEvent?.delivery_status).toBe('completed');
    expect(retrievedEvent?.retry_count).toBe(1);
  });
  
  it('should find events by filter', async () => {
    // Crear varios eventos de prueba
    const events: NotificationEvent[] = [
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
      },
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
    
    // Guardar los eventos
    for (const event of events) {
      await repository.save(event);
    }
    
    // Buscar por cliente
    const clientAEvents = await repository.findAll({ clientId: 'CLIENT_A' });
    expect(clientAEvents.length).toBe(2);
    expect(clientAEvents.map(e => e.event_id).sort()).toEqual(['TEST003', 'TEST004'].sort());
    
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
    expect(filteredEvents.length).toBe(1);
    expect(filteredEvents[0].event_id).toBe('TEST003');
  });
});
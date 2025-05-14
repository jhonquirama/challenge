import nock from 'nock';
import { AxiosWebhookService } from '../../src/infrastructure/driven_adapters/webhook/AxiosWebhookService';
import { NotificationEvent } from '../../src/core/domain/models/NotificationEvent';

describe('AxiosWebhookService Integration Tests', () => {
  let webhookService: AxiosWebhookService;
  
  beforeAll(() => {
    webhookService = new AxiosWebhookService();
  });
  
  beforeEach(() => {
    nock.cleanAll();
  });
  
  afterAll(() => {
    nock.restore();
  });
  
  it('should successfully deliver a notification', async () => {
    const testEvent: NotificationEvent = {
      event_id: 'TEST001',
      event_type: 'test_event',
      content: 'Test content',
      delivery_date: new Date().toISOString(),
      delivery_status: 'pending',
      client_id: 'TEST_CLIENT'
    };
    
    const webhookUrl = 'https://webhook.test/endpoint';
    
    // Mock de la respuesta HTTP
    nock('https://webhook.test')
      .post('/endpoint', (body) => {
        // Verificar que el cuerpo de la petición contiene los datos correctos
        return body.event_id === testEvent.event_id &&
               body.event_type === testEvent.event_type &&
               body.content === testEvent.content;
      })
      .reply(200, { success: true });
    
    // Entregar la notificación
    const result = await webhookService.deliverNotification(testEvent, webhookUrl);
    
    // Verificar el resultado
    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.timestamp).toBeDefined();
    expect(result.error).toBeUndefined();
  });
  
  it('should handle delivery failure with error response', async () => {
    const testEvent: NotificationEvent = {
      event_id: 'TEST002',
      event_type: 'test_event',
      content: 'Test content',
      delivery_date: new Date().toISOString(),
      delivery_status: 'pending',
      client_id: 'TEST_CLIENT'
    };
    
    const webhookUrl = 'https://webhook.test/endpoint';
    
    // Mock de la respuesta HTTP con error
    nock('https://webhook.test')
      .post('/endpoint')
      .reply(500, { error: 'Internal Server Error' });
    
    // Entregar la notificación
    const result = await webhookService.deliverNotification(testEvent, webhookUrl);
    
    // Verificar el resultado
    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(500);
    expect(result.timestamp).toBeDefined();
    expect(result.error).toBeDefined();
  });
  
  it('should handle network errors', async () => {
    const testEvent: NotificationEvent = {
      event_id: 'TEST003',
      event_type: 'test_event',
      content: 'Test content',
      delivery_date: new Date().toISOString(),
      delivery_status: 'pending',
      client_id: 'TEST_CLIENT'
    };
    
    const webhookUrl = 'https://webhook.test/endpoint';
    
    // Mock de error de red
    nock('https://webhook.test')
      .post('/endpoint')
      .replyWithError('Network Error');
    
    // Entregar la notificación
    const result = await webhookService.deliverNotification(testEvent, webhookUrl);
    
    // Verificar el resultado
    expect(result.success).toBe(false);
    expect(result.statusCode).toBeUndefined();
    expect(result.timestamp).toBeDefined();
    expect(result.error).toBe('Network Error');
  });
});
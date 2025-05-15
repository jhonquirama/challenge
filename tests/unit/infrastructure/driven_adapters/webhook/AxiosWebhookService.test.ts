import { AxiosWebhookService } from '../../../../../src/infrastructure/driven_adapters/webhook/AxiosWebhookService';
import { NotificationEvent } from '../../../../../src/core/domain/models/NotificationEvent';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AxiosWebhookService', () => {
  let webhookService: AxiosWebhookService;

  beforeEach(() => {
    webhookService = new AxiosWebhookService();
    jest.clearAllMocks();
  });

  const mockEvent: NotificationEvent = {
    event_id: 'EVT001',
    event_type: 'test_event',
    content: 'Test content',
    delivery_date: '2024-03-15T09:30:22Z',
    delivery_status: 'pending',
    client_id: 'CLIENT001',
  };

  it('should deliver notification successfully', async () => {
    // Mock successful axios response
    mockedAxios.post.mockResolvedValueOnce({
      status: 200,
      data: { success: true },
    });

    const result = await webhookService.deliverNotification(mockEvent, 'https://test.com/webhook');

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.timestamp).toBeDefined();
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://test.com/webhook',
      expect.objectContaining({
        event_id: 'EVT001',
        event_type: 'test_event',
      }),
      expect.any(Object),
    );
  });

  it('should handle delivery failure with error response', async () => {
    // Mock failed axios response
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        status: 500,
        data: { error: 'Internal server error' },
      },
    });

    const result = await webhookService.deliverNotification(mockEvent, 'https://test.com/webhook');

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(500);
    expect(result.error).toBeDefined();
    expect(result.timestamp).toBeDefined();
  });

  it('should handle delivery failure with network error', async () => {
    // Mock network error
    mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));

    const result = await webhookService.deliverNotification(mockEvent, 'https://test.com/webhook');

    expect(result.success).toBe(false);
    expect(result.statusCode).toBeUndefined();
    expect(result.error).toContain('Network Error');
    expect(result.timestamp).toBeDefined();
  });
});

import { ExponentialBackoffRetryStrategy } from '../../../../../src/infrastructure/driven_adapters/retry/ExponentialBackoffRetryStrategy';
import { NotificationEvent } from '../../../../../src/core/domain/models/NotificationEvent';

describe('ExponentialBackoffRetryStrategy', () => {
  let retryStrategy: ExponentialBackoffRetryStrategy;

  beforeEach(() => {
    retryStrategy = new ExponentialBackoffRetryStrategy(5, 1000, 60000);
  });

  it('should not retry completed events', () => {
    const event: NotificationEvent = {
      event_id: 'EVT001',
      event_type: 'test',
      content: 'test content',
      delivery_date: new Date().toISOString(),
      delivery_status: 'completed',
    };

    const decision = retryStrategy.shouldRetry(event);
    expect(decision.shouldRetry).toBe(false);
    expect(decision.reason).toContain('ya fue entregado');
  });

  it('should not retry when max retries is reached', () => {
    const event: NotificationEvent = {
      event_id: 'EVT001',
      event_type: 'test',
      content: 'test content',
      delivery_date: new Date().toISOString(),
      delivery_status: 'failed',
      retry_count: 5,
      max_retries: 5,
    };

    const decision = retryStrategy.shouldRetry(event);
    expect(decision.shouldRetry).toBe(false);
    expect(decision.reason).toContain('máximo de reintentos');
  });

  it('should not retry when next retry date is in the future', () => {
    const futureDate = new Date();
    futureDate.setMinutes(futureDate.getMinutes() + 5); // 5 minutes in the future

    const event: NotificationEvent = {
      event_id: 'EVT001',
      event_type: 'test',
      content: 'test content',
      delivery_date: new Date().toISOString(),
      delivery_status: 'retrying',
      retry_count: 1,
      next_retry_date: futureDate.toISOString(),
    };

    const decision = retryStrategy.shouldRetry(event);
    expect(decision.shouldRetry).toBe(false);
    expect(decision.reason).toContain('Aún no es tiempo');
  });

  it('should allow retry for failed events within retry limits', () => {
    const event: NotificationEvent = {
      event_id: 'EVT001',
      event_type: 'test',
      content: 'test content',
      delivery_date: new Date().toISOString(),
      delivery_status: 'failed',
      retry_count: 2,
      max_retries: 5,
    };

    const decision = retryStrategy.shouldRetry(event);
    expect(decision.shouldRetry).toBe(true);
    expect(decision.nextRetryDate).toBeDefined();
    expect(decision.reason).toContain('Reintento 3 de 5');
  });

  it('should calculate exponential backoff delay', () => {
    // For retry count 0, should be around baseDelay (1000ms)
    const delay0 = retryStrategy.calculateNextRetryDelay(0);
    expect(delay0).toBeGreaterThanOrEqual(800); // Allow for jitter
    expect(delay0).toBeLessThanOrEqual(1200);

    // For retry count 3, should be around 2^3 * baseDelay = 8000ms
    const delay3 = retryStrategy.calculateNextRetryDelay(3);
    expect(delay3).toBeGreaterThanOrEqual(6400); // Allow for jitter
    expect(delay3).toBeLessThanOrEqual(9600);

    // Should respect maxDelay
    const delay10 = retryStrategy.calculateNextRetryDelay(10); // 2^10 * 1000 = 1,024,000ms
    expect(delay10).toBeLessThanOrEqual(60000); // maxDelay
  });
});

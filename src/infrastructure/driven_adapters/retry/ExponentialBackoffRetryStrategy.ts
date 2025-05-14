import { NotificationEvent } from '../../../core/domain/models/NotificationEvent';
import { IRetryStrategyService, RetryDecision } from '../../../core/ports/output/IRetryStrategyService';

export class ExponentialBackoffRetryStrategy implements IRetryStrategyService {
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;

  constructor(maxRetries = 5, baseDelayMs = 1000, maxDelayMs = 60000) {
    this.maxRetries = maxRetries;
    this.baseDelayMs = baseDelayMs;
    this.maxDelayMs = maxDelayMs;
  }

  shouldRetry(event: NotificationEvent): RetryDecision {
    // Si el evento ya está completado, no reintentamos
    if (event.delivery_status === 'completed') {
      return {
        shouldRetry: false,
        reason: 'El evento ya fue entregado exitosamente'
      };
    }

    const retryCount = event.retry_count || 0;
    
    // Si se alcanzó el número máximo de reintentos, no reintentamos
    if (retryCount >= (event.max_retries || this.maxRetries)) {
      return {
        shouldRetry: false,
        reason: `Se alcanzó el número máximo de reintentos (${event.max_retries || this.maxRetries})`
      };
    }

    // Si hay una fecha de próximo reintento y aún no ha llegado, no reintentamos
    if (event.next_retry_date) {
      const nextRetryDate = new Date(event.next_retry_date);
      const now = new Date();
      
      if (nextRetryDate > now) {
        return {
          shouldRetry: false,
          reason: `Aún no es tiempo de reintentar. Próximo reintento: ${event.next_retry_date}`
        };
      }
    }

    // Calcular la próxima fecha de reintento
    const delayMs = this.calculateNextRetryDelay(retryCount);
    const nextRetryDate = new Date(Date.now() + delayMs).toISOString();

    return {
      shouldRetry: true,
      nextRetryDate,
      reason: `Reintento ${retryCount + 1} de ${event.max_retries || this.maxRetries}`
    };
  }

  calculateNextRetryDelay(retryCount: number): number {
    // Backoff exponencial con jitter (variación aleatoria)
    const exponentialDelay = Math.min(
      this.maxDelayMs,
      this.baseDelayMs * Math.pow(2, retryCount)
    );
    
    // Añadir jitter (±20%)
    const jitter = exponentialDelay * 0.2;
    return exponentialDelay - jitter + (Math.random() * jitter * 2);
  }
}
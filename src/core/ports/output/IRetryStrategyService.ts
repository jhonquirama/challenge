import { NotificationEvent } from '../../domain/models/NotificationEvent';

export interface RetryDecision {
  shouldRetry: boolean;
  nextRetryDate?: string;
  reason?: string;
}

export interface IRetryStrategyService {
  /**
   * Determina si un evento debe ser reintentado y cuándo
   */
  shouldRetry(event: NotificationEvent): RetryDecision;

  /**
   * Calcula el tiempo de espera para el próximo reintento
   * basado en el número de intentos previos (backoff exponencial)
   */
  calculateNextRetryDelay(retryCount: number): number;
}

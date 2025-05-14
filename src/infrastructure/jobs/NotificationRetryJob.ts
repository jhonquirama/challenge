import { ProcessPendingNotificationsUseCase } from '../../core/use_cases/ProcessPendingNotificationsUseCase';
import { logger } from '../../shared/utils/logger';

export class NotificationRetryJob {
  private intervalId: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly processPendingNotificationsUseCase: ProcessPendingNotificationsUseCase,
    private readonly intervalMs: number = 60000 // Por defecto, ejecutar cada minuto
  ) {}

  /**
   * Inicia el trabajo programado para procesar notificaciones pendientes
   */
  start(): void {
    if (this.running) {
      logger.warn('El trabajo de reintentos ya está en ejecución');
      return;
    }

    logger.info(`Iniciando trabajo de reintentos con intervalo de ${this.intervalMs}ms`);
    this.running = true;

    // Ejecutar inmediatamente la primera vez
    this.processNotifications();

    // Programar ejecuciones periódicas
    this.intervalId = setInterval(() => this.processNotifications(), this.intervalMs);
  }

  /**
   * Detiene el trabajo programado
   */
  stop(): void {
    if (!this.running || !this.intervalId) {
      logger.warn('El trabajo de reintentos no está en ejecución');
      return;
    }

    clearInterval(this.intervalId);
    this.intervalId = null;
    this.running = false;
    logger.info('Trabajo de reintentos detenido');
  }

  /**
   * Procesa las notificaciones pendientes
   */
  private async processNotifications(): Promise<void> {
    try {
      logger.info('Ejecutando trabajo de procesamiento de notificaciones pendientes');
      await this.processPendingNotificationsUseCase.execute();
      logger.info('Trabajo de procesamiento de notificaciones completado');
    } catch (error) {
      logger.error('Error al procesar notificaciones pendientes:', error);
    }
  }
}
import { Request, Response } from 'express';
import { IHealthCheckUseCase } from '../../../core/ports/input/IHealthCheckUseCase';
import { HealthCheckUseCase } from '../../../core/use_cases/HealthCheckUseCase';

export class HealthController {
  private healthCheckUseCase: IHealthCheckUseCase;

  constructor(healthCheckUseCase?: IHealthCheckUseCase) {
    this.healthCheckUseCase = healthCheckUseCase || new HealthCheckUseCase();
  }

  async check(req: Request, res: Response): Promise<void> {
    try {
      const healthStatus = await this.healthCheckUseCase.execute();
      res.status(200).json(healthStatus);
    } catch (error) {
      res.status(500).json({
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      });
    }
  }
}

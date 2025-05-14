import { HealthStatus, IHealthCheckUseCase } from '../ports/input/IHealthCheckUseCase';

export class HealthCheckUseCase implements IHealthCheckUseCase {
  async execute(): Promise<HealthStatus> {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: 'UP'
        }
      }
    };
  }
}
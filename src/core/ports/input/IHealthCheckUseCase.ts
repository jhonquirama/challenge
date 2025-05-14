export interface HealthStatus {
  status: 'UP' | 'DOWN';
  timestamp: string;
  services: {
    api: {
      status: 'UP' | 'DOWN';
    };
    [key: string]: {
      status: 'UP' | 'DOWN';
    };
  };
}

export interface IHealthCheckUseCase {
  execute(): Promise<HealthStatus>;
}
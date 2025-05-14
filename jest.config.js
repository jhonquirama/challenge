module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/', '<rootDir>/tests/'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/core/use_cases/DeliverNotificationUseCase.ts',
    'src/core/use_cases/GetNotificationEventByIdUseCase.ts',
    'src/core/use_cases/GetNotificationEventsUseCase.ts',
    'src/core/use_cases/ProcessPendingNotificationsUseCase.ts',
    'src/core/use_cases/ReplayNotificationEventUseCase.ts',
    'src/infrastructure/driven_adapters/retry/ExponentialBackoffRetryStrategy.ts',
    'src/infrastructure/driven_adapters/webhook/AxiosWebhookService.ts',
    'src/shared/utils/logger.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
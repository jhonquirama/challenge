module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/main.ts',
    '!src/infrastructure/config/**/*.ts',
  ],
  setupFilesAfterEnv: [
    '<rootDir>/tests/integration/setup.ts'
  ],
  testMatch: [
    '**/tests/**/*.test.ts'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      isolatedModules: true
    }]
  },
  // Excluir los tests de integración por defecto
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/integration/'
  ]
};
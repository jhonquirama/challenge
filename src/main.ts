import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { serverConfig } from './infrastructure/config/server.config';
import { errorMiddleware } from './infrastructure/driving_adapters/rest_api/middlewares/errorMiddleware';
import { createHealthRoutes } from './infrastructure/driving_adapters/rest_api/routes/healthRoutes';
import { HealthController } from './infrastructure/driving_adapters/health/HealthController';
import { HealthCheckUseCase } from './core/use_cases/HealthCheckUseCase';
import logger from './shared/utils/logger';

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Initialize use cases
const healthCheckUseCase = new HealthCheckUseCase();

// Initialize controllers
const healthController = new HealthController(healthCheckUseCase);

// Routes
app.use('/health', createHealthRoutes(healthController));

// Error handling middleware
app.use(errorMiddleware);

// Start server
const PORT = serverConfig.port;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${serverConfig.nodeEnv} mode`);
});

export default app;
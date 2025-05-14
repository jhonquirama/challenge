import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Configuración
dotenv.config();
const PORT = process.env.PORT || 3000;

// Importaciones de core
import { GetNotificationEventsUseCase } from './core/use_cases/GetNotificationEventsUseCase';
import { GetNotificationEventByIdUseCase } from './core/use_cases/GetNotificationEventByIdUseCase';
import { ReplayNotificationEventUseCase } from './core/use_cases/ReplayNotificationEventUseCase';
import { DeliverNotificationUseCase } from './core/use_cases/DeliverNotificationUseCase';
import { ProcessPendingNotificationsUseCase } from './core/use_cases/ProcessPendingNotificationsUseCase';

// Importaciones de infraestructura
import { PostgresNotificationEventRepository } from './infrastructure/driven_adapters/persistence/postgres/PostgresNotificationEventRepository';
import { AxiosWebhookService } from './infrastructure/driven_adapters/webhook/AxiosWebhookService';
import { ExponentialBackoffRetryStrategy } from './infrastructure/driven_adapters/retry/ExponentialBackoffRetryStrategy';
import { NotificationEventController } from './infrastructure/driving_adapters/rest_api/controllers/NotificationEventController';
import { createNotificationEventRoutes } from './infrastructure/driving_adapters/rest_api/routes/notificationEventRoutes';
import { securityHeadersMiddleware } from './infrastructure/driving_adapters/rest_api/middlewares/securityHeadersMiddleware';
import { errorMiddleware } from './infrastructure/driving_adapters/rest_api/middlewares/errorMiddleware';
import { RateLimitMiddleware } from './infrastructure/driving_adapters/rest_api/middlewares/rateLimitMiddleware';
import { NotificationRetryJob } from './infrastructure/jobs/NotificationRetryJob';
import { logger } from './shared/utils/logger';
import { db, testConnection, initializeDatabase } from './infrastructure/config/database.config';
import { seedDatabase } from './infrastructure/scripts/seed-database';

// Inicializar la aplicación
const initializeApp = async () => {
  const app = express();

  // Middleware de seguridad
  app.use(helmet());

  // Configurar CORS
  const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Client-Id'],
    maxAge: 86400, // 24 horas
  };
  app.use(cors(corsOptions));

  // Middleware para parsear JSON con límite de tamaño
  app.use(express.json({ limit: '100kb' }));

  // Middleware para cabeceras de seguridad
  app.use(securityHeadersMiddleware);

  // Middleware para limitar tasa de peticiones
  const rateLimiter = new RateLimitMiddleware(100, 60000); // 100 peticiones por minuto
  app.use(rateLimiter.middleware);

  // Inicializar base de datos
  try {
    const connected = await testConnection();
    if (!connected) {
      throw new Error('No se pudo conectar a la base de datos');
    }
    
    await initializeDatabase();
    logger.info('Base de datos PostgreSQL inicializada correctamente');
    
    // Cargar datos iniciales si es necesario
    await seedDatabase();
  } catch (error) {
    logger.error('Error al inicializar la base de datos:', error);
    throw new Error('No se pudo inicializar la aplicación debido a un error en la base de datos');
  }

  // Inicializar adaptadores
  const notificationEventRepository = new PostgresNotificationEventRepository(db);
  const webhookService = new AxiosWebhookService();
  const retryStrategy = new ExponentialBackoffRetryStrategy();

  // Inicializar casos de uso
  const getNotificationEventsUseCase = new GetNotificationEventsUseCase(
    notificationEventRepository,
  );
  const getNotificationEventByIdUseCase = new GetNotificationEventByIdUseCase(
    notificationEventRepository,
  );

  // Crear el caso de uso de entrega de notificaciones
  const deliverNotificationUseCase = new DeliverNotificationUseCase(
    notificationEventRepository,
    webhookService,
    retryStrategy,
  );

  const replayNotificationEventUseCase = new ReplayNotificationEventUseCase(
    notificationEventRepository,
    deliverNotificationUseCase,
  );

  const processPendingNotificationsUseCase = new ProcessPendingNotificationsUseCase(
    notificationEventRepository,
    deliverNotificationUseCase,
  );

  // Inicializar controladores
  const notificationEventController = new NotificationEventController(
    getNotificationEventsUseCase,
    getNotificationEventByIdUseCase,
    replayNotificationEventUseCase,
  );

  // Configurar rutas
  app.use('/notification_events', createNotificationEventRoutes(notificationEventController));

  // Ruta de salud
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
  });

  // Manejador de rutas no encontradas
  app.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
  });

  // Middleware de manejo de errores (debe ser el último)
  app.use(errorMiddleware);

  // Iniciar el trabajo de reintentos si está habilitado
  if (process.env.ENABLE_RETRY_JOB !== 'false') {
    const retryInterval = parseInt(process.env.RETRY_INTERVAL_MS || '60000');
    const retryJob = new NotificationRetryJob(processPendingNotificationsUseCase, retryInterval);
    retryJob.start();
    
    // Asegurar que el trabajo se detenga correctamente al cerrar la aplicación
    process.on('SIGINT', () => {
      logger.info('Deteniendo trabajos programados...');
      retryJob.stop();
      process.exit(0);
    });
  }

  return app;
};

// Iniciar el servidor
(async () => {
  try {
    const app = await initializeApp();
    app.listen(PORT, () => {
      logger.info(`Servidor iniciado en el puerto ${PORT}`);
    });
  } catch (error) {
    logger.error('Error al iniciar la aplicación:', error);
    process.exit(1);
  }
})();

export default initializeApp;
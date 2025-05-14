import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Configuración
dotenv.config();
const PORT = process.env.PORT || 3000;

// Importaciones de core
import { GetNotificationEventsUseCase } from './core/use_cases/GetNotificationEventsUseCase';
import { GetNotificationEventByIdUseCase } from './core/use_cases/GetNotificationEventByIdUseCase';
import { ReplayNotificationEventUseCase } from './core/use_cases/ReplayNotificationEventUseCase';
import { DeliverNotificationUseCase } from './core/use_cases/DeliverNotificationUseCase';
import { ExponentialBackoffRetryStrategy } from './infrastructure/driven_adapters/retry/ExponentialBackoffRetryStrategy';

// Importaciones de infraestructura
import { InMemoryNotificationEventRepository } from './infrastructure/driven_adapters/persistence/in_memory/InMemoryNotificationEventRepository';
import { AxiosWebhookService } from './infrastructure/driven_adapters/webhook/AxiosWebhookService';
import { NotificationEventController } from './infrastructure/driving_adapters/rest_api/controllers/NotificationEventController';
import { createNotificationEventRoutes } from './infrastructure/driving_adapters/rest_api/routes/notificationEventRoutes';
import { securityHeadersMiddleware } from './infrastructure/driving_adapters/rest_api/middlewares/securityHeadersMiddleware';
import { errorMiddleware } from './infrastructure/driving_adapters/rest_api/middlewares/errorMiddleware';
import { RateLimitMiddleware } from './infrastructure/driving_adapters/rest_api/middlewares/rateLimitMiddleware';
import { logger } from './shared/utils/logger';

// Cargar datos iniciales
const loadInitialData = () => {
  try {
    const dataPath = path.join(__dirname, '../notification_events.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);
    return data.events;
  } catch (error) {
    logger.error('Error al cargar los datos iniciales:', error);
    return [];
  }
};

// Inicializar la aplicación
const initializeApp = () => {
  const app = express();

  // Middleware de seguridad
  app.use(helmet());
  
  // Configurar CORS
  const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Client-Id'],
    maxAge: 86400 // 24 horas
  };
  app.use(cors(corsOptions));
  
  // Middleware para parsear JSON con límite de tamaño
  app.use(express.json({ limit: '100kb' }));
  
  // Middleware para cabeceras de seguridad
  app.use(securityHeadersMiddleware);
  
  // Middleware para limitar tasa de peticiones
  const rateLimiter = new RateLimitMiddleware(100, 60000); // 100 peticiones por minuto
  app.use(rateLimiter.middleware);

  // Inicializar adaptadores
  const initialEvents = loadInitialData();
  const notificationEventRepository = new InMemoryNotificationEventRepository(initialEvents);
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

  return app;
};

// Iniciar el servidor
const app = initializeApp();
app.listen(PORT, () => {
  logger.info(`Servidor iniciado en el puerto ${PORT}`);
});

export default app;

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

// Importaciones de infraestructura
import { InMemoryNotificationEventRepository } from './infrastructure/driven_adapters/persistence/in_memory/InMemoryNotificationEventRepository';
import { AxiosWebhookService } from './infrastructure/driven_adapters/webhook/AxiosWebhookService';
import { NotificationEventController } from './infrastructure/driving_adapters/rest_api/controllers/NotificationEventController';
import { createNotificationEventRoutes } from './infrastructure/driving_adapters/rest_api/routes/notificationEventRoutes';

// Cargar datos iniciales
const loadInitialData = () => {
  try {
    const dataPath = path.join(__dirname, '../notification_events.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);
    return data.events;
  } catch (error) {
    console.error('Error al cargar los datos iniciales:', error);
    return [];
  }
};

// Inicializar la aplicación
const initializeApp = () => {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Inicializar adaptadores
  const initialEvents = loadInitialData();
  const notificationEventRepository = new InMemoryNotificationEventRepository(initialEvents);
  const webhookService = new AxiosWebhookService();

  // Inicializar casos de uso
  const getNotificationEventsUseCase = new GetNotificationEventsUseCase(notificationEventRepository);
  const getNotificationEventByIdUseCase = new GetNotificationEventByIdUseCase(notificationEventRepository);
  const replayNotificationEventUseCase = new ReplayNotificationEventUseCase(
    notificationEventRepository,
    webhookService
  );

  // Inicializar controladores
  const notificationEventController = new NotificationEventController(
    getNotificationEventsUseCase,
    getNotificationEventByIdUseCase,
    replayNotificationEventUseCase
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

  return app;
};

// Iniciar el servidor
const app = initializeApp();
app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
});

export default app;
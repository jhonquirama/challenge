import { Router } from 'express';
import { NotificationEventController } from '../controllers/NotificationEventController';
import { validateRequestMiddleware } from '../middlewares/validateRequestMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';

export const createNotificationEventRoutes = (
  notificationEventController: NotificationEventController,
): Router => {
  const router = Router();

  /**
   * @swagger
   * /notification_events:
   *   get:
   *     summary: Obtiene todos los eventos de notificación
   *     parameters:
   *       - in: query
   *         name: clientId
   *         schema:
   *           type: string
   *         description: ID del cliente
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *         description: Fecha de inicio (ISO format)
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *         description: Fecha de fin (ISO format)
   *       - in: query
   *         name: deliveryStatus
   *         schema:
   *           type: string
   *           enum: [completed, failed, pending]
   *         description: Estado de entrega
   */
  router.get('/', 
    authMiddleware.validateApiKey,
    authMiddleware.validateClientAccess,
    validateRequestMiddleware.validateFilters,
    (req, res) => notificationEventController.getNotificationEvents(req, res)
  );

  /**
   * @swagger
   * /notification_events/{id}:
   *   get:
   *     summary: Obtiene un evento de notificación por ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del evento de notificación
   */
  router.get('/:id', 
    authMiddleware.validateApiKey,
    authMiddleware.validateClientAccess,
    validateRequestMiddleware.validateId,
    (req, res) => notificationEventController.getNotificationEventById(req, res)
  );

  /**
   * @swagger
   * /notification_events/{id}/replay:
   *   post:
   *     summary: Reenvía un evento de notificación fallido
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del evento de notificación
   */
  router.post('/:id/replay', 
    authMiddleware.validateApiKey,
    authMiddleware.validateClientAccess,
    validateRequestMiddleware.validateId,
    (req, res) => notificationEventController.replayNotificationEvent(req, res)
  );

  return router;
};
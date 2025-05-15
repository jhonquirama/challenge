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
   * components:
   *   securitySchemes:
   *     ApiKeyAuth:
   *       type: apiKey
   *       in: header
   *       name: X-API-Key
   *     ClientIdAuth:
   *       type: apiKey
   *       in: header
   *       name: X-Client-Id
   *   schemas:
   *     NotificationEvent:
   *       type: object
   *       properties:
   *         event_id:
   *           type: string
   *           description: Identificador único del evento
   *         event_type:
   *           type: string
   *           description: Tipo de evento
   *         content:
   *           type: string
   *           description: Contenido del evento
   *         delivery_date:
   *           type: string
   *           format: date-time
   *           description: Fecha de entrega
   *         delivery_status:
   *           type: string
   *           enum: [completed, failed, pending, retrying]
   *           description: Estado de entrega
   *         client_id:
   *           type: string
   *           description: ID del cliente
   *         retry_count:
   *           type: integer
   *           description: Número de reintentos
   *         delivery_attempts:
   *           type: array
   *           items:
   *             type: object
   *             properties:
   *               attempt_date:
   *                 type: string
   *                 format: date-time
   *               status:
   *                 type: string
   *                 enum: [success, failure]
   *               status_code:
   *                 type: integer
   *               error_message:
   *                 type: string
   */

  /**
   * @swagger
   * /notification_events:
   *   get:
   *     summary: Obtiene todos los eventos de notificación
   *     description: Retorna una lista de eventos de notificación filtrados por los parámetros proporcionados
   *     security:
   *       - ApiKeyAuth: []
   *       - ClientIdAuth: []
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
   *           format: date-time
   *         description: Fecha de inicio (ISO format)
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Fecha de fin (ISO format)
   *       - in: query
   *         name: deliveryStatus
   *         schema:
   *           type: string
   *           enum: [completed, failed, pending, retrying]
   *         description: Estado de entrega
   *     responses:
   *       200:
   *         description: Lista de eventos de notificación
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/NotificationEvent'
   *       400:
   *         description: Parámetros de consulta inválidos
   *       401:
   *         description: No autorizado
   *       403:
   *         description: Prohibido
   *       500:
   *         description: Error del servidor
   */
  router.get(
    '/',
    authMiddleware.validateApiKey,
    authMiddleware.validateClientAccess,
    validateRequestMiddleware.validateFilters,
    (req, res) => notificationEventController.getNotificationEvents(req, res),
  );

  /**
   * @swagger
   * /notification_events/{id}:
   *   get:
   *     summary: Obtiene un evento de notificación por ID
   *     description: Retorna un evento de notificación específico por su ID
   *     security:
   *       - ApiKeyAuth: []
   *       - ClientIdAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del evento de notificación
   *     responses:
   *       200:
   *         description: Evento de notificación
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/NotificationEvent'
   *       400:
   *         description: ID inválido
   *       401:
   *         description: No autorizado
   *       403:
   *         description: Prohibido
   *       404:
   *         description: Evento no encontrado
   *       500:
   *         description: Error del servidor
   */
  router.get(
    '/:id',
    authMiddleware.validateApiKey,
    authMiddleware.validateClientAccess,
    validateRequestMiddleware.validateId,
    (req, res) => notificationEventController.getNotificationEventById(req, res),
  );

  /**
   * @swagger
   * /notification_events/{id}/replay:
   *   post:
   *     summary: Reenvía un evento de notificación fallido
   *     description: Intenta reenviar un evento de notificación que ha fallado previamente
   *     security:
   *       - ApiKeyAuth: []
   *       - ClientIdAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del evento de notificación
   *     responses:
   *       200:
   *         description: Evento reenviado correctamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 event:
   *                   $ref: '#/components/schemas/NotificationEvent'
   *       400:
   *         description: ID inválido
   *       401:
   *         description: No autorizado
   *       403:
   *         description: Prohibido
   *       404:
   *         description: Evento no encontrado
   *       500:
   *         description: Error del servidor
   */
  router.post(
    '/:id/replay',
    authMiddleware.validateApiKey,
    authMiddleware.validateClientAccess,
    validateRequestMiddleware.validateId,
    (req, res) => notificationEventController.replayNotificationEvent(req, res),
  );

  return router;
};

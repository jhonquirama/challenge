import { Router } from 'express';
import { HealthController } from '../../health/HealthController';

export const createHealthRoutes = (controller: HealthController): Router => {
  const router = Router();

  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Check the health status of the API
   *     responses:
   *       200:
   *         description: API is healthy
   *       500:
   *         description: API is unhealthy
   */
  router.get('/', (req, res) => controller.check(req, res));

  return router;
};
import { Request, Response, NextFunction } from 'express';
import { logger } from '../../../../shared/utils/logger';

/**
 * Middleware para manejo centralizado de errores
 * Mitiga: A9:2021 - Security Logging and Monitoring Failures
 */
export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  // Registrar el error con detalles para monitoreo
  logger.error('Error en la aplicación', {
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  // No exponer detalles internos al cliente en producción
  const message =
    process.env.NODE_ENV === 'production' ? 'Ha ocurrido un error en el servidor' : err.message;

  res.status(500).json({
    message,
    requestId: req.headers['x-request-id'] || 'unknown',
  });
};

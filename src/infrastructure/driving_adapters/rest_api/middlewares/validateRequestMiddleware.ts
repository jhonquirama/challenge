import { Request, Response, NextFunction } from 'express';

export const validateRequestMiddleware = {
  validateFilters: (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (req.query.clientId && !/^[a-zA-Z0-9_-]+$/.test(req.query.clientId as string)) {
        res.status(400).json({ message: 'Formato de clientId inválido' });
        return;
      }

      if (req.query.startDate) {
        try {
          new Date(req.query.startDate as string).toISOString();
        } catch (e) {
          res.status(400).json({ message: 'Formato de startDate inválido. Use formato ISO.' });
          return;
        }
      }

      if (req.query.endDate) {
        try {
          new Date(req.query.endDate as string).toISOString();
        } catch (e) {
          res.status(400).json({ message: 'Formato de endDate inválido. Use formato ISO.' });
          return;
        }
      }

      if (
        req.query.deliveryStatus &&
        !['completed', 'failed', 'pending'].includes(req.query.deliveryStatus as string)
      ) {
        res.status(400).json({
          message:
            'Valor de deliveryStatus inválido. Valores permitidos: completed, failed, pending',
        });
        return;
      }

      next();
    } catch (error) {
      res.status(400).json({ message: 'Error en la validación de parámetros' });
    }
  },

  validateId: (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { id } = req.params;

      if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
        res.status(400).json({ message: 'Formato de ID inválido' });
        return;
      }

      next();
    } catch (error) {
      res.status(400).json({ message: 'Error en la validación de ID' });
    }
  },
};

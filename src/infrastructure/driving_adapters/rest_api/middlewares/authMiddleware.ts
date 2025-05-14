import { Request, Response, NextFunction } from 'express';

export const authMiddleware = {
  validateApiKey: (req: Request, res: Response, next: NextFunction): void => {
    try {
      const apiKey = req.headers['x-api-key'];
      
      const validApiKey = process.env.API_KEY || 'test-api-key-123';
      
      if (!apiKey || apiKey !== validApiKey) {
        res.status(401).json({ message: 'API key inválida o no proporcionada' });
        return;
      }
      
      next();
    } catch (error) {
      res.status(500).json({ message: 'Error en la autenticación' });
    }
  },
  
  validateClientAccess: (req: Request, res: Response, next: NextFunction): void => {
    try {
      const clientId = req.headers['x-client-id'];
      
      if (!clientId) {
        res.status(401).json({ message: 'ID de cliente no proporcionado' });
        return;
      }
      
      req.headers['authorized-client-id'] = clientId;
      
      if (req.query.clientId && req.query.clientId !== clientId) {
        res.status(403).json({ 
          message: 'No tiene permiso para acceder a eventos de otros clientes' 
        });
        return;
      }
      
      next();
    } catch (error) {
      res.status(500).json({ message: 'Error en la autorización' });
    }
  }
};